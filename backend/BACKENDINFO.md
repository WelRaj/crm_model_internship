# Backend Information

Last updated: 2026-07-10

## 1. Purpose

This file is the backend continuity document.

Whenever work resumes after a break or a new session, read this file first. It should always explain:

- What backend architecture is planned.
- What backend work is completed.
- What is pending.
- What important session decisions or progress notes must be carried forward.
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
- First local admin/user is created.
- Foundation roles and permissions are seeded.
- Login, refresh, logout, current user, profile, and login history APIs are verified locally with the first admin.
- Frontend sign-in now calls the backend login API through the centralized API client and `auth-api` service wrapper.
- Public signup is implemented through `/api/v1/auth/signup/`, saves users to MySQL, creates a profile, assigns the default `employee` role, and writes an audit log.
- Internal CRM user signup now generates employee IDs and assigns roles from the selected department category.
- Dashboard now loads the authenticated backend user, redirects missing/invalid sessions to sign-in, and clears tokens on sign-out.
- Frontend API client now refreshes expired access tokens once on authenticated 401 responses, retries the original request, and clears local tokens if refresh fails.
- Admin User Management APIs are implemented for role listing, user listing, create, detail, update, activate, deactivate, and role assignment.
- Frontend account administration API calls are centralized in `panel/src/services/accounts-api.ts`.
- Admin Control UI now consumes live backend users and roles, supports create/edit/activate/deactivate, and keeps user management actions centralized.
- Admin Role Management APIs now expose permissions, create/update roles, assign permission codes, audit role changes, and drive the Roles & Permissions UI from backend data.
- Audit Log APIs now expose admin-only paginated/searchable audit events and drive the Admin Control System Audit Trail UI from backend data.
- Roles now have persisted active/inactive status, protected system-role safeguards, inactive-role assignment blocking, and live UI status toggles.
- Admin Control `Revoke sessions` is connected end to end: the admin-only backend action revokes all active tracked sessions for the selected user, creates an audit log, and refreshes the live frontend user list.
- Forgot password/reset password OTP flow is implemented end to end from the browser sign-in screen: backend hashed OTP storage, expiry, one-time reset requests, audit logs, session revocation after reset, centralized frontend auth API wrappers, and sign-in UI reset flow.
- Logged-in change password flow is connected from My Profile to backend with current-password verification, password validation, session revocation, audit logging, and centralized frontend auth wrapper.
- My Profile edit flow now saves from dashboard to backend `/profile/me/`, updates current user/profile fields in one transaction, audits the mutation, and reloads persisted values through centralized profile API wrappers.
- CRM app foundation is created with Lead model, migration, admin registration, create/list/search/filter API, duplicate validation, service-layer lead number generation, audit logging, backend tests, and centralized frontend leads API wrapper.
- Lead Desk frontend now loads project/trading leads from backend and saves Project Lead Wizard plus Trading Lead form submissions through centralized `leads-api`.
- Lead Hub now supports backend-driven lead detail, status update, and assignment in a drawer UI with active user selection, transactional save, and audited mutations.
- Current state is stable for auth, profile, admin control, lead intake, lead detail, assignment, and lead follow-ups. Next backend work should connect the broader CRM operational screens such as Lead Assignment and Telecaller Desk to these backend records.
- CRM lead detail/update/assignment APIs are now added for `GET/PUT /api/v1/leads/{id}/` and `POST /api/v1/leads/{id}/assign/` with transactional updates, duplicate checks, audit logs, and frontend API wrappers.
- CRM lead follow-up history is now backend-backed with `LeadFollowUp`, audited create flow, and Lead drawer add/list UI.
- Lead Assignment screen now loads backend leads and active backend users, assigns selected leads through the centralized lead assignment API, and stores assignment notes as lead follow-ups.
- Lead Assignment owner selection now uses a backend active-user dropdown instead of free text, preventing assignments from saving without a valid backend user id.
- Local verification seed data includes 5 active telecaller users (`TEL-VERIFY-001` to `TEL-VERIFY-005`, password `Tele@12345`) and 5 unassigned fresh trading leads (`Trading Verify Lead 01` to `Trading Verify Lead 05`) for assignment testing.
- Lead assignment is now idempotent for the same assignee: repeated clicks with the same `assigned_to_id` do not create extra reassignment audit events or churn the lead state.
- Lead Assignment history is backend-owned: actual assignment changes create a `LeadFollowUp` history row in the backend, and the Lead Assignment history table renders selected-lead backend follow-ups instead of local-only activity state.
- Calling Desk now loads backend assigned leads, groups them by backend assigned user, and saves call logs through centralized lead follow-up APIs instead of seed-only local call state.
- Lead assignment now has backend smart balancing: if the requested telecaller already has 5 active open leads, the lead is assigned to the least-loaded active telecaller instead, with an auto-balance note saved in backend history.
- Follow-ups screen now uses backend `LeadFollowUp` data through the centralized frontend leads API wrapper, including a global `/api/v1/follow-ups/` queue endpoint with basic filters.

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
- Do not create duplicate APIs for the same business action or data need.
- Keep API surface area minimal; create only the endpoints that are actually needed by frontend workflows or backend integrations.
- Prefer extending a correct existing endpoint with safe filters/actions over adding a near-duplicate endpoint.
- Keep backend implementation solid, clean, maintainable, and production-ready.
- Every completed backend flow should be verified so the product runs smoothly with minimal bugs.

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
- API wrappers should not duplicate the same backend call in multiple files.
- Before adding a new endpoint, check whether an existing endpoint already covers the use case cleanly.

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

