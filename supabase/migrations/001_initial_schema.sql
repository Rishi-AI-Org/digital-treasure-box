create extension if not exists pgcrypto;
create extension if not exists vector;

create type item_visibility as enum ('visible', 'archived', 'inbox');
create type capture_status as enum ('pending', 'processing', 'ready', 'failed', 'blocked');
create type item_source_type as enum ('link', 'youtube', 'x_post', 'instagram', 'spotify', 'quote', 'text', 'image', 'unknown');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Anonymous curator',
  handle text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table cabinets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null default 'Digital Treasure Box',
  subtitle text,
  theme text not null default 'mono',
  visible_limit int not null default 21 check (visible_limit = 21),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table share_links (
  id uuid primary key default gen_random_uuid(),
  cabinet_id uuid not null references cabinets(id) on delete cascade,
  share_id text not null unique,
  status text not null default 'active' check (status in ('active', 'paused', 'revoked')),
  created_at timestamptz not null default now(),
  last_viewed_at timestamptz
);

create table cabinet_items (
  id uuid primary key default gen_random_uuid(),
  cabinet_id uuid not null references cabinets(id) on delete cascade,
  owner_id uuid not null references profiles(id) on delete cascade,
  source_type item_source_type not null default 'unknown',
  visibility item_visibility not null default 'inbox',
  position int,
  original_url text,
  canonical_url text,
  title text not null,
  note text,
  quote_text text,
  tags text[] not null default '{}',
  provider_metadata jsonb not null default '{}'::jsonb,
  embed_config jsonb not null default '{}'::jsonb,
  safety_status text not null default 'unchecked' check (safety_status in ('unchecked', 'safe', 'blocked', 'failed')),
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (visibility = 'visible' and position is not null and position >= 0)
    or (visibility <> 'visible' and position is null)
  )
);

create unique index cabinet_items_visible_position_idx
  on cabinet_items(cabinet_id, position)
  where visibility = 'visible';

create index cabinet_items_owner_visibility_idx on cabinet_items(owner_id, visibility, created_at desc);
create index cabinet_items_cabinet_visible_idx on cabinet_items(cabinet_id, position) where visibility = 'visible';
create index cabinet_items_tags_idx on cabinet_items using gin(tags);
create index cabinet_items_embedding_idx on cabinet_items using hnsw (embedding vector_cosine_ops);

create table capture_jobs (
  id uuid primary key default gen_random_uuid(),
  cabinet_id uuid not null references cabinets(id) on delete cascade,
  owner_id uuid not null references profiles(id) on delete cascade,
  item_id uuid references cabinet_items(id) on delete set null,
  status capture_status not null default 'pending',
  payload jsonb not null,
  error_code text,
  error_message text,
  attempts int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index capture_jobs_owner_status_idx on capture_jobs(owner_id, status, created_at desc);

create table audit_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete set null,
  cabinet_id uuid references cabinets(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  share_id text not null,
  reason text not null,
  details text,
  reporter_contact text,
  status text not null default 'open' check (status in ('open', 'reviewing', 'closed')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table cabinets enable row level security;
alter table share_links enable row level security;
alter table cabinet_items enable row level security;
alter table capture_jobs enable row level security;
alter table audit_events enable row level security;
alter table reports enable row level security;

create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "cabinets_owner_all" on cabinets for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "share_links_owner_all" on share_links for all using (
  exists (select 1 from cabinets where cabinets.id = share_links.cabinet_id and cabinets.owner_id = auth.uid())
) with check (
  exists (select 1 from cabinets where cabinets.id = share_links.cabinet_id and cabinets.owner_id = auth.uid())
);
create policy "cabinet_items_owner_all" on cabinet_items for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "capture_jobs_owner_all" on capture_jobs for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "audit_events_owner_select" on audit_events for select using (auth.uid() = owner_id);
create policy "reports_public_insert" on reports for insert with check (true);

create or replace function make_share_id()
returns text
language sql
as $$
  select rtrim(replace(replace(encode(gen_random_bytes(18), 'base64'), '+', '-'), '/', '_'), '=')
$$;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cabinet_id uuid;
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Anonymous curator'))
  on conflict (id) do nothing;

  insert into cabinets (owner_id)
  values (new.id)
  returning id into cabinet_id;

  insert into share_links (cabinet_id, share_id)
  values (cabinet_id, make_share_id());

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

create or replace function archive_visible_overflow()
returns trigger
language plpgsql
security definer
as $$
begin
  with ranked as (
    select id, row_number() over (partition by cabinet_id order by position asc, created_at asc) as rn
    from cabinet_items
    where cabinet_id = new.cabinet_id and visibility = 'visible'
  )
  update cabinet_items
  set visibility = 'archived', position = null, updated_at = now()
  where id in (select id from ranked where rn > 21);

  return new;
end;
$$;

create trigger cabinet_items_visible_limit_trigger
after insert or update of visibility, position on cabinet_items
for each row execute function archive_visible_overflow();

create or replace function match_archive_items(
  match_owner_id uuid,
  query_embedding vector(1536),
  match_count int default 20
)
returns setof cabinet_items
language sql
stable
as $$
  select *
  from cabinet_items
  where owner_id = match_owner_id
    and visibility = 'archived'
    and embedding is not null
  order by embedding <=> query_embedding
  limit match_count
$$;
