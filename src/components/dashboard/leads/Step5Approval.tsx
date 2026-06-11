"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Button } from "@/components/ui/Button";
import { CheckCircle, Clock, XCircle, Shield, UserCheck, ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function Step5Approval({ onNext, onPrev }: any) {
  const [approvals] = useState([
    { role: "Sales Manager", status: "Approved", name: "Vikram Rathore", date: "2024-03-16", remarks: "Deal looks solid, proceed with negotiation." },
    { role: "Senior Manager / Director", status: "Pending", name: "-", date: "-", remarks: "" },
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Approved": return <CheckCircle className="text-green-500" size={24} />;
      case "Rejected": return <XCircle className="text-red-500" size={24} />;
      default: return <Clock className="text-amber-500" size={24} />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {approvals.map((app, i) => (
          <div key={i} className="p-6 border border-border rounded-2xl bg-white shadow-sm relative group overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${app.status === "Approved" ? "bg-green-500" : "bg-amber-500"}`}></div>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${app.status === "Approved" ? "bg-green-50" : "bg-amber-50"}`}>
                   {i === 0 ? <UserCheck className="text-primary" size={20} /> : <Shield className="text-primary" size={20} />}
                </div>
                <div>
                   <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest">{app.role}</h4>
                   <p className="text-sm font-bold text-primary mt-0.5">{app.name !== "-" ? app.name : "Awaiting Review"}</p>
                </div>
              </div>
              {getStatusIcon(app.status)}
            </div>

            {app.remarks && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                <p className="text-xs text-secondary italic">&ldquo;{app.remarks}&rdquo;</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
               <span className={`text-[10px] font-black uppercase ${app.status === "Approved" ? "text-green-600" : "text-amber-600"}`}>
                  {app.status}
               </span>
               <span className="text-[10px] text-secondary">{app.date}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-8 bg-primary rounded-2xl text-white flex items-center justify-between">
         <div>
            <h4 className="text-xl font-bold">Final Approval Decision</h4>
            <p className="text-sm text-white/70 mt-1">Management team will review the proposal and follow-ups.</p>
         </div>
         <div className="flex gap-3">
            <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 h-10 px-6">Reject Deal</Button>
            <Button className="bg-accent text-primary h-10 px-6 font-black">Approve Deal</Button>
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

