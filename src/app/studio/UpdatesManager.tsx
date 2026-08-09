"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { UpdateVisibility } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { InlineMessage } from "@/components/ui/InlineMessage";
import { formatKstDate } from "@/lib/format";
import { createUpdate, deleteUpdate } from "./actions";

export type DashboardUpdate = {
  id: string;
  title: string;
  body: string;
  visibility: UpdateVisibility;
  publishedAt: Date;
};

/**
 * The Studio's update composer.
 *
 * `Update` has existed since Phase 1 — the home feed reads it, creator pages
 * render it — but nothing could ever write one, so every "소식" in the product
 * came from the seed. A creator had no reason to return to the Studio between
 * fulfilling orders, which is the retention gap this closes.
 *
 * Deliberately minimal: title, body, and who can read it. No scheduling, no
 * drafts, no rich text. The point is that posting is possible and cheap.
 */
export function UpdatesManager({ updates }: { updates: DashboardUpdate[] }) {
  const t = useTranslations("creatorDashboard");
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <section id="updates" className="scroll-mt-24">
      <header className="mb-5 flex items-start justify-between gap-4 border-t border-line-2 pt-8">
        <div>
          <h2 className="text-xl font-extrabold tracking-[-0.02em] text-ink">
            {t("updates.title")}
          </h2>
          <p className="mt-1 max-w-[560px] text-sm text-muted break-keep">
            {t("updates.subtitle")}
          </p>
        </div>
        {!open && (
          <Button
            type="button"
            variant="dark"
            onClick={() => setOpen(true)}
            className="flex-none"
          >
            {t("updates.addNew")}
          </Button>
        )}
      </header>

      <div className="flex flex-col gap-4">
        {open && <Composer onClose={() => setOpen(false)} />}

        {updates.length === 0 && !open ? (
          <div className="rounded-lg border border-line-2 bg-card p-6 text-base text-muted">
            {t("updates.empty")}
          </div>
        ) : (
          updates.map((u) => (
            <article
              key={u.id}
              className="rounded-lg border border-line-2 bg-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-ink break-keep">
                    {u.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 text-2xs text-muted">
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-semibold ${
                        u.visibility === "public"
                          ? "bg-sage-bg text-sage"
                          : "bg-coral-chip text-coral-deep"
                      }`}
                    >
                      {u.visibility === "public"
                        ? t("updates.chipPublic")
                        : t("updates.chipBackers")}
                    </span>
                    {formatKstDate(u.publishedAt)}
                  </div>
                </div>
                <DeleteButton id={u.id} onDone={() => router.refresh()} />
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-body break-keep">
                {u.body}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function Composer({ onClose }: { onClose: () => void }) {
  const t = useTranslations("creatorDashboard");
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<UpdateVisibility>(
    UpdateVisibility.public,
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createUpdate({ title, body, visibility });
      if (res.ok) {
        setTitle("");
        setBody("");
        onClose();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-lg border border-line-2 bg-panel p-5"
    >
      <div className="flex flex-col gap-4">
        <Input
          label={t("updates.nameLabel")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("updates.namePlaceholder")}
          maxLength={80}
          required
        />
        <Textarea
          label={t("updates.bodyLabel")}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("updates.bodyPlaceholder")}
          rows={5}
          resize="y"
          maxLength={2000}
          required
        />
        <Select
          label={t("updates.visibilityLabel")}
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as UpdateVisibility)}
        >
          <option value={UpdateVisibility.public}>
            {t("updates.visibility.public")}
          </option>
          <option value={UpdateVisibility.backers}>
            {t("updates.visibility.backers")}
          </option>
        </Select>

        {error && (
          <InlineMessage tone="error">{t("saveError")}</InlineMessage>
        )}

        <div className="flex gap-2">
          <Button
            type="submit"
            variant="primary"
            loading={pending}
            disabled={!title.trim() || !body.trim()}
          >
            {pending ? t("updates.publishing") : t("updates.publish")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={onClose}
          >
            {t("updates.cancel")}
          </Button>
        </div>
      </div>
    </form>
  );
}

function DeleteButton({ id, onDone }: { id: string; onDone: () => void }) {
  const t = useTranslations("creatorDashboard");
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="ghost"
        className="flex-none !px-3 !py-1.5 !text-xs !text-muted"
        onClick={() => setConfirming(true)}
      >
        {t("updates.delete")}
      </Button>
    );
  }

  // Inline confirm rather than a modal: deleting a post is reversible by
  // rewriting it, so it doesn't warrant interrupting the page.
  return (
    <div className="flex flex-none items-center gap-2">
      <span className="text-xs text-muted break-keep">
        {t("updates.deleteConfirm")}
      </span>
      <Button
        type="button"
        variant="secondary"
        className="!px-3 !py-1.5 !text-xs"
        loading={pending}
        onClick={() =>
          startTransition(async () => {
            await deleteUpdate(id);
            setConfirming(false);
            onDone();
          })
        }
      >
        {t("updates.delete")}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="!px-3 !py-1.5 !text-xs"
        disabled={pending}
        onClick={() => setConfirming(false)}
      >
        {t("updates.cancel")}
      </Button>
    </div>
  );
}
