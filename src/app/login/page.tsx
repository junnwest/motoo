import { getTranslations } from "next-intl/server";
import { ComingSoon } from "@/components/ComingSoon";

export default async function LoginPage() {
  const t = await getTranslations("stub");
  return <ComingSoon title={t("loginTitle")} body={t("loginBody")} />;
}
