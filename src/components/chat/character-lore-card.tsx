"use client";

/**
 * 세계관 이야기 카드 — 채팅 페이지의 캐릭터 lore 섹션.
 *
 * 구조:
 *   1) 세계 도입 (3개 세계관: 이세계 · 동양 · 북유럽)
 *      - opening, paragraphs, figures, closing, theme
 *   2) 각 세계 안에서 캐릭터별 스토리 챕터 (10개씩)
 *      - 캐릭터의 호감도 Lv.N 도달 시 챕터 N 해금
 *   3) 세계관별 진실 루트 + 최종 챕터
 *      - 해당 세계 3 캐릭터 전원 Lv.10 도달 시 해금
 */
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Lock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import {
  CHARACTERS_BY_CATEGORY,
  type CharacterCategory,
  type CharacterId,
} from "@/lib/chat/characters";
import { calcLevel } from "@/lib/affinity/levels";
import {
  CHARACTER_STORIES,
  WORLD_LORE,
  getChapterImageSrc,
  type StoryChapter,
  type WorldTruthRoute,
  type WorldFinalChapter,
} from "@/lib/stories/character-stories";
import {
  CHARACTER_STORIES_EN,
  WORLD_LORE_EN,
} from "@/lib/stories/character-stories.en";
import Image from "next/image";

/**
 * locale 에 따라 한국어/영어 스토리 매핑을 고른다.
 * 영어판 챕터가 비어 있는 캐릭터(동양·북유럽)는 한국어로 폴백.
 */
function pickStories(locale: string): Record<CharacterId, StoryChapter[]> {
  if (locale !== "en") return CHARACTER_STORIES;
  const merged: Record<CharacterId, StoryChapter[]> = { ...CHARACTER_STORIES };
  for (const id of Object.keys(CHARACTER_STORIES_EN) as CharacterId[]) {
    if (CHARACTER_STORIES_EN[id].length > 0) {
      merged[id] = CHARACTER_STORIES_EN[id];
    }
  }
  return merged;
}

function pickWorldLore(locale: string): Partial<
  Record<CharacterCategory, { truthRoute: WorldTruthRoute; finalChapter: WorldFinalChapter }>
> {
  if (locale !== "en") return WORLD_LORE;
  return { ...WORLD_LORE, ...WORLD_LORE_EN };
}

interface CharacterLoreCardProps {
  /** 캐릭터별 호감도 포인트 — `{ characterId: points }` */
  affinities?: Record<string, number>;
  /** 마스터 운영자 모드 — 호감도 무관 모든 챕터/진실 루트 해금 표시 */
  adminMode?: boolean;
}

interface WorldDeco {
  world: CharacterCategory;
  /** worldLore 네임스페이스 안의 sub-namespace key */
  loreKey: "otherworld" | "eastern" | "nordic";
  /** characterSelect 의 category 라벨 키 (Otherworld/Eastern/Nordic) */
  labelKey: "Otherworld" | "Eastern" | "Nordic";
  worldSub: string;
  accent: string;
  border: string;
  /** 진실 루트·최종 챕터의 카드 보더 색상 */
  truthBorder: string;
}

const WORLD_DECOS: WorldDeco[] = [
  {
    world: "이세계",
    loreKey: "otherworld",
    labelKey: "Otherworld",
    worldSub: "ASTRA RIFT",
    accent: "text-violet-400",
    border: "border-violet-800/30",
    truthBorder: "border-violet-500/40",
  },
  {
    world: "동양",
    loreKey: "eastern",
    labelKey: "Eastern",
    worldSub: "月蝕鏡",
    accent: "text-emerald-400",
    border: "border-emerald-800/30",
    truthBorder: "border-emerald-500/40",
  },
  {
    world: "북유럽",
    loreKey: "nordic",
    labelKey: "Nordic",
    worldSub: "MIDHALL",
    accent: "text-sky-300",
    border: "border-sky-800/30",
    truthBorder: "border-sky-500/40",
  },
];

/**
 * 한 캐릭터의 호감도 레벨과 챕터 해금 상태를 계산한다.
 * 마스터 모드에서는 호감도 무관 Lv.10 / 10챕터 전체 해금으로 처리.
 */
