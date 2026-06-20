"use client";

import { Send } from "lucide-react";
import { useMemo, useState } from "react";

import { MemberSelector } from "@/components/MemberSelector";
import {
  CAROUSEL_NINE_MEMBERS,
  DEFAULT_CAROUSEL_NINE_MEMBER_ID,
  type CarouselNineMember,
  type CarouselNineMemberId,
} from "@/data/members";
import { buildCharacterPrompt } from "@/lib/buildCharacterPrompt";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "fan" | "member";
  content: string;
  memberId?: CarouselNineMemberId;
}

function createMessageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function choosePreviewReply(member: CarouselNineMember, fanMessage: string): string {
  const normalized = fanMessage.trim().toLowerCase();

  if (/힘들|지치|우울|불안|슬퍼|속상|tired|sad|anxious/.test(normalized)) {
    return `${member.catchphrases[0]} ${member.sampleReplies[0]}`;
  }

  if (/고마|좋아|응원|사랑|최고|thank|love/.test(normalized)) {
    return `${member.fanName}, 그 말 오래 기억할게. ${member.sampleReplies[1]}`;
  }

  if (/뭐해|근황|오늘|연습|무대|schedule/.test(normalized)) {
    return `${member.catchphrases[0]} 오늘은 ${member.position}답게 연습하고, 라이더 메시지도 읽는 중이야.`;
  }

  return member.sampleReplies[Math.floor(Math.random() * member.sampleReplies.length)];
}

function withAndParticle(name: string): string {
  const lastChar = name.at(-1);
  if (!lastChar) return name;
  const code = lastChar.charCodeAt(0);
  const hasBatchim = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
  return `${name}${hasBatchim ? "과" : "와"}`;
}

async function previewMemberReply(
  member: CarouselNineMember,
  fanMessage: string,
  conversation: readonly ChatMessage[],
): Promise<string> {
  const recentConversation = conversation.slice(-6).map((message) => {
    const speaker = message.role === "fan" ? member.fanName : member.name;
    return `${speaker}: ${message.content}`;
  });

  const systemPrompt = buildCharacterPrompt(member, { recentConversation });
  void systemPrompt;

  await new Promise((resolve) => setTimeout(resolve, 240));
  return choosePreviewReply(member, fanMessage);
}

export function ChatBox() {
  const [selectedMemberId, setSelectedMemberId] =
    useState<CarouselNineMemberId>(DEFAULT_CAROUSEL_NINE_MEMBER_ID);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "member",
      memberId: DEFAULT_CAROUSEL_NINE_MEMBER_ID,
      content: "좋아. 여기는 가볍게 멤버 말투를 확인하는 미리보기 대화야.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const selectedMember = useMemo(
    () =>
      CAROUSEL_NINE_MEMBERS.find((member) => member.id === selectedMemberId) ??
      CAROUSEL_NINE_MEMBERS[0],
    [selectedMemberId],
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fanMessage = input.trim();
    if (!fanMessage || isReplying) return;

    const nextFanMessage: ChatMessage = {
      id: createMessageId(),
      role: "fan",
      content: fanMessage,
    };
    const nextMessages = [...messages, nextFanMessage];

    setMessages(nextMessages);
    setInput("");
    setIsReplying(true);

    try {
      const reply = await previewMemberReply(
        selectedMember,
        fanMessage,
        nextMessages,
      );

      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "member",
          memberId: selectedMember.id,
          content: reply,
        },
      ]);
    } finally {
      setIsReplying(false);
    }
  }

  function handleSelect(memberId: CarouselNineMemberId) {
    setSelectedMemberId(memberId);
    const member =
      CAROUSEL_NINE_MEMBERS.find((item) => item.id === memberId) ??
      CAROUSEL_NINE_MEMBERS[0];

    setMessages((current) => [
      ...current,
      {
        id: createMessageId(),
        role: "member",
        memberId: member.id,
        content: `${member.catchphrases[0]} ${member.fanName}, 이제 나랑 이야기해보자.`,
      },
    ]);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <div className="rounded-lg border border-white/12 bg-white/[0.06] p-4 text-white shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-100/60">
            Member
          </p>
          <h2 className="mt-2 text-2xl font-semibold">{selectedMember.name}</h2>
          <p className="mt-1 text-sm text-violet-100/68">
            {selectedMember.position} · {selectedMember.fanName}
          </p>
          <p className="mt-3 text-sm leading-6 text-white/72">
            {selectedMember.speakingStyle}
          </p>
        </div>

        <MemberSelector
          members={CAROUSEL_NINE_MEMBERS}
          selectedMemberId={selectedMemberId}
          onSelect={handleSelect}
        />
      </aside>

      <section className="flex min-h-[620px] flex-col overflow-hidden rounded-lg border border-white/12 bg-black/35 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-sm font-semibold text-white">
            {withAndParticle(selectedMember.name)} 대화 중
          </p>
          <p className="text-xs text-violet-100/55">
            멤버 말투 미리보기 · 실제 대화는 앱 안 멤버 대화에서 이어가요
          </p>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5">
          {messages.map((message) => {
            const isFan = message.role === "fan";
            const messageMember =
              message.memberId === selectedMember.id
                ? selectedMember
                : CAROUSEL_NINE_MEMBERS.find(
                    (member) => member.id === message.memberId,
                  );

            return (
              <div
                key={message.id}
                className={cn("flex", isFan ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[84%] rounded-lg px-4 py-3 text-sm leading-6",
                    isFan
                      ? "bg-violet-200 text-zinc-950"
                      : "border border-white/10 bg-white/[0.08] text-white",
                  )}
                >
                  {!isFan ? (
                    <p className="mb-1 text-[11px] font-semibold text-violet-100/58">
                      {messageMember?.name ?? selectedMember.name}
                    </p>
                  ) : null}
                  <p>{message.content}</p>
                </div>
              </div>
            );
          })}

          {isReplying ? (
            <div className="flex justify-start">
              <div className="rounded-lg border border-white/10 bg-white/[0.08] px-4 py-3 text-sm text-white/70">
                {selectedMember.name} 입력 중...
              </div>
            </div>
          ) : null}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex gap-2 border-t border-white/10 p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`${selectedMember.name}에게 메시지 보내기`}
            className="min-w-0 flex-1 rounded-lg border border-white/12 bg-white/[0.08] px-4 py-3 text-sm text-white outline-none placeholder:text-white/38 focus:border-violet-200/70"
          />
          <button
            type="submit"
            disabled={!input.trim() || isReplying}
            aria-label="메시지 보내기"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-violet-200 text-zinc-950 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Send className="h-4 w-4" aria-hidden />
          </button>
        </form>
      </section>
    </div>
  );
}
