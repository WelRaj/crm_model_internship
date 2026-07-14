from datetime import date, time
from decimal import Decimal

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.exceptions import ValidationError

from apps.accounts.models import User
from apps.hrms.models import AttendanceRecord, EmployeeHRProfile, ExitRequest, LeaveRequest, PayrollRecord
from apps.hrms.services import HRMSService


class HRMSServiceTests(TestCase):
    def setUp(self):
        self.actor = User.objects.create_superuser(email="admin@example.com", mobile="9000000000", password="Admin@12345")

    def create_employee(self, suffix="001"):
        return HRMSService.create_employee(
            data={
                "employee_id": f"EMP-{suffix}",
                "name": f"Employee {suffix}",
                "role": "Developer",
                "team": "Product Engineering",
                "manager_name": "HR Manager",
                "location": "Navi Mumbai",
                "employment_type": "Full-Time",
                "status": EmployeeHRProfile.Status.ACTIVE,
                "health_score": 85,
                "email": f"employee{suffix}@example.com",
                "mobile": f"98765{suffix.zfill(5)}"[-10:],
                "joined": date(2026, 7, 1),
                "kyc_status": EmployeeHRProfile.KycStatus.COMPLETE,
                "asset_tag": f"LAP-{suffix}",
            },
            actor=self.actor,
        )

    def test_create_employee_blocks_duplicate_identity(self):
        self.create_employee("101")
        with self.assertRaises(ValidationError):
            self.create_employee("101")

    def test_attendance_duplicate_employee_date_is_blocked(self):
        employee = self.create_employee("102")
        payload = {
            "employee": employee,
            "date": date(2026, 7, 13),
            "check_in": time(10, 5),
            "check_out": time(18, 30),
            "mode": AttendanceRecord.Mode.OFFICE,
            "note": "Regularization request",
        }
        HRMSService.save_attendance(data=payload, actor=self.actor)
        with self.assertRaises(ValidationError):
            HRMSService.save_attendance(data=payload, actor=self.actor)

    def test_leave_hr_approval_syncs_attendance(self):
        employee = self.create_employee("103")
        leave = HRMSService.create_leave(
            data={
                "employee": employee,
                "leave_type": LeaveRequest.LeaveType.SICK,
                "start_date": date(2026, 7, 13),
                "end_date": date(2026, 7, 13),
                "duration": LeaveRequest.Duration.FULL_DAY,
                "reason": "Medical",
            },
            actor=self.actor,
        )
        HRMSService.update_leave_status(leave=leave, action="advance", actor=self.actor)
        HRMSService.update_leave_status(leave=leave, action="advance", actor=self.actor)
        attendance = AttendanceRecord.objects.get(employee=employee, date=date(2026, 7, 13))
        leave.refresh_from_db()
        self.assertEqual(leave.status, LeaveRequest.Status.APPROVED)
        self.assertEqual(attendance.status, AttendanceRecord.Status.LEAVE)
        self.assertEqual(attendance.approval_status, AttendanceRecord.ApprovalStatus.APPROVED)

    def test_payroll_readiness_blocks_pending_attendance_then_rechecks(self):
        employee = self.create_employee("104")
        HRMSService.save_attendance(
            data={
                "employee": employee,
                "date": date(2026, 7, 13),
                "check_in": time(10, 10),
                "check_out": time(18, 30),
                "mode": AttendanceRecord.Mode.OFFICE,
                "note": "Late punch",
            },
            actor=self.actor,
        )
        payroll = HRMSService.create_payroll(
            data={
                "employee": employee,
                "month": "2026-07",
                "basic": Decimal("50000"),
                "hra": Decimal("20000"),
                "allowance": Decimal("5000"),
                "conveyance": Decimal("2000"),
                "bonus": Decimal("0"),
                "pf": Decimal("6000"),
                "pt": Decimal("200"),
                "tds": Decimal("2000"),
                "advance": Decimal("0"),
                "working_days": 26,
            },
            actor=self.actor,
        )
        self.assertEqual(payroll.readiness, PayrollRecord.Readiness.ATTENDANCE_REVIEW)
        attendance = AttendanceRecord.objects.get(employee=employee, date=date(2026, 7, 13))
        HRMSService.update_attendance_status(attendance=attendance, action="approve", actor=self.actor)
        HRMSService.update_payroll_status(payroll=payroll, action="recheck", actor=self.actor)
        payroll.refresh_from_db()
        self.assertEqual(payroll.readiness, PayrollRecord.Readiness.READY)

    def test_exit_completion_requires_all_clearances_and_updates_employee(self):
        employee = self.create_employee("105")
        exit_case = HRMSService.create_exit(
            data={
                "employee": employee,
                "exit_type": ExitRequest.ExitType.RESIGNATION,
                "resignation_date": date(2026, 7, 13),
                "last_day": date(2026, 8, 12),
                "handover_owner": "HR Manager",
                "reason": "Personal",
                "risk": ExitRequest.Risk.LOW,
            },
            actor=self.actor,
        )
        with self.assertRaises(ValidationError):
            HRMSService.close_exit(exit_case=exit_case, action="complete", actor=self.actor)
        HRMSService.update_exit(
            exit_case=exit_case,
            data={
                "handover": 100,
                "laptop_recovered": True,
                "id_card_recovered": True,
                "access_revoked": True,
                "manager_clearance": True,
                "hr_clearance": True,
                "finance_clearance": True,
                "it_clearance": True,
            },
            actor=self.actor,
        )
        HRMSService.close_exit(exit_case=exit_case, action="complete", actor=self.actor)
        employee.refresh_from_db()
        exit_case.refresh_from_db()
        self.assertEqual(exit_case.lifecycle_status, ExitRequest.LifecycleStatus.COMPLETED)
        self.assertEqual(employee.status, EmployeeHRProfile.Status.EXITED)


