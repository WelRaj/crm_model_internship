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
