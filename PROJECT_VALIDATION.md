# CRM Panel Production Validation

Last updated: 2026-06-23

Purpose: this is the validation file to read before backend/API work. It records what every dashboard module/page is supposed to do, how it is connected, what can be changed, what should not be broken, and what backend APIs are required for a real production system.

## Current Production Status

- Frontend shell is functional and module routing is centralized in `src/app/dashboard/page.tsx`.
- Most business modules are currently UI-first with mock/static arrays or local React state.
- Some modules use `localStorage` for temporary cross-module sync:
  - Project invoices: `crm_invoices_data`
  - Payroll: `crm_payroll_data`
  - Bank accounts: `crm_company_banks`, `crm_client_banks`
- API client exists in `src/lib/api-client.ts`, but most modules are not yet wired to backend endpoints.
- Dashboard overview has been redesigned as the company command center, but its KPIs/alerts/activity are still static and need aggregate APIs.
- Known blocker before full production TypeScript validation: `src/components/dashboard/leads/LeadHub.tsx` has escaped-quote corruption and should be fixed or removed if unused.

## Do Not Break Rules

- Do not change dashboard `activeTab` ids without updating sidebar, render switch, deep links, and backend permission keys.
- Do not change `ACCOUNTING_MODULES` ids without updating accounting access permissions and dashboard menu generation.
- Keep dashboard layout guards: main wrappers need `min-w-0`, `w-full`, and accounting tables need internal horizontal scroll.
- Keep currency rendering ASCII-safe in source code. Use `INR = "\u20b9"` in code instead of pasting the rupee symbol directly where encoding may corrupt it.
- Keep destructive actions behind confirmation dialogs, especially delete/soft-delete flows.
- For production, do not rely on browser-only `localStorage` for company records, payroll, ledgers, invoices, bank data, approvals, or audit logs.
- Audit logs must be append-only from backend once APIs exist.
- Role/access checks must be enforced on backend, not only by React UI.

## Dashboard Connection Map

| Sidebar Group | Tab ID | Rendered Component | Status | Backend Need |
| --- | --- | --- | --- | --- |
| Main | `overview` | `DashboardOverview` | Connected, static KPIs | Company-wide summary, alerts, activity feed |
| CRM | `leads` | `LeadWizard` | Connected, local state/mock leads | Leads CRUD, lead stage history, proposals, approvals |
| CRM | `followups` | `FollowUps` | Connected, static data | Follow-up tasks, calendar, activity log |
| CRM | `clients` | `ClientsContacts` | Connected, static data | Client/contact master, opportunities, account health |
| CRM | `agreements` | `ProjectAgreement` | Connected, local form | Agreement CRUD, templates, e-sign/doc storage |
| Marketing | `campaigns` | `MarketingHub activeView="campaigns"` | Connected, static data | Campaign CRUD and spend/source metrics |
| Marketing | `roi` | `MarketingHub activeView="roi"` | Connected, static data | ROI aggregation by channel/date/campaign |
| Marketing | `sources` | `MarketingHub activeView="sources"` | Connected, static data | Lead source attribution |
| Projects | `projects` | `ProjectHub activeView="projects"` | Connected, local state | Project CRUD, client link, billing link |
| Projects | `team-tracking` | `ProjectHub activeView="team-tracking"` | Connected, local state | Assignments, workload, utilization |
| Projects | `tasks` | `ProjectHub activeView="tasks"` | Connected, static/local | Task CRUD and status history |
| Projects | `milestones` | `ProjectHub activeView="milestones"` | Connected, static/local | Milestone CRUD, completion and billing trigger |
| Projects | `deadlines` | `ProjectHub activeView="deadlines"` | Connected, static/local | Deadline risk and reminders |
| Projects | `performance` | `EmployeePerformance` | Connected, static data | KPI/OKR/feedback/career records |
| HRMS | `employees` | `HRMSHub activeView="employees"` | Connected, local state | Employee master, profile, documents |
| HRMS | `onboarding` | `OnboardingWizard` | Connected, wizard state | Employee onboarding workflow |
| HRMS | `attendance` | `HRMSHub activeView="attendance"` | Connected, static data | Attendance, regularization, shift data |
| HRMS | `leave` | `HRMSHub activeView="leave"` | Connected, local state | Leave requests, balances, approvals |
| HRMS | `payroll` | `HRMSHub activeView="payroll"` | Connected, localStorage | Payroll records, salary processing, bank link |
| HRMS | `exit` | `HRMSHub activeView="exit"` | Connected, local state | Exit cases, clearance checklist |
| Accounting | `accounting` | `AccountingDashboard` | Connected | Accounting module summary |
| Accounting | `accounting-*` | `AccountingWizard activeModule` | Connected | Module-specific finance APIs |
| Administration | `users` | `AdministrationHub activeView="users"` | Connected, static data | User management |
| Administration | `roles` | `AdministrationHub activeView="roles"` | Connected, static data | RBAC roles/permissions |
| Administration | `logs` | `AdministrationHub activeView="logs"` | Connected, static data | Global audit logs |
| Administration | `approvals` | `AdministrationHub activeView="approvals"` | Connected, static data | Approval workflow |
| Administration | `settings` | `AdministrationHub activeView="settings"` | Connected, static data | Company settings |
| Support | `support` | Inline placeholder | Placeholder only | Support tickets/help center |

