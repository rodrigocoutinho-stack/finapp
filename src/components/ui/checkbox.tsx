import { InputHTMLAttributes } from "react";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  error?: string;
  helpText?: string;
};

export function Checkbox({ label, error, helpText, id, className = "", disabled, ...props }: CheckboxProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className={`flex items-center gap-2 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <input
          type="checkbox"
          id={id}
          className={`h-4 w-4 rounded border-input-border text-emerald-600 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          disabled={disabled}
          {...props}
        />
        <span className={`text-sm ${disabled ? "text-on-surface-muted" : "text-on-surface-secondary"}`}>
          {label}
        </span>
      </label>
      {helpText && !error && (
        <p className="mt-1 ml-6 text-xs text-on-surface-muted">{helpText}</p>
      )}
      {error && <p className="mt-1 ml-6 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
