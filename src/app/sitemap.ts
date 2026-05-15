/**
 * 동적 sitemap.xml 생성.
 *
 * 공개 페이지(랜딩·인증·가격·법적 페이지)만 포함한다. 대시보드 등
 * 인증이 필요한 라우트는 로봇 색인에서 제외한다.
 */
import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/$/, "");
  const now = new Date();

  return [
    { url: `${base}/`,         lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/login`,    lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/signup`,   lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/pricing`,  lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/terms`,    lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${base}/privacy`,  lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${base}/refund`,   lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${base}/business`, lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];
}
