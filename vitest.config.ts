import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * 유닛 테스트 설정 — 순수 로직(알고리즘) 검증용.
 * DB/네트워크에 접근하는 서버 함수는 대상이 아니다(그건 E2E/수동 검증으로 커버).
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules", ".next", "e2e"],
  },
});
