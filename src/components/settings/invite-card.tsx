"use client";

/**
 * 친구 초대 카드 — /settings 에 표시.
 *
 * 본인의 초대 링크 표시 + 복사 + 카카오톡·메신저 공유.
 * 누적 초대 인원 수 표시.
 */
import { useState } from "react";
import { Check, Copy, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/shared/share-button";

interface InviteCardProps {
  inviteUrl: string;
  invitedCount: number;
}

export function InviteCard({ inviteUrl, invitedCount }: InviteCardProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-muted/30 p-3 space-y-2">
        <p className="text-[15px] text-muted-foreground leading-relaxed">
          친구에게 별의 흐름을 나눠봐. 링크로 들어와서 가입하면 친구의 별이
          나의 이력에 함께 기록돼.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg bg-background/60 px-3 py-2 text-[15px] font-mono">
            {inviteUrl}
          </code>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={copyLink}
            className="shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
                <span>복사됨</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden />
                <span>복사</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[15px] text-foreground/80">
          지금까지{" "}
          <span className="font-mystic font-semibold text-primary">
            {invitedCount}
          </span>{" "}
          명을 초대했어요
        </p>
        <ShareButton
          title="인생의 회전목마 — 별의 흐름과 카드의 계시"
          text="별의 흐름과 카드의 계시로 오늘의 운명을 풀이해주는 곳. 같이 받아볼래?"
          url={inviteUrl}
          label="친구에게 보내기"
          variant="default"
        />
      </div>
    </div>
  );
}

export function InviteCardSkeleton() {
  return (
    <div className="flex items-center gap-3 text-muted-foreground text-[15px]">
      <UserPlus className="h-4 w-4" aria-hidden />
      <span>초대 정보를 불러오는 중…</span>
    </div>
  );
}
