from apps.audit.models import AuditLog


def record_audit_log(*, actor, module, action, entity_type, entity_id, old_values=None, new_values=None, request=None):
    request_meta = getattr(request, "META", {}) if request else {}
    return AuditLog.objects.create(
        actor=actor,
        module=module,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        old_values=old_values or {},
        new_values=new_values or {},
        ip_address=request_meta.get("REMOTE_ADDR") if request else None,
        user_agent=request_meta.get("HTTP_USER_AGENT", "") if request else "",
    )
