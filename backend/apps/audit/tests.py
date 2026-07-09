from django.test import TestCase

from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.audit.models import AuditLog


class AuditLogApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            email="admin.audit@example.com",
            mobile="9876543300",
            password="Admin@12345",
            first_name="Audit",
            last_name="Admin",
        )
        self.employee = User.objects.create_user(
            email="employee.audit@example.com",
            mobile="9876543301",
            password="Employee@123",
            first_name="Audit",
            last_name="Employee",
        )
        AuditLog.objects.create(
            actor=self.admin,
            module="accounts",
            action="update_role",
            entity_type="Role",
            entity_id="role-1",
            old_values={"description": "Old"},
            new_values={"description": "New"},
            ip_address="127.0.0.1",
            user_agent="APITest",
        )
        AuditLog.objects.create(
            actor=None,
            module="accounts",
            action="create",
            entity_type="User",
            entity_id="user-1",
        )

    def test_admin_can_list_and_search_audit_logs(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get("/api/v1/audit/logs/?search=role")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["pagination"]["total"], 1)
        self.assertEqual(response.data["data"][0]["action"], "update_role")
        self.assertEqual(response.data["data"][0]["actor_name"], "Audit Admin")

    def test_non_admin_cannot_list_audit_logs(self):
        self.client.force_authenticate(user=self.employee)

        response = self.client.get("/api/v1/audit/logs/")

        self.assertEqual(response.status_code, 403)
