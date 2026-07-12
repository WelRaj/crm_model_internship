from rest_framework import serializers

from apps.accounts.serializers import UserSummarySerializer
from apps.crm.models import ClientContact, Lead, LeadFollowUp, ProjectAgreement, ProjectClient, ProjectHandoff
from apps.crm.selectors import find_duplicate_leads


class LeadSerializer(serializers.ModelSerializer):
    assigned_to = UserSummarySerializer(read_only=True)

    class Meta:
        model = Lead
        fields = (
            "id",
            "lead_number",
            "lead_type",
            "status",
            "source",
            "company_name",
            "contact_name",
            "email",
            "mobile",
            "city",
            "requirement_summary",
            "estimated_value",
            "assigned_to",
            "created_at",
            "updated_at",
        )


class LeadCreateSerializer(serializers.Serializer):
    lead_type = serializers.ChoiceField(choices=Lead.LeadType.choices, default=Lead.LeadType.PROJECT)
    source = serializers.CharField(max_length=80, required=False, allow_blank=True)
    company_name = serializers.CharField(max_length=180, required=False, allow_blank=True)
    contact_name = serializers.CharField(max_length=160)
    email = serializers.EmailField(required=False, allow_blank=True)
    mobile = serializers.CharField(max_length=20)
    city = serializers.CharField(max_length=120, required=False, allow_blank=True)
    requirement_summary = serializers.CharField(required=False, allow_blank=True)
    estimated_value = serializers.DecimalField(max_digits=14, decimal_places=2, required=False)

    def validate_mobile(self, value):
        digits = "".join(char for char in value if char.isdigit())
        if len(digits) == 12 and digits.startswith("91"):
            digits = digits[2:]
        if len(digits) != 10:
            raise serializers.ValidationError("Enter a valid 10-digit mobile number.")
        return digits

    def validate_email(self, value):
        return value.lower() if value else ""

    def validate(self, attrs):
        duplicates = find_duplicate_leads(
            mobile=attrs["mobile"],
            email=attrs.get("email", ""),
            company_name=attrs.get("company_name", ""),
        )
        if duplicates.exists():
            raise serializers.ValidationError({"duplicate": "Lead already exists with same mobile, email, or company."})
        return attrs


class LeadUpdateSerializer(serializers.Serializer):
    lead_type = serializers.ChoiceField(choices=Lead.LeadType.choices, required=False)
    status = serializers.ChoiceField(choices=Lead.LeadStatus.choices, required=False)
    source = serializers.CharField(max_length=80, required=False, allow_blank=True)
    company_name = serializers.CharField(max_length=180, required=False, allow_blank=True)
    contact_name = serializers.CharField(max_length=160, required=False)
    email = serializers.EmailField(required=False, allow_blank=True)
    mobile = serializers.CharField(max_length=20, required=False)
    city = serializers.CharField(max_length=120, required=False, allow_blank=True)
    requirement_summary = serializers.CharField(required=False, allow_blank=True)
    estimated_value = serializers.DecimalField(max_digits=14, decimal_places=2, required=False)

    def validate_mobile(self, value):
        digits = "".join(char for char in value if char.isdigit())
        if len(digits) == 12 and digits.startswith("91"):
            digits = digits[2:]
        if len(digits) != 10:
            raise serializers.ValidationError("Enter a valid 10-digit mobile number.")
        return digits

    def validate_email(self, value):
        return value.lower() if value else ""

    def validate(self, attrs):
        lead = self.context["lead"]
        duplicates = find_duplicate_leads(
            mobile=attrs.get("mobile", lead.mobile),
            email=attrs.get("email", lead.email),
            company_name=attrs.get("company_name", lead.company_name),
            exclude_lead_id=lead.id,
        )
        if duplicates.exists():
            raise serializers.ValidationError({"duplicate": "Lead already exists with same mobile, email, or company."})
        return attrs


class LeadAssignSerializer(serializers.Serializer):
    assigned_to_id = serializers.IntegerField(required=False, allow_null=True)


