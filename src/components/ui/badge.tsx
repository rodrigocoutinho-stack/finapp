type BadgeVariant =
  | "emerald"
  | "rose"
  | "blue"
  | "purple"
  | "indigo"
  | "yellow"
  | "slate";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  emerald: "bg-emerald-100 text-emerald-800",
  rose: "bg-rose-100 text-rose-800",
  blue: "bg-blue-100 text-blue-800",
  purple: "bg-purple-100 text-purple-800",
  indigo: "bg-indigo-100 text-indigo-800",
  yellow: "bg-yellow-100 text-yellow-800",
  slate: "bg-slate-100 text-slate-600",
};

export function Badge({ children, variant = "slate", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
