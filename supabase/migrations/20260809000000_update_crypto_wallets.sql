-- Update crypto wallet receiving addresses & networks to current production values.
-- Idempotent: safe to re-run. Does not touch unrelated columns.

create table if not exists public.crypto_wallets (
  id text primary key,
  asset text not null,
  network text not null,
  address text not null,
  label text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.crypto_wallets (id, asset, network, address, label) values
  ('w-btc',  'BTC',  'Bitcoin',  'bc1qp0wfzxjfzgmfkpl4vhad33fg5yxympp38d226p', 'Bitcoin Network'),
  ('w-eth',  'ETH',  'Ethereum', '0x4E11Ce17ad141a6FfA679A9676e83f2da120C234', 'Ethereum Mainnet (ETH)'),
  ('w-usdt', 'USDT', 'ERC-20',   '0x4E11Ce17ad141a6FfA679A9676e83f2da120C234', 'Ethereum ERC-20 (USDT)'),
  ('w-sol',  'SOL',  'Solana',   'Nnjrnnrg8AjHfMVFyqvwPLDSw2R1ADq1bnyuWBz35Jg', 'Solana Network (No Memo Required)')
on conflict (id) do update set
  asset = excluded.asset,
  network = excluded.network,
  address = excluded.address,
  label = excluded.label,
  updated_at = now();

-- Keep the anon role able to read wallet details for public checkout display.
alter table public.crypto_wallets enable row level security;

drop policy if exists "wallets_read" on public.crypto_wallets;
create policy "wallets_read" on public.crypto_wallets
  for select to anon, authenticated using (true);

drop policy if exists "wallets_write" on public.crypto_wallets;
create policy "wallets_write" on public.crypto_wallets
  for all to authenticated using (public.is_admin()) with check (public.is_admin());