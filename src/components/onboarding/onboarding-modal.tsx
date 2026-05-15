"use client";

/**
 * 첫 방문 온보딩 모달.
 * localStorage "carousel_onboarded" 키로 1회만 표시한다.
 */
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronRight, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "carousel_onboarded_v1";

/** STEP 디자인 메타 — 텍스트는 i18n 에서 가져옴. */
/** 각 step 의 캐릭터 미리보기는 character id 만 보관하고 이름·훅은 i18n 에서 lookup. */
type CharId = "child" | "witch" | "sage" | "shaman" | "taoist" | "dokkaebi" | "god" | "hunter" | "runeshaman";

const STEPS_META = [
  {
    titleKey: "step1Title",
    subtitleKey: "step1Subtitle",
    descKey: "step1Desc",
    bg: "from-[#0d0818] via-[#1a1030] to-[#0a0512]",
    accent: "text-amber-300",
    characters: null,
  },
  {
    titleKey: "step2Title",
    subtitleKey: "step2Subtitle",
    descKey: "step2Desc",
    bg: "from-[#0d0818] via-[#1a0a30] to-[#0a0520]",
    accent: "text-violet-400",
    characters: [
      { id: "child" as CharId, img: "/characters/child_v2.png", color: "ring-red-800/50" },
      { id: "witch" as CharId, img: "/characters/witch_night_v2.png", color: "ring-blue-800/50" },
      { id: "sage" as CharId,  img: "/characters/sage_night_v2.png",  color: "ring-amber-700/50" },
    ],
  },
  {
    titleKey: "step3Title",
    subtitleKey: "step3Subtitle",
    descKey: "step3Desc",
    bg: "from-[#050d08] via-[#0a1a10] to-[#030a06]",
    accent: "text-emerald-400",
    characters: [
      { id: "shaman" as CharId,   img: "/characters/shaman_v1.png",   color: "ring-rose-800/50" },
      { id: "taoist" as CharId,   img: "/characters/taoist_v1.png",   color: "ring-cyan-800/50" },
      { id: "dokkaebi" as CharId, img: "/characters/dokkaebi_night_v2.png", color: "ring-purple-800/50" },
    ],
  },
  {
    titleKey: "step4Title",
    subtitleKey: "step4Subtitle",
    descKey: "step4Desc",
    bg: "from-[#050a18] via-[#0a1428] to-[#020612]",
    accent: "text-sky-300",
    characters: [
      { id: "god" as CharId,        img: "/characters/god_night.png",        color: "ring-sky-800/50" },
      { id: "hunter" as CharId,     img: "/characters/hunter_night.png",     color: "ring-stone-700/50" },
      { id: "runeshaman" as CharId, img: "/characters/runeshaman_night.png", color: "ring-indigo-800/50" },
    ],
  },
  {
    titleKey: "step5Title",
    subtitleKey: null,
    descKey: "step5Desc",
    bg: "from-[#0d0818] via-[#1a1030] to-[#0a0512]",
    accent: "text-amber-300",
    characters: null,
  },
] as const;

export function OnboardingModal() {
  const t = useTranslations("onboarding");
  const tCat = useTranslations("characterSelect");
  const tChar = useTranslations("characters");
  const tHooks = useTranslations("onboardingHooks");
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const done = localStorage.getItem(STORAGE_KEY);
    // 마운트 1회 client-only 초기화 (localStorage 조회 후 가시성 결정) — 의도된 패턴
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!done) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function next() {
    if (step < STEPS_META.length - 1) {
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

  const current = STEPS_META[step];
  // i18n 텍스트 lookup
  const title = t(current.titleKey);
  const subtitle = current.subtitleKey ? t(current.subtitleKey) : null;
  const desc = t(current.descKey);
  // step 2~4 만 카테고리 라벨 존재
  const worldLabel =
    step === 1 ? tCat("categoryOtherworld")
    : step === 2 ? tCat("categoryEastern")
    : step === 3 ? tCat("categoryNordic")
    : null;

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
          aria-label={t("skip")}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center gap-6 px-8 py-10 text-center">
          {/* 세계 라벨 — step 2~4 */}
          {worldLabel && subtitle && (
            <span className={cn(
              "rounded-full border px-4 py-1 text-xs font-bold tracking-widest uppercase",
              step === 1
                ? "border-violet-500/40 text-violet-400"
                : step === 2
                  ? "border-emerald-500/40 text-emerald-400"
                  : "border-sky-500/40 text-sky-300",
            )}>
              {worldLabel} — {subtitle}
            </span>
          )}

          {/* 제목 */}
          <div className="space-y-1">
            {subtitle && !worldLabel && (
              <p className="text-xs tracking-widest text-white/40 uppercase">{subtitle}</p>
            )}
            <h2 className={cn(
              "font-mystic text-3xl font-bold leading-tight whitespace-pre-line",
              current.accent,
            )}>
              {title}
            </h2>
          </div>

          {/* 캐릭터 미리보기 (이세계/동양/북유럽 스텝) */}
          {current.characters && (
            <div className="flex justify-center gap-3 w-full">
              {current.characters.map((c) => {
                const name = tChar(`${c.id}.name`);
                const hook = tHooks(c.id);
                return (
                  <div key={c.id} className="flex flex-col items-center gap-2 flex-1">
                    <div className={cn(
                      "relative w-full aspect-[2/3] overflow-hidden rounded-xl ring-1 shadow-lg",
                      c.color,
                    )}>
                      <Image
                        src={c.img}
                        alt={name}
                        fill
                        className="object-cover object-top"
                        sizes="120px"
                        quality={80}
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 py-2">
                        <p className="font-mystic text-xs font-bold text-white">{name}</p>
                      </div>
                    </div>
                    <p className="text-xs text-white/50 leading-tight">{hook}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* 설명 */}
          <p className="text-sm text-white/65 leading-relaxed whitespace-pre-line">
            {desc}
          </p>

          {/* 진행 표시 */}
          <div className="flex gap-1.5">
            {STEPS_META.map((_, i) => (
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
            {step < STEPS_META.length - 1 ? (
              <>
                {t("next")}
                <ChevronRight className="h-4 w-4" />
              </>
            ) : (
              t("start")
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
