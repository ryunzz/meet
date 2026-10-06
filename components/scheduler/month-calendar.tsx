import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDay, monthGrid } from "@/lib/time";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthCalendar(props: {
  month: string;
  today: string;
  available: Set<string>;
  selected: string | null;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  onMonthChange: (delta: number) => void;
  onSelect: (day: string) => void;
}) {
  const { month, today, available, selected, loading } = props;

  return (
    <div>
      <div className="mb-4 flex items-center justify-center gap-6">
        <NavButton label="Previous month" disabled={!props.canGoBack} onClick={() => props.onMonthChange(-1)}>
          <ChevronLeft className="size-5" />
        </NavButton>
        <h3 className="w-36 text-center text-[15px] font-medium" aria-live="polite">
          {formatDay(month, "MMMM yyyy")}
        </h3>
        <NavButton label="Next month" disabled={!props.canGoForward} onClick={() => props.onMonthChange(1)}>
          <ChevronRight className="size-5" />
        </NavButton>
      </div>

      <div className="grid grid-cols-7 text-center text-[11px] font-medium uppercase tracking-wide text-muted">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      <div
        className={`grid grid-cols-7 gap-y-1.5 transition-opacity ${loading ? "pointer-events-none opacity-40" : ""}`}
        aria-busy={loading}
      >
        {monthGrid(month).map((day, i) => {
          if (!day) return <div key={`pad-${i}`} />;

          const isAvailable = available.has(day);
          const isSelected = day === selected;
          const isToday = day === today;

          return (
            <div key={day} className="flex justify-center">
              <button
                type="button"
                disabled={!isAvailable}
                onClick={() => props.onSelect(day)}
                aria-pressed={isSelected}
                aria-label={formatDay(day, "EEEE, MMMM d") + (isAvailable ? "" : ", unavailable")}
                className={`relative flex size-11 items-center justify-center rounded-full text-[15px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                  isSelected
                    ? "bg-accent font-bold text-white"
                    : isAvailable
                      ? "bg-accent-soft font-bold text-accent hover:bg-accent hover:text-white"
                      : "text-muted/70"
                }`}
              >
                {Number(day.slice(8))}
                {isToday && (
                  <span
                    className={`absolute bottom-1.5 size-1 rounded-full ${isSelected ? "bg-white" : "bg-current"}`}
                  />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NavButton(props: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={props.label}
      disabled={props.disabled}
      onClick={props.onClick}
      className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent outline-none transition-colors hover:bg-accent hover:text-white focus-visible:ring-2 focus-visible:ring-accent disabled:bg-transparent disabled:text-muted/50"
    >
      {props.children}
    </button>
  );
}
