ALTER TABLE events ADD COLUMN IF NOT EXISTS main_image_url text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS main_image_fit text DEFAULT 'contain';
