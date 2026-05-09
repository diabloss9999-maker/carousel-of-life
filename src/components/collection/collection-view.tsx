"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

import {
  CATEGORY_META,
  COLLECTION_BY_CATEGORY,
  type CollectionCardMeta,
  type CollectionCategory,
  type CollectionRarity,
} from "@/lib/collection/cards-data";
import type { DiscoveredCollectionPlain } from "@/lib/collection/service";
import { cn } from "@/lib/utils";

/** 탭 식별자 — "all" 은 전체 보기. */
type TabId = "all" | CollectionCategory;

interface CollectionViewProps {
  discovered: DiscoveredCollectionPlain;
}

/** 희귀도별 외곽선 색. */
const RARITY_BORDER: Record<CollectionRarity, string> = {
  common: "border-stone-300/60 dark:border-stone-600/40",
  rare: "border-sky-300/70 dark:border-sky-400/40",
  legendary: "border-amber-400/80 dark:border-amber-300/60",
};

/** 희귀도별 글로우. */
const RARITY_GLOW: Record<CollectionRarity, string> = {
  common: "shadow-md",
  rare: "shadow-sky-300/30 shadow-lg",
  legendary: "shadow-amber-300/40 shadow-xl",
};

/** 카테고리 + 카드 메타 결합 — 정렬된 평면 리스트. */
interface FlatCard extends CollectionCardMeta {
  category: CollectionCategory;
}

function buildFlatList(): FlatCard[] {
  const order: CollectionCategory[] = [
    "tarot",
    "mbti",
    "zodiac",
    "chineseZodiac",
    "cheongan",
    "characters",
  ];
  const out: FlatCard[] = [];
  for (const cat of order) {
    for (const card of COLLECTION_BY_CATEGORY[cat]) {
      out.push({ ...card, category: cat });
    }
  }
  return out;
}

/**
 * 카드 컬렉션 메인 뷰 — 탭, 그리드, 상세 모달.
 */
export function CollectionView({ discovered }: CollectionViewProps) {
  const [tab, setTab] = useState<TabId>("all");
  const [selected, setSelected] = useState<FlatCard | null>(null);

  /** id 빠른 조회용 — 카테고리별 발견 Set. */
  const discoveredSets = useMemo(
    () => ({
      tarot: new Set(discovered.tarot),
      mbti: new Set(discovered.mbti),
      zodiac: new Set(discovered.zodiac),
      chineseZodiac: new Set(discovered.chineseZodiac),
      cheongan: new Set(discovered.cheongan),
      characters: new Set(discovered.characters),
    }),
    [discovered],
  );

  /** 발견 여부 판정. */
  const isDiscovered = (card: FlatCard): boolean =>
    discoveredSets[card.category].has(card.id);

  const flatAll = useMemo(() => buildFlatList(), []);
  const visibleCards = useMemo(() => {
    if (tab === "all") return flatAll;
    return flatAll.filter((c) => c.category === tab);
  }, [tab, flatAll]);

  /** 탭별 진행도 계산 (라벨 옆 숫자). */
  const tabCounts = useMemo(() => {
    const counts: Record<CollectionCategory, { owned: number; total: number }> =
      {
        tarot: { owned: 0, total: 0 },
        mbti: { owned: 0, total: 0 },
        zodiac: { owned: 0, total: 0 },
        chineseZodiac: { owned: 0, total: 0 },
        cheongan: { owned: 0, total: 0 },
        characters: { owned: 0, total: 0 },
      };
    for (const card of flatAll) {
      counts[card.category].total += 1;
      if (discoveredSets[card.category].has(card.id)) {
        counts[card.category].owned += 1;
      }
    }
    return counts;
  }, [flatAll, discoveredSets]);

  // ESC 로 모달 닫기
  useEffect(() => {
    if (!selected) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected]);

  // 모달 열렸을 때 body 스크롤 잠금
  useEffect(() => {
    if (!selected) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selected]);

  const totalAll = flatAll.length;
  const ownedAll =
    tabCounts.tarot.owned +
    tabCounts.mbti.owned +
    tabCounts.zodiac.owned +
    tabCounts.chineseZodiac.owned +
    tabCounts.cheongan.owned +
    tabCounts.characters.owned;

  return (
    <section className="space-y-6">
      {/* 탭 */}
      <div className="-mx-2 overflow-x-auto px-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-2">
          <TabButton
            active={tab === "all"}
            onClick={() => setTab("all")}
            label="전체"
            owned={ownedAll}
            total={totalAll}
          />
          {(
            [
              "tarot",
              "mbti",
              "zodiac",
              "chineseZodiac",
              "cheongan",
              "characters",
            ] as CollectionCategory[]
          ).map((cat) => {
            const meta = CATEGORY_META[cat];
            const c = tabCounts[cat];
            return (
              <TabButton
                key={cat}
                active={tab === cat}
                onClick={() => setTab(cat)}
                label={`${meta.emoji} ${meta.label}`}
                owned={c.owned}
                total={c.total}
              />
            );
          })}
        </div>
      </div>

      {/* 그리드 */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {visibleCards.map((card) => {
          const owned = isDiscovered(card);
          return (
            <CardCell
              key={`${card.category}-${card.id}`}
              card={card}
              owned={owned}
              onClick={() => owned && setSelected(card)}
            />
          );
        })}
      </div>

      {/* 모달 */}
      {selected ? (
        <CardDetailDialog
          card={selected}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </section>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  owned: number;
  total: number;
}

function TabButton({ active, onClick, label, owned, total }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
        active
          ? "border-primary/60 bg-primary/15 text-primary shadow-inner"
          : "border-border/55 bg-card/50 text-muted-foreground hover:bg-card/80 hover:text-foreground",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "tabular-nums text-[10px]",
          active ? "text-primary/80" : "text-muted-foreground/70",
        )}
      >
        {owned}/{total}
      </span>
    </button>
  );
}

interface CardCellProps {
  card: FlatCard;
  owned: boolean;
  onClick: () => void;
}

function CardCell({ card, owned, onClick }: CardCellProps) {
  if (!owned) {
    return (
      <div
        className={cn(
          "relative aspect-[2/3] overflow-hidden rounded-xl border border-border/30",
          "bg-gradient-to-br from-muted/40 via-muted/30 to-muted/50 cursor-default",
        )}
        aria-label="미발견 카드"
      >
        <div className="absolute inset-0 backdrop-blur-[2px]" aria-hidden />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mystic text-4xl text-muted-foreground/40">
            ?
          </span>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative aspect-[2/3] overflow-hidden rounded-xl border-2 transition-all",
        "hover:scale-[1.04] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        RARITY_BORDER[card.rarity],
        RARITY_GLOW[card.rarity],
      )}
      aria-label={`${card.nameKo} 상세 보기`}
    >
      <Image
        src={card.imageSrc}
        alt={card.nameKo}
        fill
        sizes="(min-width: 1024px) 16vw, (min-width: 768px) 20vw, 33vw"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-1.5 py-1.5 text-center">
        <span className="line-clamp-1 text-[11px] font-medium text-white">
          {card.nameKo}
        </span>
      </div>
    </button>
  );
}

