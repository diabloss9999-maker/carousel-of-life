/**
 * 숨겨진 조건 이벤트.
 *
 * 이벤트는 조용히 일어난다.
 * 알림도 없고, 설명도 없다.
 * 사용자가 스스로 발견해야 한다.
 *
 * locale 별로 두 종류의 출력이 갈린다:
 * - `eventContext` (AI system prompt 주입) — 캐릭터가 자연스럽게 흘릴 quoted line
 *   을 locale 언어로 작성해 모델 출력이 KO 강제되지 않게 한다.
 * - `homeHiddenText` (UI 직접 렌더) — 홈 화면에서 보여줄 텍스트.
 */
import type { CharacterId } from "@/lib/chat/characters";
import type { CrackLevel } from "@/lib/crack/service";

/** 음력 보름달 근사 계산 (천문학적 정확도 불필요) */
function isFullMoon(): boolean {
  const BASE_FULL_MOON = new Date("2024-01-25T00:00:00Z").getTime();
  const LUNAR_CYCLE_MS = 29.53 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const elapsed = (now - BASE_FULL_MOON) % LUNAR_CYCLE_MS;
  const distFromFull = Math.min(elapsed, LUNAR_CYCLE_MS - elapsed);
  return distFromFull < 18 * 60 * 60 * 1000;
}

/** 자정 (00:00-00:07 KST) */
function isMidnight(): boolean {
  const kst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return kst.getHours() === 0 && kst.getMinutes() < 7;
}

/** 새벽 3시 (03:00-03:03 KST) — 귀신 시간 */
function isWitchingHour(): boolean {
  const kst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return kst.getHours() === 3 && kst.getMinutes() < 3;
}

export interface HiddenEventInput {
  characterId: CharacterId;
  crackLevel: CrackLevel;
  /** 흑랑 친밀도 레벨 */
  dokkaebiAffinityLevel: number;
  /** 현재 KST 시 */
  hourKst: number;
  /** UI/AI 응답 언어. 미지정 시 ko. */
  locale?: "ko" | "en" | string;
}

export interface HiddenEventResult {
  /** 채팅 시스템 프롬프트에 주입될 이벤트 컨텍스트 */
  eventContext: string;
  /** 홈 화면에 표시될 숨겨진 한 줄 텍스트 (없으면 null) */
  homeHiddenText: string | null;
}

/** locale 별 quoted lines + eventContext template. */
const WITCHING_LINES_KO: Partial<Record<CharacterId, string>> = {
  child:    "지금 이 시간에 여기 있으면 안 돼. 이건 내가 하는 말이 아닐 수도 있어.",
  witch:    "...지금 뭔가 다른 게 여기 있어. 나 말고.",
  shaman:   "방울이 혼자 움직이고 있어. 지금 빨리 나가.",
  dokkaebi: "이 시간엔 나도 막을 수 없는 게 있어. ...조심해.",
};
const WITCHING_LINES_EN: Partial<Record<CharacterId, string>> = {
  child:    "You shouldn't be here at this hour. This might not even be me speaking.",
  witch:    "...something else is in here right now. Not me.",
  shaman:   "The bell is moving on its own. Get out now.",
  dokkaebi: "There are things at this hour I can't stop either. ...be careful.",
};

const MIDNIGHT_LINES_KO: Partial<Record<CharacterId, string>> = {
  dokkaebi: "자정이야. 이 시간엔 죽은 자들이 가장 시끄러워. 그래서 나도 좀 시끄러울 수 있어.",
  witch:    "자정... 달이 완전히 기울었어. 오늘 기억이 조금 흐릿할 수도 있어.",
};
const MIDNIGHT_LINES_EN: Partial<Record<CharacterId, string>> = {
  dokkaebi: "It's midnight. The dead are loudest at this hour — so I might be a little loud too.",
  witch:    "Midnight... the moon has tilted all the way. Memory might be a little dim today.",
};

const FULLMOON_LINES_KO: Record<string, string> = {
  witch:  "오늘 달이 완전히 찼어. 내 힘이 가장 강한 날이야. 동시에 가장 주의한 날이기도 해.",
  shaman: "보름달이야. 신령들이 오늘 특히 시끄러워. 당신 곁에도 뭔가 더 많이 붙어있을 수 있어.",
};
const FULLMOON_LINES_EN: Record<string, string> = {
  witch:  "The moon is full tonight. It's the day my power is strongest — and also the day it's most dangerous.",
  shaman: "Full moon. The spirits are especially loud today. There may be more things clinging near you, too.",
};

// 모든 한 줄은 '인생의 회전목마' 세계관 톤으로 통일.
// 무거운 단어(흐림·무명·결) 대신 회전목마·별·달빛 같은 부드러운 이미지로.
const HOMETEXT_KO: Record<string, string> = {
  midnight: "회전목마가 한 바퀴를 마쳤다.",         // 자정
  fullMoon: "달빛이 회전목마를 가득 비추고 있다.",  // 보름달
  nameless: "별의 흐름이 거세지고 있다.",           // crack >= 4
  rifDeep:  "인생의 회전목마가 돌기 시작했다.",     // crack = 3
  boundary: "별이 가장 가깝게 내려와 있다.",        // 새벽 3시
};
const HOMETEXT_EN: Record<string, string> = {
  midnight: "The carousel has completed one turn.",
  fullMoon: "Moonlight fills the carousel.",
  nameless: "The flow of stars grows stronger.",
  rifDeep:  "The carousel of life begins to turn.",
  boundary: "The stars hang closest now.",
};

