-- KisanSetu Supabase schema
-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run.

-- 1. Profiles: one row per authenticated user, holding their role.
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'field' check (role in ('field', 'admin')),
  created_at timestamptz default now()
);

-- 2. Farmers
create table if not exists farmers (
  id text primary key,
  name text not null,
  mobile text not null,
  gender text,
  age text,
  pan text,
  aadhaar text,
  kcc text,
  qualification text,
  family_members text,
  family_income text,
  address text,
  village text,
  district text,
  state text,
  photo text,
  created_by uuid references auth.users (id),
  created_at timestamptz default now()
);

-- 3. Farms
create table if not exists farms (
  id text primary key,
  farmer_id text references farmers (id) on delete cascade,
  title text,
  area text,
  area_unit text,
  topography text,
  geo_tag text,
  tractor boolean default false,
  hire_labour boolean default false,
  irrigation text,
  tube_well boolean default false,
  created_by uuid references auth.users (id),
  created_at timestamptz default now()
);

-- 4. Crops
create table if not exists crops (
  id text primary key,
  farm_id text references farms (id) on delete cascade,
  name text,
  season text,
  sowing_date text,
  harvest_date text,
  yield text,
  sprays text,
  fertilizer text,
  created_by uuid references auth.users (id),
  created_at timestamptz default now()
);

-- 5. Media (photo/audio references captured against a farm)
create table if not exists media (
  id text primary key,
  farm_id text references farms (id) on delete cascade,
  type text,
  url text,
  name text,
  created_by uuid references auth.users (id),
  created_at timestamptz default now()
);

-- Row Level Security -----------------------------------------------------
alter table profiles enable row level security;
alter table farmers enable row level security;
alter table farms enable row level security;
alter table crops enable row level security;
alter table media enable row level security;

-- Profiles: a user can read/update only their own row.
create policy "profiles: read own" on profiles for select using (auth.uid() = id);
create policy "profiles: update own" on profiles for update using (auth.uid() = id);
create policy "profiles: insert own" on profiles for insert with check (auth.uid() = id);

-- Farmers / Farms / Crops / Media: any signed-in user (field or admin)
-- can read everything and write their own entries. Tighten this later if
-- you want field users to only see their own captures.
create policy "farmers: read all authenticated" on farmers for select using (auth.role() = 'authenticated');
create policy "farmers: insert own" on farmers for insert with check (auth.role() = 'authenticated');
create policy "farmers: update own" on farmers for update using (auth.role() = 'authenticated');

create policy "farms: read all authenticated" on farms for select using (auth.role() = 'authenticated');
create policy "farms: insert own" on farms for insert with check (auth.role() = 'authenticated');
create policy "farms: update own" on farms for update using (auth.role() = 'authenticated');

create policy "crops: read all authenticated" on crops for select using (auth.role() = 'authenticated');
create policy "crops: insert own" on crops for insert with check (auth.role() = 'authenticated');
create policy "crops: update own" on crops for update using (auth.role() = 'authenticated');

create policy "media: read all authenticated" on media for select using (auth.role() = 'authenticated');
create policy "media: insert own" on media for insert with check (auth.role() = 'authenticated');
create policy "media: update own" on media for update using (auth.role() = 'authenticated');

-- Auto-create a profile row (role: field) whenever a new user signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'field')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
