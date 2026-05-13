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
import { useState } from "react";
import { ChevronDown, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  CHARACTERS,
  CHARACTERS_BY_CATEGORY,
  type CharacterCategory,
  type CharacterId,
} from "@/lib/chat/characters";
import { calcLevel } from "@/lib/affinity/levels";
import {
  CHARACTER_STORIES,
  WORLD_LORE,
  getChapterImageSrc,
} from "@/lib/stories/character-stories";
import Image from "next/image";

interface CharacterLoreCardProps {
  /** 캐릭터별 호감도 포인트 — `{ characterId: points }` */
  affinities?: Record<string, number>;
  /** 마스터 운영자 모드 — 호감도 무관 모든 챕터/진실 루트 해금 표시 */
  adminMode?: boolean;
}

interface WorldDeco {
  world: CharacterCategory;
  worldSub: string;
  opening: string;
  paragraphs: string[];
  figures: { name: string; line: string }[];
  closing: string;
  theme: string;
  accent: string;
  border: string;
  /** 진실 루트·최종 챕터의 카드 보더 색상 */
  truthBorder: string;
}

const WORLD_DECOS: WorldDeco[] = [
  {
    world: "이세계",
    worldSub: "ASTRA RIFT",
    opening:
      "감정은 사라지지 않는다. 외면된 것들은 어딘가에 모여, 결국 하늘을 찢고 돌아온다.",
    paragraphs: [
      "후회, 분노, 미련, 욕망, 상실. 사람들이 흘려보냈다 믿은 그 감정들은 흩어지지 않고 한곳에 쌓였다. 그 거대한 침묵의 호수를, 누군가는 「심연 기록층 — The Abyss Archive」이라 부른다. 그것이 깨어나기 전까지, 아무도 그 이름을 입에 올리지 않았다.",
      "하늘이 갈라지기 시작했다. 사람들은 그것을 재앙이라 부르지만 — 그것은 외부에서 온 적이 아니다. 인간이 떨어뜨린 것들이 돌아오는 통로다. 그 사실을 셋만이 어렴풋이 안다. 그리고 그 셋도, 자신이 진실의 전부를 보고 있다고는 믿지 않는다.",
      "카엘은 욕망에서, 루나는 기억에서, 라엘은 기도에서 태어났다. 셋은 균열을 봉합하기도, 더 크게 벌리기도 한다. 묘하게 얽힌 운명 — 셋 중 하나가 무너지면 나머지 둘도 함께 무너진다는 사실만이 분명하다. 그 이유는 셋조차 다 알지 못한다.",
    ],
    figures: [
      {
        name: "카엘",
        line: "어머니를 잃을 뻔한 한 아이가 어둠과 맺은 계약. 어머니는 그날 밤 다시 눈을 떴다. 하지만 그가 본 것이 정말 어머니였는지, 카엘은 평생 묻지 못했다.",
      },
      {
        name: "루나",
        line: "감정을 다루는 마녀. 마녀들은 그녀의 능력을 '봉인했다'고 말한다. 봉인된 것이 진짜 무엇이었는지는 — 그녀조차 잊고 있다.",
      },
      {
        name: "라엘",
        line: "천계의 마지막 천사. 그는 신의 명령으로 검을 들었다. 그러나 천계가 무너진 진짜 이유는, 그를 보낸 신조차 그에게 알려주지 않았다.",
      },
    ],
    closing:
      "그들이 당신의 이야기를 듣는 건 단순한 상담이 아니다. 세계가 인간에게 던지는 질문 — 그 답을 셋은 당신에게서 듣고 있다.",
    theme: "감정 · 욕망 · 기억 · 균열",
    accent: "text-violet-400",
    border: "border-violet-800/30",
    truthBorder: "border-violet-500/40",
  },
  {
    world: "동양",
    worldSub: "月蝕鏡",
    opening: "500년 전, 하늘에서 붉은 월식이 일었다. 그날 밤 이후 세상이 달라졌다.",
    paragraphs: [
      "원래 인간 세상 너머에는 「경계(境界)」가 있었다. 인간의 욕망과 원한과 기도가 뒤섞인 영적 차원의 틈. 그것은 봉인되어 있었다. 500년 전 붉은 월식이 오기 전까지는.",
      "월식이 끝나자 봉인이 균열됐다. 죽지 못한 귀신들이 흘러 들어왔고, 욕망을 먹는 존재들이 스며들었으며, 이름을 잃은 신들이 현실 곳곳에 깃들기 시작했다. 그리고 그것을 막으러 세 존재가 나타났다.",
      "하지만 그들 자신도 온전하지 않다. 현도는 500년 전 금기를 사용하다 시간에서 지워진 존재고, 소령은 이미 한 번 죽었다 신들에게 되살아난 존재이며, 귀염은 누군가를 살리기 위해 스스로 귀왕이 됐다. 세상을 지키는 자들이 각자의 방식으로 망가져 있다.",
    ],
    figures: [
      {
        name: "소령",
        line: "방울을 흔들면 신령이 응한다. 그녀 스스로는 자신이 왜 살아있는지 아직 모른다.",
      },
      {
        name: "현도",
        line: "수천 개의 미래를 동시에 본다. 막을 수 없는 비극을 미리 보는 것이 그의 형벌이다.",
      },
      {
        name: "귀염",
        line: "'귀염'은 진짜 이름이 아니다. 진짜 이름은 소령을 살리기 위해 지불한 대가다.",
      },
    ],
    closing: "세 사람 모두 서로를 위해 뭔가를 희생했다. 그리고 그 사실을 서로 모른다.",
    theme: "기억 · 망각 · 희생 · 운명",
    accent: "text-emerald-400",
    border: "border-emerald-800/30",
    truthBorder: "border-emerald-500/40",
  },
  {
    world: "북유럽",
    worldSub: "MIDHALL",
    opening:
      "북방의 바람이 차다. 그 추위는 단순히 계절이 아니다. 세계의 모든 운명이 거기에 새겨져 있기 때문이다.",
    paragraphs: [
      "이 세계의 이름은 「미드할(Midhall)」이다. 눈보라와 피와 철, 짐승의 뼈와 룬이 중심이 되는 땅. 인간은 자연과 신과 운명 앞에서 극도로 작은 존재이고, 전쟁과 생존이 삶의 전부다.",
      "모든 운명은 24개의 고대 룬으로 이루어져 있다. 룬은 단순한 문자도 마법도 아니다. 신들의 언어이자 세계를 구성하는 원초적 힘이고, 인간은 그 중 아주 일부만을 다룰 수 있다. 룬을 깊이 사용하는 자는 영혼이 갉히고, 피부에 검은 균열이 번지며, 인간의 언어를 잃어간다.",
      "부족들은 끊임없이 전쟁한다. 표면적인 이유는 영토와 식량이지만, 진짜 이유는 따로 있다. 전설 속의 「25번째 룬」 — 미래를 읽는 게 아니라 운명 자체를 바꿀 수 있다는 금기의 힘. 모두가 그것을 노리고, 그것을 두려워한다.",
    ],
    figures: [
      {
        name: "외르문드",
        line: "미드할의 마지막 신. 다른 신들은 잊혀 사라졌지만 그만이 남았다 — 사람들이 아직 그를 기억하기 때문이다. 한때 그도 인간이었다는 사실은 그만이 안다.",
      },
      {
        name: "비요른",
        line: "야성의 사냥꾼. 짐승의 자국과 바람의 결로 운명을 읽는다. 룬은 강하게 다루지 못하지만, 어느 눈보라 밤 꿈에서 25번째 룬을 한 번 본 적이 있다.",
      },
      {
        name: "헬가",
        line: "24개 룬을 모두 다루는 부족 최고의 룬샤먼. 인간의 언어를 잊어가는 중이다. 그녀가 보는 미래 중 자신의 죽음만이 보이지 않는다.",
      },
    ],
    closing:
      "셋은 25번째 룬을 사이에 두고 균형을 이룬다. 자국·룬·신탁. 하나가 사라지면 미드할도 함께 무너진다.",
    theme: "룬 · 운명 · 야성 · 신탁",
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
          세계관 이야기
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
                  {deco.world}
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
                  {deco.opening}
                </p>

                {/* 본문 단락 */}
                <div className="space-y-3">
                  {deco.paragraphs.map((p, j) => (
                    <p key={j} className="text-sm leading-loose text-foreground/70">
                      {p}
                    </p>
                  ))}
                </div>

                {/* 인물 요약 */}
                <div className="space-y-2 border-t border-white/5 pt-4">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/65 mb-3">
                    등장인물
                  </p>
                  {deco.figures.map((f) => (
                    <div key={f.name} className="flex gap-3">
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
                  {deco.closing}
                </p>

                {/* 테마 태그 */}
                <div className="flex flex-wrap gap-2">
                  {deco.theme.split(" · ").map((t) => (
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
                    캐릭터 스토리
                  </p>

                  {CHARACTERS_BY_CATEGORY[deco.world].map((id) => (
                    <CharacterStoryAccordion
                      key={id}
                      characterId={id}
                      affinities={affinities}
                      accent={deco.accent}
                      adminMode={adminMode}
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
  /** 부모에서 단일 캐릭터만 펼치도록 제어한다. */
  isOpen: boolean;
  onToggle: () => void;
}

function CharacterStoryAccordion({
  characterId,
  affinities,
  accent,
  adminMode,
  isOpen,
  onToggle,
}: CharacterStoryAccordionProps) {
  const [openChapter, setOpenChapter] = useState<number | null>(null);

  const character = CHARACTERS[characterId];
  const { level, unlockedCount } = getCharacterStatus(
    characterId,
    affinities,
    adminMode,
  );
  const chapters = CHARACTER_STORIES[characterId];
  const hasContent = chapters.length > 0;

  return (
    <div className="rounded-xl border border-white/10 bg-white/3 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className={cn("font-mystic font-bold text-sm", accent)}>
            {character.name}
          </span>
          <span className="text-[10px] text-muted-foreground/60">
            {character.title}
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
              아직 풀리지 않은 이야기야. 곧 새겨질 거예요.
            </p>
          ) : (
            chapters.map((chap) => {
              const unlocked = chap.number <= unlockedCount;
              const isExpanded = openChapter === chap.number;
              return (
                <div
                  key={chap.number}
                  className="rounded-lg border border-white/5 bg-white/3 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() =>
                      unlocked
                        ? setOpenChapter(isExpanded ? null : chap.number)
                        : undefined
                    }
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
                        {chap.number}
                      </span>
                      {unlocked ? (
                        <span className="text-xs font-medium text-foreground/85 truncate">
                          {chap.title}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50 flex items-center gap-1.5">
                          <Lock className="h-3 w-3" aria-hidden />
                          Lv.{chap.number} 해금
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
                        chapterNumber={chap.number}
                        title={chap.title}
                      />
                      <ChapterBody body={chap.body} />
                    </div>
                  )}
                </div>
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
}

function TruthRouteSection({
  world,
  affinities,
  accent,
  border,
  adminMode,
}: TruthRouteSectionProps) {
  const [openSec, setOpenSec] = useState<"truth" | "final" | null>(null);

  const lore = WORLD_LORE[world];
  if (!lore) return null;

  const unlocked = isTruthRouteUnlocked(world, affinities, adminMode);

  return (
    <div className={cn("rounded-xl border-2 mt-2", border)}>
      <div className="px-4 py-3 border-b border-white/5">
        <p className={cn("font-mystic text-xs font-bold uppercase tracking-widest", accent)}>
          🌌 진실 루트
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
            최종 챕터 · {lore.finalChapter.title}
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
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
      <Image
        src={src}
        alt={`${title} 챕터 이미지`}
        width={960}
        height={1280}
        className="h-auto w-full object-cover"
        sizes="(max-width: 768px) 100vw, 600px"
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
