-- ========================================================================
-- Pulse KPRIET: Campus Emergency & Resource Network Schema
-- ========================================================================

-- Ensure PostGIS is in search path
set search_path = public, extensions;

-- Create custom enum / validation check helper domain or simple checks
-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  department text default '',
  phone text default '',
  role text not null default 'student' check (role in ('student', 'volunteer', 'admin')),
  blood_group text check (blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') or blood_group is null),
  skills text[] default array[]::text[],
  is_available boolean default false,
  location geography(Point, 4326),
  location_updated_at timestamptz,
  created_at timestamptz default now()
);

-- Index for spatial queries on volunteer locations
create index if not exists idx_profiles_location on public.profiles using gist(location);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_is_available on public.profiles(is_available);

-- 2. INCIDENTS TABLE
create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null,
  type text not null check (type in ('medical', 'fire', 'accident', 'safety', 'blood_needed', 'other')),
  description text default '',
  blood_group_needed text check (blood_group_needed in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') or blood_group_needed is null),
  location geography(Point, 4326) not null,
  location_label text not null default 'Campus Location',
  status text not null default 'open' check (status in ('open', 'accepted', 'resolved', 'cancelled')),
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  resolved_at timestamptz,
  ai_summary text,
  created_at timestamptz default now()
);

-- Indexes for incidents
create index if not exists idx_incidents_location on public.incidents using gist(location);
create index if not exists idx_incidents_status on public.incidents(status);
create index if not exists idx_incidents_reporter on public.incidents(reporter_id);
create index if not exists idx_incidents_accepted_by on public.incidents(accepted_by);
create index if not exists idx_incidents_created_at on public.incidents(created_at desc);

-- 3. INCIDENT ALERTS TABLE
create table if not exists public.incident_alerts (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  volunteer_id uuid not null references auth.users(id) on delete cascade,
  distance_m numeric(10, 2) not null default 0,
  status text not null default 'sent' check (status in ('sent', 'accepted', 'declined')),
  created_at timestamptz default now(),
  constraint unique_incident_volunteer unique (incident_id, volunteer_id)
);

create index if not exists idx_alerts_incident on public.incident_alerts(incident_id);
create index if not exists idx_alerts_volunteer on public.incident_alerts(volunteer_id);
create index if not exists idx_alerts_status on public.incident_alerts(status);

-- ========================================================================
-- VIEWS WITH COORDINATES (for clean client consumption without parsing WKB)
-- ========================================================================

create or replace view public.incidents_with_coords as
select
  i.id,
  i.reporter_id,
  i.type,
  i.description,
  i.blood_group_needed,
  i.location_label,
  i.status,
  i.accepted_by,
  i.accepted_at,
  i.resolved_at,
  i.ai_summary,
  i.created_at,
  case when i.location is not null then ST_Y(i.location::geometry) else null end as lat,
  case when i.location is not null then ST_X(i.location::geometry) else null end as lng,
  rep.full_name as reporter_name,
  rep.phone as reporter_phone,
  rep.department as reporter_department,
  vol.full_name as volunteer_name,
  vol.phone as volunteer_phone,
  vol.department as volunteer_department
from public.incidents i
left join public.profiles rep on rep.id = i.reporter_id
left join public.profiles vol on vol.id = i.accepted_by;

create or replace view public.volunteers_with_coords as
select
  p.id,
  p.full_name,
  p.department,
  p.phone,
  p.role,
  p.blood_group,
  p.skills,
  p.is_available,
  p.location_updated_at,
  p.created_at,
  case when p.location is not null then ST_Y(p.location::geometry) else null end as lat,
  case when p.location is not null then ST_X(p.location::geometry) else null end as lng
from public.profiles p
where p.role in ('volunteer', 'admin');

