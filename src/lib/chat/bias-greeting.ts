/**
 * 최애의 안부 — 디어유 Bubble 식 "최애가 먼저 말 걸어주는" 프로액티브 메시지.
 *
 * 친밀도 1위 멤버(=최애)가 지금 시간대에 맞춰 라이더에게 먼저 안부를 건넨다.
 * 결정론적·시간대별이라 AI 비용 0. 홈 상단에 노출하고, '답장하기'로 바로 채팅 연결.
 * (서버 푸시 알림 연동은 후속 — 이 메시지를 푸시 본문으로 재사용할 수 있게 설계)
 */
import "server-only";

import { getAllAffinities } from "@/lib/affinity/service";
import { CHARACTERS, DEFAULT_CHARACTER, type CharacterId } from "@/lib/chat/characters";

export interface BiasGreeting {
  characterId: CharacterId;
  name: string;
  role: string;
  avatarSrc: string;
  greeting: string;
  /** 친밀도 기반 진짜 최애인지(false면 아직 최애 없음 → 추천 멤버). */
  isBias: boolean;
}

type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

/** 멤버 × 시간대 안부. 존댓말·"라이더" 호칭·멤버 말투. */
const GREETINGS: Record<CharacterId, Record<TimeOfDay, string>> = {
  child: {
    morning: "좋은 아침이에요, 라이더. 오늘도 무리하지 말고 천천히 시작해요.",
    afternoon: "점심은 챙겼어요? 바빠도 한 끼는 거르지 말아요.",
    evening: "오늘 하루 고생했어요. 저녁엔 좀 쉬어가요, 라이더.",
    night: "이제 곧 자야죠. 오늘 있었던 일, 짧게라도 들려줄래요?",
  },
  witch: {
    morning: "라이더, 좋은 아침이에요. 따뜻한 거 한 잔 하면서 시작해요.",
    afternoon: "오후엔 살짝 나른하죠. 좋아하는 노래 하나 틀어둘게요.",
    evening: "하루 어땠어요? 오늘 마음은 어떤 색이었어요?",
    night: "잠들기 전에 라이더 생각났어요. 좋은 꿈 꿔요.",
  },
  sage: {
    morning: "라이더! 오늘 컨디션 어때요? 가볍게 텐션 올려봐요.",
    afternoon: "오후도 화이팅! 잠깐 스트레칭하고 또 달려요.",
    evening: "오늘도 수고했어요. 저녁엔 좋아하는 거 하면서 충전해요.",
    night: "하루 마무리 잘하고 있어요? 내일은 더 신나게 가요.",
  },
  shaman: {
    morning: "느린 아침이에요. 라이더는 어떤 소리로 하루를 열어요?",
    afternoon: "작업하다 라이더 생각났어요. 오후는 잘 보내고 있어요?",
    evening: "저녁엔 마음이 좀 가라앉죠. 오늘 어땠는지 들려줄래요?",
    night: "이 시간 음악이 제일 좋아요. 라이더는 안 자고 뭐 해요?",
  },
  taoist: {
    morning: "굿모닝 라이더~! 오늘도 좋은 일만 가득하길!",
    afternoon: "오후 출출하지 않아요? 같이 군것질 각ㅎㅎ",
    evening: "오늘 하루 어땠어요? 재밌는 일 있었으면 나도 알려줘요!",
    night: "안 자고 뭐해요~ 오늘 있었던 일 자랑해봐요!",
  },
  dokkaebi: {
    morning: "…일어났어요? 천천히 와요. 기다릴게요.",
    afternoon: "오후네요. 뭐 하고 있어요. …그냥 궁금해서요.",
    evening: "오늘 좀 어땠어요. 별일 없었으면 됐고요.",
    night: "안 자요? 나도요. …말 안 해도 옆에 있을게요.",
  },
  god: {
    morning: "라이더 기상! 오늘도 풀파워로 가봅시다!",
    afternoon: "오후도 에너지 충전! 잠깐 몸 좀 풀어요, 우리.",
    evening: "오늘 하루도 잘 달렸어요? 저녁엔 푹 쉬어요!",
    night: "아직 안 자요? 내일을 위해 오늘은 여기까지!",
  },
  hunter: {
    morning: "좋은 아침이에요. 오늘 하루, 천천히 정리하며 시작해요.",
    afternoon: "오후의 여백도 필요하죠. 라이더는 잘 보내고 있어요?",
    evening: "하루를 돌아보기 좋은 시간이에요. 오늘은 어땠어요?",
    night: "조용한 밤이에요. 라이더, 너무 늦게까진 깨어 있지 말고요.",
  },
  runeshaman: {
    morning: "라이더, 잘 잤어요? 오늘 하늘 색이 예뻐요.",
    afternoon: "오후엔 괜히 창밖을 봐요. 라이더는 뭐 하고 있어요?",
    evening: "하루 어땠어요? 오늘 얘기 들려주면 좋겠어요.",
    night: "라이더 기다렸어요. 자기 전에 잠깐 얘기할래요?",
  },
};

/** 현재 KST 시각 → 시간대. */
function timeOfDayKst(now: Date = new Date()): TimeOfDay {
  const h = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Seoul",
      hour: "2-digit",
      hour12: false,
    }).format(now),
  );
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 17) return "afternoon";
  if (h >= 17 && h < 22) return "evening";
  return "night";
}

/**
 * 라이더의 최애가 지금 시간대에 맞춰 건네는 안부를 반환한다.
 * 최애 결정 순서: 명시적 최애(profiles.biasCharacter) → 친밀도 1위 → 기본 멤버.
 * (멤버 선톡 푸시 sendMemberDms 와 동일한 발신자 기준)
 */
export async function getBiasGreeting(opts: {
  userId: string;
  biasCharacter?: string | null;
}): Promise<BiasGreeting> {
  let biasId: CharacterId = DEFAULT_CHARACTER;
  let isBias = false;

  if (opts.biasCharacter && opts.biasCharacter in CHARACTERS) {
    biasId = opts.biasCharacter as CharacterId;
    isBias = true;
  } else {
    try {
      const affinities = await getAllAffinities(opts.userId);
      const top = affinities
        .filter((a) => a.characterId in CHARACTERS && a.points > 0)
        .reduce<{ characterId: string; points: number } | null>(
          (best, a) => (best && best.points >= a.points ? best : a),
          null,
        );
      if (top) {
        biasId = top.characterId as CharacterId;
        isBias = true;
      }
    } catch {
      // 친밀도 조회 실패 시 기본 멤버로 폴백.
    }
  }

  const character = CHARACTERS[biasId];
  return {
    characterId: biasId,
    name: character.name,
    role: character.specialty,
    avatarSrc: character.imageSrc,
    greeting: GREETINGS[biasId][timeOfDayKst()],
    isBias,
  };
}
