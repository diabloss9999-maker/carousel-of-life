import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { EmailLoginForm } from "@/components/auth/email-login-form";
import { GoogleButton } from "@/components/auth/google-button";
import { KakaoButton } from "@/components/auth/kakao-button";
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
      <CardContent className="space-y-4">
        {/* 이메일 + 비밀번호 — 카드사 사전심사 테스트 계정 진입 채널 */}
        <EmailLoginForm />

        {/* 구분선 */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/40" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-3 text-[15px] text-muted-foreground">
              또는
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <KakaoButton label={t("kakaoLogin")} />
          <GoogleButton label={t("googleLogin")} />
        </div>

        <p className="pt-2 text-center text-[15px] text-muted-foreground">
          {t("firstVisitHint")}
        </p>
      </CardContent>
    </Card>
  );
}