function getCharacterStatus(
  characterId: CharacterId,
  affinities: Record<string, number>,
  adminMode: boolean,
): { level: number; unlockedCount: number } {
  if (adminMode) {
    return { level: 10, unlockedCount: 10 };
  }
  const points = affinities[characterId] ?? 0;
  const { level } = calcLevel(characterId, points);
  return { level, unlockedCount: level };
}

/**
 * 세계의 진실 루트가 해금됐는지 — 3 캐릭터 모두 Lv.10 도달 시.
 * 마스터 모드는 항상 해금.
 */
function isTruthRouteUnlocked(
  world: CharacterCategory,
  affinities: Record<string, number>,
  adminMode: boolean,
): boolean {
  if (adminMode) return true;
  return CHARACTERS_BY_CATEGORY[world].every(
    (id) => getCharacterStatus(id, affinities, false).level >= 10,
  );
}

export function CharacterLoreCard({
  affinities = {},
  adminMode = false,
}: CharacterLoreCardProps) {
  const [openWorldIdx, setOpenWorldIdx] = useState<number | null>(null);
  /** 동시에 한 캐릭터의 스토리만 펼치도록 부모에서 단일 상태로 관리. */
  const [openCharacterId, setOpenCharacterId] = useState<CharacterId | null>(
    null,
  );

  const tLore = useTranslations("worldLore");
  const tCat = useTranslations("characterSelect");
  const tChar = useTranslations("characters");
  const locale = useLocale();
  const stories = pickStories(locale);
  const worldLore = pickWorldLore(locale);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/sealed-ring.svg"
          alt=""
          aria-hidden
          className="h-5 w-5 opacity-40"
        />
        <p className="text-xs text-muted-foreground/50 tracking-widest uppercase">
          {tLore("sectionTitle")}
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/sealed-ring.svg"
          alt=""
          aria-hidden
          className="h-5 w-5 opacity-40 scale-x-[-1]"
        />
      </div>

      {WORLD_DECOS.map((deco, i) => {
        const isOpen = openWorldIdx === i;
        const worldLabel = tCat(`category${deco.labelKey}` as "categoryOtherworld" | "categoryEastern" | "categoryNordic");
        const lorePath = (key: string) => `${deco.loreKey}.${key}` as const;
        const characterIds = CHARACTERS_BY_CATEGORY[deco.world];
        const figures = characterIds.map((id, idx) => ({
          id,
          name: tChar(`${id}.name`),
          line: tLore(lorePath(`fig${idx + 1}Line`) as
            | "otherworld.fig1Line" | "otherworld.fig2Line" | "otherworld.fig3Line"
            | "eastern.fig1Line" | "eastern.fig2Line" | "eastern.fig3Line"
            | "nordic.fig1Line" | "nordic.fig2Line" | "nordic.fig3Line"),
        }));
        const opening = tLore(lorePath("opening") as "otherworld.opening" | "eastern.opening" | "nordic.opening");
        const paragraphs = [
          tLore(lorePath("p1") as "otherworld.p1" | "eastern.p1" | "nordic.p1"),
          tLore(lorePath("p2") as "otherworld.p2" | "eastern.p2" | "nordic.p2"),
          tLore(lorePath("p3") as "otherworld.p3" | "eastern.p3" | "nordic.p3"),
        ];
        const closing = tLore(lorePath("closing") as "otherworld.closing" | "eastern.closing" | "nordic.closing");
        const theme = tLore(lorePath("theme") as "otherworld.theme" | "eastern.theme" | "nordic.theme");
        return (
          <div
            key={deco.world}
            className={cn(
              "rounded-2xl border overflow-hidden transition-all",
              deco.border,
            )}
            style={{
              background: "rgba(255,255,255,0.07)",
              backdropFilter: "blur(16px)",
            }}
          >
            <button
              type="button"
              onClick={() => setOpenWorldIdx(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
            >
              <div>
                <span
                  className={cn("font-mystic font-bold text-base", deco.accent)}
                >
                  {worldLabel}
                </span>
                <span className="ml-2 text-[10px] tracking-widest text-muted-foreground/70 uppercase">
                  {deco.worldSub}
                </span>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground/50 transition-transform duration-200 flex-shrink-0",
                  isOpen && "rotate-180",
                )}
              />
            </button>

            {isOpen && (
              <div className="px-5 pb-6 space-y-5 border-t border-white/5">
                {/* 도입부 */}
                <p
                  className={cn(
                    "font-mystic text-sm font-semibold leading-relaxed pt-4",
                    deco.accent,
                  )}
                >
                  {opening}
                </p>

                {/* 본문 단락 */}
                <div className="space-y-3">
                  {paragraphs.map((p, j) => (
                    <p key={j} className="text-sm leading-loose text-foreground/70">
                      {p}
                    </p>
                  ))}
                </div>

                {/* 인물 요약 */}
                <div className="space-y-2 border-t border-white/5 pt-4">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/65 mb-3">
                    {tLore("figuresLabel")}
                  </p>
                  {figures.map((f) => (
                    <div key={f.id} className="flex gap-3">
                      <span
                        className={cn(
                          "font-mystic text-sm font-bold flex-shrink-0 w-10",
                          deco.accent,
                        )}
                      >
                        {f.name}
                      </span>
                      <p className="text-sm text-muted-foreground/65 leading-relaxed">
                        {f.line}
                      </p>
                    </div>
                  ))}
                </div>

                {/* 마무리 */}
                <p className="font-mystic text-xs italic text-muted-foreground/50 border-t border-white/5 pt-4 leading-relaxed">
                  {closing}
                </p>

                {/* 테마 태그 */}
                <div className="flex flex-wrap gap-2">
                  {theme.split(" · ").map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-0.5 text-[10px] text-muted-foreground/50"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* ── 캐릭터 스토리 챕터 (호감도 잠금/해금) ─────────── */}
                <div className="space-y-3 border-t border-white/5 pt-5">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/65">
                    {tLore("charactersSection")}
                  </p>

                  {characterIds.map((id) => (
                    <CharacterStoryAccordion
                      key={id}
                      characterId={id}
                      affinities={affinities}
                      accent={deco.accent}
                      adminMode={adminMode}
                      chapters={stories[id]}
                      isOpen={openCharacterId === id}
                      onToggle={() =>
                        setOpenCharacterId(
                          openCharacterId === id ? null : id,
                        )
                      }
                    />
                  ))}
                </div>

                {/* ── 진실 루트 + 최종 챕터 ───────────────────────── */}
                <TruthRouteSection
                  world={deco.world}
                  affinities={affinities}
                  accent={deco.accent}
                  border={deco.truthBorder}
                  adminMode={adminMode}
                  lore={worldLore[deco.world] ?? null}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 캐릭터별 챕터 아코디언
// ════════════════════════════════════════════════════════════════════════════

interface CharacterStoryAccordionProps {
  characterId: CharacterId;
  affinities: Record<string, number>;
  accent: string;
  adminMode: boolean;
  /** locale 별로 선택된 챕터 배열 — 부모에서 주입. */
  chapters: StoryChapter[];
  /** 부모에서 단일 캐릭터만 펼치도록 제어한다. */
  isOpen: boolean;
  onToggle: () => void;
}

function CharacterStoryAccordion({
  characterId,
  affinities,
  accent,
  adminMode,
  chapters,
  isOpen,
  onToggle,
}: CharacterStoryAccordionProps) {
  const [openChapter, setOpenChapter] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(isOpen);

  const tChar = useTranslations("characters");
  const tLore = useTranslations("worldLore");
  const characterName = tChar(`${characterId}.name`);
  const characterTitle = tChar(`${characterId}.title`);
  const { level, unlockedCount } = getCharacterStatus(
    characterId,
    affinities,
    adminMode,
  );
  const hasContent = chapters.length > 0;

  // 다른 캐릭터에서 이 캐릭터로 전환됐을 때 레이아웃 점프 방지 —
  // 닫혀있다가 열리는 순간 헤더가 viewport 상단에 오도록 부드럽게 스크롤.
  useEffect(() => {
    if (isOpen && !wasOpenRef.current && rootRef.current) {
      const headerY = rootRef.current.getBoundingClientRect().top;
      // 헤더가 이미 화면 상단 근처(상단 120px 이내)면 굳이 스크롤하지 않음
      if (headerY < 0 || headerY > 240) {
        rootRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  // 닫힐 때 내부 챕터 상태 초기화 — 다시 열었을 때 깔끔한 시작.
  // 부모 토글에 따른 자식 상태 리셋이므로 의도된 패턴.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isOpen) setOpenChapter(null);
  }, [isOpen]);

  return (
    <div
      ref={rootRef}
      className="rounded-xl border border-white/10 bg-white/3 overflow-hidden scroll-mt-20"
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className={cn("font-mystic font-bold text-sm", accent)}>
            {characterName}
          </span>
          <span className="text-[10px] text-muted-foreground/60">
            {characterTitle}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] tabular-nums text-muted-foreground/65">
            Lv.{level} · {unlockedCount}/10
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground/50 transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-1 space-y-1.5 border-t border-white/5">
          {!hasContent ? (
            <p className="text-xs text-muted-foreground/60 italic py-3">
              {tLore("lockedStory")}
            </p>
          ) : (
            chapters.map((chap) => {
              const unlocked = chap.number <= unlockedCount;
              const isExpanded = openChapter === chap.number;
              return (
                <ChapterRow
                  key={chap.number}
                  characterId={characterId}
                  chapter={chap}
                  unlocked={unlocked}
                  isExpanded={isExpanded}
                  onToggle={() =>
                    setOpenChapter(isExpanded ? null : chap.number)
                  }
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 진실 루트 + 최종 챕터
// ════════════════════════════════════════════════════════════════════════════

interface TruthRouteSectionProps {
  world: CharacterCategory;
  affinities: Record<string, number>;
  accent: string;
  border: string;
  adminMode: boolean;
  /** locale 에 맞게 선택된 진실 루트 + 최종 챕터 데이터. */
  lore: {
    truthRoute: WorldTruthRoute;
    finalChapter: WorldFinalChapter;
  } | null;
}

function TruthRouteSection({
  world,
  affinities,
  accent,
  border,
  adminMode,
  lore,
}: TruthRouteSectionProps) {
  const [openSec, setOpenSec] = useState<"truth" | "final" | null>(null);
  const tLore = useTranslations("worldLore");

  if (!lore) return null;

  const unlocked = isTruthRouteUnlocked(world, affinities, adminMode);

  return (
    <div className={cn("rounded-xl border-2 mt-2", border)}>
      <div className="px-4 py-3 border-b border-white/5">
        <p className={cn("font-mystic text-xs font-bold uppercase tracking-widest", accent)}>
          {tLore("truthRoute")}
        </p>
        {!unlocked && (
          <p className="text-[10px] text-muted-foreground/55 mt-1 flex items-center gap-1.5">
            <Lock className="h-3 w-3" aria-hidden />
            {lore.truthRoute.unlockHint}
          </p>
        )}
      </div>

      <div className="px-4 py-3 space-y-2">
        {/* 진실 루트 */}
        <button
          type="button"
          onClick={() =>
            unlocked ? setOpenSec(openSec === "truth" ? null : "truth") : undefined
          }
          disabled={!unlocked}
          className={cn(
            "w-full flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/3 px-3 py-2 text-left",
            unlocked ? "cursor-pointer" : "cursor-not-allowed opacity-50",
          )}
        >
          <span className="text-xs font-medium text-foreground/85">
            {lore.truthRoute.title}
          </span>
          {unlocked ? (
            <ChevronDown
              className={cn(
                "h-3 w-3 text-muted-foreground/50 transition-transform",
                openSec === "truth" && "rotate-180",
              )}
            />
          ) : (
            <Lock className="h-3 w-3 text-muted-foreground/40" aria-hidden />
          )}
        </button>
        {unlocked && openSec === "truth" && (
          <div className="px-2 py-2">
            <ChapterBody body={lore.truthRoute.body} />
          </div>
        )}

        {/* 최종 챕터 */}
        <button
          type="button"
          onClick={() =>
            unlocked ? setOpenSec(openSec === "final" ? null : "final") : undefined
          }
          disabled={!unlocked}
          className={cn(
            "w-full flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/3 px-3 py-2 text-left",
            unlocked ? "cursor-pointer" : "cursor-not-allowed opacity-50",
          )}
        >
          <span className="text-xs font-medium text-foreground/85">
            {tLore("finalChapterPrefix")} · {lore.finalChapter.title}
          </span>
          {unlocked ? (
            <ChevronDown
              className={cn(
                "h-3 w-3 text-muted-foreground/50 transition-transform",
                openSec === "final" && "rotate-180",
              )}
            />
          ) : (
            <Lock className="h-3 w-3 text-muted-foreground/40" aria-hidden />
          )}
        </button>
        {unlocked && openSec === "final" && (
          <div className="px-2 py-2 space-y-3">
            <ChapterBody body={lore.finalChapter.body} />
            <p className={cn("font-mystic text-xs italic leading-relaxed border-t border-white/5 pt-3", accent)}>
              {lore.finalChapter.ending}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 챕터 단일 행 — 열림 시 이미지가 화면 상단에 오도록 스크롤
// ════════════════════════════════════════════════════════════════════════════

interface ChapterRowProps {
  characterId: CharacterId;
  chapter: { number: number; title: string; body: string };
  unlocked: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

function ChapterRow({
  characterId,
  chapter,
  unlocked,
  isExpanded,
  onToggle,
}: ChapterRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const wasExpandedRef = useRef(isExpanded);
  const tLore = useTranslations("worldLore");

  // 챕터가 새로 펼쳐지는 순간 — 챕터 헤더(곧이어 이미지가 오는 위치)가
  // viewport 상단에 자리잡도록 부드럽게 스크롤한다.
  useEffect(() => {
    if (isExpanded && !wasExpandedRef.current && rowRef.current) {
      // 본문/이미지 DOM 이 마운트된 다음 프레임에 스크롤해야 정확.
      const id = requestAnimationFrame(() => {
        rowRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      wasExpandedRef.current = isExpanded;
      return () => cancelAnimationFrame(id);
    }
    wasExpandedRef.current = isExpanded;
  }, [isExpanded]);

  return (
    <div
      ref={rowRef}
      className="rounded-lg border border-white/5 bg-white/3 overflow-hidden scroll-mt-20"
    >
      <button
        type="button"
        onClick={unlocked ? onToggle : undefined}
        disabled={!unlocked}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-3 py-2 text-left",
          unlocked ? "cursor-pointer" : "cursor-not-allowed opacity-50",
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={cn(
              "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] tabular-nums font-bold",
              unlocked
                ? "bg-white/10 text-foreground/80"
                : "bg-white/5 text-muted-foreground/40",
            )}
          >
            {chapter.number}
          </span>
          {unlocked ? (
            <span className="text-xs font-medium text-foreground/85 truncate">
              {chapter.title}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/50 flex items-center gap-1.5">
              <Lock className="h-3 w-3" aria-hidden />
              {tLore("chapterUnlockHint", { level: chapter.number })}
            </span>
          )}
        </div>
        {unlocked && (
          <ChevronDown
            className={cn(
              "h-3 w-3 text-muted-foreground/50 transition-transform flex-shrink-0",
              isExpanded && "rotate-180",
            )}
          />
        )}
      </button>
      {unlocked && isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-4">
          <ChapterImage
            characterId={characterId}
            chapterNumber={chapter.number}
            title={chapter.title}
          />
          <ChapterBody body={chapter.body} />
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 챕터 이미지 — 있을 때만 본문 위에 렌더
// ════════════════════════════════════════════════════════════════════════════

interface ChapterImageProps {
  characterId: CharacterId;
  chapterNumber: number;
  title: string;
}

function ChapterImage({ characterId, chapterNumber, title }: ChapterImageProps) {
  const src = getChapterImageSrc(characterId, chapterNumber);
  if (!src) return null;

  return (
    <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-xl border border-white/10 bg-black/30">
      <Image
        src={src}
        alt={title}
        width={960}
        height={1280}
        className="h-auto w-full object-cover"
        sizes="(max-width: 640px) 240px, 280px"
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 챕터 본문 렌더러 — \n\n 단락 분리
// ════════════════════════════════════════════════════════════════════════════

function ChapterBody({ body }: { body: string }) {
  const paragraphs = body.split(/\n\n+/);
  return (
    <div className="space-y-3">
      {paragraphs.map((p, i) => (
        <p
          key={i}
          className="text-xs leading-loose text-foreground/70 whitespace-pre-wrap"
        >
          {p}
        </p>
      ))}
    </div>
  );
}