create or replace view public.incident_stats as
select
  count(*)::int as total_incidents,
  count(*) filter (where status = 'resolved')::int as resolved_incidents,
  count(*) filter (where status = 'open')::int as open_incidents,
  count(*) filter (where status = 'accepted')::int as active_incidents,
  count(*) filter (where status = 'cancelled')::int as cancelled_incidents,
  coalesce(
    round(
      avg(extract(epoch from (accepted_at - created_at))) filter (where accepted_at is not null and status in ('accepted', 'resolved'))
    )::int,
    0
  ) as avg_response_time_seconds,
  (
    select count(*)::int from public.profiles where is_available = true and role = 'volunteer'
  ) as active_volunteers_count
from public.incidents;

-- ========================================================================
-- HELPER & SECURITY DEFINER FUNCTIONS
-- ========================================================================

-- Helper to check if current user is admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public, extensions
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Prevent regular users from modifying their own role
create or replace function public.handle_profile_update_role_protection()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  -- If role is changing and user is not an admin, keep old role
  if new.role is distinct from old.role then
    if not public.is_admin() then
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tr_protect_profile_role on public.profiles;
create trigger tr_protect_profile_role
before update on public.profiles
for each row execute function public.handle_profile_update_role_protection();

-- Trigger on auth.users insert to auto-create profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_role text := 'student';
  v_skills text[] := array[]::text[];
  v_full_name text;
  v_department text;
  v_phone text;
  v_blood_group text;
begin
  -- Extract metadata safely if present
  v_full_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  v_department := coalesce(new.raw_user_meta_data->>'department', '');
  v_phone := coalesce(new.raw_user_meta_data->>'phone', '');
  v_blood_group := new.raw_user_meta_data->>'blood_group';
  
  if new.raw_user_meta_data->>'role' in ('student', 'volunteer', 'admin') then
    v_role := new.raw_user_meta_data->>'role';
  end if;

  if new.email like 'admin%@pulse.demo' or new.email like 'admin%@kpriet.ac.in' then
    v_role := 'admin';
  end if;

  insert into public.profiles (
    id, full_name, department, phone, role, blood_group, skills, is_available, created_at
  ) values (
    new.id,
    v_full_name,
    v_department,
    v_phone,
    v_role,
    v_blood_group,
    v_skills,
    false,
    now()
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, profiles.full_name),
    department = coalesce(excluded.department, profiles.department),
    phone = coalesce(excluded.phone, profiles.phone);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ========================================================================
-- RPC FUNCTIONS FOR CORE INCIDENT LIFECYCLE
-- ========================================================================

-- 1. Create Incident & match volunteers
create or replace function public.create_incident(
  p_type text,
  p_description text default '',
  p_lat double precision default 11.0827,
  p_lng double precision default 77.1420,
  p_label text default 'KPRIET Campus',
  p_blood_group text default null
)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_incident_id uuid;
  v_incident_loc geography(Point, 4326);
  v_reporter_id uuid;
  v_match_count int := 0;
  v_radius_m int := 1500;
  v_vol record;
