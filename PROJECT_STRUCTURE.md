# CRM Panel: Project Technical Blueprint

## 1. Overview
The CRM Panel is a multi-departmental, role-based enterprise application. It uses a context-aware navigation system where sidebar content dynamically updates based on the active department.

## 2. Navigation Architecture
- **Global Entry:** `/` (Landing Page with Sign In/Sign Up options).
- **Authentication:** 
    - `/auth/signin` (OTP-based login).
    - `/auth/signup` (Registration with Department Categorization).
- **Dashboard Hub (`/dashboard`):** 
    - **Overview:** Main Landing (Command Center).
    - **Contextual Sidebar:** Filters menu items based on department selection.

## 3. Department & Module Mapping
| Department | ID | Primary Component | Key Sub-pages |
| :--- | :--- | :--- | :--- |
| **CRM** | `leads` | `LeadWizard` | Follow-ups, Clients, Agreements |
| **Marketing** | `marketing` | `MarketingHub` | Campaigns, ROI, Sources |
| **Projects** | `projects` | `ProjectHub` | Tasks, Milestones, Performance |
| **HRMS** | `onboarding` | `OnboardingWizard` / `HRMSHub` | Employees, Attendance, Payroll |
| **Accounting** | `accounting` | `AccountingWizard` | Invoices, Expenses, Ledger |
| **Administration**| `administration`| `AdministrationHub` | Users, Roles, Audit Logs |

## 4. State & Data Flow
- **State Management:** `activeTab` determines the primary content and sidebar filtering.
- **Navigation:** 
    - `activeTab === 'overview'`: Show Dashboard Overview.
    - `activeTab !== 'overview'`: Filter `menuGroups` to show only relevant department items + "Back to Dashboard" button.
- **Data Source:** Currently `local state` (refactoring in progress for `api-client`).

## 5. UI Standardization (Theme Tokens)
- **Colors:** Defined in `tailwind.config.js`.
    - `surface`: Backgrounds (`#ffffff`)
    - `text`: Primary text (`#0f172a`)
    - `text-muted`: Muted text (`#64748b`)
    - `border`: Dividers (`#e2e8f0`)
- **Components:** Reusable `Input`, `Select`, `Button` using standardized tokens.

## 6. Security (Future Implementation)
- **Role Gating:** Dynamic rendering based on user role (Super Admin vs Team Lead vs Member).
- **Auth Flow:** JWT-based protection for all `/dashboard/*` routes.
