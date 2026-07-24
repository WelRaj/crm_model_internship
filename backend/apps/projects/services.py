from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.audit.services import record_audit_log
from apps.core.models import Sequence
from apps.crm.models import ProjectAgreement
from apps.notifications.services import NotificationService
from apps.projects.models import DeliveryProject, EmployeePerformanceReview, ProjectDeadline, ProjectMilestone, ProjectTask, ProjectTeamAssignment


def _next_project_number():
    sequence, _ = Sequence.objects.select_for_update().get_or_create(
        code="delivery_project_number",
        defaults={"prefix": "PRJ", "current_value": 0, "padding": 5},
    )
    sequence.current_value += 1
    sequence.save(update_fields=["current_value", "updated_at"])
    return f"{sequence.prefix}-{sequence.current_value:0{sequence.padding}d}"


def _next_task_number():
    sequence, _ = Sequence.objects.select_for_update().get_or_create(
        code="project_task_number",
        defaults={"prefix": "TASK", "current_value": 0, "padding": 5},
    )
    sequence.current_value += 1
    sequence.save(update_fields=["current_value", "updated_at"])
    return f"{sequence.prefix}-{sequence.current_value:0{sequence.padding}d}"


class DeliveryProjectService:
    @staticmethod
    @transaction.atomic
    def create_project_from_handoff(*, data, actor, request=None):
        handoff = data.pop("source_handoff")
        if DeliveryProject.objects.filter(source_handoff=handoff, is_deleted=False).exists():
            raise ValidationError({"project_handoff_id": "Delivery project already exists for this handoff."})
        if not ProjectAgreement.objects.filter(
            project_handoff=handoff,
            status=ProjectAgreement.AgreementStatus.ACTIVE,
            is_deleted=False,
        ).exists():
            raise ValidationError({"project_handoff_id": "Delivery project can start only after an active signed agreement."})

        client = handoff.client
        project_manager = data.get("project_manager")
        project = DeliveryProject.objects.create(
            project_number=_next_project_number(),
            source_handoff=handoff,
            client=client,
            name=data.get("name") or client.project_name or client.company_name,
            description=data.get("description") or handoff.kickoff_notes,
            priority=data.get("priority") or handoff.priority,
            start_date=data.get("start_date") or handoff.start_date,
            target_end_date=data.get("target_end_date") or handoff.target_end_date,
            billing_model=data.get("billing_model") or handoff.billing_model,
            delivery_method=data.get("delivery_method") or handoff.delivery_method,
            communication_channel=data.get("communication_channel") or handoff.communication_channel,
            created_by=actor,
            updated_by=actor,
            **{
                key: value
                for key, value in data.items()
                if key
                in {
                    "status",
                    "health_status",
                    "project_manager",
                    "progress_percent",
                    "repository_url",
                }
            },
        )
        if project_manager:
            ProjectTeamAssignment.objects.get_or_create(
                project=project,
                user=project_manager,
                role=ProjectTeamAssignment.Role.PROJECT_MANAGER,
                defaults={
                    "allocation_percent": 100,
                    "start_date": project.start_date,
                    "notes": "Auto-assigned as delivery project manager.",
                    "created_by": actor,
                    "updated_by": actor,
                },
            )
        record_audit_log(
            actor=actor,
            module="projects",
            action="create",
            entity_type="DeliveryProject",
            entity_id=project.id,
            new_values={
                "project_number": project.project_number,
                "client_id": str(project.client_id),
                "source_handoff_id": str(project.source_handoff_id) if project.source_handoff_id else None,
                "status": project.status,
            },
            request=request,
        )
        NotificationService.create_event(
            actor=actor,
            title=f"Project {project.project_number} created",
            message=f"{project.name} is ready for delivery team setup.",
            notification_type="Project",
            priority="High",
            target_module="Delivery Projects",
            entity_type="DeliveryProject",
            entity_id=project.id,
            is_broadcast=True,
            request=request,
        )
        return project

    @staticmethod
    @transaction.atomic
    def update_project(*, project, data, actor, request=None):
        old_values = {
            "name": project.name,
            "status": project.status,
            "priority": project.priority,
            "health_status": project.health_status,
            "project_manager_id": str(project.project_manager_id) if project.project_manager_id else None,
            "target_end_date": str(project.target_end_date),
            "progress_percent": project.progress_percent,
        }
        fields = [
            "name",
            "description",
            "status",
            "priority",
            "health_status",
            "project_manager",
            "start_date",
            "target_end_date",
            "actual_end_date",
            "progress_percent",
            "billing_model",
            "delivery_method",
            "communication_channel",
            "repository_url",
        ]
        for field in fields:
            if field in data:
                setattr(project, field, data[field])
        project.updated_by = actor
        project.save(update_fields=[field for field in fields if field in data] + ["updated_by", "updated_at"])

        if "project_manager" in data and project.project_manager:
            ProjectTeamAssignment.objects.get_or_create(
                project=project,
                user=project.project_manager,
                role=ProjectTeamAssignment.Role.PROJECT_MANAGER,
                defaults={
                    "allocation_percent": 100,
                    "start_date": project.start_date,
                    "notes": "Auto-assigned as delivery project manager.",
                    "created_by": actor,
                    "updated_by": actor,
                },
            )

        record_audit_log(
            actor=actor,
            module="projects",
            action="update",
            entity_type="DeliveryProject",
            entity_id=project.id,
            old_values=old_values,
            new_values={
                "name": project.name,
                "status": project.status,
                "priority": project.priority,
                "health_status": project.health_status,
                "project_manager_id": str(project.project_manager_id) if project.project_manager_id else None,
                "target_end_date": str(project.target_end_date),
                "progress_percent": project.progress_percent,
            },
            request=request,
        )
        return project

    create_project = create_project_from_handoff

    @staticmethod
    @transaction.atomic
    def assign_team_member(*, project, data, actor, request=None):
        assignment = ProjectTeamAssignment.objects.filter(
            project=project,
            user=data["user"],
            role=data["role"],
        ).first()
        if assignment:
            assignment.allocation_percent = data.get("allocation_percent", assignment.allocation_percent)
            assignment.start_date = data.get("start_date", assignment.start_date)
            assignment.end_date = data.get("end_date", assignment.end_date)
            assignment.notes = data.get("notes", assignment.notes).strip()
            assignment.is_deleted = False
            assignment.deleted_at = None
            assignment.deleted_by = None
            assignment.updated_by = actor
            assignment.save(
                update_fields=[
                    "allocation_percent",
                    "start_date",
                    "end_date",
                    "notes",
                    "is_deleted",
                    "deleted_at",
                    "deleted_by",
                    "updated_by",
                    "updated_at",
                ]
            )
        else:
            assignment = ProjectTeamAssignment.objects.create(
                project=project,
                user=data["user"],
                role=data["role"],
                allocation_percent=data.get("allocation_percent", 100),
                start_date=data.get("start_date"),
                end_date=data.get("end_date"),
                notes=data.get("notes", "").strip(),
                created_by=actor,
                updated_by=actor,
            )

        record_audit_log(
            actor=actor,
            module="projects",
            action="assign",
            entity_type="ProjectTeamAssignment",
            entity_id=assignment.id,
            new_values={
                "project_id": str(project.id),
                "user_id": assignment.user_id,
                "role": assignment.role,
                "allocation_percent": assignment.allocation_percent,
            },
            request=request,
        )
        NotificationService.create_event(
            actor=actor,
            title=f"Team assigned to {project.project_number}",
            message=f"{assignment.user.get_full_name() or assignment.user.email or assignment.user.mobile or assignment.user_id} assigned as {assignment.get_role_display()} on {project.name}.",
            notification_type="Assignment",
            priority="Medium",
            target_module="Delivery Projects",
            entity_type="ProjectTeamAssignment",
            entity_id=assignment.id,
            is_broadcast=True,
            request=request,
        )
        return assignment

    @staticmethod
    @transaction.atomic
    def remove_team_assignment(*, assignment, actor, request=None):
        old_values = {
            "project_id": str(assignment.project_id),
            "user_id": assignment.user_id,
            "role": assignment.role,
            "allocation_percent": assignment.allocation_percent,
        }
        assignment.is_deleted = True
        assignment.deleted_at = timezone.now()
        assignment.deleted_by = actor
        assignment.updated_by = actor
        assignment.save(update_fields=["is_deleted", "deleted_at", "deleted_by", "updated_by", "updated_at"])

        record_audit_log(
            actor=actor,
            module="projects",
            action="delete",
            entity_type="ProjectTeamAssignment",
            entity_id=assignment.id,
            old_values=old_values,
            new_values={"is_deleted": True},
            request=request,
        )
        return assignment

    @staticmethod
    @transaction.atomic
    def create_milestone(*, project, data, actor, request=None):
        if data.get("status") == ProjectMilestone.Status.COMPLETED:
            data["completed_at"] = timezone.now()
        milestone = ProjectMilestone.objects.create(project=project, created_by=actor, updated_by=actor, **data)
        record_audit_log(
            actor=actor,
            module="projects",
            action="create",
            entity_type="ProjectMilestone",
            entity_id=milestone.id,
            new_values={
                "project_id": str(project.id),
                "title": milestone.title,
                "sequence": milestone.sequence,
                "due_date": str(milestone.due_date),
                "status": milestone.status,
            },
            request=request,
        )
        return milestone

    @staticmethod
    @transaction.atomic
    def update_milestone(*, milestone, data, actor, request=None):
        old_values = {
            "title": milestone.title,
            "status": milestone.status,
            "sequence": milestone.sequence,
            "due_date": str(milestone.due_date),
            "milestone_value": str(milestone.milestone_value),
        }
        fields = [
            "title",
            "description",
            "status",
            "sequence",
            "start_date",
            "due_date",
            "milestone_value",
        ]
        for field in fields:
            if field in data:
                setattr(milestone, field, data[field])
        if "status" in data:
            milestone.completed_at = timezone.now() if milestone.status == ProjectMilestone.Status.COMPLETED else None
        milestone.updated_by = actor
        update_fields = [field for field in fields if field in data] + ["updated_by", "updated_at"]
        if "status" in data:
            update_fields.append("completed_at")
        milestone.save(update_fields=update_fields)

        record_audit_log(
            actor=actor,
            module="projects",
            action="update",
            entity_type="ProjectMilestone",
            entity_id=milestone.id,
            old_values=old_values,
            new_values={
                "title": milestone.title,
                "status": milestone.status,
                "sequence": milestone.sequence,
                "due_date": str(milestone.due_date),
                "milestone_value": str(milestone.milestone_value),
            },
            request=request,
        )
        if milestone.status == ProjectMilestone.Status.COMPLETED and old_values["status"] != milestone.status:
            NotificationService.create_event(
                actor=actor,
                title=f"Milestone completed for {milestone.project.project_number}",
                message=f"{milestone.title} was marked complete.",
                notification_type="Project",
                priority="Medium",
                target_module="Delivery Projects",
                entity_type="ProjectMilestone",
                entity_id=milestone.id,
                is_broadcast=True,
                request=request,
            )
        return milestone

    @staticmethod
    @transaction.atomic
    def create_task(*, project, data, actor, request=None):
        if data.get("status") == ProjectTask.Status.DONE:
            data["completed_at"] = timezone.now()
        task = ProjectTask.objects.create(
            project=project,
            task_number=_next_task_number(),
            created_by=actor,
            updated_by=actor,
            **data,
        )
        record_audit_log(
            actor=actor,
            module="projects",
            action="create",
            entity_type="ProjectTask",
            entity_id=task.id,
            new_values={
                "project_id": str(project.id),
                "task_number": task.task_number,
                "title": task.title,
                "status": task.status,
                "assigned_to_id": task.assigned_to_id,
            },
            request=request,
        )
        return task

    @staticmethod
    @transaction.atomic
    def update_task(*, task, data, actor, request=None):
        old_values = {
            "status": task.status,
            "priority": task.priority,
            "assigned_to_id": task.assigned_to_id,
            "due_date": str(task.due_date) if task.due_date else None,
        }
        fields = [
            "milestone",
            "title",
            "description",
            "status",
            "priority",
            "assigned_to",
            "due_date",
            "estimated_hours",
            "actual_hours",
        ]
        for field in fields:
            if field in data:
                setattr(task, field, data[field])
        if "status" in data:
            task.completed_at = timezone.now() if task.status == ProjectTask.Status.DONE else None
        task.updated_by = actor
        update_fields = [field for field in fields if field in data] + ["updated_by", "updated_at"]
        if "status" in data:
            update_fields.append("completed_at")
        task.save(update_fields=update_fields)

        record_audit_log(
            actor=actor,
            module="projects",
            action="update",
            entity_type="ProjectTask",
            entity_id=task.id,
            old_values=old_values,
            new_values={
                "status": task.status,
                "priority": task.priority,
                "assigned_to_id": task.assigned_to_id,
                "due_date": str(task.due_date) if task.due_date else None,
            },
            request=request,
        )
        if task.status == ProjectTask.Status.DONE and old_values["status"] != task.status:
            NotificationService.create_event(
                actor=actor,
                title=f"Task completed for {task.project.project_number}",
                message=f"{task.title} is now marked done.",
                notification_type="Project",
                priority="Medium",
                target_module="Delivery Projects",
                entity_type="ProjectTask",
                entity_id=task.id,
                is_broadcast=True,
                request=request,
            )
        return task

    @staticmethod
    @transaction.atomic
    def delete_task(*, task, actor, request=None):
        old_values = {
            "project_id": str(task.project_id),
            "task_number": task.task_number,
            "title": task.title,
            "status": task.status,
            "assigned_to_id": task.assigned_to_id,
        }
        task.is_deleted = True
        task.deleted_at = timezone.now()
        task.deleted_by = actor
        task.updated_by = actor
        task.save(update_fields=["is_deleted", "deleted_at", "deleted_by", "updated_by", "updated_at"])

        record_audit_log(
            actor=actor,
            module="projects",
            action="delete",
            entity_type="ProjectTask",
            entity_id=task.id,
            old_values=old_values,
            new_values={"is_deleted": True},
            request=request,
        )
        return task

    @staticmethod
    @transaction.atomic
    def create_deadline(*, project, data, actor, request=None):
        deadline = ProjectDeadline.objects.create(project=project, created_by=actor, updated_by=actor, **data)
        record_audit_log(
            actor=actor,
            module="projects",
            action="create",
            entity_type="ProjectDeadline",
            entity_id=deadline.id,
            new_values={
                "project_id": str(project.id),
                "title": deadline.title,
                "due_date": str(deadline.due_date),
                "severity": deadline.severity,
                "status": deadline.status,
            },
            request=request,
        )
        return deadline

    @staticmethod
    @transaction.atomic
    def update_deadline(*, deadline, data, actor, request=None):
        old_values = {
            "title": deadline.title,
            "due_date": str(deadline.due_date),
            "severity": deadline.severity,
            "status": deadline.status,
            "notes": deadline.notes,
        }
        fields = ["milestone", "title", "due_date", "severity", "status", "notes"]
        for field in fields:
            if field in data:
                setattr(deadline, field, data[field])
        deadline.updated_by = actor
        deadline.save(update_fields=[field for field in fields if field in data] + ["updated_by", "updated_at"])

        record_audit_log(
            actor=actor,
            module="projects",
            action="update",
            entity_type="ProjectDeadline",
            entity_id=deadline.id,
            old_values=old_values,
            new_values={
                "title": deadline.title,
                "due_date": str(deadline.due_date),
                "severity": deadline.severity,
                "status": deadline.status,
                "notes": deadline.notes,
            },
            request=request,
        )
        if deadline.status in {ProjectDeadline.Status.MET, ProjectDeadline.Status.MISSED} and old_values["status"] != deadline.status:
            NotificationService.create_event(
                actor=actor,
                title=f"Deadline {deadline.status.lower()} for {deadline.project.project_number}",
                message=f"{deadline.title} moved to {deadline.get_status_display().lower()}.",
                notification_type="Project",
                priority="High" if deadline.status == ProjectDeadline.Status.MISSED else "Medium",
                target_module="Delivery Projects",
                entity_type="ProjectDeadline",
                entity_id=deadline.id,
                is_broadcast=True,
                request=request,
            )
        return deadline


