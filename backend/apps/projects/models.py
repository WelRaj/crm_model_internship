from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.models import BaseModel


class DeliveryProject(BaseModel):
    class Status(models.TextChoices):
        PLANNING = "planning", "Planning"
        ACTIVE = "active", "Active"
        ON_HOLD = "on_hold", "On Hold"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    class HealthStatus(models.TextChoices):
        ON_TRACK = "on_track", "On Track"
        AT_RISK = "at_risk", "At Risk"
        DELAYED = "delayed", "Delayed"

    project_number = models.CharField(max_length=40, unique=True)
    source_handoff = models.OneToOneField(
        "crm.ProjectHandoff",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="delivery_project",
    )
    client = models.ForeignKey("crm.ProjectClient", on_delete=models.PROTECT, related_name="delivery_projects")
    name = models.CharField(max_length=220, db_index=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PLANNING, db_index=True)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.HIGH, db_index=True)
    health_status = models.CharField(max_length=20, choices=HealthStatus.choices, default=HealthStatus.ON_TRACK, db_index=True)
    project_manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="managed_delivery_projects",
    )
    start_date = models.DateField()
    target_end_date = models.DateField(db_index=True)
    actual_end_date = models.DateField(null=True, blank=True)
    progress_percent = models.PositiveSmallIntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    billing_model = models.CharField(max_length=80, blank=True)
    delivery_method = models.CharField(max_length=80, blank=True)
    communication_channel = models.CharField(max_length=160, blank=True)
    repository_url = models.URLField(blank=True)

    class Meta:
        db_table = "delivery_projects"
        indexes = [
            models.Index(fields=["project_number"]),
            models.Index(fields=["status", "priority"]),
            models.Index(fields=["target_end_date", "health_status"]),
            models.Index(fields=["client", "status"]),
        ]

    def __str__(self) -> str:
        return f"{self.project_number} - {self.name}"


class ProjectTeamAssignment(BaseModel):
    class Role(models.TextChoices):
        PROJECT_MANAGER = "project_manager", "Project Manager"
        TEAM_LEAD = "team_lead", "Team Lead"
        DEVELOPER = "developer", "Developer"
        DESIGNER = "designer", "Designer"
        QA = "qa", "QA"
        DEVOPS = "devops", "DevOps"
        BUSINESS_ANALYST = "business_analyst", "Business Analyst"
        VIEWER = "viewer", "Viewer"

    project = models.ForeignKey(DeliveryProject, on_delete=models.CASCADE, related_name="team_assignments")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="project_team_assignments")
    role = models.CharField(max_length=40, choices=Role.choices, db_index=True)
    allocation_percent = models.PositiveSmallIntegerField(default=100, validators=[MinValueValidator(1), MaxValueValidator(100)])
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    notes = models.CharField(max_length=240, blank=True)

    class Meta:
        db_table = "project_team_assignments"
        constraints = [
            models.UniqueConstraint(fields=["project", "user", "role"], name="unique_project_user_role"),
        ]
        indexes = [
            models.Index(fields=["project", "role"]),
            models.Index(fields=["user", "role"]),
        ]

    def __str__(self) -> str:
        return f"{self.project.project_number} - {self.user} - {self.role}"


class ProjectMilestone(BaseModel):
    class Status(models.TextChoices):
        PLANNED = "planned", "Planned"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        BLOCKED = "blocked", "Blocked"

    project = models.ForeignKey(DeliveryProject, on_delete=models.CASCADE, related_name="milestones")
    title = models.CharField(max_length=180)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PLANNED, db_index=True)
    sequence = models.PositiveSmallIntegerField(default=1)
    start_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    milestone_value = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    class Meta:
        db_table = "project_milestones"
        constraints = [
            models.UniqueConstraint(fields=["project", "sequence"], name="unique_project_milestone_sequence"),
        ]
        indexes = [
            models.Index(fields=["project", "status"]),
            models.Index(fields=["due_date", "status"]),
        ]
        ordering = ("sequence", "due_date")

    def __str__(self) -> str:
        return f"{self.project.project_number} - {self.title}"


