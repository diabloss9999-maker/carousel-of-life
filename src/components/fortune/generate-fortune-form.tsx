"use client";

import Link from "next/link";
import { CharacterImage } from "@/components/shared/character-image";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

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

/** 카테고리 id → generateForm 의 line 메시지 키. sub 는 fallbackSaju 공통. */
const COPY_TKEY: Record<string, string> = {
  general: "copyGeneral",
  love: "copyLove",
  money: "copyMoney",
  career: "copyCareer",
  health: "copyHealth",
  study: "copyStudy",
  zodiac: "copyZodiac",
  chinese_zodiac: "copyChineseZodiac",
};

export function GenerateFortuneForm({
  category,
  categoryLabel,
}: GenerateFortuneFormProps) {
  const [state, formAction, isPending] = useActionState(
    generateFortuneAction,
    initial,
  );
  const t = useTranslations("generateForm");
  const tChar = useTranslations("characters");

  useScrollToResult(isPending, "fortune-result");

  const charId = getTodayCharacter();
  const character = CHARACTERS[charId];
  const name = tChar(`${charId}.name`);
  const title = tChar(`${charId}.title`);
  const copyKey = COPY_TKEY[category];
  const line = copyKey
    ? t(copyKey as "copyGeneral" | "copyLove" | "copyMoney" | "copyCareer" | "copyHealth" | "copyStudy" | "copyZodiac" | "copyChineseZodiac")
    : t("fallbackBody", { category: categoryLabel });
  const sub = t("fallbackSaju");

  return (
    <div className="overflow-hidden rounded-2xl border border-border/20"
      style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(16px)" }}
    >
      <div className="flex gap-0">
        {/* 캐릭터 이미지 */}
        <div className="relative w-24 sm:w-32 flex-shrink-0">
          <CharacterImage
            character={character}
            width={600}
            height={900}
            quality={85}
            className="h-full w-full object-cover object-top opacity-80"
            style={{ minHeight: "160px", maxHeight: "200px" }}
            sizes="128px"
          />
          <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-r from-transparent to-white/8" />
        </div>

        {/* 콘텐츠 */}
        <div className="flex flex-1 flex-col justify-between gap-4 p-4 sm:p-5">
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
              {name} · {title}
            </p>
            <p className="font-mystic text-base font-semibold text-foreground/90 leading-snug">
              {line}
            </p>
            <p className="text-xs text-muted-foreground/60">{sub}</p>
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
                  {t("loading")}
                </>
              ) : (
                t("askCta", { name, category: categoryLabel })
              )}
            </Button>
          </form>

          {state.kind === "error" && (
            <div className="space-y-2">
              <FormMessage state={{ kind: "error", message: state.message ?? "" }} />
              {state.quotaExceeded && (
                <Button asChild className="w-full" variant="outline" size="sm">
                  <Link href={ROUTES.pricing}>{t("unlimitedCta")}</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
