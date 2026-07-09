import { getTranslations } from "next-intl/server";
import { ComingSoon } from "@/components/ComingSoon";

export default async function SignupPage() {
  const t = await getTranslations("stub");
  return <ComingSoon title={t("signupTitle")} body={t("signupBody")} />;
}
