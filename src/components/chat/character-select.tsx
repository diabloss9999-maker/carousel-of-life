"use client";

import { CharacterImage } from "@/components/shared/character-image";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { AffinityBar } from "@/components/affinity/affinity-bar";
import {
  CHARACTERS,
  CHARACTERS_BY_CATEGORY,
  type CharacterId,
  type CharacterCategory,
} from "@/lib/chat/characters";
import {
  VACATION_POSTCARD_BY_CHARACTER,
  type CharacterVacationRoster,
} from "@/lib/chat/character-vacation";
import { SPECIALTY_KEY } from "@/i18n/character-display";
import { cn } from "@/lib/utils";

interface CharacterSelectProps {
  affinities?: Record<string, number>;
  vacationRoster: CharacterVacationRoster;
}

const CATEGORY_ORDER: CharacterCategory[] = ["이세계", "동양", "북유럽"];

/** 카테고리별 디자인 — 라벨은 i18n 에서, 색상은 여기서. */
const CATEGORY_DECO: Record<CharacterCategory, {
  labelKey: "Otherworld" | "Eastern" | "Nordic";
  border: string;
  text: string;
  dot: string;
}> = {
  이세계: {
    labelKey: "Otherworld",
    border: "border-violet-500/30",
    text: "text-violet-400",
    dot: "bg-violet-500",
  },
  동양: {
    labelKey: "Eastern",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    dot: "bg-emerald-500",
  },
  북유럽: {
    labelKey: "Nordic",
    border: "border-sky-500/30",
    text: "text-sky-300",
    dot: "bg-sky-400",
  },
};

/** 캐릭터별 호버 강조 색 */
const CHAR_ACCENT: Record<CharacterId, string> = {
  child:      "hover:ring-red-700/50 hover:border-red-800/50",
  witch:      "hover:ring-blue-700/50 hover:border-blue-800/50",
  sage:       "hover:ring-amber-600/50 hover:border-amber-700/50",
  shaman:     "hover:ring-rose-700/50 hover:border-rose-800/50",
  taoist:     "hover:ring-cyan-700/50 hover:border-cyan-800/50",
  dokkaebi:   "hover:ring-purple-700/50 hover:border-purple-800/50",
  hunter:     "hover:ring-stone-600/50 hover:border-stone-700/50",
  runeshaman: "hover:ring-indigo-600/50 hover:border-indigo-700/50",
  god:        "hover:ring-sky-500/50 hover:border-sky-600/50",
};

const CHAR_SELECTED: Record<CharacterId, string> = {
  child:      "ring-red-700/60 border-red-800/60 bg-red-950/20",
  witch:      "ring-blue-700/60 border-blue-800/60 bg-blue-950/20",
  sage:       "ring-amber-600/60 border-amber-700/60 bg-amber-950/15",
  shaman:     "ring-rose-700/60 border-rose-800/60 bg-rose-950/20",
  taoist:     "ring-cyan-700/60 border-cyan-800/60 bg-cyan-950/20",
  dokkaebi:   "ring-purple-700/60 border-purple-800/60 bg-purple-950/20",
  hunter:     "ring-stone-600/60 border-stone-700/60 bg-stone-950/20",
  runeshaman: "ring-indigo-600/60 border-indigo-700/60 bg-indigo-950/20",
  god:        "ring-sky-500/60 border-sky-600/60 bg-sky-950/20",
};

type VacationReasonKey =
  | "vacationReasonPools.otherworld.rift"
  | "vacationReasonPools.otherworld.contract"
  | "vacationReasonPools.otherworld.memory"
  | "vacationReasonPools.otherworld.court"
  | "vacationReasonPools.otherworld.cloud"
  | "vacationReasonPools.eastern.shrine"
  | "vacationReasonPools.eastern.spirit"
  | "vacationReasonPools.eastern.dokkaebi"
  | "vacationReasonPools.eastern.talisman"
  | "vacationReasonPools.eastern.bamboo"
  | "vacationReasonPools.nordic.rune"
  | "vacationReasonPools.nordic.trail"
  | "vacationReasonPools.nordic.hearth"
  | "vacationReasonPools.nordic.worldTree"
  | "vacationReasonPools.nordic.starSea";

