from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.audit.models import AuditLog
from apps.crm.models import Lead


class LeadApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="crm.user@example.com",
            mobile="9876543999",
            password="User@12345",
            first_name="CRM",
        )
        self.client.force_authenticate(user=self.user)

    def test_user_can_create_and_list_leads(self):
        response = self.client.post(
            "/api/v1/leads/",
            {
                "lead_type": "project",
                "source": "Website",
                "company_name": "Nexa Retail",
                "contact_name": "Amit Client",
                "email": "amit.client@example.com",
                "mobile": "+91 9876543000",
                "city": "Jaipur",
                "requirement_summary": "CRM implementation",
                "estimated_value": "250000.00",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["data"]["lead_number"], "LEAD-00001")
        self.assertEqual(Lead.objects.count(), 1)
        self.assertTrue(AuditLog.objects.filter(module="crm", action="create").exists())

        list_response = self.client.get("/api/v1/leads/?search=nexa")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(list_response.data["pagination"]["total"], 1)

    def test_duplicate_lead_is_rejected(self):
        Lead.objects.create(
            lead_number="LEAD-00009",
            contact_name="Existing",
            mobile="9876543001",
            email="existing@example.com",
            company_name="Existing Co",
            created_by=self.user,
        )

        response = self.client.post(
            "/api/v1/leads/",
            {
                "contact_name": "Duplicate",
                "mobile": "9876543001",
                "email": "new@example.com",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
