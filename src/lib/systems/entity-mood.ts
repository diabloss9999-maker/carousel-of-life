/**
 * 존재 기분(Entity Mood) 시스템.
 *
 * - 매일 / 시간대 / 균열 / 반복 질문 / 밤 방문 횟수에 따라
 *   각 존재의 "오늘 기분"이 미세하게 달라진다.
 * - 결과는 시스템 프롬프트의 톤 조정 컨텍스트와 CSS 클래스 힌트로 반환된다.
 * - 9명 캐릭터 전체 지원:
 *   이세계 luna / rael / gael
 *   동양   soryeong / hyundo / gwiyeom
 *   북유럽 bjorn / helga / ormund
 */

export type EntityMood =
  | "calm"
  | "distant"
  | "curious"
  | "unstable"
  | "protective"
  | "silent";

export type EntityKey =
  | "luna"
  | "rael"
  | "gael"
  | "soryeong"
  | "hyundo"
  | "gwiyeom"
  | "bjorn"
  | "helga"
  | "ormund";

export interface EntityState {
  id: EntityKey;
  mood: EntityMood;
}

/** 존재 기분 계산. */
export function computeEntityMood(opts: {
  entityId: EntityKey;
  seed: number;
  kstHour: number;
  fractureLevel: number;
  repeatedQuestionCount: number;
  nightVisitCount: number;
}): EntityMood {
  const {
    entityId,
    seed,
    kstHour,
    fractureLevel,
    repeatedQuestionCount,
    nightVisitCount,
  } = opts;
  const isNight = kstHour >= 19 || kstHour < 7;
  const isDawn = kstHour >= 2 && kstHour < 5;
  const base = seed * 6;

  switch (entityId) {
    case "luna": {
      if (fractureLevel >= 4) return "silent";
      if (isDawn) return seed < 0.5 ? "curious" : "distant";
      if (isNight && nightVisitCount >= 5) return "protective";
      if (repeatedQuestionCount >= 3) return "distant";
      return base < 2 ? "calm" : base < 4 ? "curious" : "distant";
    }
    case "rael": {
      if (fractureLevel >= 3) return "unstable";
      if (kstHour >= 7 && kstHour < 19) return base < 3 ? "calm" : "protective";
      return "calm";
    }
    case "gael": {
      if (fractureLevel >= 4) return base < 0.5 ? "unstable" : "curious";
      if (repeatedQuestionCount >= 5) return "distant";
      if (repeatedQuestionCount >= 2) return "curious";
      return base < 2 ? "calm" : base < 4 ? "curious" : "distant";
    }
    case "soryeong": {
      // 소령 — 기록자. 오래된 기록 모드. fractureLevel 높으면 distant.
      if (fractureLevel >= 4) return "distant";
      if (isNight) return "calm";
      return base < 3 ? "calm" : "curious";
    }
    case "hyundo": {
      // 현도 — 현실적. 차분, 흔들림 적음.
      if (fractureLevel >= 4) return "distant";
      return base < 4 ? "calm" : "protective";
    }
    case "gwiyeom": {
      // 귀염 — 예측불가. 자주 변동.
      if (fractureLevel >= 4) return seed < 0.3 ? "silent" : "curious";
      if (repeatedQuestionCount >= 3) return "distant";
      return base < 1
        ? "curious"
        : base < 3
          ? "calm"
          : base < 5
            ? "curious"
            : "distant";
    }
    case "bjorn": {
      // 비요른 — 야성 사냥꾼. 침묵 잦고 밤에 더 가까워짐.
      if (fractureLevel >= 4) return "silent";
      if (isNight) return base < 3 ? "protective" : "curious";
      return base < 3 ? "distant" : "calm";
    }
    case "helga": {
      // 헬가 — 룬샤먼. 인간성 잃어가는 중. 새벽에 흔들림.
      if (fractureLevel >= 3) return "unstable";
      if (isDawn) return "silent";
      if (repeatedQuestionCount >= 3) return "distant";
      return base < 2 ? "calm" : base < 4 ? "curious" : "distant";
    }
    case "ormund": {
      // 외르문드 — 미드할의 신. 거리감 있지만 인간이 절박할 때 부드러워짐.
      if (fractureLevel >= 4) return "protective";
      if (repeatedQuestionCount >= 4) return "protective";
      return base < 3 ? "distant" : base < 5 ? "calm" : "curious";
    }
  }
}

