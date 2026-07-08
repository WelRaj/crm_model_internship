"use client";

import React from 'react';
import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Users, Truck, FileText, Receipt, BellRing,
  RotateCcw, Wallet, BarChart3, UserSquare2, Percent, 
  Calculator, LineChart, ShieldCheck, History, Lock, Landmark ,TrendingDown} from 'lucide-react';
import AccountingDashboard from './AccountingDashboard';
import { AuthProvider, ProtectedModule } from './AccessControlContext';

import Step1Clients from './Step1Clients';
import Step2Vendors from './Step2Vendors';
import Step3Quotations from './Step3Quotations';
import Step4Invoices from './Step4Invoices';
import Step5Payments from './Step5Payments';
import Step6Reminders from './Step6Reminders';
import Step7CreditNotes from './Step7CreditNotes';
import Step8expenses from './Step8Expenses';
import Step9Budgets from './Step9Budgets';
import Step10Salary from './Step10Salary';
import Step11GST from './Step11GST';
import Step12TDS from './Step12TDS';
import Step13Reports from './Step13Reports';
import Step14Approvals from './Step14Approvals';
import Step15AuditLogs from './Step15AuditLogs';
import Step16Access from './Step16Access';
import Step17BankDetails from './Step17BankDetails';

export type AccountingModuleId =
  | 'accounting-clients'
  | 'accounting-vendors'
  | 'accounting-quotations'
  | 'accounting-invoices'
  | 'accounting-payments'
  | 'accounting-reminders'
  | 'accounting-credit-notes'
  | 'accounting-expenses'
  | 'accounting-budgets'
  | 'accounting-salary'
  | 'accounting-gst'
  | 'accounting-tds'
  | 'accounting-reports'
  | 'accounting-approvals'
  | 'accounting-audit-logs'
  | 'accounting-access'
  | 'accounting-bank-details'


type AccountingModule = {
  id: AccountingModuleId;
  label: string;
  icon: LucideIcon;
  component: ComponentType;
};

export const ACCOUNTING_MODULES: AccountingModule[] = [
  { id: 'accounting-clients', label: 'Client Master', icon: Users, component: Step1Clients },
  { id: 'accounting-vendors', label: 'Vendor Master', icon: Truck, component: Step2Vendors },
  { id: 'accounting-quotations', label: 'Quotations', icon: FileText, component: Step3Quotations },
  { id: 'accounting-invoices', label: 'Invoices', icon: Receipt, component: Step4Invoices },
  { id: 'accounting-payments', label: 'Payments', icon: Wallet, component: Step5Payments },
  { id: 'accounting-reminders', label: 'Reminders', icon: BellRing, component: Step6Reminders },
  { id: 'accounting-credit-notes', label: 'Credit Notes', icon: RotateCcw, component: Step7CreditNotes },
  { id: 'accounting-expenses', label: 'Sales, Purchases & Expenses', icon: TrendingDown, component: Step8expenses },
  { id: 'accounting-budgets', label: 'Budget Control', icon: BarChart3, component: Step9Budgets },
  { id: 'accounting-salary', label: 'Payroll Register', icon: UserSquare2, component: Step10Salary },
  { id: 'accounting-gst', label: 'GST Compliance', icon: Percent, component: Step11GST },
  { id: 'accounting-tds', label: 'TDS Compliance', icon: Calculator, component: Step12TDS },
  { id: 'accounting-reports', label: 'Finance Reports', icon: LineChart, component: Step13Reports },
  { id: 'accounting-approvals', label: 'Finance Approvals', icon: ShieldCheck, component: Step14Approvals },
  { id: 'accounting-audit-logs', label: 'Audit Logs', icon: History, component: Step15AuditLogs },
  { id: 'accounting-access', label: 'Access Control', icon: Lock, component: Step16Access },
  { id: 'accounting-bank-details', label: 'Bank Details', icon: Landmark, component: Step17BankDetails },
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
      <AuthProvider>
        <ProtectedModule moduleId={selectedModule.id}>
          <div className='animate-in fade-in duration-500'>
            <SelectedComponent />
          </div>
        </ProtectedModule>
      </AuthProvider>
    );
  }

  return (
    <div className='animate-in fade-in duration-500'>
      <AccountingDashboard onSelectModule={onSelectModule || (() => {})} />
    </div>
  );
}
