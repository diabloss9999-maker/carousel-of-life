"use client";

/**
 * 멤버 선물 가게 — 별조각으로 선물 보내기 + 별조각 충전.
 *
 * - 채팅 화면 헤더의 "선물" 버튼으로 열리는 오버레이 패널.
 * - 선물을 보내면 친밀도가 오르고 멤버의 감사 멘트가 토스트로 표시된다.
 * - 충전 섹션은 PortOne 일회성 결제. Android 앱(TWA)에서는 Google Play 정책상
 *   `data-hide-in-app` 으로 숨긴다 (웹/iOS 브라우저에서만 노출).
 */
import { useCallback, useRef, useState } from "react";
import * as PortOne from "@portone/browser-sdk/v2";
import { AlertCircle, Gift, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { clientEnv } from "@/lib/env";
import type { CharacterId } from "@/lib/chat/characters";
import {
  CURRENCY_EMOJI,
  CURRENCY_NAME,
  CURRENCY_PACKS,
  GIFTS,
} from "@/lib/gifts/catalog";
import { cn, formatKRW } from "@/lib/utils";

interface GiftShopProps {
  characterId: CharacterId;
  characterName: string;
  /** 결제 redirect 모드 복귀 경로 (기본: 현재 페이지). */
  returnTo?: string;
  compact?: boolean;
}

interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: { message?: string };
}

