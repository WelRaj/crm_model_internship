"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  AlertTriangle, Archive, Calculator, Check, CheckCircle2, Download, Edit3,
  FileCheck2, FilePlus2, Landmark, Lock, Receipt, RotateCcw, Search, Send,
  ShieldCheck, TimerReset, X,
} from "lucide-react";
import {
  AccountingPage, ActionButton, DataTable, Field,
  MetricCard, Panel, StatusBadge, WorkflowSteps,
} from "./AccountingComponents";
import {
  createInvoice,
  listFinanceClients,
  listFinanceResource,
  listInvoices,
  listQuotations,
  runInvoiceAction,
  updateInvoice,
  type FinanceClientRecord,
  type InvoicePayload,
  type InvoiceRecord as BackendInvoiceRecord,
  type QuotationRecord as BackendQuotationRecord,
} from "@/services/finance-api";
import { listDeliveryProjects, type DeliveryProjectRecord } from "@/services/projects-api";

const INR = "\u20b9";
const DIRECT_PROJECT_ID = "__direct_invoice__";
const invoiceStatuses = ["Draft", "Pending Approval", "Approved", "Sent", "Archived"] as const;
const paymentStatuses = ["Not Due", "Unpaid", "Partially Paid", "Paid", "Overdue"] as const;
const currencies = ["INR", "USD", "AED", "GBP", "EUR"] as const;
const gstTypes = ["IGST 18%", "CGST 9% + SGST 9%", "Exempt"] as const;
const billingSources = ["Accepted Quotation", "Direct / Milestone"] as const;
const paymentTerms = ["Due on Receipt", "Net 7", "Net 15", "Net 30", "Custom / Manual"] as const;

const invoiceSchema = z.object({
  billingSource: z.enum(billingSources),
  quotationId: z.string().optional(),
  clientId: z.string().min(1, "Select a client"),
  projectId: z.string().min(1, "Select a project"),
  invoiceDate: z.string().min(1, "Invoice date required"),
  dueDate: z.string().min(1, "Due date required"),
  terms: z.enum(paymentTerms),
  customPaymentTerms: z.string().optional(),
  currency: z.enum(currencies),
  baseAmount: z.coerce.number().positive("Base amount must be greater than 0"),
  discount: z.coerce.number().min(0, "Discount cannot be negative"),
  gstType: z.enum(gstTypes),
  description: z.string().trim().min(5, "Service description required"),
  remarks: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.dueDate < data.invoiceDate) {
    ctx.addIssue({ code: "custom", path: ["dueDate"], message: "Due date cannot be before invoice date" });
  }
  if (data.discount > data.baseAmount) {
    ctx.addIssue({ code: "custom", path: ["discount"], message: "Discount cannot exceed base amount" });
  }
  if (data.terms === "Custom / Manual" && (data.customPaymentTerms?.trim().length ?? 0) < 3) {
    ctx.addIssue({ code: "custom", path: ["customPaymentTerms"], message: "Enter the agreed payment condition" });
  }
  if (data.billingSource === "Accepted Quotation") {
    if (!data.quotationId) {
      ctx.addIssue({ code: "custom", path: ["quotationId"], message: "Select an accepted quotation" });
    }
  }
});

type InvoiceFormInput = z.input<typeof invoiceSchema>;
type InvoiceFormData = z.output<typeof invoiceSchema>;
type InvoiceStatus = typeof invoiceStatuses[number];
type PaymentStatus = typeof paymentStatuses[number];

type InvoiceRecord = {
  id: string;
  backendId: string;
  billingSource: typeof billingSources[number];
  quotationId: string;
  quotationCode: string;
  clientId: string;
  clientName: string;
  projectId: string;
  projectName: string;
  invoiceDate: string;
  dueDate: string;
  terms: InvoiceFormData["terms"];
  customPaymentTerms: string;
  currency: string;
  description: string;
  baseAmount: number;
  discount: number;
  taxableAmount: number;
  gstType: typeof gstTypes[number];
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  remarks: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
};

type BankRecord = {
  account_name?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  status?: string;
  verification_status?: string;
  is_primary?: boolean;
};

type AcceptedQuotationOption = {
  id: string;
  backendId: string;
  clientId: string;
  projectId: string;
  currency: string;
  baseAmount: number;
  discount: number;
  description: string;
};

const apiToInvoiceStatus: Record<BackendInvoiceRecord["status"], InvoiceStatus> = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  approved: "Approved",
  sent: "Sent",
  cancelled: "Archived",
  archived: "Archived",
};

