"use client";

export function Crest({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#0F4C3A" />
      <path d="M32 10 L52 20 V34 C52 46 32 54 32 54 C32 54 12 46 12 34 V20 Z" fill="#C4A35A" />
      <path d="M32 16 L46 23 V34 C46 42 32 49 32 49 C32 49 18 42 18 34 V23 Z" fill="#0F4C3A" />
      <path d="M32 22 L32 42" stroke="#C4A35A" strokeWidth="2" />
      <path d="M24 30 H40" stroke="#C4A35A" strokeWidth="2" />
      <circle cx="32" cy="30" r="3" fill="#F7F4EF" />
    </svg>
  );
}
