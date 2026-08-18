/**
 * Host routing and the onboarding gate (docs/PRELAUNCH.md #20).
 *
 * These three predicates decide which domain serves a URL and who is allowed
 * past onboarding. Nothing throws when they are wrong — people land on the
 * wrong host, or walk past a gate that was supposed to stop them — which is
 * exactly the kind of rule that needs a test rather than a careful reading.
 *
 * They are also the rules most likely to be broken by someone adding a route
 * and not knowing these lists exist. That is what the "adding a Studio route"
 * case below is for: it fails loudly if the allowlist and the route group ever
 * disagree.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isStudioPage, splitEnabled } from "@/lib/hostRouting";
import { isOnboardingExempt } from "@/auth.config";

describe("isStudioPage", () => {
  it("claims the Studio's own routes", () => {
    assert.equal(isStudioPage("/"), true);
    assert.equal(isStudioPage("/settings"), true);
    assert.equal(isStudioPage("/settings/anything"), true);
  });

  it("disclaims consumer routes, which belong on the apex", () => {
    for (const p of ["/explore", "/home", "/profile", "/refund", "/search", "/admin"]) {
      assert.equal(isStudioPage(p), false, `${p} should go to the apex`);
    }
  });

  // The prefix check must not match a path that merely starts with the same
  // letters — /settingsomething is not a Studio page.
  it("matches on path segments, not string prefixes", () => {
    assert.equal(isStudioPage("/settingsomething"), false);
    assert.equal(isStudioPage("/settings-export"), false);
  });
});

describe("splitEnabled", () => {
  it("is on for production and localhost, with or without a port", () => {
    for (const h of [
      "themotoo.com",
      "www.themotoo.com",
      "studio.themotoo.com",
      "localhost:3000",
      "studio.localhost:3000",
    ]) {
      assert.equal(splitEnabled(h), true, `${h} should split`);
    }
  });

  // Preview deploys have no studio subdomain. If the split were on there, every
  // preview would redirect to a host that does not exist.
  it("is off for Vercel preview hosts", () => {
    assert.equal(splitEnabled("motoo-abc123-junnwests-projects.vercel.app"), false);
    assert.equal(splitEnabled("motoo.vercel.app"), false);
  });

  // "notthemotoo.com" ends with "themotoo.com" as a *string*. The check is
  // written as `=== "themotoo.com" || endsWith(".themotoo.com")` precisely so
  // that a lookalike domain cannot opt itself into the split.
  it("does not match a lookalike domain", () => {
    assert.equal(splitEnabled("notthemotoo.com"), false);
    assert.equal(splitEnabled("evil-themotoo.com"), false);
  });
});

describe("isOnboardingExempt", () => {
  it("lets a half-onboarded user reach onboarding and what it links to", () => {
    for (const p of ["/onboarding", "/terms", "/privacy", "/refund"]) {
      assert.equal(isOnboardingExempt(p), true, `${p} should be reachable`);
    }
  });

  // A stale cookie pointing at a deleted account has to be able to escape to
  // re-auth, or /onboarding ↔ /login loops forever. This bit someone once.
  it("lets a broken session escape to login or signup", () => {
    assert.equal(isOnboardingExempt("/login"), true);
    assert.equal(isOnboardingExempt("/signup"), true);
  });

  it("gates everything that costs or reveals something", () => {
    for (const p of ["/home", "/explore", "/profile", "/settings", "/s/creatorA", "/admin"]) {
      assert.equal(isOnboardingExempt(p), false, `${p} should be gated`);
    }
  });

  it("matches on segments, so a lookalike path is still gated", () => {
    assert.equal(isOnboardingExempt("/onboarding"), true);
    assert.equal(isOnboardingExempt("/onboarding/step-2"), true);
    assert.equal(isOnboardingExempt("/refunds-are-great"), false);
    assert.equal(isOnboardingExempt("/loginish"), false);
  });
});
