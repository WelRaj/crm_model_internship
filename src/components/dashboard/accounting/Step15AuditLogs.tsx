"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Download, Eye, FileClock, Filter, History, 
  LockKeyhole, ShieldAlert, X, Search, Terminal,
  ShieldCheck, ArrowRight, User
} from "lucide-react";
import { 
  AccountingPage, ActionButton, DataTable, Field, 
  MetricCard, Panel, StatusBadge 
} from "./AccountingComponents";

// --- Validation Schema for Audit Filter ---
const auditFilterSchema = z.object({
  searchQuery: z.string().optional(),
  module: z.string().default("All Modules"),
  action: z.string().default("All Actions"),
  user: z.string().default("All Users"),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

type AuditFilterData = z.infer<typeof auditFilterSchema>;

const initialLogs = [
  { id: "LOG-9001", user: "Rajkumar Rathore", module: "Invoice", action: "Approved", record: "INV-2026-088", oldValue: "Pending Approval", newValue: "Approved", ip: "103.87.44.12", time: "11 Jun 2026, 10:14 AM" },
  { id: "LOG-9002", user: "Sunita Sharma", module: "Salary", action: "Updated", record: "SAL-2026-062", oldValue: "TDS 12000", newValue: "TDS 13400", ip: "103.87.44.18", time: "11 Jun 2026, 10:28 AM" },
  { id: "LOG-9003", user: "Finance Manager", module: "Expense", action: "Rejected", record: "EXP-2026-424", oldValue: "Pending", newValue: "Review Required", ip: "103.87.44.21", time: "11 Jun 2026, 11:02 AM" },
  { id: "LOG-9004", user: "Accountant", module: "Client", action: "Created", record: "CL-24005", oldValue: "-", newValue: "New client record", ip: "103.87.44.16", time: "11 Jun 2026, 11:45 AM" },      
];

export default function Step15AuditLogs() {
  const [logs, setLogs] = useState(initialLogs);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { register, handleSubmit, reset } = useForm<AuditFilterData>({
    resolver: zodResolver(auditFilterSchema as any),
    defaultValues: {
      module: "All Modules",
      action: "All Actions",
      user: "All Users",
    }
  });

  const onFilter = (data: AuditFilterData) => {
    // Mock filter logic
    let filtered = initialLogs;
    if (data.module !== "All Modules") {
      filtered = filtered.filter(l => l.module === data.module);
    }
    setLogs(filtered);
    setShowFilters(false);
  };

  return (
    <AccountingPage
      title="Security & Activity Audit Logs"
      description="Permanent tamper-proof history of every financial decision, record change, and administrative action."
      icon={History}
      badge="ISO 27001 Standard"
      actions={
        <>
          <ActionButton icon={Filter} label="Advanced Filter" variant="outline" onClick={() => setShowFilters(!showFilters)} />
          <ActionButton icon={Download} label="Export Forensic Audit" variant="accent" />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Logs Captured" value="1.2K" helper="Last 30 days" icon={FileClock} tone="blue" />
        <MetricCard label="System Integrity" value="Safe" helper="No unauthorized access" icon={ShieldCheck} tone="green" />
        <MetricCard label="Record Lock" value="100%" helper="Hard-delete disabled" icon={LockKeyhole} tone="purple" />
        <MetricCard label="Policy Violations" value="00" helper="All actions verified" icon={ShieldAlert} tone="red" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Search & Filter Panel */}
        <Panel title="Forensic Search" description="Trace specific changes using record IDs or IP addresses.">
           <form onSubmit={handleSubmit(onFilter)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Field label="Search ID / IP" placeholder="e.g. INV-2026-088" register={register("searchQuery")} />
                 <Field label="Target Module" options={["All Modules", "Client", "Vendor", "Quotation", "Invoice", "Payment", "Expense", "Salary", "GST", "TDS"]} register={register("module")} />
                 <Field label="Activity User" options={["All Users", "Accountant", "Finance Manager", "Director", "Admin"]} register={register("user")} />
                 <Field label="Action Type" options={["All Actions", "Created", "Updated", "Approved", "Rejected", "Cancelled"]} register={register("action")} />
              </div>
              <div className="flex gap-3">
                 <ActionButton label="Apply Filters" variant="accent" type="submit" />
                 <ActionButton label="Clear" variant="outline" onClick={() => { reset(); setLogs(initialLogs); }} />
              </div>
           </form>
        </Panel>

        {/* Audit Intelligence Panel */}
        <Panel title="Audit Methodology" description="Standard operating procedures for log review.">
           <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                 <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary shadow-sm mt-1 shrink-0"><Terminal size={16} /></div>
                 <div>
                    <p className="text-xs font-black text-primary uppercase tracking-widest">Metadata Storage</p>
                    <p className="text-[11px] font-bold text-slate-500 mt-1 leading-5">The system records Browser User-Agent, Device OS, and Geo-IP for every approval action.</p>
                 </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
                 <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-blue-600 shadow-sm mt-1 shrink-0"><ShieldCheck size={16} /></div>
                 <div>
                    <p className="text-xs font-black text-blue-900 uppercase tracking-widest">Append-Only Logic</p>
                    <p className="text-[11px] font-bold text-blue-700/70 mt-1 leading-5">Logs cannot be edited or deleted even by Super Admins. Database is set to append-only mode.</p>
                 </div>
              </div>
           </div>
        </Panel>
      </div>

      <Panel title="Live Activity Stream" description="Every action is timestamped and connected to an authenticated user ID.">
        <DataTable columns={["User", "Module", "Action", "Record", "Changes", "IP Address", "Timestamp", "Detail"]}>
          {logs.map((log) => (
            <tr key={log.id} className="text-sm group hover:bg-slate-50 transition-colors">
              <td className="px-4 py-4">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><User size={14} /></div>
                    <p className="font-black text-primary">{log.user}</p>
                 </div>
              </td>
              <td className="px-4 py-4 font-semibold text-slate-500 text-xs uppercase tracking-widest">{log.module}</td>
              <td className="px-4 py-4">
                <StatusBadge tone={log.action === "Rejected" ? "red" : log.action === "Approved" ? "green" : "blue"}>{log.action}</StatusBadge>
              </td>
              <td className="px-4 py-4 font-black text-primary underline underline-offset-4 decoration-slate-200 hover:decoration-primary cursor-pointer">{log.record}</td>
              <td className="px-4 py-4 max-w-[150px]">
                 <p className="text-[10px] font-bold text-slate-400 truncate">Was: {log.oldValue}</p>
                 <p className="text-[10px] font-black text-emerald-600 truncate mt-1">Now: {log.newValue}</p>
              </td>
              <td className="px-4 py-4 font-mono text-[10px] text-slate-500">{log.ip}</td>
              <td className="px-4 py-4 font-semibold text-slate-600 text-xs">{log.time}</td>
              <td className="px-4 py-4 text-right">
                 <button onClick={() => setSelectedLog(log)} className="p-2 text-slate-300 hover:text-primary transition-colors"><Eye size={16} /></button>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-10 relative animate-in zoom-in-95 duration-300">
             <button onClick={() => setSelectedLog(null)} className="absolute right-8 top-8 p-2 hover:bg-slate-50 rounded-full text-slate-400"><X size={24} /></button>
             
             <div className="space-y-8">
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Audit Snaphot</p>
                   <h3 className="text-3xl font-black text-primary tracking-tight">{selectedLog.id}</h3>
                </div>

                <div className="grid grid-cols-2 gap-8 border-y border-slate-100 py-8">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authenticated User</p>
                      <p className="text-lg font-black text-primary">{selectedLog.user}</p>
                   </div>
                   <div className="space-y-1 text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IP Address</p>
                      <p className="text-lg font-mono font-black text-primary">{selectedLog.ip}</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                      <h4 className="text-xs font-black text-primary uppercase tracking-widest">Value Change Impact</h4>
                      <div className="flex items-center gap-6">
                         <div className="flex-1 p-4 bg-white border border-slate-100 rounded-2xl">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Before</p>
                            <p className="text-xs font-bold text-slate-600">{selectedLog.oldValue}</p>
                         </div>
                         <ArrowRight size={24} className="text-slate-300" />
                         <div className="flex-1 p-4 bg-white border border-emerald-100 rounded-2xl">
                            <p className="text-[10px] font-black text-emerald-400 uppercase mb-2">After</p>
                            <p className="text-xs font-black text-emerald-600">{selectedLog.newValue}</p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                   <p className="text-[10px] font-bold text-slate-400">Timestamp: {selectedLog.time}</p>
                   <ActionButton label="Close Preview" variant="outline" onClick={() => setSelectedLog(null)} />
                </div>
             </div>
          </div>
        </div>
      )}
    </AccountingPage>
  );
}


