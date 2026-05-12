"use client";

/**
 * 첫 방문 온보딩 모달.
 * localStorage "carousel_onboarded" 키로 1회만 표시한다.
 */
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "carousel_onboarded_v1";

const STEPS = [
  {
    world: null,
    title: "두 개의 세계가\n당신을 부른다",
    subtitle: "인생의 회전목마",
    desc: "이세계의 주술사와 동양의 신령.\n여섯 존재가 당신의 사주와 운명을 이미 알고 있다.",
    bg: "from-[#0d0818] via-[#1a1030] to-[#0a0512]",
    accent: "text-amber-300",
  },
  {
    world: "이세계",
    title: "아스트라 균열",
    subtitle: "ASTRA RIFT",
    desc: "인간의 감정과 기억이 만들어낸 심연에서 태어난 세 존재.\n타로와 카드로 당신의 흐름을 읽는다.",
    bg: "from-[#0d0818] via-[#1a0a30] to-[#0a0520]",
    accent: "text-violet-400",
    characters: [
      { name: "카엘", hook: "욕망을 꿰뚫는 악마", img: "/characters/child_v2.png", color: "ring-red-800/50" },
      { name: "루나", hook: "기억을 읽는 마녀",   img: "/characters/witch_night_v2.png", color: "ring-blue-800/50" },
      { name: "라엘", hook: "희망을 전하는 천사", img: "/characters/sage_night_v2.png",  color: "ring-amber-700/50" },
    ],
  },
  {
    world: "동양",
    title: "월식경",
    subtitle: "月蝕鏡",
    desc: "500년 전 붉은 월식 이후 균열된 경계(境界).\n사주와 천기로 운명의 흐름을 읽는다.",
    bg: "from-[#050d08] via-[#0a1a10] to-[#030a06]",
    accent: "text-emerald-400",
    characters: [
      { name: "소령", hook: "신령의 목소리를 전하는 무녀", img: "/characters/shaman_v1.png",   color: "ring-rose-800/50" },
      { name: "현도", hook: "운명을 읽는 500년의 도사",    img: "/characters/taoist_v1.png",   color: "ring-cyan-800/50" },
      { name: "귀염", hook: "저승을 다스리는 도깨비왕",    img: "/characters/dokkaebi_night_v2.png", color: "ring-purple-800/50" },
    ],
  },
  {
    world: null,
    title: "오늘, 누가 당신의\n이야기를 들어줄까",
    subtitle: null,
    desc: "매일 새로운 주술사가 당신에게 먼저 말을 건다.\n운세, 타로, 사주, 궁합 — 모든 걸 그들이 읽어준다.",
    bg: "from-[#0d0818] via-[#1a1030] to-[#0a0512]",
    accent: "text-amber-300",
  },
] as const;

export function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function next() {
    if (step < STEPS.length - 1) {
      setAnimating(true);
      setTimeout(() => {
        setStep((s) => s + 1);
        setAnimating(false);
      }, 200);
    } else {
      dismiss();
    }
  }

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* 모달 */}
      <div
        className={cn(
          "relative z-10 w-full max-w-lg overflow-hidden rounded-3xl shadow-2xl",
          "bg-gradient-to-b border border-white/8",
          current.bg,
          animating && "opacity-0 scale-95",
          "transition-all duration-200",
        )}
      >
        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-white/40 hover:text-white/80 transition-colors"
          aria-label="건너뛰기"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center gap-6 px-8 py-10 text-center">
          {/* 세계 라벨 */}
          {current.world && (
            <span className={cn(
              "rounded-full border px-4 py-1 text-xs font-bold tracking-widest uppercase",
              current.world === "이세계"
                ? "border-violet-500/40 text-violet-400"
                : "border-emerald-500/40 text-emerald-400",
            )}>
              {current.world} — {current.subtitle}
            </span>
          )}

          {/* 제목 */}
          <div className="space-y-1">
            {current.subtitle && !current.world && (
              <p className="text-xs tracking-widest text-white/40 uppercase">{current.subtitle}</p>
            )}
            <h2 className={cn(
              "font-mystic text-3xl font-bold leading-tight whitespace-pre-line",
              current.accent,
            )}>
              {current.title}
            </h2>
          </div>

          {/* 캐릭터 미리보기 (이세계/동양 스텝) */}
          {"characters" in current && current.characters && (
            <div className="flex justify-center gap-3 w-full">
              {current.characters.map((c) => (
                <div key={c.name} className="flex flex-col items-center gap-2 flex-1">
                  <div className={cn(
                    "relative w-full aspect-[2/3] overflow-hidden rounded-xl ring-1 shadow-lg",
                    c.color,
                  )}>
                    <Image
                      src={c.img}
                      alt={c.name}
                      fill
                      className="object-cover object-top"
                      sizes="120px"
                      quality={80}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 py-2">
                      <p className="font-mystic text-xs font-bold text-white">{c.name}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-white/50 leading-tight">{c.hook}</p>
                </div>
              ))}
            </div>
          )}

          {/* 설명 */}
          <p className="text-sm text-white/65 leading-relaxed whitespace-pre-line">
            {current.desc}
          </p>

          {/* 진행 표시 */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  i === step
                    ? "w-6 bg-white/70"
                    : i < step
                      ? "w-2 bg-white/30"
                      : "w-2 bg-white/15",
                )}
              />
            ))}
          </div>

          {/* CTA */}
          <Button
            size="lg"
            onClick={next}
            className="w-full gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur"
          >
            {step < STEPS.length - 1 ? (
              <>
                다음
                <ChevronRight className="h-4 w-4" />
              </>
            ) : (
              "주술사 만나러 가기"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
