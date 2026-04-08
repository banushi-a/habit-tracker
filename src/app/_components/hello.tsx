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
      <div className="relative flex flex-col gap-7">
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute -left-20 -top-12 h-64 w-64 opacity-50"
          style={{
            background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
            filter: "blur(36px)",
          }}
        />

        {/* Badge */}
        <div className="animate-fade-up inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5"
          style={{
            backgroundColor: "var(--accent-glow)",
            border: "1px solid var(--accent-border)",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: "var(--accent)" }}
          />
          <span
            className="text-xs font-medium tracking-[0.18em] uppercase"
            style={{ color: "var(--accent)" }}
          >
            ritmo
          </span>
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-up-delay-1 max-w-2xl text-5xl leading-[1.05] font-normal italic sm:text-6xl lg:text-7xl xl:text-8xl"
          style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
        >
          Build the rhythm
          <br />
          <span
            style={{
              background: "linear-gradient(120deg, var(--accent) 0%, #e8c96a 60%, var(--accent) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            of a better life.
          </span>
        </h1>

        {/* Subheading */}
        <p
          className="animate-fade-up-delay-2 max-w-sm text-base leading-relaxed"
          style={{ color: "var(--fg-muted)" }}
        >
          Track your daily habits with elegant simplicity. Every small action
          compounds into something extraordinary.
        </p>

        {/* CTA */}
        <div className="animate-fade-up-delay-3 flex flex-col gap-5">
          <Link
            href="/auth/signin"
            className="inline-flex w-fit items-center gap-2.5 rounded-full px-7 py-3.5 text-sm font-medium no-underline transition-all duration-200"
            style={{
              backgroundColor: "var(--accent)",
              color: "#0e0c0a",
              boxShadow: "0 2px 16px var(--accent-glow)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.88";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Get started — it&apos;s free
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>

          {/* Feature hints */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            {["Visual heatmaps", "Daily streaks", "No noise"].map((f) => (
              <span
                key={f}
                className="flex items-center gap-1.5 text-xs"
                style={{ color: "var(--fg-muted)" }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <p
        className="animate-fade-up text-sm font-medium tracking-[0.2em] uppercase"
        style={{ color: "var(--accent)" }}
      >
        {greeting.text.split(",")[0]?.toLowerCase()}
      </p>
      <h1
        className="animate-fade-up-delay-1 text-4xl font-normal italic sm:text-5xl lg:text-6xl xl:text-7xl"
        style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
      >
        {session.user.name}
      </h1>
    </div>
  );
}
