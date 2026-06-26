# CRM Panel Project Context

Last updated: 2026-06-26

This file is a working memory snapshot for future Codex sessions. Read this first before scanning the whole project.

## Project

- Name: `panel`
- Path: `D:\crmproduct\panel`
- Framework: Next.js 16.2.7 with App Router
- Language: TypeScript, React 19
- Styling: Tailwind CSS plus inline styles in several dashboard/accounting tables
- Icons: `lucide-react`
- API client: `src/lib/api-client.ts`
- Default API base URL: `http://localhost:8000/api`

## Production Validation File

- Read `PROJECT_VALIDATION.md` before backend/API work.
- It maps every dashboard module/page to its current job, dashboard connection, current data source, production gaps, safe changes, do-not-break rules, and required backend APIs.
- Use it as the source of truth for the next phase: database schema, endpoint contracts, validation, audit logs, and dashboard aggregate APIs.

## Commands

```bash
npm run dev
npm run build
npm run lint
npx tsc --noEmit
```

For targeted accounting checks used during recent work:

```bash
npx tsc --noEmit --jsx react-jsx --moduleResolution bundler --module esnext --target es2017 --lib dom,dom.iterable,esnext --esModuleInterop --skipLibCheck src/components/dashboard/accounting/AccountingComponents.tsx src/components/dashboard/accounting/LedgerEntryDialog.tsx src/components/dashboard/accounting/Step8expenses.tsx
```

## Top-Level Structure

- `src/app/page.tsx`: entry/home page.
- `src/app/layout.tsx`: app root layout.
- `src/app/globals.css`: global CSS and theme globals.
- `src/app/dashboard/page.tsx`: main CRM dashboard shell, sidebar, header, active module switching.
- `src/app/auth/signin/page.tsx`: sign-in page.
- `src/app/auth/signup/page.tsx`: sign-up page.
- `src/lib/api-client.ts`: fetch-based API helper with `api.get/post/put/delete`.
- `src/components/ui`: reusable UI inputs/buttons/selects.
- `src/components/auth`: sign-in/sign-up form components.
- `src/components/dashboard`: all CRM modules.

## Dashboard Shell

Main file: `src/app/dashboard/page.tsx`

Responsibilities:

- Owns `activeTab`.
- Renders the sidebar navigation groups.
- Renders the sticky header with search, notifications, date, create button, and profile.
- Switches modules based on `activeTab`.
- Accounting module ids come from `ACCOUNTING_MODULES`.

Important recent layout fix:

- Main wrapper uses `min-w-0` and `w-full` so wide accounting tables do not push/cut the page.
- Main content container is `mx-auto w-full max-w-[1600px] min-w-0`.
- Header has `w-full`, `gap-6`, and right controls are `shrink-0`.
- Dashboard sidebar is fixed, so the content shell must use `ml-[19rem] w-[calc(100%-19rem)]` when expanded and `ml-0 w-full` when collapsed. Do not combine a fixed sidebar offset with unconstrained `flex-1`; that creates horizontal page overflow and makes the header/content appear cut or shifted.
- Root dashboard wrapper uses `overflow-x-hidden`; wide tables must scroll inside their own table containers, not by shifting the whole dashboard shell.
- Header action buttons are functional, not decorative: notifications open a work queue with module navigation, calendar opens shortcuts for deadline/attendance views, `Create New` routes to real module flows, and the RR profile menu exposes profile/settings/support/avatar/sign-out actions.

Current overview dashboard:

- `DashboardOverview()` has been redesigned as a company command center.
- It now shows executive KPI cards, business health, priority alerts, sales pipeline, department watchlist, and live activity feed.
- Dashboard intent: the first screen should tell leadership what is currently happening across sales, projects, accounting, HRMS, approvals, and operational risk.
- Currency in dashboard overview uses `INR = "\u20b9"` to avoid corrupted rupee symbols.

## Major Modules

### CRM

- `src/components/dashboard/crm/ClientsContacts.tsx`
- `src/components/dashboard/crm/FollowUps.tsx`
- `src/components/dashboard/crm/ProjectAgreement.tsx`

### Leads

- `src/components/dashboard/leads/LeadWizard.tsx`
- `src/components/dashboard/leads/LeadHub.tsx`
- Step files: `Step1LeadInfo` through `Step6LeadStatus`.

Known caveat:

- Earlier full `npx tsc --noEmit` reported many syntax errors in `LeadHub.tsx`, likely from escaped quote corruption. This was not part of the accounting fixes.

### Projects

- `src/components/dashboard/projects/ProjectHub.tsx`
- `src/components/dashboard/projects/ProjectsModule.tsx`
- `src/components/dashboard/projects/performance/EmployeePerformance.tsx`

Current Projects portfolio behavior:

- `ProjectHub activeView="projects"` now uses typed local project state with API-ready project metadata.
- Project records include `clientId`, client name, `sourceLeadId`, team leader, project owner, status, health, billing status, progress, dates, value, next action, team and milestones.
- Projects page supports add, edit, archive/restore, search, status filter, health filter, CSV export, dynamic KPI cards, and validation.
- Validation blocks missing client/lead/owner fields, zero project value, progress outside 0-100, and invalid date ranges.
- Client selection supports known client accounts and manual client name entry, so converted/new client cases are covered.
- Project billing status is tracked as metadata only. Project billing should not directly mutate accounting totals on the client; milestone completion now creates backend-ready billing events instead of local invoice mutation.

Current Project Team Tracking behavior:

- `ProjectHub activeView="team-tracking"` now manages typed team assignments with `employeeId`, employee name, role, assigned task, dates, progress, and status.
- Team assignment form uses a controlled employee directory instead of free-text-only member names, while still allowing role/task edits.
- Supports add, edit, mark complete, remove, search, project filter, status filter, CSV export, dynamic assignment KPI cards, and validation.
- Validation blocks missing employee/task/date fields, progress outside 0-100, and invalid assignment date ranges.
- This remains local React state. Once HRMS employee APIs exist, replace the demo `employeeDirectory` with `GET /employees` and persist through `GET/POST /projects/:id/team`.

Current Project Tasks behavior:

- `ProjectHub activeView="tasks"` now uses the shared team-assignment/task records instead of a read-only flat task list.
- Task records include project link, client, employee owner, role, task detail, start/due dates, progress, status, priority, comment, attachment reference, and history entries.
- Supports create, edit, mark complete, remove, search, project/status/priority filters, CSV export, dynamic task KPI cards, comments/attachment display, and last-history display.
- Validation blocks missing project/owner/task/date fields, progress outside 0-100, and invalid due dates.
- This remains local React state. Backend phase should persist through `GET/POST /projects/:id/tasks` and preserve task history server-side.

Current Project Milestones behavior:

