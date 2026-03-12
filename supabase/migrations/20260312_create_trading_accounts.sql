-- Trading accounts table (migrated from standalone AOT Dashboard)
create table if not exists trading_accounts (
  id bigserial primary key,
  account_id text not null,
  account_name text not null,
  equity numeric not null default 0,
  balance numeric not null default 0,
  profit numeric default 0,
  is_usc boolean not null default false,
  is_demo boolean not null default false,
  total_lots numeric default 0,
  buy_count integer default 0,
  sell_count integer default 0,
  buy_profit numeric default 0,
  sell_profit numeric default 0,
  updated_at timestamptz not null default now(),
  constraint trading_accounts_account_id_key unique (account_id)
);

-- Enable realtime
alter publication supabase_realtime add table trading_accounts;

-- RLS: allow read for all authenticated users
alter table trading_accounts enable row level security;

create policy "Allow read for authenticated"
  on trading_accounts for select
  using (auth.role() = 'authenticated' or auth.role() = 'anon');

create policy "Allow all for service role"
  on trading_accounts for all
  using (true);
