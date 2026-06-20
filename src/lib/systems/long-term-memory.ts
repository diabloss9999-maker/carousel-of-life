/**
 * 장기 기억(Long-term Memory) — 사용자의 감정 키워드 기반 echo.
 *
 * 사용자가 입력한 메시지 중 감정 키워드가 포함된 것만 30개까지 보관한다.
 * 원문은 50자로 제한하며, 7일 이상 지난 echo 중 무작위로 한 줄을 골라
 * "원문 직접 인용 X" 방식으로 기억 위에 떠올린다.
 *
 * 새 DB 변경 없음 — localStorage 전용.
 */

const KEY = "carousel_user_echoes";
const MAX_ENTRIES = 30;
const TEXT_TRIM = 50;
const ECHO_AGED_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

export interface EchoEntry {
  /** 사용자 원문 (50자 제한). */
  text: string;
  /** 기록 시각 (ms timestamp). */
  timestamp: number;
  /** 추출된 핵심 감정 키워드. */
  keywords: string[];
}

const EMOTION_KEYWORDS = [
  "새벽",
  "밤",
  "외로",
  "외롭",
  "지쳤",
  "답답",
  "혼란",
  "조용",
  "침묵",
  "행복",
  "기쁘",
  "사랑",
  "이별",
  "끝났",
  "후회",
  "그리워",
  "다시",
  "고민",
  "선택",
  "기다",
  "포기",
  "돌아",
  "잃어",
  "잊을",
  "기억",
];

/** 안전하게 localStorage 접근 가능한지 검사한다. */
function canUseStorage(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

/** 원문에서 감정 키워드를 추출한다. */
function extractKeywords(text: string): string[] {
  const found = new Set<string>();
  for (const kw of EMOTION_KEYWORDS) {
    if (text.includes(kw)) found.add(kw);
  }
  return Array.from(found);
}

/**
 * 사용자 메시지를 echo로 기록한다.
 * 감정 키워드가 하나도 없으면 저장하지 않는다.
 */
export function recordEcho(text: string): void {
  if (!canUseStorage()) return;
  try {
    const trimmed = text.slice(0, TEXT_TRIM);
    const keywords = extractKeywords(trimmed);
    if (keywords.length === 0) return;

    const raw = window.localStorage.getItem(KEY);
    const list: EchoEntry[] = raw ? (JSON.parse(raw) as EchoEntry[]) : [];
    list.push({ text: trimmed, timestamp: Date.now(), keywords });
    const sliced = list.slice(-MAX_ENTRIES);
    window.localStorage.setItem(KEY, JSON.stringify(sliced));
  } catch {
    /* quota / privacy mode 등은 무시 */
  }
}

/** localStorage 에서 echo 목록을 불러온다. */
export function loadEchoes(): EchoEntry[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as EchoEntry[]) : [];
  } catch {
    return [];
  }
}

/** 7일 이상 된 echo 중 무작위 1개 반환. */
export function pickAgedEcho(): EchoEntry | null {
  const all = loadEchoes();
  const cutoff = Date.now() - ECHO_AGED_THRESHOLD_MS;
  const aged = all.filter((e) => e.timestamp < cutoff);
  if (aged.length === 0) return null;
  const idx = Math.floor(Math.random() * aged.length);
  return aged[idx] ?? null;
}

/**
 * 키워드 기반 메아리 문장 생성.
 * 원문을 그대로 노출하지 않는다 — 키워드만 가지고 분위기 문장을 만든다.
 */
export function buildEchoLine(echo: EchoEntry): string {
  const kw = echo.keywords[0] ?? "";
  const lines: Record<string, string> = {
    새벽: "당신은 여전히 새벽 근처에 오래 머뭅니다.",
    밤: "밤의 기운이 아직 당신을 따라다닙니다.",
    외로: "비슷한 감정이 아직 기운에 남아 있습니다.",
    외롭: "같은 자리가 아직 비어 있습니다.",
    지쳤: "그때의 무게가 아직 가까이 있습니다.",
    답답: "같은 벽 근처를 다시 지나고 있습니다.",
    혼란: "기운이 한번 더 흐트러졌습니다.",
    조용: "조용한 자리가 다시 찾아왔습니다.",
    침묵: "그날의 침묵이 아직 남아 있습니다.",
    행복: "당신은 그 빛을 아직 기억하고 있습니다.",
    기쁘: "그 기운은 쉽게 잊히지 않았습니다.",
    사랑: "이름이 한 번 더 떠올랐습니다.",
    이별: "끝난 자리가 아직 가까이 있습니다.",
    끝났: "끝났다고 적었던 기운이 아직 보입니다.",
    후회: "같은 후회 근처를 다시 지나고 있습니다.",
    그리워: "그리움이 다시 천천히 자랍니다.",
    다시: "당신은 결국 다시 같은 자리로 옵니다.",
    고민: "같은 고민이 모양을 바꿔 돌아왔습니다.",
    선택: "그날의 선택이 아직 기운에 남아 있습니다.",
    기다: "당신은 여전히 기다리는 자리에 있습니다.",
    포기: "포기했다고 적었던 기운이 다시 보입니다.",
    돌아: "돌아온 자리가 너무 낯익습니다.",
    잃어: "잃었던 흔적이 아직 가까이 있습니다.",
    잊을: "잊으려 했던 것이 다시 떠오릅니다.",
    기억: "당신의 기억은 같은 자리를 자주 비춥니다.",
  };
  return lines[kw] ?? "같은 기운이 아직 남아 있습니다.";
}
