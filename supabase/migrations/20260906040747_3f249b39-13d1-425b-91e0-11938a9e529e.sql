revoke execute on function public.place_order(text, text, text, jsonb, text) from anon;
revoke execute on function public.get_tracked_order(text) from anon;
revoke execute on function public.submit_review(text, integer, text) from anon;
revoke execute on function public.get_week_status() from anon;