begin
  v_reporter_id := auth.uid();
  if v_reporter_id is null then
    raise exception 'Authentication required to report incident';
  end if;

  -- Create Point geography (SRID 4326: Lon, Lat)
  v_incident_loc := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;

  -- Insert incident
  insert into public.incidents (
    reporter_id,
    type,
    description,
    blood_group_needed,
    location,
    location_label,
    status,
    created_at
  ) values (
    v_reporter_id,
    p_type,
    p_description,
    p_blood_group,
    v_incident_loc,
    p_label,
    'open',
    now()
  )
  returning id into v_incident_id;

  -- Find matching available volunteers (Tier 1: 1500m)
  -- Skill mapping rules:
  -- medical -> first_aid or cpr
  -- accident -> first_aid or vehicle
  -- fire -> security
  -- safety -> security
  -- blood_needed -> blood_donor AND blood_group = p_blood_group
  -- other -> any available volunteer
  create temp table temp_matches on commit drop as
  select
    p.id as volunteer_id,
    round(ST_Distance(p.location, v_incident_loc)::numeric, 2) as distance_m
  from public.profiles p
  where p.id <> v_reporter_id
    and p.role in ('volunteer', 'admin')
    and p.is_available = true
    and p.location is not null
    and ST_DWithin(p.location, v_incident_loc, v_radius_m)
    and (
      case 
        when p_type = 'medical' then ('first_aid' = any(p.skills) or 'cpr' = any(p.skills))
        when p_type = 'accident' then ('first_aid' = any(p.skills) or 'vehicle' = any(p.skills))
        when p_type = 'fire' then ('security' = any(p.skills))
        when p_type = 'safety' then ('security' = any(p.skills))
        when p_type = 'blood_needed' then ('blood_donor' = any(p.skills) and (p_blood_group is null or p.blood_group = p_blood_group))
        else true
      end
    )
  order by ST_Distance(p.location, v_incident_loc) asc
  limit 10;

  select count(*) into v_match_count from temp_matches;

  -- If fewer than 3 matches, widen search radius to 5000m
  if v_match_count < 3 then
    delete from temp_matches;
    v_radius_m := 5000;

    insert into temp_matches (volunteer_id, distance_m)
    select
      p.id as volunteer_id,
      round(ST_Distance(p.location, v_incident_loc)::numeric, 2) as distance_m
    from public.profiles p
    where p.id <> v_reporter_id
      and p.role in ('volunteer', 'admin')
      and p.is_available = true
      and p.location is not null
      and ST_DWithin(p.location, v_incident_loc, v_radius_m)
      and (
        case 
          when p_type = 'medical' then ('first_aid' = any(p.skills) or 'cpr' = any(p.skills))
          when p_type = 'accident' then ('first_aid' = any(p.skills) or 'vehicle' = any(p.skills))
          when p_type = 'fire' then ('security' = any(p.skills))
          when p_type = 'safety' then ('security' = any(p.skills))
          when p_type = 'blood_needed' then ('blood_donor' = any(p.skills) and (p_blood_group is null or p.blood_group = p_blood_group))
          else true
        end
      )
    order by ST_Distance(p.location, v_incident_loc) asc
    limit 10;

    select count(*) into v_match_count from temp_matches;
  end if;

  -- Insert incident alerts for matching volunteers
  insert into public.incident_alerts (incident_id, volunteer_id, distance_m, status, created_at)
  select v_incident_id, volunteer_id, distance_m, 'sent', now()
  from temp_matches
  on conflict (incident_id, volunteer_id) do nothing;

  return json_build_object(
    'incident_id', v_incident_id,
    'match_count', v_match_count,
    'radius_used_m', v_radius_m,
    'status', 'open'
  );
end;
$$;

-- 2. Accept Incident atomically
create or replace function public.accept_incident(p_incident_id uuid)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_volunteer_id uuid;
  v_updated_id uuid;
begin
  v_volunteer_id := auth.uid();
  if v_volunteer_id is null then
    raise exception 'Authentication required to accept incident';
  end if;

  -- Atomically update only if status is still open
  update public.incidents
  set
    accepted_by = v_volunteer_id,
    accepted_at = now(),
    status = 'accepted'
  where id = p_incident_id
    and status = 'open'
  returning id into v_updated_id;

  if v_updated_id is not null then
    -- Mark current volunteer alert as accepted
    update public.incident_alerts
    set status = 'accepted'
    where incident_id = p_incident_id
      and volunteer_id = v_volunteer_id;

    -- Update other alerts to declined / closed
    update public.incident_alerts
    set status = 'declined'
    where incident_id = p_incident_id
      and volunteer_id <> v_volunteer_id;

    return json_build_object(
      'success', true,
      'message', 'Incident accepted successfully',
      'incident_id', p_incident_id
    );
  else
    return json_build_object(
      'success', false,
      'message', 'Already accepted by another responder or closed',
      'incident_id', p_incident_id
    );
  end if;
end;
$$;

-- 3. Resolve Incident
create or replace function public.resolve_incident(p_incident_id uuid)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_caller_id uuid;
  v_incident record;
  v_is_adm boolean;
