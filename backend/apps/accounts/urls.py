from django.urls import path

from apps.accounts.views import (
    CurrentUserProfileView,
    CurrentUserView,
    LoginHistoryView,
    LoginView,
    LogoutAllView,
    LogoutView,
    RefreshView,
)

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/refresh/", RefreshView.as_view(), name="auth-refresh"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/logout-all/", LogoutAllView.as_view(), name="auth-logout-all"),
    path("auth/me/", CurrentUserView.as_view(), name="auth-me"),
    path("profile/me/", CurrentUserProfileView.as_view(), name="profile-me"),
    path("profile/me/login-history/", LoginHistoryView.as_view(), name="profile-login-history"),
]
