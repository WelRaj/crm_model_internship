from calendar import monthrange
from datetime import date, datetime, time, timedelta
from decimal import Decimal, ROUND_HALF_UP

from django.db import models, transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.accounts.models import User, UserProfile
from apps.audit.services import record_audit_log
from apps.notifications.services import NotificationService
from apps.hrms.models import AttendanceRecord, EmployeeHRProfile, ExitRequest, LeaveRequest, PayrollRecord


LEAVE_LIMITS = {
    LeaveRequest.LeaveType.EARNED: Decimal("18"),
    LeaveRequest.LeaveType.SICK: Decimal("10"),
    LeaveRequest.LeaveType.CASUAL: Decimal("7"),
    LeaveRequest.LeaveType.COMP_OFF: Decimal("7"),
}


def _next_employee_id() -> str:
    prefix = f"EMP-{timezone.now().year}-"
    existing_ids = User.objects.filter(employee_id__startswith=prefix).values_list("employee_id", flat=True)
    max_number = 0
    for employee_id in existing_ids:
        try:
            max_number = max(max_number, int(employee_id.removeprefix(prefix)))
        except ValueError:
            continue
    return f"{prefix}{max_number + 1:03d}"


def _date_range(start: date, end: date):
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)


def _hours_between(check_in: time, check_out: time) -> Decimal:
    start = datetime.combine(date.today(), check_in)
    end = datetime.combine(date.today(), check_out)
    minutes = max(0, int((end - start).total_seconds() // 60))
    return (Decimal(minutes) / Decimal(60)).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)


def _is_late(check_in: time, shift: str) -> bool:
    try:
        shift_start = datetime.strptime(shift.split("-")[0].strip(), "%H:%M").time()
    except (ValueError, IndexError):
        shift_start = time(10, 0)
    return check_in > shift_start


def _sync_user_profile(employee: EmployeeHRProfile):
    user = employee.user
    user.department = employee.team
    user.designation = employee.role
    user.save(update_fields=["department", "designation"])
    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.office_location = employee.location
    profile.employment_type = employee.employment_type
    profile.employee_status = "Inactive" if employee.status in {EmployeeHRProfile.Status.EXITED, EmployeeHRProfile.Status.ARCHIVED} else "Active"
    profile.save(update_fields=["office_location", "employment_type", "employee_status", "updated_at"])


def _set_employee_status(employee: EmployeeHRProfile, status: str, actor):
    employee.status = status
    employee.updated_by = actor
    employee.save(update_fields=["status", "updated_by", "updated_at"])
    _sync_user_profile(employee)


class HRMSService:
    @staticmethod
    @transaction.atomic
    def create_employee(*, data, actor, request=None):
        employee_id = (data.get("employee_id") or "").strip() or _next_employee_id()
        while User.objects.filter(employee_id=employee_id).exists():
            employee_id = _next_employee_id()
        if User.objects.filter(employee_id=employee_id).exists():
            raise ValidationError({"employee_id": "Employee ID already exists."})
        if User.objects.filter(email__iexact=data["email"]).exists():
            raise ValidationError({"email": "A user with this email already exists."})
        if User.objects.filter(mobile=data["mobile"]).exists():
            raise ValidationError({"mobile": "A user with this mobile already exists."})

        names = data["name"].strip().split(" ", 1)
        user = User.objects.create_user(
            email=data["email"].lower(),
            mobile=data["mobile"],
            password=data.get("password"),
            employee_id=employee_id,
            first_name=names[0],
            last_name=names[1] if len(names) > 1 else "",
            department=data["team"],
            designation=data["role"],
            is_verified=True,
        )
        employee = EmployeeHRProfile.objects.create(
            user=user,
            role=data["role"],
            team=data["team"],
            manager_name=data.get("manager_name", ""),
            location=data.get("location", ""),
            employment_type=data.get("employment_type", "Full-time"),
            status=data.get("status", EmployeeHRProfile.Status.ACTIVE),
            health_score=data.get("health_score", 75),
            kyc_status=data.get("kyc_status", EmployeeHRProfile.KycStatus.PENDING),
            asset_tag=data.get("asset_tag", ""),
            created_by=actor,
            updated_by=actor,
        )
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.office_location = employee.location
        profile.employment_type = employee.employment_type
        profile.date_of_joining = data.get("joined")
        profile.employee_status = "Inactive" if employee.status in {EmployeeHRProfile.Status.EXITED, EmployeeHRProfile.Status.ARCHIVED} else "Active"
        profile.save()
        record_audit_log(actor=actor, module="hrms", action="create", entity_type="EmployeeHRProfile", entity_id=employee.id, new_values={"employee_id": user.employee_id, "status": employee.status}, request=request)
        NotificationService.create_event(
            actor=actor,
            title=f"Employee onboarded: {user.get_full_name() or user.email or user.mobile}",
            message=f"{user.employee_id} added to HRMS as {employee.role} in {employee.team}.",
            notification_type="HRMS",
            priority="Medium",
            target_module="People Operations",
            entity_type="EmployeeHRProfile",
            entity_id=employee.id,
            is_broadcast=True,
            request=request,
        )
        return employee

    @staticmethod
    @transaction.atomic
    def update_employee(*, employee, data, actor, request=None):
        user = employee.user
        old_values = {"status": employee.status, "team": employee.team, "role": employee.role}
        if "employee_id" in data and data["employee_id"] != user.employee_id:
            if User.objects.filter(employee_id=data["employee_id"]).exclude(id=user.id).exists():
                raise ValidationError({"employee_id": "Employee ID already exists."})
            user.employee_id = data["employee_id"]
        if "email" in data and data["email"].lower() != user.email:
            if User.objects.filter(email__iexact=data["email"]).exclude(id=user.id).exists():
                raise ValidationError({"email": "A user with this email already exists."})
            user.email = data["email"].lower()
        if "mobile" in data and data["mobile"] != user.mobile:
            if User.objects.filter(mobile=data["mobile"]).exclude(id=user.id).exists():
                raise ValidationError({"mobile": "A user with this mobile already exists."})
            user.mobile = data["mobile"]
        if "name" in data:
            names = data["name"].strip().split(" ", 1)
            user.first_name = names[0]
            user.last_name = names[1] if len(names) > 1 else ""
        for user_field, data_field in {"department": "team", "designation": "role"}.items():
            if data_field in data:
                setattr(user, user_field, data[data_field])
        user.save()

        for field in ["role", "team", "manager_name", "location", "employment_type", "status", "health_score", "kyc_status", "asset_tag"]:
            if field in data:
                setattr(employee, field, data[field])
        employee.updated_by = actor
        employee.save()
        profile, _ = UserProfile.objects.get_or_create(user=user)
        if "joined" in data:
            profile.date_of_joining = data["joined"]
        profile.office_location = employee.location
        profile.employment_type = employee.employment_type
        profile.employee_status = "Inactive" if employee.status in {EmployeeHRProfile.Status.EXITED, EmployeeHRProfile.Status.ARCHIVED} else "Active"
        profile.save()
        record_audit_log(actor=actor, module="hrms", action="update", entity_type="EmployeeHRProfile", entity_id=employee.id, old_values=old_values, new_values={"status": employee.status, "team": employee.team, "role": employee.role}, request=request)
        NotificationService.create_event(
            actor=actor,
            title=f"Employee updated: {user.get_full_name() or user.email or user.mobile}",
            message=f"HRMS profile changed for {user.employee_id}.",
            notification_type="HRMS",
            priority="Low",
            target_module="People Operations",
            entity_type="EmployeeHRProfile",
            entity_id=employee.id,
            is_broadcast=True,
            request=request,
        )
        return employee

    @staticmethod
    @transaction.atomic
    def archive_employee(*, employee, actor, request=None):
        _set_employee_status(employee, EmployeeHRProfile.Status.ARCHIVED, actor)
        record_audit_log(actor=actor, module="hrms", action="archive", entity_type="EmployeeHRProfile", entity_id=employee.id, request=request)
        NotificationService.create_event(
            actor=actor,
            title=f"Employee archived: {employee.user.get_full_name() or employee.user.email or employee.user.mobile}",
            message=f"{employee.user.employee_id} archived from active workforce.",
            notification_type="HRMS",
            priority="High",
            target_module="People Operations",
            entity_type="EmployeeHRProfile",
            entity_id=employee.id,
            is_broadcast=True,
            request=request,
        )
        return employee

    @staticmethod
    @transaction.atomic
    def save_attendance(*, data, actor, request=None, attendance=None):
        employee = data["employee"]
        if AttendanceRecord.objects.filter(employee=employee, date=data["date"], is_deleted=False).exclude(id=getattr(attendance, "id", None)).exists():
            raise ValidationError({"date": "Attendance already exists for this employee and date."})
        if data["check_out"] <= data["check_in"]:
            raise ValidationError({"check_out": "Check-out must be after check-in."})
        billable = _hours_between(data["check_in"], data["check_out"])
        overtime = max(Decimal("0"), billable - Decimal("8")).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)
        shift = getattr(attendance, "shift", "10:00 - 19:00")
        late = _is_late(data["check_in"], shift)
        values = {
            "employee": employee,
            "date": data["date"],
            "shift": shift,
            "check_in": data["check_in"],
            "check_out": data["check_out"],
            "mode": data["mode"],
            "status": AttendanceRecord.Status.LATE if late else AttendanceRecord.Status.REGULARIZED,
            "billable_hours": billable,
            "overtime_hours": overtime,
            "approval_status": AttendanceRecord.ApprovalStatus.PENDING,
            "payroll_impact": AttendanceRecord.PayrollImpact.REVIEW if late or overtime > 0 else AttendanceRecord.PayrollImpact.PAYABLE,
            "note": data.get("note", "").strip(),
            "updated_by": actor,
        }
        if attendance:
            for field, value in values.items():
                setattr(attendance, field, value)
            attendance.save()
        else:
            attendance = AttendanceRecord.objects.create(**values, created_by=actor)
        record_audit_log(actor=actor, module="hrms", action="attendance_save", entity_type="AttendanceRecord", entity_id=attendance.id, request=request)
        return attendance

    @staticmethod
    @transaction.atomic
    def update_attendance_status(*, attendance, action, actor, request=None):
        if attendance.approval_status == AttendanceRecord.ApprovalStatus.AUTO_APPROVED:
            raise ValidationError({"approval_status": "Auto approved attendance cannot be changed manually."})
        if action == "approve":
            if attendance.approval_status == AttendanceRecord.ApprovalStatus.APPROVED:
                raise ValidationError({"approval_status": "Attendance is already approved."})
            attendance.approval_status = AttendanceRecord.ApprovalStatus.APPROVED
            attendance.payroll_impact = AttendanceRecord.PayrollImpact.NON_PAYABLE if attendance.status == AttendanceRecord.Status.LEAVE else AttendanceRecord.PayrollImpact.PAYABLE
            attendance.note = f"{attendance.note} | Approved for payroll".strip()
        elif action == "reject":
            if attendance.approval_status == AttendanceRecord.ApprovalStatus.APPROVED:
                raise ValidationError({"approval_status": "Approved attendance cannot be rejected."})
            if attendance.approval_status == AttendanceRecord.ApprovalStatus.REJECTED:
                raise ValidationError({"approval_status": "Attendance is already rejected."})
            attendance.approval_status = AttendanceRecord.ApprovalStatus.REJECTED
            attendance.payroll_impact = AttendanceRecord.PayrollImpact.NON_PAYABLE
            attendance.note = f"{attendance.note} | Rejected by HR".strip()
        else:
            raise ValidationError({"action": "Unsupported attendance action."})
        attendance.updated_by = actor
        attendance.save()
        record_audit_log(actor=actor, module="hrms", action=f"attendance_{action}", entity_type="AttendanceRecord", entity_id=attendance.id, request=request)
        return attendance

    @staticmethod
    @transaction.atomic
    def create_leave(*, data, actor, request=None):
        employee = data["employee"]
        if data["duration"] != LeaveRequest.Duration.FULL_DAY and data["start_date"] != data["end_date"]:
            raise ValidationError({"duration": "Half-day leave must have the same start and end date."})
        days = Decimal("0.5") if data["duration"] != LeaveRequest.Duration.FULL_DAY else Decimal((data["end_date"] - data["start_date"]).days + 1)
        if days <= 0:
            raise ValidationError({"end_date": "End date must be same or after start date."})
        if LeaveRequest.objects.filter(employee=employee, is_deleted=False, start_date__lte=data["end_date"], end_date__gte=data["start_date"]).exclude(status__in=[LeaveRequest.Status.REJECTED, LeaveRequest.Status.CANCELLED]).exists():
            raise ValidationError({"start_date": "An active leave or WFH request already overlaps this date range."})
        if data["leave_type"] != LeaveRequest.LeaveType.WORK_FROM_HOME:
            used = LeaveRequest.objects.filter(employee=employee, leave_type=data["leave_type"], status=LeaveRequest.Status.APPROVED, is_deleted=False).aggregate(total=models.Sum("days")).get("total") or Decimal("0")
            remaining = LEAVE_LIMITS.get(data["leave_type"], Decimal("0")) - used
            if days > remaining:
                raise ValidationError({"days": f"Only {remaining} day(s) are available."})
        leave = LeaveRequest.objects.create(
            employee=employee,
            leave_type=data["leave_type"],
            start_date=data["start_date"],
            end_date=data["end_date"],
            days=days,
            duration=data["duration"],
            reason=data["reason"].strip(),
            status=LeaveRequest.Status.MANAGER_REVIEW,
            approver=employee.manager_name,
            payroll_impact=LeaveRequest.PayrollImpact.NO_IMPACT if data["leave_type"] == LeaveRequest.LeaveType.WORK_FROM_HOME else LeaveRequest.PayrollImpact.PAID,
            created_by=actor,
            updated_by=actor,
        )
        record_audit_log(actor=actor, module="hrms", action="leave_create", entity_type="LeaveRequest", entity_id=leave.id, request=request)
        return leave

    @staticmethod
    @transaction.atomic
    def update_leave_status(*, leave, action, actor, request=None):
        if action == "cancel":
            if leave.status in {LeaveRequest.Status.APPROVED, LeaveRequest.Status.REJECTED, LeaveRequest.Status.CANCELLED}:
                raise ValidationError({"status": "This leave request cannot be cancelled."})
            leave.status = LeaveRequest.Status.CANCELLED
            leave.approver = "Employee/HR"
            leave.decision_note = "Request cancelled"
        elif action == "reject":
            if leave.status not in {LeaveRequest.Status.PENDING, LeaveRequest.Status.MANAGER_REVIEW, LeaveRequest.Status.HR_REVIEW}:
                raise ValidationError({"status": "Only pending leave requests can be rejected."})
            leave.status = LeaveRequest.Status.REJECTED
            leave.approver = "HR Team"
            leave.decision_note = "Rejected during approval review"
        elif action == "advance":
            if leave.status in {LeaveRequest.Status.PENDING, LeaveRequest.Status.MANAGER_REVIEW}:
                leave.status = LeaveRequest.Status.HR_REVIEW
                leave.approver = "HR Team"
                leave.decision_note = "Manager approved"
            elif leave.status == LeaveRequest.Status.HR_REVIEW:
                used = Decimal("0") if leave.leave_type == LeaveRequest.LeaveType.WORK_FROM_HOME else LeaveRequest.objects.filter(employee=leave.employee, leave_type=leave.leave_type, status=LeaveRequest.Status.APPROVED, is_deleted=False).exclude(id=leave.id).aggregate(total=models.Sum("days")).get("total") or Decimal("0")
                leave.payroll_impact = LeaveRequest.PayrollImpact.NO_IMPACT if leave.leave_type == LeaveRequest.LeaveType.WORK_FROM_HOME else (LeaveRequest.PayrollImpact.PAID if used + leave.days <= LEAVE_LIMITS.get(leave.leave_type, Decimal("0")) else LeaveRequest.PayrollImpact.UNPAID)
                leave.status = LeaveRequest.Status.APPROVED
                leave.approver = "HR Team"
                leave.decision_note = "HR approved and synced to attendance"
                HRMSService.sync_leave_attendance(leave=leave, actor=actor)
            else:
                raise ValidationError({"status": "Leave request is not in an approvable state."})
        else:
            raise ValidationError({"action": "Unsupported leave action."})
        leave.updated_by = actor
        leave.save()
        record_audit_log(actor=actor, module="hrms", action=f"leave_{action}", entity_type="LeaveRequest", entity_id=leave.id, request=request)
        NotificationService.create_event(
            actor=actor,
            title=f"Leave {action}: {leave.employee.user.get_full_name() or leave.employee.user.email or leave.employee.user.mobile}",
            message=f"{leave.get_leave_type_display()} leave is now {leave.get_status_display().lower()}.",
            notification_type="HRMS",
            priority="Medium",
            target_module="People Operations",
            entity_type="LeaveRequest",
            entity_id=leave.id,
            is_broadcast=True,
            request=request,
        )
        return leave

    @staticmethod
    def sync_leave_attendance(*, leave, actor):
        for current_date in _date_range(leave.start_date, leave.end_date):
            attendance, _ = AttendanceRecord.objects.get_or_create(
                employee=leave.employee,
                date=current_date,
                defaults={"shift": "10:00 - 19:00", "created_by": actor},
            )
            attendance.check_in = None
            attendance.check_out = None
            attendance.mode = AttendanceRecord.Mode.REMOTE if leave.leave_type == LeaveRequest.LeaveType.WORK_FROM_HOME else attendance.mode
            attendance.status = AttendanceRecord.Status.PRESENT if leave.leave_type == LeaveRequest.LeaveType.WORK_FROM_HOME else AttendanceRecord.Status.LEAVE
            attendance.billable_hours = Decimal("8") if leave.leave_type == LeaveRequest.LeaveType.WORK_FROM_HOME and leave.duration == LeaveRequest.Duration.FULL_DAY else Decimal("4") if leave.leave_type == LeaveRequest.LeaveType.WORK_FROM_HOME else Decimal("0")
            attendance.overtime_hours = Decimal("0")
            attendance.approval_status = AttendanceRecord.ApprovalStatus.APPROVED
            attendance.payroll_impact = AttendanceRecord.PayrollImpact.NON_PAYABLE if leave.payroll_impact == LeaveRequest.PayrollImpact.UNPAID else AttendanceRecord.PayrollImpact.PAYABLE
            attendance.note = f"{leave.get_leave_type_display()} approved ({leave.get_duration_display()})"
            attendance.updated_by = actor
            attendance.save()

    @staticmethod
    def payroll_readiness(*, employee, month):
        year, month_number = [int(part) for part in month.split("-")]
        start = date(year, month_number, 1)
        end = date(year, month_number, monthrange(year, month_number)[1])
        attendance_blockers = AttendanceRecord.objects.filter(employee=employee, date__gte=start, date__lte=end, is_deleted=False).filter(models.Q(approval_status=AttendanceRecord.ApprovalStatus.PENDING) | models.Q(payroll_impact=AttendanceRecord.PayrollImpact.REVIEW) | models.Q(status=AttendanceRecord.Status.MISSING_PUNCH))
        leave_blockers = LeaveRequest.objects.filter(employee=employee, start_date__lte=end, end_date__gte=start, status__in=[LeaveRequest.Status.PENDING, LeaveRequest.Status.MANAGER_REVIEW, LeaveRequest.Status.HR_REVIEW], is_deleted=False)
        unpaid_days = LeaveRequest.objects.filter(employee=employee, start_date__lte=end, end_date__gte=start, status=LeaveRequest.Status.APPROVED, payroll_impact=LeaveRequest.PayrollImpact.UNPAID, is_deleted=False).aggregate(total=models.Sum("days")).get("total") or Decimal("0")
        if attendance_blockers.exists():
            return PayrollRecord.Readiness.ATTENDANCE_REVIEW, f"{attendance_blockers.count()} attendance issue(s) pending", unpaid_days
        if leave_blockers.exists():
            return PayrollRecord.Readiness.LEAVE_REVIEW, f"{leave_blockers.count()} leave request(s) pending", unpaid_days
        return PayrollRecord.Readiness.READY, "", unpaid_days

    @staticmethod
    @transaction.atomic
    def create_payroll(*, data, actor, request=None):
        employee = data["employee"]
        if PayrollRecord.objects.filter(employee=employee, month=data["month"], is_deleted=False).exists():
            raise ValidationError({"month": "Payroll already exists for this employee and month."})
        gross = sum(data[field] for field in ["basic", "hra", "allowance", "conveyance", "bonus"])
        deductions = sum(data[field] for field in ["pf", "pt", "tds", "advance"])
        if gross <= 0:
            raise ValidationError({"basic": "Gross salary must be greater than zero."})
        readiness, hold_reason, lop_days = HRMSService.payroll_readiness(employee=employee, month=data["month"])
        lop_deduction = ((data["basic"] / Decimal(data["working_days"])) * lop_days).quantize(Decimal("1"), rounding=ROUND_HALF_UP) if lop_days else Decimal("0")
        if deductions + lop_deduction > gross:
            raise ValidationError({"advance": "Total deductions including loss of pay cannot exceed gross salary."})
        payroll = PayrollRecord.objects.create(
            employee=employee,
            month=data["month"],
            basic=data["basic"],
            hra=data["hra"],
            allowance=data["allowance"],
            conveyance=data["conveyance"],
            bonus=data["bonus"],
            pf=data["pf"],
            pt=data["pt"],
            tds=data["tds"],
            advance=data["advance"],
            working_days=data["working_days"],
            payable_days=Decimal(data["working_days"]) - lop_days,
            lop_days=lop_days,
            lop_deduction=lop_deduction,
            readiness=readiness,
            hold_reason=hold_reason,
            processed_at=timezone.now(),
            status=PayrollRecord.Status.HR_REVIEW if readiness == PayrollRecord.Readiness.READY else PayrollRecord.Status.HOLD,
            created_by=actor,
            updated_by=actor,
        )
        record_audit_log(actor=actor, module="hrms", action="payroll_create", entity_type="PayrollRecord", entity_id=payroll.id, request=request)
        NotificationService.create_event(
            actor=actor,
            title=f"Payroll created: {payroll.employee.user.get_full_name() or payroll.employee.user.email or payroll.employee.user.mobile}",
            message=f"Payroll for {payroll.month} is {payroll.get_status_display().lower()}.",
            notification_type="HRMS",
            priority="Medium",
            target_module="People Operations",
            entity_type="PayrollRecord",
            entity_id=payroll.id,
            is_broadcast=True,
            request=request,
        )
        return payroll

    @staticmethod
    @transaction.atomic
    def update_payroll_status(*, payroll, action, actor, request=None):
        if action == "recheck":
            readiness, hold_reason, lop_days = HRMSService.payroll_readiness(employee=payroll.employee, month=payroll.month)
            payroll.readiness = readiness
            payroll.hold_reason = hold_reason
            payroll.lop_days = lop_days
            payroll.payable_days = Decimal(payroll.working_days) - lop_days
            payroll.lop_deduction = ((payroll.basic / Decimal(payroll.working_days)) * lop_days).quantize(Decimal("1"), rounding=ROUND_HALF_UP) if lop_days else Decimal("0")
        elif action == "hold":
            if payroll.status == PayrollRecord.Status.HOLD:
                raise ValidationError({"status": "Payroll is already on hold."})
            if payroll.status == PayrollRecord.Status.PAID:
                raise ValidationError({"status": "Paid payroll cannot be placed on hold."})
            payroll.status = PayrollRecord.Status.HOLD
            payroll.hold_reason = payroll.hold_reason or "Manually held for finance review"
        elif action == "release":
            if payroll.readiness != PayrollRecord.Readiness.READY:
                raise ValidationError({"readiness": "Payroll can be released only when readiness is Ready."})
            payroll.status = PayrollRecord.Status.HR_REVIEW
            payroll.hold_reason = ""
        elif action == "advance":
            if payroll.readiness != PayrollRecord.Readiness.READY:
                payroll.status = PayrollRecord.Status.HOLD
                payroll.hold_reason = payroll.hold_reason or "Attendance or leave reconciliation pending"
            elif payroll.status in {PayrollRecord.Status.DRAFT, PayrollRecord.Status.HR_REVIEW}:
                payroll.status = PayrollRecord.Status.FINANCE_REVIEW
            elif payroll.status == PayrollRecord.Status.FINANCE_REVIEW:
                payroll.status = PayrollRecord.Status.APPROVED
            elif payroll.status == PayrollRecord.Status.APPROVED:
                payroll.status = PayrollRecord.Status.PAID
                payroll.processed_at = timezone.now()
            else:
                raise ValidationError({"status": "Payroll cannot be advanced from this status."})
        else:
            raise ValidationError({"action": "Unsupported payroll action."})
        payroll.updated_by = actor
        payroll.save()
        record_audit_log(actor=actor, module="hrms", action=f"payroll_{action}", entity_type="PayrollRecord", entity_id=payroll.id, request=request)
        NotificationService.create_event(
            actor=actor,
            title=f"Payroll {action}: {payroll.employee.user.get_full_name() or payroll.employee.user.email or payroll.employee.user.mobile}",
            message=f"Payroll {payroll.month} moved to {payroll.get_status_display().lower()}.",
            notification_type="HRMS",
            priority="High" if payroll.status == PayrollRecord.Status.PAID else "Medium",
            target_module="People Operations",
            entity_type="PayrollRecord",
            entity_id=payroll.id,
            is_broadcast=True,
            request=request,
        )
        return payroll

    @staticmethod
    def refresh_exit_readiness(exit_case):
        if exit_case.lifecycle_status in {ExitRequest.LifecycleStatus.COMPLETED, ExitRequest.LifecycleStatus.CANCELLED}:
            return
        ready = (
            exit_case.handover == 100
            and exit_case.laptop_recovered
            and exit_case.id_card_recovered
            and exit_case.access_revoked
            and exit_case.manager_clearance
            and exit_case.hr_clearance
            and exit_case.finance_clearance
            and exit_case.it_clearance
        )
        exit_case.lifecycle_status = ExitRequest.LifecycleStatus.READY_FOR_FNF if ready else ExitRequest.LifecycleStatus.CLEARANCE
        if ready:
            exit_case.ff_status = ExitRequest.SettlementStatus.IN_PROGRESS

    @staticmethod
    @transaction.atomic
    def create_exit(*, data, actor, request=None):
        employee = data["employee"]
        if data["last_day"] < data["resignation_date"]:
            raise ValidationError({"last_day": "Last working day cannot be before the resignation/exit initiation date."})
        if ExitRequest.objects.filter(employee=employee, is_deleted=False).exclude(lifecycle_status__in=[ExitRequest.LifecycleStatus.COMPLETED, ExitRequest.LifecycleStatus.CANCELLED]).exists():
            raise ValidationError({"employee_id": "An active exit process already exists for this employee."})
        exit_case = ExitRequest.objects.create(
            employee=employee,
            exit_type=data["exit_type"],
            resignation_date=data["resignation_date"],
            last_day=data["last_day"],
            reason=data["reason"].strip(),
            handover_owner=data["handover_owner"].strip(),
            risk=data["risk"],
            created_by=actor,
            updated_by=actor,
        )
        _set_employee_status(employee, EmployeeHRProfile.Status.ON_NOTICE, actor)
        record_audit_log(actor=actor, module="hrms", action="exit_create", entity_type="ExitRequest", entity_id=exit_case.id, request=request)
        NotificationService.create_event(
            actor=actor,
            title=f"Exit started: {employee.user.get_full_name() or employee.user.email or employee.user.mobile}",
            message=f"{employee.user.employee_id} moved to notice period.",
            notification_type="HRMS",
            priority="High",
            target_module="People Operations",
            entity_type="ExitRequest",
            entity_id=exit_case.id,
            is_broadcast=True,
            request=request,
        )
        return exit_case

    @staticmethod
    @transaction.atomic
    def update_exit(*, exit_case, data, actor, request=None):
        if exit_case.lifecycle_status in {ExitRequest.LifecycleStatus.COMPLETED, ExitRequest.LifecycleStatus.CANCELLED}:
            raise ValidationError({"status": "Completed or cancelled exits are locked."})
        for field in ["handover", "laptop_recovered", "id_card_recovered", "access_revoked", "manager_clearance", "hr_clearance", "finance_clearance", "it_clearance"]:
            if field in data:
                setattr(exit_case, field, data[field])
        HRMSService.refresh_exit_readiness(exit_case)
        exit_case.updated_by = actor
        exit_case.save()
        record_audit_log(actor=actor, module="hrms", action="exit_update", entity_type="ExitRequest", entity_id=exit_case.id, request=request)
        NotificationService.create_event(
            actor=actor,
            title=f"Exit updated: {exit_case.employee.user.get_full_name() or exit_case.employee.user.email or exit_case.employee.user.mobile}",
            message=f"Exit checklist updated for {exit_case.employee.user.employee_id}.",
            notification_type="HRMS",
            priority="Medium",
            target_module="People Operations",
            entity_type="ExitRequest",
            entity_id=exit_case.id,
            is_broadcast=True,
            request=request,
        )
        return exit_case

    @staticmethod
    @transaction.atomic
    def close_exit(*, exit_case, action, actor, request=None):
        if action == "cancel":
            if exit_case.lifecycle_status == ExitRequest.LifecycleStatus.COMPLETED:
                raise ValidationError({"status": "Completed exits cannot be cancelled."})
            exit_case.lifecycle_status = ExitRequest.LifecycleStatus.CANCELLED
            exit_case.ff_status = ExitRequest.SettlementStatus.PENDING
            _set_employee_status(exit_case.employee, EmployeeHRProfile.Status.ACTIVE, actor)
        elif action == "complete":
            HRMSService.refresh_exit_readiness(exit_case)
            if exit_case.lifecycle_status != ExitRequest.LifecycleStatus.READY_FOR_FNF:
                raise ValidationError({"status": "Exit can be completed only after all clearances, assets and handover are complete."})
            exit_case.notice = ExitRequest.NoticeStatus.COMPLETED
            exit_case.ff_status = ExitRequest.SettlementStatus.CLEARED
            exit_case.lifecycle_status = ExitRequest.LifecycleStatus.COMPLETED
            exit_case.completed_at = timezone.now()
            _set_employee_status(exit_case.employee, EmployeeHRProfile.Status.EXITED, actor)
        else:
            raise ValidationError({"action": "Unsupported exit action."})
        exit_case.updated_by = actor
        exit_case.save()
        record_audit_log(actor=actor, module="hrms", action=f"exit_{action}", entity_type="ExitRequest", entity_id=exit_case.id, request=request)
        NotificationService.create_event(
            actor=actor,
            title=f"Exit {action}: {exit_case.employee.user.get_full_name() or exit_case.employee.user.email or exit_case.employee.user.mobile}",
            message=f"Exit for {exit_case.employee.user.employee_id} is now {exit_case.lifecycle_status}.",
            notification_type="HRMS",
            priority="High",
            target_module="People Operations",
            entity_type="ExitRequest",
            entity_id=exit_case.id,
            is_broadcast=True,
            request=request,
        )
        return exit_case
