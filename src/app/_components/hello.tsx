"use client";

import type { Session } from "next-auth";
import { getGreeting } from "~/utils/time";

interface HelloProps {
  session: Session;
}

/**
 * Displays a time-based greeting message with the user's name.
 *
 * Shows "Good morning", "Good afternoon", or "Good evening" based on the current time,
 * followed by the authenticated user's name.
 *
 * @param props - Component props
 * @param props.session - The authenticated user session containing user information
 * @returns A heading element with the personalized greeting
 */
export function Hello({ session }: HelloProps) {
  const greeting = getGreeting();

  return (
    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
      {greeting.emoji} {greeting.text}, {session.user.name}
    </h1>
  );
}
