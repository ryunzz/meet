import { useMemo } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { formatZone } from "@/lib/time";

export function TimezoneSelect({ value, onChange }: { value: string; onChange: (tz: string) => void }) {
  const zones = useMemo(() => {
    const all = Intl.supportedValuesOf("timeZone");
    return all.includes(value) ? all : [value, ...all];
  }, [value]);

  // Snapshot the clock once so the "(9:14pm)" labels stay stable across re-renders.
  const now = useMemo(() => new Date(), []);

  return (
    <div className="mt-6">
      <label htmlFor="timezone" className="mb-1.5 block text-[15px] font-bold">
        Time zone
      </label>
      <div className="relative">
        <Globe className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <select
          id="timezone"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full appearance-none truncate rounded-md border border-transparent bg-transparent pl-9 pr-9 text-[15px] outline-none transition-colors hover:border-line focus-visible:border-accent"
        >
          {zones.map((tz) => (
            <option key={tz} value={tz}>
              {formatZone(tz, now)}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      </div>
    </div>
  );
}
