import { useTranslations } from "next-intl";

/** Legal/safety reassurance row shared by both landings (design handoff). */
export function SafetyStrip({ bordered = true }: { bordered?: boolean }) {
  const t = useTranslations("safety");
  const items: { badge: string; label: string }[] = [
    { badge: "19", label: t("ageCheck") },
    { badge: "↩", label: t("refundPolicy") },
    { badge: "🔒", label: t("directPg") },
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
          className="flex items-center gap-[10px] text-[15px] font-semibold text-muted-2"
        >
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-sand text-[13px] font-extrabold">
            {it.badge}
          </span>
          {it.label}
        </span>
      ))}
    </div>
  );
}
