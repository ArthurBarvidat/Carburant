-- Table profils utilisateurs
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  pseudo text,
  stripe_customer_id text,
  subscription_id text,
  subscription_status text default 'free',
  is_pro boolean default false,
  created_at timestamp with time zone default now()
);

-- Créer automatiquement un profil à l'inscription
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, pseudo)
  values (new.id, new.raw_user_meta_data->>'pseudo');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Sécurité : chaque user ne voit que son profil
alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- ============================================================
-- Tables Wolf Pro
-- ============================================================

-- Stations favorites
create table if not exists favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  station_id text not null,
  station_name text,
  station_address text,
  fuel_type text,
  last_price float,
  latitude float,
  longitude float,
  created_at timestamptz default now(),
  unique(user_id, station_id)
);
alter table favorites enable row level security;
create policy "Users manage own favorites" on favorites for all using (auth.uid() = user_id);

-- Alertes prix
create table if not exists price_alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  fuel_type text not null,
  target_price float not null,
  department text,
  city text,
  active boolean default true,
  created_at timestamptz default now()
);
alter table price_alerts enable row level security;
create policy "Users manage own alerts" on price_alerts for all using (auth.uid() = user_id);

-- Historique économies
create table if not exists savings_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  fuel_type text not null,
  best_price float not null,
  avg_price float not null,
  liters float default 50,
  saved float not null,
  city text,
  recorded_at timestamptz default now()
);
alter table savings_history enable row level security;
create policy "Users manage own savings" on savings_history for all using (auth.uid() = user_id);
