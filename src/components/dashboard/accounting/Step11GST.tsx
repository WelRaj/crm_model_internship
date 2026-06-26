"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  AlertTriangle, Calculator, Check, CheckCircle2, Download, Edit3, FileCheck2,
  Percent, ReceiptText, Search, Send, ShieldCheck, Upload, Wallet, X,
} from "lucide-react";
import {
  AccountingPage, ActionButton, DataTable, Field,
  MetricCard, Panel, StatusBadge, WorkflowSteps,
} from "./AccountingComponents";

const INR = "\u20b9";
const gstStatuses = ["Working", "Ready for Review", "Approved", "Filed", "Mismatch", "Reopened"] as const;

type GstDocument = {
  id: string;
  period: string;
  kind: "Sales Invoice" | "Credit Note" | "Purchase Invoice" | "Expense";
  partyName: string;
  gstin: string;
  taxableAmount: number;
  igst: number;
  cgst: number;
  sgst: number;
  itcEligible: boolean;
  status: "Approved" | "Issued" | "Verified" | "Pending";
};

const gstDocuments: GstDocument[] = [
  { id: "INV-2026-088", period: "2026-06", kind: "Sales Invoice", partyName: "Nexa Retail Cloud", gstin: "27AAFCN1234A1Z5", taxableAmount: 1080508, igst: 0, cgst: 97246, sgst: 97246, itcEligible: false, status: "Approved" },
  { id: "INV-2026-086", period: "2026-06", kind: "Sales Invoice", partyName: "Bluebird Logistics", gstin: "29AABCB4567C1Z2", taxableAmount: 305084.75, igst: 54915.25, cgst: 0, sgst: 0, itcEligible: false, status: "Approved" },
  { id: "CN-2026-014", period: "2026-06", kind: "Credit Note", partyName: "Bluebird Logistics", gstin: "29AABCB4567C1Z2", taxableAmount: 30000, igst: 5400, cgst: 0, sgst: 0, itcEligible: false, status: "Issued" },
  { id: "PUR-AWS-0626", period: "2026-06", kind: "Purchase Invoice", partyName: "Amazon Web Services India", gstin: "29AAECA1234L1Z8", taxableAmount: 245000, igst: 44100, cgst: 0, sgst: 0, itcEligible: true, status: "Verified" },
  { id: "EXP-SOFT-0626", period: "2026-06", kind: "Expense", partyName: "SaaS Tools India", gstin: "27AAECS7890Q1Z3", taxableAmount: 95000, igst: 0, cgst: 8550, sgst: 8550, itcEligible: true, status: "Verified" },
  { id: "EXP-HOTEL-0626", period: "2026-06", kind: "Expense", partyName: "City Hotel", gstin: "27AACCH1111K1Z9", taxableAmount: 28000, igst: 0, cgst: 2520, sgst: 2520, itcEligible: false, status: "Verified" },
  { id: "PUR-PENDING-0626", period: "2026-06", kind: "Purchase Invoice", partyName: "TechDepot Hardware", gstin: "", taxableAmount: 112000, igst: 20160, cgst: 0, sgst: 0, itcEligible: true, status: "Pending" },
];

const gstSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, "GST period is required"),
  filingDueDate: z.string().min(1, "Filing due date required"),
  preparedBy: z.string().trim().min(2, "Prepared by required"),
  gstr1DeclaredTaxable: z.coerce.number().min(0),
  gstr1DeclaredTax: z.coerce.number().min(0),
  gstr3bDeclaredOutput: z.coerce.number().min(0),
  gstr3bClaimedItc: z.coerce.number().min(0),
  cashLedgerBalance: z.coerce.number().min(0),
  remarks: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.filingDueDate < `${data.period}-01`) {
    ctx.addIssue({ code: "custom", path: ["filingDueDate"], message: "Filing due date cannot be before the tax period" });
  }
});

type GstFormInput = z.input<typeof gstSchema>;
type GstFormData = z.output<typeof gstSchema>;
type GstStatus = typeof gstStatuses[number];