- `ProjectHub activeView="milestones"` now manages typed milestone records with owner, due date, progress, billing amount, next action, billing event status, and completion date.
- Supports create, edit, archive/restore, mark complete, search, project/status/billing filters, CSV export, dynamic milestone KPI cards, and a project billing event queue.
- Mark Complete now updates the milestone to completed/progress 100 and creates a backend-ready billing event draft instead of directly mutating Accounting or local invoice totals.
- Validation blocks missing project/title/owner/due date/next action fields, negative billing amounts, progress outside 0-100, and completed milestones below 100%.
- This remains local React state. Backend phase should persist through `GET/POST /projects/:id/milestones`, `PATCH /projects/:id/milestones/:milestoneId`, and `POST /projects/:id/billing-events`.

Current Project Deadlines behavior:

- `ProjectHub activeView="deadlines"` now renders a dedicated deadline control board instead of sharing the timeline fallback view.
- Deadline records are derived from project end dates, milestones, team task due dates, plus manual deadline records.
- Manual deadlines support create, edit, resolve, archive/restore, search, project/source/status/priority filters, CSV export, KPI cards, and required-field validation.
- System-derived project/milestone/task deadlines are linked back to their source records and shown as linked rows instead of editable duplicates.
- This remains local React state. Backend phase should persist manual deadlines through `GET/POST /projects/:id/deadlines` and keep derived deadlines queryable from projects, milestones, and tasks.

Current Employee Performance behavior:

- `EmployeePerformance` now uses typed local performance review records instead of static employee rows and no-op page actions.
- Review records include employee ID, department, role, manager, cycle, stage, goal counts, KPI/task/quality/attendance scores, rating, status, review dates, manager notes, improvement plan, feedback, OKRs, career readiness, attrition risk, and training recommendations.
- Supports create, edit, archive/restore, detail drawer, search, department/status/cycle filters, CSV export, dynamic KPI cards, scorecards, OKR view, feedback view, and career view.
- Validation blocks missing employee/review fields, duplicate employee IDs, completed goals greater than assigned goals, percentage scores outside 0-100, rating/quality outside 0-5, and invalid review date order.
- This remains local React state. Backend phase should persist through `GET/POST /performance-reviews`, `PATCH /performance-reviews/:id`, and HRMS employee master APIs.

### HRMS

- `src/components/dashboard/hrms/HRMSHub.tsx`
- `src/components/dashboard/hrms/PayrollView.tsx`
- `src/components/dashboard/onboarding/OnboardingWizard.tsx`
- `src/components/dashboard/onboarding/Step1Registration.tsx` through `Step6Approval.tsx`

Current HRMS behavior:

- `HRMSHub` now uses typed local state across employees, attendance, leave, payroll, and exit management instead of static/no-op UI.
- Employees support add/edit/view/offboard, employee master validation, duplicate employee ID checks, KYC/asset metadata, search/status filters, CSV export, dynamic KPI cards, and exit-case linkage.
- Attendance now supports new and row-level regularization with prefilled missing-punch data, employee/date duplicate prevention, time-range validation, calculated billable/overtime hours, late detection, approval/rejection, payroll-impact status, search/status filters, KPI cards, and CSV export.
- Leave supports full-day/half-day and WFH requests, per-type balance limits, overlapping-date prevention, Manager Review to HR Review staged approval, rejection/cancellation, paid/unpaid/no-impact payroll classification, attendance synchronization after final approval, search/status filters, KPI cards, and expanded CSV export.
- Payroll now supports one employee/month record, month and working-day inputs, attendance/leave readiness checks, automatic payable/LOP days and LOP deduction, hold reasons, recheck/release reconciliation, staged HR Review to Finance Review to Approved to Paid processing, deduction validation, readiness/status filters, KPI cards, and expanded CSV export; finance/accounting and bank payout integration should replace local state later.
- Exit management now supports resignation/termination/contract-end/retirement cases, initiation and last-day validation, one active exit per employee, manager/handover ownership, asset recovery and access revoke, manager/HR/finance/IT clearances, controlled handover progress, gated F&F completion, exit cancellation with employee-status rollback, final employee `Exited` synchronization, lifecycle/risk/status filters, KPI cards, and expanded CSV export.
- `PayrollView.tsx` standalone compatibility view was cleaned so HRMS folder focused lint and TypeScript pass.
- This remains local React state. Backend phase should persist through HRMS employee master, attendance, leave, payroll, and exit APIs with audit history and role-based access.

Current Onboarding behavior:

- `OnboardingWizard` now owns typed onboarding state for registration, employment, document uploads, verification statuses, training tasks, approvals, and onboarding status.
- Step navigation is gated by real completion rules; users cannot jump ahead or submit final approval while required prior steps are incomplete.
- Registration validates required identity, contact, address, emergency contact, email, and mobile fields before moving to employment.
- Employment validates department, designation, reporting manager, joining date, and official email; fixed the broken official email field name.
- Documents now track selected file names in state, reset requirements when fresher/experienced category changes, and block next until all required documents have an upload.
- Verification now uses the uploaded document state, supports approve/reject/under-review, and blocks training until every required document is verified.
- Training checklist is persisted in wizard state and final approval is blocked until all training/compliance tasks are complete.
- Final approval now requires HR Manager, Technical Manager, Finance Team, and Director approvals before completing onboarding.
- This remains local React state. Backend phase should persist through onboarding candidate, document, verification, training, and approval APIs with audit trail.

### Marketing

- `src/components/dashboard/marketing/MarketingHub.tsx`

Current Campaigns page behavior:

- Campaigns page now uses typed local `CampaignRecord` state instead of display-only string rows.
- Campaign records are backend/API-ready with numeric `budgetAmount`, `spentAmount`, `pipelineAmount`, date fields, UTM fields, landing page, lead form, owner, status, and next action.
- Campaigns page supports create, edit, archive/restore, search, channel filter, status filter, CSV export, dynamic KPI cards, and validation.
- Validation blocks missing required campaign attribution fields, zero budget, overspend, MQL greater than leads, and invalid date ranges.
- Campaign delete is intentionally represented as archive/restore in the frontend until backend soft-delete/audit rules are available.

Current Marketing ROI page behavior:

- ROI page now calculates channel ROI from typed campaign records instead of static ROI rows.
- Supports channel, campaign, and date-range filters.
- KPI cards calculate total spend, attributed pipeline, blended ROI, and average CAC from filtered campaigns.
- ROI table aggregates spend, leads, CPL, MQL, CAC, pipeline, ROI, and campaign count by normalized channel.
- Export downloads the filtered channel ROI view as CSV.
- Send Report creates a local report-ready confirmation summary using the active filters.

Current Lead Sources page behavior:

- Lead Sources page now uses typed local `LeadSourceRecord` state instead of static source cards.
- Source records include normalized source key, source type, default UTM source/medium, owner, quality, lead/MQL/SQL/won counts, last-30 movement, status, and next action.
- Supports add, edit, archive/restore, search, type filter, status filter, CSV export, dynamic KPI cards, and validation.
- Validation blocks missing attribution fields, duplicate normalized source keys, and invalid funnel counts where Leads < MQL < SQL < Won.
- Source labels are normalized through `normalizedKey` to avoid free-text attribution drift before backend source APIs are wired.

