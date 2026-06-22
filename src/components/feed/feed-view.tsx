"use client";

/**
 * 멤버 SNS 피드 뷰 — 인스타/위버스 식 멤버 포스트 타임라인.
 *
 * - 좋아요: 클라이언트(localStorage) 저장 → 새로고침해도 하트 유지 (v1, 서버 좋아요는 후속).
 * - "대화하기": 그 멤버와의 채팅 세션을 만들어 바로 이동 (CharacterSelect 와 동일 흐름).
 */
import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { FeedPost } from "@/lib/feed/service";
import type { CharacterId } from "@/lib/chat/characters";
import { cn } from "@/lib/utils";

const LIKES_STORAGE_KEY = "cn_feed_likes";

interface CreateSessionResponse {
  ok: boolean;
  data?: { sessionId: string };
}

export function FeedView({ posts }: { posts: FeedPost[] }) {
  const [liked, setLiked] = useState<Set<string>>(new Set());

  // 좋아요 상태를 localStorage 에서 복원.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LIKES_STORAGE_KEY);
      // 서버는 빈 상태로 렌더 → 마운트 후 복원(하이드레이션 불일치 방지). 의도된 패턴.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setLiked(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* 무시 — 좋아요 복원 실패는 치명적이지 않음 */
    }
  }, []);

  const toggleLike = useCallback((id: string) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        /* 무시 */
      }
      return next;
    });
  }, []);

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      {posts.map((post, i) => (
        <FeedCard
          key={post.id}
          post={post}
          eager={i < 2}
          liked={liked.has(post.id)}
          onToggleLike={() => toggleLike(post.id)}
        />
      ))}
    </div>
  );
}

function FeedCard({
  post,
  eager,
  liked,
  onToggleLike,
}: {
  post: FeedPost;
  eager: boolean;
  liked: boolean;
  onToggleLike: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function openChat(characterId: CharacterId) {
    startTransition(async () => {
      try {
        const res = await fetch("/api/chat/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ character: characterId }),
        });
        const json = (await res.json().catch(() => null)) as CreateSessionResponse | null;
        if (json?.ok && json.data) {
          router.push(`/chat/${json.data.sessionId}`);
          return;
        }
        toast.error("대화를 여는 데 실패했어요. 다시 시도해주세요.");
      } catch {
        toast.error("연결이 잠깐 흔들렸어요. 다시 시도해주세요.");
      }
    });
  }

  const likeCount = post.likes + (liked ? 1 : 0);

  return (
    <article className="app-surface overflow-hidden rounded-3xl border">
      {/* 헤더 */}
      <header className="flex items-center gap-3 px-4 py-3">
        <img
          src={post.avatarSrc}
          alt={post.name}
          className="h-10 w-10 shrink-0 rounded-full bg-muted object-cover"
          loading={eager ? "eager" : "lazy"}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-tight">{post.name}</p>
          <p className="truncate text-[12px] text-muted-foreground">
            {post.role} · {post.whenLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openChat(post.characterId)}
          disabled={pending}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <MessageCircle className="h-4 w-4" aria-hidden />
          )}
          대화
        </button>
      </header>

      {/* 사진 */}
      <button
        type="button"
        onDoubleClick={() => {
          if (!liked) onToggleLike();
        }}
        className="block w-full bg-muted"
        aria-label={`${post.name} 사진 좋아요`}
      >
        <img
          src={post.imageSrc}
          alt={`${post.name}의 게시물`}
          className="aspect-[4/5] w-full bg-muted object-cover"
          loading={eager ? "eager" : "lazy"}
        />
      </button>

      {/* 액션 */}
      <div className="flex items-center gap-4 px-4 pt-3">
        <button
          type="button"
          onClick={onToggleLike}
          className="inline-flex items-center gap-1.5 transition active:scale-90"
          aria-pressed={liked}
          aria-label="좋아요"
        >
          <Heart
            className={cn(
              "h-7 w-7 transition",
              liked ? "fill-rose-500 text-rose-500" : "text-foreground",
            )}
            aria-hidden
          />
        </button>
        <button
          type="button"
          onClick={() => openChat(post.characterId)}
          className="inline-flex items-center transition active:scale-90"
          aria-label="댓글 대신 대화하기"
        >
          <MessageCircle className="h-7 w-7 text-foreground" aria-hidden />
        </button>
      </div>

      {/* 좋아요 수 + 캡션 */}
      <div className="space-y-1 px-4 pb-4 pt-2">
        <p className="text-[14px] font-semibold tabular-nums">
          좋아요 {likeCount.toLocaleString()}개
        </p>
        <p className="text-[15px] leading-relaxed">
          <span className="mr-1.5 font-semibold">{post.name}</span>
          {post.caption}
        </p>
      </div>
    </article>
  );
}
