"use client";

/**
 * 언어 전환 토글 — KO ↔ EN.
 *
 * 헤더에 작게 박힘. 클릭 한 번으로 다른 언어로 즉시 전환.
 */
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Languages } from "lucide-react";

import { setLocaleAction } from "@/i18n/actions";
import { LOCALE_SHORT, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const locale = useLocale() as Locale;
  const t = useTranslations("header");
  const [isPending, startTransition] = useTransition();

  const nextLocale: Locale = locale === "ko" ? "en" : "ko";

  function handleClick() {
    if (isPending) return;
    startTransition(async () => {
      await setLocaleAction(nextLocale);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={t("languageToggle")}
      title={`${t("languageToggle")} → ${LOCALE_SHORT[nextLocale]}`}
      className={cn(
        "inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[15px] font-semibold transition-opacity",
        "disabled:opacity-50",
      )}
      style={{
        border: "1px solid var(--ritual-line)",
        color: "var(--ritual-muted)",
        background: "rgba(255,255,255,0.10)",
      }}
    >
      <Languages className="h-3 w-3" aria-hidden />
      <span className="tracking-wider">{LOCALE_SHORT[locale]}</span>
    </button>
  );
}
