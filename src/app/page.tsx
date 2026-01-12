import { auth } from "~/server/auth";
import { Header } from "./_components/header";
import { Hello } from "./_components/hello";

export default async function Home() {
  const session = await auth();

  return (
    <>
      <Header session={session} />
      <main className="m-24 flex min-h-screen flex-col items-start justify-start">
        {session && <Hello session={session} />}
      </main>
    </>
  );
}
