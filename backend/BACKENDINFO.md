# Backend Information

Last updated: 2026-07-08

## 1. Purpose

This file is the backend continuity document.

Whenever work resumes after a break or a new session, read this file first. It should always explain:

- What backend architecture is planned.
- What backend work is completed.
- What is pending.
- Which tables are planned.
- Which module uses which table.
- Which APIs are planned.
- Where API calls should be centralized.
- What rules must not be broken.

## 2. Fixed Backend Stack

Core stack:

- Python
- Django
- Django REST Framework
- MySQL

Production support:

- Redis for cache, OTP expiry, rate limit counters, and Celery broker.
- Celery for background jobs.
- Nginx or another reverse proxy in production.
- Storage service for uploaded files.

## 3. Current Backend Folder Status

Backend root:

```text
D:\crmproduct\backend
```

Current files:

```text
PRODUCTION_BACKEND_ARCHITECTURE.md
BACKENDINFO.md
manage.py
config/
apps/
requirements/
.env.example
```

Current status:

- Architecture document created.
- Django project scaffold created.
- Virtual environment created in `.venv`.
- Local interpreter currently used: Python 3.14.4.
- Foundation apps created: `core`, `accounts`, `audit`, `files`.
- MySQL settings are configured through environment variables.
- Initial migrations are generated for `core`, `accounts`, `audit`, and `files`.
- Local `.env` is configured.
- MySQL database `crmproduct` is created.
- Foundation migrations are applied to MySQL.
- Database currently has 25 tables.
- Login, refresh, logout, current user, profile, and login history API views are implemented.
- Health and database health endpoints return 200 locally.
- First admin/user creation is pending.

## 4. Production Architecture Reference

Main architecture file:

```text
D:\crmproduct\backend\PRODUCTION_BACKEND_ARCHITECTURE.md
```

That file contains:

- Production backend architecture.
- Folder structure.
- App structure.
- Service layer pattern.
- Database rules.
- Authentication plan.
- RBAC plan.
- Audit logging plan.
- File management plan.
- Milestone 1 scope.

## 5. Mandatory Backend Rules

- Use Python, Django, Django REST Framework, and MySQL.
- Do not write business logic directly in `views.py`.
- Use service layer for business rules.
- Use selectors/query helpers for read-heavy logic.
- Use serializers for validation and API output.
- Every create/update/delete/approve/reject API must create an audit log.
- Finance, payroll, bank, admin, and user-management APIs must require strict RBAC.
- Do not store raw passwords.
- Do not store raw OTPs.
- Do not store production files in random public folders.
- Use transactions for multi-table writes.
- Use soft delete for business records.
- Keep API response format consistent.
- Keep all API calls centralized.

## 6. Centralized API Rule

All frontend API calls must go through one centralized API layer.

Frontend current API helper:

```text
D:\crmproduct\panel\src\lib\api-client.ts
```

Backend integration rule:

- Do not call `fetch` directly from random components.
- Do not hardcode backend URLs inside components.
- All frontend requests should go through `src/lib/api-client.ts` or module-specific service wrappers built on top of it.
- API base URL should come from `NEXT_PUBLIC_API_URL`.
- Backend should expose versioned APIs under `/api/v1/`.

Recommended frontend API organization:

```text
src/lib/api-client.ts
src/services/auth-api.ts
src/services/profile-api.ts
src/services/leads-api.ts
src/services/clients-api.ts
src/services/projects-api.ts
src/services/finance-api.ts
src/services/hrms-api.ts
src/services/marketing-api.ts
src/services/support-api.ts
src/services/admin-api.ts
```

Recommended backend API base:

```text
/api/v1/
```

Example:

```text
Frontend component
  -> src/services/leads-api.ts
  -> src/lib/api-client.ts
  -> /api/v1/leads/
  -> Django API
```

## 7. Planned Django Apps

| App | Purpose |
| --- | --- |
| `core` | Base models, response helpers, pagination, exceptions, utilities |
| `accounts` | Users, profile, authentication, sessions, roles, permissions |
| `audit` | Audit logs, activity timeline, mutation tracking |
| `files` | File metadata, upload handling, storage abstraction |
| `crm` | Leads, clients, contacts, follow-ups, outcomes, agreements |
| `projects` | Delivery projects, team assignment, tasks, milestones, deadlines |
| `finance` | Finance clients, vendors, quotations, invoices, payments, expenses, budgets, payroll, GST, TDS |
| `hrms` | Employees, attendance, leave, onboarding, exit process |
| `marketing` | Campaigns, sources, ROI metrics |
| `support` | Support tickets, comments, status history |
| `notifications` | In-app notifications and communication triggers |

