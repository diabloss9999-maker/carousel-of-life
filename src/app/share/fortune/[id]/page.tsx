/**
 * 운세 공유 공개 페이지 — /share/fortune/[id]
 *
 * 토큰만 알면 누구나 볼 수 있는 공개 미리보기.
 * - OG 메타로 카카오톡·SNS 미리보기 카드 자동 노출
 * - 비로그인 방문자에게 "나도 받아보기" CTA → /signup?ref={inviter}
 * - 본인 운세는 ref 자동 적용으로 친구 초대 시스템 연동
 * - views 카운트 +1 (본인 조회 제외)
 */
import type { Metadata } from "next";
import type { Route } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LuckyInfo } from "@/components/fortune/lucky-info";
import {
  getSharedFortune,
  incrementViews,
} from "@/lib/share/service";
import {
  codeFromUserId,
} from "@/lib/invites/service";
import { getUser } from "@/lib/auth/get-user";
import { clientEnv } from "@/lib/env";
import { ROUTES } from "@/lib/constants";
import type { FortuneSnapshot } from "@/lib/share/service";

interface PageProps {
  params: Promise<{ id: string }>;
}

const CATEGORY_LABEL: Record<string, string> = {
  general: "종합운세",
  love: "연애운",
  money: "재물운",
  career: "직업운",
  health: "건강운",
  study: "학업운",
  zodiac: "별자리 운세",
  chinese_zodiac: "십이간지 운세",
};

function snapshotOf(row: unknown): FortuneSnapshot | null {
  if (typeof row !== "object" || row === null) return null;
  const r = row as Record<string, unknown>;
  if (
    typeof r.title !== "string" ||
    typeof r.content !== "string" ||
    typeof r.fortuneDate !== "string"
  ) {
    return null;
  }
  const character = r.character as Record<string, unknown> | undefined;
  return {
    title: r.title,
    content: r.content,
    score: typeof r.score === "number" ? r.score : null,
    luckyColor: typeof r.luckyColor === "string" ? r.luckyColor : null,
    luckyNumber: typeof r.luckyNumber === "number" ? r.luckyNumber : null,
    luckyDirection:
      typeof r.luckyDirection === "string" ? r.luckyDirection : null,
    fortuneDate: r.fortuneDate,
    character: {
      id: typeof character?.id === "string" ? character.id : "shaman",
      name: typeof character?.name === "string" ? character.name : "점술사",
      title: typeof character?.title === "string" ? character.title : "",
    },
  };
}

