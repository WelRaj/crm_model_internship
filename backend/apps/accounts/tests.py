from datetime import timedelta

from rest_framework.test import APITestCase
from django.utils import timezone

from apps.accounts.models import Permission, Role, RolePermission, User, UserProfile, UserRole, UserSession
from apps.audit.models import AuditLog


class SignupSigninTests(APITestCase):
    def setUp(self):
        Role.objects.create(code="finance", name="Finance", description="Finance module access.", is_system_role=True)

    def test_signup_creates_internal_user_profile_role_and_allows_login(self):
        signup_response = self.client.post(
            "/api/v1/auth/signup/",
            {
                "first_name": "Amit",
                "last_name": "Sharma",
                "email": "amit.sharma@example.com",
                "mobile": "9876543210",
                "department": "Finance Control",
                "password": "StrongPass@123",
            },
            format="json",
        )

        self.assertEqual(signup_response.status_code, 201)
        self.assertTrue(signup_response.data["success"])

        user = User.objects.get(email="amit.sharma@example.com")
        self.assertEqual(user.employee_id, "EMP-0001")
        self.assertEqual(user.department, "Finance Control")
        self.assertEqual(user.designation, "Finance Executive")
        self.assertTrue(UserProfile.objects.filter(user=user).exists())
        self.assertTrue(UserRole.objects.filter(user=user, role__code="finance").exists())

        login_response = self.client.post(
            "/api/v1/auth/login/",
            {"identifier": "amit.sharma@example.com", "password": "StrongPass@123"},
            format="json",
        )

        self.assertEqual(login_response.status_code, 200)
        self.assertTrue(login_response.data["success"])
        self.assertIn("access_token", login_response.data["data"])

    def test_signup_rejects_duplicate_email_and_mobile(self):
        payload = {
            "first_name": "Amit",
            "last_name": "Sharma",
            "email": "amit.sharma@example.com",
            "mobile": "9876543210",
            "department": "Finance Control",
            "password": "StrongPass@123",
        }
        self.client.post("/api/v1/auth/signup/", payload, format="json")

        duplicate_response = self.client.post("/api/v1/auth/signup/", payload, format="json")

        self.assertEqual(duplicate_response.status_code, 400)


