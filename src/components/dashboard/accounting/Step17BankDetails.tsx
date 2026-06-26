"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Archive,
  Building2,
  CheckCircle2,
  Download,
  Edit2,
  Eye,
  Landmark,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Star,
  UserCircle,
  X,
  XCircle,
} from "lucide-react";
import {
  AccountingPage,
  ActionButton,
  DataTable,
  Field,
  MetricCard,
  Panel,
  StatusBadge,
} from "./AccountingComponents";

const accountTypes = ["Current", "Savings", "OD", "Cash Credit"] as const;
const purposes = ["Collections", "Vendor Payouts", "Payroll", "Tax Payments", "General"] as const;
const statuses = ["Active", "Inactive"] as const;
const verificationStatuses = ["Pending", "Verified", "Rejected"] as const;

type AccountType = (typeof accountTypes)[number];
type AccountPurpose = (typeof purposes)[number];
type AccountStatus = (typeof statuses)[number];
type VerificationStatus = (typeof verificationStatuses)[number];
type AccountOwner = "company" | "clients";

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
  ownerReference: z.string().trim().min(2, "Entity reference is required").max(80),
  accountName: z.string().trim().min(3, "Enter the beneficiary name").max(100),
  accountNumber: z.string().trim().regex(/^[0-9]{6,18}$/, "Account number must contain 6 to 18 digits"),
  confirmAccountNumber: z.string().trim().min(1, "Confirm the account number"),
  bankName: z.string().trim().min(2, "Bank name is required").max(80),
  ifscCode: z.string().trim().toUpperCase().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Enter a valid IFSC code"),
  branch: z.string().trim().min(2, "Branch is required").max(100),
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

const initialCompanyAccounts: BankAccount[] = [
  {
    id: "CB-001",
    ownerType: "company",
    ownerReference: "WelRaj Panel Services Pvt Ltd",
    accountName: "WelRaj Panel Services Pvt Ltd",
    accountNumber: "918273645544",
    bankName: "HDFC Bank",
    ifscCode: "HDFC0001234",
    branch: "Malviya Nagar, Jaipur",
    accountType: "Current",
    purpose: "Collections",
    status: "Active",
    verificationStatus: "Verified",
    isPrimary: true,
    verificationNote: "Opening balance and cancelled cheque verified.",
    lastVerifiedAt: "2026-06-01T10:00:00.000Z",
    createdAt: "2026-01-10T10:00:00.000Z",
    updatedAt: "2026-06-01T10:00:00.000Z",
  },
  {
    id: "CB-002",
    ownerType: "company",
    ownerReference: "WelRaj Panel Services Pvt Ltd",
    accountName: "WelRaj Panel Services Pvt Ltd",
    accountNumber: "112233445566",
    bankName: "ICICI Bank",
    ifscCode: "ICIC0009876",
    branch: "C-Scheme, Jaipur",
    accountType: "Current",
    purpose: "Payroll",
    status: "Active",
    verificationStatus: "Verified",
    isPrimary: false,
    verificationNote: "Bank letter verified.",
    lastVerifiedAt: "2026-06-02T11:00:00.000Z",
    createdAt: "2026-02-05T10:00:00.000Z",
    updatedAt: "2026-06-02T11:00:00.000Z",
  },
];

const initialClientAccounts: BankAccount[] = [
  {
    id: "CL-881",
    ownerType: "clients",
    ownerReference: "CLIENT-NEXA",
    accountName: "Nexa Retail Cloud",
    accountNumber: "50200012345678",
    bankName: "State Bank of India",
    ifscCode: "SBIN0004321",
    branch: "Whitefield, Bangalore",
    accountType: "Current",
    purpose: "General",
    status: "Active",
    verificationStatus: "Verified",
    isPrimary: true,
    verificationNote: "Client mandate verified.",
    lastVerifiedAt: "2026-06-04T09:30:00.000Z",
    createdAt: "2026-03-05T10:00:00.000Z",
    updatedAt: "2026-06-04T09:30:00.000Z",
  },
  {
    id: "CL-902",
    ownerType: "clients",
    ownerReference: "CLIENT-APEX",
    accountName: "Apex Finserve Pvt Ltd",
    accountNumber: "001294837261",
    bankName: "Axis Bank",
    ifscCode: "UTIB0000129",
    branch: "Gurugram Sector 44",
    accountType: "Current",
    purpose: "General",
    status: "Active",
    verificationStatus: "Pending",
    isPrimary: false,
    verificationNote: "",
    lastVerifiedAt: null,
    createdAt: "2026-06-20T10:00:00.000Z",
    updatedAt: "2026-06-20T10:00:00.000Z",
  },
];

