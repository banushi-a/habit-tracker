"use client";

import { handleSignOut } from "./actions";

export default function SignOutPage() {
  return (
    <main className="flex h-screen flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Sign out
        </h1>
        <p className="text-lg" style={{ color: "hsl(var(--foreground) / 0.7)" }}>
          Are you sure you want to sign out?
        </p>
        <form action={handleSignOut}>
          <button
            type="submit"
            className="rounded-full px-10 py-3 font-semibold no-underline transition-all duration-300"
            style={{ backgroundColor: "hsl(var(--button-bg))" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "hsl(var(--button-bg-hover))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "hsl(var(--button-bg))";
            }}
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
