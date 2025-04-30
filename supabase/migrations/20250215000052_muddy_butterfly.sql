/*
  # Add pin code and video indexing features

  1. Changes
    - Add `pin_code` column to `shared_notes` table
    - Add index on `video_id` for faster lookups
    - Add function to verify pin code

  2. Security
    - Add policy for authors to update their notes with pin code
*/

-- Add pin_code column
ALTER TABLE shared_notes
ADD COLUMN IF NOT EXISTS pin_code text;

-- Create index for video discovery
CREATE INDEX IF NOT EXISTS shared_notes_video_id_idx ON shared_notes(video_id);

-- Create function to verify pin code
CREATE OR REPLACE FUNCTION verify_pin_code(note_id uuid, provided_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM shared_notes
    WHERE id = note_id
    AND pin_code = provided_pin
  );
END;
$$;

-- Add policy for updating with pin code
CREATE POLICY "Authors can update their notes with pin code"
  ON shared_notes
  FOR UPDATE
  TO public
  USING (
    verify_pin_code(id, current_setting('app.pin_code', true))
  )
  WITH CHECK (
    verify_pin_code(id, current_setting('app.pin_code', true))
  );