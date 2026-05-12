/**
 * 개인화 관측(Personal Observation) — 사용자 패턴 기반 단일 문장.
 *
 * 우선순위에 따라 한 줄만 반환한다. 어떤 조건에도 해당하지 않으면 null.
 * 게임화 금지 — 숫자 노출 없이 분위기 문장으로만 표현한다.
 */
import type { EntityMemory } from "@/lib/entity/entity-memory";
import type { FractureState } from "@/lib/fracture/fracture-state";

/** 패턴 도출에 사용하는 임계값들. */
const DAWN_VISIT_THRESHOLD = 5;
const REPEATED_QUESTION_THRESHOLD = 5;
const NIGHT_VISIT_THRESHOLD = 10;
const LONG_SESSION_MINUTES = 20;
const TOTAL_VISIT_THRESHOLD = 20;
const FRACTURE_WITNESS_THRESHOLD = 3;

/**
 * 사용자 패턴 기반 개인화 관측 문장을 만든다.
 * 어떤 패턴에도 해당하지 않으면 null.
 */
export function buildPersonalObservation(
  m: EntityMemory,
  f: FractureState,
): string | null {
  if (m.dawnVisitCount >= DAWN_VISIT_THRESHOLD) {
    return "새벽 방문 시간이 점점 길어지고 있습니다.";
  }
  if (f.repeatedQuestionCount >= REPEATED_QUESTION_THRESHOLD) {
    return "같은 감정 주변을 반복적으로 맴돌고 있습니다.";
  }
  if (m.nightVisitCount >= NIGHT_VISIT_THRESHOLD) {
    return "당신은 밤의 흐름을 더 오래 기억합니다.";
  }
  if (m.longestSessionMinutes >= LONG_SESSION_MINUTES) {
    return "당신은 마지막 문장을 오래 바라보는 경향이 있습니다.";
  }
  if (m.visitCount >= TOTAL_VISIT_THRESHOLD) {
    return "당신의 기록은 세계 깊은 곳에 남아 있습니다.";
  }
  if (m.fractureEventsWitnessed >= FRACTURE_WITNESS_THRESHOLD) {
    return "당신은 답보다 분위기를 더 오래 기억합니다.";
  }
  return null;
}
