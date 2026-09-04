-- =============================================================
-- MATT'S WORLD — CMS v2.4
-- Upewnia się, że obrazy CMS (m.in. grafika powitalna) mogą być
-- wysyłane wyłącznie przez zalogowanego administratora.
--
-- Jeżeli wcześniej uruchomiłeś CMS_UPDATE_MODERATOR_IMAGES.sql,
-- ten plik jest opcjonalny. Można go jednak bezpiecznie uruchomić ponownie.
-- =============================================================

create or replace function public.matt_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.email = (auth.jwt() ->> 'email')
      and p.role = 'admin'
  );
$$;

revoke all on function public.matt_is_admin() from public;
grant execute on function public.matt_is_admin() to authenticated;

insert into storage.buckets (id, name, public)
values ('cms-images', 'cms-images', true)
on conflict (id) do update set public = true;

drop policy if exists "matt cms images admin insert" on storage.objects;
create policy "matt cms images admin insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'cms-images' and public.matt_is_admin());

drop policy if exists "matt cms images admin update" on storage.objects;
create policy "matt cms images admin update"
on storage.objects
for update
to authenticated
using (bucket_id = 'cms-images' and public.matt_is_admin())
with check (bucket_id = 'cms-images' and public.matt_is_admin());

drop policy if exists "matt cms images admin delete" on storage.objects;
create policy "matt cms images admin delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'cms-images' and public.matt_is_admin());

NOTIFY pgrst, 'reload schema';
