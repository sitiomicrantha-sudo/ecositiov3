"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export type LoginResult =
  | { success: true }
  | { success: false; error: string };

export async function login(formData: FormData): Promise<LoginResult> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "E-mail ou senha inválidos" };
        default:
          return { success: false, error: "Erro ao fazer login" };
      }
    }

    if ((error as Error).message.includes("NEXT_REDIRECT")) {
      return { success: true };
    }

    return { success: false, error: "Erro inesperado" };
  }
}
