-- Create daily_streaks table to track user study streaks
CREATE TABLE public.daily_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_study_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create achievements table with predefined achievement types
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT, -- emoji or icon identifier
  category TEXT NOT NULL, -- 'streak', 'cards', 'accuracy', 'social'
  requirement_type TEXT NOT NULL, -- 'streak_days', 'cards_studied', 'sessions_completed', 'accuracy_percent', 'social_shares'
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_achievements to track which achievements user has earned
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Create deck_invitations table for sharing decks with other users
CREATE TABLE public.deck_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email TEXT, -- for email-based invitations
  invitee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- if inviting existing user
  access_level TEXT NOT NULL DEFAULT 'view' CHECK (access_level IN ('view', 'edit', 'admin')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shared_deck_access to track who has access to shared decks
CREATE TABLE public.shared_deck_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL DEFAULT 'view' CHECK (access_level IN ('view', 'edit', 'admin')),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(deck_id, user_id)
);

-- Enable RLS on new tables
ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_deck_access ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_streaks
CREATE POLICY "Users can view their own streak"
ON public.daily_streaks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own streak"
ON public.daily_streaks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak"
ON public.daily_streaks FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for achievements (public read, users can view all achievements)
CREATE POLICY "Anyone can view achievements"
ON public.achievements FOR SELECT
USING (true);

-- RLS policies for user_achievements
CREATE POLICY "Users can view their own achievements"
ON public.user_achievements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own achievements"
ON public.user_achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS policies for deck_invitations
CREATE POLICY "Users can view their received invitations"
ON public.deck_invitations FOR SELECT
USING (auth.uid() = invitee_id OR auth.uid() = inviter_id);

CREATE POLICY "Users can create invitations for their decks"
ON public.deck_invitations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.flashcard_decks
    WHERE id = deck_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their received invitations"
ON public.deck_invitations FOR UPDATE
USING (auth.uid() = invitee_id);

CREATE POLICY "Deck owners can update invitations they sent"
ON public.deck_invitations FOR UPDATE
USING (auth.uid() = inviter_id);

CREATE POLICY "Deck owners can delete their invitations"
ON public.deck_invitations FOR DELETE
USING (auth.uid() = inviter_id);

-- RLS policies for shared_deck_access
CREATE POLICY "Users can view shared decks they have access to"
ON public.shared_deck_access FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Deck owners can manage shared access"
ON public.shared_deck_access FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.flashcard_decks
    WHERE id = deck_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Deck owners can update shared access"
ON public.shared_deck_access FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.flashcard_decks
    WHERE id = deck_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Deck owners can delete shared access"
ON public.shared_deck_access FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.flashcard_decks
    WHERE id = deck_id AND user_id = auth.uid()
  )
);

-- Create triggers for timestamp updates
CREATE TRIGGER update_daily_streaks_updated_at
BEFORE UPDATE ON public.daily_streaks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deck_invitations_updated_at
BEFORE UPDATE ON public.deck_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, category, requirement_type, requirement_value) VALUES
  ('First Step', 'Complete your first study session', '🎯', 'streak', 'sessions_completed', 1),
  ('Week Warrior', 'Maintain a 7-day study streak', '🔥', 'streak', 'streak_days', 7),
  ('Month Master', 'Maintain a 30-day study streak', '⭐', 'streak', 'streak_days', 30),
  ('Century Champion', 'Maintain a 100-day study streak', '👑', 'streak', 'streak_days', 100),
  ('Card Collector', 'Study 100 flashcards', '📚', 'cards', 'cards_studied', 100),
  ('Library Builder', 'Study 500 flashcards', '🏛️', 'cards', 'cards_studied', 500),
  ('Knowledge Master', 'Study 1000 flashcards', '🧠', 'cards', 'cards_studied', 1000),
  ('Accuracy Expert', 'Achieve 90% accuracy on a test', '🎯', 'accuracy', 'accuracy_percent', 90),
  ('Share the Knowledge', 'Send 5 deck invitations', '🤝', 'social', 'social_shares', 5);

-- Create function to update streak on study session completion
CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_today DATE;
  v_last_study_date DATE;
  v_current_streak INTEGER;
BEGIN
  v_user_id := NEW.user_id;
  v_today := CURRENT_DATE;
  
  -- Get or create streak record
  INSERT INTO public.daily_streaks (user_id, current_streak, last_study_date)
  VALUES (v_user_id, 0, NULL)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Get current streak info
  SELECT last_study_date, current_streak 
  INTO v_last_study_date, v_current_streak
  FROM public.daily_streaks
  WHERE user_id = v_user_id;
  
  -- Update streak based on last study date
  IF v_last_study_date IS NULL THEN
    -- First study session
    UPDATE public.daily_streaks
    SET current_streak = 1, last_study_date = v_today
    WHERE user_id = v_user_id;
  ELSIF v_last_study_date = v_today THEN
    -- Already studied today, no change to streak
    NULL;
  ELSIF v_last_study_date = v_today - INTERVAL '1 day' THEN
    -- Studied yesterday, increment streak
    UPDATE public.daily_streaks
    SET current_streak = current_streak + 1, last_study_date = v_today
    WHERE user_id = v_user_id;
  ELSE
    -- Streak broken, reset to 1
    UPDATE public.daily_streaks
    SET current_streak = 1, last_study_date = v_today
    WHERE user_id = v_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update streak on new study session
CREATE TRIGGER trigger_update_streak_on_study
AFTER INSERT ON public.study_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_user_streak();

-- Create function to award achievements based on progress
CREATE OR REPLACE FUNCTION public.check_and_award_achievements(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_achievement RECORD;
  v_value INTEGER;
BEGIN
  -- Check each achievement requirement
  FOR v_achievement IN SELECT * FROM public.achievements LOOP
    
    -- Get current value for this user based on requirement type
    CASE v_achievement.requirement_type
      WHEN 'streak_days' THEN
        SELECT COALESCE(current_streak, 0) INTO v_value
        FROM public.daily_streaks WHERE user_id = p_user_id;
      
      WHEN 'cards_studied' THEN
        SELECT COALESCE(SUM(cards_studied), 0) INTO v_value
        FROM public.study_sessions WHERE user_id = p_user_id;
      
      WHEN 'sessions_completed' THEN
        SELECT COALESCE(COUNT(*), 0) INTO v_value
        FROM public.study_sessions WHERE user_id = p_user_id;
      
      WHEN 'accuracy_percent' THEN
        SELECT COALESCE(ROUND(100.0 * SUM(correct_answers) / NULLIF(SUM(total_questions), 0)), 0) INTO v_value
        FROM public.study_sessions WHERE user_id = p_user_id;
      
      WHEN 'social_shares' THEN
        SELECT COALESCE(COUNT(*), 0) INTO v_value
        FROM public.deck_invitations WHERE inviter_id = p_user_id AND status = 'accepted';
      
      ELSE
        v_value := 0;
    END CASE;
    
    -- Award achievement if requirement met and not already awarded
    IF v_value >= v_achievement.requirement_value THEN
      INSERT INTO public.user_achievements (user_id, achievement_id)
      VALUES (p_user_id, v_achievement.id)
      ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