Internal user signup role mapping:

| Signup Department | Assigned Role | Default Designation |
| --- | --- | --- |
| Client Operations | `telecaller` | Client Operations Executive |
| People Operations | `hr` | HR Executive |
| Finance Control | `finance` | Finance Executive |
| Growth Marketing | `marketing` | Marketing Executive |
| Delivery Projects | `project_manager` | Project Executive |
| Admin Control | `admin` | Admin Executive |

Internal user signup rules:

- Signup is for internal CRM users/employees only.
- Customer/client records must not use auth signup unless a customer portal is intentionally built later.
- New internal users receive an auto-generated employee ID from `core_sequences`.
- Signup creates `users`, `user_profiles`, `user_roles`, and an `audit_logs` entry in one transaction.
- New signup users can immediately sign in with their email/mobile and password.

Implemented Admin User Management APIs:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/accounts/roles/` | List roles |
| `GET` | `/api/v1/accounts/users/` | List users with pagination, search, and active/inactive filter |
| `POST` | `/api/v1/accounts/users/` | Create internal CRM user |
| `GET` | `/api/v1/accounts/users/{id}/` | Get user detail |
| `PUT` | `/api/v1/accounts/users/{id}/` | Update user profile/account fields |
| `POST` | `/api/v1/accounts/users/{id}/activate/` | Activate user |
| `POST` | `/api/v1/accounts/users/{id}/deactivate/` | Deactivate user and revoke active sessions |
| `POST` | `/api/v1/accounts/users/{id}/roles/` | Replace assigned roles |
| `POST` | `/api/v1/accounts/users/{id}/sessions/revoke/` | Revoke all active tracked sessions without deactivating the user |

Implemented Auth Password APIs:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/auth/password/forgot/` | Request password reset OTP |
| `POST` | `/api/v1/auth/password/reset/` | Reset password with OTP |
| `POST` | `/api/v1/auth/password/change/` | Change password while logged in |
| `GET` | `/api/v1/profile/me/` | Load current user's profile |
| `PUT` | `/api/v1/profile/me/` | Update current user's profile/account fields |

