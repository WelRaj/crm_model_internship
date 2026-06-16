"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  CheckCircle2, Clock, IndianRupee, Send, ShieldCheck, 
  UserCheck, XCircle, X, Info, Plus, Filter, ArrowRight,
  Eye, ThumbsUp, ThumbsDown, AlertTriangle, FileText
} from "lucide-react";
import { 
  AccountingPage, ActionButton, DataTable, Field, 
  MetricCard, Panel, StatusBadge, WorkflowSteps 
} from "./AccountingComponents";

// --- Validation Schema for Approval Action ---
const approvalSchema = z.object({
  requestId: z.string().min(1),
  action: z.string().min(1, "Select action"),
  comment: z.string().min(5, "Reason/Comment required for audit trail"),
  approverRole: z.string().default("Finance Manager"),
});

type ApprovalFormData = z.infer<typeof approvalSchema>;

const initialQueue = [
  { id: "APP-901", module: "Quotation", record: "QT-2026-043", amount: "INR 3,20,000", requester: "Sales Team", approver: "Finance Manager", status: "Pending", risk: "Low" },
  { id: "APP-902", module: "Expense", record: "EXP-2026-423", amount: "INR 65,000", requester: "Marketing", approver: "Finance Manager", status: "Pending", risk: "Medium" },
  { id: "APP-903", module: "Salary", record: "SAL-2026-062", amount: "INR 1,02,600", requester: "HR", approver: "Director", status: "In Review", risk: "Low" },
  { id: "APP-904", module: "Credit Note", record: "CN-2026-015", amount: "INR 21,830", requester: "Accountant", approver: "Finance Manager", status: "Approved", risk: "Low" },
];

