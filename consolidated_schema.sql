-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Users)
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- STUDY TEMPLATES
create table if not exists public.study_templates (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  name text not null,
  description text,
  action text not null, -- 'generate-flashcards', 'generate-quiz', etc.
  payload jsonb default '{}'::jsonb, -- dynamic content for the action
  estimated_count integer,
  is_public boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- FLASHCARD DECKS
create table if not exists public.flashcard_decks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  description text,
  topic text,
  is_public boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- FLASHCARDS
create table if not exists public.flashcards (
  id uuid default uuid_generate_v4() primary key,
  deck_id uuid references public.flashcard_decks(id) on delete cascade not null,
  question text not null,
  answer text not null,
  hint text,
  times_correct integer default 0,
  times_incorrect integer default 0,
  last_reviewed_at timestamp with time zone,
  next_review_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- DAILY STREAKS
create table if not exists public.daily_streaks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null unique,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_study_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ACHIEVEMENTS
create table if not exists public.achievements (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text not null,
  icon text not null, -- emoji or icon name
  category text not null, -- 'streak', 'cards', 'accuracy', 'social'
  requirement_type text not null, -- 'streak_days', 'cards_studied', etc.
  requirement_value integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- USER ACHIEVEMENTS
create table if not exists public.user_achievements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  achievement_id uuid references public.achievements(id) on delete cascade not null,
  earned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, achievement_id)
);

-- STUDY SESSIONS
create table if not exists public.study_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  deck_id uuid references public.flashcard_decks(id) on delete set null,
  session_type text not null, -- 'flashcards', 'quiz', 'runner', etc.
  cards_studied integer default 0,
  correct_answers integer default 0,
  total_questions integer default 0,
  duration_seconds integer,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.study_templates enable row level security;
alter table public.flashcard_decks enable row level security;
alter table public.flashcards enable row level security;
alter table public.daily_streaks enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.study_sessions enable row level security;

-- POLICIES

-- Profiles: Public read, User update own
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- Templates: Public read (if is_public), User ALL (if own)
create policy "Public templates are viewable by everyone." on public.study_templates for select using (is_public = true or auth.uid() = user_id);
create policy "Users can insert own templates." on public.study_templates for insert with check (auth.uid() = user_id);
create policy "Users can update own templates." on public.study_templates for update using (auth.uid() = user_id);
create policy "Users can delete own templates." on public.study_templates for delete using (auth.uid() = user_id);

-- Decks: User ALL
create policy "Users can view own decks." on public.flashcard_decks for select using (auth.uid() = user_id);
create policy "Users can insert own decks." on public.flashcard_decks for insert with check (auth.uid() = user_id);
create policy "Users can update own decks." on public.flashcard_decks for update using (auth.uid() = user_id);
create policy "Users can delete own decks." on public.flashcard_decks for delete using (auth.uid() = user_id);

-- Flashcards: User ALL (via deck ownership)
create policy "Users can view own flashcards." on public.flashcards for select using (
  exists (select 1 from public.flashcard_decks where id = flashcards.deck_id and user_id = auth.uid())
);
create policy "Users can insert own flashcards." on public.flashcards for insert with check (
  exists (select 1 from public.flashcard_decks where id = deck_id and user_id = auth.uid())
);
create policy "Users can update own flashcards." on public.flashcards for update using (
  exists (select 1 from public.flashcard_decks where id = deck_id and user_id = auth.uid())
);
create policy "Users can delete own flashcards." on public.flashcards for delete using (
  exists (select 1 from public.flashcard_decks where id = deck_id and user_id = auth.uid())
);

-- Streaks: User read/insert/update
create policy "Users can view own streak." on public.daily_streaks for select using (auth.uid() = user_id);
create policy "Users can insert own streak." on public.daily_streaks for insert with check (auth.uid() = user_id);
create policy "Users can update own streak." on public.daily_streaks for update using (auth.uid() = user_id);

-- Achievements: Public read
create policy "Achievements are viewable by everyone." on public.achievements for select using (true);

-- User Achievements: User read/insert
create policy "Users can view own achievements." on public.user_achievements for select using (auth.uid() = user_id);
create policy "Users can insert own achievements." on public.user_achievements for insert with check (auth.uid() = user_id);

-- Study Sessions: User read/insert
create policy "Users can view own sessions." on public.study_sessions for select using (auth.uid() = user_id);
create policy "Users can insert own sessions." on public.study_sessions for insert with check (auth.uid() = user_id);

-- FUNCTIONS (for triggers if needed)
-- (Add trigger text here if specialized triggers are required, e.g. for creating profiles on signup)
