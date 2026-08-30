-- Dodaje niezależny sposób wyświetlania tej samej grafiki na stronie szczegółów eventu
ALTER TABLE events
ADD COLUMN IF NOT EXISTS main_image_fit text DEFAULT 'contain';
