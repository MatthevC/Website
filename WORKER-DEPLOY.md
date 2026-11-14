# Wdrożenie zarządzania kontami MATT’S WORLD

1. Najpierw wykonaj kopię obecnego kodu Workera `matt-world-auth`.
2. Cloudflare > Workers & Pages > `matt-world-auth` > Edit code: wklej zawartość pliku `worker-matt-world-auth.js` z paczki i wdroż.
3. W ustawieniach Workera pozostaw `FIREBASE_PROJECT_ID`, sekret `FIREBASE_SERVICE_ACCOUNT` oraz powiązanie KV `LOGIN_LIMIT`. Nie publikuj ich wartości.
4. Sprawdź `/health` — `configured` powinno być `true`.
5. Dopiero potem wgraj zmienione pliki strony na GitHub Pages. Zrób twarde odświeżenie.
6. Przetestuj logowanie admina, listę kont, utworzenie użytkownika, pierwsze logowanie, zmianę uprawnień, reset hasła i usunięcie testowego konta.

Uwaga: to kod przygotowany statycznie, nie został przetestowany z Twoimi usługami. Przed wdrożeniem sprawdź, czy Firebase Auth Admin REST API ma wymagane uprawnienia, czy Firestore Rules pozwalają zalogowanemu użytkownikowi odczytać własny profil oraz czy administrator ma dostęp do dokumentów CMS. Zmiana panelu nie usuwa dokumentów z Firestore. Jeśli masz inne mechanizmy w `admin/`, zachowaj kopię.
