"use client";

import * as React from "react";

export function normalizeIndianMobile(input: string) {
  let digits = input.replace(/\D/g, "");

  if (digits.startsWith("91") && digits.length > 10) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("0") && digits.length > 10) {
    digits = digits.slice(1);
  }

  return digits.slice(0, 10);
}

export function isValidIndianMobile(value: string) {
  return /^[6-9]\d{9}$/.test(value);
}

type IndianMobileInputProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  autoFocus?: boolean;
  name?: string;
};

const IndianMobileInput = React.forwardRef<HTMLInputElement, IndianMobileInputProps>(
  ({ value, onChange, label = "Mobile Number", error, autoFocus, name = "mobile" }, ref) => {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const allowedKeys = [
        "Backspace",
        "Delete",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
        "Tab",
      ];

      if (allowedKeys.includes(event.key)) return;

      if (/^\d$/.test(event.key)) {
        const target = event.currentTarget;
        const selectedLength = (target.selectionEnd || 0) - (target.selectionStart || 0);
        if (value.length - selectedLength >= 10) {
          event.preventDefault();
        }
        return;
      }

      if (event.key.length === 1) {
        event.preventDefault();
      }
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault();
      const pasted = event.clipboardData.getData("text");
      const input = event.currentTarget;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const nextValue = `${value.slice(0, start)}${pasted}${value.slice(end)}`;
      onChange(normalizeIndianMobile(nextValue));
    };

    return (
      <div className="w-full space-y-1.5">
        <label className="text-sm font-medium text-secondary">
          {label}
          <span className="ml-1 text-red-500">*</span>
        </label>
        <div
          className={`flex h-12 w-full overflow-hidden rounded-md border bg-white text-sm transition-all focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1 ${
            error ? "border-red-400" : "border-border"
          }`}
        >
          <div className="flex items-center border-r border-border bg-slate-50 px-3 font-black text-primary">
            +91
          </div>
          <input
            ref={ref}
            name={name}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            autoFocus={autoFocus}
            required
            value={value}
            placeholder="98765 43210"
            aria-invalid={Boolean(error)}
            aria-describedby={`${name}-hint`}
            className="min-w-0 flex-1 px-3 py-2 font-bold tracking-widest text-primary outline-none placeholder:font-medium placeholder:tracking-normal placeholder:text-slate-300"
            onChange={(event) => onChange(normalizeIndianMobile(event.target.value))}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
          />
        </div>
        <p id={`${name}-hint`} className={`text-xs font-semibold ${error ? "text-red-500" : "text-slate-400"}`}>
          {error || "10 digits only, starting with 6, 7, 8, or 9."}
        </p>
      </div>
    );
  }
);

IndianMobileInput.displayName = "IndianMobileInput";

export default IndianMobileInput;
