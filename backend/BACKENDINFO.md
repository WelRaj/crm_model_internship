# Backend Information

Last updated: 2026-07-24

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
- Database currently has 72 tables after CRM, Projects, HRMS, Finance, Marketing, Support, and Notifications foundation migrations.
- Support Desk backend is now mounted at `/api/v1/support/` with ticket overview, list/create/update, and comment endpoints backed by `SupportTicket`, comment, status-history, and assignment tables, plus the centralized `support-api.ts` wrapper.
- Notifications backend is now mounted at `/api/v1/notifications/` with `Notification`, `NotificationRead`, and `CommunicationJob` tables plus overview/list/create/detail/read-state/job queue APIs for dashboard and module event alerts.
- Dashboard notification bell now loads live backend notifications through `notifications-api.ts`, and Support Desk ticket create/status-change actions emit notification records so the popup reflects real module events.
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
- Current state is stable for auth, profile, admin control, lead intake, lead detail, assignment, and lead follow-ups. Next backend work should connect the broader CRM operational screens such as Lead Assignment and Calling Desk to these backend records.
- CRM lead detail/update/assignment APIs are now added for `GET/PUT /api/v1/leads/{id}/` and `POST /api/v1/leads/{id}/assign/` with transactional updates, duplicate checks, audit logs, and frontend API wrappers.
- CRM lead follow-up history is now backend-backed with `LeadFollowUp`, audited create flow, and Lead drawer add/list UI.
- Lead Assignment screen now loads backend leads and active HRMS employees, assigns selected leads through the centralized lead assignment API, and stores assignment notes as lead follow-ups.
- Lead Assignment owner selection now uses an active HRMS employee dropdown instead of free text, preventing assignments from saving without a valid backend user id.
- Local verification seed data includes 5 active telecaller users (`TEL-VERIFY-001` to `TEL-VERIFY-005`, password `Tele@12345`) and 5 unassigned fresh trading leads (`Trading Verify Lead 01` to `Trading Verify Lead 05`) for assignment testing.
- Lead assignment is now idempotent for the same assignee: repeated clicks with the same `assigned_to_id` do not create extra reassignment audit events or churn the lead state.
- Lead Assignment history is backend-owned: actual assignment changes create a `LeadFollowUp` history row in the backend, and the Lead Assignment history table renders selected-lead backend follow-ups instead of local-only activity state.
- Calling Desk now loads backend assigned leads, groups them by backend assigned user, and saves call logs through centralized lead follow-up APIs instead of seed-only local call state.
- Lead assignment now has backend smart balancing: if the requested telecaller already has 5 active open leads, the lead is assigned to the least-loaded active telecaller instead, with an auto-balance note saved in backend history.
- Lead assignment employee eligibility is tied to HRMS: Lead Desk owner dropdown, Lead Assignment calling owner dropdown, and smart telecaller balancing use active HRMS employees only; backend rejects archived/exited/non-HRMS users for assignment.
- Follow-ups screen now uses backend `LeadFollowUp` data through the centralized frontend leads API wrapper, including a global `/api/v1/follow-ups/` queue endpoint with basic filters.
- Lead Outcomes now immediately syncs project leads into Project Clients when a completed-follow-up project lead is saved as `won`.
- Client Operations full verification seed data includes 5 trading leads (`LEAD-00014`, `LEAD-00016`, `LEAD-00018`, `LEAD-00020`, `LEAD-00022`) and 5 project leads (`LEAD-00015`, `LEAD-00017`, `LEAD-00019`, `LEAD-00021`, `LEAD-00023`) created through backend services for end-to-end testing.
- Legal Agreements verification data includes 5 project handoffs (`PRJ-COPS-VERIFY-002` to `PRJ-COPS-VERIFY-006`) and 5 active agreements (`AGR-00001` to `AGR-00005`) linked to `ACC-24002` to `ACC-24006`.
- Projects / Delivery Operations backend foundation is started with a dedicated `projects` app, registered in Django settings and API URLs.
- Projects foundation models and local migration are created/applied: `DeliveryProject`, `ProjectTeamAssignment`, `ProjectMilestone`, `ProjectTask`, and `ProjectDeadline`.
- Projects app now supports signed handoff-to-delivery conversion: `POST /api/v1/projects/` creates a delivery project only from an active signed CRM project handoff, blocks duplicate handoff conversion, writes audit logs, and auto-adds the selected project manager as a team assignment.
- Projects detail/update backend flow is started with `GET/PUT /api/v1/projects/{id}/`.
- Projects delivery operations APIs are implemented for team assignment, milestones, tasks, task status updates, and deadlines. Project detail now returns child team/milestone/task/deadline records so frontend can keep the delivery workspace smooth without duplicate API calls.
- Real DB delivery smoke data is attached to `PRJ-00001`: team assignment, milestone, task, task completion update, and deadline were created through backend APIs and verified through project detail.
- Frontend Projects integration is started through centralized `panel/src/services/projects-api.ts`; `ProjectHub` now loads backend delivery projects, renders nested team/milestone/task/deadline records, and saves project updates, team assignments, milestones, task creates, and task updates through the backend wrapper instead of direct component fetch calls.
- Delivery Projects frontend create flow now uses backend project handoff selection: the create modal lists CRM project handoffs, prefills client/project data, and calls `POST /api/v1/projects/`; backend remains responsible for active agreement validation and duplicate handoff blocking.
- Delivery Projects manual deadline create now calls `POST /api/v1/projects/{id}/deadlines/` through centralized `projects-api.ts`; deadline update/delete remains intentionally unimplemented until matching backend endpoints exist.
- Lead-to-delivery verification data includes 10 lead-sourced records (`LEAD-00024` to `LEAD-00033`) flowing through Project Clients (`ACC-24007` to `ACC-24016`), Project Handoffs (`PRJ-LEAD-VERIFY-001` to `PRJ-LEAD-VERIFY-010`), Agreements (`AGR-00006` to `AGR-00015`), and Delivery Projects (`PRJ-00002` to `PRJ-00011`).
- Project Client auto-sync now creates all required contact roles for won project leads: Decision Maker, Technical, Finance, and Daily Coordinator. Existing 10 lead-to-delivery verification clients were backfilled so each role filter has 10 records.

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
| `crm` | Leads, clients, contacts, Follow-ups, Lead Outcomes, agreements |
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
| `lead_followups` | Follow-ups, Calling Desk | Follow-up schedule and notes |
| `lead_proposals` | Lead Wizard, Finance | Proposal values and status |
| `lead_approvals` | Lead Wizard | Approval/decision records |
| `lead_status_history` | Lead Desk, Lead Outcomes | Status movement history |
| `clients` | Client Operations, Finance | Client/company master |
| `client_contacts` | Client Operations | Client-side contacts |
| `client_projects` | Client Operations, Projects | Projects created from won leads/clients |
| `project_contacts` | Client Operations, Projects | Contact mapping per project |
| `project_agreements` | Agreements, files | Agreement records and document links |
| `call_logs` | Calling Desk | Calling activity logs |
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
| `employee_performance_reviews` | Team Performance | Employee performance records |

Projects / Delivery Operations backend plan:

