-- Editable site contact settings + migrate primary admin email.
-- Contact details (support emails, telegram) become admin-editable from the
-- dashboard instead of being hardcoded in the frontend bundle.

create table if not exists public.site_settings (
  id text primary key default 'default',
  support_emails text[] not null default '{}',
  telegram_phone text not null default '',
  telegram_handle text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "site_settings_read" on public.site_settings;
create policy "site_settings_read" on public.site_settings
  for select to anon, authenticated using (true);

drop policy if exists "site_settings_write" on public.site_settings;
create policy "site_settings_write" on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Seed the single settings row (safe to re-run; never clobbers admin edits).
insert into public.site_settings (id, support_emails, telegram_phone, telegram_handle)
values (
  'default',
  array['morganwallen16041986@gmail.com', 'philipchinkfo108@gmail.com'],
  '+14806968069',
  '@keanu_reeves_vip_management'
)
on conflict (id) do nothing;

-- Swap the legacy primary contact/admin email for the new one.
delete from public.admin_emails where lower(email) = 'keanureevesvipmanagement@gmail.com';
insert into public.admin_emails (email)
values ('morganwallen16041986@gmail.com')
on conflict (email) do nothing;

-- Keep the seed list aligned with the newly seeded support emails.
update public.site_settings
  set support_emails = array(
    select distinct e from unnest(support_emails || array['morganwallen16041986@gmail.com']) as e
  ),
  updated_at = now()
where id = 'default';