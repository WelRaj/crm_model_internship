# DeMatade Algo Operations Panel Project Information

Last updated: 2026-07-07

## 1. Project Summary

This project is a frontend operations panel for DeMatade Algo Technology Solutions Pvt Ltd, a Navi Mumbai-based fintech and software company focused on algorithmic trading, strategy automation, and trading software solutions.

The dashboard brings Client Operations, Lead Desk, Delivery Projects, People Operations, Finance Control, Growth Marketing, Admin Control, and Support Desk workflows into one frontend shell.

The application is currently a frontend-first implementation. Most modules use React state, static seed data, or browser storage as temporary data sources. A backend API client exists, but most business screens are not yet connected to real backend endpoints.

Primary objective:

- Provide a production-style business operations dashboard experience.
- Keep all major company workflows visible and testable from the frontend.
- Prepare module structures, forms, validations, and state shapes for later backend integration.

## 2. Technology Stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16.2.7 App Router |
| UI Runtime | React 19.2.4 |
| Language | TypeScript |
| Styling | Tailwind CSS 3.4.1 |
| Validation | Zod |
| Forms | React Hook Form |
| Icons | lucide-react |
| API Helper | Fetch-based helper in `src/lib/api-client.ts` |
| Package Manager | npm |

Important project instruction:

- This is a newer Next.js version. Read relevant documentation under `node_modules/next/dist/docs/` before changing Next.js app/router behavior.

## 3. Repository Language Breakdown

Based on current tracked project file types, excluding `node_modules`, `.next`, and `.git`:

| Type | Files | Approx Share |
| --- | ---: | ---: |
| TSX | 65 | 73.0% |
| Markdown | 8 | 9.0% |
| SVG | 5 | 5.6% |
| JSON | 3 | 3.4% |
| JavaScript | 3 | 3.4% |
| TypeScript | 2 | 2.2% |
| CSS | 1 | 1.1% |
| ICO | 1 | 1.1% |
| MJS | 1 | 1.1% |

Main knowledge required to understand and debug this project:

- TypeScript and React component state.
- Next.js App Router structure.
- Tailwind CSS layout and responsive classes.
- React Hook Form and Zod validation.
- Business workflows for Client Operations, Lead Desk, Delivery Projects, People Operations, Finance Control, Growth Marketing, Admin Control, and Support Desk.

## 4. Core Commands

```bash
npm run dev
npm run build
npm run lint
npx tsc --noEmit
```

Development server:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

## 5. Environment and API

API helper:

- `src/lib/api-client.ts`

Default API base URL:

```text
http://localhost:8000/api
```

Override with:

```text
NEXT_PUBLIC_API_URL
```

Current API status:

- The helper supports `get`, `post`, `put`, and `delete`.
- Most modules still use frontend state or seed data.
- Backend should later replace local state, static arrays, and localStorage usage.

## 6. Top-Level File Map

| Path | Purpose |
| --- | --- |
| `package.json` | npm scripts and dependencies |
| `next.config.js` | Next.js configuration |
| `tailwind.config.js` | Tailwind theme and content paths |
| `postcss.config.js` | PostCSS configuration |
| `eslint.config.mjs` | ESLint configuration |
| `tsconfig.json` | TypeScript configuration |
| `README.md` | Default Next.js readme |
| `PROJECT_CONTEXT.md` | Historical project context and working notes |
| `PROJECT_GUIDE.md` | Existing architecture guide, partly outdated and has encoding issues |
| `PROJECT_STRUCTURE.md` | Existing structure summary |
| `PROJECT_VALIDATION.md` | Backend and production validation notes |
| `PROJECTINFO.md` | Current master project information file |
| `AGENTS.md` | Local agent rules |
| `CLAUDE.md` | Additional project notes |

## 7. App Routes

| Route | File | Purpose |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Public entry page with Sign In and Sign Up links |
| `/auth/signin` | `src/app/auth/signin/page.tsx` | Sign-in page |
| `/auth/signup` | `src/app/auth/signup/page.tsx` | Sign-up page |
| `/dashboard` | `src/app/dashboard/page.tsx` | Main operations dashboard shell |

