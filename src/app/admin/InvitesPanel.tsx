"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { InlineMessage } from "@/components/ui/InlineMessage";
import { createInviteAction, revokeInviteAction } from "./actions";

/**
 * Pre-launch invite management.
 *
 * Minting an invite is the only way anyone gets an account while `PRELAUNCH=1`,
 * so this is effectively the front door's key-cutter. Each row is one creator we
 * approached, which is the whole reason invites are rows rather than one shared
 * code: this table is also the outreach record — who was contacted, who signed
 * up, who never did.
 *
 * The token is shown in full because it has to be copied into a DM. It is not a
 * password: it is single-use, revocable, and worthless once redeemed.
 */
export type InviteRow = {
  id: string;
  token: string;
  label: string;
  email: string | null;
  createdAt: string;
  redeemedAt: string | null;
  revokedAt: string | null;
  redeemedByNickname: string | null;
};

function State({ row, t }: { row: InviteRow; t: Record<string, string> }) {
  if (row.redeemedAt)
    return (
      <span className="text-2xs font-semibold text-sage-text">
        {t.redeemed}
        {row.redeemedByNickname ? ` · ${row.redeemedByNickname}` : ""}
      </span>
    );
  if (row.revokedAt)
    return (
      <span className="text-2xs font-semibold text-muted">{t.revoked}</span>
    );
  return (
    <span className="text-2xs font-semibold text-coral-deep">{t.pending}</span>
  );
}

export function InvitesPanel({
  rows,
  origin,
  t,
}: {
  rows: InviteRow[];
  origin: string;
  /** Admin strings, passed in: this is a client component with no next-intl. */
  t: Record<string, string>;
}) {
  const [label, setLabel] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(
    null,
  );
  const [pending, start] = useTransition();

  const mint = () => {
    setMsg(null);
    start(async () => {
      const res = await createInviteAction({ label, email });
      if (res.ok) {
        setLabel("");
        setEmail("");
        setMsg({
          tone: "ok",
          text: `${t.created} · ${origin}/join/${res.token}`,
        });
      } else {
        setMsg({ tone: "error", text: res.error });
      }
    });
  };

  const revoke = (id: string) => {
    setMsg(null);
    start(async () => {
      const res = await revokeInviteAction({ id });
      if (!res.ok) setMsg({ tone: "error", text: res.error });
    });
  };

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-end gap-3 border border-line-2 bg-card p-4">
        <label className="flex-1 min-w-[200px] text-2xs font-semibold text-muted">
          {t.labelField}
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="mt-1 w-full border border-line-3 bg-card px-3 py-2 text-sm text-ink outline-none focus:border-coral"
          />
        </label>
        <label className="flex-1 min-w-[200px] text-2xs font-semibold text-muted">
          {t.emailField}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-line-3 bg-card px-3 py-2 text-sm text-ink outline-none focus:border-coral"
          />
        </label>
        <Button
          variant="primary"
          size="md"
          onClick={mint}
          disabled={pending || label.trim().length === 0}
        >
          {t.create}
        </Button>
      </div>

      {msg ? (
        <InlineMessage tone={msg.tone === "ok" ? "success" : "error"}>
          {msg.text}
        </InlineMessage>
      ) : null}

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line-2 text-left text-2xs text-muted">
              <th className="py-2 pr-3 font-semibold">{t.colWho}</th>
              <th className="py-2 pr-3 font-semibold">{t.colLink}</th>
              <th className="py-2 pr-3 font-semibold">{t.colState}</th>
              <th className="py-2 pr-3 font-semibold">{t.colCreated}</th>
              <th className="py-2 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-muted">
                  {t.empty}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-line-2 align-middle">
                  <td className="py-2.5 pr-3">
                    <div className="font-semibold text-ink">{r.label}</div>
                    {r.email ? (
                      <div className="text-2xs text-muted">{r.email}</div>
                    ) : null}
                  </td>
                  <td className="py-2.5 pr-3">
                    <code className="text-2xs text-body">
                      {origin}/join/{r.token}
                    </code>
                  </td>
                  <td className="py-2.5 pr-3">
                    <State row={r} t={t} />
                  </td>
                  <td className="py-2.5 pr-3 text-2xs tabular-nums text-muted">
                    {r.createdAt}
                  </td>
                  <td className="py-2.5 text-right">
                    {!r.redeemedAt && !r.revokedAt ? (
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() => revoke(r.id)}
                        disabled={pending}
                      >
                        {t.revoke}
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
