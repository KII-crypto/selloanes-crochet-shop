REVOKE ALL ON FUNCTION public.place_order(text, text, text, jsonb, text) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_tracked_order(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.place_order(text, text, text, jsonb, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_tracked_order(text) TO service_role;