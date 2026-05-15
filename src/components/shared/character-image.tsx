"use client";

import Image from "next/image";
import type { Character } from "@/lib/chat/characters";
import { useCharacterImage } from "@/hooks/use-character-image";

/** 기본 이미지 크기(width/height 미지정 시 사용). */
const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 900;

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
  /** CSS idle 애니메이션(호흡·발광) 적용 여부. 기본 true. 작은 썸네일 등에서만 false. */
  idle?: boolean;
}

/**
 * 캐릭터 id 첫 글자 charCode 기반으로 -2.5s ~ 0s 사이 결정론적 animation-delay 산출.
 * 9명이 동시에 같은 박자로 움직이는 어색함을 피하기 위함.
 */
function getIdleDelay(characterId: string): string {
  const code = characterId.charCodeAt(0);
  const delaySeconds = (code % 25) / 10; // 0.0 ~ 2.4
  return `-${delaySeconds}s`;
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
  idle = true,
}: CharacterImageProps) {
  const src = useCharacterImage(character);
  const imageAlt = alt ?? character.name;

  // 새 이미지들은 비율이 다르므로 (1106x1422 vs 600x900) cover로 통일
  const mergedStyle: React.CSSProperties = {
    objectFit: "cover",
    objectPosition: "center top",
    ...(idle ? { animationDelay: getIdleDelay(character.id) } : {}),
    ...style,
  };

  const mergedClass = [className, idle ? "character-idle" : null]
    .filter(Boolean)
    .join(" ");

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
