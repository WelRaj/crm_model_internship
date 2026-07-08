"use client";

import React, { createContext, useContext, useState } from 'react';
import { Lock } from 'lucide-react';

type UserRole = 'Admin' | 'Director' | 'Finance Manager' | 'Accountant' | 'HR Manager' | 'Sales';

// Define permissions map: Role -> Array of Module IDs allowed
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  Admin: ['*'], // All
  Director: ['accounting-reports', 'accounting-approvals', 'accounting-audit-logs', 'accounting-access', 'accounting-salary'],
  'Finance Manager': ['accounting-clients', 'accounting-vendors', 'accounting-quotations', 'accounting-invoices', 'accounting-payments', 'accounting-expenses', 'accounting-budgets', 'accounting-gst', 'accounting-tds', 'accounting-approvals'],
  Accountant: ['accounting-clients', 'accounting-vendors', 'accounting-quotations', 'accounting-invoices', 'accounting-payments', 'accounting-expenses', 'accounting-gst', 'accounting-tds'],
  'HR Manager': ['accounting-salary', 'accounting-expenses'],
  Sales: ['accounting-clients', 'accounting-quotations']
};

const AuthContext = createContext<{ role: UserRole; setRole: (role: UserRole) => void }>({
  role: 'Admin',
  setRole: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [role, setRole] = useState<UserRole>('Admin');
  return <AuthContext.Provider value={{ role, setRole }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export const ProtectedModule = ({ moduleId, children }: { moduleId: string; children: React.ReactNode }) => {
  const { role } = useAuth();
  
  const allowedModules = ROLE_PERMISSIONS[role];
  const isAllowed = allowedModules.includes('*') || allowedModules.includes(moduleId);

  if (!isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-20 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <Lock size={40} />
        </div>
        <h3 className="text-2xl font-black text-primary">Access Denied</h3>
        <p className="text-slate-500 font-bold mt-2">Role &apos;{role}&apos; is not authorized to access this module.</p>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">Contact Admin for permissions.</p>
      </div>
    );
  }

  return <>{children}</>;
};
