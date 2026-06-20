"use client";

/**
 * 멤버 프로필 슬라이드 패널.
 *
 * 기본은 접힌 상태(헤더만 노출)이며, 헤더를 누르면 grid-rows 트랜지션으로
 * 프로필 상세(나이·성격유형·신상 facts·소개)가 부드럽게 펼쳐진다.
 * 채팅 세션 화면에서 현재 대화 중인 멤버의 프로필을 보여주는 데 사용한다.
 */
import { useId, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

/** 멤버 신상 정보 한 줄(라벨·값). */
export interface MemberFact {
  label: string;
  value: string;
}

interface MemberProfilePanelProps {
  /** 멤버 이름. */
  name: string;
  /** 만 나이. */
  age: number;
  /** 포지션/전문 영역 라벨. */
  positionLabel: string;
  /** 성격유형 코드(예: ISFP). */
  typeCode: string;
  /** 성격유형 닉네임(예: 호기심 많은 예술가). */
  typeNickname: string;
  /** 한 줄 소개. */
  description: string;
  /** 생일·혈액형·키·몸무게 등 신상 facts. */
  facts: MemberFact[];
  className?: string;
}

export function MemberProfilePanel({
  name,
  age,
  positionLabel,
  typeCode,
  typeNickname,
  description,
  facts,
  className,
}: MemberProfilePanelProps) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();

  return (
    <div
      className={cn(
        "app-surface overflow-hidden rounded-xl border border-border/40",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={bodyId}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-foreground/[0.03]"
      >
        <Sparkles className="h-4 w-4 shrink-0 text-primary/80" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="font-mystic text-[15px] font-semibold text-foreground/95">
            {name} 프로필
          </span>
          <span className="ml-2 text-[13px] text-muted-foreground">
            {positionLabel}
          </span>
        </span>
        <span className="shrink-0 text-[13px] text-muted-foreground">
          {open ? "접기" : "펼치기"}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {/* 슬라이드 본문 — grid-template-rows 0fr→1fr 트랜지션 */}
      <div
        id={bodyId}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 border-t border-border/40 px-4 py-4">
            {/* 핵심 — 나이 · 성격유형 */}
            <dl className="grid grid-cols-2 gap-2 text-[13px]">
              <div className="rounded-lg border border-border/40 bg-background/35 px-3 py-2">
                <dt className="text-[11px] text-muted-foreground/75">나이</dt>
                <dd className="mt-0.5 font-semibold text-foreground/90">
                  만 {age}세
                </dd>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                <dt className="text-[11px] text-muted-foreground/75">성격유형</dt>
                <dd className="mt-0.5 font-semibold text-foreground/90">
                  {typeCode}
                  <span className="ml-1 font-normal text-muted-foreground">
                    · {typeNickname}
                  </span>
                </dd>
              </div>
            </dl>

            {/* 신상 facts */}
            {facts.length > 0 ? (
              <dl className="grid grid-cols-2 gap-2 text-[13px] sm:grid-cols-4">
                {facts.map((fact) => (
                  <div
                    key={`${fact.label}-${fact.value}`}
                    className="rounded-lg border border-border/40 bg-background/35 px-3 py-2"
                  >
                    <dt className="text-[11px] text-muted-foreground/75">
                      {fact.label}
                    </dt>
                    <dd className="mt-0.5 font-semibold text-foreground/90">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {/* 소개 */}
            <p className="text-[14px] leading-relaxed text-foreground/80">
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
