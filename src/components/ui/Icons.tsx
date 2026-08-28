import { SVGProps } from "react";

/**
 * The app's icon set. **motoo ships no emoji in the UI** — every glyph a user
 * sees is one of these, so marks stay monochrome, inherit brand color, and
 * render the same on every platform instead of shifting with the OS emoji font.
 * See DECISIONS 2026-07-29, and `pnpm check:emoji`.
 *
 * ## Construction spec (2026-08-28 renovation)
 *
 * Feather/Lucide-style, but the geometry is now stated rather than implied —
 * the set had drifted and read as uneven when icons sat side by side.
 *
 * - **24×24 grid, 20×20 live area.** Nothing crosses x/y 2 or 22. Before this,
 *   live widths ran from 16 (`Note`) to 20 (`Tape`), which is why a row of
 *   icons looked like mixed sizes rather than one set.
 * - **Optical sizing, not metric.** A circle at the same box size reads smaller
 *   than a square, so round icons run r=9 (18 across) while square containers
 *   run 18 wide and full-bleed shapes 19. They measure differently and look the
 *   same, which is the point.
 * - **2px stroke, round caps and joins, `currentColor`, `fill="none"`.** Set
 *   once on the wrapper so an icon cannot opt out by accident.
 * - **Corner radii from a 3-step scale**: 1.5 (chips), 2.5 (containers),
 *   3.5 (large containers). Four ad-hoc radii were in use before.
 * - **Legible at 16px.** Interior detail is the first thing to go: dots are
 *   real circles rather than `h.01` zero-length paths (which collapsed), and
 *   `Film` lost its sprocket holes for three clean divisions.
 *
 * Drawn for this project in the Feather idiom rather than copied from Feather
 * or Lucide, so the set carries no upstream license obligation.
 */
function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/* ── Actions & messaging ─────────────────────────────────────────────────── */

export function IconSend(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M21.5 2.5 2.6 9.9l8.1 3.4 3.4 8.1 7.4-18.9Z" />
      <path d="M21.5 2.5 10.7 13.3" />
    </Icon>
  );
}

export function IconMail(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="m3.6 7 7.2 5.1a2 2 0 0 0 2.4 0L20.4 7" />
    </Icon>
  );
}

export function IconPhone(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M8.4 3.5H6.2A2.7 2.7 0 0 0 3.5 6.3c0 6.7 6.5 13.2 13.2 13.2a2.7 2.7 0 0 0 2.8-2.7v-2.2l-4.2-1.6-1.9 1.9a13.4 13.4 0 0 1-5.3-5.3l1.9-1.9Z" />
    </Icon>
  );
}

export function IconMegaphone(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 9.6A2.6 2.6 0 0 1 6.6 7h1.9L17.5 3v18l-9-4H6.6A2.6 2.6 0 0 1 4 14.4Z" />
      <path d="M8.5 17.4v3.1h3.2" />
      <path d="M20.4 9.6a3.6 3.6 0 0 1 0 4.8" />
    </Icon>
  );
}

export function IconLink(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M10.1 13.6a4.6 4.6 0 0 0 6.7.5l2.8-2.8a4.6 4.6 0 0 0-6.5-6.5l-1.6 1.6" />
      <path d="M13.9 10.4a4.6 4.6 0 0 0-6.7-.5l-2.8 2.8a4.6 4.6 0 0 0 6.5 6.5l1.6-1.6" />
    </Icon>
  );
}

/* ── People & recognition ────────────────────────────────────────────────── */

export function IconUsers(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="9.2" cy="8" r="3.6" />
      <path d="M2.5 20.5a6.7 6.7 0 0 1 13.4 0" />
      <path d="M16.6 5.1a3.6 3.6 0 0 1 0 5.8" />
      <path d="M18.2 14.5a6.7 6.7 0 0 1 3.3 6" />
    </Icon>
  );
}

export function IconHeart(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 20.6C12 20.6 3 15 3 8.9A4.9 4.9 0 0 1 12 6.2 4.9 4.9 0 0 1 21 8.9c0 6.1-9 11.7-9 11.7Z" />
    </Icon>
  );
}

export function IconAward(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8.6" r="5.6" />
      <path d="M8.4 13.4 7 21.5l5-2.9 5 2.9-1.4-8.1" />
    </Icon>
  );
}

export function IconTrophy(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M7.4 3.5h9.2v6.1a4.6 4.6 0 0 1-9.2 0Z" />
      <path d="M7.4 5.6H4.2v1.5a3.2 3.2 0 0 0 3.2 3.2" />
      <path d="M16.6 5.6h3.2v1.5a3.2 3.2 0 0 1-3.2 3.2" />
      <path d="M12 14.2v3.8" />
      <path d="M8.3 20.5h7.4" />
    </Icon>
  );
}

