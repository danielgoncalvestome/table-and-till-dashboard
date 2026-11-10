
-- ===== Enums =====
create type public.app_role as enum ('admin','user');
create type public.member_role as enum ('owner','manager','staff');
create type public.restaurant_status as enum ('draft','demo','trial','active','grace','read_only','cancelled');

-- ===== Profiles =====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  preferred_lang text not null default 'pt',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ===== Platform roles =====
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles read" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- ===== Platform settings =====
create table public.platform_settings (
  id int primary key default 1 check (id = 1),
  monthly_price_cents int not null default 990,
  currency text not null default 'EUR',
  trial_days int not null default 10,
  demo_trial_days int not null default 30,
  grace_days int not null default 7,
  updated_at timestamptz not null default now()
);
insert into public.platform_settings (id) values (1);
grant select on public.platform_settings to anon, authenticated;
grant update on public.platform_settings to authenticated;
grant all on public.platform_settings to service_role;
alter table public.platform_settings enable row level security;
create policy "settings public read" on public.platform_settings for select to anon, authenticated using (true);
create policy "settings admin update" on public.platform_settings for update to authenticated using (public.has_role(auth.uid(),'admin'));

-- ===== Restaurants =====
create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  description text,
  description_i18n jsonb not null default '{}',
  logo_url text,
  cover_url text,
  address text,
  phone text,
  email text,
  website text,
  instagram_url text,
  google_reviews_url text,
  opening_hours text,
  default_lang text not null default 'pt',
  languages text[] not null default array['pt','en'],
  primary_color text not null default '#18352B',
  background_color text not null default '#F6F3EC',
  accent_color text not null default '#8FA68E',
  font text not null default 'serif',
  template text not null default 'minimalist',
  status public.restaurant_status not null default 'draft',
  published boolean not null default false,
  is_demo boolean not null default false,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.restaurants to anon;
grant select, insert, update, delete on public.restaurants to authenticated;
grant all on public.restaurants to service_role;
alter table public.restaurants enable row level security;

create table public.restaurant_members (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null,
  role public.member_role not null default 'staff',
  created_at timestamptz not null default now(),
  unique (restaurant_id, user_id)
);
grant select, insert, update, delete on public.restaurant_members to authenticated;
grant all on public.restaurant_members to service_role;
alter table public.restaurant_members enable row level security;

create or replace function public.is_member(_restaurant_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.restaurant_members where restaurant_id = _restaurant_id and user_id = auth.uid())
    or public.has_role(auth.uid(),'admin')
$$;
create or replace function public.is_owner(_restaurant_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.restaurant_members where restaurant_id = _restaurant_id and user_id = auth.uid() and role in ('owner','manager'))
    or public.has_role(auth.uid(),'admin')
$$;
create or replace function public.is_public_restaurant(_restaurant_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.restaurants where id = _restaurant_id and published = true)
$$;

create policy "public read published" on public.restaurants for select to anon, authenticated using (published = true or public.is_member(id));
create policy "create restaurant" on public.restaurants for insert to authenticated with check (created_by = auth.uid());
create policy "members update" on public.restaurants for update to authenticated using (public.is_owner(id));
create policy "owner delete" on public.restaurants for delete to authenticated using (public.is_owner(id));

create policy "members read members" on public.restaurant_members for select to authenticated using (public.is_member(restaurant_id));
create policy "owners manage members" on public.restaurant_members for all to authenticated using (public.is_owner(restaurant_id)) with check (public.is_owner(restaurant_id));

-- creator becomes owner automatically
create or replace function public.handle_new_restaurant() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.created_by is not null then
    insert into public.restaurant_members (restaurant_id, user_id, role) values (new.id, new.created_by, 'owner') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_restaurant_created after insert on public.restaurants for each row execute function public.handle_new_restaurant();

-- trial starts only on first publish
create or replace function public.handle_restaurant_publish() returns trigger language plpgsql security definer set search_path = public as $$
declare d int;
begin
  new.updated_at := now();
  if new.published and not old.published and new.trial_started_at is null and not new.is_demo then
    select trial_days into d from public.platform_settings where id = 1;
    new.trial_started_at := now();
    new.trial_ends_at := now() + make_interval(days => d);
    if new.status = 'draft' then new.status := 'trial'; end if;
  end if;
  return new;
end $$;
create trigger on_restaurant_update before update on public.restaurants for each row execute function public.handle_restaurant_publish();

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  address text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.locations to authenticated;
grant all on public.locations to service_role;
alter table public.locations enable row level security;
create policy "members locations" on public.locations for all to authenticated using (public.is_member(restaurant_id)) with check (public.is_owner(restaurant_id));