type GstReturnRecord = {
  id: string;
  period: string;
  outwardTaxable: number;
  creditTaxable: number;
  netTaxableSales: number;
  outputIgst: number;
  outputCgst: number;
  outputSgst: number;
  creditTaxReversal: number;
  netOutputTax: number;
  purchaseTaxable: number;
  eligibleItc: number;
  ineligibleItc: number;
  pendingItc: number;
  gstr1DeclaredTaxable: number;
  gstr1DeclaredTax: number;
  gstr3bDeclaredOutput: number;
  gstr3bClaimedItc: number;
  cashLedgerBalance: number;
  netCashPayable: number;
  filingDueDate: string;
  preparedBy: string;
  approvedBy: string;
  arn: string;
  filedAt: string;
  status: GstStatus;
  remarks: string;
  createdAt: string;
  updatedAt: string;
};

const initialReturns: GstReturnRecord[] = [
  {
    id: "GST-2026-004", period: "2026-04", outwardTaxable: 1840000, creditTaxable: 0,
    netTaxableSales: 1840000, outputIgst: 140000, outputCgst: 95500, outputSgst: 95500,
    creditTaxReversal: 0, netOutputTax: 331000, purchaseTaxable: 600000,
    eligibleItc: 108000, ineligibleItc: 0, pendingItc: 0,
    gstr1DeclaredTaxable: 1840000, gstr1DeclaredTax: 331000,
    gstr3bDeclaredOutput: 331000, gstr3bClaimedItc: 108000, cashLedgerBalance: 0,
    netCashPayable: 223000, filingDueDate: "2026-05-20", preparedBy: "Accountant",
    approvedBy: "Finance Manager", arn: "AA270426000001", filedAt: "2026-05-18T10:00:00.000Z",
    status: "Filed", remarks: "", createdAt: "2026-05-10T10:00:00.000Z", updatedAt: "2026-05-18T10:00:00.000Z",
  },
  {
    id: "GST-2026-005", period: "2026-05", outwardTaxable: 2270000, creditTaxable: 0,
    netTaxableSales: 2270000, outputIgst: 180000, outputCgst: 114500, outputSgst: 114500,
    creditTaxReversal: 0, netOutputTax: 409000, purchaseTaxable: 790000,
    eligibleItc: 142000, ineligibleItc: 0, pendingItc: 0,
    gstr1DeclaredTaxable: 2270000, gstr1DeclaredTax: 409000,
    gstr3bDeclaredOutput: 409000, gstr3bClaimedItc: 142000, cashLedgerBalance: 0,
    netCashPayable: 267000, filingDueDate: "2026-06-20", preparedBy: "Accountant",
    approvedBy: "Finance Manager", arn: "AA270526000002", filedAt: "2026-06-19T10:00:00.000Z",
    status: "Filed", remarks: "", createdAt: "2026-06-10T10:00:00.000Z", updatedAt: "2026-06-19T10:00:00.000Z",
  },
];

function aggregatePeriod(period: string) {
  const docs = gstDocuments.filter((document) => document.period === period);
  const sales = docs.filter((document) => document.kind === "Sales Invoice" && document.status === "Approved");
  const credits = docs.filter((document) => document.kind === "Credit Note" && document.status === "Issued");
  const inward = docs.filter((document) => ["Purchase Invoice", "Expense"].includes(document.kind));
  const tax = (document: GstDocument) => document.igst + document.cgst + document.sgst;
  const outwardTaxable = sales.reduce((sum, document) => sum + document.taxableAmount, 0);
  const creditTaxable = credits.reduce((sum, document) => sum + document.taxableAmount, 0);
  const outputIgst = sales.reduce((sum, document) => sum + document.igst, 0);
  const outputCgst = sales.reduce((sum, document) => sum + document.cgst, 0);
  const outputSgst = sales.reduce((sum, document) => sum + document.sgst, 0);
  const creditTaxReversal = credits.reduce((sum, document) => sum + tax(document), 0);
  const eligibleItc = inward.filter((document) => document.status === "Verified" && document.itcEligible && document.gstin).reduce((sum, document) => sum + tax(document), 0);
  const ineligibleItc = inward.filter((document) => document.status === "Verified" && !document.itcEligible).reduce((sum, document) => sum + tax(document), 0);
  const pendingItc = inward.filter((document) => document.status === "Pending" || !document.gstin).reduce((sum, document) => sum + tax(document), 0);
  return {
    outwardTaxable,
    creditTaxable,
    netTaxableSales: Math.max(0, outwardTaxable - creditTaxable),
    outputIgst,
    outputCgst,
    outputSgst,
    creditTaxReversal,
    netOutputTax: Math.max(0, outputIgst + outputCgst + outputSgst - creditTaxReversal),
    purchaseTaxable: inward.reduce((sum, document) => sum + document.taxableAmount, 0),
    eligibleItc,
    ineligibleItc,
    pendingItc,
    documentCount: docs.length,
  };
}