Root layout:

- `src/app/layout.tsx`
- Sets app metadata and global body wrapper.

Global CSS:

- `src/app/globals.css`
- Imports Tailwind and global application styling.

## 8. Authentication Area

Files:

- `src/components/auth/SigninForm.tsx`
- `src/components/auth/SignupForm.tsx`
- `src/components/auth/IndianMobileInput.tsx`
- `src/app/auth/signin/page.tsx`
- `src/app/auth/signup/page.tsx`

Current behavior:

- Sign-in uses Indian mobile number validation.
- Sign-in has a phone step and OTP step.
- OTP verification is simulated in frontend state.
- Successful sign-in redirects to `/dashboard`.
- Sign-up collects first name, last name, email, mobile number, and department category.
- Sign-up also simulates OTP verification.

Important functions:

- `normalizeIndianMobile(input)`
- `isValidIndianMobile(value)`

Production backend requirements:

- `POST /auth/signin/otp/send`
- `POST /auth/signin/otp/verify`
- `POST /auth/signup`
- `GET /auth/me`
- `POST /auth/logout`
- `POST /auth/refresh`

## 9. UI Components

Files:

- `src/components/ui/Button.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/Select.tsx`

Purpose:

- Shared UI primitives for auth and general form usage.
- Dashboard modules also use custom finance shared components for denser operational screens.

Finance shared UI:

- `src/components/dashboard/accounting/AccountingComponents.tsx`

Exports:

- `AccountingPage` legacy component name used for finance-style page layout
- `ActionButton`
- `MetricCard`
- `Panel`
- `StatusBadge`
- `Field`
- `DataTable`
- `ProgressBar`
- `WorkflowSteps`

## 10. Dashboard Shell

Main file:

- `src/app/dashboard/page.tsx`

Responsibilities:

- Owns `activeTab`.
- Owns sidebar visibility.
- Renders the fixed sidebar.
- Renders the sticky header.
- Renders notification dropdown.
- Renders profile dropdown and profile drawer.
- Switches dashboard content by active tab.
- Connects high-level module navigation.

Main dashboard modules:

- Main
- Client Operations
- Lead Desk
- Growth Marketing
- Delivery Projects
- People Operations
- Finance Control
- Admin Control
- Support Desk

Dashboard overview:

- Shows operations command center cards.
- Shows quick module buttons.
- Uses static KPI values for now.

Profile drawer:

- Displays current user details.
- Supports frontend edit profile.
- Supports change password with current password plus email OTP.
- Supports forgot current password using email OTP.
- OTP is frontend-simulated until backend is connected.

Profile details currently shown:

- Profile initials
- Full name
- Employee ID
- Designation
- Department
- Official email
- Mobile number
- Role
- Employee status
- Reporting manager
- Date of joining
- Office location
- Employment type
- Username
- Last login

Password security behavior:

- Strong password rule requires uppercase, lowercase, number, special character, and at least 8 characters.
- OTP is required before update.
- Three wrong OTP attempts are allowed before resend is required.
- Success messages indicate other sessions should be logged out.

Backend requirement:

- Replace the demo profile object with authenticated session user data.
- Replace frontend OTP simulation with backend email OTP send and verify APIs.

## 11. Dashboard Tab Routing Map

