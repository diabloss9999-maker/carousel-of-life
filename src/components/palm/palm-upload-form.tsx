"use client";

/**
 * 손금 업로드 폼.
 *
 * - 카메라 직접 캡처 (`capture="environment"`) + 갤러리 업로드 둘 다 지원
 * - 클라이언트에서 1024×1024 JPEG 압축해 전송 (서버 부담 ↓)
 * - 동의 체크박스 필수
 */

import { useActionState, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Camera, Loader2, Sparkles, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { breakSentences } from "@/lib/utils";
import {
  analyzePalmAction,
  type PalmActionState,
} from "@/app/(dashboard)/palm/actions";

const INITIAL_STATE: PalmActionState = { kind: "idle" };
const COARSE_POINTER_QUERY = "(pointer: coarse)";

function subscribeToPointerChange(callback: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const mq = window.matchMedia(COARSE_POINTER_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getPointerSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(COARSE_POINTER_QUERY).matches;
}

function getServerPointerSnapshot(): boolean {
  return false;
}

/** 1024px 한도로 이미지 압축 — 모바일 5MB+ 사진을 200~400KB 로 줄임. */
async function compressImage(file: File): Promise<Blob> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new globalThis.Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = dataUrl;
  });

  const MAX = 1024;
  const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas context unavailable");
  ctx.drawImage(img, 0, 0, w, h);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("blob conversion failed"))),
      "image/jpeg",
      0.85,
    );
  });
}

export function PalmUploadForm() {
  const t = useTranslations("palmForm");
  const [state, formAction, isPending] = useActionState(
    analyzePalmAction,
    INITIAL_STATE,
  );
  const [preview, setPreview] = useState<string | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // 터치 디바이스(모바일) 감지 — 카메라 버튼 노출 여부.
  // (pointer: coarse) 는 터치 입력 우선이라는 의미라 폰·태블릿에서 true.
  const isTouch = useSyncExternalStore(
    subscribeToPointerChange,
    getPointerSnapshot,
    getServerPointerSnapshot,
  );

  async function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError(t("imageOnlyError"));
      return;
    }
    try {
      const blob = await compressImage(file);
      const compressed = new File([blob], "palm.jpg", { type: "image/jpeg" });
      setCompressedFile(compressed);
      setPreview(URL.createObjectURL(blob));
    } catch {
      setError(t("imageProcessError"));
    }
  }

  function clearImage() {
    setPreview(null);
    setCompressedFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="space-y-6">
      <Card className="app-surface">
        <CardHeader>
          <CardTitle className="font-mystic flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-accent" aria-hidden />
            {t("cardTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 이미지 업로드 */}
          <div className="space-y-2">
            <label className="text-[15px] font-medium">
              {t("photoLabel")}
            </label>
            {preview ? (
              <div className="relative w-full max-w-xs mx-auto">
                <Image
                  src={preview}
                  alt={t("photoAlt")}
                  width={400}
                  height={400}
                  className="w-full h-auto rounded-2xl border border-border/40 shadow-lg"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  aria-label={t("removePhoto")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className={isTouch ? "grid grid-cols-2 gap-2" : "grid grid-cols-1 gap-2"}>
                {/* 카메라 — 터치 디바이스(폰·태블릿)에서만. 데스크탑은 갤러리만. */}
                {isTouch && (
                  <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/50 p-6 cursor-pointer hover:bg-card/30 transition-colors">
                    <Camera className="h-6 w-6 text-muted-foreground" aria-hidden />
                    <span className="text-[15px] text-muted-foreground">{t("camera")}</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f);
                      }}
                    />
                  </label>
                )}
                <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/50 p-6 cursor-pointer hover:bg-card/30 transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground" aria-hidden />
                  <span className="text-[15px] text-muted-foreground">
                    {isTouch ? t("gallery") : t("uploadPhoto")}
                  </span>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                </label>
              </div>
            )}
            <p className="text-[15px] text-muted-foreground">
              {t("photoHelp")}
            </p>
          </div>

          {/* 질문 (선택) */}
          <div className="space-y-2">
            <label htmlFor="palm-q" className="text-[15px] font-medium">
              {t("questionLabel")} <span className="text-muted-foreground">{t("questionOptional")}</span>
            </label>
            <input
              id="palm-q"
              type="text"
              maxLength={100}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t("questionPlaceholder")}
              className="w-full rounded-xl app-surface px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* 동의 + 면책 */}
          <label className="flex items-start gap-2 text-[15px] text-muted-foreground">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            <span>
              {t("consent")}
            </span>
          </label>

          {error && (
            <p className="text-[15px] text-destructive">{error}</p>
          )}

          <form action={formAction}>
            <input type="hidden" name="consent" value={consent ? "true" : "false"} />
            <input type="hidden" name="question" value={question} />
            <input
              type="file"
              name="image"
              accept="image/*"
              className="hidden"
              ref={(el) => {
                if (el && compressedFile) {
                  // DataTransfer 로 File 을 hidden input 에 주입
                  const dt = new DataTransfer();
                  dt.items.add(compressedFile);
                  el.files = dt.files;
                }
              }}
            />
            <Button
              type="submit"
              size="lg"
              disabled={!compressedFile || !consent || isPending}
              className="w-full"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {t("loading")}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" aria-hidden />
                  {t("submit")}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 결과 */}
      {state.kind === "result" && (
        <Card className="app-surface" data-capture-root>
          <CardHeader>
            <CardTitle className="font-mystic text-lg">
              {t("resultTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mystic whitespace-pre-line leading-relaxed text-foreground/90">
              {breakSentences(state.interpretation)}
            </p>
          </CardContent>
        </Card>
      )}

      {state.kind === "error" && (
        <p className="text-center text-[15px] text-destructive">
          {state.message}
        </p>
      )}
    </div>
  );
}
