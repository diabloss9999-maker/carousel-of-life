/**
 * next-intl 요청별 메시지 로더.
 *
 * 쿠키 NEXT_LOCALE 을 읽어 ko/en 메시지를 불러온다.
 */
import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  type Locale,
} from "@/i18n/config";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;

  const messages = (await import(`./messages/${locale}.json`)).default;

  return { locale, messages };
});
