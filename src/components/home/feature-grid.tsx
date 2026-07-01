import Link from "next/link";
import type { Route } from "next";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

type IconId =
  | "album"
  | "career"
  | "chat"
  | "collection"
  | "compatibility"
  | "daily"
  | "dream"
  | "flower"
  | "group"
  | "health"
  | "love"
  | "money"
  | "monthly"
  | "name"
  | "nameCompat"
  | "palm"
  | "psychology"
  | "saju"
  | "study"
  | "tarot"
  | "weekly"
  | "yearly"
  | "zodiac"
  | "zodiacAnimal";

interface HomeTile {
  badge?: string;
  description: string;
  emphasis?: boolean;
  href: Route;
  iconId: IconId;
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
    iconId: "daily",
    badge: "매일",
    emphasis: true,
  },
  {
    href: "/weekly" as Route,
    title: "주간 리포트",
    description: "이번 주 기록과 관심사를 한 번에 정리해요.",
    iconId: "weekly",
    badge: "기록",
    emphasis: true,
  },
  {
    href: "/tarot#tarot" as Route,
    title: "타로 카드",
    description: "지금 마음에 걸리는 질문을 카드로 가볍게 확인해요.",
    iconId: "tarot",
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
        iconId: "love",
      },
      {
        href: "/today?category=money" as Route,
        title: "금전운",
        description: "소비, 기회, 조율할 지점",
        iconId: "money",
      },
      {
        href: "/today?category=career" as Route,
        title: "커리어운",
        description: "일의 흐름과 선택 포인트",
        iconId: "career",
      },
      {
        href: "/today?category=health" as Route,
        title: "건강운",
        description: "컨디션과 관리 신호",
        iconId: "health",
      },
      {
        href: "/today?category=study" as Route,
        title: "공부운",
        description: "집중력을 쓰는 방식",
        iconId: "study",
      },
      {
        href: "/today?category=zodiac" as Route,
        title: "별자리운",
        description: "별자리로 보는 하루 분위기",
        iconId: "zodiac",
      },
      {
        href: "/monthly" as Route,
        title: "월간운세",
        description: "이번 달 흐름과 주차별 방향",
        iconId: "monthly",
      },
      {
        href: "/yearly" as Route,
        title: "2026 연간운세",
        description: "한 해의 흐름과 분기별 방향",
        iconId: "yearly",
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
        iconId: "saju",
      },
      {
        href: "/compatibility" as Route,
        title: "두 사람 궁합",
        description: "나와 상대의 관계 흐름",
        iconId: "compatibility",
      },
      {
        href: "/name-compatibility" as Route,
        title: "이름 궁합",
        description: "이름의 울림으로 보는 관계감",
        iconId: "nameCompat",
      },
      {
        href: "/name-reading" as Route,
        title: "이름 풀이",
        description: "이름이 주는 인상과 결",
        iconId: "psychology",
      },
      {
        href: "/personality" as Route,
        title: "심리테스트",
        description: "관계와 마음 패턴을 가볍게 확인",
        iconId: "name",
      },
      {
        href: "/palm" as Route,
        title: "손금 보기",
        description: "사진으로 보는 손바닥의 흐름",
        iconId: "palm",
      },
      {
        href: "/dream" as Route,
        title: "꿈해몽",
        description: "꿈의 상징과 감정 해석",
        iconId: "dream",
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
        iconId: "flower",
      },
      {
        href: "/today?category=chinese_zodiac" as Route,
        title: "띠운세",
        description: "띠로 보는 오늘의 조율점",
        iconId: "zodiacAnimal",
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
        iconId: "chat",
      },
      {
        href: "/group" as Route,
        title: "단체방",
        description: "여러 멤버가 함께 말하는 채팅",
        iconId: "group",
      },
      {
        href: "/album" as Route,
        title: "앨범",
        description: "Carousel Nine 음악 감상",
        iconId: "album",
      },
      {
        href: "/collection" as Route,
        title: "보너스",
        description: "내가 본 기록과 카드 모아보기",
        iconId: "collection",
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
  return (
    <Link
      href={tile.href}
      className={cn(
        "app-surface group flex min-h-[88px] items-center justify-between gap-3 rounded-[20px] border px-4 py-3 text-left",
        "transition duration-150 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-white/85 active:scale-[0.99]",
        tile.emphasis && "border-primary/25 bg-primary/[0.07]",
        !compact && "sm:min-h-[132px] sm:flex-col sm:items-start sm:justify-between",
      )}
    >
      <span
        className={cn(
          "flex min-w-0 gap-3",
          compact ? "items-center" : "items-start",
        )}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-[#faf6ed] ring-1 ring-[#eadfc9] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <ModernSectionIcon id={tile.iconId} />
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

function ModernSectionIcon({ id }: { id: IconId }) {
  const tone = ICON_TONES[id];

  return (
    <svg
      viewBox="0 0 32 32"
      className="h-[22px] w-[22px]"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={`icon-${id}`} x1="4" y1="4" x2="28" y2="28">
          <stop stopColor={tone.a} />
          <stop offset="1" stopColor={tone.b} />
        </linearGradient>
      </defs>
      <IconShape id={id} gradientId={`icon-${id}`} />
    </svg>
  );
}

const ICON_TONES: Record<IconId, { a: string; b: string }> = {
  album: { a: "#8b7a6a", b: "#27221e" },
  career: { a: "#8a7f70", b: "#2f2b25" },
  chat: { a: "#9b8d7b", b: "#332c24" },
  collection: { a: "#a78956", b: "#3d2f19" },
  compatibility: { a: "#c37a7a", b: "#6f4d74" },
  daily: { a: "#caa45a", b: "#80622f" },
  dream: { a: "#8f8cb7", b: "#4e597d" },
  flower: { a: "#c78c9f", b: "#7b8e66" },
  group: { a: "#8f8175", b: "#36312c" },
  health: { a: "#8bad8c", b: "#43684f" },
  love: { a: "#d28a96", b: "#8c5362" },
  money: { a: "#b99a55", b: "#637243" },
  monthly: { a: "#9da7b6", b: "#5d6474" },
  name: { a: "#b99a55", b: "#6f5a35" },
  nameCompat: { a: "#b68d6e", b: "#715c81" },
  palm: { a: "#b99773", b: "#6a5845" },
  psychology: { a: "#a78bbd", b: "#6d759d" },
  saju: { a: "#c0a35f", b: "#4f5b47" },
  study: { a: "#9a9f79", b: "#4f604f" },
  tarot: { a: "#d0ad62", b: "#8f6b30" },
  weekly: { a: "#9cae87", b: "#4f695b" },
  yearly: { a: "#b99a55", b: "#6f5f92" },
  zodiac: { a: "#b59cce", b: "#655a86" },
  zodiacAnimal: { a: "#c5a15f", b: "#73614a" },
};

function IconShape({ gradientId, id }: { gradientId: string; id: IconId }) {
  const stroke = `url(#${gradientId})`;
  const common = {
    stroke,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2.2,
  };

  switch (id) {
    case "daily":
      return (
        <>
          <circle cx="16" cy="16" r="5.2" {...common} />
          <path d="M16 4.5v3M16 24.5v3M4.5 16h3M24.5 16h3M7.9 7.9l2.1 2.1M22 22l2.1 2.1M24.1 7.9 22 10M10 22l-2.1 2.1" {...common} />
        </>
      );
    case "weekly":
      return <path d="M6 21.5 12.2 15l4.4 3.8L26 8.8M22 8.8h4v4" {...common} />;
    case "tarot":
    case "yearly":
      return (
        <>
          <path d="M16 5.5c1.6 6 3.1 7.5 9 9-5.9 1.5-7.4 3-9 9-1.6-6-3.1-7.5-9-9 5.9-1.5 7.4-3 9-9Z" fill={stroke} />
          <circle cx="24" cy="7.5" r="1.7" fill={stroke} />
        </>
      );
    case "love":
      return <path d="M16 25s-8.5-4.9-8.5-11.1c0-3 2-5 4.6-5 1.7 0 3.1.9 3.9 2.2.8-1.3 2.2-2.2 3.9-2.2 2.6 0 4.6 2 4.6 5C24.5 20.1 16 25 16 25Z" {...common} />;
    case "money":
      return (
        <>
          <circle cx="12" cy="17.5" r="4.6" {...common} />
          <circle cx="20.5" cy="12.5" r="4.6" {...common} />
          <path d="M12 14.6v5.8M9.7 17.5h4.6M20.5 9.6v5.8M18.2 12.5h4.6" {...common} />
        </>
      );
    case "career":
      return (
        <>
          <rect x="7" y="11" width="18" height="13" rx="2.5" {...common} />
          <path d="M12.5 11V8.8c0-1 .8-1.8 1.8-1.8h3.4c1 0 1.8.8 1.8 1.8V11M7 15.5h18" {...common} />
        </>
      );
    case "health":
      return <path d="M7.5 16.5h4l2-5.5 4 10 2.2-4.5h4.8M16 25s-8-4.5-8-11c0-3 2-5.2 4.7-5.2 1.4 0 2.5.6 3.3 1.7.8-1.1 1.9-1.7 3.3-1.7 2.7 0 4.7 2.2 4.7 5.2 0 6.5-8 11-8 11Z" {...common} />;
    case "study":
      return <path d="M6 12.5 16 7l10 5.5-10 5.5L6 12.5ZM10 15v5.3c1.7 1.3 3.7 2 6 2s4.3-.7 6-2V15" {...common} />;
    case "zodiac":
      return (
        <>
          <path d="M16 7.5 18.5 13l6 .7-4.4 4 1.2 5.8L16 20.5l-5.3 3 1.2-5.8-4.4-4 6-.7L16 7.5Z" {...common} />
          <path d="M7 7.5h.1M25 8.5h.1M24 24h.1" {...common} />
        </>
      );
    case "monthly":
      return (
        <>
          <rect x="7.5" y="8.5" width="17" height="16" rx="3" {...common} />
          <path d="M11 6.5v4M21 6.5v4M7.5 13h17M12 17h.1M16 17h.1M20 17h.1M12 21h.1M16 21h.1" {...common} />
        </>
      );
    case "saju":
      return (
        <>
          <circle cx="16" cy="16" r="9" {...common} />
          <path d="M16 7v18M7 16h18M10 10c4 3.2 8 3.2 12 0M10 22c4-3.2 8-3.2 12 0" {...common} />
        </>
      );
    case "compatibility":
    case "nameCompat":
      return (
        <>
          <circle cx="12.5" cy="15.5" r="5" {...common} />
          <circle cx="19.5" cy="15.5" r="5" {...common} />
          <path d="M15.5 11.5c1.2 1 1.9 2.3 1.9 4s-.7 3-1.9 4" {...common} />
        </>
      );
    case "name":
      return (
        <>
          <path d="M8 23.5 13.2 8h5.6L24 23.5M10.2 18h11.6" {...common} />
          <path d="M7 7.5h18" {...common} />
        </>
      );
    case "psychology":
      return (
        <>
          <path d="M11 23v-3.2c-2.2-1.5-3.5-3.8-3.5-6.4 0-4.2 3.5-7.4 8.5-7.4s8.5 3.2 8.5 7.4c0 2.6-1.3 4.9-3.5 6.4V23" {...common} />
          <path d="M12 13.5c1.7-1.6 3.3-1.6 5 0s3.3 1.6 5 0M13 18h6" {...common} />
        </>
      );
    case "palm":
      return <path d="M10 23V12.5c0-1 .8-1.8 1.8-1.8S13.6 11.5 13.6 12.5V18M13.6 15V9.8c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8V18M17.2 15V10.8c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8V18M20.8 15.5v-2.7c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v5.4c0 4.2-3 7.3-7.3 7.3h-1.2c-3.5 0-6.1-1.9-7.3-5.1L7 16.2c-.3-.9.1-1.9 1-2.2.9-.3 1.8.1 2.2 1l1.4 3" {...common} />;
    case "dream":
      return <path d="M22.5 20.5A8.5 8.5 0 1 1 13.2 7a7.4 7.4 0 0 0 9.3 13.5Z" {...common} />;
    case "flower":
      return (
        <>
          <path d="M16 16c-3.5-2.4-4.6-5.4-2.6-7.4 1.1-1.1 2.7-.9 2.6 2.3-.1-3.2 1.5-3.4 2.6-2.3 2 2 .9 5-2.6 7.4Z" {...common} />
          <path d="M16 16c-4.2.3-6.9-1.3-6.9-4.1 0-1.6 1.3-2.5 3.5-.2-2.2-2.3-1.3-3.6.3-3.6 2.8 0 4.4 2.7 3.1 7.9ZM16 16c4.2.3 6.9-1.3 6.9-4.1 0-1.6-1.3-2.5-3.5-.2 2.2-2.3 1.3-3.6-.3-3.6-2.8 0-4.4 2.7-3.1 7.9ZM16 16v9" {...common} />
        </>
      );
    case "zodiacAnimal":
      return (
        <>
          <path d="M9 21c2.2-7.5 11.8-7.5 14 0M10.8 12.5 8.5 8.5M21.2 12.5l2.3-4M12 15h.1M20 15h.1M14 20c1.3.8 2.7.8 4 0" {...common} />
          <path d="M16 9.5c4.6 0 8.2 3.2 8.2 7.8 0 5-3.4 8.2-8.2 8.2s-8.2-3.2-8.2-8.2c0-4.6 3.6-7.8 8.2-7.8Z" {...common} />
        </>
      );
    case "chat":
      return <path d="M8 10.5c0-2 1.6-3.5 3.6-3.5h8.8c2 0 3.6 1.5 3.6 3.5v5.2c0 2-1.6 3.5-3.6 3.5H15l-5.3 4.3v-4.3C8.7 19.1 8 17.8 8 16.2v-5.7Z" {...common} />;
    case "group":
      return (
        <>
          <circle cx="12" cy="12" r="3.2" {...common} />
          <circle cx="21" cy="13" r="2.8" {...common} />
          <path d="M6.5 24c.7-3.4 2.8-5.2 5.5-5.2s4.8 1.8 5.5 5.2M17.5 22.5c.8-2.3 2.4-3.5 4.4-3.5 1.8 0 3.2 1 3.9 3" {...common} />
        </>
      );
    case "album":
      return (
        <>
          <circle cx="16" cy="16" r="9" {...common} />
          <circle cx="16" cy="16" r="2.5" {...common} />
          <path d="M21.5 9.2v7.9c0 2-1.1 3.2-2.8 3.2" {...common} />
        </>
      );
    case "collection":
      return (
        <>
          <rect x="8" y="7" width="13" height="18" rx="2.5" {...common} />
          <path d="M12 7.5V6.8c0-1 .8-1.8 1.8-1.8h8.4c1 0 1.8.8 1.8 1.8v13.4c0 1-.8 1.8-1.8 1.8H21M11.5 12h6M11.5 16h6M11.5 20h3.5" {...common} />
        </>
      );
  }
}

