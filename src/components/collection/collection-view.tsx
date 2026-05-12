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

import { Button } from "@/components/ui/button";
import {
  CATEGORY_META,
  COLLECTION_BY_CATEGORY,
  type CollectionCardMeta,
  type CollectionCategory,
  type CollectionRarity,
} from "@/lib/collection/cards-data";
import type { FlatCardDTO, GachaStatus } from "@/lib/collection/service";
import { cn } from "@/lib/utils";

import { pullGachaAction } from "@/app/(dashboard)/collection/actions";

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

/** 희귀도 한글 라벨. */
const RARITY_LABEL: Record<CollectionRarity, string> = {
  common: "일반",
  rare: "희귀",
  legendary: "전설",
};

/** 카테고리 표시 순서. */
const CATEGORY_ORDER: CollectionCategory[] = [
  "tarot",
  "lenormand",
  "runes",
  "chineseZodiac",
  "zodiac",
  "cheongan",
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

  const [tab, setTab] = useState<TabId>("all");
  const [selected, setSelected] = useState<FlatCard | null>(null);

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
      characters: { owned: 0, total: 0 },
      lenormand: { owned: 0, total: 0 },
      runes: { owned: 0, total: 0 },
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
    tabCounts.characters.owned +
    tabCounts.lenormand.owned +
    tabCounts.runes.owned;

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
  function handlePull() {
    if (isPending || remaining <= 0) return;

    // 다시 뒷면으로 돌렸다가 뽑기 시작
    setFlipped(false);
    setPulled(null);

    startTransition(async () => {
      const result = await pullGachaAction();

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      if (!result.ok) {
        toast.error("오늘 뽑기 횟수를 모두 사용했어.");
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
      const bonusSuffix =
        result.chatBonus > 0 ? ` (+${result.chatBonus} 문답 보너스)` : "";
      if (result.isNew) {
        setOwnedSet((prev) => {
          const next = new Set(prev);
          next.add(result.card.id);
          return next;
        });
        toast.success(`새 카드 획득 — ${result.card.nameKo}${bonusSuffix}`);
      } else {
        toast(`이미 소장 중인 카드 — ${result.card.nameKo}${bonusSuffix}`);
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
        bonusCredits={gachaStatus.bonusCredits}
        isPending={isPending}
        subscribed={subscribed}
        onPull={handlePull}
      />

      {/* 진행도 표시 — 카테고리 탭 위 한 줄. */}
      <div className="flex items-end justify-between gap-3">
        <h2 className="font-mystic text-lg font-semibold text-foreground sm:text-xl">
          나의 도감
        </h2>
        <p className="text-xs tabular-nums text-muted-foreground">
          {ownedAll} / {totalAll} 소장
        </p>
      </div>

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
// 가챠 패널
// =============================================================================

interface GachaPanelProps {
  flipped: boolean;
  pulled: PullDisplayState | null;
  remaining: number;
  limit: number;
  bonusCredits: number;
  isPending: boolean;
  subscribed: boolean;
  onPull: () => void;
}

function GachaPanel({
  flipped,
  pulled,
  remaining,
  limit,
  bonusCredits,
  isPending,
  subscribed,
  onPull,
}: GachaPanelProps) {
  const canUseBonus = remaining <= 0 && bonusCredits > 0;
  const exhausted = remaining <= 0 && bonusCredits <= 0;
  const buttonLabel = isPending
    ? "뽑는 중..."
    : exhausted
      ? "오늘 뽑기 완료"
      : canUseBonus
        ? `보너스 뽑기 (${bonusCredits}회 남음)`
        : `카드 뽑기 (${remaining}/${limit})`;

  return (
    <div className="app-surface space-y-5 rounded-2xl border border-border/60 p-5 shadow-sm sm:p-7">
      <div className="flex flex-col items-center gap-1 text-center">
        <h2 className="font-mystic text-xl font-semibold text-foreground sm:text-2xl">
          오늘의 카드 뽑기
        </h2>
        <p className="text-xs text-muted-foreground sm:text-sm">
          {subscribed
            ? "구독자는 매일 더 많은 카드를 뽑을 수 있어 (라이트 3장 / 프로 5장)."
            : "무료 1장 / 라이트 3장 / 프로 5장. 희귀·전설 카드는 문답 보너스도 함께 줘."}
        </p>
      </div>

      {/* 카드 플립 */}
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
              "bg-gradient-to-br from-[oklch(0.32_0.07_300)] via-[oklch(0.22_0.08_290)] to-[oklch(0.18_0.06_280)]",
              "flex items-center justify-center",
            )}
            aria-hidden={flipped}
          >
            <div className="flex flex-col items-center gap-2 text-amber-200">
              <Sparkles className="h-9 w-9 opacity-90" aria-hidden />
              <span className="font-mystic text-sm tracking-widest">
                FORTUNE
              </span>
            </div>
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
                alt={pulled.card.nameKo}
                fill
                sizes="(min-width: 640px) 192px, 160px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="h-full w-full bg-muted" />
            )}
            {pulled ? (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-2 py-2 text-center">
                <p className="line-clamp-1 text-xs font-medium text-white">
                  {pulled.card.nameKo}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* 결과 메시지 영역 (높이 고정으로 레이아웃 안정화) */}
      <div className="flex min-h-[40px] flex-col items-center justify-center text-center">
        {pulled ? (
          <>
            {pulled.isNew ? (
              <p className="text-sm font-semibold text-primary">
                새로운 카드를 소장하게 됐어!
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                이미 소장 중인 카드야 — 뽑기 횟수만 1 차감됐어.
              </p>
            )}
            {pulled.chatBonus > 0 ? (
              <p className="font-mystic text-sm text-accent">
                +{pulled.chatBonus} 문답 보너스 획득!
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            카드를 뽑으면 결과가 여기에 나타나.
          </p>
        )}
      </div>

      <div className="flex flex-col items-center gap-2">
        <Button
          type="button"
          size="lg"
          onClick={onPull}
          disabled={isPending || exhausted}
          aria-label="카드 뽑기"
        >
          <Sparkles aria-hidden />
          {buttonLabel}
        </Button>
        {!subscribed && exhausted ? (
          <p className="text-[11px] text-muted-foreground">
            라이트로 업그레이드하면 매일 3번 뽑을 수 있어.
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

  if (!owned) {
    return (
      <div
        className="relative aspect-[2/3] overflow-hidden rounded-xl border border-border/30 cursor-default"
        aria-label="미소장 카드"
      >
        <Image
          src={backSrc}
          alt="미소장"
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

// =============================================================================
// 카드 상세 모달
// =============================================================================

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
              {RARITY_LABEL[card.rarity]}
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