| Phase | Scope | Backend Contract |
| --- | --- | --- |
| 1. Foundation | Convert signed CRM handoffs into delivery projects | `DeliveryProject` linked to `crm.ProjectHandoff` and `crm.ProjectClient`, with project number, manager, status, priority, health, dates, progress, billing/delivery metadata |
| 2. Team | Assign delivery owners and members | `ProjectTeamAssignment` with user, role, allocation, start/end dates, unique project-user-role guard |
| 3. Milestones | Track project phases and payment-ready phases | `ProjectMilestone` with ordered sequence, due date, status, completion timestamp, milestone value |
| 4. Tasks | Track execution work | `ProjectTask` with task number, milestone link, assignee, status, priority, due date, estimated/actual hours |
| 5. Deadlines | Track critical delivery dates | `ProjectDeadline` with severity, status, due date, optional milestone link |
| 6. API/UI | Connect frontend Delivery Projects pages | Centralized frontend `src/services/projects-api.ts`; backend `/api/v1/projects/` endpoints only, no duplicate project APIs |

Canonical Delivery Projects page names:

| Page Name | Backend Domain |
| --- | --- |
| Project Portfolio | Delivery project master records, signed handoff conversion, status, health, progress, owner, and project schedule |
| Team Assignment | Delivery team member assignment, allocation, roles, task ownership, and project manager ownership |
| Tasks | Project task execution, assignee, priority, status, due date, and work-hour tracking |
| Milestones | Project phase tracking, milestone status, due dates, milestone value, and billing readiness |
| Deadlines | Critical project, milestone, task, and manual deadline tracking |
| Team Performance | Delivery team performance review and productivity tracking |

Project Portfolio page action audit:

| UI Action | Expected Response | Verified Status |
| --- | --- | --- |
| Search/filter portfolio | `GET /api/v1/projects/?search=...` returns matching backend delivery projects | Verified with `Lead Delivery Verify`, returned 10 records |
| New Project | Opens signed CRM handoff selector; create calls `POST /api/v1/projects/`; backend validates active agreement and blocks duplicate handoffs | Verified duplicate and missing handoff return 400 |
| Edit | Opens project modal; save calls `PUT /api/v1/projects/{id}/` for name/status/health/progress/dates | Verified on `PRJ-00002` |
| Archive | Calls `PUT /api/v1/projects/{id}/` with backend status `cancelled` | Verified on `PRJ-00002` |
| Restore | Calls `PUT /api/v1/projects/{id}/` with backend status `planning` or active recovery state | Verified and restored `PRJ-00002` to `active/on_track/5` |
| Export | Exports currently filtered frontend rows to CSV only; no backend mutation | Frontend-only, safe action |
| Clear Filters | Clears frontend search/status/health filters only; no backend mutation | Frontend-only, safe action |

Planned Projects APIs:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/projects/` | List delivery projects with search/status filters |
| `POST` | `/api/v1/projects/` | Create delivery project from a signed CRM project handoff |
| `GET` | `/api/v1/projects/{id}/` | Fetch project detail with team, milestones, tasks, and deadlines |
| `PUT` | `/api/v1/projects/{id}/` | Update project metadata/status/progress |
| `POST` | `/api/v1/projects/{id}/team/` | Assign or update project team member |
| `POST` | `/api/v1/projects/{id}/milestones/` | Create project milestone |
| `POST` | `/api/v1/projects/{id}/tasks/` | Create project task |
| `PUT` | `/api/v1/projects/tasks/{id}/` | Update task status/assignee/dates/hours |
| `POST` | `/api/v1/projects/{id}/deadlines/` | Create critical project deadline |

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
| `POST` | `/api/v1/leads/{id}/outcome/` | Save lead outcome after a completed follow-up; validates flow, updates status, writes history/audit |
| `GET` | `/api/v1/follow-ups/` | List global follow-up queue with due status, lead type, owner, and search filters |
| `GET` | `/api/v1/project-clients/` | List backend project clients; missing won project leads are synced into client records |
| `POST` | `/api/v1/project-clients/` | Create a manual/source project client with optional primary contact |
| `POST` | `/api/v1/project-clients/{id}/contacts/` | Add a contact person to a project client |
| `GET` | `/api/v1/project-handoffs/` | List project handoff records for project creation/output |
| `POST` | `/api/v1/project-handoffs/` | Create a project handoff from a backend project client |
| `PUT` | `/api/v1/project-handoffs/{id}/` | Update a project handoff |
| `GET` | `/api/v1/project-agreements/` | List legal/project agreements with client, project handoff, and search filters |
| `POST` | `/api/v1/project-agreements/` | Create a project agreement linked to backend project handoff/client |
| `PUT` | `/api/v1/project-agreements/{id}/` | Update a project agreement |

Canonical Client Operations page names:

| Page Name | Backend Domain |
| --- | --- |
| Lead Desk | Lead intake and lead register |
| Lead Assignment | Lead owner assignment and assignment history |
| Calling Desk | Assigned lead calling workflow |
| Follow-ups | Follow-up queue and follow-up completion |
| Lead Outcomes | Completed follow-up decisions and won/lost outcomes |
| Project Clients | Won project client records, contacts, and project handoffs |
| Legal Agreements | Project agreement drafting and signing workflow |

Client Operations employee source rule:

| Area | Rule |
| --- | --- |
| Lead Desk owner selection | Loads users from `panel/src/services/hrms-api.ts` with `status=active`; no direct generic user API call in the component |
| Lead Assignment calling owner | Loads users from `panel/src/services/hrms-api.ts` with `status=active`; selected owner must be a valid backend user linked to an active HRMS profile |
| Calling Desk owner queue | Loads active HRMS employees through `panel/src/services/hrms-api.ts` and shows only assigned leads whose owner is still an active HRMS employee |
| Follow-ups queue | Loads follow-up records through `leads-api.ts`, loads active HRMS employees through `hrms-api.ts`, and shows only follow-ups whose lead owner is still an active HRMS employee |
| Lead Outcomes queue | Loads completed follow-up records through `leads-api.ts`, loads active HRMS employees through `hrms-api.ts`, and shows only outcome decisions whose lead owner is still an active HRMS employee |
| Project Clients | Loads won project client/contact/handoff records through centralized `leads-api.ts`; client contacts are external client people, while delivery employee assignment continues in Delivery Projects through active HRMS employee selectors |
| Legal Agreements | Loads backend project handoffs and agreements through centralized `leads-api.ts`; active agreements require signed attachment names, update client agreement status to signed, and duplicate agreements for the same project handoff are blocked |
| Backend lead assignment | `POST /api/v1/leads/{id}/assign/` rejects archived, exited, on-notice, inactive, or non-HRMS users |
| Smart telecaller balancing | Least-loaded telecaller selection only considers active users with telecaller role and active HRMS profile |

Implemented Projects / Delivery Operations APIs:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/projects/` | List delivery projects with search and status filters |
| `POST` | `/api/v1/projects/` | Create a delivery project from an active signed CRM project handoff |
| `GET` | `/api/v1/projects/{id}/` | Fetch delivery project detail |
| `PUT` | `/api/v1/projects/{id}/` | Update delivery project status, manager, dates, health, and progress |
| `POST` | `/api/v1/projects/{id}/team/` | Assign or update a project team member |
| `DELETE` | `/api/v1/projects/team/{id}/` | Soft-remove a project team assignment with audit log |
| `POST` | `/api/v1/projects/{id}/milestones/` | Create a project milestone |
| `PUT` | `/api/v1/projects/milestones/{id}/` | Update project milestone status, due date, amount, sequence, and completion timestamp |
| `POST` | `/api/v1/projects/{id}/tasks/` | Create a project task |
| `PUT` | `/api/v1/projects/tasks/{id}/` | Update project task status, assignee, due date, priority, and hours |
| `DELETE` | `/api/v1/projects/tasks/{id}/` | Soft-remove a project task with audit log |
| `POST` | `/api/v1/projects/{id}/deadlines/` | Create a critical project deadline |
| `PUT` | `/api/v1/projects/deadlines/{id}/` | Update project deadline title, date, severity, status, and notes |
| `GET` | `/api/v1/projects/performance-reviews/` | List employee performance reviews with search, department, status, and cycle filters |
| `POST` | `/api/v1/projects/performance-reviews/` | Create an employee performance review linked to an active HRMS employee |
| `PUT` | `/api/v1/projects/performance-reviews/{id}/` | Update review stage, scores, status, manager notes, career signals, and archive/restore state |

