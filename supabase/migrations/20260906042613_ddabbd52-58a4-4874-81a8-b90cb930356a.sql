create or replace function public.find_tracked_order(p_number text, p_phone text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_token text;
begin
  select tracking_token into v_token
  from public.orders
  where upper(regexp_replace(order_number, '[^A-Za-z0-9]', '', 'g')) = upper(regexp_replace(coalesce(p_number,''), '[^A-Za-z0-9]', '', 'g'))
    and regexp_replace(customer_phone, '[^0-9]', '', 'g') = regexp_replace(coalesce(p_phone,''), '[^0-9]', '', 'g')
  limit 1;
  if v_token is null then return null; end if;
  return jsonb_build_object('token', v_token, 'order', public.get_tracked_order(v_token));
end; $$;

revoke all on function public.find_tracked_order(text, text) from public, anon, authenticated;
grant execute on function public.find_tracked_order(text, text) to service_role;