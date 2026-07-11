import React from "react";

interface LogoProps {
  className?: string;
  /** Storlek på märket (rosen) i px */
  markSize?: number;
  /** Dölj texten och visa bara märket */
  markOnly?: boolean;
  /** "light" för mörka/färgade bakgrunder */
  variant?: "default" | "light";
}

/**
 * ElsaBeautys logga: en minimalistisk ros (spiral sedd ovanifrån)
 * + ordmärke i Playfair Display. Samma motiv som public/favicon.svg.
 */
const Logo: React.FC<LogoProps> = ({
  className = "",
  markSize = 30,
  markOnly = false,
  variant = "default",
}) => {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 64 64"
        width={markSize}
        height={markSize}
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="eb-rose-bg" x1="0" y1="0" x2="0.7" y2="1">
            <stop offset="0%" stopColor="#c25e76" />
            <stop offset="100%" stopColor="#8e3f58" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill="url(#eb-rose-bg)" />
        <g
          fill="none"
          stroke="#faf1ea"
          strokeWidth="3.2"
          strokeLinecap="round"
        >
          <path d="M32 17 a15 15 0 1 0 15 15" />
          <path d="M32 24.5 a7.5 7.5 0 1 1 -7.5 7.5" />
          <path d="M32 29.5 a2.6 2.6 0 1 0 2.6 2.6" />
        </g>
      </svg>
      {!markOnly && (
        <span
          className={`font-display text-xl font-semibold tracking-tight leading-none ${
            variant === "light" ? "text-primary-content" : ""
          }`}
        >
          Elsa
          <span className={variant === "light" ? "text-accent" : "text-primary"}>
            Beauty
          </span>
        </span>
      )}
    </span>
  );
};

export default Logo;
