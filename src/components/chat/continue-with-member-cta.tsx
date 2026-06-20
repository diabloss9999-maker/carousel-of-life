"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, Loader2, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { CharacterImage } from "@/components/shared/character-image";
import { Button } from "@/components/ui/button";
import { CHARACTERS, type CharacterId } from "@/lib/chat/characters";
import { cn } from "@/lib/utils";

interface ContinueWithMemberCtaProps {
  sourceLabel: string;
  prompt: string;
  contextTitle?: string;
  contextSummary?: string;
  className?: string;
}

interface CreateSessionResponse {
  ok: boolean;
  data?: { sessionId: string };
}

const MEMBER_IDS = Object.keys(CHARACTERS) as CharacterId[];

export function ContinueWithMemberCta({
  sourceLabel,
  prompt,
  contextTitle,
  contextSummary,
  className,
}: ContinueWithMemberCtaProps) {
  const router = useRouter();
  const tChar = useTranslations("characters");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<CharacterId | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSelect(characterId: CharacterId) {
    setError(false);
    setSelected(characterId);
    startTransition(async () => {
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character: characterId }),
      });
      const json = (await res.json().catch(() => null)) as CreateSessionResponse | null;
      if (!json?.ok || !json.data) {
        setError(true);
        return;
      }

      const params = new URLSearchParams({ prefill: prompt.slice(0, 100) });
      params.set("source", sourceLabel.slice(0, 24));
      if (contextTitle) params.set("ctxTitle", contextTitle.slice(0, 48));
      if (contextSummary) params.set("ctxSummary", contextSummary.slice(0, 120));

      router.push(`/chat/${json.data.sessionId}?${params.toString()}`);
    });
  }

  return (
    <div
      data-reading-chat-cta
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-4",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-[13px] font-semibold text-primary/80">
            멤버에게 이어서 물어보기
          </p>
          <p className="text-[14px] leading-relaxed text-muted-foreground">
            방금 본 {sourceLabel} 내용을 선택한 멤버 대화창으로 그대로 이어갈게요.
          </p>
          {error ? (
            <p className="text-[13px] text-destructive">
              대화방을 여는 데 실패했어요. 잠시 후 다시 시도해 주세요.
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0"
          onClick={() => setOpen((v) => !v)}
          disabled={isPending}
          data-reading-chat-toggle
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <MessageCircle className="h-3.5 w-3.5" aria-hidden />
          )}
          멤버 선택
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition", open && "rotate-180")}
            aria-hidden
          />
        </Button>
      </div>

      {open ? (
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {MEMBER_IDS.map((id) => {
            const character = CHARACTERS[id];
            const name = tChar(`${id}.name`);
            const loading = isPending && selected === id;
            return (
              <button
                key={id}
                type="button"
                disabled={isPending}
                onClick={() => handleSelect(id)}
                data-reading-chat-member={id}
                className="group rounded-2xl border border-white/10 bg-white/[0.045] p-2 text-center transition hover:border-primary/35 hover:bg-white/[0.09] disabled:cursor-wait disabled:opacity-70"
              >
                <span className="relative mx-auto block aspect-[3/4] w-full overflow-hidden rounded-xl bg-white/10">
                  <CharacterImage
                    character={character}
                    fill
                    className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.04]"
                    sizes="120px"
                  />
                  {loading ? (
                    <span className="absolute inset-0 grid place-items-center bg-black/35">
                      <Loader2 className="h-5 w-5 animate-spin text-white" aria-hidden />
                    </span>
                  ) : null}
                </span>
                <span className="mt-2 block truncate text-[12px] font-semibold">
                  {name}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