const OTHERWORLD_VACATION_REASONS = [
  "vacationReasonPools.otherworld.rift",
  "vacationReasonPools.otherworld.contract",
  "vacationReasonPools.otherworld.memory",
  "vacationReasonPools.otherworld.court",
  "vacationReasonPools.otherworld.cloud",
] as const satisfies readonly VacationReasonKey[];

const EASTERN_VACATION_REASONS = [
  "vacationReasonPools.eastern.shrine",
  "vacationReasonPools.eastern.spirit",
  "vacationReasonPools.eastern.dokkaebi",
  "vacationReasonPools.eastern.talisman",
  "vacationReasonPools.eastern.bamboo",
] as const satisfies readonly VacationReasonKey[];

const NORDIC_VACATION_REASONS = [
  "vacationReasonPools.nordic.rune",
  "vacationReasonPools.nordic.trail",
  "vacationReasonPools.nordic.hearth",
  "vacationReasonPools.nordic.worldTree",
  "vacationReasonPools.nordic.starSea",
] as const satisfies readonly VacationReasonKey[];

const VACATION_REASON_KEYS_BY_CHARACTER: Record<CharacterId, readonly VacationReasonKey[]> = {
  child: OTHERWORLD_VACATION_REASONS,
  witch: OTHERWORLD_VACATION_REASONS,
  sage: OTHERWORLD_VACATION_REASONS,
  shaman: EASTERN_VACATION_REASONS,
  taoist: EASTERN_VACATION_REASONS,
  dokkaebi: EASTERN_VACATION_REASONS,
  hunter: NORDIC_VACATION_REASONS,
  runeshaman: NORDIC_VACATION_REASONS,
  god: NORDIC_VACATION_REASONS,
};

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getVacationReasonKey(characterId: CharacterId, dateKey: string): VacationReasonKey {
  const keys = VACATION_REASON_KEYS_BY_CHARACTER[characterId];
  const seed = hashString(`vacation-reason:${dateKey}:${characterId}`);
  return keys[seed % keys.length];
}

interface CreateSessionResponse {
  ok: boolean;
  data?: { sessionId: string };
  error?: {
    code?: string;
  };
}

