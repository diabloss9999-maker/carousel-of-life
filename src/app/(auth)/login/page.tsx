import type { Metadata } from "next";
import Link from "next/link";

import { KakaoButton } from "@/components/auth/kakao-button";
import { GoogleButton } from "@/components/auth/google-button";
import { OrDivider } from "@/components/auth/or-divider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import { LoginForm } from "./login-form";

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
      <CardContent className="space-y-4">
        <KakaoButton label="카카오로 로그인" />
        <GoogleButton label="구글로 로그인" />
        <OrDivider />
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          아직 계정이 없나요?{" "}
          <Link
            href={ROUTES.signup}
            className="font-medium text-primary hover:underline"
          >
            가입하기
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
