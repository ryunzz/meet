import { notFound } from "next/navigation";
import { BookingFlow } from "@/components/booking/booking-flow";
import { config, getMeetingType } from "@/lib/config";
import type { Metadata } from "next";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for all meeting types
export function generateStaticParams() {
  return config.meetingTypes.map((mt) => ({
    slug: mt.slug,
  }));
}

// Generate metadata for the page
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const meetingType = getMeetingType(slug);

  if (!meetingType) {
    return {
      title: "Not Found",
    };
  }

  return {
    title: `${meetingType.title} - ${config.owner.name}`,
    description: meetingType.description || `Book a ${meetingType.duration} minute meeting with ${config.owner.name}`,
  };
}

export default async function BookingPage({ params }: PageProps) {
  const { slug } = await params;
  const meetingType = getMeetingType(slug);

  if (!meetingType) {
    notFound();
  }

  return (
    <div className="min-h-screen py-8">
      {/* Back link */}
      <div className="max-w-2xl mx-auto px-4 mb-4">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeftIcon className="w-4 h-4 mr-1" />
          Back
        </Link>
      </div>

      {/* Booking flow */}
      <BookingFlow meetingType={meetingType} />
    </div>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}
