import { MarketplaceItemType } from "@prisma/client";
import { resolveThumbnail, TINT_CLASS } from "@/lib/itemThumbnails";

/**
 * A marketplace item's thumbnail — a curated line icon on a palette-tinted tile.
 * Purely presentational (no client hooks), so it renders in server and client
 * components alike. Resolves its own asset, falling back to the itemType default.
 */
export function ItemThumbnail({
  thumbnailKey,
  itemType,
  size = 44,
  rounded = "rounded-md",
  className = "",
}: {
  thumbnailKey: string | null | undefined;
  itemType: MarketplaceItemType;
  size?: number;
  rounded?: string;
  className?: string;
}) {
  const asset = resolveThumbnail(thumbnailKey, itemType);
  const Mark = asset.icon;
  const glyph = Math.round(size * 0.5);
  return (
    <span
      aria-hidden="true"
      className={`flex flex-none items-center justify-center ${rounded} ${TINT_CLASS[asset.tint]} ${className}`}
      style={{ width: size, height: size }}
    >
      <Mark width={glyph} height={glyph} strokeWidth={1.8} />
    </span>
  );
}
