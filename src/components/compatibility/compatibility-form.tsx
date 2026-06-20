"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Heart, Loader2, MessageCircle, Sparkles, UsersRound } from "lucide-react";

import {
  submitCompatibilityAction,
  type CompatibilityActionState,
} from "@/app/(dashboard)/compatibility/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useScrollToResult } from "@/hooks/use-scroll-to-result";
import { ROUTES } from "@/lib/constants";

const initial: CompatibilityActionState = { kind: "idle" };

export function CompatibilityForm() {
  const [state, formAction, isPending] = useActionState(
    submitCompatibilityAction,
    initial,
  );

  useScrollToResult(isPending, "compat-result", 800);

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-lg">
          <Heart className="h-5 w-5 text-accent" aria-hidden />
          새 궁합 보기
        </CardTitle>
        <CardDescription className="text-[15px]">
          상대의 기본 정보를 입력하면 관계의 분위기와 조심할 지점을 정리해요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            {
              icon: UsersRound,
              title: "관계의 결",
              body: "두 사람이 편하게 맞는 지점을 먼저 살펴봐요.",
            },
            {
              icon: Sparkles,
              title: "끌림과 거리감",
              body: "어디서 가까워지고 어디서 엇갈리는지 정리해요.",
            },
            {
              icon: MessageCircle,
              title: "다가가는 방식",
              body: "오늘 어떻게 말을 꺼내면 좋을지 힌트를 얻어요.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3"
            >
              <div className="flex items-center gap-2 text-primary">
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <p className="text-[13px] font-semibold text-foreground">
                  {title}
                </p>
              </div>
              <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="partnerName">상대 이름</Label>
            <Input
              id="partnerName"
              name="partnerName"
              type="text"
              maxLength={40}
              required
              placeholder="예: 민지"
              disabled={isPending}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="partnerBirthDate">생년월일</Label>
              <Input
                id="partnerBirthDate"
                name="partnerBirthDate"
                type="date"
                required
                max={new Date().toISOString().slice(0, 10)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partnerBirthTime">태어난 시간 선택 입력</Label>
              <Input
                id="partnerBirthTime"
                name="partnerBirthTime"
                type="time"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="partnerCalendarSystem">달력</Label>
              <Select
                id="partnerCalendarSystem"
                name="partnerCalendarSystem"
                defaultValue="solar"
                required
                disabled={isPending}
              >
                <option value="solar">양력</option>
                <option value="lunar">음력</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="partnerGender">성별</Label>
              <Select
                id="partnerGender"
                name="partnerGender"
                required
                defaultValue=""
                disabled={isPending}
              >
                <option value="" disabled>
                  선택
                </option>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="other">기타</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="partnerMbti">MBTI 선택 입력</Label>
            <Input
              id="partnerMbti"
              name="partnerMbti"
              type="text"
              maxLength={4}
              placeholder="예: ENFP"
              className="uppercase"
              disabled={isPending}
            />
          </div>

          {state.kind === "error" ? (
            <div className="space-y-2">
              <FormMessage
                state={{ kind: "error", message: state.message ?? "" }}
              />
              {state.quotaExceeded ? (
                <Button asChild className="w-full" variant="outline">
                  <Link href={ROUTES.pricing}>플랜 확인하기</Link>
                </Button>
              ) : null}
            </div>
          ) : null}

          {state.kind === "done" && !state.reading ? (
            <p className="text-center text-[15px] font-medium text-emerald-500">
              궁합 결과를 불러왔어요.
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={isPending}
            size="lg"
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                궁합 보는 중
              </>
            ) : (
              <>
                <Heart className="h-4 w-4" aria-hidden />
                궁합 보기
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
