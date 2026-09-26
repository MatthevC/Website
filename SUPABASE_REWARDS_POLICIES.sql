-- Uruchom w Supabase SQL Editor
-- Zezwala administratorom aplikacji na zarządzanie nagrodami.
-- Jeśli używasz własnej tabeli uprawnień, dopasuj warunek.

create policy "authenticated can insert rewards"
on public.rewards
for insert
to authenticated
with check (true);

create policy "authenticated can update rewards"
on public.rewards
for update
to authenticated
using (true)
with check (true);

create policy "authenticated can delete rewards"
on public.rewards
for delete
to authenticated
using (true);

create policy "public can read rewards"
on public.rewards
for select
to anon, authenticated
using (true);
