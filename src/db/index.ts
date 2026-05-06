/**
 * Drizzle ORM 인스턴스.
 *
 * - 서버 전용 모듈. 클라이언트 컴포넌트에서 import 하지 말 것.
 * - postgres-js 드라이버 + Drizzle 결합.
 */
import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { serverEnv } from "@/lib/env";
import * as schema from "@/db/schema";

const databaseUrl = serverEnv.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL 환경변수가 설정되지 않았습니다. .env.local 을 확인하세요.",
  );
}

/**
 * 서버 인스턴스에서 재사용 가능한 단일 postgres 클라이언트.
 *
 * - 개발 모드 핫리로드 시 연결이 누적되지 않도록 globalThis 에 캐싱한다.
 */
const globalForPg = globalThis as unknown as {
  pgClient: ReturnType<typeof postgres> | undefined;
};

const client =
  globalForPg.pgClient ??
  postgres(databaseUrl, {
    max: 1,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgClient = client;
}

export const db = drizzle(client, { schema });
export type Database = typeof db;
