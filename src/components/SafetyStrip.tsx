import { useTranslations } from "next-intl";
import { IconLock, IconRefund } from "@/components/ui/Icons";

/** Legal/safety reassurance row shared by both landings (design handoff). */
export function SafetyStrip({ bordered = true }: { bordered?: boolean }) {
  const t = useTranslations("safety");
  const items: { badge: React.ReactNode; label: string }[] = [
    { badge: "19", label: t("ageCheck") },
    { badge: <IconRefund width={15} height={15} />, label: t("refundPolicy") },
    { badge: <IconLock width={15} height={15} />, label: t("directPg") },
  ];

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-11 gap-y-4 px-6 py-10 ${
        bordered ? "border-y border-line" : ""
      }`}
    >
      {items.map((it) => (
        <span
          key={it.label}
          className="flex items-center gap-[10px] text-base font-semibold text-muted-2"
        >
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-sm bg-sand text-xs font-extrabold">
            {it.badge}
          </span>
          {it.label}
        </span>
      ))}
    </div>
  );
}
