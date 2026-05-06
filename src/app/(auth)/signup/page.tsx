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
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "회원가입",
  description: "운명의 책장에 이름을 더해보세요.",
};

export default function SignupPage() {
  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="font-mystic text-2xl">회원가입</CardTitle>
        <CardDescription>
          별의 흐름이 당신을 기다리고 있어요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <SignupForm />
        <p className="text-center text-sm text-muted-foreground">
          이미 가입하셨나요?{" "}
          <Link
            href={ROUTES.login}
            className="font-medium text-primary hover:underline"
          >
            로그인
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
