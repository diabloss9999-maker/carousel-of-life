/**
 * 캐러셀나인 멤버 스티커 타일 — match-3 퍼즐의 6색 타일.
 *
 * 대화방/스티커 세트의 멤버 얼굴 스티커(`stickers/<id>.sticker.png`)를 타일로 쓴다.
 * 멤버마다 생김새가 달라 그 자체로 구분되며, 시그니처 색 배경을 더해 빠른 매칭을
 * 한층 또렷하게 한다. member 필드는 엔진의 매칭 키(6종 구분)다.
 */
import type { CharacterId } from "@/lib/chat/characters";

export interface MemberTile {
  member: CharacterId;
  name: string;
  /** 타일에 올릴 멤버 스티커 경로. */
  image: string;
  /** 타일 배경 그라데이션(밝은→어두운). */
  from: string;
  to: string;
  /** 발광/파티클 색. */
  glow: string;
}

const STICKER = (id: string) => `/characters/idols/stickers/${id}.sticker.png`;

export const MEMBER_TILES: readonly MemberTile[] = [
  { member: "child", name: "이안", image: STICKER("child"), from: "#2dd4bf", to: "#0f766e", glow: "#5eead4" },
  { member: "witch", name: "유준", image: STICKER("witch"), from: "#fb923c", to: "#c2410c", glow: "#fed7aa" },
  { member: "sage", name: "도윤", image: STICKER("sage"), from: "#fb7185", to: "#be123c", glow: "#fda4af" },
  { member: "taoist", name: "하루", image: STICKER("taoist"), from: "#c084fc", to: "#7e22ce", glow: "#e9d5ff" },
  { member: "god", name: "태오", image: STICKER("god"), from: "#facc15", to: "#ca8a04", glow: "#fef08a" },
  { member: "runeshaman", name: "하민", image: STICKER("runeshaman"), from: "#60a5fa", to: "#1d4ed8", glow: "#bfdbfe" },
] as const;

export const TILE_COUNT = MEMBER_TILES.length;

const TILE_INDEX: Record<string, number> = Object.fromEntries(
  MEMBER_TILES.map((t, i) => [t.member, i]),
);

/** member id → 타일 정의(미등록 멤버는 0번으로 폴백). */
export function tileOf(member: CharacterId): MemberTile {
  return MEMBER_TILES[TILE_INDEX[member] ?? 0]!;
}
