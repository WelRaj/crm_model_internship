"use client";

import { Download, Landmark, Plus, ReceiptText, ShieldCheck, Truck, WalletCards } from "lucide-react";
import { AccountingPage, ActionButton, DataTable, Field, MetricCard, Panel, StatusBadge } from "./AccountingComponents";

const vendors = [
  { id: "VEN-001", name: "Amazon Web Services India", category: "Cloud Hosting", gstin: "29AAICA3918J1ZK", tds: "2%", monthly: "INR 2,45,000", status: "Active" },
  { id: "VEN-002", name: "Razorpay Software Pvt Ltd", category: "Payment Gateway", gstin: "29AAICR2714C1Z7", tds: "2%", monthly: "INR 38,000", status: "Active" },
  { id: "VEN-003", name: "Airtel Business", category: "Internet", gstin: "07AAACB2894G1ZR", tds: "0%", monthly: "INR 18,500", status: "Active" },
  { id: "VEN-004", name: "TechDepot Hardware", category: "Hardware", gstin: "06AAFFT3344G1Z1", tds: "1%", monthly: "INR 0", status: "Review" },
];

export default function Step2Vendors() {
  return (
    <AccountingPage
      title="Vendor Master"
      description="Maintain vendor, bank, GST, PAN, recurring subscription, and TDS setup for all company expenses."
      icon={Truck}
      badge="Expense foundation"
      actions={
        <>
          <ActionButton icon={Download} label="Export Vendors" variant="outline" />
          <ActionButton icon={Plus} label="New Vendor" variant="accent" />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Vendors" value="64" helper="18 recurring vendors" icon={Truck} tone="blue" />
        <MetricCard label="Monthly Commitments" value="INR 6.8L" helper="Subscriptions and utilities" icon={WalletCards} tone="amber" />
        <MetricCard label="GST Input Vendors" value="41" helper="Eligible input credit" icon={ReceiptText} tone="green" />
        <MetricCard label="Bank Verified" value="88%" helper="IFSC and account mapped" icon={Landmark} tone="purple" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Vendor Registration" description="Use this master while creating expenses, vendor bills, purchase entries, and TDS records.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Vendor ID" value="VEN-AUTO-005" required />
            <Field label="Status" value="Active" options={["Active", "Inactive", "Review", "Blocked"]} required />
            <Field label="Vendor Name" placeholder="Legal vendor name" required />
            <Field label="Contact Person" placeholder="Vendor account manager" />
            <Field label="Mobile" placeholder="+91 98765 43210" />
            <Field label="Email" type="email" placeholder="billing@vendor.com" />
            <Field label="GSTIN" placeholder="29ABCDE1234F1Z5" />
            <Field label="PAN" placeholder="ABCDE1234F" />
            <Field label="Vendor Category" value="Software Licenses" options={["Software Licenses", "Cloud Hosting", "Hardware", "Internet", "Rent", "Consultant", "Marketing", "Travel"]} />
            <Field label="TDS Applicable" value="Yes - 2%" options={["No", "Yes - 1%", "Yes - 2%", "Yes - 10%"]} />
            <div className="md:col-span-2">
              <Field label="Address" placeholder="Registered billing address" multiline />
            </div>
          </div>
        </Panel>

        <Panel title="Bank & Compliance" description="Practical checks before finance allows payment release.">
          <div className="grid grid-cols-1 gap-4">
            <Field label="Bank Name" value="HDFC Bank" />
            <Field label="Account Number" value="50200012345678" />
            <Field label="IFSC Code" value="HDFC0001234" />
            <Field label="UPI ID" placeholder="vendor@bank" />
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-green-700" size={20} />
                <p className="text-sm font-black text-green-800">Payment hold if GSTIN, PAN, or bank details are missing for high value bills.</p>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Vendor Directory" description="Mapped vendors are used in expenses, GST input calculation, vendor TDS, and budget consumption.">
        <DataTable columns={["Vendor", "Category", "GSTIN", "TDS", "Monthly Spend", "Status"]}>
          {vendors.map((vendor) => (
            <tr key={vendor.id} className="text-sm">
              <td className="px-4 py-4">
                <p className="font-black text-primary">{vendor.name}</p>
                <p className="text-xs font-semibold text-slate-500">{vendor.id}</p>
              </td>
              <td className="px-4 py-4 font-semibold text-slate-600">{vendor.category}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{vendor.gstin}</td>
              <td className="px-4 py-4 font-black text-primary">{vendor.tds}</td>
              <td className="px-4 py-4 font-black text-primary">{vendor.monthly}</td>
              <td className="px-4 py-4">
                <StatusBadge tone={vendor.status === "Active" ? "green" : "amber"}>{vendor.status}</StatusBadge>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}
