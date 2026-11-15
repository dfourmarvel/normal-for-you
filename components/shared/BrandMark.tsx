import Link from "next/link";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2.5 shrink-0 ${compact ? "min-w-0" : "min-w-[140px]"}`}
      aria-label="BioTensor Q-Health home"
    >
      <svg viewBox="0 0 36 36" className="w-9 h-9" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="5" fill="#EE6D52" />
        <rect x="16" y="16" width="16" height="16" rx="5" fill="#7DA7B0" opacity="0.9" />
        <circle cx="18" cy="18" r="3.5" fill="#F7F4F0" />
      </svg>
      <span>
        <span className="block font-bold text-[16px] tracking-[-0.02em] text-charcoal leading-tight">BioTensor</span>
        <span className={`block text-[10px] font-medium text-muted tracking-wide ${compact ? "hidden xs:block" : ""}`}>
          Q-Health · simulated
        </span>
      </span>
    </Link>
  );
}