Canonical Delivery Projects page names:

| Page Name | Backend Domain |
| --- | --- |
| Project Portfolio | Delivery project register and project lifecycle |
| Team Assignment | Team lead, employee assignment, task ownership, and allocation tracking |
| Tasks | Project task register and task execution |
| Milestones | Delivery milestone and billing readiness tracking |
| Deadlines | Delivery deadline, risk, and escalation tracking |
| Team Performance | Delivery performance review and metrics |

Team Assignment page action audit:

| Action | Backend Status |
| --- | --- |
| Search/filter assignments | Frontend filters backend-loaded delivery projects, team assignments, and tasks |
| Export | Exports currently filtered backend-loaded rows to CSV |
| Clear Filters | Resets local filters only; no backend mutation needed |
| Assign Member | Uses backend active users and calls centralized `assignProjectTeamMember` plus `createProjectTask` |
| Edit assignment row | Upserts the same backend assignment; repeated saves update the same record instead of duplicating |
| Done/task update | Calls centralized `updateProjectTask` and persists completion/status |
| Remove assignment row | Calls `DELETE /api/v1/projects/team/{id}/` and soft-deletes with audit |
| Remove task row | Calls `DELETE /api/v1/projects/tasks/{id}/` and soft-deletes with audit |
| Set Team Leader | Updates delivery project manager and saves a `team_lead` assignment through backend APIs |
| HRMS active employee guard | Team leader, assign member, and task owner choices come from active HRMS employees only; backend rejects archived/exited/non-HRMS users for project manager, team assignment, and task assignee APIs |

Tasks page action audit:

| Action | Backend Status |
| --- | --- |
| Search/filter tasks | Frontend filters backend-loaded task rows only; team assignment rows are excluded |
| Export | Exports currently filtered backend task rows to CSV |
| Clear Filters | Resets local filters only; no backend mutation needed |
| New Task | Calls centralized `createProjectTask`; no team assignment side effect is created from the Tasks page |
| Edit task | Calls centralized `updateProjectTask` and persists title, description, status, priority, assignee, and due date |
| Done | Calls centralized `updateProjectTask` with `done`; backend writes `completed_at` |
| Remove | Calls `DELETE /api/v1/projects/tasks/{id}/`; task is soft-deleted, audit logged, and removed from project detail output |
| Metrics | Active, completed, critical, and overdue counts are calculated from backend task rows only |

Milestones page action audit:

| Action | Backend Status |
| --- | --- |
| Search/filter milestones | Frontend filters backend-loaded milestones by project, status, billing event, and search text |
| Export | Exports currently filtered backend milestone rows to CSV |
| Clear Filters | Resets local filters only; no backend mutation needed |
| New Milestone | Calls centralized `createProjectMilestone` and persists milestone value, sequence, status, due date, and description |
| Edit milestone | Calls centralized `updateProjectMilestone` and persists title, description, status, sequence, due date, and amount |
| Complete | Calls centralized `updateProjectMilestone` with `completed`; backend writes `completed_at`; local billing-event draft is queued only for visible workflow handoff |
| Archive/Restore | Calls centralized `updateProjectMilestone`; archive maps to backend `blocked`, restore maps to backend `planned` |
| Metrics | Active, completed, ready billing, overdue, and queue counts are calculated from backend milestone rows and current date |

Deadlines page action audit:

| Action | Backend Status |
| --- | --- |
| Search/filter deadlines | Frontend filters backend-loaded project, milestone, task, and manual deadline rows |
| Export | Exports currently filtered deadline rows to CSV |
| Clear Filters | Resets local filters only; no backend mutation needed |
| New Deadline | Calls centralized `createProjectDeadline` and persists manual deadline title, due date, severity, status, and notes |
| Edit manual deadline | Calls centralized `updateProjectDeadline` and persists changed title, owner/notes, due date, priority/severity, and status |
| Resolve | Calls centralized `updateProjectDeadline` with backend status `met` |
| Archive/Restore | Calls centralized `updateProjectDeadline`; archive maps to `extended`, restore maps to `open` |
| Linked project/milestone/task deadlines | Displayed as derived read-only rows; source changes happen through their owning project, milestone, or task page |
| Metrics | Active, overdue, critical, and next-seven-days counts use backend-loaded rows and current date |

Team Performance page action audit:

| Action | Backend Status |
| --- | --- |
| Load performance directory | Calls centralized `listEmployeePerformanceReviews` and renders backend records only |
| Search/filter reviews | Frontend filters backend-loaded reviews by employee, department, status, and review cycle |
| Export | Exports currently filtered backend review rows to CSV |
| Clear Filters | Resets local filters only; no backend mutation needed |
| New Review | Uses backend active users and calls centralized `createEmployeePerformanceReview` |
| Edit Review | Calls centralized `updateEmployeePerformanceReview` and persists scores, stage, notes, dates, feedback, OKRs, and career signals |
| Archive/Restore | Calls centralized `updateEmployeePerformanceReview`; archive maps to backend `archived`, restore maps to `meets_expectations` |
| View Drawer | Displays the selected backend-loaded review detail without mutation |
| Metrics | Active reviews, top performers, average rating, coaching needs, and promotion-ready counts use backend-loaded records |
| HRMS active employee guard | Employee and manager dropdowns use active HRMS employees only; backend rejects archived/exited/non-HRMS users for performance review employee and manager APIs |

## 12.2 HRMS / People Operations Backend Status

Canonical HRMS page names:

- Employee Directory
- Employee Onboarding
- Attendance
- Leave Management
- Payroll
- Exit Process

Implemented backend app:

- `apps.hrms`

Frontend integration rule:

- All HRMS frontend calls must go through `panel/src/services/hrms-api.ts`.
- `HRMSHub.tsx` must not call fetch or backend endpoints directly.
- `OnboardingWizard.tsx` must use `panel/src/services/hrms-api.ts` for Employee Directory handoff and final onboarding status sync.
- Employee Onboarding must use one combined searchable employee picker: typing filters the backend employee queue and the dropdown result list selects the employee.
- Backend is the source of truth; mock/local seed state is not the persistence layer.

HRMS API endpoints:

| Page | Endpoint |
| --- | --- |
| Employee Directory | `/api/v1/hrms/employees/` |
| Employee Onboarding Queue/Completion | `/api/v1/hrms/employees/`, `/api/v1/hrms/employees/{employee_id}/` |
| Employee Detail/Edit/Archive | `/api/v1/hrms/employees/{employee_id}/` |
| Attendance | `/api/v1/hrms/attendance/` |
| Attendance Update | `/api/v1/hrms/attendance/{attendance_id}/` |
| Attendance Approve/Reject | `/api/v1/hrms/attendance/{attendance_id}/action/` |
| Leave Management | `/api/v1/hrms/leaves/` |
| Leave Approve/Reject/Cancel | `/api/v1/hrms/leaves/{leave_id}/action/` |
| Payroll | `/api/v1/hrms/payroll-records/` |
| Payroll Hold/Recheck/Release/Advance | `/api/v1/hrms/payroll-records/{payroll_id}/action/` |
| Exit Process | `/api/v1/hrms/exits/` |
| Exit Checklist/Handover Update | `/api/v1/hrms/exits/{exit_id}/` |
| Exit Cancel/Complete | `/api/v1/hrms/exits/{exit_id}/action/` |

