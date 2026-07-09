from django.db.models import Q

from apps.accounts.models import User, UserRole


def get_user_by_identifier(identifier: str):
    return User.objects.filter(Q(email__iexact=identifier) | Q(mobile=identifier)).first()


def get_users_queryset():
    return User.objects.prefetch_related("user_roles__role").order_by("-date_joined")


def user_has_admin_access(user):
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    return UserRole.objects.filter(user=user, role__code__in=["super_admin", "admin"], role__is_active=True).exists()
