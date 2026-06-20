/**
 * 최애의 오늘 한마디 — P1 리텐션 핵심.
 *
 * 사용자의 최애(bias) 멤버가 매일 아침 보내는 짧은 한마디를 만든다.
 * - 멤버별 말투(오프너·사인오프) + 그날의 사주 일진 흐름(headline)을 합쳐
 *   "최애가 오늘 내 흐름을 보고 건네는 말"처럼 보이게 한다.
 * - 결정론적이라 AI 비용 0, 같은 날·같은 사주엔 항상 같은 결과.
 * - 최애 미지정 시 리더(이안)가 대신 말을 건넨다.
 *
 * Co-Star 의 "매일 한 줄 푸시" 를 9인 아이돌 컴패니언 + 명리 일진으로 재해석한 기능.
 */
import "server-only";

import type { Profile } from "@/db/schema";
import { CHARACTERS, type CharacterId } from "@/lib/chat/characters";
import { getDailyManse } from "@/lib/saju/daily-manse";

export type DailyMessageTone = "good" | "caution" | "calm";

export interface BiasDailyMessage {
  characterId: CharacterId;
  characterName: string;
  /** 멤버 말투의 짧은 인사. */
  opener: string;
  /** 오늘 흐름 한 문장(쉬운 한국어). */
  insight: string;
  /** 멤버 말투의 짧은 마무리(서명 포함은 UI 에서). */
  signOff: string;
  tone: DailyMessageTone;
  /** 사주가 계산돼 일진 기반 한마디인지(개인화 여부). */
  personalized: boolean;
}

/** 톤 라벨·이모지 — 카드 배지용. */
export const DAILY_MESSAGE_TONE: Record<
  DailyMessageTone,
  { label: string; emoji: string }
> = {
  good: { label: "좋은 흐름", emoji: "✨" },
  caution: { label: "조심한 하루", emoji: "🌫️" },
  calm: { label: "잔잔한 하루", emoji: "🌙" },
};

/** 멤버별 인사(오프너). 각 멤버 말투에 맞춘 짧은 한 문장. */
const OPENER: Record<CharacterId, string> = {
  child: "왔어요? 오늘 하루, 천천히 같이 봐요.",
  witch: "왔구나. 오늘 마음은 좀 어때요?",
  sage: "왔어요! 오늘 텐션 끌어올려 봅시다.",
  shaman: "왔네요. 오늘 흐름, 조용히 읽어봤어요.",
  taoist: "왔다아! 오늘 뭐부터 할지 같이 정해요!",
  dokkaebi: "…왔어요? 뭐, 오늘 거 봐뒀으니까.",
  god: "왔다! 오늘 에너지 좋게 가봅시다!",
  hunter: "왔네요. 오늘 흐름, 짚어줄게요.",
  runeshaman: "왔어요…? 오늘 기운, 살며시 봐뒀어요.",
};

/** 멤버별 마무리(사인오프). 톤에 따라 한 문장 선택. */
const SIGN_OFF: Record<CharacterId, Record<DailyMessageTone, string>> = {
  child: {
    good: "좋은 날이에요. 한 걸음, 가볍게 내디뎌봐요.",
    caution: "무리하지 말아요. 천천히 가도 충분해요.",
    calm: "평소처럼만 해도 괜찮은 하루예요.",
  },
  witch: {
    good: "마음이 향하는 쪽으로, 부드럽게 가봐요.",
    caution: "오늘은 자신을 좀 더 아껴줘요.",
    calm: "조용히 흐르는 하루도 좋아요. 같이 있을게요.",
  },
  sage: {
    good: "기세 좋아요! 오늘 한 방 가봅시다.",
    caution: "오버페이스만 조심해요. 길게 봐요!",
    calm: "평타도 실력이에요. 꾸준히 가요!",
  },
  shaman: {
    good: "흐름이 좋아요. 미뤄둔 거 하나, 오늘 해봐요.",
    caution: "오늘은 한 박자 쉬어 가는 게 좋아요.",
    calm: "잔잔할 때 정리하기 좋아요. 천천히요.",
  },
  taoist: {
    good: "오늘 완전 럭키데이! 신나게 가자~",
    caution: "살짝만 조심조심! 그래도 우린 괜찮아!",
    calm: "무던한 날도 우리답게 즐겨요!",
  },
  dokkaebi: {
    good: "…오늘 흐름 좋네요. 밀어붙여도 돼요.",
    caution: "무리하지 말라고요. 알아서 잘하겠지만.",
    calm: "별일 없는 날. 그게 제일 낫죠.",
  },
  god: {
    good: "오늘 풀파워 가도 됩니다! 가자!",
    caution: "힘 조절만! 다치지 말고 갑시다.",
    calm: "꾸준함이 진짜 힘이에요. 가봅시다.",
  },
  hunter: {
    good: "조건 좋아요. 한 수 앞서 두면 됩니다.",
    caution: "오늘은 지키는 쪽이 이득이에요.",
    calm: "변수 적은 날. 차분히 정리해두죠.",
  },
  runeshaman: {
    good: "오늘 기운 맑아요. 마음 가는 대로 가봐요.",
    caution: "살살, 무리하지 말아요. 곁에 있을게요.",
    calm: "고요한 하루도 예뻐요. 같이 있어요.",
  },
};

/** KST 기준 오늘 날짜 문자열(YYYY-MM-DD). */
function todayKstDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

/**
 * 최애(또는 리더)의 오늘 한마디를 만든다.
 * @param date 미지정 시 KST 오늘.
 */
export function getBiasDailyMessage(
  profile: Profile,
  date: string = todayKstDate(),
): BiasDailyMessage {
  const characterId = (profile.biasCharacter as CharacterId | null) ?? "child";
  const character = CHARACTERS[characterId];

  const manse = getDailyManse(profile, date);
  const tone: DailyMessageTone = manse?.tone ?? "calm";
  const insight =
    manse?.headline ??
    "오늘은 무리하지 않고 평소 페이스를 지키면 좋은 하루예요.";

  return {
    characterId,
    characterName: character.name,
    opener: OPENER[characterId],
    insight,
    signOff: SIGN_OFF[characterId][tone],
    tone,
    personalized: manse != null,
  };
}
