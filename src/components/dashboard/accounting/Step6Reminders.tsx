"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  BellRing, Mail, MessageCircle, PhoneCall, Send, 
  TimerReset, TriangleAlert, Users, X, CheckCircle2, 
  Calendar, Clock, Info, Plus, ShieldCheck
} from "lucide-react";
import { 
  AccountingPage, ActionButton, DataTable, Field, 
  MetricCard, Panel, StatusBadge 
} from "./AccountingComponents";

// --- Validation Schema ---
const reminderSchema = z.object({
  invoiceId: z.string().min(1, "Select an invoice"),
  rule: z.string().min(1, "Select a rule"),
  channel: z.string().min(1, "Select communication channel"),
  sentTo: z.string().email("Invalid recipient email"),
  cc: z.string().email("Invalid CC email").or(z.literal("")),
  scheduleDate: z.string().min(1, "Schedule date required"),
  remarks: z.string().min(5, "Internal remarks required"),
  status: z.string().default("Scheduled"),
});

type ReminderFormData = z.infer<typeof reminderSchema>;

const initialReminders = [
  { id: "REM-001", invoice: "INV-2026-083", client: "Bluebird Logistics", due: "05 Jun 2026", rule: "7 days overdue", via: "Email + WhatsApp", sentTo: "accounts@bluebird.in", status: "Escalated" },
  { id: "REM-002", invoice: "INV-2026-088", client: "Nexa Retail Cloud", due: "21 Jun 2026", rule: "7 days before due", via: "Email", sentTo: "finance@nexa.com", status: "Scheduled" },
  { id: "REM-003", invoice: "INV-2026-090", client: "Apex Finserve Pvt Ltd", due: "26 Jun 2026", rule: "On due date", via: "Email + SMS", sentTo: "rohit@apexfin.com", status: "Ready" },
  { id: "REM-004", invoice: "INV-2026-071", client: "KraftEdge Export LLP", due: "20 May 2026", rule: "30 days overdue", via: "Director Escalation", sentTo: "director@company.com", status: "Blocked" },
];

