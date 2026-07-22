from decimal import Decimal

from rest_framework import serializers

from apps.crm.models import ProjectClient
from apps.finance.models import (
    ApprovalPolicy,
    ApprovalRequest,
    BankAccount,
    Budget,
    BudgetRevision,
    CreditNote,
    ExpenseEntry,
    FinanceAccessPolicy,
    FinanceClient,
    FinancePayrollRecord,
    GSTReturn,
    Invoice,
    InvoiceItem,
    LedgerEntry,
    Payment,
    PaymentAllocation,
    Quotation,
    QuotationItem,
    Reminder,
    TDSRecord,
    Vendor,
)


class FinanceClientSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = FinanceClient
        fields = "__all__"
        read_only_fields = ("client_code", "outstanding_amount", "created_by", "updated_by", "deleted_by", "is_deleted", "deleted_at")


class FinanceClientWriteSerializer(serializers.Serializer):
    project_client_id = serializers.UUIDField(required=False, allow_null=True)
    company_name = serializers.CharField(max_length=180)
    contact_person = serializers.CharField(max_length=160)
    email = serializers.EmailField(required=False, allow_blank=True)
    mobile = serializers.CharField(max_length=20, required=False, allow_blank=True)
    gstin = serializers.CharField(max_length=20, required=False, allow_blank=True)
    pan = serializers.CharField(max_length=12, required=False, allow_blank=True)
    billing_address = serializers.CharField(required=False, allow_blank=True)
    currency = serializers.CharField(max_length=8, default="INR")
    payment_terms = serializers.CharField(max_length=80, default="Net 15")
    credit_limit = serializers.DecimalField(max_digits=14, decimal_places=2, required=False)
    status = serializers.ChoiceField(choices=FinanceClient.Status.choices, default=FinanceClient.Status.ACTIVE)

    def validate_project_client_id(self, value):
        if value is None:
            return value
        try:
            project_client = ProjectClient.objects.get(id=value, is_deleted=False)
        except ProjectClient.DoesNotExist as exc:
            raise serializers.ValidationError("Project client does not exist.") from exc
        finance_client = self.context.get("finance_client")
        duplicate = FinanceClient.objects.filter(project_client=project_client, is_deleted=False)
        if finance_client:
            duplicate = duplicate.exclude(id=finance_client.id)
        if duplicate.exists():
            raise serializers.ValidationError("Finance client already exists for this project client.")
        return project_client

    def validate(self, attrs):
        if "project_client_id" in attrs:
            attrs["project_client"] = attrs.pop("project_client_id")
        return attrs


class VendorSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Vendor
        fields = "__all__"
        read_only_fields = ("vendor_code", "created_by", "updated_by", "deleted_by", "is_deleted", "deleted_at")


class VendorWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = ("company_name", "contact_person", "email", "mobile", "gstin", "pan", "billing_address", "payment_terms", "status")


class BankAccountSerializer(serializers.ModelSerializer):
    owner_type_label = serializers.CharField(source="get_owner_type_display", read_only=True)
    verification_status_label = serializers.CharField(source="get_verification_status_display", read_only=True)

    class Meta:
        model = BankAccount
        fields = "__all__"


class BankAccountWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = (
            "owner_type", "owner_reference", "client", "vendor", "account_name", "bank_name", "account_number",
            "ifsc_code", "branch", "account_type", "purpose", "is_primary", "status", "verification_status",
            "verification_note", "last_verified_at",
        )

    def validate(self, attrs):
        bank_account = self.context.get("bank_account")
        owner_type = attrs.get("owner_type", getattr(bank_account, "owner_type", BankAccount.OwnerType.COMPANY))
        if owner_type == BankAccount.OwnerType.CLIENT and not attrs.get("client"):
            attrs["client"] = getattr(bank_account, "client", None)
        if owner_type == BankAccount.OwnerType.VENDOR and not attrs.get("vendor"):
            attrs["vendor"] = getattr(bank_account, "vendor", None)
        if owner_type == BankAccount.OwnerType.CLIENT and not attrs.get("client") and not (attrs.get("owner_reference") or getattr(bank_account, "owner_reference", "")):
            raise serializers.ValidationError({"owner_reference": "Client bank account requires a client reference."})
        if owner_type == BankAccount.OwnerType.VENDOR and not attrs.get("vendor") and not (attrs.get("owner_reference") or getattr(bank_account, "owner_reference", "")):
            raise serializers.ValidationError({"owner_reference": "Vendor bank account requires a vendor reference."})
        account_number = attrs.get("account_number", getattr(bank_account, "account_number", "")).strip()
        ifsc_code = attrs.get("ifsc_code", getattr(bank_account, "ifsc_code", "")).strip().upper()
        attrs["account_number"] = account_number
        attrs["ifsc_code"] = ifsc_code
        duplicate = BankAccount.objects.filter(is_deleted=False, account_number=account_number, ifsc_code=ifsc_code)
        if bank_account:
            duplicate = duplicate.exclude(id=bank_account.id)
        if duplicate.exists():
            raise serializers.ValidationError({"account_number": "This account number and IFSC combination already exists."})
        status = attrs.get("status", getattr(bank_account, "status", "active"))
        verification_status = attrs.get("verification_status", getattr(bank_account, "verification_status", BankAccount.VerificationStatus.PENDING))
        verification_note = attrs.get("verification_note", getattr(bank_account, "verification_note", ""))
        if verification_status != BankAccount.VerificationStatus.PENDING and len(verification_note.strip()) < 8:
            raise serializers.ValidationError({"verification_note": "Verification note must contain at least 8 characters."})
        if attrs.get("is_primary", getattr(bank_account, "is_primary", False)) and (status != "active" or verification_status != BankAccount.VerificationStatus.VERIFIED):
            raise serializers.ValidationError({"is_primary": "Only active and verified bank accounts can be primary."})
        return attrs


class QuotationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuotationItem
        fields = ("id", "description", "quantity", "unit_price", "amount")


class QuotationSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Quotation
        fields = "__all__"
        read_only_fields = ("quotation_number", "subtotal", "taxable_amount", "gst_amount", "total_amount")

    def get_items(self, obj):
        return QuotationItemSerializer(obj.items.filter(is_deleted=False), many=True).data


class QuotationWriteSerializer(serializers.Serializer):
    client_id = serializers.UUIDField()
    project_id = serializers.UUIDField(required=False, allow_null=True)
    agreement_id = serializers.UUIDField(required=False, allow_null=True)
    title = serializers.CharField(max_length=220)
    description = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=Quotation.Status.choices, default=Quotation.Status.DRAFT)
    currency = serializers.CharField(max_length=8, default="INR")
    discount = serializers.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0"))
    gst_rate = serializers.DecimalField(max_digits=5, decimal_places=2, default=Decimal("18"))
    valid_until = serializers.DateField(required=False, allow_null=True)
    terms = serializers.CharField(required=False, allow_blank=True)
    items = serializers.ListField(child=serializers.DictField(), min_length=1)


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ("id", "description", "quantity", "unit_price", "amount")


class InvoiceSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    payment_status_label = serializers.CharField(source="get_payment_status_display", read_only=True)

    class Meta:
        model = Invoice
        fields = "__all__"
        read_only_fields = ("invoice_number", "subtotal", "taxable_amount", "gst_amount", "total_amount", "paid_amount", "tds_amount", "payment_status")

    def get_items(self, obj):
        return InvoiceItemSerializer(obj.items.filter(is_deleted=False), many=True).data


