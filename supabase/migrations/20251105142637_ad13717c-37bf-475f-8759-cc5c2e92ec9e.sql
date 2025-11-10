-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table for user data
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  study_streak integer default 0,
  last_study_date date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create materials table
create table public.materials (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text not null,
  source_type text not null check (source_type in ('upload', 'paste', 'ai_generated')),
  file_url text,
  summary text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create notes table
create table public.notes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  material_id uuid references public.materials(id) on delete cascade,
  title text not null,
  content text not null,
  key_points jsonb,
  examples jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create flashcards table
create table public.flashcards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  material_id uuid references public.materials(id) on delete cascade,
  question text not null,
  answer text not null,
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  next_review_date timestamp with time zone default now(),
  review_count integer default 0,
  ease_factor numeric default 2.5,
  interval_days integer default 0,
  is_starred boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create quizzes table
create table public.quizzes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  material_id uuid references public.materials(id) on delete cascade,
  title text not null,
  created_at timestamp with time zone default now()
);

-- Create questions table
create table public.questions (
  id uuid default uuid_generate_v4() primary key,
  quiz_id uuid references public.quizzes(id) on delete cascade not null,
  question_text text not null,
  question_type text not null check (question_type in ('multiple_choice', 'true_false', 'short_answer')),
  options jsonb,
  correct_answer text not null,
  explanation text,
  created_at timestamp with time zone default now()
);

-- Create quiz_attempts table
create table public.quiz_attempts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  quiz_id uuid references public.quizzes(id) on delete cascade not null,
  score numeric,
  total_questions integer,
  time_taken integer,
  completed_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.materials enable row level security;
alter table public.notes enable row level security;
alter table public.flashcards enable row level security;
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.quiz_attempts enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Materials policies
create policy "Users can view their own materials"
  on public.materials for select
  using (auth.uid() = user_id);

create policy "Users can insert their own materials"
  on public.materials for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own materials"
  on public.materials for update
  using (auth.uid() = user_id);

create policy "Users can delete their own materials"
  on public.materials for delete
  using (auth.uid() = user_id);

-- Notes policies
create policy "Users can view their own notes"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own notes"
  on public.notes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notes"
  on public.notes for delete
  using (auth.uid() = user_id);

-- Flashcards policies
create policy "Users can view their own flashcards"
  on public.flashcards for select
  using (auth.uid() = user_id);

create policy "Users can insert their own flashcards"
  on public.flashcards for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own flashcards"
  on public.flashcards for update
  using (auth.uid() = user_id);

create policy "Users can delete their own flashcards"
  on public.flashcards for delete
  using (auth.uid() = user_id);

-- Quizzes policies
create policy "Users can view their own quizzes"
  on public.quizzes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own quizzes"
  on public.quizzes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own quizzes"
  on public.quizzes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own quizzes"
  on public.quizzes for delete
  using (auth.uid() = user_id);

-- Questions policies (users can view questions for their quizzes)
create policy "Users can view questions for their quizzes"
  on public.questions for select
  using (
    exists (
      select 1 from public.quizzes
      where quizzes.id = questions.quiz_id
      and quizzes.user_id = auth.uid()
    )
  );

create policy "Users can insert questions for their quizzes"
  on public.questions for insert
  with check (
    exists (
      select 1 from public.quizzes
      where quizzes.id = quiz_id
      and quizzes.user_id = auth.uid()
    )
  );

-- Quiz attempts policies
create policy "Users can view their own quiz attempts"
  on public.quiz_attempts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own quiz attempts"
  on public.quiz_attempts for insert
  with check (auth.uid() = user_id);

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

-- Trigger to create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Triggers for updated_at
create trigger update_profiles_updated_at before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

create trigger update_materials_updated_at before update on public.materials
  for each row execute procedure public.update_updated_at_column();

create trigger update_notes_updated_at before update on public.notes
  for each row execute procedure public.update_updated_at_column();

create trigger update_flashcards_updated_at before update on public.flashcards
  for each row execute procedure public.update_updated_at_column();