import React from "react";

interface BadgeProps {
  count?: number | null;
  className?: string;
  size?: "sm" | "md";
  variant?: "rose" | "amber" | "emerald";
  "aria-label"?: string;
}

export function Badge({
  count,
  className = "",
  size = "sm",
  variant = "rose",
  "aria-label": customAriaLabel,
}: BadgeProps) {
  if (!count || count <= 0) return null;

  const displayCount = count > 99 ? "99+" : count;
  const ariaLabel = customAriaLabel || `${count} unread`;

  const sizeClasses =
    size === "sm"
      ? "min-w-[17px] h-[17px] text-[10px] px-1"
      : "min-w-[20px] h-[20px] text-[11px] px-1.5";

  const variantClasses = {
    rose: "bg-rose-500 text-white dark:bg-rose-600",
    amber: "bg-amber-500 text-slate-950 dark:bg-amber-400",
    emerald: "bg-emerald-500 text-white dark:bg-emerald-600",
  }[variant];

  return (
    <span
      role="status"
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center font-black rounded-full shadow-xs leading-none select-none shrink-0 ${sizeClasses} ${variantClasses} ${className}`}
    >
      {displayCount}
    </span>
  );
}
