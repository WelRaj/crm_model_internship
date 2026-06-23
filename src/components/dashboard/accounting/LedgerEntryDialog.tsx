import React, { useState } from "react";
import { Plus, Save, Trash2, X } from "lucide-react";
import { ActionButton } from "./AccountingComponents";

export interface LedgerEntryData {
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
}

interface LedgerEntryDialogProps {
  onClose: () => void;
  onSave: (entry: LedgerEntryData) => void;
  onDelete?: () => void;
  initialEntry?: LedgerEntryData;
  mode?: "add" | "edit";
}

const INR = "\u20b9";
const today = () => new Date().toISOString().slice(0, 10);
const parseNum = (v: string) => parseFloat(v) || 0;
const onlyNums = (v: string) => v.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
const fmt = (n: number) => INR + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function LedgerEntryDialog({ onClose, onSave, onDelete, initialEntry, mode = "add" }: LedgerEntryDialogProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [entry, setEntry] = useState<LedgerEntryData>(initialEntry ?? {
    date: today(),
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
  });

  const update = (patch: Partial<LedgerEntryData>) => {
    setErrors([]);
    setEntry(prev => ({ ...prev, ...patch }));
  };
  const pgst = entry.purchaseChecked ? (parseNum(entry.purchase) * parseNum(entry.slabPercent)) / 100 : 0;
  const sgst = entry.salesChecked ? (parseNum(entry.sales) * parseNum(entry.slabPercent)) / 100 : 0;
  const tds = entry.expensesChecked ? (parseNum(entry.expenses) * parseNum(entry.slabPercent)) / 100 : 0;

  const base: React.CSSProperties = {
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: 13,
    color: "#1e293b",
    width: "100%",
    padding: 0,
  };
  const num: React.CSSProperties = { ...base, textAlign: "right" };

  const validate = () => {
    const nextErrors: string[] = [];
    const purchase = parseNum(entry.purchase);
    const sales = parseNum(entry.sales);
    const expenses = parseNum(entry.expenses);
    const slab = parseNum(entry.slabPercent);

    if (!entry.description.trim()) nextErrors.push("Description is required.");
    if (purchase + sales + expenses <= 0) nextErrors.push("Enter at least one purchase, sales, or expense amount.");
    if (purchase < 0 || sales < 0 || expenses < 0) nextErrors.push("Amount cannot be negative.");
    if (slab < 0 || slab > 100) nextErrors.push("Slab percent must be between 0 and 100.");

    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(entry);
    onClose();
  };

  const handleDelete = () => {
    onDelete?.();
    onClose();
  };

  const requestDelete = () => setConfirmingDelete(true);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="relative w-full max-w-7xl rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-50"
        >
          <X size={20} />
        </button>

        <div className="mb-5">
          <h3 className="text-lg font-black text-primary">{mode === "edit" ? "Edit Ledger Entry" : "Add Ledger Entry"}</h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Detailed line-item transactions.</p>
        </div>

        {errors.length ? (
          <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            {errors.map(error => (
              <p key={error} className="text-xs font-bold leading-5 text-red-600">{error}</p>
            ))}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table cellSpacing={0} cellPadding={0} style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
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
                  { label: "Slab %", align: "center", color: "#64748b" },
                  { label: `PGST (${INR})`, align: "right", color: "#f59e0b" },
                  { label: `SGST (${INR})`, align: "right", color: "#06b6d4" },
                  { label: `TDS (${INR})`, align: "right", color: "#8b5cf6" },
                  { label: "Actions", align: "center", color: "#94a3b8" },
                ].map(h => (
                  <th
                    key={h.label}
                    style={{
                      padding: "10px 12px",
                      textAlign: h.align as "left" | "right" | "center",
                      fontWeight: 600,
                      fontSize: 12,
                      color: h.color,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <tr style={{ borderBottom: "1px solid #f8fafc" }}>
                <td style={{ padding: "10px 12px", textAlign: "center", color: "#cbd5e1", fontWeight: 500, width: 36 }}>1</td>
                <td style={{ padding: "10px 12px", minWidth: 125 }}>
                  <input
                    type="date"
                    style={{ ...base, color: "#64748b" }}
                    value={entry.date}
                    onChange={e => update({ date: e.target.value })}
                  />
                </td>
                <td style={{ padding: "10px 12px", minWidth: 115 }}>
                  <input
                    style={{ ...base, color: "#64748b" }}
                    placeholder="REF-001"
                    value={entry.voucherNo}
                    onChange={e => update({ voucherNo: e.target.value })}
                  />
                </td>
                <td style={{ padding: "10px 12px", minWidth: 150 }}>
                  <input
                    style={{ ...base, color: "#64748b" }}
                    placeholder="Client/Vendor"
                    value={entry.partyName}
                    onChange={e => update({ partyName: e.target.value })}
                  />
                </td>
                <td style={{ padding: "10px 12px", minWidth: 130 }}>
                  <select
                    style={{ ...base, color: entry.category ? "#64748b" : "#cbd5e1" }}
                    value={entry.category}
                    onChange={e => update({ category: e.target.value })}
                  >
                    <option value="">Select...</option>
                    <option value="Sales">Sales</option>
                    <option value="Purchase">Purchase</option>
                    <option value="Expense">Expense</option>
                    <option value="Tax">Tax</option>
                    <option value="Adjustment">Adjustment</option>
                  </select>
                </td>
                <td style={{ padding: "10px 12px", minWidth: 180 }}>
                  <input
                    autoFocus
                    style={{ ...base, color: "#64748b" }}
                    placeholder="Enter desc..."
                    value={entry.description}
                    onChange={e => update({ description: e.target.value })}
                  />
                </td>
                <td style={{ padding: "10px 12px", minWidth: 120 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                    <input
                      style={{ ...num, maxWidth: 80 }}
                      placeholder="0.00"
                      value={entry.purchase}
                      onChange={e => update({ purchase: onlyNums(e.target.value) })}
                    />
                    <input
                      type="checkbox"
                      checked={entry.purchaseChecked}
                      onChange={e => update({ purchaseChecked: e.target.checked })}
                      style={{ cursor: "pointer", accentColor: "#f59e0b", width: 14, height: 14 }}
                    />
                  </div>
                </td>
                <td style={{ padding: "10px 12px", minWidth: 120 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                    <input
                      style={{ ...num, maxWidth: 80 }}
                      placeholder="0.00"
                      value={entry.sales}
                      onChange={e => update({ sales: onlyNums(e.target.value) })}
                    />
                    <input
                      type="checkbox"
                      checked={entry.salesChecked}
                      onChange={e => update({ salesChecked: e.target.checked })}
                      style={{ cursor: "pointer", accentColor: "#06b6d4", width: 14, height: 14 }}
                    />
                  </div>
                </td>
                <td style={{ padding: "10px 12px", minWidth: 120 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                    <input
                      style={{ ...num, maxWidth: 80 }}
                      placeholder="0.00"
                      value={entry.expenses}
                      onChange={e => update({ expenses: onlyNums(e.target.value) })}
                    />
                    <input
                      type="checkbox"
                      checked={entry.expensesChecked}
                      onChange={e => update({ expensesChecked: e.target.checked })}
                      style={{ cursor: "pointer", accentColor: "#8b5cf6", width: 14, height: 14 }}
                    />
                  </div>
                </td>
                <td style={{ padding: "10px 12px", textAlign: "center", minWidth: 70 }}>
                  <input
                    style={{ ...base, textAlign: "center", color: "#94a3b8", maxWidth: 60 }}
                    placeholder="%"
                    value={entry.slabPercent}
                    onChange={e => update({ slabPercent: onlyNums(e.target.value) })}
                  />
                </td>
                <td style={{ padding: "10px 12px", textAlign: "right", minWidth: 90, color: "#f59e0b", fontWeight: 700 }}>
                  {entry.purchaseChecked ? fmt(pgst) : fmt(0)}
                </td>
                <td style={{ padding: "10px 12px", textAlign: "right", minWidth: 90, color: "#06b6d4", fontWeight: 700 }}>
                  {entry.salesChecked ? fmt(sgst) : fmt(0)}
                </td>
                <td style={{ padding: "10px 12px", textAlign: "right", minWidth: 90, color: "#8b5cf6", fontWeight: 700 }}>
                  {entry.expensesChecked ? fmt(tds) : fmt(0)}
                </td>
                <td style={{ padding: "10px 12px", textAlign: "center" }}>
                  {mode === "edit" && onDelete ? (
                    <button
                      type="button"
                      onClick={requestDelete}
                      title="Delete entry"
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "#ef4444",
                        padding: 4,
                        borderRadius: 6,
                        display: "inline-flex",
                        marginRight: 6,
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  ) : null}
                  <button
                    type="submit"
                    title={mode === "edit" ? "Save entry" : "Add entry"}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "#10b981",
                      padding: 4,
                      borderRadius: 6,
                      display: "inline-flex",
                    }}
                  >
                    {mode === "edit" ? <Save size={15} /> : <Plus size={15} />}
                  </button>
                </td>
              </tr>
            </tbody>

            <tfoot>
              <tr style={{ borderTop: "2px solid #f1f5f9", background: "#fafafa" }}>
                <td colSpan={6} style={{ padding: "12px 12px", fontWeight: 700, color: "#0f172a", fontSize: 13 }}>Total</td>
                <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>{fmt(parseNum(entry.purchase))}</td>
                <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>{fmt(parseNum(entry.sales))}</td>
                <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>{fmt(parseNum(entry.expenses))}</td>
                <td />
                <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 700, color: "#f59e0b" }}>{fmt(pgst)}</td>
                <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 700, color: "#06b6d4" }}>{fmt(sgst)}</td>
                <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 700, color: "#8b5cf6" }}>{fmt(tds)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          {mode === "edit" && onDelete ? (
            <ActionButton label="Delete Entry" variant="outline" icon={Trash2} onClick={requestDelete} />
          ) : null}
          <ActionButton label="Cancel" variant="outline" onClick={onClose} />
          <ActionButton type="submit" variant="accent" icon={mode === "edit" ? Save : Plus} label={mode === "edit" ? "Save Entry" : "Add Entry"} />
        </div>

        {confirmingDelete ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/80 p-6 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl border border-red-100 bg-white p-6 text-center shadow-2xl">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
                <Trash2 size={22} />
              </div>
              <h4 className="mt-4 text-lg font-black text-primary">Are you sure?</h4>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                This entry will be removed from the ledger view.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <ActionButton label="Cancel" variant="outline" onClick={() => setConfirmingDelete(false)} />
                <ActionButton label="Delete" variant="accent" icon={Trash2} onClick={handleDelete} />
              </div>
            </div>
          </div>
        ) : null}
      </form>
    </div>
  );
}
