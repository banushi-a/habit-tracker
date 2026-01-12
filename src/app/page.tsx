import { auth } from "~/server/auth";
import { HabitsDashboard } from "./_components/habits-dashboard";
import { Header } from "./_components/header";
import { Hello } from "./_components/hello";

export default async function Home() {
  const session = await auth();

  return (
    <>
      <Header session={session} />
      <main className="m-24 flex flex-col items-start justify-start">
        {session && (
          <>
            <Hello session={session} />
            <div className="mt-24 w-full">
              <HabitsDashboard days={365} />
            </div>
          </>
        )}
      </main>
    </>
  );
}
