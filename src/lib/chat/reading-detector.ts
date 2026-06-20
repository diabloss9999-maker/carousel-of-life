import { TAROT_DECK } from "@/lib/tarot/cards";
import type { CharacterId } from "@/lib/chat/characters";

export type ReadingType = "tarot1" | "tarot3";

const ALLOWED_READINGS: Record<CharacterId, ReadonlySet<ReadingType>> = {
  child: new Set<ReadingType>(),
  witch: new Set<ReadingType>(["tarot1", "tarot3"]),
  sage: new Set<ReadingType>(["tarot1", "tarot3"]),
  hunter: new Set<ReadingType>(),
  runeshaman: new Set<ReadingType>(),
  god: new Set<ReadingType>(),
  shaman: new Set<ReadingType>(),
  taoist: new Set<ReadingType>(),
  dokkaebi: new Set<ReadingType>(),
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

export type ReadingDecision =
  | { kind: "none" }
  | { kind: "draw"; reading: ReadingResult };

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
    if (!c) return null;

    return {
      type: intent,
      cards,
      promptText:
        `[지금 막 타로 카드가 뽑혔어. 사용자는 이미 setup 답변을 했다]\n` +
        `카드: ${c.nameKo} (${c.nameEn}) - ${c.isReversed ? "역방향" : "정방향"}\n` +
        `이 카드를 네 멤버 목소리로 즉시 공개하고 해석해줘. 카드 이름은 반드시 언급해. 전문 점술가처럼 단정하지 말고, 멤버가 팬에게 조심스럽게 읽어주는 말투로 풀어줘.`,
    };
  }

  const cards = drawTarot(3);
  const lines = cards
    .map((c) => `${c.position}: ${c.nameKo} - ${c.isReversed ? "역방향" : "정방향"}`)
    .join("\n");

  return {
    type: intent,
    cards,
    promptText:
      `[지금 막 타로 3장이 뽑혔어. 과거, 현재, 미래 기운이고 사용자는 이미 setup 답변을 했다]\n${lines}\n` +
      `세 장의 기운을 네 멤버 목소리로 즉시 공개하고 연결해서 해석해줘. 전문 점술가처럼 단정하지 말고, 멤버가 팬에게 조심스럽게 읽어주는 말투로 풀어줘.`,
  };
}

const CARD_REQUEST_PATTERNS: { type: ReadingType; regex: RegExp }[] = [
  { type: "tarot3", regex: /타로\s*(3장|세\s*장|과거.?현재|과거.*미래)/i },
  { type: "tarot1", regex: /타로|카드.*뽑|카드.*봐|오늘.*카드/i },
];

const GENERIC_REDRAW_REGEX =
  /(다시\s*뽑|또\s*뽑|또\s*한\s*장|한\s*번\s*더\s*뽑|한장\s*더|다른\s*거.*뽑|새\s*카드|리딩\s*다시|점\s*다시)/i;

function matchIntent(
  message: string,
  characterId?: CharacterId,
): ReadingType | null {
  for (const { type, regex } of CARD_REQUEST_PATTERNS) {
    if (regex.test(message)) return type;
  }

  if (characterId && GENERIC_REDRAW_REGEX.test(message)) {
    const allowed = ALLOWED_READINGS[characterId];
    if (allowed.has("tarot1")) return "tarot1";
  }

  return null;
}

export function resolveReadingFlow(
  currentMessage: string,
  characterId: CharacterId,
): ReadingDecision {
  const allowed = ALLOWED_READINGS[characterId];
  const currentIntent = matchIntent(currentMessage, characterId);

  if (!currentIntent || !allowed.has(currentIntent)) {
    return { kind: "none" };
  }

  const reading = performDraw(currentIntent);
  if (!reading) return { kind: "none" };

  return { kind: "draw", reading };
}
