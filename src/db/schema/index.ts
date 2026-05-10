/**
 * Drizzle 스키마 - 인생의 회전목마
 *
 * 10 개 테이블 + 7 개 enum 으로 구성된다.
 *
 * - 모든 user-owned 테이블은 `user_id` 컬럼을 가지며
 *   `auth.users(id)` 를 cascade delete 로 참조한다.
 * - RLS 정책은 별도 SQL 파일(`9999_rls_policies.sql`) 에서 정의한다.
 */
import { sql } from "drizzle-orm";
import {
  pgEnum,
  pgSchema,
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  time,
  integer,
  boolean,
  jsonb,
  unique,
  index,
} from "drizzle-orm/pg-core";

// =============================================================================
// auth.users 참조용 가상 테이블 정의
// =============================================================================

const authSchema = pgSchema("auth");

/**
 * Supabase 가 관리하는 `auth.users` 테이블의 외래키 참조용 정의.
 * 실제 컬럼·정책은 Supabase 가 소유하므로 이 정의는 schema 변경에 영향을 주지 않는다.
 */
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

// =============================================================================
// Enums
// =============================================================================

export const calendarSystemEnum = pgEnum("calendar_system", ["solar", "lunar"]);

export const genderEnum = pgEnum("gender", ["male", "female", "other"]);

export const fortuneCategoryEnum = pgEnum("fortune_category", [
  "general",
  "love",
  "money",
  "career",
  "health",
  "study",
  "zodiac",
  "chinese_zodiac",
]);

export const tarotSpreadEnum = pgEnum("tarot_spread", [
  "single",
  "three",
  "celtic",
]);

export const lenormandSpreadEnum = pgEnum("lenormand_spread", [
  "single",
  "three",
  "nine",
  "grand_tableau",
]);

export const chatRoleEnum = pgEnum("chat_role", ["user", "assistant"]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "on_trial",
  "paused",
  "cancelled",
  "expired",
]);

export const purchaseStatusEnum = pgEnum("purchase_status", [
  "paid",
  "refunded",
  "failed",
]);

// =============================================================================
// profiles - 사용자 프로필 + 사주 8자 캐시
// =============================================================================

export const profiles = pgTable("profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  displayName: text("display_name"),
  birthDate: date("birth_date").notNull(),
  birthTime: time("birth_time"),
  calendarSystem: calendarSystemEnum("calendar_system")
    .notNull()
    .default("solar"),
  gender: genderEnum("gender").notNull(),
  mbti: text("mbti"),
  birthPlace: text("birth_place"),
  /** 사주 8자: { year, month, day, hour } 각 { stem, branch } 형태. */
  sajuPillars: jsonb("saju_pillars"),
  /** 오행 분포: { wood, fire, earth, metal, water }. */
  fiveElements: jsonb("five_elements"),
  /**
   * 프리미엄 전용 사주 심층 풀이 캐시.
   *
   * 한 번 생성되면 영구 보관. 형태:
   * { personality, strengths, cautions, loveStyle, careerFit, healthCare, lifeFlow, model, createdAt }
   */
  sajuDeepReading: jsonb("saju_deep_reading"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

// =============================================================================
// daily_fortunes - 일일 운세 캐시 (같은 날 같은 카테고리는 동일 결과 보장)
// =============================================================================

export const dailyFortunes = pgTable(
  "daily_fortunes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    fortuneDate: date("fortune_date").notNull(),
    category: fortuneCategoryEnum("category").notNull(),
    /** 한 줄 헤드라인. */
    title: text("title").notNull(),
    /** 본문 풀이. */
    content: text("content").notNull(),
    /** 1-100 운세 점수. */
    score: integer("score").notNull(),
    luckyColor: text("lucky_color"),
    luckyNumber: integer("lucky_number"),
    luckyDirection: text("lucky_direction"),
    /** 사용된 AI 모델 식별자. */
    model: text("model").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("daily_fortunes_user_date_category_uniq").on(
      t.userId,
      t.fortuneDate,
      t.category,
    ),
    index("daily_fortunes_user_date_idx").on(t.userId, t.fortuneDate),
  ],
);

export type DailyFortune = typeof dailyFortunes.$inferSelect;
export type NewDailyFortune = typeof dailyFortunes.$inferInsert;

// =============================================================================
// tarot_readings - 타로 결과
// =============================================================================

export const tarotReadings = pgTable(
  "tarot_readings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    spreadType: tarotSpreadEnum("spread_type").notNull(),
    /** 사용자가 던진 질문. nullable (그냥 뽑기). */
    question: text("question"),
    /**
     * 뽑힌 카드 배열.
     * 예: [{ position: "past", cardId: "the_fool", isReversed: false }, ...]
     */
    cards: jsonb("cards").notNull(),
    /** 주술사 풀이 본문. */
    interpretation: text("interpretation").notNull(),
    model: text("model").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("tarot_readings_user_created_idx").on(t.userId, t.createdAt)],
);

