"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Archive, Download, Edit3, Plus, RotateCcw, Search, ShieldCheck, Users,
  Wallet, AlertTriangle, X, CheckCircle2,
} from "lucide-react";
import {
  AccountingPage, ActionButton, DataTable, Field,
  MetricCard, Panel, StatusBadge,
} from "./AccountingComponents";

const INR = "\u20b9";

const clientStatuses = ["Active", "Inactive", "On Hold", "Blacklisted", "Archived"] as const;
const paymentTerms = ["100% Advance", "50% Advance", "Net 7", "Net 15", "Net 30", "Milestone"] as const;
const currencies = ["INR", "USD", "AED", "GBP", "EUR"] as const;

const clientSchema = z.object({
  companyName: z.string().trim().min(3, "Company name is too short"),
  contactPerson: z.string().trim().min(3, "Contact person name is required"),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  mobile: z.string().trim().regex(/^[0-9]{10}$/, "Enter a valid 10-digit mobile number"),
  gstin: z.string().trim().toUpperCase().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format"),
  pan: z.string().trim().toUpperCase().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format"),
  status: z.enum(clientStatuses),
  terms: z.enum(paymentTerms),
  address: z.string().trim().min(10, "Full billing address is required"),
  currency: z.enum(currencies),
  creditLimit: z.coerce.number().min(0, "Credit limit cannot be negative"),
});

type ClientFormInput = z.input<typeof clientSchema>;
type ClientFormData = z.output<typeof clientSchema>;

type ClientStatus = typeof clientStatuses[number];

type ClientRecord = {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  mobile: string;
  gstin: string;
  pan: string;
  status: ClientStatus;
  terms: string;
  address: string;
  currency: string;
  outstandingAmount: number;
  creditLimit: number;
  createdAt: string;
  updatedAt: string;
};

const initialClients: ClientRecord[] = [
  {
    id: "CL-24001",
    companyName: "Apex Finserve Pvt Ltd",
    contactPerson: "Rohit Mehta",
    email: "accounts@apexfinserve.com",
    mobile: "9876543210",
    gstin: "27AAHCA8123D1Z6",
    pan: "AAHCA8123D",
    terms: "Net 15",
    status: "Active",
    address: "Business Center, Andheri East, Mumbai, Maharashtra - 400069",
    currency: "INR",
    outstandingAmount: 480000,
    creditLimit: 750000,
    createdAt: "2026-04-03T10:30:00.000Z",
    updatedAt: "2026-06-18T10:30:00.000Z",
  },
  {
    id: "CL-24002",
    companyName: "Nexa Retail Cloud",
    contactPerson: "Priya Nair",
    email: "finance@nexaretail.cloud",
    mobile: "9988776655",
    gstin: "29AAECN4471B1ZW",
    pan: "AAECN4471B",
    terms: "50% Advance",
    status: "Active",
    address: "Indiranagar, Bengaluru, Karnataka - 560038",
    currency: "INR",
    outstandingAmount: 0,
    creditLimit: 500000,
    createdAt: "2026-04-11T10:30:00.000Z",
    updatedAt: "2026-06-20T10:30:00.000Z",
  },
  {
    id: "CL-24003",
    companyName: "Bluebird Logistics",
    contactPerson: "Amit Soni",
    email: "amit@bluebirdlogistics.in",
    mobile: "9123456789",
    gstin: "06AAGCB9122K1ZP",
    pan: "AAGCB9122K",
    terms: "Milestone",
    status: "On Hold",
    address: "Sector 44, Gurugram, Haryana - 122003",
    currency: "INR",
    outstandingAmount: 125000,
    creditLimit: 300000,
    createdAt: "2026-05-05T10:30:00.000Z",
    updatedAt: "2026-06-12T10:30:00.000Z",
  },
  {
    id: "CL-24004",
    companyName: "KraftEdge Export LLP",
    contactPerson: "Neha Jain",
    email: "accounts@kraftedgeexports.com",
    mobile: "9012345678",
    gstin: "07AAIFK2210M1Z4",
    pan: "AAIFK2210M",
    terms: "Net 30",
    status: "Blacklisted",
    address: "Karol Bagh, New Delhi, Delhi - 110005",
    currency: "INR",
    outstandingAmount: 78500,
    creditLimit: 100000,
    createdAt: "2026-05-17T10:30:00.000Z",
    updatedAt: "2026-06-10T10:30:00.000Z",
  },
];

const emptyClientDefaults: ClientFormInput = {
  companyName: "",
  contactPerson: "",
  email: "",
  mobile: "",
  gstin: "",
  pan: "",
  status: "Active",
  terms: "Net 15",
  address: "",
  currency: "INR",
  creditLimit: 0,
};

