"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Archive, Download, Edit3, Landmark, Plus, ReceiptText, RotateCcw, ShieldCheck,
  Truck, WalletCards, X, CheckCircle2,
} from "lucide-react";
import {
  AccountingPage, ActionButton, DataTable, Field,
  MetricCard, Panel, StatusBadge,
} from "./AccountingComponents";

const INR = "\u20b9";

const vendorStatuses = ["Active", "Inactive", "Review", "Blocked", "Archived"] as const;
const vendorCategories = ["Software Licenses", "Cloud Hosting", "Hardware", "Internet", "Rent", "Consultant", "Marketing", "Travel"] as const;
const tdsOptions = ["No", "Yes - 1%", "Yes - 2%", "Yes - 10%"] as const;

const vendorSchema = z.object({
  vendorName: z.string().trim().min(3, "Vendor name is too short"),
  contactPerson: z.string().trim().optional(),
  email: z.string().trim().toLowerCase().email("Invalid email").or(z.literal("")),
  mobile: z.string().trim().regex(/^[0-9]{10}$/, "Enter 10-digit number").or(z.literal("")),
  gstin: z.string().trim().toUpperCase().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN").or(z.literal("")),
  pan: z.string().trim().toUpperCase().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN").or(z.literal("")),
  status: z.enum(vendorStatuses),
  category: z.enum(vendorCategories),
  tds: z.enum(tdsOptions),
  monthlyCommitment: z.coerce.number().min(0, "Monthly commitment cannot be negative"),
  bankName: z.string().trim().optional(),
  accountNo: z.string().trim().regex(/^[0-9]{9,18}$/, "Enter 9 to 18 digit account number").or(z.literal("")),
  ifsc: z.string().trim().toUpperCase().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC").or(z.literal("")),
  address: z.string().trim().optional(),
}).superRefine((data, ctx) => {
  const hasAnyBankField = Boolean(data.bankName || data.accountNo || data.ifsc);
  if (hasAnyBankField && (!data.bankName || !data.accountNo || !data.ifsc)) {
    ctx.addIssue({
      code: "custom",
      path: ["accountNo"],
      message: "Bank name, account number, and IFSC are required together",
    });
  }
});

type VendorFormInput = z.input<typeof vendorSchema>;
type VendorFormData = z.output<typeof vendorSchema>;
type VendorStatus = typeof vendorStatuses[number];

type VendorRecord = {
  id: string;
  vendorName: string;
  contactPerson: string;
  email: string;
  mobile: string;
  category: string;
  gstin: string;
  pan: string;
  tds: string;
  monthlyCommitment: number;
  status: VendorStatus;
  bankName: string;
  accountNo: string;
  ifsc: string;
  address: string;
  createdAt: string;
  updatedAt: string;
};

