"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Heart, Loader2 } from "lucide-react";

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
import { ROUTES } from "@/lib/constants";
import {
  submitCompatibilityAction,
  type CompatibilityActionState,
} from "@/app/(dashboard)/compatibility/actions";

const initial: CompatibilityActionState = { kind: "idle" };

export function CompatibilityForm() {
  const [state, formAction, isPending] = useActionState(
    submitCompatibilityAction,
    initial,
  );

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-lg">
          <Heart className="h-5 w-5 text-accent" aria-hidden />
          상대방 정보
        </CardTitle>
        <CardDescription className="text-xs">
          알고 있는 것만 적어도 괜찮아.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="partnerName">
              이름 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="partnerName"
              name="partnerName"
              type="text"
              maxLength={40}
              required
              placeholder="상대방의 이름"
              disabled={isPending}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="partnerBirthDate">
                생년월일 <span className="text-destructive">*</span>
              </Label>
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
              <Label htmlFor="partnerBirthTime">태어난 시각</Label>
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
              <Label htmlFor="partnerCalendarSystem">
                달력 <span className="text-destructive">*</span>
              </Label>
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
              <Label htmlFor="partnerGender">
                성별 <span className="text-destructive">*</span>
              </Label>
              <Select
                id="partnerGender"
                name="partnerGender"
                required
                defaultValue=""
                disabled={isPending}
              >
                <option value="" disabled>
                  골라줘
                </option>
                <option value="male">남</option>
                <option value="female">여</option>
                <option value="other">기타</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="partnerMbti">MBTI</Label>
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
                  <Link href={ROUTES.pricing}>프리미엄으로 무제한</Link>
                </Button>
              ) : null}
            </div>
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
                두 사주를 견주는 중…
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
