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
  title: "첫 관측",
  description:
    "운명의 책장에 이름을 더해보세요. 가입 즉시 매일 무료로 운세 2회·타로 2장·주술사 문답 3회를 받아볼 수 있어요.",
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
      <CardContent className="space-y-6">
        <SignupForm />
        <p className="text-center text-sm text-muted-foreground">
          이미 경계를 알고 있나요?{" "}
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