| Tab ID | Rendered Component |
| --- | --- |
| `overview` | `DashboardOverview` |
| `leads` | `LeadHub` |
| `lead-assign` | `LeadAssign` |
| `telecaller` | `TelecallerDesk` / Calling Desk |
| `followups` | `FollowUps` |
| `lead-outcomes` | `LeadOutcomes` |
| `clients` | `ClientsContacts` |
| `agreements` | `ProjectAgreement` |
| `onboarding` | `OnboardingWizard` |
| `employees` | `HRMSHub activeView="employees"` / Employee Directory |
| `attendance` | `HRMSHub activeView="attendance"` |
| `leave` | `HRMSHub activeView="leave"` / Leave Management |
| `payroll` | `HRMSHub activeView="payroll"` |
| `exit` | `HRMSHub activeView="exit"` / Exit Process |
| `accounting` | `AccountingWizard` / Finance Overview |
| `accounting-*` | Finance Control module from `ACCOUNTING_MODULES` |
| `campaigns` | `MarketingHub activeView="campaigns"` |
| `roi` | `MarketingHub activeView="roi"` |
| `sources` | `MarketingHub activeView="sources"` / Acquisition Sources |
| `projects` | `ProjectHub activeView="projects"` |
| `team-tracking` | `ProjectHub activeView="team-tracking"` |
| `tasks` | `ProjectHub activeView="tasks"` |
| `milestones` | `ProjectHub activeView="milestones"` |
| `deadlines` | `ProjectHub activeView="deadlines"` |
| `performance` | `EmployeePerformance` |
| `users` | `AdministrationHub activeView="users"` / User Management |
| `roles` | `AdministrationHub activeView="roles"` / Role Permissions |
| `logs` | `AdministrationHub activeView="logs"` |
| `approvals` | `AdministrationHub activeView="approvals"` |
| `settings` | `AdministrationHub activeView="settings"` / System Settings |
| `support` | `SupportHub` / Support Desk |

## 12. Leads Module

Folder:

- `src/components/dashboard/leads`

Files:

- `LeadHub.tsx`
- `ProjectLeadStepWizard.tsx`
- `TradingLeadCreate.tsx`
- `Step1LeadInfo.tsx`
- `Step2Requirements.tsx`
- `Step3FollowUp.tsx`
- `Step4Proposal.tsx`
- `Step5Approval.tsx`
- `Step6LeadStatus.tsx`
- `leadTypes.ts`

Primary purpose:

- Create project leads and trading/calling leads.
- Show created project and trading leads in one lead view table.
- Capture lead source, client details, project requirements, follow-ups, proposals, approvals, and final outcome.

Key data types:

- `LeadDepartment`
- `LeadRole`
- `TelecallerId`
- `LeadSource`
- `TradingLeadStatus`
- `ProjectLeadStatus`
- `BaseLead`
- `TradingLead`
- `ProjectLead`
- `LeadDraft`
- `LeadRecord`

Seed data:

- `projectLeadSeedData`
- `tradingLeadSeedData`
- `telecallers`
- `leadSourceOptions`

Project lead workflow:

1. Lead information.
2. Requirements and budget.
3. Follow-up history.
4. Proposal details and PDF upload field.
5. Management approval.
6. Final lead status.

Recent production validation behavior:

- Future-step navigation is gated.
- Required fields are enforced before moving forward.
- Lead source, owner, mobile, city, state, and country are required.
- Other Social Media requires source detail.
- Mobile fields validate 10 digits.
- Service, project type, platform, timeline, description, and payment mode are required.
- Budget values must be positive.
- Max budget cannot be less than min budget.
- Follow-up remarks and date are preserved in the lead draft.
- Proposal number, proposal date, and amount are required.
- Approval reviewer, decision, and comments are required.
- Won status requires final value and close date.
- Lost status requires loss reason.
- Competitor name is stored when entered.

Trading lead workflow:

- Captures customer name, mobile, email, source, telecaller assignment, issue type, account status, availability, call status, trading interest, budget, experience, risk appetite, KYC status, demat status, follow-up date, and call note.

Trading lead validation:

- First name, mobile, trading interest, follow-up date, and call note are required.
- Mobile must be 10 digits.
- Email must be valid if entered.
- Other Social Media requires source detail.
- Investment budget cannot be negative.

Backend requirements:

- Leads CRUD.
- Lead assignment.
- Follow-up logging.
- Proposal file storage.
- Approval workflow.
- Lead conversion history.
- Duplicate lead detection by phone, email, and company.

## 13. Client Operations Module

Folder:

- `src/components/dashboard/crm`

Files:

- `LeadAssign.tsx`
- `TelecallerDesk.tsx` (Calling Desk)
- `FollowUps.tsx`
- `LeadOutcomes.tsx`
- `ClientsContacts.tsx`
- `ProjectAgreement.tsx`

