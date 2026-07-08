# Backend Frontend Handoff Report

Last updated: 2026-07-08

## 1. Purpose

This report explains the current frontend so a backend developer can design APIs, database tables, authentication, permissions, and persistence without reading every UI file first.

The project is a frontend-first operations panel for **DeMatade Algo Technology Solutions Pvt Ltd**, a Navi Mumbai-based fintech/software company focused on algorithmic trading, strategy automation, and trading software solutions.

## 2. Current Frontend Completion

| Area | Status |
| --- | --- |
| UI and workflow coverage | 82% complete |
| Backend production readiness | 55% complete |
| Main missing layer | Real backend APIs, database persistence, authentication, RBAC, file storage, audit logging |
| Current data source | React state, static seed data, and limited browser localStorage |
| Current API integration | API helper exists, but most business modules are not connected to backend endpoints |

## 3. Languages and Technology Used

| Type | Files | Approx Share | Backend Relevance |
| --- | ---: | ---: | --- |
| TSX | 65 | 71.4% | Main React screen/component logic |
| Markdown | 8 | 8.8% | Project documentation and handoff notes |
| SVG | 5 | 5.5% | Static assets |
| TypeScript | 3 | 3.3% | Shared types and API helper |
| JSON | 3 | 3.3% | Package/config files |
| JavaScript | 3 | 3.3% | Next/Tailwind/PostCSS config |
| CSS | 1 | 1.1% | Global Tailwind styles |
| MJS | 1 | 1.1% | ESLint config |
| ICO | 1 | 1.1% | App icon |
| Gitignore | 1 | 1.1% | Repository config |

Main frontend skills needed:

- TypeScript
- React 19
- Next.js 16 App Router
- Tailwind CSS
- React Hook Form
- Zod validation
- Browser localStorage behavior
- Business workflow mapping

## 4. Core Dependencies

| Package | Use |
| --- | --- |
| `next@16.2.7` | App framework and routing |
| `react@19.2.4` / `react-dom@19.2.4` | UI rendering |
| `typescript` | Static typing |
| `tailwindcss@3.4.1` | Styling |
| `react-hook-form` | Form state management |
| `zod` | Validation schemas |
| `@hookform/resolvers` | Connects Zod with React Hook Form |
| `lucide-react` | Icons |

Important command set:

```bash
npm run dev
npm run build
npm run lint
npx tsc --noEmit
```

## 5. API Client Status

File:

- `src/lib/api-client.ts`

Current behavior:

- Uses browser `fetch`.
- Default base URL: `http://localhost:8000/api`
- Can be changed by `NEXT_PUBLIC_API_URL`.
- Supports `GET`, `POST`, `PUT`, and `DELETE`.

Current limitation:

- The helper is ready, but business modules mostly do not call real APIs yet.

Backend should return JSON in this style:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed"
}
```

For errors:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {}
}
```

## 6. App Routes

| Route | File | Purpose |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Public landing entry with sign-in/sign-up links |
| `/auth/signin` | `src/app/auth/signin/page.tsx` | Mobile number and OTP sign-in screen |
| `/auth/signup` | `src/app/auth/signup/page.tsx` | User registration with OTP-style flow |
| `/dashboard` | `src/app/dashboard/page.tsx` | Main operations panel shell |

## 7. Dashboard Shell

Main file:

- `src/app/dashboard/page.tsx`

Responsibilities:

- Owns active module tab state.
- Renders sidebar, header, notifications, profile dropdown, and profile drawer.
- Routes dashboard tabs to module components.
- Holds default user profile data.
- Handles edit profile and password/OTP UI state.

Dashboard modules:

