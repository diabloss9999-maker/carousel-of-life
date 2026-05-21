"use client";

/**
 * 계정 삭제 버튼 + 확인 다이얼로그.
 *
 * Google Play 데이터 안전 섹션 필수 기능.
 * 사용자가 앱 내에서 직접 모든 데이터를 영구 삭제할 수 있어야 한다.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signOutAction } from "@/lib/auth/actions";

interface Props {
  userEmail: string;
}

export function DeleteAccountButton({ userEmail }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmEmail }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error?.message ?? "계정 삭제에 실패했어요.");
        return;
      }
      // 삭제 성공 → 자동 로그아웃 + 로그인 페이지로 이동
      await signOutAction();
      router.replace("/login");
    });
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        계정 삭제
      </Button>
    );
  }

  return (
    <div className="app-surface rounded-2xl p-4 space-y-3">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" aria-hidden />
        <div className="space-y-1 text-[15px]">
          <p className="font-medium text-foreground">정말 계정을 삭제할까요?</p>
          <p className="text-muted-foreground leading-relaxed">
            계정과 함께 모든 운세·타로·채팅·궁합 기록이 영구 삭제돼요.
            진행 중인 구독은 자동 취소돼요. 되돌릴 수 없어요.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm-email" className="text-[15px]">
          확인을 위해 본인 이메일({userEmail}) 을 입력해 주세요.
        </Label>
        <Input
          id="confirm-email"
          type="email"
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
          placeholder={userEmail}
          disabled={isPending}
          autoComplete="off"
        />
      </div>

      {error ? <p className="text-[15px] text-destructive">{error}</p> : null}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="flex-1"
          onClick={() => {
            setOpen(false);
            setConfirmEmail("");
            setError(null);
          }}
          disabled={isPending}
        >
          취소
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="flex-1"
          onClick={handleDelete}
          disabled={isPending || confirmEmail.trim() === ""}
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : null}
          영구 삭제
        </Button>
      </div>
    </div>
  );
}