-- ===== Menus =====
create table public.menus (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  name_i18n jsonb not null default '{}',
  kind text not null default 'all_day',
  published boolean not null default true,
  position int not null default 0,
  schedule_days int[] not null default array[0,1,2,3,4,5,6],
  schedule_start time,
  schedule_end time,
  created_at timestamptz not null default now()
);
create index on public.menus(restaurant_id);
grant select on public.menus to anon;
grant select, insert, update, delete on public.menus to authenticated;
grant all on public.menus to service_role;
alter table public.menus enable row level security;
create policy "public menus" on public.menus for select to anon, authenticated using ((published and public.is_public_restaurant(restaurant_id)) or public.is_member(restaurant_id));
create policy "members write menus" on public.menus for all to authenticated using (public.is_member(restaurant_id)) with check (public.is_member(restaurant_id));

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  menu_id uuid not null references public.menus(id) on delete cascade,
  name text not null,
  name_i18n jsonb not null default '{}',
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.categories(menu_id);
grant select on public.categories to anon;
grant select, insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "public categories" on public.categories for select to anon, authenticated using (public.is_public_restaurant(restaurant_id) or public.is_member(restaurant_id));
create policy "members write categories" on public.categories for all to authenticated using (public.is_member(restaurant_id)) with check (public.is_member(restaurant_id));

create table public.dishes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  description text,
  name_i18n jsonb not null default '{}',
  description_i18n jsonb not null default '{}',
  price numeric(10,2) not null default 0 check (price >= 0),
  promo_price numeric(10,2) check (promo_price is null or promo_price >= 0),
  image_url text,
  allergens text[] not null default '{}',
  allergens_verified boolean not null default false,
  dietary text[] not null default '{}',
  featured boolean not null default false,
  available boolean not null default true,
  archived boolean not null default false,
  prep_minutes int,
  calories int,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.dishes(category_id);
create index on public.dishes(restaurant_id);
grant select on public.dishes to anon;
grant select, insert, update, delete on public.dishes to authenticated;
grant all on public.dishes to service_role;
alter table public.dishes enable row level security;
create policy "public dishes" on public.dishes for select to anon, authenticated using ((not archived and public.is_public_restaurant(restaurant_id)) or public.is_member(restaurant_id));
create policy "members write dishes" on public.dishes for all to authenticated using (public.is_member(restaurant_id)) with check (public.is_member(restaurant_id));

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  dish_id uuid not null references public.dishes(id) on delete cascade,
  recommended_dish_id uuid not null references public.dishes(id) on delete cascade,
  label text not null default 'Combina bem com',
  label_i18n jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (dish_id, recommended_dish_id),
  check (dish_id <> recommended_dish_id)
);
grant select on public.recommendations to anon;
grant select, insert, update, delete on public.recommendations to authenticated;
grant all on public.recommendations to service_role;
alter table public.recommendations enable row level security;
create policy "public recs" on public.recommendations for select to anon, authenticated using (public.is_public_restaurant(restaurant_id) or public.is_member(restaurant_id));
create policy "members write recs" on public.recommendations for all to authenticated using (public.is_member(restaurant_id)) with check (public.is_member(restaurant_id));

-- ===== Ratings (anonymous, one per session per dish) =====
create table public.dish_ratings (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  dish_id uuid not null references public.dishes(id) on delete cascade,
  session_id text not null,
  stars int not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  unique (dish_id, session_id)
);
grant insert, update on public.dish_ratings to anon, authenticated;
grant select on public.dish_ratings to authenticated;
grant all on public.dish_ratings to service_role;
alter table public.dish_ratings enable row level security;
create policy "anyone rates public" on public.dish_ratings for insert to anon, authenticated with check (public.is_public_restaurant(restaurant_id));
create policy "members read ratings" on public.dish_ratings for select to authenticated using (public.is_member(restaurant_id));

create or replace function public.rate_dish(_dish_id uuid, _session_id text, _stars int) returns void
language plpgsql security definer set search_path = public as $$
declare r uuid;
begin
  if _stars < 1 or _stars > 5 or length(_session_id) < 8 or length(_session_id) > 64 then raise exception 'invalid'; end if;
  select restaurant_id into r from public.dishes d where d.id = _dish_id and not d.archived and public.is_public_restaurant(d.restaurant_id);
  if r is null then raise exception 'not found'; end if;
  insert into public.dish_ratings (restaurant_id, dish_id, session_id, stars) values (r, _dish_id, _session_id, _stars)
  on conflict (dish_id, session_id) do update set stars = excluded.stars, created_at = now();
