-- =====================================================================
--  안전신문고 · Supabase 설정 (SQL Editor에서 이 파일 전체를 붙여넣고 Run, 딱 한 번)
--  - 누구나(로그인 없이) 제보를 "넣을 수만" 있고, 읽을 수는 없습니다.
--  - 제보·사진 조회/처리/삭제는 admins 표에 등록된 관리자 계정만 가능합니다.
--  여러 번 실행해도 안전합니다.
-- =====================================================================

-- 1) 관리자 목록 ------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;       -- 정책이 없으므로 API로는 아무도 접근할 수 없음
revoke all on public.admins from anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
revoke all on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;

-- 1-1) 활동 유지용 함수: 무료 프로젝트는 일정 기간 사용이 없으면 자동 일시정지되므로,
--      GitHub Actions가 주기적으로 이 함수를 호출해 사용 중인 상태로 유지합니다. (아무 데이터도 읽지 않음)
create or replace function public.ping()
returns integer
language sql
stable
as $$ select 1; $$;
grant execute on function public.ping() to anon, authenticated;

-- 2) 제보 표 ------------------------------------------------------------
create table if not exists public.reports (
  id            text primary key check (id ~ '^SF-[0-9]{6}-[0-9A-F]{5}$'),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  occurred_at   text not null check (occurred_at ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}$'),
  reporter_type text not null check (reporter_type in ('사내 근로자','수급업체 근로자','고객 · 방문자','기타')),
  category      text not null check (category in ('아차사고','안전사고','위험요소 발견','개선 제안')),
  severity      text not null check (severity in ('낮음','보통','높음')),
  place         text not null check (char_length(place) between 1 and 40),
  place_detail  text not null default '' check (char_length(place_detail) <= 80),
  content       text not null check (char_length(content) between 10 and 1000),
  photo_count   smallint not null default 0 check (photo_count between 0 and 3),
  anonymous     boolean not null default true,
  contact_name  text not null default '' check (char_length(contact_name) <= 30),
  contact_info  text not null default '' check (char_length(contact_info) <= 60),
  status        text not null default '접수' check (status in ('접수','검토중','조치완료')),
  memo          text not null default '' check (char_length(memo) <= 500),
  -- 익명이면 이름·연락처를 저장할 수 없음
  constraint anon_has_no_contact check (not anonymous or (contact_name = '' and contact_info = ''))
);
create index if not exists reports_created_idx on public.reports (created_at desc);

-- 3) 자동 처리: 접수시각 고정, 수정시각 갱신, 도배 방지(전체 시간당 200건) -------
create or replace function public.reports_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
    new.updated_at := now();
    if (select count(*) from public.reports where created_at > now() - interval '1 hour') >= 200 then
      raise exception 'RATE_LIMIT' using errcode = 'P0001';
    end if;
  else
    new.updated_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists reports_guard_trg on public.reports;
create trigger reports_guard_trg
  before insert or update on public.reports
  for each row execute function public.reports_guard();

-- 4) 접근 권한(RLS) ------------------------------------------------------
alter table public.reports enable row level security;
revoke all on public.reports from anon, authenticated;
grant insert on public.reports to anon, authenticated;                 -- 누구나 접수 가능
grant select, update, delete on public.reports to authenticated;       -- 조회·처리는 로그인 + 관리자 확인

drop policy if exists reports_insert on public.reports;
drop policy if exists reports_select on public.reports;
drop policy if exists reports_update on public.reports;
drop policy if exists reports_delete on public.reports;

create policy reports_insert on public.reports
  for insert to anon, authenticated
  with check (status = '접수' and memo = '');

create policy reports_select on public.reports
  for select to authenticated
  using (public.is_admin());

create policy reports_update on public.reports
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy reports_delete on public.reports
  for delete to authenticated
  using (public.is_admin());

-- 5) 사진 저장소(비공개) ----------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-photos', 'report-photos', false, 1572864, array['image/jpeg'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "photos_insert" on storage.objects;
drop policy if exists "photos_select" on storage.objects;
drop policy if exists "photos_delete" on storage.objects;

-- 누구나 올릴 수 있지만 SF-접수번호/0~2.jpg 형식의 경로만 허용 (덮어쓰기 불가)
create policy "photos_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'report-photos' and name ~ '^SF-[0-9]{6}-[0-9A-F]{5}/[0-2]\.jpg$');

-- 보기·삭제는 관리자만
create policy "photos_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'report-photos' and public.is_admin());

create policy "photos_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'report-photos' and public.is_admin());

-- =====================================================================
--  끝. 다음 단계: Authentication > Users 에서 관리자 계정을 만든 뒤,
--  supabase/add_admin.sql 의 이메일만 바꿔서 실행하세요.
-- =====================================================================

-- 6) 공지사항 ------------------------------------------------------------------
create table if not exists public.notices (
  id         bigint generated always as identity primary key,
  title      text not null check (char_length(title) between 1 and 100),
  body       text not null default '' check (char_length(body) <= 2000),
  pinned     boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists notices_order_idx on public.notices (pinned desc, created_at desc);

create or replace function public.notices_touch()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
  end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists notices_touch_trg on public.notices;
create trigger notices_touch_trg
  before insert or update on public.notices
  for each row execute function public.notices_touch();

alter table public.notices enable row level security;
revoke all on public.notices from anon, authenticated;
grant select on public.notices to anon, authenticated;                 -- 누구나 읽기
grant insert, update, delete on public.notices to authenticated;       -- 쓰기는 로그인 + 관리자 확인

drop policy if exists notices_select on public.notices;
drop policy if exists notices_insert on public.notices;
drop policy if exists notices_update on public.notices;
drop policy if exists notices_delete on public.notices;

create policy notices_select on public.notices
  for select to anon, authenticated
  using (true);

create policy notices_insert on public.notices
  for insert to authenticated
  with check (public.is_admin());

create policy notices_update on public.notices
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy notices_delete on public.notices
  for delete to authenticated
  using (public.is_admin());

-- 7) 오늘의 안전 날씨 ------------------------------------------------------------------
create table if not exists public.safety_weather (
  id         smallint primary key default 1 check (id = 1),     -- 한 줄만 존재
  level      text not null default '맑음' check (level in ('맑음','흐림','위험')),
  updated_at timestamptz not null default now()
);
insert into public.safety_weather (id, level) values (1, '맑음') on conflict (id) do nothing;

create or replace function public.safety_weather_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists safety_weather_touch_trg on public.safety_weather;
create trigger safety_weather_touch_trg
  before insert or update on public.safety_weather
  for each row execute function public.safety_weather_touch();

alter table public.safety_weather enable row level security;
revoke all on public.safety_weather from anon, authenticated;
grant select on public.safety_weather to anon, authenticated;             -- 누구나 읽기
grant insert, update on public.safety_weather to authenticated;           -- 변경은 로그인 + 관리자 확인

drop policy if exists weather_select on public.safety_weather;
drop policy if exists weather_insert on public.safety_weather;
drop policy if exists weather_update on public.safety_weather;

create policy weather_select on public.safety_weather
  for select to anon, authenticated
  using (true);

create policy weather_insert on public.safety_weather
  for insert to authenticated
  with check (public.is_admin());

create policy weather_update on public.safety_weather
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
