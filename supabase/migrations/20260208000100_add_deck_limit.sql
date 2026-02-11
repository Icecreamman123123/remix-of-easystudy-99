-- Enforce maximum 10 custom decks per user via trigger

CREATE OR REPLACE FUNCTION public.check_deck_limit()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Count existing decks for the user
  PERFORM 1 FROM public.flashcard_decks WHERE user_id = NEW.user_id;

  IF (SELECT COUNT(*) FROM public.flashcard_decks WHERE user_id = NEW.user_id) >= 10 THEN
    RAISE EXCEPTION 'deck_limit_exceeded: users may only create up to 10 decks';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_deck_limit ON public.flashcard_decks;
CREATE TRIGGER trg_check_deck_limit
BEFORE INSERT ON public.flashcard_decks
FOR EACH ROW EXECUTE FUNCTION public.check_deck_limit();
