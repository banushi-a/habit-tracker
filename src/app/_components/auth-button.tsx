import Link from "next/link";
import type { Session } from "next-auth";

interface AuthButtonProps {
  session: Session | null;
}

/**
 * Authentication button component that displays sign in or sign out options.
 *
 * Shows a "Sign in" button for unauthenticated users and a "Sign out" button
 * for authenticated users.
 *
 * @param props - Component props
 * @param props.session - The authenticated user session, or null if not authenticated
 * @returns A link button for authentication
 */
export function AuthButton({ session }: AuthButtonProps) {
  return (
    <Link
      href={session ? "/api/auth/signout" : "/api/auth/signin"}
      className="rounded-full px-10 py-3 font-semibold no-underline transition-all duration-300"
      style={{
        backgroundColor: "hsl(var(--button-bg))",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "hsl(var(--button-bg-hover))";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "hsl(var(--button-bg))";
      }}
    >
      {session ? "Sign out" : "Sign in"}
    </Link>
  );
}