## 8. Table Usage Map

### Core

| Table | Used By | Purpose |
| --- | --- | --- |
| `core_activity_types` | All modules | Optional standard activity/action type list |
| `core_sequences` | Leads, finance, projects | Generate readable IDs like lead numbers, invoice numbers, project IDs |

### Accounts

| Table | Used By | Purpose |
| --- | --- | --- |
| `users` | All modules | Authenticated employee/user record |
| `user_profiles` | My Profile, HRMS, Admin | Extended user profile details |
| `roles` | Admin, permissions | Role definitions such as Admin, HR, Finance |
| `permissions` | Admin, API permission checks | Module/action permission definitions |
| `role_permissions` | Admin, RBAC | Link roles with permissions |
| `user_roles` | Admin, RBAC | Link users with roles |
| `user_sessions` | Auth, security | Refresh token and device session tracking |
| `login_history` | My Profile, security | Recent login and failed login tracking |
| `password_reset_requests` | Auth | Forgot password and reset password OTP flow |

### Audit

| Table | Used By | Purpose |
| --- | --- | --- |
| `audit_logs` | All mutation APIs | Append-only create/update/delete/approve/reject/export history |
| `activity_timeline` | My Profile, modules | User-facing activity timeline |

### Files

| Table | Used By | Purpose |
| --- | --- | --- |
| `file_objects` | All file uploads | Metadata for uploaded files |
| `file_access_logs` | Security/audit | Track file access/download events |

### CRM

| Table | Used By | Purpose |
| --- | --- | --- |
| `leads` | Lead Desk, Client Operations | Common lead identity and status |
| `project_lead_details` | Lead Desk | Project-specific lead requirement details |
| `trading_lead_details` | Lead Desk | Trading/calling-specific lead details |
| `lead_assignments` | Lead Assignment | Lead owner/team assignment |
| `lead_transfer_logs` | Lead Assignment | Ownership transfer history |
| `lead_followups` | Follow-ups, Telecaller Desk | Follow-up schedule and notes |
| `lead_proposals` | Lead Wizard, Finance | Proposal values and status |
| `lead_approvals` | Lead Wizard | Approval/decision records |
| `lead_status_history` | Lead Desk, outcomes | Status movement history |
| `clients` | Client Operations, Finance | Client/company master |
| `client_contacts` | Client Operations | Client-side contacts |
| `client_projects` | Client Operations, Projects | Projects created from won leads/clients |
| `project_contacts` | Client Operations, Projects | Contact mapping per project |
| `project_agreements` | Agreements, files | Agreement records and document links |
| `call_logs` | Telecaller Desk | Calling activity logs |
| `lead_outcomes` | Lead Outcomes | Won/lost/converted outcome tracking |

### Projects

| Table | Used By | Purpose |
| --- | --- | --- |
| `projects` | Delivery Projects | Main project record |
| `project_team_assignments` | Team Assignment | Team leader/member assignments |
| `project_members` | Delivery Projects | Project member mapping |
| `project_tasks` | Tasks | Work item tracking |
| `project_milestones` | Milestones | Phase/milestone tracking |
| `project_deadlines` | Deadlines | Critical date tracking |
| `project_client_contacts` | Projects, Client Operations | Client technical contact relation |
| `employee_performance_reviews` | Performance | Employee performance records |

### Finance

| Table | Used By | Purpose |
| --- | --- | --- |
| `finance_clients` | Finance Control | Finance-side client master |
| `vendors` | Vendor Master | Vendor records |
| `quotations` | Quotations | Quote header |
| `quotation_items` | Quotations | Quote line items |
| `invoices` | Invoices | Invoice header |
| `invoice_items` | Invoices | Invoice line items |
| `payments` | Payments | Payment records |
| `payment_allocations` | Payments | Payment-to-invoice allocations |
| `reminders` | Reminders | Payment reminder schedules |
| `credit_notes` | Credit Notes | Credit/reversal records |
| `ledger_entries` | Expenses/Ledger | Sales, purchase, expense records |
| `expense_entries` | Expenses | Expense-specific details |
| `budgets` | Budget Control | Budget records |
| `budget_revisions` | Budget Control | Budget revision history |
| `payroll_register` | Payroll Register | Finance payroll records |
| `gst_returns` | GST Compliance | GST return data |
| `tds_records` | TDS Compliance | TDS deduction/payment data |
| `approval_policies` | Finance Approvals | Approval policy rules |
| `approval_requests` | Finance Approvals | Approval queue |
| `finance_roles` | Finance Access | Finance-specific role layer if needed |
| `finance_permissions` | Finance Access | Finance-specific permission layer if needed |
| `bank_accounts` | Bank Details | Company/client bank account metadata |

