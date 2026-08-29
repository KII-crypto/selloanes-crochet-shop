-- roles
create type public.app_role as enum ('admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid());

-- updated_at helper
create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  price numeric(10,2) not null default 0,
  sort_order int not null default 0,
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "products public read" on public.products for select to anon, authenticated using (true);
create policy "products admin write" on public.products for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger products_updated before update on public.products for each row execute function public.set_updated_at();

insert into public.products (slug,name,description,price,sort_order) values
 ('small','Small Scrunchie','Dainty chunky crochet scrunchie — perfect for thin hair or wrist wear.',20,1),
 ('medium','Medium Scrunchie','Our everyday favourite — soft, springy and beautifully full.',30,2),
 ('large','Large Scrunchie','Big, bold and extra chunky for thick hair and statement buns.',40,3);

-- delivery locations
create table public.delivery_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.delivery_locations to anon;
grant select, insert, update, delete on public.delivery_locations to authenticated;
grant all on public.delivery_locations to service_role;
alter table public.delivery_locations enable row level security;
create policy "locations public read" on public.delivery_locations for select to anon, authenticated using (true);
create policy "locations admin write" on public.delivery_locations for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

insert into public.delivery_locations (name, sort_order) values
 ('Eshowe High School',1), ('Sunnydale',2), ('Gratton',3);

-- business settings
create table public.business_settings (
  id int primary key default 1,
  business_name text not null default 'Selloane''s Crochet',
  business_phone text not null default '0660627555',
  mixed_colour_fee numeric(10,2) not null default 10,
  weekly_order_limit int not null default 5,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);
grant select on public.business_settings to anon;
grant select, update on public.business_settings to authenticated;
grant all on public.business_settings to service_role;
alter table public.business_settings enable row level security;
create policy "settings public read" on public.business_settings for select to anon, authenticated using (true);
create policy "settings admin update" on public.business_settings for update to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger settings_updated before update on public.business_settings for each row execute function public.set_updated_at();
insert into public.business_settings (id) values (1);

-- order numbers
create sequence public.order_number_seq start 1;
create or replace function public.next_order_number() returns text language sql volatile set search_path = public as $$
  select 'SC-' || lpad(nextval('public.order_number_seq')::text, 4, '0')
$$;

create type public.order_status as enum
 ('Received','Confirmed','Being Prepared','Ready','Out for Delivery','Delivered','Cancelled');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default public.next_order_number(),
  customer_name text not null,
  customer_phone text not null,
  delivery_location text not null,
  subtotal numeric(10,2) not null,
  mixed_colour_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  status public.order_status not null default 'Received',
  expected_delivery_date date,
  tracking_token text not null unique,
  admin_notes text not null default '',
  week_start date not null default (date_trunc('week', now() at time zone 'Africa/Johannesburg'))::date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "orders admin read" on public.orders for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "orders admin update" on public.orders for update to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger orders_updated before update on public.orders for each row execute function public.set_updated_at();
create index orders_week_idx on public.orders (week_start) where status <> 'Cancelled';
create index orders_created_idx on public.orders (created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_slug text not null,
  product_name text not null,
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  colours text[] not null default '{}',
  created_at timestamptz not null default now()
);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "order items admin read" on public.order_items for select to authenticated using (public.has_role(auth.uid(),'admin'));
create index order_items_order_idx on public.order_items(order_id);

-- reviews
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  display_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text not null default '',
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.reviews to anon;
grant select, update, delete on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "approved reviews public read" on public.reviews for select to anon using (approved = true);
create policy "reviews admin read" on public.reviews for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "reviews admin write" on public.reviews for update to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "reviews admin delete" on public.reviews for delete to authenticated using (public.has_role(auth.uid(),'admin'));
create trigger reviews_updated before update on public.reviews for each row execute function public.set_updated_at();

alter publication supabase_realtime add table public.orders;