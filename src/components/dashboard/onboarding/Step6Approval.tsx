"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Button } from "@/components/ui/Button";
import { ArrowLeft, CheckCircle, Clock, MailCheck, Send, ShieldCheck } from "lucide-react";
import { useState } from "react";

export default function Step6Approval({ data, approvals, updateApproval, onFinish, onPrev }: any) {
  const [isFinishing, setIsFinishing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleFinish = () => {
    if (!onFinish()) return;
    setIsFinishing(true);
    setTimeout(() => {
      setIsFinishing(false);
      setIsCompleted(true);
    }, 800);
  };

  if (isCompleted) {
    const employeeName = [data.firstName, data.middleName, data.lastName].filter(Boolean).join(" ") || "New Employee";
    const completedAt = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    return (
      <div className="space-y-6 animate-in zoom-in-95 duration-300">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-white shadow-lg shadow-green-200">
            <CheckCircle className="h-9 w-9" />
          </div>
          <h3 className="text-2xl font-black text-primary">Onboarding Completed</h3>
          <p className="mx-auto mt-2 max-w-2xl text-sm font-medium text-secondary">
            {employeeName} has been activated successfully. Welcome email and approval confirmation are marked in the UI.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-secondary">Employee ID</p>
            <p className="mt-2 text-lg font-black text-primary">{data.employeeId}</p>
            <p className="text-sm font-semibold text-secondary">{data.designation || "Designation pending"}</p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-secondary">Official Email</p>
            <p className="mt-2 break-all text-lg font-black text-primary">{data.officialEmail}</p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              <MailCheck className="h-3.5 w-3.5" /> Welcome email queued
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-secondary">Final Status</p>
            <p className="mt-2 text-lg font-black text-primary">Completed</p>
            <p className="text-sm font-semibold text-secondary">{completedAt}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-slate-50 p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-black text-primary">Approval Trail</h4>
              <p className="text-sm font-medium text-secondary">All approval checkpoints are complete.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            {approvals.map((approval: any, i: number) => (
              <div key={i} className="rounded-xl border border-green-100 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-secondary">{approval.role}</p>
                <p className="mt-1 font-black text-primary">{approval.name}</p>
                <p className="mt-2 text-xs font-bold text-green-600">{approval.status}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-start">
          <Button variant="outline" onClick={() => setIsCompleted(false)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Review Approval
          </Button>
        </div>
      </div>
    );
  }

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
          <h3 className="text-2xl font-bold">Ready for Activation?</h3>
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

