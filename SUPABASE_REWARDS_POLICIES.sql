-- Uruchom w Supabase SQL Editor
-- Polityki dla tabeli rewards

alter table public.rewards enable row level security;

drop policy if exists "authenticated can insert rewards" on public.rewards;
drop policy if exists "authenticated can update rewards" on public.rewards;
drop policy if exists "authenticated can delete rewards" on public.rewards;
drop policy if exists "public can read rewards" on public.rewards;

create policy "public can read rewards"
on public.rewards for select
to anon, authenticated
using (true);

create policy "authenticated can insert rewards"
on public.rewards for insert
to authenticated
with check (true);

create policy "authenticated can update rewards"
on public.rewards for update
to authenticated
using (true)
with check (true);

create policy "authenticated can delete rewards"
on public.rewards for delete
to authenticated
using (true);
