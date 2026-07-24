from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

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
        self.client.force_authenticate(self.user)

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
