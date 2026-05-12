"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { useScrollToResult } from "@/hooks/use-scroll-to-result";
import { ROUTES } from "@/lib/constants";
import {
  generateFortuneAction,
  type FortuneActionState,
} from "@/app/(dashboard)/today/actions";
import { CHARACTERS } from "@/lib/chat/characters";
import { getTodayCharacter } from "@/lib/daily-question/rotation";

interface GenerateFortuneFormProps {
  category: string;
  categoryLabel: string;
}

const initial: FortuneActionState = { kind: "idle" };

/** 카테고리별 세계관 문구 */
const CATEGORY_COPY: Record<string, { line: string; sub: string }> = {
  general:       { line: "오늘 하루 전체 흐름을 읽어줄게.",       sub: "사주와 일진을 함께 살펴볼게." },
  love:          { line: "오늘 당신의 인연 기운이 궁금해.",        sub: "감정의 흐름이 보여." },
  money:         { line: "오늘 재물의 흐름을 읽어줄게.",           sub: "돈의 기운도 사주에 담겨 있어." },
  career:        { line: "오늘 일의 흐름이 어떤지 볼게.",          sub: "직장과 커리어의 기운을 읽어줄게." },
  health:        { line: "오늘 몸과 마음의 기운을 볼게.",          sub: "건강의 흐름을 살펴볼게." },
  study:         { line: "오늘 집중력과 학업 흐름을 읽어줄게.",    sub: "머리의 기운이 어떤지 볼게." },
  zodiac:        { line: "별자리 기운으로 오늘을 읽어줄게.",       sub: "태어난 별자리가 전하는 메시지야." },
  chinese_zodiac:{ line: "띠의 기운으로 오늘을 읽어줄게.",        sub: "12지신이 전하는 오늘의 흐름이야." },
};

export function GenerateFortuneForm({
  category,
  categoryLabel,
}: GenerateFortuneFormProps) {
  const [state, formAction, isPending] = useActionState(
    generateFortuneAction,
    initial,
  );

  useScrollToResult(isPending, "fortune-result");

  const charId = getTodayCharacter();
  const character = CHARACTERS[charId];
  const copy = CATEGORY_COPY[category] ?? { line: `${categoryLabel} 흐름을 읽어줄게.`, sub: "사주를 살펴볼게." };

  return (
    <div className="overflow-hidden rounded-2xl border border-border/20"
      style={{ background: "linear-gradient(135deg, #0a0812 0%, #120e1e 100%)" }}
    >
      <div className="flex gap-0">
        {/* 캐릭터 이미지 */}
        <div className="relative w-24 sm:w-32 flex-shrink-0">
          <Image
            src={character.imageSrc}
            alt={character.name}
            width={600}
            height={900}
            quality={85}
            className="h-full w-full object-cover object-top opacity-80"
            style={{ minHeight: "160px", maxHeight: "200px" }}
            sizes="128px"
          />
          <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-r from-transparent to-[#0a0812]" />
        </div>

        {/* 콘텐츠 */}
        <div className="flex flex-1 flex-col justify-between gap-4 p-4 sm:p-5">
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
              {character.name} · {character.title}
            </p>
            <p className="font-mystic text-base font-semibold text-foreground/90 leading-snug">
              {copy.line}
            </p>
            <p className="text-xs text-muted-foreground/60">{copy.sub}</p>
          </div>

          <form action={formAction}>
            <input type="hidden" name="category" value={category} />
            <Button
              type="submit"
              disabled={isPending}
              size="lg"
              className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur font-mystic"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  별의 흐름을 읽는 중…
                </>
              ) : (
                `${character.name}에게 ${categoryLabel} 묻기`
              )}
            </Button>
          </form>

          {state.kind === "error" && (
            <div className="space-y-2">
              <FormMessage state={{ kind: "error", message: state.message ?? "" }} />
              {state.quotaExceeded && (
                <Button asChild className="w-full" variant="outline" size="sm">
                  <Link href={ROUTES.pricing}>프리미엄으로 무제한 받기</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
