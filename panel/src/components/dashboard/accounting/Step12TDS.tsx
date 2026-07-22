"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Calculator, Check, CheckCircle2, Download, Edit3, FileCheck2, Landmark,
  Plus, ReceiptText, Search, ShieldCheck, Upload, Wallet, X,
} from "lucide-react";
import {
  AccountingPage, ActionButton, DataTable, Field,
  MetricCard, Panel, StatusBadge, WorkflowSteps,
} from "./AccountingComponents";
import {
  createFinanceResource,
  listFinanceResource,
  listPayments,
  updateFinanceResource,
  type PaymentRecord,
} from "@/services/finance-api";

const INR = "\u20b9";
const tdsTypes = ["Client TDS Receivable", "Vendor TDS Payable", "Employee Salary TDS"] as const;
const tdsSections = ["194C", "194H", "194I", "194J", "194Q", "192", "Other"] as const;
const tdsStatuses = ["Draft", "Verified", "Adjusted", "Payable", "Deposited", "Filed", "Closed", "Mismatch", "Reversed"] as const;

type SourceRecord = {
  id: string;
  type: typeof tdsTypes[number];
  partyId: string;
  partyName: string;
  taxableAmount: number;
  suggestedSection: typeof tdsSections[number];
  suggestedRate: number;
  transactionDate: string;
  period: string;
  paymentId?: string;
  clientId?: string;
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

type BackendPayrollRecord = {
  id: string;
  payroll_number: string;
  hrms_payroll: string | null;
  month: string;
  total_gross: string;
  total_deductions: string;
  net_payable: string;
  status: string;
};

type BackendTdsRecord = {
  id: string;
  tds_number: string;
  client: string | null;
  payment: string | null;
  source_type: typeof tdsTypes[number];
  source_id: string;
  party_id: string;
  party_name: string;
  section: string;
  taxable_amount: string;
  rate: string;
  period: string;
  deduction_date: string | null;
  deposit_due_date: string | null;
  deducted_amount: string;
  challan_no: string;
  challan_date: string | null;
  return_ack_no: string;
  certificate_reference: string;
  certificate_status: CertificateStatus;
  lower_deduction_certificate: string;
  remarks: string;
  status: TdsStatus;
  created_at: string;
  updated_at: string;
};

type BackendTdsPayload = {
  client?: string | null;
  payment?: string | null;
  source_type: typeof tdsTypes[number];
  source_id: string;
  party_id: string;
  party_name: string;
  section: string;
  taxable_amount: string;
  rate: string;
  period: string;
  deduction_date: string;
  deposit_due_date: string;
  deducted_amount: string;
  challan_no: string;
  challan_date: string | null;
  return_ack_no: string;
  certificate_reference: string;
  certificate_status: CertificateStatus;
  lower_deduction_certificate: string;
  remarks: string;
  status: TdsStatus;
};

const tdsSchema = z.object({
  type: z.enum(tdsTypes),
  sourceId: z.string().min(1, "Select a source transaction"),
  section: z.enum(tdsSections),
  customSection: z.string().optional(),
  taxableAmount: z.coerce.number().positive("Taxable amount must be greater than 0"),
  tdsRate: z.coerce.number().min(0).max(100),
  deductionDate: z.string().min(1, "Deduction date required"),
  depositDueDate: z.string().min(1, "Deposit due date required"),
  returnPeriod: z.string().trim().min(2, "Return period required"),
  lowerDeductionCertificate: z.string().optional(),
  remarks: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.section === "Other" && (data.customSection?.trim().length ?? 0) < 2) {
    ctx.addIssue({ code: "custom", path: ["customSection"], message: "Enter the applicable TDS section" });
  }
  if (data.depositDueDate < data.deductionDate) {
    ctx.addIssue({ code: "custom", path: ["depositDueDate"], message: "Deposit due date cannot be before deduction date" });
  }
  if (data.tdsRate <= 0 && !data.lowerDeductionCertificate?.trim()) {
    ctx.addIssue({ code: "custom", path: ["tdsRate"], message: "Rate must be greater than zero unless a valid lower/nil deduction certificate exists" });
  }
});

