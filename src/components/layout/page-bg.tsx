/**
 * 페이지 전용 배경 이미지.
 *
 * TimeAwareBg 가 깔아둔 day/night Image 레이어(-z-20) 위에 같은 z-index 로 한 번 더
 * 깔아서, 후순위 DOM 렌더가 덮어쓰는 방식. CharacterBg 와 동작 원리 동일하지만
 * characterId 가 아니라 임의의 src 를 직접 받는다.
 *
 * 사용처: /tarot 등 페이지 단위로 배경을 바꾸고 싶을 때.
 */

import Image from "next/image";

interface PageBgProps {
  src: string;
  /** 접근성용 alt. 시각 장식이라 보통 빈 문자열. */
  alt?: string;
}

export function PageBg({ src, alt = "" }: PageBgProps) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-20"
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
    </div>
  );
}
