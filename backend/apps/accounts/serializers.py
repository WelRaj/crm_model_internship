from rest_framework import serializers

from apps.accounts.models import LoginHistory, Role, User, UserProfile, UserRole
from apps.accounts.services import SIGNUP_DEPARTMENT_ROLES


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ("id", "code", "name", "description")


class UserSummarySerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()

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
        )

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_roles(self, obj):
        role_ids = UserRole.objects.filter(user=obj).values_list("role_id", flat=True)
        return RoleSerializer(Role.objects.filter(id__in=role_ids), many=True).data


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
        existing_codes = set(Role.objects.filter(code__in=value).values_list("code", flat=True))
        missing = sorted(set(value) - existing_codes)
        if missing:
            raise serializers.ValidationError(f"Unknown role code(s): {', '.join(missing)}")
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
        existing_codes = set(Role.objects.filter(code__in=value).values_list("code", flat=True))
        missing = sorted(set(value) - existing_codes)
        if missing:
            raise serializers.ValidationError(f"Unknown role code(s): {', '.join(missing)}")
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
