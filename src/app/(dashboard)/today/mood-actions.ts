"use server";

import { requireProfile } from "@/lib/auth/get-user";
import { saveMood, type MoodKey } from "@/lib/mood/service";
import { addCrack, reduceCrack } from "@/lib/crack/service";

/** 감정별 균열 증감량 */
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
  await saveMood({ userId: profile.userId, mood: opts.mood, source: opts.source });

  const delta = MOOD_CRACK[opts.mood] ?? 0;
  if (delta > 0) await addCrack(profile.userId, delta, `mood:${opts.mood}`);
  if (delta < 0) await reduceCrack(profile.userId, Math.abs(delta));
}
