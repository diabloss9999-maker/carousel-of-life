"use client";

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

interface PushStatusResponse {
  ok: boolean;
  data?: {
    endpoints?: string[];
  };
}

interface ApiEnvelope {
  ok: boolean;
  error?: {
    message?: string;
  };
}

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
  const [testing, setTesting] = useState(false);

  const refresh = useCallback(async () => {
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
        reason: "이 브라우저는 푸시 알림을 지원하지 않아요. iOS는 홈 화면에 앱을 추가한 뒤 다시 시도해 주세요.",
      });
      return;
    }
    if (!("Notification" in window)) {
      setState({
        status: "unsupported",
        reason: "이 브라우저는 알림 권한을 지원하지 않아요.",
      });
      return;
    }

    if (Notification.permission === "denied") {
      setState({ status: "denied" });
      return;
    }

    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const statusRes = await fetch("/api/push/subscribe", {
        method: "GET",
        cache: "no-store",
      }).catch(() => null);
      const statusJson = statusRes?.ok
        ? ((await statusRes.json().catch(() => null)) as PushStatusResponse | null)
        : null;
      const serverEndpoints = statusJson?.ok
        ? (statusJson.data?.endpoints ?? [])
        : [];

      if (
        existing &&
        statusJson?.ok &&
        !serverEndpoints.includes(existing.endpoint)
      ) {
        await existing.unsubscribe().catch(() => undefined);
        setState({ status: "ready", subscribed: false, endpoint: null });
        return;
      }

      setState({
        status: "ready",
        subscribed: !!existing,
        endpoint: existing?.endpoint ?? null,
      });
    } catch (e) {
      console.error("[push-toggle] service worker failed", e);
      setState({
        status: "unsupported",
        reason: "알림 준비 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.",
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
      toast.error("알림 키가 아직 설정되지 않았어요.");
      return;
    }

    setPending(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error(
          permission === "denied"
            ? "알림 권한이 차단됐어요. 브라우저 설정에서 알림을 허용해 주세요."
            : "알림 권한을 받지 못했어요.",
        );
        await refresh();
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) await existing.unsubscribe().catch(() => undefined);

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
      const payload = (await res.json().catch(() => null)) as ApiEnvelope | null;

      if (!res.ok || payload?.ok === false) {
        await sub.unsubscribe().catch(() => undefined);
        throw new Error(payload?.error?.message ?? "서버 알림 등록에 실패했어요.");
      }

      toast.success("매일 알림을 받을 수 있어요.");
      await refresh();
    } catch (e) {
      console.error("[push-toggle] subscribe failed", e);
      const message =
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "알림 권한이 차단됐어요. 브라우저 설정에서 알림을 허용해 주세요."
          : e instanceof Error && e.message
            ? e.message
            : "알림 등록에 실패했어요. 잠시 후 다시 시도해 주세요.";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  async function sendTestNotification() {
    if (state.status !== "ready" || !state.endpoint || testing) return;
    setTesting(true);
    try {
      const res = await fetch("/api/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: state.endpoint }),
      });
      const payload = (await res.json().catch(() => null)) as ApiEnvelope | null;
      if (!res.ok || payload?.ok === false) {
        throw new Error(payload?.error?.message ?? "테스트 알림 발송에 실패했어요.");
      }
      toast.success("테스트 알림을 보냈어요.");
    } catch (e) {
      console.error("[push-toggle] test failed", e);
      toast.error(e instanceof Error ? e.message : "테스트 알림 발송에 실패했어요.");
    } finally {
      setTesting(false);
    }
  }

  async function unsubscribe() {
    if (state.status !== "ready") return;
    setPending(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      const endpoint = sub?.endpoint ?? state.endpoint;

      if (sub) await sub.unsubscribe().catch(() => undefined);
      if (endpoint) {
        const res = await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
        const payload = (await res.json().catch(() => null)) as ApiEnvelope | null;
        if (!res.ok || payload?.ok === false) {
          throw new Error("서버 알림 해제에 실패했어요.");
        }
      }

      toast.success("알림을 껐어요.");
      await refresh();
    } catch (e) {
      console.error("[push-toggle] unsubscribe failed", e);
      toast.error(e instanceof Error ? e.message : "알림 해제에 실패했어요.");
    } finally {
      setPending(false);
    }
  }

  if (state.status === "loading") {
    return (
      <p className="text-[15px] text-muted-foreground">
        알림 설정을 확인하는 중이에요.
      </p>
    );
  }

  if (state.status === "unsupported") {
    return (
      <div className="rounded-2xl border border-white/10 bg-muted/30 p-3">
        <p className="text-[14px] font-semibold">이 기기에서는 바로 켤 수 없어요</p>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          {state.reason}
        </p>
      </div>
    );
  }

  if (state.status === "denied") {
    return (
      <div className="rounded-2xl border border-amber-300/30 bg-amber-50/10 p-3">
        <p className="text-[14px] font-semibold text-amber-200">알림 권한이 차단돼 있어요</p>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          휴대폰 설정 또는 브라우저 사이트 설정에서 알림을 허용한 뒤 다시 열어 주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-muted/30 p-3">
        <p className="text-[14px] font-semibold">
          {state.subscribed ? "알림이 켜져 있어요" : "매일 필요한 순간만 알려드려요"}
        </p>
        <ul className="mt-2 space-y-1 text-[13px] leading-5 text-muted-foreground">
          <li>오늘 운세를 아직 안 봤을 때 가볍게 알려줘요.</li>
          <li>주간·월간 리포트처럼 놓치기 쉬운 흐름을 챙겨줘요.</li>
          <li>언제든 이 화면에서 다시 끌 수 있어요.</li>
        </ul>
      </div>
      {state.subscribed ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            size="sm"
            className="w-full"
            disabled={testing || pending}
            onClick={sendTestNotification}
          >
            <Bell className="mr-2 h-4 w-4" aria-hidden />
            {testing ? "보내는 중" : "테스트 알림"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            disabled={pending}
            onClick={unsubscribe}
          >
            <BellOff className="mr-2 h-4 w-4" aria-hidden />
            {pending ? "처리 중" : "알림 끄기"}
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          size="sm"
          className="w-full"
          disabled={pending}
          onClick={subscribe}
        >
          <Bell className="mr-2 h-4 w-4" aria-hidden />
          {pending ? "처리 중" : "알림 켜기"}
        </Button>
      )}
    </div>
  );
}
