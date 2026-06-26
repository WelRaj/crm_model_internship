"use client";

import { useMemo, useState } from "react";
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

const INR = "\u20b9";
const invoiceStatuses = ["Draft", "Pending Approval", "Approved", "Sent", "Archived"] as const;
const paymentStatuses = ["Not Due", "Unpaid", "Partially Paid", "Paid", "Overdue"] as const;
const currencies = ["INR", "USD", "AED", "GBP", "EUR"] as const;
const gstTypes = ["IGST 18%", "CGST 9% + SGST 9%", "Exempt"] as const;
const billingSources = ["Accepted Quotation", "Direct / Milestone"] as const;
const paymentTerms = ["Due on Receipt", "Net 7", "Net 15", "Net 30", "Custom / Manual"] as const;

const clientOptions = [
  { id: "CL-24001", name: "Apex Finserve Pvt Ltd" },
  { id: "CL-24002", name: "Nexa Retail Cloud" },
  { id: "CL-24003", name: "Bluebird Logistics" },
  { id: "CL-24004", name: "KraftEdge Export LLP" },
];

const projectOptions = [
  { id: "PRJ-001", clientId: "CL-24001", name: "Loan CRM Web App" },
  { id: "PRJ-002", clientId: "CL-24002", name: "E-commerce Mobile App" },
  { id: "PRJ-003", clientId: "CL-24003", name: "Logistics Control Tower" },
];

const acceptedQuotationOptions = [
  {
    id: "QT-2026-042",
    clientId: "CL-24002",
    projectId: "PRJ-002",
    currency: "INR",
    baseAmount: 1125000,
    discount: 44492,
    description: "Mobile commerce application delivery",
  },
];

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
  const project = projectOptions.find((item) => item.id === data.projectId);
  if (project && project.clientId !== data.clientId) {
    ctx.addIssue({ code: "custom", path: ["projectId"], message: "Project does not belong to selected client" });
  }
  if (data.billingSource === "Accepted Quotation") {
    const quotation = acceptedQuotationOptions.find((item) => item.id === data.quotationId);
    if (!quotation) {
      ctx.addIssue({ code: "custom", path: ["quotationId"], message: "Select an accepted quotation" });
    } else if (quotation.clientId !== data.clientId || quotation.projectId !== data.projectId) {
      ctx.addIssue({ code: "custom", path: ["quotationId"], message: "Quotation, client, and project do not match" });
    }
  }
});

type InvoiceFormInput = z.input<typeof invoiceSchema>;
type InvoiceFormData = z.output<typeof invoiceSchema>;
type InvoiceStatus = typeof invoiceStatuses[number];
type PaymentStatus = typeof paymentStatuses[number];

type InvoiceRecord = {
  id: string;
  billingSource: typeof billingSources[number];
  quotationId: string;
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
  accountName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  status?: string;
  verificationStatus?: string;
  isPrimary?: boolean;
};

const initialInvoices: InvoiceRecord[] = [
  {
    id: "INV-2026-088",
    billingSource: "Accepted Quotation",
    quotationId: "QT-2026-042",
    clientId: "CL-24002",
    clientName: "Nexa Retail Cloud",
    projectId: "PRJ-002",
    projectName: "E-commerce Mobile App",
    invoiceDate: "2026-06-06",
    dueDate: "2026-06-21",
    terms: "Net 15",
    customPaymentTerms: "",
    currency: "INR",
    description: "Mobile commerce application delivery",
    baseAmount: 1125000,
    discount: 44492,
    taxableAmount: 1080508,
    gstType: "CGST 9% + SGST 9%",
    gstRate: 18,
    gstAmount: 194492,
    totalAmount: 1275000,
    status: "Sent",
    amountPaid: 500000,
    paymentStatus: "Partially Paid",
    remarks: "First receipt recorded against the invoice.",
    owner: "Finance Manager",
    createdAt: "2026-06-06T10:00:00.000Z",
    updatedAt: "2026-06-18T10:00:00.000Z",
  },
  {
    id: "INV-2026-089",
    billingSource: "Direct / Milestone",
    quotationId: "",
    clientId: "CL-24001",
    clientName: "Apex Finserve Pvt Ltd",
    projectId: "PRJ-001",
    projectName: "Loan CRM Web App",
    invoiceDate: "2026-06-11",
    dueDate: "2026-06-26",
    terms: "Net 15",
    customPaymentTerms: "",
    currency: "INR",
    description: "UAT milestone billing",
    baseAmount: 800000,
    discount: 0,
    taxableAmount: 800000,
    gstType: "CGST 9% + SGST 9%",
    gstRate: 18,
    gstAmount: 144000,
    totalAmount: 944000,
    status: "Draft",
    amountPaid: 0,
    paymentStatus: "Not Due",
    remarks: "",
    owner: "Accountant",
    createdAt: "2026-06-11T10:00:00.000Z",
    updatedAt: "2026-06-11T10:00:00.000Z",
  },
];

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

