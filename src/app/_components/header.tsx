"use client";

import Image from "next/image";
import type { Session } from "next-auth";
import { useUserPreferences } from "~/contexts/user-preferences-context";
import { AuthButton } from "./auth-button";
import { ThemeToggle } from "./theme-toggle";

interface HeaderProps {
  session: Session | null;
}

/**
 * Header component for the application.
 *
 * @param props - Component props
 * @param props.session - The authenticated user session, or null if not authenticated
 * @returns The header element
 */
export function Header({ session }: HeaderProps) {
  const { theme } = useUserPreferences();

  return (
    <header className="flex items-center justify-between p-4">
      {/* Logo */}
      <Image
        src="/logo/logo.svg"
        alt="Ritmo"
        width={32}
        height={32}
        className="h-14 w-auto transition-all"
        style={{
          filter: theme === "light" ? "invert(1)" : "invert(0)",
        }}
      />

      {/* Right side buttons */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <AuthButton session={session} />
      </div>
    </header>
  );
}
