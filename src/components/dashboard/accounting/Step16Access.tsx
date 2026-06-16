"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  CheckCircle2, KeyRound, Lock, Plus, Shield, 
  ShieldCheck, UserCog, Users, XCircle, X,
  Save, AlertTriangle
} from "lucide-react";
import { 
  AccountingPage, ActionButton, DataTable, Field, 
  Panel, StatusBadge, MetricCard 
} from "./AccountingComponents";

// --- Validation Schema ---
const roleSchema = z.object({
  roleName: z.string().min(1, "Role name is required"),
  roleStatus: z.string().default("Active"),
  canViewReports: z.string().default("Yes"),
  canExport: z.string().default("No"),
  canApprove: z.string().default("No"),
  auditAccess: z.string().default("No Access"),
  allowedModules: z.string().min(5),
});

type RoleFormData = z.infer<typeof roleSchema>;

const initialRoles = [
  { role: "Accountant", users: 4, access: "Clients, Vendors, Quotations, Invoices, Payments, GST", approval: "Low quotation approval", status: "Active" },
  { role: "HR", users: 3, access: "Employees, Salary Structure, Payroll Draft, Payroll Reports", approval: "HR salary review", status: "Active" },
  { role: "Finance Manager", users: 2, access: "Expense Approval, Salary Approval, Reports, Budget Monitoring", approval: "Mid-value approvals", status: "Active" },
  { role: "Director/Admin", users: 2, access: "Full Access, Final Approvals, Audit Logs, All Reports", approval: "Final approval authority", status: "Protected" },
];

export default function Step16Access() {
  const [roles, setRoles] = useState(initialRoles);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [selectedAuditRole, setSelectedAuditRole] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema as any),
    defaultValues: {
      roleStatus: "Active",
      canViewReports: "Yes",
      canExport: "No",
      canApprove: "No",
      auditAccess: "No Access",
    }
  });

  const onSubmit = (data: RoleFormData) => {
    const newRole = {
      role: data.roleName,
      users: 0,
      access: data.allowedModules,
      approval: data.canApprove,
      status: data.roleStatus,
    };
    setRoles([...roles, newRole]);
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      setShowRoleForm(false);
      reset();
    }, 2000);
  };

  return (
    <AccountingPage
      title="Access Control"
      description="Manage module-level permissions, role matrices, and security boundaries."
      icon={Lock}
      badge="Admin"
      actions={
        <>
          <ActionButton icon={KeyRound} label="Permission Audit" variant="outline" onClick={() => setShowAudit(true)} />
          <ActionButton icon={Plus} label="New Role" variant="accent" onClick={() => setShowRoleForm(true)} />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Roles" value={String(roles.length)} helper="Finance and HR modules" icon={Shield} tone="blue" />
        <MetricCard label="Users Mapped" value="42" helper="Role-based permissions" icon={Users} tone="green" />
        <MetricCard label="Sensitive Exports" value="12" helper="Logged this month" icon={ShieldCheck} tone="amber" />
        <MetricCard label="Access Reviews" value="03" helper="Pending manager review" icon={UserCog} tone="purple" />
      </div>

      {showRoleForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <Panel title="New Role Setup" description="Assign module access carefully.">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Field label="Role Name" required register={register("roleName")} error={errors.roleName?.message} />
                <Field label="Role Status" options={["Active", "Inactive", "Protected"]} register={register("roleStatus")} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <Field label="Can View Reports" options={["Yes", "No"]} register={register("canViewReports")} />
                   <Field label="Can Export" options={["No", "Limited", "All"]} register={register("canExport")} />
                   <Field label="Can Approve" options={["No", "Low Value", "Mid Value", "Final Approval"]} register={register("canApprove")} />
                   <Field label="Audit Access" options={["No Access", "Read Only", "Full Access"]} register={register("auditAccess")} />
                </div>
                <Field label="Allowed Modules" multiline placeholder="List allowed modules..." required register={register("allowedModules")} error={errors.allowedModules?.message} />
                
                <div className="flex justify-end gap-3">
                   <ActionButton label="Cancel" variant="outline" onClick={() => setShowRoleForm(false)} />
                   <ActionButton label="Save Role Definition" variant="accent" type="submit" />
                </div>
            </form>
          </Panel>
        </div>
      )}

      {showAudit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <Panel title="Permission Audit" description="Select a role to see granted permissions.">
             <div className="space-y-4">
                <Field label="Select Role to Audit" options={roles.map(r => r.role)} onChange={(e: any) => setSelectedAuditRole(e.target.value)} />
                {selectedAuditRole && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-border">
                        <p className="text-sm font-black text-primary">Permissions for {selectedAuditRole}:</p>
                        <p className="mt-2 text-xs font-semibold text-slate-600">{roles.find(r => r.role === selectedAuditRole)?.access}</p>
                    </div>
                )}
                <ActionButton label="Close Audit" variant="outline" onClick={() => { setShowAudit(false); setSelectedAuditRole(null); }} />
             </div>
          </Panel>
        </div>
      )}

      <Panel title="Role Matrix" description="Production-ready starting point for accounting access in an Indian IT company.">
        <DataTable columns={["Role", "Users", "Access", "Approval Rights", "Status"]}>
          {roles.map((role) => (
            <tr key={role.role} className="text-sm">
              <td className="px-4 py-4 font-black text-primary">{role.role}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{role.users}</td>
              <td className="px-4 py-4 font-semibold leading-6 text-slate-600">{role.access}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{role.approval}</td>
              <td className="px-4 py-4">
                <StatusBadge tone={role.status === "Protected" ? "purple" : "green"}>{role.status}</StatusBadge>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      {successMsg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] p-12 text-center shadow-2xl">
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-primary">Role Defined Successfully!</h3>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">New security rules applied.</p>
          </div>
        </div>
      )}
    </AccountingPage>
  );
}


