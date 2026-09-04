MATT'S WORLD — PROFIL UŻYTKOWNIKA v2.3

1. Uruchom w Supabase SQL Editor cały plik:
   CMS_UPDATE_USER_PROFILE.sql

2. Potem wgraj na GitHuba rozpakowaną zawartość wersji v2.3.

NOWOŚCI:
- avatar użytkownika wybierany z dysku,
- domyślny avatar „ludzik”, jeśli użytkownik nie wgra własnego,
- avatar widoczny obok nicku po zalogowaniu,
- EDYTUJ PROFIL pozwala samodzielnie zmieniać nick,
- zmiana e-maila bez prośby do administratora,
- zmiana hasła bez prośby do administratora,
- obecne hasło wymagane przy zmianie e-maila lub hasła,
- avatar do 8 MB: JPG / PNG / WEBP / GIF,
- użytkownik może modyfikować tylko własny avatar w Storage,
- konfigurator nie daje dostępu do zmiany roli/uprawnień.

UWAGA O E-MAILU:
Jeśli w Supabase Auth jest włączone potwierdzanie zmiany adresu e-mail,
użytkownik nadal musi kliknąć link wysłany przez Supabase. To jest zabezpieczenie
konta, a nie prośba/akceptacja administratora strony.
