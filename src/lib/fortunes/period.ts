/**
 * 월간/연간 운세의 사주 기반 요약.
 *
 * 기존 월간·연간 페이지는 사용자 해시(seed)로 테마·점수를 "가짜"로 골랐다.
 * 여기서는 실제 월운(이달)·세운(올해) + 대운(인생 배경)을 일간 대비 분석해
 * 테마·점수·흐름 설명을 결정론적으로 만든다.
 */
import "server-only";

import type { Profile } from "@/db/schema";
import { getPeriodFlow, type PeriodFlow } from "@/lib/saju/luck-cycles";
import type { TenGodGroup } from "@/lib/saju/ten-gods";

export interface PeriodSummary {
  /** 이번 달/올해 테마 한 줄. */
  theme: string;
  /** 흐름 설명 한 단락. */
  flowNote: string;
  /** 인생 대운 배경 한 줄 | null. */
  daeunNote: string | null;
  /** 분야별 점수(45~96). */
  scores: { focus: number; relation: number; money: number };
  tone: "good" | "caution" | "calm";
}

/** 십성 그룹 → 기간 테마 핵심 어구. */
const THEME_PHRASE: Record<TenGodGroup, string> = {
  비겁: "내 중심을 세우고 내 페이스대로 밀고 나가는",
  식상: "재능과 표현을 밖으로 시원하게 펼치는",
  재성: "현실 감각으로 결실을 챙기고 거두는",
  관성: "책임과 역할이 또렷해지고 자리를 잡는",
  인성: "배우고 채우며 안으로 깊어지는",
};

function clamp(n: number): number {
  return Math.max(45, Math.min(96, Math.round(n)));
}

function summarize(flow: PeriodFlow, unit: "달" | "해"): PeriodSummary {
  const theme = `${THEME_PHRASE[flow.group]} ${unit}`;
  const favorLead =
    flow.favor === "favor"
      ? "흐름이 너를 받쳐주는 시기라, 한 걸음 내디뎌볼 만해요. "
      : flow.favor === "against"
        ? "욕심내기보다 균형을 챙기며 가면 좋은 시기예요. "
        : "";

  // 점수 — 용신 적합도 기반 베이스 + 일지 합충 + 분야별 보정.
  const base =
    flow.favor === "favor" ? 76 : flow.favor === "against" ? 58 : 67;
  const branchAdj = flow.branch === "harmony" ? 5 : flow.branch === "clash" ? -7 : 0;
  const b = base + branchAdj;

  const scores = {
    focus: clamp(b + (flow.group === "식상" || flow.group === "관성" ? 5 : 0)),
    relation: clamp(
      b + (flow.group === "재성" || flow.group === "관성" ? 6 : flow.group === "비겁" ? -3 : 0),
    ),
    money: clamp(
      b + (flow.group === "재성" ? 9 : flow.group === "비겁" ? -7 : flow.group === "식상" ? 3 : 0),
    ),
  };

  const branchNote =
    flow.branch === "harmony"
      ? " 게다가 이 시기의 기운이 네 중심 자리와 부드럽게 맞물려, 일이 자연스럽게 풀리는 결이에요."
      : flow.branch === "clash"
        ? " 다만 이 시기의 기운이 네 중심 자리를 한 번씩 흔들 수 있어, 큰 결정은 한 박자 살펴보면 좋아요."
        : "";
  const flowNote = `${favorLead}${unit === "달" ? "이번 달" : "올해"}은 ${flow.groupMeaning} 쪽 기운이 도는 흐름이에요.${branchNote}`;

  const daeunNote = flow.daeunMeaning
    ? `인생 전체로 보면 지금은 ${flow.daeunMeaning} 쪽 기운이 흐르는 큰 시기 안에 있어요.`
    : null;

  const tone: PeriodSummary["tone"] =
    flow.favor === "favor" && flow.branch !== "clash"
      ? "good"
      : flow.favor === "against" || flow.branch === "clash"
        ? "caution"
        : "calm";

  return { theme, flowNote, daeunNote, scores, tone };
}

/** 이달(월운) 기반 요약. 사주 없으면 null. */
export function getMonthlyManse(
  profile: Profile,
  year: number,
  month: number,
): PeriodSummary | null {
  const date = `${year}-${String(month).padStart(2, "0")}-15`;
  const flow = getPeriodFlow(profile, "month", date);
  return flow ? summarize(flow, "달") : null;
}

/** 올해(세운) 기반 요약. 사주 없으면 null. */
export function getYearlyManse(
  profile: Profile,
  year: number,
): PeriodSummary | null {
  const date = `${year}-06-15`;
  const flow = getPeriodFlow(profile, "year", date);
  return flow ? summarize(flow, "해") : null;
}
