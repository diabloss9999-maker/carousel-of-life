/**
 * 존재 관계(Entity Relations) — 세 존재(루나/라엘/가엘)의 영향력 도출.
 *
 * 새 저장소 없이 entity-memory + fracture-state 로부터 파생값만 계산한다.
 * 한 존재가 압도적일 때 다른 존재들의 미세한 견제(jealousy)를 표현한다.
 */
import type { EntityMemory } from "@/lib/entity/entity-memory";
import type { FractureState } from "@/lib/fracture/fracture-state";

export interface EntityRelation {
  /** 0~1 사이 정규화된 영향력. */
  lunaInfluence: number;
  /** 0~1 사이 정규화된 영향력. */
  raelInfluence: number;
  /** 0~1 사이 정규화된 영향력. */
  gaelInfluence: number;
  /** 압도적(>55%) 존재. 없으면 null. */
  dominant: "luna" | "rael" | "gael" | null;
  /** 한 명이 압도적일 때 다른 존재들의 견제 메시지. */
  jealousyNote: string | null;
}

/** dominant 판정 임계값. */
const DOMINANCE_THRESHOLD = 0.55;

/**
 * 세 존재의 현재 영향력과 압도 여부를 계산한다.
 *
 * @param memory 존재 기억 (대화 횟수 등)
 * @param fracture 흐림 상태 (흐림 수치, 반복 질문 등)
 */
export function computeEntityRelation(
  memory: EntityMemory,
  fracture: FractureState,
): EntityRelation {
  const total =
    memory.lunaInteractions +
    memory.raelInteractions +
    memory.gaelInteractions +
    1;

  const luna =
    (memory.lunaInteractions + memory.nightVisitCount * 0.5) / total;
  const rael =
    (memory.raelInteractions + Math.max(0, 10 - fracture.level) * 0.3) / total;
  const gael =
    (memory.gaelInteractions +
      fracture.repeatedQuestionCount * 0.4 +
      fracture.level * 0.3) /
    total;

  const sum = luna + rael + gael || 1;
  const L = luna / sum;
  const R = rael / sum;
  const G = gael / sum;

  let dominant: EntityRelation["dominant"] = null;
  let jealousyNote: string | null = null;

  if (L > DOMINANCE_THRESHOLD) {
    dominant = "luna";
    jealousyNote = "요즘은 루나의 말을 더 오래 듣는군.";
  } else if (R > DOMINANCE_THRESHOLD) {
    dominant = "rael";
    jealousyNote = "라엘은 당신을 지나치게 안정시키려 합니다.";
  } else if (G > DOMINANCE_THRESHOLD) {
    dominant = "gael";
    jealousyNote = "가엘은 최근 자주 끼어들고 있습니다.";
  }

  return {
    lunaInfluence: L,
    raelInfluence: R,
    gaelInfluence: G,
    dominant,
    jealousyNote,
  };
}