### Administration

- `src/components/dashboard/administration/AdministrationHub.tsx`

Administration routes are dashboard views, not separate Next pages. `users`, `roles`, `logs`, `approvals`, and `settings` all render from the existing `AdministrationHub`; do not create duplicate page components for these menu items.

Current Administration Users behavior:

- The existing `UsersView` inside `AdministrationHub.tsx` is the single frontend user-management view.
- Uses typed user identity records with user ID, employee/external reference, name, official email, mobile, user type, role, team, designation, lifecycle status, MFA state, last login, active sessions, risk, access-review date, and timestamps.
- Supports invite, edit, search, status/risk filters, detail view, CSV export, suspend, reactivate, deactivate, and session revocation.
- New users start as `Invited` with MFA pending and no sessions; permanent deletion is intentionally unavailable so historical ownership and audit references remain intact.
- Validation blocks incomplete identities, invalid email/mobile, past review dates, duplicate employee ID/email/mobile, and Super Admin assignment to external users.
- The last active Super Admin cannot be suspended or deactivated.
- KPIs are derived from current user state for active users, MFA coverage, privileged users, and overdue access reviews.
- This remains local React state. Production backend must link users to the HRMS employee master or approved external identities, enforce unique identities and server-side RBAC/MFA, manage invitations and sessions, approve privileged role changes, and write immutable lifecycle/access audit events.

Current Administration Roles & Permissions behavior:

- The existing `RolesView` inside `AdministrationHub.tsx` is the single company-wide role-management view; no duplicate role page was created.
- Global roles define company module entry, allowed actions, data scope, sensitive-data scope, risk, lifecycle, assigned-user count, and access-review dates.
- Supports create, edit, effective-permission detail, search, status filter, protected-role handling, activation/deactivation, dynamic KPIs, and CSV matrix export.
- Validation requires module/action grants, View access, unique role names, future review dates, High risk for administrative authority, Administration module dependency for the Administer action, and non-Low risk for All Company scope.
- The protected Super Admin role cannot be renamed, weakened, or deactivated.
- Roles with assigned users cannot be deactivated until users are reassigned or suspended.
- Administration Roles grants entry to Accounting at the company level; detailed invoice/payment/tax/payroll actions and approval limits remain delegated to Accounting Access Control.
- Both screens are currently separate local React state. Production backend must expose one canonical role/policy service so Administration owns global roles and Accounting stores only scoped finance policy extensions against stable role IDs.

Current Administration System Audit Trail behavior:

- Administration menu label and page title were renamed from `Audit Logs` to `System Audit Trail` so it is clearly distinct from Accounting Audit Logs.
- The existing `logs` view inside `AdministrationHub.tsx` remains the single global system-event page; no duplicate component was created.
- Covers company-wide authentication, user lifecycle, role policy, security, exports, approvals, and cross-module administrative events.
- Typed events capture event/sequence IDs, trusted-time placeholder, actor ID/name/role, action, module, resource reference, session, masked IP, device, result, risk, reason, changed fields, and separate investigation metadata.
- Supports search, module/risk/investigation filters, dynamic KPIs, detailed event review, CSV export, forensic JSON export, and Flagged/Investigating/Resolved notes.
- Event facts have no edit or delete controls; investigation metadata updates do not rewrite the original event facts.
- Accounting Audit Logs remain finance-specific transaction evidence. Production backend should emit both global and module-scoped views from one immutable event service using stable event and resource references.
- Production requirements include append-only server storage, trusted server timestamps, authenticated session/device capture, IP handling, retention/legal hold, restricted export permissions, cryptographic integrity verification, and independent investigation audit history.

Current Administration Approval Center behavior:

- Administration menu label and page title were renamed from `Approvals` to `Approval Center` so it is distinct from Accounting Approvals.
- The existing `approvals` view inside `AdministrationHub.tsx` remains the single global-control approval page; no duplicate component was created.
- Covers global access changes, data exports, security exceptions, integrations, policy changes, and cross-module operational exceptions.
- Finance transaction decisions for invoices, expenses, payments, budgets, payroll, GST, and TDS remain exclusively in Accounting Approvals.
- Typed requests capture requester/role, owner and optional second approver, approval level, module/resource, status, priority/risk, SLA, reason, evidence references, data scope, and immutable-style decision history.
- Supports search, type/status filters, detail review, CSV export, approve/reject/clarification decisions, staged second approval, decision comments, evidence checks, separation-of-duties checks, dynamic KPIs, and overdue SLA visibility.
- Production backend must authenticate approvers, enforce maker-checker and role assignment server-side, create requests from source workflows, apply final decisions atomically, prevent duplicate decisions, and append all actions to System Audit Trail.

Current Administration Settings behavior:

- The existing `SettingsView` inside `AdministrationHub.tsx` is the single company-wide configuration page; configuration categories are schema-controlled instead of allowing arbitrary settings.
- Provides working configuration for Company Profile, Security Policy, Email & Notifications, Integrations, Data Governance, and Mobile Access.
- Company Profile validates required legal identity, Indian GSTIN/CIN, registered address, timezone, currency, and invoice prefix.
- Security validates MFA, password expiry, session timeout, login-attempt threshold, IP allowlist, and trusted-device duration.
- Notifications validate sender identity, SMTP host, alert channels, billing reminders, and escalation hours without storing SMTP credentials.
- Integrations manage enabled services, environment, HTTPS webhook URL, and mandatory signing for production webhooks without storing API keys or secrets.
- Governance controls audit retention, backup frequency, PII masking, export approval, legal hold, and archival duration.
- Mobile policy controls access, biometric/device-lock requirements, remote logout, offline access, and per-user device limits.
- Adds derived security/governance KPIs, review ownership/dates, search, JSON configuration export, validation, dynamic status badges, and local configuration change history.
- Passwords, API keys, private certificates, SMTP credentials, and webhook secrets are intentionally absent from frontend state.
- Production backend must provide typed configuration APIs, encrypted secret management, environment separation, maker-checker approval for critical changes, validation/versioning, rollback, immutable change events in System Audit Trail, and controlled propagation to dependent modules.

## Accounting Module

Main files:

- `src/components/dashboard/accounting/AccountingWizard.tsx`
- `src/components/dashboard/accounting/AccountingDashboard.tsx`
- `src/components/dashboard/accounting/AccountingComponents.tsx`
- `src/components/dashboard/accounting/AccessControlContext.tsx`
- `src/components/dashboard/accounting/Step1Clients.tsx` through `Step17BankDetails.tsx`

Accounting routes/modules are not separate Next routes. They are selected through dashboard `activeTab` and `ACCOUNTING_MODULES`.

### Accounting Module Map

Defined in `AccountingWizard.tsx`:

