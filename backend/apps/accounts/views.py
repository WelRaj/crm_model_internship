from rest_framework import permissions, status
from django.db.models import Q
from rest_framework.generics import get_object_or_404
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import LoginHistory, Permission, Role, User, UserProfile
from apps.accounts.permissions import IsAccountsAdmin
from apps.accounts.serializers import (
    AdminUserCreateSerializer,
    AdminUserUpdateSerializer,
    LoginHistorySerializer,
    LoginSerializer,
    LogoutSerializer,
    AdminRoleWriteSerializer,
    PermissionSerializer,
    RoleAssignmentSerializer,
    RoleSerializer,
    SignupSerializer,
    UserProfileSerializer,
    UserSummarySerializer,
)
from apps.accounts.selectors import get_users_queryset
from apps.accounts.services import AccountAdminService, AuthService
from apps.core.pagination import StandardPagination
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


class SignupView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = AuthService.signup(data=serializer.validated_data, request=request)
        return success_response(
            data=UserSummarySerializer(user).data,
            message="Account created successfully",
            status_code=status.HTTP_201_CREATED,
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


class RoleListView(APIView):
    permission_classes = [IsAccountsAdmin]

    def get(self, request):
        roles = Role.objects.prefetch_related("user_roles", "role_permissions__permission").order_by("name")
        return success_response(data=RoleSerializer(roles, many=True).data)

    def post(self, request):
        serializer = AdminRoleWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role = AccountAdminService.create_role(
            data=serializer.validated_data,
            actor=request.user,
            request=request,
        )
        return success_response(
            data=RoleSerializer(role).data,
            message="Role created successfully",
            status_code=status.HTTP_201_CREATED,
        )


class RoleDetailView(APIView):
    permission_classes = [IsAccountsAdmin]

    def put(self, request, role_id):
        role = get_object_or_404(Role, id=role_id)
        serializer = AdminRoleWriteSerializer(data=request.data, context={"role": role}, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_role = AccountAdminService.update_role(
            role=role,
            data=serializer.validated_data,
            actor=request.user,
            request=request,
        )
        return success_response(data=RoleSerializer(updated_role).data, message="Role updated successfully")


class PermissionListView(APIView):
    permission_classes = [IsAccountsAdmin]

    def get(self, request):
        permissions = Permission.objects.order_by("module", "action")
        return success_response(data=PermissionSerializer(permissions, many=True).data)


class UserListCreateView(APIView):
    permission_classes = [IsAccountsAdmin]

    def get(self, request):
        queryset = get_users_queryset()
        search = request.query_params.get("search")
        status_filter = request.query_params.get("status")

        if search:
            queryset = queryset.filter(
                Q(email__icontains=search)
                | Q(mobile__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(employee_id__icontains=search)
            )

        if status_filter == "active":
            queryset = queryset.filter(is_active=True)
        elif status_filter == "inactive":
            queryset = queryset.filter(is_active=False)

        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset.distinct(), request, view=self)
        serializer = UserSummarySerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = AdminUserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = AccountAdminService.create_user(data=serializer.validated_data, actor=request.user, request=request)
        return success_response(
            data=UserSummarySerializer(user).data,
            message="User created successfully",
            status_code=status.HTTP_201_CREATED,
        )


class UserDetailView(APIView):
    permission_classes = [IsAccountsAdmin]

    def get(self, request, user_id):
        user = get_object_or_404(get_users_queryset(), id=user_id)
        return success_response(data=UserSummarySerializer(user).data)

    def put(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        serializer = AdminUserUpdateSerializer(data=request.data, context={"user": user}, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_user = AccountAdminService.update_user(
            user=user,
            data=serializer.validated_data,
            actor=request.user,
            request=request,
        )
        return success_response(data=UserSummarySerializer(updated_user).data, message="User updated successfully")


class UserActivateView(APIView):
    permission_classes = [IsAccountsAdmin]

    def post(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        updated_user = AccountAdminService.set_user_active_status(
            user=user,
            is_active=True,
            actor=request.user,
            request=request,
        )
        return success_response(data=UserSummarySerializer(updated_user).data, message="User activated")


class UserDeactivateView(APIView):
    permission_classes = [IsAccountsAdmin]

    def post(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        updated_user = AccountAdminService.set_user_active_status(
            user=user,
            is_active=False,
            actor=request.user,
            request=request,
        )
        return success_response(data=UserSummarySerializer(updated_user).data, message="User deactivated")


class UserRoleAssignmentView(APIView):
    permission_classes = [IsAccountsAdmin]

    def post(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        serializer = RoleAssignmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated_user = AccountAdminService.assign_roles(
            user=user,
            role_codes=serializer.validated_data["role_codes"],
            actor=request.user,
            request=request,
        )
        return success_response(data=UserSummarySerializer(updated_user).data, message="User roles updated")


class UserSessionRevokeView(APIView):
    permission_classes = [IsAccountsAdmin]

    def post(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        revoked_count = AccountAdminService.revoke_sessions(user=user, actor=request.user, request=request)
        return success_response(
            data={"revoked_sessions": revoked_count},
            message="User sessions revoked",
        )
