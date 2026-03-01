import { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
  optional?: boolean;
}

export function Textarea({ label, error, helpText, optional, id, className = "", required, ...props }: TextareaProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-on-surface-secondary mb-1">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
          {optional && <span className="text-on-surface-muted ml-1 font-normal">(opcional)</span>}
        </label>
      )}
      <textarea
        id={id}
        className={`block w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-surface-alt disabled:text-on-surface-muted disabled:cursor-not-allowed bg-input-bg ${
          error
            ? "border-red-300 text-red-900 placeholder-red-300 dark:border-red-700 dark:text-red-400"
            : "border-input-border text-on-surface placeholder-on-surface-muted"
        } ${className}`}
        required={required}
        {...props}
      />
      {helpText && !error && (
        <p className="mt-1 text-xs text-on-surface-muted">{helpText}</p>
      )}
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
