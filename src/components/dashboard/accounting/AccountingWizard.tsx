"use client";

import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import { 
  Users, Truck, FileText, Receipt, IndianRupee, BellRing, 
  RotateCcw, Wallet, BarChart3, UserSquare2, Percent, 
  Calculator, LineChart, ShieldCheck, History, Lock 
} from "lucide-react";

// Importing all 16 step components
import Step1Clients from "./Step1Clients";
import Step2Vendors from "./Step2Vendors";
import Step3Quotations from "./Step3Quotations";
import Step4Invoices from "./Step4Invoices";
import Step5Payments from "./Step5Payments";
import Step6Reminders from "./Step6Reminders";
import Step7CreditNotes from "./Step7CreditNotes";
import Step8Expenses from "./Step8Expenses";
import Step9Budgets from "./Step9Budgets";
import Step10Salary from "./Step10Salary";
import Step11GST from "./Step11GST";
import Step12TDS from "./Step12TDS";
import Step13Reports from "./Step13Reports";
import Step14Approvals from "./Step14Approvals";
import Step15AuditLogs from "./Step15AuditLogs";
import Step16Access from "./Step16Access";

export type AccountingModuleId =
  | "accounting-clients"
  | "accounting-vendors"
  | "accounting-quotations"
  | "accounting-invoices"
  | "accounting-payments"
  | "accounting-reminders"
  | "accounting-credit-notes"
  | "accounting-expenses"
  | "accounting-budgets"
  | "accounting-salary"
  | "accounting-gst"
  | "accounting-tds"
  | "accounting-reports"
  | "accounting-approvals"
  | "accounting-audit-logs"
  | "accounting-access";

type AccountingModule = {
  id: AccountingModuleId;
  label: string;
  icon: LucideIcon;
  component: ComponentType;
};

export const ACCOUNTING_MODULES: AccountingModule[] = [
  { id: "accounting-clients", label: "Client Master", icon: Users, component: Step1Clients },
  { id: "accounting-vendors", label: "Vendor Master", icon: Truck, component: Step2Vendors },
  { id: "accounting-quotations", label: "Quotations", icon: FileText, component: Step3Quotations },
  { id: "accounting-invoices", label: "Invoices", icon: Receipt, component: Step4Invoices },
  { id: "accounting-payments", label: "Payments", icon: Wallet, component: Step5Payments },
  { id: "accounting-reminders", label: "Reminders", icon: BellRing, component: Step6Reminders },
  { id: "accounting-credit-notes", label: "Credit Notes", icon: RotateCcw, component: Step7CreditNotes },
  { id: "accounting-expenses", label: "Expenses", icon: IndianRupee, component: Step8Expenses },
  { id: "accounting-budgets", label: "Budgets", icon: BarChart3, component: Step9Budgets },
  { id: "accounting-salary", label: "Salary/Payroll", icon: UserSquare2, component: Step10Salary },
  { id: "accounting-gst", label: "GST Mgmt", icon: Percent, component: Step11GST },
  { id: "accounting-tds", label: "TDS Mgmt", icon: Calculator, component: Step12TDS },
  { id: "accounting-reports", label: "Reports", icon: LineChart, component: Step13Reports },
  { id: "accounting-approvals", label: "Approvals", icon: ShieldCheck, component: Step14Approvals },
  { id: "accounting-audit-logs", label: "Audit Logs", icon: History, component: Step15AuditLogs },
  { id: "accounting-access", label: "Access Control", icon: Lock, component: Step16Access },
];

type AccountingWizardProps = {
  activeModule?: AccountingModuleId;
  onSelectModule?: (moduleId: AccountingModuleId) => void;
};

export default function AccountingWizard({ activeModule, onSelectModule }: AccountingWizardProps) {
  const selectedModule = ACCOUNTING_MODULES.find((module) => module.id === activeModule);

  if (selectedModule) {
    const SelectedComponent = selectedModule.component;

    return (
      <div className="animate-in fade-in duration-500">
        <SelectedComponent />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {ACCOUNTING_MODULES.map((mod) => (
          <button
            key={mod.id}
            type="button"
            onClick={() => onSelectModule?.(mod.id)}
            className="bg-white p-6 rounded-2xl border border-border shadow-sm hover:border-accent hover:shadow-lg transition-all flex items-center gap-4 text-left group"
          >
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-primary group-hover:bg-accent/20 transition-colors">
               <mod.icon size={20} />
            </div>
            <span className="font-bold text-primary text-sm">{mod.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
