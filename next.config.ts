import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // 모든 라우트가 추가됨. 라우트 타입 안전성 활성화.
  typedRoutes: true,

  images: {
    /** 기본 품질 90 — 캐릭터·카드 이미지 품질 확보 */
    qualities: [75, 90, 95],
    remotePatterns: [
      // Supabase Storage 에 업로드된 이미지(타로카드, 사용자 아바타 등) 허용.
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Rider-Waite 타로 이미지 (퍼블릭 도메인, 1909년판).
      {
        protocol: "https",
        hostname: "www.sacred-texts.com",
        pathname: "/tarot/pkt/img/**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