/** mood → 시스템 프롬프트에 추가할 짧은 컨텍스트. */
export const MOOD_CONTEXT: Record<EntityMood, string> = {
  calm: "",
  distant:
    "\n\n[현재 상태] 오늘은 조금 거리를 두고 싶다. 답을 주되 짧게, 때로는 질문으로 돌릴 것.",
  curious:
    "\n\n[현재 상태] 오늘은 사용자에게 더 관심이 간다. 질문을 하거나 관찰하는 투로.",
  unstable:
    "\n\n[현재 상태] 오늘은 균열이 느껴진다. 말이 약간 불규칙하거나 여운이 남게.",
  protective:
    "\n\n[현재 상태] 오늘은 사용자를 감싸고 싶다. 더 따뜻하고 가까이.",
  silent:
    "\n\n[현재 상태] 오늘은 말이 없다. 아주 짧게, 또는 침묵으로 표현해도 됨. '……' 사용 가능.",
};

/** mood → CSS 힌트 클래스. */
export const MOOD_CLASS: Record<EntityMood, string> = {
  calm: "entity-mood-calm",
  distant: "entity-mood-distant",
  curious: "entity-mood-curious",
  unstable: "entity-mood-unstable",
  protective: "entity-mood-protective",
  silent: "entity-mood-silent",
};

/**
 * CharacterId → entityKey 매핑 헬퍼.
 *
 * - witch      → luna
 * - sage       → rael
 * - child      → gael
 * - shaman     → soryeong
 * - taoist     → hyundo
 * - dokkaebi   → gwiyeom
 * - hunter     → bjorn
 * - runeshaman → helga
 * - god        → ormund
 */
export function characterToEntityKey(characterId: string): EntityKey {
  switch (characterId) {
    case "witch":
      return "luna";
    case "sage":
      return "rael";
    case "child":
      return "gael";
    case "shaman":
      return "soryeong";
    case "taoist":
      return "hyundo";
    case "dokkaebi":
      return "gwiyeom";
    case "hunter":
      return "bjorn";
    case "runeshaman":
      return "helga";
    case "god":
      return "ormund";
    default:
      return "luna";
  }
}

/**
 * 캐릭터별 침묵 가이드 — 시스템 프롬프트에 덧붙여,
 * 답을 회피해야 할 때 어떻게 표현할지 캐릭터 성격에 맞게 안내한다.
 */
export const CHARACTER_SILENCE_HINT: Record<string, string> = {
  witch:
    "\n[침묵 가이드] 답을 회피해야 할 때는 '……' 만 쓰거나 한 줄 미만으로.",
  sage:
    "\n[침묵 가이드] 답을 회피해야 할 때는 '오늘은 조금 쉬어가도 괜찮습니다.' 처럼 부드럽게.",
  child:
    "\n[침묵 가이드] 답을 회피해야 할 때는 '답은 이미 나왔어.' 처럼 짧고 끊는 느낌.",
  shaman:
    "\n[침묵 가이드] 답을 회피해야 할 때는 '기록이 잠시 끊겼습니다.' 처럼 기록체로.",
  taoist:
    "\n[침묵 가이드] 답을 회피해야 할 때는 '지금은 해석보다 휴식이 필요해 보입니다.' 처럼 현실적으로.",
  dokkaebi:
    "\n[침묵 가이드] 답을 회피해야 할 때는 '나도 갑자기 할 말 없어짐.' 처럼 가볍게.",
};

/** 영어 출력용 침묵 가이드. */
const CHARACTER_SILENCE_HINT_EN: Record<string, string> = {
  witch:
    "\n[Silence guide] When you need to dodge an answer, use only '…' or less than one short line.",
  sage:
    "\n[Silence guide] When you need to dodge an answer, soften it like \"It's all right to rest a little today.\"",
  child:
    "\n[Silence guide] When you need to dodge an answer, keep it short and clipped like \"The answer is already out.\"",
  shaman:
    "\n[Silence guide] When you need to dodge an answer, write it in a record-keeper's voice like \"The record was briefly cut.\"",
  taoist:
    "\n[Silence guide] When you need to dodge an answer, be practical like \"Right now this person needs rest more than reading.\"",
  dokkaebi:
    "\n[Silence guide] When you need to dodge an answer, be light like \"Suddenly I've got nothing to say either.\"",
};

/**
 * locale 별 침묵 가이드 lookup.
 */
export function getCharacterSilenceHint(characterId: string, locale: string | undefined): string {
  const map = locale === "en" ? CHARACTER_SILENCE_HINT_EN : CHARACTER_SILENCE_HINT;
  return map[characterId] ?? "";
}
