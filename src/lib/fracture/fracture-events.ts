/**
 * 흐림 연출 시스템 — 이벤트 정의 및 확률 계산.
 */

import type { FractureState } from "./fracture-state";

/** 텍스트 순간 교체 이벤트 쌍 — 페이지에 data-fracture 속성을 부여한 엘리먼트를 타겟으로. */
export const TEXT_SWAP_PAIRS: ReadonlyArray<{
  selector: string;
  original: string;
  swapped: string;
}> = [
  {
    selector: '[data-fracture="today-title"]',
    original: "오늘의 흐름",
    swapped: "오늘의 흐림",
  },
  {
    selector: '[data-fracture="history-title"]',
    original: "기록 기록",
    swapped: "기억 누락",
  },
  {
    selector: '[data-fracture="chat-title"]',
    original: "대화의 방",
    swapped: "응답하지 마",
  },
  {
    selector: '[data-fracture="luna-memory"]',
    original: "루나는 당신을 기억합니다",
    swapped: "루나는 아직 떠나지 않았습니다",
  },
];

/** 화면 구석에 나타나는 숨겨진 문장. */
export const WHISPER_MESSAGES: ReadonlyArray<string> = [
  "당신은 다시 돌아왔습니다.",
  "같은 질문이 반복되고 있습니다.",
  "루나는 침묵도 기억합니다.",
  "오늘의 빛이 잠시 어긋났습니다.",
  "기록되지 않은 선택이 있습니다.",
  "결가 당신을 기다리고 있어.",
  "이 시간에 오는 사람은 드뭅니다.",
];

/** 채팅 입력창 placeholder 변형. */
export function getPlaceholder(state: FractureState, isNight: boolean): string {
  if (state.level >= 70) return "문장이 조금 어긋나고 있습니다";
  if (state.repeatedQuestionCount >= 3) return "같은 문 앞에 다시 서 있습니다";
  if (state.visitCount >= 3) return "당신은 다시 돌아왔습니다";
  if (isNight) return "밤의 기록은 조금 다르게 응답합니다";
  return "지금 떠오른 것을 조용히 남기세요";
}

/** 흐림 발생 확률 반환 (0~1). */
export function getFractureChance(state: FractureState, isNight: boolean): number {
  if (state.level >= 80) return 0.08;
  if (state.level >= 50) return 0.05;
  if (isNight) return 0.03;
  return 0.01;
}

/** 랜덤 whisper 메시지 선택 (lastEventType 과 다른 것). */
export function pickWhisper(state: FractureState): string {
  const pool = WHISPER_MESSAGES.filter((m) => m !== state.lastEventType);
  if (pool.length === 0) return WHISPER_MESSAGES[0];
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx] ?? WHISPER_MESSAGES[0];
}