class LeadFollowUpSerializer(serializers.ModelSerializer):
    created_by = UserSummarySerializer(read_only=True)
    lead_detail = LeadSerializer(source="lead", read_only=True)

    class Meta:
        model = LeadFollowUp
        fields = (
            "id",
            "lead",
            "lead_detail",
            "channel",
            "outcome",
            "note",
            "next_follow_up_at",
            "created_by",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "lead", "created_by", "created_at", "updated_at")


class LeadFollowUpCreateSerializer(serializers.Serializer):
    channel = serializers.ChoiceField(choices=LeadFollowUp.Channel.choices, default=LeadFollowUp.Channel.CALL)
    outcome = serializers.ChoiceField(choices=LeadFollowUp.Outcome.choices, default=LeadFollowUp.Outcome.PENDING)
    note = serializers.CharField()
    next_follow_up_at = serializers.DateTimeField(required=False, allow_null=True)

    def validate_note(self, value):
        note = value.strip()
        if len(note) < 3:
            raise serializers.ValidationError("Follow-up note must be at least 3 characters.")
        return note


class LeadOutcomeSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=(
            (Lead.LeadStatus.QUALIFIED, "Qualified"),
            (Lead.LeadStatus.PROPOSAL, "Proposal"),
            (Lead.LeadStatus.WON, "Won"),
            (Lead.LeadStatus.LOST, "Lost"),
        )
    )
    note = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        status = attrs["status"]
        note = attrs.get("note", "").strip()
        if status in {Lead.LeadStatus.WON, Lead.LeadStatus.LOST} and len(note) < 10:
            raise serializers.ValidationError({"note": "Won/Lost outcome requires at least 10 characters."})
        attrs["note"] = note
        return attrs


class ClientContactSerializer(serializers.ModelSerializer):
    role_label = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = ClientContact
        fields = (
            "id",
            "role",
            "role_label",
            "name",
            "designation",
            "phone",
            "email",
            "responsibility",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class ProjectClientSerializer(serializers.ModelSerializer):
    contacts = ClientContactSerializer(many=True, read_only=True)
    source_lead_detail = LeadSerializer(source="source_lead", read_only=True)
    project_status_label = serializers.CharField(source="get_project_status_display", read_only=True)
    agreement_status_label = serializers.CharField(source="get_agreement_status_display", read_only=True)

    class Meta:
        model = ProjectClient
        fields = (
            "id",
            "client_number",
            "source_lead",
            "source_lead_detail",
            "company_name",
            "project_name",
            "project_type",
            "project_status",
            "project_status_label",
            "project_owner",
            "team_leader",
            "telecaller",
            "agreement_status",
            "agreement_status_label",
            "value",
            "next_action",
            "contacts",
            "created_at",
            "updated_at",
        )


class ProjectClientCreateSerializer(serializers.Serializer):
    source_lead_id = serializers.UUIDField(required=False, allow_null=True)
    company_name = serializers.CharField(max_length=180)
    project_name = serializers.CharField(max_length=220)
    project_type = serializers.CharField(max_length=120, required=False, allow_blank=True)
    project_owner = serializers.CharField(max_length=160, required=False, allow_blank=True)
    team_leader = serializers.CharField(max_length=160, required=False, allow_blank=True)
    telecaller = serializers.CharField(max_length=160, required=False, allow_blank=True)
    agreement_status = serializers.ChoiceField(choices=ProjectClient.AgreementStatus.choices, default=ProjectClient.AgreementStatus.PENDING)
    value = serializers.DecimalField(max_digits=14, decimal_places=2, required=False)
    primary_contact = ClientContactSerializer(required=False)

    def validate(self, attrs):
        source_lead_id = attrs.get("source_lead_id")
        if source_lead_id and ProjectClient.objects.filter(source_lead_id=source_lead_id, is_deleted=False).exists():
            raise serializers.ValidationError({"source_lead_id": "Client already exists for this source lead."})
        return attrs


class ClientContactCreateSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=ClientContact.ContactRole.choices, default=ClientContact.ContactRole.DECISION_MAKER)
    name = serializers.CharField(max_length=160)
    designation = serializers.CharField(max_length=120, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20)
    email = serializers.EmailField(required=False, allow_blank=True)
    responsibility = serializers.CharField(max_length=240, required=False, allow_blank=True)

    def validate_phone(self, value):
        digits = "".join(char for char in value if char.isdigit())
        if len(digits) == 12 and digits.startswith("91"):
            digits = digits[2:]
        if len(digits) != 10:
            raise serializers.ValidationError("Enter a valid 10-digit phone number.")
        return digits

    def validate_email(self, value):
        return value.lower() if value else ""


