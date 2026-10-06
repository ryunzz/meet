import { useEffect, useRef } from "react";
import { formatDay, formatTime } from "@/lib/time";

export function TimeList(props: {
  day: string;
  slots: string[];
  timezone: string;
  selected: string | null;
  onSelect: (slot: string) => void;
  onConfirm: (slot: string) => void;
}) {
  const { day, slots, timezone, selected } = props;
  const ref = useRef<HTMLDivElement>(null);

  // When stacked under the calendar on small screens, bring the times into view.
  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <div ref={ref} className="animate-rise flex scroll-mt-4 flex-col md:w-56">
      <h3 className="mb-4 text-[15px]">{formatDay(day, "EEEE, MMMM d")}</h3>
      <ul className="-mr-3 flex flex-col gap-2.5 overflow-y-auto pr-3 md:max-h-[404px]">
        {slots.map((slot) => {
          const label = formatTime(slot, timezone);
          return (
            <li key={slot} className="flex gap-2">
              {slot === selected ? (
                <>
                  <span className="flex h-13 flex-1 items-center justify-center rounded-md bg-muted text-[15px] font-bold text-surface">
                    {label}
                  </span>
                  <button
                    type="button"
                    autoFocus
                    onClick={() => props.onConfirm(slot)}
                    className="animate-rise h-13 flex-1 rounded-md bg-accent text-[15px] font-bold text-white outline-none transition-colors hover:bg-accent-strong focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                  >
                    Next
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => props.onSelect(slot)}
                  className="h-13 w-full rounded-md border border-accent/50 text-[15px] font-bold text-accent outline-none transition-colors hover:border-accent hover:ring-1 hover:ring-accent focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {label}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
