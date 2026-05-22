"use client";

import { useActionState } from "react";
import { Loader2, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  readNameAction,
  type NameReadingActionState,
} from "@/app/(dashboard)/name-reading/actions";

const initial: NameReadingActionState = { kind: "idle" };

interface NameReadingFormProps {
  defaultName?: string;
}

export function NameReadingForm({ defaultName = "" }: NameReadingFormProps) {
  const [state, formAction, isPending] = useActionState(readNameAction, initial);

  return (
    <div className="space-y-6">
      <Card className="app-surface">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" aria-hidden />
            풀이할 이름
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetName">
                이름 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="targetName"
                name="targetName"
                type="text"
                required
                maxLength={20}
                defaultValue={defaultName}
                placeholder="예: 최영탁"
                disabled={isPending}
              />
              <p className="text-[15px] text-muted-foreground">
                한글로 입력하세요. 한자는 아래 칸에 별도로.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hanja">한자 표기 (선택)</Label>
              <Input
                id="hanja"
                name="hanja"
                type="text"
                maxLength={20}
                placeholder="예: 崔英卓 (없으면 비워두기)"
                disabled={isPending}
              />
              <p className="text-[15px] text-muted-foreground">
                한자가 있으면 더 정확한 풀이가 가능해요.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="isOwnName">누구의 이름인가요?</Label>
              <Select id="isOwnName" name="isOwnName" defaultValue="true" disabled={isPending}>
                <option value="true">본인 이름</option>
                <option value="false">다른 사람 이름</option>
              </Select>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  이름의 결을 짚는 중…
                </>
              ) : (
                "풀이 받기"
              )}
            </Button>

            {state.kind === "error" && (
              <p className="text-[15px] text-destructive">{state.message}</p>
            )}
          </form>
        </CardContent>
      </Card>

      {state.kind === "result" && (
        <NameReadingResultCard reading={state.reading} />
      )}
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  if (score >= 40) return "text-muted-foreground";
  return "text-rose-400";
}

function NameReadingResultCard({
  reading,
}: {
  reading: NonNullable<Extract<NameReadingActionState, { kind: "result" }>>["reading"];
}) {
  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-baseline gap-3 text-2xl">
          <span className={scoreColor(reading.score)}>{reading.score}점</span>
          <span className="text-[15px] text-muted-foreground font-normal">
            {reading.summary}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 text-[15px] leading-relaxed">
        <section>
          <h3 className="font-mystic text-lg font-semibold mb-2 text-foreground/90">
            이름의 의미
          </h3>
          <p className="text-foreground/85 whitespace-pre-line">
            {reading.meaning}
          </p>
        </section>
        <section>
          <h3 className="font-mystic text-lg font-semibold mb-2 text-foreground/90">
            사주와의 조화
          </h3>
          <p className="text-foreground/85 whitespace-pre-line">
            {reading.sajuHarmony}
          </p>
        </section>
        <section>
          <h3 className="font-mystic text-lg font-semibold mb-2 text-foreground/90">
            운세 흐름
          </h3>
          <p className="text-foreground/85 whitespace-pre-line">
            {reading.fortune}
          </p>
        </section>
        <section>
          <h3 className="font-mystic text-lg font-semibold mb-2 text-foreground/90">
            권유·주의
          </h3>
          <p className="text-foreground/85 whitespace-pre-line">
            {reading.advice}
          </p>
        </section>
      </CardContent>
    </Card>
  );
}
