import React from "react";

interface LogoProps {
  className?: string;
  alt?: string;
}

export function Logo({ className = "w-9 h-9 sm:w-10 sm:h-10", alt = "Servixo" }: LogoProps) {
  return (
    <img
      src="/servixo-mark.svg"
      alt={alt}
      className={`inline-block object-contain shrink-0 ${className}`}
    />
  );
}

// Backward-compatible alias for existing imports
export const LogoIcon = Logo;
export default Logo;
