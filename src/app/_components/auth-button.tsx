import Link from "next/link";
import type { Session } from "next-auth";

interface AuthButtonProps {
  session: Session | null;
}

export function AuthButton({ session }: AuthButtonProps) {
  if (!session) {
    return (
      <Link
        href="/api/auth/signin"
        className="rounded-full px-5 py-2 text-sm font-medium no-underline transition-all duration-200"
        style={{
          backgroundColor: "var(--accent)",
          color: "#0e0c0a",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
      >
        Sign in
      </Link>
    );
  }

  return (
    <Link
      href="/api/auth/signout"
      className="rounded-full px-5 py-2 text-sm font-medium no-underline transition-all duration-200"
      style={{
        backgroundColor: "var(--btn)",
        color: "var(--fg)",
        border: "1px solid var(--border)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--btn-hover)";
        e.currentTarget.style.borderColor = "var(--accent-border)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "var(--btn)";
        e.currentTarget.style.borderColor = "var(--border)";
      }}
    >
      Sign out
    </Link>
  );
}
