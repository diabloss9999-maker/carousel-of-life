import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, CheckCircle2, MessageCircle, Sparkles } from "lucide-react";

import { ROUTES } from "@/lib/constants";

export function MembershipSuccessBanner() {
  return (
    <section className="app-surface rounded-3xl border border-primary/25 bg-primary/10 p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <CheckCircle2 className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-primary">
              멤버십이 활성화됐어요
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              이제 심층 리포트와 확장 기능을 바로 열 수 있어요
            </h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-6 text-muted-foreground">
              오늘운세를 더 깊게 보거나, 월간 리포트와 사주 심층 풀이로 바로 이어가 보세요.
            </p>
          </div>
        </div>
        <Link
          href={ROUTES.settings as Route}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-primary/25 px-4 py-2.5 text-[14px] font-semibold text-primary transition hover:bg-primary/10"
        >
          멤버십 확인
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
        <SuccessAction
          href={ROUTES.monthly as Route}
          icon={Sparkles}
          title="월간 심층 보기"
          body="이번 달 관계·돈·일 흐름 열기"
        />
        <SuccessAction
          href={ROUTES.saju as Route}
          icon={Sparkles}
          title="사주 심층 보기"
          body="내 기질과 흐름 더 깊게 보기"
        />
        <SuccessAction
          href={ROUTES.chat as Route}
          icon={MessageCircle}
          title="멤버 대화 시작"
          body="확장된 대화 횟수로 이어가기"
        />
      </div>
    </section>
  );
}

function SuccessAction({
  body,
  href,
  icon: Icon,
  title,
}: {
  body: string;
  href: Route;
  icon: typeof Sparkles;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 transition hover:bg-white/[0.1]"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block text-[14px] font-semibold">{title}</span>
          <span className="mt-0.5 block text-[12px] leading-5 text-muted-foreground">
            {body}
          </span>
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 opacity-50 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}
