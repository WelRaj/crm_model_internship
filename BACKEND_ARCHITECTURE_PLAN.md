# Backend Architecture Plan

Last updated: 2026-07-08

## 1. Project Standard

This backend must be designed as a real production commercial product, not as a college/demo project.

Frontend stack:

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS

Backend stack:

- Python 3.13
- Django 5
- Django REST Framework
- MySQL 8
- Redis
- Celery
- Nginx

Production priorities:

- Secure authentication
- Role based access control
- Object level permissions
- Audit logs
- Database integrity
- API versioning
- Scalable module structure
- Background jobs
- File storage
- Monitoring and logging
- Backup and recovery

## 2. Target Production Architecture

```text
Next.js Frontend
    |
    v
Nginx
    |
    v
Django REST Framework API
    |
    v
Service Layer
    |
    v
Repository Layer / ORM Queries
    |
    v
MySQL 8

Redis
  |-- Cache
  |-- OTP store
  |-- Celery broker
  |-- Rate limit counters

Celery Workers
  |-- Email jobs
  |-- SMS/WhatsApp jobs
  |-- Report generation
  |-- Reminder jobs
  |-- File processing

Storage Service
  |-- Profile images
  |-- Employee documents
  |-- Agreements
  |-- Proposals
  |-- Invoices
  |-- Payment proofs
```

## 3. Backend Folder Structure

Recommended root:

```text
backend/
  manage.py
  requirements/
    base.txt
    local.txt
    production.txt
  config/
    settings/
      base.py
      local.py
      production.py
    urls.py
    asgi.py
    wsgi.py
    celery.py
  apps/
    accounts/
    core/
    crm/
    projects/
    finance/
    hrms/
    marketing/
    support/
    notifications/
    audit/
    files/
  tests/
  docker/
  scripts/
```

Each business app should follow this pattern:

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

Rule:

- Views should stay thin.
- Serializers validate API input/output.
- Services contain business logic.
- Selectors contain read/query logic.
- Models define database structure and constraints.
- Permissions enforce access.
- Tasks contain Celery background jobs.

## 4. Apps and Responsibility

| App | Responsibility |
| --- | --- |
| `accounts` | Users, login, sessions, password, roles, permissions |
| `core` | Common base models, constants, response helpers, pagination, utilities |
| `crm` | Leads, clients, contacts, follow-ups, outcomes, agreements |
| `projects` | Delivery projects, team assignment, tasks, milestones, deadlines, performance |
| `finance` | Clients, vendors, quotations, invoices, payments, expenses, budgets, payroll, GST, TDS |
| `hrms` | Employees, attendance, leave, onboarding, exits |
| `marketing` | Campaigns, lead sources, ROI tracking |
| `support` | Tickets, comments, status history, assignment |
| `notifications` | In-app notifications, email/SMS queue triggers |
| `audit` | Audit logs, activity timeline, API mutation tracking |
| `files` | File metadata, uploads, storage integration, access checks |

## 5. Design Pattern

Use this request flow:

```text
URL
  -> ViewSet / APIView
  -> Serializer
  -> Service
  -> Selector / Repository-style query helper
  -> Model
  -> Database
```

Do not put business rules directly in `views.py`.

Example:

```text
LoginView
  -> LoginSerializer
  -> AuthService.login()
  -> UserSelector.get_by_email_or_mobile()
  -> TokenService.create_tokens()
  -> LoginHistoryService.record_success()
```

## 6. Database Rules

Database:

- MySQL 8

Primary keys:

- Use UUID primary keys for business tables.

Base fields for most tables:

- `id`
- `created_at`
- `updated_at`
- `created_by`
- `updated_by`
- `is_active`
- `is_deleted`
- `deleted_at`
- `deleted_by`

Database quality rules:

- Use proper foreign keys.
- Use transactions for multi-table writes.
- Use indexes for search/filter fields.
- Use unique constraints where needed.
- Use soft delete for business records.
- Use hard delete only for safe technical/temp records.
- Store money using decimal fields, not floats.
- Store timezone-aware datetimes.
- Keep audit logs append-only.

## 7. Authentication Strategy

Phase 1 login:

- Email/mobile plus password.
- JWT access token.
- Refresh token.
- Device sessions.
- Login history.

Phase 2 security:

- Email OTP for sensitive actions.
- SMS/WhatsApp OTP if gateway is available.
- Two-factor authentication.
- Device trust/revoke.

Token plan:

| Token | Lifetime | Purpose |
| --- | --- | --- |
| Access token | 15 minutes | API authentication |
| Refresh token | 7 days | Renew access token |

