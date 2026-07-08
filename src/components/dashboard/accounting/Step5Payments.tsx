"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Banknote, Check, CheckCircle2, Download, FileCheck2, FileUp, Landmark,
  Plus, ReceiptText, RotateCcw, Search, ShieldCheck, Wallet, WalletCards, X,
} from "lucide-react";
import {
  AccountingPage, ActionButton, DataTable, Field,
  MetricCard, Panel, ProgressBar, StatusBadge, WorkflowSteps,
} from "./AccountingComponents";

const INR = "\u20b9";
const allocationTypes = ["Against Invoice", "Client Advance / Unallocated"] as const;
const paymentModes = ["NEFT", "RTGS", "IMPS", "UPI", "Cheque", "Cash", "Stripe", "Razorpay"] as const;
const paymentStatuses = ["Received", "Verified", "Reconciled", "Reversed"] as const;

const clientOptions = [
  { id: "CL-24001", name: "Apex Finserve Pvt Ltd" },
  { id: "CL-24002", name: "Nexa Retail Cloud" },
  { id: "CL-24003", name: "Bluebird Logistics" },
  { id: "CL-24004", name: "KraftEdge Export LLP" },
];

type InvoiceReceivable = {
  id: string;
  clientId: string;
  clientName: string;
  projectName: string;
  currency: string;
  totalAmount: number;
  cashReceived: number;
  tdsAdjusted: number;
  dueDate: string;
  status: "Sent" | "Approved";
};

const initialInvoices: InvoiceReceivable[] = [
  {
    id: "INV-2026-088",
    clientId: "CL-24002",
    clientName: "Nexa Retail Cloud",
    projectName: "E-commerce Mobile App",
    currency: "INR",
    totalAmount: 1275000,
    cashReceived: 472000,
    tdsAdjusted: 28000,
    dueDate: "2026-06-21",
    status: "Sent",
  },
  {
    id: "INV-2026-086",
    clientId: "CL-24003",
    clientName: "Bluebird Logistics",
    projectName: "Logistics Control Tower",
    currency: "INR",
    totalAmount: 360000,
    cashReceived: 120000,
    tdsAdjusted: 0,
    dueDate: "2026-06-30",
    status: "Sent",
  },
  {
    id: "INV-2026-085",
    clientId: "CL-24001",
    clientName: "Apex Finserve Pvt Ltd",
    projectName: "Loan Automation Platform",
    currency: "INR",
    totalAmount: 590000,
    cashReceived: 0,
    tdsAdjusted: 0,
    dueDate: "2026-07-05",
    status: "Approved",
  },
];

const paymentSchema = z.object({
  allocationType: z.enum(allocationTypes),
  invoiceId: z.string().optional(),
  clientId: z.string().min(1, "Select a client"),
  amount: z.coerce.number().positive("Received amount must be greater than 0"),
  date: z.string().min(1, "Payment date required"),
  mode: z.enum(paymentModes),
  reference: z.string().trim().min(3, "Reference or receipt number required"),
  tdsDeducted: z.coerce.number().min(0, "TDS cannot be negative"),
  tdsReference: z.string().optional(),
  bankAccount: z.string().trim().min(2, "Receiving account required"),
  proofName: z.string().optional(),
  remarks: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.allocationType === "Against Invoice" && !data.invoiceId) {
    ctx.addIssue({ code: "custom", path: ["invoiceId"], message: "Select an invoice" });
  }
  if (data.allocationType === "Client Advance / Unallocated" && data.tdsDeducted > 0) {
    ctx.addIssue({ code: "custom", path: ["tdsDeducted"], message: "TDS adjustment requires an invoice" });
  }
  if (data.tdsDeducted > 0 && (data.tdsReference?.trim().length ?? 0) < 3) {
    ctx.addIssue({ code: "custom", path: ["tdsReference"], message: "TDS claim or certificate reference required" });
  }
});

