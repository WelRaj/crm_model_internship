from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers

from apps.support.models import SupportTicket, SupportTicketAssignment, SupportTicketComment, SupportTicketStatusHistory

User = get_user_model()


def _user_display_name(user):
    return user.get_full_name() or user.email or user.mobile or "Unknown"


class SupportOwnerSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "employee_id", "first_name", "last_name", "full_name", "department", "designation")

    def get_full_name(self, obj):
        return _user_display_name(obj)


class SupportTicketCommentSerializer(serializers.ModelSerializer):
    author = SupportOwnerSerializer(read_only=True)
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicketComment
        fields = ("id", "author", "author_name", "message", "is_internal", "created_at", "updated_at")

    def get_author_name(self, obj):
        author = obj.author
        if not author:
            return "System"
        return _user_display_name(author)


class SupportTicketStatusHistorySerializer(serializers.ModelSerializer):
    changed_by = SupportOwnerSerializer(read_only=True)
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicketStatusHistory
        fields = ("id", "from_status", "to_status", "note", "changed_by", "changed_by_name", "created_at")

    def get_changed_by_name(self, obj):
        changed_by = obj.changed_by
        if not changed_by:
            return "System"
        return _user_display_name(changed_by)


class SupportTicketAssignmentSerializer(serializers.ModelSerializer):
    owner = SupportOwnerSerializer(read_only=True)
    assigned_by = SupportOwnerSerializer(read_only=True)
    owner_name = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicketAssignment
        fields = ("id", "owner", "owner_name", "assigned_by", "note", "is_current", "created_at")

    def get_owner_name(self, obj):
        owner = obj.owner
        return _user_display_name(owner)


class SupportTicketSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    priority_label = serializers.CharField(source="get_priority_display", read_only=True)
    channel_label = serializers.CharField(source="get_channel_display", read_only=True)
    owner = SupportOwnerSerializer(source="current_owner", read_only=True)
    owner_name = serializers.SerializerMethodField()
    created_at_label = serializers.SerializerMethodField()
    response_due_label = serializers.SerializerMethodField()
    comments = SupportTicketCommentSerializer(many=True, read_only=True)
    status_history = SupportTicketStatusHistorySerializer(many=True, read_only=True)
    assignments = SupportTicketAssignmentSerializer(many=True, read_only=True)

    class Meta:
        model = SupportTicket
        fields = (
            "id",
            "ticket_number",
            "subject",
            "module",
            "requester",
            "priority",
            "priority_label",
            "status",
            "status_label",
            "channel",
            "channel_label",
            "owner",
            "owner_name",
            "response_due_at",
            "response_due_label",
            "description",
            "resolved_at",
            "resolution_summary",
            "is_active",
            "created_at",
            "created_at_label",
            "updated_at",
            "comments",
            "status_history",
            "assignments",
        )

    def get_owner_name(self, obj):
        owner = obj.current_owner
        if not owner:
            return "Unassigned"
        return _user_display_name(owner)

    def get_created_at_label(self, obj):
        return timezone.localtime(obj.created_at).strftime("%Y-%m-%d %H:%M") if obj.created_at else ""

    def get_response_due_label(self, obj):
        if not obj.response_due_at:
            return ""
        return timezone.localtime(obj.response_due_at).strftime("%Y-%m-%d %H:%M")


class SupportTicketWriteSerializer(serializers.Serializer):
    subject = serializers.CharField(max_length=180)
    module = serializers.ChoiceField(choices=SupportTicket.Module.choices)
    requester = serializers.CharField(max_length=160)
    priority = serializers.ChoiceField(choices=SupportTicket.Priority.choices, default=SupportTicket.Priority.MEDIUM)
    channel = serializers.ChoiceField(choices=SupportTicket.Channel.choices, default=SupportTicket.Channel.INTERNAL)
    description = serializers.CharField()
    current_owner_id = serializers.IntegerField(required=False, allow_null=True)
    response_due_at = serializers.DateTimeField(required=False, allow_null=True)
    status = serializers.ChoiceField(choices=SupportTicket.Status.choices, required=False)
    resolution_summary = serializers.CharField(required=False, allow_blank=True)

    def validate_current_owner_id(self, value):
        if value is None:
            return value
        try:
            owner = User.objects.get(id=value, is_active=True)
        except User.DoesNotExist as exc:
            raise serializers.ValidationError("Active owner user not found.") from exc
        return owner.id

    def validate(self, attrs):
        ticket = self.context.get("ticket")
        response_due_at = attrs.get("response_due_at", getattr(ticket, "response_due_at", None))
        if response_due_at and response_due_at.tzinfo is None:
            attrs["response_due_at"] = timezone.make_aware(response_due_at)
        return attrs


class SupportTicketStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=SupportTicket.Status.choices)
    note = serializers.CharField(required=False, allow_blank=True)
    resolution_summary = serializers.CharField(required=False, allow_blank=True)


class SupportTicketCommentCreateSerializer(serializers.Serializer):
    message = serializers.CharField()
    is_internal = serializers.BooleanField(default=True)
