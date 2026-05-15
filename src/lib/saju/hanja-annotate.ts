/**
 * 사주 텍스트에 등장하는 한자(천간·지지·오행·음양)에 한글 음을 자동 병기한다.
 *
 * 한국인 대부분은 한자를 못 읽으므로 `甲` 만 있으면 못 읽고, `甲(갑)` 으로
 * 표시해야 의미가 전달된다. AI 프롬프트로도 지시하지만 100% 지키지 않을 수
 * 있어 응답 후 결정론적 후처리로 보장한다.
 *
 * 규칙:
 * - 이미 `한자(한글)` 형식이면 건드리지 않는다 (중복 방지)
 * - 갑자(甲子) 같이 두 글자가 붙어있어도 각각 처리: 甲子 → 甲(갑)子(자)
 *   단, 단어로 묶어 표시되는 경우 더 자연스러운 처리를 위해
 *   2자 조합 우선 매칭 (甲子 → 甲子(갑자)) 후 단일자 처리
 * - 천간 10 + 지지 12 + 오행 5 + 음양 2 만 처리. 다른 한자는 그대로.
 */

/** 천간 한자 → 한글 음 */
const STEM_TO_KO: Record<string, string> = {
  甲: "갑", 乙: "을", 丙: "병", 丁: "정", 戊: "무",
  己: "기", 庚: "경", 辛: "신", 壬: "임", 癸: "계",
};

/** 지지 한자 → 한글 음 */
const BRANCH_TO_KO: Record<string, string> = {
  子: "자", 丑: "축", 寅: "인", 卯: "묘", 辰: "진", 巳: "사",
  午: "오", 未: "미", 申: "신", 酉: "유", 戌: "술", 亥: "해",
};

/** 오행 한자 → 한글 음 */
const ELEMENT_TO_KO: Record<string, string> = {
  木: "목", 火: "화", 土: "토", 金: "금", 水: "수",
};

/** 음양 한자 → 한글 음 */
const POLARITY_TO_KO: Record<string, string> = {
  陽: "양", 陰: "음",
};

/** 단일 문자 매핑 통합. */
const SINGLE_HANJA_TO_KO: Record<string, string> = {
  ...STEM_TO_KO,
  ...BRANCH_TO_KO,
  ...ELEMENT_TO_KO,
  ...POLARITY_TO_KO,
};

/** 사주에서 자주 등장하는 두 글자 합성어 (천간+지지). */
const COMPOUND_HANJA_TO_KO: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const [stem, stemKo] of Object.entries(STEM_TO_KO)) {
    for (const [branch, branchKo] of Object.entries(BRANCH_TO_KO)) {
      out[stem + branch] = stemKo + branchKo;
    }
  }
  return out;
})();

const SINGLE_HANJA_CLASS = `[${Object.keys(SINGLE_HANJA_TO_KO).join("")}]`;
const COMPOUND_HANJA_PATTERN = new RegExp(
  // 2글자 천간+지지 조합 매칭. 직후에 `(` 가 오면 이미 병기된 것으로 skip.
  `([${Object.keys(STEM_TO_KO).join("")}])([${Object.keys(BRANCH_TO_KO).join("")}])(?!\\s*\\()`,
  "g",
);
const SINGLE_HANJA_PATTERN = new RegExp(
  // 단일 한자 매칭. 직후 `(` 가 오면 skip. 직전에 다른 한자가 있으면 (이미 compound 로 처리됐을 수 있음) 건너뛰는 게 아니라 그대로 처리.
  `(${SINGLE_HANJA_CLASS})(?!\\s*\\()`,
  "g",
);

/**
 * 한자 → 한자(한글) 형식으로 변환한다.
 *
 * 한국어 텍스트에만 적용 — 영어 텍스트는 그대로 반환.
 * 빈 문자열·null·undefined 는 그대로 반환.
 */
export function annotateHanja(text: string | null | undefined): string {
  if (!text) return text ?? "";

  // 1) 천간+지지 2글자 조합 우선 매칭 (예: 甲子 → 甲子(갑자))
  let result = text.replace(COMPOUND_HANJA_PATTERN, (match) => {
    const ko = COMPOUND_HANJA_TO_KO[match];
    return ko ? `${match}(${ko})` : match;
  });

  // 2) 남은 단일 한자 처리 (예: 木 → 木(목))
  result = result.replace(SINGLE_HANJA_PATTERN, (match) => {
    const ko = SINGLE_HANJA_TO_KO[match];
    return ko ? `${match}(${ko})` : match;
  });

  return result;
}

/**
 * 객체 안의 모든 string 필드를 재귀적으로 annotateHanja 적용한다.
 * AI 응답 JSON 객체 전체에 한 방에 적용할 때 사용.
 */
export function annotateHanjaDeep<T>(value: T): T {
  if (typeof value === "string") {
    return annotateHanja(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => annotateHanjaDeep(v)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = annotateHanjaDeep(v);
    }
    return out as T;
  }
  return value;
}
