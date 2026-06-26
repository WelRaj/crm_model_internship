"use client";

import { useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Archive, Calculator, Check, CheckCircle2, Clock, Download, Edit3, FileText,
  Landmark, Plus, RotateCcw, Search, Send, ShieldCheck, Trash2, TrendingUp,
  Wallet, X,
} from "lucide-react";
import {
  AccountingPage, ActionButton, DataTable, Field,
  MetricCard, Panel, StatusBadge, WorkflowSteps,
} from "./AccountingComponents";

const INR = "\u20b9";
const quotationStatuses = ["Draft", "Pending Approval", "Approved", "Sent", "Client Accepted", "Client Rejected", "Expired", "Archived"] as const;
const currencies = ["INR", "USD", "AED", "GBP", "EUR"] as const;

const clientOptions = [
  { id: "CL-24001", name: "Apex Finserve Pvt Ltd" },
  { id: "CL-24002", name: "Nexa Retail Cloud" },
  { id: "CL-24003", name: "Bluebird Logistics" },
  { id: "CL-24004", name: "KraftEdge Export LLP" },
];

const projectOptions = [
  { id: "PRJ-001", clientId: "CL-24001", name: "Loan CRM Web App", agreementId: "AGR-2024-002" },
  { id: "PRJ-002", clientId: "CL-24002", name: "E-commerce Mobile App", agreementId: "AGR-2024-001" },
  { id: "PRJ-003", clientId: "CL-24003", name: "Logistics Control Tower", agreementId: "" },
];

const lineItemSchema = z.object({
  description: z.string().trim().min(2, "Description required"),
  qty: z.coerce.number().positive("Quantity must be greater than 0"),
  rate: z.coerce.number().min(0, "Rate cannot be negative"),
});

const quotationSchema = z.object({
  clientId: z.string().min(1, "Select a client"),
  projectId: z.string().min(1, "Select a project"),
  agreementId: z.string().optional(),
  quoteDate: z.string().min(1, "Date required"),
  validTill: z.string().min(1, "Validity required"),
  currency: z.enum(currencies),
  items: z.array(lineItemSchema).min(1, "Add at least one item"),
  discount: z.coerce.number().min(0, "Discount cannot be negative"),
  gstPercent: z.coerce.number().min(0).max(100),
  serviceSummary: z.string().trim().min(5, "Brief summary required"),
  commercialTerms: z.string().trim().min(5, "Commercial terms required"),
}).superRefine((data, ctx) => {
  if (data.validTill < data.quoteDate) {
    ctx.addIssue({ code: "custom", path: ["validTill"], message: "Valid till cannot be before quote date" });
  }
  const subtotal = data.items.reduce((sum, item) => sum + item.qty * item.rate, 0);
  if (subtotal <= 0) {
    ctx.addIssue({ code: "custom", path: ["items"], message: "Quotation value must be greater than 0" });
  }
  if (data.discount > subtotal) {
    ctx.addIssue({ code: "custom", path: ["discount"], message: "Discount cannot exceed subtotal" });
  }
  const project = projectOptions.find((item) => item.id === data.projectId);
  if (project && project.clientId !== data.clientId) {
    ctx.addIssue({ code: "custom", path: ["projectId"], message: "Project does not belong to selected client" });
  }
});

type QuotationFormInput = z.input<typeof quotationSchema>;
type QuotationFormData = z.output<typeof quotationSchema>;
type QuotationStatus = typeof quotationStatuses[number];

type QuotationLineItem = {
  id: string;
  description: string;
  qty: number;
  rate: number;
  amount: number;
};

