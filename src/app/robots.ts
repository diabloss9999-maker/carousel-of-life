/**
 * robots.txt 동적 생성.
 *
 * 공개 페이지는 모두 허용, 인증·API·웹훅 라우트는 차단한다.
 */
import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.url.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/today",
          "/chat",
          "/tarot",
          "/saju",
          "/compatibility",
          "/history",
          "/settings",
          "/onboarding",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