export function IconSparkle(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M10.4 2.8 12.2 8l5.2 1.8-5.2 1.8-1.8 5.2-1.8-5.2L3.4 9.8 8.6 8Z" />
      <path d="m18.2 15.2.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9Z" />
    </Icon>
  );
}

export function IconTag(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3.5 11.3V5.1A1.6 1.6 0 0 1 5.1 3.5h6.2a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.9l-5.7 5.7a2 2 0 0 1-2.9 0L4.1 12.7a2 2 0 0 1-.6-1.4Z" />
      <circle cx="8.1" cy="8.1" r="1.4" />
    </Icon>
  );
}

export function IconGift(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="8" width="18" height="4.6" rx="1.5" />
      <path d="M5.2 12.6v6.3a2 2 0 0 0 2 2h9.6a2 2 0 0 0 2-2v-6.3" />
      <path d="M12 8v12.9" />
      <path d="M12 8H8.3a2.7 2.7 0 1 1 0-5.4C10.9 2.6 12 8 12 8Z" />
      <path d="M12 8h3.7a2.7 2.7 0 1 0 0-5.4C13.1 2.6 12 8 12 8Z" />
    </Icon>
  );
}

/* ── Status & money ──────────────────────────────────────────────────────── */

export function IconCheckCircle(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m7.9 12.2 2.9 2.9 5.3-5.4" />
    </Icon>
  );
}

export function IconVote(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3.5" />
      <path d="m7.9 12.2 2.9 2.9 5.3-5.4" />
    </Icon>
  );
}

export function IconWallet(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="5.5" width="18" height="15" rx="3" />
      <path d="M3 10.2h18" />
      <circle cx="16.6" cy="15.4" r="1.3" />
    </Icon>
  );
}

export function IconRefund(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3.4 12a8.6 8.6 0 1 0 2.7-6.3" />
      <path d="M3.4 3.6v5.1h5.1" />
    </Icon>
  );
}

export function IconTrend(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m3 17.6 6.4-6.4 4 4L21 7.6" />
      <path d="M15.6 7.6H21v5.4" />
    </Icon>
  );
}

export function IconLock(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="4" y="10" width="16" height="11" rx="2.5" />
      <path d="M8 10V7.2a4 4 0 0 1 8 0V10" />
    </Icon>
  );
}

export function IconClock(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6.9V12l3.5 2.1" />
    </Icon>
  );
}

/* ── Navigation & shell ──────────────────────────────────────────────────── */

export function IconSearch(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="10.6" cy="10.6" r="7.1" />
      <path d="m21 21-5.4-5.4" />
    </Icon>
  );
}

export function IconHome(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3.5 10.3 12 3.4l8.5 6.9v8.6a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" />
      <path d="M9.4 20.9v-6.6h5.2v6.6" />
    </Icon>
  );
}

export function IconCompass(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.6 8.4-2 5.2-5.2 2 2-5.2Z" />
    </Icon>
  );
}

export function IconBell(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M18.1 9.4a6.1 6.1 0 1 0-12.2 0c0 5.3-2.4 7.1-2.4 7.1h17s-2.4-1.8-2.4-7.1Z" />
      <path d="M10.2 20a2.1 2.1 0 0 0 3.6 0" />
    </Icon>
  );
}

export function IconDashboard(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="7.6" height="7.6" rx="1.5" />
      <rect x="13.4" y="3" width="7.6" height="7.6" rx="1.5" />
      <rect x="3" y="13.4" width="7.6" height="7.6" rx="1.5" />
      <rect x="13.4" y="13.4" width="7.6" height="7.6" rx="1.5" />
    </Icon>
  );
}

/**
 * The Studio pill in the nav. Was a rect plus a lens triangle — the same
 * drawing as `IconCamera`, so the two were indistinguishable in a row. A mixer
 * console reads as "the place you operate from" and shares nothing with the
 * video icons (`Camera`, `Film`, `Tape`) it used to collide with.
 */
export function IconStudio(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6 3v7.1M6 14.1V21" />
      <path d="M12 3v3.1M12 10.1V21" />
      <path d="M18 3v10.1M18 17.1V21" />
      <path d="M3.5 12.1h5M9.5 8.1h5M15.5 15.1h5" />
    </Icon>
  );
}

export function IconChevronLeft(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M15.2 5.5 8.7 12l6.5 6.5" />
    </Icon>
  );
}

export function IconChevronRight(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M8.8 5.5 15.3 12l-6.5 6.5" />
    </Icon>
  );
}

export function IconChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M5.5 8.8 12 15.3l6.5-6.5" />
    </Icon>
  );
}

