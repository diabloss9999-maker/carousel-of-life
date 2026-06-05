/**
 * 세계의 흐름 — 공동 세계 상태 페이지.
 *
 * - 시스템 수치 노출 금지. 기록 기록 형태로만.
 * - 같은 KST 날짜에는 모든 사용자가 동일한 노트를 본다.
 */
import type { Metadata } from "next";

import {
  ENTITY_LABEL,
  MOOD_LABEL,
  MOOD_NARRATIVE,
  getTodayWorldState,
} from "@/lib/systems/world-state";
import { requireProfile } from "@/lib/auth/get-user";

export const metadata: Metadata = {
  title: "세계의 흐름",
  description: "오늘의 공동 기록 — 세계가 모두에게 들려주는 한 줄.",
};

export default async function WorldPage() {
  // 인증·온보딩 가드 — 다른 dashboard 페이지와 일관성 유지
  await requireProfile();

  const state = getTodayWorldState();
  const entityName = ENTITY_LABEL[state.activeEntity];
  const moodLabel = MOOD_LABEL[state.dominantMood];
  const moodNarrative = MOOD_NARRATIVE[state.dominantMood];

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-[15px] uppercase tracking-widest text-muted-foreground/70">
          사이의 결 · 공동 기록
        </p>
        <h1 className="font-mystic text-4xl font-semibold tracking-tight">
          세계의 흐름
        </h1>
        <p className="text-[15px] text-muted-foreground">
          오늘은 모두에게 같은 한 줄이 들립니다.
        </p>
      </header>

      <section className="space-y-6">
        <div
          className="app-surface rounded-[var(--ritual-radius)] px-6 py-8 sm:px-8 sm:py-10"
        >
          <p className="text-[15px] uppercase tracking-widest text-muted-foreground/70">
            오늘의 기록
          </p>
          <p
            className="font-mystic mt-4 text-2xl leading-snug sm:text-3xl"
            style={{ color: "var(--ritual-text)", letterSpacing: "-0.005em" }}
          >
            {state.globalNote}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="app-surface rounded-[var(--ritual-radius)] px-5 py-6">
            <p className="text-[15px] uppercase tracking-widest text-muted-foreground/70">
              오늘 깨어 있는 존재
            </p>
            <p
              className="font-mystic mt-3 text-xl"
              style={{ color: "var(--ritual-text)" }}
            >
              {entityName}
            </p>
            <p className="mt-2 text-[15px] text-muted-foreground">
              {entityName}가 오늘 자주 깨어 있습니다.
            </p>
          </div>

          <div className="app-surface rounded-[var(--ritual-radius)] px-5 py-6">
            <p className="text-[15px] uppercase tracking-widest text-muted-foreground/70">
              오늘의 결
            </p>
            <p
              className="font-mystic mt-3 text-xl"
              style={{ color: "var(--ritual-text)" }}
            >
              {moodLabel}
            </p>
            <p className="mt-2 text-[15px] text-muted-foreground">
              {moodNarrative}
            </p>
          </div>
        </div>

        <div
          className="app-surface rounded-[var(--ritual-radius)] px-5 py-6"
          aria-live="polite"
        >
          <p className="text-[15px] uppercase tracking-widest text-muted-foreground/70">
            세계의 메모
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            오늘의 결과 깨어 있는 존재는 같은 날 모든 기록자에게 동일하게
            전해집니다. 내일이 되면 흐름은 조용히 다시 짜입니다.
          </p>
        </div>
      </section>
    </div>
  );
}
