from django.conf import settings
from django.db import models

from apps.core.models import BaseModel


class FinanceClient(BaseModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"
        ON_HOLD = "on_hold", "On Hold"
        BLACKLISTED = "blacklisted", "Blacklisted"
        ARCHIVED = "archived", "Archived"

    client_code = models.CharField(max_length=40, unique=True)
    project_client = models.OneToOneField("crm.ProjectClient", null=True, blank=True, on_delete=models.SET_NULL, related_name="finance_client")
    company_name = models.CharField(max_length=180, db_index=True)
    contact_person = models.CharField(max_length=160)
    email = models.EmailField(blank=True, db_index=True)
    mobile = models.CharField(max_length=20, blank=True, db_index=True)
    gstin = models.CharField(max_length=20, blank=True, db_index=True)
    pan = models.CharField(max_length=12, blank=True, db_index=True)
    billing_address = models.TextField(blank=True)
    currency = models.CharField(max_length=8, default="INR")
    payment_terms = models.CharField(max_length=80, default="Net 15")
    credit_limit = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    outstanding_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True)

    class Meta:
        db_table = "finance_clients"
        indexes = [
            models.Index(fields=["client_code"]),
            models.Index(fields=["company_name", "status"]),
            models.Index(fields=["gstin", "pan"]),
            models.Index(fields=["status", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.client_code} - {self.company_name}"


class Vendor(BaseModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"
        ON_HOLD = "on_hold", "On Hold"
        ARCHIVED = "archived", "Archived"

    vendor_code = models.CharField(max_length=40, unique=True)
    company_name = models.CharField(max_length=180, db_index=True)
    contact_person = models.CharField(max_length=160, blank=True)
    email = models.EmailField(blank=True, db_index=True)
    mobile = models.CharField(max_length=20, blank=True, db_index=True)
    gstin = models.CharField(max_length=20, blank=True, db_index=True)
    pan = models.CharField(max_length=12, blank=True, db_index=True)
    billing_address = models.TextField(blank=True)
    payment_terms = models.CharField(max_length=80, default="Net 15")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True)

    class Meta:
        db_table = "vendors"
        indexes = [models.Index(fields=["vendor_code"]), models.Index(fields=["company_name", "status"]), models.Index(fields=["gstin", "pan"])]


class BankAccount(BaseModel):
    class OwnerType(models.TextChoices):
        COMPANY = "company", "Company"
        CLIENT = "client", "Client"
        VENDOR = "vendor", "Vendor"

    class VerificationStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        VERIFIED = "verified", "Verified"
        REJECTED = "rejected", "Rejected"

    owner_type = models.CharField(max_length=20, choices=OwnerType.choices, default=OwnerType.COMPANY, db_index=True)
    owner_reference = models.CharField(max_length=180, blank=True, db_index=True)
    client = models.ForeignKey(FinanceClient, null=True, blank=True, on_delete=models.PROTECT, related_name="bank_accounts")
    vendor = models.ForeignKey(Vendor, null=True, blank=True, on_delete=models.PROTECT, related_name="bank_accounts")
    account_name = models.CharField(max_length=180)
    bank_name = models.CharField(max_length=160)
    account_number = models.CharField(max_length=40, db_index=True)
    ifsc_code = models.CharField(max_length=20, db_index=True)
    branch = models.CharField(max_length=160, blank=True)
    account_type = models.CharField(max_length=40, default="Current")
    purpose = models.CharField(max_length=60, default="General", db_index=True)
    is_primary = models.BooleanField(default=False, db_index=True)
    status = models.CharField(max_length=20, default="active", db_index=True)
    verification_status = models.CharField(max_length=20, choices=VerificationStatus.choices, default=VerificationStatus.PENDING, db_index=True)
    verification_note = models.TextField(blank=True)
    last_verified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "bank_accounts"
        indexes = [
            models.Index(fields=["owner_type", "status"]),
            models.Index(fields=["account_number", "ifsc_code"]),
            models.Index(fields=["owner_reference", "is_primary"]),
        ]


class Quotation(BaseModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PENDING_APPROVAL = "pending_approval", "Pending Approval"
        APPROVED = "approved", "Approved"
        SENT = "sent", "Sent"
        CLIENT_ACCEPTED = "client_accepted", "Client Accepted"
        ARCHIVED = "archived", "Archived"

    quotation_number = models.CharField(max_length=40, unique=True)
    client = models.ForeignKey(FinanceClient, on_delete=models.PROTECT, related_name="quotations")
    project = models.ForeignKey("projects.DeliveryProject", null=True, blank=True, on_delete=models.SET_NULL, related_name="finance_quotations")
    agreement = models.ForeignKey("crm.ProjectAgreement", null=True, blank=True, on_delete=models.SET_NULL, related_name="finance_quotations")
    title = models.CharField(max_length=220)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.DRAFT, db_index=True)
    currency = models.CharField(max_length=8, default="INR")
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    taxable_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18)
    gst_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    valid_until = models.DateField(null=True, blank=True, db_index=True)
    terms = models.TextField(blank=True)

    class Meta:
        db_table = "quotations"
        indexes = [models.Index(fields=["quotation_number"]), models.Index(fields=["client", "status"]), models.Index(fields=["status", "valid_until"])]


class QuotationItem(BaseModel):
    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name="items")
    description = models.CharField(max_length=240)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit_price = models.DecimalField(max_digits=14, decimal_places=2)
    amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    class Meta:
        db_table = "quotation_items"
        indexes = [models.Index(fields=["quotation"])]


