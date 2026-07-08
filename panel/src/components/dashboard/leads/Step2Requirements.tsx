"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { ActionButton, Field } from "../accounting/AccountingComponents";
import { mergeLeadDraft, type LeadStepProps } from "./leadTypes";

const optionalPositiveNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  return value;
}, z.coerce.number().positive("Must be greater than 0").optional());

const requirementsSchema = z.object({
  serviceRequired: z.string().min(1, "Service required"),
  projectType: z.string().min(1, "Project type required"),
  platformRequired: z.string().min(1, "Platform required"),
  timeline: z.string().min(1, "Timeline required"),
  projectDescription: z.string().min(20, "Add scope, features and business goal"),
  technologyPreference: z.string().optional(),
  referenceLink: z.string().url("Invalid URL").or(z.literal("")),
  currency: z.string().default("INR"),
  minBudget: optionalPositiveNumber,
  maxBudget: optionalPositiveNumber,
  paymentMode: z.string().min(1, "Payment mode required"),
}).superRefine((values, context) => {
  if (values.minBudget && values.maxBudget && values.maxBudget < values.minBudget) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["maxBudget"],
      message: "Max budget must be greater than min budget",
    });
  }
});

type RequirementsFormInput = z.input<typeof requirementsSchema>;
type RequirementsFormData = z.output<typeof requirementsSchema>;

export default function Step2Requirements({ data, updateData, onNext, onPrev }: LeadStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequirementsFormInput, unknown, RequirementsFormData>({
    resolver: zodResolver(requirementsSchema),
    defaultValues: data
  });

  const onSubmit = (values: RequirementsFormData) => {
    updateData(mergeLeadDraft(values));
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Service Required" required options={["Trading Software", "Strategy Automation", "Web App", "Mobile App", "UI-UX", "Growth Marketing", "Finance Dashboard"]} register={register("serviceRequired")} error={errors.serviceRequired?.message} />
        <Field label="Project Type" required options={["New Project", "Upgrade", "Maintenance"]} register={register("projectType")} error={errors.projectType?.message} />
        <Field label="Platform" required options={["Web", "Android", "iOS", "Hybrid"]} register={register("platformRequired")} error={errors.platformRequired?.message} />
        <Field label="Target Timeline" required options={["1 Month", "3 Months", "6 Months", "1 Year"]} register={register("timeline")} error={errors.timeline?.message} />
      </div>

      <Field label="Project Description" multiline placeholder="Describe features, goals and scope..." required register={register("projectDescription")} error={errors.projectDescription?.message} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Technology Preference" placeholder="e.g. Next.js, React, Node.js" register={register("technologyPreference")} />
        <Field label="Reference Link" placeholder="https://..." register={register("referenceLink")} error={errors.referenceLink?.message} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6 border-t border-slate-100">
        <Field label="Currency" options={["INR", "USD", "AED", "GBP"]} register={register("currency")} />
        <Field label="Min Budget" type="number" register={register("minBudget")} />
        <Field label="Max Budget" type="number" register={register("maxBudget")} />
        <Field label="Payment Mode" required options={["One Time", "Milestone Based", "Monthly"]} register={register("paymentMode")} error={errors.paymentMode?.message} />
      </div>

      <div className="flex justify-between pt-8 border-t border-slate-50">
        <ActionButton label="Back" variant="outline" icon={ArrowLeft} onClick={onPrev} />
        <ActionButton type="submit" label="Continue" icon={ArrowRight} variant="accent" />
      </div>
    </form>
  );
}

