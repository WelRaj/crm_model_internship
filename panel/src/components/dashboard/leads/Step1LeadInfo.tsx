"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight } from "lucide-react";
import { ActionButton, Field } from "../accounting/AccountingComponents";
import { leadSourceOptions, mergeLeadDraft, type LeadStepProps } from "./leadTypes";

const leadInfoSchema = z.object({
  leadId: z.string().optional(),
  leadDate: z.string().min(1, "Date required"),
  department: z.enum(["Trading", "Projects"]),
  leadSource: z.string().min(1, "Lead source required"),
  sourceDetail: z.string().optional(),
  firstName: z.string().min(2, "First name required"),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  designation: z.string().optional(),
  personalEmail: z.string().email("Invalid email").or(z.literal("")),
  officialEmail: z.string().email("Invalid email").or(z.literal("")),
  mobile: z.string().regex(/^[0-9]{10}$/, "Enter 10 digit mobile"),
  alternateMobile: z.string().regex(/^[0-9]{10}$/, "Enter 10 digit alternate mobile").or(z.literal("")).optional(),
  assignedTo: z.string().optional(),
  city: z.string().min(2, "City required"),
  state: z.string().min(2, "State required"),
  country: z.string().min(2, "Country required"),
}).superRefine((values, context) => {
  if (values.leadSource === "Other Social Media" && !values.sourceDetail?.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["sourceDetail"],
      message: "Source detail required",
    });
  }
});

type LeadInfoFormData = z.input<typeof leadInfoSchema>;

export default function Step1LeadInfo({ data, updateData, onNext }: LeadStepProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LeadInfoFormData>({
    resolver: zodResolver(leadInfoSchema),
    defaultValues: { ...data, department: data.department || "Trading" }
  });

  const onSubmit = (values: LeadInfoFormData) => {
    updateData(mergeLeadDraft(values));
    onNext();
  };

  const selectedSource = useWatch({ control, name: "leadSource" });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Field label="Lead ID" defaultValue={data.leadId} register={register("leadId")} disabled />
        <Field label="Enquiry Date" type="date" required register={register("leadDate")} error={errors.leadDate?.message} />
        <Field label="Department" required options={["Trading", "Projects"]} register={register("department")} error={errors.department?.message} />
        <Field label="Lead Source" required options={[...leadSourceOptions]} register={register("leadSource")} error={errors.leadSource?.message} />
        {selectedSource === "Other Social Media" ? <Field label="Source Detail" required placeholder="Telegram, YouTube, X/Twitter, Justdial..." register={register("sourceDetail")} error={errors.sourceDetail?.message} /> : null}

        <Field label="First Name" required register={register("firstName")} error={errors.firstName?.message} />
        <Field label="Last Name" register={register("lastName")} />
        <Field label="Company Name" register={register("companyName")} />

        <Field label="Designation" register={register("designation")} />
        <Field label="Personal Email" type="email" register={register("personalEmail")} error={errors.personalEmail?.message} />
        <Field label="Official Email" type="email" register={register("officialEmail")} error={errors.officialEmail?.message} />

        <Field label="Mobile Number" required inputMode="numeric" maxLength={10} register={register("mobile")} error={errors.mobile?.message} />
        <Field label="Alternate Mobile" inputMode="numeric" maxLength={10} register={register("alternateMobile")} error={errors.alternateMobile?.message} />
        <Field label="Assigned Owner" options={["Assignment Pending"]} register={register("assignedTo")} error={errors.assignedTo?.message} />
      </div>

      <div className="pt-6 border-t border-slate-100">
        <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-6">Location Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Field label="City" required register={register("city")} error={errors.city?.message} />
          <Field label="State" required register={register("state")} error={errors.state?.message} />
          <Field label="Country" required register={register("country")} error={errors.country?.message} />
        </div>
      </div>

      <div className="flex justify-end pt-8 border-t border-slate-50">
        <ActionButton type="submit" label="Continue" icon={ArrowRight} variant="accent" />
      </div>
    </form>
  );
}

