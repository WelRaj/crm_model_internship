from rest_framework.permissions import BasePermission

from apps.accounts.selectors import user_has_admin_access


class IsAccountsAdmin(BasePermission):
    message = "Admin access is required."

    def has_permission(self, request, view):
        return user_has_admin_access(request.user)


class IsAccountsSuperAdmin(BasePermission):
    message = "Super admin access is required."

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        if getattr(user, "is_superuser", False):
            return True
        return user.user_roles.filter(role__code="super_admin", role__is_active=True).exists()
