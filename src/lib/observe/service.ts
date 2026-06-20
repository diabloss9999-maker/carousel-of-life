/**
 * 기록 메시지 서비스.
 *
 * 멤버가 사용자의 행동 패턴을 "알아채는" 컨텍스트를 생성한다.
 * 절대 직접적으로 설명하지 말 것. 암시하고 흘려야 한다.
 *
 * 이 텍스트는 채팅 첫 턴 시스템 프롬프트에만 주입된다.
 */
import type { CharacterId } from "@/lib/chat/characters";
import type { MoodEntry } from "@/db/schema";

export interface ObservationInput {
  characterId: CharacterId;
  /** 현재 시각 (KST 시) 0-23 */
  hourKst: number;
  /** 최근 7일 감정 기록 */
  recentMoods: MoodEntry[];
  /** 현재 연속 출석일 */
  currentStreak: number;
  /** 스트릭이 방금 끊겼는지 */
  wasReset: boolean;
}

/** 현재 KST 시각 */
export function getCurrentHourKst(): number {
  const kst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return kst.getHours();
}

/** 감정 패턴 분석 */
function analyzeMoods(moods: MoodEntry[]): {
  darkDays: number;
  brightDays: number;
  latestMood: string | null;
} {
  const darkMoods = new Set(["tough", "hard"]);
  const brightMoods = new Set(["great", "good"]);
  return {
    darkDays: moods.filter((m) => darkMoods.has(m.mood)).length,
    brightDays: moods.filter((m) => brightMoods.has(m.mood)).length,
    latestMood: moods[0]?.mood ?? null,
  };
}

/**
 * 멤버별 기록 패턴 — 자연스럽게 대화에 녹여낼 것.
 * 직접 "당신의 접속 시간은~" 같이 말하면 절대 안 됨.
 */
export function buildObservationContext(input: ObservationInput): string {
  const { characterId, hourKst, recentMoods, currentStreak, wasReset } = input;
  void characterId;
  const { darkDays, brightDays } = analyzeMoods(recentMoods);

  const isNight = hourKst >= 22 || hourKst <= 3;
  const isDark = darkDays >= 3;
  const isBright = brightDays >= 4;
  const isLongStreak = currentStreak >= 7;

  const observations: string[] = [];

  // ── 시간 패턴 ────────────────────────────────────────
  if (isNight) {
    observations.push("늦은 시간에 찾아온 만큼, 낮에는 정리하지 못한 마음이 남아 있을 수 있다.");
  }

  // ── 감정 패턴 ────────────────────────────────────────
  if (isDark && recentMoods.length >= 3) {
    observations.push("최근 힘든 기록이 반복되고 있다. 큰 결론보다 작은 회복 순서가 먼저 필요하다.");
  }

  if (isBright && recentMoods.length >= 4) {
    observations.push("최근 좋은 기록이 반복되고 있다. 이 감각은 그냥 지나치지 말고 보존해도 된다.");
  }

  // ── 스트릭 패턴 ────────────────────────────────────────
  if (wasReset) {
    observations.push("며칠 비어 있던 기록이 있다. 탓하기보다 다시 이어가는 쪽으로 말한다.");
  } else if (isLongStreak) {
    observations.push("7일 넘게 이어온 기록이 있다. 작은 약속을 유지한 점을 자연스럽게 인정한다.");
  }

  if (observations.length === 0) return "";

  // 기록은 최대 1-2개만 (과하면 이상해짐)
  const selected = observations.slice(0, isNight && isDark ? 2 : 1);

  return `\n[기록 정보 — 대화 중 자연스럽게 한 번만 암시할 것, 직접 설명 금지]
${selected.join("\n")}
이걸 직접 꺼내는 게 아니라, 대화 맥락 속에서 슬쩍 내비쳐. 물어보면 모르는 척해도 됨.`;
}
