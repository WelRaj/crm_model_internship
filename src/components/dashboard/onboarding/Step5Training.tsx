"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ArrowRight, ArrowLeft, CheckCircle, Circle } from "lucide-react";

export default function Step5Training({ onNext, onPrev }: any) {
  const [tasks, setTasks] = useState([
    { id: 1, label: "Company Introduction", completed: true },
    { id: 2, label: "Team Introduction", completed: true },
    { id: 3, label: "Development Process Overview", completed: false },
    { id: 4, label: "Coding Standards Document Shared", completed: false },
    { id: 5, label: "Security Policy Explained", completed: false },
    { id: 6, label: "Client Communication Guidelines Shared", completed: false },
    { id: 7, label: "Product Training Completed", completed: false },
    { id: 8, label: "Compliance / NDA Signed", completed: false },
  ]);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task) => (
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

