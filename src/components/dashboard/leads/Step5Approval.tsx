"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Shield, ThumbsDown, ThumbsUp, UserCheck } from "lucide-react";
import { ActionButton, Field, Panel, StatusBadge } from "../accounting/AccountingComponents";
import type { LeadStepProps } from "./leadTypes";

const approvalSchema = z.object({
  decision: z.string().optional(),
  reviewerRole: z.string().optional(),
  comments: z.string().optional(),
});

type ApprovalFormData = z.input<typeof approvalSchema>;

type ApprovalCard = {
  role: string;
  status: "Approved" | "Pending";
  name: string;
  date: string;
  remarks: string;
};

const approvals: ApprovalCard[] = [
  { role: "Sales Manager", status: "Approved", name: "Vikram Rathore", date: "2024-03-16", remarks: "Deal looks solid, proceed with negotiation." },
  { role: "Senior Manager / Director", status: "Pending", name: "-", date: "-", remarks: "" },
];

type Step5Props = Pick<LeadStepProps, "data" | "updateData" | "onNext" | "onPrev">;

export default function Step5Approval({ updateData, onNext, onPrev }: Step5Props) {
  const [decision, setDecision] = useState<"Approve" | "Reject">("Approve");

  const { register, handleSubmit } = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      reviewerRole: "Finance Manager",
      decision: "Approve",
    },
  });

  const onSubmit = (values: ApprovalFormData) => {
    updateData({ ...values, decision });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {approvals.map((app) => (
          <div key={app.role} className="relative overflow-hidden rounded-[2rem] border border-border bg-white p-6 shadow-sm group">
            <div className={`absolute left-0 top-0 h-full w-1.5 ${app.status === "Approved" ? "bg-emerald-500" : "bg-amber-500"}`} />
            <div className="mb-6 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${app.status === "Approved" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                  {app.status === "Approved" ? <UserCheck size={22} /> : <Shield size={22} />}
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{app.role}</h4>
                  <p className="mt-1 text-sm font-black text-primary">{app.name !== "-" ? app.name : "Awaiting Review"}</p>
                </div>
              </div>
              <StatusBadge tone={app.status === "Approved" ? "green" : "amber"}>{app.status}</StatusBadge>
            </div>

            {app.remarks ? (
              <div className="mb-2 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-bold italic text-slate-500">&quot;{app.remarks}&quot;</p>
              </div>
            ) : null}
            <p className="mt-4 text-right text-[10px] font-black text-slate-400">{app.date}</p>
          </div>
        ))}
      </div>

      <Panel title="Management Review & Authorization" description="Review proposal financials and previous follow-ups to approve this deal.">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label="Reviewer Designation" options={["Finance Manager", "Director", "Managing Partner"]} register={register("reviewerRole")} />
            <Field label="Final Decision" options={["Approve", "Reject", "Need Revision"]} register={register("decision")} onChange={(e) => setDecision(e.target.value as "Approve" | "Reject")} />
          </div>
            <Field label="Review Audit Comments" multiline placeholder="Describe the reason for your decision..." register={register("comments")} />
        </div>
      </Panel>

      <div className="flex justify-between border-t border-slate-50 pt-8">
        <ActionButton label="Back" variant="outline" icon={ArrowLeft} onClick={onPrev} />
        <div className="flex gap-3">
          <button type="submit" onClick={() => setDecision("Reject")} className="flex h-11 items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-6 text-xs font-black uppercase tracking-widest text-red-600 transition-all hover:bg-red-100">
            <ThumbsDown size={16} /> Reject
          </button>
          <ActionButton type="submit" label="Approve & Next" icon={ThumbsUp} variant="accent" />
        </div>
      </div>
    </form>
  );
}
