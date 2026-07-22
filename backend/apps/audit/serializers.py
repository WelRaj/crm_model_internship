from rest_framework import serializers

from apps.audit.models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    actor_id = serializers.SerializerMethodField()
    actor_name = serializers.SerializerMethodField()
    actor_role = serializers.SerializerMethodField()
    investigation_status_label = serializers.CharField(source="get_investigation_status_display", read_only=True)

    class Meta:
        model = AuditLog
        fields = (
            "id",
            "actor_id",
            "actor_name",
            "actor_role",
            "module",
            "action",
            "entity_type",
            "entity_id",
            "old_values",
            "new_values",
            "ip_address",
            "user_agent",
            "investigation_status",
            "investigation_status_label",
            "investigation_note",
            "investigated_by",
            "investigated_at",
            "created_at",
        )
        read_only_fields = (
            "id",
            "actor_id",
            "actor_name",
            "actor_role",
            "module",
            "action",
            "entity_type",
            "entity_id",
            "old_values",
            "new_values",
            "ip_address",
            "user_agent",
            "investigated_by",
            "investigated_at",
            "created_at",
        )

    def get_actor_id(self, obj):
        if not obj.actor_id:
            return "SYSTEM"
        return obj.actor.employee_id or str(obj.actor_id)

    def get_actor_name(self, obj):
        if not obj.actor_id:
            return "System"
        return obj.actor.get_full_name() or obj.actor.email or obj.actor.mobile or str(obj.actor_id)

    def get_actor_role(self, obj):
        if not obj.actor_id:
            return "System"
        role = obj.actor.user_roles.select_related("role").first()
        return role.role.name if role else "User"


class AuditInvestigationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ("investigation_status", "investigation_note")

    def validate(self, attrs):
        status = attrs.get("investigation_status", getattr(self.instance, "investigation_status", AuditLog.InvestigationStatus.CLEAR))
        note = attrs.get("investigation_note", getattr(self.instance, "investigation_note", ""))
        if status != AuditLog.InvestigationStatus.CLEAR and len(note.strip()) < 5:
            raise serializers.ValidationError({"investigation_note": "Investigation note is required for non-clear audit events."})
        return attrs
