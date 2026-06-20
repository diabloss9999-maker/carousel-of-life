import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactHooks from "eslint-plugin-react-hooks";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".vercel/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // 외부 도메인 이미지를 <img>로 직접 렌더링하기 위해 규칙 비활성화.
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "@next/next/no-img-element": "off",
      // React 19 strict 룰들 — 외부 시스템 동기화(스크롤·focus·position 추적·
      // matchMedia 등) 의 정당한 useEffect 패턴이 다수라 warn 으로 완화.
      // 핵심 hash 동기화는 useSyncExternalStore 로 이미 리팩토링됨.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
    },
  },
]);

export default eslintConfig;
