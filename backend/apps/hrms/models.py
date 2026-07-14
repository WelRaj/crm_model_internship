from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.models import BaseModel


class EmployeeHRProfile(BaseModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        PROBATION = "probation", "Probation"
        TRAINING = "training", "Training"
        ON_NOTICE = "on_notice", "On Notice"
        EXITED = "exited", "Exited"
        ARCHIVED = "archived", "Archived"

    class KycStatus(models.TextChoices):
        COMPLETE = "complete", "Complete"
        PENDING = "pending", "Pending"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="hr_profile")
    role = models.CharField(max_length=140)
    team = models.CharField(max_length=100, db_index=True)
    manager_name = models.CharField(max_length=140, blank=True)
    location = models.CharField(max_length=160, blank=True)
    employment_type = models.CharField(max_length=60, default="Full-time")
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    health_score = models.PositiveSmallIntegerField(default=75, validators=[MinValueValidator(0), MaxValueValidator(100)])
    kyc_status = models.CharField(max_length=20, choices=KycStatus.choices, default=KycStatus.PENDING, db_index=True)
    asset_tag = models.CharField(max_length=80, blank=True)

    class Meta:
        db_table = "employees"
        indexes = [
            models.Index(fields=["team", "status"]),
            models.Index(fields=["kyc_status", "status"]),
        ]

    def __str__(self) -> str:
        return f"{self.user.employee_id or self.user_id} - {self.user}"


class AttendanceRecord(BaseModel):
    class Mode(models.TextChoices):
        OFFICE = "office", "Office"
        REMOTE = "remote", "Remote"
        HYBRID = "hybrid", "Hybrid"

    class Status(models.TextChoices):
        PRESENT = "present", "Present"
        LATE = "late", "Late"
        LEAVE = "leave", "Leave"
        MISSING_PUNCH = "missing_punch", "Missing Punch"
        REGULARIZED = "regularized", "Regularized"

    class ApprovalStatus(models.TextChoices):
        AUTO_APPROVED = "auto_approved", "Auto Approved"
        PENDING = "pending_approval", "Pending Approval"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    class PayrollImpact(models.TextChoices):
        PAYABLE = "payable", "Payable"
        NON_PAYABLE = "non_payable", "Non Payable"
        REVIEW = "review", "Review"

    employee = models.ForeignKey(EmployeeHRProfile, on_delete=models.CASCADE, related_name="attendance_records")
    date = models.DateField(db_index=True)
    shift = models.CharField(max_length=40, default="10:00 - 19:00")
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    mode = models.CharField(max_length=20, choices=Mode.choices, default=Mode.OFFICE)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.REGULARIZED, db_index=True)
    billable_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    overtime_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    approval_status = models.CharField(max_length=30, choices=ApprovalStatus.choices, default=ApprovalStatus.PENDING, db_index=True)
    payroll_impact = models.CharField(max_length=30, choices=PayrollImpact.choices, default=PayrollImpact.REVIEW, db_index=True)
    note = models.TextField(blank=True)

    class Meta:
        db_table = "attendance"
        constraints = [
            models.UniqueConstraint(fields=["employee", "date"], name="unique_employee_attendance_date"),
        ]
        indexes = [
            models.Index(fields=["date", "status"]),
            models.Index(fields=["employee", "date"]),
            models.Index(fields=["approval_status", "payroll_impact"]),
        ]


class LeaveRequest(BaseModel):
    class LeaveType(models.TextChoices):
        EARNED = "earned_leave", "Earned Leave"
        SICK = "sick_leave", "Sick Leave"
        CASUAL = "casual_leave", "Casual Leave"
        WORK_FROM_HOME = "work_from_home", "Work From Home"
        COMP_OFF = "comp_off", "Comp Off"

    class Duration(models.TextChoices):
        FULL_DAY = "full_day", "Full Day"
        FIRST_HALF = "first_half", "First Half"
        SECOND_HALF = "second_half", "Second Half"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        MANAGER_REVIEW = "manager_review", "Manager Review"
        HR_REVIEW = "hr_review", "HR Review"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        CANCELLED = "cancelled", "Cancelled"

    class PayrollImpact(models.TextChoices):
        PAID = "paid", "Paid"
        UNPAID = "unpaid", "Unpaid"
        NO_IMPACT = "no_impact", "No Impact"

    employee = models.ForeignKey(EmployeeHRProfile, on_delete=models.CASCADE, related_name="leave_requests")
    leave_type = models.CharField(max_length=30, choices=LeaveType.choices, db_index=True)
    start_date = models.DateField(db_index=True)
    end_date = models.DateField(db_index=True)
    days = models.DecimalField(max_digits=5, decimal_places=1)
    duration = models.CharField(max_length=20, choices=Duration.choices, default=Duration.FULL_DAY)
    reason = models.TextField()
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.MANAGER_REVIEW, db_index=True)
    approver = models.CharField(max_length=140, blank=True)
    payroll_impact = models.CharField(max_length=30, choices=PayrollImpact.choices, default=PayrollImpact.PAID)
    applied_at = models.DateTimeField(auto_now_add=True, db_index=True)
    decision_note = models.TextField(blank=True)

    class Meta:
        db_table = "leave_requests"
        indexes = [
            models.Index(fields=["employee", "status"]),
            models.Index(fields=["start_date", "end_date"]),
            models.Index(fields=["leave_type", "status"]),
        ]


