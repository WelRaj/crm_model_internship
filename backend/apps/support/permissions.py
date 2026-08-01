from __future__ import annotations

from apps.accounts.models import User, UserRole
from rest_framework.exceptions import PermissionDenied

SUPPORT_ROLE_CODES = {"super_admin", "admin", "support"}
SUPPORT_SUPER_ROLES = {"super_admin", "admin"}


def user_support_role_codes(user: User | None) -> list[str]:
    if not user or not getattr(user, "is_authenticated", False):
        return []
    if getattr(user, "is_superuser", False):
        return ["super_admin"]

    role_codes = list(
        UserRole.objects.filter(user=user, role__is_active=True).values_list("role__code", flat=True),
    )
    return [code for code in role_codes if code in SUPPORT_ROLE_CODES]


def support_page_access(user: User | None) -> bool:
    codes = set(user_support_role_codes(user))
    return bool(codes & SUPPORT_ROLE_CODES)


def require_support_access(user: User | None) -> None:
    if not support_page_access(user):
        raise PermissionDenied("You are not allowed to access Support Desk.")


def support_action_access(user: User | None, action: str) -> bool:
    codes = set(user_support_role_codes(user))
    if not codes:
        return False
    if codes & SUPPORT_SUPER_ROLES:
        return True
    return action in {"view", "create", "edit", "comment"}


def require_support_action_access(user: User | None, action: str) -> None:
    if not support_action_access(user, action):
        raise PermissionDenied("You are not allowed to perform this Support Desk action.")
