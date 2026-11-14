export function PageHeader({
  title,
  subtitle,
  actions,
  crumbs,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  crumbs?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
      <div>
        {crumbs && <div className="flex items-center gap-3 mb-2">{crumbs}</div>}
        <h1 className="text-[28px] md:text-[32px] font-bold tracking-[-0.02em] text-charcoal leading-tight">
          {title}
        </h1>
        {subtitle && <p className="text-secondary text-sm mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