const maskAccount = (value: string) => value.length <= 4 ? value : `${"•".repeat(Math.min(value.length - 4, 8))}${value.slice(-4)}`;
const csvCell = (value: string | number | boolean) => `"${String(value).replaceAll('"', '""')}"`;

const normalizeAccount = (value: unknown, ownerType: AccountOwner, index: number): BankAccount | null => {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<BankAccount>;
  if (!row.accountName || !row.accountNumber || !row.bankName || !row.ifscCode || !row.branch) return null;
  const timestamp = now();
  return {
    id: typeof row.id === "string" && row.id ? row.id : `${ownerType === "company" ? "CB" : "CL"}-${String(index + 1).padStart(3, "0")}`,
    ownerType,
    ownerReference: typeof row.ownerReference === "string" && row.ownerReference ? row.ownerReference : row.accountName,
    accountName: row.accountName,
    accountNumber: String(row.accountNumber).replace(/\D/g, ""),
    bankName: row.bankName,
    ifscCode: String(row.ifscCode).toUpperCase(),
    branch: row.branch,
    accountType: accountTypes.includes(row.accountType as AccountType) ? row.accountType as AccountType : "Current",
    purpose: purposes.includes(row.purpose as AccountPurpose) ? row.purpose as AccountPurpose : "General",
    status: statuses.includes(row.status as AccountStatus) ? row.status as AccountStatus : "Active",
    verificationStatus: verificationStatuses.includes(row.verificationStatus as VerificationStatus)
      ? row.verificationStatus as VerificationStatus
      : "Pending",
    isPrimary: Boolean(row.isPrimary),
    verificationNote: typeof row.verificationNote === "string" ? row.verificationNote : "",
    lastVerifiedAt: typeof row.lastVerifiedAt === "string" ? row.lastVerifiedAt : null,
    createdAt: typeof row.createdAt === "string" ? row.createdAt : timestamp,
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : timestamp,
  };
};

const readAccounts = (key: string, ownerType: AccountOwner, fallback: BankAccount[]) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallback;
    const accounts = parsed
      .map((row, index) => normalizeAccount(row, ownerType, index))
      .filter((row): row is BankAccount => Boolean(row));
    return accounts.length ? accounts : fallback;
  } catch {
    return fallback;
  }
};

const sortForConsumption = (accounts: BankAccount[]) =>
  [...accounts].sort((a, b) =>
    Number(b.isPrimary && b.status === "Active" && b.verificationStatus === "Verified")
    - Number(a.isPrimary && a.status === "Active" && a.verificationStatus === "Verified"),
  );

