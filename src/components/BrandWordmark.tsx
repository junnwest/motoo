/**
 * The motoo wordmark. The brand is the typeface — there is no symbol; the
 * logomark was retired 2026-08-28 in favour of a wordmark-only identity.
 *
 * The letterforms are **Bauhaus 93** (URW), converted to outlines rather than
 * loaded as a webfont. That is deliberate and is the licensing constraint, not
 * a performance choice: Bauhaus 93 ships bundled with Windows/Office under a
 * licence that permits creating artwork with it but **not** redistributing the
 * font file or serving it as a webfont. Outlines carry no font software, so
 * nothing is redistributed — and as a side effect the mark renders identically
 * for the overwhelming majority of our users, who have never had Bauhaus 93
 * installed and would otherwise have seen a fallback face.
 *
 * Regenerated with fontTools from `C:\Windows\Fonts\BAUHS93.TTF` at 2048 upem;
 * the font has no `kern` table, so advances are the raw `hmtx` widths and the
 * word space in the lockup is the font's own space glyph (512 units).
 *
 * `motoo` takes `currentColor` so the caller sets it with a text colour the way
 * the old text node worked; `studio` carries its own muted fill so it keeps
 * reading as a suffix rather than a second word.
 */
const MOTOO_D =
  "M1477 0H1103V-538Q1103 -600 1090.0 -624.0Q1077 -648 1043 -648Q980 -648 980 -537V0H606V-538Q606 -600 592.5 -624.0Q579 -648 545 -648Q483 -648 483 -537V0H109V-614Q109 -782 222.0 -899.5Q335 -1017 496 -1017Q662 -1017 794 -877Q941 -1017 1088 -1017Q1275 -1017 1388 -881Q1477 -775 1477 -572ZM2169 -1018Q2381 -1018 2532.5 -865.5Q2684 -713 2684 -500Q2684 -284 2530.5 -132.0Q2377 20 2160 20Q1943 20 1789.0 -132.5Q1635 -285 1635 -500Q1635 -719 1789.0 -868.5Q1943 -1018 2169 -1018ZM2159 -649Q2099 -649 2057.0 -605.5Q2015 -562 2015 -499Q2015 -437 2057.5 -393.0Q2100 -349 2159 -349Q2219 -349 2261.5 -393.0Q2304 -437 2304 -499Q2304 -562 2262.0 -605.5Q2220 -649 2159 -649ZM3173 -1365V-983H3341V-588H3173Q3173 -469 3210.5 -424.0Q3248 -379 3348 -379V14Q3319 15 3305 15Q3178 15 3065.5 -44.0Q2953 -103 2885 -204Q2799 -333 2799 -546V-1365ZM3998 -1018Q4210 -1018 4361.5 -865.5Q4513 -713 4513 -500Q4513 -284 4359.5 -132.0Q4206 20 3989 20Q3772 20 3618.0 -132.5Q3464 -285 3464 -500Q3464 -719 3618.0 -868.5Q3772 -1018 3998 -1018ZM3988 -649Q3928 -649 3886.0 -605.5Q3844 -562 3844 -499Q3844 -437 3886.5 -393.0Q3929 -349 3988 -349Q4048 -349 4090.5 -393.0Q4133 -437 4133 -499Q4133 -562 4091.0 -605.5Q4049 -649 3988 -649ZM5142 -1018Q5354 -1018 5505.5 -865.5Q5657 -713 5657 -500Q5657 -284 5503.5 -132.0Q5350 20 5133 20Q4916 20 4762.0 -132.5Q4608 -285 4608 -500Q4608 -719 4762.0 -868.5Q4916 -1018 5142 -1018ZM5132 -649Q5072 -649 5030.0 -605.5Q4988 -562 4988 -499Q4988 -437 5030.5 -393.0Q5073 -349 5132 -349Q5192 -349 5234.5 -393.0Q5277 -437 5277 -499Q5277 -562 5235.0 -605.5Q5193 -649 5132 -649Z";

