"use client";

/**
 * 주술사 캐릭터 선택 UI.
 * 선택 후 해당 캐릭터로 새 채팅 세션 생성.
 */

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { CHARACTERS, type CharacterId } from "@/lib/chat/characters";
import { cn } from "@/lib/utils";

export function CharacterSelect() {
  const router = useRouter();
  const [selected, setSelected] = useState<CharacterId | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSelect(id: CharacterId) {
    setSelected(id);
    startTransition(async () => {
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character: id }),
      });
      const json = await res.json();
      if (json.ok) {
        router.push(`/chat/${json.data.sessionId}`);
      }
    });
  }

  const list = Object.values(CHARACTERS);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        어떤 주술사와 대화할까?
      </p>
      <div className="grid grid-cols-3 gap-4">
        {list.map((char) => {
          const isLoading = isPending && selected === char.id;
          return (
            <button
              key={char.id}
              type="button"
              onClick={() => handleSelect(char.id)}
              disabled={isPending}
              className={cn(
                "group relative flex flex-col items-center gap-3 rounded-2xl border p-4 text-center transition-all",
                "hover:border-primary/50 hover:bg-primary/5 hover:shadow-md",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                selected === char.id
                  ? "border-primary/60 bg-primary/8 shadow-md"
                  : "border-border/40 bg-card/50 backdrop-blur",
              )}
            >
              {/* 캐릭터 이미지 — 원본 비율 전체 표시 */}
              <div className="relative w-full rounded-xl shadow-sm overflow-hidden">
                <Image
                  src={char.imageSrc}
                  alt={char.name}
                  width={1024}
                  height={1536}
                  className="w-full h-auto transition-transform group-hover:scale-105"
                  sizes="(max-width: 640px) 33vw, 200px"
                />
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                )}
              </div>

              {/* 이름·직함 */}
              <div className="space-y-0.5">
                <p className="font-mystic font-semibold text-sm leading-tight">
                  {char.name}
                </p>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {char.title}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
