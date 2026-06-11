"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowRight, ArrowLeft, Upload, FileText, Clock } from "lucide-react";

export default function Step4Proposal({ onNext, onPrev }: any) {
  const [proposals] = useState([
    { id: "PROP-2024-001", date: "2024-03-15", amount: "75,000", currency: "INR", status: "Revision Required", sentBy: "Vikram Rathore" },
  ]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Input label="Proposal Number" value="PROP-2024-002" disabled className="bg-slate-50 font-bold" />
        <Input label="Proposal Date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
        <div className="flex gap-2">
           <div className="w-24">
              <label className="text-sm font-medium text-secondary">Currency</label>
              <select className="flex h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                 <option>INR</option>
                 <option>USD</option>
              </select>
           </div>
           <Input label="Proposal Amount" type="number" placeholder="Enter amount" />
        </div>
      </div>

      <div className="p-8 border-2 border-dashed border-border rounded-2xl bg-slate-50 flex flex-col items-center justify-center text-center group hover:border-accent transition-colors cursor-pointer">
        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Upload className="text-accent" size={24} />
        </div>
        <h5 className="font-bold text-primary">Upload Proposal PDF</h5>
        <p className="text-xs text-secondary mt-1">Drag and drop or click to browse (Max 10MB)</p>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-black text-primary uppercase tracking-widest">Sent Proposals</h4>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-bold text-secondary uppercase tracking-widest">
              <tr>
                <th className="p-4">Proposal ID</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">File</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {proposals.map((p) => (
                <tr key={p.id} className="text-sm">
                  <td className="p-4">
                    <p className="font-bold text-primary">{p.id}</p>
                    <p className="text-[10px] text-secondary">{p.date} • by {p.sentBy}</p>
                  </td>
                  <td className="p-4 font-black text-primary">{p.currency} {p.amount}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
                       <Clock size={12} /> {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-accent hover:underline font-bold text-xs flex items-center justify-end gap-1 ml-auto">
                      <FileText size={14} /> View PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between pt-8 border-t border-border">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext} className="bg-primary">
          Save & Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

