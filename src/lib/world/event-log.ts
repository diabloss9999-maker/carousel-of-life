import { getDailySeed, seedValue } from "@/lib/systems/daily-seed";

/** 오늘의 세계 이벤트 1건. */
export interface WorldEvent {
  /** 분 단위 — 현재로부터 N분 전에 발생한 것으로 표시. */
  minutesAgo: number;
  /** 사용자에게 보여줄 검열된 한 문장. */
  text: string;
  /** UI 톤 결정용 분위기 태그. */
  tone: "normal" | "warning" | "critical";
}

const EVENT_TEMPLATES: { text: string; tone: WorldEvent["tone"] }[] = [
  // 캐릭터 움직임
  { text: "카엘이 봉인 구역으로 향했습니다.", tone: "warning" },
  { text: "루나가 새벽 기록을 다시 열었습니다.", tone: "normal" },
  { text: "라엘이 흐름을 안정시키려 하고 있습니다.", tone: "normal" },
  { text: "소율의 방울이 잠시 울렸습니다.", tone: "normal" },
  { text: "현도가 천기의 어긋남을 감지했습니다.", tone: "warning" },
  { text: "흑랑이 새로운 거래를 제안했습니다.", tone: "normal" },
  // 충돌
  { text: "루나와 라엘의 충돌이 감지되었습니다.", tone: "warning" },
  { text: "카엘이 라엘의 봉인을 의심하기 시작했습니다.", tone: "warning" },
  { text: "흑랑과 현도가 같은 흐름을 두고 다투었습니다.", tone: "warning" },
  // 균열
  { text: "균열 수치가 비정상적으로 상승했습니다.", tone: "critical" },
  { text: "경계 너머에서 응답이 새어 나왔습니다.", tone: "critical" },
  { text: "이름이 지워진 자국이 발견되었습니다.", tone: "critical" },
  { text: "기록 일부가 손상된 상태로 복원되었습니다.", tone: "critical" },
  // 평범
  { text: "오늘의 흐름이 조용히 시작되었습니다.", tone: "normal" },
  { text: "관측소가 정상 작동 중입니다.", tone: "normal" },
  { text: "균열 수치가 안정 구간에 진입했습니다.", tone: "normal" },
];

/**
 * 오늘의 이벤트 로그 4~5건을 생성한다.
 *
 * - daily seed 기반으로 결정론적 — 같은 날에는 같은 이벤트가 나온다.
 * - 크랙 레벨이 높을수록 warning/critical 톤 가중치가 올라간다.
 * - 시간이 오래 지난 것부터 정렬되어 반환된다(가장 위가 가장 오래된 기록).
 */
export function getTodayEventLog(crackLevel: number): WorldEvent[] {
  const seed = getDailySeed();
  const count = 4 + Math.floor(seedValue(seed, 300) * 2); // 4~5건

  // 크랙 레벨에 따라 톤별 가중치를 부여한다.
  const pool = EVENT_TEMPLATES.flatMap((e) => {
    let weight = 1;
    if (crackLevel >= 3 && e.tone === "critical") weight = 3;
    if (crackLevel >= 2 && e.tone === "warning") weight = 2;
    if (crackLevel <= 1 && e.tone === "normal") weight = 2;
    return Array.from({ length: weight }, () => e);
  });

  const events: WorldEvent[] = [];
  const usedIndices = new Set<number>();

  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let idx = Math.floor(seedValue(seed, 400 + i) * pool.length);
    while (usedIndices.has(idx) && attempts < 20) {
      idx = (idx + 1) % pool.length;
      attempts++;
    }
    usedIndices.add(idx);
    const minutesAgo = Math.floor(seedValue(seed, 500 + i) * 240) + 5; // 5~245분 전
    const template = pool[idx];
    if (template) {
      events.push({ ...template, minutesAgo });
    }
  }

  return events.sort((a, b) => a.minutesAgo - b.minutesAgo);
}

/** "27분 전" / "3시간 전" 포맷으로 변환. */
export function formatTimeAgo(minutes: number): string {
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  return `${hours}시간 전`;
}
