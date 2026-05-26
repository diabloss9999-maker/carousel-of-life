-- ============================================================================
-- 0013_chat_message_metadata.sql
--
-- chat_messages.metadata 컬럼 추가 — 점술 카드 등 메시지 부가 데이터 영속화.
-- 이전에는 카드 메타가 컴포넌트 state 에만 있어 페이지 리로드 시 사라졌음.
-- ============================================================================

ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS metadata jsonb;

COMMENT ON COLUMN chat_messages.metadata IS
  '메시지 부가 데이터. 점술 카드 메타: { cards: DrawnCardMeta[] }';
