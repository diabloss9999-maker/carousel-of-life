import type { Metadata } from "next";

import { KakaoButton } from "@/components/auth/kakao-button";
import { GoogleButton } from "@/components/auth/google-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "관측 시작",
  description: "경계로 돌아옵니다.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return (
    <Card className="app-surface">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="font-mystic text-2xl">관측 시작</CardTitle>
        <CardDescription>
          경계가 당신을 기억하고 있어.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <KakaoButton label="카카오로 로그인" />
        <GoogleButton label="구글로 로그인" />
        <p className="pt-2 text-center text-xs text-muted-foreground">
          첫 방문이라면 그대로 가입돼요.
        </p>
      </CardContent>
    </Card>
  );
}
