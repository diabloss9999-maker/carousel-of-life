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

  if (fill) {
    return (
      <Image
        src={src}
        alt={imageAlt}
        fill
        className={className}
        sizes={sizes}
        priority={priority}
        quality={quality}
        style={style}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={imageAlt}
      width={width ?? DEFAULT_WIDTH}
      height={height ?? DEFAULT_HEIGHT}
      className={className}
      sizes={sizes}
      priority={priority}
      quality={quality}
      style={style}
    />
  );
}
