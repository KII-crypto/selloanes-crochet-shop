REVOKE ALL ON FUNCTION public.get_week_status() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_week_status() TO service_role;