HRMS backend rules:

- Employee Directory reuses `accounts.User` and `accounts.UserProfile` for identity/profile data; HRMS-specific fields are stored in `employees`.
- Employee Directory employee IDs are auto-generated as `EMP-YYYY-###`; frontend shows the generated ID as read-only and backend also generates the next ID when API payload omits it.
- Employee ID, email, and mobile duplicates are blocked.
- Attendance duplicate employee/date records are blocked at service and database level.
- Payroll duplicate employee/month records are blocked at service and database level.
- Leave overlap is blocked unless existing request is rejected/cancelled.
- Leave approval moves Manager Review -> HR Review -> Approved.
- HR-approved leave syncs attendance rows automatically.
- Payroll is HR readiness only: attendance/leave blockers, LOP days, hold/recheck/release/staged approval.
- Finance payout remains outside HRMS and should be handled by Accounting payroll.
- Exit Process blocks duplicate active exits, locks completed/cancelled exits, and updates employee status to On Notice, Active, or Exited.

HRMS verification completed:

| Check | Result |
| --- | --- |
| Django system check | Passed |
| `apps.hrms` regression tests | Passed, 5 tests |
| Frontend TypeScript | Passed |
| Frontend lint/build | Passed |
| MySQL unsupported conditional unique warning | Fixed by normal unique constraints |

HRMS button/API verification:

| Page | Buttons/Controls Verified |
| --- | --- |
| Employee Directory | Add Employee, Edit, View, Offboard, Archive, Export, Clear Filters |
| Attendance | Regularize, Update Regularization, Approve, Reject, Export, Clear Filters |
| Leave Management | Apply Leave, Manager Approve, HR Approve, Reject, Cancel, Export, Clear Filters |
| Payroll | New Payroll, HR Approve, Finance Approve, Mark Paid, Hold, Recheck, Release, Export, Clear Filters |
| Exit Process | Start Exit, asset recovery toggles, access revoke toggle, department clearance toggles, handover slider, Cancel Exit, Complete Exit, Export, Clear Filters |

HRMS page-by-page verification progress:

| Page | Status | Notes |
| --- | --- | --- |
| Employee Directory | Verified | Add, Save, Update, View, Edit, Offboard, Archive, Export, Clear Filters, search/status filter, close/cancel checked; targeted API test includes create/edit/archive/offboard/list and passes. |
| Employee Onboarding | Connected | Loads employees created in Employee Directory through centralized HRMS API, pre-fills the onboarding wizard, and final submit updates the selected backend employee to active/KYC complete. |
| Attendance | Verified | Regularize, Update Regularization, Approve, Reject, Export, Clear Filters, search/status filter, close/cancel checked; readable employee code fixed for search/export; approved/auto-approved rows cannot be rejected from UI/API; targeted API test passes. |
| Leave Management | Verified | Apply Leave, Save, Manager Approve, HR Approve, Reject, Cancel, Export, Clear Filters, search/status filter, close/cancel checked; readable employee code fixed for search/export; targeted API test covers approve/reject/cancel and passes. |
| Payroll | Verified | New Payroll, Save, HR Approve, Finance Approve, Mark Paid, Hold, Recheck, Release, Export, Clear Filters, search/status filter, close/cancel checked; readable employee code fixed for search/export; backend blocks repeated hold/paid hold; targeted API test passes. |
| Exit Process | Verified | Start Exit, Save, asset/access toggles, manager/HR/finance/IT clearance toggles, handover slider, Cancel Exit, Complete Exit, Export, Clear Filters, search/status filter, close/cancel checked; readable employee code fixed for search/export; targeted API test passes. |

HRMS local DB process verification:

| Item | Count / Result |
| --- | --- |
| Old HRMS table data before fresh run | 0 employees, 0 attendance, 0 leaves, 0 payroll, 0 exits |
| Fresh verification employees | 20 (`HRMS-VERIFY-001` to `HRMS-VERIFY-020`) |
| Attendance records | 28 total: 20 direct attendance + 8 approved-leave synced attendance rows |
| Attendance status mix | 20 approved, 4 rejected, 4 pending |
| Leave records | 20 total: 8 approved, 4 rejected, 4 cancelled, 4 manager review |
| Payroll records | 20 total: 4 paid, 4 approved, 4 finance review, 8 hold |
| Exit records | 5 total: 2 completed, 1 cancelled, 2 clearance |
| Employee lifecycle result | 2 exited, 2 on notice, 16 active |
| Verification commands | Django check passed; `apps.hrms` tests passed |

HRMS manual browser verification:

