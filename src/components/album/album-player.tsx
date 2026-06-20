"use client";

/**
 * Carousel Nine 1집 앨범 플레이어.
 *
 * 단일 <audio> 엘리먼트를 ref 로 제어하고, 트랙 리스트에서 곡을 골라 재생한다.
 * 진행바는 인라인 스타일 없이 <input type="range"> 로 구현(시킹 가능).
 */
import { ChevronDown, Headphones, MicVocal, Pause, Play, Radio } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { useAlbumAudio } from "@/components/album/album-audio-provider";
import {
  ALBUM_GROUP,
  ALBUM_GROUP_KO,
  ALBUM_RELEASE_DATE,
  ALBUM_TITLE_EN,
  ALBUM_TRACKS,
} from "@/lib/album/album";
import { TRACK_LYRICS } from "@/lib/album/lyrics";
import { cn } from "@/lib/utils";

/** 멤버 이름 → 파트 칩 색상 (멤버 테마와 통일). */
const MEMBER_CHIP: Record<string, string> = {
  이안: "text-red-300",
  유준: "text-blue-300",
  도윤: "text-amber-300",
  재하: "text-rose-300",
  하루: "text-cyan-300",
  시온: "text-purple-300",
  태오: "text-sky-300",
  이현: "text-stone-300",
  하민: "text-indigo-300",
  ALL: "text-foreground/70",
};

/** 현재 트랙 가사 패널 — 섹션별 + 멤버 파트 색상 표시. */
function LyricsPanel({ trackNo }: { trackNo: number }) {
  const t = useTranslations("albumPlayer");
  const [open, setOpen] = useState(false);
  const sections = TRACK_LYRICS[trackNo];

  return (
    <div className="rounded-lg border border-white/12 bg-black/20">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-[14px] font-semibold">
          <MicVocal className="h-4 w-4 text-primary" aria-hidden />
          {t("lyrics")}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        sections ? (
          <div className="max-h-[420px] space-y-5 overflow-y-auto border-t border-white/10 px-4 py-4">
            {sections.map((section, si) => (
              <div key={`${section.label}-${si}`} className="space-y-1.5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary/80">
                  [{section.label}]
                </p>
                {section.lines.map(([member, text], li) => (
                  <p
                    key={li}
                    className="text-[14px] leading-relaxed text-foreground/85"
                  >
                    {member ? (
                      <span
                        className={cn(
                          "mr-2 inline-block w-9 shrink-0 text-[12px] font-bold",
                          MEMBER_CHIP[member] ?? "text-muted-foreground",
                        )}
                      >
                        {member}
                      </span>
                    ) : null}
                    {text}
                  </p>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <p className="border-t border-white/10 px-4 py-4 text-[14px] text-muted-foreground">
            {t("lyricsEmpty")}
          </p>
        )
      ) : null}
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${rest}`;
}

function AlbumCover() {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-white/15 bg-black/35 shadow-[0_20px_60px_-36px_rgba(0,0,0,0.9)]">
      <Image
        src="/album/cover-regular-1.webp"
        alt={`${ALBUM_GROUP} ${ALBUM_TITLE_EN} album cover`}
        fill
        sizes="(max-width: 1024px) 100vw, 320px"
        className="img-shimmer object-cover"
        priority
      />
    </div>
  );
}

export function AlbumPlayer() {
  const t = useTranslations("albumPlayer");
  const {
    current,
    currentNo,
    playing,
    time,
    duration,
    dockPinned,
    playTrack,
    togglePlay,
    seek,
    setDockPinned,
  } = useAlbumAudio();

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>): void {
    seek(Number(e.target.value));
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(220px,0.7fr)_minmax(0,1fr)]">
      <AlbumCover />

      <div className="space-y-4">
        <div className="rounded-lg border border-white/12 bg-black/20 p-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? t("pause") : t("play")}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition active:scale-95"
            >
              {playing ? (
                <Pause className="h-5 w-5" aria-hidden />
              ) : (
                <Play className="h-5 w-5 translate-x-[1px]" aria-hidden />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <Radio className="h-3.5 w-3.5" aria-hidden />
                {ALBUM_GROUP_KO} · {ALBUM_RELEASE_DATE}
              </p>
              <p className="font-mystic truncate text-lg font-semibold">
                {current.no}. {current.title}
              </p>
              {current.titleEn ? (
                <p className="truncate text-[13px] text-muted-foreground">
                  {current.titleEn}
                </p>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setDockPinned(true);
              if (!playing) togglePlay();
            }}
            className={cn(
              "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full",
              "border border-white/15 bg-white/10 px-4 py-2.5 text-[14px] font-semibold",
              "transition hover:bg-white/15 active:scale-[0.99]",
              dockPinned && "border-primary/40 bg-primary/15 text-primary",
            )}
          >
            <Headphones className="h-4 w-4" aria-hidden />
            {dockPinned ? t("dockPinned") : t("dockPin")}
          </button>

          <div className="mt-4 flex items-center gap-3">
            <span className="w-10 text-right text-[12px] tabular-nums text-muted-foreground">
              {formatTime(time)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={time}
              onChange={handleSeek}
              aria-label={t("seek")}
              className="h-1.5 flex-1 cursor-pointer accent-primary"
            />
            <span className="w-10 text-[12px] tabular-nums text-muted-foreground">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        <LyricsPanel trackNo={currentNo} />

        <ul className="space-y-2">
          {ALBUM_TRACKS.map((track) => {
            const active = track.no === currentNo;
            return (
              <li key={track.no}>
                <button
                  type="button"
                  onClick={() => playTrack(track)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition hover:border-primary/35 hover:bg-white/[0.07]",
                    active && "border-primary/45 bg-primary/10",
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10 text-[13px] font-semibold tabular-nums">
                    {track.no.toString().padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {track.title}
                    </span>
                    {track.titleEn ? (
                      <span className="block truncate text-[13px] text-muted-foreground">
                        {track.titleEn}
                      </span>
                    ) : null}
                  </span>
                  {active && playing ? (
                    <Pause
                      className="h-4 w-4 shrink-0 text-primary"
                      aria-hidden
                    />
                  ) : (
                    <Play
                      className="h-4 w-4 shrink-0 translate-x-[1px] text-muted-foreground"
                      aria-hidden
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