export type TarotReading = typeof tarotReadings.$inferSelect;
export type NewTarotReading = typeof tarotReadings.$inferInsert;

// =============================================================================
// lenormand_readings - 르노르망 카드 점술 결과
// =============================================================================

export const lenormandReadings = pgTable(
  "lenormand_readings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    spreadType: lenormandSpreadEnum("spread_type").notNull(),
    /** 사용자가 던진 질문. nullable (그냥 뽑기). */
    question: text("question"),
    /**
     * 뽑힌 카드 배열.
     * 예: [{ id: 1, position: "single" }] 또는
     *     [{ id: 5, position: "past" }, { id: 12, position: "present" }, { id: 31, position: "future" }]
     */
    cards: jsonb("cards").notNull(),
    /** 르노르망 풀이 본문. */
    interpretation: text("interpretation").notNull(),
    model: text("model").notNull(),
    /** 그랑 타블로용 시그니피케이터 성별 (`male` | `female`). */
    gender: text("gender").$type<"male" | "female" | null>(),
    /** 그랑 타블로의 시그니피케이터(신사/숙녀) 위치 (0~35). */
    significatorPosition: integer("significator_position"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("lenormand_readings_user_created_idx").on(t.userId, t.createdAt),
  ],
);

export type LenormandReading = typeof lenormandReadings.$inferSelect;
export type NewLenormandReading = typeof lenormandReadings.$inferInsert;

// =============================================================================
// compatibility_readings - 궁합 결과
// =============================================================================

export const compatibilityReadings = pgTable(
  "compatibility_readings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    partnerName: text("partner_name").notNull(),
    partnerBirthDate: date("partner_birth_date").notNull(),
    partnerBirthTime: time("partner_birth_time"),
    partnerCalendarSystem: calendarSystemEnum("partner_calendar_system")
      .notNull()
      .default("solar"),
    partnerGender: genderEnum("partner_gender").notNull(),
    partnerMbti: text("partner_mbti"),
    /** 1-100 궁합 점수. */
    score: integer("score").notNull(),
    summary: text("summary").notNull(),
    detail: text("detail").notNull(),
    model: text("model").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("compatibility_readings_user_created_idx").on(t.userId, t.createdAt),
  ],
);

export type CompatibilityReading = typeof compatibilityReadings.$inferSelect;
export type NewCompatibilityReading =
  typeof compatibilityReadings.$inferInsert;

// =============================================================================
// saved_partners - 저장된 관계 상대 (관계 허브)
// =============================================================================

export const savedPartners = pgTable(
  "saved_partners",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** 연인, 친구, 가족, 직장동료 등 자유 텍스트 (기본값: 친구). */
    relationship: text("relationship").default("친구"),
    birthDate: date("birth_date").notNull(),
    calendarSystem: calendarSystemEnum("calendar_system")
      .notNull()
      .default("solar"),
    gender: genderEnum("gender").notNull(),
    mbti: text("mbti"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("saved_partners_user_idx").on(t.userId),
    unique("saved_partners_user_name_uniq").on(t.userId, t.name),
  ],
);

export type SavedPartner = typeof savedPartners.$inferSelect;
export type NewSavedPartner = typeof savedPartners.$inferInsert;

// =============================================================================
// chat_sessions - AI 도사님과의 대화 세션
// =============================================================================

export const chatSessions = pgTable(
  "chat_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    /** AI 가 대화 초입에 자동 생성하는 짧은 제목. */
    title: text("title").notNull().default("새로운 문답"),
    /** 선택된 주술사 캐릭터 ID. null 이면 기본값(witch) 사용. */
    character: text("character").default("witch"),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("chat_sessions_user_recent_idx").on(t.userId, t.lastMessageAt),
  ],
);

export type ChatSession = typeof chatSessions.$inferSelect;
export type NewChatSession = typeof chatSessions.$inferInsert;

