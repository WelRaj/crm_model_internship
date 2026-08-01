from django.db.models import Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.views import APIView

from apps.core.responses import success_response
from apps.crm.models import ProjectClient
from apps.finance import models
from apps.finance import selectors
from apps.finance.permissions import FinanceAccessMixin
from apps.finance.serializers import (
    ApprovalPolicySerializer,
    ApprovalPolicyWriteSerializer,
    ApprovalRequestSerializer,
    ApprovalRequestWriteSerializer,
    BankAccountSerializer,
    BankAccountWriteSerializer,
    BudgetRevisionSerializer,
    BudgetRevisionWriteSerializer,
    BudgetSerializer,
    BudgetWriteSerializer,
    CreditNoteSerializer,
    CreditNoteWriteSerializer,
    ExpenseEntrySerializer,
    ExpenseEntryWriteSerializer,
    FinanceAccessPolicySerializer,
    FinanceAccessPolicyWriteSerializer,
    FinanceClientSerializer,
    FinanceClientWriteSerializer,
    FinancePayrollRecordSerializer,
    FinancePayrollRecordWriteSerializer,
    GSTReturnSerializer,
    GSTReturnWriteSerializer,
    InvoiceSerializer,
    InvoiceWriteSerializer,
    LedgerEntrySerializer,
    LedgerEntryWriteSerializer,
    PaymentSerializer,
    PaymentWriteSerializer,
    QuotationSerializer,
    QuotationWriteSerializer,
    ReminderSerializer,
    ReminderWriteSerializer,
    TDSRecordSerializer,
    TDSRecordWriteSerializer,
    VendorSerializer,
    VendorWriteSerializer,
)
from apps.finance.services import FinanceService


class FinanceOverviewView(FinanceAccessMixin, APIView):
    finance_page = "overview"

    def get(self, request):
        invoices = models.Invoice.objects.filter(is_deleted=False)
        payments = models.Payment.objects.filter(is_deleted=False).exclude(status=models.Payment.Status.REVERSED)
        expenses = models.ExpenseEntry.objects.filter(is_deleted=False).exclude(status=models.ExpenseEntry.Status.ARCHIVED)
        data = {
            "total_receivables": str(invoices.aggregate(total=Sum("total_amount"))["total"] or 0),
            "total_received": str(payments.aggregate(total=Sum("amount"))["total"] or 0),
            "total_expenses": str(expenses.aggregate(total=Sum("amount"))["total"] or 0),
            "open_invoices": invoices.exclude(payment_status=models.Invoice.PaymentStatus.PAID).count(),
            "pending_approvals": models.ApprovalRequest.objects.filter(is_deleted=False, status=models.ApprovalRequest.Status.PENDING).count(),
        }
        return success_response(data=data)


class FinanceClientListCreateView(FinanceAccessMixin, APIView):
    finance_page = "clients"

    def get(self, request):
        queryset = selectors.finance_clients_queryset()
        if request.query_params.get("status"):
            queryset = queryset.filter(status=request.query_params["status"])
        queryset = selectors.apply_search(queryset, request.query_params.get("search"), ["client_code", "company_name", "contact_person", "email", "mobile", "gstin", "pan"])
        return success_response(data=FinanceClientSerializer(queryset[:200], many=True).data)

    def post(self, request):
        serializer = FinanceClientWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        client = FinanceService.create_client(data=serializer.validated_data, actor=request.user, request=request)
        return success_response(data=FinanceClientSerializer(client).data, message="Finance client created successfully", status_code=status.HTTP_201_CREATED)


class FinanceClientSyncView(FinanceAccessMixin, APIView):
    finance_page = "clients"

    def post(self, request, project_client_id):
        project_client = get_object_or_404(ProjectClient.objects.filter(is_deleted=False), id=project_client_id)
        client = FinanceService.sync_client_from_project_client(project_client=project_client, actor=request.user, request=request)
        return success_response(data=FinanceClientSerializer(client).data, message="Finance client synced successfully")