### Lead Assignment

File:

- `LeadAssign.tsx`

Purpose:

- Assign created project and trading leads to calling owners.
- Show assignment queue, team leader action panel, calling owner capacity, and assignment history.

Features:

- Waiting, assigned, reassigned, escalated, and done statuses.
- Priority levels.
- Follow-up date.
- Team leader assignment.
- Calling owner lookup by name, owner ID, or employee ID.
- Activity list.
- CSV export.

### Calling Desk

File:

- `TelecallerDesk.tsx`

Purpose:

- Operational calling desk for calling owner work.
- Uses project and trading lead seed data to create a work queue.

Features:

- Call status and issue status tracking.
- Lead type distinction.
- Customer contact and note tracking.
- Work queue for telecaller productivity.

### Follow-ups

File:

- `FollowUps.tsx`

Purpose:

- Manage due, overdue, scheduled, no-response, and done follow-ups.

Features:

- Filters by status.
- Search by lead, phone, telecaller, and source.
- Quick log for selected follow-up.
- CSV export.
- Metrics for due today, overdue, scheduled, and done.

### Lead Outcomes

File:

- `LeadOutcomes.tsx`

Purpose:

- Show final and not-final lead outcomes after conversation or decision.

Features:

- Final and not-final filters.
- Search.
- CSV export.
- Outcome reason and next step.

### Clients and Contacts

File:

- `ClientsContacts.tsx`

Purpose:

- Manage project clients and project-side contacts after deals become final.

Features:

- Project client creation.
- Contact creation per selected client.
- Role-based contact categories.
- Search and role filter.
- CSV export.
- Client/project/source lead linkage.

### Project Agreements

File:

- `ProjectAgreement.tsx`

Purpose:

- Manage project agreement records.

Features:

- Agreement form.
- Agreement table.
- Attachment name tracking.
- CSV export.
- Download text generation.
- Status tracking.

Backend requirements:

- Assignment APIs.
- Calling owner activity APIs.
- Follow-up APIs.
- Client and contact master APIs.
- Agreement record and document storage APIs.

## 14. Growth Marketing Module

Folder:

- `src/components/dashboard/marketing`

File:

- `MarketingHub.tsx`

Views:

- Growth Campaigns
- ROI
- Acquisition Sources

Campaign features:

- Campaign records with budget, spend, pipeline, dates, UTM fields, landing page, lead form, owner, status, and next action.
- Create, edit, archive, and restore.
- Search, channel filter, status filter.
- CSV export.
- Dynamic KPI cards.
- Validation for required fields, budget, overspend, funnel counts, and date ranges.

ROI features:

- Aggregates ROI by channel from campaign records.
- Supports filters by channel, campaign, and date range.
- Calculates spend, pipeline, ROI, CPL, CAC, and conversion metrics.
- CSV export.

Acquisition source features:

- Source records with normalized source key, UTM defaults, owner, quality, and funnel counts.
- Add, edit, archive, restore.
- Search, type filter, status filter.
- CSV export.
- Duplicate normalized source validation.

Backend requirements:

- Campaign CRUD.
- Campaign spend tracking.
- Acquisition source attribution.
- ROI aggregation endpoints.
- Marketing-to-lead conversion linkage.

## 15. Delivery Projects Module

Folder:

- `src/components/dashboard/projects`

Files:

- `ProjectHub.tsx`
- `performance/EmployeePerformance.tsx`

Views:

- Project Portfolio
- Team Assignment
- Tasks
- Milestones
- Deadlines
- Team Performance

Projects view:

- Project portfolio with client, project owner, source lead, value, dates, health, billing status, progress, status, team, and milestones.
- Supports add, edit, archive, restore, search, filters, and CSV export.

Team tracking:

- Manages team assignments with employee IDs, employee name, role, assigned task, dates, status, and progress.
- Supports add, edit, complete, remove, search, filters, and export.

Tasks:

- Tracks project tasks with owner, role, due dates, progress, status, priority, comments, attachment reference, and history.
- Supports create, edit, complete, remove, filters, search, and export.

