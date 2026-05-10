"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  onboardingAction,
  type OnboardingFormState,
} from "@/lib/auth/onboarding-action";

const initial: OnboardingFormState = { kind: "idle" };

interface OnboardingFormProps {
  initialDisplayName?: string;
}

export function OnboardingForm({
  initialDisplayName = "",
}: OnboardingFormProps) {
  const [state, formAction, isPending] = useActionState(
    onboardingAction,
    initial,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="displayName">
          이름 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          required
          maxLength={40}
          defaultValue={initialDisplayName}
          placeholder="주술사가 부를 당신의 이름"
          disabled={isPending}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="birthDate">
            생년월일 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="birthDate"
            name="birthDate"
            type="date"
            required
            max={new Date().toISOString().slice(0, 10)}
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthTime">태어난 시각</Label>
          <Input
            id="birthTime"
            name="birthTime"
            type="time"
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground">
            모르면 비워두세요. 시주 추정은 생략됩니다.
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="calendarSystem">
            달력 <span className="text-destructive">*</span>
          </Label>
          <Select
            id="calendarSystem"
            name="calendarSystem"
            defaultValue="solar"
            required
            disabled={isPending}
          >
            <option value="solar">양력</option>
            <option value="lunar">음력</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">
            성별 <span className="text-destructive">*</span>
          </Label>
          <Select
            id="gender"
            name="gender"
            required
            defaultValue=""
            disabled={isPending}
          >
            <option value="" disabled>
              선택해주세요
            </option>
            <option value="male">남</option>
            <option value="female">여</option>
            <option value="other">기타</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="mbti">성격유형 (예: INFJ)</Label>
          <Input
            id="mbti"
            name="mbti"
            type="text"
            maxLength={4}
            placeholder="예: INFJ"
            className="uppercase"
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthPlace">출생지</Label>
          <Input
            id="birthPlace"
            name="birthPlace"
            type="text"
            maxLength={80}
            placeholder="예: 서울"
            disabled={isPending}
          />
        </div>
      </div>

      <FormMessage
        state={
          state.kind === "error"
            ? { kind: "error", message: state.message ?? "" }
            : { kind: "idle" }
        }
      />

      <Button type="submit" className="w-full" disabled={isPending} size="lg">
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> 운명의
            책장을 펼치는 중…
          </>
        ) : (
          "시작하기"
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        입력하신 정보는 사주 풀이에만 사용돼요.
      </p>
    </form>
  );
}
