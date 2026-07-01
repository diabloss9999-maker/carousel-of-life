"use client";

/**
 * 가챠 + 컬렉션 그리드 통합 뷰.
 *
 * 상단: 카드 플립 애니메이션 + 뽑기 버튼 + 결과 메시지
 * 하단: 카테고리 탭 + 카드 그리드 + 상세 모달
 */
import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  CATEGORY_META,
  COLLECTION_BY_CATEGORY,
  type CollectionCardMeta,
  type CollectionCategory,
  type CollectionRarity,
} from "@/lib/collection/cards-data";
import type { FlatCardDTO, GachaStatus } from "@/lib/collection/service";
import { GACHA_DAILY_LIMITS } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { pullGachaAction } from "@/app/(dashboard)/collection/actions";

const BONUS_CARD_BACK_SRC = "/collection/bonus-card-back.png";

/** 탭 식별자 — "all" 은 전체 보기. */
type TabId = "all" | CollectionCategory;

/** 가챠 결과 표시 상태. */
interface PullDisplayState {
  card: FlatCardDTO;
  isNew: boolean;
  chatBonus: number;
}

interface CollectionViewProps {
  ownedIds: string[];
  gachaStatus: GachaStatus;
  subscribed: boolean;
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

/** locale 에 따라 카드의 표시 이름을 고른다. */
function displayName(card: { nameKo: string; nameEn?: string | null }, locale: string): string {
  if (locale === "en" && card.nameEn) return card.nameEn;
  return card.nameKo;
}

/** 카테고리 표시 순서. */
const CATEGORY_ORDER: CollectionCategory[] = [
  "tarot",
  "flowers",
  "chineseZodiac",
  "zodiac",
  "cheongan",
  "lenormand",
  "runes",
  "characters",
  "mbti",
];

/** 카테고리 + 카드 메타 결합 — 정렬된 평면 리스트. */
interface FlatCard extends CollectionCardMeta {
  category: CollectionCategory;
}

function buildFlatList(): FlatCard[] {
  const out: FlatCard[] = [];
  for (const cat of CATEGORY_ORDER) {
    for (const card of COLLECTION_BY_CATEGORY[cat]) {
      out.push({ ...card, category: cat });
    }
  }
  return out;
}

/** 가챠 + 컬렉션 메인 뷰. */
export function CollectionView({
  ownedIds,
  gachaStatus,
  subscribed,
}: CollectionViewProps) {
  // 소장 ID 는 서버에서 받은 초기값을 클라이언트 state 로 관리한다.
  const [ownedSet, setOwnedSet] = useState<Set<string>>(
    () => new Set(ownedIds),
  );
  const [remaining, setRemaining] = useState<number>(gachaStatus.remaining);
  const [limit, setLimit] = useState<number>(gachaStatus.limit);

  const [isPending, startTransition] = useTransition();
  const [flipped, setFlipped] = useState<boolean>(false);
  const [pulled, setPulled] = useState<PullDisplayState | null>(null);
  const [choosing, setChoosing] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [bonusCredits, setBonusCredits] = useState<number>(gachaStatus.bonusCredits);

  const [tab, setTab] = useState<TabId>("all");
  const [selected, setSelected] = useState<FlatCard | null>(null);

  const t = useTranslations("collectionPage");
  const locale = useLocale();

  // 가챠 액션 결과로 직접 state 를 업데이트하므로 props 변동 동기화는 불필요하다.
  // (서버에서 revalidatePath 후 다시 마운트되면 초기값으로 자연 동기화된다.)

  const flatAll = useMemo(() => buildFlatList(), []);

  const visibleCards = useMemo(() => {
    if (tab === "all") return flatAll;
    return flatAll.filter((c) => c.category === tab);
  }, [tab, flatAll]);

  /** 카테고리별 진행도. */
  const tabCounts = useMemo(() => {
    const counts: Record<
      CollectionCategory,
      { owned: number; total: number }
    > = {
      tarot: { owned: 0, total: 0 },
      mbti: { owned: 0, total: 0 },
      zodiac: { owned: 0, total: 0 },
      chineseZodiac: { owned: 0, total: 0 },
      cheongan: { owned: 0, total: 0 },
      lenormand: { owned: 0, total: 0 },
      runes: { owned: 0, total: 0 },
      characters: { owned: 0, total: 0 },
      flowers: { owned: 0, total: 0 },
    };
    for (const card of flatAll) {
      counts[card.category].total += 1;
      if (ownedSet.has(card.id)) counts[card.category].owned += 1;
    }
    return counts;
  }, [flatAll, ownedSet]);

  const totalAll = flatAll.length;
  const ownedAll =
    tabCounts.tarot.owned +
    tabCounts.mbti.owned +
    tabCounts.zodiac.owned +
    tabCounts.chineseZodiac.owned +
    tabCounts.cheongan.owned +
    tabCounts.lenormand.owned +
    tabCounts.runes.owned +
    tabCounts.characters.owned +
    tabCounts.flowers.owned;

  // ESC 모달 닫기
  useEffect(() => {
    if (!selected) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected]);

  // 모달 스크롤 잠금
  useEffect(() => {
    if (!selected) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selected]);

  /** 가챠 뽑기 핸들러. */
  function handleStartPick() {
    if (isPending) return;
    if (remaining <= 0 && bonusCredits <= 0) return;
    setFlipped(false);
    setPulled(null);
    setSelectedSlot(null);
    setChoosing(true);
  }

  function handlePull(slot: number) {
    // 일일 한도 + 보너스 둘 다 0일 때만 차단
    if (isPending) return;
    if (remaining <= 0 && bonusCredits <= 0) return;
    const wasBonusPull = remaining <= 0 && bonusCredits > 0;

    // 다시 뒷면으로 돌렸다가 뽑기 시작
    setFlipped(false);
    setPulled(null);
    setSelectedSlot(slot);

    startTransition(async () => {
      const result = await pullGachaAction();

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      if (!result.ok) {
        toast.error(t("quotaError"));
        setRemaining(0);
        setLimit(result.limit);
        return;
      }

      setPulled({
        card: result.card,
        isNew: result.isNew,
        chatBonus: result.chatBonus,
      });
      setRemaining(result.remaining);
      setLimit(result.limit);
      if (wasBonusPull) {
        setBonusCredits((current) => Math.max(0, current - 1));
      }
      setChoosing(false);
      const bonusSuffix =
        result.chatBonus > 0 ? t("chatBonus", { n: result.chatBonus }) : "";
      const cardName = displayName(result.card, locale);
      if (result.isNew) {
        setOwnedSet((prev) => {
          const next = new Set(prev);
          next.add(result.card.id);
          return next;
        });
        toast.success(`${t("newCardTitle", { name: cardName })}${bonusSuffix}`);
      } else {
        toast(`${t("dupeCardTitle", { name: cardName })}${bonusSuffix}`);
      }

      // 살짝 딜레이 후 플립
      window.setTimeout(() => setFlipped(true), 80);
    });
  }

  return (
    <section className="space-y-7">
      <GachaPanel
        flipped={flipped}
        pulled={pulled}
        remaining={remaining}
        limit={limit}
        bonusCredits={bonusCredits}
        choosing={choosing}
        selectedSlot={selectedSlot}
        isPending={isPending}
        subscribed={subscribed}
        onStartPick={handleStartPick}
        onPick={handlePull}
      />

      {/* 진행도 표시 — 카테고리 탭 위 한 줄. */}
      <div className="flex items-end justify-between gap-3">
        <h2 className="font-mystic text-lg font-semibold text-zinc-900 sm:text-xl">
          {t("heading")}
        </h2>
        <p className="text-[15px] tabular-nums text-zinc-600">
          {t("ownedFraction", { owned: ownedAll, total: totalAll })}
        </p>
      </div>

      {/* 탭 */}
      <div className="-mx-2 overflow-x-auto px-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-2">
          <TabButton
            active={tab === "all"}
            onClick={() => setTab("all")}
            label={t("filterAll")}
            owned={ownedAll}
            total={totalAll}
          />
          {CATEGORY_ORDER.map((cat) => {
            const meta = CATEGORY_META[cat];
            const c = tabCounts[cat];
            return (
              <TabButton
                key={cat}
                active={tab === cat}
                onClick={() => setTab(cat)}
                label={meta.label}
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
          const owned = ownedSet.has(card.id);
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

      {selected ? (
        <CardDetailDialog
          card={selected}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </section>
  );
}

// =============================================================================
// 카테고리 라벨 / 희귀도 라벨 — i18n hook 안에서 사용해야 하므로 컴포넌트 안에서 호출.
// =============================================================================

function useRarityLabel(): Record<CollectionRarity, string> {
  const t = useTranslations("collectionPage");
  return {
    common: t("rarityNormal"),
    rare: t("rarityRare"),
    legendary: t("rarityLegend"),
  };
}

// =============================================================================
// 가챠 패널
// =============================================================================

interface GachaPanelProps {
  flipped: boolean;
  pulled: PullDisplayState | null;
  remaining: number;
  limit: number;
  bonusCredits: number;
  choosing: boolean;
  selectedSlot: number | null;
  isPending: boolean;
  subscribed: boolean;
  onStartPick: () => void;
  onPick: (slot: number) => void;
}

function GachaPanel({
  flipped,
  pulled,
  remaining,
  limit,
  bonusCredits,
  choosing,
  selectedSlot,
  isPending,
  subscribed,
  onStartPick,
  onPick,
}: GachaPanelProps) {
  const t = useTranslations("collectionPage");
  const locale = useLocale();
  const canUseBonus = remaining <= 0 && bonusCredits > 0;
  const exhausted = remaining <= 0 && bonusCredits <= 0;
  const buttonLabel = isPending
    ? t("drawingNow")
    : exhausted
      ? t("drawDoneToday")
      : canUseBonus
        ? t("drawBonus", { n: bonusCredits })
        : t("drawCount", { used: limit - remaining, max: limit });

  return (
    <div className="app-surface space-y-5 rounded-2xl border border-border/60 p-5 shadow-sm sm:p-7">
      <div className="flex flex-col items-center gap-1 text-center">
        <h2 className="font-mystic text-xl font-semibold text-zinc-900 sm:text-2xl">
          {t("drawAction")}
        </h2>
        <p className="text-[15px] text-zinc-600 sm:text-[15px]">
          {subscribed
            ? t("subDescSubscribed")
            : t("subDescFree")}
        </p>
        <p className="text-[13px] text-amber-700">
          {t("bonusDeductNotice")}
        </p>
      </div>

      {/* 카드 플립 */}
      {choosing && !pulled ? (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[0, 1, 2].map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => onPick(slot)}
              disabled={isPending}
              className={cn(
                "relative aspect-[2/3] overflow-hidden rounded-xl border-2 border-amber-300/55 shadow-lg transition",
                "hover:-translate-y-1 hover:border-amber-200 hover:shadow-amber-300/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200",
                selectedSlot === slot && "scale-[0.98] border-white opacity-80",
                isPending && selectedSlot !== slot && "opacity-55",
              )}
              aria-label={t("pickOneAria", { n: slot + 1 })}
            >
              <Image
                src={BONUS_CARD_BACK_SRC}
                alt={t("bonusBackAlt")}
                fill
                sizes="(min-width: 640px) 160px, 30vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : (
      <div className="mx-auto card-flip h-60 w-40 sm:h-72 sm:w-48">
        <div
          className={cn(
            "card-inner",
            flipped && "flipped",
            pulled?.isNew && flipped && "gacha-new-glow rounded-xl",
          )}
        >
          {/* 뒷면 */}
          <div
            className={cn(
              "card-face overflow-hidden rounded-xl border-2 border-amber-400/60",
            )}
            aria-hidden={flipped}
          >
            <Image
              src={BONUS_CARD_BACK_SRC}
              alt={t("bonusBackAlt")}
              fill
              sizes="(min-width: 640px) 192px, 160px"
              className="object-cover"
            />
          </div>
          {/* 앞면 */}
          <div
            className={cn(
              "card-face card-face-back overflow-hidden rounded-xl border-2",
              pulled
                ? RARITY_BORDER[pulled.card.rarity]
                : "border-border/40",
              pulled ? RARITY_GLOW[pulled.card.rarity] : "",
            )}
            aria-hidden={!flipped}
          >
            {pulled ? (
              <Image
                src={pulled.card.imageSrc}
                alt={displayName(pulled.card, locale)}
                fill
                sizes="(min-width: 640px) 192px, 160px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="h-full w-full bg-muted" />
            )}
            {pulled ? (
              <div data-keep-color className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-2 py-2 text-center">
                <p className="line-clamp-1 text-[15px] font-medium text-white">
                  {displayName(pulled.card, locale)}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      )}

      {/* 결과 메시지 영역 (높이 고정으로 레이아웃 안정화) */}

      <div className="flex min-h-[40px] flex-col items-center justify-center text-center">
        {pulled ? (
          <>
            {pulled.isNew ? (
              <p className="text-[15px] font-semibold text-amber-600">
                {t("resultNew")}
              </p>
            ) : (
              <p className="text-[15px] text-zinc-600">
                {t("dupeDetailLine")}
              </p>
            )}
            {pulled.chatBonus > 0 ? (
              <p className="font-mystic text-[15px] text-amber-600">
                {t("resultBonus", { n: pulled.chatBonus })}
              </p>
            ) : null}
          </>
        ) : choosing ? (
          <p className="text-[15px] text-zinc-600">
            {t("pickOneHint")}
          </p>
        ) : (
          <p className="text-[15px] text-zinc-600">
            {t("resultIdle")}
          </p>
        )}
      </div>

      <div className="flex flex-col items-center gap-2">
        <Button
          type="button"
          size="lg"
          onClick={onStartPick}
          disabled={isPending || exhausted || choosing}
          aria-label={t("drawAriaLabel")}
        >
          <Sparkles aria-hidden />
          {buttonLabel}
        </Button>
        {!subscribed && exhausted ? (
          <p className="text-[15px] text-zinc-600">
            {t("upgradeHint", { n: GACHA_DAILY_LIMITS.lite })}
          </p>
        ) : null}
      </div>
    </div>
  );
}

// =============================================================================
// 탭 버튼
// =============================================================================

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
        "flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[15px] font-medium transition-all",
        active
          ? "border-zinc-400 bg-black/[0.07] font-semibold shadow-inner"
          : "border-zinc-300 bg-white/60 hover:bg-white",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "tabular-nums text-[15px]",
          active ? "text-white/90" : "text-zinc-500",
        )}
      >
        {owned}/{total}
      </span>
    </button>
  );
}

// =============================================================================
// 카드 셀
// =============================================================================

interface CardCellProps {
  card: FlatCard;
  owned: boolean;
  onClick: () => void;
}

function CardCell({ card, owned, onClick }: CardCellProps) {
  const backSrc = CATEGORY_META[card.category].cardBackSrc;
  const t = useTranslations("collectionPage");
  const locale = useLocale();
  const cardName = displayName(card, locale);

  if (!owned) {
    return (
      <div
        className="relative aspect-[2/3] overflow-hidden rounded-xl border border-border/30 cursor-default"
        aria-label={t("lockedAriaLabel")}
      >
        <Image
          src={backSrc}
          alt={t("lockedBadge")}
          fill
          className="object-cover"
          sizes="120px"
        />
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
      aria-label={t("detailAriaLabel", { name: cardName })}
    >
      <Image
        src={card.imageSrc}
        alt={cardName}
        fill
        sizes="(min-width: 1024px) 16vw, (min-width: 768px) 20vw, 33vw"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div data-keep-color className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-1.5 py-1.5 text-center">
        <span className="line-clamp-1 text-[15px] font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          {cardName}
        </span>
      </div>
    </button>
  );
}

// =============================================================================
// 카드 상세 모달
// =============================================================================

interface CardDetailDialogProps {
  card: FlatCard;
  onClose: () => void;
}

function CardDetailDialog({ card, onClose }: CardDetailDialogProps) {
  const t = useTranslations("collectionPage");
  const locale = useLocale();
  const rarityLabels = useRarityLabel();
  const cardName = displayName(card, locale);
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
        data-keep-color
        className={cn(
          "relative z-10 w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl",
          "bg-[#1a1428]/95 backdrop-blur-md",
          RARITY_BORDER[card.rarity],
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/40 p-1.5 text-white transition-colors hover:bg-black/65"
          aria-label={t("closeAriaLabel")}
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
              alt={cardName}
              fill
              sizes="220px"
              className="object-cover"
              priority
            />
          </div>

          <div className="space-y-1.5 text-center">
            <h3
              id="collection-card-title"
              className="font-mystic text-xl font-semibold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
            >
              {cardName}
            </h3>
            {locale !== "en" && card.nameEn ? (
              <p className="text-[15px] uppercase tracking-wider text-white/75">
                {card.nameEn}
              </p>
            ) : locale === "en" && card.nameEn && card.nameKo !== card.nameEn ? (
              <p className="text-[15px] uppercase tracking-wider text-white/75">
                {card.nameKo}
              </p>
            ) : null}
            <span
              className={cn(
                "inline-block rounded-full px-2.5 py-0.5 text-[15px] font-medium",
                card.rarity === "legendary" && "bg-amber-300/20 text-amber-200",
                card.rarity === "rare" && "bg-sky-300/20 text-sky-200",
                card.rarity === "common" && "bg-stone-400/20 text-stone-200",
              )}
            >
              {rarityLabels[card.rarity]}
            </span>
          </div>

          <p className="text-center text-[15px] leading-relaxed text-white/85">
            {card.description}
          </p>
        </div>
      </div>
    </div>
  );
}
