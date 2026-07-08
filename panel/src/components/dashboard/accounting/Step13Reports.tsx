"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  BarChart3, CheckCircle2, Download, FileSpreadsheet, FileText, Filter,
  LineChart, Play, Search, TrendingDown, TrendingUp, Wallet,
} from "lucide-react";
import {
  AccountingPage, ActionButton, DataTable, Field,
  MetricCard, Panel, ProgressBar, StatusBadge, WorkflowSteps,
} from "./AccountingComponents";

const INR = "\u20b9";
const reportTypes = ["Income & Collections", "Expense Register", "Profit & Loss", "Cash Flow", "Client Outstanding", "Aging Analysis", "Budget Utilization", "GST Summary", "TDS Register", "Payroll Cost"] as const;
const periods = ["Jun 2026", "Q1 FY 2026-27", "FY 2026-27"] as const;
const departments = ["All Departments", "Engineering", "Marketing", "Cloud Ops", "HR & Admin", "Finance"] as const;

type FinanceTransaction = {
  id: string;
  date: string;
  period: string;
  module: "Invoice" | "Payment" | "Expense" | "Payroll" | "GST" | "TDS" | "Budget";
  department: string;
  party: string;
  category: string;
  inflow: number;
  outflow: number;
  outstanding: number;
  dueDate: string;
  status: string;
};

const transactions: FinanceTransaction[] = [
  { id: "INV-2026-088", date: "2026-06-06", period: "Jun 2026", module: "Invoice", department: "Engineering", party: "Nexa Retail Cloud", category: "Service Revenue", inflow: 1275000, outflow: 0, outstanding: 775000, dueDate: "2026-06-21", status: "Sent" },
  { id: "INV-2026-086", date: "2026-06-01", period: "Jun 2026", module: "Invoice", department: "Cloud Ops", party: "Bluebird Logistics", category: "Service Revenue", inflow: 324600, outflow: 0, outstanding: 204600, dueDate: "2026-06-30", status: "Sent" },
  { id: "PAY-2026-101", date: "2026-06-11", period: "Jun 2026", module: "Payment", department: "Engineering", party: "Nexa Retail Cloud", category: "Collection", inflow: 472000, outflow: 0, outstanding: 0, dueDate: "", status: "Reconciled" },
  { id: "PAY-2026-102", date: "2026-06-05", period: "Jun 2026", module: "Payment", department: "Cloud Ops", party: "Bluebird Logistics", category: "Collection", inflow: 120000, outflow: 0, outstanding: 0, dueDate: "", status: "Verified" },
  { id: "EXP-AWS-0626", date: "2026-06-18", period: "Jun 2026", module: "Expense", department: "Cloud Ops", party: "Amazon Web Services India", category: "Cloud & Software", inflow: 0, outflow: 289100, outstanding: 0, dueDate: "", status: "Approved" },
  { id: "EXP-MKT-0626", date: "2026-06-15", period: "Jun 2026", module: "Expense", department: "Marketing", party: "Ad Network India", category: "Marketing Spend", inflow: 0, outflow: 420000, outstanding: 0, dueDate: "", status: "Approved" },
  { id: "EXP-HR-0626", date: "2026-06-12", period: "Jun 2026", module: "Expense", department: "HR & Admin", party: "Office Services", category: "Operating Expenses", inflow: 0, outflow: 95000, outstanding: 0, dueDate: "", status: "Approved" },
  { id: "SAL-2026-JUN", date: "2026-06-30", period: "Jun 2026", module: "Payroll", department: "HR & Admin", party: "Employees", category: "Payroll", inflow: 0, outflow: 244138.47, outstanding: 0, dueDate: "", status: "Approved" },
  { id: "GST-2026-006", date: "2026-06-30", period: "Jun 2026", module: "GST", department: "Finance", party: "GST Department", category: "GST Liability", inflow: 0, outflow: 181011.25, outstanding: 0, dueDate: "2026-07-20", status: "Working" },
  { id: "TDS-2026-JUN", date: "2026-06-30", period: "Jun 2026", module: "TDS", department: "Finance", party: "Income Tax Department", category: "TDS Payable", inflow: 0, outflow: 16700, outstanding: 0, dueDate: "2026-07-07", status: "Payable" },
];

const budgetRows = [
  { id: "BUD-2026-001", department: "Engineering", category: "Payroll", approved: 4500000, actual: 1240000, committed: 320000 },
  { id: "BUD-2026-002", department: "Marketing", category: "Marketing Spend", approved: 1900000, actual: 1490000, committed: 120000 },
  { id: "BUD-2026-003", department: "Cloud Ops", category: "Cloud & Software", approved: 3150000, actual: 2670000, committed: 210000 },
  { id: "BUD-2026-004", department: "HR & Admin", category: "Operating Expenses", approved: 1300000, actual: 410000, committed: 90000 },
];

