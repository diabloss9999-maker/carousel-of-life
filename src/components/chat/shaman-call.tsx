"use client";

/**
 * 흐름 페이지에서 주술사가 먼저 말을 걸어오는 카드.
 * 클릭하면 해당 주술사와의 대화 세션을 생성/이어서 /chat/[id] 로 이동.
 */
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { CHARACTERS, type CharacterId } from "@/lib/chat/characters";
import { CharacterImage } from "@/components/shared/character-image";

/** 주술사별 "먼저 거는 한마디" 후보들. 성격 반영. */
const CALL_LINES: Record<CharacterId, readonly string[]> = {
  child: [
    "오늘 뭘 원해? 솔직히 말해봐.",
    "너 그 욕망 또 누르고 있어.",
    "그래서, 진심은 뭐야?",
  ],
  witch: [
    "오늘은 감정이 좀 무거워 보이는데.",
    "당신 이야기를 더 듣고 싶어.",
    "기억 속에 뭐가 떠올랐어요?",
  ],
  sage: [
    "오늘은 어떤 흐름이에요?",
    "잠깐 쉬어가도 돼요. 이야기해볼래요?",
    "당신의 빛이 닿았어요.",
  ],
  shaman: [
    "신령이 너를 부르고 있어. 와봐.",
    "오늘 너의 결이 보이는데, 들어볼래?",
    "방울이 울렸어. 그 의미를 알려줄게.",
  ],
  taoist: [
    "천기에 너의 이름이 떴다.",
    "운명의 갈림길이 보이는데, 같이 읽어볼까.",
    "별이 너를 지목했다.",
  ],
  dokkaebi: [
    "야. 뭐해.",
    "심심하니까 말 좀 걸어봐.",
    "재밌는 거 들고 와봐.",
  ],
  hunter: [
    "...너의 자국이 보였다. 따라가도 되겠나.",
    "바람이 너를 데려왔어. 조용히 따라와.",
    "피 냄새가 너에게서 난다. 무슨 일이지.",
  ],
  runeshaman: [
    "스물네 룬 중 하나가 깨어났어. 너를 부르는데.",
    "...그 단어가 뭐였더라. 어쨌든 너야.",
    "검은 균열 사이로 너의 이름이 새겨졌어.",
  ],
  god: [
    "호른의 메아리가 너에게 닿았다.",
    "폭풍이 잠시 멈췄다. 그 사이에 말해.",
    "한때 너처럼 살아 본 적이 있다. 들어줄게.",
  ],
};

const CHARACTER_IDS: CharacterId[] = [
  "child", "witch", "sage",
  "shaman", "taoist", "dokkaebi",
  "hunter", "runeshaman", "god",
];

function pickCharacter(): CharacterId {
  return CHARACTER_IDS[Math.floor(Math.random() * CHARACTER_IDS.length)];
}

function pickLine(id: CharacterId): string {
  const lines = CALL_LINES[id];
  return lines[Math.floor(Math.random() * lines.length)];
}

export function ShamanCall() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [charId, setCharId] = useState<CharacterId | null>(null);
  const [line, setLine] = useState<string>("");

  // 마운트 시 랜덤 캐릭터 + 라인 선택 — SSR 하이드레이션 불일치 회피를 위해 client-only.
  // 마운트 1회 초기화는 effect 내 setState 가 의도된 표준 패턴.
  useEffect(() => {
    const id = pickCharacter();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCharId(id);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLine(pickLine(id));
  }, []);

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

  return (
    <button
      type="button"
      onClick={handleCall}
      disabled={isPending}
      className="app-surface group flex w-full items-center gap-3 rounded-2xl p-3 sm:p-4 text-left transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      aria-label={`${character.name}와 대화 시작`}
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
          <span className="font-mystic text-sm font-bold text-foreground">
            {character.name}
          </span>
          <span className="text-[10px] text-muted-foreground">
            · {character.title}
          </span>
        </div>
        <p className="text-sm text-foreground/85 leading-snug">
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