class AccountAdminApiTests(APITestCase):
    def setUp(self):
        self.admin_role = Role.objects.create(
            code="admin",
            name="Admin",
            description="Administrative access.",
            is_system_role=True,
        )
        self.employee_role = Role.objects.create(
            code="employee",
            name="Employee",
            description="Standard employee access.",
            is_system_role=True,
        )
        self.finance_role = Role.objects.create(
            code="finance",
            name="Finance",
            description="Finance module access.",
            is_system_role=True,
        )
        self.view_accounts_permission = Permission.objects.create(
            code="accounts.view",
            name="Accounts View",
            module="accounts",
            action="view",
            description="Can view account records.",
        )
        self.edit_accounts_permission = Permission.objects.create(
            code="accounts.edit",
            name="Accounts Edit",
            module="accounts",
            action="edit",
            description="Can edit account records.",
        )
        self.admin = User.objects.create_superuser(
            email="admin@example.com",
            mobile="9876543200",
            password="Admin@12345",
            first_name="Admin",
        )
        UserRole.objects.create(user=self.admin, role=self.admin_role, assigned_by=self.admin)

    def test_admin_can_manage_user_lifecycle(self):
        self.client.force_authenticate(user=self.admin)

        create_response = self.client.post(
            "/api/v1/accounts/users/",
            {
                "first_name": "Neha",
                "last_name": "Finance",
                "email": "neha.finance@example.com",
                "mobile": "9876543299",
                "department": "Finance Control",
                "designation": "Finance Executive",
                "password": "StrongPass@123",
                "role_codes": ["finance"],
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, 201)
        user_id = create_response.data["data"]["id"]

        list_response = self.client.get("/api/v1/accounts/users/?search=neha")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(list_response.data["pagination"]["total"], 1)

        update_response = self.client.put(
            f"/api/v1/accounts/users/{user_id}/",
            {"designation": "Senior Finance Executive"},
            format="json",
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.data["data"]["designation"], "Senior Finance Executive")

        role_response = self.client.post(
            f"/api/v1/accounts/users/{user_id}/roles/",
            {"role_codes": ["employee"]},
            format="json",
        )
        self.assertEqual(role_response.status_code, 200)
        self.assertEqual(role_response.data["data"]["roles"][0]["code"], "employee")

        deactivate_response = self.client.post(f"/api/v1/accounts/users/{user_id}/deactivate/")
        self.assertEqual(deactivate_response.status_code, 200)
        self.assertFalse(deactivate_response.data["data"]["is_active"])

        login_response = self.client.post(
            "/api/v1/auth/login/",
            {"identifier": "neha.finance@example.com", "password": "StrongPass@123"},
            format="json",
        )
        self.assertEqual(login_response.status_code, 401)
        self.assertGreaterEqual(AuditLog.objects.filter(module="accounts").count(), 4)

    def test_non_admin_cannot_manage_users(self):
        employee = User.objects.create_user(
            email="employee@example.com",
            mobile="9876543210",
            password="Employee@123",
            first_name="Employee",
        )
        UserRole.objects.create(user=employee, role=self.employee_role, assigned_by=self.admin)
        self.client.force_authenticate(user=employee)

        response = self.client.get("/api/v1/accounts/users/")

        self.assertEqual(response.status_code, 403)

    def test_admin_can_revoke_user_sessions(self):
        employee = User.objects.create_user(
            email="session.user@example.com",
            mobile="9876543211",
            password="Employee@123",
            first_name="Session",
        )
        UserRole.objects.create(user=employee, role=self.employee_role, assigned_by=self.admin)
        UserSession.objects.create(
            user=employee,
            refresh_token_hash="active-session-hash",
            is_active=True,
            expires_at=timezone.now() + timedelta(days=7),
        )
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(f"/api/v1/accounts/users/{employee.id}/sessions/revoke/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"]["revoked_sessions"], 1)
        self.assertFalse(UserSession.objects.get(user=employee).is_active)
        self.assertTrue(AuditLog.objects.filter(module="accounts", action="revoke_sessions").exists())

    def test_admin_can_manage_roles_and_permissions(self):
        self.client.force_authenticate(user=self.admin)

        create_response = self.client.post(
            "/api/v1/accounts/roles/",
            {
                "name": "Access Reviewer",
                "description": "Reviews identity and access changes.",
                "is_active": False,
                "permission_codes": ["accounts.view"],
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, 201)
        role_id = create_response.data["data"]["id"]
        self.assertFalse(create_response.data["data"]["is_active"])
        self.assertEqual(create_response.data["data"]["permissions"][0]["code"], "accounts.view")

        update_response = self.client.put(
            f"/api/v1/accounts/roles/{role_id}/",
            {
                "name": "Access Reviewer",
                "description": "Reviews and updates identity access changes.",
                "is_active": True,
                "permission_codes": ["accounts.view", "accounts.edit"],
            },
            format="json",
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertTrue(update_response.data["data"]["is_active"])
        self.assertEqual(len(update_response.data["data"]["permissions"]), 2)
        self.assertTrue(RolePermission.objects.filter(role_id=role_id, permission=self.edit_accounts_permission).exists())

        permissions_response = self.client.get("/api/v1/accounts/permissions/")
        self.assertEqual(permissions_response.status_code, 200)
        self.assertEqual(len(permissions_response.data["data"]), 2)
        self.assertTrue(AuditLog.objects.filter(module="accounts", action="update_role").exists())

    def test_inactive_roles_cannot_be_assigned_and_assigned_roles_cannot_be_deactivated(self):
        inactive_role = Role.objects.create(
            code="inactive_role",
            name="Inactive Role",
            description="Inactive access.",
            is_active=False,
        )
        employee = User.objects.create_user(
            email="role.employee@example.com",
            mobile="9876543212",
            password="Employee@123",
            first_name="Role",
        )
        self.client.force_authenticate(user=self.admin)

        assign_response = self.client.post(
            f"/api/v1/accounts/users/{employee.id}/roles/",
            {"role_codes": [inactive_role.code]},
            format="json",
        )
        self.assertEqual(assign_response.status_code, 400)

        UserRole.objects.create(user=employee, role=self.finance_role, assigned_by=self.admin)
        deactivate_response = self.client.put(
            f"/api/v1/accounts/roles/{self.finance_role.id}/",
            {
                "name": self.finance_role.name,
                "description": self.finance_role.description,
                "is_active": False,
            },
            format="json",
        )
        self.assertEqual(deactivate_response.status_code, 400)
