from django.contrib import admin

from apps.projects.models import DeliveryProject, EmployeePerformanceReview, ProjectDeadline, ProjectMilestone, ProjectTask, ProjectTeamAssignment


class ProjectTeamAssignmentInline(admin.TabularInline):
    model = ProjectTeamAssignment
    extra = 0


class ProjectMilestoneInline(admin.TabularInline):
    model = ProjectMilestone
    extra = 0


@admin.register(DeliveryProject)
class DeliveryProjectAdmin(admin.ModelAdmin):
    list_display = ("project_number", "name", "client", "project_manager", "status", "priority", "health_status", "target_end_date")
    list_filter = ("status", "priority", "health_status", "target_end_date")
    search_fields = ("project_number", "name", "client__client_number", "client__company_name", "source_handoff__project_code")
    inlines = [ProjectTeamAssignmentInline, ProjectMilestoneInline]
    ordering = ("-created_at",)


@admin.register(ProjectTeamAssignment)
class ProjectTeamAssignmentAdmin(admin.ModelAdmin):
    list_display = ("project", "user", "role", "allocation_percent", "start_date", "end_date")
    list_filter = ("role", "allocation_percent")
    search_fields = ("project__project_number", "project__name", "user__email", "user__first_name", "user__last_name")


@admin.register(ProjectMilestone)
class ProjectMilestoneAdmin(admin.ModelAdmin):
    list_display = ("project", "sequence", "title", "status", "due_date", "milestone_value")
    list_filter = ("status", "due_date")
    search_fields = ("project__project_number", "project__name", "title")


@admin.register(ProjectTask)
class ProjectTaskAdmin(admin.ModelAdmin):
    list_display = ("task_number", "project", "title", "assigned_to", "status", "priority", "due_date")
    list_filter = ("status", "priority", "due_date")
    search_fields = ("task_number", "project__project_number", "project__name", "title", "assigned_to__email")


@admin.register(ProjectDeadline)
class ProjectDeadlineAdmin(admin.ModelAdmin):
    list_display = ("project", "title", "due_date", "severity", "status")
    list_filter = ("severity", "status", "due_date")
    search_fields = ("project__project_number", "project__name", "title")


@admin.register(EmployeePerformanceReview)
class EmployeePerformanceReviewAdmin(admin.ModelAdmin):
    list_display = ("employee", "review_cycle", "review_stage", "status", "rating", "next_review_date")
    list_filter = ("review_cycle", "review_stage", "status", "department", "attrition_risk")
    search_fields = ("employee__employee_id", "employee__first_name", "employee__last_name", "employee__email", "designation")
