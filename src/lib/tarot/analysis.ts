/**
 * 타로 정밀 분석 — 카드 조합·포지션(E) + 사주 연계(D).
 *
 * 기존 타로는 카드명·정/역만 AI 에 넘겨 "카드별 의미"만 풀었다. 여기서 두 축을 더한다:
 *  E) 카드 조합: 메이저/마이너 비율·슈트 쏠림·코트(인물)·에이스(시작)·역방향 비율 등
 *     스프레드 전체의 결을 결정론적으로 읽어 "진짜 리딩"의 뼈대를 만든다.
 *  D) 사주 연계: 오늘의 일진(日辰) 오행 + 사용자 용신(강약 기반)을 카드의 슈트 기운과
 *     견줘 "오늘 기운과 카드가 어떻게 맞물리는지"를 짚는다 — 경쟁사에 없는 결합.
 *
 * 전부 결정론적. 프롬프트에 주입할 쉬운 한국어 블록을 반환한다(사주 용어는 숨김).
 */
import "server-only";

import type { Profile } from "@/db/schema";
import { getTarotCard, type Suit } from "@/lib/tarot/cards";
import type { DrawnCard } from "@/lib/tarot/draw";
import { getDayPillar } from "@/lib/saju/iljin";
import { analyzeNatal, type NatalPillars } from "@/lib/saju/ten-gods";

type ElementKey = "wood" | "fire" | "earth" | "metal" | "water";

/** 슈트 → 오행(동서 가교). 완드=불, 컵=물, 소드=쇠(칼·결단), 펜타클=흙. */
const SUIT_ELEMENT: Record<Suit, ElementKey> = {
  wands: "fire",
  cups: "water",
  swords: "metal",
  pentacles: "earth",
};

/** 슈트별 일상어 주제(용어 없이 결만 전달). */
const SUIT_THEME: Record<Suit, string> = {
  wands: "열정·도전·추진력 — 일과 활동, 하고 싶은 마음",
  cups: "감정·관계·사랑 — 마음이 흐르는 영역",
  swords: "생각·판단·소통 — 머리로 정리하고 갈등을 푸는 영역",
  pentacles: "현실·돈·건강·안정 — 손에 잡히는 결과의 영역",
};

const ELEMENT_KO_TRAIT: Record<ElementKey, string> = {
  wood: "뻗어나가는 성장의 기운",
  fire: "밝게 타오르는 열정의 기운",
  earth: "중심을 잡는 안정의 기운",
  metal: "정리하고 결단하는 기운",
  water: "깊이 생각하는 차분한 기운",
};

/** 오행 한글(목/화/토/금/수) → 키. */
const KO2KEY: Record<string, ElementKey> = {
  목: "wood", 화: "fire", 토: "earth", 금: "metal", 수: "water",
};
/** 일간 오행 한글(나무/불/흙/쇠/물 — analyzeNatal.dayElementKo) → 키. */
const NATAL_KO2KEY: Record<string, ElementKey> = {
  나무: "wood", 불: "fire", 흙: "earth", 쇠: "metal", 물: "water",
};

const GENERATES: Record<ElementKey, ElementKey> = {
  wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood",
};
const CONTROLS: Record<ElementKey, ElementKey> = {
  wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood",
};
function generatedBy(e: ElementKey): ElementKey {
  return (Object.keys(GENERATES) as ElementKey[]).find((k) => GENERATES[k] === e)!;
}
function controlledBy(e: ElementKey): ElementKey {
  return (Object.keys(CONTROLS) as ElementKey[]).find((k) => CONTROLS[k] === e)!;
}

/** 일간 오행 + 강약 → 도움이 되는(용신) 오행 집합. */
function favorableElements(dayEl: ElementKey, strength: string): Set<ElementKey> {
  if (strength === "신약") {
    // 채워주는 쪽: 인성(생일간) + 비겁(일간 자신).
    return new Set([generatedBy(dayEl), dayEl]);
  }
  if (strength === "신강") {
    // 덜어내는 쪽: 식상(일간이 생) + 재성(일간이 극) + 관성(일간을 극).
    return new Set([GENERATES[dayEl], CONTROLS[dayEl], controlledBy(dayEl)]);
  }
  return new Set(); // 중화는 특정 방향 없음.
}

