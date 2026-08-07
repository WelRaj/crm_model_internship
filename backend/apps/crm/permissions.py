from __future__ import annotations

from collections.abc import Iterable

from django.db.models import Q, QuerySet
from rest_framework.exceptions import PermissionDenied

from apps.accounts.models import User, UserRole
from apps.crm.models import Lead, ProjectAgreement, ProjectClient, ProjectHandoff

CRM_SUPER_ROLES = {"super_admin", "admin", "crm_admin"}
CRM_ROLE_CODES = {
    "super_admin",
    "admin",
    "crm_admin",
    "team_lead",
    "telecaller",
    "sales",
    "project_manager",
    "read_only",
}

CRM_PAGE_ACCESS = {
    "super_admin": {"overview", "leads", "lead-assign", "telecaller", "followups", "lead-outcomes", "clients", "agreements"},
    "admin": {"overview", "leads", "lead-assign", "telecaller", "followups", "lead-outcomes", "clients", "agreements"},
    "crm_admin": {"overview", "leads", "lead-assign", "telecaller", "followups", "lead-outcomes", "clients", "agreements"},
    "team_lead": {"overview", "leads", "lead-assign", "telecaller", "followups", "lead-outcomes", "clients", "agreements"},
    "telecaller": {"overview", "leads", "telecaller", "followups"},
    "sales": {"overview", "leads", "followups", "lead-outcomes", "clients", "agreements"},
    "project_manager": {"overview", "clients", "agreements"},
    "read_only": {"overview", "leads", "followups", "clients", "agreements"},
}

CRM_ACTION_ACCESS = {
    "super_admin": {"*"},
    "admin": {"*"},
    "crm_admin": {"*"},
    "team_lead": {"view", "create", "edit", "assign", "export", "approve"},
    "telecaller": {"view", "create", "edit"},
    "sales": {"view", "create", "edit", "export", "approve"},
    "project_manager": {"view", "create", "edit", "export", "approve"},
    "read_only": {"view"},
}


def _user_display_name(user: User) -> str:
    return user.get_full_name() or user.email or user.mobile or str(user.id)


def user_crm_role_codes(user: User | None) -> list[str]:
    if not user or not getattr(user, "is_authenticated", False):
        return []
    if getattr(user, "is_superuser", False):
        return ["super_admin"]
    role_codes = list(
        UserRole.objects.filter(user=user, role__is_active=True).values_list("role__code", flat=True),
    )
    if any(code in CRM_SUPER_ROLES for code in role_codes):
        return [code for code in role_codes if code in CRM_SUPER_ROLES] + [code for code in role_codes if code not in CRM_SUPER_ROLES]
    if role_codes:
        return role_codes
    return ["read_only"]


def user_primary_crm_role_code(user: User | None) -> str:
    codes = user_crm_role_codes(user)
    priority = ["super_admin", "admin", "crm_admin", "team_lead", "telecaller", "sales", "project_manager", "read_only"]
    for code in priority:
        if code in codes:
            return code
    return "read_only"


def user_has_crm_super_access(user: User | None) -> bool:
    codes = set(user_crm_role_codes(user))
    return bool(codes & CRM_SUPER_ROLES)


def allowed_crm_pages_for_user(user: User | None) -> set[str]:
    if user_has_crm_super_access(user):
        return {"overview", "leads", "lead-assign", "telecaller", "followups", "lead-outcomes", "clients", "agreements"}

    pages: set[str] = set()
    for code in user_crm_role_codes(user):
        pages |= CRM_PAGE_ACCESS.get(code, CRM_PAGE_ACCESS["read_only"])
    return pages or CRM_PAGE_ACCESS["read_only"]


def crm_page_access(user: User | None, page: str) -> bool:
    return page in allowed_crm_pages_for_user(user)


def require_crm_page_access(user: User | None, page: str) -> None:
    if not crm_page_access(user, page):
        raise PermissionDenied("You are not allowed to access this CRM page.")


def _allowed_actions_for_codes(role_codes: Iterable[str]) -> set[str]:
    actions: set[str] = set()
    for code in role_codes:
        actions |= CRM_ACTION_ACCESS.get(code, CRM_ACTION_ACCESS["read_only"])
    return actions


def crm_action_access(user: User | None, action: str, page: str | None = None) -> bool:
    if user_has_crm_super_access(user):
        return True
    actions = _allowed_actions_for_codes(user_crm_role_codes(user))
    return "*" in actions or action in actions


def require_crm_action_access(user: User | None, action: str, page: str | None = None) -> None:
    if not crm_action_access(user, action, page):
        raise PermissionDenied("You are not allowed to perform this CRM action.")


def _user_team(user: User | None) -> str:
    if not user or not getattr(user, "is_authenticated", False):
        return ""
    return getattr(getattr(user, "hr_profile", None), "team", "") or ""


def _active_user_name(user: User | None) -> str:
    if not user:
        return ""
    return _user_display_name(user).strip().lower()


