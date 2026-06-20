import type { DailyFortune } from "@/db/schema";
import type { FortuneCategoryId } from "@/lib/constants";

interface DailyActionGuide {
  luckyTime: string;
  opportunity: string;
  caution: string;
  action: string;
}

const TIME_WINDOWS = [
  "07:00 - 09:00",
  "09:00 - 11:00",
  "11:00 - 13:00",
  "13:00 - 15:00",
  "15:00 - 17:00",
  "17:00 - 19:00",
  "19:00 - 21:00",
] as const;

const CATEGORY_GUIDES: Record<
  FortuneCategoryId,
  { opportunity: string[]; caution: string[]; action: string[] }
> = {
  general: {
    opportunity: [
      "미뤄둔 일을 하나 정리하기 좋아요.",
      "작은 선택 하나로 분위기를 바꿀 수 있어요.",
      "사람들과의 약속에서 힌트가 생겨요.",
    ],
    caution: [
      "성급한 결론은 피하는 게 좋아요.",
      "기분에 따라 일정을 바꾸지 않게 조심해요.",
      "여러 일을 동시에 잡으면 흐름이 흩어질 수 있어요.",
    ],
    action: [
      "오늘 꼭 할 세 가지를 먼저 적어보세요.",
      "답을 미룬 연락 하나를 정리해보세요.",
      "가장 쉬운 일부터 시작해 리듬을 만드세요.",
    ],
  },
  love: {
    opportunity: [
      "가벼운 안부가 관계의 온도를 올려요.",
      "솔직한 표현이 예상보다 부드럽게 닿아요.",
      "상대의 말끝보다 분위기를 보는 게 좋아요.",
    ],
    caution: [
      "확인받고 싶은 마음을 너무 빨리 꺼내지 마세요.",
      "혼자 해석해서 결론 내리기 쉬운 날이에요.",
      "지난 입장을 크게 받아들이지 않는 게 좋아요.",
    ],
    action: [
      "부담 없는 한 문장으로 먼저 말을 걸어보세요.",
      "좋았던 기억 하나를 자연스럽게 꺼내보세요.",
      "상대의 하루를 묻는 질문으로 시작하세요.",
    ],
  },
  money: {
    opportunity: [
      "작은 절약이 눈에 보이는 날이에요.",
      "미뤄둔 정산이나 결제 점검이 좋아요.",
      "필요한 것과 갖고 싶은 것을 구분하기 쉬워요.",
    ],
    caution: [
      "즉흥 구매나 만족감 소비가 지갑을 흔들 수 있어요.",
      "남의 추천만 믿고 결정하지 마세요.",
      "큰돈이 오가는 약속은 한 번 더 확인해요.",
    ],
    action: [
      "오늘 쓸 예산을 먼저 정해보세요.",
      "구독이나 자동결제 하나를 점검하세요.",
      "장바구니를 바로 결제하지 말고 한 번 쉬어가세요.",
    ],
  },
  career: {
    opportunity: [
      "정리된 말이 좋은 인상을 남겨요.",
      "중요한 일의 우선순위가 드러나요.",
      "작은 제안이 일의 흐름을 바꿀 수 있어요.",
    ],
    caution: [
      "감정 섞인 답변은 잠시 미루는 게 좋아요.",
      "급하게 맡은 일은 조건을 확인하세요.",
      "회의에서 말이 길어지지 않게 조심해요.",
    ],
    action: [
      "오늘 가장 중요한 업무 하나를 먼저 끝내세요.",
      "회의 후 핵심 문장을 세 줄로 정리하세요.",
      "지원이 필요한 부분은 미리 공유하세요.",
    ],
  },
  health: {
    opportunity: [
      "컨디션 회복을 위한 작은 루틴이 잘 맞아요.",
      "몸의 긴장을 풀면 집중도 같이 올라요.",
      "수면과 식사 리듬을 정리하기 좋아요.",
    ],
    caution: [
      "무리한 운동이나 과로는 피하는 게 좋아요.",
      "카페인이나 야식이 리듬을 흐리기 쉬워요.",
      "몸의 작은 신호를 넘기지 마세요.",
    ],
    action: [
      "물 한 잔과 가벼운 스트레칭으로 시작하세요.",
      "잠들기 한 시간 전에는 화면 보는 시간을 줄여보세요.",
      "오래 앉아 있었다면 5분만 걸어보세요.",
    ],
  },
  study: {
    opportunity: [
      "짧게 반복하는 공부가 잘 들어와요.",
      "어려운 부분을 다시 구조화하기 좋아요.",
      "집중 시간대를 잡으면 효율이 올라요.",
    ],
    caution: [
      "처음부터 완벽하게 하려면 시작이 늦어질 수 있어요.",
      "공부량보다 방향을 먼저 확인하세요.",
      "비교 때문에 페이스가 흔들리지 않게 해요.",
    ],
    action: [
      "25분 집중, 5분 휴식으로 한 세트만 시작하세요.",
      "틀린 문제 하나를 끝까지 다시 풀어보세요.",
      "오늘 외울 범위를 작게 나눠보세요.",
    ],
  },
  zodiac: {
    opportunity: [
      "평소보다 감각적인 선택이 잘 맞아요.",
      "분위기를 바꾸는 작은 시도가 좋아요.",
      "나에게 맞는 속도를 다시 찾기 좋아요.",
    ],
    caution: [
      "기분의 파도를 그대로 말로 옮기지 않게 해요.",
      "즉흥적인 약속은 일정을 확인하고 잡으세요.",
      "기대가 커질수록 기준을 적어보세요.",
    ],
    action: [
      "오늘의 색을 옷이나 소품에 작게 더해보세요.",
      "걷는 길이나 음악을 바꿔 분위기를 환기하세요.",
      "내가 편안해지는 선택 하나를 해보세요.",
    ],
  },
  chinese_zodiac: {
    opportunity: [
      "오래된 습관을 정리할 타이밍이에요.",
      "사람 사이의 예의와 균형이 힘이 돼요.",
      "차분한 준비가 좋은 결과로 이어져요.",
    ],
    caution: [
      "익숙하다는 이유로 대충 넘기지 마세요.",
      "자존심 때문에 말을 아끼면 오해가 생길 수 있어요.",
      "무리하게 앞서가기보다 순서를 지켜요.",
    ],
    action: [
      "오늘 꼭 지킬 기준 하나를 정하세요.",
      "중요한 약속은 시간과 장소를 다시 확인하세요.",
      "오래 미룬 정리 하나를 끝내보세요.",
    ],
  },
};

export function getDailyActionGuide(fortune: DailyFortune): DailyActionGuide {
  const category = fortune.category as FortuneCategoryId;
  const guide = CATEGORY_GUIDES[category] ?? CATEGORY_GUIDES.general;
  const seed = buildSeed(fortune);

  return {
    luckyTime: TIME_WINDOWS[seed % TIME_WINDOWS.length],
    opportunity: guide.opportunity[seed % guide.opportunity.length],
    caution: guide.caution[(seed + fortune.score) % guide.caution.length],
    action: guide.action[(seed + (fortune.luckyNumber ?? 0)) % guide.action.length],
  };
}

function buildSeed(fortune: DailyFortune): number {
  const raw = `${fortune.fortuneDate}:${fortune.category}:${fortune.score}:${fortune.luckyNumber ?? 0}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  }
  return hash;
}
