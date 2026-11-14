export function Card({
  children,
  className = "",
  tight = false,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  tight?: boolean;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`bg-white rounded-[20px] border border-border shadow-card ${
        tight ? "p-4" : "p-5"
      } ${className}`}
    >
      {children}
    </div>
  );
}
