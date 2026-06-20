/**
 * 호감도(친밀도) 레벨 보상.
 *
 * 레벨이 오를수록 멤버가 단계적으로 더 가까워진다 — 농담 → 반말·애칭 →
 * 속마음 → 더 깊은 일상 → 가장 가까운 사이. 팬이 "더 깊어지려고" 계속
 * 대화하게 만드는 투자(잠금 해제) 장치.
 *
 * 프롬프트(잠금 해제된 친밀함)와 UI(다음 잠금 해제 안내)에 공통으로 쓰이므로
 * 클라이언트·서버 양쪽에서 import 한다. (server-only 두지 않음)
 */

export interface AffinityReward {
  /** 이 레벨에 도달하면 해금. */
  level: number;
  /** 프롬프트에 주입할 "이 레벨에서 풀린 행동". */
  unlock: string;
  /** UI 표시용 짧은 라벨. */
  uiLabel: string;
}

export const AFFINITY_REWARDS: readonly AffinityReward[] = [
  { level: 2, unlock: "조금 더 편하게, 가벼운 농담을 섞어도 된다.", uiLabel: "가벼운 농담" },
  { level: 3, unlock: "분위기가 맞으면 반말을 자연스럽게 섞고, 가벼운 애칭을 써도 된다.", uiLabel: "반말 · 애칭" },
  { level: 5, unlock: "속마음이나 작은 비밀을 가끔 털어놓아도 된다. 더 가깝게.", uiLabel: "속마음 · 비밀" },
  { level: 7, unlock: "연습실·무대 뒤 같은 일상을 더 깊이 공유하고, 더 다정한 호칭을 써도 된다.", uiLabel: "더 깊은 일상" },
  { level: 10, unlock: "가장 가까운 사이처럼, 너만 아는 특별한 마음을 솔직하게 표현해도 된다.", uiLabel: "가장 가까운 사이" },
] as const;

/** 현재 레벨까지 풀린 친밀함을 프롬프트 컨텍스트 문자열로 만든다. */
export function affinityRewardContext(level: number): string {
  const unlocked = AFFINITY_REWARDS.filter((r) => level >= r.level);
  if (unlocked.length === 0) return "";
  const lines = unlocked.map((r) => `- ${r.unlock}`).join("\n");
  return `\n[친밀함 — 지금까지 풀린 것]\n${lines}`;
}

/** 다음에 풀릴 보상 (이미 최대면 null). */
export function nextAffinityReward(level: number): AffinityReward | null {
  return AFFINITY_REWARDS.find((r) => r.level > level) ?? null;
}
