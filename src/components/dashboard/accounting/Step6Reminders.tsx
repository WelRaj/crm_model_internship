"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  BellRing, CalendarClock, CheckCircle2, Download, History, Mail,
  MessageCircle, PhoneCall, Plus, RotateCcw, Search, Send, ShieldAlert,
  TimerReset, TriangleAlert, Users, X,
} from "lucide-react";
import {
  AccountingPage, ActionButton, DataTable, Field,
  MetricCard, Panel, StatusBadge, WorkflowSteps,
} from "./AccountingComponents";

const INR = "\u20b9";
const reminderRules = ["7 Days Before Due", "3 Days Before Due", "On Due Date", "3 Days Overdue", "7 Days Overdue", "15 Days Overdue", "30 Days Overdue", "Custom Date"] as const;
const channels = ["Email", "WhatsApp", "Email + WhatsApp", "Phone Call Task", "Director Escalation"] as const;
const reminderStatuses = ["Scheduled", "Ready", "Sent", "Delivered", "Failed", "Snoozed", "Escalated", "Cancelled"] as const;

type InvoiceReceivable = {
  id: string;
  clientId: string;
  clientName: string;
  projectName: string;
  totalAmount: number;
  outstandingAmount: number;
  currency: string;
  dueDate: string;
  contactEmail: string;
  contactPhone: string;
  accountOwnerEmail: string;
};

const invoiceOptions: InvoiceReceivable[] = [
  {
    id: "INV-2026-088",
    clientId: "CL-24002",
    clientName: "Nexa Retail Cloud",
    projectName: "E-commerce Mobile App",
    totalAmount: 1275000,
    outstandingAmount: 775000,
    currency: "INR",
    dueDate: "2026-06-21",
    contactEmail: "finance@nexa.com",
    contactPhone: "+91 98765 11002",
    accountOwnerEmail: "sales.owner@company.com",
  },
  {
    id: "INV-2026-086",
    clientId: "CL-24003",
    clientName: "Bluebird Logistics",
    projectName: "Logistics Control Tower",
    totalAmount: 360000,
    outstandingAmount: 240000,
    currency: "INR",
    dueDate: "2026-06-30",
    contactEmail: "accounts@bluebird.in",
    contactPhone: "+91 98765 11003",
    accountOwnerEmail: "logistics.owner@company.com",
  },
  {
    id: "INV-2026-085",
    clientId: "CL-24001",
    clientName: "Apex Finserve Pvt Ltd",
    projectName: "Loan Automation Platform",
    totalAmount: 590000,
    outstandingAmount: 590000,
    currency: "INR",
    dueDate: "2026-07-05",
    contactEmail: "rohit@apexfin.com",
    contactPhone: "+91 98765 11001",
    accountOwnerEmail: "apex.owner@company.com",
  },
];

const reminderSchema = z.object({
  invoiceId: z.string().min(1, "Select an outstanding invoice"),
  rule: z.enum(reminderRules),
  channel: z.enum(channels),
  scheduleDate: z.string().min(1, "Schedule date required"),
  recipientEmail: z.string().optional(),
  recipientPhone: z.string().optional(),
  cc: z.string().optional(),
  subject: z.string().trim().min(5, "Subject required"),
  message: z.string().trim().min(15, "Reminder message is too short"),
  internalNote: z.string().trim().min(3, "Internal follow-up note required"),
}).superRefine((data, ctx) => {
  if (data.channel.includes("Email") || data.channel === "Director Escalation") {
    const result = z.string().email().safeParse(data.recipientEmail);
    if (!result.success) {
      ctx.addIssue({ code: "custom", path: ["recipientEmail"], message: "Valid recipient email required" });
    }
  }
  if (data.channel.includes("WhatsApp") || data.channel === "Phone Call Task") {
    if ((data.recipientPhone?.replace(/\D/g, "").length ?? 0) < 10) {
      ctx.addIssue({ code: "custom", path: ["recipientPhone"], message: "Valid recipient phone required" });
    }
  }
  if (data.cc?.trim()) {
    const result = z.string().email().safeParse(data.cc.trim());
    if (!result.success) {
      ctx.addIssue({ code: "custom", path: ["cc"], message: "Invalid CC email" });
    }
  }
});

