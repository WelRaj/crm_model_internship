import * as React from "react";
import { Edit3 } from "lucide-react";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: string[];
  showEditIcon?: boolean;
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, showEditIcon, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-sm font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5">
            {label}
            {showEditIcon && <Edit3 className="h-3.5 w-3.5 text-primary" />}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select
          className={`flex h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:border-primary/50 ${className}`}
          ref={ref}
          {...props}
        >
          {props.placeholder && <option value="">{props.placeholder}</option>}
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-500 font-black uppercase tracking-widest">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
