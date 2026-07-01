"use client";

/**
 * 멤버 선물 가게 — 별조각으로 선물 보내기.
 *
 * - 채팅 화면 헤더의 "선물" 버튼으로 열리는 오버레이 패널.
 * - 선물을 보내면 친밀도가 오르고 멤버의 감사 멘트가 토스트로 표시된다.
 * - 별조각은 출석·대화 보너스로만 모은다 (충전 결제 없음 — 결제는 앱 전용 정책).
 */
import { useCallback, useState } from "react";
import { AlertCircle, Gift, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { CharacterId } from "@/lib/chat/characters";
import { CURRENCY_EMOJI, CURRENCY_NAME, GIFTS } from "@/lib/gifts/catalog";
import { cn } from "@/lib/utils";

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

export function GiftShop({ characterId, characterName, compact = false }: GiftShopProps) {
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [sendingGiftId, setSendingGiftId] = useState<string | null>(null);
  const [topupNotice, setTopupNotice] = useState<string | null>(null);

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
    const message =
      missingCount != null && missingCount > 0
        ? `별조각 ${missingCount.toLocaleString()}개가 더 필요해요. 별조각은 출석 보상과 대화 보너스로 모을 수 있어요.`
        : "별조각은 출석 보상과 대화 보너스로 모을 수 있어요.";
    setTopupNotice(message);
    toast("별조각이 부족해요", { description: message });
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
                    const isBalanceLoading = balance == null;
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
                        disabled={!!sendingGiftId || isBalanceLoading}
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
                          {isBalanceLoading ? (
                            "확인"
                          ) : tooExpensive ? (
                            "안내"
                          ) : (
                            "보내기"
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 별조각은 출석·대화 보너스로만 모은다 (충전 결제 없음 — 앱 전용 정책) */}
              <section className="space-y-2 border-t border-neutral-200 pt-4">
                <h3 className="text-base font-bold text-neutral-950">
                  {CURRENCY_NAME} 모으는 법
                </h3>
                <p className="text-[13px] leading-relaxed text-neutral-600">
                  {CURRENCY_NAME}은 매일 출석 보상과 대화 보너스로 모을 수 있어요.
                  모은 {CURRENCY_NAME}으로 멤버에게 선물해 친밀도를 올려보세요.
                </p>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
