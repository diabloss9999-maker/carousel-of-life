"use client";

/**
 * 균열 분위기 레이어.
 * 균열 수치에 따라 홈 화면 특정 요소에 이상 현상을 연출한다.
 * 설명 없음. 눈치채는 사람만 눈치챈다.
 */
import { GlitchText } from "@/components/crack/glitch-text";
import type { CrackLevel } from "@/lib/crack/service";

interface CrackAtmosphereProps {
  crackLevel: CrackLevel;
  todayStr: string;
  pageName: string;
}

export function CrackAtmosphere({
  crackLevel,
  todayStr,
  pageName,
}: CrackAtmosphereProps) {
  if (crackLevel < 2) {
    return (
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50">
        경계(境界) · {todayStr}
      </p>
    );
  }

  return (
    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50">
      <GlitchText crackLevel={crackLevel} probability={0.25}>
        경계(境界)
      </GlitchText>
      {" · "}
      <GlitchText crackLevel={crackLevel} probability={0.15}>
        {todayStr}
      </GlitchText>
      {crackLevel >= 2 && (
        <span className={
          crackLevel >= 4 ? " · ▓▓▓▓" :
          crackLevel === 3 ? " · ▓▓▓░" :
          " · ▓▓░░"
        } />
      )}
    </p>
  );
}