class InvoiceWriteSerializer(serializers.Serializer):
    source_type = serializers.ChoiceField(choices=Invoice.SourceType.choices, default=Invoice.SourceType.DIRECT)
    quotation_id = serializers.UUIDField(required=False, allow_null=True)
    client_id = serializers.UUIDField()
    project_id = serializers.UUIDField(required=False, allow_null=True)
    milestone_id = serializers.UUIDField(required=False, allow_null=True)
    agreement_id = serializers.UUIDField(required=False, allow_null=True)
    invoice_date = serializers.DateField()
    due_date = serializers.DateField()
    status = serializers.ChoiceField(choices=Invoice.Status.choices, default=Invoice.Status.DRAFT)
    currency = serializers.CharField(max_length=8, default="INR")
    discount = serializers.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0"))
    gst_rate = serializers.DecimalField(max_digits=5, decimal_places=2, default=Decimal("18"))
    remarks = serializers.CharField(required=False, allow_blank=True)
    items = serializers.ListField(child=serializers.DictField(), min_length=1)

    def validate(self, attrs):
        invoice_date = attrs.get("invoice_date")
        due_date = attrs.get("due_date")
        if invoice_date and due_date and due_date < invoice_date:
            raise serializers.ValidationError({"due_date": "Due date cannot be before invoice date."})
        return attrs


class PaymentAllocationWriteSerializer(serializers.Serializer):
    invoice_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=14, decimal_places=2)
    tds_amount = serializers.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0"))


class PaymentAllocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentAllocation
        fields = "__all__"


