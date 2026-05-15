"use client";

import { useRef } from "react";
import Image from "next/image";
import type { Character } from "@/lib/chat/characters";
import { useCharacterImage } from "@/hooks/use-character-image";

/** 기본 이미지 크기(width/height 미지정 시 사용). */
const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 900;

/**
 * 영상(idle 루프) 가 준비된 캐릭터.
 * 값은 확장자 없는 베이스 경로 — `.webm` 과 `.mp4` 두 파일을 모두 가리킨다.
 */
const VIDEO_BY_CHARACTER: Record<string, string> = {
  runeshaman: "/characters/videos/runeshaman", // 헬가 — 룬을 새기는 자
  god:        "/characters/videos/god",        // 외르문드 — 북방의 신
  hunter:     "/characters/videos/hunter",     // 비요른 — 야성의 사냥꾼
};

interface CharacterImageProps {
  /** 표시할 캐릭터 객체. KST 시간대에 따라 day/night 이미지가 자동 선택된다. */
  character: Character;
  /** Next.js Image의 fill 모드 */
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  /** fill=false일 때 사용할 width */
  width?: number;
  /** fill=false일 때 사용할 height */
  height?: number;
  /** 명시적 alt 텍스트 (기본: character.name) */
  alt?: string;
  /** 인라인 스타일 (크기 제한 등 부득이한 경우에만 사용) */
  style?: React.CSSProperties;
}

/**
 * 현재 KST 시간대(낮/밤)에 맞는 캐릭터 이미지를 렌더링하는 클라이언트 컴포넌트.
 * 서버 컴포넌트에서 직접 import 하여 사용 가능하다.
 */
export function CharacterImage({
  character,
  fill,
  className,
  sizes,
  priority,
  quality,
  width,
  height,
  alt,
  style,
}: CharacterImageProps) {
  const src = useCharacterImage(character);
  const imageAlt = alt ?? character.name;
  const videoBase = VIDEO_BY_CHARACTER[character.id];

  // 새 이미지들은 비율이 다르므로 (1106x1422 vs 600x900) cover로 통일
  const mergedStyle: React.CSSProperties = {
    objectFit: "cover",
    objectPosition: "center top",
    ...style,
  };

  const mergedClass = className;

  // 영상이 준비된 캐릭터는 video 로 렌더.
  // - 평소엔 poster 정적 이미지가 보임 (재생 정지 상태)
  // - 마우스 호버 시에만 재생, 떼면 첫 프레임으로 리셋
  // - 모바일(hover 없음)에선 poster 이미지가 그대로 표시됨
  if (videoBase) {
    const videoStyle: React.CSSProperties = fill
      ? {
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          ...mergedStyle,
        }
      : mergedStyle;

    return (
      <CharacterVideo
        base={videoBase}
        poster={src}
        ariaLabel={imageAlt}
        className={mergedClass || undefined}
        style={videoStyle}
        width={fill ? undefined : (width ?? DEFAULT_WIDTH)}
        height={fill ? undefined : (height ?? DEFAULT_HEIGHT)}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={imageAlt}
        fill
        className={mergedClass || undefined}
        sizes={sizes}
        priority={priority}
        quality={quality}
        style={mergedStyle}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={imageAlt}
      width={width ?? DEFAULT_WIDTH}
      height={height ?? DEFAULT_HEIGHT}
      className={mergedClass || undefined}
      sizes={sizes}
      priority={priority}
      quality={quality}
      style={mergedStyle}
    />
  );
}

/**
 * 호버 시에만 재생되는 캐릭터 video.
 * - 평소: poster 정적 이미지, video 정지 상태
 * - mouseEnter: play()
 * - mouseLeave: pause() + currentTime=0 으로 첫 프레임 복귀
 */
interface CharacterVideoProps {
  base: string;
  poster: string;
  ariaLabel: string;
  className?: string;
  style?: React.CSSProperties;
  width?: number;
  height?: number;
}

function CharacterVideo({
  base,
  poster,
  ariaLabel,
  className,
  style,
  width,
  height,
}: CharacterVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  function handleEnter() {
    const v = ref.current;
    if (!v) return;
    // 일부 브라우저(특히 사파리)에서 autoplay 정책에 따라 play() 가 Promise 거부할 수 있음 — silent catch.
    void v.play().catch(() => undefined);
  }

  function handleLeave() {
    const v = ref.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
  }

  return (
    <video
      ref={ref}
      aria-label={ariaLabel}
      loop
      muted
      playsInline
      preload="metadata"
      poster={poster}
      className={className}
      style={style}
      width={width}
      height={height}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <source src={`${base}.webm`} type="video/webm" />
      <source src={`${base}.mp4`} type="video/mp4" />
    </video>
  );
}
