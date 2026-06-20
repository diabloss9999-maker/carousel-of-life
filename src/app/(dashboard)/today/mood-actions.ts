"use server";

import { revalidatePath } from "next/cache";

import { requireProfile } from "@/lib/auth/get-user";
import { saveMood, type MoodKey } from "@/lib/mood/service";

export async function saveMoodAction(opts: {
  mood: MoodKey;
  source?: string;
}): Promise<void> {
  const { profile } = await requireProfile();

  await saveMood({ userId: profile.userId, mood: opts.mood, source: opts.source });

  revalidatePath("/today");
}
