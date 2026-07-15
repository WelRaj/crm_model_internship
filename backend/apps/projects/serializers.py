from rest_framework import serializers

from apps.accounts.models import User
from apps.accounts.serializers import UserSummarySerializer
from apps.crm.models import ProjectAgreement, ProjectHandoff
from apps.crm.serializers import ProjectClientSerializer, ProjectHandoffSerializer
from apps.hrms.models import EmployeeHRProfile
from apps.projects.models import DeliveryProject, EmployeePerformanceReview, ProjectDeadline, ProjectMilestone, ProjectTask, ProjectTeamAssignment


def get_active_hrms_user(user_id: int, error_message: str):
    try:
        return User.objects.select_related("hr_profile").get(
            id=user_id,
            is_active=True,
            hr_profile__status=EmployeeHRProfile.Status.ACTIVE,
        )
    except User.DoesNotExist as exc:
        raise serializers.ValidationError(error_message) from exc


class DeliveryProjectSerializer(serializers.ModelSerializer):
    client_detail = ProjectClientSerializer(source="client", read_only=True)
    source_handoff_detail = ProjectHandoffSerializer(source="source_handoff", read_only=True)
    project_manager_detail = UserSummarySerializer(source="project_manager", read_only=True)
    team_assignments = serializers.SerializerMethodField()
    milestones = serializers.SerializerMethodField()
    tasks = serializers.SerializerMethodField()
    deadlines = serializers.SerializerMethodField()
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    priority_label = serializers.CharField(source="get_priority_display", read_only=True)
    health_status_label = serializers.CharField(source="get_health_status_display", read_only=True)

    class Meta:
        model = DeliveryProject
        fields = (
            "id",
            "project_number",
            "source_handoff",
            "source_handoff_detail",
            "client",
            "client_detail",
            "name",
            "description",
            "status",
            "status_label",
            "priority",
            "priority_label",
            "health_status",
            "health_status_label",
            "project_manager",
            "project_manager_detail",
            "start_date",
            "target_end_date",
            "actual_end_date",
            "progress_percent",
            "billing_model",
            "delivery_method",
            "communication_channel",
            "repository_url",
            "team_assignments",
            "milestones",
            "tasks",
            "deadlines",
            "created_at",
            "updated_at",
        )

    def get_team_assignments(self, obj):
        return ProjectTeamAssignmentSerializer(obj.team_assignments.filter(is_deleted=False).select_related("user"), many=True).data

    def get_milestones(self, obj):
        return ProjectMilestoneSerializer(obj.milestones.filter(is_deleted=False), many=True).data

    def get_tasks(self, obj):
        return ProjectTaskSerializer(obj.tasks.filter(is_deleted=False).select_related("assigned_to", "milestone"), many=True).data

    def get_deadlines(self, obj):
        return ProjectDeadlineSerializer(obj.deadlines.filter(is_deleted=False).select_related("milestone"), many=True).data


class DeliveryProjectCreateSerializer(serializers.Serializer):
    project_handoff_id = serializers.UUIDField()
    name = serializers.CharField(max_length=220, required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=DeliveryProject.Status.choices, default=DeliveryProject.Status.PLANNING)
    priority = serializers.ChoiceField(choices=DeliveryProject.Priority.choices, required=False)
    health_status = serializers.ChoiceField(choices=DeliveryProject.HealthStatus.choices, default=DeliveryProject.HealthStatus.ON_TRACK)
    project_manager_id = serializers.IntegerField(required=False, allow_null=True)
    start_date = serializers.DateField(required=False)
    target_end_date = serializers.DateField(required=False)
    progress_percent = serializers.IntegerField(min_value=0, max_value=100, required=False)
    billing_model = serializers.CharField(max_length=80, required=False, allow_blank=True)
    delivery_method = serializers.CharField(max_length=80, required=False, allow_blank=True)
    communication_channel = serializers.CharField(max_length=160, required=False, allow_blank=True)
    repository_url = serializers.URLField(required=False, allow_blank=True)

    def validate_project_handoff_id(self, value):
        try:
            handoff = ProjectHandoff.objects.select_related("client").get(id=value, is_deleted=False)
        except ProjectHandoff.DoesNotExist as exc:
            raise serializers.ValidationError("Project handoff does not exist.") from exc
        if not ProjectAgreement.objects.filter(
            project_handoff=handoff,
            status=ProjectAgreement.AgreementStatus.ACTIVE,
            is_deleted=False,
        ).exists():
            raise serializers.ValidationError("Delivery project can start only after an active signed agreement.")
        if DeliveryProject.objects.filter(source_handoff=handoff, is_deleted=False).exists():
            raise serializers.ValidationError("Delivery project already exists for this handoff.")
        return value

    def validate_project_manager_id(self, value):
        if value is None:
            return value
        return get_active_hrms_user(value, "Active HRMS project manager does not exist.")

    def validate(self, attrs):
        handoff = ProjectHandoff.objects.select_related("client").get(id=attrs.pop("project_handoff_id"), is_deleted=False)
        attrs["source_handoff"] = handoff
        attrs["project_manager"] = attrs.pop("project_manager_id", None)
        start_date = attrs.get("start_date", handoff.start_date)
        target_end_date = attrs.get("target_end_date", handoff.target_end_date)
        if target_end_date < start_date:
            raise serializers.ValidationError({"target_end_date": "Target end date cannot be earlier than start date."})
        return attrs


class DeliveryProjectUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=220, required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=DeliveryProject.Status.choices, required=False)
    priority = serializers.ChoiceField(choices=DeliveryProject.Priority.choices, required=False)
    health_status = serializers.ChoiceField(choices=DeliveryProject.HealthStatus.choices, required=False)
    project_manager_id = serializers.IntegerField(required=False, allow_null=True)
    start_date = serializers.DateField(required=False)
    target_end_date = serializers.DateField(required=False)
    actual_end_date = serializers.DateField(required=False, allow_null=True)
    progress_percent = serializers.IntegerField(min_value=0, max_value=100, required=False)
    billing_model = serializers.CharField(max_length=80, required=False, allow_blank=True)
    delivery_method = serializers.CharField(max_length=80, required=False, allow_blank=True)
    communication_channel = serializers.CharField(max_length=160, required=False, allow_blank=True)
    repository_url = serializers.URLField(required=False, allow_blank=True)

    def validate_project_manager_id(self, value):
        if value is None:
            return value
        return get_active_hrms_user(value, "Active HRMS project manager does not exist.")

    def validate(self, attrs):
        project = self.context["project"]
        attrs["project_manager"] = attrs.pop("project_manager_id", project.project_manager)
        start_date = attrs.get("start_date", project.start_date)
        target_end_date = attrs.get("target_end_date", project.target_end_date)
        actual_end_date = attrs.get("actual_end_date", project.actual_end_date)
        if target_end_date < start_date:
            raise serializers.ValidationError({"target_end_date": "Target end date cannot be earlier than start date."})
        if actual_end_date and actual_end_date < start_date:
            raise serializers.ValidationError({"actual_end_date": "Actual end date cannot be earlier than start date."})
        if attrs.get("status") == DeliveryProject.Status.COMPLETED and attrs.get("progress_percent", project.progress_percent) != 100:
            raise serializers.ValidationError({"progress_percent": "Completed projects must have 100 percent progress."})
        return attrs


class ProjectTeamAssignmentSerializer(serializers.ModelSerializer):
    user_detail = UserSummarySerializer(source="user", read_only=True)
    role_label = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = ProjectTeamAssignment
        fields = ("id", "project", "user", "user_detail", "role", "role_label", "allocation_percent", "start_date", "end_date", "notes", "created_at", "updated_at")


class ProjectTeamAssignmentWriteSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    role = serializers.ChoiceField(choices=ProjectTeamAssignment.Role.choices)
    allocation_percent = serializers.IntegerField(min_value=1, max_value=100, required=False)
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)
    notes = serializers.CharField(max_length=240, required=False, allow_blank=True)

    def validate_user_id(self, value):
        return get_active_hrms_user(value, "Active HRMS project team user does not exist.")

    def validate(self, attrs):
        attrs["user"] = attrs.pop("user_id")
        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({"end_date": "End date cannot be earlier than start date."})
        return attrs


class ProjectMilestoneSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = ProjectMilestone
        fields = ("id", "project", "title", "description", "status", "status_label", "sequence", "start_date", "due_date", "completed_at", "milestone_value", "created_at", "updated_at")


class ProjectMilestoneWriteSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=180)
    description = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=ProjectMilestone.Status.choices, default=ProjectMilestone.Status.PLANNED)
    sequence = serializers.IntegerField(min_value=1)
    start_date = serializers.DateField(required=False, allow_null=True)
    due_date = serializers.DateField()
    milestone_value = serializers.DecimalField(max_digits=14, decimal_places=2, required=False)

    def validate(self, attrs):
        project = self.context.get("project")
        milestone = self.context.get("milestone")
        project = project or milestone.project
        start_date = attrs.get("start_date", milestone.start_date if milestone else None)
        due_date = attrs.get("due_date", milestone.due_date if milestone else None)
        sequence = attrs.get("sequence", milestone.sequence if milestone else None)
        if start_date and due_date and due_date < start_date:
            raise serializers.ValidationError({"due_date": "Due date cannot be earlier than start date."})
        duplicate_sequence = ProjectMilestone.objects.filter(project=project, sequence=sequence, is_deleted=False)
        if milestone:
            duplicate_sequence = duplicate_sequence.exclude(id=milestone.id)
        if sequence and duplicate_sequence.exists():
            raise serializers.ValidationError({"sequence": "Milestone sequence already exists for this project."})
        return attrs


class ProjectTaskSerializer(serializers.ModelSerializer):
    assigned_to_detail = UserSummarySerializer(source="assigned_to", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    priority_label = serializers.CharField(source="get_priority_display", read_only=True)

    class Meta:
        model = ProjectTask
        fields = ("id", "task_number", "project", "milestone", "title", "description", "status", "status_label", "priority", "priority_label", "assigned_to", "assigned_to_detail", "due_date", "completed_at", "estimated_hours", "actual_hours", "created_at", "updated_at")


class ProjectTaskWriteSerializer(serializers.Serializer):
    milestone_id = serializers.UUIDField(required=False, allow_null=True)
    title = serializers.CharField(max_length=180)
    description = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=ProjectTask.Status.choices, default=ProjectTask.Status.TODO)
    priority = serializers.ChoiceField(choices=ProjectTask.Priority.choices, default=ProjectTask.Priority.MEDIUM)
    assigned_to_id = serializers.IntegerField(required=False, allow_null=True)
    due_date = serializers.DateField(required=False, allow_null=True)
    estimated_hours = serializers.DecimalField(max_digits=7, decimal_places=2, required=False)
    actual_hours = serializers.DecimalField(max_digits=7, decimal_places=2, required=False)

    def validate_assigned_to_id(self, value):
        if value is None:
            return value
        return get_active_hrms_user(value, "Active HRMS task assignee does not exist.")

    def validate(self, attrs):
        project = self.context.get("project")
        task = self.context.get("task")
        milestone_id = attrs.pop("milestone_id", None)
        if milestone_id:
            try:
                attrs["milestone"] = ProjectMilestone.objects.get(id=milestone_id, project=project or task.project, is_deleted=False)
            except ProjectMilestone.DoesNotExist as exc:
                raise serializers.ValidationError({"milestone_id": "Milestone does not belong to this project."}) from exc
        elif "milestone_id" in self.initial_data:
            attrs["milestone"] = None
        attrs["assigned_to"] = attrs.pop("assigned_to_id", task.assigned_to if task else None)
        return attrs


