from django.db.models import Q
from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.views import APIView

from apps.core.responses import success_response
from apps.hrms.models import AttendanceRecord, EmployeeHRProfile, ExitRequest, LeaveRequest, PayrollRecord
from apps.hrms.selectors import get_attendance_queryset, get_employees_queryset, get_exit_queryset, get_leave_queryset, get_payroll_queryset
from apps.hrms.serializers import (
    ActionSerializer,
    AttendanceRecordSerializer,
    AttendanceWriteSerializer,
    EmployeeHRProfileSerializer,
    EmployeeHRProfileWriteSerializer,
    ExitRequestSerializer,
    ExitRequestUpdateSerializer,
    ExitRequestWriteSerializer,
    LeaveRequestSerializer,
    LeaveRequestWriteSerializer,
    PayrollRecordSerializer,
    PayrollRecordWriteSerializer,
)
from apps.hrms.services import HRMSService


class EmployeeListCreateView(APIView):
    def get(self, request):
        queryset = get_employees_queryset()
        search = request.query_params.get("search")
        status_filter = request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if search:
            queryset = queryset.filter(
                Q(user__employee_id__icontains=search)
                | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
                | Q(user__email__icontains=search)
                | Q(user__mobile__icontains=search)
                | Q(role__icontains=search)
                | Q(team__icontains=search)
                | Q(manager_name__icontains=search)
            )
        return success_response(data=EmployeeHRProfileSerializer(queryset[:300], many=True).data)

    def post(self, request):
        serializer = EmployeeHRProfileWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        employee = HRMSService.create_employee(data=serializer.validated_data, actor=request.user, request=request)
        return success_response(data=EmployeeHRProfileSerializer(employee).data, message="Employee saved successfully", status_code=status.HTTP_201_CREATED)


class EmployeeDetailView(APIView):
    def get(self, request, employee_id):
        employee = get_object_or_404(get_employees_queryset(), id=employee_id)
        return success_response(data=EmployeeHRProfileSerializer(employee).data)

    def put(self, request, employee_id):
        employee = get_object_or_404(get_employees_queryset(), id=employee_id)
        serializer = EmployeeHRProfileWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        employee = HRMSService.update_employee(employee=employee, data=serializer.validated_data, actor=request.user, request=request)
        return success_response(data=EmployeeHRProfileSerializer(employee).data, message="Employee updated successfully")

    def delete(self, request, employee_id):
        employee = get_object_or_404(get_employees_queryset(), id=employee_id)
        employee = HRMSService.archive_employee(employee=employee, actor=request.user, request=request)
        return success_response(data=EmployeeHRProfileSerializer(employee).data, message="Employee archived successfully")


class AttendanceListCreateView(APIView):
    def get(self, request):
        queryset = get_attendance_queryset()
        search = request.query_params.get("search")
        status_filter = request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(Q(status=status_filter) | Q(approval_status=status_filter) | Q(payroll_impact=status_filter))
        if search:
            queryset = queryset.filter(Q(employee__user__employee_id__icontains=search) | Q(employee__user__first_name__icontains=search) | Q(employee__user__last_name__icontains=search) | Q(note__icontains=search))
        return success_response(data=AttendanceRecordSerializer(queryset[:300], many=True).data)

    def post(self, request):
        serializer = AttendanceWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        attendance = HRMSService.save_attendance(data=serializer.validated_data, actor=request.user, request=request)
        return success_response(data=AttendanceRecordSerializer(attendance).data, message="Attendance saved successfully", status_code=status.HTTP_201_CREATED)


class AttendanceDetailView(APIView):
    def put(self, request, attendance_id):
        attendance = get_object_or_404(get_attendance_queryset(), id=attendance_id)
        serializer = AttendanceWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        attendance = HRMSService.save_attendance(data=serializer.validated_data, attendance=attendance, actor=request.user, request=request)
        return success_response(data=AttendanceRecordSerializer(attendance).data, message="Attendance updated successfully")


class AttendanceActionView(APIView):
    def post(self, request, attendance_id):
        attendance = get_object_or_404(AttendanceRecord.objects.filter(is_deleted=False).select_related("employee", "employee__user"), id=attendance_id)
        serializer = ActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        attendance = HRMSService.update_attendance_status(attendance=attendance, action=serializer.validated_data["action"], actor=request.user, request=request)
        return success_response(data=AttendanceRecordSerializer(attendance).data, message="Attendance action completed")


