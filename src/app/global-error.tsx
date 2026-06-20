"use client";

/**
 * 루트 레이아웃 자체가 실패했을 때의 최후 보루.
 *
 * Next.js 가 `<html>` `<body>` 까지 직접 렌더하라고 요구합니다.
 * NextIntlClientProvider 가 마운트되지 않은 상태일 수 있으므로
 * 쿠키에서 직접 locale 을 읽어 정적 메시지 맵을 사용합니다.
 */

import { useEffect } from "react";

const MESSAGES = {
  ko: {
    title: "별의 기운이 완전히 멈췄어요",
    body: "치명적인 오류가 발생했어요. 잠시 후 다시 시도해주세요.",
    retry: "다시 시도",
  },
  en: {
    title: "The flow of stars has stopped completely",
    body: "A fatal error occurred. Please try again in a moment.",
    retry: "Try again",
  },
} as const;

function detectLocale(): "ko" | "en" {
  if (typeof document === "undefined") return "ko";
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  return match?.[1] === "en" ? "en" : "ko";
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = detectLocale();
  const t = MESSAGES[locale];
  useEffect(() => {
    console.error("[GlobalError]", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);
  return (
    <html lang={locale}>
      <body
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0d0a14",
          color: "#ede8f5",
          fontFamily: "system-ui, sans-serif",
          padding: "2rem",
        }}
      >
        <div
          style={{ maxWidth: "32rem", textAlign: "center", lineHeight: 1.6 }}
        >
          <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
            {t.title}
          </h1>
          <p
            style={{
              fontSize: "0.9rem",
              opacity: 0.8,
              marginBottom: "1.5rem",
            }}
          >
            {t.body}
          </p>
          {error.digest ? (
            <code
              style={{
                display: "inline-block",
                padding: "0.25rem 0.5rem",
                backgroundColor: "#1f1a2e",
                borderRadius: "0.25rem",
                fontSize: "0.75rem",
                marginBottom: "1.5rem",
              }}
            >
              {error.digest}
            </code>
          ) : null}
          <div>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "0.5rem 1.5rem",
                backgroundColor: "#7c3aed",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              {t.retry}
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
