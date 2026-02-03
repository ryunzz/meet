import { ProfileHeader } from "@/components/landing/profile-header";
import { MeetingTypeCard } from "@/components/landing/meeting-type-card";
import { config } from "@/lib/config";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16">
      <div className="w-full max-w-md space-y-8">
        {/* Profile header */}
        <ProfileHeader />

        {/* Meeting types */}
        <div className="space-y-4">
          {config.meetingTypes.map((meetingType) => (
            <MeetingTypeCard
              key={meetingType.slug}
              meetingType={meetingType}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
