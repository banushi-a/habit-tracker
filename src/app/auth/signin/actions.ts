"use server";

import { signIn } from "~/server/auth";

export async function handleSignIn() {
  await signIn("discord", { redirectTo: "/" });
}
