from django.conf import settings
from django.db import models

from apps.core.models import BaseModel


class SupportTicket(BaseModel):
    class Module(models.TextChoices):
        CLIENT_OPERATIONS = "Client Operations", "Client Operations"
        LEAD_DESK = "Lead Desk", "Lead Desk"
        DELIVERY_PROJECTS = "Delivery Projects", "Delivery Projects"
        PEOPLE_OPERATIONS = "People Operations", "People Operations"
        FINANCE_CONTROL = "Finance Control", "Finance Control"
        GROWTH_MARKETING = "Growth Marketing", "Growth Marketing"
        ADMIN_CONTROL = "Admin Control", "Admin Control"
        SUPPORT_DESK = "Support Desk", "Support Desk"

    class Priority(models.TextChoices):
        LOW = "Low", "Low"
        MEDIUM = "Medium", "Medium"
        HIGH = "High", "High"
        CRITICAL = "Critical", "Critical"

    class Status(models.TextChoices):
        OPEN = "Open", "Open"
        IN_PROGRESS = "In Progress", "In Progress"
        WAITING = "Waiting", "Waiting"
        RESOLVED = "Resolved", "Resolved"

    class Channel(models.TextChoices):
        INTERNAL = "Internal", "Internal"
        PHONE = "Phone", "Phone"
        EMAIL = "Email", "Email"
        WHATSAPP = "WhatsApp", "WhatsApp"

    ticket_number = models.CharField(max_length=24, unique=True)
    subject = models.CharField(max_length=180, db_index=True)
    module = models.CharField(max_length=60, choices=Module.choices, db_index=True)
    requester = models.CharField(max_length=160, db_index=True)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM, db_index=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN, db_index=True)
    channel = models.CharField(max_length=20, choices=Channel.choices, default=Channel.INTERNAL, db_index=True)
    current_owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="support_tickets",
    )
    response_due_at = models.DateTimeField(null=True, blank=True, db_index=True)
    description = models.TextField()
    resolved_at = models.DateTimeField(null=True, blank=True, db_index=True)
    resolution_summary = models.TextField(blank=True)

    class Meta:
        db_table = "support_tickets"
        indexes = [
            models.Index(fields=["ticket_number"]),
            models.Index(fields=["status", "priority"]),
            models.Index(fields=["module", "status"]),
            models.Index(fields=["current_owner", "status"]),
        ]

    def __str__(self) -> str:
        return f"{self.ticket_number} - {self.subject}"


class SupportTicketComment(BaseModel):
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="support_ticket_comments",
    )
    message = models.TextField()
    is_internal = models.BooleanField(default=True)

    class Meta:
        db_table = "ticket_comments"
        ordering = ("created_at",)

    def __str__(self) -> str:
        return f"{self.ticket.ticket_number} comment"


class SupportTicketStatusHistory(BaseModel):
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name="status_history")
    from_status = models.CharField(max_length=20, blank=True)
    to_status = models.CharField(max_length=20, choices=SupportTicket.Status.choices)
    note = models.TextField(blank=True)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="support_ticket_status_changes",
    )

    class Meta:
        db_table = "ticket_status_history"
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["ticket", "-created_at"])]

    def __str__(self) -> str:
        return f"{self.ticket.ticket_number} {self.from_status} -> {self.to_status}"


class SupportTicketAssignment(BaseModel):
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name="assignments")
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="support_ticket_assignments",
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="support_ticket_assignments_created",
    )
    note = models.TextField(blank=True)
    is_current = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "ticket_assignments"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["ticket", "is_current"]),
            models.Index(fields=["owner", "is_current"]),
        ]

    def __str__(self) -> str:
        return f"{self.ticket.ticket_number} -> {self.owner_id}"