export function CharacterSelect({
  affinities = {},
  vacationRoster,
}: CharacterSelectProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<CharacterId | null>(null);
  const [isPending, startTransition] = useTransition();
  const vacationByCharacter = new Map(
    vacationRoster.vacations.map((item) => [item.characterId, item]),
  );

  const tCat = useTranslations("characterSelect");
  const tChar = useTranslations("characters");
  const tSpec = useTranslations("specialties");

  async function handleSelect(id: CharacterId) {
    setSelected(id);
    startTransition(async () => {
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character: id }),
      });
      const json = (await res.json().catch(() => null)) as CreateSessionResponse | null;
      if (json?.ok && json.data) {
        router.push(`/chat/${json.data.sessionId}`);
        return;
      }
    });
  }

  return (
    <div className="space-y-8">
      <p className="text-center text-[15px] text-muted-foreground">
        {tCat("askToday")}
      </p>

      {CATEGORY_ORDER.map((category) => {
        const deco = CATEGORY_DECO[category];
        const ids = CHARACTERS_BY_CATEGORY[category];
        const label = tCat(`category${deco.labelKey}` as "categoryOtherworld" | "categoryEastern" | "categoryNordic");
        const sub = tCat(`categorySub${deco.labelKey}` as "categorySubOtherworld" | "categorySubEastern" | "categorySubNordic");

        return (
          <div key={category} className="space-y-4">
            {/* 카테고리 헤더 */}
            <div className="flex items-center gap-3">
              <div className={cn("h-2 w-2 rounded-full flex-shrink-0", deco.dot)} />
              <div className="flex items-baseline gap-2">
                <span className={cn("font-mystic text-[15px] font-bold tracking-wider", deco.text)}>
                  {label}
                </span>
                <span className="text-[15px] tracking-widest text-muted-foreground/50 uppercase">
                  {sub}
                </span>
              </div>
              <div className={cn("flex-1 h-px", deco.border, "border-t")} />
            </div>

            {/* 캐릭터 카드 그리드. 이미지 슬롯은 기존 캐릭터 원본과 같은 2:3 카드 비율. */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-3">
              {ids.map((id) => {
                const char = CHARACTERS[id];
                const vacation = vacationByCharacter.get(id);
                const vacationImage = VACATION_POSTCARD_BY_CHARACTER[id];
                const isLoading = isPending && selected === id;
                const isSelected = selected === id;
                const name = tChar(`${id}.name`);
                const title = tChar(`${id}.title`);
                const hook = tChar(`${id}.hook`);
                const vacationReason = tCat(getVacationReasonKey(id, vacationRoster.dateKey));
                const specialty = tSpec(SPECIALTY_KEY[id] as "tarot" | "pillarsCelestial" | "runeOmen" | "runeOracle" | "runeVoice");

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      if (!vacation) {
                        void handleSelect(id);
                      }
                    }}
                    disabled={isPending}
                    aria-disabled={vacation ? true : undefined}
                    aria-label={
                      vacation
                        ? `${name} ${tCat("vacationBadge")}. ${vacationReason}.`
                        : name
                    }
                    className={cn(
                      "group relative flex flex-col items-center gap-3 sm:gap-2",
                      "rounded-2xl border ring-1 ring-transparent p-3 text-center transition-all duration-200",
                      "disabled:cursor-not-allowed",
                      vacation && "cursor-default",
                      isSelected
                        ? CHAR_SELECTED[id]
                        : cn("app-surface", CHAR_ACCENT[id]),
                    )}
                  >
                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl shadow-md">
                      {vacation ? (
                        <Image
                          src={vacationImage}
                          alt={`${name} ${tCat("vacationBadge")}`}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 25vw, 220px"
                        />
                      ) : (
                        <CharacterImage
                          character={char}
                          fill
                          quality={95}
                          className="transition-transform duration-300 group-hover:scale-[1.03]"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 25vw, 220px"
                        />
                      )}
                      {vacation && (
                        <div className="absolute inset-x-3 bottom-3 rounded-lg bg-black/70 px-3 py-2 text-left on-character-image">
                          <p className="font-mystic text-[15px] font-semibold leading-tight">
                            {tCat("vacationBadge")}
                          </p>
                          <p className="mt-1 text-[15px] leading-tight text-white/80">
                            {vacationReason}
                          </p>
                        </div>
                      )}
                      {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                          <Loader2 className="h-7 w-7 text-white animate-spin" />
                        </div>
                      )}
                      {/* 전문 배지 */}
                      <div className="absolute top-2 left-2 on-character-image">
                        <span className="rounded-md bg-black/65 px-2 py-0.5 text-[15px] font-medium leading-none">
                          {vacation ? tCat("vacationBadge") : specialty}
                        </span>
                      </div>
                    </div>

                    {/* 이름 + 직함 — 모바일은 여기까지만 */}
                    <div className="w-full space-y-1">
                      <p className="font-mystic font-bold text-lg leading-tight text-foreground/95 sm:text-[15px]">
                        {name}
                      </p>
                      <p className="text-[15px] text-muted-foreground/80 leading-tight">
                        {title}
                      </p>
                      {/* 훅 — 데스크탑(sm+)에서만 */}
                      <p className={cn(
                        "hidden sm:block text-[15px] text-foreground/80 leading-snug font-mystic italic",
                        vacation && "text-muted-foreground/70",
                      )}>
                        &ldquo;{hook}&rdquo;
                      </p>
                      {/* 친밀도 — 데스크탑(sm+)에서만 */}
                      <div className="hidden sm:block">
                        <AffinityBar
                          characterId={id}
                          points={affinities[id] ?? 0}
                          compact
                        />
                      </div>
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
