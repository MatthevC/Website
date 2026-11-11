# MATT STUDIO – nowa paczka Firebase / GitHub Pages

## Co zmieniono
- Zintegrowano odwołania do klienta Firebase (`firebaseClient`) w kodzie frontendu.
- Zachowano istniejący adapter Firebase Auth i Firestore oraz aktualną konfigurację projektu.
- Zmieniono nazwę skryptu nagród na `rewards-firebase.js`.
- Zebrano grafiki w `assets/maps`, `assets/pictures`, `assets/phasmophobia-images`; zaktualizowano ścieżki tekstowe.
- Nie dodano workflow Actions. GitHub Pages: Deploy from a branch → main → /(root).

## WYMAGANE przed produkcją
1. Firebase Console → Authentication → Sign-in method → włącz Email/Password; utwórz użytkownika i zachowaj jego UID.
2. Firebase Console → Authentication → Settings → Authorized domains → dodaj nową domenę `NAZWA.github.io`.
3. Firebase Console → Firestore Database → utwórz bazę. `firestore.rules.example` jest **restrykcyjnym przykładem**, nie gotową polityką publicznego odczytu. Wstaw UID właściciela, a następnie przygotuj szczegółowe reguły dla publicznych danych i ról.
4. Dane z poprzedniej bazy NIE znajdują się w ZIP-ie; należy je wyeksportować i zaimportować do Firestore oddzielnie.
5. `firebase-bridge.js` jest adapterem częściowym. Funkcje administracyjne RPC, backup, Firebase Storage, Cloud Functions oraz pełne uprawnienia moderatorów wymagają implementacji i testów. Nie uznawaj ich za działające.
6. Klucz Firebase Web API jest publiczną częścią konfiguracji webowej, ale należy ograniczyć jego użycie w Google Cloud i zweryfikować reguły Firestore/Storage.
7. Nie przenoś historycznych loginów/haseł w postaci jawnej. Użytkowników twórz przez Firebase Auth i reset hasła.

## Publikacja
Utwórz nowe publiczne repozytorium GitHub, wgraj **zawartość** paczki do głównego katalogu repozytorium, potem Settings → Pages → Deploy from a branch → main → /(root) → Save.

## Stan migracji
To przygotowana struktura strony i klient Firebase, a nie ukończona migracja wszystkich danych i funkcji serwerowych. Przed udostępnieniem panelu administracyjnego wymagany jest audyt reguł, testy logowania, edycji CMS, uprawnień, uploadu i backupów.
