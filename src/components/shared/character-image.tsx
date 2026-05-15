"use client";

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

  // 영상이 준비된 캐릭터는 video 로 렌더 — poster 로 정적 이미지가 먼저 깔린 뒤
  // 영상이 로드되면 자연스럽게 교체된다.
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
      <video
        aria-label={imageAlt}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster={src}
        className={mergedClass || undefined}
        style={videoStyle}
        width={fill ? undefined : (width ?? DEFAULT_WIDTH)}
        height={fill ? undefined : (height ?? DEFAULT_HEIGHT)}
      >
        <source src={`${videoBase}.webm`} type="video/webm" />
        <source src={`${videoBase}.mp4`} type="video/mp4" />
      </video>
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
