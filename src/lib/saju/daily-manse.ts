/**
 * 오늘의 명리 흐름 — 일일 운세 정확도 핵심.
 *
 * 사용자의 사주 4기둥 vs 그날의 일진(日辰)을 충·합·오행 균형으로 분석해서
 * (1) 점수 보정값(delta) — 충=감점, 합/삼합=가점 → 점수가 실제 흐름을 반영
 * (2) 프롬프트 주입 블록(block) — AI 풀이가 "일진을 살펴"라는 지시만 받고
 *     데이터 없이 지어내던 문제를 해결한다. 전부 쉬운 한국어(용어·한자 없음).
 *
 * 결정론적이라 같은 날·같은 사주엔 항상 같은 결과 → 캐시된 점수와
 * 생성 시 점수가 일치한다.
 */
import "server-only";

import type { Profile } from "@/db/schema";
import type { FortuneCategory } from "@/lib/ai/prompts";
import { getDayPillar } from "@/lib/saju/iljin";
import {
  analyzeDayRelationship,
  type UserPillarInput,
} from "@/lib/saju/relationships";
import {
  tenGodForStem,
  tenGodGroup,
  TEN_GOD_GROUP_MEANING,
  type TenGodGroup,
} from "@/lib/saju/ten-gods";

interface FiveElements {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

const ELEMENT_KEYS = ["wood", "fire", "earth", "metal", "water"] as const;

/** 오행 한글(목·화·토·금·수) → 내부 키. */
const KO_TO_KEY: Record<string, keyof FiveElements> = {
  목: "wood",
  화: "fire",
  토: "earth",
  금: "metal",
  수: "water",
};

/** 오행 한글 → 쉬운 일상어 기질 설명(용어 노출 없이 AI 에 전달). */
const ELEMENT_TRAIT: Record<string, string> = {
  목: "뻗어나가려는 추진력과 성장 욕구",
  화: "밝게 표현하고 활기를 내는 기운",
  토: "안정감과 신뢰로 중심을 잡는 기운",
  금: "결단력과 원칙으로 정리하는 기운",
  수: "차분함과 유연함으로 깊이 생각하는 기운",
};

export interface DailyManse {
  /** 점수 보정 (-15 ~ +15). */
  delta: number;
  /** 프롬프트에 주입할 내부 분석(쉬운 한국어). */
  block: string;
  /** 오늘 흐름을 대표하는 한 문장(쉬운 한국어) — 카드·푸시용. */
  headline: string;
  /** delta 기반 톤 — good(좋은 흐름)/caution(조심)/calm(잔잔). */
  tone: "good" | "caution" | "calm";
}

/**
 * 카테고리별 — 오늘 십성이 어느 그룹일 때 유리(+)/불리(-)한지.
 * 십성은 일간 대비 오늘 천간의 관계로, 그날 어떤 영역의 기운이 도는지를 뜻한다.
 */
const CATEGORY_TENGOD: Partial<
  Record<
    FortuneCategory,
    { favor: TenGodGroup[]; against: TenGodGroup[] }
  >
> = {
  money: { favor: ["재성"], against: ["비겁"] }, // 재성=재물, 겁재(비겁)=지출·손실
  career: { favor: ["관성"], against: [] }, // 관성=직책·책임
  study: { favor: ["인성"], against: [] }, // 인성=배움·문서
  love: { favor: ["재성", "관성"], against: [] }, // 재성·관성=인연의 별
  health: { favor: ["인성"], against: ["식상"] }, // 인성=휴식·회복, 식상 과다=소모
};

interface PillarShape {
  stem?: string;
  branch?: string;
}

/** profile.sajuPillars 의 한 기둥을 UserPillarInput 형태로 변환. */
function toPillar(p: PillarShape | undefined | null): UserPillarInput["year"] {
  if (p?.stem && p?.branch) return { stem: p.stem, branch: p.branch };
  return null;
}

/**
 * 오늘의 명리 흐름을 계산한다.
 * 사주가 아직 계산되지 않았으면 null (호출부에서 delta 0 으로 폴백).
 */
export function getDailyManse(
  profile: Profile,
  fortuneDate: string,
  category?: FortuneCategory,
): DailyManse | null {
  const pillars = profile.sajuPillars as
    | {
        year?: PillarShape;
        month?: PillarShape;
        day?: PillarShape;
        hour?: PillarShape;
      }
    | null;
  if (!pillars?.day?.stem || !pillars?.day?.branch) return null;

  // 정오(KST)로 잡아 일진 날짜 경계 안전화.
  const day = getDayPillar(new Date(`${fortuneDate}T12:00:00+09:00`));

  const userPillars: UserPillarInput = {
    year: toPillar(pillars.year),
    month: toPillar(pillars.month),
    day: toPillar(pillars.day),
    hour: toPillar(pillars.hour),
  };

  const rels = analyzeDayRelationship(day.stemIdx, day.branchIdx, userPillars);

  let delta = 0;
  const notes: string[] = [];

  for (const r of rels) {
    switch (r.type) {
      case "samhap":
        delta += 10;
        notes.push(
          "오늘은 기운이 강하게 맞아떨어져 에너지가 크게 살아나는 흐름이에요. 평소 미뤄둔 일을 밀어붙이기 좋아요.",
        );
        break;
      case "yukhap":
        delta += 6;
        notes.push(
          "오늘은 기운이 부드럽게 맞물려 일이 순하게 풀리는 흐름이에요. 관계나 협력에서 마찰이 적어요.",
        );
        break;
      case "stemhap":
        delta += 5;
        notes.push(
          "오늘은 마음과 바깥 흐름이 잘 맞아 연결·협력이 수월한 흐름이에요.",
        );
        break;
      case "chung":
        delta -= 8;
        notes.push(
          "오늘은 타고난 기운과 부딪히는 흐름이라 변동·긴장이 생기기 쉬워요. 큰 결정이나 무리한 추진은 하루 미루는 편이 좋아요.",
        );
        break;
      case "neutral":
        notes.push(
          "오늘은 큰 충돌도 큰 합도 없는 평온한 흐름이에요. 평소 페이스를 유지하기 좋아요.",
        );
        break;
    }
  }

  // 오행 균형 — 오늘 일진의 기운이 부족분을 채우는지, 과다에 더하는지.
  const fe = profile.fiveElements as FiveElements | null;
  const todayEl = day.stemElement; // 목·화·토·금·수
  let traitLine = "";

  if (fe) {
    const counts = ELEMENT_KEYS.map((k) => fe[k] ?? 0);
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    const todayKey = KO_TO_KEY[todayEl];
    const todayCount = todayKey ? (fe[todayKey] ?? 0) : 1;

    if (todayCount === min && min <= 1) {
      delta += 4;
      notes.push(
        `평소 부족했던 ${ELEMENT_TRAIT[todayEl]}이(가) 오늘 채워지는 날이에요. 그 부분을 의식해서 움직이면 도움이 돼요.`,
      );
    } else if (todayCount === max && max >= 3) {
      delta -= 3;
      notes.push(
        `이미 강한 ${ELEMENT_TRAIT[todayEl]}이(가) 오늘 더 강해지는 날이에요. 한쪽으로 치우치지 않게 균형을 챙기는 게 좋아요.`,
      );
    }

    // 타고난 기운의 중심 + 비어 있는 결.
    const sorted = ELEMENT_KEYS.map((k) => [k, fe[k] ?? 0] as const).sort(
      (a, b) => b[1] - a[1],
    );
    const topKey = sorted[0]?.[0];
    const lastEntry = sorted[sorted.length - 1];
    const top = topKey
      ? ELEMENT_TRAIT[
          Object.keys(KO_TO_KEY).find((ko) => KO_TO_KEY[ko] === topKey) ?? ""
        ]
      : "";
    const lackKo =
      lastEntry && lastEntry[1] === 0
        ? Object.keys(KO_TO_KEY).find((ko) => KO_TO_KEY[ko] === lastEntry[0])
        : null;
    if (top) {
      traitLine = `이 사람 타고난 기운의 중심: ${top}`;
      if (lackKo) {
        traitLine += ` / 비어 있어 채우면 좋은 결: ${ELEMENT_TRAIT[lackKo]}`;
      }
    }
  }

  // 오늘의 십성 — 일간 대비 오늘 천간의 관계. 그날 어떤 영역의 기운이 도는지.
  const dayGod = tenGodForStem(pillars.day.stem, day.stemHanja);
  if (dayGod) {
    const grp = tenGodGroup(dayGod);
    notes.push(
      `오늘은 ${TEN_GOD_GROUP_MEANING[grp]}의 기운이 도는 날이에요.`,
    );

    // 카테고리별 유리/불리 보정.
    const map = category ? CATEGORY_TENGOD[category] : undefined;
    if (map) {
      if (map.favor.includes(grp)) {
        delta += 4;
        notes.push(
          "오늘 도는 기운이 이 영역과 특히 잘 맞아요. 이쪽으로 한 걸음 내딛기 좋은 날이에요.",
        );
      } else if (map.against.includes(grp)) {
        delta -= 4;
        notes.push(
          "오늘 도는 기운이 이 영역엔 다소 부담이 될 수 있어요. 욕심내기보다 지키는 쪽이 좋아요.",
        );
      }
    }
  }

  delta = Math.max(-15, Math.min(15, delta));

  const tone: DailyManse["tone"] =
    delta >= 6 ? "good" : delta <= -6 ? "caution" : "calm";
  const headline =
    notes[0] ?? "오늘은 큰 변동 없이 잔잔하게 흐르는 하루예요.";

  const block = [
    "[오늘의 명리 흐름 — 내부 분석. 풀이에 자연스럽게 반영하되, 사주 용어·한자(천간·지지·충·합·오행·십성·일진 등)는 절대 글에 쓰지 말고 전부 쉬운 일상어로만 녹여라]",
    traitLine,
    `오늘 하루를 지배하는 결: ${ELEMENT_TRAIT[todayEl] ?? "잔잔한 흐름"}`,
    ...notes.map((n) => `- ${n}`),
  ]
    .filter(Boolean)
    .join("\n");

  return { delta, block, headline, tone };
}