- `accounting-clients`: Client Master
- `accounting-vendors`: Vendor Master
- `accounting-quotations`: Quotations
- `accounting-invoices`: Invoices
- `accounting-payments`: Payments
- `accounting-reminders`: Reminders
- `accounting-credit-notes`: Credit Notes
- `accounting-expenses`: Sale/Purchase/Exp
- `accounting-budgets`: Budgets
- `accounting-salary`: Salary/Payroll
- `accounting-gst`: GST Mgmt
- `accounting-tds`: TDS Mgmt
- `accounting-reports`: Reports
- `accounting-approvals`: Approvals
- `accounting-audit-logs`: Audit Logs
- `accounting-access`: Access Control
- `accounting-bank-details`: Bank Details

### Accounting Production Audit Baseline

All accounting files from `AccountingDashboard.tsx`, shared components/access control, and `Step1Clients.tsx` through `Step17BankDetails.tsx` were reviewed together as one finance workflow.

Current architecture findings:

- The 17 module screens are routed correctly through `AccountingWizard`, but most modules own separate local arrays, so client/vendor/document/payment/tax/approval/report data is not yet a shared source of truth.
- Client and Vendor masters now support production-style local master-data management, but downstream live dropdown consumption is still pending until a shared accounting store/API is added.
- Quotations and Invoices calculate values, but client/quotation/project selections are hard-coded; send, save-draft, approval, acceptance, quotation-to-invoice conversion, numbering, and document export are not production workflows yet.
- Payments use a single mock invoice aggregate; invoice balance, duplicate UTR, overpayment, proof upload, bank reconciliation, TDS linkage, and client outstanding updates need shared records.
- Reminders, Credit Notes, Budgets, GST, TDS, Reports, Approvals, and Audit Logs display production intent but are largely isolated simulations and do not mutate the originating invoice/expense/budget/tax/approval records.
- Accounting Salary maintains a separate localStorage payroll register from HRMS payroll. These must become one payroll source with HRMS owning attendance/leave readiness and Accounting owning approval, bank release, ledger posting, and reconciliation.
- Bank Details is the main currently shared localStorage dependency for Quotations, Invoices, and Salary, but it lacks strict validation, masking, primary-account control, duplicate prevention, and delete protection for referenced accounts.
- `AccessControlContext` module access and the editable Access Control screen are separate datasets; creating a role in the screen does not change runtime authorization.
- Dashboard metrics and many report/compliance totals are static rather than derived from approved transactions.
- Several visible buttons are currently no-op UI, including multiple export/send/upload/search/bulk/policy/report actions.

Implementation priority:

1. Build shared typed accounting store/contracts for clients, vendors, quotations, invoices, payments, credit notes, expenses, budgets, payroll postings, GST/TDS, approvals, audit events, and bank accounts.
2. Productionize Client and Vendor masters because every downstream transaction depends on them.
3. Connect Lead/Project Agreement -> Quotation -> Approval -> Client Acceptance -> Invoice.
4. Connect Invoice -> Payment/TDS -> Outstanding -> Reminder -> Credit Note.
5. Connect Vendor/Expense/Payroll -> Budget -> Approval -> Payable/Bank -> GST/TDS.
6. Derive dashboard, reports, GST/TDS, approval queue, and audit logs from the shared transaction source instead of static arrays.
7. Replace localStorage/local state with backend APIs, immutable audit events, and server-enforced role permissions.

Code-health audit on June 24, 2026:

- Full accounting ESLint currently reports 66 errors and 45 warnings across legacy modules.
- Focused accounting TypeScript found and fixed two immediate blockers: `Step8Expenses.tsx` filename/import casing mismatch and invalid comma-operator JSX in the Reminders action icon.
- Remaining lint issues include loose `any` types, unused imports, unescaped JSX text, effect-driven derived state, and unsafe localStorage parsing. Fix these while productionizing each module rather than as behavior-free churn.

### Client Master

File: `src/components/dashboard/accounting/Step1Clients.tsx`

Current Client Master behavior:

- Uses typed `ClientRecord` local state with API-ready fields: company, contact, email, mobile, GSTIN, PAN, status, terms, address, currency, credit limit, outstanding amount, created/updated timestamps.
- Supports create, edit, archive, restore, search, status filter, GSTIN/PAN/name local lookup, CSV export, dynamic KPI cards, and table action buttons.
- Validation blocks invalid GSTIN, PAN, email, mobile, short legal/contact names, missing address, negative credit limit, and duplicate GSTIN/PAN/email/mobile across active local records.
- Outstanding amount and credit exposure are preserved as numeric data instead of display-only strings for future invoice/payment integration.
- This remains local React state. Backend phase should replace it with `GET/POST/PATCH /accounting/clients`, server-side duplicate checks, soft-delete audit events, and downstream consumption in Quotations, Invoices, Payments, TDS, Reminders, and Reports.

### Vendor Master

File: `src/components/dashboard/accounting/Step2Vendors.tsx`

Current Vendor Master behavior:

- Uses typed `VendorRecord` local state with API-ready vendor, contact, GSTIN, PAN, TDS, recurring monthly commitment, bank account, IFSC, address, status, and timestamp fields.
- Supports create, edit, archive, restore, search, status/category filters, CSV export, dynamic KPI cards, masked bank account display, and row action buttons.
- Validation blocks invalid optional GSTIN/PAN/email/mobile/IFSC/account number values, negative monthly commitment, incomplete bank detail combinations, and duplicate GSTIN/PAN/email/mobile/bank account across local records.
- Monthly commitment, GST input count, and bank verification metrics are derived from vendor state instead of hard-coded values.
- This remains local React state. Backend phase should replace it with `GET/POST/PATCH /accounting/vendors`, encrypted/masked bank storage, server duplicate checks, approval for payout-bank changes, and live usage in Expenses, GST input, Vendor TDS, Budgets, Approvals, and Bank payout flows.

### Quotation Management

File: `src/components/dashboard/accounting/Step3Quotations.tsx`

Current Quotation behavior:

- Uses typed `QuotationRecord` and line-item state with stable client/project/agreement IDs, numeric subtotal, discount, GST, grand total, currency, owner, status, and timestamps.
- Supports create, edit for Draft/Pending Approval records, save draft, submit for approval, approve, mark sent, mark client accepted, archive/restore, search, status filter, register CSV export, and individual quotation download.
- Lifecycle is controlled as `Draft -> Pending Approval -> Approved -> Sent -> Client Accepted`; client rejection and expiry are represented in the status model for backend workflow completion.
- Validation blocks missing client/project/scope/terms, project-client mismatch, invalid date ranges, empty or zero-value quotations, negative rates/discount, discount above subtotal, and GST outside 0-100.
- Client and project selectors display human-readable names while storing stable IDs. The current options are a local master snapshot; replace them with the shared Client Master, Projects, and Project Agreement store/API.
- Tax totals are derived during render and persisted as numeric values. Quotation line amounts are calculated from quantity and rate instead of trusting editable amount fields.
- Active treasury details are parsed safely from `crm_company_banks`; quotations can still be saved when bank details are unavailable, with the missing remittance state shown clearly.
- This remains local React state. Backend phase should persist through `GET/POST/PATCH /accounting/quotations`, server numbering, role-based approvals, immutable status history, PDF generation, email/WhatsApp delivery, client acceptance proof, and accepted-quotation conversion to Invoice.

