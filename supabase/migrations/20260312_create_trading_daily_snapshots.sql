-- Daily balance snapshots for tracking daily P&L
create table if not exists trading_daily_snapshots (
  id bigserial primary key,
  account_id text not null,
  date date not null,
  equity numeric not null,
  balance numeric not null,
  created_at timestamptz not null default now(),
  constraint trading_daily_snapshots_account_date_key unique (account_id, date)
);

alter table trading_daily_snapshots enable row level security;

create policy "Allow read for all"
  on trading_daily_snapshots for select
  using (true);

create policy "Allow insert/update for all"
  on trading_daily_snapshots for all
  using (true);
