-- Add AI analysis column to submissions
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS ai_analysis jsonb DEFAULT NULL;

-- Add unique constraint to prevent duplicate submissions per hackathon
ALTER TABLE submissions ADD CONSTRAINT unique_user_hackathon UNIQUE (user_id, hackathon_id);