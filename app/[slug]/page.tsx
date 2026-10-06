import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Scheduler } from "@/components/scheduler/scheduler";
import { getMeetingType, meetingTypes } from "@/lib/config";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return meetingTypes.map((mt) => ({ slug: mt.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const meetingType = getMeetingType((await params).slug);
  return meetingType ? { title: meetingType.title, description: meetingType.description } : {};
}

export default async function BookingPage({ params }: PageProps) {
  const meetingType = getMeetingType((await params).slug);
  if (!meetingType) notFound();

  return <Scheduler meetingType={meetingType} />;
}