const invoiceStatusToApi: Record<InvoiceStatus, BackendInvoiceRecord["status"]> = {
  Draft: "draft",
  "Pending Approval": "pending_approval",
  Approved: "approved",
  Sent: "sent",
  Archived: "archived",
};

const apiToPaymentStatus: Record<BackendInvoiceRecord["payment_status"], PaymentStatus> = {
  not_due: "Not Due",
  unpaid: "Unpaid",
  partially_paid: "Partially Paid",
  paid: "Paid",
  overdue: "Overdue",
};

function dateAfterTerms(invoiceDate: string, terms: InvoiceFormData["terms"]) {
  if (!invoiceDate) return "";
  const days = terms === "Net 7" ? 7 : terms === "Net 15" ? 15 : terms === "Net 30" ? 30 : 0;
  const date = new Date(`${invoiceDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

const defaultFormValues: InvoiceFormInput = {
  billingSource: "Direct / Milestone",
  quotationId: "",
  clientId: "",
  projectId: "",
  invoiceDate: new Date().toISOString().split("T")[0],
  dueDate: dateAfterTerms(new Date().toISOString().split("T")[0], "Net 15"),
  terms: "Net 15",
  customPaymentTerms: "",
  currency: "INR",
  baseAmount: 0,
  discount: 0,
  gstType: "CGST 9% + SGST 9%",
  description: "",
  remarks: "",
};

function gstRateFor(type: typeof gstTypes[number]) {
  return type === "Exempt" ? 0 : 18;
}

function calculateTotals(baseValue: unknown, discountValue: unknown, gstType: typeof gstTypes[number] | undefined) {
  const baseAmount = Number(baseValue) || 0;
  const discount = Number(discountValue) || 0;
  const taxableAmount = Math.max(0, baseAmount - discount);
  const gstRate = gstType ? gstRateFor(gstType) : 0;
  const gstAmount = taxableAmount * gstRate / 100;
  return { baseAmount, discount, taxableAmount, gstRate, gstAmount, totalAmount: taxableAmount + gstAmount };
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

function gstTypeFor(rate: number): typeof gstTypes[number] {
  return rate === 0 ? "Exempt" : "CGST 9% + SGST 9%";
}

function projectClientId(project: DeliveryProjectRecord) {
  return project.client_detail?.id || project.client;
}

function invoiceFromBackend(row: BackendInvoiceRecord, clients: FinanceClientRecord[], projects: DeliveryProjectRecord[], quotations: BackendQuotationRecord[]): InvoiceRecord {
  const client = clients.find((item) => item.id === row.client);
  const project = projects.find((item) => item.id === row.project);
  const quotation = quotations.find((item) => item.id === row.quotation);
  const firstItem = row.items[0];
  return {
    id: row.invoice_number,
    backendId: row.id,
    billingSource: row.source_type === "quotation" ? "Accepted Quotation" : "Direct / Milestone",
    quotationId: row.quotation || "",
    quotationCode: quotation?.quotation_number || "",
    clientId: row.client,
    clientName: client?.company_name || "Finance client",
    projectId: row.project || DIRECT_PROJECT_ID,
    projectName: project?.name || "Direct / Milestone",
    invoiceDate: row.invoice_date,
    dueDate: row.due_date,
    terms: "Custom / Manual",
    customPaymentTerms: row.remarks,
    currency: row.currency,
    description: firstItem?.description || row.remarks || "Invoice line item",
    baseAmount: Number(row.subtotal),
    discount: Number(row.discount),
    taxableAmount: Number(row.taxable_amount),
    gstType: gstTypeFor(Number(row.gst_rate)),
    gstRate: Number(row.gst_rate),
    gstAmount: Number(row.gst_amount),
    totalAmount: Number(row.total_amount),
    status: apiToInvoiceStatus[row.status],
    amountPaid: Number(row.paid_amount) + Number(row.tds_amount),
    paymentStatus: apiToPaymentStatus[row.payment_status],
    remarks: row.remarks,
    owner: "Finance",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function acceptedQuotationFromBackend(row: BackendQuotationRecord): AcceptedQuotationOption {
  const firstItem = row.items[0];
  return {
    id: row.quotation_number,
    backendId: row.id,
    clientId: row.client,
    projectId: row.project || DIRECT_PROJECT_ID,
    currency: row.currency,
    baseAmount: Number(row.subtotal),
    discount: Number(row.discount),
    description: firstItem?.description || row.title,
  };
}

function invoicePayload(data: InvoiceFormData, status: InvoiceStatus): InvoicePayload {
  return {
    source_type: data.billingSource === "Accepted Quotation" ? "quotation" : "direct",
    quotation_id: data.billingSource === "Accepted Quotation" ? data.quotationId || null : null,
    client_id: data.clientId,
    project_id: data.projectId === DIRECT_PROJECT_ID ? null : data.projectId,
    invoice_date: data.invoiceDate,
    due_date: data.dueDate,
    status: invoiceStatusToApi[status],
    currency: data.currency,
    discount: String(data.discount),
    gst_rate: String(gstRateFor(data.gstType)),
    remarks: data.terms === "Custom / Manual" ? data.customPaymentTerms || data.remarks || "" : data.remarks || data.terms,
    items: [{
      description: data.description,
      quantity: "1",
      unit_price: String(data.baseAmount),
    }],
  };
}

export default function Step4Invoices() {
  const [clients, setClients] = useState<FinanceClientRecord[]>([]);
  const [projects, setProjects] = useState<DeliveryProjectRecord[]>([]);
  const [acceptedQuotations, setAcceptedQuotations] = useState<AcceptedQuotationOption[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [backendMessage, setBackendMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [bankDetails, setBankDetails] = useState<BankRecord | null>(null);
  const [todayTimestamp] = useState(() => Date.now());

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<InvoiceFormInput, unknown, InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: defaultFormValues,
  });

  const watchedSource = useWatch({ control, name: "billingSource" });
  const watchedClientId = useWatch({ control, name: "clientId" });
  const watchedBaseAmount = useWatch({ control, name: "baseAmount" });
  const watchedDiscount = useWatch({ control, name: "discount" });
  const watchedGstType = useWatch({ control, name: "gstType" });
  const watchedCurrency = useWatch({ control, name: "currency" });
  const watchedInvoiceDate = useWatch({ control, name: "invoiceDate" });
  const watchedTerms = useWatch({ control, name: "terms" });
  const totals = useMemo(
    () => calculateTotals(watchedBaseAmount, watchedDiscount, watchedGstType),
    [watchedBaseAmount, watchedDiscount, watchedGstType],
  );

  const clientOptions = useMemo(
    () => clients.filter((client) => client.status === "active").map((client) => ({ id: client.id, name: client.company_name })),
    [clients],
  );

  const applyBackendRows = (
    clientRows: FinanceClientRecord[],
    projectRows: DeliveryProjectRecord[],
    quotationRows: BackendQuotationRecord[],
    invoiceRows: BackendInvoiceRecord[],
    bankRows: BankRecord[],
  ) => {
    setClients(clientRows);
    setProjects(projectRows);
    setAcceptedQuotations(quotationRows.filter((quotation) => quotation.status === "client_accepted").map(acceptedQuotationFromBackend));
    setInvoices(invoiceRows.map((invoice) => invoiceFromBackend(invoice, clientRows, projectRows, quotationRows)));
    const activeBank = bankRows.find((bank) => bank.status === "active" && bank.verification_status === "verified" && bank.is_primary)
      ?? bankRows.find((bank) => bank.status === "active" && bank.verification_status === "verified")
      ?? bankRows.find((bank) => bank.status === "active")
      ?? null;
    setBankDetails(activeBank);
  };

  const fetchBackendRows = async () => Promise.all([
    listFinanceClients({ status: "active" }),
    listDeliveryProjects(),
    listQuotations(),
    listInvoices(),
    listFinanceResource<BankRecord>("bank-accounts", { status: "active" }),
  ]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [clientRows, projectRows, quotationRows, invoiceRows, bankRows] = await fetchBackendRows();
      applyBackendRows(clientRows, projectRows, quotationRows, invoiceRows, bankRows);
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to load invoice backend data.");
      setBankDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchBackendRows()
      .then(([clientRows, projectRows, quotationRows, invoiceRows, bankRows]) => {
        if (!isMounted) return;
        applyBackendRows(clientRows, projectRows, quotationRows, invoiceRows, bankRows);
      })
      .catch((error) => {
        if (!isMounted) return;
        setBackendMessage(error instanceof Error ? error.message : "Unable to load invoice backend data.");
        setBankDetails(null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const invoiceRegister = useMemo(() => invoices, [invoices]);

  const filteredProjects = useMemo(() => {
    const linkedClient = clients.find((client) => client.id === watchedClientId);
    const projectClient = linkedClient?.project_client;
    const matches = projects
      .filter((project) => !projectClient || projectClientId(project) === projectClient)
      .map((project) => ({ id: project.id, name: project.name }));
    return [{ id: DIRECT_PROJECT_ID, name: "Direct / Milestone" }, ...matches];
  }, [clients, projects, watchedClientId]);
  const filteredInvoices = useMemo(() => invoiceRegister.filter((invoice) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || [
      invoice.id, invoice.quotationCode, invoice.quotationId, invoice.clientName, invoice.projectName,
      invoice.description, invoice.status, invoice.paymentStatus,
    ].join(" ").toLowerCase().includes(query);
    const matchesStatus = statusFilter === "All" || invoice.status === statusFilter;
    const matchesPayment = paymentFilter === "All" || invoice.paymentStatus === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  }), [invoiceRegister, paymentFilter, searchTerm, statusFilter]);

  const openCreateForm = () => {
    setEditingId(null);
    setSuccessMsg("");
    setBackendMessage("");
    reset(defaultFormValues);
    setShowForm(true);
  };

  const openEditForm = (invoice: InvoiceRecord) => {
    if (!["Draft", "Pending Approval"].includes(invoice.status) || invoice.amountPaid > 0) return;
    setEditingId(invoice.backendId);
    setSuccessMsg("");
    setBackendMessage("");
    reset({
      billingSource: invoice.billingSource,
      quotationId: invoice.quotationId,
      clientId: invoice.clientId,
      projectId: invoice.projectId,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      terms: invoice.terms,
      customPaymentTerms: invoice.customPaymentTerms,
      currency: invoice.currency as InvoiceFormInput["currency"],
      baseAmount: invoice.baseAmount,
      discount: invoice.discount,
      gstType: invoice.gstType,
      description: invoice.description,
      remarks: invoice.remarks,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setSuccessMsg("");
    reset(defaultFormValues);
  };

  const selectQuotation = (quotationId: string) => {
    setValue("quotationId", quotationId, { shouldValidate: true });
    const quotation = acceptedQuotations.find((item) => item.backendId === quotationId);
    if (!quotation) return;
    setValue("clientId", quotation.clientId, { shouldValidate: true });
    setValue("projectId", quotation.projectId, { shouldValidate: true });
    setValue("currency", quotation.currency as InvoiceFormInput["currency"]);
    setValue("baseAmount", quotation.baseAmount, { shouldValidate: true });
    setValue("discount", quotation.discount, { shouldValidate: true });
    setValue("description", quotation.description, { shouldValidate: true });
  };

  const selectBillingSource = (source: InvoiceFormData["billingSource"]) => {
    setValue("billingSource", source, { shouldValidate: true });
    setValue("quotationId", "");
    if (source === "Direct / Milestone") {
      setValue("clientId", "");
      setValue("projectId", "");
      setValue("currency", "INR");
      setValue("baseAmount", 0);
      setValue("discount", 0);
      setValue("description", "");
    }
  };

  const persistInvoice = async (data: InvoiceFormData, status: InvoiceStatus) => {
    const client = clientOptions.find((item) => item.id === data.clientId);
    const project = filteredProjects.find((item) => item.id === data.projectId);
    if (!client || !project) return;

    if (
      data.billingSource === "Accepted Quotation"
      && invoices.some((invoice) => invoice.quotationId === data.quotationId && invoice.backendId !== editingId && invoice.status !== "Archived")
    ) {
      setError("quotationId", { message: "This quotation already has an active invoice" });
      return;
    }

    try {
      setIsSaving(true);
      setBackendMessage("");
      if (editingId) {
        await updateInvoice(editingId, invoicePayload(data, status));
      } else {
        await createInvoice(invoicePayload(data, status));
      }
      await loadData();
      setSuccessMsg(editingId
        ? (status === "Draft" ? "Invoice draft updated" : "Invoice submitted for approval")
        : (status === "Draft" ? "Invoice draft saved" : "Invoice submitted for approval"));
      setTimeout(closeForm, 900);
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to save invoice.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveDraft = handleSubmit((data) => persistInvoice(data, "Draft"));
  const submitForApproval = handleSubmit((data) => persistInvoice(data, "Pending Approval"));

  const updateStatus = async (invoiceId: string, status: InvoiceStatus) => {
    try {
      setBackendMessage("");
      await runInvoiceAction(invoiceId, invoiceStatusToApi[status]);
      await loadData();
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to update invoice status.");
    }
  };

  const exportInvoices = () => {
    const rows = [
      ["Invoice", "Quotation", "Client", "Project", "Invoice Date", "Due Date", "Taxable", "GST", "Total", "Paid", "Outstanding", "Currency", "Status", "Payment Status"],
      ...filteredInvoices.map((invoice) => [
        invoice.id, invoice.quotationCode || "Direct", invoice.clientName, invoice.projectName,
        invoice.invoiceDate, invoice.dueDate, invoice.taxableAmount, invoice.gstAmount,
        invoice.totalAmount, invoice.amountPaid, invoice.totalAmount - invoice.amountPaid,
        invoice.currency, invoice.status, invoice.paymentStatus,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadFile("invoice-register.csv", csv, "text/csv;charset=utf-8");
  };

  const downloadInvoice = (invoice: InvoiceRecord) => {
    const content = [
      `Tax Invoice: ${invoice.id}`,
      `Billing Source: ${invoice.quotationCode || "Direct / Milestone"}`,
      `Client: ${invoice.clientName} (${invoice.clientId})`,
      `Project: ${invoice.projectName} (${invoice.projectId})`,
      `Invoice Date: ${formatDate(invoice.invoiceDate)}`,
      `Due Date: ${formatDate(invoice.dueDate)} (${invoice.terms === "Custom / Manual" ? invoice.customPaymentTerms : invoice.terms})`,
      "",
      invoice.description,
      "",
      `Base Amount: ${money(invoice.baseAmount, invoice.currency)}`,
      `Discount: ${money(invoice.discount, invoice.currency)}`,
      `Taxable Amount: ${money(invoice.taxableAmount, invoice.currency)}`,
      `${invoice.gstType}: ${money(invoice.gstAmount, invoice.currency)}`,
      `Invoice Total: ${money(invoice.totalAmount, invoice.currency)}`,
      `Amount Paid: ${money(invoice.amountPaid, invoice.currency)}`,
      `Balance Due: ${money(invoice.totalAmount - invoice.amountPaid, invoice.currency)}`,
      `Status: ${invoice.status}`,
      `Payment Status: ${invoice.paymentStatus}`,
    ].join("\n");
    downloadFile(`${invoice.id}.txt`, content, "text/plain;charset=utf-8");
  };

  const approvedValue = invoiceRegister.filter((invoice) => ["Approved", "Sent"].includes(invoice.status)).reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const overdueInvoices = invoiceRegister.filter((invoice) => invoice.paymentStatus === "Overdue");
  const overdueValue = overdueInvoices.reduce((sum, invoice) => sum + invoice.totalAmount - invoice.amountPaid, 0);
  const pendingApproval = invoiceRegister.filter((invoice) => invoice.status === "Pending Approval").length;
  const dueThisWeek = invoiceRegister.filter((invoice) => {
    if (invoice.paymentStatus === "Paid" || invoice.status === "Archived") return false;
    const days = (new Date(`${invoice.dueDate}T23:59:59`).getTime() - todayTimestamp) / 86400000;
    return days >= 0 && days <= 7;
  });
  const dueThisWeekValue = dueThisWeek.reduce((sum, invoice) => sum + invoice.totalAmount - invoice.amountPaid, 0);

  return (
    <AccountingPage
      title="Invoice Management"
      description="Generate controlled tax invoices from accepted quotations or project milestones and track approval, delivery, and outstanding balances."
      icon={Receipt}
      badge="Legal billing"
      actions={
        <>
          <ActionButton icon={Download} label="Export Register" variant="outline" onClick={exportInvoices} />
          <ActionButton icon={FilePlus2} label="New Invoice" variant="accent" onClick={openCreateForm} />
        </>
      }
    >
      <WorkflowSteps steps={["Accepted Quote", "Invoice Draft", "Approval", "Send to Client", "Receipt & Settlement"]} />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Approved Value" value={money(approvedValue)} helper="Approved and sent invoices" icon={FileCheck2} tone="green" />
        <MetricCard label="Due This Week" value={money(dueThisWeekValue)} helper={`${dueThisWeek.length} invoices`} icon={TimerReset} tone="amber" />
        <MetricCard label="Overdue Balance" value={money(overdueValue)} helper={`${overdueInvoices.length} invoices require follow-up`} icon={AlertTriangle} tone="red" />
        <MetricCard label="Pending Approval" value={String(pendingApproval)} helper="Finance approval queue" icon={Lock} tone="blue" />
      </div>

      {backendMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {backendMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-white px-5 py-4 text-sm font-bold text-slate-500">
          Loading backend invoice register...
        </div>
      ) : null}

      {showForm ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] border border-slate-100 bg-white p-8 shadow-2xl animate-in zoom-in-95">
            <button type="button" onClick={closeForm} className="absolute right-8 top-8 rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-primary">
              <X size={24} />
            </button>

            {successMsg ? (
              <div className="space-y-4 py-20 text-center animate-in zoom-in-95">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 size={48} /></div>
                <h3 className="text-2xl font-black text-primary">{successMsg}</h3>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Tax, approval, and outstanding values are updated.</p>
              </div>
            ) : (
              <form onSubmit={submitForApproval} className="space-y-8">
                <div className="border-b border-slate-100 pb-6">
                  <h3 className="text-2xl font-black tracking-tight text-primary">{editingId ? "Edit Tax Invoice" : "Create Tax Invoice"}</h3>
                  <p className="mt-1 text-sm font-medium text-slate-500">Commercial edits are limited to draft and pending approval invoices with no receipts.</p>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                  <div className="space-y-8 lg:col-span-3">
                    <Panel title="Billing Source" description="Choose whether this invoice comes from an accepted quotation or is raised directly without a quotation.">
                      <input type="hidden" {...register("billingSource")} />
                      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => selectBillingSource("Direct / Milestone")}
                          className={`min-h-20 rounded-xl border p-4 text-left transition-all ${watchedSource === "Direct / Milestone" ? "border-primary bg-primary text-white shadow-md" : "border-border bg-white text-primary hover:bg-slate-50"}`}
                        >
                          <span className="block text-sm font-black">Without Quotation / Direct Invoice</span>
                          <span className={`mt-1 block text-xs font-semibold ${watchedSource === "Direct / Milestone" ? "text-white/70" : "text-slate-500"}`}>
                            Select client and project, then enter scope and amount manually.
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => selectBillingSource("Accepted Quotation")}
                          className={`min-h-20 rounded-xl border p-4 text-left transition-all ${watchedSource === "Accepted Quotation" ? "border-primary bg-primary text-white shadow-md" : "border-border bg-white text-primary hover:bg-slate-50"}`}
                        >
                          <span className="block text-sm font-black">From Accepted Quotation</span>
                          <span className={`mt-1 block text-xs font-semibold ${watchedSource === "Accepted Quotation" ? "text-white/70" : "text-slate-500"}`}>
                            Import client, project, scope, currency, amount, and discount.
                          </span>
                        </button>
                      </div>
                      {errors.billingSource ? <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-red-500">{errors.billingSource.message}</p> : null}
                      <div className="grid grid-cols-1 gap-6">
                        {watchedSource === "Accepted Quotation" ? (
                          <label className="block space-y-1.5">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Accepted Quotation <span className="text-red-500">*</span></span>
                            <select
                              {...register("quotationId")}
                              onChange={(event) => selectQuotation(event.target.value)}
                              className={`h-11 w-full rounded-xl border bg-white px-3 text-sm font-semibold text-primary outline-none transition-all focus:ring-4 focus:ring-primary/10 ${errors.quotationId ? "border-red-500" : "border-border focus:border-primary"}`}
                            >
                              <option value="">Select accepted quotation...</option>
                              {acceptedQuotations.map((quotation) => {
                                const alreadyInvoiced = invoices.some((invoice) => invoice.quotationId === quotation.backendId && invoice.backendId !== editingId && invoice.status !== "Archived");
                                return <option key={quotation.backendId} value={quotation.backendId} disabled={alreadyInvoiced}>{quotation.id}{alreadyInvoiced ? " - Already invoiced" : ""}</option>;
                              })}
                            </select>
                            {errors.quotationId ? <p className="text-[10px] font-black uppercase tracking-widest text-red-500">{errors.quotationId.message}</p> : null}
                            <p className="text-xs font-semibold text-slate-400">Only client-accepted quotations without an active invoice are available.</p>
                          </label>
                        ) : (
                          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs font-semibold leading-5 text-blue-700">
                            No quotation is required. Complete the client, project, invoice dates, service detail, amount, discount, and GST fields below.
                          </div>
                        )}
                      </div>
                    </Panel>

                    <Panel title="Billing Information" description="Legal customer, project, invoice date, and contractual payment deadline.">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <label className="block space-y-1.5">
                          <span className="text-xs font-black uppercase tracking-widest text-slate-500">Client <span className="text-red-500">*</span></span>
                          <select {...register("clientId")} className={`h-11 w-full rounded-xl border bg-white px-3 text-sm font-semibold text-primary outline-none transition-all ${errors.clientId ? "border-red-500" : "border-border focus:border-primary"}`}>
                            <option value="">Select client...</option>
                            {clientOptions.map((client) => <option key={client.id} value={client.id}>{client.id} - {client.name}</option>)}
                          </select>
                          {errors.clientId ? <p className="text-[10px] font-black uppercase tracking-widest text-red-500">{errors.clientId.message}</p> : null}
                        </label>
                        <label className="block space-y-1.5">
                          <span className="text-xs font-black uppercase tracking-widest text-slate-500">Project <span className="text-red-500">*</span></span>
                          <select {...register("projectId")} className={`h-11 w-full rounded-xl border bg-white px-3 text-sm font-semibold text-primary outline-none transition-all ${errors.projectId ? "border-red-500" : "border-border focus:border-primary"}`}>
                            <option value="">Select project...</option>
                            {filteredProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                          </select>
                          {errors.projectId ? <p className="text-[10px] font-black uppercase tracking-widest text-red-500">{errors.projectId.message}</p> : null}
                        </label>
                        <Field label="Currency" options={[...currencies]} required register={register("currency")} error={errors.currency?.message} />
                        <Field
                          label="Invoice Date"
                          type="date"
                          required
                          register={register("invoiceDate")}
                          onChange={(event) => {
                            register("invoiceDate").onChange(event);
                            if (watchedTerms !== "Custom / Manual") {
                              setValue("dueDate", dateAfterTerms(event.target.value, watchedTerms), { shouldValidate: true });
                            }
                          }}
                          error={errors.invoiceDate?.message}
                        />
                        <Field
                          label="Payment Terms"
                          options={[...paymentTerms]}
                          required
                          register={register("terms")}
                          onChange={(event) => {
                            register("terms").onChange(event);
                            const selectedTerm = event.target.value as InvoiceFormData["terms"];
                            if (selectedTerm !== "Custom / Manual") {
                              setValue("dueDate", dateAfterTerms(watchedInvoiceDate, selectedTerm), { shouldValidate: true });
                              setValue("customPaymentTerms", "");
                            }
                          }}
                          error={errors.terms?.message}
                        />
                        <Field label={watchedTerms === "Custom / Manual" ? "Manual Due Date" : "Due Date"} type="date" required register={register("dueDate")} error={errors.dueDate?.message} />
                        {watchedTerms === "Custom / Manual" ? (
                          <div className="md:col-span-3">
                            <Field
                              label="Custom Payment Condition"
                              placeholder="Example: 40% advance, balance within 10 days of delivery"
                              required
                              multiline
                              register={register("customPaymentTerms")}
                              error={errors.customPaymentTerms?.message}
                            />
                          </div>
                        ) : null}
                      </div>
                    </Panel>

                    <Panel title="Commercials" description="Taxable service value and GST classification.">
                      <div className="space-y-6">
                        <Field label="Service Detail" placeholder="Billable scope or milestone..." multiline required register={register("description")} error={errors.description?.message} />
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                          <Field label="Base Amount" type="number" step="0.01" required register={register("baseAmount")} error={errors.baseAmount?.message} />
                          <Field label="Discount" type="number" step="0.01" register={register("discount")} error={errors.discount?.message} />
                          <Field label="GST Type" options={[...gstTypes]} required register={register("gstType")} error={errors.gstType?.message} />
                        </div>
                        <Field label="Internal Remarks" placeholder="Approval note, PO reference, or billing instruction..." multiline register={register("remarks")} error={errors.remarks?.message} />
                      </div>
                    </Panel>

                    <Panel title="Payment Information (Buyer View)" icon={Landmark} description="Active remittance account displayed on the buyer-facing invoice.">
                      {bankDetails ? (
                        <div className="grid grid-cols-1 gap-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-6 md:grid-cols-2">
                          <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Beneficiary</p><p className="text-sm font-black text-primary">{bankDetails.account_name}</p></div>
                          <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bank</p><p className="text-sm font-black text-primary">{bankDetails.bank_name}</p></div>
                          <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account</p><p className="font-mono text-sm font-black text-primary">{bankDetails.account_number}</p></div>
                          <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">IFSC</p><p className="font-mono text-sm font-black text-primary">{bankDetails.ifsc_code}</p></div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-xs font-bold text-slate-400">
                          No active treasury account is configured. Invoice can be saved, but remittance details will be absent.
                        </div>
                      )}
                    </Panel>
                  </div>

                  <div className="space-y-6">
                    <Panel title="Invoice Total" description="Taxable value and legal invoice amount.">
                      <div className="space-y-5">
                        <div className="relative overflow-hidden rounded-2xl bg-primary p-6 text-white shadow-xl">
                          <Calculator className="absolute -bottom-4 -right-4 text-white/5" size={100} />
                          <div className="relative z-10 space-y-3">
                            <div className="flex justify-between text-xs font-bold text-white/70"><span>Base Amount</span><span>{money(totals.baseAmount, watchedCurrency)}</span></div>
                            <div className="flex justify-between text-xs font-bold text-white/70"><span>Discount</span><span>{money(totals.discount, watchedCurrency)}</span></div>
                            <div className="flex justify-between text-xs font-bold text-white/70"><span>Taxable</span><span>{money(totals.taxableAmount, watchedCurrency)}</span></div>
                            <div className="flex justify-between text-xs font-bold text-white/70"><span>GST ({totals.gstRate}%)</span><span>{money(totals.gstAmount, watchedCurrency)}</span></div>
                            <div className="border-t border-white/10 pt-4">
                              <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Invoice Total</p>
                              <p className="mt-1 text-3xl font-black">{money(totals.totalAmount, watchedCurrency)}</p>
                            </div>
                          </div>
                        </div>
                        <ActionButton icon={ShieldCheck} label={isSaving ? "Saving..." : "Submit for Approval"} variant="accent" type="submit" />
                        <ActionButton icon={Receipt} label={isSaving ? "Saving..." : "Save Draft"} variant="outline" onClick={saveDraft} />
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
        title="Invoice Register"
        description="Billing source, approval status, due date, receipts, and outstanding balance."
        actions={<StatusBadge tone="blue">{filteredInvoices.length} Invoices</StatusBadge>}
      >
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_190px_190px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search invoice, quotation, client, project..." className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm font-semibold text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10">
            {["All", ...invoiceStatuses].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10">
            {["All", ...paymentStatuses].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>

        <DataTable columns={["Invoice", "Client / Project", "Invoice Value", "Due / Payment", "Status", "Actions"]}>
          {filteredInvoices.map((invoice) => {
            const balance = Math.max(0, invoice.totalAmount - invoice.amountPaid);
            return (
              <tr key={invoice.id} className="text-sm transition-colors hover:bg-slate-50">
                <td className="px-4 py-4">
                  <p className="font-black text-primary">{invoice.id}</p>
                  <p className="text-[11px] font-semibold text-slate-400">{invoice.quotationCode || "Direct / Milestone"}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="font-black text-primary">{invoice.clientName}</p>
                  <p className="text-xs font-semibold text-slate-500">{invoice.projectName}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="font-black text-primary">{money(invoice.totalAmount, invoice.currency)}</p>
                  <p className="text-[11px] font-semibold text-slate-400">Taxable {money(invoice.taxableAmount, invoice.currency)} | GST {invoice.gstRate}%</p>
                </td>
                <td className="px-4 py-4">
                  <p className="font-bold text-slate-600">{formatDate(invoice.dueDate)}</p>
                  <p className="text-[11px] font-semibold text-slate-400">Paid {money(invoice.amountPaid, invoice.currency)} | Due {money(balance, invoice.currency)}</p>
                  <div className="mt-2">
                    <StatusBadge tone={invoice.paymentStatus === "Paid" ? "green" : invoice.paymentStatus === "Overdue" ? "red" : invoice.paymentStatus === "Partially Paid" ? "amber" : "slate"}>{invoice.paymentStatus}</StatusBadge>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge tone={invoice.status === "Approved" || invoice.status === "Sent" ? "green" : invoice.status === "Pending Approval" ? "amber" : invoice.status === "Archived" ? "red" : "blue"}>
                    {invoice.status}
                  </StatusBadge>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {["Draft", "Pending Approval"].includes(invoice.status) && invoice.amountPaid === 0 ? (
                      <button type="button" onClick={() => openEditForm(invoice)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="Edit invoice"><Edit3 size={15} /></button>
                    ) : null}
                    {invoice.status === "Draft" ? (
                      <button type="button" onClick={() => updateStatus(invoice.backendId, "Pending Approval")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-amber-600" title="Submit for approval"><ShieldCheck size={15} /></button>
                    ) : null}
                    {invoice.status === "Pending Approval" ? (
                      <button type="button" onClick={() => updateStatus(invoice.backendId, "Approved")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-green-600" title="Approve invoice"><Check size={15} /></button>
                    ) : null}
                    {invoice.status === "Approved" ? (
                      <button type="button" onClick={() => updateStatus(invoice.backendId, "Sent")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-blue-600" title="Mark invoice sent"><Send size={15} /></button>
                    ) : null}
                    <button type="button" onClick={() => downloadInvoice(invoice)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="Download invoice"><Download size={15} /></button>
                    {invoice.status === "Archived" ? (
                      <button type="button" onClick={() => updateStatus(invoice.backendId, "Draft")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-green-600" title="Restore invoice"><RotateCcw size={15} /></button>
                    ) : invoice.amountPaid === 0 ? (
                      <button type="button" onClick={() => updateStatus(invoice.backendId, "Archived")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-red-600" title="Archive invoice"><Archive size={15} /></button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}
