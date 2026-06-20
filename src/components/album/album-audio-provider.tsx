"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Pause, Play, X } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  ALBUM_GROUP_KO,
  ALBUM_TRACKS,
  type AlbumTrack,
} from "@/lib/album/album";
import { cn } from "@/lib/utils";

interface AlbumAudioContextValue {
  current: AlbumTrack;
  currentNo: number;
  playing: boolean;
  time: number;
  duration: number;
  dockPinned: boolean;
  playTrack: (track: AlbumTrack) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setDockPinned: (pinned: boolean) => void;
}

const AlbumAudioContext = createContext<AlbumAudioContextValue | null>(null);

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${rest}`;
}

export function AlbumAudioProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("albumPlayer");
  const audioRef = useRef<HTMLAudioElement>(null);
  const pathname = usePathname();
  const [currentNo, setCurrentNo] = useState<number>(ALBUM_TRACKS[0].no);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dockPinned, setDockPinned] = useState(false);

  const current =
    ALBUM_TRACKS.find((track) => track.no === currentNo) ?? ALBUM_TRACKS[0];

  const playTrack = useCallback((track: AlbumTrack): void => {
    const audio = audioRef.current;
    if (!audio) return;

    if (track.no === currentNo && audio.src) {
      if (audio.paused) void audio.play().catch(() => undefined);
      else audio.pause();
      return;
    }

    setCurrentNo(track.no);
    setTime(0);
    audio.src = track.src;
    void audio.play().catch(() => undefined);
  }, [currentNo]);

  const togglePlay = useCallback((): void => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.src) audio.src = current.src;
    if (audio.paused) void audio.play().catch(() => undefined);
    else audio.pause();
  }, [current.src]);

  const seek = useCallback((nextTime: number): void => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = nextTime;
    setTime(nextTime);
  }, []);

  const handleEnded = useCallback((): void => {
    const currentIndex = ALBUM_TRACKS.findIndex(
      (track) => track.no === currentNo,
    );
    const nextTrack = ALBUM_TRACKS[currentIndex + 1];
    if (nextTrack) playTrack(nextTrack);
    else setPlaying(false);
  }, [currentNo, playTrack]);

  const value = useMemo<AlbumAudioContextValue>(
    () => ({
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
    }),
    [current, currentNo, playing, time, duration, dockPinned, playTrack, togglePlay, seek],
  );

  const showDock = (dockPinned || playing) && pathname !== "/album";

  return (
    <AlbumAudioContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={() => {
          setPlaying(true);
          setDockPinned(true);
        }}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={handleEnded}
      />
      {showDock ? (
        <div className="fixed inset-x-0 bottom-[4.75rem] z-40 px-safe-4 sm:bottom-5 sm:left-auto sm:right-5 sm:w-[360px] sm:px-0">
          <div className="rounded-2xl border border-white/20 bg-white/12 p-3 shadow-[0_18px_48px_-28px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-black/30">
                <Image
                  src="/album/cover-regular-1.webp"
                  alt=""
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-muted-foreground">
                  {t("dockListening", { group: ALBUM_GROUP_KO })}
                </p>
                <p className="font-mystic truncate text-[15px] font-semibold">
                  {current.no}. {current.title}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="w-8 text-[11px] tabular-nums text-muted-foreground">
                    {formatTime(time)}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    value={time}
                    onChange={(e) => seek(Number(e.target.value))}
                    aria-label={t("albumSeek")}
                    className="h-1 flex-1 cursor-pointer accent-primary"
                  />
                  <span className="w-8 text-[11px] tabular-nums text-muted-foreground">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? t("pause") : t("play")}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition active:scale-95"
              >
                {playing ? (
                  <Pause className="h-4 w-4" aria-hidden />
                ) : (
                  <Play className="h-4 w-4 translate-x-[1px]" aria-hidden />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDockPinned(false);
                  audioRef.current?.pause();
                }}
                aria-label={t("closePlayer")}
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full",
                  "border border-white/15 bg-white/10 text-muted-foreground",
                  "transition hover:text-foreground",
                )}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AlbumAudioContext.Provider>
  );
}

export function useAlbumAudio() {
  const ctx = useContext(AlbumAudioContext);
  if (!ctx) {
    throw new Error("useAlbumAudio must be used within AlbumAudioProvider");
  }
  return ctx;
}
