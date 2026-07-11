"use server";

import { signOut } from "@/auth";

/** Sign the current user out and return to the home page. Used by the Nav. */
export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
