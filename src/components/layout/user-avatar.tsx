interface UserAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-11 h-11 text-base",
};

export function UserAvatar({ name, size = "md" }: UserAvatarProps) {
  const initial = name ? name.charAt(0).toUpperCase() : "?";

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-emerald-100 text-emerald-700 font-semibold flex items-center justify-center shrink-0`}
    >
      {initial}
    </div>
  );
}
