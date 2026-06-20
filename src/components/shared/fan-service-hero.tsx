import Image from "next/image";
import { getTranslations } from "next-intl/server";

import type { FanServiceProfile } from "@/lib/fan-service";
import { cn } from "@/lib/utils";

interface FanServiceHeroProps {
  service: FanServiceProfile;
  priority?: boolean;
  className?: string;
}

function renderServiceTitle(title: string) {
  const lines = title.split("\n");
  if (lines.length === 1) return title;

  return lines.map((line) => (
    <span key={line} className="block">
      {line}
    </span>
  ));
}

export async function FanServiceHero({
  service,
  priority = false,
  className,
}: FanServiceHeroProps) {
  const t = await getTranslations(`fanService.${service.id}`);

  return (
    <section
      className={cn(
        "app-surface overflow-hidden rounded-2xl border border-white/10",
        className,
      )}
    >
      <div className="grid min-w-0 md:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] md:items-stretch">
        <div className="relative aspect-[16/10] min-h-[240px] md:aspect-auto md:min-h-[380px]">
          <Image
            src={service.imageSrc}
            alt={t("imageAlt")}
            fill
            sizes="(max-width: 768px) 100vw, 52vw"
            className="object-cover"
            style={{
              objectPosition: service.objectPosition ?? "center 28%",
            }}
            priority={priority}
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-background/45 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-background/40"
          />
        </div>
        <div className="flex min-w-0 flex-col justify-center gap-3 p-5 sm:p-7">
          <p className="min-w-0 text-[12px] font-semibold uppercase tracking-[0.18em] text-primary/80 break-words sm:text-[13px] sm:tracking-[0.2em]">
            {t("eyebrow")}
          </p>
          <h2 className="font-mystic text-balance-ko min-w-0 max-w-full text-xl font-semibold leading-snug tracking-tight sm:text-3xl">
            {renderServiceTitle(t("title"))}
          </h2>
          <p className="text-keep text-[15px] leading-relaxed text-muted-foreground">
            {t("body")}
          </p>
        </div>
      </div>
    </section>
  );
}
