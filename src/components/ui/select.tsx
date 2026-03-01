import { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helpText?: string;
  optional?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  helpText,
  optional,
  id,
  options,
  placeholder,
  className = "",
  required,
  ...props
}: SelectProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-on-surface-secondary mb-1">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
          {optional && <span className="text-on-surface-muted ml-1 font-normal">(opcional)</span>}
        </label>
      )}
      <select
        id={id}
        className={`block w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-surface-alt disabled:text-on-surface-muted disabled:cursor-not-allowed bg-input-bg ${
          error
            ? "border-red-300 text-red-900 dark:border-red-700 dark:text-red-400"
            : "border-input-border text-on-surface"
        } ${className}`}
        required={required}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {helpText && !error && (
        <p className="mt-1 text-xs text-on-surface-muted">{helpText}</p>
      )}
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
