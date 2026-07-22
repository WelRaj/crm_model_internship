from datetime import date, timedelta
from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.audit.models import AuditLog
from apps.crm.models import ClientContact, ProjectClient
from apps.finance.models import ApprovalPolicy, ApprovalRequest, BankAccount, Budget, BudgetRevision, FinanceAccessPolicy, FinanceClient, FinancePayrollRecord, GSTReturn, Invoice, LedgerEntry, Payment
from apps.hrms.models import EmployeeHRProfile, PayrollRecord


class FinanceApiFlowTests(APITestCase):
    def setUp(self):
        self.actor = User.objects.create_superuser(email="finance-admin@example.com", mobile="9000011111", password="Admin@12345")
        self.client.force_authenticate(self.actor)
        self.project_client = ProjectClient.objects.create(
            client_number="ACC-FIN-001",
            company_name="Finance Verify Company",
            project_name="Finance Control Backend",
            value=Decimal("500000.00"),
            created_by=self.actor,
            updated_by=self.actor,
        )
        ClientContact.objects.create(
            client=self.project_client,
            role=ClientContact.ContactRole.FINANCE,
            name="Finance Coordinator",
            phone="9876543210",
            email="finance.verify@example.com",
            created_by=self.actor,
            updated_by=self.actor,
        )

    def test_project_client_sync_creates_single_finance_client(self):
        response = self.client.post(f"/api/v1/finance/clients/sync-project-client/{self.project_client.id}/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.content)
        self.assertEqual(response.data["data"]["company_name"], "Finance Verify Company")
        self.assertEqual(FinanceClient.objects.filter(project_client=self.project_client, is_deleted=False).count(), 1)

        repeat = self.client.post(f"/api/v1/finance/clients/sync-project-client/{self.project_client.id}/", {}, format="json")
        self.assertEqual(repeat.status_code, status.HTTP_200_OK, repeat.content)
        self.assertEqual(FinanceClient.objects.filter(project_client=self.project_client, is_deleted=False).count(), 1)

    def create_finance_client(self):
        response = self.client.post(
            "/api/v1/finance/clients/",
            {
                "project_client_id": str(self.project_client.id),
                "company_name": "Finance Verify Company",
                "contact_person": "Finance Coordinator",
                "email": "finance.verify@example.com",
                "mobile": "9876543210",
                "gstin": "27AAHCA8123D1Z6",
                "pan": "AAHCA8123D",
                "billing_address": "Navi Mumbai",
                "currency": "INR",
                "payment_terms": "Net 15",
                "credit_limit": "500000.00",
                "status": "active",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.content)
        return response.data["data"]

    def test_invoice_duplicate_guard_and_payment_allocation_updates_status(self):
        finance_client = self.create_finance_client()
        quote_response = self.client.post(
            "/api/v1/finance/quotations/",
            {
                "client_id": finance_client["id"],
                "title": "CRM implementation quote",
                "description": "Quote from finance verification",
                "status": "client_accepted",
                "currency": "INR",
                "discount": "0.00",
                "gst_rate": "18.00",
                "valid_until": str(date.today() + timedelta(days=30)),
                "terms": "Milestone billing",
                "items": [{"description": "Implementation milestone", "quantity": "1", "unit_price": "100000.00"}],
            },
            format="json",
        )
        self.assertEqual(quote_response.status_code, status.HTTP_201_CREATED, quote_response.content)
        quotation = quote_response.data["data"]
        invoice_payload = {
            "source_type": "quotation",
            "quotation_id": quotation["id"],
            "client_id": finance_client["id"],
            "invoice_date": str(date.today()),
            "due_date": str(date.today() + timedelta(days=15)),
            "status": "sent",
            "currency": "INR",
            "discount": "0.00",
            "gst_rate": "18.00",
            "remarks": "Finance verification invoice",
            "items": [{"description": "Implementation milestone", "quantity": "1", "unit_price": "100000.00"}],
        }
        invoice_response = self.client.post("/api/v1/finance/invoices/", invoice_payload, format="json")
        self.assertEqual(invoice_response.status_code, status.HTTP_201_CREATED, invoice_response.content)
        invoice = invoice_response.data["data"]
        self.assertEqual(invoice["total_amount"], "118000.00")

        duplicate_response = self.client.post("/api/v1/finance/invoices/", invoice_payload, format="json")
        self.assertEqual(duplicate_response.status_code, status.HTTP_400_BAD_REQUEST)

        overpay_response = self.client.post(
            "/api/v1/finance/payments/",
            {
                "client_id": finance_client["id"],
                "allocation_type": "invoice",
                "amount": "119000.00",
                "currency": "INR",
                "payment_date": str(date.today()),
                "mode": "NEFT",
                "reference": "FIN-VERIFY-OVERPAY",
                "allocations": [{"invoice_id": invoice["id"], "amount": "119000.00", "tds_amount": "0.00"}],
            },
            format="json",
        )
        self.assertEqual(overpay_response.status_code, status.HTTP_400_BAD_REQUEST)

        payment_response = self.client.post(
            "/api/v1/finance/payments/",
            {
                "client_id": finance_client["id"],
                "allocation_type": "invoice",
                "amount": "100000.00",
                "tds_amount": "18000.00",
                "currency": "INR",
                "payment_date": str(date.today()),
                "mode": "NEFT",
                "reference": "FIN-VERIFY-UTR-001",
                "proof_name": "receipt.pdf",
                "allocations": [{"invoice_id": invoice["id"], "amount": "100000.00", "tds_amount": "18000.00"}],
            },
            format="json",
        )
        self.assertEqual(payment_response.status_code, status.HTTP_201_CREATED, payment_response.content)
        invoice_obj = Invoice.objects.get(id=invoice["id"])
        self.assertEqual(invoice_obj.payment_status, Invoice.PaymentStatus.PAID)
        self.assertEqual(invoice_obj.paid_amount, Decimal("100000.00"))
        self.assertEqual(invoice_obj.tds_amount, Decimal("18000.00"))
        self.assertTrue(Payment.objects.filter(reference="FIN-VERIFY-UTR-001").exists())
        self.assertTrue(AuditLog.objects.filter(module="finance", entity_type="Payment", action="create").exists())

        status_response = self.client.post(f"/api/v1/finance/payments/{payment_response.data['data']['id']}/action/", {"status": "reversed"}, format="json")
        self.assertEqual(status_response.status_code, status.HTTP_200_OK, status_response.content)
        invoice_obj.refresh_from_db()
        self.assertEqual(invoice_obj.payment_status, Invoice.PaymentStatus.UNPAID)
        self.assertEqual(invoice_obj.paid_amount, Decimal("0.00"))
        self.assertEqual(invoice_obj.tds_amount, Decimal("0.00"))

    def test_quotation_update_and_status_action(self):
        finance_client = self.create_finance_client()
        payload = {
            "client_id": finance_client["id"],
            "title": "Quotation edit flow",
            "description": "Draft quotation for edit verification",
            "status": "draft",
            "currency": "INR",
            "discount": "100.00",
            "gst_rate": "18.00",
            "valid_until": str(date.today() + timedelta(days=14)),
            "terms": "Advance billing",
            "items": [{"description": "Discovery sprint", "quantity": "2", "unit_price": "25000.00"}],
        }
        create_response = self.client.post("/api/v1/finance/quotations/", payload, format="json")
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED, create_response.content)
        quotation_id = create_response.data["data"]["id"]
        self.assertEqual(create_response.data["data"]["total_amount"], "58882.00")

        payload["title"] = "Quotation edit flow updated"
        payload["discount"] = "500.00"
        payload["items"] = [{"description": "Discovery and planning sprint", "quantity": "1", "unit_price": "60000.00"}]
        update_response = self.client.put(f"/api/v1/finance/quotations/{quotation_id}/", payload, format="json")
        self.assertEqual(update_response.status_code, status.HTTP_200_OK, update_response.content)
        self.assertEqual(update_response.data["data"]["title"], "Quotation edit flow updated")
        self.assertEqual(update_response.data["data"]["total_amount"], "70210.00")
        self.assertEqual(len(update_response.data["data"]["items"]), 1)

        action_response = self.client.post(f"/api/v1/finance/quotations/{quotation_id}/action/", {"status": "approved"}, format="json")
        self.assertEqual(action_response.status_code, status.HTTP_200_OK, action_response.content)
        self.assertEqual(action_response.data["data"]["status"], "approved")

    def test_invoice_update_and_status_action(self):
        finance_client = self.create_finance_client()
        payload = {
            "source_type": "direct",
            "client_id": finance_client["id"],
            "invoice_date": str(date.today()),
            "due_date": str(date.today() + timedelta(days=15)),
            "status": "draft",
            "currency": "INR",
            "discount": "100.00",
            "gst_rate": "18.00",
            "remarks": "Invoice edit verification",
            "items": [{"description": "Initial implementation invoice", "quantity": "1", "unit_price": "50000.00"}],
        }
        create_response = self.client.post("/api/v1/finance/invoices/", payload, format="json")
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED, create_response.content)
        invoice_id = create_response.data["data"]["id"]
        self.assertEqual(create_response.data["data"]["total_amount"], "58882.00")

        payload["discount"] = "500.00"
        payload["items"] = [{"description": "Updated implementation invoice", "quantity": "1", "unit_price": "60000.00"}]
        update_response = self.client.put(f"/api/v1/finance/invoices/{invoice_id}/", payload, format="json")
        self.assertEqual(update_response.status_code, status.HTTP_200_OK, update_response.content)
        self.assertEqual(update_response.data["data"]["total_amount"], "70210.00")
        self.assertEqual(len(update_response.data["data"]["items"]), 1)

        action_response = self.client.post(f"/api/v1/finance/invoices/{invoice_id}/action/", {"status": "approved"}, format="json")
        self.assertEqual(action_response.status_code, status.HTTP_200_OK, action_response.content)
        self.assertEqual(action_response.data["data"]["status"], "approved")

    def test_reminder_create_update_and_search(self):
        finance_client = self.create_finance_client()
        invoice_response = self.client.post(
            "/api/v1/finance/invoices/",
            {
                "source_type": "direct",
                "client_id": finance_client["id"],
                "invoice_date": str(date.today()),
                "due_date": str(date.today() + timedelta(days=7)),
                "status": "sent",
                "currency": "INR",
                "discount": "0.00",
                "gst_rate": "18.00",
                "remarks": "Reminder verification invoice",
                "items": [{"description": "Reminder verification service", "quantity": "1", "unit_price": "100000.00"}],
            },
            format="json",
        )
        self.assertEqual(invoice_response.status_code, status.HTTP_201_CREATED, invoice_response.content)
        reminder_payload = {
            "invoice": invoice_response.data["data"]["id"],
            "channel": "email",
            "due_at": f"{date.today()}T09:00:00",
            "status": "scheduled",
            "note": "reminder verification note",
        }
        reminder_response = self.client.post("/api/v1/finance/reminders/", reminder_payload, format="json")
        self.assertEqual(reminder_response.status_code, status.HTTP_201_CREATED, reminder_response.content)
        self.assertEqual(reminder_response.data["data"]["status"], "scheduled")

        reminder_id = reminder_response.data["data"]["id"]
        reminder_payload["status"] = "sent"
        update_response = self.client.put(f"/api/v1/finance/reminders/{reminder_id}/", reminder_payload, format="json")
        self.assertEqual(update_response.status_code, status.HTTP_200_OK, update_response.content)
        self.assertEqual(update_response.data["data"]["status"], "sent")

        search_response = self.client.get("/api/v1/finance/reminders/?search=verification")
        self.assertEqual(search_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(search_response.data["data"]), 1)

    def test_credit_note_create_update_and_status_flow(self):
        finance_client = self.create_finance_client()
        invoice_response = self.client.post(
            "/api/v1/finance/invoices/",
            {
                "source_type": "direct",
                "client_id": finance_client["id"],
                "invoice_date": str(date.today()),
                "due_date": str(date.today() + timedelta(days=7)),
                "status": "sent",
                "currency": "INR",
                "discount": "0.00",
                "gst_rate": "18.00",
                "remarks": "Credit note verification invoice",
                "items": [{"description": "Credit note verification service", "quantity": "1", "unit_price": "100000.00"}],
            },
            format="json",
        )
        self.assertEqual(invoice_response.status_code, status.HTTP_201_CREATED, invoice_response.content)
        payload = {
            "invoice": invoice_response.data["data"]["id"],
            "reason": "Billing Correction",
            "taxable_amount": "10000.00",
            "gst_amount": "1800.00",
            "total_amount": "11800.00",
            "status": "pending_approval",
        }
        create_response = self.client.post("/api/v1/finance/credit-notes/", payload, format="json")
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED, create_response.content)
        self.assertEqual(create_response.data["data"]["status"], "pending_approval")

        credit_id = create_response.data["data"]["id"]
        payload["status"] = "approved"
        update_response = self.client.put(f"/api/v1/finance/credit-notes/{credit_id}/", payload, format="json")
        self.assertEqual(update_response.status_code, status.HTTP_200_OK, update_response.content)
        self.assertEqual(update_response.data["data"]["status"], "approved")

        payload["status"] = "applied"
        issue_response = self.client.put(f"/api/v1/finance/credit-notes/{credit_id}/", payload, format="json")
        self.assertEqual(issue_response.status_code, status.HTTP_200_OK, issue_response.content)
        self.assertEqual(issue_response.data["data"]["status"], "applied")

    def test_ledger_entry_create_update_search_and_archive(self):
        payload = {
            "entry_type": "sale",
            "entry_date": str(date.today()),
            "description": "Ledger verification sale | voucher=SALE-VERIFY-001 | party=Finance Verify Company | category=Services",
            "debit": "0.00",
            "credit": "25000.00",
            "status": "posted",
        }
        create_response = self.client.post("/api/v1/finance/ledger-entries/", payload, format="json")
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED, create_response.content)
        self.assertEqual(create_response.data["data"]["entry_type"], "sale")
        self.assertEqual(create_response.data["data"]["credit"], "25000.00")

        ledger_id = create_response.data["data"]["id"]
        payload["credit"] = "30000.00"
        update_response = self.client.put(f"/api/v1/finance/ledger-entries/{ledger_id}/", payload, format="json")
        self.assertEqual(update_response.status_code, status.HTTP_200_OK, update_response.content)
        self.assertEqual(update_response.data["data"]["credit"], "30000.00")

        search_response = self.client.get("/api/v1/finance/ledger-entries/?search=SALE-VERIFY-001")
        self.assertEqual(search_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(search_response.data["data"]), 1)

        archive_response = self.client.delete(f"/api/v1/finance/ledger-entries/{ledger_id}/")
        self.assertEqual(archive_response.status_code, status.HTTP_200_OK, archive_response.content)
        self.assertFalse(LedgerEntry.objects.filter(id=ledger_id, is_deleted=False).exists())

    def test_budget_control_create_status_revision_and_search(self):
        payload = {
            "name": "Engineering - Payroll - FY 2026-27",
            "scope_type": "Department",
            "department": "Engineering",
            "project": None,
            "category": "Payroll",
            "fiscal_year": "FY 2026-27",
            "period_start": "2026-04-01",
            "period_end": "2027-03-31",
            "allocated_amount": "1000000.00",
            "contingency_amount": "100000.00",
            "consumed_amount": "250000.00",
            "committed_amount": "50000.00",
            "alert_threshold": "80.00",
            "block_threshold": "100.00",
            "owner": "Engineering Head",
            "cost_center": "CC-ENG-VERIFY",
            "remarks": "Budget verification record",
            "approved_by": "",
            "status": "Draft",
        }
        create_response = self.client.post("/api/v1/finance/budgets/", payload, format="json")
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED, create_response.content)
        self.assertEqual(create_response.data["data"]["category"], "Payroll")

        duplicate_response = self.client.post("/api/v1/finance/budgets/", payload, format="json")
        self.assertEqual(duplicate_response.status_code, status.HTTP_400_BAD_REQUEST)

        budget_id = create_response.data["data"]["id"]
        activate_response = self.client.put(
            f"/api/v1/finance/budgets/{budget_id}/",
            {"status": "Active", "approved_by": "Director"},
            format="json",
        )
        self.assertEqual(activate_response.status_code, status.HTTP_200_OK, activate_response.content)
        self.assertEqual(activate_response.data["data"]["status"], "Active")

        revision_response = self.client.post(
            "/api/v1/finance/budget-revisions/",
            {
                "budget": budget_id,
                "old_amount": "1000000.00",
                "new_amount": "1250000.00",
                "reason": "Increase delivery capacity",
                "status": "Pending",
                "requested_by": "Finance Manager",
            },
            format="json",
        )
        self.assertEqual(revision_response.status_code, status.HTTP_201_CREATED, revision_response.content)
        revision_id = revision_response.data["data"]["id"]
        approve_revision = self.client.put(
            f"/api/v1/finance/budget-revisions/{revision_id}/",
            {"status": "Approved", "approved_by": "Director"},
            format="json",
        )
        self.assertEqual(approve_revision.status_code, status.HTTP_200_OK, approve_revision.content)

        amount_update = self.client.put(
            f"/api/v1/finance/budgets/{budget_id}/",
            {"allocated_amount": "1250000.00"},
            format="json",
        )
        self.assertEqual(amount_update.status_code, status.HTTP_200_OK, amount_update.content)
        self.assertEqual(amount_update.data["data"]["allocated_amount"], "1250000.00")

        search_response = self.client.get("/api/v1/finance/budgets/?search=CC-ENG-VERIFY")
        self.assertEqual(search_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(search_response.data["data"]), 1)
        self.assertTrue(Budget.objects.filter(id=budget_id, status="Active", is_deleted=False).exists())
        self.assertTrue(BudgetRevision.objects.filter(id=revision_id, status="Approved", is_deleted=False).exists())

    def test_finance_payroll_register_create_update_payment_and_search(self):
        employee_user = User.objects.create_user(
            email="finance-payroll-employee@example.com",
            mobile="9000099911",
            password="Admin@12345",
            first_name="Payroll",
            last_name="Verify",
            employee_id="FIN-PAY-001",
        )
        employee = EmployeeHRProfile.objects.create(
            user=employee_user,
            role="Software Engineer",
            team="Product Engineering",
            status=EmployeeHRProfile.Status.ACTIVE,
            kyc_status=EmployeeHRProfile.KycStatus.COMPLETE,
            created_by=self.actor,
            updated_by=self.actor,
        )
        hrms_payroll = PayrollRecord.objects.create(
            employee=employee,
            month="2026-07",
            basic=Decimal("50000.00"),
            hra=Decimal("20000.00"),
            allowance=Decimal("10000.00"),
            conveyance=Decimal("5000.00"),
            bonus=Decimal("2500.00"),
            pf=Decimal("6000.00"),
            pt=Decimal("200.00"),
            tds=Decimal("3500.00"),
            advance=Decimal("0.00"),
            working_days=26,
            payable_days=Decimal("26.0"),
            lop_days=Decimal("0.0"),
            readiness=PayrollRecord.Readiness.READY,
            status=PayrollRecord.Status.APPROVED,
            created_by=self.actor,
            updated_by=self.actor,
        )
        payload = {
            "hrms_payroll": str(hrms_payroll.id),
            "month": "2026-07",
            "total_gross": "87500.00",
            "total_deductions": "9700.00",
            "net_payable": "77800.00",
            "payment_method": "NEFT",
            "payment_reference": "",
            "paid_at": None,
            "remarks": "Finance payroll verification",
            "status": "approved",
        }
        create_response = self.client.post("/api/v1/finance/payroll-register/", payload, format="json")
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED, create_response.content)
        payroll_id = create_response.data["data"]["id"]

        duplicate_response = self.client.post("/api/v1/finance/payroll-register/", payload, format="json")
        self.assertEqual(duplicate_response.status_code, status.HTTP_400_BAD_REQUEST)

        paid_without_ref = self.client.put(f"/api/v1/finance/payroll-register/{payroll_id}/", {"status": "paid"}, format="json")
        self.assertEqual(paid_without_ref.status_code, status.HTTP_400_BAD_REQUEST)

        paid_response = self.client.put(
            f"/api/v1/finance/payroll-register/{payroll_id}/",
            {"status": "paid", "payment_reference": "UTR-PAY-VERIFY-001"},
            format="json",
        )
        self.assertEqual(paid_response.status_code, status.HTTP_200_OK, paid_response.content)
        self.assertEqual(paid_response.data["data"]["status"], "paid")

        search_response = self.client.get("/api/v1/finance/payroll-register/?search=UTR-PAY-VERIFY-001")
        self.assertEqual(search_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(search_response.data["data"]), 1)
        self.assertTrue(FinancePayrollRecord.objects.filter(id=payroll_id, payment_reference="UTR-PAY-VERIFY-001").exists())

    def test_gst_return_create_approve_file_and_search(self):
        payload = {
            "period": "2026-07",
            "outward_taxable": "500000.00",
            "credit_taxable": "25000.00",
            "output_gst": "85500.00",
            "credit_tax_reversal": "4500.00",
            "input_credit": "30000.00",
            "ineligible_itc": "1000.00",
            "pending_itc": "2000.00",
            "gstr1_taxable": "475000.00",
            "gstr1_tax": "85500.00",
            "gstr3b_output": "85500.00",
            "gstr3b_itc": "30000.00",
            "cash_ledger_balance": "5000.00",
            "net_payable": "50500.00",
            "filing_due_date": "2026-08-20",
            "prepared_by": "Finance Manager",
            "approved_by": "",
            "arn": "",
            "filed_at": None,
            "remarks": "GST verification return",
            "status": "Ready for Review",
        }
        create_response = self.client.post("/api/v1/finance/gst-returns/", payload, format="json")
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED, create_response.content)
        gst_id = create_response.data["data"]["id"]

        duplicate_period = self.client.post("/api/v1/finance/gst-returns/", payload, format="json")
        self.assertEqual(duplicate_period.status_code, status.HTTP_400_BAD_REQUEST)

        approve_response = self.client.put(
            f"/api/v1/finance/gst-returns/{gst_id}/",
            {"status": "Approved", "approved_by": "Director"},
            format="json",
        )
        self.assertEqual(approve_response.status_code, status.HTTP_200_OK, approve_response.content)
        self.assertEqual(approve_response.data["data"]["status"], "Approved")

        filed_without_arn = self.client.put(f"/api/v1/finance/gst-returns/{gst_id}/", {"status": "Filed"}, format="json")
        self.assertEqual(filed_without_arn.status_code, status.HTTP_400_BAD_REQUEST)

        file_response = self.client.put(
            f"/api/v1/finance/gst-returns/{gst_id}/",
            {"status": "Filed", "arn": "GST-ARN-VERIFY-001"},
            format="json",
        )
        self.assertEqual(file_response.status_code, status.HTTP_200_OK, file_response.content)
        self.assertEqual(file_response.data["data"]["status"], "Filed")

        payload["period"] = "2026-08"
        payload["arn"] = "GST-ARN-VERIFY-001"
        payload["status"] = "Filed"
        duplicate_arn = self.client.post("/api/v1/finance/gst-returns/", payload, format="json")
        self.assertEqual(duplicate_arn.status_code, status.HTTP_400_BAD_REQUEST)

        search_response = self.client.get("/api/v1/finance/gst-returns/?search=GST-ARN-VERIFY-001")
        self.assertEqual(search_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(search_response.data["data"]), 1)
        self.assertTrue(GSTReturn.objects.filter(id=gst_id, status="Filed", arn="GST-ARN-VERIFY-001").exists())

    def test_tds_record_create_duplicate_compliance_and_search(self):
        payload = {
            "source_type": "Vendor TDS Payable",
            "source_id": "LED-TDS-VERIFY-001",
            "party_id": "Vendor Verify",
            "party_name": "Vendor Verify",
            "section": "194J",
            "taxable_amount": "100000.00",
            "rate": "2.000",
            "period": "Q2 FY 2026-27",
            "deduction_date": "2026-07-10",
            "deposit_due_date": "2026-08-07",
            "deducted_amount": "2000.00",
            "challan_no": "",
            "challan_date": None,
            "return_ack_no": "",
            "certificate_reference": "",
            "certificate_status": "Pending",
            "lower_deduction_certificate": "",
            "remarks": "TDS verification record",
            "status": "Payable",
        }
        create_response = self.client.post("/api/v1/finance/tds-records/", payload, format="json")
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED, create_response.content)
        tds_id = create_response.data["data"]["id"]

        duplicate_response = self.client.post("/api/v1/finance/tds-records/", payload, format="json")
        self.assertEqual(duplicate_response.status_code, status.HTTP_400_BAD_REQUEST)

        invalid_deposit = self.client.put(f"/api/v1/finance/tds-records/{tds_id}/", {"status": "Deposited"}, format="json")
        self.assertEqual(invalid_deposit.status_code, status.HTTP_400_BAD_REQUEST)

        deposit_response = self.client.put(
            f"/api/v1/finance/tds-records/{tds_id}/",
            {"status": "Deposited", "challan_no": "CH-TDS-001", "challan_date": "2026-08-05"},
            format="json",
        )
        self.assertEqual(deposit_response.status_code, status.HTTP_200_OK, deposit_response.content)
        self.assertEqual(deposit_response.data["data"]["status"], "Deposited")

        file_response = self.client.put(
            f"/api/v1/finance/tds-records/{tds_id}/",
            {"status": "Filed", "return_ack_no": "RET-TDS-001", "certificate_reference": "CERT-TDS-001", "certificate_status": "Generated"},
            format="json",
        )
        self.assertEqual(file_response.status_code, status.HTTP_200_OK, file_response.content)
        self.assertEqual(file_response.data["data"]["return_ack_no"], "RET-TDS-001")

        search_response = self.client.get("/api/v1/finance/tds-records/?search=RET-TDS-001")
        self.assertEqual(search_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(search_response.data["data"]), 1)

    def test_approval_policy_and_request_decision_flow(self):
        policy_payload = {
            "name": "Expense director approval",
            "module": "Expense",
            "min_amount": "50000.00",
            "max_amount": None,
            "approver_role": "Finance Manager",
            "second_approver_role": "Director",
            "sla_hours": 6,
            "is_enabled": True,
        }
        policy_response = self.client.post("/api/v1/finance/approval-policies/", policy_payload, format="json")
        self.assertEqual(policy_response.status_code, status.HTTP_201_CREATED, policy_response.content)
        policy_id = policy_response.data["data"]["id"]

        overlap_response = self.client.post(
            "/api/v1/finance/approval-policies/",
            {**policy_payload, "name": "Overlapping expense approval", "min_amount": "75000.00"},
            format="json",
        )
        self.assertEqual(overlap_response.status_code, status.HTTP_400_BAD_REQUEST)

        request_payload = {
            "module": "Expense",
            "entity_type": "ExpenseEntry",
            "entity_id": "EXP-VERIFY-001",
            "amount": "65000.00",
            "department": "Marketing",
            "requester_name": "Marketing Manager",
            "requester_role": "Marketing",
            "current_approver_role": "Finance Manager",
            "second_approver_role": "Director",
            "approval_level": 1,
            "risk": "medium",
            "policy": policy_id,
            "budget_status": "Near Limit",
            "duplicate_check": "Clear",
            "compliance_check": "Review",
            "status": "pending",
            "decision_note": "",
            "due_at": "2026-07-22T12:00:00Z",
            "summary": "Approval verification expense request.",
            "events": [],
        }
        request_response = self.client.post("/api/v1/finance/approval-requests/", request_payload, format="json")
        self.assertEqual(request_response.status_code, status.HTTP_201_CREATED, request_response.content)
        approval_id = request_response.data["data"]["id"]
        self.assertEqual(str(request_response.data["data"]["requested_by"]), str(self.actor.id))

        search_response = self.client.get("/api/v1/finance/approval-requests/?search=EXP-VERIFY-001")
        self.assertEqual(search_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(search_response.data["data"]), 1)

        level_one_response = self.client.put(
            f"/api/v1/finance/approval-requests/{approval_id}/",
            {
                "status": "pending",
                "current_approver_role": "Director",
                "second_approver_role": "",
                "approval_level": 2,
                "decision_note": "Level one finance approval done.",
                "events": [{"at": "2026-07-22T10:00:00Z", "actor": "CRM Admin", "role": "Finance Manager", "action": "Level 1 Approved", "comment": "Level one finance approval done."}],
            },
            format="json",
        )
        self.assertEqual(level_one_response.status_code, status.HTTP_200_OK, level_one_response.content)
        self.assertEqual(level_one_response.data["data"]["current_approver_role"], "Director")
        self.assertEqual(level_one_response.data["data"]["approval_level"], 2)

        final_response = self.client.put(
            f"/api/v1/finance/approval-requests/{approval_id}/",
            {
                "status": "approved",
                "decision_note": "Director approved after budget review.",
                "events": level_one_response.data["data"]["events"] + [{"at": "2026-07-22T11:00:00Z", "actor": "CRM Admin", "role": "Director", "action": "Approve", "comment": "Director approved after budget review."}],
            },
            format="json",
        )
        self.assertEqual(final_response.status_code, status.HTTP_200_OK, final_response.content)
        self.assertEqual(final_response.data["data"]["status"], ApprovalRequest.Status.APPROVED)
        self.assertEqual(str(final_response.data["data"]["decided_by"]), str(self.actor.id))
        self.assertEqual(len(final_response.data["data"]["events"]), 2)
        self.assertTrue(ApprovalPolicy.objects.filter(id=policy_id, is_enabled=True).exists())

    def test_finance_access_policy_create_update_and_rules(self):
        payload = {
            "role_name": "Finance Access Verify",
            "description": "Finance access verification role.",
            "module": "Invoices",
            "status": "active",
            "is_protected": False,
            "users_count": 0,
            "data_scope": "Department",
            "approval_limit": "250000.00",
            "audit_access": "No Access",
            "last_reviewed_at": str(date.today()),
            "next_review_date": str(date.today() + timedelta(days=30)),
            "can_view": True,
            "can_create": True,
            "can_edit": True,
            "can_archive": False,
            "can_approve": True,
            "can_export": True,
        }
        create_response = self.client.post("/api/v1/finance/access-policies/", payload, format="json")
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED, create_response.content)
        policy_id = create_response.data["data"]["id"]

        duplicate_response = self.client.post("/api/v1/finance/access-policies/", payload, format="json")
        self.assertEqual(duplicate_response.status_code, status.HTTP_400_BAD_REQUEST)

        bad_audit_response = self.client.post(
            "/api/v1/finance/access-policies/",
            {**payload, "module": "Payments", "audit_access": "Read Only"},
            format="json",
        )
        self.assertEqual(bad_audit_response.status_code, status.HTTP_400_BAD_REQUEST)

        update_response = self.client.put(
            f"/api/v1/finance/access-policies/{policy_id}/",
            {"status": "inactive", "can_approve": False, "approval_limit": None, "can_archive": True},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK, update_response.content)
        self.assertEqual(update_response.data["data"]["status"], FinanceAccessPolicy.Status.INACTIVE)
        self.assertTrue(update_response.data["data"]["can_archive"])

        search_response = self.client.get("/api/v1/finance/access-policies/?search=Access Verify")
        self.assertEqual(search_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(search_response.data["data"]), 1)

    def test_bank_account_create_verify_primary_and_rules(self):
        payload = {
            "owner_type": "company",
            "owner_reference": "DeMatade Algo Technology Solutions Pvt Ltd",
            "account_name": "DeMatade Algo Technology Solutions Pvt Ltd",
            "account_number": "918273645544",
            "bank_name": "HDFC Bank",
            "ifsc_code": "HDFC0001234",
            "branch": "Malviya Nagar Jaipur",
            "account_type": "Current",
            "purpose": "Collections",
            "status": "active",
            "verification_status": "pending",
            "is_primary": False,
            "verification_note": "",
            "last_verified_at": None,
        }
        create_response = self.client.post("/api/v1/finance/bank-accounts/", payload, format="json")
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED, create_response.content)
        bank_id = create_response.data["data"]["id"]

        duplicate_response = self.client.post("/api/v1/finance/bank-accounts/", payload, format="json")
        self.assertEqual(duplicate_response.status_code, status.HTTP_400_BAD_REQUEST)

        bad_primary_response = self.client.put(f"/api/v1/finance/bank-accounts/{bank_id}/", {"is_primary": True}, format="json")
        self.assertEqual(bad_primary_response.status_code, status.HTTP_400_BAD_REQUEST)

        verified_response = self.client.put(
            f"/api/v1/finance/bank-accounts/{bank_id}/",
            {
                "verification_status": "verified",
                "verification_note": "Cancelled cheque and bank letter verified.",
                "last_verified_at": "2026-07-22T10:00:00Z",
            },
            format="json",
        )
        self.assertEqual(verified_response.status_code, status.HTTP_200_OK, verified_response.content)
        self.assertEqual(verified_response.data["data"]["verification_status"], BankAccount.VerificationStatus.VERIFIED)

        primary_response = self.client.put(f"/api/v1/finance/bank-accounts/{bank_id}/", {"is_primary": True}, format="json")
        self.assertEqual(primary_response.status_code, status.HTTP_200_OK, primary_response.content)
        self.assertTrue(primary_response.data["data"]["is_primary"])

        inactive_primary_response = self.client.put(f"/api/v1/finance/bank-accounts/{bank_id}/", {"status": "inactive"}, format="json")
        self.assertEqual(inactive_primary_response.status_code, status.HTTP_400_BAD_REQUEST)

        search_response = self.client.get("/api/v1/finance/bank-accounts/?search=HDFC0001234")
        self.assertEqual(search_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(search_response.data["data"]), 1)

    def test_finance_overview_and_master_resource_smoke(self):
        overview = self.client.get("/api/v1/finance/overview/")
        self.assertEqual(overview.status_code, status.HTTP_200_OK)
        vendor = self.client.post(
            "/api/v1/finance/vendors/",
            {
                "company_name": "Finance Vendor",
                "contact_person": "Vendor Owner",
                "email": "vendor@example.com",
                "mobile": "9876500000",
                "gstin": "27AAHCA8123D1Z6",
                "pan": "AAHCA8123D",
                "billing_address": "Mumbai",
                "payment_terms": "Net 15",
                "status": "active",
            },
            format="json",
        )
        self.assertEqual(vendor.status_code, status.HTTP_201_CREATED, vendor.content)
        search = self.client.get("/api/v1/finance/vendors/?search=Finance Vendor")
        self.assertEqual(search.status_code, status.HTTP_200_OK)
        self.assertEqual(len(search.data["data"]), 1)
