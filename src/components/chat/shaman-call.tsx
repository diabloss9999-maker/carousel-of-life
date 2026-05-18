"use client";

/**
 * 흐름 페이지에서 주술사가 먼저 말을 걸어오는 카드.
 * 클릭하면 해당 주술사와의 대화 세션을 생성/이어서 /chat/[id] 로 이동.
 */
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { CHARACTERS, type CharacterId } from "@/lib/chat/characters";
import { CharacterImage } from "@/components/shared/character-image";

const CHARACTER_IDS: CharacterId[] = [
  "child", "witch", "sage",
  "shaman", "taoist", "dokkaebi",
  "god", "hunter", "runeshaman",
];

function pickCharacter(): CharacterId {
  return CHARACTER_IDS[Math.floor(Math.random() * CHARACTER_IDS.length)];
}

export function ShamanCall() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [charId, setCharId] = useState<CharacterId | null>(null);
  const [line, setLine] = useState<string>("");
  const tCall = useTranslations("chatShell.shamanCall");
  const tShell = useTranslations("chatShell");
  const tChar = useTranslations("characters");

  // 마운트 시 랜덤 캐릭터 + 라인 선택 — SSR 하이드레이션 불일치 회피를 위해 client-only.
  // 마운트 1회 초기화는 effect 내 setState 가 의도된 표준 패턴.
  useEffect(() => {
    const id = pickCharacter();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCharId(id);
    const lines = tCall.raw(id) as string[];
    const picked = lines[Math.floor(Math.random() * lines.length)] ?? "";
     
    setLine(picked);
  }, [tCall]);

  function handleCall() {
    if (!charId || isPending) return;
    startTransition(async () => {
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character: charId }),
      });
      const json = await res.json();
      if (json.ok) {
        router.push(`/chat/${json.data.sessionId}`);
      }
    });
  }

  if (!charId) return null;
  const character = CHARACTERS[charId];
  const name = tChar(`${charId}.name`);
  const title = tChar(`${charId}.title`);

  return (
    <button
      type="button"
      onClick={handleCall}
      disabled={isPending}
      className="app-surface group flex w-full items-center gap-3 rounded-2xl p-3 sm:p-4 text-left transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      aria-label={tShell("startChat", { name })}
    >
      {/* 캐릭터 미니 초상화 */}
      <div className="relative h-14 w-10 sm:h-16 sm:w-12 flex-shrink-0 overflow-hidden rounded-lg ring-1 ring-white/20 shadow-md">
        <CharacterImage
          character={character}
          fill
          sizes="48px"
          quality={85}
        />
      </div>
      {/* 텍스트 영역 */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5">
          <span className="font-mystic text-[15px] font-bold text-foreground">
            {name}
          </span>
          <span className="text-[15px] text-muted-foreground">
            · {title}
          </span>
        </div>
        <p className="text-[15px] text-foreground/85 leading-snug">
          {line}
        </p>
      </div>
      {/* 화살표 / 로딩 */}
      <div className="text-muted-foreground group-hover:text-foreground transition-colors">
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <span className="font-mystic text-base">→</span>
        )}
      </div>
    </button>
  );
}
