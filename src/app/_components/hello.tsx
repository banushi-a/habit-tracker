"use client";

import type { Session } from "next-auth";
import Link from "next/link";
import { getGreeting } from "~/utils/time";

interface HelloProps {
  session: Session | null;
}

/**
 * Displays a time-based greeting message with the user's name when logged in,
 * or a call-to-action to log in when not authenticated.
 *
 * Shows "Good morning", "Good afternoon", or "Good evening" based on the current time,
 * followed by the authenticated user's name.
 *
 * @param props - Component props
 * @param props.session - The authenticated user session containing user information, or null if not logged in
 * @returns A heading element with the personalized greeting or login prompt
 */
export function Hello({ session }: HelloProps) {
  const greeting = getGreeting();

  if (!session) {
    return (
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
          Ready to Start Tracking Habits?
        </h1>
        <Link
          href="/auth/signin"
          className="rounded-full px-6 py-3 font-semibold no-underline transition-all duration-300"
          style={{ backgroundColor: "hsl(var(--button-bg))" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "hsl(var(--button-bg-hover))";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "hsl(var(--button-bg))";
          }}
        >
          Log In
        </Link>
      </div>
    );
  }

  return (
    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
      {greeting.emoji} {greeting.text}, {session.user.name}
    </h1>
  );
}
