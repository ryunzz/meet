export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={`w-full self-start bg-surface sm:rounded-xl sm:border sm:border-line sm:shadow-[0_1px_10px_rgba(0,0,0,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}