type PaymentFormInput = z.input<typeof paymentSchema>;
type PaymentFormData = z.output<typeof paymentSchema>;
type PaymentStatus = typeof paymentStatuses[number];

type PaymentRecord = {
  id: string;
  allocationType: typeof allocationTypes[number];
  invoiceId: string;
  clientId: string;
  clientName: string;
  amount: number;
  tdsDeducted: number;
  currency: string;
  date: string;
  mode: typeof paymentModes[number];
  reference: string;
  tdsReference: string;
  bankAccount: string;
  proofName: string;
  remarks: string;
  status: PaymentStatus;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
};

const initialPayments: PaymentRecord[] = [
  {
    id: "PAY-2026-101",
    allocationType: "Against Invoice",
    invoiceId: "INV-2026-088",
    clientId: "CL-24002",
    clientName: "Nexa Retail Cloud",
    amount: 472000,
    tdsDeducted: 28000,
    currency: "INR",
    date: "2026-06-11",
    mode: "NEFT",
    reference: "UTR-NEXA-110626",
    tdsReference: "TDS-CLAIM-Q1",
    bankAccount: "HDFC Current Account",
    proofName: "nexa-neft-receipt.pdf",
    remarks: "Kickoff advance adjusted against invoice.",
    status: "Reconciled",
    recordedBy: "Finance Manager",
    createdAt: "2026-06-11T10:00:00.000Z",
    updatedAt: "2026-06-12T10:00:00.000Z",
  },
  {
    id: "PAY-2026-102",
    allocationType: "Against Invoice",
    invoiceId: "INV-2026-086",
    clientId: "CL-24003",
    clientName: "Bluebird Logistics",
    amount: 120000,
    tdsDeducted: 0,
    currency: "INR",
    date: "2026-06-05",
    mode: "IMPS",
    reference: "IMPS-BBL-050626",
    tdsReference: "",
    bankAccount: "HDFC Current Account",
    proofName: "",
    remarks: "Part payment received.",
    status: "Verified",
    recordedBy: "Accountant",
    createdAt: "2026-06-05T10:00:00.000Z",
    updatedAt: "2026-06-05T12:00:00.000Z",
  },
];

const defaultFormValues: PaymentFormInput = {
  allocationType: "Against Invoice",
  invoiceId: "",
  clientId: "",
  amount: 0,
  date: new Date().toISOString().split("T")[0],
  mode: "NEFT",
  reference: "",
  tdsDeducted: 0,
  tdsReference: "",
  bankAccount: "HDFC Current Account",
  proofName: "",
  remarks: "",
};

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

function outstanding(invoice: InvoiceReceivable) {
  return Math.max(0, invoice.totalAmount - invoice.cashReceived - invoice.tdsAdjusted);
}