const initialVendors: VendorRecord[] = [
  {
    id: "VEN-001",
    vendorName: "Amazon Web Services India",
    contactPerson: "AWS Billing Desk",
    email: "billing@aws.amazon.in",
    mobile: "9876501234",
    category: "Cloud Hosting",
    gstin: "29AAICA3918J1ZK",
    pan: "AAICA3918J",
    tds: "Yes - 2%",
    monthlyCommitment: 245000,
    status: "Active",
    bankName: "HDFC Bank",
    accountNo: "50200012345678",
    ifsc: "HDFC0001234",
    address: "Bengaluru, Karnataka",
    createdAt: "2026-04-04T10:30:00.000Z",
    updatedAt: "2026-06-14T10:30:00.000Z",
  },
  {
    id: "VEN-002",
    vendorName: "Razorpay Software Pvt Ltd",
    contactPerson: "Payments Support",
    email: "accounts@razorpay.com",
    mobile: "9988701234",
    category: "Payment Gateway",
    gstin: "29AAICR2714C1Z7",
    pan: "AAICR2714C",
    tds: "Yes - 2%",
    monthlyCommitment: 38000,
    status: "Active",
    bankName: "ICICI Bank",
    accountNo: "123456789012",
    ifsc: "ICIC0001234",
    address: "Koramangala, Bengaluru",
    createdAt: "2026-04-12T10:30:00.000Z",
    updatedAt: "2026-06-18T10:30:00.000Z",
  },
  {
    id: "VEN-003",
    vendorName: "Airtel Business",
    contactPerson: "Enterprise Desk",
    email: "enterprise@airtel.com",
    mobile: "9123409876",
    category: "Internet",
    gstin: "07AAACB2894G1ZR",
    pan: "AAACB2894G",
    tds: "No",
    monthlyCommitment: 18500,
    status: "Active",
    bankName: "Axis Bank",
    accountNo: "918273645012",
    ifsc: "UTIB0001234",
    address: "Connaught Place, New Delhi",
    createdAt: "2026-05-02T10:30:00.000Z",
    updatedAt: "2026-06-11T10:30:00.000Z",
  },
  {
    id: "VEN-004",
    vendorName: "TechDepot Hardware",
    contactPerson: "Mehul Shah",
    email: "mehul@techdepot.in",
    mobile: "9012309876",
    category: "Hardware",
    gstin: "06AAFFT3344G1Z1",
    pan: "AAFFT3344G",
    tds: "Yes - 1%",
    monthlyCommitment: 0,
    status: "Review",
    bankName: "",
    accountNo: "",
    ifsc: "",
    address: "Gurugram, Haryana",
    createdAt: "2026-05-19T10:30:00.000Z",
    updatedAt: "2026-06-09T10:30:00.000Z",
  },
];

const emptyVendorDefaults: VendorFormInput = {
  vendorName: "",
  contactPerson: "",
  email: "",
  mobile: "",
  gstin: "",
  pan: "",
  status: "Active",
  category: "Software Licenses",
  tds: "No",
  monthlyCommitment: 0,
  bankName: "",
  accountNo: "",
  ifsc: "",
  address: "",
};

