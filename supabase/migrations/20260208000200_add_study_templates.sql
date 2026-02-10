-- Add study_templates table for user-persisted templates

BEGIN;

CREATE TABLE IF NOT EXISTS public.study_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  action text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  estimated_count integer,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_timestamp ON public.study_templates;
CREATE TRIGGER trg_update_timestamp
BEFORE UPDATE ON public.study_templates
FOR EACH ROW
EXECUTE PROCEDURE public.update_timestamp();

-- Enable RLS and policies
ALTER TABLE public.study_templates ENABLE ROW LEVEL SECURITY;

-- Allow select on public templates and user's own templates
CREATE POLICY "select_templates" ON public.study_templates
FOR SELECT USING (
  is_public = true OR auth.role() = 'authenticated' AND user_id = auth.uid()
);

-- Allow insert for authenticated users
CREATE POLICY "insert_templates" ON public.study_templates
FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Allow update/delete only by owner
CREATE POLICY "modify_templates" ON public.study_templates
FOR UPDATE, DELETE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

COMMIT;