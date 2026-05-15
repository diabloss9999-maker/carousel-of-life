"use client";

/**
 * 기억 보관소 — 세계가 사용자에 대해 기억하고 있는 것들.
 */
import { useTranslations } from "next-intl";
import { useEntityMemory } from "@/hooks/use-entity-memory";
import { CHARACTERS, type CharacterId } from "@/lib/chat/characters";
import type { CharacterAffinity } from "@/db/schema";
import type { CrackLevel } from "@/lib/crack/service";
import { PersonalizedObservation } from "@/components/world/personalized-observation";

/** 오래된 기록으로 분류할 visitCount 기준. */
const OLD_MEMORY_THRESHOLD = 15;
/** 더 깊은 균열 관측 카드에 흐릿함을 부여할 기준. */
const ANCIENT_FRACTURE_THRESHOLD = 5;

interface ArchivePanelProps {
  affinities: CharacterAffinity[];
  crackLevel: CrackLevel;
}

/** 친밀도 목록에서 가장 깊은 인연의 캐릭터를 고른다. (id 만 반환, 표시 이름은 i18n에서) */
function pickClosestEntityId(
  affinities: CharacterAffinity[],
): { id: CharacterId; points: number } | null {
  if (affinities.length === 0) return null;
  const sorted = [...affinities].sort((a, b) => b.points - a.points);
  const top = sorted[0];
  if (!top || top.points <= 0) return null;
  const character = CHARACTERS[top.characterId as CharacterId];
  if (!character) return null;
  return { id: top.characterId as CharacterId, points: top.points };
}

interface ArchiveCardProps {
  title: string;
  body: string;
  aged?: boolean;
  ancient?: boolean;
}

function ArchiveCard({ title, body, aged, ancient }: ArchiveCardProps) {
  const classes = [
    "app-surface rounded-xl p-4 space-y-1.5",
    aged ? "old-memory" : "",
    ancient ? "ancient-record" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classes}>
      <p className="text-[15px] uppercase tracking-widest text-muted-foreground/70">
        {title}
      </p>
      <p className="text-[15px] leading-relaxed text-foreground/85">{body}</p>
    </div>
  );
}

export function ArchivePanel({ affinities, crackLevel }: ArchivePanelProps) {
  const { memory, isDawn } = useEntityMemory();
  const t = useTranslations("archivePanel");
  const tChar = useTranslations("characters");
  const closest = pickClosestEntityId(affinities);
  const aged = memory.visitCount >= OLD_MEMORY_THRESHOLD;
  const ancient = memory.fractureEventsWitnessed >= ANCIENT_FRACTURE_THRESHOLD;

  const closestName = closest ? tChar(`${closest.id}.name`) : null;

  function crackPhrase(level: CrackLevel): string {
    switch (level) {
      case 0: return t("boundaryStableLong");
      case 1: return t("boundaryWaveLong");
      case 2: return t("boundaryFractureLong");
      case 3: return t("boundaryDangerLong");
      case 4: return t("boundaryImminentLong");
    }
  }

  return (
    <div className="space-y-6">
      {isDawn ? (
        <p
          aria-hidden
          className="text-[15px] tracking-[0.18em] text-muted-foreground/60 italic"
        >
          {t("dawnRecordOpen")}
        </p>
      ) : null}

      <PersonalizedObservation />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ArchiveCard
          title={t("sectionObserve")}
          aged={aged}
          body={
            memory.visitCount <= 1
              ? t("observedNew")
              : t("observedCount", { n: memory.visitCount })
          }
        />

        <ArchiveCard
          title={t("sectionNight")}
          aged={aged}
          body={
            memory.nightVisitCount === 0
              ? t("nightNone")
              : t("nightCount", { n: memory.nightVisitCount })
          }
        />

        <ArchiveCard
          title={t("sectionDawn")}
          aged={aged}
          body={
            memory.dawnVisitCount === 0
              ? t("dawnNone")
              : t("dawnCount", { n: memory.dawnVisitCount })
          }
        />

        <ArchiveCard
          title={t("sectionFracture")}
          ancient={ancient}
          body={
            memory.fractureEventsWitnessed === 0
              ? t("fractureNone")
              : t("fractureCount", { n: memory.fractureEventsWitnessed })
          }
        />

        <ArchiveCard
          title={t("sectionClosest")}
          body={
            closestName
              ? t("closestRemember", { name: closestName })
              : t("closestNone")
          }
        />

        <ArchiveCard
          title={t("sectionStatus")}
          body={crackPhrase(crackLevel)}
        />
      </div>

      <div className="app-surface rounded-xl p-4 space-y-1.5">
        <p className="text-[15px] uppercase tracking-widest text-muted-foreground/70">
          {t("result")}
        </p>
        <p className="font-mystic text-lg tracking-tight text-foreground/90">
          {memory.patternName ?? t("memoryFallback")}
        </p>
        <p className="text-[15px] leading-relaxed text-muted-foreground/80">
          {t("memoryHint")}
        </p>
      </div>
    </div>
  );
}
