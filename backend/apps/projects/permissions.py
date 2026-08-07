from __future__ import annotations

from django.db.models import Q, QuerySet
from apps.accounts.models import User, UserRole
from apps.projects.models import DeliveryProject, EmployeePerformanceReview
from rest_framework.exceptions import PermissionDenied

PROJECT_ROLE_CODES = {"super_admin", "admin", "team_lead", "project_manager"}
PROJECT_SUPER_ROLES = {"super_admin", "admin"}


def user_project_role_codes(user: User | None) -> list[str]:
    if not user or not getattr(user, "is_authenticated", False):
        return []
    if getattr(user, "is_superuser", False):
        return ["super_admin"]

    role_codes = list(
        UserRole.objects.filter(user=user, role__is_active=True).values_list("role__code", flat=True),
    )
    return [code for code in role_codes if code in PROJECT_ROLE_CODES]


def has_project_access(user: User | None) -> bool:
    return bool(set(user_project_role_codes(user)) & PROJECT_ROLE_CODES)


def require_project_access(user: User | None) -> None:
    if not has_project_access(user):
        raise PermissionDenied("You are not allowed to access Delivery Projects.")


def project_action_access(user: User | None, action: str) -> bool:
    codes = set(user_project_role_codes(user))
    if not codes:
        return False
    if codes & PROJECT_SUPER_ROLES:
        return True
    return action in {"view", "create", "edit", "delete", "approve", "assign"}


def require_project_action_access(user: User | None, action: str) -> None:
    if not project_action_access(user, action):
        raise PermissionDenied("You are not allowed to perform this Delivery Projects action.")


def user_has_project_super_access(user: User | None) -> bool:
    return bool(set(user_project_role_codes(user)) & PROJECT_SUPER_ROLES)


def _user_team(user: User | None) -> str:
    if not user or not getattr(user, "is_authenticated", False):
        return ""
    return getattr(getattr(user, "hr_profile", None), "team", "") or ""


def scope_delivery_projects_queryset(user: User | None, queryset: QuerySet[DeliveryProject] | None = None) -> QuerySet[DeliveryProject]:
    queryset = queryset or DeliveryProject.objects.all()
    if user_has_project_super_access(user):
        return queryset

    codes = set(user_project_role_codes(user))
    filters = Q()
    if "project_manager" in codes:
        filters |= Q(project_manager=user) | Q(team_assignments__user=user)
    if "team_lead" in codes:
        team = _user_team(user)
        filters |= Q(team_assignments__user=user)
        if team:
            filters |= Q(team_assignments__user__hr_profile__team=team)
    return queryset.filter(filters).distinct()


def require_delivery_project_access(user: User | None, project: DeliveryProject) -> None:
    if user_has_project_super_access(user):
        return
    if not scope_delivery_projects_queryset(user, DeliveryProject.objects.filter(id=project.id)).exists():
        raise PermissionDenied("You are not allowed to access this delivery project.")


def scope_performance_reviews_queryset(user: User | None, queryset: QuerySet[EmployeePerformanceReview] | None = None) -> QuerySet[EmployeePerformanceReview]:
    queryset = queryset or EmployeePerformanceReview.objects.all()
    if user_has_project_super_access(user):
        return queryset

    codes = set(user_project_role_codes(user))
    filters = Q()
    if "project_manager" in codes:
        filters |= Q(manager=user) | Q(employee=user)
    if "team_lead" in codes:
        team = _user_team(user)
        filters |= Q(manager=user) | Q(employee=user)
        if team:
            filters |= Q(employee__hr_profile__team=team)
    return queryset.filter(filters).distinct()