// =============================================================================
// chat_messages - 세션별 메시지
// =============================================================================

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => chatSessions.id, { onDelete: "cascade" }),
    /** RLS 효율을 위해 user_id 를 메시지에도 비정규화한다. */
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    role: chatRoleEnum("role").notNull(),
    content: text("content").notNull(),
    tokenInput: integer("token_input"),
    tokenOutput: integer("token_output"),
    model: text("model"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("chat_messages_session_created_idx").on(t.sessionId, t.createdAt),
  ],
);

export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;

// =============================================================================
// subscriptions - Lemon Squeezy 정기구독
// =============================================================================

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    lsSubscriptionId: text("ls_subscription_id").notNull().unique(),
    lsCustomerId: text("ls_customer_id").notNull(),
    lsVariantId: text("ls_variant_id").notNull(),
    status: subscriptionStatusEnum("status").notNull(),
    currentPeriodStartsAt: timestamp("current_period_starts_at", {
      withTimezone: true,
    }),
    currentPeriodEndsAt: timestamp("current_period_ends_at", {
      withTimezone: true,
    }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end")
      .notNull()
      .default(false),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    /** 마지막 webhook payload 원본 (감사용). */
    raw: jsonb("raw"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("subscriptions_user_idx").on(t.userId)],
);

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

// =============================================================================
// purchases - 단건 결제 (사주 풀이 PDF, 작명 등)
// =============================================================================

export const purchases = pgTable(
  "purchases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    lsOrderId: text("ls_order_id").notNull().unique(),
    /** ONE_TIME_PRODUCTS 키 (full_saju_report 등). */
    productKey: text("product_key").notNull(),
    /** 결제 금액 (KRW, 원 단위). */
    amount: integer("amount").notNull(),
    status: purchaseStatusEnum("status").notNull(),
    raw: jsonb("raw"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("purchases_user_idx").on(t.userId)],
);

export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;

// =============================================================================
// usage_quotas - 일일 사용량 (무료 한도 추적)
// =============================================================================

export const usageQuotas = pgTable(
  "usage_quotas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    usageDate: date("usage_date").notNull(),
    fortuneCount: integer("fortune_count").notNull().default(0),
    tarotCount: integer("tarot_count").notNull().default(0),
    chatCount: integer("chat_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("usage_quotas_user_date_uniq").on(t.userId, t.usageDate),
  ],
);

export type UsageQuota = typeof usageQuotas.$inferSelect;
export type NewUsageQuota = typeof usageQuotas.$inferInsert;

// =============================================================================
// webhook_events - 외부 webhook 멱등성 보장
// =============================================================================

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull(),
    eventId: text("event_id").notNull(),
    eventName: text("event_name").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    error: text("error"),
    raw: jsonb("raw"),
  },
  (t) => [
    unique("webhook_events_provider_event_uniq").on(t.provider, t.eventId),
  ],
);

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type NewWebhookEvent = typeof webhookEvents.$inferInsert;

// =============================================================================
// collection_cards - 가챠로 획득한 카드 소장 기록
// =============================================================================

export const collectionCards = pgTable(
  "collection_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    /** 카드 카테고리: tarot | mbti | zodiac | chineseZodiac | cheongan | characters */
    cardCategory: text("card_category").notNull(),
    /** 카드 고유 ID (cards-data.ts 의 id 와 일치). */
    cardId: text("card_id").notNull(),
    obtainedAt: timestamp("obtained_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("collection_cards_user_card_uniq").on(t.userId, t.cardId),
    index("collection_cards_user_idx").on(t.userId),
  ],
);

export type CollectionCard = typeof collectionCards.$inferSelect;
export type NewCollectionCard = typeof collectionCards.$inferInsert;

// =============================================================================
// gacha_daily - 일일 가챠 뽑기 횟수 (KST 기준)
// =============================================================================

export const gachaDaily = pgTable(
  "gacha_daily",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    /** KST 기준 날짜 (YYYY-MM-DD). */
    pullDate: date("pull_date").notNull(),
    pullCount: integer("pull_count").notNull().default(0),
  },
  (t) => [
    unique("gacha_daily_user_date_uniq").on(t.userId, t.pullDate),
  ],
);

export type GachaDaily = typeof gachaDaily.$inferSelect;
export type NewGachaDaily = typeof gachaDaily.$inferInsert;

// =============================================================================
// 모든 테이블 export
// =============================================================================

// =============================================================================
// daily_career_tips - 직장 운세 프리미엄 팁 일일 캐시
// =============================================================================

