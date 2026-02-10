-- Fix missing columns in partner table
ALTER TABLE partner ADD COLUMN photo_file_id VARCHAR;
ALTER TABLE partner ADD COLUMN level INTEGER DEFAULT 1;
ALTER TABLE partner ADD COLUMN total_earned_usdt FLOAT DEFAULT 0.0;
ALTER TABLE partner ADD COLUMN referral_count INTEGER DEFAULT 0;

-- Ensure constraints (SQLite doesn't support ADD CONSTRAINT on existing table easily, but we can update defaults)
UPDATE partner SET level = 1 WHERE level IS NULL;
UPDATE partner SET total_earned_usdt = 0.0 WHERE total_earned_usdt IS NULL;
UPDATE partner SET referral_count = 0 WHERE referral_count IS NULL;
