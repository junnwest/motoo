/**
 * Placeholder visuals standing in for the design's <image-slot> during v1
 * (no real avatars/thumbnails yet). Warm sand background per the handoff token.
 */

export function Avatar({
  name,
  size = 40,
  src,
}: {
  name: string;
  size?: number;
  src?: string | null;
}) {
  const initial = name.replace(/^@/, "").charAt(0).toUpperCase();
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex flex-none items-center justify-center rounded-full bg-sand font-extrabold text-coral-deep"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </span>
  );
}

export function Thumbnail({
  label,
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center bg-sand text-[13px] text-muted ${className}`}
    >
      {label}
    </div>
  );
}