end $$;
grant execute on function public.rate_dish(uuid, text, int) to anon, authenticated;

create or replace function public.dish_rating_summary(_restaurant_id uuid)
returns table (dish_id uuid, avg_stars numeric, total bigint)
language sql stable security definer set search_path = public as $$
  select dish_id, round(avg(stars)::numeric, 1), count(*) from public.dish_ratings
  where restaurant_id = _restaurant_id and (public.is_public_restaurant(_restaurant_id) or public.is_member(_restaurant_id))
  group by dish_id
$$;
grant execute on function public.dish_rating_summary(uuid) to anon, authenticated;

-- ===== Analytics (anonymous, no personal data) =====
create table public.analytics_events (
  id bigint generated always as identity primary key,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  event_type text not null check (event_type in ('menu_view','dish_view','category_view','search','rec_impression','rec_click','language_change','call_click','instagram_click','reviews_click')),
  dish_id uuid,
  category_id uuid,
  lang text,
  source text,
  query text,
  session_id text,
  created_at timestamptz not null default now()
);
create index on public.analytics_events(restaurant_id, created_at);
grant insert on public.analytics_events to anon, authenticated;
grant select on public.analytics_events to authenticated;
grant all on public.analytics_events to service_role;
alter table public.analytics_events enable row level security;
create policy "anyone logs public" on public.analytics_events for insert to anon, authenticated with check (public.is_public_restaurant(restaurant_id) and (query is null or length(query) <= 80));
create policy "members read analytics" on public.analytics_events for select to authenticated using (public.is_member(restaurant_id));

-- ===== Subscriptions (Stripe-ready; nothing simulated) =====
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null unique references public.restaurants(id) on delete cascade,
  provider text not null default 'stripe',
  provider_customer_id text,
  provider_subscription_id text,
  status text not null default 'none',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;
alter table public.subscriptions enable row level security;
create policy "members read sub" on public.subscriptions for select to authenticated using (public.is_member(restaurant_id));

-- ===== Audit logs =====
create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  restaurant_id uuid,
  action text not null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
grant select, insert on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "admins read audit" on public.audit_logs for select to authenticated using (public.has_role(auth.uid(),'admin') or (restaurant_id is not null and public.is_owner(restaurant_id)));
create policy "users write own audit" on public.audit_logs for insert to authenticated with check (actor_id = auth.uid());

-- ===== Demo: Casa do Largo =====
insert into public.restaurants (id, slug, name, description, description_i18n, cover_url, address, phone, email, instagram_url, google_reviews_url, opening_hours, status, published, is_demo, primary_color, background_color, accent_color)
values ('00000000-0000-4000-a000-000000000001','casa-do-largo','Casa do Largo',
 'Cozinha portuguesa de mercado, num largo tranquilo de Lisboa. (Restaurante de demonstração)',
 '{"en":"Portuguese market cooking on a quiet Lisbon square. (Demo restaurant)"}',
 '/images/demo/cover.jpg','Largo do Carmo 12, 1200-092 Lisboa','+351210000000','ola@casadolargo.pt',
 'https://instagram.com','https://maps.google.com','Ter–Dom · 12:00–15:30 · 19:00–23:00','demo',true,true,'#18352B','#F6F3EC','#8FA68E');

insert into public.menus (id, restaurant_id, name, name_i18n, kind, position) values
('00000000-0000-4000-b000-000000000001','00000000-0000-4000-a000-000000000001','Carta','{"en":"Menu"}','all_day',0);

insert into public.categories (id, restaurant_id, menu_id, name, name_i18n, position) values
('00000000-0000-4000-c000-000000000001','00000000-0000-4000-a000-000000000001','00000000-0000-4000-b000-000000000001','Petiscos','{"en":"Small plates"}',0),
('00000000-0000-4000-c000-000000000002','00000000-0000-4000-a000-000000000001','00000000-0000-4000-b000-000000000001','Pratos principais','{"en":"Mains"}',1),
('00000000-0000-4000-c000-000000000003','00000000-0000-4000-a000-000000000001','00000000-0000-4000-b000-000000000001','Sobremesas','{"en":"Desserts"}',2),
('00000000-0000-4000-c000-000000000004','00000000-0000-4000-a000-000000000001','00000000-0000-4000-b000-000000000001','Bebidas','{"en":"Drinks"}',3);

