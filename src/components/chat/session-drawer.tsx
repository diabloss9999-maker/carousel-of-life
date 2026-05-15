"use client";

/**
 * 오늘의 대화 목록 — 슬라이드 드로어.
 * 기본은 숨겨져 있고, 버튼을 눌러야 열린다.
 */
import { useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { ChevronUp, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { CHARACTERS } from "@/lib/chat/characters";
import { CharacterImage } from "@/components/shared/character-image";
import { formatKoreanDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface SessionItem {
  id: string;
  title: string;
  character: string | null;
  lastMessageAt: Date | string;
}

interface SessionDrawerProps {
  sessions: SessionItem[];
}

export function SessionDrawer({ sessions }: SessionDrawerProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("chatShell");

  if (sessions.length === 0) return null;

  return (
    <div className="relative">
      {/* 토글 버튼 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-all",
          open ? "rounded-b-none border-b-0 border-white/20" : "border-white/15 hover:border-white/25",
        )}
        style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(16px)" }}
      >
        <div className="flex items-center gap-2.5">
          <MessageCircle className="h-4 w-4 text-muted-foreground/60" aria-hidden />
          <span className="font-mystic text-[15px] text-muted-foreground/70">
            {t("drawerTitle")}
          </span>
          <span className="rounded-full bg-muted/40 px-2 py-0.5 text-[15px] text-muted-foreground/80 tabular-nums">
            {sessions.length}
          </span>
        </div>
        <ChevronUp
          className={cn(
            "h-4 w-4 text-muted-foreground/70 transition-transform duration-300",
            !open && "rotate-180",
          )}
        />
      </button>

      {/* 슬라이드 패널 */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="rounded-b-2xl border border-t-0 border-white/15 divide-y divide-white/10" style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(16px)" }}>
          {sessions.map((s) => {
            const charId = (s.character ?? "witch") as keyof typeof CHARACTERS;
            const char = CHARACTERS[charId];

            return (
              <Link
                key={s.id}
                href={`/chat/${s.id}` as Route}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                onClick={() => setOpen(false)}
              >
                {/* 캐릭터 미니 초상화 */}
                {char && (
                  <div className="relative h-10 w-7 flex-shrink-0 overflow-hidden rounded-lg">
                    <CharacterImage
                      character={char}
                      fill
                      className="object-cover object-top"
                      sizes="28px"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="font-mystic text-[15px] font-medium truncate text-foreground/85">
                    {s.title}
                  </p>
                  <p className="text-[15px] text-muted-foreground/50">
                    {char?.name ?? ""} · {formatKoreanDate(new Date(s.lastMessageAt))}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
