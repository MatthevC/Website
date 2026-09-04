MATT'S WORLD - CMS V2 / GITHUB + SUPABASE + BACKUPY
====================================================

MODEL HYBRYDOWY
---------------
1. GitHub przechowuje kod strony i treść bazową (HTML/JS/CSS/grafiki).
2. Supabase przechowuje tylko zmiany wykonane w konfiguratorze administratora.
3. Jeśli dany tekst/sekcja nie ma nadpisania w Supabase, strona używa aktualnej wersji z plików GitHuba.
4. Podmiana plików na GitHubie nadal jest możliwa i jest właściwym sposobem na większe przebudowy strony.

WAŻNE - JEŚLI POPRZEDNI CMS_SETUP.sql BYŁ JUŻ URUCHOMIONY
---------------------------------------------------------
Uruchom tylko plik CMS_UPDATE_BACKUP.sql w Supabase -> SQL Editor.
Nie musisz usuwać istniejącej tabeli cms_data ani dotychczasowych zmian.

Jeśli instalujesz CMS od zera, wystarczy aktualny CMS_SETUP.sql.

TYLKO ADMINISTRATOR
-------------------
Elementy edycyjne są pokazywane wyłącznie po zalogowaniu użytkownika z:
profiles.role = 'admin'

Bezpieczeństwo nie opiera się wyłącznie na ukryciu przycisków. Polityki RLS oraz funkcje Supabase również sprawdzają rolę administratora. Zwykły użytkownik może odczytać treść strony, ale nie może jej zapisywać, usuwać, tworzyć backupów ani wykonywać restore.

EDYCJA TEKSTÓW
--------------
- EDYTUJ TEKSTY działa na podstronach objętych CMS.
- Supabase zapisuje tylko teksty faktycznie różniące się od wersji GitHub.
- Nieedytowane pola pozostają zależne od plików GitHuba.
- Z GITHUBA usuwa nadpisania tekstowe bieżącej podstrony i przywraca aktualną treść z plików.

KONFIGURATORY
-------------
- Eventy: dodawanie / edycja / usuwanie.
- Streamerzy: dodawanie / edycja / usuwanie.
- Moderacja: dodawanie / edycja / usuwanie osób.
- Korzyści moderatora: dodawanie / edycja / usuwanie.
- Komendy: dodawanie / edycja / usuwanie, kategorie i role.
- Kontakt: tematy formularza.
- Discord: kategorie i kanały.

W konfiguratorach przycisk PRZYWRÓĆ Z GITHUBA usuwa daną wersję z CMS i wraca do danych zapisanych w kodzie strony.

BACKUPY
-------
W pasku administratora znajduje się przycisk BACKUPY.

Backup obejmuje:
- wszystkie rekordy cms_data,
- wszystkie eventy.

Możliwości:
- ręczne utworzenie backupu,
- pobranie backupu jako pliku JSON,
- wczytanie pliku JSON,
- przywrócenie jednego z backupów zapisanych w Supabase.

AUTOMATYCZNE BACKUPY
--------------------
Przed każdym zapisem lub resetem danych CMS oraz przed dodaniem, edycją lub usunięciem eventu tworzony jest automatyczny snapshot bieżącego stanu.

Backupów zapisanych w cms_backups nie można edytować ani usuwać z poziomu strony. Administrator może je odczytać i przywrócić, ale nie może ich skasować przez API strony.

Przed każdym przywróceniem backupu automatycznie tworzona jest dodatkowa kopia stanu, który właśnie ma zostać zastąpiony.

CO Z PLIKAMI GITHUB?
--------------------
Backup CMS nie zawiera całego index.html, app.js, style.css ani grafik. Kod strony jest chroniony przez historię GitHuba.

Jeśli zepsujesz większą aktualizację kodu:
- cofnij repozytorium do wcześniejszego commita / wersji w GitHubie.

Jeśli ktoś usunie lub popsuje treść przez konfigurator:
- użyj BACKUPY w panelu administratora albo zaimportuj wcześniej pobrany plik JSON.

To daje dwie niezależne warstwy odzyskiwania:
GITHUB = kod i układ strony
SUPABASE BACKUP = treści CMS i eventy

PRZYSZŁE KONTA MODERATORÓW
--------------------------
Obecna wersja celowo przyznaje wszystkie funkcje edycji wyłącznie roli admin. W przyszłości można dodać osobną tabelę uprawnień i nadać moderatorom dostęp tylko do wybranych konfiguratorów.


V2.1: Grafiki eventów dostają czytelne nazwy (np. event-turniej-2026-09-04-1031.jpg), a formularz nie pokazuje długich UUID. Jeśli pojawi się komunikat o matt_create_backup/schema cache, uruchom CMS_UPDATE_BACKUP.sql i odśwież stronę.
