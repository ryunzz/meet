import Link from "next/link";
import { Card } from "@/components/card";

export default function NotFound() {
  return (
    <Card className="max-w-md px-6 py-12 text-center">
      <h1 className="text-xl font-bold">This page doesn&apos;t exist</h1>
      <p className="mt-2 text-[15px] text-muted">The link may be mistyped, or the meeting type was removed.</p>
      <Link href="/" className="mt-6 inline-block text-[15px] font-medium text-accent hover:underline">
        See all meeting types
      </Link>
    </Card>
  );
}
