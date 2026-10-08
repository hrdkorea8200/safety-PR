-- =====================================================================
--  공지사항 기능 추가 (SQL Editor에서 이 파일 전체를 붙여넣고 Run, 한 번만)
--  - 누구나 공지를 "읽을 수" 있고, 등록·수정·삭제는 관리자만 가능합니다.
--  여러 번 실행해도 안전합니다. (기존 제보·사진 데이터에는 영향이 없습니다)
-- =====================================================================
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
