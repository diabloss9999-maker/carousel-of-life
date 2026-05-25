/**
 * share-images 정리 cron — 24시간 이전 파일 자동 삭제.
 *
 * Vercel Cron 매일 04:00 KST (UTC 19:00 전날):
 *   { "path": "/api/cron/cleanup-share-images", "schedule": "0 19 * * *" }
 *
 * 흐름:
 *   1. share-images 버킷에서 24h 이상 된 파일 목록 조회
 *   2. service_role 로 일괄 삭제
 *
 * 안전:
 *   - service_role 만 storage objects 전체 SELECT/DELETE 가능
 *   - 카카오톡 메시지에 노출된 이미지는 카카오 측에서 자체 캐시하므로
 *     24h 후 원본 삭제해도 친구가 받은 메시지엔 영향 없음
 */
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "share-images";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 1000;

function isAuthorizedCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

interface StorageObject {
  name: string;
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const cutoff = Date.now() - MAX_AGE_MS;

  // 사용자별 폴더 순회 (level-1 디렉토리 = userId)
  const { data: rootList, error: rootErr } = await admin.storage
    .from(BUCKET)
    .list("", { limit: BATCH_SIZE });

  if (rootErr) {
    console.error("[cleanup-share-images] root list failed", rootErr);
    return NextResponse.json(
      { ok: false, error: rootErr.message },
      { status: 500 },
    );
  }

  let totalDeleted = 0;
  const errors: string[] = [];

  for (const folder of rootList ?? []) {
    // 폴더(=하위에 파일 가짐) 만 처리. 파일이면 createdAt 기준 직접 비교.
    const path = folder.name;
    if (!path) continue;

    const { data: files, error: listErr } = await admin.storage
      .from(BUCKET)
      .list(path, { limit: BATCH_SIZE });
    if (listErr) {
      errors.push(`list ${path}: ${listErr.message}`);
      continue;
    }
    if (!files || files.length === 0) continue;

    const expired: string[] = [];
    for (const f of files as StorageObject[]) {
      const created = f.created_at ? new Date(f.created_at).getTime() : 0;
      if (created && created < cutoff) {
        expired.push(`${path}/${f.name}`);
      }
    }

    if (expired.length > 0) {
      const { error: removeErr } = await admin.storage
        .from(BUCKET)
        .remove(expired);
      if (removeErr) {
        errors.push(`remove ${path}: ${removeErr.message}`);
      } else {
        totalDeleted += expired.length;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    deleted: totalDeleted,
    errors: errors.length ? errors : undefined,
  });
}
