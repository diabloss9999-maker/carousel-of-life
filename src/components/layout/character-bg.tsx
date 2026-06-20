/**
 * 멤버별 대화창 배경.
 *
 * TimeAwareBg 가 깔아둔 day/night Image 레이어(-z-20) 위에 같은 z-index 로 한 번 더
 * 깔아서, 후순위 DOM 렌더가 덮어쓰는 방식으로 동작한다. CSS body 배경을
 * 바꾸려 해도 Image 레이어가 위에 있어 보이지 않아 컴포넌트로 처리.
 *
 * 사용처: /chat/[sessionId] — 멤버와 1:1 대화 중일 때만 렌더.
 */

import Image from "next/image";

import type { CharacterId } from "@/lib/chat/characters";

/** 새 멤버 설정 전까지 대화창 배경은 공통 무대 이미지로 통일한다. */
const CHAT_STAGE_BG = "/backgrounds/carousel-meadow.webp";

interface CharacterBgProps {
  characterId: CharacterId;
}

export function CharacterBg({ characterId }: CharacterBgProps) {
  void characterId;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-20"
    >
      <Image
        src={CHAT_STAGE_BG}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
    </div>
  );
}