type TdsFormInput = z.input<typeof tdsSchema>;
type TdsFormData = z.output<typeof tdsSchema>;
type TdsStatus = typeof tdsStatuses[number];
type CertificateStatus = "Not Applicable" | "Pending" | "Received" | "Generated" | "Issued" | "Mismatch";

type TdsRecord = {
  backendId: string;
  id: string;
  type: typeof tdsTypes[number];
  sourceId: string;
  partyId: string;
  partyName: string;
  section: string;
  taxableAmount: number;
  rate: number;
  tdsAmount: number;
  deductionDate: string;
  depositDueDate: string;
  returnPeriod: string;
  challanNo: string;
  challanDate: string;
  returnAckNo: string;
  certificateNo: string;
  certificateStatus: CertificateStatus;
  lowerDeductionCertificate: string;
  status: TdsStatus;
  remarks: string;
};

const defaultFormValues: TdsFormInput = {
  type: "Client TDS Receivable",
  sourceId: "",
  section: "194J",
  customSection: "",
  taxableAmount: 0,
  tdsRate: 10,
  deductionDate: new Date().toISOString().split("T")[0],
  depositDueDate: "2026-08-07",
  returnPeriod: "Q2 FY 2026-27",
  lowerDeductionCertificate: "",
  remarks: "",
};

function calculateTds(amountValue: unknown, rateValue: unknown) {
  const taxableAmount = Number(amountValue) || 0;
  const rate = Number(rateValue) || 0;
  return { taxableAmount, rate, tdsAmount: taxableAmount * rate / 100 };
}

