"use client";

/**
 * 최애(bias) 토글 버튼 — 채팅 헤더에 표시.
 *
 * 현재 멤버를 최애로 등록/해제한다. 등록 시 하트가 채워지고, 선톡 우선순위 +
 * 멤버 간 관계망(특별 애정 / 가벼운 질투)에 반영된다.
 */
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";

import { setBiasAction } from "@/lib/chat/bias-action";
import { cn } from "@/lib/utils";
import type { CharacterId } from "@/lib/chat/characters";

interface BiasButtonProps {
  characterId: CharacterId;
  isBias: boolean;
  compact?: boolean;
}

export function BiasButton({ characterId, isBias, compact = false }: BiasButtonProps) {
  const t = useTranslations("biasButton");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await setBiasAction(isBias ? null : characterId);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={isBias}
      aria-label={isBias ? t("unset") : t("set")}
      title={isBias ? t("unset") : t("set")}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1 rounded-full border text-[13px] font-medium transition disabled:opacity-50",
        compact ? "h-9 w-9 px-0 py-0" : "px-3 py-1.5",
        isBias
          ? "border-rose-400/40 bg-rose-500/15 text-rose-200"
          : "border-white/15 bg-white/5 text-muted-foreground hover:text-foreground",
      )}
    >
      <Heart
        className={cn("h-3.5 w-3.5", isBias && "fill-current")}
        aria-hidden
      />
      {!compact ? (isBias ? t("current") : t("setShort")) : null}
    </button>
  );
}