insert into public.dishes (id, restaurant_id, category_id, name, description, name_i18n, description_i18n, price, promo_price, image_url, allergens, allergens_verified, dietary, featured, available, position) values
('00000000-0000-4000-d000-000000000001','00000000-0000-4000-a000-000000000001','00000000-0000-4000-c000-000000000001','Pastéis de bacalhau','Seis pastéis feitos à mão, maionese de coentros.','{"en":"Salt cod fritters"}','{"en":"Six hand-made fritters, coriander mayonnaise."}',7.50,null,'/images/demo/pasteis.jpg',array['fish','eggs','gluten'],true,'{}',true,true,0),
('00000000-0000-4000-d000-000000000002','00000000-0000-4000-a000-000000000001','00000000-0000-4000-c000-000000000001','Queijo da Serra ao forno','Com mel de rosmaninho e tostas.','{"en":"Baked Serra cheese"}','{"en":"With rosemary honey and toast."}',11.00,null,null,array['milk','gluten'],true,array['vegetarian'],false,true,1),
('00000000-0000-4000-d000-000000000003','00000000-0000-4000-a000-000000000001','00000000-0000-4000-c000-000000000002','Polvo à lagareiro','Polvo assado, batata a murro, azeite e alho.','{"en":"Roasted octopus lagareiro"}','{"en":"Roasted octopus, crushed potatoes, olive oil and garlic."}',22.00,19.50,'/images/demo/polvo.jpg',array['molluscs'],true,array['gluten_free'],true,true,0),
('00000000-0000-4000-d000-000000000004','00000000-0000-4000-a000-000000000001','00000000-0000-4000-c000-000000000002','Arroz de pato','Pato confitado, chouriço e laranja.','{"en":"Duck rice"}','{"en":"Confit duck, chouriço and orange."}',16.50,null,null,'{}',false,'{}',false,true,1),
('00000000-0000-4000-d000-000000000005','00000000-0000-4000-a000-000000000001','00000000-0000-4000-c000-000000000002','Risotto de cogumelos','Cogumelos silvestres e parmesão.','{"en":"Wild mushroom risotto"}','{"en":"Wild mushrooms and parmesan."}',14.00,null,null,array['milk'],true,array['vegetarian','gluten_free'],false,false,2),
('00000000-0000-4000-d000-000000000006','00000000-0000-4000-a000-000000000001','00000000-0000-4000-c000-000000000003','Pastel de nata','Massa folhada estaladiça, canela.','{"en":"Custard tart"}','{"en":"Crisp puff pastry, cinnamon."}',2.20,null,'/images/demo/nata.jpg',array['gluten','eggs','milk'],true,array['vegetarian'],true,true,0),
('00000000-0000-4000-d000-000000000007','00000000-0000-4000-a000-000000000001','00000000-0000-4000-c000-000000000003','Mousse de chocolate','Chocolate 70% e flor de sal.','{"en":"Chocolate mousse"}','{"en":"70% chocolate and sea salt."}',5.50,null,null,array['eggs','milk'],true,array['vegetarian','gluten_free'],false,true,1),
('00000000-0000-4000-d000-000000000008','00000000-0000-4000-a000-000000000001','00000000-0000-4000-c000-000000000004','Café','Expresso de lote da casa.','{"en":"Espresso"}','{"en":"House blend espresso."}',1.20,null,null,'{}',true,array['vegan'],false,true,0),
('00000000-0000-4000-d000-000000000009','00000000-0000-4000-a000-000000000001','00000000-0000-4000-c000-000000000004','Vinho verde (copo)','Alvarinho, Monção e Melgaço.','{"en":"Vinho verde (glass)"}','{"en":"Alvarinho, Monção and Melgaço."}',4.50,null,null,array['sulphites'],true,array['vegan'],false,true,1);

insert into public.recommendations (restaurant_id, dish_id, recommended_dish_id, label, label_i18n) values
('00000000-0000-4000-a000-000000000001','00000000-0000-4000-d000-000000000003','00000000-0000-4000-d000-000000000009','Combina bem com','{"en":"Pairs well with"}'),
('00000000-0000-4000-a000-000000000001','00000000-0000-4000-d000-000000000006','00000000-0000-4000-d000-000000000008','Combina bem com','{"en":"Pairs well with"}'),
('00000000-0000-4000-a000-000000000001','00000000-0000-4000-d000-000000000004','00000000-0000-4000-d000-000000000007','Para terminar','{"en":"To finish"}');