function money(value: number) {
  return `${INR} ${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatDate(value: string) {
  if (!value) return "-";
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

function quarterFor(dateValue: string) {
  const month = Number(dateValue.slice(5, 7));
  const quarter = month <= 6 ? "Q1" : month <= 9 ? "Q2" : month <= 12 ? "Q3" : "Q4";
  return `${quarter} FY 2026-27`;
}

function parseMeta(description: string) {
  const meta = new Map<string, string>();
  description.split(" | ").slice(1).forEach((part) => {
    const index = part.indexOf("=");
    if (index > -1) meta.set(part.slice(0, index), part.slice(index + 1));
  });
  return meta;
}

function sourceRecordsFromBackend(payments: PaymentRecord[], ledger: BackendLedgerRecord[], payroll: BackendPayrollRecord[]): SourceRecord[] {
  const clientSources = payments.filter((payment) => Number(payment.tds_amount) > 0 && payment.status !== "reversed").map((payment) => ({
    id: payment.payment_number,
    type: "Client TDS Receivable" as const,
    partyId: payment.client,
    partyName: `Client ${payment.client}`,
    taxableAmount: Number(payment.amount) + Number(payment.tds_amount),
    suggestedSection: "194J" as const,
    suggestedRate: Number(payment.tds_amount) > 0 ? Number(payment.tds_amount) / Math.max(Number(payment.amount) + Number(payment.tds_amount), 1) * 100 : 10,
    transactionDate: payment.payment_date,
    period: quarterFor(payment.payment_date),
    paymentId: payment.id,
    clientId: payment.client,
  }));
  const vendorSources = ledger.filter((entry) => ["purchase", "expense"].includes(entry.entry_type) && entry.status === "posted").map((entry) => {
    const meta = parseMeta(entry.description);
    const amount = Number(entry.debit) || 0;
    return {
      id: entry.entry_number,
      type: "Vendor TDS Payable" as const,
      partyId: meta.get("party") || entry.entry_number,
      partyName: meta.get("party") || "Ledger Vendor",
      taxableAmount: amount,
      suggestedSection: entry.entry_type === "purchase" ? "194Q" as const : "194J" as const,
      suggestedRate: entry.entry_type === "purchase" ? 0.1 : 2,
      transactionDate: entry.entry_date,
      period: quarterFor(entry.entry_date),
    };
  });
  const salarySources = payroll.filter((row) => Number(row.total_deductions) > 0 && row.status !== "reversed").map((row) => ({
    id: row.payroll_number,
    type: "Employee Salary TDS" as const,
    partyId: row.hrms_payroll || row.payroll_number,
    partyName: `Payroll ${row.payroll_number}`,
    taxableAmount: Number(row.total_gross) || 0,
    suggestedSection: "192" as const,
    suggestedRate: Number(row.total_deductions) / Math.max(Number(row.total_gross), 1) * 100,
    transactionDate: `${row.month}-28`,
    period: row.month,
  }));
  return [...clientSources, ...vendorSources, ...salarySources];
}

function mapTds(row: BackendTdsRecord): TdsRecord {
  return {
    backendId: row.id,
    id: row.tds_number,
    type: row.source_type,
    sourceId: row.source_id,
    partyId: row.party_id,
    partyName: row.party_name,
    section: row.section,
    taxableAmount: Number(row.taxable_amount) || 0,
    rate: Number(row.rate) || 0,
    tdsAmount: Number(row.deducted_amount) || 0,
    deductionDate: row.deduction_date || "",
    depositDueDate: row.deposit_due_date || "",
    returnPeriod: row.period,
    challanNo: row.challan_no,
    challanDate: row.challan_date || "",
    returnAckNo: row.return_ack_no,
    certificateNo: row.certificate_reference,
    certificateStatus: row.certificate_status,
    lowerDeductionCertificate: row.lower_deduction_certificate,
    status: row.status,
    remarks: row.remarks,
  };
}

function buildPayload(data: TdsFormData, source: SourceRecord, status: TdsStatus, patch?: Partial<BackendTdsPayload>): BackendTdsPayload {
  const calculated = calculateTds(data.taxableAmount, data.tdsRate);
  return {
    client: source.clientId || null,
    payment: source.paymentId || null,
    source_type: data.type,
    source_id: source.id,
    party_id: source.partyId,
    party_name: source.partyName,
    section: data.section === "Other" ? data.customSection?.trim() || "Other" : data.section,
    taxable_amount: String(calculated.taxableAmount),
    rate: String(calculated.rate),
    period: data.returnPeriod.trim(),
    deduction_date: data.deductionDate,
    deposit_due_date: data.depositDueDate,
    deducted_amount: String(calculated.tdsAmount),
    challan_no: "",
    challan_date: null,
    return_ack_no: "",
    certificate_reference: "",
    certificate_status: data.type === "Employee Salary TDS" ? "Not Applicable" : "Pending",
    lower_deduction_certificate: data.lowerDeductionCertificate?.trim() || "",
    remarks: data.remarks?.trim() || "",
    status,
    ...patch,
  };
}

export default function Step12TDS() {
  const [tdsRows, setTdsRows] = useState<TdsRecord[]>([]);
  const [sourceRecords, setSourceRecords] = useState<SourceRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [backendMessage, setBackendMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [complianceDialog, setComplianceDialog] = useState<TdsRecord | null>(null);
  const [challanNo, setChallanNo] = useState("");
  const [challanDate, setChallanDate] = useState("");
  const [returnAckNo, setReturnAckNo] = useState("");
  const [certificateNo, setCertificateNo] = useState("");
  const [complianceError, setComplianceError] = useState("");
  const [todayTimestamp] = useState(() => Date.now());

  const {
    register, handleSubmit, control, reset, setValue, setError,
    formState: { errors },
  } = useForm<TdsFormInput, unknown, TdsFormData>({
    resolver: zodResolver(tdsSchema),
    defaultValues: defaultFormValues,
  });

  const loadTds = useCallback(async () => {
    try {
      setBackendMessage("");
      const [tds, payments, ledger, payroll] = await Promise.all([
        listFinanceResource<BackendTdsRecord>("tds-records"),
        listPayments(),
        listFinanceResource<BackendLedgerRecord>("ledger-entries"),
        listFinanceResource<BackendPayrollRecord>("payroll-register"),
      ]);
      setTdsRows(tds.map(mapTds));
      setSourceRecords(sourceRecordsFromBackend(payments, ledger, payroll));
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to load TDS records.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTds();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadTds]);

  const watchedType = useWatch({ control, name: "type" });
  const watchedSection = useWatch({ control, name: "section" });
  const watchedAmount = useWatch({ control, name: "taxableAmount" });
  const watchedRate = useWatch({ control, name: "tdsRate" });
  const totals = useMemo(() => calculateTds(watchedAmount, watchedRate), [watchedAmount, watchedRate]);
  const availableSources = sourceRecords.filter((source) => source.type === watchedType);

  const filteredRows = useMemo(() => tdsRows.filter((row) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || [row.id, row.sourceId, row.partyId, row.partyName, row.section, row.challanNo, row.returnAckNo, row.certificateNo, row.status].join(" ").toLowerCase().includes(query);
    const matchesType = typeFilter === "All" || row.type === typeFilter;
    const matchesStatus = statusFilter === "All" || row.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  }), [searchTerm, statusFilter, tdsRows, typeFilter]);

  const openCreateForm = () => {
    setEditingId(null);
    setSuccessMsg("");
    reset(defaultFormValues);
    setShowForm(true);
  };

  const openEditForm = (row: TdsRecord) => {
    if (!["Draft", "Verified", "Mismatch"].includes(row.status)) return;
    setEditingId(row.backendId);
    setSuccessMsg("");
    reset({
      type: row.type,
      sourceId: row.sourceId,
      section: tdsSections.includes(row.section as typeof tdsSections[number]) ? row.section as typeof tdsSections[number] : "Other",
      customSection: tdsSections.includes(row.section as typeof tdsSections[number]) ? "" : row.section,
      taxableAmount: row.taxableAmount,
      tdsRate: row.rate,
      deductionDate: row.deductionDate,
      depositDueDate: row.depositDueDate,
      returnPeriod: row.returnPeriod,
      lowerDeductionCertificate: row.lowerDeductionCertificate,
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

  const selectType = (type: TdsFormData["type"]) => {
    setValue("type", type, { shouldValidate: true });
    setValue("sourceId", "");
    setValue("taxableAmount", 0);
    setValue("tdsRate", type === "Client TDS Receivable" ? 10 : type === "Employee Salary TDS" ? 0 : 2);
    setValue("section", type === "Employee Salary TDS" ? "192" : "194J");
  };

  const selectSource = (sourceId: string) => {
    setValue("sourceId", sourceId, { shouldValidate: true });
    const source = sourceRecords.find((item) => item.id === sourceId);
    if (!source) return;
    setValue("taxableAmount", source.taxableAmount, { shouldValidate: true });
    setValue("tdsRate", source.suggestedRate, { shouldValidate: true });
    setValue("section", source.suggestedSection, { shouldValidate: true });
    setValue("deductionDate", source.transactionDate, { shouldValidate: true });
    setValue("returnPeriod", source.period, { shouldValidate: true });
    setValue("depositDueDate", `${source.transactionDate.slice(0, 7)}-07`, { shouldValidate: true });
  };

  const persistTds = async (data: TdsFormData, status: TdsStatus) => {
    const source = sourceRecords.find((item) => item.id === data.sourceId);
    if (!source) return;
    if (tdsRows.some((row) => row.backendId !== editingId && row.sourceId === data.sourceId && row.status !== "Reversed")) {
      setError("sourceId", { message: "An active TDS record already exists for this source transaction" });
      return;
    }
    const effectiveStatus: TdsStatus = status === "Verified" ? data.type === "Client TDS Receivable" ? "Adjusted" : "Payable" : status;
    try {
      setBackendMessage("");
      const payload = buildPayload(data, source, effectiveStatus);
      if (editingId) {
        await updateFinanceResource<BackendTdsRecord, BackendTdsPayload>("tds-records", editingId, payload);
      } else {
        await createFinanceResource<BackendTdsRecord, BackendTdsPayload>("tds-records", payload);
      }
      await loadTds();
      setSuccessMsg(effectiveStatus === "Draft" ? "TDS draft saved" : "TDS record verified");
      setTimeout(closeForm, 900);
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to save TDS record.");
    }
  };

  const saveDraft = handleSubmit((data) => persistTds(data, "Draft"));
  const verifyTds = handleSubmit((data) => persistTds(data, "Verified"));

  const updateStatus = async (row: TdsRecord, status: TdsStatus, patch?: Partial<BackendTdsPayload>) => {
    try {
      setBackendMessage("");
      await updateFinanceResource<BackendTdsRecord, BackendTdsPayload>("tds-records", row.backendId, { status, ...patch });
      await loadTds();
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to update TDS record.");
    }
  };

  const openCompliance = (row: TdsRecord) => {
    setComplianceDialog(row);
    setChallanNo(row.challanNo);
    setChallanDate(row.challanDate);
    setReturnAckNo(row.returnAckNo);
    setCertificateNo(row.certificateNo);
    setComplianceError("");
  };

  const saveCompliance = async () => {
    if (!complianceDialog) return;
    if (complianceDialog.type !== "Client TDS Receivable" && (challanNo.trim().length < 3 || !challanDate)) {
      setComplianceError("Challan number and deposit date are required for payable TDS");
      return;
    }
    const hasDeposit = complianceDialog.type === "Client TDS Receivable" || (challanNo.trim() && challanDate);
    const hasReturn = returnAckNo.trim().length >= 3;
    const status: TdsStatus = hasReturn ? "Filed" : hasDeposit && complianceDialog.type !== "Client TDS Receivable" ? "Deposited" : complianceDialog.status;
    await updateStatus(complianceDialog, status, {
      challan_no: challanNo.trim(),
      challan_date: challanDate || null,
      return_ack_no: returnAckNo.trim(),
      certificate_reference: certificateNo.trim(),
      certificate_status: certificateNo.trim() ? complianceDialog.type === "Client TDS Receivable" ? "Received" : "Generated" : complianceDialog.certificateStatus,
    });
    setComplianceDialog(null);
  };

  const closeRecord = async (row: TdsRecord) => {
    const certificateComplete = row.certificateStatus === "Not Applicable" || ["Received", "Generated", "Issued"].includes(row.certificateStatus);
    const returnComplete = row.type === "Client TDS Receivable" || Boolean(row.returnAckNo);
    if (!certificateComplete || !returnComplete) return;
    await updateStatus(row, "Closed");
  };

  const exportTds = () => {
    const rows = [
      ["TDS ID", "Type", "Source", "Party ID", "Party", "Section", "Taxable Amount", "Rate", "TDS Amount", "Deduction Date", "Deposit Due Date", "Return Period", "Challan", "Challan Date", "Return Ack", "Certificate", "Certificate Status", "Status"],
      ...filteredRows.map((row) => [row.id, row.type, row.sourceId, row.partyId, row.partyName, row.section, row.taxableAmount, row.rate, row.tdsAmount, row.deductionDate, row.depositDueDate, row.returnPeriod, row.challanNo, row.challanDate, row.returnAckNo, row.certificateNo, row.certificateStatus, row.status]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadFile("tds-register.csv", csv, "text/csv;charset=utf-8");
  };

  const downloadCertificate = (row: TdsRecord) => {
    const content = [`TDS Record: ${row.id}`, `Type: ${row.type}`, `Source: ${row.sourceId}`, `Party: ${row.partyName} (${row.partyId})`, `Section: ${row.section}`, `Taxable Amount: ${money(row.taxableAmount)}`, `Rate: ${row.rate}%`, `TDS Amount: ${money(row.tdsAmount)}`, `Deduction Date: ${formatDate(row.deductionDate)}`, `Challan: ${row.challanNo || "Not recorded"}`, `Return Acknowledgement: ${row.returnAckNo || "Not recorded"}`, `Certificate: ${row.certificateNo || row.certificateStatus}`, `Status: ${row.status}`].join("\n");
    downloadFile(`${row.id}.txt`, content, "text/plain;charset=utf-8");
  };

  const activeRows = tdsRows.filter((row) => row.status !== "Reversed");
  const clientTds = activeRows.filter((row) => row.type === "Client TDS Receivable").reduce((sum, row) => sum + row.tdsAmount, 0);
  const payableTds = activeRows.filter((row) => row.type !== "Client TDS Receivable" && !["Deposited", "Filed", "Closed"].includes(row.status)).reduce((sum, row) => sum + row.tdsAmount, 0);
  const salaryTds = activeRows.filter((row) => row.type === "Employee Salary TDS").reduce((sum, row) => sum + row.tdsAmount, 0);
  const pendingCertificates = activeRows.filter((row) => ["Pending", "Mismatch"].includes(row.certificateStatus)).length;
  const today = new Date(todayTimestamp).toISOString().split("T")[0];
  const overdueDeposits = activeRows.filter((row) => row.type !== "Client TDS Receivable" && row.depositDueDate < today && !["Deposited", "Filed", "Closed"].includes(row.status)).length;

  return (
    <AccountingPage
      title="TDS Compliance"
      description="Reconcile client TDS credits and control vendor or salary TDS deduction, deposit, return, and certificate compliance."
      icon={Calculator}
      badge="Tax deduction"
      actions={<><ActionButton icon={Download} label="Export Register" variant="outline" onClick={exportTds} /><ActionButton icon={Plus} label="Log TDS Entry" variant="accent" onClick={openCreateForm} /></>}
    >
      <WorkflowSteps steps={["Source Transaction", "TDS Verification", "Deposit / Adjustment", "Return Filing", "Certificate & Closure"]} />
      {backendMessage ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{backendMessage}</div> : null}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Client TDS Credit" value={money(clientTds)} helper="Receivable tax credit claims" icon={ReceiptText} tone="amber" />
        <MetricCard label="TDS Payable" value={money(payableTds)} helper={`${overdueDeposits} overdue deposits`} icon={Landmark} tone="blue" />
        <MetricCard label="Salary TDS" value={money(salaryTds)} helper="From payroll register" icon={Wallet} tone="purple" />
        <MetricCard label="Pending Certificates" value={String(pendingCertificates)} helper="Follow-up or generation required" icon={FileCheck2} tone="red" />
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
            <button type="button" onClick={closeForm} className="absolute right-8 top-8 rounded-full p-2 text-slate-400 hover:bg-slate-50"><X size={24} /></button>
            {successMsg ? <div className="space-y-4 py-20 text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 size={48} /></div><h3 className="text-2xl font-black text-primary">{successMsg}</h3></div> : (
              <form onSubmit={verifyTds} className="space-y-8">
                <div className="border-b border-slate-100 pb-6"><h3 className="text-2xl font-black text-primary">{editingId ? "Edit TDS Record" : "Log TDS Transaction"}</h3><p className="mt-1 text-sm font-semibold text-slate-500">Sources come from payments, posted ledger entries, and finance payroll register.</p></div>
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                  <div className="space-y-8 lg:col-span-3">
                    <Panel title="Source Classification" description="Select the originating transaction and statutory section.">
                      <input type="hidden" {...register("type")} />
                      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">{tdsTypes.map((type) => <button key={type} type="button" onClick={() => selectType(type)} className={`min-h-20 rounded-xl border p-4 text-left ${watchedType === type ? "border-primary bg-primary text-white" : "border-border bg-white text-primary"}`}><span className="text-sm font-black">{type}</span></button>)}</div>
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <label className="block space-y-1.5"><span className="text-xs font-black uppercase tracking-widest text-slate-500">Source Transaction <span className="text-red-500">*</span></span><select {...register("sourceId")} onChange={(event) => selectSource(event.target.value)} className={`h-11 w-full rounded-xl border bg-white px-3 text-sm font-semibold text-primary ${errors.sourceId ? "border-red-500" : "border-border"}`}><option value="">Select source...</option>{availableSources.map((source) => <option key={source.id} value={source.id}>{source.id} - {source.partyName}</option>)}</select>{errors.sourceId ? <p className="text-[10px] font-black uppercase text-red-500">{errors.sourceId.message}</p> : null}</label>
                        <Field label="TDS Section" options={[...tdsSections]} required register={register("section")} error={errors.section?.message} />
                        {watchedSection === "Other" ? <Field label="Custom Section" required register={register("customSection")} error={errors.customSection?.message} /> : null}
                        <Field label="Return Period" required register={register("returnPeriod")} error={errors.returnPeriod?.message} />
                      </div>
                    </Panel>
                    <Panel title="Tax Computation" description="Taxable base, applicable rate, deduction date, and deposit deadline.">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Field label="Taxable Amount" type="number" step="0.01" required register={register("taxableAmount")} error={errors.taxableAmount?.message} />
                        <Field label="TDS Rate %" type="number" step="0.001" required register={register("tdsRate")} error={errors.tdsRate?.message} />
                        <Field label="Deduction Date" type="date" required register={register("deductionDate")} error={errors.deductionDate?.message} />
                        <Field label="Deposit Due Date" type="date" required register={register("depositDueDate")} error={errors.depositDueDate?.message} />
                        <Field label="Lower / Nil Deduction Certificate" register={register("lowerDeductionCertificate")} error={errors.lowerDeductionCertificate?.message} />
                        <Field label="Reconciliation Remarks" multiline register={register("remarks")} error={errors.remarks?.message} />
                      </div>
                    </Panel>
                  </div>
                  <div className="space-y-6"><Panel title="TDS Impact" description="Computed tax and finance posting direction."><div className="space-y-5"><div className={`rounded-2xl p-6 text-white ${watchedType === "Client TDS Receivable" ? "bg-amber-500" : "bg-blue-600"}`}><p className="text-[10px] font-black uppercase tracking-widest text-white/70">Calculated TDS</p><p className="mt-2 text-3xl font-black">{money(totals.tdsAmount)}</p><p className="mt-4 text-xs font-semibold text-white/80">{watchedType === "Client TDS Receivable" ? "Reduces invoice receivable and creates tax credit claim." : "Creates statutory payable until challan deposit."}</p></div><ActionButton icon={ShieldCheck} label="Verify TDS" variant="accent" type="submit" /><ActionButton icon={Calculator} label="Save Draft" variant="outline" onClick={saveDraft} /></div></Panel></div>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {complianceDialog ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"><div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"><h3 className="text-xl font-black text-primary">TDS Compliance Update</h3><p className="mt-1 text-sm font-semibold text-slate-500">{complianceDialog.id} | {complianceDialog.partyName}</p><div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">{complianceDialog.type !== "Client TDS Receivable" ? <><Field label="Challan Number" value={challanNo} onChange={(event) => { setChallanNo(event.target.value); setComplianceError(""); }} /><Field label="Challan Deposit Date" type="date" value={challanDate} onChange={(event) => { setChallanDate(event.target.value); setComplianceError(""); }} /></> : null}<Field label="Return Acknowledgement No." value={returnAckNo} onChange={(event) => setReturnAckNo(event.target.value)} /><Field label="Certificate Number" value={certificateNo} onChange={(event) => setCertificateNo(event.target.value)} /></div>{complianceError ? <p className="mt-4 text-xs font-bold text-red-500">{complianceError}</p> : null}<div className="mt-6 flex justify-end gap-3"><ActionButton label="Cancel" variant="outline" onClick={() => setComplianceDialog(null)} /><ActionButton label="Save Compliance" variant="accent" onClick={saveCompliance} /></div></div></div>
      ) : null}

      <Panel title="TDS Compliance Register" description="Source reconciliation, statutory liability, deposit, return, certificate, and closure status.">
        {isLoading ? <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">Loading backend TDS records...</div> : null}
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_230px_180px]"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={15} /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search TDS ID, source, party, challan, certificate..." className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm font-semibold text-primary outline-none" /></div><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary">{["All", ...tdsTypes].map((type) => <option key={type} value={type}>{type}</option>)}</select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary">{["All", ...tdsStatuses].map((status) => <option key={status} value={status}>{status}</option>)}</select></div>
        <DataTable columns={["TDS / Source", "Party / Section", "Tax Computation", "Compliance", "Status", "Actions"]}>
          {filteredRows.map((row) => <tr key={row.backendId} className="text-sm transition-colors hover:bg-slate-50"><td className="px-4 py-4"><p className="font-black text-primary">{row.id}</p><p className="text-xs font-semibold text-slate-500">{row.sourceId}</p></td><td className="px-4 py-4"><p className="font-black text-primary">{row.partyName}</p><p className="text-xs font-semibold text-slate-500">{row.partyId} | Section {row.section}</p></td><td className="px-4 py-4"><p className="font-black text-primary">{money(row.tdsAmount)}</p><p className="text-[11px] font-semibold text-slate-400">{row.rate}% on {money(row.taxableAmount)}</p></td><td className="px-4 py-4"><p className="font-bold text-slate-600">Due {formatDate(row.depositDueDate)}</p><p className="text-[11px] font-semibold text-slate-400">{row.challanNo ? `Challan ${row.challanNo}` : row.certificateStatus}</p></td><td className="px-4 py-4"><StatusBadge tone={row.status === "Closed" || row.status === "Filed" || row.status === "Adjusted" ? "green" : row.status === "Mismatch" || row.status === "Reversed" ? "red" : row.status === "Payable" ? "amber" : "blue"}>{row.status}</StatusBadge><p className="mt-2 text-[10px] font-semibold text-slate-400">{row.type}</p></td><td className="px-4 py-4"><div className="flex flex-wrap gap-2">{["Draft", "Verified", "Mismatch"].includes(row.status) ? <button type="button" onClick={() => openEditForm(row)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="Edit TDS"><Edit3 size={15} /></button> : null}{["Payable", "Adjusted", "Deposited", "Filed", "Mismatch"].includes(row.status) ? <button type="button" onClick={() => openCompliance(row)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-blue-600" title="Update compliance"><Upload size={15} /></button> : null}{row.status === "Filed" || row.status === "Adjusted" ? <button type="button" onClick={() => closeRecord(row)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-green-600" title="Close record"><Check size={15} /></button> : null}<button type="button" onClick={() => downloadCertificate(row)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="Download record"><Download size={15} /></button>{!["Closed", "Reversed"].includes(row.status) ? <button type="button" onClick={() => updateStatus(row, "Mismatch")} className="rounded-lg border border-border p-2 text-slate-500 hover:text-red-600" title="Mark mismatch"><X size={15} /></button> : null}</div></td></tr>)}
          {!isLoading && filteredRows.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-sm font-bold text-slate-400">No backend TDS records found.</td></tr> : null}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}
