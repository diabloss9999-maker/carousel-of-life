/**
 * 성격 유형 테스트 — 20문항 (4축 × 5문항).
 *
 * A 선택 → 첫 번째 성향 (E·S·T·J)
 * B 선택 → 두 번째 성향 (I·N·F·P)
 */

export type Axis = "EI" | "SN" | "TF" | "JP";
export type Choice = "A" | "B";

export interface Question {
  id: number;
  axis: Axis;
  /** A 선택지 텍스트 (E·S·T·J 성향). */
  a: string;
  /** B 선택지 텍스트 (I·N·F·P 성향). */
  b: string;
}

export const QUESTIONS: Question[] = [
  // E vs I
  { id: 1,  axis: "EI", a: "사람들과 함께 있을 때 에너지가 충전된다.",       b: "혼자만의 시간이 있어야 에너지가 회복된다." },
  { id: 2,  axis: "EI", a: "처음 만난 사람과도 쉽게 대화를 시작한다.",       b: "낯선 사람에게 먼저 말 거는 건 조금 불편하다." },
  { id: 3,  axis: "EI", a: "생각을 말하면서 정리하는 편이다.",                b: "말하기 전에 속으로 먼저 정리한다." },
  { id: 4,  axis: "EI", a: "주말엔 친구들과 어울리고 싶다.",                  b: "주말엔 조용히 혼자 쉬는 게 좋다." },
  { id: 5,  axis: "EI", a: "많은 사람 앞에서 발표해도 크게 긴장하지 않는다.", b: "많은 사람 앞에 서면 긴장이 된다." },

  // S vs N
  { id: 6,  axis: "SN", a: "현실적이고 실용적인 것을 선호한다.",              b: "가능성과 아이디어에 더 끌린다." },
  { id: 7,  axis: "SN", a: "경험으로 증명된 방법을 믿는다.",                  b: "새로운 방식을 시도하는 걸 즐긴다." },
  { id: 8,  axis: "SN", a: "세부 사항과 구체적인 사실에 집중한다.",            b: "전체적인 그림과 패턴을 먼저 파악한다." },
  { id: 9,  axis: "SN", a: "지금 이 순간과 현재에 집중한다.",                  b: "미래 가능성을 자주 상상한다." },
  { id: 10, axis: "SN", a: "말 그대로의 의미를 선호한다.",                    b: "비유나 상징적 표현이 더 와닿는다." },

  // T vs F
  { id: 11, axis: "TF", a: "결정할 때 논리와 사실을 우선한다.",               b: "결정할 때 감정과 사람을 우선한다." },
  { id: 12, axis: "TF", a: "비판적 피드백은 솔직하게 전달하는 게 맞다.",       b: "피드백은 상대 감정을 먼저 고려해서 한다." },
  { id: 13, axis: "TF", a: "공정한 결과가 모두의 화합보다 중요하다.",           b: "모두가 행복한 결과가 가장 중요하다." },
  { id: 14, axis: "TF", a: "갈등은 원칙에 따라 해결한다.",                    b: "갈등은 서로의 감정을 이해하며 해결한다." },
  { id: 15, axis: "TF", a: "논쟁에서 이치가 맞으면 상대 의견을 받아들인다.", b: "논쟁보다 서로 이해하는 과정이 더 중요하다." },

  // J vs P
  { id: 16, axis: "JP", a: "계획을 세우고 그대로 따르는 걸 좋아한다.",        b: "즉흥적으로 흘러가는 걸 즐긴다." },
  { id: 17, axis: "JP", a: "마감일을 미리 여유 있게 지킨다.",                  b: "마감 직전에 집중력이 최고조가 된다." },
  { id: 18, axis: "JP", a: "정리된 환경에서 효율이 높다.",                    b: "약간 자유로운 환경에서 창의성이 나온다." },
  { id: 19, axis: "JP", a: "결정을 빨리 내리고 마무리 짓는다.",               b: "더 많은 정보를 모은 후 결정한다." },
  { id: 20, axis: "JP", a: "일정과 루틴이 있으면 안정감을 느낀다.",            b: "변화와 유연성이 있어야 편하다." },
];

export type PersonalityType =
  | "ISTJ" | "ISFJ" | "INFJ" | "INTJ"
  | "ISTP" | "ISFP" | "INFP" | "INTP"
  | "ESTP" | "ESFP" | "ENFP" | "ENTP"
  | "ESTJ" | "ESFJ" | "ENFJ" | "ENTJ";

/**
 * 20개 답변 배열(A|B)을 받아 성격 유형 코드를 반환한다.
 */
export function calcPersonalityType(answers: Choice[]): PersonalityType {
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

  const e = count.EI.A >= count.EI.B ? "E" : "I";
  const s = count.SN.A >= count.SN.B ? "S" : "N";
  const t = count.TF.A >= count.TF.B ? "T" : "F";
  const j = count.JP.A >= count.JP.B ? "J" : "P";

  return `${e}${s}${t}${j}` as PersonalityType;
}
