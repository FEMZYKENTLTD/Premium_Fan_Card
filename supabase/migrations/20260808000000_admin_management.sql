-- Admin management & password reset support.
-- Complements 20260807000000_vip_schema.sql which already creates the
-- public.admin_emails table plus read/admin-write policies.

-- Administrators may update any profile row (needed to sync role = 'admin'
-- when a new administrator email is added from the dashboard).
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Ensure the admin_emails whitelist policies exist even on a fresh database.
alter table public.admin_emails enable row level security;

drop policy if exists "admin_emails_read" on public.admin_emails;
create policy "admin_emails_read" on public.admin_emails
  for select to anon, authenticated using (true);

drop policy if exists "admin_emails_write" on public.admin_emails;
create policy "admin_emails_write" on public.admin_emails
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());