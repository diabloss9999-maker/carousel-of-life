-- 0018: 선물 재화 (별조각) — 잔액·원장·선물 기록
--
-- 되돌리기:
--   drop table if exists public.gift_logs;
--   drop table if exists public.currency_logs;
--   drop table if exists public.user_currency;

-- 유저별 별조각 잔액
create table if not exists public.user_currency (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

-- 재화 원장 — 모든 증감 기록 (구매 +, 선물 -)
create table if not exists public.currency_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta integer not null,
  -- 'purchase'(구매 충전) | 'gift'(선물 사용) | 'admin'(운영 보정)
  reason text not null,
  -- purchase: PortOne paymentId / gift: gift_logs.id
  ref_id text,
  created_at timestamptz not null default now()
);

-- 같은 결제(paymentId)로 중복 충전 방지 (멱등성)
create unique index if not exists currency_logs_purchase_unique
  on public.currency_logs (ref_id)
  where reason = 'purchase';

create index if not exists currency_logs_user_idx
  on public.currency_logs (user_id, created_at desc);

-- 멤버에게 보낸 선물 기록
create table if not exists public.gift_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  character text not null,
  gift_id text not null,
  cost integer not null,
  created_at timestamptz not null default now()
);

create index if not exists gift_logs_user_idx
  on public.gift_logs (user_id, created_at desc);

-- RLS — 본인 읽기만 허용, 쓰기는 service role 전용 (정책 없음 = 차단)
alter table public.user_currency enable row level security;
alter table public.currency_logs enable row level security;
alter table public.gift_logs enable row level security;

create policy "user_currency_select_own" on public.user_currency
  for select using (auth.uid() = user_id);

create policy "currency_logs_select_own" on public.currency_logs
  for select using (auth.uid() = user_id);

create policy "gift_logs_select_own" on public.gift_logs
  for select using (auth.uid() = user_id);
