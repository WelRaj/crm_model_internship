"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowRight, ArrowLeft, Plus, Phone, Mail, MessageCircle, Video, Users } from "lucide-react";

export default function Step3FollowUp({ onNext, onPrev }: any) {
  const [followUps] = useState([
    { id: 1, date: "2024-03-12", time: "11:00 AM", mode: "Call", staff: "Vikram Rathore", response: "Interested", summary: "Discussed website features. Client asked for quote.", status: "Done" },
    { id: 2, date: "2024-03-14", time: "02:30 PM", mode: "WhatsApp", staff: "Vikram Rathore", response: "Call Back", summary: "Shared portfolio links. Client will review tonight.", status: "Done" },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);

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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Timeline of past follow-ups */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-black text-primary uppercase tracking-widest">Follow-up History</h4>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-[10px] font-bold border-accent text-accent hover:bg-accent hover:text-primary"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus size={14} className="mr-1" /> New Follow-up
          </Button>
        </div>

        {showAddForm && (
          <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-accent animate-in zoom-in-95 duration-200">
            <h5 className="text-xs font-bold text-primary mb-4 uppercase">Add New Record</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Date" type="date" required />
              <Input label="Time" type="time" required />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-secondary">Mode</label>
                <select className="flex h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option>Call</option>
                  <option>Email</option>
                  <option>WhatsApp</option>
                  <option>Meeting</option>
                  <option>Video Call</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <Input label="Summary / Notes" placeholder="Enter conversation details..." />
              </div>
              <div className="md:col-span-1">
                <label className="text-sm font-medium text-secondary">Response</label>
                <select className="flex h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option>Interested</option>
                  <option>Call Back</option>
                  <option>No Response</option>
                  <option>Not Interested</option>
                </select>
              </div>
              <Input label="Next Follow-up Date" type="date" />
              <div className="flex items-end">
                <Button className="w-full bg-accent text-primary h-11 font-bold">Save Record</Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {followUps.map((log) => (
            <div key={log.id} className="relative pl-8 border-l-2 border-slate-100 pb-4 last:pb-0">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-accent flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-primary">{log.date}</span>
                    <span className="text-[10px] text-secondary bg-slate-100 px-2 py-0.5 rounded uppercase font-bold">{log.time}</span>
                    <span className="flex items-center gap-1 text-[10px] text-accent font-bold bg-accent/10 px-2 py-0.5 rounded uppercase">
                      {getModeIcon(log.mode)} {log.mode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      log.response === "Interested" ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {log.response}
                    </span>
                    <span className="text-[10px] text-secondary">by {log.staff}</span>
                  </div>
                </div>
                <p className="text-sm text-secondary leading-relaxed">{log.summary}</p>
              </div>
            </div>
          ))}
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

