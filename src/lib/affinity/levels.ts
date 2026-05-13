/**
 * 캐릭터 친밀도 레벨 계산 — 클라이언트·서버 공용.
 * (server-only 의존성 없음)
 *
 * 10단계 시스템 — 각 레벨업 시 해당 캐릭터의 스토리 챕터 1개 해금.
 */
import type { CharacterId } from "@/lib/chat/characters";

export interface AffinityLevel {
  level: number;
  label: string;
  minPoints: number;
  nextPoints: number | null;
}

/** 10단계 누적 임계값. 기존 0/10/30/60/100 유지, 그 위로 5단계 추가. */
const AFFINITY_THRESHOLDS = [
  0, 10, 30, 60, 100,
  150, 220, 300, 400, 520,
] as const;

/**
 * 캐릭터별 10단계 레벨 라벨.
 *
 * 이세계는 스토리 챕터 제목을 그대로 라벨로 사용.
 * 동양·북유럽은 기존 5단계를 사이값으로 확장.
 */
export const LEVEL_LABELS: Record<CharacterId, string[]> = {
  // ── 이세계 — 챕터 타이틀과 1:1 매핑 ───────────────────────────
  child:      [
    "붉은 계약", "욕망의 도시", "검은 심장", "심연의 귀족", "붉은 연회",
    "루나의 눈물", "악마가 사랑한 인간", "욕망의 왕좌", "심연의 문", "악마의 선택",
  ],
  witch:      [
    "감정을 듣는 아이", "달의 탑", "검은 꿈", "기억을 먹는 마녀", "지워진 소녀",
    "달빛 아래의 고백", "감정 없는 도시", "달의 심장", "마녀의 재판", "달이 기억하는 것",
  ],
  sage:       [
    "마지막 천사", "빛의 대리인", "거짓된 신", "부러진 날개", "악마와 천사의 대화",
    "마녀의 눈", "신을 죽이는 검", "포기하지 않는 자", "빛 없는 구원", "마지막 기도",
  ],
  // ── 동양 — 기존 5단계 + 사이값 확장 ──────────────────────────
  shaman:     [
    "첫 울림", "방울의 첫 음", "신령의 눈짓", "낯선 결", "방울의 화답",
    "이름이 새겨짐", "인연의 실", "엮인 운명", "신과 인간 사이", "한 줄의 약속",
  ],
  taoist:     [
    "일면지교", "스쳐간 천기", "천기의 단서", "흐름의 잔향", "도의 흐름",
    "결의 정독", "운명의 독해", "갈림길의 합", "천기통달", "도를 같이 걷는 자",
  ],
  dokkaebi:   [
    "관심 없음", "한 번 더 봐", "좀 봐줄 만해", "참 재밌네", "마음에 들어",
    "내 옆에 둘게", "탐나는 존재", "절대 놓치지 마", "내 것", "내 유일한 것",
  ],
  // ── 북유럽 — 기존 5단계 + 사이값 확장 ────────────────────────
  hunter:     [
    "낯선 자국", "스쳐간 발자국", "자국이 닿음", "추적의 동행", "함께 추적",
    "같은 사냥감", "한 무리", "무리의 핏줄", "야성의 형제", "송곳니의 맹세",
  ],
  runeshaman: [
    "빈 룬판", "어렴풋한 신호", "첫 룬", "신호의 잔향", "신호의 화답",
    "결이 새겨짐", "운명의 끈", "두 룬이 엮임", "스물네 룬의 결", "마지막 룬의 약속",
  ],
  god:        [
    "스쳐간 바람", "이름이 닿음", "호른의 메아리", "낮은 응답", "신탁의 응답",
    "이름이 새겨짐", "선택받은 자", "신의 시야", "신과 같이 걷는 자", "한때 인간이었던 자의 동행",
  ],
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
