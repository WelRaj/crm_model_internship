"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  listFinanceResource,
  listInvoices,
  updateFinanceResource,
  createFinanceResource,
  type InvoiceRecord,
} from "@/services/finance-api";

const INR = "\u20b9";
const gstStatuses = ["Working", "Ready for Review", "Approved", "Filed", "Mismatch", "Reopened"] as const;

type GstDocument = {
  id: string;
  period: string;
  kind: "Sales Invoice" | "Credit Note" | "Ledger Sale" | "Ledger Purchase" | "Ledger Expense";
  partyName: string;
  gstin: string;
  taxableAmount: number;
  taxAmount: number;
  itcEligible: boolean;
  status: "Approved" | "Issued" | "Verified" | "Pending";
};

type BackendLedgerRecord = {
  id: string;
  entry_number: string;
  entry_type: "sale" | "purchase" | "expense" | "payroll" | "tax" | "adjustment";
  entry_date: string;
  description: string;
  debit: string;
  credit: string;
  status: string;
};

type BackendCreditNoteRecord = {
  id: string;
  credit_note_number: string;
  invoice: string;
  taxable_amount: string;
  gst_amount: string;
  status: "draft" | "pending_approval" | "approved" | "applied" | "rejected" | "archived";
  created_at: string;
};

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

type BackendGstReturn = {
  id: string;
  period: string;
  outward_taxable: string;
  credit_taxable: string;
  output_gst: string;
  credit_tax_reversal: string;
  input_credit: string;
  ineligible_itc: string;
  pending_itc: string;
  gstr1_taxable: string;
  gstr1_tax: string;
  gstr3b_output: string;
  gstr3b_itc: string;
  cash_ledger_balance: string;
  net_payable: string;
  filing_due_date: string | null;
  prepared_by: string;
  approved_by: string;
  arn: string;
  filed_at: string | null;
  remarks: string;
  status: GstStatus;
  created_at: string;
  updated_at: string;
};

type BackendGstPayload = {
  period: string;
  outward_taxable: string;
  credit_taxable: string;
  output_gst: string;
  credit_tax_reversal: string;
  input_credit: string;
  ineligible_itc: string;
  pending_itc: string;
  gstr1_taxable: string;
  gstr1_tax: string;
  gstr3b_output: string;
  gstr3b_itc: string;
  cash_ledger_balance: string;
  net_payable: string;
  filing_due_date: string;
  prepared_by: string;
  approved_by: string;
  arn: string;
  filed_at: string | null;
  remarks: string;
  status: GstStatus;
};

type GstReturnRecord = {
  backendId: string;
  id: string;
  period: string;
  outwardTaxable: number;
  creditTaxable: number;
  netTaxableSales: number;
  netOutputTax: number;
  creditTaxReversal: number;
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
};

