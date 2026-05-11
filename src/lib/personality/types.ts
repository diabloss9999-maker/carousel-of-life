/**
 * 16가지 성격 유형 설명.
 */
import type { PersonalityType } from "./questions";

export interface TypeInfo {
  type: PersonalityType;
  nickname: string;        // 한글 별명
  emoji: string;
  summary: string;         // 한 줄 설명
  description: string;     // 상세 설명 (2-3문장)
  strengths: string[];     // 강점 3가지
  cautions: string[];      // 주의점 2가지
  /** 이 유형과 잘 맞는 유형. */
  compatibleWith: PersonalityType[];
  /** 주의가 필요한 유형. */
  incompatibleWith: PersonalityType[];
  /** 카드 이미지 직업/역할 설명. */
  imageRole: string;
  /** 잘 어울리는 직업군. */
  suitableJobs: string[];
}

export const TYPE_INFO: Record<PersonalityType, TypeInfo> = {
  ISTJ: {
    type: "ISTJ", nickname: "신뢰의 기둥", emoji: "",
    summary: "철저하고 책임감이 강한 현실주의자. 규칙과 의무를 중시해.",
    description: "ISTJ는 성실함과 신뢰가 몸에 배어 있는 유형이야. 한번 맡은 일은 끝까지 완수하고, 약속을 어기는 일이 거의 없어. 감정보다 사실과 논리를 중시하며, 오랜 시간 검증된 전통과 방식을 신뢰해. 겉으로 차가워 보일 수 있지만 속으로는 주변 사람을 깊이 아끼는 따뜻한 면도 있어.",
    strengths: ["강한 책임감과 성실함", "세심하고 체계적인 계획력", "변함없는 신뢰와 일관성"],
    cautions: ["변화에 좀 더 유연하게 대응하기", "감정 표현을 늘려 관계 깊이 더하기"],
    compatibleWith: ["ESFP", "ESTP"],
    incompatibleWith: ["ENFP", "ENTP"],
    imageRole: "별의 지도를 보는 군사 전략가",
    suitableJobs: ["전략 컨설턴트", "연구원", "시스템 분석가", "건축가", "투자 분석가"],
  },
  ISFJ: {
    type: "ISFJ", nickname: "따뜻한 수호자", emoji: "",
    summary: "헌신적이고 따뜻한 마음을 지닌 조용한 보호자.",
    description: "ISFJ는 주변 사람들의 필요를 본능적으로 알아채고 조용히 도와주는 유형이야. 기억력이 좋아 지인의 소소한 취향이나 특별한 날을 잘 기억해. 자신보다 타인을 먼저 생각하는 경향이 강하고, 안정된 환경과 깊은 인간관계를 소중히 여겨. 갑작스러운 변화보다는 익숙하고 안전한 것을 선호해.",
    strengths: ["세심하고 깊은 배려심", "꼼꼼하고 책임감 있는 실행력", "변함없는 헌신과 충직함"],
    cautions: ["자신의 감정과 욕구도 소중히 돌보기", "원치 않을 때 거절하는 연습하기"],
    compatibleWith: ["ESFP", "ESTP"],
    incompatibleWith: ["ENFP", "ENTP"],
    imageRole: "성소의 수호자 / 치유사",
    suitableJobs: ["간호사", "사회복지사", "초등교사", "비서", "행정 지원"],
  },
  INFJ: {
    type: "INFJ", nickname: "영감의 예언자", emoji: "",
    summary: "이상을 향해 조용히 나아가는 드문 통찰가.",
    description: "INFJ는 16가지 유형 중 가장 드문 유형 중 하나야. 사람의 마음을 꿰뚫어 보는 직관력과 깊은 공감 능력을 동시에 갖고 있어. 혼자만의 시간이 필요하지만 동시에 인류 전체에 긍정적인 영향을 끼치고 싶어 해. 이상과 가치를 위해서라면 강한 의지로 오랜 시간 노력할 수 있어.",
    strengths: ["남다른 직관력과 통찰력", "강한 공감과 이해 능력", "명확하고 굳은 비전"],
    cautions: ["완벽주의를 조금 내려놓기", "자신을 너무 혹사시키는 번아웃 주의"],
    compatibleWith: ["ENFP", "ENTP"],
    incompatibleWith: ["ESTP", "ESFP"],
    imageRole: "영적 상담가 / 조용한 개혁가",
    suitableJobs: ["심리 상담사", "작가", "사회복지사", "의사", "교육자"],
  },
  INTJ: {
    type: "INTJ", nickname: "전략가", emoji: "",
    summary: "독립적이고 전략적인 큰 그림의 설계자.",
    description: "INTJ는 복잡한 시스템과 패턴을 꿰뚫어 보는 뛰어난 전략적 사고를 지닌 유형이야. 혼자 깊이 생각하고 분석하는 걸 즐기며, 높은 기준을 스스로에게도 타인에게도 적용해. 비효율을 참지 못하고 자신의 판단을 강하게 믿는 경향이 있어. 겉으로는 냉철해 보이지만 자신이 선택한 분야에서는 놀라운 열정을 보여.",
    strengths: ["장기적이고 탁월한 전략 수립", "독립적이고 창의적인 사고", "높은 목표 의식과 추진력"],
    cautions: ["상황에 따라 유연성을 발휘하기", "감정적 교류와 소통 늘리기"],
    compatibleWith: ["ENFP", "ENTP"],
    incompatibleWith: ["ESFP", "ESTP"],
    imageRole: "별의 지도를 보는 군사 전략가 / 체스형 전술가",
    suitableJobs: ["전략 컨설턴트", "연구원", "시스템 분석가", "건축가", "투자 분석가"],
  },
  ISTP: {
    type: "ISTP", nickname: "만능 재주꾼", emoji: "",
    summary: "실용적이고 냉정한 관찰자. 손으로 직접 해결하는 걸 즐겨.",
    description: "ISTP는 어떤 상황이든 침착하게 분석하고 최적의 해결책을 찾아내는 유형이야. 도구와 기계, 손으로 직접 만지고 고치는 것을 즐기며 탁월한 공간 감각을 지녀. 불필요한 규칙보다는 자유롭게 자신의 방식으로 문제를 해결하는 걸 좋아해. 위기 상황에서 가장 빛을 발하는 유형이야.",
    strengths: ["탁월한 문제 해결력과 손재주", "위기 상황에서도 침착한 대처", "편견 없는 실용적 사고"],
    cautions: ["장기적 계획을 세우는 습관 기르기", "감정을 솔직하게 표현하기"],
    compatibleWith: ["ESFJ", "ESTJ"],
    incompatibleWith: ["ENFJ", "ESFP"],
    imageRole: "장인 / 기계공 / 현장 해결사",
    suitableJobs: ["엔지니어", "외과의", "파일럿", "기술자", "포렌식 전문가"],
  },
  ISFP: {
    type: "ISFP", nickname: "자유로운 예술가", emoji: "",
    summary: "조용하고 따뜻한 감성을 지닌 현재를 즐기는 탐험가.",
    description: "ISFP는 눈에 띄지 않게 조용히 존재하지만, 세상을 아름다움과 조화의 눈으로 바라보는 섬세한 감성의 소유자야. 자신만의 독창적인 방식으로 자신을 표현하며, 삶의 소소한 순간에서 진짜 행복을 찾아. 경쟁보다는 협력을, 논쟁보다는 조화를 택하는 유형이야.",
    strengths: ["풍부하고 섬세한 감수성", "편견 없이 열린 따뜻한 마음", "자연스럽고 진심 어린 친절"],
    cautions: ["미래를 위한 장기적 계획도 필요해", "자신의 의견을 좀 더 적극적으로 표현하기"],
    compatibleWith: ["ESFJ", "ENFJ"],
    incompatibleWith: ["ENTJ", "ESTJ"],
    imageRole: "화가 / 자연 공예가",
    suitableJobs: ["예술가", "패션 디자이너", "사진작가", "셰프", "물리치료사"],
  },
  INFP: {
    type: "INFP", nickname: "이상주의 몽상가", emoji: "",
    summary: "깊은 감성과 신념을 가진 조용한 이상주의자.",
    description: "INFP는 자신만의 가치관과 이상을 가장 소중히 여기는 유형이야. 겉으로는 조용하지만 내면에는 풍부하고 복잡한 감정의 세계를 품고 있어. 진정성 있는 관계와 의미 있는 삶을 추구하며, 세상을 더 나은 곳으로 만들고 싶다는 소망을 품고 있어. 창의적인 글쓰기, 예술, 음악 등으로 내면을 표현하는 걸 즐겨.",
    strengths: ["깊고 섬세한 공감력", "독창적이고 창의적인 사고", "타협하지 않는 강한 가치관"],
    cautions: ["현실과의 균형을 맞추기", "감정 과몰입으로 인한 소진 주의"],
    compatibleWith: ["ENFJ", "ENTJ"],
    incompatibleWith: ["ESTJ", "ESTP"],
    imageRole: "시적 중재자 / 치유자 / 꿈 해석가",
    suitableJobs: ["작가", "예술가", "상담사", "UX 디자이너", "심리학자"],
  },
  INTP: {
    type: "INTP", nickname: "논리적 사색가", emoji: "",
    summary: "끝없는 호기심으로 세상을 분석하는 조용한 혁신가.",
    description: "INTP는 세상의 모든 것을 이해하고 설명하고 싶어 하는 지적 탐구자야. 복잡한 이론과 개념을 다루는 걸 즐기며, 논리적 허점을 발견하는 데 탁월한 능력을 보여. 대화보다는 혼자 생각하는 시간이 더 편하고, 때로는 머릿속 아이디어가 너무 많아 실행이 늦어지기도 해. 기존 틀을 뒤집는 독창적인 아이디어로 세상에 기여하고 싶어.",
    strengths: ["날카롭고 깊은 분석력", "기존 틀을 깨는 독창적 사고", "감정에 흔들리지 않는 객관적 판단"],
    cautions: ["생각에서 실행으로 옮기는 연습", "대인 관계와 소통도 챙기기"],
    compatibleWith: ["ENTJ", "ESTJ"],
    incompatibleWith: ["ESFJ", "ESFP"],
    imageRole: "천문 관측소의 철학자 / 이론 학자",
    suitableJobs: ["과학자", "철학자", "소프트웨어 개발자", "대학 교수", "데이터 분석가"],
  },
  ESTP: {
    type: "ESTP", nickname: "대담한 사업가", emoji: "",
    summary: "에너지 넘치고 현실적인 행동파. 지금 이 순간을 즐겨.",
    description: "ESTP는 어떤 상황에서도 기회를 발견하고 즉각 행동으로 옮기는 타고난 실행가야. 위험을 두려워하지 않고 오히려 스릴을 즐기며, 빠른 판단력과 순발력이 탁월해. 지루한 이론보다는 직접 몸으로 부딪히며 배우는 걸 선호하고, 사람들 사이에서 분위기를 주도하는 자연스러운 능력을 갖고 있어.",
    strengths: ["즉각적이고 과감한 실행력", "위기 상황에서 빛나는 대처 능력", "사람을 사로잡는 설득력"],
    cautions: ["장기적 계획과 미래 준비도 필요해", "충동적인 행동을 한번쯤 점검하기"],
    compatibleWith: ["ISFJ", "ISTJ"],
    incompatibleWith: ["INFJ", "INTJ"],
    imageRole: "모험 상인 / 탐험가 / 거래가",
    suitableJobs: ["영업직", "기업가", "스포츠 선수", "응급 구조사", "부동산 중개인"],
  },
  ESFP: {
    type: "ESFP", nickname: "자유로운 연예인", emoji: "",
    summary: "활기차고 즉흥적인 삶의 즐거움을 퍼트리는 사람.",
    description: "ESFP는 어디에 있든 그 자리를 활기차게 만드는 천생 엔터테이너야. 삶 자체를 무대로 여기며, 사람들과 어울리고 즐거운 순간을 만들어 내는 걸 사랑해. 지금 이 순간에 집중하며, 미래 계획보다는 현재의 경험을 소중히 여겨. 주변 사람들을 행복하게 만드는 놀라운 재주를 가지고 있어.",
    strengths: ["넘치는 긍정 에너지와 활력", "뛰어난 사교성과 공감 능력", "현재 순간을 충분히 즐기는 능력"],
    cautions: ["미래를 위한 장기적 계획 세우기", "가끔은 진지하고 깊은 대화도 필요해"],
    compatibleWith: ["ISFJ", "ISTJ"],
    incompatibleWith: ["INTJ", "INFJ"],
    imageRole: "축제 연예인 / 공연자",
    suitableJobs: ["연예인", "이벤트 MC", "관광 가이드", "판매원", "유튜버"],
  },
  ENFP: {
    type: "ENFP", nickname: "열정적 활동가", emoji: "",
    summary: "상상력과 열정이 넘치는 자유로운 영혼.",
    description: "ENFP는 세상을 가능성으로 가득 찬 곳으로 보는 낙관적인 열정가야. 새로운 아이디어와 사람들에게 쉽게 흥미를 느끼고, 자신의 열정으로 주변 사람들에게 영감을 줘. 깊은 인간 이해와 탁월한 공감 능력으로 누구와도 금방 친해지는 편이야. 다만 너무 많은 것에 관심을 가져 한 가지에 집중하기 어려울 때도 있어.",
    strengths: ["넘치는 창의력과 상상력", "깊은 공감과 따뜻한 연결 능력", "새로운 것에 대한 끝없는 호기심"],
    cautions: ["한 가지에 집중하는 연습하기", "시작한 일을 끝까지 마무리하기"],
    compatibleWith: ["INFJ", "INTJ"],
    incompatibleWith: ["ISTJ", "ISFJ"],
    imageRole: "축제 기획자 / 영감 주는 퍼포머",
    suitableJobs: ["크리에이터", "마케터", "배우", "기자", "이벤트 기획자"],
  },
  ENTP: {
    type: "ENTP", nickname: "논쟁을 즐기는 발명가", emoji: "",
    summary: "도전을 즐기고 아이디어가 넘치는 혁신가.",
    description: "ENTP는 기존의 틀에 도전하고 새로운 아이디어를 끊임없이 쏟아내는 창의적 혁신가야. 지적 논쟁을 즐기며, 반대 의견에도 당당히 자신의 주장을 펼쳐. 다양한 분야에 폭넓은 관심을 가지고 있으며, 불가능해 보이는 것도 가능하게 만드는 방법을 찾는 걸 즐겨. 아이디어는 넘치지만 실행과 마무리에서 약점을 보이기도 해.",
    strengths: ["빠른 통찰력과 지적 유연성", "복잡한 문제를 새롭게 해결하는 창의력", "어떤 상황에도 당당한 토론 능력"],
    cautions: ["시작한 일을 끝내는 습관 기르기", "토론할 때 상대방 감정도 살피기"],
    compatibleWith: ["INFJ", "INTJ"],
    incompatibleWith: ["ISTJ", "ISFJ"],
    imageRole: "토론가 / 혁신가 / 발명가",
    suitableJobs: ["창업가", "마케터", "변호사", "발명가", "광고 기획자"],
  },
  ESTJ: {
    type: "ESTJ", nickname: "엄격한 관리자", emoji: "",
    summary: "체계와 질서를 중시하는 타고난 리더.",
    description: "ESTJ는 공동체의 질서와 규칙을 지키는 것을 사명으로 여기는 타고난 조직자야. 명확한 목표를 세우고 체계적으로 실행하는 능력이 뛰어나며, 책임감이 강해 주변 사람들의 신뢰를 받아. 전통과 검증된 방식을 중시하며, 비효율을 참지 못하는 성향이 있어. 리더 자리에서 가장 뛰어난 능력을 발휘해.",
    strengths: ["탁월한 조직력과 실행력", "명확한 의사결정과 리더십", "높은 책임감과 헌신"],
    cautions: ["상황에 따른 유연성 발휘하기", "다양한 방식과 의견도 인정하기"],
    compatibleWith: ["ISFP", "ISTP"],
    incompatibleWith: ["INFP", "INTP"],
    imageRole: "도시 행정관 / 법과 질서의 관리자",
    suitableJobs: ["관리자", "판사", "경찰관", "금융 감독관", "군 장교"],
  },
  ESFJ: {
    type: "ESFJ", nickname: "사교적 외교관", emoji: "",
    summary: "주변을 배려하고 조화를 추구하는 따뜻한 외교관.",
    description: "ESFJ는 주변 사람들의 필요를 먼저 알아채고 챙기는 따뜻한 성격의 소유자야. 사람들이 서로 잘 어울리도록 분위기를 조성하는 데 탁월하며, 갈등 상황에서도 중재 역할을 자연스럽게 맡아. 타인의 인정과 감사를 통해 에너지를 얻는 편이며, 전통적인 가치와 공동체를 소중히 여겨.",
    strengths: ["뛰어난 공감과 세심한 배려심", "강한 협동력과 팀워크", "현실적이고 꼼꼼한 실행력"],
    cautions: ["자신의 욕구와 감정도 우선시하기", "타인의 평가에 덜 의존하는 연습하기"],
    compatibleWith: ["ISFP", "ISTP"],
    incompatibleWith: ["INTP", "INTJ"],
    imageRole: "궁정 외교관 / 연회 주최자",
    suitableJobs: ["간호사", "교사", "영업 관리자", "HR 담당자", "이벤트 플래너"],
  },
  ENFJ: {
    type: "ENFJ", nickname: "정의로운 사회운동가", emoji: "",
    summary: "카리스마 넘치고 타인을 성장시키는 천부적 리더.",
    description: "ENFJ는 타인의 성장과 발전에서 보람을 느끼는 천부적인 멘토야. 뛰어난 언변과 공감 능력으로 사람들에게 영감을 주고, 집단 전체가 목표를 향해 나아가도록 이끌어. 타인의 감정을 본능적으로 파악하고 필요한 말을 건네는 데 탁월해. 다만 다른 사람을 위해 자신을 너무 소모할 때도 있어.",
    strengths: ["타고난 카리스마와 리더십", "깊은 공감과 영감을 주는 소통 능력", "사람과 공동체를 하나로 묶는 힘"],
    cautions: ["자신의 에너지와 감정도 챙기기", "타인에게 과도하게 의존하지 않도록 주의"],
    compatibleWith: ["INFP", "ISFP"],
    incompatibleWith: ["ISTP", "ISTJ"],
    imageRole: "공동체 지도자 / 인도자",
    suitableJobs: ["교사", "코치", "HR 매니저", "사회운동가", "방송인"],
  },
  ENTJ: {
    type: "ENTJ", nickname: "대담한 지도자", emoji: "",
    summary: "카리스마 있는 전략적 리더. 목표를 향해 거침없이 나아가.",
    description: "ENTJ는 목표를 설정하고 그것을 달성하기 위해 모든 자원을 동원하는 타고난 사령관이야. 비효율적인 것을 참지 못하고 항상 더 나은 방법을 찾아. 강한 자신감과 결단력으로 위기 상황에서도 흔들리지 않고 리더십을 발휘해. 장기적 비전을 품고 있으며, 불가능해 보이는 목표도 달성 가능한 계획으로 만드는 능력이 있어.",
    strengths: ["강력한 추진력과 결단력", "장기적 전략과 뛰어난 기획력", "명확하고 감동적인 비전 제시"],
    cautions: ["함께하는 사람들의 감정도 살피기", "목표만큼이나 과정의 속도 조절하기"],
    compatibleWith: ["INFP", "INTP"],
    incompatibleWith: ["ISFP", "ISFJ"],
    imageRole: "제국의 지휘관 / 통치자",
    suitableJobs: ["CEO", "경영 컨설턴트", "변호사", "정치인", "프로젝트 매니저"],
  },
};