type QuotationRecord = {
  id: string;
  clientId: string;
  clientName: string;
  projectId: string;
  projectName: string;
  agreementId: string;
  quoteDate: string;
  validTill: string;
  currency: string;
  items: QuotationLineItem[];
  subtotal: number;
  discount: number;
  gstPercent: number;
  gstAmount: number;
  totalAmount: number;
  serviceSummary: string;
  commercialTerms: string;
  status: QuotationStatus;
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

const initialQuotations: QuotationRecord[] = [
  {
    id: "QT-2026-041",
    clientId: "CL-24001",
    clientName: "Apex Finserve Pvt Ltd",
    projectId: "PRJ-001",
    projectName: "Loan CRM Web App",
    agreementId: "AGR-2024-002",
    quoteDate: "2026-06-11",
    validTill: "2026-06-25",
    currency: "INR",
    items: [{ id: "QL-041-1", description: "Loan CRM design and implementation", qty: 1, rate: 800000, amount: 800000 }],
    subtotal: 800000,
    discount: 0,
    gstPercent: 18,
    gstAmount: 144000,
    totalAmount: 944000,
    serviceSummary: "Loan CRM Web App",
    commercialTerms: "30% advance, 40% on UAT, 30% on production release.",
    status: "Approved",
    owner: "Finance Manager",
    createdAt: "2026-06-11T10:00:00.000Z",
    updatedAt: "2026-06-18T10:00:00.000Z",
  },
  {
    id: "QT-2026-042",
    clientId: "CL-24002",
    clientName: "Nexa Retail Cloud",
    projectId: "PRJ-002",
    projectName: "E-commerce Mobile App",
    agreementId: "AGR-2024-001",
    quoteDate: "2026-06-14",
    validTill: "2026-06-28",
    currency: "INR",
    items: [{ id: "QL-042-1", description: "Mobile commerce application delivery", qty: 1, rate: 1125000, amount: 1125000 }],
    subtotal: 1125000,
    discount: 44492,
    gstPercent: 18,
    gstAmount: 194492,
    totalAmount: 1275000,
    serviceSummary: "E-commerce Mobile App",
    commercialTerms: "50% advance and 50% after production acceptance.",
    status: "Client Accepted",
    owner: "Director",
    createdAt: "2026-06-14T10:00:00.000Z",
    updatedAt: "2026-06-20T10:00:00.000Z",
  },
];

const defaultFormValues: QuotationFormInput = {
  clientId: "",
  projectId: "",
  agreementId: "",
  quoteDate: new Date().toISOString().split("T")[0],
  validTill: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  currency: "INR",
  items: [{ description: "", qty: 1, rate: 0 }],
  discount: 0,
  gstPercent: 18,
  serviceSummary: "",
  commercialTerms: "50% advance and balance against agreed delivery milestones.",
};

function calculateTotals(items: Array<{ qty?: unknown; rate?: unknown }> | undefined, discountValue: unknown, gstValue: unknown) {
  const subtotal = (items ?? []).reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.rate) || 0), 0);
  const discount = Number(discountValue) || 0;
  const taxable = Math.max(0, subtotal - discount);
  const gstAmount = taxable * (Number(gstValue) || 0) / 100;
  return { subtotal, taxable, gstAmount, totalAmount: taxable + gstAmount };
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