| Module | Frontend Tab / Area | Component |
| --- | --- | --- |
| Main Dashboard | `overview` | inline dashboard overview in `page.tsx` |
| Lead Desk | `leads` | `LeadHub` |
| Client Operations | `lead-assign`, `telecaller`, `followups`, `outcomes`, `clients`, `agreements` | CRM components |
| Growth Marketing | `marketing`, `marketing-roi`, `marketing-sources` | `MarketingHub` |
| Delivery Projects | `projects`, `team-tracking`, `tasks`, `milestones`, `deadlines`, `performance` | `ProjectHub`, `EmployeePerformance` |
| People Operations | `hrms`, `payroll`, `onboarding` | `HRMSHub`, `PayrollView`, `OnboardingWizard` |
| Finance Control | `accounting`, `accounting-*` | `AccountingWizard` and finance steps |
| Admin Control | `administration`, `users`, `roles`, `logs`, `approvals`, `settings` | `AdministrationHub` |
| Support Desk | `support` | `SupportHub` |

## 8. Authentication and Profile

Files:

- `src/components/auth/SigninForm.tsx`
- `src/components/auth/SignupForm.tsx`
- `src/components/auth/IndianMobileInput.tsx`
- `src/app/dashboard/page.tsx`

Current frontend behavior:

- Sign-in accepts Indian mobile number.
- OTP entry is frontend-simulated.
- Sign-up accepts first name, last name, email, mobile, and department category.
- Current user profile is static frontend state.
- Profile drawer supports:
  - Profile photo
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
  - Edit profile
  - Change password
  - Forgot current password using email OTP-style UI
  - Activity timeline
  - Recent login history

Required backend entities:

- `users`
- `user_profiles`
- `auth_otps`
- `sessions` or refresh token table
- `login_history`
- `password_reset_requests`
- `profile_activity_logs`

Required APIs:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/auth/signin/otp/send` | Send OTP for login |
| `POST` | `/auth/signin/otp/verify` | Verify OTP and create session |
| `POST` | `/auth/signup` | Create new user |
| `GET` | `/auth/me` | Load current authenticated user |
| `POST` | `/auth/logout` | End session |
| `POST` | `/auth/refresh` | Refresh access token |
| `GET` | `/users/me/profile` | Load profile drawer data |
| `PUT` | `/users/me/profile` | Update profile details |
| `POST` | `/users/me/photo` | Upload profile photo |
| `POST` | `/users/me/password/change` | Change password using current password plus OTP |
| `POST` | `/users/me/password/forgot/send-otp` | Send password reset OTP |
| `POST` | `/users/me/password/forgot/reset` | Reset password using OTP |
| `GET` | `/users/me/login-history` | Recent login history |
| `GET` | `/users/me/activity` | Profile activity timeline |

## 9. Lead Desk

Main files:

- `src/components/dashboard/leads/LeadHub.tsx`
- `src/components/dashboard/leads/leadTypes.ts`
- `src/components/dashboard/leads/ProjectLeadStepWizard.tsx`
- `src/components/dashboard/leads/Step1LeadInfo.tsx`
- `src/components/dashboard/leads/Step2Requirements.tsx`
- `src/components/dashboard/leads/Step3FollowUp.tsx`
- `src/components/dashboard/leads/Step4Proposal.tsx`
- `src/components/dashboard/leads/Step5Approval.tsx`
- `src/components/dashboard/leads/Step6LeadStatus.tsx`
- `src/components/dashboard/leads/TradingLeadCreate.tsx`

Current content:

- Project lead creation wizard.
- Trading/calling lead creation form.
- Lead table with project and trading leads.
- Static seed data for project leads and trading leads.
- Zod validation in project wizard steps.
- Won project leads are stored in localStorage for Client Operations handoff.

Important frontend types:

- `TradingLead`
- `ProjectLead`
- `LeadDraft`
- `LeadAssignment`
- `TransferLog`

Project lead required backend data:

- Lead identity: lead date, department, source, source detail, name, company, designation.
- Contact: personal email, official email, mobile, alternate mobile.
- Assignment: assigned owner, current owner, team leader, transfer history.
- Location: city, state, country.
- Requirement: service required, project type, platform, timeline, description, technology preference, reference link.
- Budget: currency, min budget, max budget, payment mode.
- Follow-up: date, communication notes.
- Proposal: proposal number, proposal date, amount, remarks.
- Approval: decision, reviewer role, comments.
- Final status: priority, expected value, final value, close date, loss reason, competitor, remarks.

Trading/calling lead required backend data:

- Lead identity and contact.
- Trading interest.
- Budget.
- Experience level.
- Risk appetite.
- KYC status.
- Demat status.
- Account status.
- Issue type.
- Availability.
- Last call note.

LocalStorage key:

- `crm_won_project_leads`

Required backend entities:

- `leads`
- `project_lead_details`
- `trading_lead_details`
- `lead_assignments`
- `lead_followups`
- `lead_proposals`
- `lead_approvals`
- `lead_status_history`
- `lead_transfer_logs`

Required APIs:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/leads` | List all leads with filters |
| `POST` | `/leads/project` | Create project lead |
| `POST` | `/leads/trading` | Create trading/calling lead |
| `GET` | `/leads/:id` | Lead detail |
| `PUT` | `/leads/:id` | Update lead |
| `POST` | `/leads/:id/followups` | Add follow-up |
| `POST` | `/leads/:id/assign` | Assign/reassign lead |
| `POST` | `/leads/:id/proposal` | Save proposal |
| `POST` | `/leads/:id/approval` | Save approval decision |
| `POST` | `/leads/:id/status` | Change status |
| `GET` | `/leads/won-projects` | Won project leads ready for project creation |