const filterSchema = z.object({
  reportType: z.enum(reportTypes),
  period: z.enum(periods),
  department: z.enum(departments),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.fromDate && data.toDate && data.toDate < data.fromDate) {
    ctx.addIssue({ code: "custom", path: ["toDate"], message: "End date cannot be before start date" });
  }
});

type FilterFormInput = z.input<typeof filterSchema>;
type FilterFormData = z.output<typeof filterSchema>;

type ReportRun = {
  id: string;
  reportType: typeof reportTypes[number];
  period: string;
  department: string;
  generatedBy: string;
  generatedAt: string;
  rowCount: number;
  total: number;
  columns: string[];
  rows: Array<Array<string | number>>;
  status: "Ready";
};

const defaultFormValues: FilterFormInput = {
  reportType: "Profit & Loss",
  period: "Jun 2026",
  department: "All Departments",
  fromDate: "",
  toDate: "",
};

function money(value: number) {
  return `${INR} ${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
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

function toCsv(columns: string[], rows: Array<Array<string | number>>) {
  return [columns, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
}

function buildReport(data: FilterFormData) {
  const scopedTransactions = transactions.filter((row) => {
    const periodMatch = data.period === "Jun 2026" ? row.period === "Jun 2026" : true;
    const departmentMatch = data.department === "All Departments" || row.department === data.department;
    const fromMatch = !data.fromDate || row.date >= data.fromDate;
    const toMatch = !data.toDate || row.date <= data.toDate;
    return periodMatch && departmentMatch && fromMatch && toMatch;
  });

  if (data.reportType === "Budget Utilization") {
    const rows = budgetRows
      .filter((row) => data.department === "All Departments" || row.department === data.department)
      .map((row) => [row.id, row.department, row.category, row.approved, row.actual, row.committed, row.approved - row.actual - row.committed, (row.actual + row.committed) / row.approved * 100]);
    return { columns: ["Budget", "Department", "Category", "Approved", "Actual", "Committed", "Available", "Utilization %"], rows, total: rows.reduce((sum, row) => sum + Number(row[3]), 0) };
  }

  const moduleMap: Partial<Record<typeof reportTypes[number], FinanceTransaction["module"][]>> = {
    "Income & Collections": ["Invoice", "Payment"],
    "Expense Register": ["Expense"],
    "Payroll Cost": ["Payroll"],
    "GST Summary": ["GST"],
    "TDS Register": ["TDS"],
  };
  let selected = moduleMap[data.reportType]
    ? scopedTransactions.filter((row) => moduleMap[data.reportType]?.includes(row.module))
    : scopedTransactions;

  if (["Client Outstanding", "Aging Analysis"].includes(data.reportType)) {
    selected = scopedTransactions.filter((row) => row.module === "Invoice" && row.outstanding > 0);
  }

  if (data.reportType === "Profit & Loss" || data.reportType === "Cash Flow") {
    const rows = selected.map((row) => [row.id, row.date, row.department, row.party, row.category, row.inflow, row.outflow, row.inflow - row.outflow, row.status]);
    return { columns: ["Reference", "Date", "Department", "Party", "Category", "Inflow", "Outflow", "Net", "Status"], rows, total: rows.reduce((sum, row) => sum + Number(row[7]), 0) };
  }

  const rows = selected.map((row) => [row.id, row.date, row.department, row.party, row.category, row.inflow, row.outflow, row.outstanding, row.dueDate, row.status]);
  const total = data.reportType.includes("Expense") || data.reportType.includes("Payroll") || data.reportType.includes("GST") || data.reportType.includes("TDS")
    ? rows.reduce((sum, row) => sum + Number(row[6]), 0)
    : data.reportType.includes("Outstanding") || data.reportType === "Aging Analysis"
      ? rows.reduce((sum, row) => sum + Number(row[7]), 0)
      : rows.reduce((sum, row) => sum + Number(row[5]), 0);
  return { columns: ["Reference", "Date", "Department", "Party", "Category", "Inflow", "Outflow", "Outstanding", "Due Date", "Status"], rows, total };
}

export default function Step13Reports() {
  const [reports, setReports] = useState<ReportRun[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [activeReport, setActiveReport] = useState<ReportRun | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [reportSequence, setReportSequence] = useState(1);

  const {
    register, handleSubmit, control,
    formState: { errors },
  } = useForm<FilterFormInput, unknown, FilterFormData>({
    resolver: zodResolver(filterSchema),
    defaultValues: defaultFormValues,
  });

  const watchedType = useWatch({ control, name: "reportType" });
  const currentMonth = transactions.filter((row) => row.period === "Jun 2026");
  const invoiceValue = currentMonth.filter((row) => row.module === "Invoice").reduce((sum, row) => sum + row.inflow, 0);
  const collections = currentMonth.filter((row) => row.module === "Payment").reduce((sum, row) => sum + row.inflow, 0);
  const operatingOutflow = currentMonth.filter((row) => ["Expense", "Payroll", "GST", "TDS"].includes(row.module)).reduce((sum, row) => sum + row.outflow, 0);
  const outstanding = currentMonth.filter((row) => row.module === "Invoice").reduce((sum, row) => sum + row.outstanding, 0);
  const netCashFlow = collections - operatingOutflow;

  const aging = useMemo(() => {
    const asOf = new Date("2026-06-25T00:00:00").getTime();
    const buckets = [
      { label: "Not Due / 0-30", min: -Infinity, max: 30, amount: 0, tone: "green" as const },
      { label: "31-60 Days", min: 31, max: 60, amount: 0, tone: "blue" as const },
      { label: "61-90 Days", min: 61, max: 90, amount: 0, tone: "amber" as const },
      { label: "90+ Days", min: 91, max: Infinity, amount: 0, tone: "red" as const },
    ];
    transactions.filter((row) => row.module === "Invoice" && row.outstanding > 0).forEach((row) => {
      const days = Math.floor((asOf - new Date(`${row.dueDate}T00:00:00`).getTime()) / 86400000);
      const bucket = buckets.find((item) => days >= item.min && days <= item.max);
      if (bucket) bucket.amount += row.outstanding;
    });
    return buckets;
  }, []);

  const generateReport = (data: FilterFormData) => {
    const built = buildReport(data);
    const now = new Date().toISOString();
    const reportId = `REP-2026-${String(reportSequence).padStart(3, "0")}`;
    const report: ReportRun = {
      id: reportId,
      reportType: data.reportType,
      period: data.period,
      department: data.department,
      generatedBy: "Rajkumar Rathore",
      generatedAt: now,
      rowCount: built.rows.length,
      total: built.total,
      columns: built.columns,
      rows: built.rows,
      status: "Ready",
    };
    setReports((current) => [report, ...current]);
    setActiveReport(report);
    setReportSequence((current) => current + 1);
    setShowFilters(false);
  };

  const runPreset = (reportType: typeof reportTypes[number]) => {
    generateReport({ ...defaultFormValues, reportType });
  };

  const downloadReport = (report: ReportRun) => {
    downloadFile(`${report.reportType.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`, toCsv(report.columns, report.rows), "text/csv;charset=utf-8");
  };

  const exportExecutivePack = () => {
    const columns = ["Metric", "Value"];
    const rows: Array<Array<string | number>> = [
      ["Invoice Value", invoiceValue],
      ["Collections", collections],
      ["Operating Outflow", operatingOutflow],
      ["Net Cash Flow", netCashFlow],
      ["Outstanding", outstanding],
      ...aging.map((bucket) => [`Aging ${bucket.label}`, bucket.amount]),
    ];
    downloadFile("accounting-executive-pack.csv", toCsv(columns, rows), "text/csv;charset=utf-8");
  };

  const filteredReports = reports.filter((report) => !searchTerm.trim() || [report.reportType, report.period, report.department, report.generatedBy].join(" ").toLowerCase().includes(searchTerm.toLowerCase()));
  const totalAging = aging.reduce((sum, bucket) => sum + bucket.amount, 0);
  const collectionHealth = invoiceValue ? collections / invoiceValue * 100 : 0;

  return (
    <AccountingPage
      title="Reports & Analytics"
      description="Generate traceable finance reports from invoice, collection, expense, payroll, budget, GST, TDS, and receivable data."
      icon={LineChart}
      badge="Decision support"
      actions={
        <>
          <ActionButton icon={Filter} label={showFilters ? "Close Builder" : "Custom Report"} variant="outline" onClick={() => setShowFilters((value) => !value)} />
          <ActionButton icon={Download} label="Executive Pack" variant="accent" onClick={exportExecutivePack} />
        </>
      }
    >
      <WorkflowSteps steps={["Select Scope", "Aggregate Sources", "Validate Totals", "Generate Snapshot", "Export & Audit"]} />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="June Invoice Value" value={money(invoiceValue)} helper="Approved and sent invoices" icon={TrendingUp} tone="green" />
        <MetricCard label="Operating Outflow" value={money(operatingOutflow)} helper="Expenses, payroll and taxes" icon={TrendingDown} tone="red" />
        <MetricCard label="Net Cash Flow" value={money(netCashFlow)} helper={`${money(collections)} collected`} icon={Wallet} tone={netCashFlow >= 0 ? "blue" : "red"} />
        <MetricCard label="Outstanding" value={money(outstanding)} helper={`${collectionHealth.toFixed(1)}% collection ratio`} icon={BarChart3} tone="amber" />
      </div>

      {showFilters ? (
        <Panel title="Custom Report Builder" description="Select report scope and generate a point-in-time data snapshot.">
          <form onSubmit={handleSubmit(generateReport)} className="grid grid-cols-1 items-end gap-6 md:grid-cols-3">
            <Field label="Report Type" options={[...reportTypes]} required register={register("reportType")} error={errors.reportType?.message} />
            <Field label="Analysis Period" options={[...periods]} required register={register("period")} error={errors.period?.message} />
            <Field label="Department Scope" options={[...departments]} required register={register("department")} error={errors.department?.message} />
            <Field label="From Date (Optional)" type="date" register={register("fromDate")} error={errors.fromDate?.message} />
            <Field label="To Date (Optional)" type="date" register={register("toDate")} error={errors.toDate?.message} />
            <ActionButton icon={Play} label={`Generate ${watchedType}`} variant="accent" type="submit" />
          </form>
        </Panel>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Report Library" description="Operational and compliance reports generated from current model snapshots.">
          <div className="max-h-[430px] space-y-2 overflow-y-auto pr-2">
            {reportTypes.map((name) => (
              <button key={name} type="button" onClick={() => runPreset(name)} className="flex w-full items-center justify-between rounded-xl border border-border bg-slate-50 p-4 text-left transition-colors hover:border-primary hover:bg-white">
                <span className="flex items-center gap-3"><FileText size={16} className="text-slate-400" /><span className="text-xs font-black text-primary">{name}</span></span>
                <Play size={14} className="text-slate-300" />
              </button>
            ))}
          </div>
        </Panel>

        <div className="space-y-6 xl:col-span-2">
          <Panel title="Outstanding Aging" description="Receivable exposure grouped by days past due as of 25 Jun 2026.">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-5">
                {aging.map((bucket) => (
                  <div key={bucket.label} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500"><span>{bucket.label}</span><span className="text-primary">{money(bucket.amount)}</span></div>
                    <ProgressBar value={totalAging ? bucket.amount / totalAging * 100 : 0} tone={bucket.tone} />
                  </div>
                ))}
              </div>
              <div className="flex flex-col justify-center rounded-2xl bg-slate-900 p-6 text-white">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Collection Ratio</p>
                <p className="mt-2 text-4xl font-black">{collectionHealth.toFixed(1)}%</p>
                <p className="mt-4 text-xs font-semibold leading-5 text-white/70">Collections divided by invoice value for the selected operating month.</p>
                <ActionButton label="Generate Aging Report" variant="outline" onClick={() => runPreset("Aging Analysis")} />
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {activeReport ? (
        <Panel
          title={`${activeReport.reportType} Preview`}
          description={`${activeReport.period} | ${activeReport.department} | ${activeReport.rowCount} rows`}
          actions={<ActionButton icon={Download} label="Download CSV" variant="outline" onClick={() => downloadReport(activeReport)} />}
        >
          <DataTable columns={activeReport.columns}>
            {activeReport.rows.map((row, rowIndex) => (
              <tr key={`${activeReport.id}-${rowIndex}`} className="text-sm hover:bg-slate-50">
                {row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`} className="px-4 py-4 font-semibold text-slate-600">{typeof cell === "number" ? cell.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : cell}</td>)}
              </tr>
            ))}
          </DataTable>
          <div className="mt-4 text-right text-sm font-black text-primary">Report Total: {money(activeReport.total)}</div>
        </Panel>
      ) : null}

      <Panel title="Report Run History" description="Generated snapshots remain downloadable with their original scope and row count.">
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search report type, period, department, owner..." className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm font-semibold text-primary outline-none" />
        </div>
        <DataTable columns={["Report", "Scope", "Generated By", "Generated At", "Rows / Total", "Status", "Actions"]}>
          {filteredReports.map((report) => (
            <tr key={report.id} className="text-sm hover:bg-slate-50">
              <td className="px-4 py-4"><div className="flex items-center gap-3"><FileSpreadsheet size={16} className="text-slate-400" /><div><p className="font-black text-primary">{report.reportType}</p><p className="text-xs text-slate-400">{report.id}</p></div></div></td>
              <td className="px-4 py-4 font-semibold text-slate-600">{report.period} | {report.department}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{report.generatedBy}</td>
              <td className="px-4 py-4 text-xs font-semibold text-slate-500">{new Date(report.generatedAt).toLocaleString("en-IN")}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{report.rowCount} rows | {money(report.total)}</td>
              <td className="px-4 py-4"><StatusBadge tone="green"><CheckCircle2 size={12} /> {report.status}</StatusBadge></td>
              <td className="px-4 py-4"><div className="flex gap-2"><button type="button" onClick={() => setActiveReport(report)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="View report"><FileText size={15} /></button><button type="button" onClick={() => downloadReport(report)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="Download CSV"><Download size={15} /></button></div></td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}