## Module Validation

### Auth

Files:

- `src/app/auth/signin/page.tsx`
- `src/app/auth/signup/page.tsx`
- `src/components/auth/SigninForm.tsx`
- `src/components/auth/SignupForm.tsx`
- `src/components/auth/IndianMobileInput.tsx`

Current job: phone/OTP style sign-in and sign-up screens.

Current data source: frontend state only.

Can change:

- Wire OTP send/verify APIs.
- Add session persistence, refresh token handling, and user role loading.
- Add validation messages from backend.

Do not change:

- Keep Indian mobile validation behavior unless backend requirements change.
- Keep auth redirect flow consistent with protected dashboard access.

Backend APIs needed:

- `POST /auth/signup`
- `POST /auth/signin/otp/send`
- `POST /auth/signin/otp/verify`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/refresh`

### Dashboard Overview

File: `src/app/dashboard/page.tsx`

Current job: first screen should tell what is happening in the company across revenue, sales, projects, HR, approvals, and risk.

Current data source: static UI values.

Can change:

- Replace static KPI arrays with API data.
- Add date filters, branch/company filters, role-based KPI visibility.
- Add click-through from KPI cards to module tabs.

Do not change:

- Keep it as the first screen and company command center, not a marketing landing page.
- Keep layout responsive and avoid wide child elements cutting the page.

Backend APIs needed:

- `GET /dashboard/summary?period=...`
- `GET /dashboard/alerts`
- `GET /dashboard/activity`
- `GET /dashboard/pipeline`
- `GET /dashboard/department-watchlist`

### CRM

Files:

- `src/components/dashboard/leads/LeadWizard.tsx`
- `src/components/dashboard/leads/Step1LeadInfo.tsx` through `Step6LeadStatus.tsx`
- `src/components/dashboard/crm/FollowUps.tsx`
- `src/components/dashboard/crm/ClientsContacts.tsx`
- `src/components/dashboard/crm/ProjectAgreement.tsx`

Current job:

- Leads: capture new leads through a six-step pipeline.
- Follow-ups: track calls/meetings/reminders.
- Clients & Contacts: view account details, contacts, opportunities, signals.
- Agreements: create project agreement records.

Current data source: mock arrays, local wizard state, local form state.

Can change:

- Convert lead wizard to create/update a backend lead draft per step.
- Link follow-ups to leads, clients, projects, and users.
- Link agreements to clients and projects.
- Add search, filters, ownership, and stage history.

Do not change:

- Do not mix lead, client, and project IDs. They should be separate linked entities.
- Do not delete lead history when a lead converts to a client/project.
- Keep follow-up audit/history after date or status changes.

Backend APIs needed:

- `GET/POST /leads`
- `GET/PUT/PATCH /leads/:id`
- `POST /leads/:id/follow-ups`
- `POST /leads/:id/proposals`
- `POST /leads/:id/approval`
- `GET/POST /clients`
- `GET/PUT /clients/:id`
- `GET/POST /clients/:id/contacts`
- `GET/POST /agreements`
- `GET/PUT/PATCH /agreements/:id`

Production validation needed:

- Required fields per lead step.
- Duplicate lead check by phone/email/company.
- Stage transition rules.
- Agreement document upload/storage rules.

### Marketing

File: `src/components/dashboard/marketing/MarketingHub.tsx`

Pages:

- Campaigns
- Marketing ROI
- Lead Sources

Current job: show campaigns, funnel, channel ROI, and lead source distribution.

Current data source: static arrays.

Can change:

- Connect campaigns to actual leads and spend data.
- Add campaign create/edit/archive.
- Add date range and channel filters.

Do not change:

- Do not manually enter converted leads/revenue once lead/project/accounting APIs exist. These should be aggregated.
- Do not treat source labels as free text without normalization.

Backend APIs needed:

- `GET/POST /marketing/campaigns`
- `GET/PUT/PATCH /marketing/campaigns/:id`
- `GET /marketing/roi`
- `GET /marketing/sources`
- `GET /marketing/funnel`

### Projects

Files:

- `src/components/dashboard/projects/ProjectHub.tsx`
- `src/components/dashboard/projects/ProjectsModule.tsx`
- `src/components/dashboard/projects/performance/EmployeePerformance.tsx`

Pages:

- Projects
- Team Tracking
- Tasks
- Milestones
- Deadlines
- Employee Performance

Current job: manage project overview, team allocation, tasks, milestones, deadlines, and employee KPI/OKR feedback.

Current data source: initial arrays, local React state, and invoice data saved to `localStorage` for accounting sync.

Can change:

- Replace project arrays with backend project records.
- Create invoice/milestone billing events through backend instead of localStorage.
- Link project team assignments to HRMS employees.
- Add task ownership, due dates, comments, attachments, and history.

Do not change:

- Do not let project billing directly mutate accounting totals on the client.
- Do not lose project-to-client and project-to-lead conversion linkage.
- Do not use free-text team names once employee APIs exist.

Backend APIs needed:

- `GET/POST /projects`
- `GET/PUT/PATCH /projects/:id`
- `GET/POST /projects/:id/team`
- `GET/POST /projects/:id/tasks`
- `GET/POST /projects/:id/milestones`
- `POST /projects/:id/milestones/:milestoneId/complete`
- `GET /projects/deadlines`
- `POST /projects/:id/billing-events`
- `GET/POST /performance/reviews`

### HRMS

Files:

- `src/components/dashboard/hrms/HRMSHub.tsx`
- `src/components/dashboard/hrms/PayrollView.tsx`
- `src/components/dashboard/onboarding/OnboardingWizard.tsx`
- `src/components/dashboard/onboarding/Step1Registration.tsx` through `Step6Approval.tsx`

Pages:

- Employees
- Onboarding
- Attendance
- Leave
- Payroll
- Exit Management

Current job: employee master, onboarding workflow, attendance, leave, payroll, and exit/offboarding.

Current data source: static arrays, local React state, and payroll localStorage.

Can change:

- Make onboarding create employee drafts.
- Link employee records to attendance, leave, payroll, exit, projects, and performance.
- Add document upload and verification status.
- Add approval workflow for leave, payroll, and exit.

Do not change:

- Do not duplicate employee identity in payroll/project/performance modules.
- Do not process payroll only from client state.
- Do not allow exit/offboarding to delete employee history.

Backend APIs needed:

- `GET/POST /employees`
- `GET/PUT/PATCH /employees/:id`
- `POST /employees/:id/documents`
- `GET/POST /attendance`
- `POST /attendance/:id/regularize`
- `GET/POST /leave-requests`
- `PATCH /leave-requests/:id/approve`
- `GET/POST /payroll`
- `POST /payroll/:id/process`
- `GET/POST /exit-cases`
- `PATCH /exit-cases/:id/checklist`

### Accounting

Files:

- `src/components/dashboard/accounting/AccountingDashboard.tsx`
- `src/components/dashboard/accounting/AccountingWizard.tsx`
- `src/components/dashboard/accounting/AccessControlContext.tsx`
- `src/components/dashboard/accounting/Step1Clients.tsx` through `Step17BankDetails.tsx`
- `src/components/dashboard/accounting/LedgerEntryDialog.tsx`

Current job: finance control area for clients, vendors, quotations, invoices, payments, reminders, credit notes, sale/purchase/expense ledger, budgets, payroll, GST, TDS, reports, approvals, audit logs, access control, and bank details.

Current data source:

- Mostly static arrays and local React state.
- Bank details, salary/payroll, quotations/invoices read some data from localStorage.
- Sale/Purchase/Exp has production-style validation, audit trail, soft delete, and prepared backend sync queue, but it is still client-side.

Accounting page map:

| Tab ID | Page | Current Job | Current Data | Backend Priority |
| --- | --- | --- | --- | --- |
| `accounting` | Accounting Overview | Finance module cards | Static | Medium |
| `accounting-clients` | Client Master | Finance client records | Local state | High |
| `accounting-vendors` | Vendor Master | Vendor records | Local state | High |
| `accounting-quotations` | Quotations | Quote creation/list | Local + bank localStorage | High |
| `accounting-invoices` | Invoices | Invoice creation/list | Local + bank localStorage | High |
| `accounting-payments` | Payments | Payment milestones/receipts | Local state | High |
| `accounting-reminders` | Reminders | Collection reminders | Local state | Medium |
| `accounting-credit-notes` | Credit Notes | Credit note handling | Local state | Medium |
| `accounting-expenses` | Sale/Purchase/Exp | Ledger entries | Local state with sync queue | Highest |
| `accounting-budgets` | Budgets | Budget planning | Local state | Medium |
| `accounting-salary` | Salary/Payroll | Payroll finance | Payroll/bank localStorage | High |
| `accounting-gst` | GST Mgmt | GST tracking | Local state | High |
| `accounting-tds` | TDS Mgmt | TDS tracking | Local state | High |
| `accounting-reports` | Reports | Finance reports | Local state | Medium |
| `accounting-approvals` | Approvals | Finance approval queue | Local state | High |
| `accounting-audit-logs` | Audit Logs | Finance audit log | Local state | High |
| `accounting-access` | Access Control | Accounting roles | Local state/context | High |
| `accounting-bank-details` | Bank Details | Company/client bank accounts | localStorage | High |

Can change:

- Replace each local state list with API queries/mutations.
- Use backend generated voucher/invoice/receipt numbers.
- Use backend tax calculation and posting rules.
- Move approval and audit log creation to backend.
- Add optimistic UI only after API contracts are stable.

Do not change:

- Main Sale/Purchase/Exp table should remain view-only. Add/edit/delete should happen through the entry dialog.
- Delete must remain soft-delete with confirmation.
- Accounting audit logs must not be editable by normal users.
- Bank details must not be stored only in browser storage.
- Ledger totals should be backend-confirmed for production reporting.

Backend APIs needed:

- `GET/POST /accounting/clients`
- `GET/POST /accounting/vendors`
- `GET/POST /accounting/quotations`
- `GET/POST /accounting/invoices`
- `GET/POST /accounting/payments`
- `GET/POST /accounting/reminders`
- `GET/POST /accounting/credit-notes`
- `GET/POST /accounting/ledger-entries`
- `PUT/PATCH /accounting/ledger-entries/:id`
- `DELETE /accounting/ledger-entries/:id` or `PATCH /accounting/ledger-entries/:id` for soft delete
- `GET/POST /accounting/budgets`
- `GET/POST /accounting/payroll`
- `GET /accounting/gst`
- `GET /accounting/tds`
- `GET /accounting/reports`
- `GET/POST /accounting/approvals`
- `GET /accounting/audit-logs`
- `GET/POST /accounting/bank-accounts`
- `GET/PUT /accounting/access-control`

### Administration

File: `src/components/dashboard/administration/AdministrationHub.tsx`

Pages:

- Users
- Roles
- Audit Logs
- Approvals
- Settings

Current job: admin view for users, role permissions, logs, approvals, and settings.

Current data source: static arrays.

Can change:

- Connect to auth/user/role backend.
- Add role-based permission editor.
- Add company settings persistence.
- Add global approval inbox.

Do not change:

- Do not let frontend-only roles become the source of truth.
- Do not let users edit audit logs.
- Do not allow settings changes without audit entries.

Backend APIs needed:

- `GET/POST /admin/users`
- `GET/PUT/PATCH /admin/users/:id`
- `GET/POST /admin/roles`
- `GET/PUT /admin/roles/:id`
- `GET /admin/audit-logs`
- `GET/POST /admin/approvals`
- `PATCH /admin/approvals/:id`
- `GET/PUT /admin/settings`

### Support

Current job: placeholder only.

Current data source: none.

Can change:

- Add ticket list, ticket creation, priority, assigned team, status, comments.

Do not change:

- Do not mix support tickets into CRM follow-ups. They can link to clients/projects, but should remain separate.

Backend APIs needed:

- `GET/POST /support/tickets`
- `GET/PUT/PATCH /support/tickets/:id`
- `POST /support/tickets/:id/comments`

## Cross-Module Production Flow

Recommended real-company flow:

1. Marketing campaign/source creates lead attribution.
2. Lead moves through CRM pipeline.
3. Qualified lead converts to client and project.
4. Project creates milestones/tasks/team allocation.
5. Completed milestone creates billing event.
6. Accounting creates quotation/invoice/payment records.
7. Payment and ledger entries update finance reports.
8. HRMS employees connect to projects, attendance, leave, payroll, and performance.
9. Administration controls users, roles, approvals, settings, and audit logs.
10. Dashboard aggregates live status from all modules.

## Backend Design Rules

- Every table should have `id`, `companyId`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`.
- Sensitive finance and HR tables should support soft delete: `deletedAt`, `deletedBy`, `status`.
- Approval-capable records should support `draft`, `pending`, `approved`, `rejected`, `cancelled`.
- Never trust client totals for finance, tax, payroll, or dashboard reporting. Recalculate on backend.
- Use backend-generated document numbers for invoices, quotations, vouchers, receipts, credit notes, payroll batches.
- All create/update/delete/approve actions should write audit logs.
- Use role permissions from backend and mirror them in UI for usability.
- Add pagination, search, filters, sorting, and date ranges to list endpoints.
- Use zod/react-hook-form on frontend for input validation, but backend must repeat critical validation.

## Recommended Backend Priority

1. Auth/session/user roles because every module depends on user identity.
2. Master data: companies, users, employees, clients, vendors, bank accounts.
3. Accounting ledger/invoices/payments because dashboard financials depend on this.
4. Leads/CRM/project conversion because revenue pipeline depends on this.
5. HRMS attendance/leave/payroll because payroll/accounting depends on this.
6. Approvals and audit logs across all modules.
7. Dashboard aggregate endpoints.
8. Marketing/source attribution and support tickets.

## Validation Checklist Before API Work

- Fix or remove corrupted `LeadHub.tsx` if it is unused.
- Decide database schema names and relationships.
- Decide whether backend will be Node/Nest/Express, Django/FastAPI, Laravel, or another stack.
- Decide auth method: JWT access/refresh, cookie session, or hybrid.
- Create endpoint contracts before wiring UI mutations.
- Replace localStorage sync with backend records.
- Add loading/error/empty states for every API list.
- Add delete confirmations everywhere destructive actions exist.
- Add role checks on frontend and backend.
- Add audit log calls or backend audit middleware.
- Run lint/build after wiring each module.

