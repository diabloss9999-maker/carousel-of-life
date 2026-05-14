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
 * 2턴 흐름 — 카드는 한 단계 미뤄서 그린다:
 *  - 턴 1 (의도 감지):  카드를 그리지 않고 AI 에게 setup 질문 한 줄 유도
 *  - 턴 2 (이전이 deferred):  이번에 실제로 카드를 그리고 해석 주입
 *  → "룬 그리고 질문" 이 아니라 "질문 → 답변 → 룬" 흐름 보장
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
  /** 의도는 감지됐지만 이번 턴은 setup 질문만 유도 (카드 X) */
  | { kind: "defer"; intent: ReadingType; promptInjection: string }
  /** 직전 턴이 deferred 였음 — 이번에 실제로 카드 그림 */
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
    imageSrc: `/tarot/${card.id}.png`,
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

function matchIntent(message: string): ReadingType | null {
  for (const { type, regex } of CARD_REQUEST_PATTERNS) {
    if (regex.test(message)) return type;
  }
  return null;
}

/**
 * 직전 AI 응답이 카드를 이미 그렸는지 휴리스틱 검사.
 * - 룬 유니코드 심볼, 룬 영문 이름, 흔한 draw 표현 등으로 판단.
 */
function looksLikeAlreadyDrew(text: string): boolean {
  // 룬 유니코드 범위 (Elder Futhark)
  if (/[ᚠ-᛿]/.test(text)) return true;
  // 룬 영문 이름
  if (/\b(Fehu|Uruz|Thurisaz|Ansuz|Raidho|Kenaz|Gebo|Wunjo|Hagalaz|Naudhiz|Isa|Jera|Eihwaz|Perthro|Algiz|Sowilo|Tiwaz|Berkano|Ehwaz|Mannaz|Laguz|Ingwaz|Dagaz|Othala)\b/i.test(text)) return true;
  // 일반 draw 마커
  if (/(뽑혔어|뽑았어|떨어졌어|손에 잡혔어|손에 들어왔어|카드는|이 룬은|이 카드는)/.test(text)) return true;
  return false;
}

function buildDeferInjection(intent: ReadingType): string {
  const label =
    intent === "rune1" ? "룬"
    : intent === "tarot1" ? "타로 카드"
    : intent === "tarot3" ? "타로 세 장"
    : "르노르망 카드";
  return `\n\n[점술 흐름 — 카드 추첨 직전 단계]
사용자가 ${label}을(를) 원해. 이번 응답에서는 카드를 절대 뽑거나 공개하지 마.
다음 흐름을 따라:
1) 짧고 신비로운 한 두 줄 — 사용자가 무엇을 가장 알고 싶은지 묻는 setup 질문 한 가지.
2) ${label} 이름·심볼·구체적 의미 절대 언급 금지.
3) "잠시 후 손에 들어올 거야" / "준비됐어?" 같은 한 줄로 마무리.
사용자가 답하면 그때 진짜로 카드를 펴고 해석한다. 그건 다음 턴 일.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 메인 엔트리
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 메시지 흐름을 보고 점술 결정을 내린다.
 *
 * @param currentMessage 사용자가 방금 보낸 메시지
 * @param characterId 현재 대화 캐릭터
 * @param history   AI 에게 전달될 메시지 배열 (마지막 항목 = 현재 user 메시지)
 */
export function resolveReadingFlow(
  currentMessage: string,
  characterId: CharacterId,
  history: readonly RecentMessage[],
): ReadingDecision {
  const allowed = ALLOWED_READINGS[characterId];

  // 1) 현재 메시지에서 의도 감지
  const currentIntent = matchIntent(currentMessage);
  if (currentIntent) {
    if (!allowed.has(currentIntent)) {
      // 권한 밖 — 캐릭터 프롬프트가 자연스럽게 거절
      return { kind: "none" };
    }
    // 새 의도 → 이번 턴은 defer
    return {
      kind: "defer",
      intent: currentIntent,
      promptInjection: buildDeferInjection(currentIntent),
    };
  }

  // 2) 현재 의도 없음 → 직전 user 메시지가 deferred 였는지 검사
  //    history 구조: [..., prevUser, lastAi, currentUser]
  //    history.length-1 이 currentUser (대부분), -2 = lastAi, -3 = prevUser
  if (history.length < 3) return { kind: "none" };
  const lastAi = history[history.length - 2];
  const prevUser = history[history.length - 3];
  if (!lastAi || !prevUser) return { kind: "none" };
  if (lastAi.role !== "assistant" || prevUser.role !== "user") {
    return { kind: "none" };
  }

  const prevIntent = matchIntent(prevUser.content);
  if (!prevIntent || !allowed.has(prevIntent)) return { kind: "none" };

  // last AI 가 이미 카드를 그렸으면 다시 안 그림
  if (looksLikeAlreadyDrew(lastAi.content)) return { kind: "none" };

  // deferred → 이번 턴에 카드 그림
  const reading = performDraw(prevIntent);
  if (!reading) return { kind: "none" };
  return { kind: "draw", reading };
}
