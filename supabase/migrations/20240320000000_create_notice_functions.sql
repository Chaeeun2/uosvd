-- 조회수 증가 함수
create or replace function increment_notice_views(notice_id bigint)
returns void
language plpgsql
security definer
as $$
begin
  update notices
  set views = coalesce(views, 0) + 1
  where id = notice_id;
end;
$$; 