import type { Metadata, Route } from "next";
import Link from "next/link";
import { MessageCircle, Plus } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QuotaBar } from "@/components/fortune/quota-bar";
import { NewSessionButton } from "@/components/chat/new-session-button";
import { requireProfile } from "@/lib/auth/get-user";
import { listSessions } from "@/lib/chat/service";
import { getTodayUsage } from "@/lib/usage/quota";
import { formatKoreanDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "주술사 문답",
  description: "사주를 아는 친구에게 궁금한 걸 물어봐요.",
};

export default async function ChatPage() {
  const { profile } = await requireProfile();

  const [sessions, usage] = await Promise.all([
    listSessions(profile.userId, 30),
    getTodayUsage(profile.userId),
  ]);

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-mystic text-4xl font-semibold tracking-tight sm:text-5xl">
            주술사 문답
          </h1>
          <p className="text-muted-foreground">
            궁금한 걸 물어봐. 사주를 아는 친구처럼 답해줄게.
          </p>
        </div>
        <NewSessionButton />
      </header>

      <QuotaBar
        fortuneCount={usage.fortuneCount}
        tarotCount={usage.tarotCount}
        chatCount={usage.chatCount}
      />

      {sessions.length === 0 ? (
        <Card className="border-border/60 bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="font-mystic flex items-center gap-2 text-xl">
              <MessageCircle className="h-5 w-5 text-accent" aria-hidden />
              아직 시작한 대화가 없어
            </CardTitle>
            <CardDescription>
              위쪽 “새 대화” 버튼을 눌러서 시작해봐.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NewSessionButton variant="default" size="lg" className="w-full">
              <Plus className="h-4 w-4" aria-hidden />새 대화 시작
            </NewSessionButton>
          </CardContent>
        </Card>
      ) : (
        <section className="space-y-3">
          <h2 className="font-mystic text-xl font-semibold tracking-tight">
            지난 대화
          </h2>
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/chat/${s.id}` as Route}
                  className="block rounded-lg border border-border/40 bg-card/40 px-4 py-3 hover:bg-card/70 transition-colors backdrop-blur"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mystic font-medium truncate">
                      {s.title}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatKoreanDate(new Date(s.lastMessageAt))}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
