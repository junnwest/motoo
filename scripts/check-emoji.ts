/**
 * No-emoji safety net (DECISIONS 2026-07-29).
 *
 * motoo ships no emoji in the UI: every glyph a user sees is a line icon from
 * src/components/ui/Icons.tsx. Emoji render in the OS emoji font, so they shift
 * between platforms, can't inherit brand color, and read as vibe-coded next to a
 * hand-built icon set.
 *
 * Scans the two places user-visible glyphs can enter: the copy catalogs
 * (messages/*.json) and the app source (src/**). Typographic symbols that are
 * NOT emoji — arrows (→ ← ↔ ↗), check/cross marks (✓ ✕ ○), and the like — are
 * deliberately allowed; they're punctuation, not pictographs.
 *
 * Run: pnpm check:emoji
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Pictographic ranges only. Note this deliberately excludes U+2190–U+21FF
 * (arrows) and the U+2713/U+2715 check-and-cross block, which we use as
 * typography.
 */
const EMOJI =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2705}\u{274C}\u{2728}\u{2B00}-\u{2BFF}\u{231A}-\u{231B}\u{23E9}-\u{23FA}\u{2934}-\u{2935}\u{FE0F}\u{20E3}]/u;

const ROOT = process.cwd();
const SRC_DIR = join(ROOT, "src");
const MESSAGES_DIR = join(ROOT, "messages");

interface Finding {
  file: string;
  line: number;
  text: string;
}

const findings: Finding[] = [];

function scanFile(path: string) {
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  lines.forEach((text, i) => {
    if (EMOJI.test(text)) {
      findings.push({
        file: relative(ROOT, path).replace(/\\/g, "/"),
        line: i + 1,
        text: text.trim().slice(0, 100),
      });
    }
  });
}

function walk(dir: string, exts: string[]) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      walk(path, exts);
    } else if (exts.some((e) => entry.endsWith(e))) {
      scanFile(path);
    }
  }
}

walk(SRC_DIR, [".ts", ".tsx"]);
walk(MESSAGES_DIR, [".json"]);

if (findings.length > 0) {
  console.error("✗ Emoji found in user-facing code. Use a line icon from");
  console.error("  src/components/ui/Icons.tsx instead (DECISIONS 2026-07-29).\n");
  for (const f of findings) {
    console.error(`   ${f.file}:${f.line} → ${f.text}`);
  }
  process.exit(1);
}

console.log(
  "✓ No emoji in src/ or messages/. Every user-visible glyph is a line icon.",
);