class ProjectHandoffSerializer(serializers.ModelSerializer):
    client_detail = ProjectClientSerializer(source="client", read_only=True)
    priority_label = serializers.CharField(source="get_priority_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = ProjectHandoff
        fields = (
            "id",
            "client",
            "client_detail",
            "project_code",
            "project_manager",
            "start_date",
            "target_end_date",
            "priority",
            "priority_label",
            "billing_model",
            "delivery_method",
            "communication_channel",
            "repository_url",
            "kickoff_notes",
            "status",
            "status_label",
            "created_at",
            "updated_at",
        )


class ProjectHandoffCreateUpdateSerializer(serializers.Serializer):
    client_id = serializers.UUIDField(required=False)
    project_code = serializers.CharField(max_length=40)
    project_manager = serializers.CharField(max_length=160)
    start_date = serializers.DateField()
    target_end_date = serializers.DateField()
    priority = serializers.ChoiceField(choices=ProjectHandoff.Priority.choices, default=ProjectHandoff.Priority.HIGH)
    billing_model = serializers.CharField(max_length=80)
    delivery_method = serializers.CharField(max_length=80)
    communication_channel = serializers.CharField(max_length=160, required=False, allow_blank=True)
    repository_url = serializers.URLField(required=False, allow_blank=True)
    kickoff_notes = serializers.CharField()

    def validate(self, attrs):
        if attrs["target_end_date"] < attrs["start_date"]:
            raise serializers.ValidationError({"target_end_date": "Target end date cannot be earlier than start date."})
        if len(attrs["kickoff_notes"].strip()) < 10:
            raise serializers.ValidationError({"kickoff_notes": "Kickoff notes must include at least 10 characters."})
        return attrs


class ProjectAgreementSerializer(serializers.ModelSerializer):
    client_detail = ProjectClientSerializer(source="client", read_only=True)
    project_handoff_detail = ProjectHandoffSerializer(source="project_handoff", read_only=True)
    agreement_type_label = serializers.CharField(source="get_agreement_type_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = ProjectAgreement
        fields = (
            "id",
            "agreement_number",
            "project_handoff",
            "project_handoff_detail",
            "client",
            "client_detail",
            "agreement_type",
            "agreement_type_label",
            "effective_date",
            "expiry_date",
            "contract_value",
            "payment_terms",
            "status",
            "status_label",
            "remarks",
            "attachment_name",
            "created_at",
            "updated_at",
        )


class ProjectAgreementCreateUpdateSerializer(serializers.Serializer):
    project_handoff_id = serializers.UUIDField(required=False, allow_null=True)
    client_id = serializers.UUIDField(required=False)
    agreement_type = serializers.ChoiceField(choices=ProjectAgreement.AgreementType.choices, default=ProjectAgreement.AgreementType.MSA)
    effective_date = serializers.DateField()
    expiry_date = serializers.DateField(required=False, allow_null=True)
    contract_value = serializers.DecimalField(max_digits=14, decimal_places=2, required=False)
    payment_terms = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=ProjectAgreement.AgreementStatus.choices, default=ProjectAgreement.AgreementStatus.DRAFT)
    remarks = serializers.CharField(required=False, allow_blank=True)
    attachment_name = serializers.CharField(max_length=240, required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs.get("expiry_date") and attrs["expiry_date"] < attrs["effective_date"]:
            raise serializers.ValidationError({"expiry_date": "Expiry date cannot be earlier than effective date."})
        if attrs["status"] == ProjectAgreement.AgreementStatus.ACTIVE and not attrs.get("attachment_name"):
            raise serializers.ValidationError({"attachment_name": "Active agreements require a signed PDF attachment name."})
        return attrs