/* ── Marketplace thumbnails ──────────────────────────────────────────────────
   These are the tiles a creator picks from when listing an item
   (`src/lib/itemThumbnails.ts`), so they are user-facing choices, not spare
   parts. They render small — legibility at 16px governs every one of them. */

export function IconGame(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="6.6" width="19" height="10.8" rx="4" />
      <path d="M7.4 10.4v3.2M5.8 12h3.2" />
      <circle cx="16.1" cy="10.9" r="1.15" />
      <circle cx="18.4" cy="13.6" r="1.15" />
    </Icon>
  );
}

export function IconIdea(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M8.7 16.7a6.6 6.6 0 1 1 6.6 0" />
      <path d="M9.2 18.6h5.6" />
      <path d="M10.4 21.4h3.2" />
    </Icon>
  );
}

export function IconImage(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="4.2" width="18" height="15.6" rx="3" />
      <circle cx="8.7" cy="9.6" r="1.8" />
      <path d="m3.4 17.6 4.7-4.2a2 2 0 0 1 2.7 0l3.9 3.5" />
      <path d="m14.3 14.4 1.5-1.3a2 2 0 0 1 2.7 0l2.1 1.9" />
    </Icon>
  );
}

export function IconTarget(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.9" />
      <circle cx="12" cy="12" r="1.2" />
    </Icon>
  );
}

/** Pips are real circles. They were `h.01` zero-length paths, which relied on
    the round cap to render a dot and collapsed to nothing at small sizes. */
export function IconDice(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3.5" />
      <circle cx="8.4" cy="8.4" r="1.15" />
      <circle cx="15.6" cy="8.4" r="1.15" />
      <circle cx="12" cy="12" r="1.15" />
      <circle cx="8.4" cy="15.6" r="1.15" />
      <circle cx="15.6" cy="15.6" r="1.15" />
    </Icon>
  );
}

/** Three clean divisions instead of sprocket holes, which turned to mush at
    16px and were the busiest shape in the set. */
export function IconFilm(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="M7.7 4.5v15M16.3 4.5v15" />
      <path d="M2.5 12h19" />
    </Icon>
  );
}

/** A stills camera, so it no longer duplicates `IconStudio`. */
export function IconCamera(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3 8.8a2.6 2.6 0 0 1 2.6-2.6h1.9l1.5-2.7h6l1.5 2.7h1.9A2.6 2.6 0 0 1 21 8.8v8.6a2.6 2.6 0 0 1-2.6 2.6H5.6A2.6 2.6 0 0 1 3 17.4Z" />
      <circle cx="12" cy="12.8" r="3.7" />
    </Icon>
  );
}

export function IconTape(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="5.4" width="19" height="13.2" rx="2.5" />
      <circle cx="9" cy="11.6" r="2.2" />
      <circle cx="15" cy="11.6" r="2.2" />
      <path d="m7.2 18.6 1.4-2.7M16.8 18.6l-1.4-2.7" />
    </Icon>
  );
}

export function IconEye(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M2.6 12S6.4 5.6 12 5.6 21.4 12 21.4 12 17.6 18.4 12 18.4 2.6 12 2.6 12Z" />
      <circle cx="12" cy="12" r="3.2" />
    </Icon>
  );
}

export function IconPencil(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 20h4.1L19.2 8.9a2.9 2.9 0 0 0-4.1-4.1L4 15.9Z" />
      <path d="m14.6 5.4 4 4" />
    </Icon>
  );
}

export function IconNote(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="4" y="2.6" width="16" height="18.8" rx="2.5" />
      <path d="M8 8.2h8M8 12h8M8 15.8h5" />
    </Icon>
  );
}

export function IconDocument(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M13.6 2.6H6.6a2.5 2.5 0 0 0-2.5 2.5v13.8a2.5 2.5 0 0 0 2.5 2.5h10.8a2.5 2.5 0 0 0 2.5-2.5V8.6Z" />
      <path d="M13.6 2.6v6h6.3" />
      <path d="M8.4 13.4h7.2M8.4 17.2h4.6" />
    </Icon>
  );
}

/** The "credit" tile. Redrawn — the old one was a curl that read as nothing at
    any size, the worst-looking mark in the set. */
export function IconScroll(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6.4 3.5h11.1a2.5 2.5 0 0 1 2.5 2.5v12.5a2.5 2.5 0 0 1-2.5 2.5H6.4" />
      <path d="M6.4 3.5A2.5 2.5 0 0 0 3.9 6v2.3h2.5Z" />
      <path d="M6.4 3.5v17.5" />
      <path d="M9.9 9.4h6.6M9.9 13.2h6.6M9.9 17h4.3" />
    </Icon>
  );
}