class FinanceClientDetailView(FinanceAccessMixin, APIView):
    finance_page = "clients"

    def put(self, request, client_id):
        client = get_object_or_404(selectors.finance_clients_queryset(), id=client_id)
        serializer = FinanceClientWriteSerializer(data=request.data, context={"finance_client": client}, partial=True)
        serializer.is_valid(raise_exception=True)
        return success_response(data=FinanceClientSerializer(FinanceService.update_client(client=client, data=serializer.validated_data, actor=request.user, request=request)).data)

    def delete(self, request, client_id):
        client = get_object_or_404(selectors.finance_clients_queryset(), id=client_id)
        return success_response(data=FinanceClientSerializer(FinanceService.soft_archive(obj=client, actor=request.user, request=request)).data)


class SimpleListCreateView(FinanceAccessMixin, APIView):
    queryset_fn = None
    serializer_class = None
    write_serializer_class = None
    model = None
    search_fields = ()

    def get(self, request):
        queryset = self.queryset_fn()
        if request.query_params.get("status") and hasattr(self.model, "status"):
            queryset = queryset.filter(status=request.query_params["status"])
        queryset = selectors.apply_search(queryset, request.query_params.get("search"), self.search_fields)
        return success_response(data=self.serializer_class(queryset[:200], many=True).data)

    def post(self, request):
        serializer = self.write_serializer_class(data=request.data, context={"request_date": timezone.localdate()})
        serializer.is_valid(raise_exception=True)
        if self.model is models.Vendor:
            obj = FinanceService.create_vendor(data=serializer.validated_data, actor=request.user, request=request)
        else:
            obj = FinanceService.save_simple(model=self.model, data=serializer.validated_data, actor=request.user, request=request)
        return success_response(data=self.serializer_class(obj).data, status_code=status.HTTP_201_CREATED)


class SimpleDetailView(FinanceAccessMixin, APIView):
    queryset_fn = None
    serializer_class = None
    write_serializer_class = None

    def put(self, request, object_id):
        obj = get_object_or_404(self.queryset_fn(), id=object_id)
        context = (
            {"gst_return": obj}
            if isinstance(obj, models.GSTReturn)
            else {"approval_policy": obj}
            if isinstance(obj, models.ApprovalPolicy)
            else {"finance_access_policy": obj, "request_date": timezone.localdate()}
            if isinstance(obj, models.FinanceAccessPolicy)
            else {"bank_account": obj}
            if isinstance(obj, models.BankAccount)
            else {}
        )
        serializer = self.write_serializer_class(instance=obj, data=request.data, partial=True, context=context)
        serializer.is_valid(raise_exception=True)
        return success_response(data=self.serializer_class(FinanceService.save_simple(instance=obj, data=serializer.validated_data, actor=request.user, request=request)).data)

    def delete(self, request, object_id):
        obj = get_object_or_404(self.queryset_fn(), id=object_id)
        return success_response(data=self.serializer_class(FinanceService.soft_archive(obj=obj, actor=request.user, request=request)).data)


class VendorListCreateView(SimpleListCreateView):
    finance_page = "vendors"

    queryset_fn = staticmethod(selectors.vendors_queryset)
    serializer_class = VendorSerializer
    write_serializer_class = VendorWriteSerializer
    model = models.Vendor
    search_fields = ("vendor_code", "company_name", "contact_person", "email", "mobile", "gstin", "pan")


class VendorDetailView(SimpleDetailView):
    finance_page = "vendors"

    queryset_fn = staticmethod(selectors.vendors_queryset)
    serializer_class = VendorSerializer
    write_serializer_class = VendorWriteSerializer


class BankAccountListCreateView(SimpleListCreateView):
    finance_page = "bank-accounts"

    queryset_fn = staticmethod(selectors.bank_accounts_queryset)
    serializer_class = BankAccountSerializer
    write_serializer_class = BankAccountWriteSerializer
    model = models.BankAccount
    search_fields = ("account_name", "bank_name", "account_number", "ifsc_code")


