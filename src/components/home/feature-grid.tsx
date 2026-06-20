import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  Brain,
  Briefcase,
  CalendarDays,
  Coins,
  Compass,
  Disc3,
  Flower2,
  GraduationCap,
  Hand,
  Heart,
  HeartHandshake,
  HeartPulse,
  Library,
  MessageCircle,
  Moon,
  Sparkles,
  Star,
  Sun,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface HomeTile {
  badge?: string;
  description: string;
  emphasis?: boolean;
  href: Route;
  icon: LucideIcon;
  title: string;
}

interface HomeSection {
  description: string;
  eyebrow: string;
  tiles: HomeTile[];
  title: string;
}

const QUICK_TILES: HomeTile[] = [
  {
    href: "/today?category=general" as Route,
    title: "오늘 종합운",
    description: "하루의 흐름, 주의할 점, 행운 포인트를 먼저 확인해요.",
    icon: Sun,
    badge: "매일",
    emphasis: true,
  },
  {
    href: "/weekly" as Route,
    title: "주간 리포트",
    description: "이번 주 기록과 관심사를 한 번에 정리해요.",
    icon: TrendingUp,
    badge: "기록",
    emphasis: true,
  },
  {
    href: "/tarot#tarot" as Route,
    title: "타로 카드",
    description: "지금 마음에 걸리는 질문을 카드로 가볍게 확인해요.",
    icon: Sparkles,
    badge: "인기",
    emphasis: true,
  },
];

const SECTIONS: HomeSection[] = [
  {
    eyebrow: "Daily",
    title: "오늘 바로 보는 운세",
    description: "짧게 보고 바로 생활에 적용할 수 있는 운세예요.",
    tiles: [
      {
        href: "/today?category=love" as Route,
        title: "연애운",
        description: "마음의 방향과 관계 분위기",
        icon: Heart,
      },
      {
        href: "/today?category=money" as Route,
        title: "금전운",
        description: "소비, 기회, 조율할 지점",
        icon: Coins,
      },
      {
        href: "/today?category=career" as Route,
        title: "커리어운",
        description: "일의 흐름과 선택 포인트",
        icon: Briefcase,
      },
      {
        href: "/today?category=health" as Route,
        title: "건강운",
        description: "컨디션과 관리 신호",
        icon: HeartPulse,
      },
      {
        href: "/today?category=study" as Route,
        title: "공부운",
        description: "집중력을 쓰는 방식",
        icon: GraduationCap,
      },
      {
        href: "/today?category=zodiac" as Route,
        title: "별자리운",
        description: "별자리로 보는 하루 분위기",
        icon: Star,
      },
      {
        href: "/monthly" as Route,
        title: "월간운세",
        description: "이번 달 흐름과 주차별 방향",
        icon: CalendarDays,
      },
      {
        href: "/yearly" as Route,
        title: "2026 연간운세",
        description: "한 해의 흐름과 분기별 방향",
        icon: Sparkles,
      },
    ],
  },
  {
    eyebrow: "Deep Reading",
    title: "깊게 보는 리포트",
    description: "사주, 궁합, 이름처럼 오래 저장하고 다시 보기 좋은 콘텐츠예요.",
    tiles: [
      {
        href: "/saju" as Route,
        title: "내 사주 리포트",
        description: "타고난 기질과 흐름 정리",
        icon: Compass,
      },
      {
        href: "/compatibility" as Route,
        title: "두 사람 궁합",
        description: "나와 상대의 관계 흐름",
        icon: HeartHandshake,
      },
      {
        href: "/name-compatibility" as Route,
        title: "이름 궁합",
        description: "이름의 울림으로 보는 관계감",
        icon: Users,
      },
      {
        href: "/name-reading" as Route,
        title: "이름 풀이",
        description: "이름이 주는 인상과 결",
        icon: Brain,
      },
      {
        href: "/personality" as Route,
        title: "성격 분석",
        description: "MBTI와 성향을 현실적으로 정리",
        icon: Brain,
      },
      {
        href: "/palm" as Route,
        title: "손금 보기",
        description: "사진으로 보는 손바닥의 흐름",
        icon: Hand,
      },
      {
        href: "/dream" as Route,
        title: "꿈해몽",
        description: "꿈의 상징과 감정 해석",
        icon: Moon,
      },
    ],
  },
  {
    eyebrow: "Light Oracle",
    title: "가볍게 열어보는 점술",
    description: "부담 없이 보고 기록에 남기기 좋은 짧은 콘텐츠예요.",
    tiles: [
      {
        href: "/flower-oracle" as Route,
        title: "오늘의 꽃점",
        description: "꽃으로 보는 오늘의 힌트",
        icon: Flower2,
      },
      {
        href: "/today?category=chinese_zodiac" as Route,
        title: "띠운세",
        description: "띠로 보는 오늘의 조율점",
        icon: Star,
      },
    ],
  },
  {
    eyebrow: "Carousel Nine",
    title: "Carousel Nine 콘텐츠",
    description: "운세와 분리해서 즐기는 멤버 콘텐츠예요.",
    tiles: [
      {
        href: "/chat" as Route,
        title: "멤버 대화",
        description: "좋아하는 멤버와 자연스럽게 대화",
        icon: MessageCircle,
      },
      {
        href: "/group" as Route,
        title: "단체방",
        description: "여러 멤버가 함께 말하는 채팅",
        icon: Users,
      },
      {
        href: "/album" as Route,
        title: "앨범",
        description: "Carousel Nine 음악 감상",
        icon: Disc3,
      },
      {
        href: "/collection" as Route,
        title: "보너스",
        description: "내가 본 기록과 카드 모아보기",
        icon: Library,
      },
    ],
  },
];

