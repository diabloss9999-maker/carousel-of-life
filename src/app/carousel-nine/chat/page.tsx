import type { Metadata } from "next";

import { ChatBox } from "@/components/ChatBox";
import { CAROUSEL_NINE_MEMBERS } from "@/data/members";

export const metadata: Metadata = {
  title: "Carousel Nine Rider Chat",
  description: "Carousel Nine 9명 멤버와 가볍게 대화 분위기를 미리 확인해요.",
};

export default function CarouselNineChatPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.28),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.18),transparent_30%),linear-gradient(135deg,#080812,#15101f_48%,#090a12)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-100/62">
            Carousel Nine Rider Chat
          </p>
          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
              Carousel Nine 멤버와 바로 대화하기
            </h1>
            <p className="text-sm leading-6 text-violet-100/68 sm:text-base">
              오늘의 기분, 듣고 싶은 말, 가볍게 나누고 싶은 이야기를 멤버에게 건네보세요.
            </p>
          </div>
        </header>

        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-9">
          {CAROUSEL_NINE_MEMBERS.map((member) => (
            <div
              key={member.id}
              className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 backdrop-blur-md"
            >
              <p className="truncate text-sm font-semibold">{member.name}</p>
              <p className="truncate text-[11px] text-violet-100/52">
                {member.position}
              </p>
            </div>
          ))}
        </div>

        <ChatBox />
      </div>
    </main>
  );
}
