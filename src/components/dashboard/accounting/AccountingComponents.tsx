"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type Tone = "slate" | "blue" | "green" | "amber" | "red" | "purple" | "cyan";

const toneStyles: Record<Tone, string> = {
  slate: "bg-slate-50 text-slate-700 border-slate-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  green: "bg-green-50 text-green-700 border-green-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-red-50 text-red-700 border-red-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  cyan: "bg-cyan-50 text-cyan-700 border-cyan-200",
};

const iconToneStyles: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-700",
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  purple: "bg-purple-100 text-purple-700",
  cyan: "bg-cyan-100 text-cyan-700",
};

export function AccountingPage({
  title, description, icon : Icon, badge, actions, children,
}: {
  title: string; description: string; icon: LucideIcon; badge?: string; actions?: ReactNode; children: ReactNode;
}) {
  return (
    <div className="w-full min-w-0 space-y-8 animate-in fade-in duration-500">
      <div className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
            <Icon size={26} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-black tracking-tight text-[#1E293B]">{title}</h2>
              {badge ? <StatusBadge tone="blue">{badge}</StatusBadge> : null}
            </div>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">{description}</p>
          </div>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap justify-start gap-3 xl:justify-end">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function ActionButton({
  icon: Icon,
  children,
  label,
  variant = "primary",
  onClick,
  type = "button",
}: {
  icon?: LucideIcon;
  children?: ReactNode;
  label?: string;
  variant?: "primary" | "outline" | "accent";
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}) {
  const styles = {
    primary: "bg-primary text-white hover:bg-primary/90 border-primary",
    outline: "bg-white text-primary border-border hover:bg-slate-50",
    accent: "bg-accent text-primary border-accent hover:bg-accent/90",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-black uppercase tracking-widest shadow-sm transition-all ${styles[variant]}`}
    >
      {Icon ? <Icon size={16} /> : null}
      {children || label}
    </button>
  );
}

export function MetricCard({
  label, value, helper, icon: Icon, tone = "slate",
}: {
  label: string; value: string; helper?: string; icon: LucideIcon; tone?: Tone;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100`}>
        <Icon size={21} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-black text-primary">{value}</p>
        {helper ? <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p> : null}
      </div>
    </div>
  );
}

export function Panel({
  title, description, children, actions, icon : ICON,
}: {
  title: string; description?: string; children: ReactNode; actions?: ReactNode; icon?:LucideIcon;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
         <div className="flex items-center gap-2">
          {ICON && <ICON size={18}/>}
          <h3 className="text-lg font-black text primary">{title}</h3>
         </div>
          {description ? <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function StatusBadge({ children, tone = "slate" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${toneStyles[tone]}`}>
      {children}
    </span>
  );
}

export function Field({
  label, placeholder, required, type = "text", options, multiline, error, register, onChange, defaultValue, ...rest
}: {
  label: string; placeholder?: string; required?: boolean; type?: string; options?: string[]; multiline?: boolean; error?: string; register?: any; onChange?: (e: any) => void; defaultValue?: any; [key: string]: any;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-black uppercase tracking-widest text-slate-500">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </span>
      {multiline ? (
        <textarea
          {...register}
          defaultValue={defaultValue}
          onChange={onChange || register?.onChange}
          placeholder={placeholder}
          rows={3}
          {...rest}
          className={`w-full rounded-xl border bg-white px-3 py-3 text-sm font-semibold text-primary outline-none transition-all placeholder:text-slate-300 focus:ring-4 focus:ring-primary/10 ${        
            error ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "border-border focus:border-primary"
          }`}
        />
      ) : options ? (
        <select
          {...register}
          defaultValue={defaultValue}
          onChange={onChange || register?.onChange}
          {...rest}
          className={`h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none transition-all focus:ring-4 focus:ring-primary/10 focus:border-primary ${
            error ? "border-red-500" : ""
          }`}
        >
          <option value="">Select {label}...</option>
          {options.map((option: string) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          {...register}
          defaultValue={defaultValue}
          onChange={onChange || register?.onChange}
          placeholder={placeholder}
          {...rest}
          className={`h-11 w-full rounded-xl border bg-white px-3 text-sm font-semibold text-primary outline-none transition-all placeholder:text-slate-300 focus:ring-4 focus:ring-primary/10 ${      
            error ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "border-border focus:border-primary"
          }`}
        />
      )}
      {error && <p className="text-[10px] font-black uppercase tracking-widest text-red-500">{error}</p>}
    </label>
  );
}

export function DataTable({ columns, children }: { columns: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[760px] text-left">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-white">{children}</tbody>
      </table>
    </div>
  );
}

export function ProgressBar({ value, tone = "green" }: { value: number; tone?: "green" | "blue" | "amber" | "red" | "purple" }) {
  const colors = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    purple: "bg-purple-500",
  };

  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className={`h-2 rounded-full ${colors[tone]}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

export function WorkflowSteps({ steps }: { steps: string[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
      {steps.map((step, index) => (
        <div key={step} className="rounded-xl border border-border bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step {index + 1}</p>
          <p className="mt-2 text-sm font-black text-primary">{step}</p>
        </div>
      ))}
    </div>
  );
}
