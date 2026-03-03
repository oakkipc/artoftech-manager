-- Create rate_limits table
CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY,
    points INTEGER DEFAULT 0 NOT NULL,
    expire_at TIMESTAMPTZ NOT NULL
);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_expire_at ON rate_limits (expire_at);

-- Function to cleanup expired rate limits (optional, can be called via cron or manually)
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void AS $$
BEGIN
    DELETE FROM rate_limits WHERE expire_at < NOW();
END;
$$ LANGUAGE plpgsql;
