"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MEMBER_NICKNAME_MAX } from "@/lib/profile/nickname";
import { setMemberNicknameAction } from "@/lib/profile/nickname-action";

/**
 * 애칭(호칭) 설정 카드 — bubble 식.
 * 멤버가 나를 부르는 애칭을 정한다. 비우면 기본 "라이더".
 */
export function MemberNicknameCard({
  initialNickname,
}: {
  initialNickname: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialNickname ?? "");
  const [saved, setSaved] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const preview = value.trim() || "라이더";

  function handleSave() {
    setSaved(null);
    startTransition(async () => {
      const res = await setMemberNicknameAction(value);
      setSaved(res.nickname ?? "라이더");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, MEMBER_NICKNAME_MAX))}
        maxLength={MEMBER_NICKNAME_MAX}
        placeholder="예: 단짝, 그대, 영탁"
        aria-label="멤버가 부를 애칭"
      />
      <p className="flex items-center gap-1.5 text-[14px] text-muted-foreground">
        <Heart className="h-3.5 w-3.5 text-primary" aria-hidden />
        멤버들이 나를{" "}
        <span className="font-semibold text-foreground">“{preview}”</span>
        라고 불러요.
      </p>
      <Button
        onClick={handleSave}
        disabled={isPending}
        size="sm"
        className="w-full"
      >
        {isPending ? "저장 중…" : "애칭 저장"}
      </Button>
      {saved ? (
        <p className="text-[13px] text-primary">
          이제 “{saved}”라고 불러드릴게요.
        </p>
      ) : null}
    </div>
  );
}
