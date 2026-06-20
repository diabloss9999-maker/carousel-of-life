"use client";

import { useActionState } from "react";
import { Loader2, Moon } from "lucide-react";

import {
  readDreamAction,
  type DreamActionState,
} from "@/app/(dashboard)/dream/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { safeReadingText, safeShortText } from "@/lib/content/safety";
import { breakSentences } from "@/lib/utils";

const initial: DreamActionState = { kind: "idle" };

const FORTUNE_LABEL: Record<string, { label: string; color: string }> = {
  good: { label: "길몽", color: "text-emerald-400" },
  caution: { label: "주의", color: "text-amber-400" },
  bad: { label: "경고", color: "text-rose-400" },
  neutral: { label: "보통", color: "text-muted-foreground" },
};

export function DreamReadingForm() {
  const [state, formAction, isPending] = useActionState(readDreamAction, initial);

  return (
    <div className="space-y-6">
      <Card className="app-surface">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-lg">
            <Moon className="h-5 w-5 text-primary" aria-hidden />
            꿈 내용 적기
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dreamContent">
                기억나는 장면 <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="dreamContent"
                name="dreamContent"
                rows={7}
                maxLength={500}
                required
                placeholder="예: 낯선 집에서 문을 찾고 있었는데, 창밖에는 비가 오고 있었어요."
                disabled={isPending}
                className="w-full resize-none rounded-xl border border-input/80 bg-card/55 px-3.5 py-2.5 text-[15px] leading-7 backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
              />
              <p className="text-[13px] leading-5 text-muted-foreground">
                선명한 장면, 사람, 색, 감정이 떠오르면 같이 적어 주세요.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mood">꿈의 분위기</Label>
              <Select id="mood" name="mood" defaultValue="neutral" disabled={isPending}>
                <option value="neutral">잘 모르겠어요</option>
                <option value="bright">밝고 편안했어요</option>
                <option value="dark">어둡고 무거웠어요</option>
                <option value="weird">이상하고 비현실적이었어요</option>
              </Select>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  꿈 해석 중
                </>
              ) : (
                "꿈 해석하기"
              )}
            </Button>

            {state.kind === "error" ? (
              <p className="text-[15px] text-destructive">{state.message}</p>
            ) : null}
          </form>
        </CardContent>
      </Card>

      {state.kind === "result" ? (
        <DreamReadingResult reading={state.reading} />
      ) : null}
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
        <CardTitle className="font-mystic flex flex-col gap-2 text-2xl sm:flex-row sm:items-baseline">
          <span className={fortuneMeta.color}>{fortuneMeta.label}</span>
          <span className="text-[15px] font-normal text-muted-foreground">
            {safeShortText(reading.summary, "꿈이 남긴 메시지를 정리했어요.")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 text-[15px] leading-relaxed">
        <ResultSection
          title="꿈의 의미"
          body={safeReadingText(
            reading.meaning,
            "꿈에 남은 장면과 감정이 지금의 마음을 비추고 있어요.",
          )}
        />
        <ResultSection
          title="나와 연결되는 흐름"
          body={safeReadingText(
            reading.sajuConnection,
            "최근의 감정과 선택이 꿈의 상징으로 나타난 흐름이에요.",
          )}
        />
        <ResultSection
          title="오늘의 조언"
          body={safeReadingText(
            reading.advice,
            "오늘은 서두르기보다 마음에 남은 신호를 천천히 정리해 보세요.",
          )}
        />
      </CardContent>
    </Card>
  );
}

function ResultSection({ title, body }: { title: string; body: string }) {
  return (
    <section>
      <h3 className="mb-2 font-mystic text-lg font-semibold text-foreground/90">
        {title}
      </h3>
      <p className="whitespace-pre-line text-foreground/85">
        {breakSentences(body)}
      </p>
    </section>
  );
}
