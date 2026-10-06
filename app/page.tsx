import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Card } from "@/components/card";
import { meetingTypes, site } from "@/lib/config";

export default function HomePage() {
  return (
    <Card className="max-w-[640px]">
      <header className="flex flex-col items-center border-b border-line px-6 py-10 text-center">
        <Avatar size={72} />
        <h1 className="mt-4 text-xl font-bold">{site.owner.name}</h1>
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted">
          {site.owner.intro.map((part, i) =>
            typeof part === "string" ? (
              part
            ) : (
              <a
                key={i}
                href={part.href}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-accent underline-offset-2 hover:underline"
              >
                {part.text}
              </a>
            )
          )}
        </p>
      </header>

      <ul className="divide-y divide-line">
        {meetingTypes.map((mt) => (
          <li key={mt.slug} className="overflow-hidden sm:last:rounded-b-xl">
            <Link
              href={`/${mt.slug}`}
              className="group flex h-full items-start gap-4 px-6 py-6 outline-none transition-colors hover:bg-page focus-visible:bg-page focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
            >
              <span className="mt-1.5 size-4 shrink-0 rounded-full" style={{ backgroundColor: mt.color }} />
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-bold">{mt.title}</span>
                <span className="mt-1 block text-sm text-muted">{mt.description}</span>
              </span>
              <ChevronRight className="mt-1 size-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
