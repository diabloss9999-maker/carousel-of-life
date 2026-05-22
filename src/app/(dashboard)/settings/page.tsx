import type { Metadata, Route } from "next";
import Link from "next/link";
import { Archive, Bell, Crown, MessageCircleHeart, User, UserPlus } from "lucide-react";
import { getTranslations } from "next-intl/server";

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
import { DeleteAccountButton } from "@/components/settings/delete-account-button";
import { InviteCard } from "@/components/settings/invite-card";
import { PushToggle } from "@/components/settings/push-toggle";
import { ROUTES } from "@/lib/constants";
import { requireProfile } from "@/lib/auth/get-user";
import {
  getLatestSubscription,
  hasActiveSubscription,
} from "@/lib/payment/subscription-state";
import { buildInviteUrl, getInviteStats } from "@/lib/invites/service";
import { siteConfig } from "@/config/site";
import { formatKoreanDate } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settingsPage");
  return { title: t("metaTitle") };
}

export default async function SettingsPage() {
  const { user, profile } = await requireProfile();
  const subscribed = await hasActiveSubscription(user.id);
  const subscription = await getLatestSubscription(user.id);
  const inviteStats = await getInviteStats(user.id);
  const inviteUrl = buildInviteUrl(user.id, siteConfig.url);
  const t = await getTranslations("settingsPage");

  const calendarLabel =
    profile.calendarSystem === "lunar"
      ? t("calendarLunar")
      : profile.calendarSystem === "solar"
        ? t("calendarSolar")
        : t("calendarUnknown");

  const genderLabel =
    profile.gender === "male"
      ? t("genderMale")
      : profile.gender === "female"
        ? t("genderFemale")
        : t("genderOther");

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-mystic text-3xl font-semibold tracking-tight">
          {t("heading")}
        </h1>
        <p className="text-[15px] text-muted-foreground">
          {t("subheading")}
        </p>
      </header>

      {/* Plan card */}
      <Card
        className={
          subscribed
            ? "app-surface ring-1 ring-accent/20"
            : "app-surface"
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
            {t("membership")}
          </CardTitle>
          <CardDescription className="text-[15px]">
            {subscribed ? t("lightActive") : t("freeMembership")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {subscribed && subscription ? (
            <>
              <div className="rounded-2xl bg-muted/30 p-3 text-[15px]">
                <Row
                  label={t("nextBilling")}
                  value={
                    subscription.currentPeriodEndsAt
                      ? formatKoreanDate(
                          new Date(subscription.currentPeriodEndsAt),
                        )
                      : "—"
                  }
                />
                {subscription.cancelAtPeriodEnd ? (
                  <p className="mt-2 text-[15px] text-muted-foreground">
                    {t("autoExpireNote")}
                  </p>
                ) : null}
              </div>
              {!subscription.cancelAtPeriodEnd ? (
                <CancelSubscriptionButton />
              ) : null}
            </>
          ) : (
            <Button asChild className="w-full" size="sm">
              <Link href={ROUTES.pricing}>{t("upgradeCta")}</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Profile card */}
      <Card className="app-surface">
        <CardHeader className="pb-3">
          <CardTitle className="font-mystic flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" aria-hidden />
            {t("myInfo")}
          </CardTitle>
          <CardDescription className="text-[15px]">
            {t("myInfoHelp")}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-[15px]">
          <Row label={t("labelName")} value={profile.displayName ?? "—"} />
          <Row label={t("labelEmail")} value={user.email ?? "—"} />
          <Row
            label={t("labelBirthDate")}
            value={`${profile.birthDate} (${calendarLabel})`}
          />
          <Row label={t("labelBirthTime")} value={profile.birthTime ?? t("calendarUnknown")} />
          <Row label={t("labelGender")} value={genderLabel} />
          <Row label={t("labelMbti")} value={profile.mbti ?? "—"} />
          <Row label={t("labelBirthplace")} value={profile.birthPlace ?? "—"} />
          <div className="pt-2">
            <ProfileEditForm
              displayName={profile.displayName ?? ""}
              mbti={profile.mbti ?? null}
              birthPlace={profile.birthPlace ?? null}
            />
          </div>
        </CardContent>
      </Card>

      {/* History card */}
      <Card className="app-surface">
        <CardHeader className="pb-3">
          <CardTitle className="font-mystic flex items-center gap-2 text-lg">
            <Archive className="h-5 w-5 text-primary" aria-hidden />
            {t("fateLog")}
          </CardTitle>
          <CardDescription className="text-[15px]">
            {t("fateLogHelp")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href={ROUTES.history as Route}>{t("fateLogCta")}</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Friend invite card */}
      <Card className="app-surface">
        <CardHeader className="pb-3">
          <CardTitle className="font-mystic flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5 text-primary" aria-hidden />
            친구 초대
          </CardTitle>
          <CardDescription className="text-[15px]">
            친구를 별의 흐름에 초대해보세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteCard
            inviteUrl={inviteUrl}
            invitedCount={inviteStats.count}
          />
        </CardContent>
      </Card>

      {/* Push notification card */}
      <Card className="app-surface">
        <CardHeader className="pb-3">
          <CardTitle className="font-mystic flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-primary" aria-hidden />
            매일 알림
          </CardTitle>
          <CardDescription className="text-[15px]">
            아침마다 별의 흐름을 알림으로 받아볼 수 있어요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PushToggle />
        </CardContent>
      </Card>

      {/* Feedback card */}
      <Card className="app-surface">
        <CardHeader className="pb-3">
          <CardTitle className="font-mystic flex items-center gap-2 text-lg">
            <MessageCircleHeart className="h-5 w-5 text-primary" aria-hidden />
            {t("feedbackCta")}
          </CardTitle>
          <CardDescription className="text-[15px]">
            {t("feedbackBody")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full" variant="outline" size="sm">
            <a
              href="https://invite.kakao.com/tc/W5meqEedOZ"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("openChatCta")}
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* 계정 삭제 — Google Play 데이터 안전 섹션 필수 */}
      <Card className="app-surface">
        <CardHeader className="pb-3">
          <CardTitle className="font-mystic text-lg text-muted-foreground">
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

      <p className="text-center text-[15px] text-muted-foreground/60">
        {profile.displayName
          ? t("greetingNamed", { name: profile.displayName })
          : t("greetingAnon")}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/30 py-2 last:border-0">
      <dt className="text-[15px] text-muted-foreground">{label}</dt>
      <dd className="font-medium text-[15px]">{value}</dd>
    </div>
  );
}