begin
  v_caller_id := auth.uid();
  if v_caller_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_incident from public.incidents where id = p_incident_id;
  if not found then
    raise exception 'Incident not found';
  end if;

  v_is_adm := public.is_admin();

  -- Allowed: reporter, accepted volunteer, or admin
  if v_incident.reporter_id = v_caller_id or v_incident.accepted_by = v_caller_id or v_is_adm then
    update public.incidents
    set
      status = 'resolved',
      resolved_at = now()
    where id = p_incident_id;

    return json_build_object('success', true, 'status', 'resolved');
  else
    raise exception 'Not authorized to resolve this incident';
  end if;
end;
$$;

-- 4. Cancel Incident
create or replace function public.cancel_incident(p_incident_id uuid)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_caller_id uuid;
  v_incident record;
  v_is_adm boolean;
begin
  v_caller_id := auth.uid();
  if v_caller_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_incident from public.incidents where id = p_incident_id;
  if not found then
    raise exception 'Incident not found';
  end if;

  v_is_adm := public.is_admin();

  -- Allowed: reporter or admin
  if v_incident.reporter_id = v_caller_id or v_is_adm then
    update public.incidents
    set
      status = 'cancelled',
      resolved_at = now()
    where id = p_incident_id;

    return json_build_object('success', true, 'status', 'cancelled');
  else
    raise exception 'Not authorized to cancel this incident';
  end if;
end;
$$;

-- 5. Update My Location
create or replace function public.update_my_location(
  p_lat double precision,
  p_lng double precision
)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  update public.profiles
  set
    location = ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    location_updated_at = now()
  where id = v_uid;

  return json_build_object('success', true, 'lat', p_lat, 'lng', p_lng);
end;
$$;

-- 6. Get Incident Coordinates
create or replace function public.get_incident_coords(p_incident_id uuid)
returns table (
  id uuid,
  lat double precision,
  lng double precision,
  location_label text,
  status text
)
language plpgsql
security definer
set search_path = public, extensions
stable
as $$
begin
  return query
  select
    i.id,
    ST_Y(i.location::geometry) as lat,
    ST_X(i.location::geometry) as lng,
    i.location_label,
    i.status
  from public.incidents i
  where i.id = p_incident_id;
end;
$$;

-- ========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================================

alter table public.profiles enable row level security;
alter table public.incidents enable row level security;
alter table public.incident_alerts enable row level security;

-- Profiles Policies
drop policy if exists "profiles_select_policy" on public.profiles;
create policy "profiles_select_policy"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "profiles_update_policy" on public.profiles;
create policy "profiles_update_policy"
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- Incidents Policies
drop policy if exists "incidents_select_policy" on public.incidents;
create policy "incidents_select_policy"
on public.incidents
for select
to authenticated
using (true);

drop policy if exists "incidents_insert_policy" on public.incidents;
create policy "incidents_insert_policy"
on public.incidents
for insert
to authenticated
with check (reporter_id = auth.uid() or public.is_admin());

drop policy if exists "incidents_update_policy" on public.incidents;
create policy "incidents_update_policy"
on public.incidents
for update
to authenticated
using (reporter_id = auth.uid() or accepted_by = auth.uid() or public.is_admin())
with check (reporter_id = auth.uid() or accepted_by = auth.uid() or public.is_admin());

-- Incident Alerts Policies
drop policy if exists "alerts_select_policy" on public.incident_alerts;
create policy "alerts_select_policy"
on public.incident_alerts
for select
to authenticated
using (volunteer_id = auth.uid() or public.is_admin());

drop policy if exists "alerts_update_policy" on public.incident_alerts;
create policy "alerts_update_policy"
on public.incident_alerts
for update
to authenticated
using (volunteer_id = auth.uid() or public.is_admin())
with check (volunteer_id = auth.uid() or public.is_admin());

-- ========================================================================
-- REALTIME SUBSCRIPTIONS
-- ========================================================================

-- Enable full replica identity so updates deliver full row in realtime payload
alter table public.incidents replica identity full;
alter table public.incident_alerts replica identity full;
alter table public.profiles replica identity full;

-- Add tables to supabase_realtime publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'incidents'
  ) then
    alter publication supabase_realtime add table public.incidents;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'incident_alerts'
  ) then
    alter publication supabase_realtime add table public.incident_alerts;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;
