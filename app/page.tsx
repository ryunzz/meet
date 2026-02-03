import { BookingFlow } from "@/components/booking/booking-flow";
import { getMeetingType } from "@/lib/config";

export default function HomePage() {
  const meetingType = getMeetingType("30min")!;

  return (
    <div className="min-h-screen py-8">
      <BookingFlow meetingType={meetingType} />
    </div>
  );
}
