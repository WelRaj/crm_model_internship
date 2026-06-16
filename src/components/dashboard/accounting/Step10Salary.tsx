"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  CalendarDays, Download, ShieldCheck, UserSquare2, Trash2, Edit2, 
  Users, Wallet, WalletCards, X, CheckCircle2, 
  Info, Calculator, Landmark 
} from "lucide-react";
import { 
  AccountingPage, ActionButton, DataTable, Field, 
  MetricCard, Panel, StatusBadge, WorkflowSteps 
} from "./AccountingComponents";

// --- Validation Schema ---
const salarySchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  mobile: z.string().optional(),
  month: z.string().min(1, "Month is required"),
  basic: z.coerce.number().min(0),
  hra: z.coerce.number().min(0),
  specialAllowance: z.coerce.number().min(0),
  pfDeduction: z.coerce.number().min(0),
  professionalTax: z.coerce.number().default(200),
  tds: z.coerce.number().min(0),
  workingDays: z.coerce.number().min(1),
  presentDays: z.coerce.number().min(0),
  conveyance: z.coerce.number().min(0).default(0),
  bonus: z.coerce.number().min(0).default(0),
  advance: z.coerce.number().min(0).default(0),
  status: z.string().default("HR Review"),
});

type SalaryFormData = z.infer<typeof salarySchema>;

const initialPayroll = [
  { 
    id: "SAL-2026-061", 
    employee: "Rahul Verma", 
    empId: "EMP-102", 
    mobile: "9876543210", 
    month: "June 2026", 
    basic: 50000, hra: 20000, allowance: 15000, conveyance: 5000, bonus: 2000,
    pf: 6000, pt: 200, tds: 3600, advance: 0,
    gross: "INR 92,000", deductions: "INR 9,800", net: "INR 82,200", 
    status: "Approved" 
  },
  { 
    id: "SAL-2026-062", 
    employee: "Swati Joshi", 
    empId: "EMP-118", 
    mobile: "9876543211", 
    month: "June 2026", 
    basic: 65000, hra: 25000, allowance: 18000, conveyance: 5000, bonus: 5000,
    pf: 9000, pt: 200, tds: 6200, advance: 0,
    gross: "INR 1,18,000", deductions: "INR 15,400", net: "INR 1,02,600", 
    status: "Pending Finance" 
  },
  { 
    id: "SAL-2026-063", 
    employee: "Amir Khan", 
    empId: "EMP-124", 
    mobile: "9876543212", 
    month: "June 2026", 
    basic: 45000, hra: 15000, allowance: 10000, conveyance: 3000, bonus: 3000,
    pf: 4500, pt: 200, tds: 2000, advance: 0,
    gross: "INR 76,000", deductions: "INR 6,700", net: "INR 69,300", 
    status: "HR Review" 
  },
];

