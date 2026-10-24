-- Marcos Jeeves VIP Management - full schema, RLS, seed
create table if not exists public.admin_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.membership_packages (
  id text primary key,
  name text not null,
  price numeric not null,
  tier text not null,
  benefits text[] not null default '{}',
  description text not null default '',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crypto_wallets (
  id text primary key,
  asset text not null,
  network text not null,
  address text not null,
  label text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  reference text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  package_id text not null,
  package_name text not null,
  package_price numeric not null,
  status text not null default 'awaiting_payment',
  payment_method text,
  payment_payload jsonb,
  admin_notes text,
  additional_info_requested text,
  additional_info_provided text,
  card_artwork_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id text primary key,
  order_id text not null,
  admin_id uuid not null,
  admin_name text not null default '',
  previous_status text not null,
  new_status text not null,
  notes text not null default '',
  timestamp timestamptz not null default now()
);

create table if not exists public.notifications (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  subject text not null,
  body text not null,
  type text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- profile columns
alter table public.profiles add column if not exists role text not null default 'client';
alter table public.profiles add column if not exists date_of_birth text;

-- admin helper (security definer to avoid RLS recursion)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
  or exists (
    select 1 from public.admin_emails a
    where lower(a.email) = lower((select email from auth.users where id = (select auth.uid())))
  );
$$;

-- enable RLS
alter table public.admin_emails enable row level security;
alter table public.membership_packages enable row level security;
alter table public.crypto_wallets enable row level security;
alter table public.orders enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;

-- admin_emails: public read for validation; admin write
drop policy if exists "admin_emails_read" on public.admin_emails;
create policy "admin_emails_read" on public.admin_emails for select to anon, authenticated using (true);
drop policy if exists "admin_emails_write" on public.admin_emails;
create policy "admin_emails_write" on public.admin_emails for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- packages & wallets: public read; admin write
drop policy if exists "packages_read" on public.membership_packages;
create policy "packages_read" on public.membership_packages for select to anon, authenticated using (true);
drop policy if exists "packages_write" on public.membership_packages;
create policy "packages_write" on public.membership_packages for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "wallets_read" on public.crypto_wallets;
create policy "wallets_read" on public.crypto_wallets for select to anon, authenticated using (true);
drop policy if exists "wallets_write" on public.crypto_wallets;
create policy "wallets_write" on public.crypto_wallets for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- orders: user owns; admin all
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders for select to authenticated using ((select auth.uid()) = user_id or public.is_admin());
drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "orders_update" on public.orders;
create policy "orders_update" on public.orders for update to authenticated using ((select auth.uid()) = user_id or public.is_admin()) with check ((select auth.uid()) = user_id or public.is_admin());
drop policy if exists "orders_delete" on public.orders;
create policy "orders_delete" on public.orders for delete to authenticated using (public.is_admin());

-- audit_logs: admin all; users read logs for their orders
drop policy if exists "audit_admin" on public.audit_logs;
create policy "audit_admin" on public.audit_logs for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "audit_read_own" on public.audit_logs;
create policy "audit_read_own" on public.audit_logs for select to authenticated using (exists (select 1 from public.orders o where o.id = audit_logs.order_id and o.user_id = (select auth.uid())));

-- notifications: user owns; admin all
drop policy if exists "notif_select_own" on public.notifications;
create policy "notif_select_own" on public.notifications for select to authenticated using ((select auth.uid()) = user_id or public.is_admin());
drop policy if exists "notif_insert" on public.notifications;
create policy "notif_insert" on public.notifications for insert to authenticated with check ((select auth.uid()) = user_id or public.is_admin());
drop policy if exists "notif_update_own" on public.notifications;
create policy "notif_update_own" on public.notifications for update to authenticated using ((select auth.uid()) = user_id or public.is_admin()) with check ((select auth.uid()) = user_id or public.is_admin());

-- profiles: allow admin to read all profiles
drop policy if exists "profiles_admin_read";
create policy "profiles_admin_read" on public.profiles for select to authenticated using (public.is_admin());

-- seed admin emails
insert into public.admin_emails (email) values
  ('marcosjeevesvipmanagement@gmail.com'),
  ('philipchinkfo108@gmail.com')
on conflict (email) do nothing;

-- seed packages
insert into public.membership_packages (id, name, price, tier, benefits, description, active, sort_order) values
  ('pkg-silver', 'Silver Sovereign', 1000, 'silver', array['Early event notification','Digital member card','Priority support channel','Quarterly brand digest','Member-only newsletter access'], 'Entry into the Marcos Jeeves private circle with essential privileges and early access to all curated members events.', true, 1),
  ('pkg-gold', 'Gold Apex', 3000, 'gold', array['VIP lounge access','Concert priority seating','Quarterly concierge digest','Dedicated account manager','Exclusive merchandise drops','Annual gala invitation'], 'Elevated access to VIP experiences, priority seating at concerts, and a dedicated concierge digest each quarter.', true, 2),
  ('pkg-platinum', 'Platinum Elite', 5000, 'platinum', array['Closed-door session invitations','Artist meetups','Personal concierge service','Private dining reservations','Bespoke experience curation','Priority all-access passes','Annual luxury gift box'], 'Exclusive invitations to closed-door sessions and artist meetups with a personal concierge at your service.', true, 3),
  ('pkg-obsidian', 'Obsidian Royal', 20000, 'obsidian', array['All-access backstage passes','Private dining access','Bespoke physical & digital engraved membership','Direct director line','Lifetime concierge priority','Annual international retreat','Unlimited guest privileges','Custom experience commissioning'], 'The pinnacle of luxury. All-access backstage passes, private dining, bespoke engraved membership, and a direct line to our directors.', true, 4)
on conflict (id) do nothing;

-- seed wallets
insert into public.crypto_wallets (id, asset, network, address, label) values
  ('w-btc', 'BTC', 'Bitcoin', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', 'Bitcoin Mainnet'),
  ('w-eth', 'ETH', 'ERC-20', '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', 'Ethereum Mainnet'),
  ('w-usdt', 'USDT', 'TRC-20', 'TJC5qf29L4rMGVUfCPxMPBSxJ7F3XDDWjM', 'Tron USDT'),
  ('w-sol', 'SOL', 'Solana', '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 'Solana Mainnet')
on conflict (id) do nothing;