export function FeatureGrid() {
  return (
    <div className="space-y-7">
      <section className="grid gap-3 sm:grid-cols-3" aria-label="추천 운세">
        {QUICK_TILES.map((tile) => (
          <FeatureTile key={tile.href as string} compact={false} tile={tile} />
        ))}
      </section>

      {SECTIONS.map((section) => (
        <section
          key={section.title}
          className="space-y-3"
          aria-labelledby={`${section.eyebrow}-heading`}
        >
          <div className="space-y-1">
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-primary/70">
              {section.eyebrow}
            </p>
            <h2
              id={`${section.eyebrow}-heading`}
              className="text-xl font-semibold tracking-tight"
            >
              {section.title}
            </h2>
            <p className="text-[15px] leading-6 text-muted-foreground">
              {section.description}
            </p>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {section.tiles.map((tile) => (
              <FeatureTile key={tile.href as string} compact tile={tile} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function FeatureTile({ compact, tile }: { compact: boolean; tile: HomeTile }) {
  const Icon = tile.icon;

  return (
    <Link
      href={tile.href}
      className={cn(
        "app-surface group flex min-h-[92px] items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left",
        "transition-transform duration-150 hover:-translate-y-0.5 hover:ring-1 hover:ring-primary/30 active:scale-[0.99]",
        tile.emphasis && "border-primary/30 bg-primary/10",
        !compact && "sm:min-h-[132px] sm:flex-col sm:items-start sm:justify-between",
      )}
    >
      <span
        className={cn(
          "flex min-w-0 gap-3",
          compact ? "items-center" : "items-start",
        )}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
          <Icon className="h-5 w-5 opacity-85" aria-hidden />
        </span>
        <span className="min-w-0 space-y-1">
          <span className="flex items-center gap-2">
            <span className="text-[15px] font-semibold leading-tight">
              {tile.title}
            </span>
            {tile.badge ? (
              <span className="rounded-full border border-primary/25 px-2 py-0.5 text-[11px] font-semibold text-primary">
                {tile.badge}
              </span>
            ) : null}
          </span>
          <span className="block text-[13px] leading-5 text-muted-foreground">
            {tile.description}
          </span>
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 opacity-50 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}
