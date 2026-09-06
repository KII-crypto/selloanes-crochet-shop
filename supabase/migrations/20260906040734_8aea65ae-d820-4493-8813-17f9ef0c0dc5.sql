grant execute on function public.place_order(text, text, text, jsonb, text) to anon;
grant execute on function public.get_tracked_order(text) to anon;
grant execute on function public.submit_review(text, integer, text) to anon;
grant execute on function public.get_week_status() to anon;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;