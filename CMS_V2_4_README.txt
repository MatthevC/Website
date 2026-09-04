MATT'S WORLD — CMS v2.4
=======================

NOWOŚCI:
1. MENU / KATEGORIE I PODKATEGORIE
   - administrator może dodawać, edytować i usuwać kategorie menu,
   - może dodawać podkategorie i przypisywać im ścieżkę/link,
   - można zmieniać kolejność kategorii i podkategorii strzałkami.

2. GRAFIKA POWITALNA
   - na stronie głównej konfigurator „GRAFIKA POWITALNA”,
   - obraz wybierany bezpośrednio z dysku,
   - upload do bucketu cms-images w Supabase,
   - „Przywróć z GitHuba” usuwa nadpisanie CMS.

3. REGULAMINY
   - dodawanie i usuwanie dymków zasad,
   - edycja ikony, etykiety, tytułu i treści,
   - możliwość ustawienia szerokiego dymku,
   - zmiana kolejności strzałkami,
   - numeracja 01, 02, 03... jest wyliczana automatycznie.

4. KOLEJNOŚĆ ELEMENTÓW
   - Polecani streamerzy,
   - Nasza moderacja,
   - pozostałe listy korzystające z tego samego konfiguratora,
   - Discord: kategorie i kanały.

5. LINKI SOCIAL MEDIA
   - globalny panel MENU / LINKI,
   - Twitch, Discord, Instagram i TikTok,
   - adresy są stosowane do oficjalnych ikon/przycisków oznaczonych w serwisie.

6. OPIS KANAŁÓW DISCORD
   - pełne dodawanie/edycja/usuwanie kategorii i kanałów,
   - edycja ikony, nazwy, pełnego opisu i wyróżnienia,
   - zmiana kolejności kategorii i kanałów.

BEZPIECZEŃSTWO:
- konfiguratory pojawiają się tylko przy currentUserIsAdmin === true,
- zapis CMS dodatkowo wymaga uprawnień administratora,
- upload grafik jest chroniony politykami Storage/RLS.

BAZA DANYCH:
Nowe funkcje strukturalne korzystają z istniejącej tabeli cms_data, więc nie
potrzebują nowych kolumn. Grafika powitalna korzysta z istniejącego bucketu
cms-images. Jeżeli uruchamiałeś wcześniej CMS_UPDATE_MODERATOR_IMAGES.sql,
nie musisz wykonywać dodatkowej migracji. Dla pewności możesz uruchomić
CMS_UPDATE_V2_4.sql — jest idempotentny.

MODEL HYBRYDOWY NADAL DZIAŁA:
GitHub = wartości bazowe / kod.
Supabase = tylko nadpisania administratora.
Przycisk „Z GITHUBA” usuwa odpowiednie nadpisanie i wraca do wersji z plików.
