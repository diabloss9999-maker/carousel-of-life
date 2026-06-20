"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { Character } from "@/lib/chat/characters";
import { useCharacterImage } from "@/hooks/use-character-image";
import { cn } from "@/lib/utils";

/** 기본 이미지 크기(width/height 미지정 시 사용). */
const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 900;

/**
 * 영상(idle 루프) 가 준비된 멤버.
 * 값은 확장자 없는 베이스 경로 — `.webm` 과 `.mp4` 두 파일을 모두 가리킨다.
 */
const VIDEO_BY_CHARACTER: Record<string, string> = {
  // 영상 준비되면 여기에 추가: characterId → /characters/videos/<id> (확장자 제외)
  // 예: runeshaman: "/characters/videos/runeshaman",
};

interface CharacterImageProps {
  /** 표시할 멤버 객체. KST 시간대에 따라 day/night 이미지가 자동 선택된다. */
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
  slideshowActive?: boolean;
  /**
   * 슬라이드쇼에 노출할 최대 사진 수 (친밀도 레벨 해금용).
   * 미지정이면 전부 노출. 최소 1장은 항상 보장.
   */
  maxSlides?: number;
}

/**
 * 현재 KST 시간대(낮/밤)에 맞는 멤버 이미지를 렌더링하는 클라이언트 컴포넌트.
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
  slideshowActive,
  maxSlides,
}: CharacterImageProps) {
  const baseSrc = useCharacterImage(character);
  const slides = useMemo(() => {
    const characterSlides = character.imageSlides?.filter((item) => item.length > 0) ?? [];
    const all = characterSlides.length > 0 ? characterSlides : [baseSrc];
    if (maxSlides == null) return all;
    return all.slice(0, Math.max(1, maxSlides));
  }, [baseSrc, character.imageSlides, maxSlides]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [isSelfHovered, setIsSelfHovered] = useState(false);
  const isSlideshowActive = slideshowActive ?? isSelfHovered;
  const activeSlideIndex = isSlideshowActive && slides.length > 1 ? slideIndex + 1 : 0;
  const src = slides[activeSlideIndex % slides.length] ?? baseSrc;
  const imageAlt = alt ?? character.name;
  const videoBase = VIDEO_BY_CHARACTER[character.id];

  useEffect(() => {
    if (!isSlideshowActive || slides.length < 2) return undefined;

    const timer = window.setInterval(() => {
      setSlideIndex((current) => (current + 1) % slides.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [isSlideshowActive, slides.length]);

  function handleMouseEnter() {
    setIsSelfHovered(true);
  }

  function handleMouseLeave() {
    setIsSelfHovered(false);
  }

  const hoverHandlers =
    slideshowActive === undefined
      ? {
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
        }
      : undefined;

  // 새 이미지들은 비율이 다르므로 (1106x1422 vs 600x900) cover로 통일
  const mergedStyle: React.CSSProperties = {
    objectFit: "cover",
    objectPosition: "center top",
    ...style,
  };

  // 사진이 로드되기 전 빈 박스 대신 셔머 표시 (스냅은 모두 불투명 사진).
  const mergedClass = cn("img-shimmer", className);

  // 영상이 준비된 멤버는 video 로 렌더.
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
        {...hoverHandlers}
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
      {...hoverHandlers}
    />
  );
}

/**
 * 호버 시에만 재생되는 멤버 video.
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
