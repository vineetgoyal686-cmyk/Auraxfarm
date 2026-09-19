-- AuraxFarm Supabase schema
-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run.

-- 1. Profiles: one row per authenticated user, holding their role.
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  name text,
  role text not null default 'field' check (role in ('field', 'admin')),
  active boolean not null default true,
  avatar_url text,
  created_at timestamptz default now()
);

-- If this table already exists from an earlier version of this schema, run:
alter table profiles add column if not exists active boolean not null default true;
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists name text;

-- 2. Farmers
-- The id is assigned server-side from farmer_id_seq (see below) rather
-- than being generated client-side, so it's guaranteed unique and truly
-- sequential no matter how many devices are creating farmers offline at
-- once. Field app inserts omit `id` entirely for a brand-new farmer so
-- this default kicks in; see src/lib/sync.js insertFarmerWithServerId.
create sequence if not exists farmer_id_seq;

create table if not exists farmers (
  id text primary key default ('FRM-' || nextval('farmer_id_seq')),
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
  total_farms text,
  total_farm_area text,
  total_farm_area_unit text,
  documents jsonb default '[]'::jsonb,
  created_by uuid references auth.users (id),
  created_at timestamptz default now()
);

alter table farmers add column if not exists total_farms text;
alter table farmers add column if not exists total_farm_area text;
alter table farmers add column if not exists total_farm_area_unit text;
alter table farmers add column if not exists documents jsonb default '[]'::jsonb;
alter table farmers alter column id set default ('FRM-' || nextval('farmer_id_seq'));

-- If you already have farmers with hand-picked/random ids, run this once
-- so farmer_id_seq continues after the highest existing FRM-<n> id
-- instead of restarting at 1 and colliding with one of them.
select setval(
  'farmer_id_seq',
  coalesce((select max(substring(id from 5)::bigint) from farmers where id ~ '^FRM-[0-9]+$'), 0)
);

-- 3. Farms (displayed in the UI as "Land"). Same server-assigned-id
-- pattern as farmers: id comes from land_id_seq, never from the client,
-- so it's collision-free across any number of devices. New land records
-- use the LAND- prefix; that's a different prefix from the legacy
-- FARM-<n> ids some rows may already have, so there's no clash to guard
-- against with a setval here the way there was for farmers/crops.
create sequence if not exists land_id_seq;

