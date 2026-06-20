/**
 * Carousel Nine 1집 정규 앨범 "캐러셀 오브 라이프" 데이터.
 *
 * 앨범 플레이어 UI(/album)와 멤버 AI 시스템 프롬프트(멤버가 자기 앨범·파트를
 * 알도록)에 공통으로 사용한다. 멤버 식별은 이름(string)으로만 하여 characters.ts
 * 와의 순환 import 를 피한다.
 */

export interface AlbumTrack {
  /** 트랙 번호 (1-base). */
  no: number;
  /** 한국어 곡명. */
  title: string;
  /** 영문/부제 (있으면). */
  titleEn?: string;
  /** public 경로의 오디오 파일 (320kbps MP3). */
  src: string;
  /** 멤버 이름 → 그 곡에서 맡은 주요 파트. */
  parts?: Record<string, string>;
}

export const ALBUM_TITLE = "캐러셀 오브 라이프";
export const ALBUM_TITLE_EN = "Carousel of Life";
export const ALBUM_GROUP = "Carousel Nine";
export const ALBUM_GROUP_KO = "캐러셀 나인";
export const ALBUM_RELEASE_DATE = "2026.06.09";
export const ALBUM_RELEASE_DATE_KO = "2026년 6월 9일";

export const ALBUM_TRACKS: AlbumTrack[] = [
  {
    no: 1,
    title: "인생의 회전목마",
    titleEn: "Carousel of Life",
    src: "/album/01-carousel-of-life.mp3",
    parts: {
      이안: "인트로 오프닝 · 아웃트로",
      유준: "벌스1 · 코러스 리드 · 브릿지 · 아웃트로",
      도윤: "프리코러스 · 코러스 · 고음 애드립",
      재하: "벌스1 · 코러스 · 브릿지",
      하루: "벌스1 · 프리코러스 · 댄스브레이크",
      시온: "랩 벌스",
      태오: "프리코러스 · 코러스 · 댄스브레이크",
      이현: "랩 벌스",
      하민: "인트로 · 브릿지 · 댄스브레이크 애드립 · 고음",
    },
  },
  {
    no: 2,
    title: "언제나",
    titleEn: "Always",
    src: "/album/02-always.mp3",
    parts: {
      이안: "인트로",
      유준: "벌스1 · 코러스 리드 · 브릿지 · 아웃트로",
      도윤: "프리코러스 · 코러스 · 고음",
      재하: "브릿지",
      하루: "프리코러스 · 코러스",
      시온: "랩(벌스2)",
      태오: "코러스 · 화음",
      이현: "랩(벌스2)",
      하민: "인트로 · 아웃트로 · 고음 애드립",
    },
  },
  {
    no: 3,
    title: "Fly With You",
    src: "/album/03-fly-with-you.mp3",
    parts: {
      이안: "인트로 오프닝",
      유준: "인트로 · 벌스1 · 코러스 리드 · 브릿지 · 아웃트로",
      도윤: "프리코러스 · 코러스 · 벌스2",
      재하: "벌스1 · 벌스2",
      하루: "프리코러스 · 포스트코러스",
      시온: "랩1",
      태오: "댄스브레이크 · 코러스",
      이현: "랩2",
      하민: "포스트코러스 · 브릿지 · 아웃트로 고음",
    },
  },
  {
    no: 4,
    title: "올라타",
    titleEn: "Ride On",
    src: "/album/04-ride-on.mp3",
    parts: {
      이안: "인트로 · 아웃트로",
      유준: "벌스1 · 벌스2 · 코러스 리드 · 브릿지",
      도윤: "벌스1 · 프리코러스 고음 · 코러스",
      재하: "벌스2",
      하루: "프리코러스 · 포스트코러스 · 아웃트로",
      시온: "랩1",
      태오: "포스트코러스 · 댄스브레이크",
      이현: "랩2",
      하민: "브릿지 · 코러스 애드립",
    },
  },
  {
    no: 5,
    title: "주파수",
    titleEn: "Frequency",
    src: "/album/05-we-rise.mp3",
    parts: {
      이안: "인트로 · 아웃트로",
      유준: "벌스1 · 코러스 리드 · 브릿지 · 아웃트로",
      도윤: "프리코러스 · 코러스 · 벌스2 고음",
      재하: "벌스1 · 벌스2",
      하루: "프리코러스 · 댄스브레이크",
      시온: "랩1",
      태오: "드롭 · 댄스브레이크",
      이현: "랩2",
      하민: "인트로 · 브릿지 · 라스트 코러스 하이노트",
    },
  },
];

/**
 * 멤버 시스템 프롬프트에 넣을 앨범 지식 블록을 멤버 이름 기준으로 생성한다.
 * 프롬프트 토큰을 아끼기 위해 수록곡 목록 + 해당 멤버의 파트만 간결하게 담는다.
 */
export function buildAlbumKnowledge(memberName: string): string {
  const titles = ALBUM_TRACKS.map((t) => `${t.no}. ${t.title}`).join(" / ");
  const myParts = ALBUM_TRACKS.filter((t) => t.parts?.[memberName]).map(
    (t) => `${t.title} — ${t.parts![memberName]}`,
  );
  const partLine =
    myParts.length > 0
      ? `네가 맡은 주요 파트: ${myParts.join(" · ")}.`
      : `각 곡에서 네 포지션(메인보컬·래퍼·댄서 등)에 맞는 파트로 함께 불렀다.`;

  return [
    "[우리 앨범]",
    `너희 ${ALBUM_GROUP}(${ALBUM_GROUP_KO})은 1집 정규 앨범 "${ALBUM_TITLE}"(${ALBUM_TITLE_EN})를 발매했다.`,
    `앨범 발매일: ${ALBUM_RELEASE_DATE_KO}.`,
    `수록곡 ${ALBUM_TRACKS.length}곡: ${titles}.`,
    partLine,
    "팬이 앨범·수록곡·네 파트를 물으면 자랑스럽고 자연스럽게 이야기한다. 다만 실제 가사에 없는 내용이나 모르는 파트를 지어내지는 않는다.",
  ].join("\n");
}