const defaultFormValues: GstFormInput = {
  period: "2026-07",
  filingDueDate: "2026-08-20",
  preparedBy: "Rajkumar Rathore",
  gstr1DeclaredTaxable: 0,
  gstr1DeclaredTax: 0,
  gstr3bDeclaredOutput: 0,
  gstr3bClaimedItc: 0,
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

function periodOf(dateValue: string) {
  return dateValue.slice(0, 7);
}

function parseMeta(description: string) {
  const meta = new Map<string, string>();
  description.split(" | ").slice(1).forEach((part) => {
    const index = part.indexOf("=");
    if (index > -1) meta.set(part.slice(0, index), part.slice(index + 1));
  });
  return meta;
}

function aggregatePeriod(period: string, documents: GstDocument[]) {
  const docs = documents.filter((document) => document.period === period);
  const sales = docs.filter((document) => ["Sales Invoice", "Ledger Sale"].includes(document.kind) && document.status === "Approved");
  const credits = docs.filter((document) => document.kind === "Credit Note" && document.status === "Issued");
  const inward = docs.filter((document) => ["Ledger Purchase", "Ledger Expense"].includes(document.kind));
  const outwardTaxable = sales.reduce((sum, document) => sum + document.taxableAmount, 0);
  const creditTaxable = credits.reduce((sum, document) => sum + document.taxableAmount, 0);
  const creditTaxReversal = credits.reduce((sum, document) => sum + document.taxAmount, 0);
  const grossOutputTax = sales.reduce((sum, document) => sum + document.taxAmount, 0);
  const eligibleItc = inward.filter((document) => document.status === "Verified" && document.itcEligible).reduce((sum, document) => sum + document.taxAmount, 0);
  const ineligibleItc = inward.filter((document) => document.status === "Verified" && !document.itcEligible).reduce((sum, document) => sum + document.taxAmount, 0);
  const pendingItc = inward.filter((document) => document.status === "Pending").reduce((sum, document) => sum + document.taxAmount, 0);
  return {
    outwardTaxable,
    creditTaxable,
    netTaxableSales: Math.max(0, outwardTaxable - creditTaxable),
    netOutputTax: Math.max(0, grossOutputTax - creditTaxReversal),
    creditTaxReversal,
    eligibleItc,
    ineligibleItc,
    pendingItc,
    documentCount: docs.length,
  };
}

function documentsFromBackend(invoices: InvoiceRecord[], credits: BackendCreditNoteRecord[], ledger: BackendLedgerRecord[]): GstDocument[] {
  const invoiceDocs = invoices.filter((invoice) => ["approved", "sent"].includes(invoice.status)).map((invoice) => ({
    id: invoice.invoice_number,
    period: periodOf(invoice.invoice_date),
    kind: "Sales Invoice" as const,
    partyName: `Client ${invoice.client}`,
    gstin: "",
    taxableAmount: Number(invoice.taxable_amount) || 0,
    taxAmount: Number(invoice.gst_amount) || 0,
    itcEligible: false,
    status: "Approved" as const,
  }));
  const creditDocs = credits.filter((credit) => ["applied", "approved"].includes(credit.status)).map((credit) => ({
    id: credit.credit_note_number,
    period: periodOf(credit.created_at),
    kind: "Credit Note" as const,
    partyName: `Invoice ${credit.invoice}`,
    gstin: "",
    taxableAmount: Number(credit.taxable_amount) || 0,
    taxAmount: Number(credit.gst_amount) || 0,
    itcEligible: false,
    status: "Issued" as const,
  }));
  const ledgerDocs = ledger.filter((entry) => ["sale", "purchase", "expense"].includes(entry.entry_type)).map((entry) => {
    const meta = parseMeta(entry.description);
    const slab = Number(meta.get("slab")) || 0;
    const amount = entry.entry_type === "sale" ? Number(entry.credit) || 0 : Number(entry.debit) || 0;
    return {
      id: entry.entry_number,
      period: periodOf(entry.entry_date),
      kind: entry.entry_type === "sale" ? "Ledger Sale" as const : entry.entry_type === "purchase" ? "Ledger Purchase" as const : "Ledger Expense" as const,
      partyName: meta.get("party") || "Ledger Party",
      gstin: "",
      taxableAmount: amount,
      taxAmount: amount * slab / 100,
      itcEligible: entry.entry_type !== "sale",
      status: entry.status === "posted" ? "Verified" as const : "Pending" as const,
    };
  });
  return [...invoiceDocs, ...creditDocs, ...ledgerDocs];
}

function mapReturn(row: BackendGstReturn): GstReturnRecord {
  return {
    backendId: row.id,
    id: `GST-${row.period}`,
    period: row.period,
    outwardTaxable: Number(row.outward_taxable) || 0,
    creditTaxable: Number(row.credit_taxable) || 0,
    netTaxableSales: Math.max(0, (Number(row.outward_taxable) || 0) - (Number(row.credit_taxable) || 0)),
    netOutputTax: Number(row.output_gst) || 0,
    creditTaxReversal: Number(row.credit_tax_reversal) || 0,
    eligibleItc: Number(row.input_credit) || 0,
    ineligibleItc: Number(row.ineligible_itc) || 0,
    pendingItc: Number(row.pending_itc) || 0,
    gstr1DeclaredTaxable: Number(row.gstr1_taxable) || 0,
    gstr1DeclaredTax: Number(row.gstr1_tax) || 0,
    gstr3bDeclaredOutput: Number(row.gstr3b_output) || 0,
    gstr3bClaimedItc: Number(row.gstr3b_itc) || 0,
    cashLedgerBalance: Number(row.cash_ledger_balance) || 0,
    netCashPayable: Number(row.net_payable) || 0,
    filingDueDate: row.filing_due_date || "",
    preparedBy: row.prepared_by,
    approvedBy: row.approved_by,
    arn: row.arn,
    filedAt: row.filed_at || "",
    status: row.status,
    remarks: row.remarks,
  };
}

function buildPayload(data: GstFormData, summary: ReturnType<typeof aggregatePeriod>, status: GstStatus, patch?: Partial<BackendGstPayload>): BackendGstPayload {
  return {
    period: data.period,
    outward_taxable: String(summary.outwardTaxable),
    credit_taxable: String(summary.creditTaxable),
    output_gst: String(summary.netOutputTax),
    credit_tax_reversal: String(summary.creditTaxReversal),
    input_credit: String(summary.eligibleItc),
    ineligible_itc: String(summary.ineligibleItc),
    pending_itc: String(summary.pendingItc),
    gstr1_taxable: String(data.gstr1DeclaredTaxable),
    gstr1_tax: String(data.gstr1DeclaredTax),
    gstr3b_output: String(data.gstr3bDeclaredOutput),
    gstr3b_itc: String(data.gstr3bClaimedItc),
    cash_ledger_balance: String(data.cashLedgerBalance),
    net_payable: String(Math.max(0, data.gstr3bDeclaredOutput - data.gstr3bClaimedItc - data.cashLedgerBalance)),
    filing_due_date: data.filingDueDate,
    prepared_by: data.preparedBy,
    approved_by: "",
    arn: "",
    filed_at: null,
    remarks: data.remarks?.trim() || "",
    status,
    ...patch,
  };
}

export default function Step11GST() {
  const [returns, setReturns] = useState<GstReturnRecord[]>([]);
  const [documents, setDocuments] = useState<GstDocument[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [backendMessage, setBackendMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
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

  const loadGst = useCallback(async () => {
    try {
      setBackendMessage("");
      const [returnRows, invoiceRows, creditRows, ledgerRows] = await Promise.all([
        listFinanceResource<BackendGstReturn>("gst-returns"),
        listInvoices(),
        listFinanceResource<BackendCreditNoteRecord>("credit-notes"),
        listFinanceResource<BackendLedgerRecord>("ledger-entries"),
      ]);
      setReturns(returnRows.map(mapReturn));
      setDocuments(documentsFromBackend(invoiceRows, creditRows, ledgerRows));
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to load GST records.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadGst();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadGst]);

  const watchedPeriod = useWatch({ control, name: "period" });
  const watchedGstr1Taxable = useWatch({ control, name: "gstr1DeclaredTaxable" });
  const watchedGstr1Tax = useWatch({ control, name: "gstr1DeclaredTax" });
  const watchedGstr3bOutput = useWatch({ control, name: "gstr3bDeclaredOutput" });
  const watchedClaimedItc = useWatch({ control, name: "gstr3bClaimedItc" });
  const watchedCashLedger = useWatch({ control, name: "cashLedgerBalance" });
  const summary = useMemo(() => aggregatePeriod(watchedPeriod, documents), [documents, watchedPeriod]);
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
    const periodSummary = aggregatePeriod(defaultFormValues.period, documents);
    setEditingId(null);
    setSuccessMsg("");
    reset({
      ...defaultFormValues,
      gstr1DeclaredTaxable: periodSummary.netTaxableSales,
      gstr1DeclaredTax: periodSummary.netOutputTax,
      gstr3bDeclaredOutput: periodSummary.netOutputTax,
      gstr3bClaimedItc: periodSummary.eligibleItc,
    });
    setShowForm(true);
  };

  const openEditForm = (row: GstReturnRecord) => {
    if (!["Working", "Ready for Review", "Mismatch", "Reopened"].includes(row.status)) return;
    setEditingId(row.backendId);
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
    const periodSummary = aggregatePeriod(period, documents);
    setValue("gstr1DeclaredTaxable", periodSummary.netTaxableSales);
    setValue("gstr1DeclaredTax", periodSummary.netOutputTax);
    setValue("gstr3bDeclaredOutput", periodSummary.netOutputTax);
    setValue("gstr3bClaimedItc", periodSummary.eligibleItc);
  };

  const persistReturn = async (data: GstFormData, status: GstStatus) => {
    if (returns.some((row) => row.backendId !== editingId && row.period === data.period && row.status !== "Reopened")) {
      setError("period", { message: "A GST return already exists for this period" });
      return;
    }
    const periodSummary = aggregatePeriod(data.period, documents);
    const mismatch = Math.abs(data.gstr1DeclaredTaxable - periodSummary.netTaxableSales)
      + Math.abs(data.gstr1DeclaredTax - periodSummary.netOutputTax)
      + Math.abs(data.gstr3bDeclaredOutput - periodSummary.netOutputTax)
      + Math.abs(data.gstr3bClaimedItc - periodSummary.eligibleItc);
    const effectiveStatus: GstStatus = status === "Ready for Review" && mismatch > 1 ? "Mismatch" : status;
    try {
      setBackendMessage("");
      const payload = buildPayload(data, periodSummary, effectiveStatus);
      if (editingId) {
        await updateFinanceResource<BackendGstReturn, BackendGstPayload>("gst-returns", editingId, payload);
      } else {
        await createFinanceResource<BackendGstReturn, BackendGstPayload>("gst-returns", payload);
      }
      await loadGst();
      setSuccessMsg(effectiveStatus === "Mismatch" ? "Return saved with reconciliation mismatch" : status === "Working" ? "GST working saved" : "GST return submitted for review");
      setTimeout(closeForm, 900);
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to save GST return.");
    }
  };

  const saveWorking = handleSubmit((data) => persistReturn(data, "Working"));
  const submitReview = handleSubmit((data) => persistReturn(data, "Ready for Review"));

  const approveReturn = async (row: GstReturnRecord) => {
    try {
      setBackendMessage("");
      await updateFinanceResource<BackendGstReturn, BackendGstPayload>("gst-returns", row.backendId, {
        status: "Approved",
        approved_by: "Finance Manager",
      });
      await loadGst();
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to approve GST return.");
    }
  };

  const markMismatch = async (row: GstReturnRecord) => {
    try {
      setBackendMessage("");
      await updateFinanceResource<BackendGstReturn, BackendGstPayload>("gst-returns", row.backendId, { status: "Mismatch" });
      await loadGst();
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to mark mismatch.");
    }
  };

  const fileReturn = async () => {
    if (!filingDialog) return;
    if (arn.trim().length < 5) {
      setFilingError("Valid GST filing ARN is required");
      return;
    }
    try {
      setBackendMessage("");
      await updateFinanceResource<BackendGstReturn, BackendGstPayload>("gst-returns", filingDialog.backendId, {
        arn: arn.trim(),
        filed_at: new Date().toISOString(),
        status: "Filed",
      });
      await loadGst();
      setFilingDialog(null);
      setArn("");
      setFilingError("");
    } catch (error) {
      setFilingError(error instanceof Error ? error.message : "Unable to file GST return.");
    }
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
      ["Document", "Period", "Type", "Party", "GSTIN", "Taxable", "GST", "ITC Eligible", "Status"],
      ...documents.map((row) => [row.id, row.period, row.kind, row.partyName, row.gstin, row.taxableAmount, row.taxAmount, row.itcEligible, row.status]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadFile("gst-document-register.csv", csv, "text/csv;charset=utf-8");
  };

  const currentPeriod = aggregatePeriod(defaultFormValues.period, documents);
  const currentReturn = returns.find((row) => row.period === defaultFormValues.period);
  const currentLiability = currentReturn?.netCashPayable ?? Math.max(0, currentPeriod.netOutputTax - currentPeriod.eligibleItc);
  const mismatchCount = returns.filter((row) => row.status === "Mismatch").length + documents.filter((row) => row.status === "Pending").length;

  return (
    <AccountingPage
      title="GST Compliance"
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

      {backendMessage ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{backendMessage}</div> : null}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Current Liability" value={money(currentLiability)} helper={`${periodLabel(defaultFormValues.period)} cash estimate`} icon={Percent} tone="amber" />
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
                  <p className="mt-1 text-sm font-semibold text-slate-500">System totals come from approved invoices, issued credit notes, and posted ledger entries.</p>
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
        {isLoading ? <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">Loading backend GST records...</div> : null}
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
            <tr key={row.backendId} className="text-sm transition-colors hover:bg-slate-50">
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
                  {row.status !== "Filed" ? <button type="button" onClick={() => markMismatch(row)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-red-600" title="Mark mismatch"><X size={15} /></button> : null}
                </div>
              </td>
            </tr>
          ))}
          {!isLoading && filteredReturns.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-sm font-bold text-slate-400">No backend GST returns found.</td>
            </tr>
          ) : null}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}
