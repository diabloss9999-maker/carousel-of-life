/**
 * 인메모리 sliding-window 레이트 리미터.
 *
 * Vercel serverless 함수는 인스턴스가 워밍업 상태일 동안 모듈 스코프를 유지하므로
 * Map 이 짧게나마 살아남는다. 콜드 스타트 시 카운터 리셋되는 건 의도된 trade-off
 * (외부 Redis 도입 회피). 단일 공격자의 burst 차단이 주 목적.
 *
 * 분산 환경에서 완벽한 보장은 안 되지만 비용 폭탄·기본 abuse 는 충분히 막는다.
 * 후에 트래픽이 커지면 Upstash Redis 로 교체.
 */
import "server-only";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Map 무한 증가 방지 — 만료된 키 정리. 호출당 amortized O(1). */
function gcExpired(now: number): void {
  // 100 호출에 한 번 정도만 청소.
  if (Math.random() > 0.01) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  /** 통과 여부. */
  ok: boolean;
  /** 거부 시 클라이언트가 다시 시도할 때까지 대기할 초 (Retry-After 헤더용). */
  retryAfterSec?: number;
  /** 남은 사용 가능 횟수. */
  remaining?: number;
}

/**
 * AI 생성 호출 종류별 분당 한도. 서버 액션에서 enforceAiRateLimit 으로 검사.
 *
 * - 채팅은 별도(20/분, 라우트 단에서) — 여기엔 안 들어감.
 * - 운세/사주/타로/궁합/성격 분석 등 한 번에 큰 토큰 쓰는 호출들은 더 빡빡하게.
 */
const AI_RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  fortune:     { max: 8,  windowMs: 60_000 },
  saju:        { max: 5,  windowMs: 60_000 },
  personality: { max: 5,  windowMs: 60_000 },
  compatibility: { max: 8, windowMs: 60_000 },
  tarot:       { max: 10, windowMs: 60_000 },
};

export class RateLimitedError extends Error {
  constructor(public retryAfterSec: number) {
    super(`Rate limited. Retry in ${retryAfterSec}s.`);
    this.name = "RateLimitedError";
  }
}

/**
 * AI 생성 server action 진입부에서 호출. 초과 시 RateLimitedError 던짐.
 * action 은 이를 잡아 사용자에게 "잠시 후 다시 시도" 메시지 반환.
 */
export function enforceAiRateLimit(
  userId: string,
  kind: keyof typeof AI_RATE_LIMITS,
): void {
  const cfg = AI_RATE_LIMITS[kind];
  if (!cfg) return;
  const result = checkRateLimit(`ai:${kind}:${userId}`, cfg.max, cfg.windowMs);
  if (!result.ok) {
    throw new RateLimitedError(result.retryAfterSec ?? 60);
  }
}

/**
 * 키별로 windowMs 동안 max 회까지 허용.
 *
 * @param key      식별자 (예: `chat:${userId}`)
 * @param max      window 당 최대 호출
 * @param windowMs window 길이 (밀리초)
 */
export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  gcExpired(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1 };
  }
  if (bucket.count >= max) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  bucket.count++;
  return { ok: true, remaining: max - bucket.count };
}
