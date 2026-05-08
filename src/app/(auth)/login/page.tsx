import type { Metadata } from "next";
import Link from "next/link";

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
  title: "로그인",
  description: "이미 가입한 분의 자리로 들어옵니다.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return (
    <Card className="app-surface">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="font-mystic text-2xl">로그인</CardTitle>
        <CardDescription>
          이메일과 비밀번호를 입력해주세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          아직 계정이 없으신가요?{" "}
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
