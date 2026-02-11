-- Create achievements table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('streak', 'cards', 'accuracy', 'social')),
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

-- Create deck_invitations table
CREATE TABLE public.deck_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id UUID NOT NULL REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL,
  invitee_email TEXT,
  invitee_id UUID,
  access_level TEXT NOT NULL DEFAULT 'view' CHECK (access_level IN ('view', 'edit', 'admin')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shared_deck_access table
CREATE TABLE public.shared_deck_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id UUID NOT NULL REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  access_level TEXT NOT NULL DEFAULT 'view' CHECK (access_level IN ('view', 'edit', 'admin')),
  granted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (deck_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_deck_access ENABLE ROW LEVEL SECURITY;

-- Achievements are readable by everyone (public catalog)
CREATE POLICY "Achievements are viewable by everyone" 
ON public.achievements 
FOR SELECT 
USING (true);

-- User achievements policies
CREATE POLICY "Users can view their own achievements" 
ON public.user_achievements 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can earn achievements" 
ON public.user_achievements 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Deck invitations policies
CREATE POLICY "Users can view invitations they sent" 
ON public.deck_invitations 
FOR SELECT 
USING (auth.uid() = inviter_id);

CREATE POLICY "Users can view invitations sent to them" 
ON public.deck_invitations 
FOR SELECT 
USING (auth.uid() = invitee_id);

CREATE POLICY "Users can create invitations for their decks" 
ON public.deck_invitations 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM flashcard_decks 
  WHERE flashcard_decks.id = deck_id 
  AND flashcard_decks.user_id = auth.uid()
));

CREATE POLICY "Users can update invitations sent to them" 
ON public.deck_invitations 
FOR UPDATE 
USING (auth.uid() = invitee_id);

CREATE POLICY "Users can delete their own invitations" 
ON public.deck_invitations 
FOR DELETE 
USING (auth.uid() = inviter_id);

-- Shared deck access policies
CREATE POLICY "Users can view their own deck access" 
ON public.shared_deck_access 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Deck owners can view all access for their decks" 
ON public.shared_deck_access 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM flashcard_decks 
  WHERE flashcard_decks.id = deck_id 
  AND flashcard_decks.user_id = auth.uid()
));

CREATE POLICY "Users can insert their own access records" 
ON public.shared_deck_access 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Deck owners can manage access for their decks" 
ON public.shared_deck_access 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM flashcard_decks 
  WHERE flashcard_decks.id = deck_id 
  AND flashcard_decks.user_id = auth.uid()
));

CREATE POLICY "Deck owners can revoke access for their decks" 
ON public.shared_deck_access 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM flashcard_decks 
  WHERE flashcard_decks.id = deck_id 
  AND flashcard_decks.user_id = auth.uid()
));

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, category, requirement_type, requirement_value) VALUES
  ('First Steps', 'Complete your first study session', '🎯', 'cards', 'sessions', 1),
  ('Dedicated Learner', 'Complete 10 study sessions', '📚', 'cards', 'sessions', 10),
  ('Study Master', 'Complete 50 study sessions', '🏆', 'cards', 'sessions', 50),
  ('Day 1', 'Start your study streak', '🔥', 'streak', 'streak_days', 1),
  ('Week Warrior', 'Maintain a 7-day streak', '💪', 'streak', 'streak_days', 7),
  ('Monthly Champion', 'Maintain a 30-day streak', '👑', 'streak', 'streak_days', 30),
  ('Sharp Mind', 'Score 80% accuracy on a test', '🧠', 'accuracy', 'accuracy_percent', 80),
  ('Perfect Score', 'Score 100% on a test', '⭐', 'accuracy', 'accuracy_percent', 100),
  ('Social Butterfly', 'Share your first deck', '🦋', 'social', 'decks_shared', 1),
  ('Community Builder', 'Share 5 decks with others', '🤝', 'social', 'decks_shared', 5);

-- Create trigger for updated_at on deck_invitations
CREATE TRIGGER update_deck_invitations_updated_at
BEFORE UPDATE ON public.deck_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();