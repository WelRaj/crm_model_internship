"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Archive, Ban, Calculator, Check, CheckCircle2, Download, Edit3, FileMinus2,
  RotateCcw, Search, ShieldCheck, Wallet, X,
} from "lucide-react";
import {
  AccountingPage, ActionButton, DataTable, Field,
  MetricCard, Panel, StatusBadge, WorkflowSteps,
} from "./AccountingComponents";

const INR = "\u20b9";
const reasons = ["Scope Reduction", "Billing Correction", "Service Cancellation", "Rate Difference", "GST Correction", "Quality Dispute", "Refund Adjustment"] as const;
const dispositions = ["Adjust Invoice Outstanding", "Customer Refund", "Future Client Credit"] as const;
const creditStatuses = ["Draft", "Pending Approval", "Approved", "Issued", "Rejected", "Archived"] as const;
const gstRates = [0, 5, 12, 18, 28] as const;

type InvoiceSnapshot = {
  id: string;
  clientId: string;
  clientName: string;
  projectName: string;
  invoiceDate: string;
  currency: string;
  taxableAmount: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  cashReceived: number;
  tdsAdjusted: number;
  outstandingAmount: number;
  status: "Sent" | "Approved";
};

const invoiceOptions: InvoiceSnapshot[] = [
  {
    id: "INV-2026-088",
    clientId: "CL-24002",
    clientName: "Nexa Retail Cloud",
    projectName: "E-commerce Mobile App",
    invoiceDate: "2026-06-06",
    currency: "INR",
    taxableAmount: 1080508,
    gstRate: 18,
    gstAmount: 194492,
    totalAmount: 1275000,
    cashReceived: 472000,
    tdsAdjusted: 28000,
    outstandingAmount: 775000,
    status: "Sent",
  },
  {
    id: "INV-2026-086",
    clientId: "CL-24003",
    clientName: "Bluebird Logistics",
    projectName: "Logistics Control Tower",
    invoiceDate: "2026-06-01",
    currency: "INR",
    taxableAmount: 305084.75,
    gstRate: 18,
    gstAmount: 54915.25,
    totalAmount: 360000,
    cashReceived: 120000,
    tdsAdjusted: 0,
    outstandingAmount: 240000,
    status: "Sent",
  },
  {
    id: "INV-2026-085",
    clientId: "CL-24001",
    clientName: "Apex Finserve Pvt Ltd",
    projectName: "Loan Automation Platform",
    invoiceDate: "2026-05-28",
    currency: "INR",
    taxableAmount: 500000,
    gstRate: 18,
    gstAmount: 90000,
    totalAmount: 590000,
    cashReceived: 590000,
    tdsAdjusted: 0,
    outstandingAmount: 0,
    status: "Sent",
  },
];

const creditNoteSchema = z.object({
  invoiceId: z.string().min(1, "Select original invoice"),
  date: z.string().min(1, "Issue date required"),
  reason: z.enum(reasons),
  disposition: z.enum(dispositions),
  creditBaseAmount: z.coerce.number().positive("Credit amount must be greater than 0"),
  gstRate: z.coerce.number().refine((value) => gstRates.includes(value as typeof gstRates[number]), "Select a valid GST rate"),
  customerReference: z.string().optional(),
  remarks: z.string().trim().min(5, "Detailed audit remarks required"),
}).superRefine((data, ctx) => {
  const invoice = invoiceOptions.find((item) => item.id === data.invoiceId);
  if (!invoice) return;
  if (data.date < invoice.invoiceDate) {
    ctx.addIssue({ code: "custom", path: ["date"], message: "Credit note date cannot be before invoice date" });
  }
  if (data.gstRate > invoice.gstRate && data.reason !== "GST Correction") {
    ctx.addIssue({ code: "custom", path: ["gstRate"], message: "GST reversal cannot exceed the original invoice rate" });
  }
  if (data.disposition === "Adjust Invoice Outstanding" && invoice.outstandingAmount <= 0) {
    ctx.addIssue({ code: "custom", path: ["disposition"], message: "Fully settled invoice requires refund or future credit" });
  }
  if (data.disposition === "Customer Refund" && invoice.cashReceived <= 0) {
    ctx.addIssue({ code: "custom", path: ["disposition"], message: "Customer refund requires an amount already received" });
  }
});