| Item | Result |
| --- | --- |
| Browser surface used | Headless Chrome remote-debug session against `http://localhost:3000/dashboard` |
| Auth | Admin JWT injected into dashboard localStorage for verification only |
| Employee Directory | Passed: 20 employees visible, View modal, Edit form, Export, Clear Filters checked |
| Attendance | Passed: records visible, Regularize form, Approve/Reject buttons, Export checked |
| Leave Management | Passed: records visible, Apply Leave form, approval/reject/cancel buttons, Export checked |
| Payroll | Passed: records visible, New Payroll form, payroll action buttons, Export checked |
| Exit Process | Passed: records visible, Start Exit form, asset/access controls, clearance controls, handover, cancel/complete controls, Export checked |
| Screenshot artifact | `D:\crmproduct\hrms-browser-verification-final.png` |

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
| 2026-07-12 | Added backend Project Client, Client Contact, and Project Handoff models/APIs; connected Project Clients UI through centralized lead API wrappers; won project leads now sync into backend project client records; applied local migration and verified CRM tests, TypeScript, and lint. |
| 2026-07-12 | Connected Lead Outcomes screen to confirmed Follow-ups only: rows now come from backend follow-up records with `done` outcome, then outcome saves update lead status and persist an outcome note; project leads marked `won` continue into Project Clients. |
| 2026-07-12 | Hardened Lead Outcomes with backend flow validation: outcome save now requires a completed follow-up, uses a dedicated `/leads/{id}/outcome/` endpoint, avoids duplicate same-status history, audits the closure, and is covered by regression tests. |
| 2026-07-12 | Added backend Project Agreement model/APIs with project handoff linkage, duplicate agreement guard, active-agreement signed-client update, audit logs, regression tests, local migration, and connected Legal Agreements frontend through centralized wrappers. |
| 2026-07-12 | Verified lead/client-operation pages for backend source-of-truth: removed old localStorage/seed-data bridges from Lead Desk, Lead Assignment, Calling Desk, Project Clients, Lead Outcomes, and Legal Agreements; frontend TypeScript/lint and CRM backend tests passed. |
| 2026-07-12 | Standardized canonical Client Operations page names across frontend/backend documentation: Lead Desk, Lead Assignment, Calling Desk, Follow-ups, Lead Outcomes, Project Clients, and Legal Agreements. |
| 2026-07-12 | Fixed Lead Outcomes to create Project Clients immediately when a project lead is saved as `won`; verified `LEAD-00013` synced to `ACC-24001` and added regression coverage. |
| 2026-07-12 | Ran Client Operations end-to-end verification from starting flow with 5 trading and 5 project leads: created leads, assigned owners, saved done follow-ups, saved outcomes, and verified all 5 project leads synced into Project Clients (`ACC-24002` to `ACC-24006`). |
| 2026-07-12 | Completed Legal Agreements verification for the same 5 project clients: created project handoffs, active signed agreements, verified `/api/v1/project-agreements/` returns all 5 records, and reran backend CRM tests plus frontend TypeScript/lint. |
| 2026-07-13 | Read backend continuity and architecture docs, planned Projects / Delivery Operations backend, created and registered the `projects` app, added delivery project/team/milestone/task/deadline models, generated/applied `projects.0001_initial`, and verified system check plus projects model test. |
| 2026-07-13 | Added signed handoff-to-delivery project backend flow with `POST /api/v1/projects/`, `GET/PUT /api/v1/projects/{id}/`, active agreement validation, duplicate handoff guard, project manager team auto-assignment, audit logs, and regression coverage. |
| 2026-07-13 | Added Projects delivery operations APIs for team assignment, milestones, tasks, task updates, and deadlines with service-layer mutations, validation, audit logs, nested project detail output, regression tests, and real DB smoke verification on `PRJ-00001`. |
| 2026-07-13 | Connected Delivery Projects frontend to backend through centralized `projects-api.ts`; ProjectHub now loads backend projects and routes project updates, team assignment, milestone creation, task creation, and task updates through backend APIs; frontend TypeScript/lint and backend projects/CRM tests passed. |
| 2026-07-13 | Connected Delivery Projects create modal to backend signed handoff flow and wired manual deadline creation to backend deadline API; frontend TypeScript/lint and backend projects/CRM tests passed. |
| 2026-07-13 | Verified 10 lead-sourced records end to end from Lead -> Won Outcome -> Project Client -> Handoff -> Active Agreement -> Delivery Project; `/api/v1/projects/?search=Lead Delivery Verify` returned all 10 records and frontend/backend checks passed. |
| 2026-07-13 | Fixed Project Clients contact role filters by creating default Technical, Finance, and Daily Coordinator contacts during won lead sync; backfilled the 10 lead-to-delivery verification clients and verified role counts plus regression tests. |
| 2026-07-13 | Standardized canonical Delivery Projects page names and completed Project Portfolio page action audit: search/filter, new project validation, edit, archive, restore, export, and clear filters were checked; backend/frontend regression passed. |
| 2026-07-13 | Completed Team Assignment page audit: active backend user dropdowns, duplicate-safe assignment upsert, backend team leader save, assignment/task update, soft-remove APIs for team assignments and tasks, audit logs, live DB smoke verification, projects/CRM tests, TypeScript, lint, and Django check passed. |
| 2026-07-13 | Completed Tasks page audit: task list now shows backend task records only, New Task creates a task without assignment side effects, owner dropdown uses backend active users, edit/done/remove are centralized backend API calls, overdue metrics use current date, live DB smoke passed, and frontend TypeScript/lint plus backend tests passed. |
| 2026-07-13 | Completed Milestones page audit: added milestone update backend endpoint, connected edit/complete/archive/restore to centralized frontend API, completion now persists `completed_at`, archive/restore maps cleanly to backend status, overdue metrics use current date, live DB smoke passed, and frontend/backend regression passed. |
| 2026-07-13 | Completed Deadlines page audit: added deadline update backend endpoint, mapped backend manual deadlines into the UI, connected edit/resolve/archive/restore through centralized frontend API, kept linked project/milestone/task deadlines read-only, fixed metrics to use current date, live DB smoke passed, and frontend/backend regression passed. |
| 2026-07-13 | Completed Team Performance page audit: added employee performance review model/migration/API, connected frontend review list/create/edit/archive/restore through centralized project API wrappers, linked reviews to backend active users, applied local migration, live DB smoke passed, and frontend/backend regression passed. |
| 2026-07-13 | Fixed Delivery Projects source consistency: removed old local handoff/localStorage merge from ProjectHub so Project Portfolio and Team Assignment both render the same backend delivery-project source of truth only. |
| 2026-07-13 | Implemented HRMS / People Operations backend app with Employee Directory, Attendance, Leave Management, HR payroll readiness, and Exit Process APIs; connected `HRMSHub.tsx` through centralized `hrms-api.ts`; added service-layer workflow rules, migration, admin registration, and 5 regression tests; applied local HRMS migration; verified Django check, HRMS tests, frontend TypeScript, lint, and production build. |
| 2026-07-14 | Completed HRMS button-by-button backend verification: added Employee Directory Archive action, removed insecure default HRMS employee password, added API flow tests for Employee, Attendance, Leave, Payroll, and Exit visible actions; HRMS tests now cover 10 cases and pass along with Django check, frontend TypeScript, lint, and production build. |
| 2026-07-14 | Completed HRMS page-by-page verification for Employee Directory, Attendance, Leave Management, Payroll, and Exit Process; fixed readable employee code search/export across Attendance, Leave, Payroll, and Exit; tightened Attendance/Payroll invalid action guards; full HRMS tests, frontend TypeScript, lint, and production build passed. |
| 2026-07-14 | Cleaned local HRMS verification tables, created 20 fresh HRMS verification employees, ran them through attendance, leave, payroll, and exit flows, and confirmed expected counts/statuses in the local database; Django check and full HRMS tests passed after the data run. |
| 2026-07-14 | Completed manual browser verification of HRMS pages with the 20 fresh employees using headless Chrome: Employee Directory, Attendance, Leave Management, Payroll, and Exit Process all rendered backend data and visible controls/forms correctly; saved screenshot artifact `hrms-browser-verification-final.png`. |
| 2026-07-14 | Fixed HRMS Employee Directory -> Employee Onboarding gap: Onboarding now loads backend employees through centralized `hrms-api.ts`, pre-fills selected employee details, and final submit syncs the selected employee back to Employee Directory as active/KYC complete; frontend TypeScript, lint, and production build passed. |
| 2026-07-14 | Changed HRMS Employee Directory employee ID handling to automatic generation: frontend Add Employee now pre-fills a read-only `EMP-YYYY-###` ID and backend creates the next ID if API payload omits employee_id; Django check, HRMS tests, frontend TypeScript, lint, and production build passed. |
| 2026-07-14 | Reworked Employee Onboarding employee selection into one combined searchable picker over the backend employee queue; typing filters by employee ID, name, role, team, email, mobile, and KYC status, and the same dropdown result list selects the employee; frontend TypeScript, lint, and production build passed. |
| 2026-07-14 | Re-verified HRMS pages after onboarding picker and auto employee ID updates: Django check, HRMS tests, frontend TypeScript, lint, production build, dashboard HTTP check, and headless Chrome smoke passed for Employee Onboarding combined picker, Employee Directory Add Employee auto/read-only ID, Attendance, Leave Management, Payroll, and Exit Process. |
| 2026-07-15 | Connected Delivery Team Assignment eligibility to HRMS active employee status: ProjectHub now loads active HRMS employees for project manager/team/task dropdowns, and backend project manager/team assignment/task assignee serializers reject archived, exited, or non-HRMS users; added projects regression coverage and verified Django check, projects tests, HRMS tests, frontend TypeScript, lint, and production build. |
| 2026-07-15 | Connected Delivery Team Performance review eligibility to HRMS active employee status: EmployeePerformance now loads active HRMS employees for employee/manager dropdowns, and backend performance review serializers reject archived, exited, or non-HRMS users; added projects regression coverage and verified Django check, projects tests, HRMS tests, frontend TypeScript, lint, and production build. |
| 2026-07-15 | Manually verified Delivery Projects HRMS active-employee eligibility in headless Chrome: opened Delivery Projects, Team Assignment, and Team Performance; confirmed active HRMS employees appear in dropdowns and exited HRMS employees (`HRMS-VERIFY-001`, `HRMS-VERIFY-002`) are hidden from Team Assignment and Performance Review selects. |
| 2026-07-15 | Connected Client Operations employee eligibility to HRMS active employee status: Lead Desk and Lead Assignment now load owner options from centralized `hrms-api.ts` with `status=active`, and backend lead assignment plus smart telecaller balancing reject archived/exited/non-HRMS users; added CRM regression coverage and verified Django check plus frontend TypeScript. |
| 2026-07-15 | Verified cross-module employee source rule against local backend data: `/api/v1/hrms/employees/?status=active` returned 16 active employees only from the 20 HRMS verification employees, while exited/on-notice samples (`HRMS-VERIFY-001`, `HRMS-VERIFY-002`, `HRMS-VERIFY-004`, `HRMS-VERIFY-005`) were rejected by Lead Assignment, Delivery Team Assignment, and Team Performance APIs with HTTP 400. |
| 2026-07-15 | Completed Calling Desk page verification/fix: `TelecallerDesk.tsx` now loads active HRMS employees through centralized `hrms-api.ts`, filters the calling queue to active HRMS owners only, hides old non-HRMS assignments, and call-log create/history APIs were verified on `LEAD-00019` assigned to `HRMS-VERIFY-003` (`POST follow-up` 201, history 200). |
| 2026-07-15 | Completed Follow-ups page verification/fix: `FollowUps.tsx` now combines centralized `leads-api.ts` follow-up queue data with active HRMS employees from `hrms-api.ts`, hides follow-ups for old non-active/non-HRMS owners, and quick-log completion was verified on `LEAD-00019` (`POST follow-up` 201, done queue visible for Lead Outcomes). |
| 2026-07-15 | Completed Lead Outcomes page verification/fix: `LeadOutcomes.tsx` now combines completed follow-ups from centralized `leads-api.ts` with active HRMS employees from `hrms-api.ts`, hides outcome decisions for old non-active/non-HRMS owners, and verified project lead `LEAD-00019` outcome save as won (`POST outcome` 200) with Project Client sync remaining idempotent (`1 -> 1`, repeat `1`). |
| 2026-07-15 | Completed Project Clients page verification/fix: `ClientsContacts.tsx` already used centralized `leads-api.ts` only; verified project client sync idempotency (`16 -> 16`), contact add (`POST contact` 201), role counts, and project handoff create (`POST handoff` 201). Added backend guard so repeated active handoff creation for the same client is blocked (`POST duplicate handoff` 400, handoff count unchanged) while existing handoff updates remain allowed. |
| 2026-07-15 | Completed Legal Agreements page verification: `ProjectAgreement.tsx` uses centralized `leads-api.ts` only; verified backend agreement list/search, invalid expiry-date rejection, active-without-PDF rejection, agreement create (`POST` 201), duplicate same-handoff block (`POST` 400), update existing agreement (`PUT` 200), and client agreement status syncing to signed. |
| 2026-07-15 | Completed Delivery Projects / Project Portfolio verification: `ProjectHub.tsx` loads delivery projects through centralized `projects-api.ts`, active HRMS managers through `hrms-api.ts`, and signed handoffs through `leads-api.ts`; verified create from active signed handoff (`POST projects` 201), duplicate handoff block (`POST` 400), archived/non-active manager rejection (`PUT` 400), edit (`PUT` 200), archive (`PUT` cancelled 200), restore (`PUT` planning 200), and search (`GET` 200). |
| 2026-07-15 | Completed Delivery Projects / Team Assignment verification: Team Assignment uses active HRMS employees loaded through `hrms-api.ts` and centralized `projects-api.ts` only; verified assignment create (`POST team` 201), duplicate-safe assignment update/upsert (count stayed `1`), archived/non-active employee rejection (`POST team` 400), set team leader (`PUT project` 200 + `POST team_lead` 201), task create from assignment (`POST task` 201), done/update (`PUT task` 200), assignment remove (`DELETE team` 200), and task remove (`DELETE task` 200). |
| 2026-07-15 | Completed Delivery Projects / Tasks verification: Tasks page renders backend `ProjectTask` records only, uses active HRMS owner choices from `hrms-api.ts`, and routes create/edit/done/remove through centralized `projects-api.ts`; verified task create (`POST task` 201), no team-assignment side effect (assignment count unchanged), archived/non-active owner rejection (`POST task` 400), edit (`PUT task` 200), done (`PUT task` 200), delete (`DELETE task` 200), and deleted task hidden from project detail output. |
| 2026-07-15 | Completed Delivery Projects / Milestones verification: Milestones page renders backend `ProjectMilestone` records from Delivery Project detail and routes create/edit/complete/archive/restore through centralized `projects-api.ts`; verified milestone create (`POST milestone` 201), duplicate sequence guard (`POST milestone` 400), edit (`PUT milestone` 200), complete (`PUT milestone` 200 with `completed_at` set), archive (`PUT milestone` blocked 200), restore (`PUT milestone` planned 200), and project detail visibility after restore. |
| 2026-07-15 | Completed Delivery Projects / Deadlines verification: Deadlines page merges backend manual deadlines with linked project/milestone/task deadlines, keeps linked records read-only, and routes manual deadline create/edit/resolve/archive/restore through centralized `projects-api.ts`; verified deadline create (`POST deadline` 201), invalid milestone guard (`POST deadline` 400), edit (`PUT deadline` 200), resolve (`PUT deadline` met 200), archive (`PUT deadline` missed 200), restore (`PUT deadline` open 200), and project detail visibility after restore. |
| 2026-07-15 | Completed Delivery Projects / Team Performance verification: Team Performance is served by `EmployeePerformance.tsx`, loads review records through centralized `projects-api.ts`, loads employee/manager choices from active HRMS employees through `hrms-api.ts`, and routes create/edit/archive/restore through centralized performance review APIs; verified review create (`POST performance-reviews` 201), duplicate employee-cycle guard (`POST` 400), inactive/non-active HRMS employee rejection (`POST` 400), edit (`PUT` 200), archive (`PUT` archived 200), restore (`PUT` meets_expectations 200), and search visibility after restore. |
| 2026-07-15 | Completed HRMS / People Operations cross verification: confirmed HRMS pages use centralized `hrms-api.ts` wrappers (no direct HRMS fetch/localStorage path in `HRMSHub.tsx`), created a fresh employee with automatic employee ID (`POST employees` 201), updated KYC/health (`PUT employee` 200), verified active search visibility, attendance create/edit/approve plus duplicate-date guard (`201/200/200/400`), leave create and manager/HR approval (`201/200/200`), payroll create/recheck/approval progression (`201/200/200/200/200`), exit create/checklist/complete (`201/200/200`), and exited employee search visibility after completion. |
| 2026-07-15 | Implemented Finance Control production backend foundation: added `apps.finance` with indexed large-data tables for Finance Clients, Vendors, Bank Accounts, Quotations, Invoices, Payments, Payment Allocations, Reminders, Credit Notes, Ledger Entries, Expenses, Budgets/Revisions, Payroll Register, GST, TDS, Approval Policies/Requests, and Finance Access Policies; registered `/api/v1/finance/` APIs, centralized `finance-api.ts`, local migration `finance.0001_initial`, service-layer totals/payment allocation logic, audit logging, Project Client -> Finance Client sync, duplicate invoice/payment guards, Finance Overview backend aggregates, and regression tests. Verified `manage.py check`, `apps.finance` tests, CRM/projects regression, frontend TypeScript, frontend lint, and applied the local finance migration. |
| 2026-07-15 | Connected Finance Control / Client Master frontend to backend: `Step1Clients.tsx` now loads Finance Client records through centralized `finance-api.ts`, maps backend statuses/payment terms/credit fields into the existing UI, and routes create/edit/archive/restore through `/api/v1/finance/clients/`; verified backend client create (`POST` 201), status update/restore (`PUT` 200/200), search visibility, frontend TypeScript, frontend lint, and finance backend tests. |
| 2026-07-15 | Connected Finance Control / Vendor Master frontend to backend: `Step2Vendors.tsx` now loads Vendor records through centralized `finance-api.ts`, maps backend vendor status/payment terms into the existing category/TDS/monthly/bank UI shape, and routes create/edit/archive/restore through `/api/v1/finance/vendors/`; verified backend vendor create (`POST` 201), status update/restore (`PUT` 200/200), search visibility, frontend TypeScript, frontend lint, and finance backend tests. |
| 2026-07-15 | Connected Finance Control / Quotations frontend to backend: `Step3Quotations.tsx` now loads Finance Clients, Delivery Projects, Bank Accounts, and Quotations through centralized API wrappers, removes dummy quotation/project/localStorage data, and routes create draft, submit for approval, edit, approve, send, client accepted, archive, and restore through `/api/v1/finance/quotations/`. Added quotation detail update API, filtered active quotation items, resolved optional project/agreement links server-side, and verified create/update/status smoke (`201/200/200`), frontend TypeScript, frontend lint, and finance backend tests. |
| 2026-07-22 | Connected Finance Control / Invoices frontend to backend: `Step4Invoices.tsx` now loads Finance Clients, Delivery Projects, accepted Quotations, Bank Accounts, and Invoices through centralized API wrappers, removes dummy invoice/project/localStorage data, and routes create draft, submit for approval, edit, approve, send, archive, and restore through `/api/v1/finance/invoices/`. Added invoice detail update API, filtered active invoice items, resolved optional project/milestone/agreement links server-side, synced edited invoice ledger entries, and verified invoice create/update/status smoke (`201/200/200`), frontend TypeScript, frontend lint, and finance backend tests. |
| 2026-07-22 | Connected Finance Control / Payments frontend to backend: `Step5Payments.tsx` now loads Finance Clients, approved/sent Invoices, company Bank Accounts, and Payments through centralized `finance-api.ts`, removes dummy payment/invoice data, and routes record payment, invoice allocation, client advance, verify, reconcile, and reverse through `/api/v1/finance/payments/`. Confirmed backend payment reversal recalculates invoice paid/TDS/payment status by excluding reversed allocations; verified payment create/verify/reconcile smoke (`201/200/200`), frontend TypeScript, frontend lint, and finance backend tests. |
| 2026-07-22 | Connected Finance Control / Reminders frontend to backend: `Step6Reminders.tsx` now loads Finance Clients, Delivery Projects, outstanding approved/sent Invoices, and Reminders through centralized API wrappers, removes dummy reminder/invoice data, and routes schedule, send immediately, send, mark delivered, snooze, escalate, and cancel through `/api/v1/finance/reminders/`. Reminder UI metadata is stored as structured JSON in the backend note field to preserve subject/message/recipient/history without adding a risky migration; verified reminder create/update/search smoke (`201/200/200`), frontend TypeScript, frontend lint, and finance backend tests. |
| 2026-07-22 | Connected Finance Control / Credit Notes frontend to backend: `Step7CreditNotes.tsx` now loads Finance Clients, Delivery Projects, approved/sent Invoices, and Credit Notes through centralized API wrappers, removes dummy credit-note/invoice data, and routes draft, submit for approval, approve, reject, issue/apply, and archive through `/api/v1/finance/credit-notes/`. Expanded backend CreditNote statuses to include pending approval and rejected with migration `finance.0002_creditnote_status_choices`, applied it locally, and verified credit note create/approve/issue smoke (`201/200/200`), frontend TypeScript, frontend lint, and finance backend tests. |
| 2026-07-22 | Connected Finance Control / Sales, Purchases & Expenses frontend to backend: `Step8Expenses.tsx` now loads ledger rows through centralized `finance-api.ts`, removes dummy local ledger rows and the placeholder backend sync queue, and routes add/edit/archive through `/api/v1/finance/ledger-entries/`. Added centralized delete wrapper and finance regression coverage for ledger create, update, search, and archive; verified frontend TypeScript, frontend lint, and finance backend tests. |
| 2026-07-22 | Connected Finance Control / Budget Control frontend to backend: expanded Budget and Budget Revision tables with production fields for scope type, category, fiscal year, contingency, committed spend, thresholds, owner, cost center, remarks, approval metadata, and revision decision state via migration `finance.0003_budget_control_fields`; added `/api/v1/finance/budget-revisions/`, backend search for numbered finance resources, duplicate active-budget validation, and wired `Step9Budgets.tsx` through centralized `finance-api.ts` plus live Delivery Project options from `projects-api.ts`. Removed dummy budget/spend data and routed draft, submit, approve, reject, close, reopen, archive, revision request, and revision decision to backend APIs; applied local migration and verified frontend TypeScript, frontend lint, Django check, and finance backend tests. |
| 2026-07-22 | Connected Finance Control / Payroll Register frontend to backend: `Step10Salary.tsx` now loads active HRMS employees and HRMS payroll records through centralized `hrms-api.ts`, joins finance reconciliation rows from `/api/v1/finance/payroll-register/`, and removes dummy employee/payroll/localStorage bank data. Expanded Finance Payroll Register with payment method, payment reference, paid timestamp, and remarks via migration `finance.0004_payroll_register_payment_fields`; added duplicate HRMS payroll guard, paid-without-reference validation, payment reference search, and regression coverage. Payroll create now starts in HRMS payroll, finance status/payment actions sync through centralized finance APIs, local migration was applied, and frontend TypeScript, frontend lint, Django check, and finance backend tests passed. |
| 2026-07-22 | Connected Finance Control / GST Compliance frontend to backend: `Step11GST.tsx` now derives GST document inputs from backend approved/sent invoices, approved/applied credit notes, and posted ledger entries via centralized finance APIs, and persists GST return working/review/approval/filing state through `/api/v1/finance/gst-returns/`. Expanded GST Return with credit taxable, credit reversal, ITC buckets, GSTR-1/GSTR-3B declarations, cash ledger use, filing due date, prepared/approved metadata, ARN, filed timestamp, and remarks via migration `finance.0005_gst_return_compliance_fields`; added due-date, filed-without-ARN, duplicate ARN, and search validation coverage. Applied local migration and verified frontend TypeScript, frontend lint, Django check, and finance backend tests. |
| 2026-07-22 | Connected Finance Control / TDS Compliance frontend to backend: `Step12TDS.tsx` now builds TDS source options from backend payments, posted ledger purchase/expense entries, and finance payroll register through centralized finance APIs, and persists draft/verified/payable/adjusted/deposited/filed/closed/mismatch state through `/api/v1/finance/tds-records/`. Expanded TDS records with source type/id, party info, section, taxable amount, rate, deduction/deposit dates, challan, return acknowledgement, certificate state, lower deduction certificate, remarks, and quarterly period support via migrations `finance.0006_tds_compliance_fields` and `finance.0007_tds_period_length`; added duplicate active-source guard, date/challan validations, search coverage, and regression test. Applied local migrations and verified frontend TypeScript, frontend lint, Django check, and finance backend tests. |
| 2026-07-22 | Connected Finance Control / Finance Reports frontend to backend: `Step13Reports.tsx` now removes static report transactions and generates Income & Collections, Expense Register, Profit & Loss, Cash Flow, Client Outstanding, Aging Analysis, Budget Utilization, GST Summary, TDS Register, and Payroll Cost from live centralized finance APIs: invoices, payments, ledger entries, payroll register, GST returns, TDS records, and budgets. Report runs remain client-side generated snapshots with CSV export, while all source data is backend-driven; verified frontend TypeScript, frontend lint, Django check, and finance backend tests. |
| 2026-07-22 | Connected Finance Control / Finance Approvals frontend to backend: `Step14Approvals.tsx` now loads approval policies and approval requests through centralized `finance-api.ts`, removes dummy approval queue/policies, and routes add policy, decision submit, two-level approval routing, bulk approve, filters/search, decision history, and CSV export from backend records. Expanded Approval Policy/Request tables with second approver, SLA, requester/department, current approver, approval level, risk, policy link, control checks, due date, summary, and JSON decision events via migration `finance.0008_approval_workflow_fields`; added overlap validation, decision-note validation, requested_by/decided_by persistence, approval search fields, and regression coverage. Verified frontend TypeScript, frontend lint, Django check, migration check, and finance backend tests. |
| 2026-07-22 | Connected Finance Control / Audit Logs frontend to backend: `Step15AuditLogs.tsx` now loads real backend audit events through centralized `audit-api.ts`, removes static forensic sample logs, maps actor/module/action/entity/snapshot/IP/user-agent data into the audit stream, and keeps quick search, advanced filters, detail drawer, hash-chain verification, CSV export, and forensic JSON export working from backend records. Added persistent investigation metadata to `AuditLog` via migration `audit.0002_auditlog_investigated_at_auditlog_investigated_by_and_more`, exposed admin-only investigation update endpoint `/api/v1/audit/logs/{id}/investigation/`, validation for investigation notes, investigation-status filtering, and regression coverage. Applied local migration and verified frontend TypeScript, frontend lint, Django check, migration check, and audit backend tests. |
| 2026-07-22 | Connected Finance Control / Access Control frontend to backend: `Step16Access.tsx` now loads and persists role/module finance permissions through centralized `finance-api.ts` and `/api/v1/finance/access-policies/`, replacing local prototype-only role state. Expanded `FinanceAccessPolicy` with role description, lifecycle status, protected flag, users count, data scope, approval limit, audit access, review dates, and archive permission via migration `finance.0009_financeaccesspolicy_approval_limit_and_more`; grouped backend module-policy rows into role records in the UI; connected create role, edit policy, activate/deactivate, effective-access detail, search/filter, and CSV export. Added backend validation for duplicate role/module policies, approval-limit rules, audit-access module rules, protected Access Control rules, and regression coverage. Applied local migration and verified frontend TypeScript, frontend lint, Django check, migration check, and finance backend tests. |
| 2026-07-22 | Connected Finance Control / Bank Account Management frontend to backend: `Step17BankDetails.tsx` now loads and persists company/client bank accounts through centralized `finance-api.ts` and `/api/v1/finance/bank-accounts/`, removing localStorage/static bank records. Expanded `BankAccount` with owner reference, account type, purpose, verification note, and last verified timestamp via migration `finance.0010_bankaccount_account_type_and_more`; connected create pending account, edit with sensitive-change re-verification, verify/reject decision, make primary, activate/deactivate, detail drawer, search/filter, and masked CSV export. Added backend duplicate account+IFSC validation, verification-note validation, active+verified primary guard, primary sibling reset, and regression coverage. Applied local migration and verified frontend TypeScript, frontend lint, Django check, migration check, and finance backend tests. |
| 2026-07-22 | Completed Finance Control cross-verification pass after Step1-Step17: scanned accounting components/services for direct `fetch`, direct `/api/v1`, `localStorage`, dummy/static seed usage, and leftover prototype paths; removed dead Client Master/Vendor Master seed arrays; connected Finance dashboard top actions to Finance Reports and Invoices instead of placeholder buttons; confirmed remaining `initialEntry` references are valid edit-dialog state only. Verified frontend TypeScript, frontend lint, Django check, migration check, and combined finance/audit backend tests (`18` tests) all passed. |
| 2026-07-22 | Rechecked Finance Control frontend-to-backend coverage page by page: Finance Overview, Client Master, Vendor Master, Quotations, Invoices, Payments, Reminders, Credit Notes, Sales/Purchases/Expenses, Budget Control, Payroll Register, GST, TDS, Finance Reports, Finance Approvals, Audit Logs, Access Control, and Bank Details all route through centralized service wrappers (`finance-api.ts`, `audit-api.ts`, `hrms-api.ts`, `projects-api.ts`) with no direct component-level `/api/v1` or `fetch` calls. Verified frontend TypeScript, frontend lint, Django check, migration check, and combined finance/audit backend tests (`18` tests) all passed. |
| 2026-07-23 | Standardized Finance Control page naming across frontend menus, dashboard cards, page headers, backend access-control module names, and BACKENDINFO records. Canonical names now match for Finance Overview, Client Master, Vendor Master, Quotations, Invoices, Payments, Reminders, Credit Notes, Sales/Purchases/Expenses, Budget Control, Payroll Register, GST Compliance, TDS Compliance, Finance Reports, Finance Approvals, Audit Logs, Access Control, and Bank Details. Verified no old descriptive aliases remain in finance UI/docs scan; frontend TypeScript and lint passed. |
| 2026-07-23 | Completed Finance Control manual browser verification with real backend data. Seeded traceable local verification records for missing finance areas (bank account, budget, payroll register, GST return, TDS record, approval policy/request, and finance access policy), reset local admin login for verification, and checked all Finance Control pages in Chrome against the running frontend/backend. Verified page visibility, canonical names, search/filter controls, export/download controls, safe detail/edit/open buttons, filled form fields, and currently visible state-changing buttons for Finance Overview, Client Master, Vendor Master, Quotations, Invoices, Payments, Reminders, Credit Notes, Sales/Purchases/Expenses, Budget Control, Payroll Register, GST Compliance, TDS Compliance, Finance Reports, Finance Approvals, Audit Logs, Access Control, and Bank Details. Fixed Bank Details page header mismatch from `Bank Account Management` to `Bank Details`. Frontend TypeScript, frontend lint, and Django check passed. |
| 2026-07-24 | Implemented Growth Marketing backend foundation and live frontend wiring: added `apps.marketing` with UUID marketing campaign and lead-source models, sequence-based readable codes (`CMP-2026-###` and `SRC-###`), audit logging, search/filter/list/create/update/archive APIs, ROI and overview endpoints, migration `marketing.0001_initial`, tests, and registered `/api/v1/marketing/`. Connected `MarketingHub.tsx` to centralized `marketing-api.ts` so campaigns and sources now load, create, edit, archive, and export from backend data instead of hardcoded arrays. Seeded 4 marketing campaigns and 6 lead sources for local verification; `manage.py check`, marketing tests, frontend TypeScript, and frontend lint passed. |
| 2026-07-24 | Implemented Support Desk backend foundation and live frontend wiring: added `apps.support` with `SupportTicket`, comments, status history, and assignment tables, mounted `/api/v1/support/`, created overview/list/create/update/comment APIs, added sequence-based ticket numbers (`SUP-####`), audit logging, and centralized `support-api.ts`. Connected `SupportHub.tsx` to backend search/filter/load/update flows instead of local-only data, fixed the support URL mount, and verified backend smoke plus frontend TypeScript and lint passed. |
| 2026-07-24 | Implemented Notifications backend foundation: added `apps.notifications` with `Notification`, `NotificationRead`, and `CommunicationJob` tables, mounted `/api/v1/notifications/`, created overview/list/create/detail/read-state/job queue APIs, wired audit logging for create/update/read/unread/job queue actions, applied the local migration, and verified backend smoke for create/list/search/read/job queue. |
| 2026-07-24 | Connected the dashboard notification bell to live backend data: added centralized `panel/src/services/notifications-api.ts`, replaced the static dashboard notification list with unread backend notifications, added read-state handling from the popup, and wired Support Desk create/update actions to emit broadcast notification records so the bell reflects real module events. Verified frontend TypeScript and lint passed. |
