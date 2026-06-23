"use client";

import { useState, useEffect } from "react";
import { 
  Landmark, Building2, UserCircle, CreditCard, 
  Plus, Search, Download, Trash2, Edit2, X,
  ShieldCheck, CheckCircle2, Globe, Hash
} from "lucide-react";
import { 
  AccountingPage, ActionButton, DataTable, Field, 
  MetricCard, Panel, StatusBadge 
} from "./AccountingComponents";

interface BankAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  branch: string;
  accountType: "Current" | "Savings";
  status: "Active" | "Inactive";
}

const initialCompanyAccounts: BankAccount[] = [
  { id: "CB-001", accountName: "WelRaj Panel Services Pvt Ltd", accountNumber: "918273645544", bankName: "HDFC Bank", ifscCode: "HDFC0001234", branch: "Malviya Nagar, Jaipur", accountType: "Current", status: "Active" },
  { id: "CB-002", accountName: "WelRaj Panel Services Pvt Ltd", accountNumber: "112233445566", bankName: "ICICI Bank", ifscCode: "ICIC0009876", branch: "C-Scheme, Jaipur", accountType: "Current", status: "Active" },
];

const initialClientAccounts: BankAccount[] = [
  { id: "CL-881", accountName: "Nexa Retail Cloud", accountNumber: "50200012345678", bankName: "State Bank of India", ifscCode: "SBIN0004321", branch: "Whitefield, Bangalore", accountType: "Current", status: "Active" },
  { id: "CL-902", accountName: "Apex Finserve Pvt Ltd", accountNumber: "001294837261", bankName: "Axis Bank", ifscCode: "UTIB0000129", branch: "Gurugram Sector 44", accountType: "Current", status: "Active" },
];

