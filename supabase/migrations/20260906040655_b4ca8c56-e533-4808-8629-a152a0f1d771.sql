revoke execute on function public.place_order(text, text, text, jsonb, text) from authenticated;
revoke execute on function public.get_tracked_order(text) from authenticated;
revoke execute on function public.submit_review(text, integer, text) from authenticated;
revoke execute on function public.get_week_status() from authenticated;