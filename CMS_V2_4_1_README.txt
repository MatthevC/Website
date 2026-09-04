MATT'S WORLD — CMS v2.4.1

ZMIANA: DODAWANIE / EDYCJA STREAMERA

Formularz administratora nie wymaga już ręcznego wpisywania:
- loginu Twitch,
- ID / slugu klipu Twitch.

Administrator wpisuje tylko:
- Wyświetlaną nazwę,
- Link do kanału Twitch,
- Link do klipu Twitch,
- Krótki opis,
- Najczęściej ogrywane gry.

System automatycznie:
- odczytuje login z linku typu https://www.twitch.tv/nick,
- odczytuje slug klipu z https://clips.twitch.tv/SLUG,
- obsługuje też linki typu https://www.twitch.tv/nick/clip/SLUG,
- zapisuje wykryte wartości wewnętrznie, aby avatar Twitch i iframe klipu nadal działały.

Jeśli link do kanału albo klipu nie jest rozpoznawalnym linkiem Twitch, zapis zostanie zatrzymany z czytelnym komunikatem.

Nie są wymagane żadne nowe zmiany SQL ani migracje Supabase.