export default function Step17BankDetails() {
  const [activeTab, setActiveTab] = useState<"company" | "clients">("company");
  const [companyAccounts, setCompanyAccounts] = useState(initialCompanyAccounts);
  const [clientAccounts, setClientAccounts] = useState(initialClientAccounts);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);

  // --- LocalStorage Sync ---
  useEffect(() => {
    const savedCompany = localStorage.getItem("crm_company_banks");
    const savedClients = localStorage.getItem("crm_client_banks");
    if (savedCompany) setCompanyAccounts(JSON.parse(savedCompany));
    if (savedClients) setClientAccounts(JSON.parse(savedClients));
  }, []);

  useEffect(() => {
    localStorage.setItem("crm_company_banks", JSON.stringify(companyAccounts));
  }, [companyAccounts]);

  useEffect(() => {
    localStorage.setItem("crm_client_banks", JSON.stringify(clientAccounts));
  }, [clientAccounts]);

  const [formData, setFormData] = useState<Partial<BankAccount>>({
    accountName: "",
    accountNumber: "",
    bankName: "",
    ifscCode: "",
    branch: "",
    accountType: "Current",
    status: "Active",
  });

  const handleSave = () => {
    if (isEditing) {
      if (activeTab === "company") {
        setCompanyAccounts(companyAccounts.map(a => a.id === isEditing ? { ...a, ...formData } as BankAccount : a));
      } else {
        setClientAccounts(clientAccounts.map(a => a.id === isEditing ? { ...a, ...formData } as BankAccount : a));
      }
    } else {
      const newAcc = { 
        ...formData, 
        id: activeTab === "company" ? `CB-0${companyAccounts.length + 1}` : `CL-0${clientAccounts.length + 1}` 
      } as BankAccount;
      if (activeTab === "company") setCompanyAccounts([newAcc, ...companyAccounts]);
      else setClientAccounts([newAcc, ...clientAccounts]);
    }
    setShowForm(false);
    setIsEditing(null);
    setFormData({ accountName: "", accountNumber: "", bankName: "", ifscCode: "", branch: "", accountType: "Current", status: "Active" });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to remove this bank account?")) {
      if (activeTab === "company") setCompanyAccounts(companyAccounts.filter(a => a.id !== id));
      else setClientAccounts(clientAccounts.filter(a => a.id !== id));
    }
  };

  const startEdit = (acc: BankAccount) => {
    setFormData(acc);
    setIsEditing(acc.id);
    setShowForm(true);
  };

  const currentAccounts = activeTab === "company" ? companyAccounts : clientAccounts;

  return (
    <AccountingPage
      title="Bank Account Management"
      description="Manage enterprise treasury and client disbursement accounts. Secure storage for settlement routing."
      icon={Landmark}
      badge="Treasury"
      actions={
        <>
          <ActionButton icon={Download} label="Export" variant="outline" />
          <ActionButton 
            icon={Plus} 
            label={activeTab === "company" ? "New Company Account" : "New Client Account"} 
            variant="accent" 
            onClick={() => setShowForm(true)} 
          />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 mb-8">
        <MetricCard label="Total Accounts" value={String(companyAccounts.length + clientAccounts.length)} helper="Company + Clients" icon={Building2} tone="blue" />
        <MetricCard label="Company Treasury" value={String(companyAccounts.length)} helper="Active internal accounts" icon={ShieldCheck} tone="green" />
        <MetricCard label="Client Entities" value={String(clientAccounts.length)} helper="Billing destination accounts" icon={UserCircle} tone="purple" />
      </div>

      <div className="flex gap-8 border-b border-slate-100 mb-8 overflow-x-auto no-scrollbar">
        {[
          { id: "company", label: "Company Bank Details", icon: Building2 },
          { id: "clients", label: "Client Bank Details", icon: UserCircle },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? "border-b-2 border-primary text-primary" : "text-slate-400 hover:text-slate-600"}`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <Panel 
        title={activeTab === "company" ? "Internal Treasury Accounts" : "External Client Accounts"} 
        description={`Secure database of bank details for ${activeTab === "company" ? "WelRaj Panel Services" : "development clients"}.`}
      >
        <div className="overflow-x-auto">
          <DataTable columns={["ID", "Account Name", "Account Number", "Bank & Branch", "IFSC Code", "Type", "Status", "Actions"]}>
            {currentAccounts.map((acc) => (
              <tr key={acc.id} className="hover:bg-slate-50 transition-colors group text-sm font-bold text-slate-700">
                <td className="px-4 py-6 font-black text-slate-400 text-xs">{acc.id}</td>
                <td className="px-4 py-6 font-black text-primary">{acc.accountName}</td>
                <td className="px-4 py-6 font-bold text-slate-600 font-mono tracking-wider">{acc.accountNumber}</td>
                <td className="px-4 py-6">
                  <div className="flex flex-col">
                    <span className="font-black text-primary">{acc.bankName}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{acc.branch}</span>
                  </div>
                </td>
                <td className="px-4 py-6 text-xs font-black text-indigo-600 uppercase tracking-widest">{acc.ifscCode}</td>
                <td className="px-4 py-6"><StatusBadge tone="blue">{acc.accountType}</StatusBadge></td>
                <td className="px-4 py-6"><StatusBadge tone={acc.status === "Active" ? "green" : "red"}>{acc.status}</StatusBadge></td>
                <td className="px-4 py-6">
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(acc)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={16}/></button>
                    <button onClick={() => handleDelete(acc.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      </Panel>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="w-full max-w-2xl bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-300">
              <button onClick={() => setShowForm(false)} className="absolute right-8 top-8 p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-all"><X size={24}/></button>
              <h3 className="text-3xl font-black text-primary tracking-tight">{isEditing ? "Edit Bank Details" : "Add Bank Details"}</h3>
              <p className="text-slate-500 font-medium mt-1">Configure {activeTab === "company" ? "treasury" : "client"} routing information.</p>
              
              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="md:col-span-2">
                   <Field label="Account Holder Name" value={formData.accountName} onChange={(e:any) => setFormData({...formData, accountName: e.target.value})} />
                 </div>
                 <Field label="Account Number" value={formData.accountNumber} onChange={(e:any) => setFormData({...formData, accountNumber: e.target.value})} />
                 <Field label="Bank Name" value={formData.bankName} onChange={(e:any) => setFormData({...formData, bankName: e.target.value})} />
                 <Field label="IFSC Code" value={formData.ifscCode} onChange={(e:any) => setFormData({...formData, ifscCode: e.target.value})} />
                 <Field label="Branch Name" value={formData.branch} onChange={(e:any) => setFormData({...formData, branch: e.target.value})} />
                 <Field label="Account Type" options={["Current", "Savings"]} onChange={(e:any) => setFormData({...formData, accountType: e.target.value as any})} />
                 <Field label="Account Status" options={["Active", "Inactive"]} onChange={(e:any) => setFormData({...formData, status: e.target.value as any})} />
              </div>

              <div className="mt-10 flex gap-3">
                 <button onClick={() => setShowForm(false)} className="flex-1 h-14 rounded-2xl border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">Cancel</button>
                 <button onClick={handleSave} className="flex-[2] h-14 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all">
                    {isEditing ? "Update Account" : "Save Account"}
                 </button>
              </div>
           </div>
        </div>
      )}
    </AccountingPage>
  );
}
