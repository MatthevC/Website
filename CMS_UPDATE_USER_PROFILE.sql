-- =============================================================
-- MATT'S WORLD — PROFIL UŻYTKOWNIKA v2.3
-- Avatar z dysku + samodzielna zmiana nicku/e-maila/hasła
-- Uruchom CAŁOŚĆ raz w: Supabase -> SQL Editor -> New query -> Run
-- =============================================================

-- 1) Rozszerzenie tabeli profili
alter table public.profiles add column if not exists auth_user_id uuid;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- Powiązanie istniejących profili z kontami Supabase Auth na podstawie e-maila.
update public.profiles p
set auth_user_id = u.id,
    updated_at = now()
from auth.users u
where p.auth_user_id is null
  and p.email is not null
  and u.email is not null
  and lower(p.email) = lower(u.email);

create unique index if not exists profiles_auth_user_id_unique
on public.profiles(auth_user_id)
where auth_user_id is not null;

-- 2) Publiczny bucket z avatarami.
-- Odczyt obrazu jest publiczny, ale zapis/zmiana/usunięcie tylko we własnym folderze auth.uid().
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  8388608,
  array['image/jpeg','image/png','image/webp','image/gif']::text[]
)
on conflict (id) do update set
  public = true,
  file_size_limit = 8388608,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif']::text[];

-- Każdy zalogowany użytkownik może dodawać pliki TYLKO do swojego folderu.
drop policy if exists "matt profile avatar own insert" on storage.objects;
create policy "matt profile avatar own insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "matt profile avatar own update" on storage.objects;
create policy "matt profile avatar own update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "matt profile avatar own delete" on storage.objects;
create policy "matt profile avatar own delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 3) Bezpieczna funkcja do zmiany WŁASNEGO nicku i avatara.
-- Rola użytkownika NIE jest przyjmowana jako argument i nie może być zmieniona tym konfiguratorem.
create or replace function public.matt_update_own_profile(
  p_username text,
  p_avatar_url text default null,
  p_avatar_path text default null,
  p_set_avatar boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := auth.jwt() ->> 'email';
  v_username text := trim(coalesce(p_username, ''));
  v_profile public.profiles%rowtype;
begin
  if v_uid is null then
    raise exception 'Musisz być zalogowany.';
  end if;

  if char_length(v_username) < 2 or char_length(v_username) > 32 then
    raise exception 'Nazwa użytkownika musi mieć od 2 do 32 znaków.';
  end if;

  if exists (
    select 1
    from public.profiles p
    where lower(p.username) = lower(v_username)
      and coalesce(p.auth_user_id::text, '') <> v_uid::text
  ) then
    raise exception 'Ta nazwa użytkownika jest już zajęta.';
  end if;

  if p_set_avatar and p_avatar_path is not null then
    if split_part(p_avatar_path, '/', 1) <> v_uid::text then
      raise exception 'Nieprawidłowa ścieżka avatara.';
    end if;
  end if;

  -- Najpierw próbujemy po auth_user_id.
  update public.profiles
  set username = v_username,
      avatar_url = case when p_set_avatar then p_avatar_url else avatar_url end,
      avatar_path = case when p_set_avatar then p_avatar_path else avatar_path end,
      updated_at = now()
  where auth_user_id = v_uid
  returning * into v_profile;

  -- Kompatybilność ze starszym profilem identyfikowanym tylko przez e-mail.
  if not found then
    update public.profiles
    set auth_user_id = v_uid,
        username = v_username,
        avatar_url = case when p_set_avatar then p_avatar_url else avatar_url end,
        avatar_path = case when p_set_avatar then p_avatar_path else avatar_path end,
        updated_at = now()
    where lower(email) = lower(v_email)
    returning * into v_profile;
  end if;

  if not found then
    raise exception 'Nie znaleziono profilu dla zalogowanego użytkownika.';
  end if;

  return jsonb_build_object(
    'username', v_profile.username,
    'email', v_profile.email,
    'role', v_profile.role,
    'avatar_url', v_profile.avatar_url,
    'avatar_path', v_profile.avatar_path
  );
end;
$$;

revoke all on function public.matt_update_own_profile(text,text,text,boolean) from public;
grant execute on function public.matt_update_own_profile(text,text,text,boolean) to authenticated;

-- 4) Synchronizacja e-maila w profiles po rzeczywistej zmianie adresu w Supabase Auth.
-- Dzięki temu po potwierdzeniu nowego e-maila logowanie nickiem nadal działa.
create or replace function public.matt_sync_profile_email_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles
    set email = new.email,
        auth_user_id = new.id,
        updated_at = now()
    where auth_user_id = new.id
       or (auth_user_id is null and old.email is not null and lower(email) = lower(old.email));
  end if;
  return new;
end;
$$;

drop trigger if exists matt_sync_profile_email_after_auth_change on auth.users;
create trigger matt_sync_profile_email_after_auth_change
after update of email on auth.users
for each row
execute function public.matt_sync_profile_email_from_auth();

-- 5) Odświeżenie cache API Supabase.
NOTIFY pgrst, 'reload schema';

-- 6) Kontrola instalacji.
select
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name in ('auth_user_id','avatar_url','avatar_path','updated_at')
order by column_name;