class EmployeePerformanceReviewService:
    @staticmethod
    @transaction.atomic
    def create_review(*, data, actor, request=None):
        review = EmployeePerformanceReview.objects.create(created_by=actor, updated_by=actor, **data)
        record_audit_log(
            actor=actor,
            module="projects",
            action="create",
            entity_type="EmployeePerformanceReview",
            entity_id=review.id,
            new_values={
                "employee_id": review.employee_id,
                "review_cycle": review.review_cycle,
                "status": review.status,
                "rating": str(review.rating),
            },
            request=request,
        )
        NotificationService.create_event(
            actor=actor,
            title=f"Performance review created for {review.employee.get_full_name() or review.employee.email or review.employee.mobile}",
            message=f"{review.review_cycle} review opened for delivery performance tracking.",
            notification_type="Project",
            priority="Low",
            target_module="Delivery Projects",
            entity_type="EmployeePerformanceReview",
            entity_id=review.id,
            is_broadcast=True,
            request=request,
        )
        return review

    @staticmethod
    @transaction.atomic
    def update_review(*, review, data, actor, request=None):
        old_values = {
            "review_stage": review.review_stage,
            "status": review.status,
            "rating": str(review.rating),
            "next_review_date": str(review.next_review_date),
        }
        fields = [
            "employee",
            "manager",
            "department",
            "designation",
            "review_cycle",
            "review_stage",
            "goals_assigned",
            "goals_completed",
            "kpi_score",
            "task_completion",
            "quality_score",
            "attendance_score",
            "rating",
            "status",
            "last_review_date",
            "next_review_date",
            "manager_notes",
            "improvement_plan",
            "promotion_readiness",
            "attrition_risk",
            "recommended_training",
            "metrics",
            "okrs",
            "feedback",
        ]
        for field in fields:
            if field in data:
                setattr(review, field, data[field])
        review.updated_by = actor
        review.save(update_fields=[field for field in fields if field in data] + ["updated_by", "updated_at"])

        record_audit_log(
            actor=actor,
            module="projects",
            action="update",
            entity_type="EmployeePerformanceReview",
            entity_id=review.id,
            old_values=old_values,
            new_values={
                "review_stage": review.review_stage,
                "status": review.status,
                "rating": str(review.rating),
                "next_review_date": str(review.next_review_date),
            },
            request=request,
        )
        return review
