from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

from apps.core.models import BaseModel, TimeStampedModel, UUIDModel


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, mobile, password, **extra_fields):
        if not email and not mobile:
            raise ValueError("Email or mobile is required.")
        email = self.normalize_email(email) if email else ""
        user = self.model(email=email, mobile=mobile or "", **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email=None, mobile=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, mobile, password, **extra_fields)

    def create_superuser(self, email=None, mobile=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_verified", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self._create_user(email, mobile, password, **extra_fields)


class User(AbstractUser):
    username = None
    employee_id = models.CharField(max_length=40, unique=True, null=True, blank=True)
    email = models.EmailField(unique=True, null=True, blank=True)
    mobile = models.CharField(max_length=20, unique=True, null=True, blank=True)
    department = models.CharField(max_length=80, blank=True)
    designation = models.CharField(max_length=120, blank=True)
    is_verified = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        db_table = "users"
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["mobile"]),
            models.Index(fields=["employee_id"]),
            models.Index(fields=["department"]),
        ]

    def __str__(self) -> str:
        return self.get_full_name() or self.email or self.mobile or str(self.pk)


class Role(UUIDModel, TimeStampedModel):
    code = models.CharField(max_length=80, unique=True)
    name = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    is_system_role = models.BooleanField(default=False)

    class Meta:
        db_table = "roles"
        indexes = [models.Index(fields=["code"]), models.Index(fields=["name"])]

    def __str__(self) -> str:
        return self.name


class Permission(UUIDModel, TimeStampedModel):
    code = models.CharField(max_length=120, unique=True)
    name = models.CharField(max_length=140)
    module = models.CharField(max_length=80, db_index=True)
    action = models.CharField(max_length=80, db_index=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "permissions"
        indexes = [
            models.Index(fields=["module", "action"]),
            models.Index(fields=["code"]),
        ]

    def __str__(self) -> str:
        return self.code


class RolePermission(UUIDModel, TimeStampedModel):
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="role_permissions")
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, related_name="role_permissions")

    class Meta:
        db_table = "role_permissions"
        constraints = [
            models.UniqueConstraint(fields=["role", "permission"], name="unique_role_permission"),
        ]


class UserRole(UUIDModel, TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user_roles")
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="user_roles")
    assigned_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="assigned_roles")
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_roles"
        constraints = [
            models.UniqueConstraint(fields=["user", "role"], name="unique_user_role"),
        ]


class UserProfile(BaseModel):
    class EmploymentType(models.TextChoices):
        INTERN = "Intern", "Intern"
        FULL_TIME = "Full-Time", "Full-Time"
        CONTRACT = "Contract", "Contract"

    class EmployeeStatus(models.TextChoices):
        ACTIVE = "Active", "Active"
        INACTIVE = "Inactive", "Inactive"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    profile_photo_file_id = models.UUIDField(null=True, blank=True)
    reporting_manager = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="reporting_members")
    date_of_joining = models.DateField(null=True, blank=True)
    office_location = models.CharField(max_length=160, blank=True)
    employment_type = models.CharField(max_length=40, choices=EmploymentType.choices, default=EmploymentType.FULL_TIME)
    employee_status = models.CharField(max_length=40, choices=EmployeeStatus.choices, default=EmployeeStatus.ACTIVE)
    emergency_contact_name = models.CharField(max_length=140, blank=True)
    emergency_contact_mobile = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)

    class Meta:
        db_table = "user_profiles"


class UserSession(UUIDModel, TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sessions")
    refresh_token_hash = models.CharField(max_length=255, db_index=True)
    device_name = models.CharField(max_length=160, blank=True)
    browser = models.CharField(max_length=120, blank=True)
    os = models.CharField(max_length=120, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    expires_at = models.DateTimeField(db_index=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "user_sessions"
        indexes = [models.Index(fields=["user", "is_active"]), models.Index(fields=["expires_at"])]


class LoginHistory(UUIDModel, TimeStampedModel):
    class LoginStatus(models.TextChoices):
        SUCCESS = "Success", "Success"
        FAILED = "Failed", "Failed"
        LOGOUT = "Logout", "Logout"

    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="login_history")
    identifier = models.CharField(max_length=160, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    browser = models.CharField(max_length=120, blank=True)
    os = models.CharField(max_length=120, blank=True)
    device = models.CharField(max_length=120, blank=True)
    location = models.CharField(max_length=160, blank=True)
    login_time = models.DateTimeField(null=True, blank=True, db_index=True)
    logout_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=40, choices=LoginStatus.choices, db_index=True)
    failure_reason = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "login_history"
        indexes = [models.Index(fields=["identifier", "status"]), models.Index(fields=["login_time"])]


class PasswordResetRequest(UUIDModel, TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="password_reset_requests")
    otp_hash = models.CharField(max_length=255)
    expires_at = models.DateTimeField(db_index=True)
    is_used = models.BooleanField(default=False, db_index=True)
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "password_reset_requests"
        indexes = [models.Index(fields=["user", "is_used", "expires_at"])]

# Create your models here.
