# Production Backend Architecture

Last updated: 2026-07-08

## 1. Product Standard

This backend is for a real commercial CRM/ERP/HRMS/Finance/Project Management product.

It must be designed for production use from day one:

- Secure authentication
- Clean database design
- Role based access control
- Object level permissions
- Audit logging
- API versioning
- Scalable app structure
- Service layer based business logic
- MySQL-backed persistence
- Future Redis/Celery support for cache, OTP, reminders, and background jobs

Core backend stack:

- Python
- Django
- Django REST Framework
- MySQL

## 2. System Architecture

```text
Next.js Frontend
    |
    v
Nginx / Reverse Proxy
    |
    v
Django REST Framework API
    |
    v
Service Layer
    |
    v
Selector / Repository Query Layer
    |
    v
Django ORM
    |
    v
MySQL
```

Production support layer:

```text
Redis
  |-- Cache
  |-- OTP expiry store
  |-- Rate limit counters
  |-- Celery broker

Celery Workers
  |-- Email jobs
  |-- SMS/WhatsApp jobs
  |-- Notification jobs
  |-- Reminder jobs
  |-- Report generation
  |-- File processing

Storage Service
  |-- Profile photos
  |-- Employee documents
  |-- Agreements
  |-- Proposal files
  |-- Invoice PDFs
  |-- Payment proofs
```

## 3. Recommended Backend Folder Structure

```text
backend/
  manage.py
  requirements/
    base.txt
    local.txt
    production.txt
  config/
    __init__.py
    urls.py
    asgi.py
    wsgi.py
    celery.py
    settings/
      __init__.py
      base.py
      local.py
      production.py
  apps/
    __init__.py
    core/
    accounts/
    audit/
    files/
    crm/
    projects/
    finance/
    hrms/
    marketing/
    support/
    notifications/
  tests/
  scripts/
  docker/
  .env.example
```

Each Django app should follow this internal pattern:

```text
apps/<app_name>/
  __init__.py
  apps.py
  models.py
  serializers.py
  views.py
  urls.py
  services.py
  selectors.py
  permissions.py
  validators.py
  tasks.py
  signals.py
  tests/
```

## 4. Architecture Rule

Business logic must not be written directly inside `views.py`.

Request flow:

```text
URL
  -> ViewSet / APIView
  -> Serializer
  -> Service
  -> Selector / Query helper
  -> Model
  -> MySQL
```

Layer responsibilities:

| Layer | Responsibility |
| --- | --- |
| Views | Request/response handling only |
| Serializers | Input validation and output formatting |
| Services | Business logic and transactions |
| Selectors | Read/query logic |
| Models | Database structure and constraints |
| Permissions | RBAC and object access checks |
| Tasks | Background jobs |

## 5. Django Apps

| App | Responsibility |
| --- | --- |
| `core` | Base models, response helpers, pagination, exceptions, utilities |
| `accounts` | Users, authentication, sessions, roles, permissions, profile |
| `audit` | Audit logs, activity timeline, mutation history |
| `files` | File metadata, storage abstraction, upload access control |
| `crm` | Leads, clients, contacts, follow-ups, outcomes, agreements |
| `projects` | Delivery projects, team assignment, tasks, milestones, deadlines |
| `finance` | Clients, vendors, quotations, invoices, payments, expenses, GST, TDS, payroll |
| `hrms` | Employees, attendance, leave, onboarding, exits |
| `marketing` | Campaigns, lead sources, ROI metrics |
| `support` | Support tickets, comments, status history |
| `notifications` | In-app notifications, email/SMS/WhatsApp triggers |

## 6. Database Design Rules

Database:

- MySQL 8

Primary keys:

- Use UUID primary keys for business tables.

Common fields for most business models:

- `id`
- `created_at`
- `updated_at`
- `created_by`
- `updated_by`
- `is_active`
- `is_deleted`
- `deleted_at`
- `deleted_by`

Database rules:

