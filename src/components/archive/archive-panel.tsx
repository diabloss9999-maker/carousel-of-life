"use client";

/**
 * 기억 보관소 — 세계가 사용자에 대해 기억하고 있는 것들.
 *
 * 핵심 원칙:
 *  - 게임화 금지. 숫자 직접 노출 최소화.
 *  - 문장형 표현 ("X번" → "X회 기억합니다").
 *  - 균열 수치는 문자로만 ("안정" / "파동" / "균열").
 */
import { useEntityMemory } from "@/hooks/use-entity-memory";
import { CHARACTERS, type CharacterId } from "@/lib/chat/characters";
import type { CharacterAffinity } from "@/db/schema";
import type { CrackLevel } from "@/lib/crack/service";

interface ArchivePanelProps {
  affinities: CharacterAffinity[];
  crackLevel: CrackLevel;
}

/** 균열 수치를 문자로 표현한다 — 절대 숫자로 노출하지 않는다. */
function crackPhrase(level: CrackLevel): string {
  switch (level) {
    case 0:
      return "경계는 안정적입니다.";
    case 1:
      return "미세한 파동이 느껴집니다.";
    case 2:
      return "균열이 깊어지고 있습니다.";
    case 3:
      return "무명의 기운이 스며들고 있습니다.";
    case 4:
      return "이름 없는 것이 깨어나려 합니다.";
  }
}

/** 친밀도 목록에서 가장 깊은 인연의 캐릭터를 고른다. */
function pickClosestEntity(
  affinities: CharacterAffinity[],
): { name: string; points: number } | null {
  if (affinities.length === 0) return null;
  const sorted = [...affinities].sort((a, b) => b.points - a.points);
  const top = sorted[0];
  if (!top || top.points <= 0) return null;
  const character = CHARACTERS[top.characterId as CharacterId];
  if (!character) return null;
  return { name: character.name, points: top.points };
}

interface ArchiveCardProps {
  title: string;
  body: string;
}

function ArchiveCard({ title, body }: ArchiveCardProps) {
  return (
    <div className="app-surface rounded-xl p-4 space-y-1.5">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
        {title}
      </p>
      <p className="text-sm leading-relaxed text-foreground/85">{body}</p>
    </div>
  );
}

export function ArchivePanel({ affinities, crackLevel }: ArchivePanelProps) {
  const { memory, isDawn } = useEntityMemory();
  const closest = pickClosestEntity(affinities);

  return (
    <div className="space-y-6">
      {isDawn ? (
        <p
          aria-hidden
          className="text-[11px] tracking-[0.18em] text-muted-foreground/60 italic"
        >
          새벽의 기록을 열람 중입니다.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ArchiveCard
          title="관측"
          body={
            memory.visitCount <= 1
              ? "경계가 당신을 처음으로 인식했습니다."
              : `경계가 ${memory.visitCount}회 당신을 관측했습니다.`
          }
        />

        <ArchiveCard
          title="야간 관측"
          body={
            memory.nightVisitCount === 0
              ? "아직 밤에 머문 흔적은 없습니다."
              : `루나는 당신의 야간 방문을 ${memory.nightVisitCount}회 기억합니다.`
          }
        />

        <ArchiveCard
          title="새벽의 기록"
          body={
            memory.dawnVisitCount === 0
              ? "새벽의 경계에서 마주친 적은 없습니다."
              : `새벽의 경계가 당신을 ${memory.dawnVisitCount}회 마주했습니다.`
          }
        />

        <ArchiveCard
          title="균열 목격"
          body={
            memory.fractureEventsWitnessed === 0
              ? "아직 균열을 목격한 적이 없습니다."
              : `균열이 당신 앞에 ${memory.fractureEventsWitnessed}회 모습을 드러냈습니다.`
          }
        />

        <ArchiveCard
          title="가장 가까운 존재"
          body={
            closest
              ? `${closest.name}이(가) 당신을 가장 깊이 기억합니다.`
              : "아직 어느 존재도 당신을 깊이 기억하지 못합니다."
          }
        />

        <ArchiveCard
          title="경계의 상태"
          body={crackPhrase(crackLevel)}
        />
      </div>

      <div className="app-surface rounded-xl p-4 space-y-1.5">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
          관측 결과
        </p>
        <p className="font-mystic text-lg tracking-tight text-foreground/90">
          {memory.patternName ?? "경계의 관측자"}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground/80">
          이 이름은 당신이 남긴 흔적들로부터 경계가 도출한 호칭입니다.
        </p>
      </div>
    </div>
  );
}
