import { signOut } from "~/server/auth";

export default function SignOutPage() {
  return (
    <main className="flex h-screen flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Sign out
        </h1>
        <p className="text-lg text-white/70">
          Are you sure you want to sign out?
        </p>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
