import { redirect } from "next/navigation";

/** /me/mochi's content moved into /profile (DECISIONS 2026-07-30). */
export default function MyMochiRedirect() {
  redirect("/profile");
}
