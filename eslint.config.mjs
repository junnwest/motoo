import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The visual handoff from design: reference HTML/JS, not application source.
    // It isn't built, imported, or shipped, and one of its files isn't even
    // valid JS — it was producing two of the four long-standing lint failures
    // for code nobody maintains. Linting it never told us anything useful.
    "design-handoff/**",
  ]),
]);

export default eslintConfig;