class HRMSApiButtonFlowTests(APITestCase):
    def setUp(self):
        self.actor = User.objects.create_superuser(email="api-admin@example.com", mobile="9111111111", password="Admin@12345")
        self.client.force_authenticate(self.actor)

    def employee_payload(self, suffix="201"):
        return {
            "employee_id": f"EMP-{suffix}",
            "name": f"API Employee {suffix}",
            "role": "Software Engineer",
            "team": "Product Engineering",
            "manager_name": "API Manager",
            "location": "Navi Mumbai",
            "employment_type": "Full-Time",
            "status": "active",
            "health_score": 88,
            "email": f"api.employee{suffix}@example.com",
            "mobile": f"98888{suffix.zfill(5)}"[-10:],
            "joined": "2026-07-01",
            "kyc_status": "complete",
            "asset_tag": f"LAP-{suffix}",
        }

    def create_employee_via_api(self, suffix="201"):
        response = self.client.post("/api/v1/hrms/employees/", self.employee_payload(suffix), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.content)
        return response.data["data"]

    def create_ready_payroll_employee(self, suffix="209"):
        employee = self.create_employee_via_api(suffix)
        attendance = self.client.post(
            "/api/v1/hrms/attendance/",
            {
                "employee_id": employee["id"],
                "date": "2026-07-10",
                "check_in": "09:55",
                "check_out": "18:30",
                "mode": "office",
                "note": "On time regularization",
            },
            format="json",
        ).data["data"]
        self.client.post(f"/api/v1/hrms/attendance/{attendance['id']}/action/", {"action": "approve"}, format="json")
        return employee

    def test_employee_directory_buttons_create_edit_archive_and_list(self):
        employee = self.create_employee_via_api("201")
        list_response = self.client.get("/api/v1/hrms/employees/?search=API Employee 201")
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        update_payload = self.employee_payload("201")
        update_payload["role"] = "Senior Software Engineer"
        update_response = self.client.put(f"/api/v1/hrms/employees/{employee['id']}/", update_payload, format="json")
        self.assertEqual(update_response.status_code, status.HTTP_200_OK, update_response.content)
        self.assertEqual(update_response.data["data"]["role"], "Senior Software Engineer")
        archive_response = self.client.delete(f"/api/v1/hrms/employees/{employee['id']}/")
        self.assertEqual(archive_response.status_code, status.HTTP_200_OK, archive_response.content)
        self.assertEqual(archive_response.data["data"]["status"], "archived")

        offboard_employee = self.create_employee_via_api("207")
        offboard_response = self.client.post(
            "/api/v1/hrms/exits/",
            {
                "employee_id": offboard_employee["id"],
                "exit_type": "resignation",
                "resignation_date": "2026-07-14",
                "last_day": "2026-08-12",
                "handover_owner": "API Manager",
                "reason": "Started from employee directory",
                "risk": "medium",
            },
            format="json",
        )
        self.assertEqual(offboard_response.status_code, status.HTTP_201_CREATED, offboard_response.content)
        refreshed_employee = self.client.get(f"/api/v1/hrms/employees/{offboard_employee['id']}/")
        self.assertEqual(refreshed_employee.data["data"]["status"], "on_notice")

    def test_attendance_buttons_create_update_approve_and_reject(self):
        employee = self.create_employee_via_api("202")
        create_response = self.client.post(
            "/api/v1/hrms/attendance/",
            {
                "employee_id": employee["id"],
                "date": "2026-07-13",
                "check_in": "10:10",
                "check_out": "18:45",
                "mode": "office",
                "note": "Late punch correction",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED, create_response.content)
        attendance = create_response.data["data"]
        update_response = self.client.put(
            f"/api/v1/hrms/attendance/{attendance['id']}/",
            {
                "employee_id": employee["id"],
                "date": "2026-07-13",
                "check_in": "09:58",
                "check_out": "18:45",
                "mode": "hybrid",
                "note": "Corrected on-time punch",
            },
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK, update_response.content)
        approve_response = self.client.post(f"/api/v1/hrms/attendance/{attendance['id']}/action/", {"action": "approve"}, format="json")
        self.assertEqual(approve_response.status_code, status.HTTP_200_OK, approve_response.content)

        second = self.client.post(
            "/api/v1/hrms/attendance/",
            {
                "employee_id": employee["id"],
                "date": "2026-07-14",
                "check_in": "10:30",
                "check_out": "18:30",
                "mode": "office",
                "note": "Reject verification",
            },
            format="json",
        ).data["data"]
        reject_response = self.client.post(f"/api/v1/hrms/attendance/{second['id']}/action/", {"action": "reject"}, format="json")
        self.assertEqual(reject_response.status_code, status.HTTP_200_OK, reject_response.content)
        self.assertEqual(reject_response.data["data"]["approval_status"], "rejected")

    def test_leave_buttons_apply_manager_hr_approve_reject_and_cancel(self):
        employee = self.create_employee_via_api("203")
        leave_response = self.client.post(
            "/api/v1/hrms/leaves/",
            {
                "employee_id": employee["id"],
                "leave_type": "earned_leave",
                "start_date": "2026-07-15",
                "end_date": "2026-07-15",
                "duration": "full_day",
                "reason": "Family work",
            },
            format="json",
        )
        self.assertEqual(leave_response.status_code, status.HTTP_201_CREATED, leave_response.content)
        leave = leave_response.data["data"]
        manager_response = self.client.post(f"/api/v1/hrms/leaves/{leave['id']}/action/", {"action": "advance"}, format="json")
        self.assertEqual(manager_response.data["data"]["status"], "hr_review")
        hr_response = self.client.post(f"/api/v1/hrms/leaves/{leave['id']}/action/", {"action": "advance"}, format="json")
        self.assertEqual(hr_response.data["data"]["status"], "approved")

        reject_leave = self.client.post(
            "/api/v1/hrms/leaves/",
            {
                "employee_id": employee["id"],
                "leave_type": "sick_leave",
                "start_date": "2026-07-16",
                "end_date": "2026-07-16",
                "duration": "full_day",
                "reason": "Reject flow",
            },
            format="json",
        ).data["data"]
        reject_response = self.client.post(f"/api/v1/hrms/leaves/{reject_leave['id']}/action/", {"action": "reject"}, format="json")
        self.assertEqual(reject_response.data["data"]["status"], "rejected")

        cancel_leave = self.client.post(
            "/api/v1/hrms/leaves/",
            {
                "employee_id": employee["id"],
                "leave_type": "casual_leave",
                "start_date": "2026-07-17",
                "end_date": "2026-07-17",
                "duration": "full_day",
                "reason": "Cancel flow",
            },
            format="json",
        ).data["data"]
        cancel_response = self.client.post(f"/api/v1/hrms/leaves/{cancel_leave['id']}/action/", {"action": "cancel"}, format="json")
        self.assertEqual(cancel_response.data["data"]["status"], "cancelled")

    def test_payroll_buttons_create_hold_recheck_release_and_advance(self):
        employee = self.create_ready_payroll_employee("204")
        payroll_response = self.client.post(
            "/api/v1/hrms/payroll-records/",
            {
                "employee_id": employee["id"],
                "month": "2026-07",
                "basic": "50000",
                "hra": "20000",
                "allowance": "5000",
                "conveyance": "2000",
                "bonus": "1000",
                "pf": "6000",
                "pt": "200",
                "tds": "2000",
                "advance": "0",
                "working_days": 26,
            },
            format="json",
        )
        self.assertEqual(payroll_response.status_code, status.HTTP_201_CREATED, payroll_response.content)
        payroll = payroll_response.data["data"]
        hold_response = self.client.post(f"/api/v1/hrms/payroll-records/{payroll['id']}/action/", {"action": "hold"}, format="json")
        self.assertEqual(hold_response.data["data"]["status"], "hold")
        recheck_response = self.client.post(f"/api/v1/hrms/payroll-records/{payroll['id']}/action/", {"action": "recheck"}, format="json")
        self.assertEqual(recheck_response.data["data"]["readiness"], "ready")
        release_response = self.client.post(f"/api/v1/hrms/payroll-records/{payroll['id']}/action/", {"action": "release"}, format="json")
        self.assertEqual(release_response.data["data"]["status"], "hr_review")
        for expected_status in ["finance_review", "approved", "paid"]:
            advance_response = self.client.post(f"/api/v1/hrms/payroll-records/{payroll['id']}/action/", {"action": "advance"}, format="json")
            self.assertEqual(advance_response.data["data"]["status"], expected_status)

    def test_exit_buttons_start_checklist_cancel_and_complete(self):
        employee = self.create_employee_via_api("205")
        exit_response = self.client.post(
            "/api/v1/hrms/exits/",
            {
                "employee_id": employee["id"],
                "exit_type": "resignation",
                "resignation_date": "2026-07-14",
                "last_day": "2026-08-13",
                "handover_owner": "API Manager",
                "reason": "Personal",
                "risk": "medium",
            },
            format="json",
        )
        self.assertEqual(exit_response.status_code, status.HTTP_201_CREATED, exit_response.content)
        exit_case = exit_response.data["data"]
        cancel_response = self.client.post(f"/api/v1/hrms/exits/{exit_case['id']}/action/", {"action": "cancel"}, format="json")
        self.assertEqual(cancel_response.data["data"]["lifecycle_status"], "cancelled")

        employee_two = self.create_employee_via_api("206")
        complete_case = self.client.post(
            "/api/v1/hrms/exits/",
            {
                "employee_id": employee_two["id"],
                "exit_type": "resignation",
                "resignation_date": "2026-07-14",
                "last_day": "2026-08-13",
                "handover_owner": "API Manager",
                "reason": "Complete flow",
                "risk": "low",
            },
            format="json",
        ).data["data"]
        update_response = self.client.put(
            f"/api/v1/hrms/exits/{complete_case['id']}/",
            {
                "handover": 100,
                "laptop_recovered": True,
                "id_card_recovered": True,
                "access_revoked": True,
                "manager_clearance": True,
                "hr_clearance": True,
                "finance_clearance": True,
                "it_clearance": True,
            },
            format="json",
        )
        self.assertEqual(update_response.data["data"]["lifecycle_status"], "ready_for_fnf")
        complete_response = self.client.post(f"/api/v1/hrms/exits/{complete_case['id']}/action/", {"action": "complete"}, format="json")
        self.assertEqual(complete_response.data["data"]["lifecycle_status"], "completed")
