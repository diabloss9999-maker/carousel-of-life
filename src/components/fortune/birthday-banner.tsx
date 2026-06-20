interface BirthdayBannerProps {
  displayName: string | null;
}

export function BirthdayBanner({ displayName }: BirthdayBannerProps) {
  const name = displayName?.trim() || "오늘의 주인공";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-rose-300/30 bg-gradient-to-br from-rose-500/15 via-amber-400/10 to-transparent p-5">
      <div className="flex items-center gap-3">
        <span className="text-3xl" aria-hidden>
          🎂
        </span>
        <div className="min-w-0 space-y-0.5">
          <p className="font-mystic text-lg font-semibold">
            {name}님, 생일 축하해요
          </p>
          <p className="text-[14px] leading-relaxed text-foreground/80">
            오늘의 운세는 조금 더 다정하게 볼게요. 무리하지 말고, 기분 좋은
            선택을 하나 남겨보세요.
          </p>
        </div>
      </div>
    </div>
  );
}
