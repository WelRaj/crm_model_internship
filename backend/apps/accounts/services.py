import hashlib

from django.contrib.auth.models import update_last_login
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import LoginHistory, Permission, Role, RolePermission, User, UserProfile, UserRole, UserSession
from apps.accounts.selectors import get_user_by_identifier
from apps.audit.services import record_audit_log
from apps.core.models import Sequence


SIGNUP_DEPARTMENT_ROLES = {
    "Client Operations": ("telecaller", "Client Operations Executive"),
    "People Operations": ("hr", "HR Executive"),
    "Finance Control": ("finance", "Finance Executive"),
    "Growth Marketing": ("marketing", "Marketing Executive"),
    "Delivery Projects": ("project_manager", "Project Executive"),
    "Admin Control": ("admin", "Admin Executive"),
}


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _request_meta(request):
    meta = getattr(request, "META", {})
    return {
        "ip_address": meta.get("REMOTE_ADDR"),
        "user_agent": meta.get("HTTP_USER_AGENT", ""),
    }


def _login_history_meta(request):
    meta = _request_meta(request)
    return {"ip_address": meta["ip_address"]}


def _next_employee_id():
    sequence, _ = Sequence.objects.select_for_update().get_or_create(
        code="employee_id",
        defaults={"prefix": "EMP", "current_value": 0, "padding": 4},
    )
    sequence.current_value += 1
    sequence.save(update_fields=["current_value", "updated_at"])
    return f"{sequence.prefix}-{sequence.current_value:0{sequence.padding}d}"


def _role_code_from_name(name: str) -> str:
    return "_".join(name.strip().lower().split())


class AuthService:
    @staticmethod
    @transaction.atomic
    def signup(*, data, request=None):
        role_code, designation = SIGNUP_DEPARTMENT_ROLES.get(data["department"], ("employee", "Employee"))
        user = User.objects.create_user(
            email=data["email"],
            mobile=data["mobile"],
            password=data["password"],
            employee_id=_next_employee_id(),
            first_name=data["first_name"],
            last_name=data.get("last_name", ""),
            department=data["department"],
            designation=designation,
            is_active=True,
            is_verified=True,
        )
        UserProfile.objects.create(user=user)

        role, _ = Role.objects.get_or_create(
            code=role_code,
            defaults={
                "name": role_code.replace("_", " ").title(),
                "description": f"{designation} access.",
                "is_system_role": True,
            },
        )
        UserRole.objects.create(user=user, role=role, assigned_by=None)

        record_audit_log(
            actor=None,
            module="accounts",
            action="create",
            entity_type="User",
            entity_id=user.id,
            new_values={
                "email": user.email,
                "mobile": user.mobile,
                "employee_id": user.employee_id,
                "department": user.department,
                "designation": user.designation,
                "role": role.code,
            },
            request=request,
        )
        return user

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
                **_login_history_meta(request),
            )
            raise AuthenticationFailed("Invalid login credentials.")

        if not user.check_password(password):
            LoginHistory.objects.create(
                user=user,
                identifier=identifier,
                status=LoginHistory.LoginStatus.FAILED,
                failure_reason="Invalid password",
                login_time=timezone.now(),
                **_login_history_meta(request),
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
            **_login_history_meta(request),
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
            **_login_history_meta(request),
        )

        token = RefreshToken(refresh_token)
        token.blacklist()


