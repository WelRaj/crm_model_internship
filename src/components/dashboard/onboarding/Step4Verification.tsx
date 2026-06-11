"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Clock, AlertCircle, Eye, XCircle, Check, MessageSquare, ChevronRight } from "lucide-react";

interface Document {
  id: string;
  name: string;
  status: "Pending" | "Under Review" | "Verified" | "Rejected";
  date: string;
  verifiedBy: string;
  remarks: string;
}

export default function Step4Verification({ onNext, onPrev }: any) {
  const [documents, setDocuments] = useState<Document[]>([
    { id: "1", name: "Aadhaar Card (Front + Back)", status: "Verified", date: "2024-03-10", verifiedBy: "HR Priya", remarks: "Clear copy" },
    { id: "2", name: "PAN Card", status: "Verified", date: "2024-03-10", verifiedBy: "HR Priya", remarks: "Verified with IT Dept" },
    { id: "3", name: "Graduation Certificate", status: "Under Review", date: "-", verifiedBy: "-", remarks: "" },
    { id: "4", name: "Last 3 Months Salary Slips", status: "Pending", date: "-", verifiedBy: "-", remarks: "" },
    { id: "5", name: "Experience Letter", status: "Rejected", date: "2024-03-11", verifiedBy: "HR Priya", remarks: "Seal not visible, please re-upload" },
  ]);

  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const updateStatus = (id: string, newStatus: Document["status"], remarks: string = "") => {
    setDocuments(docs => docs.map(doc => 
      doc.id === id ? { 
        ...doc, 
        status: newStatus, 
        remarks, 
        date: new Date().toLocaleDateString(),
        verifiedBy: "Admin (You)" 
      } : doc
    ));
    setSelectedDoc(null);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Verified": return "bg-green-100 text-green-700 border-green-200";
      case "Under Review": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Rejected": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-secondary text-[10px] uppercase font-bold tracking-widest">
                <tr>
                  <th className="p-4">Document Details</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {documents.map((doc) => (
                  <tr 
                    key={doc.id} 
                    className={`text-sm hover:bg-slate-50 transition-colors cursor-pointer ${selectedDoc?.id === doc.id ? "bg-accent/5" : ""}`}
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <td className="p-4">
                      <p className="font-bold text-primary">{doc.name}</p>
                      {doc.remarks && <p className="text-xs text-secondary mt-1 flex items-center gap-1">
                        <MessageSquare size={12} /> {doc.remarks}
                      </p>}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(doc.status)}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-accent hover:text-accent/80 p-2">
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Review Panel */}
        <div className="lg:col-span-1">
          {selectedDoc ? (
            <div className="bg-white rounded-xl border border-accent p-6 shadow-md sticky top-4 animate-in fade-in slide-in-from-right-4">
              <div className="flex justify-between items-start mb-6">
                <h4 className="font-bold text-primary">Review Document</h4>
                <button onClick={() => setSelectedDoc(null)} className="text-secondary hover:text-primary text-xs">Close</button>
              </div>
              
              <div className="aspect-video bg-slate-100 rounded-lg border border-dashed border-slate-300 flex items-center justify-center mb-6 overflow-hidden group">
                 <div className="text-center group-hover:scale-110 transition-transform">
                    <Eye className="mx-auto text-slate-400 mb-2" size={32} />
                    <p className="text-[10px] text-secondary font-medium tracking-tight">PREVIEW NOT AVAILABLE<br/>IN PROTOTYPE MODE</p>
                 </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Document Name</label>
                  <p className="text-sm font-bold text-primary">{selectedDoc.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="w-full border-green-600 text-green-600 hover:bg-green-50 h-10 text-xs"
                    onClick={() => updateStatus(selectedDoc.id, "Verified", "Verified by Admin")}
                  >
                    <Check size={14} className="mr-1" /> Approve
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-red-600 text-red-600 hover:bg-red-50 h-10 text-xs"
                    onClick={() => {
                      const reason = prompt("Enter rejection reason:");
                      if (reason) updateStatus(selectedDoc.id, "Rejected", reason);
                    }}
                  >
                    <XCircle size={14} className="mr-1" /> Reject
                  </Button>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full border-primary text-primary h-10 text-xs"
                  onClick={() => updateStatus(selectedDoc.id, "Under Review", "Needs more clarity")}
                >
                  <Clock size={14} className="mr-1" /> Mark Review
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[300px] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                <Eye size={32} />
              </div>
              <p className="text-sm font-bold text-secondary">Select a document<br/>to start verification</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-primary text-white rounded-xl shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-primary font-bold">
            {Math.round((documents.filter(d => d.status === "Verified").length / documents.length) * 100)}%
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-accent">Overall Progress</p>
            <p className="text-sm font-medium opacity-90">{documents.filter(d => d.status === "Verified").length} of {documents.length} Documents Verified</p>
          </div>
        </div>
        <AlertCircle className="text-accent opacity-50" size={24} />
      </div>

      <div className="flex justify-between pt-8 border-t border-border">
        <Button variant="outline" onClick={onPrev}>Back</Button>
        <Button onClick={onNext} className="bg-accent hover:bg-accent/90 text-primary">Proceed to Training</Button>
      </div>
    </div>
  );
}

