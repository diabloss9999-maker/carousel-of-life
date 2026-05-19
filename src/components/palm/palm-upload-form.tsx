"use client";

/**
 * 손금 업로드 폼.
 *
 * - 카메라 직접 캡처 (`capture="environment"`) + 갤러리 업로드 둘 다 지원
 * - 클라이언트에서 1024×1024 JPEG 압축해 전송 (서버 부담 ↓)
 * - 동의 체크박스 필수
 * - 캐릭터 선택 (이세계 3인)
 */

import { useActionState, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2, Sparkles, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHARACTERS, type CharacterId } from "@/lib/chat/characters";
import { cn } from "@/lib/utils";
import {
  analyzePalmAction,
  type PalmActionState,
} from "@/app/(dashboard)/palm/actions";

const PALM_CHARS: CharacterId[] = ["witch", "sage", "child"];
const INITIAL_STATE: PalmActionState = { kind: "idle" };

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
  const [state, formAction, isPending] = useActionState(
    analyzePalmAction,
    INITIAL_STATE,
  );
  const [preview, setPreview] = useState<string | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [characterId, setCharacterId] = useState<CharacterId>("witch");
  const [consent, setConsent] = useState(false);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // 터치 디바이스(모바일) 감지 — 카메라 버튼 노출 여부.
  // (pointer: coarse) 는 터치 입력 우선이라는 의미라 폰·태블릿에서 true.
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(pointer: coarse)");
    setIsTouch(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  async function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일을 선택해줘.");
      return;
    }
    try {
      const blob = await compressImage(file);
      const compressed = new File([blob], "palm.jpg", { type: "image/jpeg" });
      setCompressedFile(compressed);
      setPreview(URL.createObjectURL(blob));
    } catch {
      setError("이미지 처리에 실패했어. 다시 시도해줘.");
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
            손금 풀이
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 캐릭터 선택 */}
          <div className="space-y-2">
            <label className="text-[15px] font-medium">풀이해줄 주술사</label>
            <div className="grid grid-cols-3 gap-2">
              {PALM_CHARS.map((id) => {
                const c = CHARACTERS[id];
                const active = characterId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCharacterId(id)}
                    className={cn(
                      "rounded-xl border p-3 text-center text-[15px] transition-all",
                      active
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border/40 bg-card/30 hover:bg-card/50",
                    )}
                    aria-pressed={active}
                  >
                    <span className="block font-mystic font-semibold">
                      {c.name}
                    </span>
                    <span className="block text-[15px] text-muted-foreground">
                      {c.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 이미지 업로드 */}
          <div className="space-y-2">
            <label className="text-[15px] font-medium">
              손바닥 사진
            </label>
            {preview ? (
              <div className="relative w-full max-w-xs mx-auto">
                <Image
                  src={preview}
                  alt="업로드한 손바닥 사진"
                  width={400}
                  height={400}
                  className="w-full h-auto rounded-2xl border border-border/40 shadow-lg"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  aria-label="사진 제거"
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
                    <span className="text-[15px] text-muted-foreground">카메라</span>
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
                    {isTouch ? "갤러리" : "사진 업로드"}
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
              밝은 곳에서 손바닥을 펴고 정면으로 촬영. 선이 잘 보일수록 정확해져.
            </p>
          </div>

          {/* 질문 (선택) */}
          <div className="space-y-2">
            <label htmlFor="palm-q" className="text-[15px] font-medium">
              궁금한 점 <span className="text-muted-foreground">(선택, 100자)</span>
            </label>
            <input
              id="palm-q"
              type="text"
              maxLength={100}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="예: 올해 연애운이 궁금해"
              className="w-full rounded-xl border border-border/40 bg-card/30 px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/40"
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
              사진은 분석 즉시 폐기되며 저장하지 않아. AI 풀이는 의학·심리 진단이
              아니라 재미용임에 동의해.
            </span>
          </label>

          {error && (
            <p className="text-[15px] text-destructive">{error}</p>
          )}

          <form action={formAction}>
            <input type="hidden" name="characterId" value={characterId} />
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
                  주술사가 손금을 읽는 중...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" aria-hidden />
                  손금 풀이 받기
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
              {CHARACTERS[state.characterId].name} 의 풀이
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mystic whitespace-pre-line leading-relaxed text-foreground/90">
              {state.interpretation}
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
