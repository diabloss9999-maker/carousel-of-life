import { safeReadingText, safeShortText } from "@/lib/content/safety";

export function sanitizeFortuneCopy(text: string): string {
  return safeReadingText(text);
}

export function sanitizeFortuneTitle(text: string): string {
  return safeShortText(text, "오늘의 운세");
}
