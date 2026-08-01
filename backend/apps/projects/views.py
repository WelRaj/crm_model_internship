from django.db.models import Q
from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.views import APIView

from apps.core.responses import success_response
from apps.projects.models import EmployeePerformanceReview, ProjectDeadline, ProjectMilestone, ProjectTask, ProjectTeamAssignment
from apps.projects.permissions import require_project_access, require_project_action_access
from apps.projects.selectors import get_delivery_projects_queryset
from apps.projects.serializers import (
    DeliveryProjectCreateSerializer,
    DeliveryProjectSerializer,
    DeliveryProjectUpdateSerializer,
    EmployeePerformanceReviewSerializer,
    EmployeePerformanceReviewWriteSerializer,
    ProjectDeadlineSerializer,
    ProjectDeadlineWriteSerializer,
    ProjectMilestoneSerializer,
    ProjectMilestoneWriteSerializer,
    ProjectTaskSerializer,
    ProjectTaskWriteSerializer,
    ProjectTeamAssignmentSerializer,
    ProjectTeamAssignmentWriteSerializer,
)
from apps.projects.services import DeliveryProjectService, EmployeePerformanceReviewService


class DeliveryProjectListCreateView(APIView):
    def get(self, request):
        require_project_access(request.user)
        require_project_action_access(request.user, "view")
        queryset = get_delivery_projects_queryset()
        search = request.query_params.get("search")
        status = request.query_params.get("status")
        if status:
            queryset = queryset.filter(status=status)
        if search:
            queryset = queryset.filter(Q(project_number__icontains=search) | Q(name__icontains=search) | Q(client__company_name__icontains=search))
        return success_response(data=DeliveryProjectSerializer(queryset[:200], many=True).data)

    def post(self, request):
        require_project_access(request.user)
        require_project_action_access(request.user, "create")
        serializer = DeliveryProjectCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = DeliveryProjectService.create_project_from_handoff(
            data=serializer.validated_data,
            actor=request.user,
            request=request,
        )
        return success_response(
            data=DeliveryProjectSerializer(project).data,
            message="Delivery project created successfully",
            status_code=status.HTTP_201_CREATED,
        )


