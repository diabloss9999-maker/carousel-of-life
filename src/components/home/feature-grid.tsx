import Link from "next/link";
import type { Route } from "next";
import { getTranslations } from "next-intl/server";
import {
  Sparkles,
  Sun,
  Heart,
  Coins,
  Briefcase,
  HeartPulse,
  GraduationCap,
  Layers,
  Hexagon,
  Flower2,
  Star,
  PawPrint,
  Compass,
  Hand,
  HeartHandshake,
  Users,
  Signature,
  Moon,
  Brain,
  MessageCircle,
  Library,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * 홈(오늘의 운세) 하단 — 모든 기능을 한눈에 보여주는 런처형 그리드.
 *
 * 메뉴 드롭다운에 숨어있던 14개+ 기능을 타일로 펼쳐 모바일 디스커버리를 높인다.
 * 라벨은 기존 nav.* i18n 키를 그대로 재사용한다.
 */
interface HomeTile {
  href: Route;
  /** next-intl `nav` 네임스페이스 키. */
  labelKey: string;
  icon: LucideIcon;
}

interface HomeSection {
  title: string;
  tiles: HomeTile[];
}

const SECTIONS: HomeSection[] = [
  {
    title: "운세",
    tiles: [
      { href: "/today?category=general" as Route, labelKey: "fortuneGeneral", icon: Sun },
      { href: "/today?category=love" as Route, labelKey: "fortuneLove", icon: Heart },
      { href: "/today?category=money" as Route, labelKey: "fortuneMoney", icon: Coins },
      { href: "/today?category=career" as Route, labelKey: "fortuneCareer", icon: Briefcase },
      { href: "/today?category=health" as Route, labelKey: "fortuneHealth", icon: HeartPulse },
      { href: "/today?category=study" as Route, labelKey: "fortuneStudy", icon: GraduationCap },
      { href: "/today?category=zodiac" as Route, labelKey: "zodiac", icon: Star },
      {
        href: "/today?category=chinese_zodiac" as Route,
        labelKey: "chineseZodiac",
        icon: PawPrint,
      },
    ],
  },
  {
    title: "카드 점술",
    tiles: [
      { href: "/tarot#tarot" as Route, labelKey: "tarot", icon: Sparkles },
      { href: "/tarot#lenormand" as Route, labelKey: "lenormand", icon: Layers },
      { href: "/tarot#runes" as Route, labelKey: "runes", icon: Hexagon },
      { href: "/flower-oracle" as Route, labelKey: "flowerOracle", icon: Flower2 },
    ],
  },
  {
    title: "사주 · 심층",
    tiles: [
      { href: "/saju" as Route, labelKey: "saju", icon: Compass },
      { href: "/palm" as Route, labelKey: "palm", icon: Hand },
      { href: "/compatibility" as Route, labelKey: "compatibility", icon: HeartHandshake },
      { href: "/name-compatibility" as Route, labelKey: "nameCompatibility", icon: Users },
      { href: "/name-reading" as Route, labelKey: "nameReading", icon: Signature },
      { href: "/dream" as Route, labelKey: "dream", icon: Moon },
      { href: "/personality" as Route, labelKey: "personality", icon: Brain },
    ],
  },
  {
    title: "대화 · 기록",
    tiles: [
      { href: "/chat" as Route, labelKey: "shaman", icon: MessageCircle },
      { href: "/collection" as Route, labelKey: "archive", icon: Library },
    ],
  },
];

export async function FeatureGrid() {
  const tNav = await getTranslations("nav");

  return (
    <section aria-label="모든 기능" className="space-y-5" data-fracture="home-features">
      <h2 className="font-mystic text-xl font-semibold tracking-tight flex items-center gap-2">
        <Sparkles className="h-5 w-5 opacity-70" aria-hidden />
        모든 기능
      </h2>

      {SECTIONS.map((section) => (
        <div key={section.title} className="space-y-2.5">
          <p className="text-[13px] font-semibold tracking-wide text-muted-foreground/80">
            {section.title}
          </p>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
            {section.tiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <Link
                  key={tile.href as string}
                  href={tile.href}
                  className={cn(
                    "app-surface flex min-h-[88px] flex-col items-center justify-center gap-2",
                    "rounded-2xl px-2 py-4 text-center",
                    "transition-transform duration-150 hover:ring-1 hover:ring-primary/30 active:scale-95",
                  )}
                >
                  <Icon className="h-6 w-6 opacity-80" aria-hidden />
                  <span className="text-[13px] font-medium leading-tight">
                    {tNav(tile.labelKey)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
