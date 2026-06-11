"use client";

import { Calculator, Download, FileCheck2, Landmark, Percent, ReceiptText, Upload, Wallet } from "lucide-react";
import { AccountingPage, ActionButton, DataTable, Field, MetricCard, Panel, StatusBadge } from "./AccountingComponents";

const tdsRows = [
  { ref: "INV-2026-088", party: "Nexa Retail Cloud", type: "Client TDS", rate: "10%", amount: "INR 1,27,500", certificate: "Pending", status: "Adjusted" },
  { ref: "INV-2026-083", party: "Bluebird Logistics", type: "Client TDS", rate: "10%", amount: "INR 32,000", certificate: "Received", status: "Closed" },
  { ref: "VEN-001", party: "Amazon Web Services India", type: "Vendor TDS", rate: "2%", amount: "INR 4,900", certificate: "Generated", status: "Payable" },
  { ref: "VEN-004", party: "TechDepot Hardware", type: "Vendor TDS", rate: "1%", amount: "INR 1,120", certificate: "Pending", status: "Review" },
];

export default function Step12TDS() {
  return (
    <AccountingPage
      title="TDS Management"
      description="Track client TDS deductions, vendor TDS liability, certificate numbers, and correct outstanding calculations."
      icon={Calculator}
      badge="Tax deduction"
      actions={
        <>
          <ActionButton icon={Upload} label="Upload Certificate" variant="outline" />
          <ActionButton icon={Download} label="TDS Report" variant="accent" />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Client TDS" value="INR 2.18L" helper="Deducted by clients" icon={ReceiptText} tone="amber" />
        <MetricCard label="Vendor TDS" value="INR 42.7K" helper="To deposit" icon={Landmark} tone="blue" />
        <MetricCard label="Certificates Pending" value="08" helper="16A follow-up needed" icon={FileCheck2} tone="red" />
        <MetricCard label="Outstanding Adjusted" value="INR 7.4L" helper="Avoid false pending" icon={Wallet} tone="green" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Client TDS" description="Client may pay net amount after TDS. Outstanding should not show wrong pending if TDS is expected.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Invoice ID" value="INV-2026-088" required />
            <Field label="TDS Applicable" value="Yes" options={["Yes", "No"]} />
            <Field label="TDS %" value="10" options={["1", "2", "5", "10"]} />
            <Field label="TDS Amount" type="number" value="127500" />
            <Field label="Certificate Number" placeholder="16A certificate no." />
            <Field label="Certificate Status" value="Pending" options={["Pending", "Received", "Mismatch", "Not Required"]} />
          </div>
        </Panel>

        <Panel title="Vendor TDS" description="Vendor TDS applies on eligible professional, contractor, and service payments.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Vendor ID" value="VEN-001" required />
            <Field label="Vendor Name" value="Amazon Web Services India" />
            <Field label="TDS %" value="2" options={["0", "1", "2", "10"]} />
            <Field label="TDS Amount" type="number" value="4900" />
            <Field label="Deposit Month" value="June 2026" />
            <Field label="Status" value="Payable" options={["Payable", "Deposited", "Certificate Generated", "Review"]} />
          </div>
        </Panel>
      </div>

      <Panel title="TDS Register" description="Tax deduction records connected to invoices, vendors, and certificates.">
        <DataTable columns={["Reference", "Party", "Type", "Rate", "Amount", "Certificate", "Status"]}>
          {tdsRows.map((row) => (
            <tr key={`${row.ref}-${row.type}`} className="text-sm">
              <td className="px-4 py-4 font-black text-primary">{row.ref}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{row.party}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{row.type}</td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2 font-black text-primary">
                  <Percent size={15} />
                  {row.rate}
                </div>
              </td>
              <td className="px-4 py-4 font-black text-primary">{row.amount}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{row.certificate}</td>
              <td className="px-4 py-4">
                <StatusBadge tone={row.status === "Closed" || row.status === "Adjusted" ? "green" : row.status === "Review" ? "red" : "amber"}>{row.status}</StatusBadge>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}
