"use server";

import { revalidatePath } from "next/cache";

import { requireProfile } from "@/lib/auth/get-user";
import { saveMood, getTodayMood, type MoodKey } from "@/lib/mood/service";
import { addCrack, reduceCrack } from "@/lib/crack/service";

/** 감정별 흐림 증감량 */
const MOOD_CRACK: Record<MoodKey, number> = {
  great:   -1,
  good:     0,
  neutral:  0,
  tough:    2,
  hard:     5,
};

export async function saveMoodAction(opts: {
  mood: MoodKey;
  source?: string;
}): Promise<void> {
  const { profile } = await requireProfile();

  // 오늘 이미 기록된 기분이 있으면 흐림 점수는 다시 적용하지 않는다
  // (mood 자체는 saveMood 가 upsert 처리하지만, 흐림은 1일 1회만 반영).
  const existing = await getTodayMood(profile.userId);
  const isFirstToday = existing === null;

  await saveMood({ userId: profile.userId, mood: opts.mood, source: opts.source });

  if (isFirstToday) {
    const delta = MOOD_CRACK[opts.mood] ?? 0;
    if (delta > 0) await addCrack(profile.userId, delta);
    if (delta < 0) await reduceCrack(profile.userId, Math.abs(delta));
  }

  // 서버 컴포넌트(/today 의 WorldStatusPanel 등)를 새 흐림 점수로 재렌더.
  revalidatePath("/today");
}
