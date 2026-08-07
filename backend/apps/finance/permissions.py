from __future__ import annotations

from apps.accounts.models import User, UserRole
from rest_framework.exceptions import PermissionDenied

FINANCE_SUPER_ROLES = {"super_admin", "admin"}
FINANCE_ROLE_CODES = {"super_admin", "admin", "finance"}
FINANCE_PAGE_CODES = {
    "overview",
    "clients",
    "vendors",
    "quotations",
    "invoices",
    "payments",
    "reminders",
    "credit-notes",
    "ledger-entries",
    "expenses",
    "budgets",
    "payroll-register",
    "gst-returns",
    "tds-records",
    "approval-policies",
    "approval-requests",
    "access-policies",
    "bank-accounts",
}

FINANCE_RESOURCE_PAGE_MAP = {
    "credit-notes": "credit-notes",
    "ledger-entries": "ledger-entries",
    "expenses": "expenses",
    "budgets": "budgets",
    "payroll-register": "payroll-register",
    "tds-records": "tds-records",
    "approval-requests": "approval-requests",
}

FINANCE_SUPER_ONLY_PAGES = {"access-policies"}
FINANCE_SUPER_ONLY_MUTATION_PAGES = {"access-policies", "approval-policies"}

FINANCE_METHOD_ACTIONS = {
    "GET": "view",
    "HEAD": "view",
    "OPTIONS": "view",
    "POST": "create",
    "PUT": "edit",
    "PATCH": "edit",
    "DELETE": "delete",
}


def user_finance_role_codes(user: User | None) -> list[str]:
    if not user or not getattr(user, "is_authenticated", False):
        return []
    if getattr(user, "is_superuser", False):
        return ["super_admin"]

    role_codes = list(
        UserRole.objects.filter(user=user, role__is_active=True).values_list("role__code", flat=True),
    )
    return [code for code in role_codes if code in FINANCE_ROLE_CODES]


def has_finance_access(user: User | None) -> bool:
    return bool(set(user_finance_role_codes(user)) & FINANCE_ROLE_CODES)


def finance_page_access(user: User | None, page: str) -> bool:
    if not has_finance_access(user):
        return False
    if set(user_finance_role_codes(user)) & FINANCE_SUPER_ROLES:
        return True
    if page in FINANCE_SUPER_ONLY_PAGES:
        return False
    return page in FINANCE_PAGE_CODES


def require_finance_page_access(user: User | None, page: str) -> None:
    if not finance_page_access(user, page):
        raise PermissionDenied("You are not allowed to access this Finance Control page.")


def finance_action_access(user: User | None, action: str, page: str | None = None) -> bool:
    if not has_finance_access(user):
        return False
    if set(user_finance_role_codes(user)) & FINANCE_SUPER_ROLES:
        return True
    if page in FINANCE_SUPER_ONLY_MUTATION_PAGES and action != "view":
        return False
    return action in {"view", "create", "edit", "delete", "approve", "export"}


def require_finance_action_access(user: User | None, action: str, page: str | None = None) -> None:
    if not finance_action_access(user, action, page):
        raise PermissionDenied("You are not allowed to perform this Finance Control action.")


class FinanceAccessMixin:
    finance_page: str | None = None
    finance_action: str | None = None

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        page = self.finance_page or FINANCE_RESOURCE_PAGE_MAP.get(kwargs.get("resource"), None)
        if page:
            require_finance_page_access(request.user, page)
        action = self.finance_action or FINANCE_METHOD_ACTIONS.get(request.method)
        if action:
            require_finance_action_access(request.user, action, page)