export default function Step17BankDetails() {
  const [activeTab, setActiveTab] = useState<AccountOwner>("company");
  const [companyAccounts, setCompanyAccounts] = useState<BankAccount[]>(initialCompanyAccounts);
  const [clientAccounts, setClientAccounts] = useState<BankAccount[]>(initialClientAccounts);
  const [hydrated, setHydrated] = useState(false);
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
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BankFormInput, unknown, BankFormData>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      ownerReference: "WelRaj Panel Services Pvt Ltd",
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCompanyAccounts(readAccounts("crm_company_banks", "company", initialCompanyAccounts));
      setClientAccounts(readAccounts("crm_client_banks", "clients", initialClientAccounts));
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("crm_company_banks", JSON.stringify(sortForConsumption(companyAccounts)));
  }, [companyAccounts, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("crm_client_banks", JSON.stringify(sortForConsumption(clientAccounts)));
  }, [clientAccounts, hydrated]);

  const allAccounts = [...companyAccounts, ...clientAccounts];
  const currentAccounts = activeTab === "company" ? companyAccounts : clientAccounts;
  const setCurrentAccounts = (updater: (accounts: BankAccount[]) => BankAccount[]) => {
    if (activeTab === "company") setCompanyAccounts(updater);
    else setClientAccounts(updater);
  };

  const filteredAccounts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return currentAccounts.filter((account) => {
      const matchesStatus = statusFilter === "All" || account.status === statusFilter;
      const matchesQuery = !normalized || [
        account.id,
        account.ownerReference,
        account.accountName,
        account.bankName,
        account.ifscCode,
        account.branch,
        account.accountNumber.slice(-4),
        account.purpose,
      ].join(" ").toLowerCase().includes(normalized);
      return matchesStatus && matchesQuery;
    });
  }, [currentAccounts, query, statusFilter]);

  const detailAccount = currentAccounts.find((account) => account.id === detailId) ?? null;
  const verificationAccount = currentAccounts.find((account) => account.id === verificationId) ?? null;
  const activeVerified = allAccounts.filter((account) => account.status === "Active" && account.verificationStatus === "Verified").length;
  const pendingVerification = allAccounts.filter((account) => account.verificationStatus === "Pending").length;
  const companyPrimary = companyAccounts.find((account) => account.isPrimary && account.status === "Active" && account.verificationStatus === "Verified");

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
      ownerReference: activeTab === "company" ? "WelRaj Panel Services Pvt Ltd" : "",
      accountName: activeTab === "company" ? "WelRaj Panel Services Pvt Ltd" : "",
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

  const onSubmit = (data: BankFormData) => {
    const normalizedAccount = data.accountNumber.replace(/\D/g, "");
    const duplicate = allAccounts.some(
      (account) => account.id !== editingId && account.accountNumber === normalizedAccount && account.ifscCode === data.ifscCode,
    );
    if (duplicate) {
      setFormError("This account number and IFSC combination already exists.");
      return;
    }

    const existing = currentAccounts.find((account) => account.id === editingId);
    const sensitiveChanged = Boolean(existing && (
      existing.accountNumber !== normalizedAccount
      || existing.ifscCode !== data.ifscCode
      || existing.accountName !== data.accountName.trim()
    ));
    const timestamp = now();

    if (existing) {
      setCurrentAccounts((accounts) => accounts.map((account) => account.id === existing.id ? {
        ...account,
        ownerReference: data.ownerReference.trim(),
        accountName: data.accountName.trim(),
        accountNumber: normalizedAccount,
        bankName: data.bankName.trim(),
        ifscCode: data.ifscCode,
        branch: data.branch.trim(),
        accountType: data.accountType,
        purpose: data.purpose,
        status: data.status,
        verificationStatus: sensitiveChanged ? "Pending" : account.verificationStatus,
        verificationNote: sensitiveChanged ? "" : account.verificationNote,
        lastVerifiedAt: sensitiveChanged ? null : account.lastVerifiedAt,
        isPrimary: data.status === "Inactive" || sensitiveChanged ? false : account.isPrimary,
        updatedAt: timestamp,
      } : account));
      setNotice(sensitiveChanged
        ? `${existing.id} updated and moved to pending verification because sensitive bank data changed.`
        : `${existing.id} bank details updated.`);
    } else {
      const prefix = activeTab === "company" ? "CB" : "CL";
      const sequence = Math.max(0, ...currentAccounts.map((account) => Number(account.id.match(/\d+/)?.[0] ?? 0))) + 1;
      setCurrentAccounts((accounts) => [{
        id: `${prefix}-${String(sequence).padStart(3, "0")}`,
        ownerType: activeTab,
        ownerReference: data.ownerReference.trim(),
        accountName: data.accountName.trim(),
        accountNumber: normalizedAccount,
        bankName: data.bankName.trim(),
        ifscCode: data.ifscCode,
        branch: data.branch.trim(),
        accountType: data.accountType,
        purpose: data.purpose,
        status: data.status,
        verificationStatus: "Pending",
        isPrimary: false,
        verificationNote: "",
        lastVerifiedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      }, ...accounts]);
      setNotice("Bank account created in pending verification status.");
    }
    closeForm();
  };

  const archiveAccount = (account: BankAccount) => {
    if (account.isPrimary) {
      setNotice("Primary settlement account cannot be deactivated. Assign another verified primary account first.");
      return;
    }
    setCurrentAccounts((accounts) => accounts.map((item) => item.id === account.id ? {
      ...item,
      status: item.status === "Active" ? "Inactive" : "Active",
      updatedAt: now(),
    } : item));
    setNotice(`${account.id} ${account.status === "Active" ? "deactivated" : "activated"}. No bank record was deleted.`);
  };

  const makePrimary = (account: BankAccount) => {
    if (account.status !== "Active" || account.verificationStatus !== "Verified") {
      setNotice("Only an active and verified account can be made primary.");
      return;
    }
    setCurrentAccounts((accounts) => accounts.map((item) => ({
      ...item,
      isPrimary: item.id === account.id
        ? true
        : item.ownerReference === account.ownerReference || activeTab === "company"
          ? false
          : item.isPrimary,
      updatedAt: item.id === account.id ? now() : item.updatedAt,
    })));
    setNotice(`${account.id} is now the primary ${activeTab === "company" ? "treasury" : "client"} account.`);
  };

  const openVerification = (account: BankAccount) => {
    setVerificationId(account.id);
    setVerificationDecision("Verified");
    setVerificationNote("");
    setVerificationError("");
  };

  const saveVerification = () => {
    if (!verificationAccount) return;
    if (verificationNote.trim().length < 8) {
      setVerificationError("Enter a meaningful verification note of at least 8 characters.");
      return;
    }
    setVerificationError("");
    setCurrentAccounts((accounts) => accounts.map((account) => account.id === verificationAccount.id ? {
      ...account,
      verificationStatus: verificationDecision,
      verificationNote: verificationNote.trim(),
      lastVerifiedAt: now(),
      isPrimary: verificationDecision === "Rejected" ? false : account.isPrimary,
      updatedAt: now(),
    } : account));
    setNotice(`${verificationAccount.id} marked ${verificationDecision.toLowerCase()}.`);
    setVerificationId(null);
    setVerificationNote("");
  };

  const exportAccounts = () => {
    const rows = [
      ["ID", "Owner Reference", "Beneficiary", "Masked Account", "Bank", "IFSC", "Branch", "Type", "Purpose", "Status", "Verification", "Primary", "Updated"],
      ...filteredAccounts.map((account) => [
        account.id,
        account.ownerReference,
        account.accountName,
        maskAccount(account.accountNumber),
        account.bankName,
        account.ifscCode,
        account.branch,
        account.accountType,
        account.purpose,
        account.status,
        account.verificationStatus,
        account.isPrimary,
        account.updatedAt,
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
      title="Bank Account Management"
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
        <MetricCard label="Primary Treasury" value={companyPrimary ? companyPrimary.id : "Missing"} helper={companyPrimary ? `${companyPrimary.bankName} • ${companyPrimary.accountNumber.slice(-4)}` : "Select a verified account"} icon={Star} tone={companyPrimary ? "purple" : "red"} />
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-800">
        Full bank credentials remain in browser localStorage for this frontend prototype. Production must use encrypted server storage,
        field-level access, maker-checker verification, secret-safe logs, and tokenized account references.
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

      <Panel
        title={activeTab === "company" ? "Internal Treasury Accounts" : "External Client Accounts"}
        description="Account numbers are masked. Sensitive edits automatically require re-verification."
      >
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
              <td className="px-4 py-4">
                <div className="flex items-start gap-2">
                  {account.isPrimary ? <Star size={15} className="mt-0.5 fill-amber-400 text-amber-500" /> : null}
                  <div>
                    <p className="font-black text-primary">{account.id}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{account.ownerReference}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 font-black text-primary">{account.accountName}</td>
              <td className="px-4 py-4">
                <p className="font-mono font-black tracking-wider text-slate-700">{maskAccount(account.accountNumber)}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{account.accountType}</p>
              </td>
              <td className="px-4 py-4">
                <p className="font-black text-primary">{account.bankName}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{account.ifscCode} | {account.branch}</p>
              </td>
              <td className="px-4 py-4"><StatusBadge tone="blue">{account.purpose}</StatusBadge></td>
              <td className="px-4 py-4">
                <StatusBadge tone={account.verificationStatus === "Verified" ? "green" : account.verificationStatus === "Rejected" ? "red" : "amber"}>
                  {account.verificationStatus}
                </StatusBadge>
              </td>
              <td className="px-4 py-4"><StatusBadge tone={account.status === "Active" ? "green" : "slate"}>{account.status}</StatusBadge></td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setDetailId(account.id)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-blue-600" title="View control details"><Eye size={15} /></button>
                  <button type="button" onClick={() => openEdit(account)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="Edit bank details"><Edit2 size={15} /></button>
                  <button type="button" onClick={() => openVerification(account)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-green-600" title="Record verification"><ShieldCheck size={15} /></button>
                  <button type="button" onClick={() => makePrimary(account)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-amber-600" title="Make primary"><Star size={15} /></button>
                  <button type="button" onClick={() => archiveAccount(account)} className="rounded-lg border border-border p-2 text-slate-500 hover:text-red-600" title={account.status === "Active" ? "Deactivate account" : "Reactivate account"}><Archive size={15} /></button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
        {filteredAccounts.length === 0 ? <p className="py-10 text-center text-sm font-semibold text-slate-500">No bank account matches the current filters.</p> : null}
      </Panel>

      {showForm ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-primary">{editingId ? "Edit Bank Account" : "Add Bank Account"}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">New and materially changed accounts require independent verification.</p>
              </div>
              <button type="button" onClick={closeForm} className="rounded-lg border border-border p-2 text-slate-500 hover:text-primary" title="Close"><X size={18} /></button>
            </div>
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
              <div className="flex justify-end gap-3 border-t border-border pt-5">
                <ActionButton label="Cancel" variant="outline" onClick={closeForm} />
                <ActionButton icon={ShieldCheck} label={editingId ? "Update Account" : "Create Pending Account"} variant="accent" type="submit" />
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {verificationAccount ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-primary">Verification Decision</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">{verificationAccount.id} | {verificationAccount.bankName} | {maskAccount(verificationAccount.accountNumber)}</p>
              </div>
              <button type="button" onClick={() => setVerificationId(null)} className="rounded-lg border border-border p-2 text-slate-500" title="Close"><X size={18} /></button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setVerificationDecision("Verified")} className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-black ${verificationDecision === "Verified" ? "border-green-600 bg-green-50 text-green-700" : "border-border text-slate-500"}`}><CheckCircle2 size={17} /> Verified</button>
              <button type="button" onClick={() => setVerificationDecision("Rejected")} className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-black ${verificationDecision === "Rejected" ? "border-red-600 bg-red-50 text-red-700" : "border-border text-slate-500"}`}><XCircle size={17} /> Rejected</button>
            </div>
            <div className="mt-5">
              <Field label="Verification Note" required multiline value={verificationNote} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setVerificationNote(event.target.value)} placeholder="Document checked, account ownership evidence, or rejection reason" />
            </div>
            {verificationError ? <p className="mt-2 text-xs font-black text-red-600">{verificationError}</p> : null}
            <div className="mt-5 flex justify-end gap-3">
              <ActionButton label="Cancel" variant="outline" onClick={() => setVerificationId(null)} />
              <ActionButton icon={ShieldCheck} label="Record Decision" variant="accent" onClick={saveVerification} />
            </div>
          </div>
        </div>
      ) : null}

      {detailAccount ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-primary">{detailAccount.id} Control Record</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">Sensitive account number remains masked in this view.</p>
              </div>
              <button type="button" onClick={() => setDetailId(null)} className="rounded-lg border border-border p-2 text-slate-500" title="Close"><X size={18} /></button>
            </div>
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
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-border bg-slate-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                  <p className="mt-2 break-words text-sm font-black text-primary">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-border p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verification Note</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{detailAccount.verificationNote || "No verification note recorded."}</p>
            </div>
          </div>
        </div>
      ) : null}
    </AccountingPage>
  );
}