## 10. Client Operations

Main files:

- `src/components/dashboard/crm/LeadAssign.tsx`
- `src/components/dashboard/crm/TelecallerDesk.tsx`
- `src/components/dashboard/crm/FollowUps.tsx`
- `src/components/dashboard/crm/LeadOutcomes.tsx`
- `src/components/dashboard/crm/ClientsContacts.tsx`
- `src/components/dashboard/crm/ProjectAgreement.tsx`

Current content:

- Lead assignment view.
- Calling owner/telecaller desk.
- Follow-up list.
- Lead outcome list.
- Clients and contacts page.
- Create project flow from won project lead/client.
- Manual plus dropdown source project/client selection.
- Contact people grouped by role.
- Project detail/edit flow.
- Project agreement form and list.

Important frontend forms:

- Lead assignment form.
- Call log form.
- Contact form.
- Manual source client/project form.
- Create project form.
- Agreement form using Zod.

LocalStorage usage:

- Reads `crm_won_project_leads`.
- Writes created projects to `crm_created_projects`.
- Dispatches `crm-created-projects-updated` browser event.

Required backend entities:

- `clients`
- `client_contacts`
- `client_projects`
- `project_contacts`
- `project_agreements`
- `client_project_source_links`
- `call_logs`
- `followup_logs`
- `lead_outcomes`

Required APIs:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/clients` | List clients |
| `POST` | `/clients` | Create client manually |
| `GET` | `/clients/:id` | Client detail |
| `PUT` | `/clients/:id` | Update client |
| `GET` | `/clients/:id/contacts` | List contacts |
| `POST` | `/clients/:id/contacts` | Add contact |
| `PUT` | `/contacts/:id` | Update contact |
| `POST` | `/clients/:id/projects` | Create client project |
| `GET` | `/projects/from-client-operations` | Projects created from client flow |
| `PUT` | `/client-projects/:id` | Edit project detail |
| `GET` | `/agreements` | List agreements |
| `POST` | `/agreements` | Create agreement |
| `PUT` | `/agreements/:id` | Update agreement |
| `POST` | `/call-logs` | Save calling activity |
| `GET` | `/followups` | List follow-ups |
| `GET` | `/lead-outcomes` | List outcomes |

## 11. Delivery Projects

Main files:

- `src/components/dashboard/projects/ProjectHub.tsx`
- `src/components/dashboard/projects/ProjectsModule.tsx`
- `src/components/dashboard/projects/projectHandoff.ts`
- `src/components/dashboard/projects/performance/EmployeePerformance.tsx`

Current content:

- Project portfolio/list.
- Reads client-created projects from localStorage.
- Project detail.
- Team assignment concept.
- Team leader and members.
- Client technical contact connection.
- Tasks, milestones, deadlines, and performance views.

Important frontend types:

- `CreatedProjectRecord`
- `ProjectTeamAssignment`
- `ClientContactSnapshot`
- `ProjectPriority`
- `BillingModel`
- `DeliveryMethod`

LocalStorage key:

- `crm_created_projects`

Required backend entities:

- `projects`
- `project_team_assignments`
- `project_members`
- `project_tasks`
- `project_milestones`
- `project_deadlines`
- `project_client_contacts`
- `employee_performance_reviews`

Required APIs:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/projects` | List all projects |
| `POST` | `/projects` | Create project |
| `GET` | `/projects/:id` | Project detail |
| `PUT` | `/projects/:id` | Update project |
| `POST` | `/projects/:id/team-leader` | Assign team leader |
| `POST` | `/projects/:id/team-members` | Assign team member |
| `PUT` | `/projects/:id/team-members/:memberId` | Update assignment |
| `GET` | `/projects/:id/client-contacts` | Client contact mapping |
| `POST` | `/projects/:id/tasks` | Create task |
| `POST` | `/projects/:id/milestones` | Create milestone |
| `POST` | `/projects/:id/deadlines` | Create deadline |
| `GET` | `/employees/performance` | Performance records |
| `POST` | `/employees/performance` | Create performance review |

