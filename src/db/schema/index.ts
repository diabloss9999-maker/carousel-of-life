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

export const runeSpreadEnum = pgEnum("rune_spread", [
  "single",
  "three",
  "five",
  "nine",
]);

export const chatRoleEnum = pgEnum("chat_role", ["user", "assistant"]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "on_trial",
  "paused",
  "cancelled",
  "expired",
  /** 결제 실패 — 토스 정기결제 갱신 실패 시. cron 이 재시도. (마이그 0005) */
  "past_due",
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
   * 라이트 전용 사주 심층 풀이 캐시.
   *
   * 한 번 생성되면 영구 보관. 형태:
   * { personality, strengths, cautions, loveStyle, careerFit, healthCare, lifeFlow, model, createdAt }
   */
  sajuDeepReading: jsonb("saju_deep_reading"),
  /**
   * 초대한 사용자의 user_id. 가입 시 ?ref= 쿼리로 들어온 경우 기록 (마이그 0008).
   * 자기 자신은 기록 불가 (애플리케이션 레벨 검증).
   */
  invitedBy: uuid("invited_by").references(() => authUsers.id, {
    onDelete: "set null",
  }),
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
    /** 점술사 풀이 본문. */
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
// rune_readings - 엘더 푸타르크 룬 점술 결과
// =============================================================================

export const runeReadings = pgTable(
  "rune_readings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    spreadType: runeSpreadEnum("spread_type").notNull(),
    /** 사용자가 던진 질문. nullable (그냥 뽑기). */
    question: text("question"),
    /**
     * 뽑힌 룬 배열.
     * 예: [{ runeId: 1, isReversed: false, position: "single" }, ...]
     */
    runes: jsonb("runes").notNull(),
    /** 역방향 사용 여부 (사용자 설정값 보존). */
    reversedEnabled: boolean("reversed_enabled").notNull().default(true),
    /** 룬 풀이 본문 (마크다운). */
    interpretation: text("interpretation").notNull(),
    model: text("model").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("rune_readings_user_created_idx").on(t.userId, t.createdAt)],
);

export type RuneReading = typeof runeReadings.$inferSelect;
export type NewRuneReading = typeof runeReadings.$inferInsert;

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
    /** 선택된 점술사 캐릭터 ID. null 이면 기본값(witch) 사용. */
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
    /** 결제 PG 식별 — 'lemonsqueezy' | 'toss' | 'portone'. */
    provider: text("provider").notNull().default("lemonsqueezy"),
    // ── LS 컬럼 (provider='lemonsqueezy' 일 때만 채워짐) ──
    lsSubscriptionId: text("ls_subscription_id").unique(),
    lsCustomerId: text("ls_customer_id"),
    lsVariantId: text("ls_variant_id"),
    // ── Toss 컬럼 (provider='toss' 일 때만 채워짐, 마이그 0005) ──
    tossBillingKey: text("toss_billing_key").unique(),
    tossCustomerKey: text("toss_customer_key"),
    tossCardCompany: text("toss_card_company"),
    tossCardNumberMasked: text("toss_card_number_masked"),
    // ── PortOne 컬럼 (provider='portone' 일 때만 채워짐, 마이그 0007) ──
    portoneBillingKey: text("portone_billing_key").unique(),
    portoneCustomerId: text("portone_customer_id"),
    portoneChannelKey: text("portone_channel_key"),
    portoneCardCompany: text("portone_card_company"),
    portoneCardNumberMasked: text("portone_card_number_masked"),
    // ── 공통 ──
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
// toss_payments - 토스 정기결제 청구 이력 (마이그 0005)
// =============================================================================

export const tossPayments = pgTable(
  "toss_payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    subscriptionId: uuid("subscription_id").references(
      () => subscriptions.id,
      { onDelete: "set null" },
    ),
    paymentKey: text("payment_key").notNull().unique(),
    orderId: text("order_id").notNull().unique(),
    amount: integer("amount").notNull(),
    /** 'DONE' | 'CANCELED' | 'ABORTED' 등. */
    status: text("status").notNull(),
    method: text("method"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
    cancelReason: text("cancel_reason"),
    /** 토스 응답 원본 (분쟁 시 증빙). */
    rawResponse: jsonb("raw_response"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("toss_payments_user_id_idx").on(t.userId),
    index("toss_payments_subscription_id_idx").on(t.subscriptionId),
  ],
);

export type TossPayment = typeof tossPayments.$inferSelect;
export type NewTossPayment = typeof tossPayments.$inferInsert;

// =============================================================================
// portone_payments - PortOne 정기결제 청구 이력 (마이그 0007)
// =============================================================================

export const portonePayments = pgTable(
  "portone_payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    subscriptionId: uuid("subscription_id").references(
      () => subscriptions.id,
      { onDelete: "set null" },
    ),
    /** PortOne 의 결제 ID (paymentId). 자체 생성·전달. */
    paymentId: text("payment_id").notNull().unique(),
    /** 우리 시스템의 주문 ID (orderId). 자체 생성. */
    orderId: text("order_id").notNull().unique(),
    /** PortOne 거래 ID (자동 발급). */
    txId: text("tx_id"),
    amount: integer("amount").notNull(),
    /** 'PAID' | 'CANCELLED' | 'PARTIAL_CANCELLED' | 'FAILED' 등. */
    status: text("status").notNull(),
    method: text("method"),
    /** 백엔드 PG 식별 (kg_inicis, kcp, toss, nice 등). */
    pgProvider: text("pg_provider"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelReason: text("cancel_reason"),
    /** PortOne 응답 원본 (분쟁 시 증빙). */
    rawResponse: jsonb("raw_response"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("portone_payments_user_id_idx").on(t.userId),
    index("portone_payments_subscription_id_idx").on(t.subscriptionId),
  ],
);

