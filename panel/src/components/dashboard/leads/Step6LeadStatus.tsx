"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Trophy, XCircle, Send, Landmark } from "lucide-react";
import { ActionButton, Field } from "../accounting/AccountingComponents";
import { createLeadDraft, mergeLeadDraft, type LeadStepProps } from "./leadTypes";

const optionalPositiveNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  return value;
}, z.coerce.number().positive("Must be greater than 0").optional());

const leadStatusSchema = z.object({
  status: z.string().min(1, "Final status required"),
  priority: z.string().min(1, "Priority required"),
  expectedValue: optionalPositiveNumber,
  finalValue: optionalPositiveNumber,
  closeDate: z.string().optional(),
  lossReason: z.string().optional(),
  competitorName: z.string().optional(),
  overallRemarks: z.string().min(10, "Add final outcome remarks"),
}).superRefine((values, context) => {
  if (values.status === "Won") {
    if (!values.finalValue) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["finalValue"], message: "Closed value required" });
    }
    if (!values.closeDate) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["closeDate"], message: "Close date required" });
    }
  }

  if (values.status === "Lost" && !values.lossReason) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["lossReason"], message: "Loss reason required" });
  }
});

type LeadStatusFormInput = z.input<typeof leadStatusSchema>;
type LeadStatusFormData = z.output<typeof leadStatusSchema>;

type Step6Props = Pick<LeadStepProps, "onPrev"> & Partial<Pick<LeadStepProps, "data" | "updateData" | "onComplete">>;

export default function Step6LeadStatus({ data = createLeadDraft(), updateData = () => undefined, onPrev, onComplete }: Step6Props) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LeadStatusFormInput, unknown, LeadStatusFormData>({
    resolver: zodResolver(leadStatusSchema),
    defaultValues: data,
  });

  const watchedStatus = useWatch({ control, name: "status" });

  const onSubmit = (values: LeadStatusFormData) => {
    setIsLoading(true);
    setTimeout(() => {
      updateData(mergeLeadDraft(values));
      onComplete?.(values);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Field label="Final Lead Status" required options={["Interested", "Proposal Sent", "Negotiation", "Won", "Lost", "On Hold"]} register={register("status")} error={errors.status?.message} />
        <Field label="Priority Level" required options={["Low", "Medium", "High", "Critical"]} register={register("priority")} error={errors.priority?.message} />
        <Field label="Expected Deal Value" type="number" min={1} register={register("expectedValue")} error={errors.expectedValue?.message} />
      </div>

      {watchedStatus === "Won" ? (
        <div className="animate-in zoom-in-95 rounded-[2.5rem] border-2 border-dashed border-emerald-200 bg-emerald-50 p-8">
          <div className="mb-8 flex items-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-xl shadow-emerald-200">
              <Trophy size={28} />
            </div>
            <div>
              <h4 className="text-xl font-black tracking-tight text-emerald-900">Deal Secured</h4>
              <p className="mt-1 text-sm font-bold uppercase tracking-widest text-emerald-600">Ready for project handoff.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Field label="Final Closed Value" required type="number" min={1} register={register("finalValue")} error={errors.finalValue?.message} />
            <Field label="Actual Close Date" required type="date" register={register("closeDate")} error={errors.closeDate?.message} />
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
              <p className="mt-1 text-sm font-bold uppercase tracking-widest text-rose-600">Reason required for source quality review.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label="Reason for Loss" required options={["Budget Constraint", "Lost to Competitor", "Internal Priority Change", "Timeline Mismatch"]} register={register("lossReason")} error={errors.lossReason?.message} />
            <Field label="Competitor Name" placeholder="e.g. Acme Tech Solutions" register={register("competitorName")} />
          </div>
        </div>
      ) : null}

      <Field label="Closure Executive Remarks" required multiline placeholder="Summarize the final outcome..." register={register("overallRemarks")} error={errors.overallRemarks?.message} />

      <div className="flex justify-between border-t border-slate-50 pt-8">
        <ActionButton label="Back to Approval" variant="outline" icon={ArrowLeft} onClick={onPrev} />
        <ActionButton type="submit" label={isLoading ? "Saving..." : "Finalize Lead"} icon={Send} variant="accent" />
      </div>
    </form>
  );
}