- Use foreign keys for relationships.
- Use transactions for multi-table operations.
- Add indexes for search, filter, and join fields.
- Use unique constraints for email, mobile, employee ID, role code, permission code, invoice number, proposal number, agreement number.
- Use soft delete for business data.
- Use hard delete only for temporary technical data.
- Store money with decimal fields.
- Store timezone-aware datetimes.
- Keep audit logs append-only.

## 7. Authentication Design

First production version:

- Email/mobile + password login
- JWT access token
- Refresh token
- Device session tracking
- Login history
- Password reset
- Password change

Later security upgrade:

- Email OTP for sensitive actions
- SMS/WhatsApp OTP if gateway is available
- Two-factor authentication
- Trusted device management

Token plan:

| Token | Lifetime | Storage |
| --- | --- | --- |
| Access token | 15 minutes | Frontend memory or secure cookie |
| Refresh token | 7 days | Secure cookie or protected storage |

Refresh tokens must be stored hashed in the database.

## 8. Accounts Database Tables

### `users`

Purpose:

- Main authenticated user table.

Fields:

- `id`
- `employee_id`
- `first_name`
- `last_name`
- `email`
- `mobile`
- `password`
- `department`
- `designation`
- `is_active`
- `is_verified`
- `is_staff`
- `is_superuser`
- `last_login`
- `created_at`
- `updated_at`

### `user_profiles`

Purpose:

- Extended employee profile information.

Fields:

- `id`
- `user_id`
- `profile_photo_file_id`
- `reporting_manager_id`
- `date_of_joining`
- `office_location`
- `employment_type`
- `employee_status`
- `emergency_contact_name`
- `emergency_contact_mobile`
- `address`
- `created_at`
- `updated_at`

### `roles`

Purpose:

- Role definitions.

Fields:

- `id`
- `code`
- `name`
- `description`
- `is_system_role`
- `created_at`
- `updated_at`

Default roles:

- Super Admin
- Admin
- HR
- Finance
- Marketing
- Telecaller
- Project Manager
- Employee

### `permissions`

Purpose:

- Module/action permissions.

Fields:

- `id`
- `code`
- `name`
- `module`
- `action`
- `description`

Actions:

- View
- Create
- Edit
- Delete
- Approve
- Reject
- Export
- Assign

### `role_permissions`

Purpose:

- Link roles with permissions.

Fields:

- `id`
- `role_id`
- `permission_id`

### `user_roles`

Purpose:

- Assign roles to users.

Fields:

- `id`
- `user_id`
- `role_id`
- `assigned_by`
- `assigned_at`

### `user_sessions`

Purpose:

- Track refresh tokens and active devices.

Fields:

- `id`
- `user_id`
- `refresh_token_hash`
- `device_name`
- `browser`
- `os`
- `ip_address`
- `user_agent`
- `is_active`
- `expires_at`
- `created_at`
- `last_used_at`
- `revoked_at`

### `login_history`

Purpose:

- Track successful and failed login attempts.

Fields:

- `id`
- `user_id`
- `identifier`
- `ip_address`
- `browser`
- `os`
- `device`
- `location`
- `login_time`
- `logout_time`
- `status`
- `failure_reason`

### `password_reset_requests`

Purpose:

- Secure password reset flow.

Fields:

- `id`
- `user_id`
- `otp_hash`
- `expires_at`
- `is_used`
- `used_at`
- `created_at`

## 9. API Standards

API base:

```text
/api/v1/
```

Success response:

```json
{
  "success": true,
  "message": "Operation completed",
  "data": {}
}
```

