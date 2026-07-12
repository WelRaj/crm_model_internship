from rest_framework.test import APITestCase
from django.utils import timezone

from apps.accounts.models import Role, User, UserRole
from apps.audit.models import AuditLog
from apps.crm.models import ClientContact, Lead, LeadFollowUp, ProjectAgreement, ProjectClient, ProjectHandoff


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

    def test_user_can_view_update_and_assign_lead(self):
        lead = Lead.objects.create(
            lead_number="LEAD-00021",
            contact_name="Existing Lead",
            mobile="9876543002",
            email="lead@example.com",
            company_name="Lead Co",
            created_by=self.user,
        )
        assignee = User.objects.create_user(
            email="assignee@example.com",
            mobile="9876543111",
            password="User@12345",
            first_name="Assign",
        )

        detail_response = self.client.get(f"/api/v1/leads/{lead.id}/")
        self.assertEqual(detail_response.status_code, 200)

        update_response = self.client.put(
            f"/api/v1/leads/{lead.id}/",
            {
                "status": "contacted",
                "source": "Referral",
                "company_name": "Updated Lead Co",
                "contact_name": "Updated Lead",
                "mobile": "9876543003",
                "city": "Jaipur",
                "requirement_summary": "Updated requirement",
                "estimated_value": "300000.00",
            },
            format="json",
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.data["data"]["status"], "contacted")
        self.assertTrue(AuditLog.objects.filter(module="crm", action="update").exists())

        assign_response = self.client.post(
            f"/api/v1/leads/{lead.id}/assign/",
            {"assigned_to_id": assignee.id},
            format="json",
        )
        self.assertEqual(assign_response.status_code, 200)
        lead.refresh_from_db()
        self.assertEqual(lead.assigned_to_id, assignee.id)
        self.assertTrue(AuditLog.objects.filter(module="crm", action="assign").exists())
        self.assertEqual(LeadFollowUp.objects.filter(lead=lead).count(), 1)

        audit_count = AuditLog.objects.filter(module="crm", action="assign").count()
        repeat_response = self.client.post(
            f"/api/v1/leads/{lead.id}/assign/",
            {"assigned_to_id": assignee.id},
            format="json",
        )
        self.assertEqual(repeat_response.status_code, 200)
        lead.refresh_from_db()
        self.assertEqual(lead.assigned_to_id, assignee.id)
        self.assertEqual(AuditLog.objects.filter(module="crm", action="assign").count(), audit_count)
        self.assertEqual(LeadFollowUp.objects.filter(lead=lead).count(), 1)

    def test_assignment_auto_balances_when_requested_telecaller_is_overloaded(self):
        role = Role.objects.create(code="telecaller", name="Telecaller")
        busy_user = User.objects.create_user(
            email="busy.telecaller@example.com",
            mobile="9876543121",
            password="User@12345",
            first_name="Busy",
        )
        free_user = User.objects.create_user(
            email="free.telecaller@example.com",
            mobile="9876543122",
            password="User@12345",
            first_name="Free",
        )
        UserRole.objects.create(user=busy_user, role=role, assigned_by=self.user)
        UserRole.objects.create(user=free_user, role=role, assigned_by=self.user)
        for index in range(5):
            Lead.objects.create(
                lead_number=f"LEAD-BUSY-{index}",
                contact_name=f"Busy Lead {index}",
                mobile=f"98765000{index}",
                email=f"busy{index}@example.com",
                company_name="Busy Co",
                assigned_to=busy_user,
                created_by=self.user,
            )
        lead = Lead.objects.create(
            lead_number="LEAD-AUTO-01",
            contact_name="Auto Balance Lead",
            mobile="9876543222",
            email="auto.balance@example.com",
            company_name="Auto Co",
            created_by=self.user,
        )

        response = self.client.post(
            f"/api/v1/leads/{lead.id}/assign/",
            {"assigned_to_id": busy_user.id},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        lead.refresh_from_db()
        self.assertEqual(lead.assigned_to_id, free_user.id)
        self.assertTrue(
            LeadFollowUp.objects.filter(
                lead=lead,
                note__icontains="Auto-balanced",
            ).exists()
        )

    def test_user_can_create_and_list_lead_follow_ups(self):
        lead = Lead.objects.create(
            lead_number="LEAD-00031",
            contact_name="Follow Up Lead",
            mobile="9876543004",
            email="followup@example.com",
            company_name="Follow Co",
            created_by=self.user,
        )

        create_response = self.client.post(
            f"/api/v1/leads/{lead.id}/follow-ups/",
            {
                "channel": "call",
                "outcome": "contacted",
                "note": "Client asked for a product demo tomorrow.",
                "next_follow_up_at": "2026-07-11T10:30:00+05:30",
            },
            format="json",
        )

        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(LeadFollowUp.objects.count(), 1)
        self.assertTrue(AuditLog.objects.filter(module="crm", action="follow_up").exists())
        lead.refresh_from_db()
        self.assertEqual(lead.status, Lead.LeadStatus.CONTACTED)

        list_response = self.client.get(f"/api/v1/leads/{lead.id}/follow-ups/")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.data["data"]), 1)

    def test_user_can_list_global_follow_up_queue(self):
        lead = Lead.objects.create(
            lead_number="LEAD-00041",
            contact_name="Queue Lead",
            mobile="9876543005",
            email="queue@example.com",
            company_name="Queue Co",
            assigned_to=self.user,
            created_by=self.user,
        )
        LeadFollowUp.objects.create(
            lead=lead,
            channel=LeadFollowUp.Channel.CALL,
            outcome=LeadFollowUp.Outcome.CALLBACK,
            note="Queue follow-up for today.",
            next_follow_up_at=timezone.now(),
            created_by=self.user,
        )

        response = self.client.get("/api/v1/follow-ups/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["data"]), 1)
        self.assertEqual(response.data["data"][0]["lead_detail"]["lead_number"], "LEAD-00041")

    def test_user_can_create_project_client_contact_and_handoff(self):
        lead = Lead.objects.create(
            lead_number="LEAD-00051",
            lead_type=Lead.LeadType.PROJECT,
            status=Lead.LeadStatus.QUALIFIED,
            contact_name="Project Buyer",
            mobile="9876543006",
            email="buyer@example.com",
            company_name="Buyer Co",
            requirement_summary="Custom CRM project",
            estimated_value="450000.00",
            created_by=self.user,
        )

        client_response = self.client.post(
            "/api/v1/project-clients/",
            {
                "source_lead_id": str(lead.id),
                "company_name": "Buyer Co",
                "project_name": "Buyer Co CRM",
                "project_type": "CRM",
                "project_owner": "Delivery Team",
                "team_leader": "Rajkumar Rathore",
                "telecaller": "CRM User",
                "agreement_status": "drafted",
                "value": "450000.00",
                "primary_contact": {
                    "role": "decision_maker",
                    "name": "Project Buyer",
                    "designation": "Founder",
                    "phone": "9876543006",
                    "email": "buyer@example.com",
                    "responsibility": "Approval",
                },
            },
            format="json",
        )

        self.assertEqual(client_response.status_code, 201)
        self.assertEqual(ProjectClient.objects.count(), 1)
        self.assertEqual(ClientContact.objects.count(), 1)
        lead.refresh_from_db()
        self.assertEqual(lead.status, Lead.LeadStatus.WON)

        client_id = client_response.data["data"]["id"]
        contact_response = self.client.post(
            f"/api/v1/project-clients/{client_id}/contacts/",
            {
                "role": "technical",
                "name": "Tech Owner",
                "designation": "CTO",
                "phone": "+91 9876543007",
                "email": "tech@example.com",
                "responsibility": "API access",
            },
            format="json",
        )
        self.assertEqual(contact_response.status_code, 201)
        self.assertEqual(ClientContact.objects.count(), 2)

        handoff_response = self.client.post(
            "/api/v1/project-handoffs/",
            {
                "client_id": client_id,
                "project_code": "PRJ-CRM-001",
                "project_manager": "Delivery Manager",
                "start_date": "2026-07-12",
                "target_end_date": "2026-08-12",
                "priority": "high",
                "billing_model": "Milestone Based",
                "delivery_method": "Agile",
                "communication_channel": "WhatsApp",
                "repository_url": "https://example.com/repo",
                "kickoff_notes": "Kickoff with scope, API access, and milestone planning.",
            },
            format="json",
        )
        self.assertEqual(handoff_response.status_code, 201)
        self.assertEqual(ProjectHandoff.objects.count(), 1)
        self.assertTrue(AuditLog.objects.filter(module="crm", entity_type="ProjectHandoff").exists())

    def test_won_project_leads_are_available_as_project_clients(self):
        Lead.objects.create(
            lead_number="LEAD-00061",
            lead_type=Lead.LeadType.PROJECT,
            status=Lead.LeadStatus.WON,
            contact_name="Won Buyer",
            mobile="9876543008",
            email="won@example.com",
            company_name="Won Co",
            requirement_summary="ERP project",
            estimated_value="550000.00",
            created_by=self.user,
        )

        response = self.client.get("/api/v1/project-clients/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(ProjectClient.objects.count(), 1)
        self.assertEqual(ClientContact.objects.count(), 1)
        self.assertEqual(response.data["data"][0]["source_lead_detail"]["lead_number"], "LEAD-00061")

    def test_outcome_requires_completed_follow_up_and_is_idempotent(self):
        lead = Lead.objects.create(
            lead_number="LEAD-00071",
            lead_type=Lead.LeadType.PROJECT,
            status=Lead.LeadStatus.CONTACTED,
            contact_name="Outcome Buyer",
            mobile="9876543009",
            email="outcome@example.com",
            company_name="Outcome Co",
            created_by=self.user,
        )

        blocked_response = self.client.post(
            f"/api/v1/leads/{lead.id}/outcome/",
            {"status": "won", "note": "Client confirmed project budget."},
            format="json",
        )
        self.assertEqual(blocked_response.status_code, 400)

        LeadFollowUp.objects.create(
            lead=lead,
            channel=LeadFollowUp.Channel.CALL,
            outcome=LeadFollowUp.Outcome.DONE,
            note="Follow-up completed and client confirmed.",
            created_by=self.user,
        )

        response = self.client.post(
            f"/api/v1/leads/{lead.id}/outcome/",
            {"status": "won", "note": "Client confirmed project budget."},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        lead.refresh_from_db()
        self.assertEqual(lead.status, Lead.LeadStatus.WON)
        self.assertTrue(ProjectClient.objects.filter(source_lead=lead).exists())
        self.assertTrue(AuditLog.objects.filter(module="crm", action="outcome").exists())
        follow_up_count = LeadFollowUp.objects.filter(lead=lead).count()

        repeat_response = self.client.post(
            f"/api/v1/leads/{lead.id}/outcome/",
            {"status": "won", "note": "Client confirmed project budget."},
            format="json",
        )
        self.assertEqual(repeat_response.status_code, 200)
        self.assertEqual(LeadFollowUp.objects.filter(lead=lead).count(), follow_up_count)

    def test_user_can_create_and_list_project_agreement(self):
        client = ProjectClient.objects.create(
            client_number="ACC-25001",
            company_name="Agreement Co",
            project_name="Agreement CRM",
            project_type="CRM",
            value="700000.00",
            created_by=self.user,
        )
        handoff = ProjectHandoff.objects.create(
            client=client,
            project_code="PRJ-AGR-001",
            project_manager="Delivery Manager",
            start_date="2026-07-12",
            target_end_date="2026-08-12",
            priority=ProjectHandoff.Priority.HIGH,
            billing_model="Milestone Based",
            delivery_method="Agile",
            kickoff_notes="Kickoff notes for agreement project.",
            created_by=self.user,
        )

        response = self.client.post(
            "/api/v1/project-agreements/",
            {
                "client_id": str(client.id),
                "project_handoff_id": str(handoff.id),
                "agreement_type": "msa",
                "effective_date": "2026-07-12",
                "expiry_date": "2027-07-12",
                "contract_value": "700000.00",
                "payment_terms": "30% advance, 40% UAT, 30% deployment",
                "status": "active",
                "attachment_name": "signed-agreement.pdf",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(ProjectAgreement.objects.count(), 1)
        client.refresh_from_db()
        self.assertEqual(client.agreement_status, ProjectClient.AgreementStatus.SIGNED)
        self.assertTrue(AuditLog.objects.filter(module="crm", entity_type="ProjectAgreement").exists())

        duplicate_response = self.client.post(
            "/api/v1/project-agreements/",
            {
                "client_id": str(client.id),
                "project_handoff_id": str(handoff.id),
                "agreement_type": "sow",
                "effective_date": "2026-07-12",
                "status": "draft",
            },
            format="json",
        )
        self.assertEqual(duplicate_response.status_code, 400)

        list_response = self.client.get("/api/v1/project-agreements/?search=Agreement")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.data["data"]), 1)
