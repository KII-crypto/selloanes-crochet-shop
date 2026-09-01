CREATE OR REPLACE FUNCTION public.place_order(p_name text, p_phone text, p_location text, p_items jsonb, p_mix boolean, p_request_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_settings public.business_settings%rowtype;
  v_week date;
  v_count int;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty int;
  v_subtotal numeric(10,2) := 0;
  v_fee numeric(10,2) := 0;
  v_order public.orders%rowtype;
  v_existing public.orders%rowtype;
  v_token text;
begin
  perform pg_advisory_xact_lock(hashtext('selloane_orders'));

  if p_request_id is not null then
    select * into v_existing from public.orders where client_request_id = p_request_id;
    if found then
      return jsonb_build_object('order_number', v_existing.order_number, 'tracking_token', v_existing.tracking_token, 'total', v_existing.total, 'duplicate', true);
    end if;
  end if;

  select * into v_settings from public.business_settings where id = 1;

  p_name := btrim(coalesce(p_name,''));
  p_phone := btrim(coalesce(p_phone,''));
  if length(p_name) < 2 or length(p_name) > 80 then raise exception 'INVALID_NAME'; end if;
  if p_phone !~ '^[0-9+ ()-]{8,20}$' then raise exception 'INVALID_PHONE'; end if;

  if not exists (select 1 from public.delivery_locations where name = p_location and active) then
    raise exception 'INVALID_LOCATION';
  end if;

  v_week := (date_trunc('week', now() at time zone 'Africa/Johannesburg'))::date;
  select count(*) into v_count from public.orders where week_start = v_week and status <> 'Cancelled';
  if v_count >= v_settings.weekly_order_limit then raise exception 'WEEKLY_LIMIT'; end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'EMPTY_ORDER'; end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := coalesce((v_item->>'quantity')::int, 0);
    if v_qty <= 0 then continue; end if;
    if v_qty > 50 then raise exception 'QUANTITY_TOO_LARGE'; end if;
    select * into v_product from public.products where slug = v_item->>'slug' and available;
    if not found then raise exception 'PRODUCT_UNAVAILABLE'; end if;
    v_subtotal := v_subtotal + (v_product.price * v_qty);
  end loop;

  if v_subtotal <= 0 then raise exception 'EMPTY_ORDER'; end if;
  if p_mix then v_fee := v_settings.mixed_colour_fee; end if;

  v_token := encode(sha256((gen_random_uuid()::text || gen_random_uuid()::text || clock_timestamp()::text)::bytea), 'hex');

  insert into public.orders (customer_name, customer_phone, delivery_location, subtotal, mixed_colour_fee, total, tracking_token, week_start, client_request_id)
  values (p_name, p_phone, p_location, v_subtotal, v_fee, v_subtotal + v_fee, v_token, v_week, p_request_id)
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := coalesce((v_item->>'quantity')::int, 0);
    if v_qty <= 0 then continue; end if;
    select * into v_product from public.products where slug = v_item->>'slug';
    insert into public.order_items (order_id, product_slug, product_name, unit_price, quantity, colours)
    values (v_order.id, v_product.slug, v_product.name, v_product.price, v_qty,
      coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(v_item->'colours','[]'::jsonb)) x), '{}'));
  end loop;

  return jsonb_build_object('order_number', v_order.order_number, 'tracking_token', v_order.tracking_token, 'total', v_order.total, 'duplicate', false);
end; $function$;

REVOKE ALL ON FUNCTION public.place_order(text, text, text, jsonb, boolean, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.place_order(text, text, text, jsonb, boolean, text) TO service_role;