const defaultSummary = aggregatePeriod("2026-06");
const defaultFormValues: GstFormInput = {
  period: "2026-06",
  filingDueDate: "2026-07-20",
  preparedBy: "Rajkumar Rathore",
  gstr1DeclaredTaxable: defaultSummary.netTaxableSales,
  gstr1DeclaredTax: defaultSummary.netOutputTax,
  gstr3bDeclaredOutput: defaultSummary.netOutputTax,
  gstr3bClaimedItc: defaultSummary.eligibleItc,
  cashLedgerBalance: 0,
  remarks: "",
};

function money(value: number) {
  return `${INR} ${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function periodLabel(value: string) {
  return new Date(`${value}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
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

export default function Step11GST() {
  const [returns, setReturns] = useState<GstReturnRecord[]>(initialReturns);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [filingDialog, setFilingDialog] = useState<GstReturnRecord | null>(null);
  const [arn, setArn] = useState("");
  const [filingError, setFilingError] = useState("");

  const {
    register, handleSubmit, control, reset, setValue, setError,
    formState: { errors },
  } = useForm<GstFormInput, unknown, GstFormData>({
    resolver: zodResolver(gstSchema),
    defaultValues: defaultFormValues,
  });

  const watchedPeriod = useWatch({ control, name: "period" });
  const watchedGstr1Taxable = useWatch({ control, name: "gstr1DeclaredTaxable" });
  const watchedGstr1Tax = useWatch({ control, name: "gstr1DeclaredTax" });
  const watchedGstr3bOutput = useWatch({ control, name: "gstr3bDeclaredOutput" });
  const watchedClaimedItc = useWatch({ control, name: "gstr3bClaimedItc" });
  const watchedCashLedger = useWatch({ control, name: "cashLedgerBalance" });
  const summary = useMemo(() => aggregatePeriod(watchedPeriod), [watchedPeriod]);
  const netCashPayable = Math.max(0, (Number(watchedGstr3bOutput) || 0) - (Number(watchedClaimedItc) || 0) - (Number(watchedCashLedger) || 0));
  const gstr1Mismatch = Math.abs((Number(watchedGstr1Taxable) || 0) - summary.netTaxableSales) + Math.abs((Number(watchedGstr1Tax) || 0) - summary.netOutputTax);
  const gstr3bMismatch = Math.abs((Number(watchedGstr3bOutput) || 0) - summary.netOutputTax) + Math.abs((Number(watchedClaimedItc) || 0) - summary.eligibleItc);

  const filteredReturns = useMemo(() => returns.filter((row) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || [row.id, row.period, row.preparedBy, row.approvedBy, row.arn, row.status].join(" ").toLowerCase().includes(query);
    const matchesStatus = statusFilter === "All" || row.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [returns, searchTerm, statusFilter]);

  const openCreateForm = () => {
    setEditingId(null);
    setSuccessMsg("");
    reset(defaultFormValues);
    setShowForm(true);
  };

  const openEditForm = (row: GstReturnRecord) => {
    if (!["Working", "Ready for Review", "Mismatch", "Reopened"].includes(row.status)) return;
    setEditingId(row.id);
    reset({
      period: row.period,
      filingDueDate: row.filingDueDate,
      preparedBy: row.preparedBy,
      gstr1DeclaredTaxable: row.gstr1DeclaredTaxable,
      gstr1DeclaredTax: row.gstr1DeclaredTax,
      gstr3bDeclaredOutput: row.gstr3bDeclaredOutput,
      gstr3bClaimedItc: row.gstr3bClaimedItc,
      cashLedgerBalance: row.cashLedgerBalance,
      remarks: row.remarks,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setSuccessMsg("");
    reset(defaultFormValues);
  };

  const selectPeriod = (period: string) => {
    setValue("period", period, { shouldValidate: true });
    const periodSummary = aggregatePeriod(period);
    setValue("gstr1DeclaredTaxable", periodSummary.netTaxableSales);
    setValue("gstr1DeclaredTax", periodSummary.netOutputTax);
    setValue("gstr3bDeclaredOutput", periodSummary.netOutputTax);
    setValue("gstr3bClaimedItc", periodSummary.eligibleItc);
  };

  const persistReturn = (data: GstFormData, status: GstStatus) => {
    if (returns.some((row) => row.id !== editingId && row.period === data.period && row.status !== "Reopened")) {
      setError("period", { message: "A GST return already exists for this period" });
      return;
    }
    const periodSummary = aggregatePeriod(data.period);
    const mismatch = Math.abs(data.gstr1DeclaredTaxable - periodSummary.netTaxableSales)
      + Math.abs(data.gstr1DeclaredTax - periodSummary.netOutputTax)
      + Math.abs(data.gstr3bDeclaredOutput - periodSummary.netOutputTax)
      + Math.abs(data.gstr3bClaimedItc - periodSummary.eligibleItc);
    const effectiveStatus: GstStatus = status === "Ready for Review" && mismatch > 1 ? "Mismatch" : status;
    const now = new Date().toISOString();
    const common = {
      ...periodSummary,
      gstr1DeclaredTaxable: data.gstr1DeclaredTaxable,
      gstr1DeclaredTax: data.gstr1DeclaredTax,
      gstr3bDeclaredOutput: data.gstr3bDeclaredOutput,
      gstr3bClaimedItc: data.gstr3bClaimedItc,
      cashLedgerBalance: data.cashLedgerBalance,
      netCashPayable: Math.max(0, data.gstr3bDeclaredOutput - data.gstr3bClaimedItc - data.cashLedgerBalance),
      filingDueDate: data.filingDueDate,
      preparedBy: data.preparedBy,
      status: effectiveStatus,
      remarks: data.remarks?.trim() ?? "",
      updatedAt: now,
    };
    if (editingId) {
      setReturns((current) => current.map((row) => row.id === editingId ? { ...row, ...common } : row));
    } else {
      const nextNumber = Math.max(5, ...returns.map((row) => Number(row.id.split("-").pop()) || 0)) + 1;
      setReturns((current) => [{
        id: `GST-${new Date().getFullYear()}-${String(nextNumber).padStart(3, "0")}`,
        period: data.period,
        ...common,
        approvedBy: "",
        arn: "",
        filedAt: "",
        createdAt: now,
      }, ...current]);
    }
    setSuccessMsg(effectiveStatus === "Mismatch" ? "Return saved with reconciliation mismatch" : status === "Working" ? "GST working saved" : "GST return submitted for review");
    setTimeout(closeForm, 900);
  };

  const saveWorking = handleSubmit((data) => persistReturn(data, "Working"));
  const submitReview = handleSubmit((data) => persistReturn(data, "Ready for Review"));

  const approveReturn = (row: GstReturnRecord) => {
    setReturns((current) => current.map((item) => item.id === row.id ? {
      ...item,
      status: "Approved",
      approvedBy: "Finance Manager",
      updatedAt: new Date().toISOString(),
    } : item));
  };

  const fileReturn = () => {
    if (!filingDialog) return;
    if (arn.trim().length < 5) {
      setFilingError("Valid GST filing ARN is required");
      return;
    }
    if (returns.some((row) => row.id !== filingDialog.id && row.arn.toLowerCase() === arn.trim().toLowerCase())) {
      setFilingError("ARN already exists");
      return;
    }
    const now = new Date().toISOString();
    setReturns((current) => current.map((row) => row.id === filingDialog.id ? {
      ...row,
      arn: arn.trim(),
      filedAt: now,
      status: "Filed",
      updatedAt: now,
    } : row));
    setFilingDialog(null);
    setArn("");
    setFilingError("");
  };

  const exportRegister = () => {
    const rows = [
      ["Return", "Period", "Net Taxable Sales", "Output GST", "Credit Reversal", "Eligible ITC", "Ineligible ITC", "Pending ITC", "Net Cash Payable", "GSTR-1 Tax", "GSTR-3B Output", "GSTR-3B ITC", "Status", "ARN", "Filed At"],
      ...filteredReturns.map((row) => [
        row.id, row.period, row.netTaxableSales, row.netOutputTax, row.creditTaxReversal,
        row.eligibleItc, row.ineligibleItc, row.pendingItc, row.netCashPayable,
        row.gstr1DeclaredTax, row.gstr3bDeclaredOutput, row.gstr3bClaimedItc,
        row.status, row.arn, row.filedAt,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadFile("gst-return-register.csv", csv, "text/csv;charset=utf-8");
  };

  const exportDocuments = () => {
    const rows = [
      ["Document", "Period", "Type", "Party", "GSTIN", "Taxable", "IGST", "CGST", "SGST", "ITC Eligible", "Status"],
      ...gstDocuments.map((row) => [row.id, row.period, row.kind, row.partyName, row.gstin, row.taxableAmount, row.igst, row.cgst, row.sgst, row.itcEligible, row.status]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadFile("gst-document-register.csv", csv, "text/csv;charset=utf-8");
  };

  const currentPeriod = aggregatePeriod("2026-06");
  const currentReturn = returns.find((row) => row.period === "2026-06");
  const currentLiability = currentReturn?.netCashPayable ?? Math.max(0, currentPeriod.netOutputTax - currentPeriod.eligibleItc);
  const mismatchCount = returns.filter((row) => row.status === "Mismatch").length + gstDocuments.filter((row) => row.status === "Pending" || (!row.gstin && row.itcEligible)).length;

  return (
    <AccountingPage
      title="GST Management"
      description="Reconcile invoice output tax, credit-note reversals, verified input tax credit, GSTR-1, GSTR-3B, and filing acknowledgements."
      icon={Percent}
      badge="Indian compliance"
      actions={
        <>
          <ActionButton icon={Download} label="Document Register" variant="outline" onClick={exportDocuments} />
          <ActionButton icon={Send} label="Prepare Return" variant="accent" onClick={openCreateForm} />
        </>
      }
    >
      <WorkflowSteps steps={["Document Lock", "GSTR-1 Reconciliation", "GSTR-3B & ITC", "Finance Approval", "File & ARN"]} />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Current Liability" value={money(currentLiability)} helper="Jun 2026 cash estimate" icon={Percent} tone="amber" />
        <MetricCard label="Eligible ITC" value={money(currentPeriod.eligibleItc)} helper={`${money(currentPeriod.pendingItc)} pending`} icon={Wallet} tone="green" />
        <MetricCard label="Net Taxable Sales" value={money(currentPeriod.netTaxableSales)} helper="After issued credit notes" icon={ReceiptText} tone="blue" />
        <MetricCard label="Reconciliation Alerts" value={String(mismatchCount)} helper="Return or document mismatches" icon={AlertTriangle} tone="red" />
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
            <button type="button" onClick={closeForm} className="absolute right-8 top-8 rounded-full p-2 text-slate-400 hover:bg-slate-50"><X size={24} /></button>
            {successMsg ? (
              <div className="space-y-4 py-20 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 size={48} /></div>
                <h3 className="text-2xl font-black text-primary">{successMsg}</h3>
              </div>
            ) : (
              <form onSubmit={submitReview} className="space-y-8">
                <div className="border-b border-slate-100 pb-6">
                  <h3 className="text-2xl font-black text-primary">{editingId ? "Edit GST Working" : "Prepare GST Return"}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">System totals come from approved invoices, issued credit notes, and verified inward documents.</p>
                </div>
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                  <div className="space-y-8 lg:col-span-3">
                    <Panel title="Period & Document Summary" description="Choose the filing month and review locked source values.">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <Field label="GST Period" type="month" required register={register("period")} onChange={(event) => selectPeriod(event.target.value)} error={errors.period?.message} />
                        <Field label="Filing Due Date" type="date" required register={register("filingDueDate")} error={errors.filingDueDate?.message} />
                        <Field label="Prepared By" required register={register("preparedBy")} error={errors.preparedBy?.message} />
                      </div>
                      <div className="mt-5 grid grid-cols-1 gap-4 rounded-xl border border-blue-100 bg-blue-50 p-5 md:grid-cols-4">
                        <div><p className="text-[10px] font-black uppercase text-blue-400">Taxable Sales</p><p className="text-sm font-black text-blue-900">{money(summary.netTaxableSales)}</p></div>
                        <div><p className="text-[10px] font-black uppercase text-blue-400">Output GST</p><p className="text-sm font-black text-blue-900">{money(summary.netOutputTax)}</p></div>
                        <div><p className="text-[10px] font-black uppercase text-blue-400">Eligible ITC</p><p className="text-sm font-black text-blue-900">{money(summary.eligibleItc)}</p></div>
                        <div><p className="text-[10px] font-black uppercase text-blue-400">Documents</p><p className="text-sm font-black text-blue-900">{summary.documentCount}</p></div>
                      </div>
                    </Panel>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                      <Panel title="GSTR-1 Reconciliation" description="Declared outward supply versus invoice register.">
                        <div className="space-y-4">
                          <Field label="Declared Taxable Value" type="number" step="0.01" register={register("gstr1DeclaredTaxable")} error={errors.gstr1DeclaredTaxable?.message} />
                          <Field label="Declared Output Tax" type="number" step="0.01" register={register("gstr1DeclaredTax")} error={errors.gstr1DeclaredTax?.message} />
                          <StatusBadge tone={gstr1Mismatch <= 1 ? "green" : "red"}>{gstr1Mismatch <= 1 ? "Reconciled" : `Difference ${money(gstr1Mismatch)}`}</StatusBadge>
                        </div>
                      </Panel>
                      <Panel title="GSTR-3B & ITC" description="Output liability, eligible ITC claim, and cash ledger offset.">
                        <div className="space-y-4">
                          <Field label="Declared Output Liability" type="number" step="0.01" register={register("gstr3bDeclaredOutput")} error={errors.gstr3bDeclaredOutput?.message} />
                          <Field label="ITC Claimed" type="number" step="0.01" register={register("gstr3bClaimedItc")} error={errors.gstr3bClaimedItc?.message} />
                          <Field label="Cash Ledger Balance Used" type="number" step="0.01" register={register("cashLedgerBalance")} error={errors.cashLedgerBalance?.message} />
                          <StatusBadge tone={gstr3bMismatch <= 1 ? "green" : "red"}>{gstr3bMismatch <= 1 ? "Reconciled" : `Difference ${money(gstr3bMismatch)}`}</StatusBadge>
                        </div>
                      </Panel>
                    </div>
                    <Field label="Return Remarks" multiline register={register("remarks")} error={errors.remarks?.message} />
                  </div>

                  <div className="space-y-6">
                    <Panel title="Final Liability" description="Net cash requirement after eligible ITC and ledger balance.">
                      <div className="space-y-5">
                        <div className="rounded-2xl bg-primary p-6 text-white">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Net Cash Payable</p>
                          <p className="mt-2 text-3xl font-black">{money(netCashPayable)}</p>
                          <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-xs font-bold text-white/70">
                            <div className="flex justify-between"><span>Ineligible ITC</span><span>{money(summary.ineligibleItc)}</span></div>
                            <div className="flex justify-between"><span>Pending ITC</span><span>{money(summary.pendingItc)}</span></div>
                          </div>
                        </div>
                        <ActionButton icon={ShieldCheck} label="Submit for Review" variant="accent" type="submit" />
                        <ActionButton icon={Calculator} label="Save Working" variant="outline" onClick={saveWorking} />
                      </div>
                    </Panel>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {filingDialog ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-black text-primary">Record GST Filing</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">{periodLabel(filingDialog.period)} | {money(filingDialog.netCashPayable)}</p>
            <div className="mt-6 space-y-5">
              <Field label="GST Filing ARN" value={arn} onChange={(event) => { setArn(event.target.value); setFilingError(""); }} error={filingError} />
              <div className="flex justify-end gap-3">
                <ActionButton label="Cancel" variant="outline" onClick={() => setFilingDialog(null)} />
                <ActionButton label="Mark Filed" variant="accent" onClick={fileReturn} />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Panel
        title="GST Filing Register"
        description="Monthly reconciliation, approval, cash liability, filing ARN, and status."
        actions={<ActionButton icon={Download} label="Export Returns" variant="outline" onClick={exportRegister} />}
      >
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_190px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search period, return ID, preparer, ARN..." className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm font-semibold text-primary outline-none" />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary">
            {["All", ...gstStatuses].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>

        <DataTable columns={["Return / Period", "Outward Supply", "Input Tax Credit", "Cash Liability", "Status / Filing", "Actions"]}>
          {filteredReturns.map((row) => (
            <tr key={row.id} className="text-sm transition-colors hover:bg-slate-50">
              <td className="px-4 py-4"><p className="font-black text-primary">{periodLabel(row.period)}</p><p className="text-xs font-semibold text-slate-500">{row.id}</p></td>
              <td className="px-4 py-4"><p className="font-black text-primary">{money(row.netTaxableSales)}</p><p className="text-[11px] font-semibold text-slate-400">GST {money(row.netOutputTax)} | Credit reversal {money(row.creditTaxReversal)}</p></td>
              <td className="px-4 py-4"><p className="font-black text-emerald-600">{money(row.eligibleItc)}</p><p className="text-[11px] font-semibold text-slate-400">Pending {money(row.pendingItc)} | Ineligible {money(row.ineligibleItc)}</p></td>
              <td className="px-4 py-4 font-black text-red-600">{money(row.netCashPayable)}</td>
              <td className="px-4 py-4">
                <StatusBadge tone={row.status === "Filed" ? "green" : row.status === "Mismatch" ? "red" : row.status === "Approved" ? "blue" : "amber"}>{row.status}</StatusBadge>
                <p className="mt-2 text-[11px] font-semibold text-slate-400">{row.arn || `Due ${row.filingDueDate}`}</p>
              </td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  {["Working", "Ready for Review", "Mismatch", "Reopened"].includes(row.status) ? <button type="button" onClick={() => openEditForm(row)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="Edit working"><Edit3 size={15} /></button> : null}
                  {row.status === "Ready for Review" ? <button type="button" onClick={() => approveReturn(row)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-green-600" title="Approve return"><Check size={15} /></button> : null}
                  {row.status === "Approved" ? <button type="button" onClick={() => { setFilingDialog(row); setArn(""); }} className="rounded-lg border border-border p-2 text-slate-500 hover:text-green-600" title="Record filing"><Upload size={15} /></button> : null}
                  {row.status === "Filed" ? <button type="button" onClick={() => downloadFile(`${row.id}.txt`, `GST Return ${row.id}\nPeriod: ${periodLabel(row.period)}\nARN: ${row.arn}\nNet Cash Payable: ${money(row.netCashPayable)}`, "text/plain;charset=utf-8")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="Download filing summary"><FileCheck2 size={15} /></button> : null}
                  {row.status !== "Filed" ? <button type="button" onClick={() => setReturns((current) => current.map((item) => item.id === row.id ? { ...item, status: "Mismatch" } : item))} className="rounded-lg border border-border p-2 text-slate-500 hover:text-red-600" title="Mark mismatch"><X size={15} /></button> : null}
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}