Milestones:

- Tracks project milestones, owner, due date, progress, billing amount, billing status, and completion.
- Supports billing-event-ready completion flow.

Deadlines:

- Combines derived deadlines from projects, milestones, and tasks with manual deadline records.
- Supports create, edit, resolve, archive, restore, search, filters, and export.

Employee performance:

- Performance review records include goals, KPI score, quality score, attendance score, rating, review stage, manager notes, improvement plans, feedback, OKRs, career readiness, attrition risk, and training recommendations.
- Supports create, edit, archive, restore, detail drawer, filters, and export.

Backend requirements:

- Project CRUD.
- Project team APIs.
- Task APIs.
- Milestone APIs.
- Deadline APIs.
- Billing event APIs.
- Performance review APIs.
- Employee master integration from People Operations.

## 16. People Operations and Onboarding

Folders:

- `src/components/dashboard/hrms`
- `src/components/dashboard/onboarding`

Files:

- `HRMSHub.tsx`
- `PayrollView.tsx`
- `OnboardingWizard.tsx`
- `Step1Registration.tsx`
- `Step2Employment.tsx`
- `Step3Documents.tsx`
- `Step4Verification.tsx`
- `Step5Training.tsx`
- `Step6Approval.tsx`

People Operations views:

- Employee Directory
- Attendance
- Leave Management
- Payroll
- Exit Process

Employees:

- Employee master state.
- Add, edit, view, offboard behavior.
- Search and filters.
- KYC and asset metadata.

Attendance:

- Attendance records and regularization flow.
- Time range validation.
- Payroll readiness status.

Leave:

- Leave requests, balances, approval stages, cancellation, and payroll impact.

Payroll:

- Employee/month payroll records.
- Payable days, LOP days, deductions, hold reasons, staged approval, and paid status.

Exit management:

- Resignation, termination, contract end, and retirement cases.
- Clearance checklist.
- Handover progress.
- Employee status synchronization.

Onboarding workflow:

1. Registration.
2. Employment details.
3. Document upload tracking.
4. Verification.
5. Training checklist.
6. Final approval.

Onboarding validation:

- Registration requires identity, contact, address, and emergency contact information.
- Employment requires department, designation, manager, joining date, and official email.
- Required documents must be uploaded.
- Required documents must be verified before training.
- Training tasks must be complete before final approval.
- People Operations Manager, Technical Manager, Finance Team, and Director approvals are required before completion.

Backend requirements:

- Employee master APIs.
- Onboarding candidate APIs.
- Document upload and verification APIs.
- Attendance APIs.
- Leave APIs.
- Payroll APIs.
- Exit case APIs.

## 17. Finance Control Module

Folder:

- `src/components/dashboard/accounting`

Main files:

- `AccountingWizard.tsx`
- `AccountingDashboard.tsx`
- `AccountingComponents.tsx`
- `AccessControlContext.tsx`
- `LedgerEntryDialog.tsx`

Finance Control module IDs:

| Module ID | Label | Component |
| --- | --- | --- |
| `accounting-clients` | Client Master | `Step1Clients` |
| `accounting-vendors` | Vendor Master | `Step2Vendors` |
| `accounting-quotations` | Quotations | `Step3Quotations` |
| `accounting-invoices` | Invoices | `Step4Invoices` |
| `accounting-payments` | Payments | `Step5Payments` |
| `accounting-reminders` | Reminders | `Step6Reminders` |
| `accounting-credit-notes` | Credit Notes | `Step7CreditNotes` |
| `accounting-expenses` | Sales, Purchases & Expenses | `Step8Expenses` |
| `accounting-budgets` | Budget Control | `Step9Budgets` |
| `accounting-salary` | Payroll Register | `Step10Salary` |
| `accounting-gst` | GST Compliance | `Step11GST` |
| `accounting-tds` | TDS Compliance | `Step12TDS` |
| `accounting-reports` | Finance Reports | `Step13Reports` |
| `accounting-approvals` | Finance Approvals | `Step14Approvals` |
| `accounting-audit-logs` | Audit Logs | `Step15AuditLogs` |
| `accounting-access` | Access Control | `Step16Access` |
| `accounting-bank-details` | Bank Details | `Step17BankDetails` |

