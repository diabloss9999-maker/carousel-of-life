/**
 * 캐릭터 친밀도 레벨 계산 — 클라이언트·서버 공용.
 * (server-only 의존성 없음)
 */
import type { CharacterId } from "@/lib/chat/characters";

export interface AffinityLevel {
  level: number;
  label: string;
  minPoints: number;
  nextPoints: number | null;
}

const AFFINITY_THRESHOLDS = [0, 10, 30, 60, 100] as const;

export const LEVEL_LABELS: Record<CharacterId, string[]> = {
  // 이세계
  child:      ["계약 이전",  "관심의 시작", "균열의 접점", "피의 계약",  "하나의 운명"],
  witch:      ["달빛 아래",  "기억의 흔적", "감정의 파도", "달과 인연",  "기억의 연"],
  sage:       ["첫 인사",    "빛의 인도",   "하늘의 신뢰", "천상의 언약", "하늘의 약속"],
  // 동양
  shaman:     ["첫 울림",    "신령의 눈짓", "방울의 화답", "인연의 실",  "신과 인간 사이"],
  taoist:     ["일면지교",   "천기의 단서", "도의 흐름",   "운명의 독해", "천기통달"],
  dokkaebi:   ["관심 없음",  "좀 봐줄 만해", "마음에 들어", "탐나는 존재", "내 것"],
  // 북유럽
  hunter:     ["낯선 자국",  "자국이 닿음", "함께 추적",   "한 무리",     "야성의 형제"],
  runeshaman: ["빈 룬판",    "첫 룬",       "신호의 화답", "운명의 끈",   "스물네 룬의 결"],
  god:        ["스쳐간 바람", "호른의 메아리", "신탁의 응답", "선택받은 자", "신과 같이 걷는 자"],
};

export function calcLevel(characterId: CharacterId, points: number): AffinityLevel {
  let lvIdx = 0;
  for (let i = AFFINITY_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= AFFINITY_THRESHOLDS[i]) {
      lvIdx = i;
      break;
    }
  }
  const labels = LEVEL_LABELS[characterId];
  return {
    level:     lvIdx + 1,
    label:     labels[lvIdx] ?? labels[labels.length - 1],
    minPoints: AFFINITY_THRESHOLDS[lvIdx],
    nextPoints: lvIdx < AFFINITY_THRESHOLDS.length - 1
      ? AFFINITY_THRESHOLDS[lvIdx + 1]
      : null,
  };
}
