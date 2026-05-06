import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChatWindow, type InitialMessage } from "@/components/chat/chat-window";
import { requireProfile } from "@/lib/auth/get-user";
import {
  getSessionForUser,
  getSessionMessages,
} from "@/lib/chat/service";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "대화",
  description: "주술사와의 문답.",
};

interface ChatSessionPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function ChatSessionPage({
  params,
}: ChatSessionPageProps) {
  const { sessionId } = await params;
  const { profile } = await requireProfile();

  const session = await getSessionForUser({
    sessionId,
    userId: profile.userId,
  });
  if (!session) notFound();

  const messages = await getSessionMessages(sessionId);
  const initial: InitialMessage[] = messages.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={ROUTES.chat}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> 지난 대화
          </Link>
        </Button>
        <h1 className="font-mystic text-2xl font-semibold tracking-tight">
          {session.title}
        </h1>
      </header>

      <ChatWindow sessionId={sessionId} initialMessages={initial} />
    </div>
  );
}