export default function Step10Salary() {
  const [payroll, setPayroll] = useState(initialPayroll);

  // --- Sync with LocalStorage ---
  useEffect(() => {
    const savedPayroll = localStorage.getItem("crm_payroll_data");
    if (savedPayroll) {
      setPayroll(JSON.parse(savedPayroll));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("crm_payroll_data", JSON.stringify(payroll));
  }, [payroll]);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<SalaryFormData>({
    resolver: zodResolver(salarySchema as any),
    defaultValues: {
      month: "June 2026",
      mobile: "",
      basic: 0,
      hra: 0,
      specialAllowance: 0,
      pfDeduction: 0,
      professionalTax: 200,
      tds: 0,
      workingDays: 22,
      presentDays: 22,
      conveyance: 0,
      bonus: 0,
      advance: 0,
      status: "HR Review",
    }
  });

  const watchedBasic = useWatch({ control, name: "basic" });
  const watchedHra = useWatch({ control, name: "hra" });
  const watchedAllowance = useWatch({ control, name: "specialAllowance" });
  const watchedPf = useWatch({ control, name: "pfDeduction" });
  const watchedPt = useWatch({ control, name: "professionalTax" });
  const watchedTds = useWatch({ control, name: "tds" });
  const watchedConveyance = useWatch({ control, name: "conveyance" });
  const watchedBonus = useWatch({ control, name: "bonus" });
  const watchedAdvance = useWatch({ control, name: "advance" });

  const gross = Number(watchedBasic || 0) + Number(watchedHra || 0) + Number(watchedAllowance || 0) + Number(watchedConveyance || 0) + Number(watchedBonus || 0);
  const totalDeductions = Number(watchedPf || 0) + Number(watchedPt || 0) + Number(watchedTds || 0) + Number(watchedAdvance || 0);
  const netPayable = Math.max(0, gross - totalDeductions);

        const onEdit = (row: any) => {
    setEditingId(row.id);
    const [id, name] = [row.empId, row.employee];
    reset({
      employeeId: `${id} - ${name}`,
      mobile: row.mobile || "",
      month: row.month,
      basic: Number(row.gross?.replace(/[^0-9.-]+/g,"") || 0) * 0.5,
      hra: Number(row.gross?.replace(/[^0-9.-]+/g,"") || 0) * 0.2,
      specialAllowance: Number(row.gross?.replace(/[^0-9.-]+/g,"") || 0) * 0.3,
      pfDeduction: Number(row.deductions?.replace(/[^0-9.-]+/g,"") || 0) * 0.6,
      professionalTax: 200,
      tds: Number(row.deductions?.replace(/[^0-9.-]+/g,"") || 0) * 0.4,
      workingDays: 22,
      presentDays: 22,
      conveyance: 0,
      bonus: 0,
      advance: 0,
      status: row.status,
    });
    setShowForm(true);
  };

  const deletePayroll = (id: string) => {
    if (window.confirm("Are you sure you want to delete this payroll record?")) {
      setPayroll(payroll.filter((p) => p.id !== id));
    }
  };

      const onSubmit = (data: SalaryFormData) => {
        const entryData = {
      employee: data.employeeId.split("-")[1]?.trim() || data.employeeId,
      empId: data.employeeId.split("-")[0]?.trim() || "EMP-XXX",
      mobile: data.mobile || "",
      month: data.month,
      basic: data.basic,
      hra: data.hra,
      allowance: data.specialAllowance,
      conveyance: data.conveyance,
      bonus: data.bonus,
      pf: data.pfDeduction,
      pt: data.professionalTax,
      tds: data.tds,
      advance: data.advance,
      gross: `INR ${gross.toLocaleString()}`,
      deductions: `INR ${totalDeductions.toLocaleString()}`,
      net: `INR ${netPayable.toLocaleString()}`,
      status: data.status,
    };

    if (editingId) {
      setPayroll(payroll.map(p => p.id === editingId ? { ...entryData, id: editingId } : p));
    } else {
      const newEntry = { ...entryData, id: `SAL-2026-0${payroll.length + 64}` };
      setPayroll([newEntry, ...payroll]);
    }

    setSuccessMsg(true);
    setEditingId(null);
    setTimeout(() => {
      setSuccessMsg(false);
      setShowForm(false);
      reset();
    }, 2000);
  };

  return (
    <AccountingPage
      title="Salary & Payroll"
      description="Manage employee salary structure, monthly payroll processing, statutory deductions, and payout status."
      icon={UserSquare2}
      badge="HR + Finance"
      actions={
        <>
          <ActionButton icon={Download} label="Salary Sheet" variant="outline" />
          <ActionButton 
            icon={Wallet} 
            label="New Payroll" 
            variant="accent" 
            onClick={() => setShowForm(true)}
          />
        </>
      }
    >
      <WorkflowSteps steps={["Attendance Lock", "HR Review", "Finance Check", "Director Approval", "Payment Release"]} />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Gross Payroll" value={`INR ${(payroll.reduce((acc, r) => acc + (typeof r.net === "string" ? Number(r.net.replace(/[^0-9.-]+/g,"")) : (r.net || 0)), 0) / 100000).toFixed(1)}L`} helper="Company total" icon={WalletCards} tone="blue" />
        <MetricCard label="Net Payable" value={`INR ${(payroll.reduce((acc, r) => acc + Number(r.net.replace(/[^0-9.-]+/g,"")), 0) / 100000).toFixed(1)}L`} helper="After deductions" icon={Wallet} tone="green" />
        <MetricCard label="Deductions" value={`INR ${(payroll.reduce((acc, r) => acc + Number(r.deductions.replace(/[^0-9.-]+/g,"")), 0) / 1000).toFixed(1)}K`} helper="PF, PT, TDS" icon={Calculator} tone="purple" />
        <MetricCard label="Pending" value={String(payroll.filter(p => p.status !== "Approved").length)} helper="Approval queue" icon={ShieldCheck} tone="amber" />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-10 relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowForm(false)}
              className="absolute right-8 top-8 p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-primary transition-all"
            >
              <X size={24} />
            </button>

            {successMsg ? (
              <div className="py-20 text-center space-y-4 animate-in zoom-in-95">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <UserSquare2 size={48} />
                </div>
                <h3 className="text-2xl font-black text-primary">Payroll Entry Created!</h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Awaiting HR and Finance review.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                <div className="flex justify-between items-end border-b border-slate-100 pb-8">
                  <div>
                    <h3 className="text-3xl font-black text-primary tracking-tight">{editingId ? "Update Payroll Entry" : "Generate Payroll Entry"}</h3>
                    <p className="text-slate-500 font-medium mt-1">Compute gross salary, statutory deductions, and net payable for the month.</p>
                  </div>
                  <StatusBadge tone="blue">Step 10 of 16</StatusBadge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-3 space-y-8">
                    <Panel title="Employee & Attendance" description="Basic identification and leave impact.">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Field label="Employee" options={["EMP-102 - Rahul Verma", "EMP-118 - Swati Joshi", "EMP-124 - Amir Khan", "EMP-130 - Sunita Sharma"]} required register={register("employeeId")} error={errors.employeeId?.message} />
                        <Field label="Mobile Number" register={register("mobile")} />
                        <Field label="Payroll Month" options={["May 2026", "June 2026", "July 2026"]} required register={register("month")} error={errors.month?.message} />
                        <Field label="Total Working Days" type="number" register={register("workingDays")} error={errors.workingDays?.message} />
                        <Field label="Days Present" type="number" register={register("presentDays")} error={errors.presentDays?.message} />
                        <Field label="Status" options={["HR Review", "Pending Finance", "Approved", "Paid"]} register={register("status")} />
                      </div>
                    </Panel>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <Panel title="Earnings (Gross)" description="Fixed components as per appointment letter.">
                          <div className="space-y-4">
                             <Field label="Basic Salary" type="number" register={register("basic")} />
                             <Field label="HRA" type="number" register={register("hra")} />
                             <Field label="Special Allowance" type="number" register={register("specialAllowance")} />
                             <Field label="Conveyance" type="number" register={register("conveyance")} />
                             <Field label="Bonus" type="number" register={register("bonus")} />
                             <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Gross Total</span>
                                <span className="text-lg font-black text-primary">₹{gross.toLocaleString()}</span>
                             </div>
                          </div>
                       </Panel>

                       <Panel title="Deductions" description="Statutory and tax adjustments.">
                          <div className="space-y-4">
                             <Field label="Provident Fund (PF)" type="number" register={register("pfDeduction")} />
                             <Field label="Professional Tax (PT)" type="number" register={register("professionalTax")} />
                             <Field label="Income Tax (TDS)" type="number" register={register("tds")} />
                             <Field label="Advance" type="number" register={register("advance")} />
                             <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Deductions</span>
                                <span className="text-lg font-black text-red-500">₹{totalDeductions.toLocaleString()}</span>
                             </div>
                          </div>
                       </Panel>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <Panel title="Net Payout" description="Final amount to be credited.">
                       <div className="space-y-5">
                          <div className="p-6 bg-primary rounded-[2.5rem] text-white relative overflow-hidden shadow-xl shadow-primary/20">
                             <Wallet className="absolute -right-4 -bottom-4 text-white/5" size={120} />
                             <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Net Salary</p>
                                <p className="text-4xl font-black mt-1">₹{netPayable.toLocaleString()}</p>
                                <div className="mt-6 p-3 bg-white/10 rounded-xl flex items-center gap-3">
                                   <Landmark size={18} className="text-accent" />
                                   <p className="text-[10px] font-bold leading-4">This amount will be included in the bank NEFT transfer file.</p>
                                </div>
                             </div>
                          </div>

                          <div className="flex flex-col gap-3">
                             <ActionButton label="Confirm Payroll" variant="accent" type="submit" />
                             <ActionButton label="Save Draft" variant="outline" onClick={() => setShowForm(false)} />
                          </div>
                       </div>
                    </Panel>

                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                       <ShieldCheck className="text-blue-600 shrink-0" size={18} />
                       <p className="text-[10px] font-bold text-blue-800 leading-4">Confidential: Payroll data is restricted to HR and Finance Managers only.</p>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Panel title="Monthly Payroll Register" description="Production payroll register for compliance and bank reconciliation.">
        <DataTable columns={["ID", "Employee", "Mobile", "Month", "Gross", "Deductions", "Net Salary", "Status", "Actions"]}>
          {payroll.map((row) => (
            <tr key={row.id} className="text-sm group hover:bg-slate-50 transition-colors">
              <td className="px-4 py-4 font-black text-primary">{row.id}</td>
              <td className="px-4 py-4">
                <div>
                   <p className="font-black text-primary">{row.employee}</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.empId}</p>
                </div>
              </td>
              <td className="px-4 py-4 font-semibold text-slate-500">{row.mobile}</td>
              
              {/* Breakdown Fields */}
              <td className="px-4 py-4 font-medium text-slate-600">₹{(row.basic || 0).toLocaleString()}</td>
              <td className="px-4 py-4 font-medium text-slate-600">₹{(row.hra || 0).toLocaleString()}</td>
              <td className="px-4 py-4 font-medium text-slate-600">₹{(row.allowance || 0).toLocaleString()}</td>
              <td className="px-4 py-4 font-medium text-slate-600">₹{(row.conveyance || 0).toLocaleString()}</td>
              <td className="px-4 py-4 font-medium text-slate-600">₹{(row.bonus || 0).toLocaleString()}</td>
              
              <td className="px-4 py-4 font-black text-primary">{row.gross}</td>
              
              <td className="px-4 py-4 font-medium text-slate-600">₹{(row.pf || row.pfDeduction || 0).toLocaleString()}</td>
              <td className="px-4 py-4 font-medium text-slate-600">₹{(row.pt || row.professionalTax || 0).toLocaleString()}</td>
              <td className="px-4 py-4 font-medium text-slate-600">₹{(row.tds || 0).toLocaleString()}</td>
              <td className="px-4 py-4 font-medium text-slate-600">₹{(row.advance || 0).toLocaleString()}</td>
              
              <td className="px-4 py-4 font-semibold text-red-500">{row.deductions}</td>
              <td className="px-4 py-4 font-black text-emerald-600">{row.net}</td>
              
              <td className="px-4 py-4">
                <StatusBadge tone={row.status === "Approved" || row.status === "Paid" ? "green" : row.status === "Pending Finance" ? "amber" : "blue"}>
                  {row.status}
                </StatusBadge>
              </td>
              <td className="px-4 py-4">
                <div className="flex gap-2">
                  <button onClick={() => onEdit(row)} className="text-blue-500 hover:text-blue-700 transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => deletePayroll(row.id)} className="text-red-500 hover:text-red-700 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}


