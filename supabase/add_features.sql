-- =====================================================================
--  기능 추가 SQL (SQL Editor에서 이 파일 전체를 붙여넣고 Run) — 새로 설치할 때도, 이미 쓰는 중에도 실행하세요.
--  여러 번 실행해도 안전하며, 기존 제보·사진·공지·안전 날씨에는 영향이 없습니다. (schema.sql을 먼저 실행한 뒤 실행)
--
--   1) 접수번호로 처리 결과 조회  : 제보자가 접수번호를 입력하면 처리 상태와 "공개 처리 결과"만 보여 줍니다.
--   2) 이달의 안전·친환경 캠페인  : 관리자가 이번 달 캠페인 문구를 직접 바꿀 수 있는 저장소 (안 바꾸면 기본 문구가 나옵니다)
--   3) 사진 30일 보관 후 정리 표시: GitHub Actions(photo-cleanup)가 사진을 지운 뒤 표시를 남기는 칸
-- =====================================================================

-- 1) 제보 표에 칸 추가 -------------------------------------------------------
alter table public.reports add column if not exists reply text not null default '' check (char_length(reply) <= 300);   -- 제보자에게 공개되는 처리 결과
alter table public.reports add column if not exists photos_purged_at timestamptz;                                       -- 사진이 보관기간(30일) 경과로 삭제된 시각

-- 익명 접수자가 "처리 결과"나 "삭제 표시"를 위조해서 넣지 못하도록 접수 규칙을 다시 만듭니다.
drop policy if exists reports_insert on public.reports;
create policy reports_insert on public.reports
  for insert to anon, authenticated
  with check (status = '접수' and memo = '' and reply = '' and photos_purged_at is null);

-- 2) 접수번호 조회 (공개 함수) ---------------------------------------------------
--    · 접수번호를 정확히 알아야만 조회됩니다. 반환: 접수번호·처리상태·유형·접수일·갱신일·공개 처리 결과(reply)
--    · 제보 내용, 장소, 이름, 연락처, 관리자 메모(memo)는 절대 반환하지 않습니다.
--    · 무작위 대입을 막기 위해 같은 접속지(IP)에서 1분에 30번까지만 조회됩니다.
create table if not exists public.lookup_log (
  ip text not null,
  at timestamptz not null default now()
);
create index if not exists lookup_log_idx on public.lookup_log (ip, at desc);
alter table public.lookup_log enable row level security;
revoke all on public.lookup_log from anon, authenticated;       -- 아무도 직접 읽거나 쓸 수 없고, 아래 함수만 기록합니다

create or replace function public.report_status(p_id text)
returns table (id text, status text, category text, created_at timestamptz, updated_at timestamptz, reply text)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_id  text := upper(btrim(coalesce(p_id, '')));
  v_ip  text := '';
  v_cnt integer;
begin
  begin
    v_ip := btrim(split_part(coalesce((current_setting('request.headers', true))::json ->> 'x-forwarded-for', ''), ',', 1));
  exception when others then
    v_ip := '';
  end;
  delete from public.lookup_log where at < now() - interval '10 minutes';
  select count(*) into v_cnt from public.lookup_log l where l.ip = v_ip and l.at > now() - interval '1 minute';
  if v_cnt >= (case when v_ip = '' then 200 else 30 end) then
    raise exception 'RATE_LIMIT' using errcode = 'P0001';
  end if;
  insert into public.lookup_log (ip) values (v_ip);

  if v_id !~ '^SF-[0-9]{6}-[0-9A-F]{5}$' then
    return;
  end if;
  return query
    select r.id, r.status, r.category, r.created_at, r.updated_at, r.reply
      from public.reports r
     where r.id = v_id
     limit 1;
end;
$$;
revoke all on function public.report_status(text) from public;
grant execute on function public.report_status(text) to anon, authenticated;

-- 3) 이달의 안전·친환경 캠페인 (관리자가 바꾸는 문구) ---------------------------------
--    ym 이 "이번 달"과 같을 때만 홈 화면에 표시되고, 달이 바뀌면 자동으로 기본 문구로 돌아갑니다.
create table if not exists public.campaign (
  id           smallint primary key default 1 check (id = 1),    -- 한 줄만 존재
  ym           text not null default '' check (ym = '' or ym ~ '^[0-9]{4}-[0-9]{2}$'),
  safety_title text not null default '' check (char_length(safety_title) <= 60),
  safety_body  text not null default '' check (char_length(safety_body) <= 300),
  eco_title    text not null default '' check (char_length(eco_title) <= 60),
  eco_body     text not null default '' check (char_length(eco_body) <= 300),
  updated_at   timestamptz not null default now()
);
insert into public.campaign (id) values (1) on conflict (id) do nothing;

create or replace function public.campaign_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists campaign_touch_trg on public.campaign;
create trigger campaign_touch_trg
  before insert or update on public.campaign
  for each row execute function public.campaign_touch();

alter table public.campaign enable row level security;
revoke all on public.campaign from anon, authenticated;
grant select on public.campaign to anon, authenticated;            -- 누구나 읽기
grant update on public.campaign to authenticated;                  -- 수정은 로그인 + 관리자 확인

drop policy if exists campaign_select on public.campaign;
drop policy if exists campaign_update on public.campaign;
create policy campaign_select on public.campaign
  for select to anon, authenticated
  using (true);
create policy campaign_update on public.campaign
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 끝. 실행 후 "Success. No rows returned" 가 나오면 완료입니다.
-- (새 칸·함수가 바로 인식되지 않으면 아래 한 줄을 따로 실행하세요)
notify pgrst, 'reload schema';
