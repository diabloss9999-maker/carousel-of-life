"use client";

/**
 * 헤더 — Ritual 다크 글래스 스타일.
 * 낮/밤 배경은 body에 TimeAwareBg가 처리하므로 헤더는 다크 글래스만 적용.
 */
import { useEffect, useState } from "react";

function getKstHour(): number {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  ).getHours();
}

function isNightTime(hour: number): boolean {
  return hour >= 21 || hour < 6;
}

interface TimeAwareHeaderProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function TimeAwareHeader({ children, className, style }: TimeAwareHeaderProps) {
  return (
    <header
      className={className}
      style={{
        background: "linear-gradient(180deg, rgba(8,7,16,0.90), rgba(8,7,16,0.72))",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(233,221,190,0.11)",
        boxShadow: "0 14px 40px rgba(0,0,0,0.28)",
        ...style,
      }}
    >
      {children}
    </header>
  );
}

/**
 * 헤더 배경 src 훅 — 레거시 호환용, 현재 미사용.
 */
export function useHeaderBg(): string {
  const [src, setSrc] = useState("/header-bg.png");
  useEffect(() => {
    const update = () => {
      const h = getKstHour();
      setSrc(isNightTime(h) ? "/header-bg-night.png" : "/header-bg.png");
    };
    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, []);
  return src;
}
