/*
  # Create shared notes tables

  1. New Tables
    - `shared_notes`
      - `id` (uuid, primary key)
      - `video_id` (text, not null)
      - `author_name` (text, not null)
      - `notes` (jsonb, not null)
      - `created_at` (timestamp)
      - `share_id` (text, unique) - for public URL sharing

  2. Security
    - Enable RLS on `shared_notes` table
    - Add policies for:
      - Anyone can read shared notes
      - Authenticated users can create shared notes
*/

CREATE TABLE IF NOT EXISTS shared_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id text NOT NULL,
  author_name text NOT NULL,
  notes jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  share_id text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(9), 'base64')
);

ALTER TABLE shared_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read shared notes"
  ON shared_notes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create shared notes"
  ON shared_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);