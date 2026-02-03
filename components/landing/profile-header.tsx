"use client";

import Image from "next/image";
import { useState } from "react";
import { config } from "@/lib/config";

export function ProfileHeader() {
  const [imageError, setImageError] = useState(false);
  const initials = config.owner.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col items-center text-center">
      {/* Avatar */}
      <div className="relative w-24 h-24 mb-4">
        {imageError ? (
          <div className="w-full h-full rounded-full bg-primary flex items-center justify-center">
            <span className="text-2xl font-semibold text-primary-foreground">
              {initials}
            </span>
          </div>
        ) : (
          <Image
            src={config.owner.avatar}
            alt={config.owner.name}
            fill
            className="rounded-full object-cover"
            priority
            onError={() => setImageError(true)}
          />
        )}
      </div>

      {/* Name and tagline */}
      <h1 className="text-2xl font-semibold">{config.owner.name}</h1>
      <p className="text-muted-foreground mt-1">{config.owner.tagline}</p>
    </div>
  );
}
