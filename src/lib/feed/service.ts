/**
 * 멤버 SNS 피드 — 9멤버가 매일 올리는 "오늘의 한마디" 타임라인.
 *
 * 디어유 Bubble·Weverse 식 "최애가 올린 글" 경험. 날짜×멤버 해시로 사진/캡션/좋아요를
 * 결정론적으로 생성 → AI 비용 0, 매일 새 글, 같은 날엔 누구에게나 같은 피드.
 * 미래 시각의 글은 숨겨서 "지금 막 올라온" 느낌을 준다.
 */
import "server-only";

import { CHARACTERS, type CharacterId } from "@/lib/chat/characters";
import { SCENE_CAPTIONS, sceneOf, FEED_SCENES } from "@/lib/feed/captions";

export interface FeedPost {
  /** 결정론적 id: "<characterId>:<YYYY-MM-DD>". */
  id: string;
  characterId: CharacterId;
  name: string;
  role: string;
  avatarSrc: string;
  imageSrc: string;
  caption: string;
  whenLabel: string;
  likes: number;
}

const MEMBER_ORDER: readonly CharacterId[] = [
  "child", "witch", "sage", "shaman", "taoist", "dokkaebi", "god", "hunter", "runeshaman",
];

const DAY_MS = 86_400_000;
const KST_OFFSET_MS = 9 * 3_600_000;
/** 하루에 글을 올리는 멤버 수. */
const POSTS_PER_DAY = 3;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function relativeLabel(diffMs: number): string {
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "어제";
  return `${day}일 전`;
}

/**
 * 최근 `days` 일치 멤버 피드를 최신순으로 반환한다.
 * @param now   기준 시각(기본 현재)
 * @param days  거슬러 올라갈 일수
 */
export function getMemberFeed(now: Date = new Date(), days = 12): FeedPost[] {
  const nowMs = now.getTime();
  const todayKstDayNum = Math.floor((nowMs + KST_OFFSET_MS) / DAY_MS);
  const posts: (FeedPost & { _t: number })[] = [];

  for (let d = 0; d < days; d += 1) {
    const dayNum = todayKstDayNum - d;
    const dateStr = new Date(dayNum * DAY_MS).toISOString().slice(0, 10);
    // 이 KST 날짜의 자정(UTC ms).
    const kstMidnightUtc = dayNum * DAY_MS - KST_OFFSET_MS;

    for (let k = 0; k < POSTS_PER_DAY; k += 1) {
      const memberIdx = (((dayNum * POSTS_PER_DAY + k) % 9) + 9) % 9;
      const characterId = MEMBER_ORDER[memberIdx];
      const character = CHARACTERS[characterId];
      const seed = `${characterId}:${dateStr}`;

      // 게시 시각 — 9~22시 사이.
      const hour = 9 + (hash(`${seed}:h`) % 14);
      const postMs = kstMidnightUtc + hour * 3_600_000;
      if (postMs > nowMs) continue; // 미래 글은 숨김.

      // 활동 장면(아침·장보기·요리·취미·녹음·무대) 사진만 사용 → 글이 사진과 맞도록.
      const all = character.imageSlides ?? [character.imageSrc];
      const activitySlides = all.filter((s) =>
        FEED_SCENES.some((sc) => s.includes(`/${sc}/`)),
      );
      const slides = activitySlides.length > 0 ? activitySlides : all;
      const imageSrc = slides[hash(`${seed}:i`) % slides.length];
      const caption = SCENE_CAPTIONS[characterId][sceneOf(imageSrc)];

      posts.push({
        _t: postMs,
        id: `${characterId}:${dateStr}`,
        characterId,
        name: character.name,
        role: character.specialty,
        avatarSrc: character.imageSrc,
        imageSrc,
        caption,
        whenLabel: relativeLabel(nowMs - postMs),
        likes: 80 + (hash(`${seed}:l`) % 1700),
      });
    }
  }

  posts.sort((a, b) => b._t - a._t);
  return posts.map(({ _t, ...p }) => {
    void _t;
    return p;
  });
}