export default function Step5Payments() {
  const [invoices, setInvoices] = useState<InvoiceReceivable[]>(initialInvoices);
  const [payments, setPayments] = useState<PaymentRecord[]>(initialPayments);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [allocationFilter, setAllocationFilter] = useState("All");

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<PaymentFormInput, unknown, PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: defaultFormValues,
  });

  const watchedAllocation = useWatch({ control, name: "allocationType" });
  const watchedInvoiceId = useWatch({ control, name: "invoiceId" });
  const watchedClientId = useWatch({ control, name: "clientId" });
  const watchedAmount = useWatch({ control, name: "amount" });
  const watchedTds = useWatch({ control, name: "tdsDeducted" });
  const selectedInvoice = invoices.find((invoice) => invoice.id === watchedInvoiceId) ?? null;
  const currentOutstanding = selectedInvoice ? outstanding(selectedInvoice) : 0;
  const settlementAmount = (Number(watchedAmount) || 0) + (Number(watchedTds) || 0);
  const newBalance = currentOutstanding - settlementAmount;

  const availableInvoices = invoices.filter((invoice) =>
    outstanding(invoice) > 0 && (!watchedClientId || invoice.clientId === watchedClientId),
  );

  const filteredPayments = useMemo(() => payments.filter((payment) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || [
      payment.id, payment.invoiceId, payment.clientName, payment.reference,
      payment.tdsReference, payment.mode, payment.bankAccount, payment.proofName,
    ].join(" ").toLowerCase().includes(query);
    const matchesStatus = statusFilter === "All" || payment.status === statusFilter;
    const matchesAllocation = allocationFilter === "All" || payment.allocationType === allocationFilter;
    return matchesSearch && matchesStatus && matchesAllocation;
  }), [allocationFilter, payments, searchTerm, statusFilter]);

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

  const chooseAllocation = (allocationType: PaymentFormData["allocationType"]) => {
    setValue("allocationType", allocationType, { shouldValidate: true });
    setValue("invoiceId", "");
    setValue("clientId", "");
    setValue("tdsDeducted", 0);
    setValue("tdsReference", "");
  };

  const selectInvoice = (invoiceId: string) => {
    setValue("invoiceId", invoiceId, { shouldValidate: true });
    const invoice = invoices.find((item) => item.id === invoiceId);
    if (!invoice) return;
    setValue("clientId", invoice.clientId, { shouldValidate: true });
    setValue("amount", outstanding(invoice), { shouldValidate: true });
  };

  const recordPayment = (data: PaymentFormData) => {
    const normalizedReference = data.reference.trim().toLowerCase();
    if (payments.some((payment) => payment.status !== "Reversed" && payment.reference.trim().toLowerCase() === normalizedReference)) {
      setError("reference", { message: "This payment reference is already recorded" });
      return;
    }

    const client = clientOptions.find((item) => item.id === data.clientId);
    if (!client) return;

    let invoice: InvoiceReceivable | undefined;
    if (data.allocationType === "Against Invoice") {
      invoice = invoices.find((item) => item.id === data.invoiceId);
      if (!invoice || invoice.clientId !== data.clientId) {
        setError("invoiceId", { message: "Invoice does not belong to selected client" });
        return;
      }
      if (data.amount + data.tdsDeducted > outstanding(invoice)) {
        setError("amount", { message: `Settlement exceeds outstanding ${money(outstanding(invoice), invoice.currency)}` });
        return;
      }
    }

    const now = new Date().toISOString();
    const nextNumber = Math.max(102, ...payments.map((payment) => Number(payment.id.split("-").pop()) || 0)) + 1;
    const newPayment: PaymentRecord = {
      id: `PAY-${new Date().getFullYear()}-${String(nextNumber).padStart(3, "0")}`,
      allocationType: data.allocationType,
      invoiceId: data.allocationType === "Against Invoice" ? data.invoiceId ?? "" : "",
      clientId: client.id,
      clientName: client.name,
      amount: data.amount,
      tdsDeducted: data.tdsDeducted,
      currency: invoice?.currency ?? "INR",
      date: data.date,
      mode: data.mode,
      reference: data.reference.trim(),
      tdsReference: data.tdsReference?.trim() ?? "",
      bankAccount: data.bankAccount.trim(),
      proofName: data.proofName?.trim() ?? "",
      remarks: data.remarks?.trim() ?? "",
      status: "Received",
      recordedBy: "Accountant",
      createdAt: now,
      updatedAt: now,
    };

    setPayments((current) => [newPayment, ...current]);
    if (invoice) {
      setInvoices((current) => current.map((item) => item.id === invoice.id ? {
        ...item,
        cashReceived: item.cashReceived + data.amount,
        tdsAdjusted: item.tdsAdjusted + data.tdsDeducted,
      } : item));
    }
    setSuccessMsg(invoice ? "Payment recorded and invoice balance updated" : "Client advance recorded as unallocated");
    setTimeout(closeForm, 900);
  };

  const updateStatus = (paymentId: string, status: PaymentStatus) => {
    setPayments((current) => current.map((payment) => payment.id === paymentId
      ? { ...payment, status, updatedAt: new Date().toISOString() }
      : payment));
  };

  const reversePayment = (payment: PaymentRecord) => {
    if (payment.status === "Reconciled" || payment.status === "Reversed") return;
    setPayments((current) => current.map((item) => item.id === payment.id
      ? { ...item, status: "Reversed", updatedAt: new Date().toISOString() }
      : item));
    if (payment.invoiceId) {
      setInvoices((current) => current.map((invoice) => invoice.id === payment.invoiceId ? {
        ...invoice,
        cashReceived: Math.max(0, invoice.cashReceived - payment.amount),
        tdsAdjusted: Math.max(0, invoice.tdsAdjusted - payment.tdsDeducted),
      } : invoice));
    }
  };

  const exportPayments = () => {
    const rows = [
      ["Payment ID", "Allocation", "Invoice", "Client", "Date", "Mode", "Reference", "Cash Received", "TDS", "Settlement", "Bank Account", "Proof", "Status", "Recorded By"],
      ...filteredPayments.map((payment) => [
        payment.id, payment.allocationType, payment.invoiceId || "Unallocated", payment.clientName,
        payment.date, payment.mode, payment.reference, payment.amount, payment.tdsDeducted,
        payment.amount + payment.tdsDeducted, payment.bankAccount, payment.proofName,
        payment.status, payment.recordedBy,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadFile("payment-register.csv", csv, "text/csv;charset=utf-8");
  };

  const downloadReceipt = (payment: PaymentRecord) => {
    const content = [
      `Payment Receipt: ${payment.id}`,
      `Client: ${payment.clientName} (${payment.clientId})`,
      `Allocation: ${payment.invoiceId || "Client Advance / Unallocated"}`,
      `Payment Date: ${formatDate(payment.date)}`,
      `Mode: ${payment.mode}`,
      `Reference: ${payment.reference}`,
      `Cash Received: ${money(payment.amount, payment.currency)}`,
      `TDS Adjusted: ${money(payment.tdsDeducted, payment.currency)}`,
      `Total Settlement: ${money(payment.amount + payment.tdsDeducted, payment.currency)}`,
      `Receiving Account: ${payment.bankAccount}`,
      `Status: ${payment.status}`,
      `Remarks: ${payment.remarks || "None"}`,
    ].join("\n");
    downloadFile(`${payment.id}.txt`, content, "text/plain;charset=utf-8");
  };

  const activePayments = payments.filter((payment) => payment.status !== "Reversed");
  const totalReceived = activePayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalTds = activePayments.reduce((sum, payment) => sum + payment.tdsDeducted, 0);
  const unallocatedAdvance = activePayments
    .filter((payment) => payment.allocationType === "Client Advance / Unallocated")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const totalOutstanding = invoices.reduce((sum, invoice) => sum + outstanding(invoice), 0);
  const totalInvoiceValue = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const settledInvoiceValue = totalInvoiceValue - totalOutstanding;
  const recoveryRate = totalInvoiceValue ? settledInvoiceValue / totalInvoiceValue * 100 : 0;

  return (
    <AccountingPage
      title="Payment Tracking"
      description="Record invoice collections and client advances with TDS, proof, verification, bank reconciliation, and receivable updates."
      icon={Wallet}
      badge="Collections"
      actions={
        <>
          <ActionButton icon={Download} label="Export Register" variant="outline" onClick={exportPayments} />
          <ActionButton icon={Plus} label="Record Payment" variant="accent" onClick={openForm} />
        </>
      }
    >
      <WorkflowSteps steps={["Receipt Entry", "Proof Check", "Finance Verification", "Bank Reconciliation", "Invoice Settlement"]} />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Cash Received" value={money(totalReceived)} helper="Active payment records" icon={Banknote} tone="green" />
        <MetricCard label="TDS Adjusted" value={money(totalTds)} helper="Against invoice receivables" icon={ShieldCheck} tone="purple" />
        <MetricCard label="Invoice Outstanding" value={money(totalOutstanding)} helper={`${recoveryRate.toFixed(1)}% recovery rate`} icon={WalletCards} tone="amber" />
        <MetricCard label="Unallocated Advance" value={money(unallocatedAdvance)} helper="Client credit awaiting allocation" icon={ReceiptText} tone="blue" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Collection Progress" description="Aggregate invoice settlement across the current receivable register.">
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recovery Rate</p>
                  <p className="text-3xl font-black text-primary">{recoveryRate.toFixed(1)}%</p>
                </div>
                <StatusBadge tone={recoveryRate >= 80 ? "green" : "amber"}>{recoveryRate >= 80 ? "Healthy" : "Follow-up"}</StatusBadge>
              </div>
              <ProgressBar value={recoveryRate} tone={recoveryRate >= 80 ? "green" : recoveryRate >= 40 ? "blue" : "amber"} />
            </div>
            <div className="max-h-[360px] space-y-3 overflow-y-auto pr-2">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="rounded-xl border border-border bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-primary">{invoice.id}</p>
                      <p className="text-xs font-semibold text-slate-500">{invoice.clientName}</p>
                    </div>
                    <p className="text-sm font-black text-red-500">{money(outstanding(invoice), invoice.currency)} due</p>
                  </div>
                  <ProgressBar value={(invoice.totalAmount - outstanding(invoice)) / invoice.totalAmount * 100} tone={outstanding(invoice) === 0 ? "green" : "blue"} />
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Control Queue" description="Receipts waiting for verification or bank reconciliation.">
          <div className="max-h-[500px] space-y-3 overflow-y-auto pr-2">
            {payments.filter((payment) => ["Received", "Verified"].includes(payment.status)).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
                <div className="min-w-0">
                  <p className="font-black text-primary">{payment.id}</p>
                  <p className="truncate text-xs font-semibold text-slate-500">{payment.reference} | {money(payment.amount, payment.currency)}</p>
                </div>
                <StatusBadge tone={payment.status === "Verified" ? "blue" : "amber"}>{payment.status}</StatusBadge>
              </div>
            ))}
            {payments.every((payment) => !["Received", "Verified"].includes(payment.status)) ? (
              <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs font-bold text-slate-400">No pending control items.</p>
            ) : null}
          </div>
        </Panel>
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-slate-100 bg-white p-8 shadow-2xl animate-in zoom-in-95">
            <button type="button" onClick={closeForm} className="absolute right-8 top-8 rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-primary"><X size={24} /></button>

            {successMsg ? (
              <div className="space-y-4 py-20 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 size={48} /></div>
                <h3 className="text-2xl font-black text-primary">{successMsg}</h3>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Receipt is waiting for finance verification.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(recordPayment)} className="space-y-8">
                <div className="border-b border-slate-100 pb-6">
                  <h3 className="text-2xl font-black text-primary">Record Collection</h3>
                  <p className="mt-1 text-sm font-medium text-slate-500">Allocate against an invoice or preserve the amount as client advance.</p>
                </div>

                <Panel title="Allocation Type" description="Invoice settlement updates receivables; client advance remains available for future allocation.">
                  <input type="hidden" {...register("allocationType")} />
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {allocationTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => chooseAllocation(type)}
                        className={`min-h-20 rounded-xl border p-4 text-left transition-all ${watchedAllocation === type ? "border-primary bg-primary text-white shadow-md" : "border-border bg-white text-primary hover:bg-slate-50"}`}
                      >
                        <span className="block text-sm font-black">{type}</span>
                        <span className={`mt-1 block text-xs font-semibold ${watchedAllocation === type ? "text-white/70" : "text-slate-500"}`}>
                          {type === "Against Invoice" ? "Reduce a specific invoice balance including valid TDS." : "Store client credit without selecting an invoice."}
                        </span>
                      </button>
                    ))}
                  </div>
                </Panel>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                  <div className="space-y-8 lg:col-span-2">
                    <Panel title="Transaction Details" description="Bank receipt and allocation identifiers.">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <label className="block space-y-1.5">
                          <span className="text-xs font-black uppercase tracking-widest text-slate-500">Client <span className="text-red-500">*</span></span>
                          <select {...register("clientId")} className={`h-11 w-full rounded-xl border bg-white px-3 text-sm font-semibold text-primary outline-none ${errors.clientId ? "border-red-500" : "border-border focus:border-primary"}`}>
                            <option value="">Select client...</option>
                            {clientOptions.map((client) => <option key={client.id} value={client.id}>{client.id} - {client.name}</option>)}
                          </select>
                          {errors.clientId ? <p className="text-[10px] font-black uppercase tracking-widest text-red-500">{errors.clientId.message}</p> : null}
                        </label>

                        {watchedAllocation === "Against Invoice" ? (
                          <label className="block space-y-1.5">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Invoice <span className="text-red-500">*</span></span>
                            <select {...register("invoiceId")} onChange={(event) => selectInvoice(event.target.value)} className={`h-11 w-full rounded-xl border bg-white px-3 text-sm font-semibold text-primary outline-none ${errors.invoiceId ? "border-red-500" : "border-border focus:border-primary"}`}>
                              <option value="">Select outstanding invoice...</option>
                              {availableInvoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.id} - {invoice.clientName} - Due {money(outstanding(invoice), invoice.currency)}</option>)}
                            </select>
                            {errors.invoiceId ? <p className="text-[10px] font-black uppercase tracking-widest text-red-500">{errors.invoiceId.message}</p> : null}
                          </label>
                        ) : null}

                        <Field label="Payment Date" type="date" required register={register("date")} error={errors.date?.message} />
                        <Field label="Payment Mode" options={[...paymentModes]} required register={register("mode")} error={errors.mode?.message} />
                        <Field label="Reference / UTR / Receipt No." required register={register("reference")} error={errors.reference?.message} />
                        <Field label="Receiving Bank Account" required register={register("bankAccount")} error={errors.bankAccount?.message} />
                        <Field label="Net Amount Received" type="number" step="0.01" required register={register("amount")} error={errors.amount?.message} />
                        {watchedAllocation === "Against Invoice" ? (
                          <>
                            <Field label="TDS Deducted" type="number" step="0.01" register={register("tdsDeducted")} error={errors.tdsDeducted?.message} />
                            {(Number(watchedTds) || 0) > 0 ? <Field label="TDS Claim / Certificate Ref." required register={register("tdsReference")} error={errors.tdsReference?.message} /> : null}
                          </>
                        ) : null}
                        <div className="md:col-span-2">
                          <Field label="Proof File Name" placeholder="Bank receipt PDF or screenshot name" register={register("proofName")} error={errors.proofName?.message} />
                        </div>
                        <div className="md:col-span-2">
                          <Field label="Collection Remarks" multiline register={register("remarks")} error={errors.remarks?.message} />
                        </div>
                      </div>
                    </Panel>
                  </div>

                  <div className="space-y-6">
                    <Panel title="Settlement Preview" description="Balance impact before saving the receipt.">
                      {watchedAllocation === "Against Invoice" && selectedInvoice ? (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                            <p className="text-xs font-black text-primary">{selectedInvoice.id}</p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">{selectedInvoice.clientName}</p>
                          </div>
                          <div className="flex justify-between text-xs font-bold text-slate-500"><span>Current Outstanding</span><span>{money(currentOutstanding, selectedInvoice.currency)}</span></div>
                          <div className="flex justify-between text-xs font-bold text-slate-500"><span>Cash Received</span><span>{money(Number(watchedAmount) || 0, selectedInvoice.currency)}</span></div>
                          <div className="flex justify-between text-xs font-bold text-slate-500"><span>TDS Adjustment</span><span>{money(Number(watchedTds) || 0, selectedInvoice.currency)}</span></div>
                          <div className="border-t border-border pt-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">New Balance</p>
                            <p className={`mt-1 text-2xl font-black ${newBalance < 0 ? "text-red-500" : "text-primary"}`}>{money(newBalance, selectedInvoice.currency)}</p>
                          </div>
                          {newBalance < 0 ? <p className="text-xs font-bold text-red-500">Payment plus TDS cannot exceed invoice outstanding.</p> : null}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                          <p className="text-sm font-black text-blue-800">Unallocated Client Credit</p>
                          <p className="mt-2 text-2xl font-black text-blue-800">{money(Number(watchedAmount) || 0)}</p>
                          <p className="mt-2 text-xs font-semibold leading-5 text-blue-600">This receipt will not reduce any invoice until finance allocates it later.</p>
                        </div>
                      )}
                      <div className="mt-5 flex flex-col gap-3">
                        <ActionButton icon={Banknote} label="Record Payment" variant="accent" type="submit" />
                        <ActionButton label="Cancel" variant="outline" onClick={closeForm} />
                      </div>
                    </Panel>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center">
                      <FileUp className="mx-auto mb-3 text-slate-300" size={32} />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Proof Metadata</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">File name is stored now; real upload requires backend object storage.</p>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}

      <Panel
        title="Collection Ledger"
        description="Receipt allocation, TDS, verification, reconciliation, and reversal history."
        actions={<StatusBadge tone="blue">{filteredPayments.length} Payments</StatusBadge>}
      >
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_190px_230px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search payment, invoice, client, UTR..." className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm font-semibold text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none">
            {["All", ...paymentStatuses].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select value={allocationFilter} onChange={(event) => setAllocationFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none">
            {["All", ...allocationTypes].map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>

        <DataTable columns={["Payment", "Client / Allocation", "Receipt", "Settlement", "Status", "Actions"]}>
          {filteredPayments.map((payment) => (
            <tr key={payment.id} className="text-sm transition-colors hover:bg-slate-50">
              <td className="px-4 py-4">
                <p className="font-black text-primary">{payment.id}</p>
                <p className="text-[11px] font-semibold text-slate-400">{formatDate(payment.date)} | {payment.mode}</p>
              </td>
              <td className="px-4 py-4">
                <p className="font-black text-primary">{payment.clientName}</p>
                <p className="text-xs font-semibold text-slate-500">{payment.invoiceId || "Client Advance / Unallocated"}</p>
              </td>
              <td className="px-4 py-4">
                <p className="font-bold text-slate-600">{payment.reference}</p>
                <p className="text-[11px] font-semibold text-slate-400">{payment.bankAccount}{payment.proofName ? ` | ${payment.proofName}` : ""}</p>
              </td>
              <td className="px-4 py-4">
                <p className="font-black text-primary">{money(payment.amount, payment.currency)}</p>
                <p className="text-[11px] font-semibold text-slate-400">TDS {money(payment.tdsDeducted, payment.currency)} | Total {money(payment.amount + payment.tdsDeducted, payment.currency)}</p>
              </td>
              <td className="px-4 py-4">
                <StatusBadge tone={payment.status === "Reconciled" ? "green" : payment.status === "Verified" ? "blue" : payment.status === "Reversed" ? "red" : "amber"}>{payment.status}</StatusBadge>
              </td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  {payment.status === "Received" ? (
                    <button type="button" onClick={() => updateStatus(payment.id, "Verified")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-blue-600" title="Verify payment"><Check size={15} /></button>
                  ) : null}
                  {payment.status === "Verified" ? (
                    <button type="button" onClick={() => updateStatus(payment.id, "Reconciled")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-green-600" title="Mark bank reconciled"><Landmark size={15} /></button>
                  ) : null}
                  <button type="button" onClick={() => downloadReceipt(payment)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="Download receipt"><Download size={15} /></button>
                  {!["Reconciled", "Reversed"].includes(payment.status) ? (
                    <button type="button" onClick={() => reversePayment(payment)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-red-600" title="Reverse payment"><RotateCcw size={15} /></button>
                  ) : null}
                  {payment.proofName ? <FileCheck2 size={16} className="mt-2 text-emerald-500" aria-label="Proof attached" /> : null}
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}