## 12. Finance Control

Main files:

- `src/components/dashboard/accounting/AccountingWizard.tsx`
- `src/components/dashboard/accounting/AccountingDashboard.tsx`
- `src/components/dashboard/accounting/AccountingComponents.tsx`
- `src/components/dashboard/accounting/AccessControlContext.tsx`
- `src/components/dashboard/accounting/Step1Clients.tsx`
- `src/components/dashboard/accounting/Step2Vendors.tsx`
- `src/components/dashboard/accounting/Step3Quotations.tsx`
- `src/components/dashboard/accounting/Step4Invoices.tsx`
- `src/components/dashboard/accounting/Step5Payments.tsx`
- `src/components/dashboard/accounting/Step6Reminders.tsx`
- `src/components/dashboard/accounting/Step7CreditNotes.tsx`
- `src/components/dashboard/accounting/Step8Expenses.tsx`
- `src/components/dashboard/accounting/Step9Budgets.tsx`
- `src/components/dashboard/accounting/Step10Salary.tsx`
- `src/components/dashboard/accounting/Step11GST.tsx`
- `src/components/dashboard/accounting/Step12TDS.tsx`
- `src/components/dashboard/accounting/Step13Reports.tsx`
- `src/components/dashboard/accounting/Step14Approvals.tsx`
- `src/components/dashboard/accounting/Step15AuditLogs.tsx`
- `src/components/dashboard/accounting/Step16Access.tsx`
- `src/components/dashboard/accounting/Step17BankDetails.tsx`

Finance screens:

| Screen | Purpose |
| --- | --- |
| Client Master | Finance client records |
| Vendor Master | Vendor records |
| Quotations | Quote creation and quotation tracking |
| Invoices | Invoice generation/tracking |
| Payments | Payment collection and allocation |
| Reminders | Payment reminder scheduling |
| Credit Notes | Credit note creation and reversal tracking |
| Sales, Purchases & Expenses | Ledger/expense entry workflow |
| Budget Control | Budget allocation, thresholds, revision |
| Payroll Register | Payroll records |
| GST Compliance | GST return workflow |
| TDS Compliance | TDS deduction/payment workflow |
| Finance Reports | Filtered reporting UI |
| Finance Approvals | Approval policies and request queue |
| Audit Logs | Audit event chain and investigation UI |
| Access Control | Finance role access policy |
| Bank Details | Company/client bank account records |

Important validation schemas:

- `clientSchema`
- `vendorSchema`
- `quotationSchema`
- `invoiceSchema`
- `paymentSchema`
- `reminderSchema`
- `creditNoteSchema`
- `budgetSchema`
- `salarySchema`
- `gstSchema`
- `tdsSchema`
- `filterSchema`
- `decisionSchema`
- `policySchema`
- `investigationSchema`
- `roleSchema`
- `bankSchema`

LocalStorage keys:

- `crm_company_banks`
- `crm_client_banks`

Security note:

