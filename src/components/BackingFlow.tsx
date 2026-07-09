"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { BackingDisplay } from "@prisma/client";
import { Mochi } from "./Mochi";
import { Button } from "./ui/Button";
import { formatFoundingNumber, formatKrw } from "@/lib/format";
import type { CookiePack } from "@/lib/payments/types";
import { backAction, topUpAction } from "@/app/s/[handle]/back/actions";

interface TierData {
  id: string;
  name: string;
  priceKrw: number;
  description: string | null;
  perks: { id: string; title: string }[];
}

interface Props {
  handle: string;
  streamerName: string;
  tiers: TierData[];
  initialBalance: number;
  preselectedTierId?: string;
  founding: { number: number; existing: boolean };
  backerAgeVerified: boolean;
  backerNickname: string;
  mochiToKrw: number;
  packs: CookiePack[];
}

type Step = "age" | "tier" | "display" | "message" | "pay";
const STEP_ORDER: Step[] = ["age", "tier", "display", "message", "pay"];

export function BackingFlow(props: Props) {
  const t = useTranslations("backing");
  const [pending, startTransition] = useTransition();

  const [ageVerified, setAgeVerified] = useState(props.backerAgeVerified);
  const [ageChoice, setAgeChoice] = useState<"adult" | "minor" | null>(
    props.backerAgeVerified ? "adult" : null,
  );
  const [tierId, setTierId] = useState<string | undefined>(
    props.preselectedTierId ?? props.tiers[0]?.id,
  );
  const [display, setDisplay] = useState<BackingDisplay>("public");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [disclosureAgreed, setDisclosureAgreed] = useState(false);
  const [balance, setBalance] = useState(props.initialBalance);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ foundingNumber: number } | null>(null);

  // Skip the age step entirely if the backer is already verified.
  const steps = useMemo(
    () => (props.backerAgeVerified ? STEP_ORDER.slice(1) : STEP_ORDER),
    [props.backerAgeVerified],
  );
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];

  const selectedTier = props.tiers.find((tr) => tr.id === tierId);
  const mochiNeeded = selectedTier
    ? Math.round(selectedTier.priceKrw / props.mochiToKrw)
    : 0;
  const short = Math.max(0, mochiNeeded - balance);
  const canPay = ageVerified && !!selectedTier && short === 0 && disclosureAgreed;

  function next() {
    setError(null);
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }
  function back() {
    setError(null);
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function verifyAge() {
    if (ageChoice === "adult" || ageChoice === "minor") {
      setAgeVerified(true);
      next();
    }
  }

  function topUp(packId: string) {
    startTransition(async () => {
      const res = await topUpAction(packId);
      if (res.ok && typeof res.newBalance === "number")
        setBalance(res.newBalance);
    });
  }

  function submit() {
    if (!canPay || !selectedTier) return;
    setError(null);
    startTransition(async () => {
      const res = await backAction({
        handle: props.handle,
        tierId: selectedTier.id,
        display,
        displayName: display === "nickname" ? displayName : null,
        message: message || null,
        ageVerified,
        disclosureAgreed,
      });
      if (res.ok) {
        setBalance(res.newBalance);
        setResult({ foundingNumber: res.foundingNumber });
      } else {
        setError(res.error);
      }
    });
  }

  // ---- Success reveal (a distinct moment, not a receipt line) ----
  if (result) {
    return (
      <div className="mx-auto max-w-[560px] px-6 py-16 text-center">
        <div className="mb-4 flex justify-center gap-2">
          <Mochi width={48} height={39} float />
          <Mochi width={62} height={50} float floatDelay={0.4} />
          <Mochi width={44} height={36} float floatDelay={0.8} />
        </div>
        <div className="font-mono text-[13px] uppercase tracking-[0.2em] text-coral-deep">
          {t("success.eyebrow")}
        </div>
        <h1 className="mt-3 text-[28px] font-extrabold leading-[1.2] tracking-[-0.02em]">
          {t("success.title", { name: props.streamerName })}
        </h1>
        <div className="my-8 rounded-[24px] border border-line-2 bg-cream-warm p-8">
          <div className="text-[13px] text-muted">
            {t("success.foundingLabel")}
          </div>
          <div className="mt-2 font-mono text-[56px] font-bold tracking-[-0.02em] text-coral-deep">
            {formatFoundingNumber(result.foundingNumber)}
          </div>
        </div>
        <p className="mx-auto max-w-[420px] text-[15px] leading-[1.6] text-body">
          {t("success.body")}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href={`/s/${props.handle}`}
            className="rounded-[14px] bg-coral px-7 py-4 text-[16px] font-bold text-white shadow-coral"
          >
            {t("success.viewWall")}
          </Link>
          <Link
            href={`/s/${props.handle}`}
            className="text-[14px] font-semibold text-muted"
          >
            {t("success.backToProfile")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[620px] px-6 py-10">
      {/* progress */}
      <div className="mb-2 font-mono text-[12px] text-muted">
        {t("step", { current: stepIndex + 1, total: steps.length })} ·{" "}
        {t(`steps.${step}` as never)}
      </div>
      <div className="mb-8 flex gap-[6px]">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`h-[6px] flex-1 rounded-full ${
              i <= stepIndex ? "bg-coral" : "bg-line-4"
            }`}
          />
        ))}
      </div>

      <h1 className="mb-6 text-[24px] font-extrabold tracking-[-0.02em]">
        {t("title", { name: props.streamerName })}
      </h1>

      {/* ---- Step: Age gate ---- */}
      {step === "age" && (
        <div className="rounded-[20px] border border-line-2 bg-card p-6">
          <h2 className="text-[19px] font-extrabold">{t("ageGate.title")}</h2>
          <p className="mt-2 text-[14.5px] leading-[1.6] text-body">
            {t("ageGate.body")}
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <RadioRow
              checked={ageChoice === "adult"}
              onChange={() => setAgeChoice("adult")}
              label={t("ageGate.adultLabel")}
            />
            <RadioRow
              checked={ageChoice === "minor"}
              onChange={() => setAgeChoice("minor")}
              label={t("ageGate.minorLabel")}
              note={t("ageGate.minorCapNote")}
            />
          </div>
          <Button
            onClick={verifyAge}
            disabled={!ageChoice}
            className="mt-6 w-full disabled:opacity-50"
          >
            {t("ageGate.verify")}
          </Button>
        </div>
      )}

      {/* ---- Step: Tier ---- */}
      {step === "tier" && (
        <div>
          <h2 className="mb-4 text-[19px] font-extrabold">{t("tier.title")}</h2>
          <div className="flex flex-col gap-3">
            {props.tiers.map((tr) => {
              const active = tr.id === tierId;
              return (
                <button
                  key={tr.id}
                  onClick={() => setTierId(tr.id)}
                  className={`rounded-[18px] border p-5 text-left transition-colors ${
                    active
                      ? "border-coral bg-coral-chip/40"
                      : "border-line-2 bg-card hover:border-coral/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[17px] font-extrabold">{tr.name}</span>
                    <span className="text-[17px] font-extrabold text-coral-deep">
                      {formatKrw(tr.priceKrw)}
                    </span>
                  </div>
                  {tr.description && (
                    <p className="mt-1 text-[13.5px] text-body">
                      {tr.description}
                    </p>
                  )}
                  {tr.perks.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tr.perks.map((p) => (
                        <span
                          key={p.id}
                          className="rounded-full bg-panel px-3 py-1 text-[12px] text-muted-2"
                        >
                          {p.title}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <StepNav onBack={back} onNext={next} nextDisabled={!tierId} />
        </div>
      )}

      {/* ---- Step: Display preference ---- */}
      {step === "display" && (
        <div>
          <h2 className="mb-4 text-[19px] font-extrabold">
            {t("display.title")}
          </h2>
          <div className="flex flex-col gap-3">
            <RadioRow
              checked={display === "public"}
              onChange={() => setDisplay("public")}
              label={t("display.public")}
              note={t("display.publicNote")}
            />
            <RadioRow
              checked={display === "nickname"}
              onChange={() => setDisplay("nickname")}
              label={t("display.nickname")}
              note={t("display.nicknameNote")}
            />
            {display === "nickname" && (
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("display.nicknamePlaceholder")}
                maxLength={40}
                className="ml-8 rounded-[12px] border border-line-3 bg-white px-4 py-3 text-[15px] outline-none focus:border-coral"
              />
            )}
            <RadioRow
              checked={display === "anonymous"}
              onChange={() => setDisplay("anonymous")}
              label={t("display.anonymous")}
              note={t("display.anonymousNote")}
            />
          </div>
          <StepNav onBack={back} onNext={next} />
        </div>
      )}

      {/* ---- Step: Message ---- */}
      {step === "message" && (
        <div>
          <h2 className="mb-4 text-[19px] font-extrabold">
            {t("message.title")}
          </h2>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("message.placeholder")}
            maxLength={500}
            rows={4}
            className="w-full rounded-[16px] border border-line-3 bg-white px-4 py-3 text-[15px] outline-none focus:border-coral"
          />
          <StepNav onBack={back} onNext={next} nextLabel={undefined} />
        </div>
      )}

      {/* ---- Step: Pay ---- */}
      {step === "pay" && selectedTier && (
        <div className="flex flex-col gap-5">
          {/* founding number preview — shown BEFORE payment */}
          <div className="rounded-[20px] border border-coral/40 bg-coral-chip/40 p-6 text-center">
            <div className="text-[13px] text-muted-2">
              {t("founding.previewLabel")}
            </div>
            <div className="mt-2 font-mono text-[44px] font-bold tracking-[-0.02em] text-coral-deep">
              {formatFoundingNumber(props.founding.number)}
            </div>
            <p className="mx-auto mt-2 max-w-[400px] text-[13px] leading-[1.5] text-muted-3">
              {props.founding.existing
                ? t("founding.existingNote", {
                    number: formatFoundingNumber(props.founding.number),
                  })
                : t("founding.previewNote")}
            </p>
          </div>

          {/* wallet */}
          <div className="rounded-[20px] border border-line-2 bg-card p-6">
            <div className="flex items-center justify-between text-[14px]">
              <span className="text-body">{t("wallet.balance")}</span>
              <span className="flex items-center gap-1 font-bold">
                <Mochi width={16} height={13} /> {balance}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[14px]">
              <span className="text-body">{t("wallet.need")}</span>
              <span className="flex items-center gap-1 font-bold">
                <Mochi width={16} height={13} /> {mochiNeeded}
              </span>
            </div>

            {short > 0 && (
              <div className="mt-4 rounded-[14px] bg-panel p-4">
                <div className="mb-3 text-[13px] font-semibold text-coral-deep">
                  {t("wallet.short", { amount: short })}
                </div>
                <div className="text-[12px] font-medium text-muted">
                  {t("wallet.packTitle")}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {props.packs.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => topUp(p.id)}
                      disabled={pending}
                      className="rounded-[12px] border border-line-3 bg-white px-3 py-2 text-left hover:border-coral disabled:opacity-50"
                    >
                      <div className="flex items-center gap-1 text-[15px] font-extrabold">
                        <Mochi width={14} height={11} /> {p.mochi}
                      </div>
                      <div className="text-[11px] text-muted">
                        {formatKrw(p.priceKrw)}
                        {p.bonus ? ` · ${t("wallet.packBonus", { bonus: p.bonus })}` : ""}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* non-financial disclosure — above the pay button (spec §2, §6) */}
          <div className="rounded-[20px] border border-line-3 bg-panel p-6">
            <h3 className="text-[15px] font-extrabold">
              {t("disclosure.title")}
            </h3>
            <ul className="mt-3 flex flex-col gap-2 text-[13.5px] leading-[1.55] text-body">
              <li>
                {t.rich("disclosure.line1", {
                  b: (c) => <b className="text-ink">{c}</b>,
                })}
              </li>
              <li>
                {t.rich("disclosure.line2", {
                  b: (c) => <b className="text-ink">{c}</b>,
                })}
              </li>
              <li>{t("disclosure.line3")}</li>
            </ul>
            <label className="mt-4 flex cursor-pointer items-start gap-3 text-[14px] font-semibold">
              <input
                type="checkbox"
                checked={disclosureAgreed}
                onChange={(e) => setDisclosureAgreed(e.target.checked)}
                className="mt-[3px] h-[18px] w-[18px] accent-[var(--color-coral)]"
              />
              {t("disclosure.agree")}
            </label>
          </div>

          {error && (
            <p className="rounded-[12px] bg-live/10 px-4 py-3 text-[14px] font-semibold text-live">
              {t(`errors.${error}` as never)}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={back}
              className="rounded-[14px] border border-line-3 bg-white px-5 py-4 text-[15px] font-bold text-ink"
            >
              ←
            </button>
            <button
              onClick={submit}
              disabled={!canPay || pending}
              className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-coral px-6 py-4 text-[16px] font-bold text-white shadow-coral disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? (
                t("processing")
              ) : (
                <>
                  <Mochi width={18} height={14} />{" "}
                  {t("payButton", { amount: mochiNeeded })}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RadioRow({
  checked,
  onChange,
  label,
  note,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  note?: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-[14px] border p-4 ${
        checked ? "border-coral bg-coral-chip/30" : "border-line-2 bg-card"
      }`}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="mt-[3px] h-[18px] w-[18px] accent-[var(--color-coral)]"
      />
      <span>
        <span className="block text-[15px] font-semibold">{label}</span>
        {note && <span className="mt-[2px] block text-[13px] text-muted">{note}</span>}
      </span>
    </label>
  );
}

function StepNav({
  onBack,
  onNext,
  nextDisabled,
  nextLabel,
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="mt-6 flex items-center gap-3">
      <button
        onClick={onBack}
        className="rounded-[14px] border border-line-3 bg-white px-5 py-3 text-[15px] font-bold text-ink"
      >
        ←
      </button>
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="flex-1 rounded-[14px] bg-ink px-6 py-3 text-[15px] font-bold text-cream disabled:opacity-50"
      >
        {nextLabel ?? "→"}
      </button>
    </div>
  );
}
