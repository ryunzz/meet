"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { addDays, addMinutes } from "date-fns";
import type { BookingResult } from "@/app/api/book/route";
import { Card } from "@/components/card";
import { site, type MeetingType } from "@/lib/config";
import { dayOf, formatDay, monthOf, monthRange, shiftMonth } from "@/lib/time";
import { Confirmation } from "./confirmation";
import { DetailsForm } from "./details-form";
import { EventSummary } from "./event-summary";
import { MonthCalendar } from "./month-calendar";
import { TimeList } from "./time-list";
import { TimezoneSelect } from "./timezone-select";

type Step =
  | { name: "pick" }
  | { name: "details"; slot: string }
  | { name: "done"; booking: BookingResult; guest: { name: string; email: string } };

const noopSubscribe = () => () => {};
const getBrowserTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export function Scheduler({ meetingType }: { meetingType: MeetingType }) {
  // null during SSR; the guest's zone once hydrated.
  const browserTimezone = useSyncExternalStore(noopSubscribe, getBrowserTimezone, () => null);
  const [chosenTimezone, setTimezone] = useState<string | null>(null);
  const timezone = chosenTimezone ?? browserTimezone;

  const [chosenMonth, setMonth] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [step, setStep] = useState<Step>({ name: "pick" });
  const [notice, setNotice] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const now = useMemo(() => new Date(), []);
  const firstMonth = timezone ? monthOf(now, timezone) : null;
  const lastMonth = timezone ? monthOf(addDays(now, site.maxBookingDays), timezone) : null;
  const month = chosenMonth ?? firstMonth;

  const { slotsByDay, loading, error } = useMonthSlots(meetingType.slug, month, timezone, refreshKey);
  const activeDay = selectedDay && month && selectedDay.startsWith(month) ? selectedDay : null;

  if (step.name === "done" && timezone) {
    return (
      <Card className="max-w-[680px]">
        <Confirmation meetingType={meetingType} booking={step.booking} guest={step.guest} timezone={timezone} />
      </Card>
    );
  }

  if (step.name === "details" && timezone) {
    const end = addMinutes(new Date(step.slot), meetingType.duration).toISOString();
    return (
      <Card className="max-w-[1060px] md:flex">
        <EventSummary
          meetingType={meetingType}
          booking={{ start: step.slot, end, timezone }}
          onBack={() => setStep({ name: "pick" })}
        />
        <section className="flex-1 p-6 md:p-8">
          <DetailsForm
            meetingType={meetingType}
            slot={step.slot}
            timezone={timezone}
            onBooked={(booking, guest) => setStep({ name: "done", booking, guest })}
            onConflict={(message) => {
              setNotice(message);
              setSelectedSlot(null);
              setRefreshKey((k) => k + 1);
              setStep({ name: "pick" });
            }}
          />
        </section>
      </Card>
    );
  }

  return (
    <Card
      className={`transition-[max-width] duration-300 md:flex ${activeDay ? "max-w-[1060px]" : "max-w-[820px]"}`}
    >
      <EventSummary meetingType={meetingType} />

      <section className="flex-1 p-6 md:p-8">
        <h2 className="mb-6 text-xl font-bold">Select a date &amp; time</h2>

        {notice && (
          <p role="status" className="mb-6 rounded-md bg-accent-soft px-4 py-3 text-[15px] text-ink">
            {notice}
          </p>
        )}

        {!timezone || !month || !firstMonth || !lastMonth ? (
          <div className="h-[420px]" aria-busy />
        ) : (
          <div className="flex flex-col gap-8 md:flex-row">
            <div className="relative min-w-0 flex-1 md:max-w-[400px]">
              <MonthCalendar
                month={month}
                today={dayOf(now, timezone)}
                available={new Set(Object.keys(slotsByDay))}
                selected={activeDay}
                loading={loading}
                canGoBack={month > firstMonth}
                canGoForward={month < lastMonth}
                onMonthChange={(delta) => setMonth(shiftMonth(month, delta))}
                onSelect={(day) => {
                  setSelectedDay(day);
                  setSelectedSlot(null);
                  setNotice(null);
                }}
              />

              {!loading && (error || Object.keys(slotsByDay).length === 0) && (
                <EmptyMonth
                  message={error ?? `No times left in ${formatDay(month, "MMMM")}.`}
                  action={
                    error
                      ? { label: "Try again", run: () => setRefreshKey((k) => k + 1) }
                      : month < lastMonth
                        ? { label: "View next month", run: () => setMonth(shiftMonth(month, 1)) }
                        : null
                  }
                />
              )}

              <TimezoneSelect value={timezone} onChange={setTimezone} />
            </div>

            {activeDay && slotsByDay[activeDay] && (
              <TimeList
                key={activeDay}
                day={activeDay}
                slots={slotsByDay[activeDay]}
                timezone={timezone}
                selected={selectedSlot}
                onSelect={setSelectedSlot}
                onConfirm={(slot) => setStep({ name: "details", slot })}
              />
            )}
          </div>
        )}
      </section>
    </Card>
  );
}

function EmptyMonth(props: { message: string; action: { label: string; run: () => void } | null }) {
  return (
    <div className="absolute inset-x-0 top-24 flex justify-center">
      <div className="animate-rise flex flex-col items-center gap-3 rounded-lg bg-surface px-6 py-4 text-center shadow-[0_2px_16px_rgba(0,0,0,0.12)]">
        <p className="text-[15px] font-medium">{props.message}</p>
        {props.action && (
          <button
            type="button"
            onClick={props.action.run}
            className="rounded-full border border-accent px-4 py-1.5 text-sm font-bold text-accent outline-none transition-colors hover:bg-accent-soft focus-visible:ring-2 focus-visible:ring-accent"
          >
            {props.action.label}
          </button>
        )}
      </div>
    </div>
  );
}

/** Fetches a month of slots (as seen in `timezone`) and groups them by day. */
function useMonthSlots(type: string, month: string | null, timezone: string | null, refreshKey: number) {
  const key = month && timezone ? `${type}|${month}|${timezone}|${refreshKey}` : null;
  const [result, setResult] = useState<{ key: string; slots: string[]; error: string | null } | null>(null);

  useEffect(() => {
    if (!key || !month || !timezone) return;
    const controller = new AbortController();
    const { from, to } = monthRange(month, timezone);
    const query = new URLSearchParams({ type, from: from.toISOString(), to: to.toISOString() });

    fetch(`/api/slots?${query}`, { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setResult({ key, slots: data.slots, error: null });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setResult({ key, slots: [], error: err.message || "Couldn't load availability." });
      });

    return () => controller.abort();
  }, [key, type, month, timezone]);

  const current = result?.key === key ? result : null;

  const slotsByDay = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    if (!current || !timezone) return grouped;
    for (const slot of current.slots) {
      (grouped[dayOf(slot, timezone)] ??= []).push(slot);
    }
    return grouped;
  }, [current, timezone]);

  return { slotsByDay, loading: !current, error: current?.error ?? null };
}
