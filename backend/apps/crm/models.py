from django.db import models

from apps.core.models import BaseModel


class Lead(BaseModel):
    class LeadType(models.TextChoices):
        PROJECT = "project", "Project"
        TRADING = "trading", "Trading"

    class LeadStatus(models.TextChoices):
        NEW = "new", "New"
        CONTACTED = "contacted", "Contacted"
        QUALIFIED = "qualified", "Qualified"
        PROPOSAL = "proposal", "Proposal"
        WON = "won", "Won"
        LOST = "lost", "Lost"

    lead_number = models.CharField(max_length=40, unique=True)
    lead_type = models.CharField(max_length=20, choices=LeadType.choices, default=LeadType.PROJECT, db_index=True)
    status = models.CharField(max_length=30, choices=LeadStatus.choices, default=LeadStatus.NEW, db_index=True)
    source = models.CharField(max_length=80, blank=True, db_index=True)
    company_name = models.CharField(max_length=180, blank=True, db_index=True)
    contact_name = models.CharField(max_length=160)
    email = models.EmailField(blank=True)
    mobile = models.CharField(max_length=20, db_index=True)
    city = models.CharField(max_length=120, blank=True)
    requirement_summary = models.TextField(blank=True)
    estimated_value = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    assigned_to = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="assigned_leads",
    )

    class Meta:
        db_table = "leads"
        indexes = [
            models.Index(fields=["lead_number"]),
            models.Index(fields=["status", "lead_type"]),
            models.Index(fields=["mobile", "email"]),
            models.Index(fields=["company_name"]),
        ]

    def __str__(self) -> str:
        return f"{self.lead_number} - {self.contact_name}"


