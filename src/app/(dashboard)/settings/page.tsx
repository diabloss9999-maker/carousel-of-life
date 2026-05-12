import type { Metadata, Route } from "next";
import Link from "next/link";
import { Archive, Crown, MessageCircleHeart, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CancelSubscriptionButton } from "@/components/subscription/cancel-subscription-button";
import { ProfileEditForm } from "@/components/settings/profile-edit-form";
import { ROUTES } from "@/lib/constants";
import { requireProfile } from "@/lib/auth/get-user";
import {
  getLatestSubscription,
  hasActiveSubscription,
} from "@/lib/payment/subscription-state";
import { formatKoreanDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "설정",
};

export default async function SettingsPage() {
  const { user, profile } = await requireProfile();
  const subscribed = await hasActiveSubscription(user.id);
  const subscription = await getLatestSubscription(user.id);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-mystic text-3xl font-semibold tracking-tight">
          내 자리
        </h1>
        <p className="text-sm text-muted-foreground">
          멤버십과 정보를 살펴볼 수 있어.
        </p>
      </header>

      {/* 멤버십 카드 */}
      <Card
        className={
          subscribed
            ? "border-accent/30 bg-card/60 backdrop-blur ring-1 ring-accent/20"
            : "border-border/40 bg-card/50 backdrop-blur"
        }
      >
        <CardHeader className="pb-3">
          <CardTitle className="font-mystic flex items-center gap-2 text-lg">
            <Crown
              className={
                subscribed
                  ? "h-5 w-5 text-accent"
                  : "h-5 w-5 text-muted-foreground"
              }
              aria-hidden
            />
            멤버십
          </CardTitle>
          <CardDescription className="text-xs">
            {subscribed
              ? "라이트 사용 중. 모든 풀이가 무제한이야."
              : "지금은 무료 멤버십이야."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {subscribed && subscription ? (
            <>
              <div className="rounded-2xl bg-muted/30 p-3 text-sm">
                <Row
                  label="다음 결제일"
                  value={
                    subscription.currentPeriodEndsAt
                      ? formatKoreanDate(
                          new Date(subscription.currentPeriodEndsAt),
                        )
                      : "—"
                  }
                />
                {subscription.cancelAtPeriodEnd ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    이 날짜 이후 자동으로 만료돼.
                  </p>
                ) : null}
              </div>
              {!subscription.cancelAtPeriodEnd ? (
                <CancelSubscriptionButton />
              ) : null}
            </>
          ) : (
            <Button asChild className="w-full" size="sm">
              <Link href={ROUTES.pricing}>라이트로 업그레이드</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 기본 정보 카드 */}
      <Card className="app-surface">
        <CardHeader className="pb-3">
          <CardTitle className="font-mystic flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" aria-hidden />
            내 정보
          </CardTitle>
          <CardDescription className="text-xs">
            사주 풀이에 쓰이는 정보야.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <Row label="이름" value={profile.displayName ?? "—"} />
          <Row label="이메일" value={user.email ?? "—"} />
          <Row
            label="생년월일"
            value={`${profile.birthDate} (${profile.calendarSystem === "lunar" ? "음력" : "양력"})`}
          />
          <Row label="태어난 시각" value={profile.birthTime ?? "모름"} />
          <Row
            label="성별"
            value={
              profile.gender === "male"
                ? "남"
                : profile.gender === "female"
                  ? "여"
                  : "기타"
            }
          />
          <Row label="성격유형" value={profile.mbti ?? "—"} />
          <Row label="출생지" value={profile.birthPlace ?? "—"} />
          <div className="pt-2">
            <ProfileEditForm
              displayName={profile.displayName ?? ""}
              mbti={profile.mbti ?? null}
              birthPlace={profile.birthPlace ?? null}
            />
          </div>
        </CardContent>
      </Card>

      {/* 기록 카드 */}
      <Card className="border-border/40 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="font-mystic flex items-center gap-2 text-lg">
            <Archive className="h-5 w-5 text-primary" aria-hidden />
            풀이 기록
          </CardTitle>
          <CardDescription className="text-xs">
            지난 운세·타로·궁합 풀이를 한 곳에서 돌아봐.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href={ROUTES.history as Route}>기록 보기</Link>
          </Button>
        </CardContent>
      </Card>

      {/* 운영자에게 정보 공유 */}
      <Card className="border-border/40 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="font-mystic flex items-center gap-2 text-lg">
            <MessageCircleHeart className="h-5 w-5 text-primary" aria-hidden />
            운영자에게 의견 보내기
          </CardTitle>
          <CardDescription className="text-xs">
            불편한 점, 바라는 기능, 솔직한 피드백 — 뭐든 환영해.
            카카오 오픈채팅방에서 자유롭게 이야기해줘.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full" variant="outline" size="sm">
            <a
              href="https://invite.kakao.com/tc/W5meqEedOZ"
              target="_blank"
              rel="noopener noreferrer"
            >
              오픈채팅방 참여하기
            </a>
          </Button>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground/60">
        {profile.displayName ?? "친구"}야, 오늘도 별이 함께해.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/30 py-2 last:border-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium text-sm">{value}</dd>
    </div>
  );
}