### Access Control

Files:

- `src/components/dashboard/accounting/AccessControlContext.tsx`
- `src/components/dashboard/accounting/Step16Access.tsx`

Roles:

- Admin
- Director
- Finance Manager
- Accountant
- HR Manager
- Sales

`AccountingWizard` wraps selected accounting modules in:

```tsx
<AuthProvider>
  <ProtectedModule moduleId={selectedModule.id}>
    <SelectedComponent />
  </ProtectedModule>
</AuthProvider>
```

The Access Control screen now provides a typed RBAC policy workspace:

- Supports role creation and editing with unique names, responsibility descriptions, active/inactive lifecycle, structured accounting module grants, action grants, data scope, approval limit, audit access, and review dates.
- Enforces least-privilege checks: at least one module/action, positive approval limit for approvers, Audit Logs dependency for audit access, future review dates, and protected Access Control assignment.
- Protects the administrator policy from deactivation and keeps access administration restricted to the protected role.
- Provides search, status filtering, dynamic KPIs, effective-permission audit view, role activation/deactivation, and CSV matrix export.
- Clearly identifies the current page as a local policy prototype instead of falsely claiming server authorization has been changed.
- Production backend must own role/user assignments, API authorization, field/data-scope enforcement, maker-checker approval for privileged policy changes, session/token revocation, immutable audit events, and periodic access certification.
- `AccessControlContext` still uses its static demo role map. Connect it to the backend policy source when authenticated user/session APIs are introduced; client-side policy state must never be treated as a security boundary.

## Sale/Purchase/Expense Ledger

Main view file:

- `src/components/dashboard/accounting/Step8expenses.tsx`

Dialog file:

- `src/components/dashboard/accounting/LedgerEntryDialog.tsx`

Previous file name:

- `NewEntryDialog.tsx` was replaced/renamed to `LedgerEntryDialog.tsx`.
- A compatibility `NewEntryDialog.tsx` re-export is retained so older editor buffers/imports resolve to `LedgerEntryDialog` without duplicating implementation.

### Current UX Rules

- Main Ledger Register table is view-only.
- Add happens through `ADD NEW ENTRY`.
- Edit happens through the pencil button in main table Actions.
- Delete happens only inside the add/edit dialog.
- Delete has an `Are you sure?` confirmation panel.
- Main table has internal horizontal scroll and should not stretch/cut the dashboard page.

### Ledger Entry Data

Dialog-level fields in `LedgerEntryData`:

- `date`
- `voucherNo`
- `partyName`
- `category`
- `description`
- `purchase`
- `purchaseChecked`
- `sales`
- `salesChecked`
- `expenses`
- `expensesChecked`
- `slabPercent`
- `gstTreatment`: `Inclusive` or `Exclusive`

State-level `LedgerEntry` in `Step8expenses.tsx` adds:

- `id`
- `status`: `active` or `deleted`
- `createdBy`
- `updatedBy`
- `createdAt`
- `updatedAt`
- optional `deletedBy`
- optional `deletedAt`

### Calculations

- Currency is rendered with `INR = "\u20b9"` to avoid encoding breaking into `?`.
- `fmt(n)` formats as Indian currency with two decimals.
- PGST: calculated only if `purchaseChecked` is true.
- SGST: calculated only if `salesChecked` is true.
- TDS: calculated only if `expensesChecked` is true.
- `gstTreatment = "Exclusive"` calculates tax on top of the entered amount: `amount * rate / 100`.
- `gstTreatment = "Inclusive"` extracts tax already included in the entered amount: `amount * rate / (100 + rate)`.
- The selected GST basis is visible as a dedicated Ledger Register column and is included in create/update backend payloads.

### Validation

Implemented in `LedgerEntryDialog.tsx`:

- Description is required.
- At least one of purchase, sales, or expenses must be greater than 0.
- Amount cannot be negative.
- Slab percent must be 0 to 100.
- Slab percent must be greater than 0 when any purchase/sales/expense tax checkbox is enabled.

Note: current `onlyNums` strips negative signs, so negative validation is defensive.

### Permissions in Sale/Purchase/Exp

`Step8expenses.tsx` derives role from `useAuth()`.

Local action permissions:

- Admin: add, edit, delete
- Finance Manager: add, edit
- Accountant: add, edit
- HR Manager: add only
- Director: view only
- Sales: view only

### Soft Delete

Delete does not remove the entry from state. It marks:

- `status: "deleted"`
- `deletedAt`
- `deletedBy`
- `updatedAt`
- `updatedBy`

Visible rows are filtered by:

```ts
entries.filter(row => row.status === "active")
```

### Audit Trail

`Step8expenses.tsx` keeps local `auditLogs` state.

Actions logged:

- created
- updated
- deleted

The UI shows recent audit logs in an `Audit Trail` panel.

### Backend Sync Queue

`Step8expenses.tsx` keeps `pendingSyncs` state as a backend-ready queue.

Prepared endpoints:

- Create: `POST /accounting/ledger-entries`
- Update: `PUT /accounting/ledger-entries/:id`
- Delete: `PATCH /accounting/ledger-entries/:id`

This is not calling the backend yet. It prepares payloads and displays a `Backend Sync Queue` panel. Convert this to real calls using `src/lib/api-client.ts` when the backend endpoint is ready.

## Important UI Notes

- `AccountingComponents.tsx` has shared wrappers:
  - `AccountingPage`
  - `ActionButton`
  - `MetricCard`
  - `Panel`
  - `StatusBadge`
  - `Field`
  - `DataTable`
  - `ProgressBar`
  - `WorkflowSteps`
- Recent fix: `AccountingPage` and `Panel` now use `min-w-0`/`overflow-hidden` so wide tables remain contained.
- `Step8expenses.tsx` table has `minWidth: 1650` and is wrapped in `overflow-x-auto`.
- If UI changes do not appear, hard refresh browser with `Ctrl + Shift + R` or restart Next dev server.

## Known Issues / Watchouts

- `LeadHub.tsx` may still have escaped quote syntax corruption. Full project TypeScript may fail until that is fixed.
- Some older files may contain corrupted rupee text like `â‚¹` or `?`; prefer `"\u20b9"` in source.
- `src/app/dashboard/page.tsx` imports through `@/...`; direct single-file `tsc` checks may show alias errors if not using project config.
- Several modules still use local state and/or localStorage. Backend persistence is not globally wired.
- Some accounting modules are UI demos and may need production validation/audit/persistence like Step8.

## Recently Changed Files

- `src/components/dashboard/crm/ProjectAgreement.tsx`
  - Project Agreements page now has typed agreement records and clean zod/react-hook-form typing.
  - Added repository search, CSV export, dynamic total contract value, and per-agreement download action.
  - Client name entry now supports both existing client selection and manual new-client entry.
