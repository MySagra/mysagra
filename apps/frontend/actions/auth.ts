"use server";

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";

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
        case "CallbackRouteError":
          return { success: false, error: "Errore di autenticazione" };
        default:
          return { success: false, error: "Errore durante il login" };
      }
    }

    return { success: false, error: "Errore durante il login" };
  }
}

export async function logout() {
  await signOut({ redirect: false });
  return { success: true };
}
