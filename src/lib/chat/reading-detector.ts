/**
 * 채팅 메시지에서 점술 요청을 감지하고 카드를 추첨한다.
 *
 * 카테고리 제한:
 *  - 이세계 (child·witch·sage): 타로·룬·르노르망 가능, 사주 불가
 *  - 동양  (shaman·taoist·dokkaebi): 사주·천기 기반 대화만, 카드 뽑기 불가
 *  - 북유럽 (hunter·runeshaman·god): 룬·타로·르노르망 가능 (룬을 가장 잘 한다)
 */
import { drawRunes } from "@/lib/runes/draw";
import { drawLenormand } from "@/lib/lenormand/draw";
import { TAROT_DECK } from "@/lib/tarot/cards";
import type { CharacterId } from "@/lib/chat/characters";

/** 카드 점술을 다루는 캐릭터 집합 (이세계 + 북유럽). 동양은 카드 뽑기 불가. */
const CARD_READERS: Set<CharacterId> = new Set([
  "child", "witch", "sage",
  "hunter", "runeshaman", "god",
]);

export type ReadingType = "tarot1" | "tarot3" | "rune1" | "lenormand1" | null;

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

function drawTarot(count: 1 | 3): DrawnCard[] {
  const deck = [...TAROT_DECK];
  const shuffled = deck.sort(() => Math.random() - 0.5);
  const positions = count === 3 ? ["과거", "현재", "미래"] : ["오늘의 카드"];
  return shuffled.slice(0, count).map((card, i) => ({
    id: card.id,
    nameKo: card.nameKo,
    nameEn: card.nameEn,
    imageSrc: `/tarot/${card.id}.png`,
    isReversed: Math.random() < 0.35,
    position: positions[i],
  }));
}

/** 카드 점술 요청 감지 패턴 (이세계·북유럽 공용) */
const CARD_REQUEST_PATTERNS: { type: ReadingType; regex: RegExp }[] = [
  { type: "tarot3",     regex: /타로.*(3장|세\s*장|세장|과거.현재|과거.*미래)/i },
  { type: "tarot1",     regex: /타로|카드.*뽑|뽑.*카드|카드.*봐|카드.*한\s*장|오늘.*카드/i },
  { type: "rune1",      regex: /룬.*뽑|룬.*봐|룬.*줘|룬.*해줘|룬 점/i },
  { type: "lenormand1", regex: /르노르망.*뽑|르노르망.*봐|르노르망.*줘|르노.*뽑|르노.*봐/i },
];

/**
 * 메시지에서 점술 요청 감지 → 카드 추첨 → 결과 반환.
 * 동양 캐릭터는 카드 뽑기를 하지 않으므로 null 반환.
 */
export function detectAndDraw(
  message: string,
  characterId: CharacterId,
): ReadingResult | null {
  // 동양 캐릭터 → 카드 뽑기 없음 (사주·천기 기반만)
  if (!CARD_READERS.has(characterId)) return null;

  for (const { type, regex } of CARD_REQUEST_PATTERNS) {
    if (!regex.test(message)) continue;

    if (type === "tarot1") {
      const cards = drawTarot(1);
      const c = cards[0];
      return {
        type,
        cards,
        promptText:
          `[지금 막 타로 카드가 뽑혔어]\n` +
          `카드: ${c.nameKo} (${c.nameEn}) — ${c.isReversed ? "역방향" : "정방향"}\n` +
          `이 카드를 네 캐릭터 목소리로 해석해줘. 카드 이름은 반드시 언급해.`,
      };
    }

    if (type === "tarot3") {
      const cards = drawTarot(3);
      const lines = cards
        .map((c) => `${c.position}: ${c.nameKo} — ${c.isReversed ? "역방향" : "정방향"}`)
        .join("\n");
      return {
        type,
        cards,
        promptText:
          `[지금 막 타로 3장이 뽑혔어 — 과거·현재·미래]\n${lines}\n` +
          `세 장의 흐름을 네 캐릭터 목소리로 연결해서 해석해줘.`,
      };
    }

    if (type === "rune1") {
      const drawn = drawRunes(1, true);
      const r = drawn[0];
      if (!r) return null;
      return {
        type,
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
          `[지금 막 룬이 뽑혔어]\n` +
          `룬: ${r.rune.symbol} ${r.rune.nameKo} (${r.rune.name}) — ${r.isReversed ? "역방향" : "정방향"}\n` +
          `의미: ${r.isReversed ? (r.rune.meaningReversed ?? r.rune.meaningUpright) : r.rune.meaningUpright}\n` +
          `이 룬을 네 캐릭터 목소리로 해석해줘.`,
      };
    }

    if (type === "lenormand1") {
      const drawn = drawLenormand(1, Date.now());
      const c = drawn[0];
      if (!c) return null;
      return {
        type,
        cards: [{
          id: String(c.id),
          nameKo: c.nameKo,
          nameEn: c.nameEn,
          imageSrc: c.imageSrc,
          meaning: c.meaning,
        }],
        promptText:
          `[지금 막 르노르망 카드가 뽑혔어]\n` +
          `카드: ${c.nameKo} (${c.nameEn})\n` +
          `의미: ${c.meaning}\n` +
          `이 카드를 네 캐릭터 목소리로 해석해줘.`,
      };
    }
  }
  return null;
}
