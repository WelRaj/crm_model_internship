"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Button } from "@/components/ui/Button";
import { ArrowRight, ArrowLeft, Upload, FileText, CheckCircle2 } from "lucide-react";

interface DocType {
  id: string;
  name: string;
  required: boolean;
  multiple?: boolean;
  fileNames: string[];
}

export default function Step3Documents({ category, documents, updateDocument, onNext, onPrev }: any) {
  const docs: DocType[] = documents;
  const uploadedRequired = docs.filter((doc) => doc.required && doc.fileNames.length > 0).length;
  const totalRequired = docs.filter((doc) => doc.required).length;

  return (
    <div className="space-y-8">
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-primary">Document Verification</h3>
          <p className="text-sm text-secondary mt-1">
            Please upload clear copies of the following documents for <span className="text-accent font-semibold">{category}</span> category.
          </p>
        </div>
        <div className="hidden sm:flex h-12 w-12 items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100">
          <CheckCircle2 className="text-green-500" size={24} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {docs.map((doc, index) => (
          <div key={index} className="flex flex-col p-5 border border-border rounded-2xl bg-white hover:border-accent hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0">
              {doc.required ? (
                <div className="bg-red-50 text-red-600 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-red-100 uppercase tracking-tight">
                  Required
                </div>
              ) : (
                <div className="bg-slate-50 text-slate-400 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-slate-100 uppercase tracking-tight">
                  Optional
                </div>
              )}
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-accent/10 transition-colors duration-300 border border-slate-100 group-hover:border-accent/20">
                <FileText className="text-secondary group-hover:text-accent transition-colors" size={24} />
              </div>
              <div className="flex-1 pr-14">
                <p className="text-sm font-bold text-primary group-hover:text-accent transition-colors">{doc.name}</p>
                <p className="text-[11px] text-secondary mt-1.5 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2"></span>
                  {doc.multiple ? "Multiple files allowed" : "Single file only"}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">PDF, PNG, JPG | Max 5MB</p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between gap-4">
               <span className={`text-[11px] italic ${doc.fileNames.length ? "text-emerald-600 font-bold" : "text-slate-400"}`}>
                {doc.fileNames.length ? doc.fileNames.join(", ") : "No file selected"}
               </span>
               <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  multiple={doc.multiple}
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []).map((file) => file.name);
                    updateDocument(doc.id, { fileNames: files, status: files.length ? "Under Review" : "Pending", remarks: files.length ? "Uploaded for HR review" : "" });
                  }}
                />
                <div className="flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-accent transition-all duration-300 text-xs font-bold shadow-sm active:scale-95">
                  <Upload size={14} />
                  <span>{doc.fileNames.length ? "Replace" : "Upload"}</span>
                </div>
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600">
        Required documents uploaded: <span className="text-primary">{uploadedRequired}/{totalRequired}</span>
      </div>

      <div className="flex items-center justify-between pt-10 border-t border-slate-100">
        <Button variant="outline" onClick={onPrev} className="rounded-xl px-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext} className="bg-accent hover:bg-accent/90 text-white px-10 rounded-xl shadow-md shadow-accent/20">
          Save & Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
