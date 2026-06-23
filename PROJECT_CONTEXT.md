# CRM Panel Project Context

Last updated: 2026-06-23

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

### Access Control

File: `src/components/dashboard/accounting/AccessControlContext.tsx`

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

## Sale/Purchase/Expense Ledger

Main view file:

- `src/components/dashboard/accounting/Step8expenses.tsx`

Dialog file:

- `src/components/dashboard/accounting/LedgerEntryDialog.tsx`

Previous file name:

- `NewEntryDialog.tsx` was replaced/renamed to `LedgerEntryDialog.tsx`.

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

### Validation

Implemented in `LedgerEntryDialog.tsx`:

- Description is required.
- At least one of purchase, sales, or expenses must be greater than 0.
- Amount cannot be negative.
- Slab percent must be 0 to 100.

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
- `Step8expenses.tsx` table has `minWidth: 1540` and is wrapped in `overflow-x-auto`.
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
