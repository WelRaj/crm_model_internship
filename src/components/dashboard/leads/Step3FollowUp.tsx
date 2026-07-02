"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, ArrowLeft, Plus, Phone, Mail, MessageCircle, Video, Users } from "lucide-react";
import { ActionButton, Field, Panel, StatusBadge } from "../accounting/AccountingComponents";
import type { LeadStepProps } from "./leadTypes";

// --- Validation Schema (Simplified) ---
const followUpSchema = z.object({
  date: z.string().min(1, "Date required"),
  time: z.string().optional(),
  mode: z.string().optional(),
  response: z.string().optional(),
  summary: z.string().min(2, "Add brief notes"),
  nextDate: z.string().optional(),
});

type FollowUpFormData = z.input<typeof followUpSchema>;

type FollowUpRecord = FollowUpFormData & {
  id: number;
  staff: string;
  status: string;
};

type Step3Props = Pick<LeadStepProps, "onNext" | "onPrev"> & Partial<Pick<LeadStepProps, "data" | "updateData">>;

export default function Step3FollowUp({ data, updateData, onNext, onPrev }: Step3Props) {
  const [followUps, setFollowUps] = useState<FollowUpRecord[]>([
    { id: 1, date: "2024-03-12", time: "11:00 AM", mode: "Call", staff: "Vikram Rathore", response: "Interested", summary: "Discussed website features. Client asked for quote.", status: "Done" },
    { id: 2, date: "2024-03-14", time: "02:30 PM", mode: "WhatsApp", staff: "Vikram Rathore", response: "Call Back", summary: "Shared portfolio links. Client will review tonight.", status: "Done" },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FollowUpFormData>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0]
    }
  });

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "Call": return <Phone size={14} />;
      case "Email": return <Mail size={14} />;
      case "WhatsApp": return <MessageCircle size={14} />;
      case "Meeting": return <Users size={14} />;
      case "Video Call": return <Video size={14} />;
      default: return <Phone size={14} />;
    }
  };

  const onAddRecord = (data: FollowUpFormData) => {
    const newRecord = {
      id: followUps.length + 1,
      staff: "Vikram Rathore",
      status: "Done",
      ...data
    };
    setFollowUps([newRecord, ...followUps]);
    setShowAddForm(false);
    reset();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-black text-primary uppercase tracking-widest">Follow-up History</h4>
        <ActionButton
          variant="outline"
          onClick={() => setShowAddForm(!showAddForm)}
          icon={Plus}
          label={showAddForm ? "Close Form" : "New Follow-up"}
        />
      </div>

      {showAddForm && (
        <Panel title="Add Communication Record" description="Log calls, meetings or emails.">
          <form onSubmit={handleSubmit(onAddRecord)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Field label="Date" type="date" required register={register("date")} error={errors.date?.message} />
              <Field label="Time" type="time" register={register("time")} />
              <Field label="Mode" options={["Call", "WhatsApp", "Email", "Meeting", "Video Call"]} register={register("mode")} />
              <Field label="Client Response" options={["Interested", "Call Back", "No Response", "Not Interested"]} register={register("response")} />
              <Field label="Next Follow-up" type="date" register={register("nextDate")} />
            </div>
            <Field label="Conversation Summary" multiline placeholder="Enter notes..." required register={register("summary")} error={errors.summary?.message} />
            <ActionButton type="submit" label="Save Record" variant="accent" icon={Plus} />
          </form>
        </Panel>
      )}

      <div className="space-y-4">
        {followUps.map((log) => (
          <div key={log.id} className="relative pl-8 border-l-2 border-slate-100 pb-4 last:pb-0">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-primary flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-primary">{log.date}</span>
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase font-bold">{log.time || "N/A"}</span>
                  <span className="flex items-center gap-1 text-[10px] text-primary font-bold bg-accent/30 px-2 py-0.5 rounded uppercase">
                    {getModeIcon(log.mode || "Other")} {log.mode || "Other"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge tone={log.response === "Interested" ? "green" : "amber"}>{log.response || "No Resp"}</StatusBadge>
                  <span className="text-[10px] font-bold text-slate-400">by {log.staff}</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">{log.summary}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-8 border-t border-border">
        <ActionButton label="Back" variant="outline" icon={ArrowLeft} onClick={onPrev} />
        <ActionButton label="Save & Next" variant="accent" icon={ArrowRight} onClick={onNext} />
      </div>
    </div>
  );
}

