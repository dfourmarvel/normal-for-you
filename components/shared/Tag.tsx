export function Tag({
  children,
  tone = "default",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "default" | "coral" | "teal" | "exp";
  className?: string;
}) {
  const map = {
    default: "bg-card-muted text-secondary border border-border",
    coral: "bg-primary-soft text-primary",
    teal: "bg-teal-soft text-teal-dark",
    exp: "bg-yellow-soft text-[#9A7A20] font-semibold tracking-wide",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${map[tone]} ${className}`}>
      {children}
    </span>
  );
}
