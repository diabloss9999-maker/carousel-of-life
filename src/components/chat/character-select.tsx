"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { AffinityBar } from "@/components/affinity/affinity-bar";
import {
  CHARACTERS,
  CHARACTERS_BY_CATEGORY,
  type CharacterId,
  type CharacterCategory,
} from "@/lib/chat/characters";
import { cn } from "@/lib/utils";

interface CharacterSelectProps {
  affinities?: Record<string, number>;
}

const CATEGORY_ORDER: CharacterCategory[] = ["이세계", "동양"];

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

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground text-center">
        어떤 주술사와 대화할까?
      </p>

      {CATEGORY_ORDER.map((category) => {
        const ids = CHARACTERS_BY_CATEGORY[category];
        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">
                {category}
              </span>
              <div className="flex-1 h-px bg-border/40" />
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {ids.map((id) => {
                const char = CHARACTERS[id];
                const isLoading = isPending && selected === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelect(id)}
                    disabled={isPending}
                    className={cn(
                      "group relative flex flex-col items-center gap-2 rounded-2xl border p-2 sm:p-4 text-center transition-all",
                      "hover:border-primary/50 hover:bg-primary/5 hover:shadow-md",
                      "disabled:opacity-60 disabled:cursor-not-allowed",
                      selected === id
                        ? "border-primary/60 bg-primary/8 shadow-md"
                        : "border-border/40 bg-card/50 backdrop-blur",
                    )}
                  >
                    <div className="relative w-full rounded-xl shadow-sm overflow-hidden">
                      <Image
                        src={char.imageSrc}
                        alt={char.name}
                        width={600}
                        height={900}
                        quality={90}
                        className="w-full h-auto transition-transform group-hover:scale-105"
                        sizes="(max-width: 640px) 40vw, (max-width: 1024px) 22vw, 260px"
                      />
                      {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-white animate-spin" />
                        </div>
                      )}
                    </div>

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
                      <AffinityBar
                        characterId={id}
                        points={affinities[id] ?? 0}
                        compact
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