export default function Step3Quotations() {
  const [quotations, setQuotations] = useState<QuotationRecord[]>(initialQuotations);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [bankDetails, setBankDetails] = useState<BankRecord | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<QuotationFormInput, unknown, QuotationFormData>({
    resolver: zodResolver(quotationSchema),
    defaultValues: defaultFormValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = useWatch({ control, name: "items" });
  const watchedDiscount = useWatch({ control, name: "discount" });
  const watchedGstPercent = useWatch({ control, name: "gstPercent" });
  const watchedClientId = useWatch({ control, name: "clientId" });
  const [todayTimestamp] = useState(() => Date.now());
  const totals = useMemo(
    () => calculateTotals(watchedItems, Number(watchedDiscount), Number(watchedGstPercent)),
    [watchedItems, watchedDiscount, watchedGstPercent],
  );

  const loadBankDetails = () => {
    try {
      const raw = localStorage.getItem("crm_company_banks");
      const banks = raw ? JSON.parse(raw) as BankRecord[] : [];
      const activeBank = banks.find((bank) => bank.status === "Active" && bank.verificationStatus === "Verified" && bank.isPrimary)
        ?? banks.find((bank) => bank.status === "Active" && bank.verificationStatus === "Verified")
        ?? banks.find((bank) => bank.status === "Active")
        ?? null;
      setBankDetails(activeBank);
    } catch {
      setBankDetails(null);
    }
  };

  const filteredProjects = projectOptions.filter((project) => !watchedClientId || project.clientId === watchedClientId);
  const filteredQuotations = useMemo(() => quotations.filter((quotation) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || [
      quotation.id, quotation.clientName, quotation.projectName, quotation.agreementId,
      quotation.serviceSummary, quotation.status, quotation.owner,
    ].join(" ").toLowerCase().includes(query);
    const matchesStatus = statusFilter === "All" || quotation.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [quotations, searchTerm, statusFilter]);

  const openCreateForm = () => {
    setEditingId(null);
    setSuccessMsg("");
    reset(defaultFormValues);
    loadBankDetails();
    setShowForm(true);
  };

  const openEditForm = (quotation: QuotationRecord) => {
    if (!["Draft", "Pending Approval"].includes(quotation.status)) return;
    setEditingId(quotation.id);
    setSuccessMsg("");
    reset({
      clientId: quotation.clientId,
      projectId: quotation.projectId,
      agreementId: quotation.agreementId,
      quoteDate: quotation.quoteDate,
      validTill: quotation.validTill,
      currency: quotation.currency as QuotationFormInput["currency"],
      items: quotation.items.map((item) => ({ description: item.description, qty: item.qty, rate: item.rate })),
      discount: quotation.discount,
      gstPercent: quotation.gstPercent,
      serviceSummary: quotation.serviceSummary,
      commercialTerms: quotation.commercialTerms,
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

  const persistQuotation = (data: QuotationFormData, status: QuotationStatus) => {
    const client = clientOptions.find((item) => item.id === data.clientId);
    const project = projectOptions.find((item) => item.id === data.projectId);
    if (!client || !project) return;

    const calculated = calculateTotals(data.items, data.discount, data.gstPercent);
    const now = new Date().toISOString();
    const lineItems: QuotationLineItem[] = data.items.map((item, index) => ({
      id: editingId
        ? quotations.find((quotation) => quotation.id === editingId)?.items[index]?.id ?? `${editingId}-L${index + 1}`
        : `QL-${Date.now()}-${index + 1}`,
      description: item.description,
      qty: item.qty,
      rate: item.rate,
      amount: item.qty * item.rate,
    }));

    if (editingId) {
      setQuotations((current) => current.map((quotation) => quotation.id === editingId ? {
        ...quotation,
        clientId: client.id,
        clientName: client.name,
        projectId: project.id,
        projectName: project.name,
        agreementId: data.agreementId || project.agreementId,
        quoteDate: data.quoteDate,
        validTill: data.validTill,
        currency: data.currency,
        items: lineItems,
        subtotal: calculated.subtotal,
        discount: data.discount,
        gstPercent: data.gstPercent,
        gstAmount: calculated.gstAmount,
        totalAmount: calculated.totalAmount,
        serviceSummary: data.serviceSummary,
        commercialTerms: data.commercialTerms,
        status,
        updatedAt: now,
      } : quotation));
      setSuccessMsg(status === "Draft" ? "Quotation draft updated" : "Quotation submitted for approval");
    } else {
      const nextNumber = Math.max(42, ...quotations.map((quotation) => Number(quotation.id.split("-").pop()) || 0)) + 1;
      setQuotations((current) => [{
        id: `QT-${new Date().getFullYear()}-${String(nextNumber).padStart(3, "0")}`,
        clientId: client.id,
        clientName: client.name,
        projectId: project.id,
        projectName: project.name,
        agreementId: data.agreementId || project.agreementId,
        quoteDate: data.quoteDate,
        validTill: data.validTill,
        currency: data.currency,
        items: lineItems,
        subtotal: calculated.subtotal,
        discount: data.discount,
        gstPercent: data.gstPercent,
        gstAmount: calculated.gstAmount,
        totalAmount: calculated.totalAmount,
        serviceSummary: data.serviceSummary,
        commercialTerms: data.commercialTerms,
        status,
        owner: "Accountant",
        createdAt: now,
        updatedAt: now,
      }, ...current]);
      setSuccessMsg(status === "Draft" ? "Quotation draft saved" : "Quotation submitted for approval");
    }
    setTimeout(closeForm, 900);
  };

  const saveDraft = handleSubmit((data) => persistQuotation(data, "Draft"));
  const submitForApproval = handleSubmit((data) => persistQuotation(data, "Pending Approval"));

  const updateStatus = (quotationId: string, status: QuotationStatus) => {
    setQuotations((current) => current.map((quotation) => quotation.id === quotationId
      ? { ...quotation, status, updatedAt: new Date().toISOString() }
      : quotation));
  };

  const exportQuotations = () => {
    const rows = [
      ["Quotation", "Client", "Project", "Agreement", "Quote Date", "Valid Till", "Subtotal", "Discount", "GST", "Total", "Currency", "Status", "Owner"],
      ...filteredQuotations.map((quotation) => [
        quotation.id, quotation.clientName, quotation.projectName, quotation.agreementId,
        quotation.quoteDate, quotation.validTill, quotation.subtotal, quotation.discount,
        quotation.gstAmount, quotation.totalAmount, quotation.currency, quotation.status, quotation.owner,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadFile("quotation-register.csv", csv, "text/csv;charset=utf-8");
  };

  const downloadQuotation = (quotation: QuotationRecord) => {
    const content = [
      `Quotation: ${quotation.id}`,
      `Client: ${quotation.clientName}`,
      `Project: ${quotation.projectName}`,
      `Agreement: ${quotation.agreementId || "Not linked"}`,
      `Valid Till: ${formatDate(quotation.validTill)}`,
      "",
      ...quotation.items.map((item, index) => `${index + 1}. ${item.description} | ${item.qty} x ${money(item.rate, quotation.currency)} = ${money(item.amount, quotation.currency)}`),
      "",
      `Subtotal: ${money(quotation.subtotal, quotation.currency)}`,
      `Discount: ${money(quotation.discount, quotation.currency)}`,
      `GST (${quotation.gstPercent}%): ${money(quotation.gstAmount, quotation.currency)}`,
      `Grand Total: ${money(quotation.totalAmount, quotation.currency)}`,
      `Commercial Terms: ${quotation.commercialTerms}`,
      `Status: ${quotation.status}`,
    ].join("\n");
    downloadFile(`${quotation.id}.txt`, content, "text/plain;charset=utf-8");
  };

  const acceptedValue = quotations.filter((quotation) => quotation.status === "Client Accepted").reduce((sum, quotation) => sum + quotation.totalAmount, 0);
  const openCount = quotations.filter((quotation) => !["Client Accepted", "Client Rejected", "Expired", "Archived"].includes(quotation.status)).length;
  const averageDiscount = quotations.length
    ? quotations.reduce((sum, quotation) => sum + (quotation.subtotal ? quotation.discount / quotation.subtotal * 100 : 0), 0) / quotations.length
    : 0;
  const expiringCount = quotations.filter((quotation) => {
    if (["Client Accepted", "Client Rejected", "Expired", "Archived"].includes(quotation.status)) return false;
    const days = (new Date(`${quotation.validTill}T00:00:00`).getTime() - todayTimestamp) / 86400000;
    return days >= 0 && days <= 7;
  }).length;

  return (
    <AccountingPage
      title="Quotation Management"
      description="Create controlled commercial proposals linked to client, project, agreement, approval, and invoice workflows."
      icon={FileText}
      badge="Lead to billing"
      actions={
        <>
          <ActionButton icon={Download} label="Export Register" variant="outline" onClick={exportQuotations} />
          <ActionButton icon={Plus} label="New Quotation" variant="accent" onClick={openCreateForm} />
        </>
      }
    >
      <WorkflowSteps steps={["Lead Won", "Quotation Draft", "Approval", "Client Acceptance", "Invoice"]} />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Open Quotations" value={String(openCount)} helper="Active commercial pipeline" icon={FileText} tone="blue" />
        <MetricCard label="Accepted Value" value={money(acceptedValue)} helper="Eligible for invoicing" icon={TrendingUp} tone="green" />
        <MetricCard label="Avg Discount" value={`${averageDiscount.toFixed(1)}%`} helper="Across all proposals" icon={Wallet} tone="purple" />
        <MetricCard label="Expiring Soon" value={String(expiringCount)} helper="Within 7 days" icon={Clock} tone="amber" />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] border border-slate-100 bg-white p-8 shadow-2xl animate-in zoom-in-95">
            <button type="button" onClick={closeForm} className="absolute right-8 top-8 rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-primary">
              <X size={24} />
            </button>

            {successMsg ? (
              <div className="space-y-4 py-20 text-center animate-in zoom-in-95">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 size={48} /></div>
                <h3 className="text-2xl font-black text-primary">{successMsg}</h3>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Commercial record and totals are updated.</p>
              </div>
            ) : (
              <form onSubmit={submitForApproval} className="space-y-8">
                <div className="border-b border-slate-100 pb-6">
                  <h3 className="text-2xl font-black tracking-tight text-primary">{editingId ? "Edit Quotation" : "Generate Quotation"}</h3>
                  <p className="mt-1 text-sm font-medium text-slate-500">Draft values remain editable. Approved or client-facing quotations are locked from commercial edits.</p>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                  <div className="space-y-8 lg:col-span-3">
                    <Panel title="Quotation Details" description="Link the legal client, project, agreement, and validity period.">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <label className="block space-y-1.5">
                          <span className="text-xs font-black uppercase tracking-widest text-slate-500">Client <span className="text-red-500">*</span></span>
                          <select {...register("clientId")} className={`h-11 w-full rounded-xl border bg-white px-3 text-sm font-semibold text-primary outline-none transition-all focus:ring-4 focus:ring-primary/10 ${errors.clientId ? "border-red-500" : "border-border focus:border-primary"}`}>
                            <option value="">Select Client...</option>
                            {clientOptions.map((client) => <option key={client.id} value={client.id}>{client.id} - {client.name}</option>)}
                          </select>
                          {errors.clientId ? <p className="text-[10px] font-black uppercase tracking-widest text-red-500">{errors.clientId.message}</p> : null}
                        </label>
                        <label className="block space-y-1.5">
                          <span className="text-xs font-black uppercase tracking-widest text-slate-500">Project <span className="text-red-500">*</span></span>
                          <select {...register("projectId")} className={`h-11 w-full rounded-xl border bg-white px-3 text-sm font-semibold text-primary outline-none transition-all focus:ring-4 focus:ring-primary/10 ${errors.projectId ? "border-red-500" : "border-border focus:border-primary"}`}>
                            <option value="">Select Project...</option>
                            {filteredProjects.map((project) => <option key={project.id} value={project.id}>{project.id} - {project.name}</option>)}
                          </select>
                          {errors.projectId ? <p className="text-[10px] font-black uppercase tracking-widest text-red-500">{errors.projectId.message}</p> : null}
                        </label>
                        <Field label="Agreement ID" placeholder="AGR-2026-001" register={register("agreementId")} error={errors.agreementId?.message} />
                        <Field label="Quote Date" type="date" required register={register("quoteDate")} error={errors.quoteDate?.message} />
                        <Field label="Valid Till" type="date" required register={register("validTill")} error={errors.validTill?.message} />
                        <Field label="Currency" options={[...currencies]} required register={register("currency")} error={errors.currency?.message} />
                        <div className="md:col-span-3">
                          <Field label="Service Summary" placeholder="Scope overview..." required register={register("serviceSummary")} error={errors.serviceSummary?.message} />
                        </div>
                      </div>
                      {watchedClientId ? (
                        <p className="mt-4 text-xs font-bold text-slate-500">
                          Client: {clientOptions.find((client) => client.id === watchedClientId)?.name}. Projects are filtered to this client.
                        </p>
                      ) : null}
                    </Panel>

                    <Panel
                      title="Scope & Pricing"
                      description="Billable line items with calculated amounts."
                      actions={<ActionButton icon={Plus} label="Add Item" variant="outline" onClick={() => append({ description: "", qty: 1, rate: 0 })} />}
                    >
                      <div className="space-y-4">
                        {fields.map((field, index) => {
                          const item = watchedItems?.[index];
                          const amount = (Number(item?.qty) || 0) * (Number(item?.rate) || 0);
                          return (
                            <div key={field.id} className="grid grid-cols-1 items-end gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 md:grid-cols-12">
                              <div className="md:col-span-6"><Field label="Description" register={register(`items.${index}.description`)} error={errors.items?.[index]?.description?.message} /></div>
                              <div className="md:col-span-2"><Field label="Qty" type="number" step="0.01" register={register(`items.${index}.qty`)} error={errors.items?.[index]?.qty?.message} /></div>
                              <div className="md:col-span-2"><Field label="Rate" type="number" step="0.01" register={register(`items.${index}.rate`)} error={errors.items?.[index]?.rate?.message} /></div>
                              <div className="md:col-span-1 pb-3 text-right text-sm font-black text-primary">{money(amount)}</div>
                              <div className="flex justify-center pb-2 md:col-span-1">
                                <button type="button" disabled={fields.length === 1} onClick={() => remove(index)} className="p-2 text-slate-300 transition-colors hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30" title="Remove line item">
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {errors.items?.message ? <p className="text-xs font-bold text-red-500">{errors.items.message}</p> : null}
                      </div>
                    </Panel>

                    <Panel title="Commercial Terms" description="Terms included in the buyer-facing proposal.">
                      <Field label="Payment and Delivery Terms" multiline required register={register("commercialTerms")} error={errors.commercialTerms?.message} />
                    </Panel>

                    <Panel title="Payment Information (Buyer View)" icon={Landmark} description="Active treasury details displayed on the proposal.">
                      {bankDetails ? (
                        <div className="grid grid-cols-1 gap-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-6 md:grid-cols-2">
                          <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Beneficiary</p><p className="text-sm font-black text-primary">{bankDetails.accountName}</p></div>
                          <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bank</p><p className="text-sm font-black text-primary">{bankDetails.bankName}</p></div>
                          <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account</p><p className="font-mono text-sm font-black text-primary">{bankDetails.accountNumber}</p></div>
                          <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">IFSC</p><p className="font-mono text-sm font-black text-primary">{bankDetails.ifscCode}</p></div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-xs font-bold text-slate-400">
                          No active treasury account is configured. Proposal can be saved, but remittance details will be absent.
                        </div>
                      )}
                    </Panel>
                  </div>

                  <div className="space-y-6">
                    <Panel title="Grand Total" description="Taxable value and approval amount.">
                      <div className="space-y-5">
                        <div className="grid grid-cols-1 gap-4">
                          <Field label="Discount" type="number" step="0.01" register={register("discount")} error={errors.discount?.message} />
                          <Field label="GST Percent" type="number" step="0.01" register={register("gstPercent")} error={errors.gstPercent?.message} />
                        </div>
                        <div className="relative overflow-hidden rounded-2xl bg-primary p-6 text-white shadow-xl">
                          <Calculator className="absolute -bottom-4 -right-4 text-white/5" size={100} />
                          <div className="relative z-10 space-y-3">
                            <div className="flex justify-between text-xs font-bold text-white/70"><span>Subtotal</span><span>{money(totals.subtotal)}</span></div>
                            <div className="flex justify-between text-xs font-bold text-white/70"><span>Discount</span><span>{money(Number(watchedDiscount) || 0)}</span></div>
                            <div className="flex justify-between text-xs font-bold text-white/70"><span>GST</span><span>{money(totals.gstAmount)}</span></div>
                            <div className="border-t border-white/10 pt-4">
                              <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Final Value</p>
                              <p className="mt-1 text-3xl font-black">{money(totals.totalAmount)}</p>
                            </div>
                          </div>
                        </div>
                        <ActionButton icon={ShieldCheck} label="Submit for Approval" variant="accent" type="submit" />
                        <ActionButton icon={FileText} label="Save Draft" variant="outline" onClick={saveDraft} />
                      </div>
                    </Panel>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Panel
        title="Quotation Register"
        description="Commercial stage, validity, approval state, and client acceptance."
        actions={<StatusBadge tone="blue">{filteredQuotations.length} Quotations</StatusBadge>}
      >
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search quotation, client, project, agreement..." className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm font-semibold text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10">
            {["All", ...quotationStatuses].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>

        <DataTable columns={["Quotation", "Client / Project", "Commercials", "Valid Till", "Status", "Actions"]}>
          {filteredQuotations.map((quotation) => (
            <tr key={quotation.id} className="text-sm transition-colors hover:bg-slate-50">
              <td className="px-4 py-4">
                <p className="font-black text-primary">{quotation.id}</p>
                <p className="text-[11px] font-semibold text-slate-400">{quotation.agreementId || "No agreement linked"}</p>
              </td>
              <td className="px-4 py-4">
                <p className="font-black text-primary">{quotation.clientName}</p>
                <p className="text-xs font-semibold text-slate-500">{quotation.projectName}</p>
              </td>
              <td className="px-4 py-4">
                <p className="font-black text-primary">{money(quotation.totalAmount, quotation.currency)}</p>
                <p className="text-[11px] font-semibold text-slate-400">Discount {money(quotation.discount, quotation.currency)} | GST {quotation.gstPercent}%</p>
              </td>
              <td className="px-4 py-4">
                <p className="font-bold text-slate-600">{formatDate(quotation.validTill)}</p>
                <p className="text-[11px] font-semibold text-slate-400">Created {formatDate(quotation.quoteDate)}</p>
              </td>
              <td className="px-4 py-4">
                <StatusBadge tone={quotation.status === "Client Accepted" || quotation.status === "Approved" ? "green" : quotation.status === "Client Rejected" || quotation.status === "Expired" || quotation.status === "Archived" ? "red" : quotation.status === "Pending Approval" ? "amber" : "blue"}>
                  {quotation.status}
                </StatusBadge>
              </td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  {["Draft", "Pending Approval"].includes(quotation.status) ? (
                    <button type="button" onClick={() => openEditForm(quotation)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="Edit quotation"><Edit3 size={15} /></button>
                  ) : null}
                  {quotation.status === "Draft" ? (
                    <button type="button" onClick={() => updateStatus(quotation.id, "Pending Approval")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-amber-600" title="Submit for approval"><ShieldCheck size={15} /></button>
                  ) : null}
                  {quotation.status === "Pending Approval" ? (
                    <button type="button" onClick={() => updateStatus(quotation.id, "Approved")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-green-600" title="Approve quotation"><Check size={15} /></button>
                  ) : null}
                  {quotation.status === "Approved" ? (
                    <button type="button" onClick={() => updateStatus(quotation.id, "Sent")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-blue-600" title="Mark sent to client"><Send size={15} /></button>
                  ) : null}
                  {quotation.status === "Sent" ? (
                    <button type="button" onClick={() => updateStatus(quotation.id, "Client Accepted")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-green-600" title="Mark client accepted"><CheckCircle2 size={15} /></button>
                  ) : null}
                  <button type="button" onClick={() => downloadQuotation(quotation)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="Download quotation"><Download size={15} /></button>
                  {quotation.status === "Archived" ? (
                    <button type="button" onClick={() => updateStatus(quotation.id, "Draft")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-green-600" title="Restore quotation"><RotateCcw size={15} /></button>
                  ) : (
                    <button type="button" onClick={() => updateStatus(quotation.id, "Archived")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-red-600" title="Archive quotation"><Archive size={15} /></button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}