- Bank details are currently stored in browser localStorage for the frontend prototype. Production must use encrypted server-side storage with strict authorization, audit logs, and masking.

Required backend entities:

- `finance_clients`
- `vendors`
- `quotations`
- `quotation_items`
- `invoices`
- `invoice_items`
- `payments`
- `payment_allocations`
- `reminders`
- `credit_notes`
- `ledger_entries`
- `expense_entries`
- `budgets`
- `budget_revisions`
- `payroll_register`
- `gst_returns`
- `tds_records`
- `finance_reports`
- `approval_policies`
- `approval_requests`
- `audit_logs`
- `finance_roles`
- `finance_permissions`
- `bank_accounts`

Required APIs:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/finance/clients` | List finance clients |
| `POST` | `/finance/clients` | Create finance client |
| `GET` | `/finance/vendors` | List vendors |
| `POST` | `/finance/vendors` | Create vendor |
| `GET` | `/finance/quotations` | List quotations |
| `POST` | `/finance/quotations` | Create quotation |
| `GET` | `/finance/invoices` | List invoices |
| `POST` | `/finance/invoices` | Create invoice |
| `GET` | `/finance/payments` | List payments |
| `POST` | `/finance/payments` | Record payment |
| `GET` | `/finance/reminders` | List reminders |
| `POST` | `/finance/reminders` | Create reminder |
| `GET` | `/finance/credit-notes` | List credit notes |
| `POST` | `/finance/credit-notes` | Create credit note |
| `GET` | `/finance/ledger` | List ledger entries |
| `POST` | `/finance/ledger` | Create ledger entry |
| `GET` | `/finance/budgets` | List budgets |
| `POST` | `/finance/budgets` | Create budget |
| `POST` | `/finance/budgets/:id/revisions` | Create budget revision |
| `GET` | `/finance/payroll` | List payroll |
| `POST` | `/finance/payroll` | Create payroll row |
| `GET` | `/finance/gst` | GST records |
| `POST` | `/finance/gst` | Create GST return record |
| `GET` | `/finance/tds` | TDS records |
| `POST` | `/finance/tds` | Create TDS record |
| `GET` | `/finance/reports` | Finance reports |
| `GET` | `/finance/approvals` | Approval queue |
| `POST` | `/finance/approvals/:id/decision` | Approve/reject |
| `GET` | `/finance/audit-logs` | Audit trail |
| `GET` | `/finance/access/roles` | Finance roles |
| `POST` | `/finance/access/roles` | Create finance role |
| `GET` | `/finance/bank-accounts` | List bank accounts |
| `POST` | `/finance/bank-accounts` | Create bank account |

## 13. People Operations

Main files:

- `src/components/dashboard/hrms/HRMSHub.tsx`
- `src/components/dashboard/hrms/PayrollView.tsx`
- `src/components/dashboard/onboarding/OnboardingWizard.tsx`
- `src/components/dashboard/onboarding/Step1Registration.tsx`
- `src/components/dashboard/onboarding/Step2Employment.tsx`
- `src/components/dashboard/onboarding/Step3Documents.tsx`
- `src/components/dashboard/onboarding/Step4Verification.tsx`
- `src/components/dashboard/onboarding/Step5Training.tsx`
- `src/components/dashboard/onboarding/Step6Approval.tsx`

Current content:

- Employee directory style records.
- Attendance records.
- Leave requests.
- Payroll records.
- Exit process records.
- Employee onboarding wizard.
- Document verification and training steps.

Required backend entities:

- `employees`
- `employee_documents`
- `attendance`
- `leave_requests`
- `payroll_records`
- `exit_requests`
- `onboarding_cases`
- `onboarding_steps`
- `training_assignments`

Required APIs:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/people/employees` | List employees |
| `POST` | `/people/employees` | Create employee |
| `PUT` | `/people/employees/:id` | Update employee |
| `GET` | `/people/attendance` | Attendance records |
| `POST` | `/people/attendance` | Add attendance |
| `GET` | `/people/leaves` | Leave records |
| `POST` | `/people/leaves` | Create leave request |
| `POST` | `/people/leaves/:id/decision` | Approve/reject leave |
| `GET` | `/people/payroll` | Payroll records |
| `POST` | `/people/payroll` | Create payroll |
| `GET` | `/people/exits` | Exit records |
| `POST` | `/people/exits` | Create exit process |
| `GET` | `/people/onboarding` | Onboarding cases |
| `POST` | `/people/onboarding` | Start onboarding |
| `PUT` | `/people/onboarding/:id/steps/:stepId` | Update onboarding step |
| `POST` | `/people/documents` | Upload employee document |

