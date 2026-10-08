-- 관리자 등록: 아래 이메일을 Authentication > Users 에서 만든 관리자 이메일로 바꾼 뒤 Run
insert into public.admins (user_id)
select id from auth.users where email = 'admin@example.com'
on conflict do nothing;

-- 등록 확인 (1줄이 나오면 성공)
select u.email, a.user_id from public.admins a join auth.users u on u.id = a.user_id;
