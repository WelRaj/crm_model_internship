"use client";

import { BellRing, Mail, MessageCircle, PhoneCall, Send, TimerReset, TriangleAlert, Users } from "lucide-react";
import { AccountingPage, ActionButton, DataTable, Field, MetricCard, Panel, StatusBadge } from "./AccountingComponents";

const reminders = [
  { invoice: "INV-2026-083", client: "Bluebird Logistics", due: "05 Jun 2026", rule: "7 days overdue", via: "Email + WhatsApp", sentTo: "accounts@bluebird.in", status: "Escalated" },
  { invoice: "INV-2026-088", client: "Nexa Retail Cloud", due: "21 Jun 2026", rule: "7 days before due", via: "Email", sentTo: "finance@nexa.com", status: "Scheduled" },
  { invoice: "INV-2026-090", client: "Apex Finserve Pvt Ltd", due: "26 Jun 2026", rule: "On due date", via: "Email + SMS", sentTo: "rohit@apexfin.com", status: "Ready" },
  { invoice: "INV-2026-071", client: "KraftEdge Export LLP", due: "20 May 2026", rule: "30 days overdue", via: "Director Escalation", sentTo: "director@company.com", status: "Blocked" },
];

export default function Step6Reminders() {
  return (
    <AccountingPage
      title="Payment Reminder System"
      description="Automate polite reminders, overdue escalation, and collection follow-up notes for better cash flow."
      icon={BellRing}
      badge="Cash flow control"
      actions={
        <>
          <ActionButton icon={Send} label="Send Manual Reminder" variant="outline" />
          <ActionButton icon={BellRing} label="Configure Rules" variant="accent" />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Due Today" value="06" helper="Requires same-day nudge" icon={TimerReset} tone="amber" />
        <MetricCard label="Auto Sent" value="42" helper="This month" icon={Mail} tone="green" />
        <MetricCard label="Overdue" value="INR 9.1L" helper="12 open invoices" icon={TriangleAlert} tone="red" />
        <MetricCard label="Escalations" value="04" helper="Manager or director looped" icon={Users} tone="purple" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Reminder Rule Setup" description="Rules run against due date and payment status. Keep templates professional and audit logged.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Reminder Date" type="date" value="2026-06-14" />
            <Field label="Reminder Type" value="7 Days Before Due" options={["7 Days Before Due", "On Due Date", "7 Days Overdue", "15 Days Overdue", "30 Days Overdue"]} />
            <Field label="Sent Via" value="Email + WhatsApp" options={["Email", "WhatsApp", "SMS", "Call Task", "Email + WhatsApp", "Director Escalation"]} />
            <Field label="Status" value="Scheduled" options={["Draft", "Scheduled", "Sent", "Failed", "Escalated", "Cancelled"]} />
            <Field label="Sent To" value="accounts@client.com" />
            <Field label="CC" value="sales.owner@company.com" />
            <div className="md:col-span-2">
              <Field label="Remarks" value="Auto reminder for pending milestone payment. Include invoice PDF and payment link." multiline />
            </div>
          </div>
        </Panel>

        <Panel title="Communication Channels" description="Use the right channel based on invoice age and client relationship.">
          <div className="space-y-4">
            {[
              [Mail, "Email", "Official invoice reminder with PDF, due date, and payment links.", "blue"],
              [MessageCircle, "WhatsApp", "Quick finance follow-up for Indian SMB clients.", "green"],
              [PhoneCall, "Call Task", "Create task for account manager when overdue crosses 15 days.", "amber"],
              [TriangleAlert, "Escalation", "Loop finance manager or director after 30 days overdue.", "red"],
            ].map(([Icon, title, text, tone]) => {
              const ChannelIcon = Icon as typeof Mail;
              return (
                <div key={title as string} className="flex gap-3 rounded-xl border border-border bg-slate-50 p-4">
                  <ChannelIcon className="mt-1 text-primary" size={20} />
                  <div>
                    <StatusBadge tone={tone as "blue" | "green" | "amber" | "red"}>{title as string}</StatusBadge>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{text as string}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Panel title="Reminder Queue" description="Every sent reminder should be linked with invoice, client, rule, and delivery status.">
        <DataTable columns={["Invoice", "Client", "Due Date", "Rule", "Via", "Sent To", "Status"]}>
          {reminders.map((reminder) => (
            <tr key={`${reminder.invoice}-${reminder.rule}`} className="text-sm">
              <td className="px-4 py-4 font-black text-primary">{reminder.invoice}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{reminder.client}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{reminder.due}</td>
              <td className="px-4 py-4 font-black text-primary">{reminder.rule}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{reminder.via}</td>
              <td className="px-4 py-4 font-semibold text-slate-600">{reminder.sentTo}</td>
              <td className="px-4 py-4">
                <StatusBadge tone={reminder.status === "Escalated" || reminder.status === "Blocked" ? "red" : reminder.status === "Scheduled" ? "blue" : "amber"}>
                  {reminder.status}
                </StatusBadge>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </AccountingPage>
  );
}