Validation error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "field_name": "Error message"
  }
}
```

List response:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

Every list API should support where relevant:

- `page`
- `limit`
- `search`
- `status`
- `from_date`
- `to_date`
- module-specific filters

## 10. First API Set

Authentication:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/auth/login/` | Login with email/mobile and password |
| `POST` | `/api/v1/auth/refresh/` | Refresh access token |
| `POST` | `/api/v1/auth/logout/` | Logout current session |
| `POST` | `/api/v1/auth/logout-all/` | Logout all sessions |
| `GET` | `/api/v1/auth/me/` | Current authenticated user |
| `POST` | `/api/v1/auth/password/forgot/` | Start forgot password |
| `POST` | `/api/v1/auth/password/reset/` | Reset password |
| `POST` | `/api/v1/auth/password/change/` | Change password |

Profile:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/profile/me/` | Current user's profile |
| `PUT` | `/api/v1/profile/me/` | Update current user's profile |
| `POST` | `/api/v1/profile/me/photo/` | Upload profile photo |
| `GET` | `/api/v1/profile/me/login-history/` | Login history |
| `GET` | `/api/v1/profile/me/activity/` | Activity timeline |

RBAC:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/accounts/users/` | List users |
| `POST` | `/api/v1/accounts/users/` | Create user |
| `GET` | `/api/v1/accounts/roles/` | List roles |
| `POST` | `/api/v1/accounts/roles/` | Create role |
| `GET` | `/api/v1/accounts/permissions/` | List permissions |
| `POST` | `/api/v1/accounts/users/{id}/roles/` | Assign user roles |

## 11. RBAC Model

Backend must enforce permissions. Frontend permission checks are only for UI convenience.

Permission code format:

```text
<module>.<action>
```

Examples:

- `leads.view`
- `leads.create`
- `leads.assign`
- `finance.view`
- `finance.approve`
- `admin.manage_users`
- `projects.assign_team`

Access levels:

| Level | Meaning |
| --- | --- |
| Global | Can access all records |
| Department | Can access department records |
| Team | Can access team records |
| Own | Can access own records |

Object-level permission is required for:

- Leads
- Projects
- Finance records
- Employee records
- Support tickets
- Client records

## 12. Audit Logging

Every mutation API should create an audit log.

Audit log fields:

- `id`
- `actor_id`
- `module`
- `action`
- `entity_type`
- `entity_id`
- `old_values`
- `new_values`
- `ip_address`
- `user_agent`
- `created_at`

Audit actions:

- Create
- Update
- Delete
- Approve
- Reject
- Login
- Logout
- Export
- Assign
- Upload

Audit logs must be append-only.

## 13. File Management

Production files should go through a storage abstraction, not random public folders.

File metadata fields:

- `id`
- `owner_type`
- `owner_id`
- `file_category`
- `original_name`
- `storage_key`
- `mime_type`
- `size`
- `checksum`
- `uploaded_by`
- `created_at`

File categories:

- Profile Photo
- Employee Document
- Agreement
- Proposal
- Invoice
- Payment Proof
- Bank Document

## 14. Module Build Order

Build backend in this order:

1. `core`
2. `accounts`
3. `audit`
4. `files`
5. `crm`
6. `projects`
7. `finance`
8. `hrms`
9. `marketing`
10. `support`
11. `notifications`

Reason:

- `core`, `accounts`, `audit`, and `files` are foundation modules.
- All other modules depend on authentication, permissions, audit logs, and uploads.

## 15. Milestone 1 Scope

Milestone 1 should deliver:

- Django project setup
- MySQL connection
- Environment settings
- Custom user model
- Roles
- Permissions
- User roles
- Login API
- Refresh token API
- Logout API
- Current user API
- Profile API
- Login history
- Standard API response format
- Basic audit log model

Do not start CRM, Finance, HRMS, or Project APIs before Milestone 1 is stable.

## 16. Non-Negotiable Backend Rules

- Use Python, Django, Django REST Framework, and MySQL.
- No business logic inside views.
- No raw password storage.
- No raw OTP storage.
- No finance/payroll/bank APIs without RBAC.
- No create/update/delete API without audit log.
- No important file uploads without storage metadata.
- No frontend-only security assumptions.
- Use transactions for multi-table writes.
- Keep API responses consistent from the first day.