Implemented CRM Lead APIs:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/leads/` | List leads with pagination, search, status filter, and type filter |
| `POST` | `/api/v1/leads/` | Create lead with duplicate validation and audit log |
| `GET` | `/api/v1/leads/{id}/` | Fetch a lead detail |
| `PUT` | `/api/v1/leads/{id}/` | Update lead fields and status |
| `POST` | `/api/v1/leads/{id}/assign/` | Assign or reassign lead owner |
| `GET` | `/api/v1/leads/{id}/follow-ups/` | List follow-up notes/history for a lead |
| `POST` | `/api/v1/leads/{id}/follow-ups/` | Add a follow-up note, outcome, channel, and next action time |
| `GET` | `/api/v1/follow-ups/` | List global follow-up queue with due status, lead type, owner, and search filters |

## 13. Session Resume Checklist

When starting a new backend session:

1. Read this file.
2. Read `PRODUCTION_BACKEND_ARCHITECTURE.md`.
3. Check current backend folder structure.
4. Check whether Django project exists.
5. Check whether migrations exist.
6. Check latest completed milestone.
7. Continue from the next pending milestone.

Session continuity rule:

- Important backend decisions, completed work, blockers, and next steps must be saved in this file before ending a work session.
- Do not rely only on chat history for backend continuity.
- Treat this file as the durable backend memory for future sessions.

## 14. Latest Work Log

| Date | Work |
| --- | --- |
| 2026-07-08 | Created production backend architecture document. |
| 2026-07-08 | Created backend continuity document with table usage map and centralized API rule. |
| 2026-07-08 | Created Django project scaffold, foundation apps, settings files, base models, accounts/RBAC models, audit models, file metadata models, health URLs, requirements, and env example. |
| 2026-07-08 | Ran Django system check successfully and generated initial migrations for foundation apps. |
| 2026-07-08 | Added centralized auth/profile API routes for login, refresh, logout, logout-all, current user, profile, and login history. |
| 2026-07-08 | Configured local MySQL environment, created `crmproduct` database, applied migrations, fixed MySQL unique key length warning, and verified health endpoints. |
| 2026-07-09 | Added reusable `seed_foundation` management command, seeded first local admin, default roles, and module permissions. |
| 2026-07-09 | Fixed login history metadata bug and verified auth/profile API flow locally: login, me, profile, login history, refresh, and logout. |
| 2026-07-09 | Connected panel sign-in form to backend `/api/v1/auth/login/` through centralized frontend API wrappers and verified TypeScript, build, and lint. |
| 2026-07-09 | Added backend signup API, connected panel signup form, verified signup saves to MySQL and the new user can sign in. |
| 2026-07-09 | Hardened internal user signup with employee ID generation, department-to-role assignment, backend tests, and multi-role signup/signin smoke verification. |
| 2026-07-09 | Added frontend dashboard auth guard, current-user profile hydration, and sign-out through centralized auth API wrappers. |
| 2026-07-09 | Added centralized frontend access-token refresh handling with single-flight refresh, one retry per request, and verified backend refresh endpoint. |
| 2026-07-09 | Added Admin User Management backend APIs with admin-only permission checks, service-layer mutations, audit logs, tests, local smoke verification, and centralized frontend account API wrappers. |
| 2026-07-09 | Connected Admin Control user management UI to backend users/roles APIs with live loading, create/update, activate/deactivate, pagination, and role assignment. |
| 2026-07-09 | Connected Roles & Permissions to backend role/permission data with role create/update APIs, permission assignment, audit logging, frontend API wrappers, and tests. |
| 2026-07-09 | Added admin-only audit log listing API with search/pagination, connected System Audit Trail UI to live backend audit events, and added audit API tests. |
| 2026-07-09 | Added persisted role active/inactive status with migration, backend validation, assignment safeguards, audited UI toggles, and regression tests. |
| 2026-07-10 | Connected Admin Control session revocation to an admin-only backend service/API, added audit logging and regression coverage, fixed refresh-token blacklisting in logout, and verified 7 accounts tests, Django system check, frontend TypeScript, lint, and production build. |
| 2026-07-10 | Added forgot password and reset password OTP APIs with hashed OTP storage, expiry, one-time use, audit logs, session revocation after password reset, centralized frontend auth wrappers, regression tests, and browser sign-in screen reset flow. |
| 2026-07-10 | Connected My Profile change password to backend current-password verification with audit logging, session revocation, frontend wrapper, and regression test. |
| 2026-07-10 | Connected My Profile edit form to backend profile update API with transactional user/profile updates, audit logging, frontend profile service wrapper, dashboard hydration, and regression test. |
| 2026-07-10 | Created CRM app foundation and lead create/list API with lead number sequence, duplicate checks, audit logging, migration, admin registration, backend tests, and frontend `leads-api` wrapper. |
| 2026-07-10 | Connected Lead Desk frontend to backend lead list/create APIs, applied CRM migration locally, and verified frontend TypeScript/lint plus CRM backend tests. |
| 2026-07-10 | Saved current milestone progress in continuity notes and verified the browser-facing auth/profile/CRM flow state before pushing the latest code. |
| 2026-07-10 | Added CRM lead detail, update, status, and assignment APIs with service-layer transactions, audit logs, regression tests, and centralized frontend lead wrappers. |
| 2026-07-10 | Reworked Lead Hub with backend-driven detail drawer, active-user assignment picker, lead edit/save flow, and clean reload-safe UI state. |
| 2026-07-10 | Fixed Lead Hub View action to display lead numbers while sending backend UUIDs to detail APIs, preventing the View drawer from failing with a generic error. |
| 2026-07-10 | Added backend LeadFollowUp model/API, migration, audit logging, regression test, centralized frontend API wrappers, and Lead drawer follow-up add/history UI. |
| 2026-07-10 | Connected Lead Assignment screen to backend lead/user data and centralized assignment/follow-up APIs with frontend TypeScript, lint, and CRM backend tests passing. |
| 2026-07-10 | Hardened Lead Assignment owner selection by replacing free-text owner entry with backend active-user dropdown after Ravi Rathor assignment showed follow-up saved but no assigned user. |
| 2026-07-10 | Seeded local DB with 5 active telecaller verification employees and 5 fresh unassigned trading leads for easier Lead Assignment testing. |
| 2026-07-10 | Added idempotent assignment guard so repeated assign clicks with the same assignee no longer generate duplicate reassignment events. |
| 2026-07-10 | Reworked Lead Assignment history so assignment changes are persisted as backend follow-up history and the UI reloads/display selected-lead backend history. |
| 2026-07-10 | Connected Calling Desk to backend assigned leads and centralized follow-up APIs, including backend owner switch, assigned queue load, call log save, and selected-lead history reload. |
| 2026-07-10 | Added backend smart assignment balancing so overloaded telecallers are skipped in favor of the least-loaded active telecaller, with regression coverage and history note. |
| 2026-07-10 | Connected Follow-ups screen to backend global follow-up queue and centralized lead follow-up create/list APIs, replacing seed-only follow-up rows. |
| 2026-07-11 | Verified the CRM backend after the latest follow-up and assignment changes: `apps.crm` tests passed and frontend TypeScript passed, with centralized lead/follow-up APIs still as the single integration path. |
