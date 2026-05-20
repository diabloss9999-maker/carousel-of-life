/**
 * 캐릭터 선택 화면 상단의 한 줄 배너.
 *
 * 90챕터짜리 본문 더미를 첫 화면에서 펼치는 대신, 세 세계관의 훅만 짧게 노출하고
 * 본문은 /stories 로 빼낸다. "보상이 잠겨 있어야 보상" 원칙.
 */
import type { Route } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ROUTES } from "@/lib/constants";

const HOOKS = [
  { tag: "이세계", color: "text-violet-300", line: "균열이 벌어진 도시" },
  { tag: "동양",   color: "text-emerald-300", line: "월식이 시작된 조선" },
  { tag: "북방",   color: "text-sky-300",    line: "별이 죽어가는 설원" },
];

export function WorldTeaserBanner() {
  return (
    <Link
      href={ROUTES.stories as Route}
      className="group block rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm px-5 py-4 transition-colors hover:border-accent/40 hover:bg-card/60"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        {/* 3개 카테고리 훅 */}
        <ul className="flex flex-1 flex-wrap items-center gap-x-5 gap-y-2">
          {HOOKS.map((h) => (
            <li key={h.tag} className="flex items-center gap-2 text-[15px]">
              <span className={`font-mystic font-semibold tracking-wider ${h.color}`}>
                {h.tag}
              </span>
              <span className="text-foreground/80">{h.line}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <span className="flex items-center gap-1.5 text-[15px] text-muted-foreground/90 group-hover:text-foreground sm:shrink-0">
          9 점술사 · 90 챕터의 이야기
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
