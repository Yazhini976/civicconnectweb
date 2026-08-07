ALTER TABLE complaints ADD COLUMN IF NOT EXISTS pole_number character varying(100);
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS feedback_rating character varying(50);
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS feedback_comments text;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS feedback_submitted_at timestamp without time zone;

-- Migrate data from feedback table
UPDATE complaints c
SET 
    feedback_rating = f.rating,
    feedback_comments = f.comment,
    feedback_submitted_at = f.created_at
FROM feedback f
WHERE c.complaint_id::text = f.complaint_id;

-- Drop feedback table safely
DROP TABLE IF EXISTS feedback;