export type PortonePayment = typeof portonePayments.$inferSelect;
export type NewPortonePayment = typeof portonePayments.$inferInsert;

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
    palmCount: integer("palm_count").notNull().default(0),
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
// streaks - 출석 스트릭 + 마일스톤 보너스 가챠
// =============================================================================

export const streaks = pgTable("streaks", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  /** 현재 연속 출석일 수. */
  currentStreak: integer("current_streak").notNull().default(0),
  /** 역대 최고 연속 출석일 수. */
  longestStreak: integer("longest_streak").notNull().default(0),
  /** 마지막 출석 체크인 날짜 (KST YYYY-MM-DD). */
  lastCheckIn: date("last_check_in"),
  /** 마일스톤 보너스로 쌓인 추가 가챠 크레딧 (사용 전까지 누적). */
  bonusGachaCredits: integer("bonus_gacha_credits").notNull().default(0),
  /** 총 누적 출석일 수. */
  totalCheckIns: integer("total_check_ins").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Streak = typeof streaks.$inferSelect;
export type NewStreak = typeof streaks.$inferInsert;

// =============================================================================
// daily_questions - 캐릭터가 매일 먼저 건네는 개인화 질문
// =============================================================================

export const dailyQuestions = pgTable(
  "daily_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    /** KST 기준 날짜 (YYYY-MM-DD). */
    questionDate: date("question_date").notNull(),
    /** 질문을 건네는 캐릭터 ID (witch | child | sage). */
    characterId: text("character_id").notNull(),
    /** AI 가 생성한 오늘의 질문 본문. */
    question: text("question").notNull(),
    model: text("model"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("daily_questions_user_date_uniq").on(t.userId, t.questionDate),
    index("daily_questions_user_date_idx").on(t.userId, t.questionDate),
  ],
);

export type DailyQuestion = typeof dailyQuestions.$inferSelect;
export type NewDailyQuestion = typeof dailyQuestions.$inferInsert;

// =============================================================================
// world_cracks - 세계 균열 수치 (사용자에게 직접 노출 금지)
// =============================================================================

export const worldCracks = pgTable("world_cracks", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  /** 현재 균열 수치 (0~100). 감소 가능. */
  crackScore: integer("crack_score").notNull().default(0),
  /** 누적 균열량 (감소 없음, 숨겨진 업적용). */
  totalAccumulated: integer("total_accumulated").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type WorldCrack = typeof worldCracks.$inferSelect;

// =============================================================================
// mood_entries - 하루 감정 기록 (1일 1회)
// =============================================================================

export const moodEntries = pgTable(
  "mood_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    /** KST 기준 날짜 (YYYY-MM-DD). */
    entryDate: date("entry_date").notNull(),
    /** great | good | neutral | tough | hard */
    mood: text("mood").notNull(),
    /** 선택적 짧은 메모 (50자 이내). */
    note: text("note"),
    /** 어디서 기록했는지: fortune | tarot | chat */
    source: text("source").notNull().default("fortune"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("mood_entries_user_date_uniq").on(t.userId, t.entryDate),
    index("mood_entries_user_date_idx").on(t.userId, t.entryDate),
  ],
);

export type MoodEntry = typeof moodEntries.$inferSelect;
export type NewMoodEntry = typeof moodEntries.$inferInsert;

// =============================================================================
// character_affinities - 캐릭터별 친밀도 포인트
// =============================================================================

export const characterAffinities = pgTable(
  "character_affinities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    /** witch | child | sage */
    characterId: text("character_id").notNull(),
    /** 누적 대화 포인트. */
    points: integer("points").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("character_affinities_user_char_uniq").on(t.userId, t.characterId),
    index("character_affinities_user_idx").on(t.userId),
  ],
);

export type CharacterAffinity = typeof characterAffinities.$inferSelect;
export type NewCharacterAffinity = typeof characterAffinities.$inferInsert;

// =============================================================================
// 모든 테이블 export
// =============================================================================

// =============================================================================
// daily_career_tips - 직장 운세 라이트 팁 일일 캐시
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
// daily_health_workouts - 건강 운세 라이트 맨몸 운동 일일 캐시
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
// daily_study_tips - 학업 운세 라이트 집중력 팁 일일 캐시
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
// daily_love_premium - 사랑 운세 라이트 일일 캐시 (오늘의 한마디 + 매력 팁)
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
// daily_iljin - 오늘의 일진 × 내 사주 라이트 일일 캐시
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
// daily_general_premium - 종합 운세 라이트 일일 캐시 (시간대별/레이더/DO·DON'T)
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
  runeReadings,
  compatibilityReadings,
  chatSessions,
  chatMessages,
  subscriptions,
  purchases,
  tossPayments,
  portonePayments,
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