- Focused ESLint and targeted TypeScript checks pass for this file.

### Invoice Management

`src/components/dashboard/accounting/Step4Invoices.tsx` is now a typed operational invoice register instead of a create-only UI demo.

- Supports accepted-quotation conversion and direct/milestone billing.
- Billing source is an explicit two-mode control. Direct invoice is the default and does not require a quotation; quotation mode only lists client-accepted quotations without an active invoice.
- Payment terms support Due on Receipt, Net 7/15/30 auto-calculation, and a Custom / Manual mode with a manually selected due date and required buyer-facing payment condition.
- Stores stable client, project, and quotation IDs with display names.
- Prevents duplicate active invoices against the same accepted quotation.
- Validates project ownership, quotation linkage, invoice/due dates, positive values, and discount limits.
- Calculates taxable value, GST, and invoice total from the selected GST type; exempt invoices use zero GST.
- Supports draft save, approval submission, approval, send-to-client, archive/restore, download, search, status/payment filters, and CSV export.
- Tracks numeric amount paid, outstanding balance, derived payment state, overdue state, and dynamic billing KPIs.
- Locks commercial edits once an invoice is sent or has a receipt.
- Loads treasury details safely for buyer-facing remittance information.
- Current quotation/client/project data remains a local typed snapshot until the shared accounting store or backend API is implemented.

### Payment Tracking

`src/components/dashboard/accounting/Step5Payments.tsx` is now a typed collection and reconciliation register.

- Supports invoice-linked receipts and client advance/unallocated receipts.
- Uses numeric invoice receivable snapshots with cash received, TDS adjusted, and outstanding balances.
- Validates invoice/client ownership, positive amounts, TDS references, duplicate payment references, and overpayments.
- Invoice-linked receipts immediately update the local invoice outstanding; reversing an unreconciled receipt restores the balance.
- Tracks payment date, mode, UTR/reference, receiving bank account, proof filename, TDS claim reference, remarks, recorder, and timestamps.
- Supports Received -> Verified -> Reconciled control flow. Reconciled receipts are locked from reversal.
- Adds receipt download, CSV export, search, allocation/status filters, recovery KPIs, invoice progress, and a pending control queue.
- Collection Progress and Control Queue use contained vertical scrolling when their lists grow, so the accounting dashboard does not expand indefinitely.

### Payment Reminder System

`src/components/dashboard/accounting/Step6Reminders.tsx` is now a typed invoice collection reminder queue.

- Reminder targets come from outstanding invoice snapshots with client, project, due date, contact, and numeric outstanding data.
- Supports pre-due, due-date, overdue, escalation, and custom-date rules with schedule dates calculated from invoice due dates.
- Supports Email, WhatsApp, combined delivery, phone call tasks, and director escalation with channel-specific recipient validation.
- Prefills editable recipient, CC, subject, and reminder message from the selected invoice.
- Prevents duplicate active reminders for the same invoice, rule, channel, and schedule date.
- Supports schedule, send now, mark delivered, retry/send, snooze for three days, escalate, cancel, delivery log view, log download, CSV export, search, and filters.
- Stores attempt count, last sent time, next action, creator, timestamps, internal note, and delivery events for audit readiness.
- Reminder Rules and Action Queue use contained vertical scrolling for large lists.
- Communication delivery is currently simulated in local state. Production requires shared invoice/payment state plus email/WhatsApp provider APIs and server-side job scheduling.

### Credit Note Management

`src/components/dashboard/accounting/Step7CreditNotes.tsx` is now a typed invoice correction and settlement register.

- Credit notes must link to an existing approved/sent invoice; client, project, currency, invoice value, collections, and outstanding are derived from that invoice.
- Supports scope reduction, billing/rate/GST corrections, cancellation, quality dispute, and refund reasons.
- Supports three dispositions: reduce invoice outstanding, create customer refund liability, or preserve future client credit.
- Calculates base credit, GST reversal, and total credit numerically.
- Prevents credits above the remaining invoice value, outstanding adjustments above current outstanding, refunds above cash received, invalid issue dates, and inappropriate GST rates.
- Existing active credit notes reduce the available credit limit for the invoice.
- Supports Draft -> Pending Approval -> Approved -> Issued, plus reject/archive, editing before issue, download, CSV export, search, and filters.
- Ledger impact is posted in local record fields only when an approved credit note is issued.
- Production backend must atomically update the invoice receivable, refund/client-credit ledger, GST sales-return register, approval audit, and immutable document number.

### Budget Management

`src/components/dashboard/accounting/Step9Budgets.tsx` is now a typed budget planning and spend-control register.

- Supports department and project budget scopes with category, financial year, period, owner, and cost center.
- Stores allocation, contingency reserve, alert threshold, and block threshold as numeric data.
- Actual and committed spend are derived from typed expense/procurement/payroll snapshots instead of being manually editable.
- Prevents duplicate active budgets for the same scope/category/FY, invalid periods, project/department mismatch, and block thresholds below alert thresholds.
- Supports Draft -> Pending Approval -> Active, reject/archive, controlled editing before activation, and close/reopen state support.
- Active budget changes use a separate revision request with reason, pending approval, and protection against reducing below actual plus committed spend.
- Tracks revision history with previous/revised values, requester, approver, timestamps, and decision.
- Adds utilization health, available balance, alert/block controls, dynamic KPIs, search, FY/status filters, and CSV export.
- Production backend must connect approved expenses, purchase commitments, payroll postings, approval blocks, and immutable revision audit to the shared budget ledger.

### Accounting Salary & Payroll

`src/components/dashboard/accounting/Step10Salary.tsx` is now a typed finance payroll and payout register.

- Uses stable employee IDs and HRMS readiness snapshots for attendance/leave and employee bank readiness.
- Enforces one payroll record per employee/month, valid working/payable days, positive gross pay, and deductions not exceeding gross.
- Prorates fixed earnings by payable days and records LOP days/deduction, bonus, reimbursement, PF, PT, TDS, advance recovery, gross, deductions, and net payable numerically.
- Preserves exact salary components during edit instead of reconstructing them from display totals.
- Supports Draft -> HR Review -> Finance Review -> Approved -> Paid, plus Hold and controlled release.
- Non-ready HRMS payroll is automatically held; paid/approved records cannot be commercially edited or deleted.
- Payment release requires a transaction reference for non-cash methods and records paid timestamp.
- Adds safe treasury account loading, salary-sheet CSV export, payslip download, search, month/status filters, and dynamic payroll KPIs.
- Production must replace the local employee/readiness snapshot with the shared HRMS payroll source and atomically post approved payroll to budget, payable, bank, PF/PT/TDS, and general ledger services.

### TDS Management

`src/components/dashboard/accounting/Step12TDS.tsx` is now a typed source-linked TDS compliance register.

