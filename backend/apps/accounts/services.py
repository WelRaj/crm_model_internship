import hashlib

from django.contrib.auth.models import update_last_login
from django.utils import timezone
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import LoginHistory, UserProfile, UserSession
from apps.accounts.selectors import get_user_by_identifier


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _request_meta(request):
    meta = getattr(request, "META", {})
    return {
        "ip_address": meta.get("REMOTE_ADDR"),
        "user_agent": meta.get("HTTP_USER_AGENT", ""),
    }


class AuthService:
    @staticmethod
    def login(*, identifier: str, password: str, request=None):
        user = get_user_by_identifier(identifier)
        meta = _request_meta(request)

        if not user:
            LoginHistory.objects.create(
                identifier=identifier,
                status=LoginHistory.LoginStatus.FAILED,
                failure_reason="User not found",
                login_time=timezone.now(),
                **meta,
            )
            raise AuthenticationFailed("Invalid login credentials.")

        if not user.check_password(password):
            LoginHistory.objects.create(
                user=user,
                identifier=identifier,
                status=LoginHistory.LoginStatus.FAILED,
                failure_reason="Invalid password",
                login_time=timezone.now(),
                **meta,
            )
            raise AuthenticationFailed("Invalid login credentials.")

        if not user.is_active:
            raise AuthenticationFailed("User account is inactive.")

        update_last_login(None, user)
        refresh = RefreshToken.for_user(user)
        refresh_token = str(refresh)
        access_token = str(refresh.access_token)

        UserSession.objects.create(
            user=user,
            refresh_token_hash=_hash_token(refresh_token),
            ip_address=meta["ip_address"],
            user_agent=meta["user_agent"],
            is_active=True,
            expires_at=timezone.now() + refresh.lifetime,
        )
        LoginHistory.objects.create(
            user=user,
            identifier=identifier,
            status=LoginHistory.LoginStatus.SUCCESS,
            login_time=timezone.now(),
            **meta,
        )
        UserProfile.objects.get_or_create(user=user)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user,
        }

    @staticmethod
    def logout(*, user, refresh_token: str, request=None):
        if not refresh_token:
            raise ValidationError({"refresh_token": "Refresh token is required."})

        token_hash = _hash_token(refresh_token)
        UserSession.objects.filter(user=user, refresh_token_hash=token_hash, is_active=True).update(
            is_active=False,
            revoked_at=timezone.now(),
        )
        LoginHistory.objects.create(
            user=user,
            identifier=user.email or user.mobile or "",
            status=LoginHistory.LoginStatus.LOGOUT,
            logout_time=timezone.now(),
            **_request_meta(request),
        )

        token = RefreshToken(refresh_token)
        token.blacklist()

    @staticmethod
    def logout_all(*, user, request=None):
        UserSession.objects.filter(user=user, is_active=True).update(is_active=False, revoked_at=timezone.now())
        LoginHistory.objects.create(
            user=user,
            identifier=user.email or user.mobile or "",
            status=LoginHistory.LoginStatus.LOGOUT,
            logout_time=timezone.now(),
            **_request_meta(request),
        )
