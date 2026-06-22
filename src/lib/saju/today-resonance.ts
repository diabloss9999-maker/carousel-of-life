/**
 * 오늘의 기운 연계 블록 — 룬·르노르망·꿈해몽 같은 비(非)사주 점술을 사용자의
 * 실제 사주 + 오늘 일진에 연결하는 공용 헬퍼.
 *
 * 이들 엔진은 원국 사주(buildUserContext)는 참고해도 "오늘의 일진"과 "용신 방향"은
 * 모르고 풀었다. 이 블록을 주입하면 풀이가 오늘 하루의 기운 + 그 사람에게 도움이
 * 되는 방향에 맞물려, 점괘가 "그 사람의 오늘"에 정확히 닿는다. 전부 결정론적.
 */
import "server-only";

import type { Profile } from "@/db/schema";
import { getDayPillar } from "@/lib/saju/iljin";
import {
  analyzeNatal,
  tenGodGroup,
  tenGodForStem,
  TEN_GOD_GROUP_MEANING,
  type NatalPillars,
} from "@/lib/saju/ten-gods";

/** 오행 한글(목·화·토·금·수) → 쉬운 일상어 기질. */
const ELEMENT_TRAIT: Record<string, string> = {
  목: "뻗어나가며 새로 시작하려는 성장의 기운",
  화: "밝게 드러내고 표현하는 열정의 기운",
  토: "중심을 잡고 든든하게 안정시키는 기운",
  금: "정리하고 끊고 결단하는 기운",
  수: "깊이 생각하며 유연하게 흐르는 기운",
};

/** profile.sajuPillars(jsonb) → NatalPillars. */
function toNatalPillars(raw: unknown): NatalPillars | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, { stem?: string; branch?: string } | null>;
  const norm = (
    x: { stem?: string; branch?: string } | null | undefined,
  ): { stem: string; branch: string } | null =>
    x?.stem && x?.branch ? { stem: x.stem, branch: x.branch } : null;
  return { year: norm(p.year), month: norm(p.month), day: norm(p.day), hour: norm(p.hour) };
}

/**
 * 오늘의 기운 연계 블록(쉬운 한국어).
 * 일진은 날짜만으로 항상 계산되고, 용신·성향은 사주가 있을 때만 덧붙는다.
 *
 * @param date "YYYY-MM-DD" (기본: 오늘 KST)
 */
export function buildSajuTodayBlock(profile: Profile, date?: string): string {
  const todayKst =
    date ?? new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
  const day = getDayPillar(new Date(`${todayKst}T12:00:00+09:00`));
  const todayTrait = ELEMENT_TRAIT[day.stemElement] ?? "잔잔하게 흐르는 기운";

  const lines: string[] = [`- 오늘 하루를 흐르는 기운: ${todayTrait}`];

  const natalPillars = toNatalPillars(profile.sajuPillars);
  const natal = natalPillars ? analyzeNatal(natalPillars) : null;
  if (natal) {
    lines.push(`- 이 사람에게 특히 도움이 되는 방향: ${natal.favorableKo}`);
    if (natal.dominantGroup) {
      lines.push(
        `- 타고난 성향의 중심: ${TEN_GOD_GROUP_MEANING[natal.dominantGroup]}`,
      );
    }
    // 오늘 기운이 그 사람에게 힘이 되는 쪽인지 한 줄.
    const dayMaster = natalPillars?.day?.stem;
    if (dayMaster) {
      const todayGod = tenGodForStem(dayMaster, day.stemHanja);
      if (todayGod) {
        const grp = tenGodGroup(todayGod);
        const favor =
          (natal.strength === "신강" &&
            (grp === "식상" || grp === "재성" || grp === "관성")) ||
          (natal.strength === "신약" && (grp === "인성" || grp === "비겁"));
        const against =
          (natal.strength === "신강" && (grp === "비겁" || grp === "인성")) ||
          (natal.strength === "신약" &&
            (grp === "식상" || grp === "재성" || grp === "관성"));
        if (favor) {
          lines.push(
            "- 오늘 기운은 이 사람에게 힘이 되는 쪽으로 흐른다 — 한 걸음 내딛기 좋은 날.",
          );
        } else if (against) {
          lines.push(
            "- 오늘 기운은 이 사람에게 다소 과하게 작용할 수 있다 — 무리보다 페이스 조절.",
          );
        }
      }
    }
  }

  return [
    "[오늘의 기운 연계 — 내부 참고. 점괘 풀이를 이 결과 자연스럽게 이어 붙이되, 사주 용어·한자(일진·오행·용신·신강·신약·십성 등)는 본문에 쓰지 말고 전부 쉬운 일상어로 녹여라]",
    ...lines,
  ].join("\n");
}
