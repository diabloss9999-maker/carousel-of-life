import type { Metadata, Route } from "next";
import Link from "next/link";
import {
  BarChart3,
  Bell,
  CalendarClock,
  Crown,
  MessageCircleHeart,
  ShieldCheck,
  User,
} from "lucide-react";

import { CancelSubscriptionButton } from "@/components/subscription/cancel-subscription-button";
import { DeleteAccountButton } from "@/components/settings/delete-account-button";
import { FanProfileCard } from "@/components/settings/fan-profile-card";
import { MemberNicknameCard } from "@/components/settings/member-nickname-card";
import { ProfileEditForm } from "@/components/settings/profile-edit-form";
import { PushToggle } from "@/components/settings/push-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CharacterId } from "@/lib/chat/characters";
import { ROUTES } from "@/lib/constants";
import { isAdmin } from "@/lib/auth/admin";
import { requireProfile } from "@/lib/auth/get-user";
import {
  getLatestSubscription,
  getSubscriptionTier,
  hasActiveSubscription,
} from "@/lib/payment/subscription-state";
import { getFanStats } from "@/lib/profile/fan-stats";
import { formatKoreanDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "설정",
};

export default async function SettingsPage() {
  const { user, profile } = await requireProfile();
  const [subscribed, subscription, tier] = await Promise.all([
    hasActiveSubscription(user.id),
    getLatestSubscription(user.id),
    getSubscriptionTier(user.id),
  ]);
  const adminMode = isAdmin(user.email);
  const biasId = (profile.biasCharacter ?? null) as CharacterId | null;
  const fanStats = await getFanStats(profile.userId, biasId).catch(() => ({
    daysTogether: null,
    level: 0,
    points: 0,
    giftCount: 0,
    starBalance: 0,
  }));

  const calendarLabel =
    profile.calendarSystem === "lunar"
      ? "음력"
      : profile.calendarSystem === "solar"
        ? "양력"
        : "미입력";

  const genderLabel =
    profile.gender === "male"
      ? "남성"
      : profile.gender === "female"
        ? "여성"
        : "기타";

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-mystic text-3xl font-semibold tracking-tight">
          설정
        </h1>
        <p className="text-[15px] text-muted-foreground">
          내 정보, 멤버십, 알림, 계정 상태를 관리해요.
        </p>
      </header>

      <FanProfileCard
        displayName={profile.displayName ?? null}
        biasCharacterId={biasId}
        stats={fanStats}
      />

      <Card className="app-surface">
        <CardHeader className="pb-3">
          <CardTitle className="font-mystic flex items-center gap-2 text-lg">
            <MessageCircleHeart className="h-5 w-5 text-primary" aria-hidden />
            멤버가 부르는 애칭
          </CardTitle>
          <CardDescription className="text-[15px]">
            멤버들이 대화에서 나를 부를 애칭을 정해요. 비우면 기본 “라이더”예요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MemberNicknameCard initialNickname={profile.memberNickname ?? null} />
        </CardContent>
      </Card>

      {adminMode ? (
        <Card className="app-surface ring-1 ring-amber-400/30">
          <CardHeader className="pb-3">
            <CardTitle className="font-mystic flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-amber-400" aria-hidden />
              운영 통계
            </CardTitle>
            <CardDescription className="text-[15px]">
              방문, 결제, 기능 사용 통계를 확인할 수 있어요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href={"/admin" as Route}>통계 대시보드 열기</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <MembershipCard
          subscribed={subscribed}
          subscription={subscription}
          tier={tier}
        />

        <Card className="app-surface">
          <CardHeader className="pb-3">
            <CardTitle className="font-mystic flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-primary" aria-hidden />
              매일 알림
            </CardTitle>
            <CardDescription className="text-[15px]">
              오늘의 운세와 중요한 안내를 알림으로 받을 수 있어요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PushToggle />
          </CardContent>
        </Card>
      </div>

      <Card className="app-surface">
        <CardHeader className="pb-3">
          <CardTitle className="font-mystic flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" aria-hidden />
            내 정보
          </CardTitle>
          <CardDescription className="text-[15px]">
            운세와 사주 풀이에 사용하는 기본 정보를 확인해요.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-[15px]">
          <Row label="이름" value={profile.displayName ?? "미입력"} />
          <Row label="이메일" value={user.email ?? "미입력"} />
          <Row
            label="생년월일"
            value={profile.birthDate ? `${profile.birthDate} (${calendarLabel})` : "미입력"}
          />
          <Row label="태어난 시간" value={profile.birthTime ?? "미입력"} />
          <Row label="성별" value={genderLabel} />
          <Row label="MBTI" value={profile.mbti ?? "미입력"} />
          <Row label="출생지" value={profile.birthPlace ?? "미입력"} />
          <div className="pt-2">
            <ProfileEditForm
              displayName={profile.displayName ?? ""}
              mbti={profile.mbti ?? null}
              birthPlace={profile.birthPlace ?? null}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="app-surface">
          <CardHeader className="pb-3">
            <CardTitle className="font-mystic flex items-center gap-2 text-lg">
              <MessageCircleHeart className="h-5 w-5 text-primary" aria-hidden />
              문의하기
            </CardTitle>
            <CardDescription className="text-[15px]">
              결제, 오류, 개선 의견은 오픈채팅으로 편하게 알려주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline" size="sm">
              <a
                href="https://invite.kakao.com/tc/W5meqEedOZ"
                target="_blank"
                rel="noopener noreferrer"
              >
                오픈채팅 열기
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="app-surface">
          <CardHeader className="pb-3">
            <CardTitle className="font-mystic flex items-center gap-2 text-lg text-muted-foreground">
              <ShieldCheck className="h-5 w-5" aria-hidden />
              계정 관리
            </CardTitle>
            <CardDescription className="text-[15px]">
              계정과 모든 데이터를 영구 삭제할 수 있어요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteAccountButton userEmail={user.email ?? ""} />
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-[15px] text-muted-foreground/60">
        {profile.displayName
          ? `${profile.displayName}님, 오늘도 필요한 만큼만 가볍게 확인해요.`
          : "오늘도 필요한 만큼만 가볍게 확인해요."}
      </p>
    </div>
  );
}

function MembershipCard({
  subscribed,
  subscription,
  tier,
}: {
  subscribed: boolean;
  subscription: Awaited<ReturnType<typeof getLatestSubscription>>;
  tier: "free" | "lite" | "pro";
}) {
  const planName =
    tier === "pro" ? "프로 멤버십" : tier === "lite" ? "라이트 멤버십" : "무료 이용 중";
  const provider =
    subscription?.provider === "google_play"
      ? "Google Play"
      : subscription?.provider === "portone"
        ? "카드/간편결제"
        : "없음";
  const nextDate = subscription?.currentPeriodEndsAt
    ? formatKoreanDate(new Date(subscription.currentPeriodEndsAt))
    : "확인 중";

  return (
    <Card className={subscribed ? "app-surface ring-1 ring-accent/20" : "app-surface"}>
      <CardHeader className="pb-3">
        <CardTitle className="font-mystic flex items-center gap-2 text-lg">
          <Crown
            className={subscribed ? "h-5 w-5 text-accent" : "h-5 w-5 text-muted-foreground"}
            aria-hidden
          />
          멤버십
        </CardTitle>
        <CardDescription className="text-[15px]">
          {subscribed
            ? "심층 리포트와 확장 기능을 이용할 수 있어요."
            : "무료 기능을 이용 중이에요."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {subscribed && subscription ? (
          <>
            <div className="rounded-2xl bg-muted/30 p-3 text-[15px]">
              <Row label="현재 플랜" value={planName} />
              <Row label="결제 수단" value={provider} />
              <Row
                label={subscription.cancelAtPeriodEnd ? "이용 종료 예정일" : "다음 결제 예정일"}
                value={nextDate}
              />
              <Row
                label="상태"
                value={subscription.cancelAtPeriodEnd ? "해지 예약" : "정상 이용 중"}
              />
            </div>
            {subscription.cancelAtPeriodEnd ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-[14px] leading-6 text-muted-foreground">
                해지 예약 상태예요. 표시된 날짜까지 멤버십 기능은 계속 이용할 수 있어요.
              </div>
            ) : (
              <CancelSubscriptionButton />
            )}
          </>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl bg-muted/30 p-3 text-[15px]">
              <Row label="현재 플랜" value={planName} />
              <Row label="심층 리포트" value="잠금" />
              <Row label="멤버 대화" value="기본 제공" />
            </div>
            <Button asChild className="w-full" size="sm">
              <Link href={ROUTES.pricing}>멤버십 보기</Link>
            </Button>
          </div>
        )}
        {subscribed ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <QuickLink href={ROUTES.monthly as Route} label="월간 심층" />
            <QuickLink href={ROUTES.saju as Route} label="사주 심층" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function QuickLink({ href, label }: { href: Route; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/20 px-3 py-2 text-[13px] font-semibold text-primary transition hover:bg-primary/10"
    >
      <CalendarClock className="h-3.5 w-3.5" aria-hidden />
      {label}
    </Link>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/30 py-2 last:border-0">
      <dt className="shrink-0 text-[15px] text-muted-foreground">{label}</dt>
      <dd className="text-right text-[15px] font-medium">{value}</dd>
    </div>
  );
}
