"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { ActionButton, Field } from "../accounting/AccountingComponents";
import { createLeadDraft, type LeadStepProps } from "./leadTypes";

// --- Validation Schema (Simplified mandatory fields) ---
const requirementsSchema = z.object({
  serviceRequired: z.string().optional(),
  projectType: z.string().optional(),
  platformRequired: z.string().optional(),
  timeline: z.string().optional(),
  projectDescription: z.string().min(5, "Provide a brief description"),
  technologyPreference: z.string().optional(),
  referenceLink: z.string().url("Invalid URL").or(z.literal("")),
  currency: z.string().default("INR"),
  minBudget: z.coerce.number().optional(),
  maxBudget: z.coerce.number().optional(),
  paymentMode: z.string().optional(),
});

type RequirementsFormInput = z.input<typeof requirementsSchema>;
type RequirementsFormData = z.output<typeof requirementsSchema>;

export default function Step2Requirements({ data = createLeadDraft(), updateData = () => undefined, onNext, onPrev }: LeadStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequirementsFormInput, unknown, RequirementsFormData>({
    resolver: zodResolver(requirementsSchema),
    defaultValues: data
  });

  const onSubmit = (values: RequirementsFormData) => {
    updateData(values);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Service Required" options={["Website Development", "Web App", "Mobile App", "UI-UX", "Digital Marketing", "CRM/ERP"]} register={register("serviceRequired")} />
        <Field label="Project Type" options={["New Project", "Upgrade", "Maintenance"]} register={register("projectType")} />
        <Field label="Platform" options={["Web", "Android", "iOS", "Hybrid"]} register={register("platformRequired")} />
        <Field label="Target Timeline" options={["1 Month", "3 Months", "6 Months", "1 Year"]} register={register("timeline")} />
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
        <Field label="Payment Mode" options={["One Time", "Milestone Based", "Monthly"]} register={register("paymentMode")} />
      </div>

      <div className="flex justify-between pt-8 border-t border-slate-50">
        <ActionButton label="Back" variant="outline" icon={ArrowLeft} onClick={onPrev} />
        <ActionButton type="submit" label="Save & Continue" icon={ArrowRight} variant="accent" />
      </div>
    </form>
  );
}

