import { auth } from "~/server/auth";
import { Footer } from "./_components/footer";
import { HabitsDashboard } from "./_components/habits-dashboard";
import { Header } from "./_components/header";
import { Hello } from "./_components/hello";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <Header session={session} />
      <main className="mx-4 my-8 flex flex-1 flex-col items-start justify-start sm:mx-12 sm:my-16 lg:mx-24 lg:my-24">
        <Hello session={session} />
        {session && (
          <div className="mt-8 w-full sm:mt-16 lg:mt-24">
            <HabitsDashboard days={365} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
