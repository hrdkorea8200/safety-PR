-- =====================================================================
--  "오늘의 안전 날씨" 기능 추가 (SQL Editor에서 이 파일 전체를 붙여넣고 Run, 한 번만)
--  - 누구나 단계(맑음/흐림/위험)를 "읽을 수" 있고, 변경은 관리자만 가능합니다.
--  여러 번 실행해도 안전합니다. (기존 제보·사진·공지 데이터에는 영향이 없습니다)
-- =====================================================================
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