Finance Control behavior:

- Client and vendor masters manage finance party records.
- Quotations and invoices manage outbound commercial documents.
- Payments tracks collections and receipts.
- Reminders manages collection reminders.
- Credit notes manage invoice adjustments, refunds, and client credits.
- Sales, Purchases & Expenses manages ledger-style entries.
- Budget Control manages department and project budgets.
- Payroll Register manages finance payroll records and payout readiness.
- GST manages return and reconciliation records.
- TDS manages source-linked TDS records.
- Reports generates finance reports from local snapshots.
- Approvals manages finance approval queues.
- Audit Logs records finance activity evidence.
- Access Control controls finance role permissions.
- Bank Details manages company and client bank records.

Current data source:

- Mostly local React state.
- Some modules use localStorage for temporary cross-module data.
- Bank details use `crm_company_banks` and `crm_client_banks` until backend storage is connected.
- Payroll and invoices have temporary localStorage interactions.

Backend requirements:

- Finance party master APIs.
- Quotation and invoice APIs.
- Payment APIs.
- Ledger APIs.
- Budget APIs.
- Payroll finance APIs.
- GST and TDS APIs.
- Report APIs.
- Approval workflow APIs.
- Immutable audit log APIs.
- Encrypted bank account APIs.

Important Finance Control rules:

- Do not trust client-calculated totals in production.
- Do not use browser storage as the source of truth for finance data.
- Keep finance audit logs append-only.
- Keep delete actions as soft delete or archive.
- Keep sensitive bank data protected and masked.

## 18. Admin Control Module

Folder:

- `src/components/dashboard/administration`

File:

- `AdministrationHub.tsx`

Views:

- User Management
- Role Permissions
- System Audit Trail
- Approval Center
- System Settings

Users:

- Manages user identity records, role, team, status, MFA state, sessions, risk, and access review.
- Supports invite, edit, suspend, reactivate, deactivate, session revoke, search, filters, details, and export.

Roles:

- Manages global roles, module access, actions, data scope, risk, lifecycle, and review dates.
- Protects Super Admin role.

System Audit Trail:

- Tracks global system events.
- Separates immutable event facts from investigation metadata.

Approval Center:

- Central administrative approval queue.

System Settings:

- Company-level settings view.

Backend requirements:

- User management APIs.
- Role and permission APIs.
- Audit log APIs.
- Approval APIs.
- Settings APIs.
- Session and MFA APIs.

## 19. Support Desk Module

Folder:

- `src/components/dashboard/support`

File:

- `SupportHub.tsx`

Purpose:

- Frontend support desk with ticket queue and quick help actions.

Features:

- Support metrics.
- Ticket list.
- Search and status filter.
- New ticket form.
- Quick help cards.

Backend requirements:

- Ticket CRUD.
- Ticket comments.
- Assignment and priority.
- Status history.
- Client/project/user linkage.

## 20. Data Storage Status

Current frontend storage types:

- Static arrays.
- React component state.
- Some localStorage usage.
- API helper exists but is not widely connected.

Production storage target:

- Backend database as source of truth.
- Authenticated user sessions.
- Server-side permissions.
- Server-generated document numbers.
- Server-side audit logs.
- Server-side finance/tax/payroll calculations.

Known localStorage keys from project context:

- `crm_invoices_data`
- `crm_payroll_data`
- `crm_company_banks`
- `crm_client_banks`

## 21. Cross-Module Business Flow

Recommended production flow:

1. Growth Marketing creates campaigns and acquisition source attribution.
2. Leads are created from project or trading/calling intake.
3. Lead assignment sends work to calling owners or responsible team owners.
4. Calling Desk and follow-ups capture communication.
5. Lead outcome becomes final or not final.
6. Final project lead converts into client, contacts, agreement, and project.
7. Project tracks team, tasks, milestones, deadlines, and performance.
8. Milestone completion creates billing events.
9. Finance Control creates quotation, invoice, payment, ledger, tax, and report records.
10. People Operations supplies employees, attendance, leave, payroll, and exit data.
11. Admin Control manages users, roles, approvals, system settings, and global audit.
12. Dashboard overview aggregates company-wide status.

