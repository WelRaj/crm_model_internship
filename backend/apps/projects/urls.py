from django.urls import path

from apps.projects.views import (
    DeliveryProjectDetailView,
    DeliveryProjectListCreateView,
    EmployeePerformanceReviewDetailView,
    EmployeePerformanceReviewListCreateView,
    ProjectDeadlineCreateView,
    ProjectDeadlineDetailView,
    ProjectMilestoneCreateView,
    ProjectMilestoneDetailView,
    ProjectTaskCreateView,
    ProjectTaskDetailView,
    ProjectTeamAssignmentCreateView,
    ProjectTeamAssignmentDetailView,
)


urlpatterns = [
    path("projects/", DeliveryProjectListCreateView.as_view(), name="delivery-projects"),
    path("projects/<uuid:project_id>/", DeliveryProjectDetailView.as_view(), name="delivery-project-detail"),
    path("projects/<uuid:project_id>/team/", ProjectTeamAssignmentCreateView.as_view(), name="project-team-assignment"),
    path("projects/team/<uuid:assignment_id>/", ProjectTeamAssignmentDetailView.as_view(), name="project-team-assignment-detail"),
    path("projects/<uuid:project_id>/milestones/", ProjectMilestoneCreateView.as_view(), name="project-milestones"),
    path("projects/milestones/<uuid:milestone_id>/", ProjectMilestoneDetailView.as_view(), name="project-milestone-detail"),
    path("projects/<uuid:project_id>/tasks/", ProjectTaskCreateView.as_view(), name="project-tasks"),
    path("projects/<uuid:project_id>/deadlines/", ProjectDeadlineCreateView.as_view(), name="project-deadlines"),
    path("projects/deadlines/<uuid:deadline_id>/", ProjectDeadlineDetailView.as_view(), name="project-deadline-detail"),
    path("projects/tasks/<uuid:task_id>/", ProjectTaskDetailView.as_view(), name="project-task-detail"),
    path("projects/performance-reviews/", EmployeePerformanceReviewListCreateView.as_view(), name="employee-performance-reviews"),
    path("projects/performance-reviews/<uuid:review_id>/", EmployeePerformanceReviewDetailView.as_view(), name="employee-performance-review-detail"),
]
