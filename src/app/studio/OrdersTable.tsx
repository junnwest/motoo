"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { OrderStatus } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Mochi } from "@/components/Mochi";
import { formatCount } from "@/lib/format";
import { fulfill, cancel } from "./actions";

export type DashboardOrder = {
  id: string;
  itemTitle: string;
  fan: string;
  mochiSpent: number;
  note: string | null;
  status: OrderStatus;
  createdAt: string; // ISO string
};

/** ISO → YYYY.MM.DD in KST, so an evening-KST order shows the local calendar day. */
function formatDate(iso: string): string {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}.${get("month")}.${get("day")}`;
}

const statusChipClass: Record<OrderStatus, string> = {
  pending: "bg-coral-chip text-coral-deep",
  fulfilled: "bg-sage-bg text-sage",
  cancelled: "bg-panel text-muted",
};

export function OrdersTable({ orders }: { orders: DashboardOrder[] }) {
  const t = useTranslations("creatorDashboard");

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-line-2 bg-card p-6 text-base text-muted">
        {t("orders.empty")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-line-2 bg-card">
      <table className="w-full min-w-[480px] border-collapse text-left">
        <thead>
          <tr className="border-b border-line text-xs text-muted">
            <th className="px-3 py-3 font-semibold">{t("orders.colItem")}</th>
            <th className="px-3 py-3 font-semibold">{t("orders.colFan")}</th>
            <th className="px-3 py-3 font-semibold">{t("orders.colMochi")}</th>
            <th className="px-3 py-3 font-semibold">{t("orders.colNote")}</th>
            <th className="px-3 py-3 font-semibold">{t("orders.colStatus")}</th>
            <th className="px-3 py-3 font-semibold">{t("orders.colDate")}</th>
            <th className="px-3 py-3" />
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrderRow({ order }: { order: DashboardOrder }) {
  const t = useTranslations("creatorDashboard");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(action: (id: string) => Promise<unknown>) {
    startTransition(async () => {
      await action(order.id);
      router.refresh();
    });
  }

  return (
    <tr className="border-b border-line last:border-b-0 align-top">
      <td className="px-3 py-3 text-sm font-semibold text-ink">
        {order.itemTitle}
      </td>
      <td className="px-3 py-3 text-sm text-body">{order.fan}</td>
      <td className="px-3 py-3 text-sm text-body">
        <span className="flex items-center gap-1.5">
          <Mochi width={16} height={12} />
          {formatCount(order.mochiSpent)}
        </span>
      </td>
      <td className="max-w-[140px] px-3 py-3 text-xs text-muted">
        {order.note || "—"}
      </td>
      <td className="px-3 py-3">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-2xs font-semibold ${statusChipClass[order.status]}`}
        >
          {t(`orders.status.${order.status}`)}
        </span>
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-xs text-muted">
        {formatDate(order.createdAt)}
      </td>
      <td className="px-3 py-3">
        {order.status === "pending" ? (
          <div className="flex flex-col items-stretch gap-1.5 whitespace-nowrap">
            <Button
              type="button"
              variant="primary"
              onClick={() => run(fulfill)}
              disabled={isPending}
            >
              {t("orders.markFulfilled")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => run(cancel)}
              disabled={isPending}
            >
              {t("orders.cancel")}
            </Button>
          </div>
        ) : null}
      </td>
    </tr>
  );
}
