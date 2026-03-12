-- Auto-snapshot daily balance when trading_accounts is upserted
-- Uses Bangkok time (UTC+7) for date

create or replace function snapshot_daily_trading()
returns trigger as $$
declare
  today date;
begin
  -- วันปัจจุบัน Bangkok time (UTC+7)
  today := (now() at time zone 'Asia/Bangkok')::date;

  -- Insert snapshot ถ้ายังไม่มีของวันนี้
  insert into trading_daily_snapshots (account_id, date, equity, balance)
  values (NEW.account_id::text, today, NEW.equity, NEW.balance)
  on conflict (account_id, date) do nothing;

  return NEW;
end;
$$ language plpgsql;

-- Attach trigger to trading_accounts
drop trigger if exists trg_snapshot_daily on trading_accounts;
create trigger trg_snapshot_daily
  after insert or update on trading_accounts
  for each row execute function snapshot_daily_trading();
