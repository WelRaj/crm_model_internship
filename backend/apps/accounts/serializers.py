from rest_framework import serializers

from apps.accounts.models import LoginHistory, Role, User, UserProfile, UserRole


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


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(max_length=160)
    password = serializers.CharField(write_only=True, trim_whitespace=False)


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
