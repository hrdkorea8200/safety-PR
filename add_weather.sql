-- (선택) 조치완료 후 90일이 지난 제보의 이름·연락처를 매일 새벽 자동 삭제
-- 먼저 Database > Extensions 에서 pg_cron 을 켠 뒤 실행하세요.
select cron.schedule(
  'purge-contact-info',
  '10 3 * * *',
  $$ update public.reports
        set contact_name = '', contact_info = ''
      where status = '조치완료'
        and updated_at < now() - interval '90 days'
        and (contact_name <> '' or contact_info <> '') $$
);
