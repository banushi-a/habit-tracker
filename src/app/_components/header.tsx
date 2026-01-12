"use client";

import type { Session } from "next-auth";
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
  return (
    <header className="flex items-center justify-end gap-3 p-4">
      <ThemeToggle />
      <AuthButton session={session} />
    </header>
  );
}
