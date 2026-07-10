from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from apps.accounts.models import LoginHistory, Permission, Role, RolePermission, User, UserProfile, UserRole
from apps.accounts.services import SIGNUP_DEPARTMENT_ROLES


class RoleSerializer(serializers.ModelSerializer):
    users = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = ("id", "code", "name", "description", "is_system_role", "is_active", "users", "permissions")

    def get_users(self, obj):
        return obj.user_roles.count()

    def get_permissions(self, obj):
        permission_ids = RolePermission.objects.filter(role=obj).values_list("permission_id", flat=True)
        return PermissionSerializer(Permission.objects.filter(id__in=permission_ids).order_by("module", "action"), many=True).data


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ("id", "code", "name", "module", "action", "description")


class AdminRoleWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120)
    description = serializers.CharField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False)
    permission_codes = serializers.ListField(
        child=serializers.CharField(max_length=120),
        allow_empty=True,
        required=False,
    )

    def validate_name(self, value):
        role = self.context.get("role")
        queryset = Role.objects.filter(name__iexact=value)
        if role:
            queryset = queryset.exclude(id=role.id)
        if queryset.exists():
            raise serializers.ValidationError("A role with this name already exists.")
        return value

    def validate_permission_codes(self, value):
        existing_codes = set(Permission.objects.filter(code__in=value).values_list("code", flat=True))
        missing = sorted(set(value) - existing_codes)
        if missing:
            raise serializers.ValidationError(f"Unknown permission code(s): {', '.join(missing)}")
        return value


class UserSummarySerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()
    active_sessions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "employee_id",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "mobile",
            "department",
            "designation",
            "is_active",
            "is_verified",
            "roles",
            "active_sessions",
        )

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_roles(self, obj):
        role_ids = UserRole.objects.filter(user=obj).values_list("role_id", flat=True)
        return RoleSerializer(Role.objects.filter(id__in=role_ids), many=True).data

    def get_active_sessions(self, obj):
        return obj.sessions.filter(is_active=True).count()


class AdminUserCreateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField()
    mobile = serializers.CharField(max_length=20)
    department = serializers.CharField(max_length=80)
    designation = serializers.CharField(max_length=120, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8, trim_whitespace=False)
    role_codes = serializers.ListField(
        child=serializers.CharField(max_length=80),
        allow_empty=False,
        required=False,
    )

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate_mobile(self, value):
        if not value.isdigit() or len(value) != 10:
            raise serializers.ValidationError("Enter a valid 10-digit mobile number.")
        if User.objects.filter(mobile=value).exists():
            raise serializers.ValidationError("A user with this mobile already exists.")
        return value

    def validate_role_codes(self, value):
        existing_codes = set(Role.objects.filter(code__in=value, is_active=True).values_list("code", flat=True))
        missing = sorted(set(value) - existing_codes)
        if missing:
            raise serializers.ValidationError(f"Unknown or inactive role code(s): {', '.join(missing)}")
        return value


class AdminUserUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField(required=False)
    mobile = serializers.CharField(max_length=20, required=False)
    department = serializers.CharField(max_length=80, required=False)
    designation = serializers.CharField(max_length=120, required=False, allow_blank=True)
    is_verified = serializers.BooleanField(required=False)

    def validate_email(self, value):
        user = self.context["user"]
        if User.objects.filter(email__iexact=value).exclude(id=user.id).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate_mobile(self, value):
        user = self.context["user"]
        if not value.isdigit() or len(value) != 10:
            raise serializers.ValidationError("Enter a valid 10-digit mobile number.")
        if User.objects.filter(mobile=value).exclude(id=user.id).exists():
            raise serializers.ValidationError("A user with this mobile already exists.")
        return value


class RoleAssignmentSerializer(serializers.Serializer):
    role_codes = serializers.ListField(child=serializers.CharField(max_length=80), allow_empty=False)

    def validate_role_codes(self, value):
        existing_codes = set(Role.objects.filter(code__in=value, is_active=True).values_list("code", flat=True))
        missing = sorted(set(value) - existing_codes)
        if missing:
            raise serializers.ValidationError(f"Unknown or inactive role code(s): {', '.join(missing)}")
        return value


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(max_length=160)
    password = serializers.CharField(write_only=True, trim_whitespace=False)


class SignupSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField()
    mobile = serializers.CharField(max_length=20)
    department = serializers.CharField(max_length=80)
    password = serializers.CharField(write_only=True, min_length=8, trim_whitespace=False)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate_mobile(self, value):
        if not value.isdigit() or len(value) != 10:
            raise serializers.ValidationError("Enter a valid 10-digit mobile number.")
        if User.objects.filter(mobile=value).exists():
            raise serializers.ValidationError("A user with this mobile already exists.")
        return value

    def validate_department(self, value):
        if value not in SIGNUP_DEPARTMENT_ROLES:
            raise serializers.ValidationError("Select a valid department category.")
        return value


class LoginResponseSerializer(serializers.Serializer):
    access_token = serializers.CharField()
    refresh_token = serializers.CharField()
    user = UserSummarySerializer()


class RefreshSerializer(serializers.Serializer):
    refresh_token = serializers.CharField()


class LogoutSerializer(serializers.Serializer):
    refresh_token = serializers.CharField()


class ForgotPasswordSerializer(serializers.Serializer):
    identifier = serializers.CharField(max_length=160)


class ResetPasswordSerializer(serializers.Serializer):
    identifier = serializers.CharField(max_length=160)
    otp = serializers.CharField(min_length=6, max_length=6)
    new_password = serializers.CharField(write_only=True, min_length=8, trim_whitespace=False)

    def validate_otp(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("Enter a valid 6-digit OTP.")
        return value

    def validate_new_password(self, value):
        validate_password(value)
        return value


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, min_length=8, trim_whitespace=False)

    def validate_new_password(self, value):
        validate_password(value)
        return value


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = (
            "id",
            "user",
            "profile_photo_file_id",
            "reporting_manager",
            "date_of_joining",
            "office_location",
            "employment_type",
            "employee_status",
            "emergency_contact_name",
            "emergency_contact_mobile",
            "address",
        )
        read_only_fields = ("id", "user", "profile_photo_file_id")


class CurrentUserProfileUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    mobile = serializers.CharField(max_length=20, required=False)
    designation = serializers.CharField(max_length=120, required=False, allow_blank=True)
    department = serializers.CharField(max_length=80, required=False)
    date_of_joining = serializers.DateField(required=False, allow_null=True)
    office_location = serializers.CharField(max_length=160, required=False, allow_blank=True)
    employment_type = serializers.ChoiceField(choices=UserProfile.EmploymentType.choices, required=False)
    employee_status = serializers.ChoiceField(choices=UserProfile.EmployeeStatus.choices, required=False)

    def validate_mobile(self, value):
        user = self.context["user"]
        digits = "".join(char for char in value if char.isdigit())
        if len(digits) == 12 and digits.startswith("91"):
            digits = digits[2:]
        if len(digits) != 10:
            raise serializers.ValidationError("Enter a valid 10-digit mobile number.")
        if User.objects.filter(mobile=digits).exclude(id=user.id).exists():
            raise serializers.ValidationError("A user with this mobile already exists.")
        return digits


class LoginHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginHistory
        fields = (
            "id",
            "identifier",
            "ip_address",
            "browser",
            "os",
            "device",
            "location",
            "login_time",
            "logout_time",
            "status",
            "failure_reason",
            "created_at",
        )
