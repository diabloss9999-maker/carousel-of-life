import Image from "next/image";
import { Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  MemberPhotocards,
  PhotocardBinder,
} from "@/lib/photocards/service";

/**
 * 포토카드 바인더 뷰 — 9멤버 × 친밀도 해금 사진 수집.
 */
export function PhotocardBinderView({ binder }: { binder: PhotocardBinder }) {
  return (
    <div className="space-y-5">
      <div className="app-surface rounded-3xl border border-primary/20 p-5 text-center">
        <p className="text-[13px] font-medium text-muted-foreground">
          모은 포토카드
        </p>
        <p className="font-mystic mt-1 text-4xl font-semibold tracking-tight">
          {binder.totalUnlocked}
          <span className="text-xl text-muted-foreground">
            {" "}
            / {binder.totalCards}
          </span>
        </p>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          멤버와 대화하거나 선물하면 친밀도가 올라 새 카드가 열려요.
        </p>
      </div>

      {binder.members.map((member) => (
        <MemberRow key={member.characterId} member={member} />
      ))}
    </div>
  );
}

function MemberRow({ member }: { member: MemberPhotocards }) {
  const complete = member.nextUnlockLevel == null;

  return (
    <section className="app-surface rounded-3xl border border-white/10 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold">{member.name}</span>
          <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            호감도 Lv.{member.level}
          </span>
        </div>
        <span className="text-[13px] font-medium text-muted-foreground">
          {member.unlockedCount}/{member.totalCount}장
        </span>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
        {member.slides.map((slide, i) => (
          <div
            key={slide.src}
            className="relative aspect-[3/4] overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/10"
          >
            <Image
              src={slide.src}
              alt={
                slide.unlocked
                  ? `${member.name} 포토카드 ${i + 1}`
                  : "잠긴 포토카드"
              }
              fill
              sizes="(min-width: 640px) 16vw, 25vw"
              className={cn(
                "object-cover object-top",
                !slide.unlocked && "blur-md brightness-[0.35]",
              )}
            />
            {!slide.unlocked ? (
              <div className="absolute inset-0 grid place-content-center justify-items-center gap-0.5">
                <Lock className="h-4 w-4 text-white/85" aria-hidden />
                <span className="text-[10px] font-semibold text-white/85">
                  Lv.{slide.unlockLevel}
                </span>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {complete ? (
        <p className="mt-2.5 text-[12px] font-medium text-primary">
          이 멤버의 포토카드를 전부 모았어요! 💖
        </p>
      ) : (
        <p className="mt-2.5 text-[12px] text-muted-foreground">
          다음 카드는 호감도 Lv.{member.nextUnlockLevel}에서 열려요.
        </p>
      )}
    </section>
  );
}
