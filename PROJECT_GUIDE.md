# CRM Panel - Ultimate Project Guide & Architectural Blueprint

Welcome to the **CRM Panel** developer guide. This document serves as the absolute source of truth and architectural compass for this multi-departmental, role-based enterprise portal. Use this guide to quickly understand the project structure, component maps, data flows, and "do-not-break" rules.

---

## 📌 1. Tech Stack & Project Metadata

*   **Framework:** Next.js 16.2.7 (App Router architecture)
*   **Language:** TypeScript, React 19
*   **Styling:** Tailwind CSS (configured in `tailwind.config.js`) + Custom Inline Styles for specific data-dense financial tables.
*   **Icons:** `lucide-react` (Standardized vector icons across the portal)
*   **API Client:** Central decoupled fetch-based helper (`src/lib/api-client.ts`)
*   **Backend API Base URL:** `http://localhost:8000/api` (configurable)
*   **Primary Currencies / Standards:** Indian Rupee (`\u20b9` encoded as ASCII in source code to prevent corruption across hosting platforms).

---

## 🚀 2. Quick Start Commands

Run these standard commands from the project root:

```bash
# Start local development server
npm run dev

# Build for production
npm run build

# Run ESLint validation
npm run lint

# Validate TypeScript compilation without emitting output
npx tsc --noEmit
```

*Note: For targeted type checking of financial components, you can use:*
```bash
npx tsc --noEmit --jsx react-jsx --moduleResolution bundler --module esnext --target es2017 --lib dom,dom.iterable,esnext --esModuleInterop --skipLibCheck src/components/dashboard/accounting/AccountingComponents.tsx src/components/dashboard/accounting/LedgerEntryDialog.tsx
```

---

## 🗺️ 3. Complete Directory Map & File Index

The workspace is organized logically separating authentication, pages, layout containers, and modular business components.

```filepath
D:\crmproduct\panel\
├───public\                 # Static assets, SVG icons, and branding illustrations
└───src\
    ├───app\                # Next.js App Router root & routing views
    │   ├───auth\           # Authentication routes
    │   │   ├───signin\     # Sign-In view (OTP-based)
    │   │   └───signup\     # Sign-Up view (With department categories)
    │   ├───dashboard\      # Dashboard hub wrapper
    │   │   ├───page.tsx    # Central Sidebar, Header, Notification Center & Module Switcher
    │   │   └───PANEL.md    # Original technical panel status summary
    │   ├───favicon.ico
    │   ├───globals.css     # Global CSS variables, custom scrolls, Tailwind imports
    │   ├───layout.tsx      # Central HTML root wrapper
    │   └───page.tsx        # Public marketing or redirect entry page
    │
    ├───components\         # Core reusable views & modules
    │   ├───auth\           # Authentication Form UI
    │   │   ├───IndianMobileInput.tsx # Specialized mobile field with validations
    │   │   ├───SigninForm.tsx        # Interactive OTP verify-and-login flow
    │   │   └───SignupForm.tsx        # Multi-role register forms
    │   │
    │   ├───ui\             # Reusable, Premium Design Tokens
    │   │   ├───Button.tsx  # Dynamic styling primary/secondary/danger button
    │   │   ├───Input.tsx   # Premium form text fields
    │   │   └───Select.tsx  # Standard dropdown interface
    │   │
    │   └───dashboard\      # Specialized Modular Departments (Rendered in Dashboard)
    │       ├───crm\        # CRM Module
    │       ├───leads\      # Leads Intake Module
    │       ├───marketing\  # Marketing campaigns & ROI Tracker
    │       ├───projects\   # Client and internal software delivery
    │       ├───onboarding\ # Team member onboarding flow
    │       ├───hrms\       # Employee Master, Attendance, Leaves & Payroll
    │       ├───accounting\ # Multi-step company & project account wizard
    │       └───administration\ # Administration hub (RBAC, Approval queues, Logs)
    │
    ├───constants\          # Static system values (e.g. Navigation arrays, statuses)
    ├───hooks\              # Custom React utilities
    ├───lib\
    │   └───api-client.ts   # Central fetch interceptor for GET, POST, PUT, DELETE
    ├───services\           # API interaction functions by domain
    └───utils\              # Formatting, Math, and helper utilities
```

---

## 🚪 4. Global Architecture & App Flows

### 🔐 A. Authentication & Onboarding
Users enter via the main page (`/`) and are directed to Auth flows:
1.  **Register (`/auth/signup`):** Users create accounts specifying their **Department** (CRM, Projects, Marketing, HRMS, Accounting, Admin).
2.  **Sign-In (`/auth/signin`):** Supports two-step Indian mobile validation with temporary OTP generation.
3.  **Role & Access Logic:** Once authenticated, the user profile is loaded, determining their sidebar experience.