class PaymentSerializer(serializers.ModelSerializer):
    allocations = PaymentAllocationSerializer(many=True, read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    allocation_type_label = serializers.CharField(source="get_allocation_type_display", read_only=True)

    class Meta:
        model = Payment
        fields = "__all__"
        read_only_fields = ("payment_number",)


class PaymentWriteSerializer(serializers.Serializer):
    client_id = serializers.UUIDField()
    allocation_type = serializers.ChoiceField(choices=Payment.AllocationType.choices, default=Payment.AllocationType.INVOICE)
    amount = serializers.DecimalField(max_digits=14, decimal_places=2)
    tds_amount = serializers.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0"))
    currency = serializers.CharField(max_length=8, default="INR")
    payment_date = serializers.DateField()
    mode = serializers.CharField(max_length=40)
    reference = serializers.CharField(max_length=120)
    bank_account_id = serializers.UUIDField(required=False, allow_null=True)
    proof_name = serializers.CharField(max_length=240, required=False, allow_blank=True)
    remarks = serializers.CharField(required=False, allow_blank=True)
    allocations = PaymentAllocationWriteSerializer(many=True, required=False)


class ReminderSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Reminder
        fields = "__all__"


class ReminderWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reminder
        fields = ("invoice", "channel", "due_at", "status", "note")


class CreditNoteSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = CreditNote
        fields = "__all__"
        read_only_fields = ("credit_note_number",)


class CreditNoteWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditNote
        fields = ("invoice", "reason", "taxable_amount", "gst_amount", "total_amount", "status")


class LedgerEntrySerializer(serializers.ModelSerializer):
    entry_type_label = serializers.CharField(source="get_entry_type_display", read_only=True)

    class Meta:
        model = LedgerEntry
        fields = "__all__"
        read_only_fields = ("entry_number",)


class LedgerEntryWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = LedgerEntry
        fields = ("entry_type", "entry_date", "client", "vendor", "invoice", "description", "debit", "credit", "status")


class ExpenseEntrySerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = ExpenseEntry
        fields = "__all__"
        read_only_fields = ("expense_number", "ledger_entry")


class ExpenseEntryWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseEntry
        fields = ("vendor", "project", "category", "amount", "gst_amount", "expense_date", "status", "notes")


class BudgetRevisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetRevision
        fields = "__all__"


class BudgetRevisionWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetRevision
        fields = ("budget", "old_amount", "new_amount", "reason", "status", "requested_by", "approved_by", "approved_at")


class BudgetSerializer(serializers.ModelSerializer):
    revisions = BudgetRevisionSerializer(many=True, read_only=True)

    class Meta:
        model = Budget
        fields = "__all__"
        read_only_fields = ("budget_code",)


class BudgetWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = (
            "name",
            "scope_type",
            "department",
            "project",
            "category",
            "fiscal_year",
            "period_start",
            "period_end",
            "allocated_amount",
            "contingency_amount",
            "consumed_amount",
            "committed_amount",
            "alert_threshold",
            "block_threshold",
            "owner",
            "cost_center",
            "remarks",
            "approved_by",
            "status",
        )

    def validate(self, attrs):
        budget = self.context.get("budget")
        period_start = attrs.get("period_start") or getattr(budget, "period_start", None)
        period_end = attrs.get("period_end") or getattr(budget, "period_end", None)
        if period_start and period_end and period_end < period_start:
            raise serializers.ValidationError({"period_end": "Budget period end cannot be before start."})
        alert_threshold = attrs.get("alert_threshold") or getattr(budget, "alert_threshold", 80)
        block_threshold = attrs.get("block_threshold") or getattr(budget, "block_threshold", 100)
        if block_threshold < alert_threshold:
            raise serializers.ValidationError({"block_threshold": "Block threshold must be at or above alert threshold."})
        scope_type = attrs.get("scope_type") or getattr(budget, "scope_type", "Department")
        project = attrs.get("project") if "project" in attrs else getattr(budget, "project", None)
        if scope_type == "Project" and not project:
            raise serializers.ValidationError({"project": "Project budget requires a delivery project."})
        department = attrs.get("department") or getattr(budget, "department", "")
        category = attrs.get("category") or getattr(budget, "category", "")
        fiscal_year = attrs.get("fiscal_year") or getattr(budget, "fiscal_year", "")
        duplicate = Budget.objects.filter(
            is_deleted=False,
            scope_type=scope_type,
            department=department,
            project=project,
            category=category,
            fiscal_year=fiscal_year,
        ).exclude(status__in=["Rejected", "Archived", "Closed"])
        if budget:
            duplicate = duplicate.exclude(id=budget.id)
        if duplicate.exists():
            raise serializers.ValidationError({"category": "An active budget already exists for this scope, category, and financial year."})
        return attrs


class FinancePayrollRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancePayrollRecord
        fields = "__all__"
        read_only_fields = ("payroll_number",)


class FinancePayrollRecordWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancePayrollRecord
        fields = ("hrms_payroll", "month", "total_gross", "total_deductions", "net_payable", "payment_method", "payment_reference", "paid_at", "remarks", "status")

    def validate(self, attrs):
        hrms_payroll = attrs.get("hrms_payroll") or getattr(self.context.get("payroll_record"), "hrms_payroll", None)
        month = attrs.get("month") or getattr(self.context.get("payroll_record"), "month", None)
        if hrms_payroll and month:
            duplicate = FinancePayrollRecord.objects.filter(is_deleted=False, hrms_payroll=hrms_payroll, month=month)
            payroll_record = self.context.get("payroll_record")
            if payroll_record:
                duplicate = duplicate.exclude(id=payroll_record.id)
            if duplicate.exists():
                raise serializers.ValidationError({"hrms_payroll": "Finance payroll record already exists for this HRMS payroll."})
        if attrs.get("status") == "paid" and not attrs.get("payment_reference") and getattr(self.context.get("payroll_record"), "payment_reference", "") == "":
            raise serializers.ValidationError({"payment_reference": "Payment reference is required before marking paid."})
        return attrs


class GSTReturnSerializer(serializers.ModelSerializer):
    class Meta:
        model = GSTReturn
        fields = "__all__"


class GSTReturnWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = GSTReturn
        fields = (
            "period",
            "outward_taxable",
            "credit_taxable",
            "output_gst",
            "credit_tax_reversal",
            "input_credit",
            "ineligible_itc",
            "pending_itc",
            "gstr1_taxable",
            "gstr1_tax",
            "gstr3b_output",
            "gstr3b_itc",
            "cash_ledger_balance",
            "net_payable",
            "filing_due_date",
            "prepared_by",
            "approved_by",
            "arn",
            "filed_at",
            "remarks",
            "status",
        )

    def validate(self, attrs):
        gst_return = self.context.get("gst_return")
        period = attrs.get("period") or getattr(gst_return, "period", "")
        filing_due_date = attrs.get("filing_due_date") or getattr(gst_return, "filing_due_date", None)
        if filing_due_date and period and str(filing_due_date) < f"{period}-01":
            raise serializers.ValidationError({"filing_due_date": "Filing due date cannot be before the tax period."})
        arn = attrs.get("arn") or getattr(gst_return, "arn", "")
        if attrs.get("status") == "Filed" and not arn:
            raise serializers.ValidationError({"arn": "ARN is required before marking filed."})
        if arn:
            duplicate = GSTReturn.objects.filter(is_deleted=False, arn__iexact=arn)
            if gst_return:
                duplicate = duplicate.exclude(id=gst_return.id)
            if duplicate.exists():
                raise serializers.ValidationError({"arn": "ARN already exists."})
        return attrs


class TDSRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = TDSRecord
        fields = "__all__"
        read_only_fields = ("tds_number",)


class TDSRecordWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = TDSRecord
        fields = (
            "client",
            "payment",
            "source_type",
            "source_id",
            "party_id",
            "party_name",
            "section",
            "taxable_amount",
            "rate",
            "period",
            "deduction_date",
            "deposit_due_date",
            "deducted_amount",
            "challan_no",
            "challan_date",
            "return_ack_no",
            "certificate_reference",
            "certificate_status",
            "lower_deduction_certificate",
            "remarks",
            "status",
        )

    def validate(self, attrs):
        tds_record = self.context.get("tds_record")
        deduction_date = attrs.get("deduction_date") or getattr(tds_record, "deduction_date", None)
        deposit_due_date = attrs.get("deposit_due_date") or getattr(tds_record, "deposit_due_date", None)
        if deduction_date and deposit_due_date and deposit_due_date < deduction_date:
            raise serializers.ValidationError({"deposit_due_date": "Deposit due date cannot be before deduction date."})
        source_id = attrs.get("source_id") or getattr(tds_record, "source_id", "")
        if source_id:
            duplicate = TDSRecord.objects.filter(is_deleted=False, source_id=source_id).exclude(status="Reversed")
            if tds_record:
                duplicate = duplicate.exclude(id=tds_record.id)
            if duplicate.exists():
                raise serializers.ValidationError({"source_id": "An active TDS record already exists for this source transaction."})
        status = attrs.get("status") or getattr(tds_record, "status", "")
        source_type = attrs.get("source_type") or getattr(tds_record, "source_type", "")
        challan_no = attrs.get("challan_no") or getattr(tds_record, "challan_no", "")
        challan_date = attrs.get("challan_date") or getattr(tds_record, "challan_date", None)
        if status in {"Deposited", "Filed", "Closed"} and source_type != "Client TDS Receivable" and (not challan_no or not challan_date):
            raise serializers.ValidationError({"challan_no": "Challan number and deposit date are required."})
        return attrs


class ApprovalPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = ApprovalPolicy
        fields = "__all__"


class ApprovalPolicyWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApprovalPolicy
        fields = ("name", "module", "min_amount", "max_amount", "approver_role", "second_approver_role", "sla_hours", "is_enabled")

    def validate(self, attrs):
        policy = self.context.get("approval_policy")
        min_amount = attrs.get("min_amount", getattr(policy, "min_amount", 0))
        max_amount = attrs.get("max_amount", getattr(policy, "max_amount", None))
        module = attrs.get("module", getattr(policy, "module", ""))
        is_enabled = attrs.get("is_enabled", getattr(policy, "is_enabled", True))
        approver_role = attrs.get("approver_role", getattr(policy, "approver_role", ""))
        second_approver_role = attrs.get("second_approver_role", getattr(policy, "second_approver_role", ""))
        if max_amount is not None and max_amount < min_amount:
            raise serializers.ValidationError({"max_amount": "Maximum amount cannot be below minimum amount."})
        if second_approver_role and second_approver_role == approver_role:
            raise serializers.ValidationError({"second_approver_role": "Second approver must be different from primary approver."})
        if is_enabled:
            query = ApprovalPolicy.objects.filter(is_deleted=False, is_enabled=True, module=module)
            if policy:
                query = query.exclude(id=policy.id)
            new_max = max_amount if max_amount is not None else Decimal("999999999999.99")
            for existing in query:
                existing_max = existing.max_amount if existing.max_amount is not None else Decimal("999999999999.99")
                if min_amount <= existing_max and new_max >= existing.min_amount:
                    raise serializers.ValidationError({"module": "An active approval policy already overlaps this module and amount range."})
        return attrs


class ApprovalRequestSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = ApprovalRequest
        fields = "__all__"
        read_only_fields = ("request_number", "requested_by", "decided_by")


class ApprovalRequestWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApprovalRequest
        fields = (
            "module", "entity_type", "entity_id", "amount", "department", "requester_name", "requester_role",
            "current_approver_role", "second_approver_role", "approval_level", "risk", "policy", "budget_status",
            "duplicate_check", "compliance_check", "status", "decision_note", "due_at", "summary", "events",
        )

    def validate(self, attrs):
        approval_request = self.context.get("approval_request")
        status = attrs.get("status", getattr(approval_request, "status", ApprovalRequest.Status.PENDING))
        current_approver_role = attrs.get("current_approver_role", getattr(approval_request, "current_approver_role", ""))
        decision_note = attrs.get("decision_note", getattr(approval_request, "decision_note", ""))
        if status in {ApprovalRequest.Status.APPROVED, ApprovalRequest.Status.REJECTED, ApprovalRequest.Status.CLARIFICATION_REQUIRED, ApprovalRequest.Status.HOLD} and len(decision_note.strip()) < 5:
            raise serializers.ValidationError({"decision_note": "Decision note must contain at least 5 characters."})
        if status not in {ApprovalRequest.Status.APPROVED, ApprovalRequest.Status.REJECTED, ApprovalRequest.Status.CANCELLED} and not current_approver_role:
            raise serializers.ValidationError({"current_approver_role": "Current approver role is required for open approval requests."})
        return attrs


class FinanceAccessPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = FinanceAccessPolicy
        fields = "__all__"


class FinanceAccessPolicyWriteSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(required=False)
    module = serializers.CharField(required=False)

    class Meta:
        model = FinanceAccessPolicy
        fields = (
            "role_name", "description", "module", "status", "is_protected", "users_count", "data_scope",
            "approval_limit", "audit_access", "last_reviewed_at", "next_review_date", "can_view",
            "can_create", "can_edit", "can_archive", "can_approve", "can_export",
        )

    def validate(self, attrs):
        policy = self.context.get("finance_access_policy")
        role_name = attrs.get("role_name", getattr(policy, "role_name", ""))
        module = attrs.get("module", getattr(policy, "module", ""))
        can_approve = attrs.get("can_approve", getattr(policy, "can_approve", False))
        approval_limit = attrs.get("approval_limit", getattr(policy, "approval_limit", None))
        audit_access = attrs.get("audit_access", getattr(policy, "audit_access", "No Access"))
        is_protected = attrs.get("is_protected", getattr(policy, "is_protected", False))
        next_review_date = attrs.get("next_review_date", getattr(policy, "next_review_date", None))
        if can_approve and (approval_limit is None or approval_limit <= Decimal("0")) and not is_protected:
            raise serializers.ValidationError({"approval_limit": "Set a positive approval limit when approval access is granted."})
        if not can_approve and approval_limit and approval_limit > Decimal("0"):
            raise serializers.ValidationError({"approval_limit": "Approval limit requires approve access."})
        if audit_access != "No Access" and module != "Audit Logs":
            raise serializers.ValidationError({"audit_access": "Audit access can only be granted on the Audit Logs module."})
        if module == "Access Control" and not is_protected:
            raise serializers.ValidationError({"module": "Access Control can only be assigned to protected administrator policy."})
        if next_review_date and self.context.get("request_date") and next_review_date < self.context["request_date"]:
            raise serializers.ValidationError({"next_review_date": "Next access review cannot be in the past."})
        query = FinanceAccessPolicy.objects.filter(is_deleted=False, role_name__iexact=role_name, module=module)
        if policy:
            query = query.exclude(id=policy.id)
        if query.exists():
            raise serializers.ValidationError({"role_name": "This role already has a policy for the selected module."})
        return attrs
