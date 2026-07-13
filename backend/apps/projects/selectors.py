from apps.projects.models import DeliveryProject


def get_delivery_projects_queryset():
    return (
        DeliveryProject.objects.filter(is_deleted=False)
        .select_related("client", "source_handoff", "project_manager")
        .prefetch_related("team_assignments", "milestones", "tasks", "deadlines")
        .order_by("-created_at")
    )
