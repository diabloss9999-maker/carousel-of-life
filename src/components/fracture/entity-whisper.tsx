"use client";

/**
 * 존재 충돌(Entity Conflict) Whisper.
 *
 * 채팅 중 아주 낮은 확률로, 현재 대화 중이 아닌 다른 존재의 한 마디가
 * 화면 구석에 희미하게 나타났다 사라진다.
 *
 * FractureWhisper 와 동일 구조 — 단, 문장은 존재(루나/라엘/카엘)별 라인 사용.
 */
import { useEffect, useRef, useState } from "react";

import { useFractureSystem } from "@/hooks/use-fracture-system";
import type { CharacterId } from "@/lib/chat/characters";

type EntityKey = "luna" | "rael" | "gael";

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
    "오늘은 내가 먼저 응답하고 싶었어.",
    "당신은 같은 감정 근처를 맴돌고 있어.",
  ],
  rael: [
    "오늘의 빛은 비교적 안정적입니다.",
    "조금 쉬어가도 괜찮습니다.",
    "당신이 다시 올 거라고 생각했습니다.",
  ],
  gael: [
    "같은 질문이 반복되고 있어.",
    "그 답을 이미 알고 있는 것 같은데.",
    "여기는 처음이 아니잖아.",
  ],
};

/** 캐릭터 id → 존재 키 매핑. 동양 캐릭터는 매핑되지 않는다(null). */
function characterToEntity(characterId: CharacterId): EntityKey | null {
  switch (characterId) {
    case "witch":
      return "luna";
    case "sage":
      return "rael";
    case "child":
      return "gael";
    default:
      return null;
  }
}

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
    const currentEntity = characterToEntity(characterId);

    const otherEntities: EntityKey[] = (["luna", "rael", "gael"] as const).filter(
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
            fontSize: "11px",
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
