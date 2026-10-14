-- Count tries on the server so a page refresh cannot reset them
ALTER TABLE learning_progress ADD COLUMN pending_attempts INT NOT NULL DEFAULT 0;
