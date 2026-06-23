"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Trophy, XCircle, Send, Landmark } from "lucide-react";
import { ActionButton, Field } from "../accounting/AccountingComponents";
import type { LeadStepProps } from "./leadTypes";

const leadStatusSchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  expectedValue: z.coerce.number().optional(),
  finalValue: z.coerce.number().optional(),
  closeDate: z.string().optional(),
  lossReason: z.string().optional(),
  overallRemarks: z.string().optional(),
});

type LeadStatusFormData = z.infer<typeof leadStatusSchema>;

type Step6Props = Pick<LeadStepProps, "data" | "updateData" | "onPrev" | "onComplete">;

export default function Step6LeadStatus({ updateData, onPrev, onComplete }: Step6Props) {
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, control } = useForm<LeadStatusFormData>({
    resolver: zodResolver(leadStatusSchema),
    defaultValues: {
      status: "Negotiation",
      priority: "Medium",
      expectedValue: 0,
    },
  });

  const watchedStatus = useWatch({ control, name: "status" });

  const onSubmit = (values: LeadStatusFormData) => {
    setIsLoading(true);
    setTimeout(() => {
      updateData(values);
      onComplete?.();
      setIsLoading(false);
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Field label="Final Lead Status" options={["Interested", "Proposal Sent", "Negotiation", "Won", "Lost", "On Hold"]} register={register("status")} />
        <Field label="Priority Level" options={["Low", "Medium", "High", "Critical"]} register={register("priority")} />
        <Field label="Expected Deal Value" type="number" register={register("expectedValue")} />
      </div>

      {watchedStatus === "Won" ? (
        <div className="animate-in zoom-in-95 rounded-[2.5rem] border-2 border-dashed border-emerald-200 bg-emerald-50 p-8">
          <div className="mb-8 flex items-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-xl shadow-emerald-200">
              <Trophy size={28} />
            </div>
            <div>
              <h4 className="text-xl font-black tracking-tight text-emerald-900">Congratulations! Deal Secured</h4>
              <p className="mt-1 text-sm font-bold uppercase tracking-widest text-emerald-600">Ready for transition to projects module.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Field label="Final Closed Value" type="number" register={register("finalValue")} />
            <Field label="Actual Close Date" type="date" register={register("closeDate")} />
            <div className="md:col-span-1">
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-emerald-800">Agreement / MSA</label>
              <div className="flex h-11 items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4">
                <Landmark size={16} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase text-slate-400">Attach Signed Contract</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {watchedStatus === "Lost" ? (
        <div className="animate-in zoom-in-95 rounded-[2.5rem] border-2 border-dashed border-rose-200 bg-rose-50 p-8">
          <div className="mb-8 flex items-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-xl shadow-rose-200">
              <XCircle size={28} />
            </div>
            <div>
              <h4 className="text-xl font-black tracking-tight text-rose-900">Lead Marked as Lost</h4>
              <p className="mt-1 text-sm font-bold uppercase tracking-widest text-rose-600">Forensic reason required for sales ROI audit.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label="Reason for Loss" options={["Budget Constraint", "Lost to Competitor", "Internal Priority Change", "Timeline Mismatch"]} register={register("lossReason")} />
            <Field label="Competitor Name" placeholder="e.g. Acme Tech Solutions" />
          </div>
        </div>
      ) : null}

      <Field label="Closure Executive Remarks" multiline placeholder="Summarize the final outcome..." register={register("overallRemarks")} />

      <div className="flex justify-between border-t border-slate-50 pt-8">
        <ActionButton label="Back to Review" variant="outline" icon={ArrowLeft} onClick={onPrev} />
        <ActionButton type="submit" label={isLoading ? "Saving..." : "Finalize & Close Lead"} icon={Send} variant="accent" />
      </div>
    </form>
  );
}
