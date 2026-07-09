/**
 * Banned-vocabulary safety net (spec §2).
 *
 * motoo is NOT a financial product. Investment/return vocabulary must not appear
 * in user-facing copy. All copy lives in messages/*.json (no hardcoded strings),
 * so scanning those catalogs covers the product surface.
 *
 * The ONE sanctioned exception is the negation disclosures ("this is support,
 * NOT an investment; there is no financial return"), which the spec itself
 * mandates — those keys are allowlisted.
 *
 * Run: pnpm check:vocab
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Terms that must never appear outside a sanctioned disclosure. The Korean terms
// carry direct regulatory meaning (조각투자 = fractional investment, etc.).
const STRICT = [
  "invest",
  "investor",
  "investment",
  "roi",
  "dividend",
  "equity",
  "portfolio",
  "투자",
  "수익권",
  "조각투자",
  "배당",
  "원금",
];

// Ambiguous in English ("share a report", "profit" in prose). Reported as
// warnings so a human can eyeball them, but they don't fail the build.
const CONTEXTUAL = ["return", "profit", "yield", "stake", "\\bshare\\b"];

// Key paths (dotted) permitted to contain the strict negation language.
const ALLOWLIST = ["disclosure", "mochiExplainer", "fanDisclosure"];

const MESSAGES_DIR = join(process.cwd(), "messages");

interface Finding {
  file: string;
  key: string;
  term: string;
  value: string;
}

function flatten(obj: unknown, prefix = ""): [string, string][] {
  const out: [string, string][] = [];
  if (typeof obj === "string") return [[prefix, obj]];
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      out.push(...flatten(v, prefix ? `${prefix}.${k}` : k));
    }
  }
  return out;
}

function isAllowlisted(key: string): boolean {
  return ALLOWLIST.some((a) => key.toLowerCase().includes(a.toLowerCase()));
}

function scan(terms: string[], entries: [string, string][], file: string) {
  const findings: Finding[] = [];
  for (const [key, value] of entries) {
    if (isAllowlisted(key)) continue;
    for (const term of terms) {
      const re = new RegExp(term, "i");
      if (re.test(value)) {
        findings.push({ file, key, term: term.replace(/\\b/g, ""), value });
      }
    }
  }
  return findings;
}

function main() {
  const files = readdirSync(MESSAGES_DIR).filter((f) => f.endsWith(".json"));
  const strictFindings: Finding[] = [];
  const contextualFindings: Finding[] = [];

  for (const file of files) {
    const raw = readFileSync(join(MESSAGES_DIR, file), "utf8");
    const entries = flatten(JSON.parse(raw));
    strictFindings.push(...scan(STRICT, entries, file));
    contextualFindings.push(...scan(CONTEXTUAL, entries, file));
  }

  if (contextualFindings.length) {
    console.log("\n⚠  Contextual matches (review, non-blocking):");
    for (const f of contextualFindings) {
      console.log(`   ${f.file} · ${f.key} · "${f.term}" → ${f.value}`);
    }
  }

  if (strictFindings.length) {
    console.error("\n✗ BANNED vocabulary found in user-facing copy (spec §2):");
    for (const f of strictFindings) {
      console.error(`   ${f.file} · ${f.key} · "${f.term}" → ${f.value}`);
    }
    console.error(
      `\n${strictFindings.length} violation(s). Use: back / support / perk / reward / record.\n`,
    );
    process.exit(1);
  }

  console.log(
    `\n✓ No banned vocabulary in ${files.length} message catalog(s). motoo stays a support product, not a financial one.\n`,
  );
}

main();
