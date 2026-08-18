/**
 * Automated accessibility audit (docs/PRELAUNCH.md #33).
 *
 * Runs axe-core over the server-rendered HTML of the pages that matter, in
 * jsdom. Start the dev server first:
 *
 *   pnpm dev
 *   pnpm check:a11y
 *
 * **What this is not.** It is not a screen-reader pass. Automated tooling
 * catches roughly a third of real barriers — missing names, broken heading
 * order, unlabelled controls — and is blind to whether the result makes sense
 * to listen to. #33 stays open on that half.
 *
 * It also audits the *initial* HTML, not the app after interaction, so a modal
 * that only exists once opened is out of scope here. That is what makes this
 * cheap enough to run every time, and worth having despite the gap.
 *
 * Colour-contrast is disabled: jsdom does not do layout or resolve stylesheets,
 * so the rule reports "incomplete" for every node and drowns the real findings.
 * Contrast is a design-token question anyway (design-handoff/), decided once
 * rather than per page.
 */
import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.A11Y_BASE ?? "http://localhost:3000";

/** Signed-out pages plus the signed-in ones, which need a session cookie. */
const PUBLIC_PAGES = ["/", "/explore", "/login", "/signup", "/refund", "/youth"];
const SIGNED_IN_PAGES = ["/home", "/profile", "/settings", "/search", "/s/creatorA"];

const DISABLED_RULES = ["color-contrast"];

async function signIn(): Promise<string> {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  const jar = csrfRes.headers.getSetCookie().map((c) => c.split(";")[0]);

  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: jar.join("; "),
    },
    body: new URLSearchParams({
      csrfToken,
      email: "demo@motoo.dev",
      password: "motoo",
    }),
    redirect: "manual",
  });
  return [...jar, ...res.headers.getSetCookie().map((c) => c.split(";")[0])].join("; ");
}

type Violation = {
  id: string;
  impact: string | null;
  help: string;
  nodes: { html: string }[];
};

async function audit(path: string, cookie?: string) {
  const res = await fetch(BASE + path, cookie ? { headers: { cookie } } : {});
  const html = await res.text();
  const dom = new JSDOM(html, {
    url: BASE + path,
    // "outside-only" gives us window.eval to inject axe without executing the
    // page's own scripts — auditing the server-rendered markup is the point,
    // and running Next's bootstrap in jsdom would only produce noise.
    runScripts: "outside-only",
    // axe expects requestAnimationFrame and window.matchMedia to exist.
    pretendToBeVisual: true,
  });

  // axe is injected as a script string rather than imported into this process:
  // it expects to run inside the document it is auditing.
  const axeSource = readFileSync(
    join(process.cwd(), "node_modules/axe-core/axe.min.js"),
    "utf8",
  );
  const { window } = dom;
  window.eval(axeSource);

  const results = await (
    window as unknown as {
      axe: {
        run: (
          ctx: unknown,
          opts: unknown,
        ) => Promise<{ violations: Violation[] }>;
      };
    }
  ).axe.run(window.document, {
    rules: Object.fromEntries(DISABLED_RULES.map((r) => [r, { enabled: false }])),
  });

  dom.window.close();
  return results.violations;
}

async function main() {
  let cookie: string | undefined;
  try {
    cookie = await signIn();
  } catch {
    console.error(
      `Could not reach ${BASE}. Start the dev server first: pnpm dev`,
    );
    process.exit(1);
  }

  let total = 0;
  for (const path of PUBLIC_PAGES) {
    const v = await audit(path);
    report(path, v);
    total += v.length;
  }
  for (const path of SIGNED_IN_PAGES) {
    const v = await audit(path, cookie);
    report(path, v);
    total += v.length;
  }

  if (total > 0) {
    console.error(`\n✗ ${total} accessibility violation(s).`);
    process.exit(1);
  }
  console.log(
    "\n✓ No automated accessibility violations. (Not a screen-reader pass — see the header of this file.)",
  );
}

function report(path: string, violations: Violation[]) {
  if (violations.length === 0) {
    console.log(`  ok   ${path}`);
    return;
  }
  console.log(`  FAIL ${path}`);
  for (const v of violations) {
    console.log(`       [${v.impact ?? "?"}] ${v.id} — ${v.help}`);
    for (const n of v.nodes.slice(0, 3)) {
      console.log(`         ${n.html.slice(0, 120)}`);
    }
    if (v.nodes.length > 3) {
      console.log(`         …and ${v.nodes.length - 3} more`);
    }
  }
}

main();