export default function Step6Reminders() {
  const [reminders, setReminders] = useState(initialReminders);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema as any),
    defaultValues: {
      scheduleDate: new Date().toISOString().split("T")[0],
      rule: "7 Days Before Due",
      channel: "Email + WhatsApp",
      status: "Scheduled",
    }
  });

  const onSubmit = (data: ReminderFormData) => {
    const newReminder = {
      id: `REM-00${reminders.length + 1}`,
      invoice: data.invoiceId,
      client: "Linked Client Name", // In real app, this would be fetched
      due: "Calculated Date",
      rule: data.rule,
      via: data.channel,
      sentTo: data.sentTo,
      status: data.status,
    };

    setReminders([newReminder, ...reminders]);
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      setShowForm(false);
      reset();
    }, 2000);
  };

  return (
    <AccountingPage
      title="Payment Reminder System"
      description="Automate polite reminders, overdue escalation, and collection follow-up notes for better cash flow."
      icon={BellRing}
      badge="Cash flow control"
      actions={
        <>
          <ActionButton icon={Send} label="Queue History" variant="outline" />
          <ActionButton 
            icon={Plus, ShieldCheck} 
            label="Schedule Reminder" 
            variant="accent" 
            onClick={() => setShowForm(true)}
          />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Due Today" value="06" helper="Requires same-day nudge" icon={TimerReset} tone="amber" />
        <MetricCard label="Auto Sent" value={String(reminders.length)} helper="This month" icon={Mail} tone="green" />
        <MetricCard label="Overdue" value="INR 9.1L" helper="12 open invoices" icon={TriangleAlert} tone="red" />
        <MetricCard label="Escalations" value="04" helper="Manager or director looped" icon={Users} tone="purple" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Rules & Logic Panel */}
        <Panel title="Reminder Logic" description="Standard automation settings based on invoice age.">
           <div className="space-y-4">
              {[
                { label: "7 Days Before", color: "blue", desc: "Gentle 'Payment Scheduled' reminder via Email." },
                { label: "Due Date", color: "emerald", desc: "Same-day WhatsApp nudge with payment link." },
                { label: "7 Days Overdue", color: "amber", desc: "Urgent 'Payment Missed' alert with late fee warning." },
                { label: "15 Days+", color: "red", desc: "Director-level escalation and manual call task." }
              ].map((rule) => (
                <div key={rule.label} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4">
                   <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center text-${rule.color}-500 shadow-sm`}><BellRing size={20} /></div>
                   <div>
                      <p className="text-sm font-black text-primary">{rule.label}</p>
                      <p className="text-xs font-bold text-slate-500 mt-1">{rule.desc}</p>
                   </div>
                </div>
              ))}
           </div>
        </Panel>

        {/* Channels Panel */}
        <Panel title="Communication Channels" description="Multi-channel reach for higher recovery.">
           <div className="grid grid-cols-1 gap-4">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Mail size={20} className="text-blue-600" />
                    <span className="text-sm font-black text-blue-900">Email Automation</span>
                 </div>
                 <StatusBadge tone="blue">Enabled</StatusBadge>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <MessageCircle size={20} className="text-emerald-600" />
                    <span className="text-sm font-black text-emerald-900">WhatsApp Bot</span>
                 </div>
                 <StatusBadge tone="green">Active</StatusBadge>
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <PhoneCall size={20} className="text-amber-600" />
                    <span className="text-sm font-black text-amber-900">Call Tasks (CRM)</span>
                 </div>
                 <StatusBadge tone="amber">Manual</StatusBadge>
              </div>
              <div className="p-6 bg-primary rounded-[2rem] text-white relative overflow-hidden mt-2">
                 <ShieldCheck className="absolute -right-4 -bottom-4 text-white/5" size={100} />
                 <p className="text-xs font-black uppercase tracking-widest text-white/60">Audit Log</p>
                 <p className="text-sm font-bold mt-2 leading-6">All sent reminders are recorded with delivery status for legal proof if needed.</p>
              </div>
           </div>
        </Panel>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-10 relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowForm(false)}
              className="absolute right-8 top-8 p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-primary transition-all"
            >
              <X size={24} />
            </button>

            {successMsg ? (
              <div className="py-20 text-center space-y-4 animate-in zoom-in-95">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="text-2xl font-black text-primary">Reminder Scheduled!</h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">The system will nudge the client as per the rule.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                <div className="flex justify-between items-end border-b border-slate-100 pb-8">
                  <div>
                    <h3 className="text-3xl font-black text-primary tracking-tight">Setup Follow-up Reminder</h3>
                    <p className="text-slate-500 font-medium mt-1">Configure automation rules or send a manual nudge to recover outstanding payments.</p>
                  </div>
                  <StatusBadge tone="blue">Step 6 of 16</StatusBadge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-3 space-y-8">
                    <Panel title="Target & Logic" description="Which invoice and what is the trigger?">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Invoice ID" options={["INV-2026-090", "INV-2026-088", "INV-2026-083"]} required register={register("invoiceId")} error={errors.invoiceId?.message} />
                        <Field label="Automation Rule" options={["7 Days Before Due", "On Due Date", "7 Days Overdue", "15 Days Overdue", "30 Days Overdue"]} required register={register("rule")} error={errors.rule?.message} />
                        <Field label="Communication Via" options={["Email", "WhatsApp", "SMS", "Email + WhatsApp", "Director Escalation"]} required register={register("channel")} error={errors.channel?.message} />
                        <Field label="Schedule Date" type="date" required register={register("scheduleDate")} error={errors.scheduleDate?.message} />
                      </div>
                    </Panel>

                    <Panel title="Recipient Setup" description="Who will receive this notification?">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Primary Recipient Email" placeholder="finance@client.com" required register={register("sentTo")} error={errors.sentTo?.message} />
                        <Field label="CC (Internal/Sales)" placeholder="sales.owner@company.com" register={register("cc")} error={errors.cc?.message} />
                      </div>
                    </Panel>

                    <Field label="Follow-up Remarks" placeholder="Mention specific reasons for urgency or previous conversation context..." multiline required register={register("remarks")} error={errors.remarks?.message} />
                  </div>

                  <div className="space-y-6">
                    <Panel title="Action Hub" description="Finalize setup.">
                       <div className="space-y-4">
                          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                             <div className="flex items-center gap-3">
                                <Clock className="text-blue-500" size={18} />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Automation Engine</span>
                             </div>
                             <p className="text-xs font-bold text-slate-600 leading-5">This reminder will be queued and sent automatically on the scheduled date via selected channels.</p>
                          </div>

                          <div className="flex flex-col gap-3">
                             <ActionButton label="Schedule Reminder" variant="accent" type="submit" />
                             <ActionButton label="Send Instantly" variant="outline" onClick={handleSubmit(onSubmit)} />
                          </div>
                       </div>
                    </Panel>

                    <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex flex-col items-center text-center">
                       <MessageCircle className="text-emerald-500 mb-3" size={32} />
                       <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">WhatsApp Preview</p>
                       <p className="text-xs font-bold text-emerald-800 mt-2">"Dear Client, your payment for INV-2026-090 is due in 7 days. Please use this link to pay..."</p>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Panel title="Reminder Queue & History" description="Unified view of all automated and manual collection nudges.">
        <DataTable columns={["Invoice", "Client", "Rule", "Via", "Sent To", "Status", "Actions"]}>
          {reminders.map((reminder) => (
            <tr key={reminder.id} className="text-sm group hover:bg-slate-50 transition-colors">
              <td className="px-4 py-4 font-black text-primary">{reminder.invoice}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{reminder.client}</td>
              <td className="px-4 py-4 font-black text-primary text-[11px]">{reminder.rule}</td>
              <td className="px-4 py-4 font-semibold text-slate-500">
                <div className="flex items-center gap-2">
                   {reminder.via.includes("Email") && <Mail size={14} className="text-blue-500" />}
                   {reminder.via.includes("WhatsApp") && <MessageCircle size={14} className="text-emerald-500" />}
                   <span className="text-xs">{reminder.via}</span>
                </div>
              </td>
              <td className="px-4 py-4 font-semibold text-slate-500 text-xs">{reminder.sentTo}</td>
              <td className="px-4 py-4">
                <StatusBadge tone={reminder.status === "Escalated" || reminder.status === "Blocked" ? "red" : reminder.status === "Scheduled" ? "blue" : "green"}>
                  {reminder.status}
                </StatusBadge>
              </td>
              <td className="px-4 py-4">
                 <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">View Log</button>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}




