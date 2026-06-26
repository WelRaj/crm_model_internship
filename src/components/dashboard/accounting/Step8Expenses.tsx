"use client";

import { useState } from "react";
import LedgerEntryDialog, { type LedgerEntryData } from "./LedgerEntryDialog";
import { useAuth } from "./AccessControlContext";
import { Calculator, Download, IndianRupee, Pencil, Plus, ReceiptText, TrendingDown } from "lucide-react";
import { AccountingPage, ActionButton, MetricCard, Panel } from "./AccountingComponents";

interface LedgerEntry {
  id: string;
  status: "active" | "deleted";
  date: string;
  voucherNo: string;
  partyName: string;
  category: string;
  description: string;
  purchase: string;
  purchaseChecked: boolean;
  sales: string;
  salesChecked: boolean;
  expenses: string;
  expensesChecked: boolean;
  slabPercent: string;
  gstTreatment: "Inclusive" | "Exclusive";
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  deletedBy?: string;
  deletedAt?: string;
}

type UserRole = "Admin" | "Director" | "Finance Manager" | "Accountant" | "HR Manager" | "Sales";
type AuditAction = "created" | "updated" | "deleted";

interface AuditLog {
  id: string;
  entryId: string;
  action: AuditAction;
  actor: string;
  at: string;
  summary: string;
}

type LedgerEntryPayload = LedgerEntry;

interface BackendSyncJob {
  id: string;
  action: AuditAction;
  method: "POST" | "PUT" | "PATCH";
  endpoint: string;
  payload: LedgerEntryPayload;
  queuedAt: string;
}

const permissions: Record<UserRole, { add: boolean; edit: boolean; delete: boolean }> = {
  Admin: { add: true, edit: true, delete: true },
  Director: { add: false, edit: false, delete: false },
  "Finance Manager": { add: true, edit: true, delete: false },
  Accountant: { add: true, edit: true, delete: false },
  "HR Manager": { add: true, edit: false, delete: false },
  Sales: { add: false, edit: false, delete: false },
};

const nowIso = () => new Date().toISOString();
const toLedgerPayload = (entry: LedgerEntry): LedgerEntryPayload => ({ ...entry });
const ledgerEndpoint = (entryId?: string) => `/accounting/ledger-entries${entryId ? `/${entryId}` : ""}`;
const parseNum = (value: string) => parseFloat(value) || 0;
const INR = "\u20b9";
const fmt = (value: number) => INR + value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const createEntry = (id: string, actor: string): LedgerEntry => ({
  id,
  status: "active",
  date: "",
  voucherNo: "",
  partyName: "",
  category: "",
  description: "",
  purchase: "",
  purchaseChecked: false,
  sales: "",
  salesChecked: false,
  expenses: "",
  expensesChecked: false,
  slabPercent: "",
  gstTreatment: "Exclusive",
  createdBy: actor,
  updatedBy: actor,
  createdAt: nowIso(),
  updatedAt: nowIso(),
});

const calcTax = (amount: string, checked: boolean, slabPercent: string, gstTreatment: LedgerEntry["gstTreatment"]) => {
  if (!checked) return 0;
  const value = parseNum(amount);
  const rate = parseNum(slabPercent);
  if (gstTreatment === "Inclusive") return rate > 0 ? (value * rate) / (100 + rate) : 0;
  return (value * rate) / 100;
};

const calcPGST = (row: LedgerEntry) => calcTax(row.purchase, row.purchaseChecked, row.slabPercent, row.gstTreatment);
const calcSGST = (row: LedgerEntry) => calcTax(row.sales, row.salesChecked, row.slabPercent, row.gstTreatment);
const calcTDS = (row: LedgerEntry) => calcTax(row.expenses, row.expensesChecked, row.slabPercent, row.gstTreatment);
const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

let nextId = 6;
const newId = () => String(nextId++);

