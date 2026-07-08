from django.db.models import Q

from apps.accounts.models import User


def get_user_by_identifier(identifier: str):
    return User.objects.filter(Q(email__iexact=identifier) | Q(mobile=identifier)).first()
