"use client";

/**
 * 대시보드 라우트 그룹 에러 바운더리.
 *
 * 17개 dashboard 페이지에서 throw 된 에러를 잡아 사용자 친화적 화면 노출.
 * 전역 global-error.tsx 로 떨어지면 헤더·푸터 없는 베어 화면이라 UX 깨짐.
 */
import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    console.error("[dashboard error]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <AlertTriangle
        className="h-10 w-10 text-amber-400/80"
        aria-hidden
      />
      <h1 className="font-mystic text-2xl font-semibold tracking-tight">
        잠시 별빛이 흐려졌어요
      </h1>
      <p className="text-[15px] leading-relaxed text-muted-foreground">
        풀이를 가져오는 중 어긋남이 생겼어요. 잠시 후 다시 시도해 주세요.
        문제가 이어지면 설정 페이지에서 고객 지원으로 알려주세요.
      </p>
      {error.digest ? (
        <p className="text-[15px] text-muted-foreground/60">
          오류 코드: {error.digest}
        </p>
      ) : null}
      <Button
        type="button"
        onClick={reset}
        className="mt-2"
        size="default"
      >
        <RotateCcw className="mr-2 h-4 w-4" aria-hidden />
        다시 시도
      </Button>
    </div>
  );
}
