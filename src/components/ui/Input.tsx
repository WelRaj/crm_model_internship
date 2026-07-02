import * as React from "react";
import { Edit3 } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showEditIcon?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, showEditIcon, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-sm font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5">
            {label}
            {showEditIcon && <Edit3 className="h-3.5 w-3.5 text-primary" />}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          type={type}
          className={`flex h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:border-primary/50 ${className}`}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs text-red-500 font-black uppercase tracking-widest">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
