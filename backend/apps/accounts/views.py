from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import LoginHistory, UserProfile
from apps.accounts.serializers import (
    LoginHistorySerializer,
    LoginSerializer,
    LogoutSerializer,
    UserProfileSerializer,
    UserSummarySerializer,
)
from apps.accounts.services import AuthService
from apps.core.responses import success_response


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = AuthService.login(
            identifier=serializer.validated_data["identifier"],
            password=serializer.validated_data["password"],
            request=request,
        )
        return success_response(
            data={
                "access_token": result["access_token"],
                "refresh_token": result["refresh_token"],
                "user": UserSummarySerializer(result["user"]).data,
            },
            message="Login successful",
            status_code=status.HTTP_200_OK,
        )


class RefreshView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refresh_token")
        refresh = RefreshToken(refresh_token)
        return success_response(
            data={"access_token": str(refresh.access_token)},
            message="Token refreshed",
        )


class LogoutView(APIView):
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        AuthService.logout(user=request.user, refresh_token=serializer.validated_data["refresh_token"], request=request)
        return success_response(message="Logout successful")


class LogoutAllView(APIView):
    def post(self, request):
        AuthService.logout_all(user=request.user, request=request)
        return success_response(message="All sessions logged out")


class CurrentUserView(APIView):
    def get(self, request):
        return success_response(data=UserSummarySerializer(request.user).data)


class CurrentUserProfileView(APIView):
    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        return success_response(data=UserProfileSerializer(profile).data)

    def put(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return success_response(data=serializer.data, message="Profile updated")


class LoginHistoryView(APIView):
    def get(self, request):
        rows = LoginHistory.objects.filter(user=request.user).order_by("-created_at")[:20]
        return success_response(data=LoginHistorySerializer(rows, many=True).data)
