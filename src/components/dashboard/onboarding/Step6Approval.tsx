"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Button } from "@/components/ui/Button";
import { ArrowLeft, CheckCircle, Clock, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Step6Approval({ approvals, updateApproval, onFinish, onPrev }: any) {
  const router = useRouter();
  const [isFinishing, setIsFinishing] = useState(false);

  const handleFinish = () => {
    if (!onFinish()) return;
    setIsFinishing(true);
    setTimeout(() => {
      alert("Onboarding Complete! Welcome Email Sent.");
      router.push("/dashboard");
    }, 2000);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {approvals.map((approval: any, i: number) => (
          <div key={i} className="p-6 border border-border rounded-2xl bg-slate-50 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-sm font-bold text-secondary uppercase tracking-wider">{approval.role}</h4>
                <p className="text-lg font-bold text-primary mt-1">{approval.name !== "-" ? approval.name : "Waiting..."}</p>
              </div>
              <div className={`${
                approval.status === "Approved" ? "text-green-500" : approval.status === "Rejected" ? "text-red-500" : "text-amber-500"
              }`}>
                {approval.status === "Approved" ? <CheckCircle size={32} /> : <Clock size={32} />}
              </div>
            </div>
            
            <div className="flex justify-between items-center text-xs text-secondary pt-4 border-t border-slate-200">
              <span>Status: <span className={`font-bold ${approval.status === "Approved" ? "text-green-600" : approval.status === "Rejected" ? "text-red-600" : "text-amber-600"}`}>{approval.status}</span></span>
              <span>{approval.date}</span>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="h-9 flex-1 text-xs border-green-600 text-green-600" onClick={() => updateApproval(approval.role, "Approved")}>
                Approve
              </Button>
              <Button variant="outline" className="h-9 flex-1 text-xs border-red-600 text-red-600" onClick={() => updateApproval(approval.role, "Rejected")}>
                Reject
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-primary text-white p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <h3 className="text-2xl font-bold">Ready to Launch?</h3>
          <p className="text-primary-foreground/70 text-sm mt-1">Once all approvals are received, the employee dashboard will be activated.</p>
        </div>
        <Button 
          onClick={handleFinish} 
          isLoading={isFinishing}
          className="bg-accent hover:bg-accent/90 text-primary font-bold px-10"
        >
          <Send className="mr-2 h-4 w-4" /> Final Submit
        </Button>
      </div>

      <div className="flex justify-start">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
    </div>
  );
}

