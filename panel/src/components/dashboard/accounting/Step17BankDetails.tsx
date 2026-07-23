"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Archive, Building2, CheckCircle2, Download, Edit2, Eye, Landmark,
  Plus, Search, ShieldAlert, ShieldCheck, Star, UserCircle, X, XCircle,
} from "lucide-react";
import {
  AccountingPage, ActionButton, DataTable, Field,
  MetricCard, Panel, StatusBadge,
} from "./AccountingComponents";
import {
  createFinanceResource,
  listFinanceResource,
  updateFinanceResource,
} from "@/services/finance-api";

const accountTypes = ["Current", "Savings", "OD", "Cash Credit"] as const;
const purposes = ["Collections", "Vendor Payouts", "Payroll", "Tax Payments", "General"] as const;
const statuses = ["Active", "Inactive"] as const;

type AccountType = (typeof accountTypes)[number];
type AccountPurpose = (typeof purposes)[number];
type AccountStatus = (typeof statuses)[number];
type VerificationStatus = "Pending" | "Verified" | "Rejected";
type AccountOwner = "company" | "clients";
type BackendOwner = "company" | "client" | "vendor";
type BackendStatus = "active" | "inactive";
type BackendVerification = "pending" | "verified" | "rejected";

interface BackendBankAccount {
  id: string;
  owner_type: BackendOwner;
  owner_reference: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  ifsc_code: string;
  branch: string;
  account_type: AccountType;
  purpose: AccountPurpose;
  status: BackendStatus;
  verification_status: BackendVerification;
  verification_status_label: VerificationStatus;
  is_primary: boolean;
  verification_note: string;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

type BankPayload = {
  owner_type: BackendOwner;
  owner_reference: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  ifsc_code: string;
  branch: string;
  account_type: AccountType;
  purpose: AccountPurpose;
  status: BackendStatus;
  verification_status: BackendVerification;
  is_primary: boolean;
  verification_note: string;
  last_verified_at: string | null;
};

interface BankAccount {
  id: string;
  ownerType: AccountOwner;
  ownerReference: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  branch: string;
  accountType: AccountType;
  purpose: AccountPurpose;
  status: AccountStatus;
  verificationStatus: VerificationStatus;
  isPrimary: boolean;
  verificationNote: string;
  lastVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const bankSchema = z.object({
  ownerReference: z.string().trim().min(2, "Entity reference is required").max(180),
  accountName: z.string().trim().min(3, "Enter the beneficiary name").max(180),
  accountNumber: z.string().trim().regex(/^[0-9]{6,18}$/, "Account number must contain 6 to 18 digits"),
  confirmAccountNumber: z.string().trim().min(1, "Confirm the account number"),
  bankName: z.string().trim().min(2, "Bank name is required").max(160),
  ifscCode: z.string().trim().toUpperCase().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Enter a valid IFSC code"),
  branch: z.string().trim().min(2, "Branch is required").max(160),
  accountType: z.enum(accountTypes),
  purpose: z.enum(purposes),
  status: z.enum(statuses),
}).refine((data) => data.accountNumber === data.confirmAccountNumber, {
  message: "Account numbers do not match",
  path: ["confirmAccountNumber"],
});

type BankFormInput = z.input<typeof bankSchema>;
type BankFormData = z.output<typeof bankSchema>;

const now = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);
const maskAccount = (value: string) => value.length <= 4 ? value : `${"*".repeat(Math.min(value.length - 4, 8))}${value.slice(-4)}`;
const csvCell = (value: string | number | boolean) => `"${String(value).replaceAll('"', '""')}"`;

function statusLabel(status: BackendStatus): AccountStatus {
  return status === "active" ? "Active" : "Inactive";
}

function statusValue(status: AccountStatus): BackendStatus {
  return status === "Active" ? "active" : "inactive";
}

function verificationValue(status: VerificationStatus): BackendVerification {
  return status.toLowerCase() as BackendVerification;
}

function toUi(row: BackendBankAccount): BankAccount {
  return {
    id: row.id,
    ownerType: row.owner_type === "company" ? "company" : "clients",
    ownerReference: row.owner_reference || row.account_name,
    accountName: row.account_name,
    accountNumber: row.account_number,
    bankName: row.bank_name,
    ifscCode: row.ifsc_code,
    branch: row.branch,
    accountType: row.account_type || "Current",
    purpose: row.purpose || "General",
    status: statusLabel(row.status),
    verificationStatus: row.verification_status_label,
    isPrimary: row.is_primary,
    verificationNote: row.verification_note || "",
    lastVerifiedAt: row.last_verified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPayload(data: BankFormData, owner: AccountOwner, existing?: BankAccount | null): BankPayload {
  const normalizedAccount = data.accountNumber.replace(/\D/g, "");
  const sensitiveChanged = Boolean(existing && (
    existing.accountNumber !== normalizedAccount
    || existing.ifscCode !== data.ifscCode
    || existing.accountName !== data.accountName.trim()
  ));
  return {
    owner_type: owner === "company" ? "company" : "client",
    owner_reference: data.ownerReference.trim(),
    account_name: data.accountName.trim(),
    account_number: normalizedAccount,
    bank_name: data.bankName.trim(),
    ifsc_code: data.ifscCode,
    branch: data.branch.trim(),
    account_type: data.accountType,
    purpose: data.purpose,
    status: statusValue(data.status),
    verification_status: sensitiveChanged ? "pending" : existing ? verificationValue(existing.verificationStatus) : "pending",
    is_primary: sensitiveChanged || data.status === "Inactive" ? false : Boolean(existing?.isPrimary),
    verification_note: sensitiveChanged ? "" : existing?.verificationNote || "",
    last_verified_at: sensitiveChanged ? null : existing?.lastVerifiedAt || null,
  };
}

const sortForConsumption = (accounts: BankAccount[]) =>
  [...accounts].sort((a, b) =>
    Number(b.isPrimary && b.status === "Active" && b.verificationStatus === "Verified")
    - Number(a.isPrimary && a.status === "Active" && a.verificationStatus === "Verified"),
  );

export default function Step17BankDetails() {
  const [activeTab, setActiveTab] = useState<AccountOwner>("company");
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [verificationDecision, setVerificationDecision] = useState<"Verified" | "Rejected">("Verified");
  const [verificationNote, setVerificationNote] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | AccountStatus>("All");
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");

  const {
    register, handleSubmit, reset,
    formState: { errors },
  } = useForm<BankFormInput, unknown, BankFormData>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      ownerReference: "DeMatade Algo Technology Solutions Pvt Ltd",
      accountName: "",
      accountNumber: "",
      confirmAccountNumber: "",
      bankName: "",
      ifscCode: "",
      branch: "",
      accountType: "Current",
      purpose: "General",
      status: "Active",
    },
  });

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setNotice("");
    try {
      const rows = await listFinanceResource<BackendBankAccount>("bank-accounts");
      setAccounts(sortForConsumption(rows.map(toUi)));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load bank accounts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAccounts();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAccounts]);

  const allAccounts = accounts;
  const currentAccounts = accounts.filter((account) => account.ownerType === activeTab);
  const filteredAccounts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return currentAccounts.filter((account) => {
      const matchesStatus = statusFilter === "All" || account.status === statusFilter;
      const matchesQuery = !normalized || [
        account.id, account.ownerReference, account.accountName, account.bankName,
        account.ifscCode, account.branch, account.accountNumber.slice(-4), account.purpose,
      ].join(" ").toLowerCase().includes(normalized);
      return matchesStatus && matchesQuery;
    });
  }, [currentAccounts, query, statusFilter]);

  const detailAccount = currentAccounts.find((account) => account.id === detailId) ?? null;
  const verificationAccount = currentAccounts.find((account) => account.id === verificationId) ?? null;
  const editingAccount = currentAccounts.find((account) => account.id === editingId) ?? null;
  const activeVerified = allAccounts.filter((account) => account.status === "Active" && account.verificationStatus === "Verified").length;
  const pendingVerification = allAccounts.filter((account) => account.verificationStatus === "Pending").length;
  const companyPrimary = accounts.find((account) => account.ownerType === "company" && account.isPrimary && account.status === "Active" && account.verificationStatus === "Verified");

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormError("");
    reset();
  };

  const openCreate = () => {
    setEditingId(null);
    setFormError("");
    reset({
      ownerReference: activeTab === "company" ? "DeMatade Algo Technology Solutions Pvt Ltd" : "",
      accountName: activeTab === "company" ? "DeMatade Algo Technology Solutions Pvt Ltd" : "",
      accountNumber: "",
      confirmAccountNumber: "",
      bankName: "",
      ifscCode: "",
      branch: "",
      accountType: "Current",
      purpose: activeTab === "company" ? "Collections" : "General",
      status: "Active",
    });
    setShowForm(true);
  };

  const openEdit = (account: BankAccount) => {
    setEditingId(account.id);
    setFormError("");
    reset({
      ownerReference: account.ownerReference,
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      confirmAccountNumber: account.accountNumber,
      bankName: account.bankName,
      ifscCode: account.ifscCode,
      branch: account.branch,
      accountType: account.accountType,
      purpose: account.purpose,
      status: account.status,
    });
    setShowForm(true);
  };

  const saveRow = (row: BackendBankAccount) => {
    setAccounts((current) => sortForConsumption([toUi(row), ...current.filter((account) => account.id !== row.id)]));
  };

  const onSubmit = async (data: BankFormData) => {
    setFormError("");
    try {
      const payload = toPayload(data, activeTab, editingAccount);
      const saved = editingAccount
        ? await updateFinanceResource<BackendBankAccount, BankPayload>("bank-accounts", editingAccount.id, payload)
        : await createFinanceResource<BackendBankAccount, BankPayload>("bank-accounts", payload);
      saveRow(saved);
      setNotice(editingAccount
        ? saved.verification_status === "pending" ? "Bank account updated and moved to pending verification." : "Bank details updated."
        : "Bank account created in pending verification status.");
      closeForm();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save bank account.");
    }
  };

  const archiveAccount = async (account: BankAccount) => {
    if (account.isPrimary) {
      setNotice("Primary settlement account cannot be deactivated. Assign another verified primary account first.");
      return;
    }
    try {
      const saved = await updateFinanceResource<BackendBankAccount, BankPayload>("bank-accounts", account.id, {
        status: statusValue(account.status === "Active" ? "Inactive" : "Active"),
      });
      saveRow(saved);
      setNotice(`${account.id} ${account.status === "Active" ? "deactivated" : "activated"}. No bank record was deleted.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to update account status.");
    }
  };

  const makePrimary = async (account: BankAccount) => {
    if (account.status !== "Active" || account.verificationStatus !== "Verified") {
      setNotice("Only an active and verified account can be made primary.");
      return;
    }
    try {
      const saved = await updateFinanceResource<BackendBankAccount, BankPayload>("bank-accounts", account.id, { is_primary: true });
      await loadAccounts();
      setNotice(`${saved.id} is now the primary ${activeTab === "company" ? "treasury" : "client"} account.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to set primary account.");
    }
  };

  const openVerification = (account: BankAccount) => {
    setVerificationId(account.id);
    setVerificationDecision("Verified");
    setVerificationNote(account.verificationNote || "");
    setVerificationError("");
  };

  const saveVerification = async () => {
    if (!verificationAccount) return;
    if (verificationNote.trim().length < 8) {
      setVerificationError("Enter a meaningful verification note of at least 8 characters.");
      return;
    }
    setVerificationError("");
    try {
      const saved = await updateFinanceResource<BackendBankAccount, BankPayload>("bank-accounts", verificationAccount.id, {
        verification_status: verificationValue(verificationDecision),
        verification_note: verificationNote.trim(),
        last_verified_at: now(),
        is_primary: verificationDecision === "Rejected" ? false : verificationAccount.isPrimary,
      });
      saveRow(saved);
      setNotice(`${verificationAccount.id} marked ${verificationDecision.toLowerCase()}.`);
      setVerificationId(null);
      setVerificationNote("");
    } catch (error) {
      setVerificationError(error instanceof Error ? error.message : "Unable to save verification decision.");
    }
  };

  const exportAccounts = () => {
    const rows = [
      ["ID", "Owner Reference", "Beneficiary", "Masked Account", "Bank", "IFSC", "Branch", "Type", "Purpose", "Status", "Verification", "Primary", "Updated"],
      ...filteredAccounts.map((account) => [
        account.id, account.ownerReference, account.accountName, maskAccount(account.accountNumber),
        account.bankName, account.ifscCode, account.branch, account.accountType, account.purpose,
        account.status, account.verificationStatus, account.isPrimary, account.updatedAt,
      ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${activeTab}-bank-register-${today()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AccountingPage
      title="Bank Details"
      description="Control verified treasury and client settlement instructions without exposing sensitive account data."
      icon={Landmark}
      badge="Restricted Treasury"
      actions={
        <>
          <ActionButton icon={Download} label="Export Register" variant="outline" onClick={exportAccounts} />
          <ActionButton icon={Plus} label={activeTab === "company" ? "New Company Account" : "New Client Account"} variant="accent" onClick={openCreate} />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Accounts" value={String(allAccounts.length)} helper="Company and client records" icon={Building2} tone="blue" />
        <MetricCard label="Active Verified" value={String(activeVerified)} helper="Eligible for controlled use" icon={ShieldCheck} tone="green" />
        <MetricCard label="Pending Verification" value={String(pendingVerification)} helper="Maker-checker queue" icon={ShieldAlert} tone={pendingVerification ? "amber" : "slate"} />
        <MetricCard label="Primary Treasury" value={companyPrimary ? companyPrimary.id : "Missing"} helper={companyPrimary ? `${companyPrimary.bankName} * ${companyPrimary.accountNumber.slice(-4)}` : "Select a verified account"} icon={Star} tone={companyPrimary ? "purple" : "red"} />
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-800">
        Bank records now persist in backend finance storage. Account numbers are masked in UI exports and detail views; verification decisions stay audit-backed.
      </div>

      {notice ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} className="rounded-lg p-1 hover:bg-blue-100" title="Dismiss"><X size={16} /></button>
        </div>
      ) : null}

      <div className="flex gap-8 overflow-x-auto border-b border-slate-100">
        {([
          { id: "company", label: "Company Bank Details", icon: Building2 },
          { id: "clients", label: "Client Bank Details", icon: UserCircle },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => { setActiveTab(tab.id); setQuery(""); setStatusFilter("All"); }}
            className={`flex items-center gap-2 whitespace-nowrap pb-4 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === tab.id ? "border-b-2 border-primary text-primary" : "text-slate-400 hover:text-slate-600"}`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <Panel title={activeTab === "company" ? "Internal Treasury Accounts" : "External Client Accounts"} description="Account numbers are masked. Sensitive edits automatically require re-verification.">
        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px]">
          <label className="relative block">
            <Search className="absolute left-3 top-3 text-slate-400" size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ID, entity, bank, IFSC, last 4 digits" className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm font-semibold text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
          </label>
          <Field label="Status" options={["All", ...statuses]} value={statusFilter} onChange={(event: ChangeEvent<HTMLSelectElement>) => setStatusFilter(event.target.value as "All" | AccountStatus)} />
        </div>

        <DataTable columns={["ID / Entity", "Beneficiary", "Account", "Bank & Branch", "Purpose", "Verification", "Status", "Actions"]}>
          {filteredAccounts.map((account) => (
            <tr key={account.id} className="text-sm font-bold text-slate-700 hover:bg-slate-50">
              <td className="px-4 py-4"><div className="flex items-start gap-2">{account.isPrimary ? <Star size={15} className="mt-0.5 fill-amber-400 text-amber-500" /> : null}<div><p className="font-black text-primary">{account.id}</p><p className="mt-1 text-xs font-semibold text-slate-500">{account.ownerReference}</p></div></div></td>
              <td className="px-4 py-4 font-black text-primary">{account.accountName}</td>
              <td className="px-4 py-4"><p className="font-mono font-black tracking-wider text-slate-700">{maskAccount(account.accountNumber)}</p><p className="mt-1 text-xs font-semibold text-slate-500">{account.accountType}</p></td>
              <td className="px-4 py-4"><p className="font-black text-primary">{account.bankName}</p><p className="mt-1 text-xs font-semibold text-slate-500">{account.ifscCode} | {account.branch}</p></td>
              <td className="px-4 py-4"><StatusBadge tone="blue">{account.purpose}</StatusBadge></td>
              <td className="px-4 py-4"><StatusBadge tone={account.verificationStatus === "Verified" ? "green" : account.verificationStatus === "Rejected" ? "red" : "amber"}>{account.verificationStatus}</StatusBadge></td>
              <td className="px-4 py-4"><StatusBadge tone={account.status === "Active" ? "green" : "slate"}>{account.status}</StatusBadge></td>
              <td className="px-4 py-4"><div className="flex items-center gap-1">
                <button type="button" onClick={() => setDetailId(account.id)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-blue-600" title="View control details"><Eye size={15} /></button>
                <button type="button" onClick={() => openEdit(account)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="Edit bank details"><Edit2 size={15} /></button>
                <button type="button" onClick={() => openVerification(account)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-green-600" title="Record verification"><ShieldCheck size={15} /></button>
                <button type="button" onClick={() => makePrimary(account)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-amber-600" title="Make primary"><Star size={15} /></button>
                <button type="button" onClick={() => archiveAccount(account)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-red-600" title={account.status === "Active" ? "Deactivate account" : "Reactivate account"}><Archive size={15} /></button>
              </div></td>
            </tr>
          ))}
        </DataTable>
        {filteredAccounts.length === 0 ? <p className="py-10 text-center text-sm font-semibold text-slate-500">{loading ? "Loading bank accounts..." : "No bank account matches the current filters."}</p> : null}
      </Panel>

      {showForm ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-black text-primary">{editingId ? "Edit Bank Account" : "Add Bank Account"}</h3><p className="mt-1 text-sm font-semibold text-slate-500">New and materially changed accounts require independent verification.</p></div><button type="button" onClick={closeForm} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="Close"><X size={18} /></button></div>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label={activeTab === "company" ? "Legal Entity" : "Client ID / Reference"} required register={register("ownerReference")} error={errors.ownerReference?.message} />
                <Field label="Beneficiary Name" required register={register("accountName")} error={errors.accountName?.message} />
                <Field label="Account Number" type="password" inputMode="numeric" required register={register("accountNumber")} error={errors.accountNumber?.message} />
                <Field label="Confirm Account Number" type="password" inputMode="numeric" required register={register("confirmAccountNumber")} error={errors.confirmAccountNumber?.message} />
                <Field label="Bank Name" required register={register("bankName")} error={errors.bankName?.message} />
                <Field label="IFSC Code" required placeholder="HDFC0001234" register={register("ifscCode")} error={errors.ifscCode?.message} />
                <Field label="Branch" required register={register("branch")} error={errors.branch?.message} />
                <Field label="Account Type" options={[...accountTypes]} register={register("accountType")} />
                <Field label="Purpose" options={[...purposes]} register={register("purpose")} />
                <Field label="Lifecycle Status" options={[...statuses]} register={register("status")} />
              </div>
              {formError ? <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700"><ShieldAlert className="mt-0.5 shrink-0" size={17} />{formError}</div> : null}
              <div className="flex justify-end gap-3 border-t border-border pt-5"><ActionButton label="Cancel" variant="outline" onClick={closeForm} /><ActionButton icon={ShieldCheck} label={editingId ? "Update Account" : "Create Pending Account"} variant="accent" type="submit" /></div>
            </form>
          </div>
        </div>
      ) : null}

      {verificationAccount ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-black text-primary">Verification Decision</h3><p className="mt-1 text-sm font-semibold text-slate-500">{verificationAccount.id} | {verificationAccount.bankName} | {maskAccount(verificationAccount.accountNumber)}</p></div><button type="button" onClick={() => setVerificationId(null)} className="rounded-lg border border-border p-2 text-slate-500" title="Close"><X size={18} /></button></div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setVerificationDecision("Verified")} className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-black ${verificationDecision === "Verified" ? "border-green-600 bg-green-50 text-green-700" : "border-border text-slate-500"}`}><CheckCircle2 size={17} /> Verified</button>
              <button type="button" onClick={() => setVerificationDecision("Rejected")} className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-black ${verificationDecision === "Rejected" ? "border-red-600 bg-red-50 text-red-700" : "border-border text-slate-500"}`}><XCircle size={17} /> Rejected</button>
            </div>
            <div className="mt-5"><Field label="Verification Note" required multiline value={verificationNote} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setVerificationNote(event.target.value)} placeholder="Document checked, account ownership evidence, or rejection reason" /></div>
            {verificationError ? <p className="mt-2 text-xs font-black text-red-600">{verificationError}</p> : null}
            <div className="mt-5 flex justify-end gap-3"><ActionButton label="Cancel" variant="outline" onClick={() => setVerificationId(null)} /><ActionButton icon={ShieldCheck} label="Record Decision" variant="accent" onClick={saveVerification} /></div>
          </div>
        </div>
      ) : null}

      {detailAccount ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-black text-primary">{detailAccount.id} Control Record</h3><p className="mt-1 text-sm font-semibold text-slate-500">Sensitive account number remains masked in this view.</p></div><button type="button" onClick={() => setDetailId(null)} className="rounded-lg border border-border p-2 text-slate-500" title="Close"><X size={18} /></button></div>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ["Entity", detailAccount.ownerReference],
                ["Beneficiary", detailAccount.accountName],
                ["Account", maskAccount(detailAccount.accountNumber)],
                ["Bank / IFSC", `${detailAccount.bankName} / ${detailAccount.ifscCode}`],
                ["Purpose", detailAccount.purpose],
                ["Primary", detailAccount.isPrimary ? "Yes" : "No"],
                ["Verification", detailAccount.verificationStatus],
                ["Last Verified", detailAccount.lastVerifiedAt ?? "Not verified"],
              ].map(([label, value]) => <div key={label} className="rounded-xl border border-border bg-slate-50 p-3"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p><p className="mt-2 break-words text-sm font-black text-primary">{value}</p></div>)}
            </div>
            <div className="mt-4 rounded-xl border border-border p-4"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verification Note</p><p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{detailAccount.verificationNote || "No verification note recorded."}</p></div>
          </div>
        </div>
      ) : null}
    </AccountingPage>
  );
}
