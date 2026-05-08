"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2, UserPlus } from "lucide-react";

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
import { RELATIONSHIP_OPTIONS } from "@/lib/compatibility/constants";
import {
  savePartnerAction,
  savePartnerIdleState,
} from "@/app/(dashboard)/compatibility/actions";

export function AddPartnerForm() {
  const [state, formAction, isPending] = useActionState(
    savePartnerAction,
    savePartnerIdleState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.kind === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-lg">
          <UserPlus className="h-5 w-5 text-accent" aria-hidden />
          상대 추가
        </CardTitle>
        <CardDescription className="text-xs">
          관계 허브에 새 상대를 등록해 둬.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="addPartnerName">
                이름 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="addPartnerName"
                name="name"
                type="text"
                maxLength={40}
                required
                placeholder="상대 이름"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addRelationship">관계</Label>
              <Select
                id="addRelationship"
                name="relationship"
                defaultValue="친구"
                disabled={isPending}
              >
                {RELATIONSHIP_OPTIONS.map((rel) => (
                  <option key={rel} value={rel}>
                    {rel}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="addBirthDate">
                생년월일 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="addBirthDate"
                name="birthDate"
                type="date"
                required
                max={new Date().toISOString().slice(0, 10)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addCalendarSystem">
                달력 <span className="text-destructive">*</span>
              </Label>
              <Select
                id="addCalendarSystem"
                name="calendarSystem"
                defaultValue="solar"
                required
                disabled={isPending}
              >
                <option value="solar">양력</option>
                <option value="lunar">음력</option>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="addGender">
                성별 <span className="text-destructive">*</span>
              </Label>
              <Select
                id="addGender"
                name="gender"
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
            <div className="space-y-2">
              <Label htmlFor="addMbti">MBTI</Label>
              <Input
                id="addMbti"
                name="mbti"
                type="text"
                maxLength={4}
                placeholder="예: ENFP"
                className="uppercase"
                disabled={isPending}
              />
            </div>
          </div>

          {state.kind !== "idle" ? (
            <FormMessage
              state={{ kind: state.kind, message: state.message ?? "" }}
            />
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
                저장 중…
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" aria-hidden />
                상대 저장
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
