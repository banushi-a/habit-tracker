"use client";

import Image from "next/image";
import type { Session } from "next-auth";
import { useUserPreferences } from "~/contexts/user-preferences-context";
import { AuthButton } from "./auth-button";
import { ThemeToggle } from "./theme-toggle";

interface HeaderProps {
  session: Session | null;
}

export function Header({ session }: HeaderProps) {
  const { theme } = useUserPreferences();

  return (
    <header
      className="flex items-center justify-between px-6 py-5 sm:px-10 lg:px-16"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <Image
        src="/logo/logo.svg"
        alt="Ritmo"
        width={32}
        height={32}
        className="h-10 w-auto transition-opacity duration-300 hover:opacity-70"
        style={{
          filter: theme === "light" ? "invert(1)" : "invert(0)",
        }}
      />

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <AuthButton session={session} />
      </div>
    </header>
  );
}
