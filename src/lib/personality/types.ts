/**
 * 16가지 성격 유형 설명.
 */
import type { PersonalityType } from "./questions";

export interface TypeInfo {
  type: PersonalityType;
  nickname: string;        // 한글 별명
  emoji: string;
  summary: string;         // 한 줄 설명
  strengths: string[];     // 강점 3가지
  cautions: string[];      // 주의점 2가지
  /** 이 유형과 잘 맞는 유형. */
  compatibleWith: PersonalityType[];
}

export const TYPE_INFO: Record<PersonalityType, TypeInfo> = {
  ISTJ: {
    type: "ISTJ", nickname: "신뢰의 기둥", emoji: "🏛️",
    summary: "철저하고 책임감이 강한 현실주의자. 규칙과 의무를 중시해.",
    strengths: ["강한 책임감", "세심한 계획력", "변함없는 신뢰성"],
    cautions: ["변화에 유연하게 적응하기", "감정 표현 늘리기"],
    compatibleWith: ["ESFP", "ESTP"],
  },
  ISFJ: {
    type: "ISFJ", nickname: "따뜻한 수호자", emoji: "🌷",
    summary: "헌신적이고 따뜻한 마음을 지닌 조용한 보호자.",
    strengths: ["깊은 배려심", "꼼꼼한 실행력", "충실한 헌신"],
    cautions: ["자신의 감정도 돌보기", "거절하는 연습"],
    compatibleWith: ["ESFP", "ESTP"],
  },
  INFJ: {
    type: "INFJ", nickname: "영감의 예언자", emoji: "🔮",
    summary: "이상을 향해 조용히 나아가는 드문 통찰가.",
    strengths: ["깊은 직관력", "강한 공감 능력", "명확한 비전"],
    cautions: ["완벽주의 내려놓기", "번아웃 주의"],
    compatibleWith: ["ENFP", "ENTP"],
  },
  INTJ: {
    type: "INTJ", nickname: "전략가", emoji: "♟️",
    summary: "독립적이고 전략적인 큰 그림의 설계자.",
    strengths: ["장기적 전략 수립", "독립적 사고", "높은 목표 의식"],
    cautions: ["유연성 기르기", "감정 교류 늘리기"],
    compatibleWith: ["ENFP", "ENTP"],
  },
  ISTP: {
    type: "ISTP", nickname: "만능 재주꾼", emoji: "🔧",
    summary: "실용적이고 냉정한 관찰자. 손으로 직접 해결하는 걸 즐겨.",
    strengths: ["탁월한 문제 해결력", "침착한 위기 대처", "실용적 사고"],
    cautions: ["장기 계획 세우기", "감정 표현하기"],
    compatibleWith: ["ESFJ", "ESTJ"],
  },
  ISFP: {
    type: "ISFP", nickname: "자유로운 예술가", emoji: "🎨",
    summary: "조용하고 따뜻한 감성을 지닌 현재를 즐기는 탐험가.",
    strengths: ["풍부한 감수성", "열린 마음", "자연스러운 친절"],
    cautions: ["장기적 계획도 필요해", "자신의 의견 표현하기"],
    compatibleWith: ["ESFJ", "ENFJ"],
  },
  INFP: {
    type: "INFP", nickname: "이상주의 몽상가", emoji: "🌙",
    summary: "깊은 감성과 신념을 가진 조용한 이상주의자.",
    strengths: ["깊은 공감력", "창의적 사고", "강한 가치관"],
    cautions: ["현실과 균형 맞추기", "감정 과몰입 주의"],
    compatibleWith: ["ENFJ", "ENTJ"],
  },
  INTP: {
    type: "INTP", nickname: "논리적 사색가", emoji: "🔭",
    summary: "끝없는 호기심으로 세상을 분석하는 조용한 혁신가.",
    strengths: ["깊은 분석력", "독창적 사고", "객관적 판단"],
    cautions: ["실행력 키우기", "대인 관계 챙기기"],
    compatibleWith: ["ENTJ", "ESTJ"],
  },
  ESTP: {
    type: "ESTP", nickname: "대담한 사업가", emoji: "⚡",
    summary: "에너지 넘치고 현실적인 행동파. 지금 이 순간을 즐겨.",
    strengths: ["빠른 실행력", "뛰어난 위기 대처", "강한 설득력"],
    cautions: ["장기 계획도 필요해", "충동적 행동 점검"],
    compatibleWith: ["ISFJ", "ISTJ"],
  },
  ESFP: {
    type: "ESFP", nickname: "자유로운 연예인", emoji: "🎉",
    summary: "활기차고 즉흥적인 삶의 즐거움을 퍼트리는 사람.",
    strengths: ["넘치는 활력", "뛰어난 사교성", "현재 순간에 집중"],
    cautions: ["장기적 계획 세우기", "진지한 대화도 필요해"],
    compatibleWith: ["ISFJ", "ISTJ"],
  },
  ENFP: {
    type: "ENFP", nickname: "열정적 활동가", emoji: "✨",
    summary: "상상력과 열정이 넘치는 자유로운 영혼.",
    strengths: ["강한 창의력", "뛰어난 공감 능력", "끝없는 호기심"],
    cautions: ["집중력 유지하기", "마무리 능력 키우기"],
    compatibleWith: ["INFJ", "INTJ"],
  },
  ENTP: {
    type: "ENTP", nickname: "논쟁을 즐기는 발명가", emoji: "💡",
    summary: "도전을 즐기고 아이디어가 넘치는 혁신가.",
    strengths: ["빠른 통찰력", "창의적 문제 해결", "강한 토론 능력"],
    cautions: ["마무리하는 습관 키우기", "상대 감정도 살피기"],
    compatibleWith: ["INFJ", "INTJ"],
  },
  ESTJ: {
    type: "ESTJ", nickname: "엄격한 관리자", emoji: "📋",
    summary: "체계와 질서를 중시하는 타고난 리더.",
    strengths: ["강한 실행력", "뛰어난 조직력", "명확한 의사결정"],
    cautions: ["유연성 기르기", "타인의 방식도 인정하기"],
    compatibleWith: ["ISFP", "ISTP"],
  },
  ESFJ: {
    type: "ESFJ", nickname: "사교적 외교관", emoji: "🤝",
    summary: "주변을 배려하고 조화를 추구하는 따뜻한 외교관.",
    strengths: ["뛰어난 배려심", "강한 협동력", "현실적 실행력"],
    cautions: ["자신의 욕구도 챙기기", "타인 평가에 덜 의존하기"],
    compatibleWith: ["ISFP", "ISTP"],
  },
  ENFJ: {
    type: "ENFJ", nickname: "정의로운 사회운동가", emoji: "🌟",
    summary: "카리스마 넘치고 타인을 성장시키는 천부적 리더.",
    strengths: ["뛰어난 리더십", "강한 공감 능력", "영감을 주는 소통"],
    cautions: ["자신도 돌볼 것", "과도한 타인 의존 주의"],
    compatibleWith: ["INFP", "ISFP"],
  },
  ENTJ: {
    type: "ENTJ", nickname: "대담한 지도자", emoji: "👑",
    summary: "카리스마 있는 전략적 리더. 목표를 향해 거침없이 나아가.",
    strengths: ["강한 추진력", "뛰어난 전략 능력", "명확한 비전 제시"],
    cautions: ["감정도 함께 살피기", "속도 조절하기"],
    compatibleWith: ["INFP", "INTP"],
  },
};