class ProjectTask(BaseModel):
    class Status(models.TextChoices):
        TODO = "todo", "Todo"
        IN_PROGRESS = "in_progress", "In Progress"
        REVIEW = "review", "Review"
        DONE = "done", "Done"
        BLOCKED = "blocked", "Blocked"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    task_number = models.CharField(max_length=40, unique=True)
    project = models.ForeignKey(DeliveryProject, on_delete=models.CASCADE, related_name="tasks")
    milestone = models.ForeignKey(ProjectMilestone, null=True, blank=True, on_delete=models.SET_NULL, related_name="tasks")
    title = models.CharField(max_length=180)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.TODO, db_index=True)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM, db_index=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="assigned_project_tasks",
    )
    due_date = models.DateField(null=True, blank=True, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    estimated_hours = models.DecimalField(max_digits=7, decimal_places=2, default=0)
    actual_hours = models.DecimalField(max_digits=7, decimal_places=2, default=0)

    class Meta:
        db_table = "project_tasks"
        indexes = [
            models.Index(fields=["task_number"]),
            models.Index(fields=["project", "status"]),
            models.Index(fields=["assigned_to", "status"]),
            models.Index(fields=["due_date", "priority"]),
        ]

    def __str__(self) -> str:
        return f"{self.task_number} - {self.title}"


class ProjectDeadline(BaseModel):
    class Severity(models.TextChoices):
        INFO = "info", "Info"
        WARNING = "warning", "Warning"
        CRITICAL = "critical", "Critical"

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        MET = "met", "Met"
        MISSED = "missed", "Missed"
        EXTENDED = "extended", "Extended"

    project = models.ForeignKey(DeliveryProject, on_delete=models.CASCADE, related_name="deadlines")
    milestone = models.ForeignKey(ProjectMilestone, null=True, blank=True, on_delete=models.SET_NULL, related_name="deadlines")
    title = models.CharField(max_length=180)
    due_date = models.DateField(db_index=True)
    severity = models.CharField(max_length=20, choices=Severity.choices, default=Severity.WARNING, db_index=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN, db_index=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "project_deadlines"
        indexes = [
            models.Index(fields=["project", "status"]),
            models.Index(fields=["due_date", "severity"]),
        ]

    def __str__(self) -> str:
        return f"{self.project.project_number} - {self.title}"


class EmployeePerformanceReview(BaseModel):
    class ReviewCycle(models.TextChoices):
        Q1_2026 = "Q1 2026", "Q1 2026"
        Q2_2026 = "Q2 2026", "Q2 2026"
        Q3_2026 = "Q3 2026", "Q3 2026"
        Q4_2026 = "Q4 2026", "Q4 2026"

    class ReviewStage(models.TextChoices):
        DRAFT = "draft", "Draft"
        MANAGER_REVIEW = "manager_review", "Manager Review"
        HR_REVIEW = "hr_review", "HR Review"
        FINALIZED = "finalized", "Finalized"

    class PerformanceStatus(models.TextChoices):
        TOP_PERFORMER = "top_performer", "Top Performer"
        EXCEEDS_EXPECTATIONS = "exceeds_expectations", "Exceeds Expectations"
        MEETS_EXPECTATIONS = "meets_expectations", "Meets Expectations"
        NEEDS_IMPROVEMENT = "needs_improvement", "Needs Improvement"
        PROMOTION_ELIGIBLE = "promotion_eligible", "Promotion Eligible"
        ARCHIVED = "archived", "Archived"

    class AttritionRisk(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    employee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="performance_reviews")
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="managed_performance_reviews",
    )
    department = models.CharField(max_length=80, blank=True, db_index=True)
    designation = models.CharField(max_length=120, blank=True)
    review_cycle = models.CharField(max_length=20, choices=ReviewCycle.choices, db_index=True)
    review_stage = models.CharField(max_length=30, choices=ReviewStage.choices, default=ReviewStage.DRAFT, db_index=True)
    goals_assigned = models.PositiveSmallIntegerField(default=0)
    goals_completed = models.PositiveSmallIntegerField(default=0)
    kpi_score = models.PositiveSmallIntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    task_completion = models.PositiveSmallIntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    quality_score = models.DecimalField(max_digits=3, decimal_places=1, default=0, validators=[MinValueValidator(0), MaxValueValidator(5)])
    attendance_score = models.PositiveSmallIntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=0, validators=[MinValueValidator(0), MaxValueValidator(5)])
    status = models.CharField(max_length=40, choices=PerformanceStatus.choices, default=PerformanceStatus.MEETS_EXPECTATIONS, db_index=True)
    last_review_date = models.DateField()
    next_review_date = models.DateField()
    manager_notes = models.TextField()
    improvement_plan = models.TextField()
    promotion_readiness = models.PositiveSmallIntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    attrition_risk = models.CharField(max_length=20, choices=AttritionRisk.choices, default=AttritionRisk.LOW, db_index=True)
    recommended_training = models.JSONField(default=list, blank=True)
    metrics = models.JSONField(default=list, blank=True)
    okrs = models.JSONField(default=list, blank=True)
    feedback = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "employee_performance_reviews"
        constraints = [
            models.UniqueConstraint(fields=["employee", "review_cycle"], name="unique_employee_review_cycle"),
        ]
        indexes = [
            models.Index(fields=["review_cycle", "status"]),
            models.Index(fields=["department", "status"]),
            models.Index(fields=["next_review_date", "review_stage"]),
        ]

    def __str__(self) -> str:
        return f"{self.employee} - {self.review_cycle}"
