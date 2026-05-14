"use server";

/**
 * 언어 변경 Server Action — 쿠키 저장 후 페이지 재검증.
 */
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { LOCALES, LOCALE_COOKIE, type Locale } from "@/i18n/config";

export async function setLocaleAction(locale: Locale): Promise<void> {
  if (!(LOCALES as readonly string[]).includes(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1년
    sameSite: "lax",
  });
  // 모든 라우트 재검증 — 언어가 전역 영향이라 layout 부터 새로 렌더.
  revalidatePath("/", "layout");
}
