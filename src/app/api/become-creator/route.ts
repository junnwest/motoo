import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Single entry for the "become a creator" CTAs. Creating a Studio is an add-on
 * to an existing user account, so this routes the visitor to the right next step
 * and remembers the intent (cookie) so the combined flow — user signup → user
 * onboarding → creator setup — continues automatically to the creator step.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const to = (path: string) => NextResponse.redirect(new URL(path, req.url));

  // ?clear=1 — drop the intent and go back to a plain signup.
  if (url.searchParams.get("clear") === "1") {
    const res = to("/signup");
    res.cookies.delete("creatorIntent");
    return res;
  }

  const session = await auth();
  const remember = (res: NextResponse) => {
    res.cookies.set("creatorIntent", "1", {
      httpOnly: true,
      path: "/",
      maxAge: 1800,
      sameSite: "lax",
    });
    return res;
  };

  if (!session?.user) return remember(to("/signup")); // sign up as a user first
  if (!session.user.onboarded) return remember(to("/onboarding")); // finish user onboarding
  if (session.user.creator) return to("/studio"); // already a creator
  return to("/creator/onboarding"); // signed-in user → creator setup
}
