import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Images } from "lucide-react";

/**
 * 포토카드 바인더 진입 티저 — /today 에서 /photocards 로 유도.
 */
export function PhotocardTeaser() {
  return (
    <Link
      href={"/photocards" as Route}
      className="app-surface flex items-center gap-3 rounded-3xl border border-white/10 p-4 transition hover:border-primary/30"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Images className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold">포토카드 바인더</span>
        <span className="block text-[13px] text-muted-foreground">
          멤버와 친해질수록 사진이 한 장씩 열려요.
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}
