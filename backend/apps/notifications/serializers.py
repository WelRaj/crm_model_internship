from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers

from apps.notifications.models import CommunicationJob, Notification, NotificationRead

User = get_user_model()


def _user_label(user):
    return user.get_full_name() or user.email or user.mobile or "Unknown"


class NotificationUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "employee_id", "first_name", "last_name", "full_name", "department", "designation")

    def get_full_name(self, obj):
        return _user_label(obj)


class NotificationSerializer(serializers.ModelSerializer):
    recipient = NotificationUserSerializer(read_only=True)
    notification_type_label = serializers.CharField(source="get_notification_type_display", read_only=True)
    priority_label = serializers.CharField(source="get_priority_display", read_only=True)
    created_at_label = serializers.SerializerMethodField()
    is_read = serializers.SerializerMethodField()
    read_at = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = (
            "id",
            "recipient",
            "title",
            "message",
            "notification_type",
            "notification_type_label",
            "priority",
            "priority_label",
            "action_url",
            "target_module",
            "entity_type",
            "entity_id",
            "metadata",
            "is_broadcast",
            "expires_at",
            "is_read",
            "read_at",
            "is_active",
            "created_at",
            "created_at_label",
            "updated_at",
        )

    def get_created_at_label(self, obj):
        return timezone.localtime(obj.created_at).strftime("%Y-%m-%d %H:%M") if obj.created_at else ""

    def get_is_read(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        return NotificationRead.objects.filter(notification=obj, user=user).exists()

    def get_read_at(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return None
        read = NotificationRead.objects.filter(notification=obj, user=user).only("read_at").first()
        return timezone.localtime(read.read_at).strftime("%Y-%m-%d %H:%M") if read else None


class NotificationWriteSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=180)
    message = serializers.CharField()
    notification_type = serializers.ChoiceField(choices=Notification.NotificationType.choices)
    priority = serializers.ChoiceField(choices=Notification.Priority.choices, default=Notification.Priority.MEDIUM)
    action_url = serializers.CharField(max_length=240, required=False, allow_blank=True)
    target_module = serializers.CharField(max_length=80, required=False, allow_blank=True)
    entity_type = serializers.CharField(max_length=120, required=False, allow_blank=True)
    entity_id = serializers.CharField(max_length=80, required=False, allow_blank=True)
    metadata = serializers.JSONField(required=False)
    is_broadcast = serializers.BooleanField(default=False)
    expires_at = serializers.DateTimeField(required=False, allow_null=True)
    recipient_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_recipient_id(self, value):
        if value is None:
            return value
        try:
            user = User.objects.get(id=value, is_active=True)
        except User.DoesNotExist as exc:
            raise serializers.ValidationError("Active recipient user not found.") from exc
        return user.id

    def validate(self, attrs):
        notification = self.context.get("notification")
        recipient_id = attrs.get("recipient_id")
        if recipient_id is None and notification is not None:
            recipient_id = notification.recipient_id
        is_broadcast = attrs.get("is_broadcast", getattr(notification, "is_broadcast", False))
        if not is_broadcast and recipient_id is None:
            raise serializers.ValidationError({"recipient_id": "Recipient is required unless this is a broadcast notification."})
        expires_at = attrs.get("expires_at")
        if expires_at and expires_at.tzinfo is None:
            attrs["expires_at"] = timezone.make_aware(expires_at)
        return attrs


class NotificationReadSerializer(serializers.Serializer):
    is_read = serializers.BooleanField()


class CommunicationJobSerializer(serializers.ModelSerializer):
    notification = serializers.SerializerMethodField()
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    channel_label = serializers.CharField(source="get_channel_display", read_only=True)
    created_at_label = serializers.SerializerMethodField()

    class Meta:
        model = CommunicationJob
        fields = (
            "id",
            "notification",
            "channel",
            "channel_label",
            "recipient_name",
            "recipient_email",
            "recipient_mobile",
            "subject",
            "message",
            "payload",
            "status",
            "status_label",
            "scheduled_at",
            "sent_at",
            "delivered_at",
            "retry_count",
            "last_error",
            "is_active",
            "created_at",
            "created_at_label",
            "updated_at",
        )

    def get_notification(self, obj):
        return {
            "id": str(obj.notification.id),
            "title": obj.notification.title,
            "notification_type": obj.notification.notification_type,
        } if obj.notification else None

    def get_created_at_label(self, obj):
        return timezone.localtime(obj.created_at).strftime("%Y-%m-%d %H:%M") if obj.created_at else ""


class CommunicationJobWriteSerializer(serializers.Serializer):
    channel = serializers.ChoiceField(choices=CommunicationJob.Channel.choices)
    recipient_name = serializers.CharField(max_length=160)
    recipient_email = serializers.EmailField(required=False, allow_blank=True)
    recipient_mobile = serializers.CharField(max_length=20, required=False, allow_blank=True)
    subject = serializers.CharField(max_length=180)
    message = serializers.CharField()
    payload = serializers.JSONField(required=False)
    status = serializers.ChoiceField(choices=CommunicationJob.Status.choices, required=False)
    scheduled_at = serializers.DateTimeField(required=False, allow_null=True)
    notification_id = serializers.UUIDField(required=False, allow_null=True)

    def validate(self, attrs):
        scheduled_at = attrs.get("scheduled_at")
        if scheduled_at and scheduled_at.tzinfo is None:
            attrs["scheduled_at"] = timezone.make_aware(scheduled_at)
        return attrs
