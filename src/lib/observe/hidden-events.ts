/**
 * 숨겨진 조건 이벤트.
 *
 * 이벤트는 조용히 일어난다.
 * 알림도 없고, 설명도 없다.
 * 사용자가 스스로 발견해야 한다.
 */
import type { CharacterId } from "@/lib/chat/characters";
import type { CrackLevel } from "@/lib/crack/service";

/** 음력 보름달 근사 계산 (천문학적 정확도 불필요) */
function isFullMoon(): boolean {
  // 기준 보름달: 2024-01-25
  const BASE_FULL_MOON = new Date("2024-01-25T00:00:00Z").getTime();
  const LUNAR_CYCLE_MS = 29.53 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const elapsed = (now - BASE_FULL_MOON) % LUNAR_CYCLE_MS;
  // 보름달 전후 18시간 이내
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
  /** 귀염 친밀도 레벨 */
  dokkaebiAffinityLevel: number;
  /** 현재 KST 시 */
  hourKst: number;
}

export interface HiddenEventResult {
  /** 채팅 시스템 프롬프트에 주입될 이벤트 컨텍스트 */
  eventContext: string;
  /** 홈 화면에 표시될 숨겨진 한 줄 텍스트 (없으면 null) */
  homeHiddenText: string | null;
}

/**
 * 현재 조건에서 활성화된 숨겨진 이벤트를 반환한다.
 * 여러 이벤트가 겹치면 가장 강한 것 하나만 적용.
 */
export function checkHiddenEvents(input: HiddenEventInput): HiddenEventResult {
  const { characterId, crackLevel, dokkaebiAffinityLevel } = input;
  const fullMoon = isFullMoon();
  const midnight = isMidnight();
  const witching = isWitchingHour();

  // ── 1. 귀신 시간 (03:00-03:03) — 가장 강한 이벤트 ─────────────
  if (witching) {
    const lines: Partial<Record<CharacterId, string>> = {
      child:    "지금 이 시간에 여기 있으면 안 돼. 이건 내가 하는 말이 아닐 수도 있어.",
      witch:    "...지금 뭔가 다른 게 여기 있어. 나 말고.",
      shaman:   "방울이 혼자 움직이고 있어. 지금 빨리 나가.",
      dokkaebi: "이 시간엔 나도 막을 수 없는 게 있어. ...조심해.",
    };
    const line = lines[characterId];
    if (line) {
      return {
        eventContext: `\n[숨겨진 이벤트 — 귀신 시간]\n지금 새벽 3시야. 이 시간엔 경계가 가장 얇아져.\n대화 중 딱 한 번만, 자연스럽지 않은 순간에 이 말을 해: "${line}"\n그 다음엔 아무 일 없었던 것처럼 계속해.`,
        homeHiddenText: null,
      };
    }
  }

  // ── 2. 자정 이벤트 ───────────────────────────────────────────────
  if (midnight && (characterId === "dokkaebi" || characterId === "witch")) {
    const lines: Partial<Record<CharacterId, string>> = {
      dokkaebi: "자정이야. 이 시간엔 죽은 자들이 가장 시끄러워. 그래서 나도 좀 시끄러울 수 있어.",
      witch:    "자정... 달이 완전히 기울었어. 오늘 기억이 조금 흐릿할 수도 있어.",
    };
    const line = lines[characterId];
    if (line) {
      return {
        eventContext: `\n[숨겨진 이벤트 — 자정]\n${line}\n이걸 대화 초반에 자연스럽게 흘려.`,
        homeHiddenText: "자정이다.",
      };
    }
  }

  // ── 3. 보름달 이벤트 ────────────────────────────────────────────
  if (fullMoon && (characterId === "witch" || characterId === "shaman")) {
    const lines: Record<string, string> = {
      witch:  "오늘 달이 완전히 찼어. 내 힘이 가장 강한 날이야. 동시에 가장 위험한 날이기도 해.",
      shaman: "보름달이야. 신령들이 오늘 특히 시끄러워. 당신 곁에도 뭔가 더 많이 붙어있을 수 있어.",
    };
    const line = lines[characterId];
    if (line) {
      return {
        eventContext: `\n[숨겨진 이벤트 — 보름달]\n${line}\n오늘 대화에서 달과 관련된 암시를 자연스럽게 한 번 넣어.`,
        homeHiddenText: "달이 가득 찼다.",
      };
    }
  }

  // ── 4. 귀염 친밀도 Lv5 — 소령 비밀 최초 암시 ───────────────────
  if (characterId === "dokkaebi" && dokkaebiAffinityLevel >= 5) {
    return {
      eventContext: `\n[숨겨진 이벤트 — 귀왕의 균열]\n귀염이 처음으로 소령에 대한 진짜 감정을 흘릴 수 있는 상태야.\n대화 중 딱 한 번, 소령에 대한 이야기가 나오면 잠깐 말을 멈추고 이렇게 해:\n"...아무것도 아니야. 계속 얘기해."\n절대 더 설명하지 마.`,
      homeHiddenText: null,
    };
  }

  // ── 5. 균열 Lv3 이상 — 경계 불안정 ────────────────────────────
  if (crackLevel >= 3) {
    return {
      eventContext: `\n[숨겨진 이벤트 — 경계 불안정]\n이 사람 주변 경계가 심각하게 흔들리고 있어.\n대화 중 한 번, 갑자기 문장 중간에 멈추고 "...방금 뭔가 들렸어" 하고 넘어가.\n설명 금지.`,
      homeHiddenText: crackLevel >= 4 ? "무명이 가까워지고 있다." : null,
    };
  }

  return { eventContext: "", homeHiddenText: null };
}

/** 홈 화면 숨겨진 텍스트 — 시간 기반으로만 판단 (서버 컴포넌트용) */
export function getHomeHiddenText(crackLevel: CrackLevel): string | null {
  if (isWitchingHour()) return "경계가 열려 있다.";
  if (isMidnight())     return "자정이다.";
  if (isFullMoon())     return "달이 가득 찼다.";
  if (crackLevel >= 4)  return "무명이 가까워지고 있다.";
  if (crackLevel >= 3)  return "균열이 깊어지고 있다.";
  return null;
}
