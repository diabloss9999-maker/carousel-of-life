/**
 * 공유 이미지 임시 업로드 API.
 *
 * POST /api/share/upload-image
 *   - multipart/form-data 로 PNG/JPEG/WebP 파일 1개
 *   - 또는 application/json: { dataUrl: "data:image/png;base64,..." }
 *
 * 응답: { url: string }
 *
 * 흐름:
 *   1. 인증 확인
 *   2. 크기·타입 검증
 *   3. share-images bucket 의 {userId}/ 폴더에 업로드
 *   4. public URL 반환
 *
 * 정리: /api/cron/cleanup-share-images 가 매일 24h 이전 파일 자동 삭제.
 */
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

import { requireUser } from "@/lib/auth/get-user";
import { checkRateLimit } from "@/lib/rate-limit/in-memory";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { API_ERROR_CODES } from "@/types/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const BUCKET = "share-images";
const UPLOAD_RATE_LIMIT_MAX = 20;
const UPLOAD_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function makeFileName(userId: string, ext: string): string {
  const rand = randomBytes(8).toString("hex");
  return `${userId}/${Date.now()}-${rand}.${ext}`;
}

function extOf(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  return "png";
}

export async function POST(request: Request) {
  const user = await requireUser();
  const rateLimit = checkRateLimit(
    `share-upload-image:${user.id}`,
    UPLOAD_RATE_LIMIT_MAX,
    UPLOAD_RATE_LIMIT_WINDOW_MS,
  );
  if (!rateLimit.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: API_ERROR_CODES.RATE_LIMITED,
          message: "이미지 업로드가 너무 잦아요. 잠시 후 다시 시도해 주세요.",
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSec ?? 60),
        },
      },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";

  let blob: Blob | null = null;
  let mime = "image/png";

  try {
    if (contentType.startsWith("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (file instanceof File) {
        blob = file;
        mime = file.type || "image/png";
      }
    } else if (contentType.startsWith("application/json")) {
      const body = (await request.json()) as { dataUrl?: string };
      const dataUrl = body.dataUrl;
      if (typeof dataUrl === "string" && dataUrl.startsWith("data:")) {
        const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mime = match[1];
          const buf = Buffer.from(match[2], "base64");
          blob = new Blob([buf], { type: mime });
        }
      }
    }
  } catch {
    /* 아래에서 blob 없음으로 처리 */
  }

  if (!blob) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: API_ERROR_CODES.VALIDATION_FAILED,
          message: "이미지를 찾지 못했어요.",
        },
      },
      { status: 400 },
    );
  }
  if (!ALLOWED_TYPES.has(mime)) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: API_ERROR_CODES.VALIDATION_FAILED,
          message: "지원하지 않는 이미지 형식이에요.",
        },
      },
      { status: 400 },
    );
  }
  if (blob.size > MAX_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: API_ERROR_CODES.VALIDATION_FAILED,
          message: "이미지가 너무 커요 (최대 5MB).",
        },
      },
      { status: 413 },
    );
  }

  const fileName = makeFileName(user.id, extOf(mime));
  const admin = getSupabaseAdmin();

  try {
    const arrayBuf = await blob.arrayBuffer();
    const { error } = await admin.storage
      .from(BUCKET)
      .upload(fileName, Buffer.from(arrayBuf), {
        contentType: mime,
        upsert: false,
        cacheControl: "public, max-age=86400",
      });
    if (error) {
      console.error("[upload-image] supabase upload failed", error);
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: API_ERROR_CODES.INTERNAL_ERROR,
            message: "이미지 업로드에 실패했어요.",
          },
        },
        { status: 500 },
      );
    }
  } catch (e) {
    console.error("[upload-image] threw", e);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: API_ERROR_CODES.INTERNAL_ERROR,
          message: "이미지 처리 중 오류가 발생했어요.",
        },
      },
      { status: 500 },
    );
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(fileName);
  return NextResponse.json({
    ok: true,
    data: { url: data.publicUrl, path: fileName },
  });
}
