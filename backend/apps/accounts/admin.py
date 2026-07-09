from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from apps.accounts.models import (
    LoginHistory,
    PasswordResetRequest,
    Permission,
    Role,
    RolePermission,
    User,
    UserProfile,
    UserRole,
    UserSession,
)


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("id", "employee_id", "email", "mobile", "first_name", "last_name", "department", "designation", "is_active")
    list_filter = ("is_active", "is_verified", "department", "is_staff")
    search_fields = ("employee_id", "email", "mobile", "first_name", "last_name")
    ordering = ("email",)
    fieldsets = (
        (None, {"fields": ("email", "mobile", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name", "employee_id", "department", "designation")}),
        ("Permissions", {"fields": ("is_active", "is_verified", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "mobile", "password1", "password2", "is_staff", "is_superuser"),
        }),
    )


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "is_active", "is_system_role", "updated_at")
    list_filter = ("is_active", "is_system_role")
    search_fields = ("code", "name", "description")


admin.site.register(Permission)
admin.site.register(RolePermission)
admin.site.register(UserRole)
admin.site.register(UserProfile)
admin.site.register(UserSession)
admin.site.register(LoginHistory)
admin.site.register(PasswordResetRequest)

# Register your models here.
