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
  title: "첫 관측",
  description:
    "운명의 책장에 이름을 더해보세요. 가입 즉시 매일 무료로 운세 2회·타로 2장·주술사 문답 10회를 받아볼 수 있어요.",
  alternates: { canonical: "/signup" },
};

export default function SignupPage() {
  return (
    <Card className="app-surface">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="font-mystic text-2xl">첫 관측</CardTitle>
        <CardDescription>
          경계에 처음으로 이름을 새겨.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <KakaoButton label="카카오로 시작하기" />
        <GoogleButton label="구글로 시작하기" />
        <p className="pt-2 text-center text-xs text-muted-foreground">
          버튼 한 번이면 가입 완료. 별도 비밀번호는 없어요.
        </p>
      </CardContent>
    </Card>
  );
}
