/**
 * 성격 유형 테스트 — 20문항 (4축 × 5문항).
 *
 * A 선택 → 첫 번째 성향 (E·S·T·J)
 * B 선택 → 두 번째 성향 (I·N·F·P)
 *
 * 문항 텍스트는 i18n 메시지의 `personalityQuestions.q{n}_a` / `q{n}_b` 키에서 가져온다.
 */

export type Axis = "EI" | "SN" | "TF" | "JP";
export type Choice = "A" | "B";

export interface Question {
  /** 1~20 문항 ID — i18n 키와 매칭. */
  id: number;
  /** 4 축 중 하나. */
  axis: Axis;
}

export const QUESTIONS: Question[] = [
  // E vs I
  { id: 1, axis: "EI" },
  { id: 2, axis: "EI" },
  { id: 3, axis: "EI" },
  { id: 4, axis: "EI" },
  { id: 5, axis: "EI" },
  // S vs N
  { id: 6, axis: "SN" },
  { id: 7, axis: "SN" },
  { id: 8, axis: "SN" },
  { id: 9, axis: "SN" },
  { id: 10, axis: "SN" },
  // T vs F
  { id: 11, axis: "TF" },
  { id: 12, axis: "TF" },
  { id: 13, axis: "TF" },
  { id: 14, axis: "TF" },
  { id: 15, axis: "TF" },
  // J vs P
  { id: 16, axis: "JP" },
  { id: 17, axis: "JP" },
  { id: 18, axis: "JP" },
  { id: 19, axis: "JP" },
  { id: 20, axis: "JP" },
];

export type PersonalityType =
  | "ISTJ" | "ISFJ" | "INFJ" | "INTJ"
  | "ISTP" | "ISFP" | "INFP" | "INTP"
  | "ESTP" | "ESFP" | "ENFP" | "ENTP"
  | "ESTJ" | "ESFJ" | "ENFJ" | "ENTJ";

export interface AxisResult {
  /** 첫 번째 성향 레이블 (E·S·T·J). */
  labelA: string;
  /** 두 번째 성향 레이블 (I·N·F·P). */
  labelB: string;
  /** 결정된 성향 (A or B). */
  winner: "A" | "B";
  /** winner 성향의 퍼센트 (0-100). */
  pct: number;
}

export interface PersonalityResult {
  type: PersonalityType;
  axes: Record<Axis, AxisResult>;
}

const AXIS_LABELS: Record<Axis, [string, string]> = {
  EI: ["E", "I"],
  SN: ["S", "N"],
  TF: ["T", "F"],
  JP: ["J", "P"],
};

/**
 * 20개 답변 배열(A|B)을 받아 유형 코드와 축별 퍼센트를 반환한다.
 */
export function calcPersonalityResult(answers: Choice[]): PersonalityResult {
  const count: Record<Axis, { A: number; B: number }> = {
    EI: { A: 0, B: 0 },
    SN: { A: 0, B: 0 },
    TF: { A: 0, B: 0 },
    JP: { A: 0, B: 0 },
  };

  QUESTIONS.forEach((q, i) => {
    const ans = answers[i];
    if (ans === "A") count[q.axis].A++;
    else if (ans === "B") count[q.axis].B++;
  });

  const axes = {} as Record<Axis, AxisResult>;
  for (const axis of ["EI", "SN", "TF", "JP"] as Axis[]) {
    const total = count[axis].A + count[axis].B || 1;
    const winner = count[axis].A >= count[axis].B ? "A" : "B";
    const winCount = winner === "A" ? count[axis].A : count[axis].B;
    const [lA, lB] = AXIS_LABELS[axis];
    axes[axis] = {
      labelA: lA,
      labelB: lB,
      winner,
      pct: Math.round((winCount / total) * 100),
    };
  }

  const e = axes.EI.winner === "A" ? "E" : "I";
  const s = axes.SN.winner === "A" ? "S" : "N";
  const t = axes.TF.winner === "A" ? "T" : "F";
  const j = axes.JP.winner === "A" ? "J" : "P";

  return { type: `${e}${s}${t}${j}` as PersonalityType, axes };
}

/**
 * 하위 호환: 유형 코드만 필요한 경우.
 */
export function calcPersonalityType(answers: Choice[]): PersonalityType {
  return calcPersonalityResult(answers).type;
}
