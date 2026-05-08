/**
 * 저장된 관계 상대(saved_partners) 비즈니스 로직.
 */
import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { savedPartners, type SavedPartner } from "@/db/schema";
import {
  RELATIONSHIP_OPTIONS,
  type RelationshipKind,
} from "@/lib/compatibility/constants";

export { RELATIONSHIP_OPTIONS, type RelationshipKind };

export interface NewPartnerInput {
  name: string;
  relationship: string;
  birthDate: string;
  calendarSystem: "solar" | "lunar";
  gender: "male" | "female" | "other";
  mbti: string | null;
}

/**
 * 사용자의 저장된 상대 목록을 반환한다 (최근 등록순).
 */
export async function listPartners(userId: string): Promise<SavedPartner[]> {
  return db
    .select()
    .from(savedPartners)
    .where(eq(savedPartners.userId, userId))
    .orderBy(desc(savedPartners.createdAt));
}

/**
 * 새 상대를 저장한다. 동일 이름이 이미 있으면 에러를 던진다.
 */
export async function addPartner(
  userId: string,
  input: NewPartnerInput,
): Promise<SavedPartner> {
  const [row] = await db
    .insert(savedPartners)
    .values({
      userId,
      name: input.name,
      relationship: input.relationship,
      birthDate: input.birthDate,
      calendarSystem: input.calendarSystem,
      gender: input.gender,
      mbti: input.mbti,
    })
    .returning();
  return row;
}

/**
 * 저장된 상대를 삭제한다 (본인 소유만).
 */
export async function deletePartner(
  userId: string,
  partnerId: string,
): Promise<void> {
  await db
    .delete(savedPartners)
    .where(
      and(eq(savedPartners.id, partnerId), eq(savedPartners.userId, userId)),
    );
}

/**
 * 저장된 상대를 ID로 조회한다 (본인 소유만).
 */
export async function getPartner(
  userId: string,
  partnerId: string,
): Promise<SavedPartner | null> {
  const rows = await db
    .select()
    .from(savedPartners)
    .where(
      and(eq(savedPartners.id, partnerId), eq(savedPartners.userId, userId)),
    )
    .limit(1);
  return rows[0] ?? null;
}
