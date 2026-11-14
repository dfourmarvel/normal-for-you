import type { VitalStatus } from "@/lib/types";

const styles: Record<string, string> = {
  nominal: "bg-[#E8F5EF] text-success",
  watch: "bg-yellow-soft text-[#9A7A20]",
  attention: "bg-primary-soft text-primary",
  offline: "bg-[#F0EBE4] text-muted",
  online: "bg-[#E8F5EF] text-success",
};

export function StatusPill({
  status,
  children,
  className = "",
}: {
  status?: VitalStatus | string;
  children: React.ReactNode;
  className?: string;
}) {
  const key = (status || "nominal").toLowerCase();
  const tone = styles[key] || "bg-card-muted text-secondary";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone} ${className}`}>
      {children}
    </span>
  );
}
