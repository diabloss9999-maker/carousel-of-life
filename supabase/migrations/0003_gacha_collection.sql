-- =============================================================================
-- 가챠 기반 카드 컬렉션 시스템
--
-- - collection_cards: 사용자가 소장한 카드 (cardId 기준 유니크)
-- - gacha_daily: KST 일일 뽑기 횟수 (무료 1회 / 프리미엄 3회)
-- 두 테이블 모두 RLS 활성화. 본인 row 만 읽고 쓸 수 있다.
-- =============================================================================

-- collection_cards
CREATE TABLE IF NOT EXISTS collection_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_category TEXT NOT NULL,
  card_id TEXT NOT NULL,
  obtained_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT collection_cards_user_card_uniq UNIQUE (user_id, card_id)
);

CREATE INDEX IF NOT EXISTS collection_cards_user_idx
  ON collection_cards(user_id);

ALTER TABLE collection_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_own" ON collection_cards;
CREATE POLICY "user_own" ON collection_cards
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- gacha_daily
CREATE TABLE IF NOT EXISTS gacha_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pull_date DATE NOT NULL,
  pull_count INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT gacha_daily_user_date_uniq UNIQUE (user_id, pull_date)
);

ALTER TABLE gacha_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_own" ON gacha_daily;
CREATE POLICY "user_own" ON gacha_daily
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
