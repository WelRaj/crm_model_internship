from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.accounts.models import Role, UserRole
from apps.audit.models import AuditLog
from apps.support.models import SupportTicket

User = get_user_model()


class SupportApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="support.user@example.com",
            mobile="9000000000",
            first_name="Support",
            last_name="User",
            password="Support@12345",
            is_active=True,
            is_verified=True,
        )
        support_role, _ = Role.objects.get_or_create(code="support", defaults={"name": "Support", "description": "Support desk access."})
        UserRole.objects.get_or_create(user=self.user, role=support_role, defaults={"assigned_by": self.user})
        self.client.force_authenticate(self.user)

    def _create_other_support_user(self):
        other = User.objects.create_user(
            email="other.support@example.com",
            mobile="9000000002",
            first_name="Other",
            last_name="Support",
            password="Support@12345",
            is_active=True,
            is_verified=True,
        )
        support_role = Role.objects.get(code="support")
        UserRole.objects.create(user=other, role=support_role, assigned_by=self.user)
        return other

    def test_non_support_user_is_blocked_from_support_desk(self):
        blocked = User.objects.create_user(
            email="blocked.support@example.com",
            mobile="9000000001",
            first_name="Blocked",
            last_name="User",
            password="Support@12345",
            is_active=True,
            is_verified=True,
        )
        self.client.force_authenticate(blocked)

        overview_response = self.client.get("/api/v1/support/overview/")
        self.assertEqual(overview_response.status_code, 403)

        create_response = self.client.post(
            "/api/v1/support/tickets/",
            {
                "subject": "Blocked access",
                "module": "Support Desk",
                "requester": "Blocked User",
                "priority": "Low",
                "channel": "Internal",
                "description": "This should not be allowed.",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, 403)

    def test_support_ticket_create_list_and_status_update(self):
        payload = {
            "subject": "Invoice approval clarification",
            "module": "Finance Control",
            "requester": "Accounts Desk",
            "priority": "High",
            "channel": "Internal",
            "description": "Need approval owner confirmation for invoice release.",
        }
        create_response = self.client.post("/api/v1/support/tickets/", payload, format="json")
        self.assertEqual(create_response.status_code, 201)
        ticket_id = create_response.data["data"]["id"]
        self.assertTrue(AuditLog.objects.filter(module="support", action="create").exists())

        list_response = self.client.get("/api/v1/support/tickets/")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.data["data"]), 1)

        update_response = self.client.patch(
            f"/api/v1/support/tickets/{ticket_id}/",
            {"status": "In Progress", "resolution_summary": "Assigned to finance admin."},
            format="json",
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.data["data"]["status"], SupportTicket.Status.IN_PROGRESS)
        self.assertTrue(AuditLog.objects.filter(module="support", action="update").exists())

    def test_support_user_only_accesses_scoped_tickets(self):
        other = self._create_other_support_user()
        own_ticket = SupportTicket.objects.create(
            ticket_number="SUP-SCOPE-001",
            subject="Own ticket",
            module="Support Desk",
            requester="Support User",
            priority="Medium",
            status="Open",
            channel="Internal",
            current_owner=self.user,
            description="Owned by current support user.",
            created_by=self.user,
            updated_by=self.user,
        )
        other_ticket = SupportTicket.objects.create(
            ticket_number="SUP-SCOPE-002",
            subject="Other ticket",
            module="Finance Control",
            requester="Other Support",
            priority="High",
            status="Open",
            channel="Internal",
            current_owner=other,
            description="Owned by another support user.",
            created_by=other,
            updated_by=other,
        )

        list_response = self.client.get("/api/v1/support/tickets/")
        self.assertEqual(list_response.status_code, 200)
        ticket_numbers = {ticket["ticket_number"] for ticket in list_response.data["data"]}
        self.assertIn(own_ticket.ticket_number, ticket_numbers)
        self.assertNotIn(other_ticket.ticket_number, ticket_numbers)

        own_detail_response = self.client.get(f"/api/v1/support/tickets/{own_ticket.id}/")
        self.assertEqual(own_detail_response.status_code, 200)

        other_detail_response = self.client.get(f"/api/v1/support/tickets/{other_ticket.id}/")
        self.assertEqual(other_detail_response.status_code, 404)

        other_comment_response = self.client.post(
            f"/api/v1/support/tickets/{other_ticket.id}/comments/",
            {"message": "Should not reach unrelated ticket.", "is_internal": True},
            format="json",
        )
        self.assertEqual(other_comment_response.status_code, 404)

    def test_support_ticket_comment(self):
        ticket = SupportTicket.objects.create(
            ticket_number="SUP-0001",
            subject="Need help",
            module="Client Operations",
            requester="Lead Desk",
            priority="Medium",
            status="Open",
            channel="Internal",
            description="Check routing.",
            created_by=self.user,
            updated_by=self.user,
        )
        response = self.client.post(f"/api/v1/support/tickets/{ticket.id}/comments/", {"message": "Investigating now.", "is_internal": True}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertTrue(AuditLog.objects.filter(module="support", action="comment").exists())
