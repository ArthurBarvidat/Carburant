-- Table profils utilisateurs
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  pseudo text,
  stripe_customer_id text,
  subscription_id text,
  subscription_status text default 'free',
  is_pro boolean default false,
  created_at timestamp with time zone default now(),
  last_seen timestamptz,
  avatar_url text,
  rgpd_consent boolean default false
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

-- Les amis peuvent voir le profil
create policy "Friends can view profiles"
  on profiles for select using (
    auth.uid() = id or
    exists (
      select 1 from friends
      where status = 'accepted'
      and ((user_id = auth.uid() and friend_id = id) or (friend_id = auth.uid() and user_id = id))
    )
  );

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

-- ============================================================
-- Amis
-- ============================================================

create table if not exists friends (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  friend_id uuid references auth.users(id) on delete cascade,
  status text default 'pending',
  created_at timestamptz default now(),
  unique(user_id, friend_id)
);
alter table friends enable row level security;
create policy "Users manage own friendships" on friends for all using (
  auth.uid() = user_id or auth.uid() = friend_id
);

-- ============================================================
-- Chat entre amis (nouveauté)
-- ============================================================

create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references auth.users(id) on delete cascade,
  receiver_id uuid references auth.users(id) on delete cascade,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);
alter table messages enable row level security;
create policy "Users manage own messages" on messages for all using (
  auth.uid() = sender_id or auth.uid() = receiver_id
);

-- ============================================================
-- Véhicule utilisateur (nouveauté)
-- ============================================================

create table if not exists vehicles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade unique,
  marque text,
  modele text,
  annee int,
  carburant text default 'Gazole',
  capacite_reservoir float default 50,
  consommation float default 7,
  immatriculation text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table vehicles enable row level security;
create policy "Users manage own vehicle" on vehicles for all using (auth.uid() = user_id);

-- ============================================================
-- Historique des pleins (nouveauté)
-- ============================================================

create table if not exists fill_ups (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  station_name text,
  station_address text,
  fuel_type text not null,
  price_per_liter float not null,
  liters float not null,
  total_cost float not null,
  km_before float,
  km_after float,
  notes text,
  created_at timestamptz default now()
);
alter table fill_ups enable row level security;
create policy "Users manage own fill_ups" on fill_ups for all using (auth.uid() = user_id);

-- ============================================================
-- Badges et récompenses (nouveauté)
-- ============================================================

create table if not exists badges (
  id text primary key,
  name text not null,
  description text not null,
  icon text not null,
  condition_type text not null, -- 'fill_ups_count', 'savings_total', 'friends_count', 'streak_days'
  condition_value float not null
);

create table if not exists user_badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  badge_id text references badges(id),
  earned_at timestamptz default now(),
  unique(user_id, badge_id)
);
alter table user_badges enable row level security;
create policy "Users view own badges" on user_badges for all using (auth.uid() = user_id);

-- Badges de base
insert into badges (id, name, description, icon, condition_type, condition_value) values
  ('first_fill', 'Premier plein', 'Tu as enregistré ton premier plein !', '⛽', 'fill_ups_count', 1),
  ('fill_10', '10 pleins', 'Tu as enregistré 10 pleins !', '🏆', 'fill_ups_count', 10),
  ('fill_50', '50 pleins', 'Expert de la pompe !', '🎖️', 'fill_ups_count', 50),
  ('savings_10', '10€ économisés', 'Tu as économisé 10€ au total', '💰', 'savings_total', 10),
  ('savings_50', '50€ économisés', 'Tu as économisé 50€ au total', '💵', 'savings_total', 50),
  ('savings_100', '100€ économisés', 'Maître des économies !', '🤑', 'savings_total', 100),
  ('savings_500', '500€ économisés', 'Légende de l'économie !', '👑', 'savings_total', 500),
  ('friend_1', 'Premier ami', 'Tu as ajouté ton premier ami', '👥', 'friends_count', 1),
  ('friend_5', '5 amis', 'Tu as 5 amis sur WolfFuel', '🤝', 'friends_count', 5),
  ('wolf_pro', 'Wolf Pro', 'Abonné Wolf Pro', '🐺⭐', 'is_pro', 1)
on conflict (id) do nothing;

-- ============================================================
-- Signalements prix communautaires (nouveauté)
-- ============================================================

create table if not exists community_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  station_id text not null,
  station_name text,
  fuel_type text not null,
  reported_price float not null,
  official_price float,
  confirmed_count int default 0,
  status text default 'pending', -- 'pending', 'confirmed', 'rejected'
  created_at timestamptz default now()
);
alter table community_reports enable row level security;
create policy "Anyone can view reports" on community_reports for select using (true);
create policy "Users manage own reports" on community_reports for insert using (auth.uid() = user_id);

-- ============================================================
-- Rappels entretien véhicule (nouveauté)
-- ============================================================

create table if not exists maintenance_reminders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  type text not null, -- 'vidange', 'pneus', 'revision', 'controle_technique', 'autre'
  label text not null,
  due_km float,
  due_date date,
  current_km float,
  done boolean default false,
  created_at timestamptz default now()
);
alter table maintenance_reminders enable row level security;
create policy "Users manage own reminders" on maintenance_reminders for all using (auth.uid() = user_id);
