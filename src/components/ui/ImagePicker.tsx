"use client";

import { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { IconImage } from "@/components/ui/Icons";
import {
  ACCEPTED_IMAGE_TYPES,
  type ImageSpec,
} from "@/lib/imageUpload";

const MIN_QUALITY = 0.4;

/**
 * Downscale + center-crop a picked file into the spec's box and encode it as a
 * JPEG data URL, stepping quality down until it fits the byte target. Runs
 * entirely in the browser — the original file is never uploaded, only the small
 * re-encoded result (see src/lib/imageUpload.ts for why).
 */
async function toDataUrl(file: File, spec: ImageSpec): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = spec.width;
    canvas.height = spec.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");

    // Center-crop: scale so the source covers the box, then center the overflow.
    const scale = Math.max(
      spec.width / bitmap.width,
      spec.height / bitmap.height,
    );
    const drawW = bitmap.width * scale;
    const drawH = bitmap.height * scale;
    ctx.drawImage(
      bitmap,
      (spec.width - drawW) / 2,
      (spec.height - drawH) / 2,
      drawW,
      drawH,
    );

    let quality = 0.8;
    let out = canvas.toDataURL("image/jpeg", quality);
    while (out.length > spec.targetBytes && quality > MIN_QUALITY) {
      quality -= 0.1;
      out = canvas.toDataURL("image/jpeg", quality);
    }
    return out;
  } finally {
    bitmap.close();
  }
}

/**
 * Pick / preview / remove a single image. Owns no persistence — it hands the
 * encoded data URL to `onChange` and the parent form saves it, so the same
 * control serves the fan's profile picture and a creator's item cover.
 *
 * `shape` is purely presentational: "circle" previews an avatar, "cover" a 16:9
 * banner. The actual crop geometry comes from `spec`.
 */
export function ImagePicker({
  value,
  onChange,
  spec,
  label,
  shape = "cover",
  disabled = false,
}: {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  spec: ImageSpec;
  label: string;
  shape?: "circle" | "cover";
  disabled?: boolean;
}) {
  const t = useTranslations("imagePicker");
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset immediately so re-picking the same file still fires a change event.
    e.target.value = "";
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const dataUrl = await toDataUrl(file, spec);
      if (dataUrl.length > spec.maxBytes) {
        // Quality bottomed out and it still doesn't fit — almost always a photo
        // with heavy detail. Say so rather than silently storing nothing.
        setError("tooLarge");
        return;
      }
      onChange(dataUrl);
    } catch {
      setError("failed");
    } finally {
      setBusy(false);
    }
  }

  const previewClass =
    shape === "circle"
      ? "h-20 w-20 flex-none rounded-full"
      : "aspect-[16/9] w-full max-w-[280px] rounded-md";

  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold text-muted-2">
        {label}
      </span>
      <div
        className={
          shape === "circle"
            ? "flex items-center gap-4"
            : "flex flex-col items-start gap-3"
        }
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className={`${previewClass} border border-line-3 object-cover`}
          />
        ) : (
          <span
            aria-hidden="true"
            className={`${previewClass} flex items-center justify-center border border-dashed border-line-3 bg-panel text-muted`}
          >
            <IconImage width={22} height={22} />
          </span>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES}
            onChange={onPick}
            disabled={disabled || busy}
            className="sr-only"
          />
          <Button
            type="button"
            variant="secondary"
            size="md"
            disabled={disabled || busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? t("processing") : value ? t("replace") : t("choose")}
          </Button>
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={disabled || busy}
              onClick={() => {
                setError(null);
                onChange(null);
              }}
            >
              {t("remove")}
            </Button>
          ) : null}
        </div>
      </div>

      <p className="mt-1.5 text-xs text-muted">{t("hint")}</p>
      {error ? (
        <p className="mt-1 text-xs font-semibold text-live">
          {t(`errors.${error}`)}
        </p>
      ) : null}
    </div>
  );
}