function money(value: number) {
  return `${INR} ${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function maskAccount(accountNo: string) {
  if (!accountNo) return "Not mapped";
  return `****${accountNo.slice(-4)}`;
}

function tdsRate(tds: string) {
  return tds === "No" ? "0%" : tds.replace("Yes - ", "");
}

function exportCsv(filename: string, rows: VendorRecord[]) {
  const headers = ["Vendor ID", "Vendor", "Contact", "Email", "Mobile", "Category", "GSTIN", "PAN", "TDS", "Monthly Commitment", "Status", "Bank", "Account", "IFSC", "Address"];
  const csvRows = rows.map((vendor) => [
    vendor.id,
    vendor.vendorName,
    vendor.contactPerson,
    vendor.email,
    vendor.mobile,
    vendor.category,
    vendor.gstin,
    vendor.pan,
    vendor.tds,
    String(vendor.monthlyCommitment),
    vendor.status,
    vendor.bankName,
    vendor.accountNo,
    vendor.ifsc,
    vendor.address,
  ]);
  const csv = [headers, ...csvRows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Step2Vendors() {
  const [vendors, setVendors] = useState<VendorRecord[]>(initialVendors);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<VendorFormInput, unknown, VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: emptyVendorDefaults,
  });

  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      const haystack = `${vendor.id} ${vendor.vendorName} ${vendor.contactPerson} ${vendor.email} ${vendor.mobile} ${vendor.gstin} ${vendor.pan} ${vendor.category}`.toLowerCase();
      const matchesSearch = haystack.includes(searchTerm.toLowerCase().trim());
      const matchesStatus = statusFilter === "All" || vendor.status === statusFilter;
      const matchesCategory = categoryFilter === "All" || vendor.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [vendors, searchTerm, statusFilter, categoryFilter]);

  const activeVendors = vendors.filter((vendor) => vendor.status === "Active");
  const gstVendors = vendors.filter((vendor) => vendor.gstin);
  const bankMapped = vendors.filter((vendor) => vendor.bankName && vendor.accountNo && vendor.ifsc);
  const monthlyCommitments = activeVendors.reduce((sum, vendor) => sum + vendor.monthlyCommitment, 0);

  const openCreateForm = () => {
    setEditingId(null);
    setSuccessMsg("");
    reset(emptyVendorDefaults);
    setShowForm(true);
  };

  const openEditForm = (vendor: VendorRecord) => {
    setEditingId(vendor.id);
    setSuccessMsg("");
    reset({
      vendorName: vendor.vendorName,
      contactPerson: vendor.contactPerson,
      email: vendor.email,
      mobile: vendor.mobile,
      gstin: vendor.gstin,
      pan: vendor.pan,
      status: vendor.status,
      category: vendor.category as VendorFormInput["category"],
      tds: vendor.tds as VendorFormInput["tds"],
      monthlyCommitment: vendor.monthlyCommitment,
      bankName: vendor.bankName,
      accountNo: vendor.accountNo,
      ifsc: vendor.ifsc,
      address: vendor.address,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setSuccessMsg("");
    reset(emptyVendorDefaults);
  };

  const findDuplicate = (field: keyof Pick<VendorRecord, "gstin" | "pan" | "email" | "mobile" | "accountNo">, value: string) => {
    if (!value) return undefined;
    return vendors.find((vendor) => vendor.id !== editingId && normalize(vendor[field]) === normalize(value));
  };

  const onSubmit = (data: VendorFormData) => {
    const duplicateChecks: Array<[keyof Pick<VendorRecord, "gstin" | "pan" | "email" | "mobile" | "accountNo">, keyof VendorFormData, string]> = [
      ["gstin", "gstin", "GSTIN already exists in Vendor Master"],
      ["pan", "pan", "PAN already exists in Vendor Master"],
      ["email", "email", "Email already exists in Vendor Master"],
      ["mobile", "mobile", "Mobile already exists in Vendor Master"],
      ["accountNo", "accountNo", "Bank account already exists in Vendor Master"],
    ];
    const duplicate = duplicateChecks.find(([recordKey]) => findDuplicate(recordKey, String(data[recordKey] ?? "")));
    if (duplicate) {
      setError(duplicate[1], { type: "manual", message: duplicate[2] });
      return;
    }

    const now = new Date().toISOString();
    if (editingId) {
      setVendors((current) => current.map((vendor) => (
        vendor.id === editingId
          ? {
              ...vendor,
              vendorName: data.vendorName,
              contactPerson: data.contactPerson ?? "",
              email: data.email,
              mobile: data.mobile,
              gstin: data.gstin,
              pan: data.pan,
              status: data.status,
              category: data.category,
              tds: data.tds,
              monthlyCommitment: data.monthlyCommitment,
              bankName: data.bankName ?? "",
              accountNo: data.accountNo,
              ifsc: data.ifsc,
              address: data.address ?? "",
              updatedAt: now,
            }
          : vendor
      )));
      setSuccessMsg("Vendor updated successfully");
    } else {
      const sequence = vendors.length + 1;
      const newVendor: VendorRecord = {
        id: `VEN-${String(sequence).padStart(3, "0")}`,
        vendorName: data.vendorName,
        contactPerson: data.contactPerson ?? "",
        email: data.email,
        mobile: data.mobile,
        category: data.category,
        gstin: data.gstin,
        pan: data.pan,
        tds: data.tds,
        monthlyCommitment: data.monthlyCommitment,
        status: data.status,
        bankName: data.bankName ?? "",
        accountNo: data.accountNo,
        ifsc: data.ifsc,
        address: data.address ?? "",
        createdAt: now,
        updatedAt: now,
      };
      setVendors((current) => [newVendor, ...current]);
      setSuccessMsg("Vendor added successfully");
    }

    setTimeout(closeForm, 900);
  };

  const updateStatus = (vendorId: string, status: VendorStatus) => {
    setVendors((current) => current.map((vendor) => (
      vendor.id === vendorId ? { ...vendor, status, updatedAt: new Date().toISOString() } : vendor
    )));
  };

  return (
    <AccountingPage
      title="Vendor Master"
      description="Maintain vendor, bank, GST, PAN, recurring subscription, and TDS setup for all company expenses."
      icon={Truck}
      badge="Expense foundation"
      actions={
        <>
          <ActionButton icon={Download} label="Export Vendors" variant="outline" onClick={() => exportCsv("vendor-master.csv", filteredVendors)} />
          <ActionButton icon={Plus} label="New Vendor" variant="accent" onClick={openCreateForm} />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Vendors" value={String(activeVendors.length)} helper={`${vendors.length} total registered`} icon={Truck} tone="blue" />
        <MetricCard label="Monthly Commitments" value={money(monthlyCommitments)} helper="Subscriptions and utilities" icon={WalletCards} tone="amber" />
        <MetricCard label="GST Input Vendors" value={String(gstVendors.length)} helper="Eligible input credit" icon={ReceiptText} tone="green" />
        <MetricCard label="Bank Verified" value={`${Math.round((bankMapped.length / Math.max(vendors.length, 1)) * 100)}%`} helper="IFSC and account mapped" icon={Landmark} tone="purple" />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-slate-100 bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <button
              type="button"
              onClick={closeForm}
              className="absolute right-8 top-8 rounded-full p-2 text-slate-400 transition-all hover:bg-slate-50 hover:text-primary"
            >
              <X size={24} />
            </button>

            {successMsg ? (
              <div className="space-y-4 py-20 text-center animate-in zoom-in-95">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="text-2xl font-black text-primary">{successMsg}</h3>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Expense master, tax setup, and payout metadata are updated.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                <div className="flex items-end justify-between">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight text-primary">{editingId ? "Edit Vendor" : "Vendor Registration"}</h3>
                    <p className="mt-1 text-sm font-medium text-slate-500">Setup vendor profile, tax settings, recurring commitment, and banking details.</p>
                  </div>
                  <StatusBadge tone="blue">Step 2 of 17</StatusBadge>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                  <div className="space-y-8 lg:col-span-2">
                    <Panel title="Basic Details" description="Primary identification and contact info.">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Field label="Vendor Name" placeholder="Amazon Web Services" required register={register("vendorName")} error={errors.vendorName?.message} />
                        <Field label="Contact Person" placeholder="Account Manager Name" register={register("contactPerson")} error={errors.contactPerson?.message} />
                        <Field label="Email" type="email" placeholder="billing@vendor.com" register={register("email")} error={errors.email?.message} />
                        <Field label="Mobile" placeholder="9876543210" register={register("mobile")} error={errors.mobile?.message} />
                        <Field label="Category" options={[...vendorCategories]} required register={register("category")} error={errors.category?.message} />
                        <Field label="Status" options={[...vendorStatuses]} required register={register("status")} error={errors.status?.message} />
                        <Field label="Monthly Commitment" type="number" placeholder="25000" register={register("monthlyCommitment")} error={errors.monthlyCommitment?.message} />
                      </div>
                    </Panel>

                    <Panel title="Tax & Compliance" description="GST, PAN and TDS settings for payout accuracy.">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Field label="GSTIN" placeholder="29AAICA3918J1ZK" register={register("gstin")} error={errors.gstin?.message} />
                        <Field label="PAN Number" placeholder="AAICA3918J" register={register("pan")} error={errors.pan?.message} />
                        <Field label="TDS Applicable" options={[...tdsOptions]} register={register("tds")} error={errors.tds?.message} />
                      </div>
                    </Panel>
                  </div>

                  <div className="space-y-8">
                    <Panel title="Bank Details" description="Required for automated payouts.">
                      <div className="space-y-6">
                        <Field label="Bank Name" placeholder="HDFC Bank" register={register("bankName")} error={errors.bankName?.message} />
                        <Field label="Account Number" placeholder="50200012345678" register={register("accountNo")} error={errors.accountNo?.message} />
                        <Field label="IFSC Code" placeholder="HDFC0001234" register={register("ifsc")} error={errors.ifsc?.message} />
                        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                          <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-blue-400">Security Check</p>
                          <p className="text-xs font-bold leading-5 text-blue-700">Bank details are masked in the register and duplicate accounts are blocked before payout setup.</p>
                        </div>
                      </div>
                    </Panel>
                  </div>
                </div>

                <Field label="Full Address" placeholder="Company registered address" multiline register={register("address")} error={errors.address?.message} />

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
                  <ActionButton label="Cancel" variant="outline" onClick={closeForm} />
                  <ActionButton label={editingId ? "Update Vendor Record" : "Save Vendor Record"} variant="accent" type="submit" />
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Panel
        title="Vendor Directory"
        description="Mapped vendors are used in expenses, GST input calculation, vendor TDS, budget consumption, and payouts."
        actions={<StatusBadge tone="blue">{filteredVendors.length} Vendors Found</StatusBadge>}
      >
        <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_220px]">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search vendor, GSTIN, PAN, email, category..."
            className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none transition-all placeholder:text-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            {["All", ...vendorStatuses].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            {["All", ...vendorCategories].map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>

        <DataTable columns={["Vendor", "Category", "GSTIN / PAN", "TDS", "Monthly", "Bank", "Status", "Actions"]}>
          {filteredVendors.map((vendor) => (
            <tr key={vendor.id} className="group text-sm transition-colors hover:bg-slate-50">
              <td className="px-4 py-4">
                <p className="font-black text-primary">{vendor.vendorName}</p>
                <p className="text-xs font-semibold text-slate-500">{vendor.id} - {vendor.contactPerson || "No contact mapped"}</p>
                <p className="text-[11px] font-semibold text-slate-400">{vendor.email || "No email"} | {vendor.mobile || "No mobile"}</p>
              </td>
              <td className="px-4 py-4 font-semibold text-slate-600">{vendor.category}</td>
              <td className="px-4 py-4 font-mono text-[11px] font-semibold text-slate-600">
                <p>{vendor.gstin || "N/A"}</p>
                <p className="text-slate-400">{vendor.pan || "N/A"}</p>
              </td>
              <td className="px-4 py-4 font-black text-primary">{tdsRate(vendor.tds)}</td>
              <td className="px-4 py-4 font-black text-primary">{money(vendor.monthlyCommitment)}</td>
              <td className="px-4 py-4">
                <p className="font-bold text-primary">{vendor.bankName || "Not mapped"}</p>
                <p className="text-[11px] font-semibold text-slate-400">{maskAccount(vendor.accountNo)} {vendor.ifsc ? `| ${vendor.ifsc}` : ""}</p>
              </td>
              <td className="px-4 py-4">
                <StatusBadge tone={vendor.status === "Active" ? "green" : vendor.status === "Blocked" || vendor.status === "Archived" ? "red" : "amber"}>
                  {vendor.status}
                </StatusBadge>
              </td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => openEditForm(vendor)} className="rounded-lg border border-border p-2 text-slate-500 hover:bg-white hover:text-primary" title="Edit vendor">
                    <Edit3 size={15} />
                  </button>
                  {vendor.status === "Archived" ? (
                    <button type="button" onClick={() => updateStatus(vendor.id, "Active")} className="rounded-lg border border-border p-2 text-slate-500 hover:bg-white hover:text-green-600" title="Restore vendor">
                      <RotateCcw size={15} />
                    </button>
                  ) : (
                    <button type="button" onClick={() => updateStatus(vendor.id, "Archived")} className="rounded-lg border border-border p-2 text-slate-500 hover:bg-white hover:text-red-600" title="Archive vendor">
                      <Archive size={15} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </DataTable>

        <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 text-emerald-600" size={18} />
            <p className="text-xs font-bold leading-5 text-emerald-700">
              Vendor records now keep API-ready tax, recurring commitment, and masked bank metadata for expenses, GST input, TDS, budget checks, approvals, and payout workflows.
            </p>
          </div>
        </div>
      </Panel>
    </AccountingPage>
  );
}
