"use client";

/**
 * 존재 충돌(Entity Conflict) Whisper.
 *
 * 채팅 중 아주 낮은 확률로, 현재 대화 중이 아닌 다른 존재의 한 마디가
 * 화면 구석에 희미하게 나타났다 사라진다.
 *
 * FractureWhisper 와 동일 구조 — 단, 문장은 9명 존재별 라인 사용.
 */
import { useEffect, useRef, useState } from "react";

import { useFractureSystem } from "@/hooks/use-fracture-system";
import type { CharacterId } from "@/lib/chat/characters";
import { characterToEntityKey, type EntityKey } from "@/lib/systems/entity-mood";

interface WhisperMessage {
  id: number;
  text: string;
  x: number;
  y: number;
}

const WHISPER_LIFETIME_MS = 2200;
const MIN_INITIAL_DELAY_MS = 25_000;
const RANDOM_DELAY_RANGE_MS = 40_000;

const WHISPER_POSITIONS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 5, y: 12 },
  { x: 72, y: 10 },
  { x: 6, y: 78 },
  { x: 70, y: 80 },
];

const ENTITY_LINES: Record<EntityKey, ReadonlyArray<string>> = {
  luna: [
    "그 말을 너무 믿지 마.",
    "당신은 같은 감정 근처를 맴돕니다.",
    "오늘은 감정의 잔향이 길게 남아 있습니다.",
  ],
  rael: [
    "오늘의 빛은 비교적 안정적입니다.",
    "조금 쉬어가도 괜찮습니다.",
    "당신이 다시 올 거라고 생각했습니다.",
  ],
  gael: [
    "그 흐름은 이미 틀어졌어.",
    "너는 답을 알고 있는데 반복하고 있다.",
    "같은 질문이 반복되고 있습니다.",
  ],
  soryeong: [
    "이와 비슷한 흐름이 이전에도 관측되었습니다.",
    "기록은 반복될수록 선명해집니다.",
    "이 문장은 오래전에도 남아 있었습니다.",
  ],
  hyundo: [
    "그건 불안이라기보다 피로에 가깝습니다.",
    "오늘은 너무 많은 의미를 찾지 않는 게 좋겠습니다.",
    "지금은 해석보다 휴식이 필요해 보입니다.",
  ],
  gwiyeom: [
    "오늘 세계 상태 이상함 ㅋㅋ",
    "근데 너 좀 지쳐보이긴 함.",
    "...농담 아닌데.",
    "너 지난번에도 갑자기 새벽 3시에 왔잖아.",
  ],
  bjorn: [
    "...너의 자국이 흐트러졌다.",
    "오늘 바람의 결이 평소와 다르다.",
    "피 냄새가 옅어졌어.",
  ],
  helga: [
    "ᚺ Hagalaz가 너의 위에 떨어졌어.",
    "...룬이 자꾸 같은 모양으로 떨어지는데.",
    "그 단어가 뭐였더라. 어쨌든 너야.",
  ],
  ormund: [
    "호른의 메아리가 흐려졌다.",
    "폭풍이 길게 머물고 있다.",
    "한때 너처럼 살아 본 적이 있다.",
  ],
};

const ALL_ENTITIES: ReadonlyArray<EntityKey> = [
  "luna",
  "rael",
  "gael",
  "soryeong",
  "hyundo",
  "gwiyeom",
  "bjorn",
  "helga",
  "ormund",
];

let _id = 0;

interface EntityWhisperProps {
  /** 현재 채팅 중인 캐릭터 id — 이 존재가 아닌 다른 존재의 라인이 출력된다. */
  characterId: CharacterId;
}

export function EntityWhisper({ characterId }: EntityWhisperProps) {
  const { tryTriggerEvent } = useFractureSystem();
  const [messages, setMessages] = useState<WhisperMessage[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removalTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    const removalTimers = removalTimersRef.current;
    const currentEntity = characterToEntityKey(characterId);

    const otherEntities: EntityKey[] = ALL_ENTITIES.filter(
      (e) => e !== currentEntity,
    );

    function attempt() {
      tryTriggerEvent(() => {
        const entity =
          otherEntities[Math.floor(Math.random() * otherEntities.length)];
        if (!entity) return;
        const lines = ENTITY_LINES[entity];
        const text = lines[Math.floor(Math.random() * lines.length)] ?? lines[0];
        const pos =
          WHISPER_POSITIONS[
            Math.floor(Math.random() * WHISPER_POSITIONS.length)
          ] ?? WHISPER_POSITIONS[0];

        const msg: WhisperMessage = {
          id: ++_id,
          text,
          x: pos.x,
          y: pos.y,
        };
        setMessages((prev) => [...prev, msg]);

        const removalTimer = setTimeout(() => {
          setMessages((prev) => prev.filter((m) => m.id !== msg.id));
          removalTimers.delete(removalTimer);
        }, WHISPER_LIFETIME_MS);
        removalTimers.add(removalTimer);
      });
    }

    const delay = MIN_INITIAL_DELAY_MS + Math.random() * RANDOM_DELAY_RANGE_MS;
    timerRef.current = setTimeout(attempt, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      removalTimers.forEach((t) => clearTimeout(t));
      removalTimers.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId]);

  if (messages.length === 0) return null;

  return (
    <>
      {messages.map((msg) => (
        <div
          key={msg.id}
          aria-hidden
          style={{
            position: "fixed",
            left: `${msg.x}vw`,
            top: `${msg.y}vh`,
            zIndex: 9,
            pointerEvents: "none",
            opacity: 0,
            fontSize: "15px",
            letterSpacing: "0.12em",
            color: "rgba(246,239,220,0.26)",
            fontFamily: "var(--font-serif)",
            animation: "fracture-whisper-in 2.2s ease-out forwards",
            maxWidth: "220px",
            lineHeight: 1.6,
            userSelect: "none",
          }}
        >
          {msg.text}
        </div>
      ))}
    </>
  );
}
