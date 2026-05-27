"use client";

/**
 * 푸시 알림 토글 — /settings 카드.
 *
 * 흐름:
 *   1. mount → 브라우저 지원 여부, 현재 권한, 현재 구독 상태 조회
 *   2. ON 토글 → SW 등록 → Notification.requestPermission() → PushManager.subscribe(VAPID)
 *      → /api/push/subscribe POST
 *   3. OFF 토글 → PushManager 구독 해제 + /api/push/unsubscribe POST
 *
 * 제약:
 *   - iOS 16.4+ Safari 는 PWA(홈화면 추가) 상태에서만 지원
 *   - Notification.permission === "denied" 면 토글 비활성화 + 안내
 */
import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { clientEnv } from "@/lib/env";

type State =
  | { status: "loading" }
  | { status: "unsupported"; reason: string }
  | { status: "denied" }
  | { status: "ready"; subscribed: boolean; endpoint: string | null };

/** Base64URL → ArrayBuffer (VAPID 공개키 변환). PushManager.subscribe 가 BufferSource 요구. */
function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i += 1) {
    view[i] = rawData.charCodeAt(i);
  }
  return buffer;
}

export function PushToggle() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [pending, setPending] = useState(false);

  const refresh = useCallback(async () => {
    // 1. 브라우저 지원 체크
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) {
      setState({
        status: "unsupported",
        reason: "이 브라우저는 알림을 지원하지 않아요.",
      });
      return;
    }
    if (!("PushManager" in window)) {
      setState({
        status: "unsupported",
        reason: "이 브라우저는 푸시 알림을 지원하지 않아요. iOS 는 홈 화면에 앱을 추가한 뒤 다시 시도해 주세요.",
      });
      return;
    }
    if (!("Notification" in window)) {
      setState({
        status: "unsupported",
        reason: "이 브라우저는 알림을 지원하지 않아요.",
      });
      return;
    }

    if (Notification.permission === "denied") {
      setState({ status: "denied" });
      return;
    }

    // 2. SW 등록 (이미 있으면 재사용)
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const existing = await reg.pushManager.getSubscription();
      setState({
        status: "ready",
        subscribed: !!existing,
        endpoint: existing?.endpoint ?? null,
      });
    } catch (e) {
      console.error("[push-toggle] SW register failed", e);
      setState({
        status: "unsupported",
        reason: "서비스 워커 등록에 실패했어요.",
      });
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function subscribe() {
    if (state.status !== "ready") return;
    const publicKey = clientEnv.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      toast.error("VAPID 키가 설정되지 않았어요.");
      return;
    }

    setPending(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error(
          permission === "denied"
            ? "알림 권한이 차단됐어요. 브라우저 설정에서 허용해 주세요."
            : "알림 권한을 받지 못했어요.",
        );
        setPending(false);
        await refresh();
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToArrayBuffer(publicKey),
      });

      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });

      if (!res.ok) {
        await sub.unsubscribe().catch(() => undefined);
        throw new Error("서버 등록 실패");
      }

      toast.success("매일 알림을 받게 되었어요");
      await refresh();
    } catch (e) {
      console.error("[push-toggle] subscribe failed", e);
      toast.error("알림 등록에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  }

  async function unsubscribe() {
    if (state.status !== "ready") return;
    setPending(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      const endpoint = sub?.endpoint ?? state.endpoint;

      if (sub) {
        await sub.unsubscribe().catch(() => undefined);
      }
      if (endpoint) {
        const res = await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
        const payload: unknown = await res.json().catch(() => null);
        const apiOk =
          typeof payload === "object" && payload !== null && "ok" in payload
            ? (payload as { ok?: unknown }).ok
            : undefined;

        if (!res.ok || apiOk === false) {
          throw new Error("서버 해제 실패");
        }
      }
      toast.success("알림을 껐어요");
      await refresh();
    } catch (e) {
      console.error("[push-toggle] unsubscribe failed", e);
      toast.error("해제에 실패했어요.");
    } finally {
      setPending(false);
    }
  }

  if (state.status === "loading") {
    return (
      <p className="text-[15px] text-muted-foreground">
        알림 설정을 확인하는 중…
      </p>
    );
  }

  if (state.status === "unsupported") {
    return (
      <div className="rounded-2xl bg-muted/30 p-3">
        <p className="text-[15px] text-muted-foreground leading-relaxed">
          {state.reason}
        </p>
      </div>
    );
  }

  if (state.status === "denied") {
    return (
      <div className="rounded-2xl bg-muted/30 p-3">
        <p className="text-[15px] text-muted-foreground leading-relaxed">
          알림 권한이 차단되어 있어요. 주소창 옆 자물쇠 아이콘에서{" "}
          <span className="font-semibold text-foreground">알림 허용</span>으로
          바꾼 뒤 다시 시도해 주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-muted/30 p-3 text-[15px] text-muted-foreground leading-relaxed">
        매일 아침 별의 흐름과 오늘의 한 줄을 알림으로 받아볼 수 있어요. 언제든
        끌 수 있습니다.
      </div>
      {state.subscribed ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          disabled={pending}
          onClick={unsubscribe}
        >
          <BellOff className="mr-2 h-4 w-4" aria-hidden />
          {pending ? "처리 중…" : "알림 끄기"}
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          className="w-full"
          disabled={pending}
          onClick={subscribe}
        >
          <Bell className="mr-2 h-4 w-4" aria-hidden />
          {pending ? "처리 중…" : "알림 켜기"}
        </Button>
      )}
    </div>
  );
}