def scope_leads_queryset(user: User | None, queryset: QuerySet[Lead] | None = None) -> QuerySet[Lead]:
    queryset = queryset or Lead.objects.all()
    if user_has_crm_super_access(user):
        return queryset

    codes = set(user_crm_role_codes(user))
    filters = Q()
    if "team_lead" in codes:
        team = _user_team(user)
        if team:
            filters |= Q(assigned_to__hr_profile__team=team)
    if "telecaller" in codes or "sales" in codes or "read_only" in codes:
        filters |= Q(assigned_to=user)
        filters |= Q(created_by=user)
    if "project_manager" in codes:
        filters |= Q(created_by=user)
        filters |= Q(project_client__isnull=False)
    if "crm_admin" in codes or "admin" in codes:
        return queryset
    return queryset.filter(filters).distinct()


def _client_scope_filter(user: User | None) -> Q:
    codes = set(user_crm_role_codes(user))
    name = _active_user_name(user)
    team = _user_team(user)
    filters = Q()

    if "team_lead" in codes:
        if team:
            filters |= Q(source_lead__assigned_to__hr_profile__team=team)
        filters |= Q(created_by=user)
        filters |= Q(updated_by=user)
    if "telecaller" in codes:
        filters |= Q(source_lead__assigned_to=user)
        filters |= Q(created_by=user)
        filters |= Q(updated_by=user)
    if "sales" in codes:
        filters |= Q(source_lead__assigned_to=user)
        filters |= Q(created_by=user)
        filters |= Q(updated_by=user)
    if "project_manager" in codes:
        filters |= Q(source_lead__assigned_to=user)
        filters |= Q(created_by=user)
        filters |= Q(updated_by=user)
        if name:
            filters |= Q(project_owner__icontains=name) | Q(team_leader__icontains=name) | Q(telecaller__icontains=name)
    if "read_only" in codes:
        filters |= Q(source_lead__assigned_to=user)
        filters |= Q(created_by=user)
        filters |= Q(updated_by=user)
    return filters


def scope_project_clients_queryset(user: User | None, queryset: QuerySet[ProjectClient] | None = None) -> QuerySet[ProjectClient]:
    queryset = queryset or ProjectClient.objects.all()
    if user_has_crm_super_access(user):
        return queryset
    if any(code in {"crm_admin", "admin"} for code in user_crm_role_codes(user)):
        return queryset
    return queryset.filter(_client_scope_filter(user)).distinct()


def scope_project_handoffs_queryset(user: User | None, queryset: QuerySet[ProjectHandoff] | None = None) -> QuerySet[ProjectHandoff]:
    queryset = queryset or ProjectHandoff.objects.all()
    if user_has_crm_super_access(user):
        return queryset
    if any(code in {"crm_admin", "admin"} for code in user_crm_role_codes(user)):
        return queryset
    filters = _client_scope_filter(user)
    return queryset.filter(filters | Q(client__source_lead__assigned_to=user)).distinct()


def scope_project_agreements_queryset(user: User | None, queryset: QuerySet[ProjectAgreement] | None = None) -> QuerySet[ProjectAgreement]:
    queryset = queryset or ProjectAgreement.objects.all()
    if user_has_crm_super_access(user):
        return queryset
    if any(code in {"crm_admin", "admin"} for code in user_crm_role_codes(user)):
        return queryset
    filters = _client_scope_filter(user)
    return queryset.filter(filters | Q(project_handoff__client__source_lead__assigned_to=user)).distinct()


def scope_followups_queryset(user: User | None, queryset=None):
    from apps.crm.models import LeadFollowUp

    queryset = queryset or LeadFollowUp.objects.all()
    if user_has_crm_super_access(user):
        return queryset
    if any(code in {"crm_admin", "admin"} for code in user_crm_role_codes(user)):
        return queryset
    lead_queryset = scope_leads_queryset(user)
    return queryset.filter(lead__in=lead_queryset).distinct()


def require_lead_access(user: User | None, lead: Lead) -> None:
    if user_has_crm_super_access(user):
        return
    scoped_ids = scope_leads_queryset(user).values_list("id", flat=True)
    if lead.id not in set(scoped_ids):
        raise PermissionDenied("You are not allowed to access this lead.")


def require_project_client_access(user: User | None, client: ProjectClient) -> None:
    if user_has_crm_super_access(user):
        return
    scoped_ids = scope_project_clients_queryset(user).values_list("id", flat=True)
    if client.id not in set(scoped_ids):
        raise PermissionDenied("You are not allowed to access this project client.")


def require_project_handoff_access(user: User | None, project: ProjectHandoff) -> None:
    if user_has_crm_super_access(user):
        return
    scoped_ids = scope_project_handoffs_queryset(user).values_list("id", flat=True)
    if project.id not in set(scoped_ids):
        raise PermissionDenied("You are not allowed to access this project handoff.")


def require_project_agreement_access(user: User | None, agreement: ProjectAgreement) -> None:
    if user_has_crm_super_access(user):
        return
    scoped_ids = scope_project_agreements_queryset(user).values_list("id", flat=True)
    if agreement.id not in set(scoped_ids):
        raise PermissionDenied("You are not allowed to access this project agreement.")
