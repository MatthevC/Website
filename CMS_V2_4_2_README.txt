MATT'S WORLD CMS v2.4.2

Zmiana względem v2.4.1:
- formularz streamera ma przycisk „⚡ AUTOMATYCZNA KONFIGURACJA”,
- po podaniu linku kanału automatycznie pobiera nazwę, opis, gry i najlepszy klip,
- integracja używa Supabase Edge Function, aby nie ujawniać Twitch Client Secret,
- Edge Function zezwala na użycie tylko kontu z profiles.role = 'admin'.

Przed użyciem automatycznej konfiguracji wykonaj instrukcję TWITCH_AUTOFILL_SETUP.txt.
Nie jest wymagany nowy SQL do bazy danych.