### 💻 B. Central Dashboard Shell (`src/app/dashboard/page.tsx`)
The dashboard layout is a premium corporate workspace composed of:
*   **Context-Aware Sidebar:** When `activeTab === 'overview'`, it lists all departments. Clicking a department locks the sidebar context into that department's modules, showing a clean "Back to Dashboard" button to reset the view.
*   **Sticky Header:** Contains a global search, real-time notification queue (clicking a notification jumps to its relevant module), live calendar widget, quick-creation menu, and a profile dropdown containing user settings and sign-out buttons.
*   **Main Container:** Enclosed with horizontal scroll constraints (`min-w-0 w-full`) so robust, highly detailed tabular modules do not overflow and break the layout.

---

## 🏢 5. Departmental Module Breakdown

The CRM system is broken down into **6 core departments** plus Admin & Support. Here is a granular breakdown of the files and functions of each module.

### 👥 Module 1: CRM (Customer Relationship Management)
*Core components location: `src/components/dashboard/crm/`*
*   `ClientsContacts.tsx`: Tracks client company directories, contact people, overall account health, and ongoing client-specific opportunities.
*   `FollowUps.tsx`: Interactive tasks dashboard, unified calendar view of scheduled customer calls, and logged communication history.
*   `ProjectAgreement.tsx`: Form-driven contract drafting tool. Supports templates, auto-generating parameters, and progress trackers for electronic signatures.
*   `LeadAssign.tsx` & `LeadOutcomes.tsx` & `TelecallerDesk.tsx`: Specialized lead-hunting views designed to optimize sales caller efficiency and log dial-in success metrics.

### 📈 Module 2: Leads Management
*Core components location: `src/components/dashboard/leads/`*
*   `LeadWizard.tsx`: Central orchestrator for the CRM intake pipeline.
*   `Step1LeadInfo.tsx` to `Step6LeadStatus.tsx`: Structured step-by-step registration for new sales leads:
    1.  *Lead Info:* Basic contact details & initial channel attribution.
    2.  *Requirements:* Budget, product specification, and scope checklist.
    3.  *Follow Up:* Scheduled date, reminders, and notes.
    4.  *Proposal:* Commercial quote generation.
    5.  *Approval:* Super Admin/Manager greenlight checklist.
    6.  *Lead Status:* Lead conversion state (Won, Lost, Cold).
*   `ProjectLeadStepWizard.tsx` & `TradingLeadCreate.tsx`: Specialized intake flows configured specifically for standard consulting or direct commodity/license-based trading.

### 📣 Module 3: Marketing
*Core components location: `src/components/dashboard/marketing/`*
*   `MarketingHub.tsx`: Supports centralized viewing of marketing campaigns, ROI calculations, and conversion metrics organized by channel (SEO, PPC, Events, Outbound, Referrals).

### 🛠️ Module 4: Projects & Performance
*Core components location: `src/components/dashboard/projects/`*
*   `ProjectHub.tsx`: Houses five sub-views switching via internal tabs:
    *   *Projects:* Central directory mapping projects, clients, budgets, and status.
    *   *Team Tracking:* Visual member allocation matrices, workloads, and real-time team usage rates.
    *   *Tasks:* KanBan style task tracking with status transitions (Todo, In-Progress, Review, Closed).
    *   *Milestones:* Project phases, delivery percentages, and financial billing triggers.
    *   *Deadlines:* Priority calendar view flagging upcoming milestone expiration dates.
*   `performance/EmployeePerformance.tsx`: Staff appraisal dashboard logging key performance indicators (KPIs), objectives & key results (OKRs), feedback cards, and quarterly reviews.

### 👔 Module 5: HRMS (Human Resource Management System)
*Core components location: `src/components/dashboard/hrms/` & `src/components/dashboard/onboarding/`*
*   `onboarding/OnboardingWizard.tsx`: Multi-step recruitment/onboarding setup utilizing `Step1Registration.tsx` through `Step6Approval.tsx` to collect staff profile details, documents (Aadhaar, PAN, Resume), confirm references, trigger training modules, and output final joining approvals.
*   `HRMSHub.tsx`: Integrates:
    *   *Employees Master:* Entire search directory of active company employees.
    *   *Attendance Panel:* Live regularizations, shift rosters, and clock-in logs.
    *   *Leave Panel:* Balances (Sick, Casual, Earned) with instant click-to-approve triggers.
*   `PayrollView.tsx`: Monthly payroll calculations syncing attendance, variable bonuses, standard TDS/PF deductions, bank payout generation, and downloadable pay-slips.

