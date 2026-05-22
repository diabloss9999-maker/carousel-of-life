/**
 * 환경변수 검증 및 타입-세이프 접근 모듈.
 *
 * - 서버에서만 접근 가능한 시크릿과 클라이언트에 노출되는
 *   `NEXT_PUBLIC_*` 변수를 분리해 다룬다.
 * - 빈 문자열은 undefined 로 정규화한다 (시스템 env 가 빈 값을 갖고 있어
 *   `.env.local` 을 override 하지 못하는 경우 대비).
 *
 * @remarks
 * `process.env` 는 직접 참조하지 말고 반드시 이 모듈을 통해 사용한다.
 */
import { z } from "zod";

/** 빈 문자열 → undefined 로 정규화하는 preprocess. */
const emptyToUndef = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => {
    if (typeof v !== "string") return v;
    return v.trim() === "" ? undefined : v;
  }, schema);

const serverSchema = z.object({
  DATABASE_URL: emptyToUndef(z.string().url().optional()),
  SUPABASE_SERVICE_ROLE_KEY: emptyToUndef(z.string().min(1).optional()),
  ANTHROPIC_API_KEY: emptyToUndef(z.string().min(1).optional()),
  LEMONSQUEEZY_API_KEY: emptyToUndef(z.string().min(1).optional()),
  LEMONSQUEEZY_STORE_ID: emptyToUndef(z.string().min(1).optional()),
  LEMONSQUEEZY_WEBHOOK_SECRET: emptyToUndef(z.string().min(1).optional()),
  LEMONSQUEEZY_SUBSCRIPTION_VARIANT_ID: emptyToUndef(
    z.string().min(1).optional(),
  ),
  LEMONSQUEEZY_PRO_VARIANT_ID: emptyToUndef(z.string().min(1).optional()),
  /** TossPayments — 한국 PG (직접 연동). */
  TOSS_SECRET_KEY: emptyToUndef(z.string().min(1).optional()),
  TOSS_WEBHOOK_SECRET: emptyToUndef(z.string().min(1).optional()),
  /** 라이트/프로 상품 가격 (KRW, 정기결제 청구 금액). */
  TOSS_LITE_PRICE_KRW: emptyToUndef(z.string().regex(/^\d+$/).optional()),
  TOSS_PRO_PRICE_KRW: emptyToUndef(z.string().regex(/^\d+$/).optional()),
  /** PortOne (포트원) — 한국 PG 통합 게이트웨이. 백엔드 PG 자동 라우팅. */
  PORTONE_API_SECRET: emptyToUndef(z.string().min(1).optional()),
  PORTONE_WEBHOOK_SECRET: emptyToUndef(z.string().min(1).optional()),
  PORTONE_LITE_PRICE_KRW: emptyToUndef(z.string().regex(/^\d+$/).optional()),
  PORTONE_PRO_PRICE_KRW: emptyToUndef(z.string().regex(/^\d+$/).optional()),
  /** Web Push (VAPID) — 푸시 알림 인증. mailto: 와 함께 사용. */
  VAPID_PRIVATE_KEY: emptyToUndef(z.string().min(1).optional()),
  VAPID_SUBJECT: emptyToUndef(z.string().min(1).optional()),
  KAKAO_CLIENT_ID: emptyToUndef(z.string().min(1).optional()),
  KAKAO_CLIENT_SECRET: emptyToUndef(z.string().min(1).optional()),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: emptyToUndef(z.string().url().optional()),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: emptyToUndef(z.string().min(1).optional()),
  NEXT_PUBLIC_APP_URL: emptyToUndef(
    z.string().url().default("http://localhost:3000"),
  ),
  NEXT_PUBLIC_APP_NAME: emptyToUndef(z.string().default("인생의 회전목마")),
  /** 토스 위젯용 클라이언트 키 (공개 OK). */
  NEXT_PUBLIC_TOSS_CLIENT_KEY: emptyToUndef(z.string().min(1).optional()),
  /** 포트원 V2 — 상점 ID (공개 OK). */
  NEXT_PUBLIC_PORTONE_STORE_ID: emptyToUndef(z.string().min(1).optional()),
  /** 포트원 V2 — 채널 키 (백엔드 PG 별로 다름, 공개 OK). */
  NEXT_PUBLIC_PORTONE_CHANNEL_KEY: emptyToUndef(z.string().min(1).optional()),
  /** VAPID 공개 키 — 브라우저 PushManager.subscribe 에 사용 (공개 OK). */
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: emptyToUndef(z.string().min(1).optional()),
});

const clientEnvRaw = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_TOSS_CLIENT_KEY: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY,
  NEXT_PUBLIC_PORTONE_STORE_ID: process.env.NEXT_PUBLIC_PORTONE_STORE_ID,
  NEXT_PUBLIC_PORTONE_CHANNEL_KEY: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
};

const parsedClient = clientSchema.safeParse(clientEnvRaw);
if (!parsedClient.success) {
  console.error(
    "❌ 잘못된 클라이언트 환경변수:",
    parsedClient.error.flatten().fieldErrors,
  );
  throw new Error("클라이언트 환경변수 검증 실패");
}

export const clientEnv = parsedClient.data;

/**
 * 서버 사이드 전용 환경변수.
 *
 * @throws 클라이언트 코드(브라우저)에서 호출하면 즉시 예외를 던진다.
 */
function getServerEnv() {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv 는 서버에서만 접근할 수 있습니다.");
  }
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(
      "❌ 잘못된 서버 환경변수:",
      parsed.error.flatten().fieldErrors,
    );
    throw new Error("서버 환경변수 검증 실패");
  }
  return parsed.data;
}

export const serverEnv = new Proxy(
  {} as ReturnType<typeof getServerEnv>,
  {
    get(_target, prop) {
      const env = getServerEnv();
      return env[prop as keyof typeof env];
    },
  },
);