function paymentStatusFor(invoice: InvoiceRecord, today: number): PaymentStatus {
  if (invoice.amountPaid >= invoice.totalAmount) return "Paid";
  if (invoice.amountPaid > 0) return "Partially Paid";
  if (new Date(`${invoice.dueDate}T23:59:59`).getTime() < today && invoice.status === "Sent") return "Overdue";
  return invoice.status === "Sent" ? "Unpaid" : "Not Due";
}

export default function Step4Invoices() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(initialInvoices);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
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

  const loadBankDetails = () => {
    try {
      const raw = localStorage.getItem("crm_company_banks");
      const banks = raw ? JSON.parse(raw) as BankRecord[] : [];
      setBankDetails(
        banks.find((bank) => bank.status === "Active" && bank.verificationStatus === "Verified" && bank.isPrimary)
        ?? banks.find((bank) => bank.status === "Active" && bank.verificationStatus === "Verified")
        ?? banks.find((bank) => bank.status === "Active")
        ?? null,
      );
    } catch {
      setBankDetails(null);
    }
  };

  const invoiceRegister = useMemo(() => invoices.map((invoice) => ({
    ...invoice,
    paymentStatus: paymentStatusFor(invoice, todayTimestamp),
  })), [invoices, todayTimestamp]);

  const filteredProjects = projectOptions.filter((project) => !watchedClientId || project.clientId === watchedClientId);
  const filteredInvoices = useMemo(() => invoiceRegister.filter((invoice) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || [
      invoice.id, invoice.quotationId, invoice.clientName, invoice.projectName,
      invoice.description, invoice.status, invoice.paymentStatus,
    ].join(" ").toLowerCase().includes(query);
    const matchesStatus = statusFilter === "All" || invoice.status === statusFilter;
    const matchesPayment = paymentFilter === "All" || invoice.paymentStatus === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  }), [invoiceRegister, paymentFilter, searchTerm, statusFilter]);

  const openCreateForm = () => {
    setEditingId(null);
    setSuccessMsg("");
    reset(defaultFormValues);
    loadBankDetails();
    setShowForm(true);
  };

  const openEditForm = (invoice: InvoiceRecord) => {
    if (!["Draft", "Pending Approval"].includes(invoice.status) || invoice.amountPaid > 0) return;
    setEditingId(invoice.id);
    setSuccessMsg("");
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
    loadBankDetails();
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
    const quotation = acceptedQuotationOptions.find((item) => item.id === quotationId);
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

  const persistInvoice = (data: InvoiceFormData, status: InvoiceStatus) => {
    const client = clientOptions.find((item) => item.id === data.clientId);
    const project = projectOptions.find((item) => item.id === data.projectId);
    if (!client || !project) return;

    if (
      data.billingSource === "Accepted Quotation"
      && invoices.some((invoice) => invoice.quotationId === data.quotationId && invoice.id !== editingId && invoice.status !== "Archived")
    ) {
      setError("quotationId", { message: "This quotation already has an active invoice" });
      return;
    }

    const calculated = calculateTotals(data.baseAmount, data.discount, data.gstType);
    const now = new Date().toISOString();

    if (editingId) {
      setInvoices((current) => current.map((invoice) => invoice.id === editingId ? {
        ...invoice,
        billingSource: data.billingSource,
        quotationId: data.billingSource === "Accepted Quotation" ? data.quotationId ?? "" : "",
        clientId: client.id,
        clientName: client.name,
        projectId: project.id,
        projectName: project.name,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        terms: data.terms,
        customPaymentTerms: data.terms === "Custom / Manual" ? data.customPaymentTerms?.trim() ?? "" : "",
        currency: data.currency,
        description: data.description,
        baseAmount: calculated.baseAmount,
        discount: calculated.discount,
        taxableAmount: calculated.taxableAmount,
        gstType: data.gstType,
        gstRate: calculated.gstRate,
        gstAmount: calculated.gstAmount,
        totalAmount: calculated.totalAmount,
        status,
        remarks: data.remarks ?? "",
        updatedAt: now,
      } : invoice));
      setSuccessMsg(status === "Draft" ? "Invoice draft updated" : "Invoice submitted for approval");
    } else {
      const nextNumber = Math.max(89, ...invoices.map((invoice) => Number(invoice.id.split("-").pop()) || 0)) + 1;
      setInvoices((current) => [{
        id: `INV-${new Date().getFullYear()}-${String(nextNumber).padStart(3, "0")}`,
        billingSource: data.billingSource,
        quotationId: data.billingSource === "Accepted Quotation" ? data.quotationId ?? "" : "",
        clientId: client.id,
        clientName: client.name,
        projectId: project.id,
        projectName: project.name,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        terms: data.terms,
        customPaymentTerms: data.terms === "Custom / Manual" ? data.customPaymentTerms?.trim() ?? "" : "",
        currency: data.currency,
        description: data.description,
        baseAmount: calculated.baseAmount,
        discount: calculated.discount,
        taxableAmount: calculated.taxableAmount,
        gstType: data.gstType,
        gstRate: calculated.gstRate,
        gstAmount: calculated.gstAmount,
        totalAmount: calculated.totalAmount,
        status,
        amountPaid: 0,
        paymentStatus: "Not Due",
        remarks: data.remarks ?? "",
        owner: "Accountant",
        createdAt: now,
        updatedAt: now,
      }, ...current]);
      setSuccessMsg(status === "Draft" ? "Invoice draft saved" : "Invoice submitted for approval");
    }
    setTimeout(closeForm, 900);
  };

  const saveDraft = handleSubmit((data) => persistInvoice(data, "Draft"));
  const submitForApproval = handleSubmit((data) => persistInvoice(data, "Pending Approval"));

  const updateStatus = (invoiceId: string, status: InvoiceStatus) => {
    setInvoices((current) => current.map((invoice) => invoice.id === invoiceId
      ? { ...invoice, status, updatedAt: new Date().toISOString() }
      : invoice));
  };

  const exportInvoices = () => {
    const rows = [
      ["Invoice", "Quotation", "Client", "Project", "Invoice Date", "Due Date", "Taxable", "GST", "Total", "Paid", "Outstanding", "Currency", "Status", "Payment Status"],
      ...filteredInvoices.map((invoice) => [
        invoice.id, invoice.quotationId || "Direct", invoice.clientName, invoice.projectName,
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
      `Billing Source: ${invoice.quotationId || "Direct / Milestone"}`,
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
      `Payment Status: ${paymentStatusFor(invoice, todayTimestamp)}`,
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
                              {acceptedQuotationOptions.map((quotation) => {
                                const alreadyInvoiced = invoices.some((invoice) => invoice.quotationId === quotation.id && invoice.id !== editingId && invoice.status !== "Archived");
                                return <option key={quotation.id} value={quotation.id} disabled={alreadyInvoiced}>{quotation.id}{alreadyInvoiced ? " - Already invoiced" : ""}</option>;
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
                            {filteredProjects.map((project) => <option key={project.id} value={project.id}>{project.id} - {project.name}</option>)}
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
                          <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Beneficiary</p><p className="text-sm font-black text-primary">{bankDetails.accountName}</p></div>
                          <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bank</p><p className="text-sm font-black text-primary">{bankDetails.bankName}</p></div>
                          <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account</p><p className="font-mono text-sm font-black text-primary">{bankDetails.accountNumber}</p></div>
                          <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">IFSC</p><p className="font-mono text-sm font-black text-primary">{bankDetails.ifscCode}</p></div>
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
                        <ActionButton icon={ShieldCheck} label="Submit for Approval" variant="accent" type="submit" />
                        <ActionButton icon={Receipt} label="Save Draft" variant="outline" onClick={saveDraft} />
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
                  <p className="text-[11px] font-semibold text-slate-400">{invoice.quotationId || "Direct / Milestone"}</p>
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
                      <button type="button" onClick={() => updateStatus(invoice.id, "Pending Approval")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-amber-600" title="Submit for approval"><ShieldCheck size={15} /></button>
                    ) : null}
                    {invoice.status === "Pending Approval" ? (
                      <button type="button" onClick={() => updateStatus(invoice.id, "Approved")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-green-600" title="Approve invoice"><Check size={15} /></button>
                    ) : null}
                    {invoice.status === "Approved" ? (
                      <button type="button" onClick={() => updateStatus(invoice.id, "Sent")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-blue-600" title="Mark invoice sent"><Send size={15} /></button>
                    ) : null}
                    <button type="button" onClick={() => downloadInvoice(invoice)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="Download invoice"><Download size={15} /></button>
                    {invoice.status === "Archived" ? (
                      <button type="button" onClick={() => updateStatus(invoice.id, "Draft")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-green-600" title="Restore invoice"><RotateCcw size={15} /></button>
                    ) : invoice.amountPaid === 0 ? (
                      <button type="button" onClick={() => updateStatus(invoice.id, "Archived")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-red-600" title="Archive invoice"><Archive size={15} /></button>
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