export default function Step8salepurchaseExpenses() {
  const { role } = useAuth();
  const currentUser = { name: "Rajkumar Rathore", role };
  const can = permissions[role];
  const [entries, setEntries] = useState<LedgerEntry[]>(["1", "2", "3", "4", "5"].map((id) => createEntry(id, currentUser.name)));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [pendingSyncs, setPendingSyncs] = useState<BackendSyncJob[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const logAudit = (entryId: string, action: AuditAction, summary: string) => {
    setAuditLogs((prev) => [{
      id: `${Date.now()}-${entryId}-${action}`,
      entryId,
      action,
      actor: currentUser.name,
      at: nowIso(),
      summary,
    }, ...prev]);
  };

  const queueBackendSync = (action: AuditAction, payload: LedgerEntryPayload) => {
    setPendingSyncs((prev) => [{
      id: `${Date.now()}-${payload.id}-sync`,
      action,
      method: action === "created" ? "POST" : action === "updated" ? "PUT" : "PATCH",
      endpoint: action === "created" ? ledgerEndpoint() : ledgerEndpoint(payload.id),
      payload,
      queuedAt: nowIso(),
    }, ...prev]);
  };

  const softDeleteRow = (id: string) => {
    const row = entries.find((entry) => entry.id === id);
    if (!row) return;
    const at = nowIso();
    const deletedEntry = toLedgerPayload({
      ...row,
      status: "deleted",
      deletedAt: at,
      deletedBy: currentUser.name,
      updatedAt: at,
      updatedBy: currentUser.name,
    });
    setEntries((prev) => prev.map((entry) => entry.id === id ? deletedEntry : entry));
    logAudit(id, "deleted", "Ledger entry soft deleted.");
    queueBackendSync("deleted", deletedEntry);
  };

  const openAddDialog = () => {
    if (!can.add) return;
    setEditingId(null);
    setShowDialog(true);
  };

  const openEditDialog = (id: string) => {
    if (!can.edit) return;
    setEditingId(id);
    setShowDialog(true);
  };

  const saveEntry = (entry: LedgerEntryData) => {
    const at = nowIso();
    if (editingId) {
      const row = entries.find((item) => item.id === editingId);
      if (!row) return;
      const updatedEntry = toLedgerPayload({ ...row, ...entry, updatedAt: at, updatedBy: currentUser.name });
      setEntries((prev) => prev.map((item) => item.id === editingId ? updatedEntry : item));
      logAudit(editingId, "updated", "Ledger entry updated.");
      queueBackendSync("updated", updatedEntry);
      return;
    }

    const id = newId();
    const newEntry = toLedgerPayload({
      ...createEntry(id, currentUser.name),
      ...entry,
      status: "active",
      createdAt: at,
      updatedAt: at,
      createdBy: currentUser.name,
      updatedBy: currentUser.name,
    });
    setEntries((prev) => [...prev, newEntry]);
    logAudit(id, "created", "Ledger entry created.");
    queueBackendSync("created", newEntry);
  };

  const editingEntry = editingId ? entries.find((row) => row.id === editingId) : undefined;
  const visibleEntries = entries.filter((row) => row.status === "active");
  const existingVoucherNos = visibleEntries
    .filter((row) => row.id !== editingId && row.voucherNo.trim())
    .map((row) => row.voucherNo);
  const totals = visibleEntries.reduce((acc, row) => ({
    purchase: acc.purchase + parseNum(row.purchase),
    sales: acc.sales + parseNum(row.sales),
    expenses: acc.expenses + parseNum(row.expenses),
    pgst: acc.pgst + calcPGST(row),
    sgst: acc.sgst + calcSGST(row),
    tds: acc.tds + calcTDS(row),
  }), { purchase: 0, sales: 0, expenses: 0, pgst: 0, sgst: 0, tds: 0 });

  const exportLedger = () => {
    const rows = [
      ["ID", "Date", "Reference", "Party", "Category", "Description", "Purchase", "Sales", "Expenses", "Slab Percent", "GST Basis", "Purchase GST", "Sales GST", "Expense Tax/TDS", "Created By", "Updated By"],
      ...visibleEntries.map((row) => [
        row.id,
        row.date,
        row.voucherNo,
        row.partyName,
        row.category,
        row.description,
        parseNum(row.purchase),
        parseNum(row.sales),
        parseNum(row.expenses),
        parseNum(row.slabPercent),
        row.gstTreatment,
        calcPGST(row),
        calcSGST(row),
        calcTDS(row),
        row.createdBy,
        row.updatedBy,
      ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sales-purchase-expenses-ledger.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AccountingPage
      title="Sales, Purchase & Expenses"
      description="Consolidated financial ledger for enterprise billing, procurement, and operational costs."
      icon={ReceiptText}
      badge="Financial Ledger"
      actions={
        <>
          <ActionButton icon={Download} label="EXPORT LEDGER" variant="outline" onClick={exportLedger} />
          <ActionButton icon={Plus} label="ADD NEW ENTRY" variant="accent" onClick={openAddDialog} />
          {showDialog ? (
            <LedgerEntryDialog
              onClose={() => setShowDialog(false)}
              onSave={saveEntry}
              onDelete={editingId && can.delete ? () => softDeleteRow(editingId) : undefined}
              initialEntry={editingEntry}
              mode={editingEntry ? "edit" : "add"}
              existingVoucherNos={existingVoucherNos}
            />
          ) : null}
        </>
      }
    >
      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        <MetricCard label="Total Sales" value={fmt(totals.sales)} helper="Gross revenue" icon={IndianRupee} tone="green" />
        <MetricCard label="Total Purchases" value={fmt(totals.purchase)} helper="Procurement costs" icon={Calculator} tone="blue" />
        <MetricCard label="Total Expenses" value={fmt(totals.expenses)} helper="Operational burn" icon={TrendingDown} tone="red" />
      </div>

      <Panel title="Ledger Register" description="Detailed line-item transactions.">
        <div className="w-full overflow-x-auto rounded-xl">
          <table cellSpacing={0} cellPadding={0} style={{ width: "100%", minWidth: 1650, borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                {[
                  { label: "#", align: "center", color: "#94a3b8" },
                  { label: "Date", align: "left", color: "#64748b" },
                  { label: "Ref No", align: "left", color: "#64748b" },
                  { label: "Party", align: "left", color: "#64748b" },
                  { label: "Category", align: "left", color: "#64748b" },
                  { label: "Description", align: "left", color: "#64748b" },
                  { label: `Purchase (${INR})`, align: "right", color: "#64748b" },
                  { label: `Sales (${INR})`, align: "right", color: "#64748b" },
                  { label: `Expenses (${INR})`, align: "right", color: "#64748b" },
                  { label: "GST/TDS %", align: "center", color: "#64748b" },
                  { label: "GST Basis", align: "center", color: "#64748b" },
                  { label: `PGST (${INR})`, align: "right", color: "#f59e0b" },
                  { label: `SGST (${INR})`, align: "right", color: "#06b6d4" },
                  { label: `TDS (${INR})`, align: "right", color: "#8b5cf6" },
                  { label: "Actions", align: "center", color: "#94a3b8" },
                ].map((heading) => (
                  <th key={heading.label} style={{ padding: "10px 12px", textAlign: heading.align as "left" | "right" | "center", fontWeight: 600, fontSize: 12, color: heading.color, whiteSpace: "nowrap" }}>
                    {heading.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleEntries.map((row, rowIndex) => {
                const pgst = calcPGST(row);
                const sgst = calcSGST(row);
                const tds = calcTDS(row);
                return (
                  <tr key={row.id} style={{ borderBottom: "1px solid #f8fafc" }} onMouseEnter={(event) => { event.currentTarget.style.background = "#fafbff"; }} onMouseLeave={(event) => { event.currentTarget.style.background = ""; }}>
                    <td style={{ padding: "10px 12px", textAlign: "center", color: "#cbd5e1", fontWeight: 500, width: 36 }}>{rowIndex + 1}</td>
                    <td style={{ padding: "10px 12px", minWidth: 180 }}><span style={{ color: row.date ? "#64748b" : "#cbd5e1" }}>{row.date || "-"}</span></td>
                    <td style={{ padding: "10px 12px", minWidth: 110 }}><span style={{ color: row.voucherNo ? "#64748b" : "#cbd5e1" }}>{row.voucherNo || "-"}</span></td>
                    <td style={{ padding: "10px 12px", minWidth: 140 }}><span style={{ color: row.partyName ? "#64748b" : "#cbd5e1" }}>{row.partyName || "-"}</span></td>
                    <td style={{ padding: "10px 12px", minWidth: 120 }}><span style={{ color: row.category ? "#64748b" : "#cbd5e1" }}>{row.category || "-"}</span></td>
                    <td style={{ padding: "10px 12px", minWidth: 180 }}><span style={{ color: row.description ? "#64748b" : "#cbd5e1" }}>{row.description || "No description"}</span></td>
                    <td style={{ padding: "10px 12px", minWidth: 120 }}><AmountCell value={row.purchase} checked={row.purchaseChecked} color="#f59e0b" /></td>
                    <td style={{ padding: "10px 12px", minWidth: 120 }}><AmountCell value={row.sales} checked={row.salesChecked} color="#06b6d4" /></td>
                    <td style={{ padding: "10px 12px", minWidth: 120 }}><AmountCell value={row.expenses} checked={row.expensesChecked} color="#8b5cf6" /></td>
                    <td style={{ padding: "10px 12px", textAlign: "center", minWidth: 70 }}><span style={{ color: row.slabPercent ? "#94a3b8" : "#cbd5e1" }}>{row.slabPercent ? `${row.slabPercent}%` : "-"}</span></td>
                    <td style={{ padding: "10px 12px", textAlign: "center", minWidth: 105 }}><GstBasisBadge value={row.gstTreatment} /></td>
                    <td style={{ padding: "10px 12px", textAlign: "right", minWidth: 90 }}><TaxValue value={pgst} color="#f59e0b" /></td>
                    <td style={{ padding: "10px 12px", textAlign: "right", minWidth: 90 }}><TaxValue value={sgst} color="#06b6d4" /></td>
                    <td style={{ padding: "10px 12px", textAlign: "right", minWidth: 90 }}><TaxValue value={tds} color="#8b5cf6" /></td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      <button
                        onClick={() => openEditDialog(row.id)}
                        disabled={!can.edit}
                        style={{ background: "transparent", border: "none", cursor: can.edit ? "pointer" : "not-allowed", color: can.edit ? "#2563eb" : "#cbd5e1", padding: 4, borderRadius: 6, display: "inline-flex" }}
                        title="Edit row"
                      >
                        <Pencil size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid #f1f5f9", background: "#fafafa" }}>
                <td colSpan={6} style={{ padding: "12px 12px", fontWeight: 700, color: "#0f172a", fontSize: 13 }}>Total</td>
                <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>{fmt(totals.purchase)}</td>
                <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>{fmt(totals.sales)}</td>
                <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>{fmt(totals.expenses)}</td>
                <td />
                <td />
                <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 700, color: "#f59e0b" }}>{fmt(totals.pgst)}</td>
                <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 700, color: "#06b6d4" }}>{fmt(totals.sgst)}</td>
                <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 700, color: "#8b5cf6" }}>{fmt(totals.tds)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>

      {auditLogs.length ? (
        <Panel title="Audit Trail" description="Recent ledger activity.">
          <div className="space-y-3">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-black text-primary">{log.summary}</p>
                  <p className="text-xs font-semibold text-slate-500">Entry {log.entryId} by {log.actor}</p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{new Date(log.at).toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      {pendingSyncs.length ? (
        <Panel title="Backend Sync Queue" description="Prepared API mutations for persistence.">
          <div className="overflow-x-auto">
            <table cellSpacing={0} cellPadding={0} style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                  {["Action", "Method", "Endpoint", "Queued"].map((label) => (
                    <th key={label} style={{ padding: "10px 12px", textAlign: "left", color: "#64748b", fontSize: 12, fontWeight: 700 }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingSyncs.slice(0, 3).map((job) => (
                  <tr key={job.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "10px 12px", color: "#0f172a", fontWeight: 700 }}>{job.action}</td>
                    <td style={{ padding: "10px 12px", color: "#64748b" }}>{job.method}</td>
                    <td style={{ padding: "10px 12px", color: "#64748b" }}>{job.endpoint}</td>
                    <td style={{ padding: "10px 12px", color: "#94a3b8" }}>{new Date(job.queuedAt).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}
    </AccountingPage>
  );
}

function AmountCell({ value, checked, color }: { value: string; checked: boolean; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
      <span style={{ color: "#64748b" }}>{fmt(parseNum(value))}</span>
      <input type="checkbox" checked={checked} readOnly disabled style={{ accentColor: color, width: 14, height: 14 }} />
    </div>
  );
}

function GstBasisBadge({ value }: { value: LedgerEntry["gstTreatment"] }) {
  return (
    <span style={{
      display: "inline-flex",
      borderRadius: 999,
      padding: "4px 9px",
      fontSize: 10,
      fontWeight: 700,
      color: value === "Inclusive" ? "#047857" : "#1d4ed8",
      background: value === "Inclusive" ? "#ecfdf5" : "#eff6ff",
    }}>
      {value}
    </span>
  );
}

function TaxValue({ value, color }: { value: number; color: string }) {
  return <span style={{ color, fontWeight: 700 }}>{fmt(value)}</span>;
}