class LeadFollowUp(BaseModel):
    class Channel(models.TextChoices):
        CALL = "call", "Call"
        WHATSAPP = "whatsapp", "WhatsApp"
        EMAIL = "email", "Email"
        MEETING = "meeting", "Meeting"
        OTHER = "other", "Other"

    class Outcome(models.TextChoices):
        PENDING = "pending", "Pending"
        CONTACTED = "contacted", "Contacted"
        INTERESTED = "interested", "Interested"
        NOT_INTERESTED = "not_interested", "Not Interested"
        CALLBACK = "callback", "Callback"
        ESCALATED = "escalated", "Escalated"
        DONE = "done", "Done"

    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name="follow_ups")
    channel = models.CharField(max_length=20, choices=Channel.choices, default=Channel.CALL, db_index=True)
    outcome = models.CharField(max_length=30, choices=Outcome.choices, default=Outcome.PENDING, db_index=True)
    note = models.TextField()
    next_follow_up_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        db_table = "lead_follow_ups"
        indexes = [
            models.Index(fields=["lead", "-created_at"]),
            models.Index(fields=["outcome", "next_follow_up_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.lead.lead_number} - {self.outcome}"


class ProjectClient(BaseModel):
    class ProjectStatus(models.TextChoices):
        DISCOVERY = "discovery", "Discovery"
        DEVELOPMENT = "development", "Development"
        UAT = "uat", "UAT"
        AGREEMENT_PENDING = "agreement_pending", "Agreement Pending"

    class AgreementStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        DRAFTED = "drafted", "Drafted"
        SIGNED = "signed", "Signed"

    client_number = models.CharField(max_length=40, unique=True)
    source_lead = models.OneToOneField(
        Lead,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="project_client",
    )
    company_name = models.CharField(max_length=180, db_index=True)
    project_name = models.CharField(max_length=220)
    project_type = models.CharField(max_length=120, blank=True)
    project_status = models.CharField(max_length=30, choices=ProjectStatus.choices, default=ProjectStatus.DISCOVERY)
    project_owner = models.CharField(max_length=160, blank=True)
    team_leader = models.CharField(max_length=160, blank=True)
    telecaller = models.CharField(max_length=160, blank=True)
    agreement_status = models.CharField(max_length=30, choices=AgreementStatus.choices, default=AgreementStatus.PENDING)
    value = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    next_action = models.CharField(max_length=240, blank=True)

    class Meta:
        db_table = "project_clients"
        indexes = [
            models.Index(fields=["client_number"]),
            models.Index(fields=["company_name"]),
            models.Index(fields=["agreement_status", "project_status"]),
        ]

    def __str__(self) -> str:
        return f"{self.client_number} - {self.company_name}"


class ClientContact(BaseModel):
    class ContactRole(models.TextChoices):
        DECISION_MAKER = "decision_maker", "Decision Maker"
        TECHNICAL = "technical", "Technical"
        FINANCE = "finance", "Finance"
        DAILY_COORDINATOR = "daily_coordinator", "Daily Coordinator"

    client = models.ForeignKey(ProjectClient, on_delete=models.CASCADE, related_name="contacts")
    role = models.CharField(max_length=30, choices=ContactRole.choices, default=ContactRole.DECISION_MAKER)
    name = models.CharField(max_length=160)
    designation = models.CharField(max_length=120, blank=True)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    responsibility = models.CharField(max_length=240, blank=True)

    class Meta:
        db_table = "client_contacts"
        indexes = [
            models.Index(fields=["client", "role"]),
            models.Index(fields=["phone", "email"]),
        ]

    def __str__(self) -> str:
        return f"{self.client.client_number} - {self.name}"


class ProjectHandoff(BaseModel):
    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    class Status(models.TextChoices):
        PLANNING = "planning", "Planning"
        ACTIVE = "active", "Active"
        ON_HOLD = "on_hold", "On Hold"
        COMPLETED = "completed", "Completed"

    client = models.ForeignKey(ProjectClient, on_delete=models.CASCADE, related_name="project_handoffs")
    project_code = models.CharField(max_length=40, unique=True)
    project_manager = models.CharField(max_length=160)
    start_date = models.DateField()
    target_end_date = models.DateField()
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.HIGH)
    billing_model = models.CharField(max_length=80)
    delivery_method = models.CharField(max_length=80)
    communication_channel = models.CharField(max_length=160, blank=True)
    repository_url = models.URLField(blank=True)
    kickoff_notes = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANNING)

    class Meta:
        db_table = "project_handoffs"
        indexes = [
            models.Index(fields=["project_code"]),
            models.Index(fields=["status", "priority"]),
            models.Index(fields=["start_date", "target_end_date"]),
        ]

    def __str__(self) -> str:
        return f"{self.project_code} - {self.client.company_name}"


class ProjectAgreement(BaseModel):
    class AgreementType(models.TextChoices):
        MSA = "msa", "Master Service Agreement"
        SOW = "sow", "Statement of Work"
        NDA = "nda", "Non-Disclosure Agreement"
        SLA = "sla", "Service Level Agreement"

    class AgreementStatus(models.TextChoices):
        DRAFT = "draft", "Draft"
        UNDER_REVIEW = "under_review", "Under Review"
        SENT_FOR_SIGNATURE = "sent_for_signature", "Sent for Signature"
        ACTIVE = "active", "Active"
        EXPIRED = "expired", "Expired"
        TERMINATED = "terminated", "Terminated"

    agreement_number = models.CharField(max_length=40, unique=True)
    project_handoff = models.OneToOneField(
        ProjectHandoff,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="agreement",
    )
    client = models.ForeignKey(ProjectClient, on_delete=models.CASCADE, related_name="agreements")
    agreement_type = models.CharField(max_length=30, choices=AgreementType.choices, default=AgreementType.MSA)
    effective_date = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)
    contract_value = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    payment_terms = models.TextField(blank=True)
    status = models.CharField(max_length=30, choices=AgreementStatus.choices, default=AgreementStatus.DRAFT, db_index=True)
    remarks = models.TextField(blank=True)
    attachment_name = models.CharField(max_length=240, blank=True)

    class Meta:
        db_table = "project_agreements"
        indexes = [
            models.Index(fields=["agreement_number"]),
            models.Index(fields=["status", "agreement_type"]),
            models.Index(fields=["effective_date", "expiry_date"]),
        ]

    def __str__(self) -> str:
        return f"{self.agreement_number} - {self.client.company_name}"
