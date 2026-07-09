import { getTranslations } from "next-intl/server";
import { ComingSoon } from "@/components/ComingSoon";

export default async function ReportPage() {
  const t = await getTranslations("stub");
  return <ComingSoon title={t("reportTitle")} body={t("reportBody")} />;
}