Authentication APIs:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/auth/login/` | Login with email/mobile and password |
| `POST` | `/api/v1/auth/refresh/` | Refresh access token |
| `POST` | `/api/v1/auth/logout/` | Logout current session |
| `POST` | `/api/v1/auth/logout-all/` | Logout all sessions |
| `GET` | `/api/v1/auth/me/` | Current user |
| `POST` | `/api/v1/auth/password/forgot/` | Start forgot password |
| `POST` | `/api/v1/auth/password/reset/` | Reset password |
| `POST` | `/api/v1/auth/password/change/` | Change password |

## 8. Accounts Database Design

Core tables:

### `users`

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

### `roles`

Fields:

- `id`
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

Fields:

- `id`
- `code`
- `name`
- `module`
- `action`
- `description`

Example actions:

- View
- Create
- Edit
- Delete
- Approve
- Export
- Assign

### `user_roles`

Fields:

- `id`
- `user_id`
- `role_id`
- `assigned_by`
- `assigned_at`

### `role_permissions`

Fields:

- `id`
- `role_id`
- `permission_id`

### `user_sessions`

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

### `login_history`

Fields:

- `id`
- `user_id`
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

Fields:

- `id`
- `user_id`
- `otp_hash`
- `expires_at`
- `is_used`
- `used_at`
- `created_at`

## 9. Security Requirements

Authentication:

- Passwords must use Django password hashing.
- Never store raw OTP.
- Store OTP hash with expiry.
- Refresh token should be hashed in database.
- Revoke refresh token on logout.

Authorization:

- Every dashboard API requires authentication.
- Use RBAC for module-level access.
- Use object-level permission for records owned by team/user/department.
- Finance, payroll, bank, admin, and audit APIs require strict permissions.

Rate limiting:

- Login attempts.
- OTP send.
- Password reset.
- File upload.
- Export/report generation.

Audit logging:

- Log every create/update/delete/approve/reject/export/login action.
- Store actor, module, entity, old values, new values, IP, user agent, timestamp.

## 10. API Standards

API version:

```text
/api/v1/
```

Standard success response:

```json
{
  "success": true,
  "message": "Operation completed",
  "data": {}
}
```

Standard validation error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "field": "Error message"
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

List APIs should support:

- `page`
- `limit`
- `search`
- `status`
- `from_date`
- `to_date`
- module-specific filters

## 11. File Management

Do not store important files directly inside random local folders for production.

Use a storage abstraction through the `files` app.

File categories:

- Profile photos
- Employee documents
- Agreements
- Proposal files
- Invoice PDFs
- Payment proofs
- Bank documents

File metadata table:

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

Production storage options:

- S3-compatible storage
- Azure Blob Storage
- Google Cloud Storage
- Private server storage with backup and signed URL layer

## 12. Background Jobs

Use Celery for:

- Email sending
- SMS/WhatsApp sending
- OTP cleanup
- Reminder notifications
- Invoice PDF generation
- Report export generation
- Audit log cleanup/archive
- Scheduled backup triggers

Redis should be used for:

- Celery broker
- Cache
- Rate limit counters
- Short-lived OTP/session metadata

## 13. Monitoring and Operations

Production must include:

- API request logging
- Error monitoring with Sentry or equivalent
- Health check endpoint
- Database backup strategy
- Environment-based settings
- Docker setup
- CI/CD pipeline
- Unit tests
- Integration tests

Health endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/health/` | API process status |
| `GET` | `/api/v1/health/db/` | Database connectivity |
| `GET` | `/api/v1/health/redis/` | Redis connectivity |

## 14. First Backend Milestone

Start with `accounts` and `core`.

Milestone 1 scope:

- Django project setup
- MySQL connection
- Environment settings
- Custom user model
- Roles and permissions tables
- Login API
- Refresh token API
- Logout API
- Current user API
- Login history
- Basic audit logging
- Standard response format
- API versioning

Do not start CRM/Finance coding before auth and user foundation is stable.

## 15. Backend Build Order

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

## 16. Immediate Next Step

Before writing backend code, freeze Milestone 1 design:

- Final user model fields.
- Role/permission model structure.
- JWT package choice.
- MySQL database name and credentials strategy.
- Environment variables.
- Local development setup.

Recommended JWT package:

- `djangorestframework-simplejwt`

Recommended MySQL package:

- `mysqlclient` for production if build environment supports it.
- `PyMySQL` only if `mysqlclient` causes Windows setup issues.

## 17. Non-Negotiable Rules

- No business logic inside views.
- No raw passwords or raw OTPs in database.
- No frontend-only security assumptions.
- No important production files in public folders.
- No finance/bank/payroll API without RBAC.
- No mutation API without audit log.
- No module coding before its database relationships are defined.
- Keep API response format consistent from day one.
