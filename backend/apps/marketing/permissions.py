from __future__ import annotations

from apps.accounts.models import User, UserRole
from rest_framework.exceptions import PermissionDenied

MARKETING_ROLE_CODES = {"super_admin", "admin", "marketing"}
MARKETING_SUPER_ROLES = {"super_admin", "admin"}


def user_marketing_role_codes(user: User | None) -> list[str]:
    if not user or not getattr(user, "is_authenticated", False):
        return []
    if getattr(user, "is_superuser", False):
        return ["super_admin"]

    role_codes = list(
        UserRole.objects.filter(user=user, role__is_active=True).values_list("role__code", flat=True),
    )
    return [code for code in role_codes if code in MARKETING_ROLE_CODES]


def has_marketing_access(user: User | None) -> bool:
    return bool(set(user_marketing_role_codes(user)) & MARKETING_ROLE_CODES)


def require_marketing_access(user: User | None) -> None:
    if not has_marketing_access(user):
        raise PermissionDenied("You are not allowed to access Growth Marketing.")


def marketing_action_access(user: User | None, action: str) -> bool:
    codes = set(user_marketing_role_codes(user))
    if not codes:
        return False
    if codes & MARKETING_SUPER_ROLES:
        return True
    return action in {"view", "create", "edit", "delete", "approve"}


def require_marketing_action_access(user: User | None, action: str) -> None:
    if not marketing_action_access(user, action):
        raise PermissionDenied("You are not allowed to perform this Growth Marketing action.")