class BankAccountDetailView(SimpleDetailView):
    finance_page = "bank-accounts"

    queryset_fn = staticmethod(selectors.bank_accounts_queryset)
    serializer_class = BankAccountSerializer
    write_serializer_class = BankAccountWriteSerializer


class QuotationListCreateView(FinanceAccessMixin, APIView):
    finance_page = "quotations"

    def get(self, request):
        queryset = selectors.quotations_queryset()
        if request.query_params.get("status"):
            queryset = queryset.filter(status=request.query_params["status"])
        queryset = selectors.apply_search(queryset, request.query_params.get("search"), ["quotation_number", "title", "client__company_name"])
        return success_response(data=QuotationSerializer(queryset[:200], many=True).data)

    def post(self, request):
        serializer = QuotationWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quotation = FinanceService.create_quotation(data=serializer.validated_data, actor=request.user, request=request)
        return success_response(data=QuotationSerializer(quotation).data, status_code=status.HTTP_201_CREATED)


class QuotationDetailView(FinanceAccessMixin, APIView):
    finance_page = "quotations"

    def put(self, request, quotation_id):
        quotation = get_object_or_404(selectors.quotations_queryset(), id=quotation_id)
        serializer = QuotationWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        quotation = FinanceService.update_quotation(quotation=quotation, data=serializer.validated_data, actor=request.user, request=request)
        return success_response(data=QuotationSerializer(quotation).data)


class QuotationActionView(FinanceAccessMixin, APIView):
    finance_page = "quotations"
    finance_action = "approve"

    def post(self, request, quotation_id):
        quotation = get_object_or_404(selectors.quotations_queryset(), id=quotation_id)
        quotation = FinanceService.update_quotation_status(quotation=quotation, status=request.data.get("status"), actor=request.user, request=request)
        return success_response(data=QuotationSerializer(quotation).data)


class InvoiceListCreateView(FinanceAccessMixin, APIView):
    finance_page = "invoices"

    def get(self, request):
        queryset = selectors.invoices_queryset()
        if request.query_params.get("status"):
            queryset = queryset.filter(status=request.query_params["status"])
        if request.query_params.get("payment_status"):
            queryset = queryset.filter(payment_status=request.query_params["payment_status"])
        queryset = selectors.apply_search(queryset, request.query_params.get("search"), ["invoice_number", "client__company_name", "project__name"])
        return success_response(data=InvoiceSerializer(queryset[:200], many=True).data)

    def post(self, request):
        serializer = InvoiceWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invoice = FinanceService.create_invoice(data=serializer.validated_data, actor=request.user, request=request)
        return success_response(data=InvoiceSerializer(invoice).data, status_code=status.HTTP_201_CREATED)


class InvoiceDetailView(FinanceAccessMixin, APIView):
    finance_page = "invoices"

    def put(self, request, invoice_id):
        invoice = get_object_or_404(selectors.invoices_queryset(), id=invoice_id)
        serializer = InvoiceWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        invoice = FinanceService.update_invoice(invoice=invoice, data=serializer.validated_data, actor=request.user, request=request)
        return success_response(data=InvoiceSerializer(invoice).data)


class InvoiceActionView(FinanceAccessMixin, APIView):
    finance_page = "invoices"
    finance_action = "approve"

    def post(self, request, invoice_id):
        invoice = get_object_or_404(selectors.invoices_queryset(), id=invoice_id)
        invoice = FinanceService.update_invoice_status(invoice=invoice, status=request.data.get("status"), actor=request.user, request=request)
        return success_response(data=InvoiceSerializer(invoice).data)


class PaymentListCreateView(FinanceAccessMixin, APIView):
    finance_page = "payments"

    def get(self, request):
        queryset = selectors.payments_queryset()
        if request.query_params.get("status"):
            queryset = queryset.filter(status=request.query_params["status"])
        queryset = selectors.apply_search(queryset, request.query_params.get("search"), ["payment_number", "reference", "client__company_name"])
        return success_response(data=PaymentSerializer(queryset[:200], many=True).data)

    def post(self, request):
        serializer = PaymentWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = FinanceService.create_payment(data=serializer.validated_data, actor=request.user, request=request)
        return success_response(data=PaymentSerializer(payment).data, status_code=status.HTTP_201_CREATED)


