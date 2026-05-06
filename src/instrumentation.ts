/**
 * Next.js instrumentation hook.
 *
 * 서버 부팅 시 1회 실행된다. 시스템 환경변수에 빈 값이 들어있어
 * `.env.local` 의 실제 값을 가리는 Windows 환경 대응 차원에서
 * dotenv 를 강제 override 모드로 다시 로드한다.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { config } = await import("dotenv");
    // override:true → 시스템 env 보다 .env.local 을 우선시.
    config({ path: ".env.local", override: true });
  }
}
