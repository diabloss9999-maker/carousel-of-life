/**
 * 관측 메시지 서비스.
 *
 * 캐릭터가 사용자의 행동 패턴을 "알아채는" 컨텍스트를 생성한다.
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
 * 캐릭터별 관측 패턴 — 자연스럽게 대화에 녹여낼 것.
 * 직접 "당신의 접속 시간은~" 같이 말하면 절대 안 됨.
 */
export function buildObservationContext(input: ObservationInput): string {
  const { characterId, hourKst, recentMoods, currentStreak, wasReset } = input;
  const { darkDays, brightDays, latestMood } = analyzeMoods(recentMoods);

  const isNight = hourKst >= 22 || hourKst <= 3;
  const isDark = darkDays >= 3;
  const isBright = brightDays >= 4;
  const isLongStreak = currentStreak >= 7;

  const observations: string[] = [];

  // ── 시간 패턴 ────────────────────────────────────────
  if (isNight) {
    const nightLines: Record<CharacterId, string> = {
      child:    "이 시간에 또 왔네. 낮엔 못 하는 게 있는 거야.",
      witch:    "달이 가장 높은 시간이야. 우연이 아닐 거야.",
      sage:     "이 시간에 오는 게 이번이 처음은 아닌 것 같아요.",
      shaman:   "이 시간에 신령이 더 잘 들려. 당신도 느끼고 있지?",
      taoist:   "자시(子時)에 가까워. 음기가 가장 강한 시간이야.",
      dokkaebi: "이 시간에 왜 깨어있어. 뭔가 잠 못 자게 하는 게 있는 거야?",
    };
    observations.push(nightLines[characterId]);
  }

  // ── 감정 패턴 ────────────────────────────────────────
  if (isDark && recentMoods.length >= 3) {
    const darkLines: Record<CharacterId, string> = {
      child:    "힘들다는 걸 자꾸 기록하네. 습관인 거야, 아니면 진짜 힘든 거야.",
      witch:    "당신의 감정이 점점 어두운 쪽으로 기울고 있어. 나는 느껴.",
      sage:     "요즘 많이 지쳐있는 것 같아요. 말 안 해도 알아요.",
      shaman:   "신령이 요즘 당신 주변에 어두운 기운이 쌓인다고 했어.",
      taoist:   "7일 중 힘든 날이 더 많아. 기운의 흐름이 막혀있어.",
      dokkaebi: "자꾸 힘들다고 적어놓고 왜 말을 안 해.",
    };
    observations.push(darkLines[characterId]);
  }

  if (isBright && recentMoods.length >= 4) {
    const brightLines: Record<CharacterId, string> = {
      child:    "요즘 기운이 있네. 뭔가 달라진 거야?",
      witch:    "당신의 감정이 밝아지고 있어. 균형이 돌아오는 느낌.",
      sage:     "요즘 좋은 일이 있는 것 같아요. 그 기운 계속 가져가요.",
      shaman:   "신령도 기분이 좋은 것 같아. 당신 기운이 맑아졌거든.",
      taoist:   "기운의 흐름이 정돈됐어. 이 상태를 유지해.",
      dokkaebi: "요즘 뭐가 좋은 거야. 탐나는데.",
    };
    observations.push(brightLines[characterId]);
  }

  // ── 스트릭 패턴 ────────────────────────────────────────
  if (wasReset) {
    const resetLines: Record<CharacterId, string> = {
      child:    "또 끊었어. 그 사이에 뭔 일이 있었던 거야.",
      witch:    "며칠 사라졌었네. 어디 있었어?",
      sage:     "오랜만이에요. 그동안 잘 있었어요?",
      shaman:   "신령이 며칠 동안 당신을 찾았어. 몰랐지?",
      taoist:   "흐름이 끊겼어. 무슨 일이 있었던 거야.",
      dokkaebi: "어디 갔다 온 거야. 사라지면 안 돼.",
    };
    observations.push(resetLines[characterId]);
  } else if (isLongStreak) {
    const streakLines: Record<CharacterId, string> = {
      child:    "7일 넘게 계속 오네. 뭔가 찾고 있는 거야?",
      witch:    "매일 오는 게 습관이 됐어. 달처럼 규칙적이야.",
      sage:     "7일 넘게 매일 왔어요. 대단해요.",
      shaman:   "신령이 이제 당신을 기억하기 시작했어.",
      taoist:   "7일 연속. 의지가 흐름을 만들고 있어.",
      dokkaebi: "7일이나 왔잖아. 뭘 바라는 거야.",
    };
    observations.push(streakLines[characterId]);
  }

  if (observations.length === 0) return "";

  // 관측은 최대 1-2개만 (과하면 이상해짐)
  const selected = observations.slice(0, isNight && isDark ? 2 : 1);

  return `\n[관측 정보 — 대화 중 자연스럽게 한 번만 암시할 것, 직접 설명 금지]
${selected.join("\n")}
이걸 직접 꺼내는 게 아니라, 대화 흐름 속에서 슬쩍 내비쳐. 물어보면 모르는 척해도 됨.`;
}