- Supports client TDS receivable, vendor TDS payable, and employee salary TDS.
- Source options are derived from current payment/invoice, vendor-expense, and payroll model snapshots; party ID/name, taxable base, section, rate, date, and period are prefilled.
- Tracks statutory section, taxable amount, rate, TDS amount, deduction date, deposit due date, return period, lower/nil deduction certificate, challan, return acknowledgement, certificate, and status numerically/structurally.
- Prevents duplicate active TDS records for one source, source/type mismatch, invalid dates/rates, and missing custom section details.
- Client TDS verifies into receivable adjustment; vendor/salary TDS verifies into statutory payable.
- Supports Draft, Adjusted/Payable, Deposited, Filed, Closed, Mismatch, and Reversed states with compliance update controls.
- Closure requires relevant return/certificate completion; payable TDS compliance requires challan number and deposit date.
- Adds source/type/status search and filters, dynamic client/payable/salary/certificate KPIs, CSV export, and downloadable TDS record.
- Production backend must derive legal rates/due dates from effective tax rules and atomically connect payment reconciliation, vendor payables, payroll, challans, quarterly returns, certificates, and general ledger posting.

### GST Management

`src/components/dashboard/accounting/Step11GST.tsx` is now a typed document-driven GST return and reconciliation register.

- Output liability is derived from approved sales invoices and reduced by issued credit-note GST reversals.
- Input tax credit is derived from verified purchase/expense documents and separated into eligible, ineligible, and pending ITC based on document status, GSTIN, and eligibility.
- GSTR-1 taxable/output declarations and GSTR-3B output/ITC claims are reconciled against document aggregates.
- Tracks IGST/CGST/SGST, taxable sales, credit reversals, inward taxable value, cash ledger use, net cash payable, due date, preparer, approver, ARN, and filed timestamp numerically.
- Prevents duplicate active returns for one period and automatically marks review submissions as mismatch when declared figures differ from source data.
- Supports Working -> Ready for Review -> Approved -> Filed, plus mismatch/reopen-compatible editing and filing ARN validation.
- Adds document-register and return-register CSV exports, filing summary download, search/status filters, and dynamic liability/ITC/mismatch KPIs.
- Production backend must lock source documents by return period and integrate GSTR-1, GSTR-2B, GSTR-3B, electronic credit/cash ledgers, challans, ARN, amendments, and immutable filing audit.

### Reports & Analytics

`src/components/dashboard/accounting/Step13Reports.tsx` is now a typed accounting reporting layer instead of a static/fake report library.

- Report data is derived from invoice, payment, expense, payroll, GST, TDS, and budget model snapshots.
- Supports income/collections, expenses, P&L, cash flow, outstanding, aging, budget utilization, GST, TDS, and payroll reports.
- Custom report scope includes period, department, and optional date range with date validation.
- Generated reports contain actual columns, rows, row count, total, owner, generation timestamp, and immutable run scope.
- Adds live report preview, CSV download per report, searchable run history, one-click report presets, and executive pack export.
- KPI cards and aging buckets are calculated from current transaction data instead of hard-coded display values.
- Production backend should execute report queries against shared accounting ledgers, persist report-run metadata, enforce data access permissions, and support server-generated Excel/PDF artifacts.

### Approval Matrix & Workflow

`src/components/dashboard/accounting/Step14Approvals.tsx` is now a typed role-aware accounting approval control queue.

- Consolidates quotation, invoice, expense, payment, credit note, budget/revision, payroll, GST, and TDS approval requests.
- Policies route by module and amount range with primary/secondary approver roles and SLA hours.
- Policy creation validates amount ranges, blocks overlapping active rules, and requires different first/second approver roles.
- Decisions use the authenticated accounting role; users cannot manually impersonate an approver role.
- Separation of duties blocks a requester role from approving its own request.
- Supports multi-level approval, approve, reject, clarification, hold, decision comments, SLA due time, risk, budget, duplicate, and compliance checks.
- Completed requests cannot be re-decided; every decision appends actor, role, timestamp, action, and comment history.
- Bulk approval is restricted to selected low-risk, single-level requests assigned to the current role.
- Adds my-queue/module/status filters, search, queue export, policy list, dynamic SLA/high-risk/director/rejection KPIs, and view-only handling.
- Production backend must create approval requests from source module status transitions and atomically apply final decisions back to quotations, invoices, expenses, payroll, budgets, GST/TDS, and immutable audit logs.

### Security & Activity Audit Logs

`src/components/dashboard/accounting/Step15AuditLogs.tsx` is now a typed forensic accounting event register.

- Captures actor/user ID, role, module, action, record, request, session, IP, user agent, timestamp, structured before/after snapshots, changed fields, and reason.
- Events are displayed as append-only facts; no delete or fact-edit controls are exposed.
- Adds deterministic sequence and previous-hash chaining with an integrity verification KPI.
- Supports severity and separate investigation metadata states: Clear, Flagged, Investigating, and Resolved.
- Investigation updates do not alter original event facts or hash inputs.
- Adds quick search plus module/action/severity/investigation/role/date filters with date-range validation.
- Adds CSV audit export, full forensic JSON export, detailed event preview, structured change comparison, and hash metadata.
- Dynamic KPIs show event count, authenticated sessions, integrity result, open flags, and critical events.
- Production backend must enforce append-only server storage, cryptographic signing/hash chaining, trusted server timestamps, authenticated session/IP/device capture, retention policy, restricted investigation permissions, and independent audit export verification.

### Bank Account Management

`src/components/dashboard/accounting/Step17BankDetails.tsx` now provides a typed treasury bank register.

- Preserves the existing `crm_company_banks` and `crm_client_banks` localStorage contracts while safely parsing and migrating older records.
- Supports company and client accounts with entity reference, beneficiary, account/IFSC, branch, account type, purpose, lifecycle status, verification state, primary flag, verification note, and timestamps.
- Validates required fields, 6-18 digit account numbers, account confirmation, Indian IFSC format, and duplicate account-number/IFSC combinations across both registers.
- Masks account numbers in tables, detail views, KPIs, and CSV exports.
- New accounts start as Pending; sensitive beneficiary/account/IFSC edits reset verification and remove primary status.
- Only active verified accounts can become primary. A primary account cannot be deactivated until another verified account is assigned.
- Hard delete was removed. Accounts use active/inactive lifecycle so referenced quotations, invoices, payroll runs, and audit history retain their bank reference.
- Adds search, lifecycle filtering, masked CSV export, verification decisions with notes, effective detail view, dynamic KPIs, and safe localStorage hydration that does not overwrite saved data on first render.
- Quotations, Invoices, and Accounting Payroll now prefer the active verified primary treasury account, then fall back to another active verified account.
- Production backend must encrypt bank data at rest, tokenize account references, enforce field-level permissions, require separate maker/checker actors, revoke prior approval after sensitive edits, retain immutable change history, and block archive/update when settlement workflows require it.

- `src/components/dashboard/crm/ClientsContacts.tsx`
  - Clients & Contacts page converted from static account cards into usable frontend state.
  - Added local account state, search, add client form, add contact form, CSV export, live client/contact counters, and contact call/WhatsApp/email links.
  - Focused ESLint and targeted TypeScript checks pass for this file.

