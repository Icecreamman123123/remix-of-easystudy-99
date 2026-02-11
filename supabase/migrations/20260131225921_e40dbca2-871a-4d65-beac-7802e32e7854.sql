-- Create shared_decks table for deck sharing functionality
CREATE TABLE public.shared_decks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id UUID NOT NULL REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL,
  share_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create deck_copies table to track when users copy shared decks
CREATE TABLE public.deck_copies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_deck_id UUID NOT NULL,
  copied_deck_id UUID NOT NULL REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  copied_by UUID NOT NULL,
  copied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shared_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_copies ENABLE ROW LEVEL SECURITY;

-- RLS policies for shared_decks
CREATE POLICY "Users can create shares for their own decks"
  ON public.shared_decks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.flashcard_decks
      WHERE id = deck_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own shares"
  ON public.shared_decks
  FOR SELECT
  USING (shared_by = auth.uid());

CREATE POLICY "Anyone can view public shares by share_code"
  ON public.shared_decks
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can delete their own shares"
  ON public.shared_decks
  FOR DELETE
  USING (shared_by = auth.uid());

-- RLS policies for deck_copies
CREATE POLICY "Users can create their own copies"
  ON public.deck_copies
  FOR INSERT
  WITH CHECK (copied_by = auth.uid());

CREATE POLICY "Users can view their own copies"
  ON public.deck_copies
  FOR SELECT
  USING (copied_by = auth.uid());