function money(value: number, currency = "INR") {
  const symbol = currency === "INR" ? INR : currency;
  return `${symbol} ${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function exportCsv(filename: string, rows: ClientRecord[]) {
  const headers = ["Client ID", "Company", "Contact", "Email", "Mobile", "GSTIN", "PAN", "Status", "Terms", "Currency", "Outstanding", "Credit Limit", "Address"];
  const csvRows = rows.map((client) => [
    client.id,
    client.companyName,
    client.contactPerson,
    client.email,
    client.mobile,
    client.gstin,
    client.pan,
    client.status,
    client.terms,
    client.currency,
    String(client.outstandingAmount),
    String(client.creditLimit),
    client.address,
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

export default function Step1Clients() {
  const [clients, setClients] = useState<ClientRecord[]>(initialClients);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [gstCheckMessage, setGstCheckMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ClientFormInput, unknown, ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: emptyClientDefaults,
  });

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const haystack = `${client.id} ${client.companyName} ${client.contactPerson} ${client.email} ${client.mobile} ${client.gstin} ${client.pan}`.toLowerCase();
      const matchesSearch = haystack.includes(searchTerm.toLowerCase().trim());
      const matchesStatus = statusFilter === "All" || client.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, searchTerm, statusFilter]);

  const activeClients = clients.filter((client) => client.status === "Active");
  const verifiedClients = clients.filter((client) => client.gstin && client.pan);
  const riskClients = clients.filter((client) => client.status === "Blacklisted" || client.status === "On Hold");
  const totalReceivable = clients.reduce((sum, client) => sum + client.outstandingAmount, 0);

  const openCreateForm = () => {
    setEditingId(null);
    setSuccessMsg("");
    reset(emptyClientDefaults);
    setShowForm(true);
  };

  const openEditForm = (client: ClientRecord) => {
    setEditingId(client.id);
    setSuccessMsg("");
    reset({
      companyName: client.companyName,
      contactPerson: client.contactPerson,
      email: client.email,
      mobile: client.mobile,
      gstin: client.gstin,
      pan: client.pan,
      status: client.status,
      terms: client.terms as ClientFormInput["terms"],
      address: client.address,
      currency: client.currency as ClientFormInput["currency"],
      creditLimit: client.creditLimit,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setSuccessMsg("");
    reset(emptyClientDefaults);
  };

  const findDuplicate = (field: keyof Pick<ClientRecord, "gstin" | "pan" | "email" | "mobile">, value: string) => {
    return clients.find((client) => client.id !== editingId && normalize(client[field]) === normalize(value));
  };

  const onSubmit = (data: ClientFormData) => {
    const duplicateChecks: Array<[keyof Pick<ClientRecord, "gstin" | "pan" | "email" | "mobile">, keyof ClientFormData, string]> = [
      ["gstin", "gstin", "GSTIN already exists in Client Master"],
      ["pan", "pan", "PAN already exists in Client Master"],
      ["email", "email", "Email already exists in Client Master"],
      ["mobile", "mobile", "Mobile already exists in Client Master"],
    ];
    const duplicate = duplicateChecks.find(([recordKey]) => findDuplicate(recordKey, data[recordKey]));
    if (duplicate) {
      setError(duplicate[1], { type: "manual", message: duplicate[2] });
      return;
    }

    const now = new Date().toISOString();
    if (editingId) {
      setClients((current) => current.map((client) => (
        client.id === editingId
          ? { ...client, ...data, updatedAt: now }
          : client
      )));
      setSuccessMsg("Client updated successfully");
    } else {
      const sequence = clients.length + 1;
      const newClient: ClientRecord = {
        id: `CL-${String(24000 + sequence).padStart(5, "0")}`,
        companyName: data.companyName,
        contactPerson: data.contactPerson,
        email: data.email,
        mobile: data.mobile,
        gstin: data.gstin,
        pan: data.pan,
        terms: data.terms,
        status: data.status,
        address: data.address,
        currency: data.currency,
        outstandingAmount: 0,
        creditLimit: data.creditLimit,
        createdAt: now,
        updatedAt: now,
      };
      setClients((current) => [newClient, ...current]);
      setSuccessMsg("Client registered successfully");
    }

    setTimeout(closeForm, 900);
  };

  const updateStatus = (clientId: string, status: ClientStatus) => {
    setClients((current) => current.map((client) => (
      client.id === clientId ? { ...client, status, updatedAt: new Date().toISOString() } : client
    )));
  };

  const checkGstinSearch = () => {
    const query = searchTerm.trim().toUpperCase();
    if (!query) {
      setGstCheckMessage("Enter GSTIN, PAN, email, mobile, or client name in search first.");
      return;
    }
    const match = clients.find((client) => (
      client.gstin === query || client.pan === query || client.companyName.toUpperCase().includes(query)
    ));
    setGstCheckMessage(match ? `${match.companyName} is already registered as ${match.id}.` : "No matching client found in local master.");
  };

  return (
    <AccountingPage
      title="Client Master"
      description="Central client record used by quotations, invoices, payments, TDS certificates, reminders, and project billing."
      icon={Users}
      badge="Single source of truth"
      actions={
        <>
          <ActionButton icon={Search} label="Search GSTIN" variant="outline" onClick={checkGstinSearch} />
          <ActionButton icon={Download} label="Export Clients" variant="outline" onClick={() => exportCsv("client-master.csv", filteredClients)} />
          <ActionButton icon={Plus} label="New Client" variant="accent" onClick={openCreateForm} />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Clients" value={String(activeClients.length)} helper={`${clients.length} total records`} icon={Users} tone="blue" />
        <MetricCard label="Receivables" value={money(totalReceivable)} helper="Open approved invoices" icon={Wallet} tone="amber" />
        <MetricCard label="GST Verified" value={`${Math.round((verifiedClients.length / Math.max(clients.length, 1)) * 100)}%`} helper="GSTIN and PAN mapped" icon={ShieldCheck} tone="green" />
        <MetricCard label="Credit Risk" value={String(riskClients.length)} helper="Hold or blacklist status" icon={AlertTriangle} tone="red" />
      </div>

      {gstCheckMessage ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700">
          {gstCheckMessage}
        </div>
      ) : null}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-slate-100 bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-300">
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
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Master record and backend-ready data shape are updated.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-primary">{editingId ? "Edit Client" : "Register New Client"}</h3>
                  <p className="mt-1 text-sm font-medium text-slate-500">Capture legal, contact, tax, and credit metadata before transactions are created.</p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <Field label="Company Name" placeholder="Apex Finserve Pvt Ltd" required register={register("companyName")} error={errors.companyName?.message} />
                  <Field label="Contact Person" placeholder="John Doe" required register={register("contactPerson")} error={errors.contactPerson?.message} />
                  <Field label="Email Address" type="email" placeholder="accounts@apex.com" required register={register("email")} error={errors.email?.message} />
                  <Field label="Mobile Number" placeholder="9876543210" required register={register("mobile")} error={errors.mobile?.message} />
                  <Field label="GSTIN" placeholder="27AAHCA8123D1Z6" required register={register("gstin")} error={errors.gstin?.message} />
                  <Field label="PAN Number" placeholder="AAHCA8123D" required register={register("pan")} error={errors.pan?.message} />
                  <Field label="Client Status" options={[...clientStatuses]} required register={register("status")} error={errors.status?.message} />
                  <Field label="Payment Terms" options={[...paymentTerms]} required register={register("terms")} error={errors.terms?.message} />
                  <Field label="Currency" options={[...currencies]} register={register("currency")} error={errors.currency?.message} />
                  <Field label="Credit Limit" type="number" placeholder="500000" register={register("creditLimit")} error={errors.creditLimit?.message} />
                </div>

                <Field label="Billing Address" placeholder="123, Business Center, Mumbai, Maharashtra - 400001" multiline required register={register("address")} error={errors.address?.message} />

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <ActionButton label="Cancel" variant="outline" onClick={closeForm} />
                  <ActionButton label={editingId ? "Update Client Record" : "Create Client Record"} variant="accent" type="submit" />
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Panel
        title="Client Ledger"
        description="Finance team can scan GST status, default terms, receivables, and credit exposure before creating documents."
        actions={<StatusBadge tone="green">{filteredClients.length} Records Found</StatusBadge>}
      >
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search client, GSTIN, PAN, email, mobile..."
            className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none transition-all placeholder:text-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            {["All", ...clientStatuses].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>

        <DataTable columns={["Client", "GSTIN / PAN", "Payment Terms", "Credit", "Outstanding", "Status", "Actions"]}>
          {filteredClients.map((client) => (
            <tr key={client.id} className="group text-sm transition-colors hover:bg-slate-50">
              <td className="px-4 py-4">
                <p className="font-black text-primary">{client.companyName}</p>
                <p className="text-xs font-semibold text-slate-500">{client.id} - {client.contactPerson}</p>
                <p className="text-[11px] font-semibold text-slate-400">{client.email} | {client.mobile}</p>
              </td>
              <td className="px-4 py-4 font-mono text-[11px] font-semibold text-slate-600">
                <p>{client.gstin}</p>
                <p className="text-slate-400">{client.pan}</p>
              </td>
              <td className="px-4 py-4 font-semibold text-slate-600">{client.terms}</td>
              <td className="px-4 py-4 font-black text-primary">{money(client.creditLimit, client.currency)}</td>
              <td className="px-4 py-4 font-black text-primary">{money(client.outstandingAmount, client.currency)}</td>
              <td className="px-4 py-4">
                <StatusBadge tone={client.status === "Active" ? "green" : client.status === "Blacklisted" || client.status === "Archived" ? "red" : "amber"}>
                  {client.status}
                </StatusBadge>
              </td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => openEditForm(client)} className="rounded-lg border border-border p-2 text-slate-500 hover:bg-white hover:text-primary" title="Edit client">
                    <Edit3 size={15} />
                  </button>
                  {client.status === "Archived" ? (
                    <button type="button" onClick={() => updateStatus(client.id, "Active")} className="rounded-lg border border-border p-2 text-slate-500 hover:bg-white hover:text-green-600" title="Restore client">
                      <RotateCcw size={15} />
                    </button>
                  ) : (
                    <button type="button" onClick={() => updateStatus(client.id, "Archived")} className="rounded-lg border border-border p-2 text-slate-500 hover:bg-white hover:text-red-600" title="Archive client">
                      <Archive size={15} />
                    </button>
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
