"use client";

/**
 * 카카오 Share SDK 통합.
 *
 * 사용 흐름:
 *   1. KakaoSdkScript 컴포넌트가 페이지에 한 번 로드 (next/script)
 *   2. 사용자가 공유 클릭 시 ensureKakaoInit() 호출 — 초기화 보장
 *   3. shareToKakao({ ... }) 호출 → 카카오톡 공유 창
 *
 * NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY 환경변수가 비어있으면 초기화 실패 → 호출자가
 * Web Share API 폴백으로 자연 전환.
 */
import { clientEnv } from "@/lib/env";

interface KakaoStatic {
  isInitialized(): boolean;
  init(key: string): void;
  Share: {
    sendDefault(opts: KakaoFeedTemplate): void;
  };
}

interface KakaoFeedTemplate {
  objectType: "feed";
  content: {
    title: string;
    description?: string;
    imageUrl: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  };
  buttons?: Array<{
    title: string;
    link: { mobileWebUrl: string; webUrl: string };
  }>;
  installTalk?: boolean;
}

declare global {
  interface Window {
    Kakao?: KakaoStatic;
  }
}

/** SDK 가 로드됐는지. (KakaoSdkScript 컴포넌트가 head 에 로드해야 함) */
export function isKakaoLoaded(): boolean {
  return typeof window !== "undefined" && !!window.Kakao;
}

/** Kakao SDK 초기화. 키 없으면 false. */
export function ensureKakaoInit(): boolean {
  if (!isKakaoLoaded()) return false;
  const key = clientEnv.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
  if (!key) return false;
  const k = window.Kakao!;
  if (!k.isInitialized()) {
    k.init(key);
  }
  return k.isInitialized();
}

/**
 * 카카오톡 공유 (Feed 템플릿).
 *
 * imageUrl 은 https 의 공개 URL 이어야 함. 카카오 측에서 이미지 검수 후 표시.
 */
export function shareToKakao(opts: {
  title: string;
  description?: string;
  imageUrl: string;
  url: string;
}): boolean {
  if (!ensureKakaoInit()) return false;
  const k = window.Kakao!;
  try {
    k.Share.sendDefault({
      objectType: "feed",
      content: {
        title: opts.title,
        description: opts.description,
        imageUrl: opts.imageUrl,
        link: {
          mobileWebUrl: opts.url,
          webUrl: opts.url,
        },
      },
      buttons: [
        {
          title: "나도 받아보기",
          link: { mobileWebUrl: opts.url, webUrl: opts.url },
        },
      ],
    });
    return true;
  } catch (e) {
    console.error("[kakao-share]", e);
    return false;
  }
}
