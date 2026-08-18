"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, ButtonLink } from "@/components/ui/Button";
import { InlineMessage } from "@/components/ui/InlineMessage";
import { recordGuardianConsentAction } from "./actions";

type Relation = "parent" | "grandparent" | "sibling" | "other";

/**
 * Collects the guardian's declaration. Three fields and a tick — deliberately
 * the shortest form that still produces something worth keeping: a name, how
 * they are related, and somewhere to reach them if the consent is ever
 * questioned.
 *
 * `returnTo` carries the creator the fan was trying to support, so consent
 * doesn't dead-end at a success page and make them go and find it again.
 */
export function GuardianConsentForm({ returnTo }: { returnTo: string | null }) {
  const t = useTranslations("guardian");
  const router = useRouter();
  const [name, setName] = useState("");
  const [relation, setRelation] = useState<Relation>("parent");
  const [contact, setContact] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  if (done) {
    return (
      <div className="mt-8 rounded-lg border border-line-2 bg-card p-6">
        <h2 className="break-keep text-lg font-bold text-ink">
          {t("doneTitle")}
        </h2>
        <p className="mt-2 break-keep text-base leading-relaxed text-body">
          {t("doneBody")}
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          {returnTo && (
            <ButtonLink href={returnTo} variant="primary" size="md">
              {t("backToDonate")}
            </ButtonLink>
          )}
          <ButtonLink href="/settings" variant="secondary" size="md">
            {t("toSettings")}
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <form
      className="mt-8 flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await recordGuardianConsentAction({
            guardianName: name,
            relation,
            contact,
            // The action takes a literal `true`, so an unticked box fails
            // validation server-side too — the checkbox is not the gate.
            agreed: agreed as true,
          });
          if (res.ok) {
            setDone(true);
            router.refresh();
          } else {
            setError(res.error);
          }
        });
      }}
    >
      <label className="block">
        <span className="text-sm font-bold text-ink">{t("nameLabel")}</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={40}
          placeholder={t("namePlaceholder")}
          className="mt-1.5 w-full rounded-md border border-line-2 bg-card px-3 py-2.5 text-base text-ink outline-none focus:border-coral"
        />
      </label>

      <fieldset>
        <legend className="text-sm font-bold text-ink">
          {t("relationLabel")}
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(["parent", "grandparent", "sibling", "other"] as const).map((r) => (
            <label
              key={r}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-line-2 px-3 py-2.5 text-sm text-body break-keep has-[:checked]:border-coral has-[:checked]:bg-coral-chip/40"
            >
              <input
                type="radio"
                name="relation"
                value={r}
                checked={relation === r}
                onChange={() => setRelation(r)}
                className="accent-coral"
              />
              {t(`relations.${r}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="text-sm font-bold text-ink">{t("contactLabel")}</span>
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          required
          minLength={5}
          maxLength={120}
          placeholder={t("contactPlaceholder")}
          className="mt-1.5 w-full rounded-md border border-line-2 bg-card px-3 py-2.5 text-base text-ink outline-none focus:border-coral"
        />
        <span className="mt-1.5 block break-keep text-xs leading-relaxed text-muted">
          {t("contactHelp")}
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          required
          className="mt-1 accent-coral"
        />
        <span className="break-keep text-sm leading-relaxed text-body">
          {t("agreeLabel")}
        </span>
      </label>

      {error && <InlineMessage tone="error">{t(`errors.${error}` as never)}</InlineMessage>}

      <Button type="submit" variant="primary" size="lg" loading={pending}>
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
