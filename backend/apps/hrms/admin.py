from django.contrib import admin

from apps.hrms.models import AttendanceRecord, EmployeeHRProfile, ExitRequest, LeaveRequest, PayrollRecord


@admin.register(EmployeeHRProfile)
class EmployeeHRProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "team", "status", "kyc_status", "health_score")
    list_filter = ("team", "status", "kyc_status")
    search_fields = ("user__employee_id", "user__first_name", "user__last_name", "user__email", "role", "team")


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ("employee", "date", "status", "approval_status", "payroll_impact", "billable_hours")
    list_filter = ("status", "approval_status", "payroll_impact", "mode")
    search_fields = ("employee__user__employee_id", "employee__user__first_name", "employee__user__last_name")


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ("employee", "leave_type", "start_date", "end_date", "days", "status", "payroll_impact")
    list_filter = ("leave_type", "status", "payroll_impact")
    search_fields = ("employee__user__employee_id", "employee__user__first_name", "employee__user__last_name", "reason")


@admin.register(PayrollRecord)
class PayrollRecordAdmin(admin.ModelAdmin):
    list_display = ("employee", "month", "working_days", "payable_days", "readiness", "status")
    list_filter = ("month", "readiness", "status")
    search_fields = ("employee__user__employee_id", "employee__user__first_name", "employee__user__last_name")


@admin.register(ExitRequest)
class ExitRequestAdmin(admin.ModelAdmin):
    list_display = ("employee", "exit_type", "last_day", "risk", "ff_status", "lifecycle_status")
    list_filter = ("exit_type", "risk", "ff_status", "lifecycle_status")
    search_fields = ("employee__user__employee_id", "employee__user__first_name", "employee__user__last_name", "reason")