class PayrollRecord(BaseModel):
    class Readiness(models.TextChoices):
        READY = "ready", "Ready"
        ATTENDANCE_REVIEW = "attendance_review", "Attendance Review"
        LEAVE_REVIEW = "leave_review", "Leave Review"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        HR_REVIEW = "hr_review", "HR Review"
        FINANCE_REVIEW = "finance_review", "Finance Review"
        APPROVED = "approved", "Approved"
        PAID = "paid", "Paid"
        HOLD = "hold", "Hold"

    employee = models.ForeignKey(EmployeeHRProfile, on_delete=models.CASCADE, related_name="payroll_records")
    month = models.CharField(max_length=7, db_index=True)
    basic = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    hra = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    conveyance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    bonus = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    pf = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    pt = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tds = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    advance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    working_days = models.PositiveSmallIntegerField(default=26, validators=[MinValueValidator(1), MaxValueValidator(31)])
    payable_days = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    lop_days = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    lop_deduction = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    readiness = models.CharField(max_length=30, choices=Readiness.choices, default=Readiness.READY, db_index=True)
    hold_reason = models.TextField(blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.DRAFT, db_index=True)

    class Meta:
        db_table = "payroll_records"
        constraints = [
            models.UniqueConstraint(fields=["employee", "month"], name="unique_employee_payroll_month"),
        ]
        indexes = [
            models.Index(fields=["month", "status"]),
            models.Index(fields=["readiness", "status"]),
        ]


class ExitRequest(BaseModel):
    class ExitType(models.TextChoices):
        RESIGNATION = "resignation", "Resignation"
        TERMINATION = "termination", "Termination"
        CONTRACT_END = "contract_end", "Contract End"
        RETIREMENT = "retirement", "Retirement"

    class NoticeStatus(models.TextChoices):
        SERVING = "serving", "Serving"
        FINAL_WEEK = "final_week", "Final Week"
        COMPLETED = "completed", "Completed"

    class Risk(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    class SettlementStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        IN_PROGRESS = "in_progress", "In Progress"
        CLEARED = "cleared", "Cleared"

    class LifecycleStatus(models.TextChoices):
        INITIATED = "initiated", "Initiated"
        CLEARANCE = "clearance", "Clearance"
        READY_FOR_FNF = "ready_for_fnf", "Ready for F&F"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    employee = models.ForeignKey(EmployeeHRProfile, on_delete=models.CASCADE, related_name="exit_requests")
    exit_type = models.CharField(max_length=30, choices=ExitType.choices)
    resignation_date = models.DateField(db_index=True)
    last_day = models.DateField(db_index=True)
    reason = models.TextField()
    notice = models.CharField(max_length=30, choices=NoticeStatus.choices, default=NoticeStatus.SERVING)
    handover = models.PositiveSmallIntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    handover_owner = models.CharField(max_length=140)
    risk = models.CharField(max_length=20, choices=Risk.choices, default=Risk.LOW, db_index=True)
    laptop_recovered = models.BooleanField(default=False)
    id_card_recovered = models.BooleanField(default=False)
    access_revoked = models.BooleanField(default=False)
    manager_clearance = models.BooleanField(default=False)
    hr_clearance = models.BooleanField(default=False)
    finance_clearance = models.BooleanField(default=False)
    it_clearance = models.BooleanField(default=False)
    ff_status = models.CharField(max_length=30, choices=SettlementStatus.choices, default=SettlementStatus.PENDING, db_index=True)
    lifecycle_status = models.CharField(max_length=30, choices=LifecycleStatus.choices, default=LifecycleStatus.INITIATED, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "exit_requests"
        indexes = [
            models.Index(fields=["employee", "lifecycle_status"]),
            models.Index(fields=["last_day", "risk"]),
        ]
