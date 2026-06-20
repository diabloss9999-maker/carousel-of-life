/**
 * 멤버 생일 데이터와 D-day 계산.
 *
 * 생일 월·일은 i18n `characters.{id}.facts`와
 * `MEMBER_CORE_PROFILE_FACTS`의 생일 값과 항상 일치해야 한다.
 */
import type { CharacterId } from "@/lib/chat/characters";

/** 멤버 생일 (KST, 월·일). */
export const MEMBER_BIRTHDAYS: Record<
  CharacterId,
  { month: number; day: number }
> = {
  child: { month: 1, day: 17 },
  sage: { month: 3, day: 8 },
  witch: { month: 4, day: 21 },
  shaman: { month: 5, day: 30 },
  taoist: { month: 7, day: 14 },
  dokkaebi: { month: 8, day: 26 },
  hunter: { month: 10, day: 4 },
  god: { month: 11, day: 16 },
  runeshaman: { month: 12, day: 28 },
};

export interface UpcomingBirthday {
  characterId: CharacterId;
  month: number;
  day: number;
  /** 오늘이면 0, 내일이면 1. */
  dday: number;
}

/** KST 기준 오늘의 연·월·일. */
function todayKstParts(): { year: number; month: number; day: number } {
  const ymd = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Seoul",
  });
  const [year, month, day] = ymd.split("-").map(Number);
  return { year, month, day };
}

/**
 * 다가오는 멤버 생일을 D-day 오름차순으로 반환한다.
 * 올해 생일이 이미 지났으면 내년 생일로 계산한다.
 */
export function getUpcomingBirthdays(limit?: number): UpcomingBirthday[] {
  const { year, month, day } = todayKstParts();
  const todayUtc = Date.UTC(year, month - 1, day);

  const upcoming = (
    Object.entries(MEMBER_BIRTHDAYS) as [
      CharacterId,
      { month: number; day: number },
    ][]
  ).map(([characterId, birthday]) => {
    const thisYear = Date.UTC(year, birthday.month - 1, birthday.day);
    const next =
      thisYear >= todayUtc
        ? thisYear
        : Date.UTC(year + 1, birthday.month - 1, birthday.day);
    const dday = Math.round((next - todayUtc) / 86_400_000);
    return { characterId, month: birthday.month, day: birthday.day, dday };
  });

  upcoming.sort((a, b) => a.dday - b.dday);
  return limit ? upcoming.slice(0, limit) : upcoming;
}