interface CardDetailDialogProps {
  card: FlatCard;
  onClose: () => void;
}

function CardDetailDialog({ card, onClose }: CardDetailDialogProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="collection-card-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div
        className={cn(
          "relative z-10 w-full max-w-md overflow-hidden rounded-2xl border bg-card shadow-2xl",
          RARITY_BORDER[card.rarity],
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/40 p-1.5 text-white transition-colors hover:bg-black/65"
          aria-label="닫기"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <div className="flex flex-col items-center gap-4 p-6">
          <div
            className={cn(
              "relative aspect-[2/3] w-44 overflow-hidden rounded-xl border-2 sm:w-52",
              RARITY_BORDER[card.rarity],
              RARITY_GLOW[card.rarity],
            )}
          >
            <Image
              src={card.imageSrc}
              alt={card.nameKo}
              fill
              sizes="220px"
              className="object-cover"
              priority
            />
          </div>

          <div className="space-y-1.5 text-center">
            <h3
              id="collection-card-title"
              className="font-mystic text-xl font-semibold text-foreground"
            >
              {card.nameKo}
            </h3>
            {card.nameEn ? (
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {card.nameEn}
              </p>
            ) : null}
            <span
              className={cn(
                "inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium",
                card.rarity === "legendary" &&
                  "bg-amber-200/30 text-amber-800 dark:bg-amber-300/15 dark:text-amber-200",
                card.rarity === "rare" &&
                  "bg-sky-200/30 text-sky-800 dark:bg-sky-300/15 dark:text-sky-200",
                card.rarity === "common" &&
                  "bg-stone-200/40 text-stone-700 dark:bg-stone-500/20 dark:text-stone-200",
              )}
            >
              {card.rarity === "legendary"
                ? "전설"
                : card.rarity === "rare"
                  ? "희귀"
                  : "일반"}
            </span>
          </div>

          <p className="text-center text-sm leading-relaxed text-muted-foreground">
            {card.description}
          </p>
        </div>
      </div>
    </div>
  );
}