### 💰 Module 6: Accounting (Step-by-Step Financial Dashboard)
*Core components location: `src/components/dashboard/accounting/`*
*   `AccountingDashboard.tsx`: Executive summary containing accounts payable, receivable, direct ledgers, bank balances, tax liabilities, and audit logs.
*   `AccountingWizard.tsx`: Master 17-step sequence covering every financial domain:
    *   `Step1Clients.tsx` & `Step2Vendors.tsx`: Accounts setup.
    *   `Step3Quotations.tsx` & `Step4Invoices.tsx`: Outbound billing flows.
    *   `Step5Payments.tsx` & `Step6Reminders.tsx`: Collections trackers.
    *   `Step7CreditNotes.tsx` & `Step8Expenses.tsx`: Return slips & general company spends.
    *   `Step9Budgets.tsx` & `Step10Salary.tsx`: Resource distributions and department salaries.
    *   `Step11GST.tsx` & `Step12TDS.tsx`: State tax compilations (CGST, SGST, IGST) and tax-at-source tracking.
    *   `Step13Reports.tsx`: Dynamic Profit & Loss statements, Balance Sheets, and Cash Flow ledgers.
    *   `Step14Approvals.tsx`: Multi-sig expense and transaction authorizations.
    *   `Step15AuditLogs.tsx` & `Step16Access.tsx`: Security compliance and granular access controls (`AccessControlContext.tsx`).
    *   `Step17BankDetails.tsx`: Live registration of company and client bank/beneficiary details.

### 👑 Module 7: Administration Hub
*Core components location: `src/components/dashboard/administration/`*
*   `AdministrationHub.tsx`: Integrated company management panel containing:
    *   *Users Master:* Edit access statuses of all portal users.
    *   *Role-Based Access Control (RBAC):* Configure fine-grained tab permissions for Admin, Manager, and Standard User profiles.
    *   *Global Approvals Queue:* Consolidates operations requiring supervisor oversight (discounts, exits, salaries, onboarding).
    *   *Audit Logs:* Read-only timestamped history of actions taken on the system (Who did What, When).

---

## ⚡ 6. Data Architecture & Integration Guide

The frontend is prepared to hook directly into a modern REST/GraphQL backend. Below is the state of data integrations:

| Module / Screen | Data Source | Primary Backend Endpoints Required |
| :--- | :--- | :--- |
| **Authentication** | Local Component State | `POST /auth/signin/otp/send`, `POST /auth/signin/otp/verify`, `POST /auth/signup` |
| **Dashboard Overview** | Static State / Local Mock | `GET /dashboard/overview-aggregates` (Executive KPI data) |
| **Leads & Contacts** | Local Wizard State | `GET/POST/PUT/DELETE /leads`, `POST /leads/proposal` |
| **Projects & Tasks** | Local Hub State | `GET/POST/PUT/DELETE /projects`, `GET/POST/PUT/DELETE /tasks` |
| **HRMS & Leave** | Local Component State | `GET/POST/PUT/DELETE /employees`, `POST /leaves/approve` |
| **Payroll Payouts** | `localStorage` (`crm_payroll_data`) | `GET /payroll/run`, `POST /payroll/disburse` |
| **Invoicing & Ledger** | `localStorage` (`crm_invoices_data`) | `GET/POST/PUT /invoices`, `GET/POST /ledger/entries` |
| **Bank Accounts** | `localStorage` (company/clients bank lists) | `GET/POST /bank-accounts` |

*Security Warning: When implementing API integration, all client-side browser storage (like `localStorage` backups) must be deprecated and routed through secured, server-side JWT authentication contexts with absolute RBAC validation.*

---

## 🛡️ 7. Core Layout & Implementation Guards ("Do Not Break" Rules)

To ensure visual consistency and system stability, you **must** adhere to the following layout parameters during any refactoring or expansion:

1.  **Horizontal Page Safety (`min-w-0`)**:
    *   Always wrap dashboard page grids and wide tables inside container components with `min-w-0` and `w-full` CSS classes.
    *   *Rationale:* Prevents wide spreadsheet views (such as those in accounting and marketing) from pushing the main sidebar and header out of bounds, preventing horizontal page breakages.
2.  **Scrollable Table Containers**:
    *   All multi-column tables must reside inside an overflow-x-auto block wrapper:
        ```tsx
        <div className="w-full overflow-x-auto border border-border rounded-lg">
          <table className="min-w-full divide-y divide-border">...</table>
        </div>
        ```
3.  **Currency Encoding Safeguards**:
    *   Never paste the Indian Rupee symbol (`₹`) directly inside code files. Some compilation tools and server configurations corrupt its UTF-8 encoding.
    *   **Always use the ASCII unicode identifier:** `\u20b9` (e.g., `<span>{"\u20b9"}{amount}</span>`).
4.  **Tab Configuration Consistency**:
    *   Do not modify the `activeTab` strings (e.g., `overview`, `leads`, `accounting`) in `src/app/dashboard/page.tsx` without ensuring matching configurations in the backend permissions keys and the sidebar render switcher.
5.  **Destructive Flow Guards**:
    *   Any deleting or clearing action (such as resetting payroll or removing leads) must be gatekept behind custom UI confirmation dialogs.

---

This blueprint acts as your complete guide to maintaining, improving, and navigating the **CRM Panel**. Refer to it to align your changes with established enterprise patterns and styling standards!
