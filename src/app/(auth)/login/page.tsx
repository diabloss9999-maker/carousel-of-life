import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { KakaoButton } from "@/components/auth/kakao-button";
import { GoogleButton } from "@/components/auth/google-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return {
    title: t("loginTitle"),
    description: t("loginSubtitle"),
    alternates: { canonical: "/login" },
  };
}

export default async function LoginPage() {
  const t = await getTranslations("auth");
  return (
    <Card className="app-surface">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="font-mystic text-2xl">{t("loginTitle")}</CardTitle>
        <CardDescription>{t("loginSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <KakaoButton label={t("kakaoLogin")} />
        <GoogleButton label={t("googleLogin")} />
        <p className="pt-2 text-center text-xs text-muted-foreground">
          {t("firstVisitHint")}
        </p>
      </CardContent>
    </Card>
  );
}
