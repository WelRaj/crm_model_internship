from rest_framework.permissions import BasePermission

from apps.accounts.selectors import user_has_admin_access


class IsAccountsAdmin(BasePermission):
    message = "Admin access is required."

    def has_permission(self, request, view):
        return user_has_admin_access(request.user)