class PaymentActionView(FinanceAccessMixin, APIView):
    finance_page = "payments"
    finance_action = "approve"

    def post(self, request, payment_id):
        payment = get_object_or_404(selectors.payments_queryset(), id=payment_id)
        payment = FinanceService.update_payment_status(payment=payment, status=request.data.get("status"), actor=request.user, request=request)
        return success_response(data=PaymentSerializer(payment).data)


class ReminderListCreateView(SimpleListCreateView):
    finance_page = "reminders"

    queryset_fn = staticmethod(selectors.reminders_queryset)
    serializer_class = ReminderSerializer
    write_serializer_class = ReminderWriteSerializer
    model = models.Reminder
    search_fields = ("invoice__invoice_number", "invoice__client__company_name", "note")


class ReminderDetailView(SimpleDetailView):
    finance_page = "reminders"

    queryset_fn = staticmethod(selectors.reminders_queryset)
    serializer_class = ReminderSerializer
    write_serializer_class = ReminderWriteSerializer


class BudgetRevisionListCreateView(SimpleListCreateView):
    finance_page = "budget-revisions"

    queryset_fn = staticmethod(selectors.budget_revisions_queryset)
    serializer_class = BudgetRevisionSerializer
    write_serializer_class = BudgetRevisionWriteSerializer
    model = models.BudgetRevision
    search_fields = ("budget__budget_code", "budget__name", "reason", "requested_by", "approved_by")


class BudgetRevisionDetailView(SimpleDetailView):
    finance_page = "budget-revisions"

    queryset_fn = staticmethod(selectors.budget_revisions_queryset)
    serializer_class = BudgetRevisionSerializer
    write_serializer_class = BudgetRevisionWriteSerializer


NUMBERED = {
    "credit-notes": (models.CreditNote, CreditNoteSerializer, CreditNoteWriteSerializer, selectors.credit_notes_queryset, "credit_note_number", "CRN"),
    "ledger-entries": (models.LedgerEntry, LedgerEntrySerializer, LedgerEntryWriteSerializer, selectors.ledger_entries_queryset, "ledger_entry_number", "LED"),
    "expenses": (models.ExpenseEntry, ExpenseEntrySerializer, ExpenseEntryWriteSerializer, selectors.expense_entries_queryset, "expense_number", "EXP"),
    "budgets": (models.Budget, BudgetSerializer, BudgetWriteSerializer, selectors.budgets_queryset, "budget_number", "BUD"),
    "payroll-register": (models.FinancePayrollRecord, FinancePayrollRecordSerializer, FinancePayrollRecordWriteSerializer, selectors.payroll_register_queryset, "finance_payroll_number", "FPR"),
    "tds-records": (models.TDSRecord, TDSRecordSerializer, TDSRecordWriteSerializer, selectors.tds_records_queryset, "tds_number", "TDS"),
    "approval-requests": (models.ApprovalRequest, ApprovalRequestSerializer, ApprovalRequestWriteSerializer, selectors.approval_requests_queryset, "approval_request_number", "APR"),
}

NUMBERED_SEARCH_FIELDS = {
    "credit-notes": ("credit_note_number", "invoice__invoice_number", "reason"),
    "ledger-entries": ("entry_number", "description"),
    "expenses": ("expense_number", "category", "notes"),
    "budgets": ("budget_code", "name", "department", "category", "fiscal_year", "owner", "cost_center", "remarks"),
    "payroll-register": ("payroll_number", "month", "status", "payment_reference", "remarks", "hrms_payroll__employee__user__employee_id", "hrms_payroll__employee__user__first_name", "hrms_payroll__employee__user__last_name"),
    "tds-records": ("tds_number", "period", "source_type", "source_id", "party_id", "party_name", "section", "challan_no", "return_ack_no", "certificate_reference", "remarks"),
    "approval-requests": ("request_number", "module", "entity_type", "entity_id", "department", "requester_name", "current_approver_role", "decision_note", "summary"),
}


