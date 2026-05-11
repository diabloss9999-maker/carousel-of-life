"use client";

/**
 * 주술사 캐릭터 선택 UI.
 * 선택 후 해당 캐릭터로 새 채팅 세션 생성.
 */

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { AffinityBar } from "@/components/affinity/affinity-bar";
import { CHARACTERS, type CharacterId } from "@/lib/chat/characters";
import { cn } from "@/lib/utils";

interface CharacterSelectProps {
  affinities?: Record<string, number>; // characterId → points
}

export function CharacterSelect({ affinities = {} }: CharacterSelectProps) {
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
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {list.map((char) => {
          const isLoading = isPending && selected === char.id;
          return (
            <button
              key={char.id}
              type="button"
              onClick={() => handleSelect(char.id)}
              disabled={isPending}
              className={cn(
                "group relative flex flex-col items-center gap-2 rounded-2xl border p-2 sm:p-4 text-center transition-all",
                "hover:border-primary/50 hover:bg-primary/5 hover:shadow-md",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                selected === char.id
                  ? "border-primary/60 bg-primary/8 shadow-md"
                  : "border-border/40 bg-card/50 backdrop-blur",
              )}
            >
              {/* 캐릭터 이미지 */}
              <div className="relative w-full rounded-xl shadow-sm overflow-hidden">
                <Image
                  src={char.imageSrc}
                  alt={char.name}
                  width={1024}
                  height={1536}
                  className="w-full h-auto transition-transform group-hover:scale-105"
                  sizes="(max-width: 640px) 30vw, 200px"
                />
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-white animate-spin" />
                  </div>
                )}
              </div>

              {/* 이름·직함·설명 */}
              <div className="space-y-1.5 w-full">
                <p className="font-mystic font-semibold text-xs sm:text-sm leading-tight">
                  {char.name}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                  {char.title}
                </p>
                <p className="hidden sm:block text-[10px] text-muted-foreground/70 leading-tight line-clamp-2">
                  {char.description}
                </p>
                {/* 친밀도 바 */}
                <AffinityBar
                  characterId={char.id}
                  points={affinities[char.id] ?? 0}
                  compact
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