type CreditNoteFormInput = z.input<typeof creditNoteSchema>;
type CreditNoteFormData = z.output<typeof creditNoteSchema>;
type CreditStatus = typeof creditStatuses[number];

type CreditNoteRecord = {
  id: string;
  invoiceId: string;
  clientId: string;
  clientName: string;
  projectName: string;
  date: string;
  currency: string;
  reason: typeof reasons[number];
  disposition: typeof dispositions[number];
  creditBaseAmount: number;
  gstRate: number;
  gstAmount: number;
  totalCredit: number;
  outstandingAdjusted: number;
  refundLiability: number;
  futureCredit: number;
  customerReference: string;
  remarks: string;
  status: CreditStatus;
  approvedBy: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

const initialCreditNotes: CreditNoteRecord[] = [
  {
    id: "CN-2026-014",
    invoiceId: "INV-2026-086",
    clientId: "CL-24003",
    clientName: "Bluebird Logistics",
    projectName: "Logistics Control Tower",
    date: "2026-06-12",
    currency: "INR",
    reason: "Scope Reduction",
    disposition: "Adjust Invoice Outstanding",
    creditBaseAmount: 30000,
    gstRate: 18,
    gstAmount: 5400,
    totalCredit: 35400,
    outstandingAdjusted: 35400,
    refundLiability: 0,
    futureCredit: 0,
    customerReference: "EMAIL-120626",
    remarks: "Warehouse analytics scope removed before final delivery.",
    status: "Issued",
    approvedBy: "Finance Manager",
    createdBy: "Accountant",
    createdAt: "2026-06-12T10:00:00.000Z",
    updatedAt: "2026-06-13T10:00:00.000Z",
  },
  {
    id: "CN-2026-015",
    invoiceId: "INV-2026-088",
    clientId: "CL-24002",
    clientName: "Nexa Retail Cloud",
    projectName: "E-commerce Mobile App",
    date: "2026-06-18",
    currency: "INR",
    reason: "Billing Correction",
    disposition: "Adjust Invoice Outstanding",
    creditBaseAmount: 18500,
    gstRate: 18,
    gstAmount: 3330,
    totalCredit: 21830,
    outstandingAdjusted: 0,
    refundLiability: 0,
    futureCredit: 0,
    customerReference: "NEXA-DISPUTE-18",
    remarks: "Duplicate support line item identified during client reconciliation.",
    status: "Pending Approval",
    approvedBy: "",
    createdBy: "Accountant",
    createdAt: "2026-06-18T10:00:00.000Z",
    updatedAt: "2026-06-18T10:00:00.000Z",
  },
  {
    id: "CN-2026-016",
    invoiceId: "INV-2026-085",
    clientId: "CL-24001",
    clientName: "Apex Finserve Pvt Ltd",
    projectName: "Loan Automation Platform",
    date: "2026-06-20",
    currency: "INR",
    reason: "Refund Adjustment",
    disposition: "Customer Refund",
    creditBaseAmount: 42000,
    gstRate: 18,
    gstAmount: 7560,
    totalCredit: 49560,
    outstandingAdjusted: 0,
    refundLiability: 0,
    futureCredit: 0,
    customerReference: "APEX-REFUND-REQ",
    remarks: "Refund requested for a cancelled integration add-on.",
    status: "Draft",
    approvedBy: "",
    createdBy: "Accountant",
    createdAt: "2026-06-20T10:00:00.000Z",
    updatedAt: "2026-06-20T10:00:00.000Z",
  },
];

const defaultFormValues: CreditNoteFormInput = {
  invoiceId: "",
  date: new Date().toISOString().split("T")[0],
  reason: "Billing Correction",
  disposition: "Adjust Invoice Outstanding",
  creditBaseAmount: 0,
  gstRate: 18,
  customerReference: "",
  remarks: "",
};

function calculateCredit(baseValue: unknown, gstValue: unknown) {
  const creditBaseAmount = Number(baseValue) || 0;
  const gstRate = Number(gstValue) || 0;
  const gstAmount = creditBaseAmount * gstRate / 100;
  return { creditBaseAmount, gstRate, gstAmount, totalCredit: creditBaseAmount + gstAmount };
}

function money(value: number, currency = "INR") {
  const symbol = currency === "INR" ? INR : currency;
  return `${symbol} ${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
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

export default function Step7CreditNotes() {
  const [creditNotes, setCreditNotes] = useState<CreditNoteRecord[]>(initialCreditNotes);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dispositionFilter, setDispositionFilter] = useState("All");

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CreditNoteFormInput, unknown, CreditNoteFormData>({
    resolver: zodResolver(creditNoteSchema),
    defaultValues: defaultFormValues,
  });

  const watchedInvoiceId = useWatch({ control, name: "invoiceId" });
  const watchedBaseAmount = useWatch({ control, name: "creditBaseAmount" });
  const watchedGstRate = useWatch({ control, name: "gstRate" });
  const watchedDisposition = useWatch({ control, name: "disposition" });
  const selectedInvoice = invoiceOptions.find((invoice) => invoice.id === watchedInvoiceId) ?? null;
  const totals = useMemo(() => calculateCredit(watchedBaseAmount, watchedGstRate), [watchedBaseAmount, watchedGstRate]);

  const activeCreditTotal = (invoiceId: string, excludeId?: string | null) => creditNotes
    .filter((note) => note.invoiceId === invoiceId && note.id !== excludeId && !["Rejected", "Archived"].includes(note.status))
    .reduce((sum, note) => sum + note.totalCredit, 0);

  const reservedByDisposition = (
    invoiceId: string,
    disposition: CreditNoteRecord["disposition"],
    excludeId?: string | null,
  ) => creditNotes
    .filter((note) =>
      note.invoiceId === invoiceId
      && note.id !== excludeId
      && note.disposition === disposition
      && !["Rejected", "Archived"].includes(note.status),
    )
    .reduce((sum, note) => sum + note.totalCredit, 0);

  const availableCredit = selectedInvoice
    ? Math.max(0, selectedInvoice.totalAmount - activeCreditTotal(selectedInvoice.id, editingId))
    : 0;

  const filteredCreditNotes = useMemo(() => creditNotes.filter((note) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || [
      note.id, note.invoiceId, note.clientName, note.projectName, note.reason,
      note.disposition, note.customerReference, note.status,
    ].join(" ").toLowerCase().includes(query);
    const matchesStatus = statusFilter === "All" || note.status === statusFilter;
    const matchesDisposition = dispositionFilter === "All" || note.disposition === dispositionFilter;
    return matchesSearch && matchesStatus && matchesDisposition;
  }), [creditNotes, dispositionFilter, searchTerm, statusFilter]);

  const openCreateForm = () => {
    setEditingId(null);
    setSuccessMsg("");
    reset(defaultFormValues);
    setShowForm(true);
  };

  const openEditForm = (note: CreditNoteRecord) => {
    if (!["Draft", "Pending Approval"].includes(note.status)) return;
    setEditingId(note.id);
    setSuccessMsg("");
    reset({
      invoiceId: note.invoiceId,
      date: note.date,
      reason: note.reason,
      disposition: note.disposition,
      creditBaseAmount: note.creditBaseAmount,
      gstRate: note.gstRate,
      customerReference: note.customerReference,
      remarks: note.remarks,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setSuccessMsg("");
    reset(defaultFormValues);
  };

  const selectInvoice = (invoiceId: string) => {
    setValue("invoiceId", invoiceId, { shouldValidate: true });
    const invoice = invoiceOptions.find((item) => item.id === invoiceId);
    if (!invoice) return;
    setValue("gstRate", invoice.gstRate, { shouldValidate: true });
    setValue("disposition", invoice.outstandingAmount > 0 ? "Adjust Invoice Outstanding" : "Customer Refund", { shouldValidate: true });
  };

  const persistCreditNote = (data: CreditNoteFormData, status: CreditStatus) => {
    const invoice = invoiceOptions.find((item) => item.id === data.invoiceId);
    if (!invoice) return;
    const calculated = calculateCredit(data.creditBaseAmount, data.gstRate);
    const remainingAvailable = Math.max(0, invoice.totalAmount - activeCreditTotal(invoice.id, editingId));
    if (calculated.totalCredit > remainingAvailable) {
      setError("creditBaseAmount", { message: `Credit exceeds available invoice value ${money(remainingAvailable, invoice.currency)}` });
      return;
    }
    const remainingOutstanding = Math.max(
      0,
      invoice.outstandingAmount - reservedByDisposition(invoice.id, "Adjust Invoice Outstanding", editingId),
    );
    if (data.disposition === "Adjust Invoice Outstanding" && calculated.totalCredit > remainingOutstanding) {
      setError("creditBaseAmount", { message: `Outstanding adjustment cannot exceed ${money(remainingOutstanding, invoice.currency)}` });
      return;
    }
    const remainingRefundable = Math.max(
      0,
      invoice.cashReceived - reservedByDisposition(invoice.id, "Customer Refund", editingId),
    );
    if (data.disposition === "Customer Refund" && calculated.totalCredit > remainingRefundable) {
      setError("creditBaseAmount", { message: `Refund cannot exceed remaining refundable value ${money(remainingRefundable, invoice.currency)}` });
      return;
    }

    const now = new Date().toISOString();
    const common = {
      invoiceId: invoice.id,
      clientId: invoice.clientId,
      clientName: invoice.clientName,
      projectName: invoice.projectName,
      date: data.date,
      currency: invoice.currency,
      reason: data.reason,
      disposition: data.disposition,
      creditBaseAmount: calculated.creditBaseAmount,
      gstRate: calculated.gstRate,
      gstAmount: calculated.gstAmount,
      totalCredit: calculated.totalCredit,
      customerReference: data.customerReference?.trim() ?? "",
      remarks: data.remarks.trim(),
      status,
      updatedAt: now,
    };

    if (editingId) {
      setCreditNotes((current) => current.map((note) => note.id === editingId ? {
        ...note,
        ...common,
        outstandingAdjusted: 0,
        refundLiability: 0,
        futureCredit: 0,
      } : note));
      setSuccessMsg(status === "Draft" ? "Credit note draft updated" : "Credit note submitted for approval");
    } else {
      const nextNumber = Math.max(16, ...creditNotes.map((note) => Number(note.id.split("-").pop()) || 0)) + 1;
      setCreditNotes((current) => [{
        id: `CN-${new Date().getFullYear()}-${String(nextNumber).padStart(3, "0")}`,
        ...common,
        outstandingAdjusted: 0,
        refundLiability: 0,
        futureCredit: 0,
        approvedBy: "",
        createdBy: "Accountant",
        createdAt: now,
      }, ...current]);
      setSuccessMsg(status === "Draft" ? "Credit note draft saved" : "Credit note submitted for approval");
    }
    setTimeout(closeForm, 900);
  };

  const saveDraft = handleSubmit((data) => persistCreditNote(data, "Draft"));
  const submitForApproval = handleSubmit((data) => persistCreditNote(data, "Pending Approval"));

  const updateStatus = (note: CreditNoteRecord, status: CreditStatus) => {
    const now = new Date().toISOString();
    setCreditNotes((current) => current.map((item) => item.id === note.id ? {
      ...item,
      status,
      approvedBy: status === "Approved" ? "Finance Manager" : item.approvedBy,
      outstandingAdjusted: status === "Issued" && item.disposition === "Adjust Invoice Outstanding" ? item.totalCredit : item.outstandingAdjusted,
      refundLiability: status === "Issued" && item.disposition === "Customer Refund" ? item.totalCredit : item.refundLiability,
      futureCredit: status === "Issued" && item.disposition === "Future Client Credit" ? item.totalCredit : item.futureCredit,
      updatedAt: now,
    } : item));
  };

  const exportCreditNotes = () => {
    const rows = [
      ["Credit Note", "Invoice", "Client", "Issue Date", "Reason", "Disposition", "Base Credit", "GST Rate", "GST Reversal", "Total Credit", "Outstanding Adjusted", "Refund Liability", "Future Credit", "Status", "Approved By"],
      ...filteredCreditNotes.map((note) => [
        note.id, note.invoiceId, note.clientName, note.date, note.reason, note.disposition,
        note.creditBaseAmount, note.gstRate, note.gstAmount, note.totalCredit,
        note.outstandingAdjusted, note.refundLiability, note.futureCredit, note.status, note.approvedBy,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadFile("credit-note-register.csv", csv, "text/csv;charset=utf-8");
  };

  const downloadCreditNote = (note: CreditNoteRecord) => {
    const content = [
      `Credit Note: ${note.id}`,
      `Original Invoice: ${note.invoiceId}`,
      `Client: ${note.clientName} (${note.clientId})`,
      `Project: ${note.projectName}`,
      `Issue Date: ${formatDate(note.date)}`,
      `Reason: ${note.reason}`,
      `Disposition: ${note.disposition}`,
      "",
      `Base Credit: ${money(note.creditBaseAmount, note.currency)}`,
      `GST Reversal (${note.gstRate}%): ${money(note.gstAmount, note.currency)}`,
      `Total Credit: ${money(note.totalCredit, note.currency)}`,
      `Status: ${note.status}`,
      `Customer Reference: ${note.customerReference || "Not provided"}`,
      `Audit Remarks: ${note.remarks}`,
    ].join("\n");
    downloadFile(`${note.id}.txt`, content, "text/plain;charset=utf-8");
  };

  const activeNotes = creditNotes.filter((note) => !["Rejected", "Archived"].includes(note.status));
  const issuedThisMonth = activeNotes.filter((note) => note.status === "Issued").reduce((sum, note) => sum + note.totalCredit, 0);
  const gstAdjustment = activeNotes.filter((note) => note.status === "Issued").reduce((sum, note) => sum + note.gstAmount, 0);
  const pendingApproval = creditNotes.filter((note) => note.status === "Pending Approval").length;
  const refundRisk = activeNotes.filter((note) => note.disposition === "Customer Refund" && ["Approved", "Issued"].includes(note.status)).reduce((sum, note) => sum + note.totalCredit, 0);

  return (
    <AccountingPage
      title="Credit Note Management"
      description="Create controlled invoice corrections with tax reversal, approval, outstanding adjustment, refund liability, and client credit tracking."
      icon={RotateCcw}
      badge="Invoice correction"
      actions={
        <>
          <ActionButton icon={Download} label="Export Register" variant="outline" onClick={exportCreditNotes} />
          <ActionButton icon={FileMinus2} label="Issue Credit Note" variant="accent" onClick={openCreateForm} />
        </>
      }
    >
      <WorkflowSteps steps={["Original Invoice", "Credit Draft", "Finance Approval", "Issue Credit Note", "Ledger / GST Adjustment"]} />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Issued Value" value={money(issuedThisMonth)} helper="Issued credit notes" icon={FileMinus2} tone="blue" />
        <MetricCard label="GST Reversal" value={money(gstAdjustment)} helper="Issued sales-return tax impact" icon={Wallet} tone="amber" />
        <MetricCard label="Pending Approval" value={String(pendingApproval)} helper="Finance manager queue" icon={ShieldCheck} tone="purple" />
        <MetricCard label="Refund Liability" value={money(refundRisk)} helper="Approved or issued refunds" icon={Ban} tone="red" />
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] border border-slate-100 bg-white p-8 shadow-2xl animate-in zoom-in-95">
            <button type="button" onClick={closeForm} className="absolute right-8 top-8 rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-primary"><X size={24} /></button>

            {successMsg ? (
              <div className="space-y-4 py-20 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600"><RotateCcw size={48} /></div>
                <h3 className="text-2xl font-black text-primary">{successMsg}</h3>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Invoice and tax impact will apply only after approval and issue.</p>
              </div>
            ) : (
              <form onSubmit={submitForApproval} className="space-y-8">
                <div className="border-b border-slate-100 pb-6">
                  <h3 className="text-2xl font-black text-primary">{editingId ? "Edit Credit Note" : "Create Credit Note"}</h3>
                  <p className="mt-1 text-sm font-medium text-slate-500">Draft and pending notes remain editable. Issued notes preserve the audit trail.</p>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                  <div className="space-y-8 lg:col-span-3">
                    <Panel title="Original Invoice" description="Client and financial limits are derived from the selected invoice.">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <label className="block space-y-1.5">
                          <span className="text-xs font-black uppercase tracking-widest text-slate-500">Invoice Reference <span className="text-red-500">*</span></span>
                          <select {...register("invoiceId")} onChange={(event) => selectInvoice(event.target.value)} className={`h-11 w-full rounded-xl border bg-white px-3 text-sm font-semibold text-primary outline-none ${errors.invoiceId ? "border-red-500" : "border-border focus:border-primary"}`}>
                            <option value="">Select invoice...</option>
                            {invoiceOptions.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.id} - {invoice.clientName} - {money(invoice.totalAmount, invoice.currency)}</option>)}
                          </select>
                          {errors.invoiceId ? <p className="text-[10px] font-black uppercase tracking-widest text-red-500">{errors.invoiceId.message}</p> : null}
                        </label>
                        <Field label="Issue Date" type="date" required register={register("date")} error={errors.date?.message} />
                      </div>
                      {selectedInvoice ? (
                        <div className="mt-5 grid grid-cols-1 gap-4 rounded-xl border border-blue-100 bg-blue-50 p-5 md:grid-cols-4">
                          <div><p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Client</p><p className="text-sm font-black text-blue-900">{selectedInvoice.clientName}</p></div>
                          <div><p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Invoice Value</p><p className="text-sm font-black text-blue-900">{money(selectedInvoice.totalAmount, selectedInvoice.currency)}</p></div>
                          <div><p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Outstanding</p><p className="text-sm font-black text-blue-900">{money(selectedInvoice.outstandingAmount, selectedInvoice.currency)}</p></div>
                          <div><p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Available Credit</p><p className="text-sm font-black text-blue-900">{money(availableCredit, selectedInvoice.currency)}</p></div>
                        </div>
                      ) : null}
                    </Panel>

                    <Panel title="Correction Details" description="Reason, settlement method, base credit, and GST reversal.">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Field label="Adjustment Reason" options={[...reasons]} required register={register("reason")} error={errors.reason?.message} />
                        <Field label="Credit Disposition" options={[...dispositions]} required register={register("disposition")} error={errors.disposition?.message} />
                        <Field label="Credit Base Amount" type="number" step="0.01" required register={register("creditBaseAmount")} error={errors.creditBaseAmount?.message} />
                        <Field label="GST Reversal Rate" options={gstRates.map(String)} required register={register("gstRate")} error={errors.gstRate?.message} />
                        <Field label="Customer Reference" placeholder="Email, ticket, PO amendment, or dispute ref." register={register("customerReference")} error={errors.customerReference?.message} />
                        <div className="md:col-span-2"><Field label="Audit Remarks" multiline required register={register("remarks")} error={errors.remarks?.message} /></div>
                      </div>
                    </Panel>
                  </div>

                  <div className="space-y-6">
                    <Panel title="Ledger Impact" description="Preview before finance approval.">
                      <div className="space-y-5">
                        <div className="relative overflow-hidden rounded-2xl bg-red-500 p-6 text-white shadow-xl">
                          <Calculator className="absolute -bottom-4 -right-4 text-white/10" size={100} />
                          <div className="relative z-10 space-y-3">
                            <div className="flex justify-between text-xs font-bold text-white/80"><span>Base Credit</span><span>{money(totals.creditBaseAmount, selectedInvoice?.currency)}</span></div>
                            <div className="flex justify-between text-xs font-bold text-white/80"><span>GST Reversal</span><span>{money(totals.gstAmount, selectedInvoice?.currency)}</span></div>
                            <div className="border-t border-white/20 pt-4">
                              <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Total Credit</p>
                              <p className="mt-1 text-3xl font-black">{money(totals.totalCredit, selectedInvoice?.currency)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Disposition</p>
                          <p className="mt-1 text-sm font-black text-primary">{watchedDisposition}</p>
                        </div>
                        <ActionButton icon={ShieldCheck} label="Submit for Approval" variant="accent" type="submit" />
                        <ActionButton icon={FileMinus2} label="Save Draft" variant="outline" onClick={saveDraft} />
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
        title="Credit Note Register"
        description="Invoice correction, GST reversal, approval state, and settlement disposition."
        actions={<StatusBadge tone="blue">{filteredCreditNotes.length} Credit Notes</StatusBadge>}
      >
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_190px_240px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search credit note, invoice, client, reason..." className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm font-semibold text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none">
            {["All", ...creditStatuses].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select value={dispositionFilter} onChange={(event) => setDispositionFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none">
            {["All", ...dispositions].map((disposition) => <option key={disposition} value={disposition}>{disposition}</option>)}
          </select>
        </div>

        <DataTable columns={["Credit Note / Invoice", "Client / Reason", "Credit Value", "Disposition", "Status", "Actions"]}>
          {filteredCreditNotes.map((note) => (
            <tr key={note.id} className="text-sm transition-colors hover:bg-slate-50">
              <td className="px-4 py-4">
                <p className="font-black text-primary">{note.id}</p>
                <p className="text-xs font-semibold text-slate-500">{note.invoiceId} | {formatDate(note.date)}</p>
              </td>
              <td className="px-4 py-4">
                <p className="font-black text-primary">{note.clientName}</p>
                <p className="text-xs font-semibold text-slate-500">{note.reason}</p>
              </td>
              <td className="px-4 py-4">
                <p className="font-black text-primary">{money(note.totalCredit, note.currency)}</p>
                <p className="text-[11px] font-semibold text-slate-400">Base {money(note.creditBaseAmount, note.currency)} | GST {note.gstRate}%</p>
              </td>
              <td className="px-4 py-4">
                <p className="font-bold text-slate-600">{note.disposition}</p>
                {note.status === "Issued" ? (
                  <p className="text-[11px] font-semibold text-slate-400">
                    {note.outstandingAdjusted > 0 ? `Adjusted ${money(note.outstandingAdjusted, note.currency)}` : note.refundLiability > 0 ? `Refund ${money(note.refundLiability, note.currency)}` : `Future credit ${money(note.futureCredit, note.currency)}`}
                  </p>
                ) : null}
              </td>
              <td className="px-4 py-4">
                <StatusBadge tone={note.status === "Issued" || note.status === "Approved" ? "green" : note.status === "Pending Approval" ? "amber" : note.status === "Rejected" || note.status === "Archived" ? "red" : "slate"}>{note.status}</StatusBadge>
              </td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  {["Draft", "Pending Approval"].includes(note.status) ? (
                    <button type="button" onClick={() => openEditForm(note)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="Edit credit note"><Edit3 size={15} /></button>
                  ) : null}
                  {note.status === "Draft" ? (
                    <button type="button" onClick={() => updateStatus(note, "Pending Approval")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-amber-600" title="Submit for approval"><ShieldCheck size={15} /></button>
                  ) : null}
                  {note.status === "Pending Approval" ? (
                    <>
                      <button type="button" onClick={() => updateStatus(note, "Approved")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-green-600" title="Approve credit note"><Check size={15} /></button>
                      <button type="button" onClick={() => updateStatus(note, "Rejected")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-red-600" title="Reject credit note"><X size={15} /></button>
                    </>
                  ) : null}
                  {note.status === "Approved" ? (
                    <button type="button" onClick={() => updateStatus(note, "Issued")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-green-600" title="Issue and post adjustment"><CheckCircle2 size={15} /></button>
                  ) : null}
                  <button type="button" onClick={() => downloadCreditNote(note)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="Download credit note"><Download size={15} /></button>
                  {!["Issued", "Archived"].includes(note.status) ? (
                    <button type="button" onClick={() => updateStatus(note, "Archived")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-red-600" title="Archive credit note"><Archive size={15} /></button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}
