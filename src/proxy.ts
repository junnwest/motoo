import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Edge middleware — uses the Prisma-free config. The `authorized` callback in
// auth.config.ts redirects a signed-in, non-onboarded fan to /onboarding.
export default NextAuth(authConfig).auth;

export const config = {
  // Run on all pages except API routes, Next internals, and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
