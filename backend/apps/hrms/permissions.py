from __future__ import annotations

from django.db.models import QuerySet

from apps.accounts.models import User, UserRole
from rest_framework.exceptions import PermissionDenied

from apps.hrms.models import AttendanceRecord, EmployeeHRProfile, ExitRequest, LeaveRequest, PayrollRecord

HRMS_ROLE_CODES = {"super_admin", "admin", "hr"}
HRMS_SUPER_ROLES = {"super_admin", "admin"}


def user_hrms_role_codes(user: User | None) -> list[str]:
    if not user or not getattr(user, "is_authenticated", False):
        return []
    if getattr(user, "is_superuser", False):
        return ["super_admin"]

    role_codes = list(
        UserRole.objects.filter(user=user, role__is_active=True).values_list("role__code", flat=True),
    )
    return [code for code in role_codes if code in HRMS_ROLE_CODES]


def has_hrms_access(user: User | None) -> bool:
    if bool(set(user_hrms_role_codes(user)) & HRMS_ROLE_CODES):
        return True
    if not user or not getattr(user, "is_authenticated", False):
        return False
    return EmployeeHRProfile.objects.filter(user=user, is_deleted=False).exists()


def require_hrms_access(user: User | None) -> None:
    if not has_hrms_access(user):
        raise PermissionDenied("You are not allowed to access HRMS.")


def hrms_action_access(user: User | None, action: str) -> bool:
    codes = set(user_hrms_role_codes(user))
    if codes & HRMS_SUPER_ROLES:
        return True
    if not codes:
        return action == "view" and has_hrms_access(user)
    return action in {"view", "create", "edit", "delete", "approve"}


def require_hrms_action_access(user: User | None, action: str) -> None:
    if not hrms_action_access(user, action):
        raise PermissionDenied("You are not allowed to perform this HRMS action.")


def user_has_hrms_staff_access(user: User | None) -> bool:
    return bool(set(user_hrms_role_codes(user)) & HRMS_ROLE_CODES)


def scope_employees_queryset(user: User | None, queryset: QuerySet | None = None) -> QuerySet:
    base_queryset = queryset if queryset is not None else EmployeeHRProfile.objects.filter(is_deleted=False)
    if not has_hrms_access(user):
        return base_queryset.none()
    if user_has_hrms_staff_access(user):
        return base_queryset
    return base_queryset.filter(user=user)


def scope_attendance_queryset(user: User | None, queryset: QuerySet | None = None) -> QuerySet:
    base_queryset = queryset if queryset is not None else AttendanceRecord.objects.filter(is_deleted=False)
    if not has_hrms_access(user):
        return base_queryset.none()
    if user_has_hrms_staff_access(user):
        return base_queryset
    return base_queryset.filter(employee__user=user)


def scope_leave_queryset(user: User | None, queryset: QuerySet | None = None) -> QuerySet:
    base_queryset = queryset if queryset is not None else LeaveRequest.objects.filter(is_deleted=False)
    if not has_hrms_access(user):
        return base_queryset.none()
    if user_has_hrms_staff_access(user):
        return base_queryset
    return base_queryset.filter(employee__user=user)


def scope_payroll_queryset(user: User | None, queryset: QuerySet | None = None) -> QuerySet:
    base_queryset = queryset if queryset is not None else PayrollRecord.objects.filter(is_deleted=False)
    if not has_hrms_access(user):
        return base_queryset.none()
    if user_has_hrms_staff_access(user):
        return base_queryset
    return base_queryset.filter(employee__user=user)


def scope_exit_queryset(user: User | None, queryset: QuerySet | None = None) -> QuerySet:
    base_queryset = queryset if queryset is not None else ExitRequest.objects.filter(is_deleted=False)
    if not has_hrms_access(user):
        return base_queryset.none()
    if user_has_hrms_staff_access(user):
        return base_queryset
    return base_queryset.filter(employee__user=user)
