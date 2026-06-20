"use client";

import type {
  CarouselNineMember,
  CarouselNineMemberId,
} from "@/data/members";
import { cn } from "@/lib/utils";

interface MemberSelectorProps {
  members: readonly CarouselNineMember[];
  selectedMemberId: CarouselNineMemberId;
  onSelect: (memberId: CarouselNineMemberId) => void;
}

export function MemberSelector({
  members,
  selectedMemberId,
  onSelect,
}: MemberSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {members.map((member) => {
        const isSelected = member.id === selectedMemberId;

        return (
          <button
            key={member.id}
            type="button"
            onClick={() => onSelect(member.id)}
            className={cn(
              "min-h-[78px] rounded-lg border px-3 py-3 text-left transition active:scale-[0.98]",
              "bg-white/[0.07] backdrop-blur-md hover:bg-white/[0.12]",
              isSelected
                ? "border-violet-200/70 shadow-[0_0_28px_rgba(196,181,253,0.22)]"
                : "border-white/12",
            )}
            aria-pressed={isSelected}
          >
            <span className="block truncate text-sm font-semibold text-white">
              {member.name}
            </span>
            <span className="mt-1 block truncate text-[12px] text-violet-100/68">
              {member.position}
            </span>
            <span className="mt-2 block truncate text-[11px] text-white/45">
              {member.fanName}
            </span>
          </button>
        );
      })}
    </div>
  );
}