/** OG 카드 이미지 URL — 카카오톡 미리보기에 노출된다. */
function buildOgImageUrl(snap: FortuneSnapshot, category: string): string {
  const origin =
    clientEnv.NEXT_PUBLIC_APP_URL ?? "https://carouseloflife.com";
  const params = new URLSearchParams({
    title: snap.title,
    score: String(snap.score ?? 70),
    category: CATEGORY_LABEL[category] ?? "운세",
    content: snap.content.slice(0, 80),
    ...(snap.luckyColor && { color: snap.luckyColor }),
    ...(snap.luckyNumber && { number: String(snap.luckyNumber) }),
    ...(snap.luckyDirection && { direction: snap.luckyDirection }),
    date: snap.fortuneDate,
    char: snap.character.name,
    charTitle: snap.character.title,
  });
  return `${origin}/api/share/fortune?${params}`;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params;
  const row = await getSharedFortune(id);
  if (!row) {
    return {
      title: "공유된 운세를 찾을 수 없어요",
      robots: { index: false, follow: false },
    };
  }
  const snap = snapshotOf(row.snapshot);
  if (!snap) {
    return {
      title: "공유된 운세 — 인생의 회전목마",
      robots: { index: false, follow: false },
    };
  }

  const label = CATEGORY_LABEL[row.category] ?? "운세";
  const title = `${snap.title} · ${label}`;
  const description = `${snap.content.slice(0, 100)}${snap.content.length > 100 ? "…" : ""}`;
  const ogImage = buildOgImageUrl(snap, row.category);

  return {
    title,
    description,
    robots: { index: false, follow: false }, // 개인 운세 — 검색 노출 X
    openGraph: {
      title,
      description,
      images: [{ url: ogImage, width: 1080, height: 1080 }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function SharedFortunePage(props: PageProps) {
  const { id } = await props.params;
  const row = await getSharedFortune(id);
  if (!row) notFound();

  const snap = snapshotOf(row.snapshot);
  if (!snap) notFound();

  const viewer = await getUser();
  const isOwner = viewer?.id === row.userId;

  // 본인이 아니면 view 카운트 +1 (fire-and-forget, 페이지 로딩 지연 안 함)
  if (!isOwner) {
    void incrementViews(id);
  }

  const label = CATEGORY_LABEL[row.category] ?? "운세";
  const inviterCode = codeFromUserId(row.userId);
  // 비로그인 방문자에게 가입 페이지 + 초대 코드 자동 적용
  const signupUrl = `${ROUTES.signup}?ref=${inviterCode}` as Route;

  return (
    <main className="relative z-10 mx-auto w-full max-w-2xl px-4 py-10 sm:py-16">
      <div className="space-y-6">
        {/* 도입 — 누가 보낸 운세인지 */}
        <header className="text-center space-y-2">
          <p className="text-[15px] text-muted-foreground">
            누군가 별의 흐름을 보냈어요
          </p>
          <h1 className="font-mystic text-3xl font-semibold tracking-tight sm:text-4xl">
            {snap.character.name}의 {label}
          </h1>
          {snap.character.title ? (
            <p className="text-[15px] text-muted-foreground">
              {snap.character.title}
            </p>
          ) : null}
        </header>

        {/* 운세 본문 */}
        <Card className="app-surface ring-1 ring-border/40">
          <CardHeader className="space-y-3 pb-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[15px] text-muted-foreground">{label}</span>
              {typeof snap.score === "number" ? (
                <span className="font-mystic text-2xl font-semibold text-primary">
                  {snap.score}점
                </span>
              ) : null}
            </div>
            <h2 className="font-mystic text-xl font-semibold leading-snug tracking-tight">
              {snap.title}
            </h2>
          </CardHeader>

          <CardContent className="space-y-5">
            <p className="font-mystic whitespace-pre-line leading-relaxed text-foreground/90">
              {snap.content}
            </p>

            <LuckyInfo
              color={snap.luckyColor}
              number={snap.luckyNumber}
              direction={snap.luckyDirection}
            />

            <p className="pt-2 text-right text-[15px] text-muted-foreground">
              {snap.fortuneDate}
            </p>
          </CardContent>
        </Card>

        {/* CTA — 비로그인일 때만 강조 */}
        {viewer ? (
          <div className="rounded-2xl bg-muted/30 p-4 text-center space-y-3">
            <p className="text-[15px] text-muted-foreground">
              본인의 오늘 운세도 확인해보세요.
            </p>
            <Button asChild size="default" className="w-full sm:w-auto">
              <Link href={ROUTES.today}>오늘의 운세 보기</Link>
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl bg-gradient-to-br from-primary/15 via-accent/5 to-transparent p-5 sm:p-6 text-center space-y-3 ring-1 ring-primary/20">
            <div className="inline-flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" aria-hidden />
              <span className="text-[15px] font-medium">
                나의 별의 흐름도 받아보기
              </span>
            </div>
            <h3 className="font-mystic text-xl font-semibold leading-snug">
              회전목마가 당신을 기다려요
            </h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              생년월일과 이름만 입력하면 9명의 점술사가 당신의 오늘을 풀어줘요.
            </p>
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href={signupUrl}>나도 운세 받아보기</Link>
            </Button>
            <p className="text-[15px] text-muted-foreground/70">
              친구의 초대로 시작하면 별의 흐름이 한층 깊어져요.
            </p>
          </div>
        )}

        <footer className="pt-2 text-center text-[15px] text-muted-foreground/60">
          인생의 회전목마 · Carousel of Life
        </footer>
      </div>
    </main>
  );
}