class Invoice(BaseModel):
    class SourceType(models.TextChoices):
        QUOTATION = "quotation", "Accepted Quotation"
        DIRECT = "direct", "Direct"
        MILESTONE = "milestone", "Milestone"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PENDING_APPROVAL = "pending_approval", "Pending Approval"
        APPROVED = "approved", "Approved"
        SENT = "sent", "Sent"
        CANCELLED = "cancelled", "Cancelled"
        ARCHIVED = "archived", "Archived"

    class PaymentStatus(models.TextChoices):
        NOT_DUE = "not_due", "Not Due"
        UNPAID = "unpaid", "Unpaid"
        PARTIALLY_PAID = "partially_paid", "Partially Paid"
        PAID = "paid", "Paid"
        OVERDUE = "overdue", "Overdue"

    invoice_number = models.CharField(max_length=40, unique=True)
    source_type = models.CharField(max_length=20, choices=SourceType.choices, default=SourceType.DIRECT, db_index=True)
    quotation = models.ForeignKey(Quotation, null=True, blank=True, on_delete=models.PROTECT, related_name="invoices")
    client = models.ForeignKey(FinanceClient, on_delete=models.PROTECT, related_name="invoices")
    project = models.ForeignKey("projects.DeliveryProject", null=True, blank=True, on_delete=models.SET_NULL, related_name="finance_invoices")
    milestone = models.ForeignKey("projects.ProjectMilestone", null=True, blank=True, on_delete=models.SET_NULL, related_name="finance_invoices")
    agreement = models.ForeignKey("crm.ProjectAgreement", null=True, blank=True, on_delete=models.SET_NULL, related_name="finance_invoices")
    invoice_date = models.DateField(db_index=True)
    due_date = models.DateField(db_index=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.DRAFT, db_index=True)
    payment_status = models.CharField(max_length=30, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID, db_index=True)
    currency = models.CharField(max_length=8, default="INR")
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    taxable_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18)
    gst_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    tds_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    remarks = models.TextField(blank=True)

    class Meta:
        db_table = "invoices"
        indexes = [
            models.Index(fields=["invoice_number"]),
            models.Index(fields=["client", "status"]),
            models.Index(fields=["due_date", "payment_status"]),
            models.Index(fields=["project", "status"]),
        ]


class InvoiceItem(BaseModel):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="items")
    description = models.CharField(max_length=240)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit_price = models.DecimalField(max_digits=14, decimal_places=2)
    amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    class Meta:
        db_table = "invoice_items"
        indexes = [models.Index(fields=["invoice"])]


class Payment(BaseModel):
    class AllocationType(models.TextChoices):
        INVOICE = "invoice", "Against Invoice"
        ADVANCE = "advance", "Client Advance / Unallocated"

    class Status(models.TextChoices):
        RECEIVED = "received", "Received"
        VERIFIED = "verified", "Verified"
        RECONCILED = "reconciled", "Reconciled"
        REVERSED = "reversed", "Reversed"

    payment_number = models.CharField(max_length=40, unique=True)
    client = models.ForeignKey(FinanceClient, on_delete=models.PROTECT, related_name="payments")
    allocation_type = models.CharField(max_length=20, choices=AllocationType.choices, default=AllocationType.INVOICE, db_index=True)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    tds_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    currency = models.CharField(max_length=8, default="INR")
    payment_date = models.DateField(db_index=True)
    mode = models.CharField(max_length=40)
    reference = models.CharField(max_length=120, unique=True)
    bank_account = models.ForeignKey(BankAccount, null=True, blank=True, on_delete=models.SET_NULL, related_name="payments")
    proof_name = models.CharField(max_length=240, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.RECEIVED, db_index=True)
    remarks = models.TextField(blank=True)

    class Meta:
        db_table = "payments"
        indexes = [models.Index(fields=["payment_number"]), models.Index(fields=["client", "status"]), models.Index(fields=["payment_date", "status"])]


