"use client";

/**
 * 언어 선택 슬라이드 — KO / EN / JA.
 *
 * 헤더에 작게 박힘. 버튼을 누르면 언어 목록을 열고 직접 선택한다.
 */
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Languages } from "lucide-react";
import { useRouter } from "next/navigation";

import { setLocaleAction } from "@/i18n/actions";
import { LOCALES, LOCALE_LABEL, LOCALE_SHORT, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const locale = useLocale() as Locale;
  const t = useTranslations("header");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function chooseLocale(nextLocale: Locale) {
    if (isPending || nextLocale === locale) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      await setLocaleAction(nextLocale);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={isPending}
        aria-label={t("languageToggle")}
        aria-expanded={open}
        title={t("languageToggle")}
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

      <div
        className={cn(
          "absolute right-0 top-10 z-50 w-40 overflow-hidden rounded-2xl border p-1.5 shadow-xl backdrop-blur-xl transition-all duration-200",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0",
        )}
        style={{
          borderColor: "var(--ritual-line)",
          background: "rgba(18,18,28,0.78)",
        }}
      >
        <div className="flex flex-col gap-1">
          {LOCALES.map((item) => {
            const selected = item === locale;
            return (
              <button
                key={item}
                type="button"
                onClick={() => chooseLocale(item)}
                disabled={isPending}
                className={cn(
                  "flex h-9 items-center justify-between rounded-xl px-3 text-left text-[14px] transition",
                  selected
                    ? "bg-white/16 text-white"
                    : "text-white/72 hover:bg-white/10 hover:text-white",
                  "disabled:opacity-50",
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="w-7 text-[12px] font-semibold tracking-wider text-white/55">
                    {LOCALE_SHORT[item]}
                  </span>
                  <span>{LOCALE_LABEL[item]}</span>
                </span>
                {selected ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