type ReminderFormInput = z.input<typeof reminderSchema>;
type ReminderFormData = z.output<typeof reminderSchema>;
type ReminderStatus = typeof reminderStatuses[number];

type DeliveryEvent = {
  at: string;
  action: string;
  detail: string;
};

type ReminderRecord = {
  id: string;
  invoiceId: string;
  clientId: string;
  clientName: string;
  projectName: string;
  dueDate: string;
  outstandingAmount: number;
  currency: string;
  rule: typeof reminderRules[number];
  channel: typeof channels[number];
  scheduleDate: string;
  recipientEmail: string;
  recipientPhone: string;
  cc: string;
  subject: string;
  message: string;
  internalNote: string;
  status: ReminderStatus;
  attemptCount: number;
  lastSentAt: string;
  nextActionAt: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  events: DeliveryEvent[];
};

const initialReminders: ReminderRecord[] = [
  {
    id: "REM-2026-001",
    invoiceId: "INV-2026-088",
    clientId: "CL-24002",
    clientName: "Nexa Retail Cloud",
    projectName: "E-commerce Mobile App",
    dueDate: "2026-06-21",
    outstandingAmount: 775000,
    currency: "INR",
    rule: "3 Days Overdue",
    channel: "Email + WhatsApp",
    scheduleDate: "2026-06-24",
    recipientEmail: "finance@nexa.com",
    recipientPhone: "+91 98765 11002",
    cc: "sales.owner@company.com",
    subject: "Payment follow-up for INV-2026-088",
    message: "The outstanding payment for INV-2026-088 is overdue. Please share the expected payment date.",
    internalNote: "Client committed payment confirmation after finance review.",
    status: "Delivered",
    attemptCount: 1,
    lastSentAt: "2026-06-24T09:30:00.000Z",
    nextActionAt: "",
    createdBy: "Accountant",
    createdAt: "2026-06-20T10:00:00.000Z",
    updatedAt: "2026-06-24T09:31:00.000Z",
    events: [
      { at: "2026-06-24T09:30:00.000Z", action: "Sent", detail: "Email and WhatsApp queued." },
      { at: "2026-06-24T09:31:00.000Z", action: "Delivered", detail: "Delivery acknowledged." },
    ],
  },
  {
    id: "REM-2026-002",
    invoiceId: "INV-2026-086",
    clientId: "CL-24003",
    clientName: "Bluebird Logistics",
    projectName: "Logistics Control Tower",
    dueDate: "2026-06-30",
    outstandingAmount: 240000,
    currency: "INR",
    rule: "3 Days Before Due",
    channel: "Email",
    scheduleDate: "2026-06-27",
    recipientEmail: "accounts@bluebird.in",
    recipientPhone: "+91 98765 11003",
    cc: "logistics.owner@company.com",
    subject: "Upcoming payment due for INV-2026-086",
    message: "This is a reminder that payment for INV-2026-086 is due on 30 Jun 2026.",
    internalNote: "Standard pre-due reminder.",
    status: "Scheduled",
    attemptCount: 0,
    lastSentAt: "",
    nextActionAt: "2026-06-27",
    createdBy: "Accountant",
    createdAt: "2026-06-20T10:00:00.000Z",
    updatedAt: "2026-06-20T10:00:00.000Z",
    events: [{ at: "2026-06-20T10:00:00.000Z", action: "Scheduled", detail: "Email reminder scheduled." }],
  },
  {
    id: "REM-2026-003",
    invoiceId: "INV-2026-085",
    clientId: "CL-24001",
    clientName: "Apex Finserve Pvt Ltd",
    projectName: "Loan Automation Platform",
    dueDate: "2026-07-05",
    outstandingAmount: 590000,
    currency: "INR",
    rule: "7 Days Before Due",
    channel: "Email",
    scheduleDate: "2026-06-28",
    recipientEmail: "rohit@apexfin.com",
    recipientPhone: "+91 98765 11001",
    cc: "apex.owner@company.com",
    subject: "Upcoming payment due for INV-2026-085",
    message: "This is a reminder that payment for INV-2026-085 will be due on 05 Jul 2026.",
    internalNote: "First reminder for approved invoice.",
    status: "Scheduled",
    attemptCount: 0,
    lastSentAt: "",
    nextActionAt: "2026-06-28",
    createdBy: "Accountant",
    createdAt: "2026-06-20T10:00:00.000Z",
    updatedAt: "2026-06-20T10:00:00.000Z",
    events: [{ at: "2026-06-20T10:00:00.000Z", action: "Scheduled", detail: "Email reminder scheduled." }],
  },
];

