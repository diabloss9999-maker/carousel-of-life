/**
 * 최애 갤러리 — 최애 멤버의 사진첩.
 *
 * - 무료: 첫 1장만 공개, 나머지는 블러 + 잠금
 * - 구독자(라이트·프로): 전체 공개
 *
 * 최애를 지정한 사용자에게만 /chat 페이지 하단에 노출된다.
 * 결제 진입 링크(/pricing)는 안드로이드 앱에서 CSS 로 자동 숨김.
 */
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHARACTERS, type CharacterId } from "@/lib/chat/characters";
import { cn } from "@/lib/utils";

interface BiasGalleryProps {
  biasCharacterId: string | null;
  subscribed: boolean;
}

/** 무료 사용자에게 공개되는 사진 수. */
const FREE_VISIBLE_COUNT = 1;

export function BiasGallery({ biasCharacterId, subscribed }: BiasGalleryProps) {
  const t = useTranslations("biasGallery");
  const tChar = useTranslations("characters");
  if (!biasCharacterId) return null;
  const id = biasCharacterId as CharacterId;
  const character = CHARACTERS[id];
  if (!character?.imageSlides?.length) return null;

  const slides = character.imageSlides;
  const memberName = tChar(`${id}.name`);

  return (
    <Card className="app-surface">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="font-mystic flex items-center gap-2 text-lg">
            💖 {t("title", { name: memberName })}
            <span className="rounded-full border border-rose-300/30 bg-rose-400/10 px-2 py-0.5 text-[11px] font-medium text-rose-200/90">
              {t("biasBadge")}
            </span>
          </CardTitle>
          {!subscribed ? (
            <Link
              href="/pricing"
              className="shrink-0 text-[13px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {t("viewAll")}
            </Link>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {slides.map((src, i) => {
            const locked = !subscribed && i >= FREE_VISIBLE_COUNT;
            return (
              <div
                key={src}
                className="relative aspect-[3/4] overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/10"
              >
                <Image
                  src={src}
                  alt={
                    locked
                      ? t("lockedAlt")
                      : t("photoAlt", { name: memberName, n: i + 1 })
                  }
                  fill
                  sizes="(min-width: 640px) 20vw, 33vw"
                  className={cn(
                    "object-cover object-top",
                    locked && "blur-md brightness-50",
                  )}
                />
                {locked ? (
                  <div className="absolute inset-0 grid place-items-center">
                    <Lock className="h-5 w-5 text-white/85" aria-hidden />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        {!subscribed ? (
          <p data-hide-in-app className="pt-2.5 text-[13px] text-muted-foreground/80">
            {t("unlockHint", { name: memberName })}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