## 22. Validation and Quality Rules

Frontend validation currently exists in multiple modules using local logic, React Hook Form, and Zod.

Critical validation themes:

- Required fields before advancing multi-step workflows.
- Email format validation.
- Mobile number validation.
- Positive numeric amounts.
- Date order validation.
- Duplicate prevention in selected modules.
- Approval gates before final status.
- File upload name tracking for frontend-only document flows.

Production requirement:

- Every critical frontend validation must be repeated on the backend.
- Frontend validation improves UX but is not a security boundary.

## 23. Security and Access Notes

Current state:

- Authentication is simulated.
- Profile is frontend state.
- Finance Control access control is frontend context.
- Password and OTP flows are frontend-simulated.

Production security requirements:

- Real auth session or JWT implementation.
- `GET /auth/me` for current user.
- Backend RBAC enforcement.
- Backend MFA or OTP verification.
- Server-side password hashing.
- Password reset token or OTP storage with expiry.
- Audit log for profile changes, password changes, login, logout, role changes, approvals, and sensitive exports.
- Logout other sessions after password reset or password change.

Password policy used in current frontend:

- At least 8 characters.
- Uppercase letter.
- Lowercase letter.
- Number.
- Special character.
- Email OTP verification.
- Three OTP attempts before resend is required.

## 24. Styling and UI Standards

Theme source:

- `tailwind.config.js`

Main color tokens:

- `primary`: `#0f172a`
- `secondary`: `#334155`
- `accent`: `#10b981`
- `background`: `#f8fafc`
- `surface`: `#ffffff`
- `surface.muted`: `#f1f5f9`
- `text`: `#0f172a`
- `text.muted`: `#64748b`
- `border`: `#e2e8f0`

UI standards:

- Use responsive layouts.
- Keep tables inside horizontal scroll wrappers.
- Keep dashboard root protected from horizontal overflow.
- Prefer lucide icons for buttons and actions.
- Use English-only UI copy.
- Avoid adding business-critical data only as decorative UI.

## 25. Do-Not-Break Rules

- Do not change dashboard tab IDs without updating sidebar, render switch, and future backend permission keys.
- Do not change `ACCOUNTING_MODULES` IDs without updating Finance Control access policy mappings.
- Do not remove `min-w-0` and width guards from dashboard layout.
- Do not let wide tables push the entire page horizontally.
- Do not use client-side totals as production finance truth.
- Do not store bank, payroll, ledger, or audit data only in localStorage for production.
- Do not hard-delete business records that need audit history.
- Do not edit audit log facts.
- Do not mix lead ID, client ID, and project ID as one entity.
- Do not delete lead history when a lead converts to a client or project.
- Keep project billing events separate from direct accounting mutation on the client.
- Keep all project UI text in English.

## 26. Current Important Pending Local Changes

At the time this document was created, the working tree includes local changes in:

- `src/app/dashboard/page.tsx`
- `src/components/dashboard/leads/*`
- `src/components/dashboard/onboarding/Step6Approval.tsx`

Recent implemented work includes:

- Profile drawer with edit profile.
- Change password and forgot password flows with frontend email OTP simulation.
- Lead module validation and step gating improvements.
- English-only cleanup in recently edited UI messages.

Before pushing or releasing:

- Run `npx tsc --noEmit`.
- Run `npm run build`.
- Run targeted lint for changed files.
- Review `git diff` for unintended UI copy or unrelated changes.

## 27. Recommended Backend Priority

1. Auth, session, current user, roles, and profile APIs.
2. Employee, user, client, vendor, and bank master data.
3. Lead creation, assignment, follow-up, proposal, approval, and outcome APIs.
4. Project, task, milestone, deadline, and billing event APIs.
5. Finance Control invoice, payment, ledger, tax, payroll, report, approval, audit, and bank APIs.
6. People Operations attendance, leave, payroll, and exit APIs.
7. Growth Marketing campaign, acquisition source, ROI, and attribution APIs.
8. Support ticket APIs.
9. Dashboard aggregate APIs.

