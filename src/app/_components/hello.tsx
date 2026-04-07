"use client";

import type { Session } from "next-auth";
import Link from "next/link";
import { getGreeting } from "~/utils/time";

interface HelloProps {
  session: Session | null;
}

export function Hello({ session }: HelloProps) {
  const greeting = getGreeting();

  if (!session) {
    return (
      <div className="animate-fade-up flex flex-col gap-6">
        <p
          className="text-sm font-medium tracking-[0.2em] uppercase"
          style={{ color: "var(--accent)" }}
        >
          ritmo
        </p>
        <h1
          className="max-w-2xl text-5xl leading-[1.05] font-normal italic sm:text-6xl lg:text-7xl xl:text-8xl"
          style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
        >
          Build the rhythm
          <br />
          <span style={{ color: "var(--accent)" }}>of a better life.</span>
        </h1>
        <p
          className="max-w-sm text-base leading-relaxed"
          style={{ color: "var(--fg-muted)" }}
        >
          Track your daily habits with elegant simplicity. Every small action
          compounds into something extraordinary.
        </p>
        <Link
          href="/auth/signin"
          className="inline-flex w-fit items-center gap-2 rounded-full px-6 py-3 text-sm font-medium no-underline transition-all duration-200"
          style={{
            backgroundColor: "var(--accent)",
            color: "#0e0c0a",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.85";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          Get started
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <p
        className="mb-2 text-sm font-medium tracking-[0.2em] uppercase"
        style={{ color: "var(--accent)" }}
      >
        {greeting.text.split(",")[0]?.toLowerCase()}
      </p>
      <h1
        className="text-4xl font-normal italic sm:text-5xl lg:text-6xl xl:text-7xl"
        style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
      >
        {session.user.name}
      </h1>
    </div>
  );
}