const defaultFormValues: ReminderFormInput = {
  invoiceId: "",
  rule: "On Due Date",
  channel: "Email",
  scheduleDate: new Date().toISOString().split("T")[0],
  recipientEmail: "",
  recipientPhone: "",
  cc: "",
  subject: "",
  message: "",
  internalNote: "",
};

function money(value: number, currency = "INR") {
  const symbol = currency === "INR" ? INR : currency;
  return `${symbol} ${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function scheduleForRule(dueDate: string, rule: typeof reminderRules[number]) {
  if (!dueDate || rule === "Custom Date") return "";
  const offsets: Record<Exclude<typeof reminderRules[number], "Custom Date">, number> = {
    "7 Days Before Due": -7,
    "3 Days Before Due": -3,
    "On Due Date": 0,
    "3 Days Overdue": 3,
    "7 Days Overdue": 7,
    "15 Days Overdue": 15,
    "30 Days Overdue": 30,
  };
  const date = new Date(`${dueDate}T00:00:00`);
  date.setDate(date.getDate() + offsets[rule]);
  return date.toISOString().split("T")[0];
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Step6Reminders() {
  const [reminders, setReminders] = useState<ReminderRecord[]>(initialReminders);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [channelFilter, setChannelFilter] = useState("All");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [todayTimestamp] = useState(() => Date.now());

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<ReminderFormInput, unknown, ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: defaultFormValues,
  });

  const watchedInvoiceId = useWatch({ control, name: "invoiceId" });
  const watchedRule = useWatch({ control, name: "rule" });
  const watchedChannel = useWatch({ control, name: "channel" });
  const watchedMessage = useWatch({ control, name: "message" });
  const selectedInvoice = invoiceOptions.find((invoice) => invoice.id === watchedInvoiceId) ?? null;

  const filteredReminders = useMemo(() => reminders.filter((reminder) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || [
      reminder.id, reminder.invoiceId, reminder.clientName, reminder.projectName,
      reminder.recipientEmail, reminder.recipientPhone, reminder.rule, reminder.channel,
    ].join(" ").toLowerCase().includes(query);
    const matchesStatus = statusFilter === "All" || reminder.status === statusFilter;
    const matchesChannel = channelFilter === "All" || reminder.channel === channelFilter;
    return matchesSearch && matchesStatus && matchesChannel;
  }), [channelFilter, reminders, searchTerm, statusFilter]);

  const openForm = () => {
    reset(defaultFormValues);
    setSuccessMsg("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setSuccessMsg("");
    reset(defaultFormValues);
  };

  const selectInvoice = (invoiceId: string) => {
    setValue("invoiceId", invoiceId, { shouldValidate: true });
    const invoice = invoiceOptions.find((item) => item.id === invoiceId);
    if (!invoice) return;
    const scheduleDate = scheduleForRule(invoice.dueDate, watchedRule);
    setValue("scheduleDate", scheduleDate || new Date().toISOString().split("T")[0], { shouldValidate: true });
    setValue("recipientEmail", invoice.contactEmail, { shouldValidate: true });
    setValue("recipientPhone", invoice.contactPhone, { shouldValidate: true });
    setValue("cc", invoice.accountOwnerEmail);
    setValue("subject", `Payment reminder for ${invoice.id}`, { shouldValidate: true });
    setValue(
      "message",
      `Dear ${invoice.clientName}, payment of ${money(invoice.outstandingAmount, invoice.currency)} against ${invoice.id} is due on ${formatDate(invoice.dueDate)}. Please share the expected payment date.`,
      { shouldValidate: true },
    );
  };

  const selectRule = (rule: typeof reminderRules[number]) => {
    setValue("rule", rule, { shouldValidate: true });
    if (selectedInvoice && rule !== "Custom Date") {
      setValue("scheduleDate", scheduleForRule(selectedInvoice.dueDate, rule), { shouldValidate: true });
    }
  };

  const persistReminder = (data: ReminderFormData, sendImmediately: boolean) => {
    const invoice = invoiceOptions.find((item) => item.id === data.invoiceId);
    if (!invoice) return;
    const effectiveDate = sendImmediately ? new Date().toISOString().split("T")[0] : data.scheduleDate;
    const duplicate = reminders.some((reminder) =>
      reminder.invoiceId === data.invoiceId
      && reminder.rule === data.rule
      && reminder.channel === data.channel
      && reminder.scheduleDate === effectiveDate
      && !["Cancelled", "Failed"].includes(reminder.status),
    );
    if (duplicate) {
      setError("scheduleDate", { message: "An active reminder already exists for this invoice, rule, channel, and date" });
      return;
    }

    const now = new Date().toISOString();
    const nextNumber = Math.max(3, ...reminders.map((reminder) => Number(reminder.id.split("-").pop()) || 0)) + 1;
    const status: ReminderStatus = sendImmediately ? "Sent" : effectiveDate <= new Date().toISOString().split("T")[0] ? "Ready" : "Scheduled";
    const record: ReminderRecord = {
      id: `REM-${new Date().getFullYear()}-${String(nextNumber).padStart(3, "0")}`,
      invoiceId: invoice.id,
      clientId: invoice.clientId,
      clientName: invoice.clientName,
      projectName: invoice.projectName,
      dueDate: invoice.dueDate,
      outstandingAmount: invoice.outstandingAmount,
      currency: invoice.currency,
      rule: data.rule,
      channel: data.channel,
      scheduleDate: effectiveDate,
      recipientEmail: data.recipientEmail?.trim() ?? "",
      recipientPhone: data.recipientPhone?.trim() ?? "",
      cc: data.cc?.trim() ?? "",
      subject: data.subject.trim(),
      message: data.message.trim(),
      internalNote: data.internalNote.trim(),
      status,
      attemptCount: sendImmediately ? 1 : 0,
      lastSentAt: sendImmediately ? now : "",
      nextActionAt: sendImmediately ? "" : effectiveDate,
      createdBy: "Accountant",
      createdAt: now,
      updatedAt: now,
      events: [{
        at: now,
        action: sendImmediately ? "Sent" : status,
        detail: sendImmediately ? `${data.channel} reminder queued immediately.` : `Reminder scheduled for ${formatDate(effectiveDate)}.`,
      }],
    };
    setReminders((current) => [record, ...current]);
    setSuccessMsg(sendImmediately ? "Reminder queued for immediate delivery" : "Reminder scheduled");
    setTimeout(closeForm, 900);
  };

  const scheduleReminder = handleSubmit((data) => persistReminder(data, false));
  const sendInstantly = handleSubmit((data) => persistReminder(data, true));

  const addEvent = (reminder: ReminderRecord, status: ReminderStatus, action: string, detail: string, extra?: Partial<ReminderRecord>) => {
    const now = new Date().toISOString();
    setReminders((current) => current.map((item) => item.id === reminder.id ? {
      ...item,
      ...extra,
      status,
      updatedAt: now,
      events: [...item.events, { at: now, action, detail }],
    } : item));
  };

  const sendReminder = (reminder: ReminderRecord) => {
    addEvent(reminder, "Sent", "Sent", `${reminder.channel} reminder queued.`, {
      attemptCount: reminder.attemptCount + 1,
      lastSentAt: new Date().toISOString(),
      nextActionAt: "",
    });
  };

  const snoozeReminder = (reminder: ReminderRecord) => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    const nextDate = date.toISOString().split("T")[0];
    addEvent(reminder, "Snoozed", "Snoozed", `Follow-up moved to ${formatDate(nextDate)}.`, {
      scheduleDate: nextDate,
      nextActionAt: nextDate,
    });
  };

  const escalateReminder = (reminder: ReminderRecord) => {
    addEvent(reminder, "Escalated", "Escalated", "Finance manager and account owner added to follow-up.", {
      channel: "Director Escalation",
      nextActionAt: new Date().toISOString().split("T")[0],
    });
  };

  const exportReminders = () => {
    const rows = [
      ["Reminder", "Invoice", "Client", "Outstanding", "Due Date", "Rule", "Channel", "Schedule Date", "Recipient Email", "Recipient Phone", "Attempts", "Status", "Last Sent"],
      ...filteredReminders.map((reminder) => [
        reminder.id, reminder.invoiceId, reminder.clientName, reminder.outstandingAmount,
        reminder.dueDate, reminder.rule, reminder.channel, reminder.scheduleDate,
        reminder.recipientEmail, reminder.recipientPhone, reminder.attemptCount,
        reminder.status, reminder.lastSentAt,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadFile("reminder-register.csv", csv, "text/csv;charset=utf-8");
  };

  const downloadLog = (reminder: ReminderRecord) => {
    const content = [
      `Reminder: ${reminder.id}`,
      `Invoice: ${reminder.invoiceId}`,
      `Client: ${reminder.clientName}`,
      `Outstanding: ${money(reminder.outstandingAmount, reminder.currency)}`,
      `Rule: ${reminder.rule}`,
      `Channel: ${reminder.channel}`,
      `Status: ${reminder.status}`,
      "",
      ...reminder.events.map((event) => `${new Date(event.at).toLocaleString("en-IN")} | ${event.action} | ${event.detail}`),
    ].join("\n");
    downloadFile(`${reminder.id}-log.txt`, content, "text/plain;charset=utf-8");
  };

  const today = new Date(todayTimestamp).toISOString().split("T")[0];
  const dueToday = reminders.filter((reminder) => reminder.scheduleDate === today && ["Scheduled", "Ready", "Snoozed"].includes(reminder.status)).length;
  const sentThisMonth = reminders.filter((reminder) => reminder.lastSentAt.startsWith(today.slice(0, 7)) && reminder.status !== "Cancelled").length;
  const overdueInvoices = invoiceOptions.filter((invoice) => invoice.dueDate < today && invoice.outstandingAmount > 0);
  const overdueValue = overdueInvoices.reduce((sum, invoice) => sum + invoice.outstandingAmount, 0);
  const escalations = reminders.filter((reminder) => reminder.status === "Escalated").length;

  return (
    <AccountingPage
      title="Payment Reminder System"
      description="Schedule and audit invoice collection reminders using current outstanding, due dates, recipient contacts, and escalation controls."
      icon={BellRing}
      badge="Cash flow control"
      actions={
        <>
          <ActionButton icon={Download} label="Export History" variant="outline" onClick={exportReminders} />
          <ActionButton icon={Plus} label="Schedule Reminder" variant="accent" onClick={openForm} />
        </>
      }
    >
      <WorkflowSteps steps={["Outstanding Invoice", "Reminder Schedule", "Delivery Attempt", "Client Follow-up", "Escalation"]} />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Due Today" value={String(dueToday)} helper="Ready or scheduled reminders" icon={TimerReset} tone="amber" />
        <MetricCard label="Sent This Month" value={String(sentThisMonth)} helper="Recorded delivery attempts" icon={Mail} tone="green" />
        <MetricCard label="Overdue Receivable" value={money(overdueValue)} helper={`${overdueInvoices.length} invoices`} icon={TriangleAlert} tone="red" />
        <MetricCard label="Escalations" value={String(escalations)} helper="Management follow-up queue" icon={Users} tone="purple" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Reminder Rules" description="Schedule dates are derived from each invoice due date unless Custom Date is selected.">
          <div className="max-h-[420px] space-y-3 overflow-y-auto pr-2">
            {[
              ["7 Days Before Due", "Polite payment planning reminder."],
              ["3 Days Before Due", "Confirm payment is included in the client run."],
              ["On Due Date", "Same-day invoice and payment link reminder."],
              ["3 Days Overdue", "Request committed payment date."],
              ["7 Days Overdue", "Add account owner and stronger follow-up."],
              ["15 Days Overdue", "Finance manager escalation and call task."],
              ["30 Days Overdue", "Director escalation and credit hold review."],
            ].map(([label, description]) => (
              <div key={label} className="flex gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm"><BellRing size={19} /></div>
                <div>
                  <p className="text-sm font-black text-primary">{label}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Action Queue" description="Reminders requiring delivery, retry, follow-up, or escalation.">
          <div className="max-h-[420px] space-y-3 overflow-y-auto pr-2">
            {reminders.filter((reminder) => ["Ready", "Failed", "Snoozed", "Escalated"].includes(reminder.status)).map((reminder) => (
              <div key={reminder.id} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-primary">{reminder.invoiceId}</p>
                    <p className="text-xs font-semibold text-slate-500">{reminder.clientName}</p>
                  </div>
                  <StatusBadge tone={reminder.status === "Failed" || reminder.status === "Escalated" ? "red" : reminder.status === "Ready" ? "amber" : "blue"}>{reminder.status}</StatusBadge>
                </div>
                <p className="mt-3 text-xs font-bold text-slate-500">{money(reminder.outstandingAmount, reminder.currency)} | {reminder.channel}</p>
              </div>
            ))}
            {reminders.every((reminder) => !["Ready", "Failed", "Snoozed", "Escalated"].includes(reminder.status)) ? (
              <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs font-bold text-slate-400">No reminders require action.</p>
            ) : null}
          </div>
        </Panel>
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] border border-slate-100 bg-white p-8 shadow-2xl animate-in zoom-in-95">
            <button type="button" onClick={closeForm} className="absolute right-8 top-8 rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-primary"><X size={24} /></button>

            {successMsg ? (
              <div className="space-y-4 py-20 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 size={48} /></div>
                <h3 className="text-2xl font-black text-primary">{successMsg}</h3>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">The reminder event is recorded in delivery history.</p>
              </div>
            ) : (
              <form onSubmit={scheduleReminder} className="space-y-8">
                <div className="border-b border-slate-100 pb-6">
                  <h3 className="text-2xl font-black text-primary">Setup Collection Reminder</h3>
                  <p className="mt-1 text-sm font-medium text-slate-500">Recipient and message are prefilled from the selected outstanding invoice and remain editable.</p>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                  <div className="space-y-8 lg:col-span-3">
                    <Panel title="Target & Schedule" description="Select the receivable and reminder trigger.">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <label className="block space-y-1.5">
                          <span className="text-xs font-black uppercase tracking-widest text-slate-500">Outstanding Invoice <span className="text-red-500">*</span></span>
                          <select {...register("invoiceId")} onChange={(event) => selectInvoice(event.target.value)} className={`h-11 w-full rounded-xl border bg-white px-3 text-sm font-semibold text-primary outline-none ${errors.invoiceId ? "border-red-500" : "border-border focus:border-primary"}`}>
                            <option value="">Select invoice...</option>
                            {invoiceOptions.filter((invoice) => invoice.outstandingAmount > 0).map((invoice) => (
                              <option key={invoice.id} value={invoice.id}>{invoice.id} - {invoice.clientName} - Due {money(invoice.outstandingAmount, invoice.currency)}</option>
                            ))}
                          </select>
                          {errors.invoiceId ? <p className="text-[10px] font-black uppercase tracking-widest text-red-500">{errors.invoiceId.message}</p> : null}
                        </label>
                        <Field
                          label="Reminder Rule"
                          options={[...reminderRules]}
                          required
                          register={register("rule")}
                          onChange={(event) => selectRule(event.target.value as typeof reminderRules[number])}
                          error={errors.rule?.message}
                        />
                        <Field label="Communication Channel" options={[...channels]} required register={register("channel")} error={errors.channel?.message} />
                        <Field label={watchedRule === "Custom Date" ? "Custom Schedule Date" : "Calculated Schedule Date"} type="date" required register={register("scheduleDate")} error={errors.scheduleDate?.message} />
                      </div>
                      {selectedInvoice ? (
                        <div className="mt-5 grid grid-cols-1 gap-4 rounded-xl border border-blue-100 bg-blue-50 p-5 md:grid-cols-3">
                          <div><p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Client</p><p className="text-sm font-black text-blue-900">{selectedInvoice.clientName}</p></div>
                          <div><p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Due Date</p><p className="text-sm font-black text-blue-900">{formatDate(selectedInvoice.dueDate)}</p></div>
                          <div><p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Outstanding</p><p className="text-sm font-black text-blue-900">{money(selectedInvoice.outstandingAmount, selectedInvoice.currency)}</p></div>
                        </div>
                      ) : null}
                    </Panel>

                    <Panel title="Recipient & Message" description="Buyer-facing content and internal visibility.">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {(watchedChannel.includes("Email") || watchedChannel === "Director Escalation") ? <Field label="Recipient Email" required register={register("recipientEmail")} error={errors.recipientEmail?.message} /> : null}
                        {(watchedChannel.includes("WhatsApp") || watchedChannel === "Phone Call Task") ? <Field label="Recipient Phone" required register={register("recipientPhone")} error={errors.recipientPhone?.message} /> : null}
                        <Field label="CC / Account Owner" register={register("cc")} error={errors.cc?.message} />
                        <div className="md:col-span-2"><Field label="Subject" required register={register("subject")} error={errors.subject?.message} /></div>
                        <div className="md:col-span-2"><Field label="Reminder Message" multiline required register={register("message")} error={errors.message?.message} /></div>
                        <div className="md:col-span-2"><Field label="Internal Follow-up Note" multiline required register={register("internalNote")} error={errors.internalNote?.message} /></div>
                      </div>
                    </Panel>
                  </div>

                  <div className="space-y-6">
                    <Panel title="Delivery Preview" description="Final outstanding and communication content.">
                      <div className="space-y-5">
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                          <div className="flex items-center gap-2 text-primary">
                            {watchedChannel.includes("WhatsApp") ? <MessageCircle size={17} /> : watchedChannel === "Phone Call Task" ? <PhoneCall size={17} /> : <Mail size={17} />}
                            <p className="text-xs font-black uppercase tracking-widest">{watchedChannel}</p>
                          </div>
                          <p className="mt-4 whitespace-pre-wrap text-xs font-semibold leading-5 text-slate-600">{watchedMessage || "Select an invoice to generate the reminder message."}</p>
                        </div>
                        <ActionButton icon={CalendarClock} label="Schedule Reminder" variant="accent" type="submit" />
                        <ActionButton icon={Send} label="Send Instantly" variant="outline" onClick={sendInstantly} />
                      </div>
                    </Panel>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}

      <Panel
        title="Reminder Queue & History"
        description="Scheduled reminders, delivery attempts, follow-up actions, and escalation audit."
        actions={<StatusBadge tone="blue">{filteredReminders.length} Reminders</StatusBadge>}
      >
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_190px_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search reminder, invoice, client, recipient..." className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm font-semibold text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none">
            {["All", ...reminderStatuses].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select value={channelFilter} onChange={(event) => setChannelFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none">
            {["All", ...channels].map((channel) => <option key={channel} value={channel}>{channel}</option>)}
          </select>
        </div>

        <DataTable columns={["Reminder / Invoice", "Client / Outstanding", "Schedule", "Recipient / Channel", "Status", "Actions"]}>
          {filteredReminders.map((reminder) => (
            <tr key={reminder.id} className="text-sm transition-colors hover:bg-slate-50">
              <td className="px-4 py-4">
                <p className="font-black text-primary">{reminder.id}</p>
                <p className="text-xs font-semibold text-slate-500">{reminder.invoiceId}</p>
              </td>
              <td className="px-4 py-4">
                <p className="font-black text-primary">{reminder.clientName}</p>
                <p className="text-xs font-semibold text-red-500">{money(reminder.outstandingAmount, reminder.currency)} outstanding</p>
              </td>
              <td className="px-4 py-4">
                <p className="font-bold text-slate-600">{formatDate(reminder.scheduleDate)}</p>
                <p className="text-[11px] font-semibold text-slate-400">{reminder.rule}</p>
              </td>
              <td className="px-4 py-4">
                <p className="font-bold text-slate-600">{reminder.recipientEmail || reminder.recipientPhone}</p>
                <p className="text-[11px] font-semibold text-slate-400">{reminder.channel} | Attempts {reminder.attemptCount}</p>
              </td>
              <td className="px-4 py-4">
                <StatusBadge tone={reminder.status === "Delivered" ? "green" : reminder.status === "Failed" || reminder.status === "Escalated" || reminder.status === "Cancelled" ? "red" : reminder.status === "Ready" ? "amber" : "blue"}>{reminder.status}</StatusBadge>
              </td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  {["Scheduled", "Ready", "Snoozed", "Failed"].includes(reminder.status) ? (
                    <button type="button" onClick={() => sendReminder(reminder)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-blue-600" title="Send reminder"><Send size={15} /></button>
                  ) : null}
                  {reminder.status === "Sent" ? (
                    <button type="button" onClick={() => addEvent(reminder, "Delivered", "Delivered", "Delivery acknowledged by communication provider.")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-green-600" title="Mark delivered"><CheckCircle2 size={15} /></button>
                  ) : null}
                  {!["Delivered", "Cancelled", "Escalated"].includes(reminder.status) ? (
                    <button type="button" onClick={() => snoozeReminder(reminder)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-amber-600" title="Snooze 3 days"><RotateCcw size={15} /></button>
                  ) : null}
                  {!["Cancelled", "Escalated"].includes(reminder.status) ? (
                    <button type="button" onClick={() => escalateReminder(reminder)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-red-600" title="Escalate"><ShieldAlert size={15} /></button>
                  ) : null}
                  <button type="button" onClick={() => setExpandedLogId(expandedLogId === reminder.id ? null : reminder.id)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="View delivery log"><History size={15} /></button>
                  <button type="button" onClick={() => downloadLog(reminder)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="Download log"><Download size={15} /></button>
                  {!["Delivered", "Cancelled"].includes(reminder.status) ? (
                    <button type="button" onClick={() => addEvent(reminder, "Cancelled", "Cancelled", "Reminder cancelled by finance user.")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-red-600" title="Cancel reminder"><X size={15} /></button>
                  ) : null}
                </div>
                {expandedLogId === reminder.id ? (
                  <div className="mt-3 min-w-[280px] rounded-xl border border-slate-100 bg-slate-50 p-3">
                    {reminder.events.map((event, index) => (
                      <div key={`${event.at}-${index}`} className="border-b border-slate-200 py-2 last:border-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{event.action} | {new Date(event.at).toLocaleString("en-IN")}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-600">{event.detail}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}