export const dailyCareerTips = pgTable(
  "daily_career_tips",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    tipDate: date("tip_date").notNull(),
    tips: jsonb("tips").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("daily_career_tips_user_date_uniq").on(t.userId, t.tipDate),
  ],
);

export type DailyCareerTip = typeof dailyCareerTips.$inferSelect;

// =============================================================================
// daily_health_workouts - 건강 운세 프리미엄 맨몸 운동 일일 캐시
// =============================================================================

export const dailyHealthWorkouts = pgTable(
  "daily_health_workouts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    workoutDate: date("workout_date").notNull(),
    workouts: jsonb("workouts").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("daily_health_workouts_user_date_uniq").on(t.userId, t.workoutDate),
  ],
);

export type DailyHealthWorkout = typeof dailyHealthWorkouts.$inferSelect;

// =============================================================================
// daily_study_tips - 학업 운세 프리미엄 집중력 팁 일일 캐시
// =============================================================================

export const dailyStudyTips = pgTable(
  "daily_study_tips",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    tipDate: date("tip_date").notNull(),
    tips: jsonb("tips").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("daily_study_tips_user_date_uniq").on(t.userId, t.tipDate)],
);

export type DailyStudyTip = typeof dailyStudyTips.$inferSelect;

// =============================================================================
// daily_love_premium - 사랑 운세 프리미엄 일일 캐시 (오늘의 한마디 + 매력 팁)
// =============================================================================

export const dailyLovePremium = pgTable(
  "daily_love_premium",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    premiumDate: date("premium_date").notNull(),
    data: jsonb("data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("daily_love_premium_user_date_uniq").on(t.userId, t.premiumDate),
  ],
);

export type DailyLovePremium = typeof dailyLovePremium.$inferSelect;

// =============================================================================
// daily_iljin - 오늘의 일진 × 내 사주 프리미엄 일일 캐시
// =============================================================================

export const dailyIljin = pgTable(
  "daily_iljin",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    iljinDate: date("iljin_date").notNull(),
    /** 오늘 일주 정보 + 충·합 분석 + AI 해석 결과 JSON. */
    data: jsonb("data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("daily_iljin_user_date_uniq").on(t.userId, t.iljinDate)],
);

export type DailyIljin = typeof dailyIljin.$inferSelect;

// =============================================================================
// daily_general_premium - 종합 운세 프리미엄 일일 캐시 (시간대별/레이더/DO·DON'T)
// =============================================================================

export const dailyGeneralPremium = pgTable(
  "daily_general_premium",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    premiumDate: date("premium_date").notNull(),
    data: jsonb("data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("daily_general_premium_user_date_uniq").on(t.userId, t.premiumDate),
  ],
);

export type DailyGeneralPremium = typeof dailyGeneralPremium.$inferSelect;

// =============================================================================
// personality_triple_analysis - 사주 × 별자리 × 성격유형 통합 분석 (영구)
// =============================================================================

export const personalityTripleAnalysis = pgTable("personality_triple_analysis", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" })
    .unique(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type PersonalityTripleAnalysis =
  typeof personalityTripleAnalysis.$inferSelect;

// =============================================================================
// personality_stress_profile - 스트레스 유형 + 회복법 (영구)
// =============================================================================

export const personalityStressProfile = pgTable("personality_stress_profile", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" })
    .unique(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type PersonalityStressProfile =
  typeof personalityStressProfile.$inferSelect;

// =============================================================================
// personality_career_fit - 직업 적성 심층 리포트 (영구)
// =============================================================================

export const personalityCareerFit = pgTable("personality_career_fit", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" })
    .unique(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type PersonalityCareerFit = typeof personalityCareerFit.$inferSelect;

export const allTables = {
  profiles,
  dailyFortunes,
  tarotReadings,
  lenormandReadings,
  compatibilityReadings,
  chatSessions,
  chatMessages,
  subscriptions,
  purchases,
  usageQuotas,
  webhookEvents,
  savedPartners,
  collectionCards,
  gachaDaily,
  dailyCareerTips,
  dailyHealthWorkouts,
  dailyStudyTips,
  dailyLovePremium,
  dailyIljin,
  dailyGeneralPremium,
  personalityTripleAnalysis,
  personalityStressProfile,
  personalityCareerFit,
} as const;

// `sql` re-export — RLS 마이그레이션에서 raw SQL 작성 시 활용.
export { sql };