export function GiftShop({ characterId, characterName, returnTo, compact = false }: GiftShopProps) {
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [sendingGiftId, setSendingGiftId] = useState<string | null>(null);
  const [payingPackId, setPayingPackId] = useState<string | null>(null);
  const [topupNotice, setTopupNotice] = useState<string | null>(null);
  const [isAndroidApp, setIsAndroidApp] = useState(false);
  const topupSectionRef = useRef<HTMLElement | null>(null);

  function isRunningInAndroidApp(): boolean {
    return (
      typeof document !== "undefined" &&
      document.documentElement.dataset.platform === "android"
    );
  }

  const refreshBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/currency");
      const json = (await res.json()) as ApiEnvelope<{ balance: number }>;
      if (json.ok && json.data) setBalance(json.data.balance);
    } catch {
      /* 잔액 갱신 실패는 치명적이지 않음 — 다음 열기에서 재시도 */
    }
  }, []);

  function openShop(): void {
    setOpen(true);
    setTopupNotice(null);
    setIsAndroidApp(isRunningInAndroidApp());
    void refreshBalance();
  }

  async function handleSendGift(giftId: string) {
    if (sendingGiftId) return;
    setSendingGiftId(giftId);
    try {
      const res = await fetch("/api/gifts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId, giftId }),
      });
      const json = (await res.json()) as ApiEnvelope<{
        balance: number;
        thanks: string;
        affinityPoints: number;
        giftEmoji: string;
      }>;
      if (!json.ok || !json.data) {
        const message = json.error?.message ?? "선물을 보내지 못했어요.";
        if (message.includes("부족")) {
          handleNeedTopup(GIFTS.find((gift) => gift.id === giftId)?.cost ?? 0);
        } else {
          toast.error(message);
        }
        return;
      }
      setBalance(json.data.balance);
      toast.success(
        `${json.data.giftEmoji} ${characterName} · 친밀도 +${json.data.affinityPoints}`,
        { description: json.data.thanks, duration: 6000 },
      );
    } catch {
      toast.error("연결이 잠깐 흔들렸어요. 다시 시도해주세요.");
    } finally {
      setSendingGiftId(null);
    }
  }

  function handleNeedTopup(requiredCost: number): void {
    const missingCount =
      balance == null ? null : Math.max(0, requiredCost - balance);

    const androidApp = isRunningInAndroidApp();
    setIsAndroidApp(androidApp);

    if (androidApp) {
      const message =
        missingCount != null && missingCount > 0
          ? `별조각 ${missingCount.toLocaleString()}개가 더 필요해요. 설치 앱에서는 별조각 충전을 준비 중이라 지금은 출석 보상과 보너스로 모을 수 있어요.`
          : "설치 앱에서는 별조각 충전을 준비 중이에요. 지금은 출석 보상과 보너스로 별조각을 모을 수 있어요.";
      setTopupNotice(message);
      toast("별조각이 부족해요", { description: message });
      return;
    }

    const message =
      missingCount != null && missingCount > 0
        ? `별조각 ${missingCount.toLocaleString()}개가 더 필요해요. 아래 충전 상품 중 하나를 선택하면 바로 결제창이 열려요.`
        : "아래 충전 상품 중 하나를 선택하면 바로 결제창이 열려요.";
    setTopupNotice(message);
    topupSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    toast("별조각이 부족해요", { description: message });
  }

  async function handleTopup(packId: string) {
    const storeId = clientEnv.NEXT_PUBLIC_PORTONE_STORE_ID;
    const channelKey = clientEnv.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;
    const pack = CURRENCY_PACKS.find((p) => p.id === packId);
    if (!storeId || !channelKey || !pack) {
      toast.error("결제 시스템이 아직 준비되지 않았어요.");
      return;
    }
    if (payingPackId) return;
    setPayingPackId(packId);

    const paymentId = `cur-${crypto.randomUUID()}`;
    const origin = window.location.origin;
    const backTo = returnTo ?? window.location.pathname;
    const redirectUrl = `${origin}/api/currency/confirm?packId=${encodeURIComponent(packId)}&returnTo=${encodeURIComponent(backTo)}`;

    try {
      const response = await PortOne.requestPayment({
        storeId,
        channelKey,
        paymentId,
        orderName: `${CURRENCY_NAME} ${pack.amount}${"개"}`,
        totalAmount: pack.priceKRW,
        currency: "KRW",
        payMethod: "CARD",
        redirectUrl,
      });

      // redirect 모드면 response 가 undefined — 페이지가 redirectUrl 로 이동.
      if (!response) return;
      if (response.code != null) {
        toast.error(response.message ?? "결제가 취소되었어요.");
        return;
      }

      // popup/iframe 모드 — 서버 검증 + 충전.
      const res = await fetch("/api/currency/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: response.paymentId ?? paymentId, packId }),
      });
      const json = (await res.json()) as ApiEnvelope<{ balance: number }>;
      if (!json.ok || !json.data) {
        toast.error(json.error?.message ?? "충전 확인에 실패했어요.");
        return;
      }
      setBalance(json.data.balance);
      toast.success(`${CURRENCY_EMOJI} ${CURRENCY_NAME} ${pack.amount}개 충전 완료!`);
    } catch (e) {
      toast.error(
        `결제창 호출 실패: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setPayingPackId(null);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={compact ? "ghost" : "outline"}
        size="sm"
        onClick={openShop}
        className={cn("gap-1.5", compact && "h-9 w-9 rounded-full px-0")}
        aria-label={`${characterName}에게 선물하기`}
        title={`${characterName}에게 선물하기`}
      >
        <Gift className="h-4 w-4" aria-hidden />
        {!compact ? "선물" : null}
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-[2px] sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={`${characterName}에게 선물하기`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="gift-sheet max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-[24px] border border-black/10 bg-white text-neutral-950 shadow-2xl sm:rounded-[24px]">
            <div className="gift-sheet-header sticky top-0 z-10 border-b border-neutral-200 bg-white/95 px-5 pb-3 pt-4 backdrop-blur">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-neutral-300 sm:hidden" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-neutral-500">
                    선물하기
                  </p>
                  <h2 className="truncate text-xl font-bold tracking-tight text-neutral-950">
                    {characterName}에게 보내기
                  </h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">
                    별조각으로 마음을 보내고 친밀도를 올려요.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="닫기"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-600 transition hover:bg-neutral-200"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </div>

            <div className="space-y-5 px-5 py-4">
              {/* 잔액 */}
              <div className="gift-balance-card flex items-center justify-between rounded-2xl bg-neutral-950 px-4 py-3 text-white">
                <div>
                  <p className="text-[12px] font-medium text-white/60">
                    보유 {CURRENCY_NAME}
                  </p>
                  <p className="mt-0.5 text-[13px] text-white/80">
                    선물 구매에 사용돼요
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black tabular-nums">
                    {balance == null ? "—" : balance.toLocaleString()}
                  </p>
                  <p className="text-[12px] font-semibold text-white/60">
                    {CURRENCY_EMOJI} {CURRENCY_NAME}
                  </p>
                </div>
              </div>

              {topupNotice ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
                  <div className="flex gap-2.5">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <div className="space-y-1">
                      <p className="text-[13px] font-bold">충전 안내</p>
                      <p className="text-[12px] leading-relaxed">
                        {topupNotice}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* 선물 목록 */}
              <section className="space-y-3">
                <div className="flex items-end justify-between">
                  <h3 className="text-base font-bold text-neutral-950">
                    선물 선택
                  </h3>
                  <p className="text-[12px] text-neutral-500">
                    친밀도 상승
                  </p>
                </div>
                <div className="gift-list space-y-2.5">
                  {GIFTS.map((gift) => {
                    const isSending = sendingGiftId === gift.id;
                    const tooExpensive = balance != null && balance < gift.cost;
                    return (
                      <button
                        key={gift.id}
                        type="button"
                        onClick={() => {
                          if (tooExpensive) {
                            handleNeedTopup(gift.cost);
                            return;
                          }
                          void handleSendGift(gift.id);
                        }}
                        disabled={!!sendingGiftId}
                        className={cn(
                          "gift-row group w-full rounded-2xl border bg-white p-3 text-left shadow-sm transition",
                          tooExpensive
                            ? "border-neutral-200 hover:border-neutral-300 hover:shadow-md"
                            : "border-neutral-200 hover:border-neutral-900 hover:shadow-md",
                          "disabled:cursor-not-allowed",
                        )}
                      >
                        <span
                          className="gift-row-emoji grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-neutral-100 text-3xl"
                          aria-hidden
                        >
                          {isSending ? (
                            <Loader2 className="h-5 w-5 animate-spin text-neutral-700" />
                          ) : (
                            gift.emoji
                          )}
                        </span>
                        <div className="gift-row-copy min-w-0 flex-1">
                          <p className="gift-row-name truncate text-[15px] font-bold leading-tight text-neutral-950">
                            {gift.name}
                          </p>
                          <div className="gift-row-meta mt-1 text-[12px] leading-none">
                            <span className="gift-row-affinity whitespace-nowrap font-semibold text-rose-500">
                              친밀도 +{gift.affinityPoints}
                            </span>
                            <span className="gift-row-cost whitespace-nowrap rounded-full bg-amber-100 px-2 py-1 font-bold text-amber-800">
                              {CURRENCY_EMOJI} {gift.cost}
                            </span>
                          </div>
                        </div>
                        <span
                          data-state={tooExpensive ? "needs-topup" : "ready"}
                          className={cn(
                            "gift-row-action shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-[12px] font-bold",
                            tooExpensive
                              ? "bg-neutral-100 text-neutral-500"
                              : "bg-neutral-950 text-white",
                          )}
                        >
                          {tooExpensive ? (
                            <>
                              <span>{isAndroidApp ? "부족" : "충전 이동"}</span>
                            </>
                          ) : (
                            "보내기"
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 충전 — Android 앱에서는 숨김 (Google Play 정책) */}
              <section
                ref={topupSectionRef}
                data-hide-in-app
                className="space-y-3 border-t border-neutral-200 pt-4"
              >
                <div className="flex items-end justify-between">
                  <h3 className="text-base font-bold text-neutral-950">
                    {CURRENCY_NAME} 충전
                  </h3>
                  <p className="text-[12px] text-neutral-500">
                    웹 결제
                  </p>
                </div>
                <div className="gift-pack-list space-y-2">
                  {CURRENCY_PACKS.map((pack) => (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => handleTopup(pack.id)}
                      disabled={!!payingPackId}
                      className={cn(
                        "gift-pack-row relative flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
                        pack.popular
                          ? "border-yellow-400 bg-yellow-50"
                          : "border-neutral-200 bg-neutral-50",
                        "hover:border-neutral-900 disabled:cursor-not-allowed disabled:opacity-50",
                      )}
                    >
                      {pack.popular ? (
                        <span className="absolute -top-2 left-4 rounded-full bg-yellow-300 px-2 py-0.5 text-[10px] font-black text-neutral-950">
                          추천
                        </span>
                      ) : null}
                      <span className="text-[15px] font-black tabular-nums text-neutral-950">
                        {payingPackId === pack.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          `${CURRENCY_EMOJI} ${pack.amount.toLocaleString()}개`
                        )}
                      </span>
                      <span className="text-[13px] font-bold text-neutral-600">
                        {formatKRW(pack.priceKRW)}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] leading-relaxed text-neutral-500">
                  충전한 {CURRENCY_NAME}은 환불 정책에 따라 미사용분에 한해 환불 가능해요.
                  결제 문의: diabloss9999@gmail.com
                </p>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