/** profile.sajuPillars(jsonb) → NatalPillars. */
function toNatalPillars(raw: unknown): NatalPillars | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, { stem?: string; branch?: string } | null>;
  const norm = (
    x: { stem?: string; branch?: string } | null | undefined,
  ): { stem: string; branch: string } | null =>
    x?.stem && x?.branch ? { stem: x.stem, branch: x.branch } : null;
  return { year: norm(p.year), month: norm(p.month), day: norm(p.day), hour: norm(p.hour) };
}

/**
 * 뽑힌 카드 + 사용자 사주로 타로 정밀 분석 블록을 만든다.
 * @param spread "single"(1장) | "three"(과거·현재·미래)
 */
export function buildTarotAnalysisBlock(
  drawn: DrawnCard[],
  profile: Profile,
  spread: "single" | "three" | "seven",
): string {
  if (drawn.length === 0) return "";
  const cards = drawn.map((d) => ({ ...getTarotCard(d.id), isReversed: d.isReversed }));
  const total = cards.length;

  const lines: string[] = [];

  // ── E) 카드 조합·포지션 ──
  const majorCount = cards.filter((c) => c.arcana === "major").length;
  const reversedCount = cards.filter((c) => c.isReversed).length;
  const courtCount = cards.filter((c) => c.suit && c.number >= 11).length;
  const aceCount = cards.filter((c) => c.suit && c.number === 1).length;
  const tenCount = cards.filter((c) => c.suit && c.number === 10).length;

  // 슈트 쏠림.
  const suitCounts: Record<Suit, number> = { wands: 0, cups: 0, swords: 0, pentacles: 0 };
  for (const c of cards) if (c.suit) suitCounts[c.suit] += 1;
  const dominantSuit = (Object.keys(suitCounts) as Suit[])
    .filter((s) => suitCounts[s] > 0)
    .sort((a, b) => suitCounts[b] - suitCounts[a])[0] as Suit | undefined;
  const dominantStrong =
    dominantSuit !== undefined && suitCounts[dominantSuit] >= Math.max(2, Math.ceil(total / 2));

  if (majorCount >= Math.ceil(total / 2) && majorCount >= (total === 1 ? 1 : 2)) {
    lines.push(
      "큰 전환·운명적 흐름이 강하게 작용하는 자리예요. 사소한 선택보다, 지금 흐르는 큰 물줄기에 올라타는 게 중요한 시기예요.",
    );
  } else if (majorCount === 0 && total > 1) {
    lines.push(
      "거창한 운명보다 일상의 선택과 손길로 풀어가는 현실적인 흐름이에요. 작은 실천이 그대로 결과가 돼요.",
    );
  }

  if (dominantSuit && dominantStrong) {
    lines.push(
      `지금 가장 크게 움직이는 영역: ${SUIT_THEME[dominantSuit]}. 이 결을 중심으로 풀어라.`,
    );
  }

  if (courtCount >= 1) {
    lines.push(
      "상황의 한가운데 '사람'이 있어요. 주변 인물·관계가 일을 움직이는 열쇠라, 혼자 풀기보다 사람을 통해 실마리가 나와요.",
    );
  }
  if (aceCount >= 1) {
    lines.push(
      "새로운 시작의 씨앗이 들어와 있어요. 막 트이려는 기회가 있으니, 첫걸음을 두려워하지 않는 게 좋아요.",
    );
  }
  if (tenCount >= 1) {
    lines.push(
      "한 흐름이 끝까지 차오른 자리예요. 한 단계가 마무리되고 다음으로 넘어가는 전환점이에요.",
    );
  }

  if (total > 1 && reversedCount >= Math.ceil(total / 2)) {
    lines.push(
      "기운이 밖으로 시원하게 뻗기보다 안으로 향하거나 한 박자 지연되는 상태예요. 막힌 매듭을 먼저 풀고 재정비하면 길이 열려요.",
    );
  } else if (reversedCount === 0 && total > 1) {
    lines.push(
      "에너지가 막힘 없이 정방향으로 흐르고 있어요. 흐름을 믿고 그대로 밀고 나가도 좋은 자리예요.",
    );
  }

  // 3장 포지션 상호작용.
  if (spread === "three" && cards.length === 3) {
    const [past, present, future] = cards;
    if (past.isReversed && !future.isReversed) {
      lines.push(
        "과거의 막혔던 매듭이 시간이 가며 풀려나가는 흐름이에요 — 지금의 답답함은 지나가는 길목이에요.",
      );
    }
    if (!past.isReversed && future.isReversed) {
      lines.push(
        "순하게 오던 흐름이 앞쪽에서 한 번 재정비를 요구해요 — 미래의 변수에 미리 대비해두면 좋아요.",
      );
    }
    if (present.arcana === "major") {
      lines.push(
        "지금 이 순간이 이야기 전체의 큰 분기점이에요. 현재의 선택에 무게가 실려 있어요.",
      );
    }
  }

  // ── D) 사주 연계 — 오늘 일진 + 용신 vs 슈트 기운 ──
  const natalPillars = toNatalPillars(profile.sajuPillars);
  const natal = natalPillars ? analyzeNatal(natalPillars) : null;
  if (dominantSuit) {
    const suitEl = SUIT_ELEMENT[dominantSuit];
    const sajuLines: string[] = [];

    // 오늘 일진 오행 (KST 기준 오늘).
    const todayKst = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
    const iljinEl = KO2KEY[getDayPillar(new Date(`${todayKst}T12:00:00+09:00`)).stemElement];
    if (iljinEl) {
      if (iljinEl === suitEl) {
        sajuLines.push(
          "오늘 하루를 흐르는 기운과 이 카드의 결이 같은 방향으로 맞물려, 카드가 주는 메시지가 오늘 특히 또렷하고 강하게 작동해요.",
        );
      } else if (GENERATES[iljinEl] === suitEl) {
        sajuLines.push(
          "오늘의 기운이 이 카드가 가리키는 영역을 살며시 밀어주는 흐름이에요. 카드가 말하는 쪽으로 움직이면 받쳐주는 힘이 있어요.",
        );
      } else if (CONTROLS[iljinEl] === suitEl) {
        sajuLines.push(
          "오늘의 기운이 이 카드의 영역을 살짝 누르는 흐름이에요. 카드가 가리키는 일은 서두르기보다 한 박자 차분히 가는 게 좋아요.",
        );
      }
    }

    // 용신(타고난 결에 도움이 되는 방향) vs 슈트.
    if (natal) {
      const dayEl = NATAL_KO2KEY[natal.dayElementKo];
      if (dayEl) {
        const fav = favorableElements(dayEl, natal.strength);
        if (fav.has(suitEl)) {
          sajuLines.push(
            `이 카드가 짚는 영역(${ELEMENT_KO_TRAIT[suitEl]})은 마침 네 타고난 결에 힘이 되어주는 방향이에요. 여기에 마음을 쓰면 흐름을 제대로 탈 수 있어요.`,
          );
        }
      }
    }

    if (sajuLines.length > 0) {
      lines.push("오늘의 기운과 카드의 연결:");
      lines.push(...sajuLines.map((s) => `· ${s}`));
    }
  }

  if (lines.length === 0) return "";

  return [
    "[타로 정밀 분석 — 이미 계산된 내부 참고. 풀이의 뼈대로 삼되, '아르카나·슈트·오행·일진·용신·신강·신약' 같은 전문용어는 본문에 쓰지 말고 전부 쉬운 일상어로 녹여라. 카드 이름은 그대로 써도 된다]",
    ...lines.map((l) => (l.startsWith("·") || l.endsWith(":") ? l : `- ${l}`)),
  ].join("\n");
}
