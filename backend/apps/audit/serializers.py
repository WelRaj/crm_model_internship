from rest_framework import serializers

from apps.audit.models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    actor_id = serializers.SerializerMethodField()
    actor_name = serializers.SerializerMethodField()
    actor_role = serializers.SerializerMethodField()

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
