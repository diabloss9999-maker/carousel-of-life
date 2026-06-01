import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BarChart3, Users, CreditCard, TrendingUp, Clock, Sparkles } from "lucide-react";

import { requireProfile } from "@/lib/auth/get-user";
import { isAdmin } from "@/lib/auth/admin";
import { getAdminStats } from "@/lib/admin/stats-service";
import { CHARACTERS, type CharacterId } from "@/lib/chat/characters";
import { formatKRW } from "@/lib/utils";

export const metadata: Metadata = {
  title: "운영자 통계",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * 운영자 전용 통계 대시보드.
 *
 * 마스터 계정(isAdmin)만 접근 가능. 그 외에는 404 (존재 자체를 숨김).
 * 방문자·시간대별 트래픽 정밀 데이터는 Vercel Analytics 콘솔에서 확인.
 */
export default async function AdminPage() {
  const { user } = await requireProfile();
  if (!isAdmin(user.email)) notFound();

  const stats = await getAdminStats();
  const { today, lifetime, featureUsage, characterRank, hourlyActivity, recentRevenue } =
    stats;

  const peakHour = hourlyActivity.reduce(
    (max, h) => (h.count > max.count ? h : max),
    { hour: 0, count: 0 },
  );
  const maxHourCount = Math.max(1, ...hourlyActivity.map((h) => h.count));
  const maxFeatureCount = Math.max(1, ...featureUsage.map((f) => f.count));
  const maxCharCount = Math.max(1, ...characterRank.map((c) => c.messageCount));
  const maxRevenue = Math.max(1, ...recentRevenue.map((d) => d.revenueKRW));

  return (
    <div data-keep-color className="space-y-8 text-white">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6" aria-hidden />
          <h1 className="font-mystic text-2xl font-semibold tracking-tight sm:text-3xl">
            운영자 통계
          </h1>
        </div>
        <p className="text-[15px] text-white/70">
          오늘(KST) 기준 핵심 지표. 정밀 방문자·트래픽은 Vercel Analytics 참고.
        </p>
      </header>

      {/* 오늘 요약 카드 */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={<Users className="h-4 w-4" />} label="신규 가입" value={`${today.newSignups}명`} />
        <StatCard icon={<CreditCard className="h-4 w-4" />} label="오늘 결제자" value={`${today.payingUsers}명`} />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="오늘 매출" value={formatKRW(today.revenueKRW)} />
        <StatCard icon={<Sparkles className="h-4 w-4" />} label="활동 사용자" value={`${today.activeChatUsers}명`} />
        <StatCard icon={<CreditCard className="h-4 w-4" />} label="라이트 결제" value={`${today.litePayments}건`} />
        <StatCard icon={<CreditCard className="h-4 w-4" />} label="프로 결제" value={`${today.proPayments}건`} />
      </section>

      {/* 누적 지표 */}
      <Panel title="누적 지표">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="총 회원" value={`${lifetime.totalMembers}명`} />
          <StatCard label="활성 구독자" value={`${lifetime.activeSubscribers}명`} />
          <StatCard label="누적 매출" value={formatKRW(lifetime.totalRevenueKRW)} />
          <StatCard label="누적 결제 건수" value={`${lifetime.totalPaidCount}건`} />
        </div>
      </Panel>

      {/* 기능 사용 랭킹 */}
      <Panel title="오늘 기능 사용 랭킹">
        <div className="space-y-2.5">
          {featureUsage.map((f) => (
            <BarRow key={f.label} label={f.label} value={f.count} max={maxFeatureCount} suffix="회" />
          ))}
        </div>
      </Panel>

      {/* 점술사 인기 */}
      <Panel title="오늘 점술사 대화량">
        {characterRank.length === 0 ? (
          <p className="text-[15px] text-white/60">오늘 대화 기록이 아직 없어요.</p>
        ) : (
          <div className="space-y-2.5">
            {characterRank.map((c) => {
              const char = CHARACTERS[c.characterId as CharacterId];
              return (
                <BarRow
                  key={c.characterId}
                  label={char?.name ?? c.characterId}
                  value={c.messageCount}
                  max={maxCharCount}
                  suffix="건"
                />
              );
            })}
          </div>
        )}
      </Panel>

      {/* 활동 시간대 */}
      <Panel
        title="오늘 활동 시간대 (KST)"
        subtitle={
          peakHour.count > 0
            ? `가장 활발한 시간: ${peakHour.hour}시 (${peakHour.count}건)`
            : "오늘 활동이 아직 없어요."
        }
      >
        <div className="flex items-end gap-0.5 h-32">
          {hourlyActivity.map((h) => (
            <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end" style={{ height: "100%" }}>
                <div
                  className="w-full rounded-t bg-gradient-to-t from-amber-400/60 to-amber-300"
                  style={{ height: `${(h.count / maxHourCount) * 100}%`, minHeight: h.count > 0 ? "3px" : "0" }}
                  title={`${h.hour}시: ${h.count}건`}
                />
              </div>
              {h.hour % 3 === 0 && (
                <span className="text-[10px] text-white/50 tabular-nums">{h.hour}</span>
              )}
            </div>
          ))}
        </div>
      </Panel>

      {/* 최근 7일 매출 */}
      <Panel title="최근 7일 매출 추이">
        <div className="space-y-2.5">
          {recentRevenue.map((d) => (
            <div key={d.date} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-[13px] tabular-nums text-white/60">
                {d.date.slice(5)}
              </span>
              <div className="flex-1 h-5 rounded bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500/70 to-emerald-400 rounded"
                  style={{ width: `${(d.revenueKRW / maxRevenue) * 100}%` }}
                />
              </div>
              <span className="w-24 shrink-0 text-right text-[13px] tabular-nums text-white/85">
                {formatKRW(d.revenueKRW)}
              </span>
              <span className="w-10 shrink-0 text-right text-[13px] tabular-nums text-white/50">
                {d.paidCount}건
              </span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Vercel Analytics 안내 */}
      <Panel title="방문자 · 트래픽">
        <div className="flex items-start gap-2 text-[15px] text-white/70">
          <Clock className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
          <p className="leading-relaxed">
            정확한 페이지 방문자 수·유입 경로·기기별 트래픽은
            <strong className="text-white"> Vercel Analytics 콘솔</strong>에서 실시간으로 확인할 수 있어요.
            <br />
            (vercel.com → carousel-of-life 프로젝트 → Analytics 탭)
            <br />
            위 &quot;활동 사용자&quot;·&quot;활동 시간대&quot;는 채팅 활동 기준 근사치예요.
          </p>
        </div>
      </Panel>
    </div>
  );
}

// =============================================================================
// 내부 UI 컴포넌트
// =============================================================================

function StatCard({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/15 bg-black/25 px-3 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 text-white/60">
        {icon}
        <span className="text-[13px]">{label}</span>
      </div>
      <p className="mt-1 font-mystic text-lg font-bold tabular-nums text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
        {value}
      </p>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/15 bg-black/25 p-5 backdrop-blur-sm">
      <h2 className="font-mystic text-lg font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
        {title}
      </h2>
      {subtitle && <p className="mb-3 mt-0.5 text-[13px] text-white/60">{subtitle}</p>}
      <div className={subtitle ? "" : "mt-3"}>{children}</div>
    </section>
  );
}

function BarRow({
  label,
  value,
  max,
  suffix,
}: {
  label: string;
  value: number;
  max: number;
  suffix: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-[14px] text-white/80">{label}</span>
      <div className="flex-1 h-5 rounded bg-white/10 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-500/70 to-violet-400 rounded"
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
      <span className="w-14 shrink-0 text-right text-[14px] tabular-nums text-white/85">
        {value}
        {suffix}
      </span>
    </div>
  );
}