class DeliveryProjectDetailView(APIView):
    def get(self, request, project_id):
        require_project_access(request.user)
        require_project_action_access(request.user, "view")
        project = get_object_or_404(get_delivery_projects_queryset(), id=project_id)
        return success_response(data=DeliveryProjectSerializer(project).data)

    def put(self, request, project_id):
        require_project_access(request.user)
        require_project_action_access(request.user, "edit")
        project = get_object_or_404(get_delivery_projects_queryset(), id=project_id)
        serializer = DeliveryProjectUpdateSerializer(data=request.data, context={"project": project}, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_project = DeliveryProjectService.update_project(
            project=project,
            data=serializer.validated_data,
            actor=request.user,
            request=request,
        )
        return success_response(data=DeliveryProjectSerializer(updated_project).data, message="Delivery project updated successfully")


class ProjectTeamAssignmentCreateView(APIView):
    def post(self, request, project_id):
        require_project_access(request.user)
        require_project_action_access(request.user, "assign")
        project = get_object_or_404(get_delivery_projects_queryset(), id=project_id)
        serializer = ProjectTeamAssignmentWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        assignment = DeliveryProjectService.assign_team_member(
            project=project,
            data=serializer.validated_data,
            actor=request.user,
            request=request,
        )
        return success_response(
            data=ProjectTeamAssignmentSerializer(assignment).data,
            message="Project team assignment saved successfully",
            status_code=status.HTTP_201_CREATED,
        )


class ProjectTeamAssignmentDetailView(APIView):
    def delete(self, request, assignment_id):
        require_project_access(request.user)
        require_project_action_access(request.user, "delete")
        assignment = get_object_or_404(
            ProjectTeamAssignment.objects.filter(is_deleted=False).select_related("project", "user"),
            id=assignment_id,
        )
        DeliveryProjectService.remove_team_assignment(
            assignment=assignment,
            actor=request.user,
            request=request,
        )
        return success_response(message="Project team assignment removed successfully")


class ProjectMilestoneCreateView(APIView):
    def post(self, request, project_id):
        require_project_access(request.user)
        require_project_action_access(request.user, "create")
        project = get_object_or_404(get_delivery_projects_queryset(), id=project_id)
        serializer = ProjectMilestoneWriteSerializer(data=request.data, context={"project": project})
        serializer.is_valid(raise_exception=True)
        milestone = DeliveryProjectService.create_milestone(
            project=project,
            data=serializer.validated_data,
            actor=request.user,
            request=request,
        )
        return success_response(
            data=ProjectMilestoneSerializer(milestone).data,
            message="Project milestone created successfully",
            status_code=status.HTTP_201_CREATED,
        )


class ProjectMilestoneDetailView(APIView):
    def put(self, request, milestone_id):
        require_project_access(request.user)
        require_project_action_access(request.user, "edit")
        milestone = get_object_or_404(ProjectMilestone.objects.filter(is_deleted=False).select_related("project"), id=milestone_id)
        serializer = ProjectMilestoneWriteSerializer(data=request.data, context={"milestone": milestone}, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_milestone = DeliveryProjectService.update_milestone(
            milestone=milestone,
            data=serializer.validated_data,
            actor=request.user,
            request=request,
        )
        return success_response(data=ProjectMilestoneSerializer(updated_milestone).data, message="Project milestone updated successfully")


class ProjectTaskCreateView(APIView):
    def post(self, request, project_id):
        require_project_access(request.user)
        require_project_action_access(request.user, "create")
        project = get_object_or_404(get_delivery_projects_queryset(), id=project_id)
        serializer = ProjectTaskWriteSerializer(data=request.data, context={"project": project})
        serializer.is_valid(raise_exception=True)
        task = DeliveryProjectService.create_task(
            project=project,
            data=serializer.validated_data,
            actor=request.user,
            request=request,
        )
        return success_response(
            data=ProjectTaskSerializer(task).data,
            message="Project task created successfully",
            status_code=status.HTTP_201_CREATED,
        )


class ProjectTaskDetailView(APIView):
    def put(self, request, task_id):
        require_project_access(request.user)
        require_project_action_access(request.user, "edit")
        task = get_object_or_404(ProjectTask.objects.filter(is_deleted=False).select_related("project", "milestone", "assigned_to"), id=task_id)
        serializer = ProjectTaskWriteSerializer(data=request.data, context={"task": task}, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_task = DeliveryProjectService.update_task(
            task=task,
            data=serializer.validated_data,
            actor=request.user,
            request=request,
        )
        return success_response(data=ProjectTaskSerializer(updated_task).data, message="Project task updated successfully")

    def delete(self, request, task_id):
        require_project_access(request.user)
        require_project_action_access(request.user, "delete")
        task = get_object_or_404(ProjectTask.objects.filter(is_deleted=False).select_related("project", "milestone", "assigned_to"), id=task_id)
        DeliveryProjectService.delete_task(
            task=task,
            actor=request.user,
            request=request,
        )
        return success_response(message="Project task removed successfully")


class ProjectDeadlineCreateView(APIView):
    def post(self, request, project_id):
        require_project_access(request.user)
        require_project_action_access(request.user, "create")
        project = get_object_or_404(get_delivery_projects_queryset(), id=project_id)
        serializer = ProjectDeadlineWriteSerializer(data=request.data, context={"project": project})
        serializer.is_valid(raise_exception=True)
        deadline = DeliveryProjectService.create_deadline(
            project=project,
            data=serializer.validated_data,
            actor=request.user,
            request=request,
        )
        return success_response(
            data=ProjectDeadlineSerializer(deadline).data,
            message="Project deadline created successfully",
            status_code=status.HTTP_201_CREATED,
        )


class ProjectDeadlineDetailView(APIView):
    def put(self, request, deadline_id):
        require_project_access(request.user)
        require_project_action_access(request.user, "edit")
        deadline = get_object_or_404(ProjectDeadline.objects.filter(is_deleted=False).select_related("project", "milestone"), id=deadline_id)
        serializer = ProjectDeadlineWriteSerializer(data=request.data, context={"deadline": deadline}, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_deadline = DeliveryProjectService.update_deadline(
            deadline=deadline,
            data=serializer.validated_data,
            actor=request.user,
            request=request,
        )
        return success_response(data=ProjectDeadlineSerializer(updated_deadline).data, message="Project deadline updated successfully")


class EmployeePerformanceReviewListCreateView(APIView):
    def get(self, request):
        require_project_access(request.user)
        require_project_action_access(request.user, "view")
        queryset = EmployeePerformanceReview.objects.filter(is_deleted=False).select_related("employee", "manager").order_by("-updated_at")
        search = request.query_params.get("search")
        status_filter = request.query_params.get("status")
        cycle = request.query_params.get("review_cycle")
        department = request.query_params.get("department")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if cycle:
            queryset = queryset.filter(review_cycle=cycle)
        if department:
            queryset = queryset.filter(department__iexact=department)
        if search:
            queryset = queryset.filter(
                Q(employee__first_name__icontains=search)
                | Q(employee__last_name__icontains=search)
                | Q(employee__employee_id__icontains=search)
                | Q(employee__email__icontains=search)
                | Q(department__icontains=search)
                | Q(designation__icontains=search)
            )
        return success_response(data=EmployeePerformanceReviewSerializer(queryset[:200], many=True).data)

    def post(self, request):
        require_project_access(request.user)
        require_project_action_access(request.user, "create")
        serializer = EmployeePerformanceReviewWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = EmployeePerformanceReviewService.create_review(
            data=serializer.validated_data,
            actor=request.user,
            request=request,
        )
        return success_response(
            data=EmployeePerformanceReviewSerializer(review).data,
            message="Employee performance review created successfully",
            status_code=status.HTTP_201_CREATED,
        )


class EmployeePerformanceReviewDetailView(APIView):
    def put(self, request, review_id):
        require_project_access(request.user)
        require_project_action_access(request.user, "edit")
        review = get_object_or_404(
            EmployeePerformanceReview.objects.filter(is_deleted=False).select_related("employee", "manager"),
            id=review_id,
        )
        serializer = EmployeePerformanceReviewWriteSerializer(data=request.data, context={"review": review}, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_review = EmployeePerformanceReviewService.update_review(
            review=review,
            data=serializer.validated_data,
            actor=request.user,
            request=request,
        )
        return success_response(data=EmployeePerformanceReviewSerializer(updated_review).data, message="Employee performance review updated successfully")
