import { getTranslations } from "next-intl/server";
import { ComingSoon } from "@/components/ComingSoon";

export default async function ApplyPage() {
  const t = await getTranslations("stub");
  return (
    <ComingSoon title={t("applyTitle")} body={t("applyBody")} variant="creator" />
  );
}