class AccountAdminService:
    @staticmethod
    @transaction.atomic
    def create_role(*, data, actor, request=None):
        permission_codes = data.get("permission_codes") or []
        role = Role.objects.create(
            code=_role_code_from_name(data["name"]),
            name=data["name"].strip(),
            description=data.get("description", "").strip(),
            is_system_role=False,
            is_active=data.get("is_active", True),
        )
        permissions = list(Permission.objects.filter(code__in=permission_codes))
        RolePermission.objects.bulk_create([RolePermission(role=role, permission=permission) for permission in permissions])

        record_audit_log(
            actor=actor,
            module="accounts",
            action="create_role",
            entity_type="Role",
            entity_id=role.id,
            new_values={
                "code": role.code,
                "name": role.name,
                "description": role.description,
                "is_active": role.is_active,
                "permissions": permission_codes,
            },
            request=request,
        )
        return role

    @staticmethod
    @transaction.atomic
    def update_role(*, role, data, actor, request=None):
        old_values = {
            "name": role.name,
            "description": role.description,
            "is_active": role.is_active,
            "permissions": list(RolePermission.objects.filter(role=role).values_list("permission__code", flat=True)),
        }

        if not role.is_system_role and "name" in data:
            role.name = data["name"].strip()
            role.code = _role_code_from_name(role.name)
        if "description" in data:
            role.description = data["description"].strip()
        if "is_active" in data:
            if role.is_system_role and not data["is_active"]:
                raise ValidationError({"is_active": "System roles cannot be deactivated."})
            if role.user_roles.exists() and not data["is_active"]:
                raise ValidationError({"is_active": "Roles with assigned users cannot be deactivated."})
            role.is_active = data["is_active"]
        role.save(update_fields=["name", "code", "description", "is_active", "updated_at"])

        if "permission_codes" in data:
            permissions = list(Permission.objects.filter(code__in=data["permission_codes"]))
            RolePermission.objects.filter(role=role).delete()
            RolePermission.objects.bulk_create([RolePermission(role=role, permission=permission) for permission in permissions])

        record_audit_log(
            actor=actor,
            module="accounts",
            action="update_role",
            entity_type="Role",
            entity_id=role.id,
            old_values=old_values,
            new_values={
                "name": role.name,
                "description": role.description,
                "is_active": role.is_active,
                "permissions": list(RolePermission.objects.filter(role=role).values_list("permission__code", flat=True)),
            },
            request=request,
        )
        return role

    @staticmethod
    @transaction.atomic
    def create_user(*, data, actor, request=None):
        role_codes = data.get("role_codes") or ["employee"]
        user = User.objects.create_user(
            email=data["email"],
            mobile=data["mobile"],
            password=data["password"],
            employee_id=_next_employee_id(),
            first_name=data["first_name"],
            last_name=data.get("last_name", ""),
            department=data["department"],
            designation=data.get("designation") or "Employee",
            is_active=True,
            is_verified=True,
        )
        UserProfile.objects.create(user=user, created_by=actor)

        roles = list(Role.objects.filter(code__in=role_codes))
        UserRole.objects.bulk_create([UserRole(user=user, role=role, assigned_by=actor) for role in roles])

        record_audit_log(
            actor=actor,
            module="accounts",
            action="create",
            entity_type="User",
            entity_id=user.id,
            new_values={
                "email": user.email,
                "mobile": user.mobile,
                "employee_id": user.employee_id,
                "department": user.department,
                "designation": user.designation,
                "roles": role_codes,
            },
            request=request,
        )
        return user

    @staticmethod
    @transaction.atomic
    def update_user(*, user, data, actor, request=None):
        if not data:
            return user

        old_values = {
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "mobile": user.mobile,
            "department": user.department,
            "designation": user.designation,
            "is_verified": user.is_verified,
        }

        for field in ["first_name", "last_name", "email", "mobile", "department", "designation", "is_verified"]:
            if field in data:
                setattr(user, field, data[field])
        user.save(update_fields=list(data.keys()))

        record_audit_log(
            actor=actor,
            module="accounts",
            action="update",
            entity_type="User",
            entity_id=user.id,
            old_values=old_values,
            new_values={key: getattr(user, key) for key in old_values},
            request=request,
        )
        return user

    @staticmethod
    @transaction.atomic
    def set_user_active_status(*, user, is_active, actor, request=None):
        if user.id == actor.id and not is_active:
            raise ValidationError({"user": "You cannot deactivate your own account."})

        old_values = {"is_active": user.is_active}
        user.is_active = is_active
        user.save(update_fields=["is_active"])

        if not is_active:
            UserSession.objects.filter(user=user, is_active=True).update(is_active=False, revoked_at=timezone.now())

        record_audit_log(
            actor=actor,
            module="accounts",
            action="activate" if is_active else "deactivate",
            entity_type="User",
            entity_id=user.id,
            old_values=old_values,
            new_values={"is_active": user.is_active},
            request=request,
        )
        return user

    @staticmethod
    @transaction.atomic
    def assign_roles(*, user, role_codes, actor, request=None):
        old_roles = list(UserRole.objects.filter(user=user).values_list("role__code", flat=True))
        roles = list(Role.objects.filter(code__in=role_codes))

        UserRole.objects.filter(user=user).delete()
        UserRole.objects.bulk_create([UserRole(user=user, role=role, assigned_by=actor) for role in roles])

        record_audit_log(
            actor=actor,
            module="accounts",
            action="assign",
            entity_type="User",
            entity_id=user.id,
            old_values={"roles": old_roles},
            new_values={"roles": role_codes},
            request=request,
        )
        return user

    @staticmethod
    def logout_all(*, user, request=None):
        UserSession.objects.filter(user=user, is_active=True).update(is_active=False, revoked_at=timezone.now())
        LoginHistory.objects.create(
            user=user,
            identifier=user.email or user.mobile or "",
            status=LoginHistory.LoginStatus.LOGOUT,
            logout_time=timezone.now(),
            **_login_history_meta(request),
        )

    @staticmethod
    @transaction.atomic
    def revoke_sessions(*, user, actor, request=None):
        revoked_count = UserSession.objects.filter(user=user, is_active=True).update(
            is_active=False,
            revoked_at=timezone.now(),
        )
        record_audit_log(
            actor=actor,
            module="accounts",
            action="revoke_sessions",
            entity_type="UserSession",
            entity_id=user.id,
            old_values={"active_sessions": revoked_count},
            new_values={"active_sessions": 0},
            request=request,
        )
        return revoked_count
