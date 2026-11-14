import Link from "next/link";

type Props = {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  type?: "button" | "submit";
  className?: string;
};

export function Button({
  children,
  href,
  onClick,
  variant = "primary",
  type = "button",
  className = "",
}: Props) {
  const base =
    variant === "primary"
      ? "bg-primary hover:bg-primary-hover text-white"
      : "bg-white border border-border text-charcoal hover:bg-card-muted";
  const cls = `inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-colors ${base} ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
