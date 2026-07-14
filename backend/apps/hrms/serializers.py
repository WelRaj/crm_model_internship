from decimal import Decimal

from rest_framework import serializers

from apps.accounts.serializers import UserSummarySerializer
from apps.hrms.models import AttendanceRecord, EmployeeHRProfile, ExitRequest, LeaveRequest, PayrollRecord


class EmployeeHRProfileSerializer(serializers.ModelSerializer):
    user_detail = UserSummarySerializer(source="user", read_only=True)
    employee_id = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    mobile = serializers.SerializerMethodField()
    joined = serializers.SerializerMethodField()
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    kyc_status_label = serializers.CharField(source="get_kyc_status_display", read_only=True)

    class Meta:
        model = EmployeeHRProfile
        fields = (
            "id",
            "user",
            "user_detail",
            "employee_id",
            "name",
            "email",
            "mobile",
            "joined",
            "role",
            "team",
            "manager_name",
            "location",
            "employment_type",
            "status",
            "status_label",
            "health_score",
            "kyc_status",
            "kyc_status_label",
            "asset_tag",
            "created_at",
            "updated_at",
        )

    def get_employee_id(self, obj):
        return obj.user.employee_id or ""

    def get_name(self, obj):
        return obj.user.get_full_name()

    def get_email(self, obj):
        return obj.user.email or ""

    def get_mobile(self, obj):
        return obj.user.mobile or ""

    def get_joined(self, obj):
        profile = getattr(obj.user, "profile", None)
        return profile.date_of_joining if profile else None


class EmployeeHRProfileWriteSerializer(serializers.Serializer):
    employee_id = serializers.CharField(max_length=40)
    name = serializers.CharField(max_length=180)
    role = serializers.CharField(max_length=140)
    team = serializers.CharField(max_length=100)
    manager_name = serializers.CharField(max_length=140, required=False, allow_blank=True)
    location = serializers.CharField(max_length=160, required=False, allow_blank=True)
    employment_type = serializers.CharField(max_length=60, default="Full-time")
    status = serializers.ChoiceField(choices=EmployeeHRProfile.Status.choices, default=EmployeeHRProfile.Status.ACTIVE)
    health_score = serializers.IntegerField(min_value=0, max_value=100, default=75)
    email = serializers.EmailField()
    mobile = serializers.CharField(max_length=20)
    joined = serializers.DateField(required=False, allow_null=True)
    kyc_status = serializers.ChoiceField(choices=EmployeeHRProfile.KycStatus.choices, default=EmployeeHRProfile.KycStatus.PENDING)
    asset_tag = serializers.CharField(max_length=80, required=False, allow_blank=True)
    password = serializers.CharField(min_length=8, required=False, allow_blank=True, write_only=True)

    def validate_mobile(self, value):
        digits = value.replace(" ", "").replace("+91", "").replace("-", "")
        if not digits.isdigit() or len(digits) != 10:
            raise serializers.ValidationError("Enter a valid 10-digit mobile number.")
        return digits


