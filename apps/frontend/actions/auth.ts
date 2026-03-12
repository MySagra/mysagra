"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function login(username: string, password: string) {
  try {
    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { success: false, error: "Credenziali non valide" };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Credenziali non valide" };
        default:
          return { success: false, error: "Errore durante il login" };
      }
    }

    return { success: false, error: "Errore durante il login" };
  }
}

export async function logout() {
  // Redirect to the force-logout route handler which properly
  // clears both backend and NextAuth cookies via Set-Cookie headers
  redirect("/api/auth/force-logout");
}

