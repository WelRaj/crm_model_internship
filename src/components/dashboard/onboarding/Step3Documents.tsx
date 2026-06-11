"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Button } from "@/components/ui/Button";
import { ArrowRight, ArrowLeft, Upload, FileText } from "lucide-react";

export default function Step3Documents({ category, onNext, onPrev }: any) {
  const fresherDocs = [
    "10th Marksheet",
    "12th Marksheet",
    "Graduation Certificate",
    "Internship Certificate (if applicable)",
    "Aadhaar Card (Front + Back)",
    "PAN Card",
    "Passport Size Photo",
    "Resume / CV",
  ];

  const experiencedDocs = [
    "Experience Letter",
    "Last 3 Months Salary Slips",
    "Relieving Letter",
    "Aadhaar Card (Front + Back)",
    "PAN Card",
    "Passport Size Photo",
    "Resume / CV",
  ];

  const docs = category === "Experienced" ? experiencedDocs : fresherDocs;

  return (
    <div className="space-y-8">
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
        <p className="text-sm text-secondary">
          Uploading documents for: <span className="font-bold text-primary">{category}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {docs.map((doc, index) => (
          <div key={index} className="flex items-center justify-between p-4 border border-border rounded-xl bg-white hover:border-accent transition-all group">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-accent/10 transition-colors">
                <FileText className="text-secondary group-hover:text-accent" size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">{doc}</p>
                <p className="text-[10px] text-secondary">PDF, JPG or PNG (Max 5MB)</p>
              </div>
            </div>
            <label className="cursor-pointer">
              <input type="file" className="hidden" />
              <div className="flex items-center space-x-1 text-accent hover:text-accent/80 font-bold text-xs">
                <Upload size={14} />
                <span>Upload</span>
              </div>
            </label>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-8">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext}>
          Save & Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

