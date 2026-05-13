"use client";

/**
 * 채팅 진입 시 무작위 주술사 환영 인사.
 * 세션당 1회 (sessionStorage).
 */
import Image from "next/image";
import { useEffect, useState } from "react";
import { CHARACTERS, type CharacterId } from "@/lib/chat/characters";
import { useCharacterImage } from "@/hooks/use-character-image";

const SESSION_KEY = "welcome_greeting_shown";

/** 캐릭터별 환영 인사 (성격 반영). */
const GREETINGS: Record<CharacterId, string[]> = {
  child:    ["또 왔구나. 욕망을 말해.", "솔직해질 준비는 됐어?", "오늘은 무엇을 원해?"],
  witch:    ["당신이 올 거라고 생각했어.", "오늘의 흐름이 당신을 데려왔네.", "기다리고 있었어."],
  sage:     ["다시 오셨네요. 오늘은 어떤 흐름인가요?", "당신의 빛이 닿았어요.", "여기 있어요. 천천히 와요."],
  shaman:   ["신령이 당신 이름을 부르고 있어.", "오늘은 네 발걸음이 보였어.", "경계가 너를 알아봤다."],
  taoist:   ["별이 당신을 안내했군.", "오늘 운명의 결이 너에게 닿았다.", "왔구나. 천기가 흐르고 있어."],
  dokkaebi: ["왔어? 뭔데.", "또 너야. 됐고, 말해.", "재미있는 거 들고 왔어?"],
};

function pickGreeting(id: CharacterId): string {
  const lines = GREETINGS[id];
  return lines[Math.floor(Math.random() * lines.length)];
}

function pickRandomCharacter(): CharacterId {
  const ids: CharacterId[] = ["child", "witch", "sage", "shaman", "taoist", "dokkaebi"];
  return ids[Math.floor(Math.random() * ids.length)];
}

export function WelcomeGreeting() {
  const [charId, setCharId] = useState<CharacterId | null>(null);
  const [line, setLine] = useState<string>("");
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.sessionStorage.getItem(SESSION_KEY)) return;
    } catch { return; }

    const pickedId = pickRandomCharacter();
    // 마운트 1회 client-only 초기화 — SSR 하이드레이션 불일치 회피를 위한 의도된 패턴.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCharId(pickedId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLine(pickGreeting(pickedId));
    try { window.sessionStorage.setItem(SESSION_KEY, "1"); } catch {}

    const t1 = setTimeout(() => setFadingOut(true), 4500);
    const t2 = setTimeout(() => setCharId(null), 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!charId) return null;
  return <GreetingCard charId={charId} line={line} fadingOut={fadingOut} />;
}

function GreetingCard({
  charId,
  line,
  fadingOut,
}: {
  charId: CharacterId;
  line: string;
  fadingOut: boolean;
}) {
  const character = CHARACTERS[charId];
  const imageSrc = useCharacterImage(character);

  return (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        top: "calc(72px + env(safe-area-inset-top, 0px))",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 40,
        pointerEvents: "none",
        opacity: fadingOut ? 0 : 1,
        transition: "opacity 1.5s ease-out",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "10px 16px 10px 12px",
        borderRadius: "999px",
        background: "rgba(255,255,255,0.10)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.22)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
        maxWidth: "min(90vw, 480px)",
        animation: "session-fade-in 0.9s ease-out forwards",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "42px",
          height: "42px",
          flexShrink: 0,
          borderRadius: "999px",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.26)",
        }}
      >
        <Image src={imageSrc} alt={character.name} fill sizes="42px" style={{ objectFit: "cover", objectPosition: "top" }} aria-hidden />
      </div>
      <div style={{ minWidth: 0, lineHeight: 1.4 }}>
        <p
          style={{
            margin: 0,
            fontSize: "11px",
            letterSpacing: "0.16em",
            color: "var(--ritual-muted, rgba(255,255,255,0.62))",
            fontFamily: "var(--font-serif)",
          }}
        >
          {character.name} · {character.title}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "13.5px",
            color: "var(--foreground)",
            fontFamily: "var(--font-serif)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {line}
        </p>
      </div>
    </div>
  );
}
