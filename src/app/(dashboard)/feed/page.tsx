import type { Metadata } from "next";

import { requireProfile } from "@/lib/auth/get-user";
import { getMemberFeed } from "@/lib/feed/service";
import { FeedView } from "@/components/feed/feed-view";

export const metadata: Metadata = {
  title: "멤버 소식",
  description: "캐러셀나인 9명의 멤버가 매일 전하는 일상과 한마디.",
};

/**
 * 멤버 SNS 피드 — 캐러셀나인 9명이 매일 올리는 글 타임라인.
 * 위버스/디어유 식 "최애 소식" 경험으로, 채팅·도감 경제와 자연스럽게 연결된다.
 */
export default async function FeedPage() {
  await requireProfile();
  const posts = getMemberFeed();

  return (
    <div className="space-y-6">
      <header className="mx-auto w-full max-w-xl space-y-1.5">
        <h1 className="font-mystic text-2xl font-semibold tracking-tight sm:text-3xl">
          멤버 소식
        </h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          캐러셀나인 9명이 매일 전하는 일상이에요. 마음에 드는 글엔 하트를,
          더 듣고 싶으면 바로 대화로 이어가요.
        </p>
      </header>

      <FeedView posts={posts} />
    </div>
  );
}