## 28. Backend Endpoint Starter List

Auth:

- `POST /auth/signup`
- `POST /auth/signin/otp/send`
- `POST /auth/signin/otp/verify`
- `POST /auth/password/change`
- `POST /auth/password/forgot/send-otp`
- `POST /auth/password/forgot/reset`
- `GET /auth/me`
- `POST /auth/logout`

Client Operations and leads:

- `GET /leads`
- `POST /leads`
- `GET /leads/:id`
- `PATCH /leads/:id`
- `POST /leads/:id/follow-ups`
- `POST /leads/:id/proposals`
- `POST /leads/:id/approval`
- `POST /leads/:id/outcome`
- `POST /leads/:id/assign`

Clients and agreements:

- `GET /clients`
- `POST /clients`
- `GET /clients/:id/contacts`
- `POST /clients/:id/contacts`
- `GET /agreements`
- `POST /agreements`
- `PATCH /agreements/:id`

Projects:

- `GET /projects`
- `POST /projects`
- `PATCH /projects/:id`
- `GET /projects/:id/tasks`
- `POST /projects/:id/tasks`
- `GET /projects/:id/milestones`
- `POST /projects/:id/milestones`
- `POST /projects/:id/billing-events`

People Operations:

- `GET /employees`
- `POST /employees`
- `PATCH /employees/:id`
- `GET /attendance`
- `POST /attendance`
- `GET /leave-requests`
- `POST /leave-requests`
- `PATCH /leave-requests/:id/approve`
- `GET /payroll`
- `POST /payroll`
- `GET /exit-cases`
- `POST /exit-cases`

Accounting:

- `GET /accounting/clients`
- `GET /accounting/vendors`
- `GET /accounting/quotations`
- `GET /accounting/invoices`
- `GET /accounting/payments`
- `GET /accounting/ledger-entries`
- `GET /accounting/budgets`
- `GET /accounting/payroll`
- `GET /accounting/gst`
- `GET /accounting/tds`
- `GET /accounting/reports`
- `GET /accounting/approvals`
- `GET /accounting/audit-logs`
- `GET /accounting/bank-accounts`

Administration and support:

- `GET /admin/users`
- `POST /admin/users`
- `PATCH /admin/users/:id`
- `GET /admin/roles`
- `POST /admin/roles`
- `GET /admin/audit-logs`
- `GET /admin/approvals`
- `PATCH /admin/approvals/:id`
- `GET /support/tickets`
- `POST /support/tickets`
- `PATCH /support/tickets/:id`

## 29. Testing Checklist

Minimum checks before release:

- Home page loads.
- Sign-in flow reaches dashboard.
- Sign-up flow reaches dashboard.
- Sidebar context switching works.
- Dashboard collapse/expand works.
- Notifications open and navigate.
- My Profile opens.
- Edit Profile saves frontend state.
- Change Password validates password and OTP.
- Forgot Password validates password and OTP.
- Lead project creation cannot skip required steps.
- Trading lead validation blocks bad inputs.
- Client Operations follow-ups, lead assignment, outcomes, project clients, and legal agreements render.
- Growth Marketing campaigns, ROI, and acquisition sources render.
- Delivery Projects portfolio, tasks, milestones, deadlines, and team performance render.
- People Operations employee directory, attendance, leave, payroll, and exit process render.
- Onboarding cannot complete without required steps.
- Finance Overview and every Finance Control module render.
- Admin Control user management, role permissions, logs, approvals, and system settings render.
- Support hub renders.
- Production build passes.

## 30. Final Notes

This project is best understood as a production-oriented frontend prototype with serious business workflow coverage. It is not yet a fully backend-backed production system. The next major engineering phase should convert local state and static data into authenticated backend APIs, enforce server-side validation and role access, and persist audit-ready business records.

All new user-facing project text should remain in English.
