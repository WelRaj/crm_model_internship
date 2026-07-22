"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  createPayment,
  listFinanceClients,
  listFinanceResource,
  listInvoices,
  listPayments,
  runPaymentAction,
  type FinanceClientRecord,
  type InvoiceRecord as BackendInvoiceRecord,
  type PaymentPayload,
  type PaymentRecord as BackendPaymentRecord,
} from "@/services/finance-api";

const INR = "\u20b9";
const allocationTypes = ["Against Invoice", "Client Advance / Unallocated"] as const;
const paymentModes = ["NEFT", "RTGS", "IMPS", "UPI", "Cheque", "Cash", "Stripe", "Razorpay"] as const;
const paymentStatuses = ["Received", "Verified", "Reconciled", "Reversed"] as const;

type InvoiceReceivable = {
  id: string;
  backendId: string;
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
  backendId: string;
  allocationType: typeof allocationTypes[number];
  invoiceId: string;
  invoiceCode: string;
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

type BankAccountRecord = {
  id: string;
  account_name: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  status: string;
  verification_status: string;
  is_primary: boolean;
};

const apiToPaymentStatus: Record<BackendPaymentRecord["status"], PaymentStatus> = {
  received: "Received",
  verified: "Verified",
  reconciled: "Reconciled",
  reversed: "Reversed",
};

const paymentStatusToApi: Record<PaymentStatus, BackendPaymentRecord["status"]> = {
  Received: "received",
  Verified: "verified",
  Reconciled: "reconciled",
  Reversed: "reversed",
};

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

function clientName(clientId: string, clients: FinanceClientRecord[]) {
  return clients.find((client) => client.id === clientId)?.company_name || "Finance client";
}

function bankLabel(bankId: string | null, banks: BankAccountRecord[]) {
  const bank = banks.find((item) => item.id === bankId);
  return bank ? `${bank.bank_name} - ${bank.account_name}` : "";
}

function invoiceFromBackend(row: BackendInvoiceRecord, clients: FinanceClientRecord[]): InvoiceReceivable {
  return {
    id: row.invoice_number,
    backendId: row.id,
    clientId: row.client,
    clientName: clientName(row.client, clients),
    projectName: row.project || "Direct / Milestone",
    currency: row.currency,
    totalAmount: Number(row.total_amount),
    cashReceived: Number(row.paid_amount),
    tdsAdjusted: Number(row.tds_amount),
    dueDate: row.due_date,
    status: row.status === "sent" ? "Sent" : "Approved",
  };
}

function paymentFromBackend(row: BackendPaymentRecord, clients: FinanceClientRecord[], invoices: BackendInvoiceRecord[], banks: BankAccountRecord[]): PaymentRecord {
  const allocation = row.allocations[0];
  const invoice = allocation ? invoices.find((item) => item.id === allocation.invoice) : null;
  return {
    id: row.payment_number,
    backendId: row.id,
    allocationType: row.allocation_type === "invoice" ? "Against Invoice" : "Client Advance / Unallocated",
    invoiceId: allocation?.invoice || "",
    invoiceCode: invoice?.invoice_number || "",
    clientId: row.client,
    clientName: clientName(row.client, clients),
    amount: Number(row.amount),
    tdsDeducted: Number(row.tds_amount),
    currency: row.currency,
    date: row.payment_date,
    mode: row.mode as typeof paymentModes[number],
    reference: row.reference,
    tdsReference: row.allocations.map((item) => item.id).join(", "),
    bankAccount: bankLabel(row.bank_account, banks),
    proofName: row.proof_name,
    remarks: row.remarks,
    status: apiToPaymentStatus[row.status],
    recordedBy: "Finance",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function paymentPayload(data: PaymentFormData): PaymentPayload {
  const isInvoicePayment = data.allocationType === "Against Invoice";
  return {
    client_id: data.clientId,
    allocation_type: isInvoicePayment ? "invoice" : "advance",
    amount: String(data.amount),
    tds_amount: String(data.tdsDeducted),
    currency: "INR",
    payment_date: data.date,
    mode: data.mode,
    reference: data.reference.trim(),
    bank_account_id: data.bankAccount || null,
    proof_name: data.proofName?.trim() || "",
    remarks: [data.remarks?.trim() || "", data.tdsReference?.trim() ? `TDS Ref: ${data.tdsReference.trim()}` : ""].filter(Boolean).join(" | "),
    allocations: isInvoicePayment && data.invoiceId ? [{
      invoice_id: data.invoiceId,
      amount: String(data.amount),
      tds_amount: String(data.tdsDeducted),
    }] : [],
  };
}

export default function Step5Payments() {
  const [clients, setClients] = useState<FinanceClientRecord[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccountRecord[]>([]);
  const [invoices, setInvoices] = useState<InvoiceReceivable[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [backendMessage, setBackendMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
  const selectedInvoice = invoices.find((invoice) => invoice.backendId === watchedInvoiceId) ?? null;
  const currentOutstanding = selectedInvoice ? outstanding(selectedInvoice) : 0;
  const settlementAmount = (Number(watchedAmount) || 0) + (Number(watchedTds) || 0);
  const newBalance = currentOutstanding - settlementAmount;

  const availableInvoices = invoices.filter((invoice) =>
    outstanding(invoice) > 0 && (!watchedClientId || invoice.clientId === watchedClientId),
  );

  const clientOptions = useMemo(
    () => clients.filter((client) => client.status === "active").map((client) => ({ id: client.id, name: client.company_name })),
    [clients],
  );

  const bankOptions = useMemo(
    () => bankAccounts
      .filter((bank) => bank.status === "active")
      .map((bank) => ({ id: bank.id, label: `${bank.bank_name} - ${bank.account_name}` })),
    [bankAccounts],
  );

  const applyBackendRows = (
    clientRows: FinanceClientRecord[],
    invoiceRows: BackendInvoiceRecord[],
    paymentRows: BackendPaymentRecord[],
    bankRows: BankAccountRecord[],
  ) => {
    setClients(clientRows);
    setBankAccounts(bankRows);
    setInvoices(invoiceRows
      .filter((invoice) => ["approved", "sent"].includes(invoice.status))
      .map((invoice) => invoiceFromBackend(invoice, clientRows)));
    setPayments(paymentRows.map((payment) => paymentFromBackend(payment, clientRows, invoiceRows, bankRows)));
  };

  const fetchBackendRows = async () => Promise.all([
    listFinanceClients({ status: "active" }),
    listInvoices(),
    listPayments(),
    listFinanceResource<BankAccountRecord>("bank-accounts", { status: "active" }),
  ]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [clientRows, invoiceRows, paymentRows, bankRows] = await fetchBackendRows();
      applyBackendRows(clientRows, invoiceRows, paymentRows, bankRows);
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to load payment backend data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchBackendRows()
      .then(([clientRows, invoiceRows, paymentRows, bankRows]) => {
        if (!isMounted) return;
        applyBackendRows(clientRows, invoiceRows, paymentRows, bankRows);
      })
      .catch((error) => {
        if (!isMounted) return;
        setBackendMessage(error instanceof Error ? error.message : "Unable to load payment backend data.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPayments = useMemo(() => payments.filter((payment) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || [
      payment.id, payment.invoiceCode, payment.invoiceId, payment.clientName, payment.reference,
      payment.tdsReference, payment.mode, payment.bankAccount, payment.proofName,
    ].join(" ").toLowerCase().includes(query);
    const matchesStatus = statusFilter === "All" || payment.status === statusFilter;
    const matchesAllocation = allocationFilter === "All" || payment.allocationType === allocationFilter;
    return matchesSearch && matchesStatus && matchesAllocation;
  }), [allocationFilter, payments, searchTerm, statusFilter]);

  const openForm = () => {
    reset({ ...defaultFormValues, bankAccount: bankOptions[0]?.id || "" });
    setSuccessMsg("");
    setBackendMessage("");
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
    const invoice = invoices.find((item) => item.backendId === invoiceId);
    if (!invoice) return;
    setValue("clientId", invoice.clientId, { shouldValidate: true });
    setValue("amount", outstanding(invoice), { shouldValidate: true });
  };

  const recordPayment = async (data: PaymentFormData) => {
    const normalizedReference = data.reference.trim().toLowerCase();
    if (payments.some((payment) => payment.status !== "Reversed" && payment.reference.trim().toLowerCase() === normalizedReference)) {
      setError("reference", { message: "This payment reference is already recorded" });
      return;
    }

    const client = clientOptions.find((item) => item.id === data.clientId);
    if (!client) return;

    let invoice: InvoiceReceivable | undefined;
    if (data.allocationType === "Against Invoice") {
      invoice = invoices.find((item) => item.backendId === data.invoiceId);
      if (!invoice || invoice.clientId !== data.clientId) {
        setError("invoiceId", { message: "Invoice does not belong to selected client" });
        return;
      }
      if (data.amount + data.tdsDeducted > outstanding(invoice)) {
        setError("amount", { message: `Settlement exceeds outstanding ${money(outstanding(invoice), invoice.currency)}` });
        return;
      }
    }

    try {
      setIsSaving(true);
      setBackendMessage("");
      await createPayment(paymentPayload(data));
      await loadData();
      setSuccessMsg(invoice ? "Payment recorded and invoice balance updated" : "Client advance recorded as unallocated");
      setTimeout(closeForm, 900);
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to record payment.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (paymentId: string, status: PaymentStatus) => {
    try {
      setBackendMessage("");
      await runPaymentAction(paymentId, paymentStatusToApi[status]);
      await loadData();
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to update payment status.");
    }
  };

  const reversePayment = async (payment: PaymentRecord) => {
    if (payment.status === "Reconciled" || payment.status === "Reversed") return;
    try {
      setBackendMessage("");
      await runPaymentAction(payment.backendId, "reversed");
      await loadData();
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to reverse payment.");
    }
  };

  const exportPayments = () => {
    const rows = [
      ["Payment ID", "Allocation", "Invoice", "Client", "Date", "Mode", "Reference", "Cash Received", "TDS", "Settlement", "Bank Account", "Proof", "Status", "Recorded By"],
      ...filteredPayments.map((payment) => [
        payment.id, payment.allocationType, payment.invoiceCode || "Unallocated", payment.clientName,
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
      `Allocation: ${payment.invoiceCode || "Client Advance / Unallocated"}`,
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

      {backendMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {backendMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-white px-5 py-4 text-sm font-bold text-slate-500">
          Loading backend payment ledger...
        </div>
      ) : null}

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
                              {availableInvoices.map((invoice) => <option key={invoice.backendId} value={invoice.backendId}>{invoice.id} - {invoice.clientName} - Due {money(outstanding(invoice), invoice.currency)}</option>)}
                            </select>
                            {errors.invoiceId ? <p className="text-[10px] font-black uppercase tracking-widest text-red-500">{errors.invoiceId.message}</p> : null}
                          </label>
                        ) : null}

                        <Field label="Payment Date" type="date" required register={register("date")} error={errors.date?.message} />
                        <Field label="Payment Mode" options={[...paymentModes]} required register={register("mode")} error={errors.mode?.message} />
                        <Field label="Reference / UTR / Receipt No." required register={register("reference")} error={errors.reference?.message} />
                        <label className="block space-y-1.5">
                          <span className="text-xs font-black uppercase tracking-widest text-slate-500">Receiving Bank Account <span className="text-red-500">*</span></span>
                          <select {...register("bankAccount")} className={`h-11 w-full rounded-xl border bg-white px-3 text-sm font-semibold text-primary outline-none ${errors.bankAccount ? "border-red-500" : "border-border focus:border-primary"}`}>
                            <option value="">Select bank account...</option>
                            {bankOptions.map((bank) => <option key={bank.id} value={bank.id}>{bank.label}</option>)}
                          </select>
                          {errors.bankAccount ? <p className="text-[10px] font-black uppercase tracking-widest text-red-500">{errors.bankAccount.message}</p> : null}
                        </label>
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
                        <ActionButton icon={Banknote} label={isSaving ? "Saving..." : "Record Payment"} variant="accent" type="submit" />
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
                <p className="text-xs font-semibold text-slate-500">{payment.invoiceCode || "Client Advance / Unallocated"}</p>
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
                    <button type="button" onClick={() => updateStatus(payment.backendId, "Verified")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-blue-600" title="Verify payment"><Check size={15} /></button>
                  ) : null}
                  {payment.status === "Verified" ? (
                    <button type="button" onClick={() => updateStatus(payment.backendId, "Reconciled")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-green-600" title="Mark bank reconciled"><Landmark size={15} /></button>
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