create table if not exists farms (
  id text primary key default ('LAND-' || nextval('land_id_seq')),
  farmer_id text references farmers (id) on update cascade on delete cascade,
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

alter table farms alter column id set default ('LAND-' || nextval('land_id_seq'));

-- If farms already exists from an earlier version without ON UPDATE
-- CASCADE, this lets a farmer's id be changed (e.g. renumbering) without
-- manually re-pointing every linked farm row by hand.
alter table farms drop constraint if exists farms_farmer_id_fkey;
alter table farms add constraint farms_farmer_id_fkey
  foreign key (farmer_id) references farmers (id) on update cascade on delete cascade;

-- 4. Crops
-- Crop ids already used the CR- prefix locally, so (unlike land) the
-- sequence here DOES need to continue after any existing CR-<n> id to
-- avoid handing out one that's already taken.
create sequence if not exists crop_id_seq;

create table if not exists crops (
  id text primary key default ('CR-' || nextval('crop_id_seq')),
  farm_id text references farms (id) on update cascade on delete cascade,
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

alter table crops alter column id set default ('CR-' || nextval('crop_id_seq'));

alter table crops drop constraint if exists crops_farm_id_fkey;
alter table crops add constraint crops_farm_id_fkey
  foreign key (farm_id) references farms (id) on update cascade on delete cascade;

select setval(
  'crop_id_seq',
  coalesce((select max(substring(id from 4)::bigint) from crops where id ~ '^CR-[0-9]+$'), 0)
);

-- Row Level Security -----------------------------------------------------
alter table profiles enable row level security;
alter table farmers enable row level security;
alter table farms enable row level security;
alter table crops enable row level security;

-- Profiles: a user can read/update only their own row.
drop policy if exists "profiles: read own" on profiles;
create policy "profiles: read own" on profiles for select using (auth.uid() = id);
drop policy if exists "profiles: update own" on profiles;
create policy "profiles: update own" on profiles for update using (auth.uid() = id);
drop policy if exists "profiles: insert own" on profiles;
create policy "profiles: insert own" on profiles for insert with check (auth.uid() = id);

-- Admins can also read every profile (needed for the User Management screen).
-- security definer so checking "am I an admin" doesn't re-trigger this same
-- policy and recurse.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- is_admin() only needs to run as the connecting (authenticated) user for
-- RLS policies to evaluate it. Revoking from just PUBLIC isn't enough —
-- Supabase's schema-level default privileges grant EXECUTE on every new
-- public function directly to `anon` too, so that has to be revoked
-- explicitly or an unauthenticated caller can still invoke it directly.
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "profiles: admins read all" on profiles;
create policy "profiles: admins read all" on profiles for select using (public.is_admin());

-- Admins can also edit (role/active) and remove any profile row from the
-- User Management screen. Note: this only removes the app profile — the
-- underlying auth.users login still exists unless also removed with the
-- Supabase Admin API (service role), which isn't available client-side.
drop policy if exists "profiles: admins update all" on profiles;
create policy "profiles: admins update all" on profiles for update using (public.is_admin());
drop policy if exists "profiles: admins delete all" on profiles;
create policy "profiles: admins delete all" on profiles for delete using (public.is_admin());

-- Farmers / Farms / Crops: any signed-in user (field or admin) can read
-- everything and write their own entries. Tighten this later if you want
-- field users to only see their own captures.
create policy "farmers: read all authenticated" on farmers for select using (auth.role() = 'authenticated');
create policy "farmers: insert own" on farmers for insert with check (auth.role() = 'authenticated');
create policy "farmers: update own" on farmers for update using (auth.role() = 'authenticated');

create policy "farms: read all authenticated" on farms for select using (auth.role() = 'authenticated');
create policy "farms: insert own" on farms for insert with check (auth.role() = 'authenticated');
create policy "farms: update own" on farms for update using (auth.role() = 'authenticated');

create policy "crops: read all authenticated" on crops for select using (auth.role() = 'authenticated');
create policy "crops: insert own" on crops for insert with check (auth.role() = 'authenticated');
create policy "crops: update own" on crops for update using (auth.role() = 'authenticated');

-- Auto-create a profile row (role: field) whenever a new user signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'field')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- This only ever needs to fire as a trigger (the Postgres trigger
-- mechanism invokes it directly, independent of caller grants) — no
-- session, public, anon or authenticated, should be able to call it by
-- hand. (Revoking from just PUBLIC misses anon/authenticated, which get
-- their own direct EXECUTE grant from Supabase's default privileges.)
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Storage bucket for media (farmer photos, farm/crop images, etc.)
-- Private bucket: the app reads files via short-lived signed URLs
-- (see src/lib/storage.js getDisplayUrl), never via a plain public URL.
insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do update set public = false;

-- Only signed-in app users can list/read (and therefore sign URLs for)
-- files in this bucket — anonymous clients get nothing.
drop policy if exists "media bucket: public read" on storage.objects;
drop policy if exists "media bucket: authenticated read" on storage.objects;
create policy "media bucket: authenticated read"
  on storage.objects for select
  using (bucket_id = 'media' and auth.role() = 'authenticated');

-- Any signed-in user can upload/update/delete files in this bucket.
create policy "media bucket: authenticated upload"
  on storage.objects for insert
  with check (bucket_id = 'media' and auth.role() = 'authenticated');

create policy "media bucket: authenticated update"
  on storage.objects for update
  using (bucket_id = 'media' and auth.role() = 'authenticated');

create policy "media bucket: authenticated delete"
  on storage.objects for delete
  using (bucket_id = 'media' and auth.role() = 'authenticated');

-- 6. Storage bucket for farmer document attachments (Aadhaar/PAN copies,
-- land papers, etc.) kept separate from farmer/crop photos. Private, same
-- as `media` — these are sensitive KYC documents, read only via
-- short-lived signed URLs (see src/lib/storage.js getDisplayUrl).
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do update set public = false;

drop policy if exists "documents bucket: public read" on storage.objects;
drop policy if exists "documents bucket: authenticated read" on storage.objects;
create policy "documents bucket: authenticated read"
  on storage.objects for select
  using (bucket_id = 'documents' and auth.role() = 'authenticated');

drop policy if exists "documents bucket: authenticated upload" on storage.objects;
create policy "documents bucket: authenticated upload"
  on storage.objects for insert
  with check (bucket_id = 'documents' and auth.role() = 'authenticated');

drop policy if exists "documents bucket: authenticated update" on storage.objects;
create policy "documents bucket: authenticated update"
  on storage.objects for update
  using (bucket_id = 'documents' and auth.role() = 'authenticated');

drop policy if exists "documents bucket: authenticated delete" on storage.objects;
create policy "documents bucket: authenticated delete"
  on storage.objects for delete
  using (bucket_id = 'documents' and auth.role() = 'authenticated');
