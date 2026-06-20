"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  HeartHandshake,
  Loader2,
  Lock,
  Shield,
  Sparkles,
} from "lucide-react";

import {
  generateCompatConflictAction,
  type CompatConflictState,
} from "@/app/(dashboard)/compatibility/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CompatConflictOutput } from "@/lib/ai/types";
import { safeReadingText } from "@/lib/content/safety";
import { ROUTES } from "@/lib/constants";

interface CompatConflictProps {
  subscribed: boolean;
  aName: string;
  aBirthDate: string;
  aGender: string;
  bName: string;
  bBirthDate: string;
  bGender: string;
  aMbti?: string;
  bMbti?: string;
}

export function CompatConflict(props: CompatConflictProps) {
  const { subscribed } = props;
  const [data, setData] = useState<CompatConflictOutput | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleGenerate = (): void => {
    setErrorMsg(null);
    startTransition(async () => {
      const result: CompatConflictState = await generateCompatConflictAction(
        props.aName,
        props.aBirthDate,
        props.aGender,
        props.bName,
        props.bBirthDate,
        props.bGender,
        props.aMbti,
        props.bMbti,
      );
      if (result.kind === "success" && result.data) {
        setData(result.data);
      } else {
        setErrorMsg(result.message ?? "분석을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
      }
    });
  };

  if (!subscribed) {
    return <LockedPremiumCard title="갈등 포인트" />;
  }

  if (data) {
    return (
      <Card className="app-surface">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-base">
            <HeartHandshake className="h-4 w-4 text-accent" />
            갈등 포인트
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" /> 부딪히기 쉬운 지점
            </p>
            <ul className="space-y-2">
              {data.triggers.map((trigger, i) => (
                <li key={i} className="flex items-start gap-2 text-[15px]">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-destructive/15 text-[11px] font-bold text-destructive">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">
                    {safeReadingText(trigger, "표현 속도나 기대치가 달라질 때 조심해 주세요.")}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <InfoBlock label="반복 패턴" body={data.pattern} />
          <InfoBlock label="풀어가는 방법" body={data.resolution} accent />

          <div className="flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/5 p-3">
            <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wide text-primary">
                피하면 좋은 말
              </p>
              <p className="mt-0.5 text-[15px] leading-relaxed">
                {safeReadingText(data.avoidTip)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ActionCard
      title="갈등 포인트"
      body="어떤 말이나 상황에서 엇갈리기 쉬운지, 어떻게 풀면 좋은지 정리해요."
      errorMsg={errorMsg}
      isPending={isPending}
      onGenerate={handleGenerate}
    />
  );
}

function LockedPremiumCard({ title }: { title: string }) {
  return (
    <Card className="app-surface ring-1 ring-accent/20">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-base">
          <Lock className="h-4 w-4 text-accent" />
          {title}
          <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[12px] font-medium text-primary">
            라이트 이상
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-[15px] text-muted-foreground">
          플랜을 확인하면 갈등 패턴과 해결 방법을 더 자세히 볼 수 있어요.
        </p>
        <Button asChild size="sm" className="w-full">
          <Link href={ROUTES.pricing}>
            <Sparkles className="h-3.5 w-3.5" />
            플랜 확인하기
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

interface ActionCardProps {
  title: string;
  body: string;
  errorMsg: string | null;
  isPending: boolean;
  onGenerate: () => void;
}

function ActionCard({
  title,
  body,
  errorMsg,
  isPending,
  onGenerate,
}: ActionCardProps) {
  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-base">
          <HeartHandshake className="h-4 w-4 text-accent" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-[15px] text-muted-foreground">{body}</p>
        {errorMsg ? <p className="text-[15px] text-destructive">{errorMsg}</p> : null}
        <Button onClick={onGenerate} disabled={isPending} size="sm" className="w-full">
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              분석하는 중
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              추가 분석 보기
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function InfoBlock({
  label,
  body,
  accent = false,
}: {
  label: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        accent
          ? "space-y-1.5 rounded-xl border border-accent/25 bg-accent/5 p-4"
          : "space-y-1.5 rounded-xl app-surface p-4"
      }
    >
      <p
        className={
          accent
            ? "text-[12px] font-semibold uppercase tracking-wide text-accent"
            : "text-[12px] font-semibold uppercase tracking-wide text-muted-foreground"
        }
      >
        {label}
      </p>
      <p className="font-mystic leading-relaxed text-foreground/90">
        {safeReadingText(body)}
      </p>
    </div>
  );
}