### HRMS

| Table | Used By | Purpose |
| --- | --- | --- |
| `employees` | People Operations | Employee records |
| `employee_documents` | Onboarding, files | Employee document links |
| `attendance` | Attendance | Attendance records |
| `leave_requests` | Leave Management | Leave request workflow |
| `payroll_records` | Payroll | HR payroll input/output |
| `exit_requests` | Exit Process | Employee exit workflow |
| `onboarding_cases` | Onboarding | New employee onboarding case |
| `onboarding_steps` | Onboarding | Step progress |
| `training_assignments` | Onboarding | Training tasks |

### Marketing

| Table | Used By | Purpose |
| --- | --- | --- |
| `campaigns` | Growth Marketing | Campaign records |
| `campaign_channels` | Growth Marketing | Channel metadata |
| `campaign_metrics` | ROI | Campaign performance data |
| `lead_sources` | Sources | Acquisition source records |
| `lead_source_metrics` | ROI, Lead Desk | Source performance tracking |

### Support

| Table | Used By | Purpose |
| --- | --- | --- |
| `support_tickets` | Support Desk | Ticket records |
| `ticket_comments` | Support Desk | Ticket discussion/comments |
| `ticket_status_history` | Support Desk | Ticket lifecycle history |
| `ticket_assignments` | Support Desk | Assigned owner/team |

### Notifications

| Table | Used By | Purpose |
| --- | --- | --- |
| `notifications` | Dashboard, all modules | In-app notifications |
| `notification_reads` | Dashboard | Read/unread state per user |
| `communication_jobs` | Email/SMS/WhatsApp | Outgoing communication queue |

## 9. API Module Map

All API URLs must start with:

```text
/api/v1/
```

| Module | Base Endpoint |
| --- | --- |
| Auth | `/api/v1/auth/` |
| Profile | `/api/v1/profile/` |
| Accounts/Admin | `/api/v1/accounts/` |
| Audit | `/api/v1/audit/` |
| Files | `/api/v1/files/` |
| Leads | `/api/v1/leads/` |
| Clients | `/api/v1/clients/` |
| Projects | `/api/v1/projects/` |
| Finance | `/api/v1/finance/` |
| HRMS | `/api/v1/hrms/` |
| Marketing | `/api/v1/marketing/` |
| Support | `/api/v1/support/` |
| Notifications | `/api/v1/notifications/` |

## 10. API Response Format

Success:

```json
{
  "success": true,
  "message": "Operation completed",
  "data": {}
}
```

List:

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

## 11. Backend Build Order

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

## 12. Milestone 1

Milestone 1 should include:

- Django project setup.
- Settings split.
- MySQL connection.
- DRF setup.
- JWT setup.
- Custom user model.
- Roles.
- Permissions.
- User roles.
- Login API.
- Refresh API.
- Logout API.
- Current user API.
- Profile API.
- Login history.
- Standard response helper.
- Basic audit log model.

## 13. Session Resume Checklist

When starting a new backend session:

1. Read this file.
2. Read `PRODUCTION_BACKEND_ARCHITECTURE.md`.
3. Check current backend folder structure.
4. Check whether Django project exists.
5. Check whether migrations exist.
6. Check latest completed milestone.
7. Continue from the next pending milestone.

## 14. Latest Work Log

| Date | Work |
| --- | --- |
| 2026-07-08 | Created production backend architecture document. |
| 2026-07-08 | Created backend continuity document with table usage map and centralized API rule. |
| 2026-07-08 | Created Django project scaffold, foundation apps, settings files, base models, accounts/RBAC models, audit models, file metadata models, health URLs, requirements, and env example. |
| 2026-07-08 | Ran Django system check successfully and generated initial migrations for foundation apps. |
| 2026-07-08 | Added centralized auth/profile API routes for login, refresh, logout, logout-all, current user, profile, and login history. |
| 2026-07-08 | Configured local MySQL environment, created `crmproduct` database, applied migrations, fixed MySQL unique key length warning, and verified health endpoints. |
