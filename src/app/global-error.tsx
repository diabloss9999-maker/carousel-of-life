"use client";

/**
 * 루트 레이아웃 자체가 실패했을 때의 최후 보루.
 *
 * Next.js 가 `<html>` `<body>` 까지 직접 렌더하라고 요구합니다.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body
        style={{
          minHeight: "100vh",
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
            별의 흐름이 완전히 멈췄어요
          </h1>
          <p
            style={{
              fontSize: "0.9rem",
              opacity: 0.8,
              marginBottom: "1.5rem",
            }}
          >
            치명적인 오류가 발생했어요. 잠시 후 다시 시도해주세요.
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
              다시 시도
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
