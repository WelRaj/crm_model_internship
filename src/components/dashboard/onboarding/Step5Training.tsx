"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Button } from "@/components/ui/Button";
import { ArrowRight, ArrowLeft, CheckCircle, Circle } from "lucide-react";

export default function Step5Training({ tasks, toggleTask, onNext, onPrev }: any) {
  const completed = tasks.filter((task: any) => task.completed).length;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task: any) => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className={`flex items-center space-x-4 p-4 rounded-xl border cursor-pointer transition-all ${
              task.completed ? "bg-accent/5 border-accent" : "bg-white border-border hover:border-slate-300"
            }`}
          >
            <div className={`${task.completed ? "text-accent" : "text-slate-300"}`}>
              {task.completed ? <CheckCircle size={24} /> : <Circle size={24} />}
            </div>
            <span className={`text-sm font-semibold ${task.completed ? "text-primary" : "text-secondary"}`}>
              {task.label}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600">
        Training progress: <span className="text-primary">{completed}/{tasks.length}</span> tasks completed.
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

