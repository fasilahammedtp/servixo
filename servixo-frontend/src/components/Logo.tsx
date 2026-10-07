import React from "react";

interface LogoIconProps {
  className?: string;
}

export function LogoIcon({ className = "w-8 h-8" }: LogoIconProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="servixo-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1B3B34" />
          <stop offset="100%" stopColor="#0E1E1B" />
        </linearGradient>

        <linearGradient id="servixo-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F6D389" />
          <stop offset="50%" stopColor="#E5B25D" />
          <stop offset="100%" stopColor="#C8933B" />
        </linearGradient>
      </defs>

      {/* Background Card */}
      <rect width="512" height="512" rx="112" fill="url(#servixo-bg-grad)" />

      {/* Inset Gold Border */}
      <rect
        x="16"
        y="16"
        width="480"
        height="480"
        rx="96"
        fill="none"
        stroke="url(#servixo-gold-grad)"
        strokeWidth="4"
        opacity="0.3"
      />

      {/* Single Clean Wrench Icon Angled at 45 deg */}
      <g transform="translate(256, 256) rotate(-45) translate(-256, -256)">
        {/* Handle */}
        <rect x="234" y="150" width="44" height="212" rx="18" fill="url(#servixo-gold-grad)" />

        {/* Top Open-End Jaw Head */}
        <path
          d="M 256 90 
             C 292 90, 320 118, 320 154 
             C 320 175, 309 193, 293 204 
             L 219 204 
             C 203 193, 192 175, 192 154 
             C 192 118, 220 90, 256 90 Z"
          fill="url(#servixo-gold-grad)"
        />

        {/* Open Jaw Cutout */}
        <path
          d="M 234 85 
             L 278 85 
             L 278 140 
             C 278 152, 268 162, 256 162 
             C 244 162, 234 152, 234 140 Z"
          fill="#162E28"
        />

        {/* Bottom Ring Head */}
        <circle cx="256" cy="362" r="54" fill="url(#servixo-gold-grad)" />
        <circle cx="256" cy="362" r="26" fill="#142823" />
      </g>
    </svg>
  );
}

export default LogoIcon;
