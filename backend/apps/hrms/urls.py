from django.urls import path

from apps.hrms.views import (
    AttendanceActionView,
    AttendanceDetailView,
    AttendanceListCreateView,
    EmployeeDetailView,
    EmployeeListCreateView,
    ExitActionView,
    ExitDetailView,
    ExitListCreateView,
    LeaveActionView,
    LeaveListCreateView,
    PayrollActionView,
    PayrollListCreateView,
)


urlpatterns = [
    path("hrms/employees/", EmployeeListCreateView.as_view(), name="hrms-employees"),
    path("hrms/employees/<uuid:employee_id>/", EmployeeDetailView.as_view(), name="hrms-employee-detail"),
    path("hrms/attendance/", AttendanceListCreateView.as_view(), name="hrms-attendance"),
    path("hrms/attendance/<uuid:attendance_id>/", AttendanceDetailView.as_view(), name="hrms-attendance-detail"),
    path("hrms/attendance/<uuid:attendance_id>/action/", AttendanceActionView.as_view(), name="hrms-attendance-action"),
    path("hrms/leaves/", LeaveListCreateView.as_view(), name="hrms-leaves"),
    path("hrms/leaves/<uuid:leave_id>/action/", LeaveActionView.as_view(), name="hrms-leave-action"),
    path("hrms/payroll-records/", PayrollListCreateView.as_view(), name="hrms-payroll-records"),
    path("hrms/payroll-records/<uuid:payroll_id>/action/", PayrollActionView.as_view(), name="hrms-payroll-action"),
    path("hrms/exits/", ExitListCreateView.as_view(), name="hrms-exits"),
    path("hrms/exits/<uuid:exit_id>/", ExitDetailView.as_view(), name="hrms-exit-detail"),
    path("hrms/exits/<uuid:exit_id>/action/", ExitActionView.as_view(), name="hrms-exit-action"),
]