class PaymentAllocation(BaseModel):
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name="allocations")
    invoice = models.ForeignKey(Invoice, on_delete=models.PROTECT, related_name="payment_allocations")
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    tds_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    class Meta:
        db_table = "payment_allocations"
        indexes = [models.Index(fields=["payment"]), models.Index(fields=["invoice"])]


class Reminder(BaseModel):
    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "Scheduled"
        SENT = "sent", "Sent"
        SNOOZED = "snoozed", "Snoozed"
        CANCELLED = "cancelled", "Cancelled"

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="reminders")
    channel = models.CharField(max_length=30, default="email")
    due_at = models.DateTimeField(db_index=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED, db_index=True)
    note = models.TextField(blank=True)

    class Meta:
        db_table = "reminders"
        indexes = [models.Index(fields=["status", "due_at"]), models.Index(fields=["invoice", "status"])]


class CreditNote(BaseModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PENDING_APPROVAL = "pending_approval", "Pending Approval"
        APPROVED = "approved", "Approved"
        APPLIED = "applied", "Applied"
        REJECTED = "rejected", "Rejected"
        ARCHIVED = "archived", "Archived"

    credit_note_number = models.CharField(max_length=40, unique=True)
    invoice = models.ForeignKey(Invoice, on_delete=models.PROTECT, related_name="credit_notes")
    reason = models.CharField(max_length=240)
    taxable_amount = models.DecimalField(max_digits=14, decimal_places=2)
    gst_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True)

    class Meta:
        db_table = "credit_notes"
        indexes = [models.Index(fields=["credit_note_number"]), models.Index(fields=["invoice", "status"])]


class LedgerEntry(BaseModel):
    class EntryType(models.TextChoices):
        SALE = "sale", "Sale"
        PURCHASE = "purchase", "Purchase"
        EXPENSE = "expense", "Expense"
        PAYROLL = "payroll", "Payroll"
        TAX = "tax", "Tax"
        ADJUSTMENT = "adjustment", "Adjustment"

    entry_number = models.CharField(max_length=40, unique=True)
    entry_type = models.CharField(max_length=20, choices=EntryType.choices, db_index=True)
    entry_date = models.DateField(db_index=True)
    client = models.ForeignKey(FinanceClient, null=True, blank=True, on_delete=models.PROTECT, related_name="ledger_entries")
    vendor = models.ForeignKey(Vendor, null=True, blank=True, on_delete=models.PROTECT, related_name="ledger_entries")
    invoice = models.ForeignKey(Invoice, null=True, blank=True, on_delete=models.SET_NULL, related_name="ledger_entries")
    description = models.CharField(max_length=240)
    debit = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    credit = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    status = models.CharField(max_length=20, default="posted", db_index=True)

    class Meta:
        db_table = "ledger_entries"
        indexes = [models.Index(fields=["entry_number"]), models.Index(fields=["entry_type", "entry_date"]), models.Index(fields=["client", "entry_date"])]