## 14. Growth Marketing

Main file:

- `src/components/dashboard/marketing/MarketingHub.tsx`

Current content:

- Campaign records.
- ROI reporting filters.
- Lead source/acquisition source management.
- Campaign and source add/edit forms.

Important frontend types:

- `CampaignRecord`
- `CampaignFormState`
- `LeadSourceRecord`
- `LeadSourceFormState`

Required backend entities:

- `campaigns`
- `campaign_channels`
- `campaign_metrics`
- `lead_sources`
- `lead_source_metrics`

Required APIs:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/marketing/campaigns` | List campaigns |
| `POST` | `/marketing/campaigns` | Create campaign |
| `PUT` | `/marketing/campaigns/:id` | Update campaign |
| `GET` | `/marketing/roi` | ROI report |
| `GET` | `/marketing/sources` | List acquisition sources |
| `POST` | `/marketing/sources` | Create source |
| `PUT` | `/marketing/sources/:id` | Update source |

## 15. Admin Control

Main file:

- `src/components/dashboard/administration/AdministrationHub.tsx`

Current content:

- User management.
- Role permissions.
- System audit trail.
- Approval center.
- System settings.

Important frontend types:

- `AdminUser`
- `AdminRole`
- `SystemAuditEvent`
- `GlobalApprovalRequest`
- `AdministrationSettings`
- `SettingControl`

Required backend entities:

- `admin_users`
- `roles`
- `permissions`
- `role_permissions`
- `user_roles`
- `system_audit_events`
- `global_approval_requests`
- `system_settings`

Required APIs:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/admin/users` | List users |
| `POST` | `/admin/users` | Create user |
| `PUT` | `/admin/users/:id` | Update user |
| `POST` | `/admin/users/:id/status` | Activate/deactivate user |
| `GET` | `/admin/roles` | List roles |
| `POST` | `/admin/roles` | Create role |
| `PUT` | `/admin/roles/:id` | Update role |
| `GET` | `/admin/audit-events` | System audit trail |
| `GET` | `/admin/approvals` | Global approval requests |
| `POST` | `/admin/approvals/:id/decision` | Approve/reject |
| `GET` | `/admin/settings` | Load settings |
| `PUT` | `/admin/settings` | Update settings |

## 16. Support Desk

Main file:

- `src/components/dashboard/support/SupportHub.tsx`

Current content:

- Support tickets.
- Ticket creation form.
- Search and status filtering.
- Module mapping.
- Status lifecycle UI.

Required backend entities:

- `support_tickets`
- `ticket_comments`
- `ticket_status_history`
- `ticket_assignments`

