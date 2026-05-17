/**
 * 캐릭터별 대화창 배경.
 *
 * TimeAwareBg 가 깔아둔 day/night Image 레이어(-z-20) 위에 같은 z-index 로 한 번 더
 * 깔아서, 후순위 DOM 렌더가 덮어쓰는 방식으로 동작한다. CSS body 배경을
 * 바꾸려 해도 Image 레이어가 위에 있어 보이지 않아 컴포넌트로 처리.
 *
 * 사용처: /chat/[sessionId] — 캐릭터와 1:1 대화 중일 때만 렌더.
 */

import Image from "next/image";

import type { CharacterId } from "@/lib/chat/characters";

/** 캐릭터별 배경 이미지. 준비된 캐릭터만 키 등록. */
const CHARACTER_BG: Partial<Record<CharacterId, string>> = {
  child: "/backgrounds/kael.png",
  // 추후 다른 캐릭터들도 같은 패턴으로 추가
};

interface CharacterBgProps {
  characterId: CharacterId;
}

export function CharacterBg({ characterId }: CharacterBgProps) {
  const src = CHARACTER_BG[characterId];
  if (!src) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-20"
    >
      <Image
        src={src}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
    </div>
  );
}