class NumberedListCreateView(FinanceAccessMixin, APIView):
    def get(self, request, resource):
        model, serializer_class, _, queryset_fn, _, _ = NUMBERED[resource]
        queryset = queryset_fn()
        if request.query_params.get("status") and hasattr(model, "status"):
            queryset = queryset.filter(status=request.query_params["status"])
        queryset = selectors.apply_search(queryset, request.query_params.get("search"), NUMBERED_SEARCH_FIELDS.get(resource, ()))
        return success_response(data=serializer_class(queryset[:200], many=True).data)

    def post(self, request, resource):
        model, serializer_class, write_serializer_class, _, code, prefix = NUMBERED[resource]
        serializer = write_serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = FinanceService.create_numbered(model=model, data=serializer.validated_data, code=code, prefix=prefix, actor=request.user, request=request)
        return success_response(data=serializer_class(obj).data, status_code=status.HTTP_201_CREATED)


class NumberedDetailView(FinanceAccessMixin, APIView):
    def put(self, request, resource, object_id):
        _, serializer_class, write_serializer_class, queryset_fn, _, _ = NUMBERED[resource]
        obj = get_object_or_404(queryset_fn(), id=object_id)
        context_key = "budget" if resource == "budgets" else "payroll_record" if resource == "payroll-register" else "tds_record" if resource == "tds-records" else "approval_request" if resource == "approval-requests" else resource[:-1]
        serializer = write_serializer_class(data=request.data, partial=True, context={context_key: obj})
        serializer.is_valid(raise_exception=True)
        obj = FinanceService.save_simple(instance=obj, data=serializer.validated_data, actor=request.user, request=request)
        return success_response(data=serializer_class(obj).data)

    def delete(self, request, resource, object_id):
        _, serializer_class, _, queryset_fn, _, _ = NUMBERED[resource]
        obj = get_object_or_404(queryset_fn(), id=object_id)
        return success_response(data=serializer_class(FinanceService.soft_archive(obj=obj, actor=request.user, request=request)).data)


class GSTReturnListCreateView(SimpleListCreateView):
    finance_page = "gst-returns"

    queryset_fn = staticmethod(selectors.gst_returns_queryset)
    serializer_class = GSTReturnSerializer
    write_serializer_class = GSTReturnWriteSerializer
    model = models.GSTReturn
    search_fields = ("period", "status", "prepared_by", "approved_by", "arn", "remarks")


class GSTReturnDetailView(SimpleDetailView):
    finance_page = "gst-returns"

    queryset_fn = staticmethod(selectors.gst_returns_queryset)
    serializer_class = GSTReturnSerializer
    write_serializer_class = GSTReturnWriteSerializer


class ApprovalPolicyListCreateView(SimpleListCreateView):
    finance_page = "approval-policies"

    queryset_fn = staticmethod(selectors.approval_policies_queryset)
    serializer_class = ApprovalPolicySerializer
    write_serializer_class = ApprovalPolicyWriteSerializer
    model = models.ApprovalPolicy
    search_fields = ("name", "module", "approver_role")


class ApprovalPolicyDetailView(SimpleDetailView):
    finance_page = "approval-policies"

    queryset_fn = staticmethod(selectors.approval_policies_queryset)
    serializer_class = ApprovalPolicySerializer
    write_serializer_class = ApprovalPolicyWriteSerializer


class FinanceAccessPolicyListCreateView(SimpleListCreateView):
    finance_page = "access-policies"

    queryset_fn = staticmethod(selectors.finance_access_policies_queryset)
    serializer_class = FinanceAccessPolicySerializer
    write_serializer_class = FinanceAccessPolicyWriteSerializer
    model = models.FinanceAccessPolicy
    search_fields = ("role_name", "module")


class FinanceAccessPolicyDetailView(SimpleDetailView):
    finance_page = "access-policies"

    queryset_fn = staticmethod(selectors.finance_access_policies_queryset)
    serializer_class = FinanceAccessPolicySerializer
    write_serializer_class = FinanceAccessPolicyWriteSerializer