- `src/components/dashboard/crm/FollowUps.tsx`
  - Follow-ups page converted from mostly static UI into usable frontend state.
  - Added local follow-up list state, activity log state, search, status filters, CSV export, new follow-up form, mark-done action, and quick log flow.
  - Focused ESLint and targeted TypeScript checks pass for this file.

- `src/components/dashboard/leads/LeadWizard.tsx`
  - Random lead ID generation replaced with a stable draft helper.
  - Lead list now uses typed `LeadRecord` data.
  - Mock lead completion flow now updates state without render-time impurity.

- `src/components/dashboard/leads/Step1LeadInfo.tsx`
  - Removed unused imports and `any` casts.
  - Added typed lead step props.

- `src/components/dashboard/leads/Step3FollowUp.tsx`
  - Added typed follow-up records.
  - Local follow-up creation now stays typed for future API parity.

- `src/components/dashboard/leads/Step4Proposal.tsx`
  - Cleaned corrupted text rendering in proposal history.

- `src/components/dashboard/leads/Step5Approval.tsx`
  - Rewritten as a typed approval step with cleaned imports and JSX.

- `src/components/dashboard/leads/Step6LeadStatus.tsx`
  - Rewritten as a typed closure/status step with cleaned imports and conditional panels.

- `PROJECT_VALIDATION.md`
  - Production validation/audit file for all dashboard modules and pages.
  - Includes dashboard connection map, backend API requirements, cross-module flow, do-not-break rules, and backend priority order.

- `src/components/dashboard/accounting/LedgerEntryDialog.tsx`
  - New add/edit table modal.
  - Validation.
  - Delete confirmation.
  - Delete action only in edit mode.

- `src/components/dashboard/accounting/Step8expenses.tsx`
  - Main table view-only.
  - Add/edit through dialog.
  - Soft delete.
  - Audit trail.
  - Backend sync queue.
  - Role-based action permissions.
  - Production ledger metadata.
  - Additive production validation now requires date, unique reference, party, category, description, valid category amount, two-decimal precision, and valid tax-checkbox/amount combinations without changing the existing ledger format or records.
  - Added CSV export for the active sales, purchase, expense, GST, and TDS register.
  - The visible `Slab %` label is now `GST/TDS %`; the existing `slabPercent` payload key remains unchanged for backward compatibility.

- `src/components/dashboard/accounting/AccountingComponents.tsx`
  - Layout containment fixes for accounting pages/panels.

- `src/app/dashboard/page.tsx`
  - Dashboard wrapper/header/main layout fixes for wide accounting content.
  - Dashboard overview redesigned into a company command center with KPIs, health signals, alerts, pipeline, department watchlist, and activity feed.

- `src/components/dashboard/marketing/MarketingHub.tsx`
  - Campaigns page converted from static reporting table into usable local-state CRM flow.
  - Added campaign create/edit/archive/restore, search, channel/status filters, CSV export, dynamic metrics, validation, and API-ready campaign data shape.
  - Marketing ROI page now aggregates from campaign records with channel/campaign/date filters, CSV export, report summary, dynamic KPIs, funnel snapshot, and backend-ready calculations.
  - Lead Sources page converted from static cards into usable source attribution flow with add/edit/archive/restore, normalized keys, UTM defaults, search/type/status filters, CSV export, dynamic source metrics, and validation.
  - Focused ESLint and targeted TypeScript checks pass for this file.

- `src/components/dashboard/projects/ProjectHub.tsx`
  - Projects portfolio page converted from basic local table into usable project CRM flow.
  - Added typed project metadata, add/edit/archive/restore, search/status/health filters, CSV export, dynamic KPIs, known-client/manual-client support, source lead linkage, billing status metadata, validation, and cleaned focused lint blockers.
  - Team Tracking page converted from basic add-member table into usable allocation flow with employee IDs, controlled employee directory, add/edit/complete/remove, search/project/status filters, CSV export, assignment KPIs, and validation.
  - Tasks page converted from read-only task list into usable task tracker with create/edit/complete/remove, project/status/priority filters, CSV export, task KPIs, owner linkage, comments, attachment references, history entries, and validation.
  - Milestones page converted from static cards into usable milestone control board with create/edit/archive/complete, project/status/billing filters, CSV export, milestone KPIs, validation, completion state updates, and backend-ready billing event queue.
  - Deadlines page converted from static critical-target rows into dedicated deadline board with derived project/milestone/task deadlines, manual deadline CRUD, resolve/archive actions, filters, CSV export, KPI cards, source linkage, and validation.
  - Focused ESLint and targeted TypeScript checks pass for this file.

- `src/components/dashboard/projects/performance/EmployeePerformance.tsx`
  - Employee Performance converted from static directory/detail drawer into usable review management flow with create/edit/archive, filters, CSV export, dynamic metrics, review stages, score validation, OKRs, feedback, career readiness, attrition risk, training recommendations, and backend-ready record shape.
  - Focused ESLint and targeted TypeScript checks pass for this file.

- `src/components/dashboard/hrms/HRMSHub.tsx`
  - HRMS validated and rebuilt into typed production-style flows for employee master, attendance regularization/approval/payroll readiness, leave approvals, payroll register, and exit lifecycle.
  - Fixed broken `EditEmployee` reference, replaced attendance placeholder, made export/filter/header actions functional, added validations, linked offboarding to employee status and exit cases, and removed no-op payroll state.

- `src/components/dashboard/hrms/PayrollView.tsx`
  - Cleaned standalone payroll compatibility view with typed records, aggregate KPIs, CSV export, approve action, and passing focused lint/type checks.

- `src/components/dashboard/onboarding/OnboardingWizard.tsx`
  - Onboarding wizard converted from free-step prototype into gated production-style flow with typed state, step validation, document upload tracking, verification dependency, persisted training checklist, approval gate, and final submit guard.

- `src/components/dashboard/onboarding/Step2Employment.tsx`
  - Fixed broken `officialEmail` field name so official email actually writes to onboarding state and participates in validation.

- `src/components/dashboard/onboarding/Step3Documents.tsx`, `Step4Verification.tsx`, `Step5Training.tsx`, `Step6Approval.tsx`
  - Connected documents/training/approvals to wizard state instead of local throwaway or fake static data; focused ESLint and isolated onboarding TypeScript checks pass.

## Suggested Next Work

1. Use `PROJECT_VALIDATION.md` to finalize backend stack, database schema, and endpoint contracts.
2. Fix `LeadHub.tsx` syntax corruption so full TypeScript can pass.
3. Start backend/API with auth/session/user roles, then master data, then accounting ledger/invoices/payments.
4. Replace `Backend Sync Queue` with real `api.post/put/patch` calls.
5. Move ledger types and helpers into separate files when backend work begins.
6. Add loading/error states for save/delete.
7. Add pagination or dense filtering for the ledger table.
8. Add server-side audit trail once backend is available.
9. Persist role/user from actual auth instead of demo context state.