Required APIs:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/support/tickets` | List tickets |
| `POST` | `/support/tickets` | Create ticket |
| `GET` | `/support/tickets/:id` | Ticket detail |
| `PUT` | `/support/tickets/:id` | Update ticket |
| `POST` | `/support/tickets/:id/comments` | Add comment |
| `POST` | `/support/tickets/:id/status` | Change status |
| `POST` | `/support/tickets/:id/assign` | Assign ticket |

## 17. Current Frontend Storage Map

| Storage | Used By | Purpose | Backend Replacement |
| --- | --- | --- | --- |
| React `useState` | Almost all modules | Temporary screen state and demo records | Database-backed API responses |
| Static arrays | Leads, finance, HR, marketing, admin, support | Demo seed data | Server seed data or real records |
| `crm_won_project_leads` | Lead Desk and Client Operations | Hand off won project leads | `/leads/won-projects` |
| `crm_created_projects` | Client Operations and Delivery Projects | Hand off created projects | `/projects` |
| `crm_company_banks` | Finance Control | Company bank accounts | Encrypted `/finance/bank-accounts` |
| `crm_client_banks` | Finance Control | Client bank accounts | Encrypted `/finance/bank-accounts` |

## 18. Cross-Module Business Flow

Primary flow:

1. Growth Marketing creates campaign/source records.
2. Lead Desk captures project or trading/calling leads.
3. Client Operations assigns leads and records calling/follow-up/outcome activity.
4. Won project leads move to Client Operations for client/project creation.
5. Client Operations creates project client, contacts, agreement, and project record.
6. Delivery Projects receives created project and assigns team leader/team members.
7. Delivery Projects manages tasks, milestones, deadlines, and performance.
8. Finance Control creates quotations, invoices, payments, reminders, credit notes, budgets, payroll, GST, TDS, and reports.
9. People Operations manages employee lifecycle and payroll-supporting data.
10. Admin Control manages users, roles, permissions, settings, approvals, and audit trail.
11. Support Desk handles operational tickets across modules.

## 19. Backend Database Design Priority

Build backend in this order:

1. Auth, sessions, users, profiles, roles, permissions.
2. Lead Desk entities and APIs.
3. Client Operations client/contact/project/agreement entities.
4. Delivery Projects project/team/task/milestone entities.
5. Finance Control core entities: clients, vendors, quotations, invoices, payments, bank accounts.
6. Finance Control compliance: GST, TDS, approvals, audit logs, budgets, payroll.
7. People Operations employees, attendance, leave, onboarding, exit.
8. Growth Marketing campaigns, sources, ROI metrics.
9. Support Desk tickets.
10. Notifications and cross-module audit logs.

## 20. Global Backend Requirements

Authentication:

- Use access token plus refresh token or secure cookie session.
- Every dashboard API must require authenticated user.
- User profile should be loaded from `/auth/me` and `/users/me/profile`.

Authorization:

- Enforce RBAC on the backend.
- Do not trust frontend-only permission checks.
- Finance, payroll, bank details, user management, and audit logs need high-sensitivity roles.

Audit:

- Store create/update/delete actions.
- Include actor user ID, module, entity type, entity ID, old value, new value, timestamp, IP, and user agent.

Validation:

- Recreate all important frontend Zod rules on backend.
- Backend is final source of truth.

Pagination:

- List APIs should support `page`, `limit`, `search`, `status`, `fromDate`, `toDate`, and module-specific filters.

File handling:

- Profile photo, employee documents, proposal files, agreement files, invoice PDFs, payment proofs, and bank documents need backend file storage.
- Store files outside the database and keep metadata in tables.

Notifications:

- Notification dropdown currently uses static data.
- Backend should provide unread notifications, module target, status, and read/unread actions.

## 21. Minimum API Response Rules

List response:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Detail response:

```json
{
  "success": true,
  "data": {}
}
```

Mutation response:

```json
{
  "success": true,
  "data": {},
  "message": "Saved successfully"
}
```

Validation error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "fieldName": "Error message"
  }
}
```

## 22. Backend Developer Checklist

- Create auth/session flow first.
- Create current user/profile APIs.
- Replace static profile state with `/auth/me` and profile APIs.
- Replace lead seed data with `/leads`.
- Replace localStorage lead/project handoff with server records.
- Replace finance localStorage bank storage with encrypted backend storage.
- Add RBAC middleware before finance/admin/payroll/bank APIs.
- Add audit middleware for all mutation APIs.
- Add file upload service.
- Add pagination and filters to all list APIs.
- Keep frontend field names close to current TypeScript types to reduce rework.

## 23. Final Backend Handoff Summary

The frontend already defines the business modules, screen structure, core form fields, validation direction, and user flows. The backend should now convert the current frontend state models into real persisted entities, enforce authentication/authorization, and provide APIs that match the current module boundaries.

Most important backend build sequence:

1. Auth and current user profile.
2. Leads and lead lifecycle.
3. Clients, contacts, agreements, and project creation.
4. Projects and team assignment.
5. Finance Control.
6. People Operations.
7. Admin Control.
8. Marketing and Support.
