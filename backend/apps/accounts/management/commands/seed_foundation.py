import os

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.accounts.models import Permission, Role, RolePermission, User, UserProfile, UserRole


DEFAULT_ROLES = [
    ("super_admin", "Super Admin", "Full system access."),
    ("admin", "Admin", "Administrative access."),
    ("crm_admin", "CRM Admin", "CRM management access."),
    ("team_lead", "Team Lead", "Team and lead oversight access."),
    ("sales", "Sales", "Sales lead access."),
    ("hr", "HR", "Human resources access."),
    ("finance", "Finance", "Finance module access."),
    ("marketing", "Marketing", "Marketing module access."),
    ("telecaller", "Telecaller", "Calling and lead follow-up access."),
    ("project_manager", "Project Manager", "Project delivery access."),
    ("support", "Support", "Support desk access."),
    ("read_only", "Read Only", "View-only CRM access."),
    ("employee", "Employee", "Standard employee access."),
]

MODULES = [
    "accounts",
    "audit",
    "files",
    "leads",
    "clients",
    "projects",
    "finance",
    "hrms",
    "marketing",
    "support",
    "notifications",
]

ACTIONS = ["view", "create", "edit", "delete", "approve", "reject", "export", "assign"]


class Command(BaseCommand):
    help = "Seed foundation roles, permissions, and the first local admin user."

    def add_arguments(self, parser):
        parser.add_argument("--admin-email", default=os.getenv("CRM_ADMIN_EMAIL", "admin@crmproduct.local"))
        parser.add_argument("--admin-password", default=os.getenv("CRM_ADMIN_PASSWORD"))
        parser.add_argument("--admin-mobile", default=os.getenv("CRM_ADMIN_MOBILE", "9999999999"))
        parser.add_argument("--admin-first-name", default=os.getenv("CRM_ADMIN_FIRST_NAME", "CRM"))
        parser.add_argument("--admin-last-name", default=os.getenv("CRM_ADMIN_LAST_NAME", "Admin"))
        parser.add_argument("--skip-admin", action="store_true", help="Seed roles and permissions without creating or updating the admin user.")

    @transaction.atomic
    def handle(self, *args, **options):
        roles = {}
        for code, name, description in DEFAULT_ROLES:
            role, _ = Role.objects.update_or_create(
                code=code,
                defaults={
                    "name": name,
                    "description": description,
                    "is_system_role": True,
                },
            )
            roles[code] = role

        permissions = []
        for module in MODULES:
            for action in ACTIONS:
                code = f"{module}.{action}"
                permission, _ = Permission.objects.update_or_create(
                    code=code,
                    defaults={
                        "name": f"{module.replace('_', ' ').title()} {action.title()}",
                        "module": module,
                        "action": action,
                        "description": f"Can {action} {module} records.",
                    },
                )
                permissions.append(permission)

        super_admin_role = roles["super_admin"]
        for permission in permissions:
            RolePermission.objects.get_or_create(role=super_admin_role, permission=permission)

        if options["skip_admin"]:
            self.stdout.write(self.style.SUCCESS("Foundation roles and permissions seeded. Admin user skipped."))
            self.stdout.write(f"Roles: {Role.objects.count()}")
            self.stdout.write(f"Permissions: {Permission.objects.count()}")
            return

        admin_password = options["admin_password"]
        if not admin_password:
            raise CommandError("Provide --admin-password or set CRM_ADMIN_PASSWORD, or use --skip-admin.")

        admin_email = options["admin_email"]
        admin_user, created = User.objects.get_or_create(
            email=admin_email,
            defaults={
                "mobile": options["admin_mobile"],
                "first_name": options["admin_first_name"],
                "last_name": options["admin_last_name"],
                "employee_id": "ADMIN-001",
                "department": "Administration",
                "designation": "Super Admin",
                "is_staff": True,
                "is_superuser": True,
                "is_verified": True,
                "is_active": True,
            },
        )
        if created:
            admin_user.set_password(admin_password)
        else:
            admin_user.first_name = options["admin_first_name"]
            admin_user.last_name = options["admin_last_name"]
            admin_user.department = "Administration"
            admin_user.designation = "Super Admin"
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.is_verified = True
            admin_user.is_active = True
            if options["admin_mobile"] and not admin_user.mobile:
                admin_user.mobile = options["admin_mobile"]
            admin_user.set_password(admin_password)
        admin_user.save()

        UserProfile.objects.get_or_create(user=admin_user)
        UserRole.objects.get_or_create(user=admin_user, role=super_admin_role, defaults={"assigned_by": admin_user})

        self.stdout.write(self.style.SUCCESS("Foundation seed completed."))
        self.stdout.write(f"Roles: {Role.objects.count()}")
        self.stdout.write(f"Permissions: {Permission.objects.count()}")
        self.stdout.write(f"Admin email: {admin_user.email}")
