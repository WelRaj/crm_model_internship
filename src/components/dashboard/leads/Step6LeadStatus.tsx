"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, Trophy, XCircle, Send, Landmark } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Step6LeadStatus({ onPrev }: any) {
  const router = useRouter();
  const [isWon, setIsWon] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFinalSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      alert("Lead Status Updated Successfully!");
      router.push("/dashboard");
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Lead Status Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-1.5">
          <label className="text-sm font-black text-primary uppercase tracking-widest">Lead Status <span className="text-red-500">*</span></label>
          <select 
            className="flex h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-bold"
            onChange={(e) => {
              if (e.target.value === "Won") setIsWon(true);
              else if (e.target.value === "Lost") setIsWon(false);
              else setIsWon(null);
            }}
          >
            <option>New</option>
            <option>Contacted</option>
            <option>Follow Up</option>
            <option>Interested</option>
            <option>Proposal Sent</option>
            <option>Negotiation</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
            <option>On Hold</option>
          </select>
        </div>

        <div className="md:col-span-1 space-y-1.5">
          <label className="text-sm font-black text-primary uppercase tracking-widest">Priority</label>
          <select className="flex h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option>Low</option>
            <option>Medium</option>
            <option className="text-red-600 font-bold">High</option>
          </select>
        </div>

        <Input label="Expected Deal Value" type="number" placeholder="e.g. 100000" />
      </div>

      {isWon === true && (
        <div className="bg-green-50 p-8 rounded-2xl border-2 border-dashed border-green-200 animate-in zoom-in-95">
           <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-green-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-green-200">
                 <Trophy size={24} />
              </div>
              <div>
                 <h4 className="text-xl font-black text-green-900">Congratulations! Deal Won</h4>
                 <p className="text-sm text-green-700">Please provide final deal closure details.</p>
              </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input label="Final Deal Value" type="number" required />
              <Input label="Deal Close Date" type="date" required />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-green-900">Advance Received?</label>
                <select className="flex h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                   <option>Yes</option>
                   <option>No</option>
                </select>
              </div>
              <Input label="Advance Amount" type="number" />
              <div className="md:col-span-2">
                 <label className="text-sm font-medium text-green-900">Upload Agreement / Contract</label>
                 <div className="mt-1 flex items-center gap-4 p-3 bg-white border border-green-200 rounded-lg">
                    <button className="flex items-center gap-2 text-xs font-bold text-green-700 hover:text-green-800">
                       <Landmark size={14} /> Choose File
                    </button>
                    <span className="text-[10px] text-secondary">No file chosen (PDF, Max 5MB)</span>
                 </div>
              </div>
           </div>
        </div>
      )}

      {isWon === false && (
        <div className="bg-red-50 p-8 rounded-2xl border-2 border-dashed border-red-200 animate-in zoom-in-95">
           <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
                 <XCircle size={24} />
              </div>
              <div>
                 <h4 className="text-xl font-black text-red-900">Deal Lost</h4>
                 <p className="text-sm text-red-700">Help us understand why the lead was lost.</p>
              </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-red-900">Reason for Loss</label>
                <select className="flex h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                   <option>Budget Issue</option>
                   <option>Lost to Competitor</option>
                   <option>Project Cancelled</option>
                   <option>Timeline Mismatch</option>
                   <option>Communication Gap</option>
                </select>
              </div>
              <Input label="Competitor Name (if any)" placeholder="e.g. ABC Tech Solutions" />
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-red-900">Loss Remarks</label>
                <textarea rows={2} className="mt-1 w-full rounded-lg border border-red-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Detailed reason..." />
              </div>
           </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-black text-primary uppercase tracking-widest">Overall Remarks</label>
        <textarea rows={3} className="w-full rounded-xl border border-border p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Add any final notes about this lead..." />
      </div>

      <div className="flex justify-between pt-8 border-t border-border">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button 
          onClick={handleFinalSubmit} 
          isLoading={isLoading}
          className="bg-accent text-primary font-black px-12 h-12 text-lg shadow-xl hover:scale-105 transition-transform"
        >
          <Send className="mr-2 h-5 w-5" /> Final Submit
        </Button>
      </div>
    </div>
  );
}

