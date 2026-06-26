"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, ArrowLeft, Upload, FileText } from "lucide-react";
import { ActionButton, Field, Panel, StatusBadge, DataTable } from "../accounting/AccountingComponents";
import type { LeadStepProps } from "./leadTypes";

// --- Validation Schema (Simplified) ---
const proposalSchema = z.object({
  proposalNo: z.string().optional(),
  proposalDate: z.string().optional(),
  currency: z.string().default("INR"),
  amount: z.coerce.number().optional(),
  remarks: z.string().optional(),
});

type ProposalFormInput = z.input<typeof proposalSchema>;
type ProposalFormData = z.output<typeof proposalSchema>;

export default function Step4Proposal({ data, updateData, onNext, onPrev }: LeadStepProps) {
  const proposals = [
    { id: "PROP-2024-001", date: "2024-03-15", amount: "75,000", currency: "INR", status: "Revision Required", sentBy: "Vikram Rathore" },
  ];

  const {
    register,
    handleSubmit,
  } = useForm<ProposalFormInput, unknown, ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      ...data,
      proposalNo: "PROP-2024-002",
      proposalDate: new Date().toISOString().split('T')[0]
    }
  });

  const onSubmit = (values: ProposalFormData) => {
    updateData(values);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Field label="Proposal No" register={register("proposalNo")} />
        <Field label="Proposal Date" type="date" register={register("proposalDate")} />
        <div className="grid grid-cols-3 gap-2">
           <div className="col-span-1"><Field label="Currency" options={["INR", "USD"]} register={register("currency")} /></div>
           <div className="col-span-2"><Field label="Amount" type="number" register={register("amount")} /></div>
        </div>
      </div>

      <div className="p-8 border-2 border-dashed border-border rounded-[2rem] bg-slate-50 flex flex-col items-center justify-center text-center group hover:border-primary transition-all cursor-pointer">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Upload className="text-primary" size={24} />
        </div>
        <h5 className="font-black text-primary uppercase tracking-widest text-xs">Upload Proposal PDF</h5>
        <p className="text-[10px] text-slate-400 mt-2 font-bold">DRAG AND DROP OR CLICK TO BROWSE (MAX 10MB)</p>
      </div>

      <Panel title="Sent Proposals History" description="Track previous versions of the commercial offer.">
        <DataTable columns={["Proposal ID", "Amount", "Status", "Actions"]}>
          {proposals.map((p) => (
            <tr key={p.id} className="group hover:bg-slate-50 transition-colors">
              <td className="px-4 py-4">
                <p className="font-black text-primary">{p.id}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{p.date} • {p.sentBy}</p>
              </td>
              <td className="px-4 py-4 font-black text-primary">{p.currency} {p.amount}</td>
              <td className="px-4 py-4">
                <StatusBadge tone="amber">{p.status}</StatusBadge>
              </td>
              <td className="px-4 py-4 text-right">
                <button type="button" className="text-primary hover:underline font-black text-[10px] uppercase tracking-widest flex items-center justify-end gap-2 ml-auto">
                  <FileText size={14} /> View PDF
                </button>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      <div className="flex justify-between pt-8 border-t border-slate-50">
        <ActionButton label="Back" variant="outline" icon={ArrowLeft} onClick={onPrev} />
        <ActionButton type="submit" label="Save & Continue" icon={ArrowRight} variant="accent" />
      </div>
    </form>
  );
}