const STUDIO_D =
  "M6950 -983V-589Q6871 -589 6841.5 -559.5Q6812 -530 6804 -443Q6778 -154 6580 -35Q6475 27 6282 27H6230V-369H6247Q6337 -369 6375.5 -406.5Q6414 -444 6420 -538Q6428 -691 6448.5 -753.0Q6469 -815 6532 -876Q6642 -983 6837 -983ZM7405 -1365V-983H7573V-588H7405Q7405 -469 7442.5 -424.0Q7480 -379 7580 -379V14Q7551 15 7537 15Q7410 15 7297.5 -44.0Q7185 -103 7117 -204Q7031 -333 7031 -546V-1365ZM7757 -983H8131V-420Q8131 -335 8202 -335Q8272 -335 8272 -420V-983H8646V-427Q8646 -233 8517.0 -99.5Q8388 34 8201 34Q7988 34 7858 -121Q7757 -242 7757 -457ZM9478 -1365H9852V-534Q9852 -305 9732 -161Q9663 -78 9556.5 -29.0Q9450 20 9338 20Q9115 20 8962.0 -130.0Q8809 -280 8809 -498Q8809 -709 8961.0 -863.0Q9113 -1017 9321 -1017Q9354 -1017 9421 -1011V-599Q9375 -635 9329 -635Q9271 -635 9229.5 -592.5Q9188 -550 9188 -490Q9188 -432 9231.0 -390.5Q9274 -349 9334 -349Q9478 -349 9478 -548ZM10423 -997V0H10049V-997ZM10237 -1442Q10313 -1442 10368.5 -1388.5Q10424 -1335 10424 -1262Q10424 -1184 10371.5 -1134.0Q10319 -1084 10237 -1084Q10155 -1084 10102.5 -1134.0Q10050 -1184 10050 -1262Q10050 -1335 10105.5 -1388.5Q10161 -1442 10237 -1442ZM11116 -1018Q11328 -1018 11479.5 -865.5Q11631 -713 11631 -500Q11631 -284 11477.5 -132.0Q11324 20 11107 20Q10890 20 10736.0 -132.5Q10582 -285 10582 -500Q10582 -719 10736.0 -868.5Q10890 -1018 11116 -1018ZM11106 -649Q11046 -649 11004.0 -605.5Q10962 -562 10962 -499Q10962 -437 11004.5 -393.0Q11047 -349 11106 -349Q11166 -349 11208.5 -393.0Q11251 -437 11251 -499Q11251 -562 11209.0 -605.5Q11167 -649 11106 -649Z";

/* viewBoxes share a baseline at y=0; heights differ because "studio" ascends
   higher than "motoo" does, so the lockup cannot reuse the standalone box. */
const VB_MOTOO = "109.0 -1365.0 5548.0 1385.0";
const VB_LOCKUP = "109.0 -1442.0 11522.0 1476.0";
const RATIO_MOTOO = 4.0058;
const RATIO_LOCKUP = 7.8062;

export function BrandWordmark({
  height = 20,
  studio = false,
  onDark = false,
  className = "",
}: {
  height?: number;
  studio?: boolean;
  onDark?: boolean;
  className?: string;
}) {
  const ratio = studio ? RATIO_LOCKUP : RATIO_MOTOO;
  return (
    <svg
      viewBox={studio ? VB_LOCKUP : VB_MOTOO}
      width={Math.round(height * ratio)}
      height={height}
      role="img"
      aria-label={studio ? "motoo studio" : "motoo"}
      className={className}
      style={{ flex: "none" }}
    >
      <path d={MOTOO_D} fill="currentColor" />
      {studio ? (
        <path
          d={STUDIO_D}
          className={onDark ? "fill-dark-text-3" : "fill-muted"}
        />
      ) : null}
    </svg>
  );
}

/**
 * The square-format mark: a lowercase "m" from the same outlines, for the
 * favicon and the PWA/Apple icons. A five-letter wordmark is illegible at
 * 16px, and those surfaces have to be square — so the monogram is the
 * wordmark cropped to its first letter rather than a separate symbol.
 */
export function BrandMonogram({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="109.0 -1017.0 1368.0 1017.0"
      width={Math.round(size * 1.3451)}
      height={size}
      role="img"
      aria-label="motoo"
      className={className}
      style={{ flex: "none" }}
    >
      <path d="M1477 0H1103V-538Q1103 -600 1090.0 -624.0Q1077 -648 1043 -648Q980 -648 980 -537V0H606V-538Q606 -600 592.5 -624.0Q579 -648 545 -648Q483 -648 483 -537V0H109V-614Q109 -782 222.0 -899.5Q335 -1017 496 -1017Q662 -1017 794 -877Q941 -1017 1088 -1017Q1275 -1017 1388 -881Q1477 -775 1477 -572Z" fill="currentColor" />
    </svg>
  );
}
