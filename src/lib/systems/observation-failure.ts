/**
 * 기록 실패(Observation Failure) — 흐림이 깊어진 새벽에 드물게 발생하는 미세 글리치.
 *
 * 공포가 아니라 "오늘은 흐름이 잘 보이지 않는다" 정도의 조용한 메시지.
 * 흐림 수치 + 시간대에 따라 확률이 결정된다.
 */

export interface ObservationFailureOpts {
  /** 흐림 누적 수치 (0~100). */
  fractureLevel: number;
  /** KST 기준 현재 시(0~23). */
  kstHour: number;
}

/** 새벽 시간대 범위 (KST). */
const DAWN_HOUR_START = 2;
const DAWN_HOUR_END = 5;

/** 흐림 수치 임계값. */
const HIGH_FRACTURE = 4;
const MID_FRACTURE = 3;

/** 발생 확률. */
const DAWN_HIGH_PROBABILITY = 0.05;
const MID_PROBABILITY = 0.02;

const FAILURE_LINES = [
  "오늘은 흐름이 잘 보이지 않습니다.",
  "기록이 지나치게 흐립니다.",
  "응답이 안정적으로 남지 않습니다.",
  "당신의 흔적 일부를 놓쳤습니다.",
];

/** 기록 실패가 일어나야 하는지 판정한다. */
export function shouldFail(opts: ObservationFailureOpts): boolean {
  const { fractureLevel, kstHour } = opts;
  const isDawn = kstHour >= DAWN_HOUR_START && kstHour < DAWN_HOUR_END;
  if (fractureLevel >= HIGH_FRACTURE && isDawn) {
    return Math.random() < DAWN_HIGH_PROBABILITY;
  }
  if (fractureLevel >= MID_FRACTURE) {
    return Math.random() < MID_PROBABILITY;
  }
  return false;
}

/** 실패 메시지 풀에서 무작위로 한 줄을 선택한다. */
export function pickFailureLine(): string {
  const idx = Math.floor(Math.random() * FAILURE_LINES.length);
  return FAILURE_LINES[idx] ?? FAILURE_LINES[0]!;
}
