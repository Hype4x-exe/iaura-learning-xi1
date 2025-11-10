-- Create user_preferences table for theme and display settings
create table public.user_preferences (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  theme text default 'vibrant' check (theme in ('vibrant', 'ocean', 'sunset', 'forest', 'purple', 'rose')),
  dark_mode boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.user_preferences enable row level security;

-- Create policies
create policy "Users can view their own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can update their own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can insert their own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

-- Create index for faster lookups
create index idx_user_preferences_user_id on public.user_preferences(user_id);
