"use client";

/**
 * 최애의 안부 카드 — 홈 상단에서 최애가 "먼저 말 걸어주는" 경험.
 * 답장하기 → 그 멤버와의 채팅 세션 생성 후 바로 이동.
 */
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import type { BiasGreeting } from "@/lib/chat/bias-greeting";

interface CreateSessionResponse {
  ok: boolean;
  data?: { sessionId: string };
}

export function BiasGreetingCard({ greeting }: { greeting: BiasGreeting }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function reply() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/chat/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ character: greeting.characterId }),
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

  return (
    <button
      type="button"
      onClick={reply}
      disabled={pending}
      className="app-surface group flex w-full items-start gap-3.5 rounded-[24px] border border-primary/20 p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/35 sm:p-5"
    >
      <img
        src={greeting.avatarSrc}
        alt={greeting.name}
        className="h-14 w-14 shrink-0 rounded-full bg-muted object-cover ring-2 ring-primary/15"
        loading="eager"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-primary/70">
            {greeting.isBias ? "최애의 안부" : "오늘의 멤버"}
          </span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            {greeting.name}
          </span>
        </div>
        <p className="mt-1.5 text-[15px] leading-relaxed text-foreground sm:text-base">
          {greeting.greeting}
        </p>
        <span className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary">
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <MessageCircle className="h-4 w-4" aria-hidden />
          )}
          답장하기
        </span>
      </div>
    </button>
  );
}
