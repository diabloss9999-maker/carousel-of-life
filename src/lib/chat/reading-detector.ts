/**
 * 채팅 메시지에서 점술 요청을 감지하고 카드를 추첨한다.
 *
 * 카테고리별 점술 권한 (엄격 분리):
 *  - 이세계 (child·witch·sage):  타로 · 르노르망
 *  - 북유럽 (hunter·runeshaman·god):  룬
 *  - 동양  (shaman·taoist·dokkaebi):  카드 점술 없음 (사주·천기만)
 *
 * 권한 밖 점술 요청은 그리지 않고 null 을 반환한다.
 *
 * 즉시 그리기 — "타로 봐줘" 같은 요청에 바로 카드를 그리고 해석한다.
 *  (과거: 2턴 defer 흐름 — setup 질문 1턴, 카드 다음 턴. 사용자가
 *   두 번째 턴을 안 보내거나 looksLikeAlreadyDrew 휴리스틱 오탐으로
 *   카드가 영영 안 그려지는 버그가 있어 즉시 그리기로 변경.)
 */
import { drawRunes } from "@/lib/runes/draw";
import { drawLenormand } from "@/lib/lenormand/draw";
import { TAROT_DECK } from "@/lib/tarot/cards";
import type { CharacterId } from "@/lib/chat/characters";

export type ReadingType = "tarot1" | "tarot3" | "rune1" | "lenormand1";

/** 캐릭터별 그릴 수 있는 점술 종류 — 엄격 분리. */
const ALLOWED_READINGS: Record<CharacterId, ReadonlySet<ReadingType>> = {
  // 이세계 — 타로 · 르노르망 전담
  child:      new Set<ReadingType>(["tarot1", "tarot3", "lenormand1"]),
  witch:      new Set<ReadingType>(["tarot1", "tarot3", "lenormand1"]),
  sage:       new Set<ReadingType>(["tarot1", "tarot3", "lenormand1"]),
  // 북유럽 — 룬 전담
  hunter:     new Set<ReadingType>(["rune1"]),
  runeshaman: new Set<ReadingType>(["rune1"]),
  god:        new Set<ReadingType>(["rune1"]),
  // 동양 — 카드 점술 없음
  shaman:     new Set<ReadingType>(),
  taoist:     new Set<ReadingType>(),
  dokkaebi:   new Set<ReadingType>(),
};

export interface DrawnCard {
  id: string;
  nameKo: string;
  nameEn?: string;
  imageSrc: string;
  isReversed?: boolean;
  position?: string;
  meaning?: string;
}

export interface ReadingResult {
  type: ReadingType;
  cards: DrawnCard[];
  promptText: string;
}

export type RecentMessage = { role: "user" | "assistant"; content: string };

export type ReadingDecision =
  /** 점술 무관 — 일반 대화 */
  | { kind: "none" }
  /** 의도 감지 — 즉시 카드 그리고 해석 */
  | { kind: "draw"; reading: ReadingResult };

// ─────────────────────────────────────────────────────────────────────────────
// 카드 추첨 헬퍼
// ─────────────────────────────────────────────────────────────────────────────

function drawTarot(count: 1 | 3): DrawnCard[] {
  const deck = [...TAROT_DECK];
  const shuffled = deck.sort(() => Math.random() - 0.5);
  const positions = count === 3 ? ["과거", "현재", "미래"] : ["오늘의 카드"];
  return shuffled.slice(0, count).map((card, i) => ({
    id: card.id,
    nameKo: card.nameKo,
    nameEn: card.nameEn,
    imageSrc: `/tarot/${card.id}.webp`,
    isReversed: Math.random() < 0.35,
    position: positions[i],
  }));
}

