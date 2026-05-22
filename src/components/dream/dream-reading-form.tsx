"use client";

import { useActionState } from "react";
import { Loader2, Moon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  readDreamAction,
  type DreamActionState,
} from "@/app/(dashboard)/dream/actions";

const initial: DreamActionState = { kind: "idle" };

const FORTUNE_LABEL: Record<string, { label: string; color: string }> = {
  good: { label: "길몽", color: "text-emerald-400" },
  caution: { label: "주의 몽", color: "text-amber-400" },
  bad: { label: "흉몽", color: "text-rose-400" },
  neutral: { label: "중립 몽", color: "text-muted-foreground" },
};

export function DreamReadingForm() {
  const [state, formAction, isPending] = useActionState(readDreamAction, initial);

  return (
    <div className="space-y-6">
      <Card className="app-surface">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-lg">
            <Moon className="h-5 w-5 text-primary" aria-hidden />
            꿈을 적어보세요
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dreamContent">
                꿈 내용 <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="dreamContent"
                name="dreamContent"
                rows={6}
                maxLength={500}
                required
                placeholder="예: 큰 강을 건너는 꿈을 꿨어요. 물이 맑았고..."
                disabled={isPending}
                className="w-full rounded-xl border border-input/80 bg-card/55 px-3.5 py-2.5 text-[15px] backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 resize-none"
              />
              <p className="text-[15px] text-muted-foreground">
                10-500자 사이. 인상 깊었던 장면·인물·감정을 간결하게 적어주세요.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mood">꿈의 분위기</Label>
              <Select id="mood" name="mood" defaultValue="neutral" disabled={isPending}>
                <option value="neutral">특별한 분위기 없음</option>
                <option value="bright">밝고 따뜻한 분위기</option>
                <option value="dark">어둡고 무거운 분위기</option>
                <option value="weird">기괴하거나 비현실적인 분위기</option>
              </Select>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  꿈의 결을 짚는 중…
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
        <DreamReadingResult reading={state.reading} />
      )}
    </div>
  );
}

function DreamReadingResult({
  reading,
}: {
  reading: NonNullable<Extract<DreamActionState, { kind: "result" }>>["reading"];
}) {
  const fortuneMeta = FORTUNE_LABEL[reading.fortune] ?? FORTUNE_LABEL.neutral;

  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-baseline gap-3 text-2xl">
          <span className={fortuneMeta.color}>{fortuneMeta.label}</span>
          <span className="text-[15px] text-muted-foreground font-normal">
            {reading.summary}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 text-[15px] leading-relaxed">
        <section>
          <h3 className="font-mystic text-lg font-semibold mb-2 text-foreground/90">
            꿈의 의미
          </h3>
          <p className="text-foreground/85 whitespace-pre-line">
            {reading.meaning}
          </p>
        </section>
        <section>
          <h3 className="font-mystic text-lg font-semibold mb-2 text-foreground/90">
            당신 사주와의 연결
          </h3>
          <p className="text-foreground/85 whitespace-pre-line">
            {reading.sajuConnection}
          </p>
        </section>
        <section>
          <h3 className="font-mystic text-lg font-semibold mb-2 text-foreground/90">
            오늘의 권유
          </h3>
          <p className="text-foreground/85 whitespace-pre-line">
            {reading.advice}
          </p>
        </section>
      </CardContent>
    </Card>
  );
}