class LeaveListCreateView(APIView):
    def get(self, request):
        queryset = get_leave_queryset()
        search = request.query_params.get("search")
        status_filter = request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(Q(status=status_filter) | Q(payroll_impact=status_filter))
        if search:
            queryset = queryset.filter(Q(employee__user__employee_id__icontains=search) | Q(employee__user__first_name__icontains=search) | Q(employee__user__last_name__icontains=search) | Q(reason__icontains=search))
        return success_response(data=LeaveRequestSerializer(queryset[:300], many=True).data)

    def post(self, request):
        serializer = LeaveRequestWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        leave = HRMSService.create_leave(data=serializer.validated_data, actor=request.user, request=request)
        return success_response(data=LeaveRequestSerializer(leave).data, message="Leave request saved successfully", status_code=status.HTTP_201_CREATED)


class LeaveActionView(APIView):
    def post(self, request, leave_id):
        leave = get_object_or_404(get_leave_queryset(), id=leave_id)
        serializer = ActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        leave = HRMSService.update_leave_status(leave=leave, action=serializer.validated_data["action"], actor=request.user, request=request)
        return success_response(data=LeaveRequestSerializer(leave).data, message="Leave action completed")


class PayrollListCreateView(APIView):
    def get(self, request):
        queryset = get_payroll_queryset()
        search = request.query_params.get("search")
        status_filter = request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(Q(status=status_filter) | Q(readiness=status_filter))
        if search:
            queryset = queryset.filter(Q(employee__user__employee_id__icontains=search) | Q(employee__user__first_name__icontains=search) | Q(employee__user__last_name__icontains=search) | Q(month__icontains=search) | Q(hold_reason__icontains=search))
        return success_response(data=PayrollRecordSerializer(queryset[:300], many=True).data)

    def post(self, request):
        serializer = PayrollRecordWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payroll = HRMSService.create_payroll(data=serializer.validated_data, actor=request.user, request=request)
        return success_response(data=PayrollRecordSerializer(payroll).data, message="Payroll draft saved successfully", status_code=status.HTTP_201_CREATED)


class PayrollActionView(APIView):
    def post(self, request, payroll_id):
        payroll = get_object_or_404(PayrollRecord.objects.filter(is_deleted=False).select_related("employee", "employee__user"), id=payroll_id)
        serializer = ActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payroll = HRMSService.update_payroll_status(payroll=payroll, action=serializer.validated_data["action"], actor=request.user, request=request)
        return success_response(data=PayrollRecordSerializer(payroll).data, message="Payroll action completed")


class ExitListCreateView(APIView):
    def get(self, request):
        queryset = get_exit_queryset()
        search = request.query_params.get("search")
        status_filter = request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(Q(lifecycle_status=status_filter) | Q(ff_status=status_filter) | Q(risk=status_filter))
        if search:
            queryset = queryset.filter(Q(employee__user__employee_id__icontains=search) | Q(employee__user__first_name__icontains=search) | Q(employee__user__last_name__icontains=search) | Q(reason__icontains=search) | Q(handover_owner__icontains=search))
        return success_response(data=ExitRequestSerializer(queryset[:300], many=True).data)

    def post(self, request):
        serializer = ExitRequestWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        exit_case = HRMSService.create_exit(data=serializer.validated_data, actor=request.user, request=request)
        return success_response(data=ExitRequestSerializer(exit_case).data, message="Exit process started successfully", status_code=status.HTTP_201_CREATED)


class ExitDetailView(APIView):
    def put(self, request, exit_id):
        exit_case = get_object_or_404(get_exit_queryset(), id=exit_id)
        serializer = ExitRequestUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        exit_case = HRMSService.update_exit(exit_case=exit_case, data=serializer.validated_data, actor=request.user, request=request)
        return success_response(data=ExitRequestSerializer(exit_case).data, message="Exit process updated successfully")


class ExitActionView(APIView):
    def post(self, request, exit_id):
        exit_case = get_object_or_404(get_exit_queryset(), id=exit_id)
        serializer = ActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        exit_case = HRMSService.close_exit(exit_case=exit_case, action=serializer.validated_data["action"], actor=request.user, request=request)
        return success_response(data=ExitRequestSerializer(exit_case).data, message="Exit action completed")