export default function Step14Approvals() {
  const [queue, setQueue] = useState(initialQueue);
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalSchema as any),
    defaultValues: {
      action: "Approve",
      approverRole: "Finance Manager",
    }
  });

  const handleDecision = (action: string) => {
    setValue("action", action);
  };

  const onSubmit = (data: ApprovalFormData) => {
    setQueue(prev => prev.map(item => 
      item.id === data.requestId 
        ? { ...item, status: data.action === "Approve" ? "Approved" : "Rejected" } 
        : item
    ));
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      setSelectedReq(null);
      reset();
    }, 2000);
  };

  return (
    <AccountingPage
      title="Approval Matrix & Workflow"
      description="Centralized authority hub for managers and directors to review and validate high-value financial transactions."
      icon={ShieldCheck}
      badge="Financial integrity"
      actions={
        <>
          <ActionButton icon={Filter} label="Filter My Queue" variant="outline" />
          <ActionButton icon={CheckCircle2} label="Bulk Approval Mode" variant="accent" />
        </>
      }
    >
      <WorkflowSteps steps={["Request Raised", "Policy Check", "Approver Review", "Approve / Reject", "Audit Log"]} />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Pending Approval" value={String(queue.filter(q => q.status === "Pending" || q.status === "In Review").length)} helper="Action required" icon={Clock} tone="amber" />
        <MetricCard label="Company Safe" value="98.2%" helper="Policy compliance" icon={ShieldCheck} tone="green" />
        <MetricCard label="High Value" value="04" helper="Director queue" icon={UserCheck} tone="purple" />
        <MetricCard label="Rejected" value="02" helper="Last 30 days" icon={XCircle} tone="red" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Policy Configuration Hub */}
        <Panel title="Approval Policy Setup" description="Configure routing rules based on module and monetary slabs.">
           <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                 <Field label="Target Module" options={["Quotation", "Invoice", "Expense", "Salary", "Credit Note", "Budget Revision"]} placeholder="Select or type module..." />
                 <Field label="Amount Slab (INR)" options={["Up to 50,000", "50,001 to 5,00,000", "Above 5,00,000"]} placeholder="Enter custom limit..." />
                 <Field label="Designated Approver" options={["Accountant", "Finance Manager", "Finance Director", "CEO", "Partner"]} />
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shrink-0 shadow-sm"><Info size={20} /></div>
                 <div>
                    <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Policy Engine</p>
                    <p className="text-[11px] font-bold text-blue-700/70 mt-1 leading-5">Transactions exceeding ₹5,00,000 are automatically routed to the Director's mobile app for secondary biometric approval.</p>
                 </div>
              </div>
              <ActionButton label="Update Policy Rule" variant="outline" />
           </div>
        </Panel>

        {/* Live Queue */}
        <div className="xl:col-span-2">
           <Panel title="Actionable Approval Queue" description="Review pending requests and take immediate action to clear financial bottlenecks.">
              <DataTable columns={["ID", "Type", "Reference", "Amount", "Requester", "Risk", "Status", "Actions"]}>
                {queue.map((item) => (
                  <tr key={item.id} className="text-sm group hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 font-black text-primary">{item.id}</td>
                    <td className="px-4 py-4 font-semibold text-slate-500 text-xs uppercase tracking-widest">{item.module}</td>
                    <td className="px-4 py-4 font-black text-primary underline underline-offset-4 cursor-pointer decoration-slate-200 hover:decoration-primary">{item.record}</td>
                    <td className="px-4 py-4 font-black text-primary">₹{item.amount.replace("INR ", "")}</td>
                    <td className="px-4 py-4 font-semibold text-slate-600">{item.requester}</td>
                    <td className="px-4 py-4">
                       <StatusBadge tone={item.risk === 'High' ? 'red' : item.risk === 'Medium' ? 'amber' : 'green'}>{item.risk}</StatusBadge>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge tone={item.status === "Approved" ? "green" : item.status === "Rejected" ? "red" : item.status === "In Review" ? "blue" : "amber"}>
                        {item.status}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-4 text-right">
                       <button 
                         onClick={() => {
                            setSelectedReq(item);
                            setValue("requestId", item.id);
                         }}
                         className="p-2 bg-primary/5 text-primary hover:bg-primary hover:text-white rounded-xl transition-all"
                       >
                         <Eye size={16} />
                       </button>
                    </td>
                  </tr>
                ))}
              </DataTable>
           </Panel>
        </div>
      </div>

      {/* Decision Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-10 relative animate-in zoom-in-95 duration-300">
             <button onClick={() => setSelectedReq(null)} className="absolute right-8 top-8 p-2 hover:bg-slate-50 rounded-full text-slate-400"><X size={24} /></button>

             {successMsg ? (
                <div className="py-20 text-center space-y-4 animate-in zoom-in-95">
                   <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 size={48} />
                   </div>
                   <h3 className="text-2xl font-black text-primary">Decision Processed!</h3>
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Ledger and transaction status have been updated.</p>
                </div>
             ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                   <input type="hidden" {...register("requestId")} />
                   <input type="hidden" {...register("action")} />
                   
                   <div className="flex justify-between items-start border-b border-slate-100 pb-8">
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Reviewing {selectedReq.module}</p>
                         <h3 className="text-3xl font-black text-primary tracking-tight">Approve {selectedReq.record}</h3>
                         <p className="text-slate-500 font-medium mt-2 flex items-center gap-2">Requested by <span className="font-black text-primary">{selectedReq.requester}</span> <ArrowRight size={14}/> Amount: <span className="font-black text-primary">{selectedReq.amount}</span></p>
                      </div>
                      <div className="text-right">
                         <StatusBadge tone="blue">Level 1 Review</StatusBadge>
                         <p className="text-[10px] font-black text-slate-400 mt-2 uppercase">Due in 4 hours</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 space-y-8">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                               <div className="flex items-center gap-2 text-primary">
                                  <FileText size={18} />
                                  <h4 className="text-xs font-black uppercase tracking-widest">Audit Context</h4>
                               </div>
                               <div className="space-y-3 text-[11px]">
                                  <div className="flex justify-between"><span className="font-bold text-slate-400">Policy Match</span><span className="font-black text-emerald-600">YES</span></div>
                                  <div className="flex justify-between"><span className="font-bold text-slate-400">Budget Head</span><span className="font-black text-primary">Operations</span></div>
                                  <div className="flex justify-between"><span className="font-bold text-slate-400">Risk Profile</span><span className={`font-black uppercase ${selectedReq.risk === 'High' ? 'text-red-500' : 'text-emerald-500'}`}>{selectedReq.risk}</span></div>
                               </div>
                            </div>

                            <div className="p-6 bg-amber-50/50 rounded-3xl border border-amber-100 space-y-4">
                               <div className="flex items-center gap-2 text-amber-600">
                                  <AlertTriangle size={18} />
                                  <h4 className="text-xs font-black uppercase tracking-widest">Conflict Check</h4>
                               </div>
                               <p className="text-[11px] font-bold text-amber-800/70 leading-5">No duplicate transactions found for this vendor/client in the last 90 days. Safe to process.</p>
                            </div>
                         </div>

                         <div className="space-y-4">
                            <h4 className="text-sm font-black text-primary uppercase tracking-widest">Decision & Audit Comments</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <Field label="Reviewer Role" options={["Finance Manager", "Director", "CEO", "Managing Partner"]} required register={register("approverRole")} />
                               <Field label="Decision Status" options={["Approve", "Reject", "Need Clarification", "Hold"]} register={register("action")} />
                            </div>
                            <Field label="Audit Comment" placeholder="Describe reason for approval or grounds for rejection..." multiline required register={register("comment")} error={errors.comment?.message} />
                         </div>
                      </div>

                      <div className="space-y-6">
                         <Panel title="Action Hub" description="Finalize decision.">
                            <div className="space-y-4">
                               <button 
                                 type="submit" 
                                 onClick={() => handleDecision("Approve")}
                                 className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                               >
                                  <ThumbsUp size={20} />
                                  <span className="font-black uppercase tracking-widest text-xs">Authorize Entry</span>
                               </button>
                               <button 
                                 type="submit" 
                                 onClick={() => handleDecision("Reject")}
                                 className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-red-500/20 active:scale-95"
                               >
                                  <ThumbsDown size={20} />
                                  <span className="font-black uppercase tracking-widest text-xs">Reject Request</span>
                               </button>
                               <button 
                                 type="button" 
                                 onClick={() => setSelectedReq(null)}
                                 className="w-full py-4 bg-slate-50 border border-slate-200 text-slate-400 rounded-2xl flex items-center justify-center gap-3 hover:bg-white transition-all"
                               >
                                  <span className="font-black uppercase tracking-widest text-xs">Cancel Review</span>
                               </button>
                            </div>
                         </Panel>

                         <div className="p-5 bg-primary rounded-[2.5rem] text-white relative overflow-hidden">
                            <ShieldCheck className="absolute -right-4 -bottom-4 text-white/5" size={120} />
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Security Notice</p>
                            <p className="text-xs font-bold mt-2 leading-5">Your ID, IP, and timestamp will be permanently logged for ISO 27001 audit trail.</p>
                         </div>
                      </div>
                   </div>
                </form>
             )}
          </div>
        </div>
      )}
    </AccountingPage>
  );
}