class ProjectDeadlineSerializer(serializers.ModelSerializer):
    severity_label = serializers.CharField(source="get_severity_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = ProjectDeadline
        fields = ("id", "project", "milestone", "title", "due_date", "severity", "severity_label", "status", "status_label", "notes", "created_at", "updated_at")


class ProjectDeadlineWriteSerializer(serializers.Serializer):
    milestone_id = serializers.UUIDField(required=False, allow_null=True)
    title = serializers.CharField(max_length=180)
    due_date = serializers.DateField()
    severity = serializers.ChoiceField(choices=ProjectDeadline.Severity.choices, default=ProjectDeadline.Severity.WARNING)
    status = serializers.ChoiceField(choices=ProjectDeadline.Status.choices, default=ProjectDeadline.Status.OPEN)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        project = self.context.get("project")
        deadline = self.context.get("deadline")
        project = project or deadline.project
        milestone_id = attrs.pop("milestone_id", None)
        if milestone_id:
            try:
                attrs["milestone"] = ProjectMilestone.objects.get(id=milestone_id, project=project, is_deleted=False)
            except ProjectMilestone.DoesNotExist as exc:
                raise serializers.ValidationError({"milestone_id": "Milestone does not belong to this project."}) from exc
        return attrs


class EmployeePerformanceReviewSerializer(serializers.ModelSerializer):
    employee_detail = UserSummarySerializer(source="employee", read_only=True)
    manager_detail = UserSummarySerializer(source="manager", read_only=True)
    review_stage_label = serializers.CharField(source="get_review_stage_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    attrition_risk_label = serializers.CharField(source="get_attrition_risk_display", read_only=True)

    class Meta:
        model = EmployeePerformanceReview
        fields = (
            "id",
            "employee",
            "employee_detail",
            "manager",
            "manager_detail",
            "department",
            "designation",
            "review_cycle",
            "review_stage",
            "review_stage_label",
            "goals_assigned",
            "goals_completed",
            "kpi_score",
            "task_completion",
            "quality_score",
            "attendance_score",
            "rating",
            "status",
            "status_label",
            "last_review_date",
            "next_review_date",
            "manager_notes",
            "improvement_plan",
            "promotion_readiness",
            "attrition_risk",
            "attrition_risk_label",
            "recommended_training",
            "metrics",
            "okrs",
            "feedback",
            "created_at",
            "updated_at",
        )


class EmployeePerformanceReviewWriteSerializer(serializers.Serializer):
    employee_id = serializers.IntegerField()
    manager_id = serializers.IntegerField(required=False, allow_null=True)
    department = serializers.CharField(max_length=80, required=False, allow_blank=True)
    designation = serializers.CharField(max_length=120, required=False, allow_blank=True)
    review_cycle = serializers.ChoiceField(choices=EmployeePerformanceReview.ReviewCycle.choices)
    review_stage = serializers.ChoiceField(choices=EmployeePerformanceReview.ReviewStage.choices, default=EmployeePerformanceReview.ReviewStage.DRAFT)
    goals_assigned = serializers.IntegerField(min_value=0, max_value=999)
    goals_completed = serializers.IntegerField(min_value=0, max_value=999)
    kpi_score = serializers.IntegerField(min_value=0, max_value=100)
    task_completion = serializers.IntegerField(min_value=0, max_value=100)
    quality_score = serializers.DecimalField(max_digits=3, decimal_places=1, min_value=0, max_value=5)
    attendance_score = serializers.IntegerField(min_value=0, max_value=100)
    rating = serializers.DecimalField(max_digits=3, decimal_places=1, min_value=0, max_value=5)
    status = serializers.ChoiceField(choices=EmployeePerformanceReview.PerformanceStatus.choices)
    last_review_date = serializers.DateField()
    next_review_date = serializers.DateField()
    manager_notes = serializers.CharField()
    improvement_plan = serializers.CharField()
    promotion_readiness = serializers.IntegerField(min_value=0, max_value=100)
    attrition_risk = serializers.ChoiceField(choices=EmployeePerformanceReview.AttritionRisk.choices)
    recommended_training = serializers.ListField(child=serializers.CharField(max_length=120), required=False)
    metrics = serializers.ListField(required=False)
    okrs = serializers.ListField(required=False)
    feedback = serializers.DictField(required=False)

    def validate_employee_id(self, value):
        return get_active_hrms_user(value, "Active HRMS employee user does not exist.")

    def validate_manager_id(self, value):
        if value is None:
            return value
        return get_active_hrms_user(value, "Active HRMS manager user does not exist.")

    def validate(self, attrs):
        review = self.context.get("review")
        employee = attrs.pop("employee_id")
        attrs["employee"] = employee
        attrs["manager"] = attrs.pop("manager_id", review.manager if review else None)
        if attrs["goals_completed"] > attrs["goals_assigned"]:
            raise serializers.ValidationError({"goals_completed": "Completed goals cannot exceed assigned goals."})
        if attrs["next_review_date"] < attrs["last_review_date"]:
            raise serializers.ValidationError({"next_review_date": "Next review date cannot be earlier than last review date."})
        duplicate = EmployeePerformanceReview.objects.filter(employee=employee, review_cycle=attrs["review_cycle"], is_deleted=False)
        if review:
            duplicate = duplicate.exclude(id=review.id)
        if duplicate.exists():
            raise serializers.ValidationError({"employee_id": "Employee already has a review for this cycle."})
        return attrs