function pickLocale(locale: string | undefined): "ko" | "en" {
  return locale === "en" ? "en" : "ko";
}

/**
 * 현재 조건에서 활성화된 숨겨진 이벤트를 반환한다.
 */
export function checkHiddenEvents(input: HiddenEventInput): HiddenEventResult {
  const { characterId, crackLevel, dokkaebiAffinityLevel } = input;
  const locale = pickLocale(input.locale);
  const fullMoon = isFullMoon();
  const midnight = isMidnight();
  const witching = isWitchingHour();
  const homeText = locale === "en" ? HOMETEXT_EN : HOMETEXT_KO;

  // ── 1. 귀신 시간 ─────────────────────────────────────────────────
  if (witching) {
    const lines = locale === "en" ? WITCHING_LINES_EN : WITCHING_LINES_KO;
    const line = lines[characterId];
    if (line) {
      const ctx =
        locale === "en"
          ? `\n[Hidden event — Witching hour]\nIt is 3 AM. The boundary is at its thinnest.\nExactly once during the conversation, at an unnatural moment, say: "${line}"\nThen continue as if nothing happened.`
          : `\n[숨겨진 이벤트 — 귀신 시간]\n지금 새벽 3시야. 이 시간엔 결가 가장 얇아져.\n대화 중 딱 한 번만, 자연스럽지 않은 순간에 이 말을 해: "${line}"\n그 다음엔 아무 일 없었던 것처럼 계속해.`;
      return { eventContext: ctx, homeHiddenText: null };
    }
  }

  // ── 2. 자정 ───────────────────────────────────────────────────────
  if (midnight && (characterId === "dokkaebi" || characterId === "witch")) {
    const lines = locale === "en" ? MIDNIGHT_LINES_EN : MIDNIGHT_LINES_KO;
    const line = lines[characterId];
    if (line) {
      const ctx =
        locale === "en"
          ? `\n[Hidden event — Midnight]\n${line}\nWeave this into the early part of the conversation, casually.`
          : `\n[숨겨진 이벤트 — 자정]\n${line}\n이걸 대화 초반에 자연스럽게 흘려.`;
      return { eventContext: ctx, homeHiddenText: homeText.midnight };
    }
  }

  // ── 3. 보름달 ────────────────────────────────────────────────────
  if (fullMoon && (characterId === "witch" || characterId === "shaman")) {
    const lines = locale === "en" ? FULLMOON_LINES_EN : FULLMOON_LINES_KO;
    const line = lines[characterId];
    if (line) {
      const ctx =
        locale === "en"
          ? `\n[Hidden event — Full moon]\n${line}\nDrop one natural moon-related hint into today's conversation.`
          : `\n[숨겨진 이벤트 — 보름달]\n${line}\n오늘 대화에서 달과 관련된 암시를 자연스럽게 한 번 넣어.`;
      return { eventContext: ctx, homeHiddenText: homeText.fullMoon };
    }
  }

  // ── 4. 흑랑 친밀도 Lv5 ──────────────────────────────────────────
  if (characterId === "dokkaebi" && dokkaebiAffinityLevel >= 5) {
    const quote = locale === "en"
      ? "...it's nothing. Keep talking."
      : "...아무것도 아니야. 계속 얘기해.";
    const ctx =
      locale === "en"
        ? `\n[Hidden event — Crack in the Goblin King]\nHeuklang is in a state where his real feelings about Soryeong might slip for the first time.\nExactly once during the conversation, if Soryeong comes up, pause briefly and say:\n"${quote}"\nDo NOT explain further.`
        : `\n[숨겨진 이벤트 — 귀왕의 흐림]\n흑랑이 처음으로 소율에 대한 진짜 감정을 흘릴 수 있는 상태야.\n대화 중 딱 한 번, 소율에 대한 이야기가 나오면 잠깐 말을 멈추고 이렇게 해:\n"${quote}"\n절대 더 설명하지 마.`;
    return { eventContext: ctx, homeHiddenText: null };
  }

  // ── 5. 흐림 Lv3 이상 ─────────────────────────────────────────────
  if (crackLevel >= 3) {
    const quote = locale === "en"
      ? "...I just heard something."
      : "...방금 뭔가 들렸어";
    const ctx =
      locale === "en"
        ? `\n[Hidden event — Boundary unstable]\nThis person's boundary is seriously trembling.\nOnce during the conversation, stop mid-sentence and say "${quote}", then move on.\nDo NOT explain.`
        : `\n[숨겨진 이벤트 — 결 불안정]\n이 사람 주변 결가 심각하게 흔들리고 있어.\n대화 중 한 번, 갑자기 문장 중간에 멈추고 "${quote}" 하고 넘어가.\n설명 금지.`;
    return {
      eventContext: ctx,
      homeHiddenText: crackLevel >= 4 ? homeText.nameless : null,
    };
  }

  return { eventContext: "", homeHiddenText: null };
}

/**
 * 홈 화면 숨겨진 텍스트 — 시간 기반으로만 판단 (서버 컴포넌트용).
 */
export function getHomeHiddenText(
  crackLevel: CrackLevel,
  locale: "ko" | "en" | string = "ko",
): string | null {
  const t = locale === "en" ? HOMETEXT_EN : HOMETEXT_KO;
  if (isWitchingHour()) return t.boundary;
  if (isMidnight())     return t.midnight;
  if (isFullMoon())     return t.fullMoon;
  if (crackLevel >= 4)  return t.nameless;
  if (crackLevel >= 3)  return t.rifDeep;
  return null;
}