class AttendanceRecordSerializer(serializers.ModelSerializer):
    employee_detail = EmployeeHRProfileSerializer(source="employee", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    mode_label = serializers.CharField(source="get_mode_display", read_only=True)
    approval_status_label = serializers.CharField(source="get_approval_status_display", read_only=True)
    payroll_impact_label = serializers.CharField(source="get_payroll_impact_display", read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = (
            "id",
            "employee",
            "employee_detail",
            "date",
            "shift",
            "check_in",
            "check_out",
            "mode",
            "mode_label",
            "status",
            "status_label",
            "billable_hours",
            "overtime_hours",
            "approval_status",
            "approval_status_label",
            "payroll_impact",
            "payroll_impact_label",
            "note",
            "created_at",
            "updated_at",
        )


class AttendanceWriteSerializer(serializers.Serializer):
    employee_id = serializers.UUIDField()
    date = serializers.DateField()
    check_in = serializers.TimeField()
    check_out = serializers.TimeField()
    mode = serializers.ChoiceField(choices=AttendanceRecord.Mode.choices, default=AttendanceRecord.Mode.OFFICE)
    note = serializers.CharField(max_length=500)

    def validate_employee_id(self, value):
        try:
            return EmployeeHRProfile.objects.select_related("user").get(id=value, is_deleted=False)
        except EmployeeHRProfile.DoesNotExist as exc:
            raise serializers.ValidationError("Employee does not exist.") from exc

    def validate(self, attrs):
        attrs["employee"] = attrs.pop("employee_id")
        return attrs


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_detail = EmployeeHRProfileSerializer(source="employee", read_only=True)
    leave_type_label = serializers.CharField(source="get_leave_type_display", read_only=True)
    duration_label = serializers.CharField(source="get_duration_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    payroll_impact_label = serializers.CharField(source="get_payroll_impact_display", read_only=True)

    class Meta:
        model = LeaveRequest
        fields = (
            "id",
            "employee",
            "employee_detail",
            "leave_type",
            "leave_type_label",
            "start_date",
            "end_date",
            "days",
            "duration",
            "duration_label",
            "reason",
            "status",
            "status_label",
            "approver",
            "payroll_impact",
            "payroll_impact_label",
            "applied_at",
            "decision_note",
            "created_at",
            "updated_at",
        )


class LeaveRequestWriteSerializer(serializers.Serializer):
    employee_id = serializers.UUIDField()
    leave_type = serializers.ChoiceField(choices=LeaveRequest.LeaveType.choices)
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    duration = serializers.ChoiceField(choices=LeaveRequest.Duration.choices, default=LeaveRequest.Duration.FULL_DAY)
    reason = serializers.CharField(max_length=500)

    def validate_employee_id(self, value):
        try:
            return EmployeeHRProfile.objects.get(id=value, is_deleted=False)
        except EmployeeHRProfile.DoesNotExist as exc:
            raise serializers.ValidationError("Employee does not exist.") from exc

    def validate(self, attrs):
        attrs["employee"] = attrs.pop("employee_id")
        return attrs


class PayrollRecordSerializer(serializers.ModelSerializer):
    employee_detail = EmployeeHRProfileSerializer(source="employee", read_only=True)
    readiness_label = serializers.CharField(source="get_readiness_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    gross = serializers.SerializerMethodField()
    deductions = serializers.SerializerMethodField()
    net = serializers.SerializerMethodField()

    class Meta:
        model = PayrollRecord
        fields = (
            "id",
            "employee",
            "employee_detail",
            "month",
            "basic",
            "hra",
            "allowance",
            "conveyance",
            "bonus",
            "pf",
            "pt",
            "tds",
            "advance",
            "working_days",
            "payable_days",
            "lop_days",
            "lop_deduction",
            "gross",
            "deductions",
            "net",
            "readiness",
            "readiness_label",
            "hold_reason",
            "processed_at",
            "status",
            "status_label",
            "created_at",
            "updated_at",
        )

    def get_gross(self, obj):
        return str(obj.basic + obj.hra + obj.allowance + obj.conveyance + obj.bonus)

    def get_deductions(self, obj):
        return str(obj.pf + obj.pt + obj.tds + obj.advance + obj.lop_deduction)

    def get_net(self, obj):
        return str((obj.basic + obj.hra + obj.allowance + obj.conveyance + obj.bonus) - (obj.pf + obj.pt + obj.tds + obj.advance + obj.lop_deduction))


class PayrollRecordWriteSerializer(serializers.Serializer):
    employee_id = serializers.UUIDField()
    month = serializers.RegexField(regex=r"^\d{4}-\d{2}$")
    basic = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0"))
    hra = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0"))
    allowance = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0"))
    conveyance = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0"))
    bonus = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0"), default=Decimal("0"))
    pf = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0"), default=Decimal("0"))
    pt = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0"), default=Decimal("0"))
    tds = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0"), default=Decimal("0"))
    advance = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0"), default=Decimal("0"))
    working_days = serializers.IntegerField(min_value=1, max_value=31)

    def validate_employee_id(self, value):
        try:
            return EmployeeHRProfile.objects.get(id=value, is_deleted=False)
        except EmployeeHRProfile.DoesNotExist as exc:
            raise serializers.ValidationError("Employee does not exist.") from exc

    def validate(self, attrs):
        attrs["employee"] = attrs.pop("employee_id")
        return attrs


class ExitRequestSerializer(serializers.ModelSerializer):
    employee_detail = EmployeeHRProfileSerializer(source="employee", read_only=True)
    exit_type_label = serializers.CharField(source="get_exit_type_display", read_only=True)
    notice_label = serializers.CharField(source="get_notice_display", read_only=True)
    risk_label = serializers.CharField(source="get_risk_display", read_only=True)
    ff_status_label = serializers.CharField(source="get_ff_status_display", read_only=True)
    lifecycle_status_label = serializers.CharField(source="get_lifecycle_status_display", read_only=True)

    class Meta:
        model = ExitRequest
        fields = (
            "id",
            "employee",
            "employee_detail",
            "exit_type",
            "exit_type_label",
            "resignation_date",
            "last_day",
            "reason",
            "notice",
            "notice_label",
            "handover",
            "handover_owner",
            "risk",
            "risk_label",
            "laptop_recovered",
            "id_card_recovered",
            "access_revoked",
            "manager_clearance",
            "hr_clearance",
            "finance_clearance",
            "it_clearance",
            "ff_status",
            "ff_status_label",
            "lifecycle_status",
            "lifecycle_status_label",
            "completed_at",
            "created_at",
            "updated_at",
        )


class ExitRequestWriteSerializer(serializers.Serializer):
    employee_id = serializers.UUIDField()
    exit_type = serializers.ChoiceField(choices=ExitRequest.ExitType.choices)
    resignation_date = serializers.DateField()
    last_day = serializers.DateField()
    handover_owner = serializers.CharField(max_length=140)
    reason = serializers.CharField(max_length=500)
    risk = serializers.ChoiceField(choices=ExitRequest.Risk.choices, default=ExitRequest.Risk.LOW)

    def validate_employee_id(self, value):
        try:
            return EmployeeHRProfile.objects.get(id=value, is_deleted=False)
        except EmployeeHRProfile.DoesNotExist as exc:
            raise serializers.ValidationError("Employee does not exist.") from exc

    def validate(self, attrs):
        attrs["employee"] = attrs.pop("employee_id")
        return attrs


class ExitRequestUpdateSerializer(serializers.Serializer):
    handover = serializers.IntegerField(min_value=0, max_value=100, required=False)
    laptop_recovered = serializers.BooleanField(required=False)
    id_card_recovered = serializers.BooleanField(required=False)
    access_revoked = serializers.BooleanField(required=False)
    manager_clearance = serializers.BooleanField(required=False)
    hr_clearance = serializers.BooleanField(required=False)
    finance_clearance = serializers.BooleanField(required=False)
    it_clearance = serializers.BooleanField(required=False)


class ActionSerializer(serializers.Serializer):
    action = serializers.CharField(max_length=40)
