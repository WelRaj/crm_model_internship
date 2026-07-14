from apps.hrms.models import AttendanceRecord, EmployeeHRProfile, ExitRequest, LeaveRequest, PayrollRecord


def get_employees_queryset():
    return EmployeeHRProfile.objects.filter(is_deleted=False).select_related("user", "user__profile").order_by("-updated_at")


def get_attendance_queryset():
    return AttendanceRecord.objects.filter(is_deleted=False).select_related("employee", "employee__user").order_by("-date", "-created_at")


def get_leave_queryset():
    return LeaveRequest.objects.filter(is_deleted=False).select_related("employee", "employee__user").order_by("-applied_at")


def get_payroll_queryset():
    return PayrollRecord.objects.filter(is_deleted=False).select_related("employee", "employee__user").order_by("-month", "-created_at")


def get_exit_queryset():
    return ExitRequest.objects.filter(is_deleted=False).select_related("employee", "employee__user").order_by("-created_at")
