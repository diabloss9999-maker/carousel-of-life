/**
 * 팬 프로필 카드 — 설정 페이지 상단.
 *
 * 최애 스티커 + "OO과 함께한 지 D+n" + 친밀도 레벨 · 보낸 선물 · 별조각 잔액.
 * 최애가 없으면 등록 유도 CTA를 보여준다. 서버 컴포넌트.
 */
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { getTranslations } from "next-intl/server";

import { CHARACTERS, type CharacterId } from "@/lib/chat/characters";
import type { FanStats } from "@/lib/profile/fan-stats";

interface FanProfileCardProps {
  displayName: string | null;
  biasCharacterId: CharacterId | null;
  stats: FanStats;
}

export async function FanProfileCard({
  displayName,
  biasCharacterId,
  stats,
}: FanProfileCardProps) {
  const t = await getTranslations("fanProfileCard");
  const tChar = await getTranslations("characters");
  const bias = biasCharacterId ? CHARACTERS[biasCharacterId] : null;
  const fanName = displayName?.trim() || t("fallbackFanName");
  const biasName = biasCharacterId ? tChar(`${biasCharacterId}.name`) : "";

  return (
    <div className="app-surface relative overflow-hidden rounded-2xl border border-primary/25 p-5">
      <div className="flex items-center gap-4">
        {bias && biasCharacterId ? (
          <div className="relative h-20 w-20 shrink-0">
            <Image
              src={`/characters/idols/stickers/${biasCharacterId}.sticker.png`}
              alt={biasName}
              width={80}
              height={80}
              sizes="80px"
              className="h-20 w-20 object-contain drop-shadow-[0_10px_16px_rgba(0,0,0,0.3)]"
            />
          </div>
        ) : (
          <span className="text-4xl" aria-hidden>
            💜
          </span>
        )}

        <div className="min-w-0 flex-1 space-y-0.5">
          {bias && stats.daysTogether != null ? (
            <>
              <p className="font-mystic text-lg font-semibold leading-tight">
                {t("daysTogetherPrefix", { name: biasName })}{" "}
                <span className="text-primary">D+{stats.daysTogether}</span>
              </p>
              <p className="text-[14px] text-muted-foreground">
                {t("biasLine", { fanName, level: stats.level })}
              </p>
            </>
          ) : (
            <>
              <p className="font-mystic text-lg font-semibold leading-tight">
                {t("noBiasTitle")}
              </p>
              <p className="text-[14px] text-muted-foreground">
                {t("noBiasBody")}
              </p>
            </>
          )}
        </div>
      </div>

      {/* 통계 칩 */}
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl border border-border/40 bg-background/35 px-2 py-2.5">
          <dt className="text-[11px] text-muted-foreground/75">{t("level")}</dt>
          <dd className="mt-0.5 font-mystic text-[15px] font-bold">
            Lv.{stats.level}
            <span className="ml-1 text-[11px] font-normal text-muted-foreground">
              ({stats.points}pt)
            </span>
          </dd>
        </div>
        <div className="rounded-xl border border-border/40 bg-background/35 px-2 py-2.5">
          <dt className="text-[11px] text-muted-foreground/75">{t("giftsSent")}</dt>
          <dd className="mt-0.5 font-mystic text-[15px] font-bold">
            🎁 {stats.giftCount}
          </dd>
        </div>
        <div className="rounded-xl border border-amber-300/35 bg-amber-100/15 px-2 py-2.5">
          <dt className="text-[11px] text-muted-foreground/75">{t("starPieces")}</dt>
          <dd className="mt-0.5 font-mystic text-[15px] font-bold tabular-nums">
            ✦ {stats.starBalance.toLocaleString()}
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex gap-2">
        <Link
          href={"/weekly" as Route}
          className="flex-1 rounded-xl border border-border/50 bg-background/35 px-3 py-2 text-center text-[14px] font-semibold transition hover:border-primary/50 hover:bg-primary/5"
        >
          {t("weeklyCta")}
        </Link>
        {!bias ? (
          <Link
            href={"/chat" as Route}
            className="flex-1 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-center text-[14px] font-semibold transition hover:bg-primary/15"
          >
            {t("meetMembersCta")}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
