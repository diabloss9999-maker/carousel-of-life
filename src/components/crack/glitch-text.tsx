"use client";

/**
 * 글리치 텍스트 컴포넌트.
 * 흐림 수치가 높을수록 텍스트가 미세하게 깨진다.
 * 설명하지 않는다. 그냥 일어난다.
 */
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface GlitchTextProps {
  children: string;
  crackLevel: number;
  className?: string;
  /** 글리치가 일어날 확률 (0~1, 기본 0.3) */
  probability?: number;
}

/** 레벨별 대체 문자 집합 */
const GLITCH_CHARS: Record<number, string[]> = {
  2: ["_", "·", "—"],
  3: ["▓", "░", "▒", "×", "※"],
  4: ["█", "▇", "■", "▀", "▄", "?", "!"],
};

/** 텍스트의 일부를 글리치 문자로 치환 */
function glitchString(text: string, level: number): string {
  const chars = GLITCH_CHARS[Math.min(level, 4)] ?? GLITCH_CHARS[2];
  const arr = text.split("");
  const count = level >= 4 ? 3 : level >= 3 ? 2 : 1;

  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * arr.length);
    arr[idx] = chars[Math.floor(Math.random() * chars.length)];
  }
  return arr.join("");
}

export function GlitchText({
  children,
  crackLevel,
  className,
  probability = 0.3,
}: GlitchTextProps) {
  const [displayed, setDisplayed] = useState(children);
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    if (crackLevel < 2) return;

    // 랜덤 간격으로 글리치 발생
    const scheduleNext = () => {
      const delay = 3000 + Math.random() * 8000;
      return setTimeout(() => {
        if (Math.random() > probability) {
          scheduleNext();
          return;
        }

        setIsGlitching(true);
        setDisplayed(glitchString(children, crackLevel));

        // 짧게 깜빡이고 복원
        setTimeout(() => {
          setDisplayed(children);
          setTimeout(() => {
            setIsGlitching(false);
            scheduleNext();
          }, 80);
        }, 120);
      }, delay);
    };

    const timer = scheduleNext();
    return () => clearTimeout(timer);
  }, [children, crackLevel, probability]);

  return (
    <span
      className={cn(
        "transition-all duration-75",
        isGlitching && "opacity-70",
        className,
      )}
      style={isGlitching ? {
        textShadow: crackLevel >= 4
          ? "1px 0 #ff004466, -1px 0 #00ff8844"
          : "0.5px 0 #ff004433",
        letterSpacing: isGlitching ? "0.02em" : undefined,
      } : undefined}
    >
      {displayed}
    </span>
  );
}