function performDraw(intent: ReadingType): ReadingResult | null {
  if (intent === "tarot1") {
    const cards = drawTarot(1);
    const c = cards[0];
    return {
      type: intent,
      cards,
      promptText:
        `[지금 막 타로 카드가 뽑혔어 — 사용자는 이미 setup 답변을 했다]\n` +
        `카드: ${c.nameKo} (${c.nameEn}) — ${c.isReversed ? "역방향" : "정방향"}\n` +
        `이 카드를 네 캐릭터 목소리로 즉시 공개하고 해석해줘. 카드 이름은 반드시 언급해.`,
    };
  }
  if (intent === "tarot3") {
    const cards = drawTarot(3);
    const lines = cards
      .map((c) => `${c.position}: ${c.nameKo} — ${c.isReversed ? "역방향" : "정방향"}`)
      .join("\n");
    return {
      type: intent,
      cards,
      promptText:
        `[지금 막 타로 3장이 뽑혔어 — 과거·현재·미래, 사용자는 이미 setup 답변을 했다]\n${lines}\n` +
        `세 장의 흐름을 네 캐릭터 목소리로 즉시 공개·연결해서 해석해줘.`,
    };
  }
  if (intent === "rune1") {
    const drawn = drawRunes(1, true);
    const r = drawn[0];
    if (!r) return null;
    return {
      type: intent,
      cards: [{
        id: String(r.rune.id),
        nameKo: r.rune.nameKo,
        nameEn: r.rune.name,
        imageSrc: r.rune.imageSrc,
        isReversed: r.isReversed,
        meaning: r.isReversed
          ? (r.rune.meaningReversed ?? r.rune.meaningUpright)
          : r.rune.meaningUpright,
      }],
      promptText:
        `[지금 막 룬이 뽑혔어 — 사용자는 이미 setup 답변을 했다]\n` +
        `룬: ${r.rune.symbol} ${r.rune.nameKo} (${r.rune.name}) — ${r.isReversed ? "역방향" : "정방향"}\n` +
        `의미: ${r.isReversed ? (r.rune.meaningReversed ?? r.rune.meaningUpright) : r.rune.meaningUpright}\n` +
        `이 룬을 네 캐릭터 목소리로 즉시 공개·해석해줘.`,
    };
  }
  if (intent === "lenormand1") {
    const drawn = drawLenormand(1, Date.now());
    const c = drawn[0];
    if (!c) return null;
    return {
      type: intent,
      cards: [{
        id: String(c.id),
        nameKo: c.nameKo,
        nameEn: c.nameEn,
        imageSrc: c.imageSrc,
        meaning: c.meaning,
      }],
      promptText:
        `[지금 막 르노르망 카드가 뽑혔어 — 사용자는 이미 setup 답변을 했다]\n` +
        `카드: ${c.nameKo} (${c.nameEn})\n` +
        `의미: ${c.meaning}\n` +
        `이 카드를 네 캐릭터 목소리로 즉시 공개·해석해줘.`,
    };
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 의도 감지
// ─────────────────────────────────────────────────────────────────────────────

/** 카드 점술 요청 감지 패턴 — 메시지에서 어떤 점술을 원하는지 분류. */
const CARD_REQUEST_PATTERNS: { type: ReadingType; regex: RegExp }[] = [
  { type: "tarot3",     regex: /타로.*(3장|세\s*장|세장|과거.현재|과거.*미래)/i },
  { type: "tarot1",     regex: /타로|카드.*뽑|뽑.*카드|카드.*봐|카드.*한\s*장|오늘.*카드/i },
  { type: "rune1",      regex: /룬.*뽑|룬.*봐|룬.*줘|룬.*해줘|룬 점/i },
  { type: "lenormand1", regex: /르노르망.*뽑|르노르망.*봐|르노르망.*줘|르노.*뽑|르노.*봐/i },
];

/** 카드 종류 없이 그냥 다시/또/한번 더 뽑아달라는 일반 재추첨 표현 */
const GENERIC_REDRAW_REGEX =
  /(다시\s*뽑|또\s*뽑|또\s*한\s*장|한\s*번\s*더\s*뽑|한장\s*더|다른\s*거.*뽑|새\s*카드|새\s*룬|리딩\s*다시|점\s*다시)/i;

function matchIntent(
  message: string,
  characterId?: CharacterId,
): ReadingType | null {
  // 1) 명시적 패턴 먼저
  for (const { type, regex } of CARD_REQUEST_PATTERNS) {
    if (regex.test(message)) return type;
  }
  // 2) 일반 재추첨 표현 — 캐릭터의 기본 점술로 폴백
  if (characterId && GENERIC_REDRAW_REGEX.test(message)) {
    const allowed = ALLOWED_READINGS[characterId];
    if (allowed.has("tarot1")) return "tarot1"; // 이세계
    if (allowed.has("rune1")) return "rune1";   // 북유럽
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 메인 엔트리
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 메시지 흐름을 보고 점술 결정을 내린다.
 *
 * 의도가 감지되면 즉시 카드를 그린다 (2턴 defer 흐름은 사용자 혼동·
 * 휴리스틱 오탐 문제로 폐기).
 *
 * @param currentMessage 사용자가 방금 보낸 메시지
 * @param characterId 현재 대화 캐릭터
 * @param _history   미사용 (호환성 유지용 매개변수)
 */
export function resolveReadingFlow(
  currentMessage: string,
  characterId: CharacterId,
  _history: readonly RecentMessage[],
): ReadingDecision {
  const allowed = ALLOWED_READINGS[characterId];

  const currentIntent = matchIntent(currentMessage, characterId);
  if (!currentIntent) return { kind: "none" };
  if (!allowed.has(currentIntent)) {
    // 권한 밖 — 캐릭터 프롬프트가 자연스럽게 거절
    return { kind: "none" };
  }

  const reading = performDraw(currentIntent);
  if (!reading) return { kind: "none" };
  return { kind: "draw", reading };
}
