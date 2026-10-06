import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import type { BookingResult } from "@/app/api/book/route";
import type { MeetingType } from "@/lib/config";

const fieldClass =
  "w-full rounded-md border border-line bg-surface px-3.5 text-[15px] outline-none transition-colors hover:border-muted focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60";

export function DetailsForm(props: {
  meetingType: MeetingType;
  slot: string;
  timezone: string;
  onBooked: (booking: BookingResult, guest: { name: string; email: string }) => void;
  /** The slot was taken in the meantime. */
  onConflict: (message: string) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name")).trim();
    const email = String(form.get("email")).trim();

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: props.meetingType.slug,
          start: props.slot,
          timezone: props.timezone,
          name,
          email,
          notes: form.get("notes"),
          website: form.get("website"),
        }),
      });
      const data = await res.json();

      if (res.status === 409) return props.onConflict(data.error);
      if (!res.ok) throw new Error(data.error);
      props.onBooked(data, { name, email });
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Couldn't create the booking. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="animate-rise flex max-w-md flex-col gap-5">
      <h2 className="text-xl font-bold">Enter details</h2>

      <Field label="Name" htmlFor="name">
        <input id="name" name="name" required autoComplete="name" disabled={submitting} className={`${fieldClass} h-11`} />
      </Field>

      <Field label="Email" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          disabled={submitting}
          className={`${fieldClass} h-11`}
        />
      </Field>

      <Field label="Anything that will help prepare for the meeting?" htmlFor="notes" optional>
        <textarea id="notes" name="notes" rows={4} maxLength={2000} disabled={submitting} className={`${fieldClass} resize-y py-2.5`} />
      </Field>

      {/* Honeypot for bots; hidden from people and assistive tech. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      {error && (
        <p role="alert" className="text-[15px] text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 flex h-12 items-center justify-center gap-2 self-start rounded-full bg-accent px-6 text-[15px] font-bold text-white outline-none transition-colors hover:bg-accent-strong focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-70"
      >
        {submitting && <LoaderCircle className="size-4 animate-spin" />}
        {submitting ? "Scheduling…" : "Schedule event"}
      </button>
    </form>
  );
}

function Field(props: { label: string; htmlFor: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={props.htmlFor} className="mb-1.5 block text-[15px] font-bold">
        {props.label}
        {!props.optional && <span className="text-danger"> *</span>}
      </label>
      {props.children}
    </div>
  );
}