class ExpenseEntry(BaseModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PENDING_APPROVAL = "pending_approval", "Pending Approval"
        APPROVED = "approved", "Approved"
        PAID = "paid", "Paid"
        ARCHIVED = "archived", "Archived"

    expense_number = models.CharField(max_length=40, unique=True)
    ledger_entry = models.OneToOneField(LedgerEntry, null=True, blank=True, on_delete=models.SET_NULL, related_name="expense_detail")
    vendor = models.ForeignKey(Vendor, null=True, blank=True, on_delete=models.PROTECT, related_name="expenses")
    project = models.ForeignKey("projects.DeliveryProject", null=True, blank=True, on_delete=models.SET_NULL, related_name="finance_expenses")
    category = models.CharField(max_length=120, db_index=True)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    gst_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    expense_date = models.DateField(db_index=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.DRAFT, db_index=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "expense_entries"
        indexes = [models.Index(fields=["expense_number"]), models.Index(fields=["category", "status"]), models.Index(fields=["expense_date", "status"])]


class Budget(BaseModel):
    budget_code = models.CharField(max_length=40, unique=True)
    name = models.CharField(max_length=180, db_index=True)
    scope_type = models.CharField(max_length=30, default="Department", db_index=True)
    department = models.CharField(max_length=100, db_index=True)
    project = models.ForeignKey("projects.DeliveryProject", null=True, blank=True, on_delete=models.SET_NULL, related_name="finance_budgets")
    category = models.CharField(max_length=80, default="Operating Expenses", db_index=True)
    fiscal_year = models.CharField(max_length=20, default="FY 2026-27", db_index=True)
    period_start = models.DateField(db_index=True)
    period_end = models.DateField(db_index=True)
    allocated_amount = models.DecimalField(max_digits=14, decimal_places=2)
    contingency_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    consumed_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    committed_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    alert_threshold = models.DecimalField(max_digits=5, decimal_places=2, default=80)
    block_threshold = models.DecimalField(max_digits=5, decimal_places=2, default=100)
    owner = models.CharField(max_length=120, blank=True)
    cost_center = models.CharField(max_length=80, blank=True, db_index=True)
    remarks = models.TextField(blank=True)
    approved_by = models.CharField(max_length=120, blank=True)
    status = models.CharField(max_length=30, default="Draft", db_index=True)

    class Meta:
        db_table = "budgets"
        indexes = [
            models.Index(fields=["budget_code"]),
            models.Index(fields=["department", "status"]),
            models.Index(fields=["fiscal_year", "category"], name="budgets_fiscal__d59194_idx"),
            models.Index(fields=["period_start", "period_end"]),
        ]


class BudgetRevision(BaseModel):
    budget = models.ForeignKey(Budget, on_delete=models.CASCADE, related_name="revisions")
    old_amount = models.DecimalField(max_digits=14, decimal_places=2)
    new_amount = models.DecimalField(max_digits=14, decimal_places=2)
    reason = models.TextField()
    status = models.CharField(max_length=20, default="Pending", db_index=True)
    requested_by = models.CharField(max_length=120, blank=True)
    approved_by = models.CharField(max_length=120, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "budget_revisions"
        indexes = [models.Index(fields=["budget", "-created_at"])]


class FinancePayrollRecord(BaseModel):
    payroll_number = models.CharField(max_length=40, unique=True)
    hrms_payroll = models.ForeignKey("hrms.PayrollRecord", null=True, blank=True, on_delete=models.SET_NULL, related_name="finance_records")
    month = models.CharField(max_length=7, db_index=True)
    total_gross = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_deductions = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    net_payable = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=40, default="NEFT")
    payment_reference = models.CharField(max_length=120, blank=True, db_index=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    remarks = models.TextField(blank=True)
    status = models.CharField(max_length=30, default="draft", db_index=True)

    class Meta:
        db_table = "payroll_register"
        indexes = [models.Index(fields=["payroll_number"]), models.Index(fields=["month", "status"]), models.Index(fields=["payment_reference"], name="payroll_reg_payment_eac6e4_idx")]


class GSTReturn(BaseModel):
    period = models.CharField(max_length=7, db_index=True)
    outward_taxable = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    credit_taxable = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    output_gst = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    credit_tax_reversal = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    input_credit = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    ineligible_itc = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    pending_itc = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    gstr1_taxable = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    gstr1_tax = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    gstr3b_output = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    gstr3b_itc = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    cash_ledger_balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    net_payable = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    filing_due_date = models.DateField(null=True, blank=True, db_index=True)
    prepared_by = models.CharField(max_length=120, blank=True)
    approved_by = models.CharField(max_length=120, blank=True)
    arn = models.CharField(max_length=120, blank=True, db_index=True)
    filed_at = models.DateTimeField(null=True, blank=True)
    remarks = models.TextField(blank=True)
    status = models.CharField(max_length=30, default="draft", db_index=True)

    class Meta:
        db_table = "gst_returns"
        constraints = [models.UniqueConstraint(fields=["period"], name="unique_gst_period")]
        indexes = [models.Index(fields=["period", "status"]), models.Index(fields=["arn"], name="gst_returns_arn_8df58b_idx")]


class TDSRecord(BaseModel):
    tds_number = models.CharField(max_length=40, unique=True)
    client = models.ForeignKey(FinanceClient, null=True, blank=True, on_delete=models.PROTECT, related_name="tds_records")
    payment = models.ForeignKey(Payment, null=True, blank=True, on_delete=models.SET_NULL, related_name="tds_records")
    source_type = models.CharField(max_length=40, default="Client TDS Receivable", db_index=True)
    source_id = models.CharField(max_length=120, blank=True, db_index=True)
    party_id = models.CharField(max_length=80, blank=True, db_index=True)
    party_name = models.CharField(max_length=180, blank=True)
    section = models.CharField(max_length=20, default="194J", db_index=True)
    taxable_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    rate = models.DecimalField(max_digits=7, decimal_places=3, default=0)
    period = models.CharField(max_length=30, db_index=True)
    deduction_date = models.DateField(null=True, blank=True, db_index=True)
    deposit_due_date = models.DateField(null=True, blank=True, db_index=True)
    deducted_amount = models.DecimalField(max_digits=14, decimal_places=2)
    challan_no = models.CharField(max_length=120, blank=True, db_index=True)
    challan_date = models.DateField(null=True, blank=True)
    return_ack_no = models.CharField(max_length=120, blank=True, db_index=True)
    certificate_reference = models.CharField(max_length=120, blank=True)
    certificate_status = models.CharField(max_length=30, default="Pending", db_index=True)
    lower_deduction_certificate = models.CharField(max_length=120, blank=True)
    remarks = models.TextField(blank=True)
    status = models.CharField(max_length=30, default="pending", db_index=True)

    class Meta:
        db_table = "tds_records"
        indexes = [
            models.Index(fields=["tds_number"]),
            models.Index(fields=["period", "status"]),
            models.Index(fields=["client", "period"]),
            models.Index(fields=["source_type", "status"], name="tds_records_source__58c30a_idx"),
            models.Index(fields=["source_id"], name="tds_records_source__4c49ac_idx"),
        ]


class ApprovalPolicy(BaseModel):
    name = models.CharField(max_length=160)
    module = models.CharField(max_length=80, db_index=True)
    min_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    max_amount = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    approver_role = models.CharField(max_length=80)
    second_approver_role = models.CharField(max_length=80, blank=True)
    sla_hours = models.PositiveSmallIntegerField(default=8)
    is_enabled = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "approval_policies"
        indexes = [models.Index(fields=["module", "is_enabled"]), models.Index(fields=["module", "min_amount", "max_amount"])]


class ApprovalRequest(BaseModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        IN_REVIEW = "in_review", "In Review"
        CLARIFICATION_REQUIRED = "clarification_required", "Clarification Required"
        HOLD = "hold", "Hold"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        CANCELLED = "cancelled", "Cancelled"

    class Risk(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    request_number = models.CharField(max_length=40, unique=True)
    module = models.CharField(max_length=80, db_index=True)
    entity_type = models.CharField(max_length=80)
    entity_id = models.CharField(max_length=80)
    amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    department = models.CharField(max_length=120, blank=True)
    requester_name = models.CharField(max_length=160, blank=True)
    requester_role = models.CharField(max_length=80, blank=True)
    current_approver_role = models.CharField(max_length=80, db_index=True, blank=True)
    second_approver_role = models.CharField(max_length=80, blank=True)
    approval_level = models.PositiveSmallIntegerField(default=1)
    risk = models.CharField(max_length=20, choices=Risk.choices, default=Risk.LOW, db_index=True)
    policy = models.ForeignKey(ApprovalPolicy, null=True, blank=True, on_delete=models.SET_NULL, related_name="requests")
    budget_status = models.CharField(max_length=40, default="Not Applicable")
    duplicate_check = models.CharField(max_length=20, default="Clear")
    compliance_check = models.CharField(max_length=20, default="Clear")
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING, db_index=True)
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="finance_approval_requests")
    decided_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="finance_approval_decisions")
    decision_note = models.TextField(blank=True)
    due_at = models.DateTimeField(null=True, blank=True, db_index=True)
    summary = models.TextField(blank=True)
    events = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = "approval_requests"
        indexes = [
            models.Index(fields=["request_number"]),
            models.Index(fields=["module", "status"]),
            models.Index(fields=["current_approver_role", "status"]),
            models.Index(fields=["entity_type", "entity_id"]),
        ]


class FinanceAccessPolicy(BaseModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"

    role_name = models.CharField(max_length=80, db_index=True)
    description = models.CharField(max_length=180, blank=True)
    module = models.CharField(max_length=80, db_index=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    is_protected = models.BooleanField(default=False, db_index=True)
    users_count = models.PositiveIntegerField(default=0)
    data_scope = models.CharField(max_length=40, default="Department")
    approval_limit = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    audit_access = models.CharField(max_length=30, default="No Access")
    last_reviewed_at = models.DateField(null=True, blank=True)
    next_review_date = models.DateField(null=True, blank=True, db_index=True)
    can_view = models.BooleanField(default=True)
    can_create = models.BooleanField(default=False)
    can_edit = models.BooleanField(default=False)
    can_archive = models.BooleanField(default=False)
    can_approve = models.BooleanField(default=False)
    can_export = models.BooleanField(default=False)

    class Meta:
        db_table = "finance_access_policies"
        constraints = [models.UniqueConstraint(fields=["role_name", "module"], name="unique_finance_role_module_policy")]
        indexes = [models.Index(fields=["role_name", "module"]), models.Index(fields=["status", "next_review_date"])]
