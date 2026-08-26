const app = document.getElementById("app");

const MODERATOR_TEAM = [
  {
    name: "Blackstaryolow",
    role: "MODERATOR GŁÓWNY",
    description: "Koordynuje pracę całej moderacji i czuwa nad tym, żeby zespół działał sprawnie. Wspiera pozostałych moderatorów, pomaga w trudniejszych sytuacjach i dba o dobrą atmosferę w społeczności.",
    twitch: "https://www.twitch.tv/blackstaryolow",
    discord: "blackstaryolow",
    image: "pictures/moderators/blackstaryolow.webp"
  },
  {
    name: "xorzech112",
    role: "KOORDYNATOR EVENTÓW",
    description: "Odpowiada za organizacyjną stronę naszych eventów — pomaga przy przygotowaniach, pilnuje przebiegu wydarzeń i wspiera ekipę, żeby wszystko odbywało się zgodnie z planem.",
    twitch: "https://www.twitch.tv/xorzech112",
    discord: "orzech8933",
    image: "pictures/moderators/xorzech112.webp"
  },
  {
    name: "x_aeriel",
    role: "OPIEKUNKA SPOŁECZNOŚCI",
    description: "Dba o kontakt ze społecznością i dobrą atmosferę wokół transmisji. Pomaga nowym osobom odnaleźć się w ekipie, wspiera rozmowy i pilnuje, żeby każdy czuł się u nas mile widziany.",
    twitch: "https://www.twitch.tv/x_aeriel",
    discord: "_.aeriel",
    image: "pictures/moderators/x_aeriel.webp"
  },
  {
    name: "texturalorc",
    role: "STRAŻNIK DISCORDA",
    description: "Czuwa nad porządkiem na naszym Discordzie. Pilnuje przestrzegania zasad, reaguje na problemy i pomaga utrzymać serwer jako uporządkowane i przyjazne miejsce dla całej społeczności.",
    twitch: "https://www.twitch.tv/texturalorc",
    discord: "textural__",
    image: "pictures/moderators/texturalorc.webp"
  }
];

const pages = {
  home: {
    title: "CENTRUM <span>SPOŁECZNOŚCI</span>",
    intro: "Wszystko, czego potrzebujesz jako widz, VIP, moderator lub członek naszej społeczności — w jednym miejscu.",
    body: `
      <div class="hero">
        <div class="container hero-grid">
          <section class="hero-main">
            <div class="hero-content">
              <div class="eyebrow">OFICJALNA STRONA SPOŁECZNOŚCI</div>
              <h1>WITAJ NA<br><span>NASZEJ STRONIE</span></h1>
              <p>Znajdziesz tutaj wszystko co potrzebujesz przyjacielu. Życzymy miłego dnia!</p>
            </div>
          </section>
          <aside class="hero-side">
            <div class="side-card discord-card">
              <svg class="discord-watermark" viewBox="0 0 128 96" aria-hidden="true"><path fill="currentColor" d="M102.4 13.2A93.2 93.2 0 0 0 78.7 6l-3.4 7.1a86.2 86.2 0 0 0-22.6 0L49.3 6a93.6 93.6 0 0 0-23.8 7.3C10.4 36.1 6.2 58.5 8.3 80.6a94.8 94.8 0 0 0 29.2 14.7l7.1-9.7c-3.9-1.4-7.6-3.1-11.1-5.1l2.7-2.1c21.4 10 44.6 10 65.8 0l2.8 2.1c-3.5 2-7.2 3.7-11.1 5.1l7.1 9.7a94.8 94.8 0 0 0 29.2-14.7c2.4-25.6-4.1-47.8-17.6-67.4ZM42.8 68.1c-6.4 0-11.6-5.9-11.6-13.1s5.1-13.1 11.6-13.1 11.7 5.9 11.6 13.1c0 7.2-5.1 13.1-11.6 13.1Zm42.4 0c-6.4 0-11.6-5.9-11.6-13.1s5.1-13.1 11.6-13.1 11.7 5.9 11.6 13.1c0 7.2-5.1 13.1-11.6 13.1Z"/></svg>
              <h3>NASZ DISCORD</h3>
              <p>Dołącz do naszej społeczności, poznaj ludzi, korzystaj z kanałów i bądź na bieżąco z tym, co dzieje się w MATT'S WORLD.</p>
              <a class="red-link" id="hero-discord-link" href="#" target="_blank" rel="noopener">DOŁĄCZ NA DISCORDA →</a>
            </div>
            <div class="side-card">
              <h3>EVENTY</h3>
              <p>Najnowsze informacje o eventach znajdziesz w naszym blogu. Najnowsze wpisy są zawsze na górze.</p>
              <a class="red-link" href="#/events">ZOBACZ EVENTY →</a>
            </div>
          </aside>
        </div>
      </div>

      <div class="container content-wrap">
        <div class="section-heading">
          <div>
            <h2>NAJWAŻNIEJSZE SEKCJE</h2>
          </div>
          <p>Wybierz interesującą Cię kategorię</p>
        </div>

        <div class="quick-grid">
          <a class="quick-card" href="#/viewer/commands">
            <div class="num">01 / DLA WIDZA</div>
            <h3>KOMENDY DLA WIDZA</h3>
            <p>Najważniejsze komendy, z których możesz korzystać podczas transmisji.</p>
          </a>
          <a class="quick-card" href="#/viewer/rewards">
            <div class="num">02 / DLA WIDZA</div>
            <h3>NAGRODY</h3>
            <p>Sprawdź dostępne nagrody i dowiedz się, jak możesz je zdobywać.</p>
          </a>
          <a class="quick-card" href="#/viewer/dixper">
            <div class="num">03 / DLA WIDZA</div>
            <h3>DIXPER</h3>
            <p>Informacje o interakcjach, akcjach i zabawie podczas streama.</p>
          </a>
          <a class="quick-card" href="#/rules/general">
            <div class="num">04 / REGULAMINY</div>
            <h3>REGULAMIN OGÓLNY</h3>
            <p>Najważniejsze zasady obowiązujące w naszej społeczności.</p>
          </a>
        </div>

        <div class="section-heading">
          <div><h2>CO NOWEGO?</h2></div>
          <a class="red-link" href="#/events">WSZYSTKIE EVENTY →</a>
        </div>

        <div id="home-events" class="event-list"></div>
      </div>
    `
  },

  "rules/general": {
    title: "REGULAMIN <span>OGÓLNY</span>",
    body: generalRulesPage()
  },
  "rules/discord": {
    title: "REGULAMIN <span>DISCORD</span>",
    body: rulesPage("REGULAMIN DISCORD", "Zasady korzystania z naszego serwera Discord.")
  },
  "rules/twitch": {
    title: "REGULAMIN <span>TWITCH</span>",
    body: rulesPage("REGULAMIN TWITCH", "Zasady obowiązujące podczas transmisji na Twitchu.")
  },
  "rules/events": {
    title: "REGULAMIN <span>EVENTÓW</span>",
    body: rulesPage("REGULAMIN EVENTÓW", "Zasady uczestnictwa w organizowanych eventach.")
  },

  "viewer/commands": {
    title: "DLA WIDZA / <span>KOMENDY</span>",
    body: commandsPage()
  },
  "vip/commands": {
    title: "DLA WIDZA / <span>KOMENDY</span>",
    body: commandsPage()
  },
  "moderator/commands": {
    title: "MODERACJA / <span>KOMENDY</span>",
    body: commandsPage()
  },

  "viewer/dixper": {
    title: "DLA WIDZA / <span>DIXPER</span>",
    body: infoPage("DIXPER", "Informacje dotyczące interakcji z transmisją za pomocą Dixper.", "Tutaj później wpiszemy dokładnie, jak działają skrzynki, akcje, nagrody i zasady korzystania z Dixper.")
  },
  "viewer/rewards": {
    title: "DLA WIDZA / <span>NAGRODY</span>",
    body: infoPage("NAGRODY", "Informacje o nagrodach dostępnych dla widzów.", "Tutaj możemy później dodać tabelę nagród, wymagania, punkty kanału oraz zasady odbierania nagród.")
  },

  "viewer/vip": {
    title: "DLA WIDZA / <span>VIP</span>",
    body: vipPage()
  },
  // Stare adresy VIP pozostają aktywne dla kompatybilności ze wcześniejszymi linkami.
  "vip": { title: "DLA WIDZA / <span>VIP</span>", body: vipPage() },
  "vip/how-to": { title: "DLA WIDZA / <span>VIP</span>", body: vipPage() },
  "vip/benefits": { title: "DLA WIDZA / <span>VIP</span>", body: vipPage() },

  "moderator/team": {
    title: "MODERACJA / <span>NASZA MODERACJA</span>",
    body: moderatorTeamPage()
  },
  "moderator/benefits": {
    title: "MODERACJA / <span>KORZYŚCI</span>",
    body: moderatorBenefitsPage()
  },

  // Stare adresy moderatora pozostają aktywne, ale prowadzą do nowych sekcji.
  "moderator/how-to": {
    title: "MODERACJA / <span>KORZYŚCI</span>",
    body: moderatorBenefitsPage()
  },
  "moderator/rules": {
    title: "MODERACJA / <span>NASZA MODERACJA</span>",
    body: moderatorTeamPage()
  },

  "discord/join": {
    title: "NASZ DISCORD / <span>DOŁĄCZ</span>",
    body: discordJoinPage()
  },
  "discord/roles": {
    title: "NASZ DISCORD / <span>KANAŁY I ROLE</span>",
    body: infoPage("OPIS KANAŁÓW ORAZ RÓL", "Opis struktury serwera Discord.", "Tutaj stworzymy kompletną listę kanałów, kategorii, rang oraz ich przeznaczenia.")
  },

  contact: {
    title: "KONTAKT / <span>WNIOSKI</span>",
    body: contactPage()
  }
};


function getCommandFilterDefaults() {
  const preset = sessionStorage.getItem("commandsPreset");
  if (preset) sessionStorage.removeItem("commandsPreset");

  if (preset === "moderator") {
    return { viewer: false, vip: false, mod: true };
  }

  const route = window.location.hash.split("?")[0];
  if (route === "#/moderator/commands") {
    return { viewer: false, vip: false, mod: true };
  }
  return { viewer: true, vip: true, mod: false };
}

function isEventEnded(event) {
  if (!event || !event.endDate) return false;
  const end = new Date(`${event.endDate}T23:59:59`);
  return Date.now() >= end.getTime();
}

function generalRulesPage() {
  return `
    <div class="container content-wrap">
      <div class="page-panel rules-showcase">
        <a class="back-link" href="#/">← WRÓĆ NA START</a>

        <div class="rules-hero">
          <div class="rules-hero-badge">REGULAMIN OGÓLNY</div>
          <h1>ZASADY, KTÓRE UTRZYMUJĄ <span>DOBRY KLIMAT</span></h1>
          <p>U nas stawiamy na dobrą atmosferę, szacunek i wspólną zabawę. Poniżej znajdziesz 4 najważniejsze zasady, które łatwo zapamiętać i jeszcze łatwiej stosować.</p>
        </div>

        <div class="rules-memory-strip">
          <div class="rules-memory-title">Zapamiętaj w skrócie:</div>
          <div class="rules-memory-tags">
            <span>DOBRA ZABAWA</span>
            <span>BEZ PRYWATNYCH DRAM</span>
            <span>BEZ KŁÓTNI</span>
            <span>REGULAMIN TWITCHA</span>
          </div>
        </div>

        <div class="rules-card-grid">
          <section class="rule-card">
            <div class="rule-card-top">
              <div class="rule-card-number">01</div>
              <div class="rule-card-icon" aria-hidden="true">🎮</div>
            </div>
            <div class="rule-card-label">ATMOSFERA</div>
            <h2>Baw się dobrze i nie bądź dzbanem</h2>
            <p>Najważniejsza zasada naszej społeczności: bawimy się wspólnie i nie psujemy innym humoru. Szacunek, luz i pozytywna energia zawsze wygrywają.</p>
          </section>

          <section class="rule-card">
            <div class="rule-card-top">
              <div class="rule-card-number">02</div>
              <div class="rule-card-icon" aria-hidden="true">🧩</div>
            </div>
            <div class="rule-card-label">PRYWATNE SPRAWY</div>
            <h2>Prywatne dramy zostawcie dla siebie</h2>
            <p>Jeżeli macie między sobą konflikt, nie przenoście go na stream, Discord ani eventy. Wystarczy dać znać, że razem nie gracie, nie gadacie i nie ma tematu.</p>
          </section>

          <section class="rule-card">
            <div class="rule-card-top">
              <div class="rule-card-number">03</div>
              <div class="rule-card-icon" aria-hidden="true">🕊️</div>
            </div>
            <div class="rule-card-label">SPOKÓJ</div>
            <h2>Nie gadamy o polityce, religii i innych tematach do kłótni</h2>
            <p>Omijamy tematy, które najczęściej kończą się niepotrzebnymi spięciami. Chcemy budować miejsce do odpoczynku i zabawy, a nie pole do sporów.</p>
          </section>

          <section class="rule-card">
            <div class="rule-card-top">
              <div class="rule-card-number">04</div>
              <div class="rule-card-icon" aria-hidden="true">📜</div>
            </div>
            <div class="rule-card-label">PLATFORMA</div>
            <h2>Przestrzegamy regulaminu Twitcha</h2>
            <p>Jesteśmy częścią platformy Twitch, dlatego obowiązują nas także jej zasady. To podstawa bezpiecznego i spokojnego korzystania z transmisji.</p>
          </section>
        </div>

        <div class="rules-summary-box">
          <h2>Krótko mówiąc</h2>
          <p>Tworzymy społeczność, w której liczy się dobra zabawa, wzajemny szacunek i brak niepotrzebnych konfliktów. Jeśli każdy trzyma się tych 4 zasad, wszystkim jest po prostu przyjemniej.</p>
        </div>
      </div>
    </div>
  `;
}

function rulesPage(title, subtitle) {
  return `
    <div class="container content-wrap">
      <div class="page-panel">
        <a class="back-link" href="#/">← WRÓĆ NA START</a>
        <h1>${title}</h1>
        <p>${subtitle}</p>
        <div class="notice">To jest gotowe miejsce na właściwą treść regulaminu. W kolejnym kroku możemy wkleić Twój aktualny regulamin i odpowiednio go sformatować.</div>
        <h2>§ 1. POSTANOWIENIA OGÓLNE</h2>
        <p>1. Szanuj innych członków społeczności.<br>2. Stosuj się do zasad platformy Twitch oraz Discord.<br>3. Zakazane są działania mające na celu celowe utrudnianie działania społeczności.</p>
        <h2>§ 2. KULTURA WYPOWIEDZI</h2>
        <p>Wszelkie spory rozwiązujemy bez obrażania innych osób. Moderacja może reagować na zachowania szkodliwe dla społeczności.</p>
        <h2>§ 3. MODERACJA</h2>
        <p>Decyzje moderacji podejmowane są w celu utrzymania porządku. W przypadku pytań lub odwołań należy skontaktować się z odpowiednią osobą.</p>
      </div>
    </div>
  `;
}

function vipPage() {
  return `
    <div class="container content-wrap vip-page">
      <div class="page-panel">
        <a class="back-link" href="#/">← WRÓĆ NA START</a>
        <div class="vip-hero">
          <div class="vip-badge">VIP</div>
          <div>
            <h1>DLA WIDZA / <span>VIP</span></h1>
            <p>VIP-a u naszej społeczności nie kupujesz. To wyróżnienie dla osób, które są aktywną i pozytywną częścią MATT'S WORLD.</p>
          </div>
        </div>

        <div class="vip-section-grid">
          <section class="vip-card">
            <div class="vip-card-number">01</div>
            <h2>JAK ZOSTAĆ VIPEM?</h2>
            <p>Aby otrzymać VIP-a, wystarczy że:</p>
            <ul>
              <li>Będziesz często wpadać na transmisje.</li>
              <li>Będziesz aktywny na chacie.</li>
              <li>Chętnie zagrasz wraz z Mattem w jednym lobby.</li>
              <li>Będziesz uczestniczyć w różnych eventach, np. CROSSOWE 2vs8.</li>
              <li>Będziesz aktywny na Discordzie MATT'S WORLD.</li>
              <li>Chętnie grasz z osobami w naszym community i nie jesteś osobą konfliktową.</li>
              <li>Bonusem będzie pomoc nowym widzom lub graczom w naszym community.</li>
            </ul>
          </section>

          <section class="vip-card vip-card-warning">
            <div class="vip-card-number">02</div>
            <h2>JAK MOGĘ STRACIĆ VIP-A?</h2>
            <ul>
              <li>Przez 3 tygodnie nie pojawisz się na naszych transmisjach.</li>
              <li>Zaczniesz konfliktować się z innymi osobami.</li>
              <li>Wyjdziesz z naszego Discorda lub dasz unfollow MatthevC.</li>
              <li>Przestaniesz być aktywny na Discordzie przez ponad 2 miesiące.</li>
              <li>Nagminnie będziesz wchodzić na kanał STREAM ON podczas transmisji bez wiedzy osoby transmitującej.</li>
              <li>Nagminnie będziesz łamać regulamin.</li>
            </ul>
          </section>
        </div>

        <div class="notice vip-note">
          <strong>Masz trudniejszą sytuację?</strong><br>
          Jeżeli zależy Ci na VIP-ie, ale przez jakiś czas nie możesz być aktywny, daj nam znać — nawet w wiadomości prywatnej. Zawsze możemy porozmawiać.
        </div>

        <section class="vip-benefits">
          <div class="vip-card-number">03</div>
          <h2>JAKIE MOŻLIWOŚCI MA VIP?</h2>
          <div class="vip-benefit-list">
            <div class="vip-benefit"><span>01</span><p><strong>STREAM ON</strong><br>VIP może wejść sam na kanał STREAM ON, pomijając POCZEKALNIĘ.</p></div>
            <div class="vip-benefit"><span>02</span><p><strong>DODATKOWE KOMENDY</strong><br>VIP otrzymuje dostęp do dodatkowych komend na chacie.</p></div>
            <div class="vip-benefit"><span>03</span><p><strong>EMOTKI 7TV</strong><br>Dla chętnych VIP-ów możliwość dostępu do emotek 7TV na kanale MatthevC.</p></div>
            <div class="vip-benefit"><span>04</span><p><strong>DODATKOWE KANAŁY DISCORD</strong><br>VIP może otrzymać dostęp do dodatkowych kanałów, np. z polecanymi i przetestowanymi narzędziami online.</p></div>
            <div class="vip-benefit"><span>05</span><p><strong>PIERWSZEŃSTWO DO LOBBY</strong><br>VIP ma pierwszeństwo do lobby podczas wspólnych gier.</p></div>
          </div>
        </section>
      </div>
    </div>
  `;
}



function moderatorTeamPage() {
  const cards = MODERATOR_TEAM.map((moderator, index) => `
    <article class="moderator-card">
      <div class="moderator-photo-wrap">
        <img class="moderator-photo" src="${moderator.image}" alt="Tymczasowy portret moderatora ${moderator.name}" loading="lazy">
        <div class="moderator-photo-index">0${index + 1}</div>
      </div>
      <div class="moderator-card-body">
        <div class="moderator-name-row">
          <h2>${moderator.name}</h2>
          <span class="moderator-role">${moderator.role}</span>
        </div>
        <p>${moderator.description}</p>
        <div class="moderator-links">
          <a class="moderator-social moderator-twitch" href="${moderator.twitch}" target="_blank" rel="noopener">
            <span>TWITCH</span><strong>${moderator.name}</strong><b>↗</b>
          </a>
          <div class="moderator-social moderator-discord">
            <span>DISCORD</span><strong>${moderator.discord}</strong>
          </div>
        </div>
      </div>
    </article>
  `).join("");

  return `
    <div class="container content-wrap moderator-page">
      <div class="page-panel moderator-panel">
        <a class="back-link" href="#/">← WRÓĆ NA START</a>

        <section class="moderator-team-hero">
          <div class="moderator-kicker">MODERATORZY MATT'S WORLD</div>
          <h1>NASZA <span>MODERACJA</span></h1>
          <p>To osoby, które pomagają utrzymać dobrą atmosferę, reagują wtedy, gdy jest to potrzebne, i wspierają naszą społeczność zarówno podczas transmisji, jak i poza nią.</p>
          <div class="moderator-hero-note">Portrety moderatorów są na razie tymczasowe — później możemy podmienić je na właściwe zdjęcia bez zmiany układu strony.</div>
        </section>

        <div class="moderator-grid">${cards}</div>

      </div>
    </div>
  `;
}

function moderatorBenefitsPage() {
  return `
    <div class="container content-wrap moderator-page">
      <div class="page-panel moderator-panel">
        <a class="back-link" href="#/">← WRÓĆ NA START</a>

        <section class="moderator-benefits-hero">
          <div class="moderator-kicker">DOŁĄCZ DO EKIPY</div>
          <h1>MODERACJA / <span>KORZYŚCI</span></h1>
          <p>Moderacja to przede wszystkim zaufanie i odpowiedzialność, ale chcemy też realnie doceniać osoby, które regularnie pomagają przy naszej społeczności.</p>
        </section>

        <section class="moderator-recruit-card">
          <div class="moderator-recruit-number">01</div>
          <div class="moderator-recruit-content">
            <span class="moderator-section-label">REKRUTACJA</span>
            <h2>JAK ZOSTAĆ MODERATOREM?</h2>
            <p>Jeżeli jesteś osobą mało konfliktową i lubisz przebywać u nas na transmisjach, wyślij zgłoszenie przez <strong>KONTAKT/WNIOSKI</strong> i napisz, w czym mógłbyś nas wesprzeć oraz dlaczego akurat chcesz być u nas Moderatorem.</p>
          </div>
          <a class="moderator-cta moderator-cta-solid" href="#/contact">WYŚLIJ ZGŁOSZENIE →</a>
        </section>

        <div class="moderator-benefits-heading">
          <div>
            <span class="moderator-section-label">CO OFERUJEMY</span>
            <h2>JAKIE SĄ KORZYŚCI Z BYCIA MODERATOREM U NAS?</h2>
          </div>
          <p>Najbardziej aktywne osoby chcemy nagradzać nie tylko rangą, ale też konkretnymi benefitami i wspólnym czasem.</p>
        </div>

        <div class="moderator-benefits-grid">
          <article class="moderator-benefit-card">
            <span class="moderator-benefit-number">01</span>
            <div>
              <h3>BONY, BILETY I ATRAKCJE</h3>
              <p>Dla aktywnych moderatorów na Discordzie i Twitchu przewidujemy bony do różnych sklepów, np. Empik czy Sizeer, bilety do kin lub inne atrakcje.</p>
            </div>
          </article>

          <article class="moderator-benefit-card">
            <span class="moderator-benefit-number">02</span>
            <div>
              <h3>SPOTKANIA IRL</h3>
              <p>W ciągu roku organizujemy przynajmniej dwa spotkania IRL dla Moderacji, wraz z możliwością nocowanki dla chętnych.</p>
            </div>
          </article>

          <article class="moderator-benefit-card">
            <span class="moderator-benefit-number">03</span>
            <div>
              <h3>TWITCH — PORADNIKI I UDOGODNIENIA</h3>
              <p>Udostępniamy zestaw poradników pomagających rozpocząć własną przygodę z Twitchem oraz rozwiązania i udogodnienia, które możesz zobaczyć na transmisjach MatthevC.</p>
            </div>
          </article>

          <article class="moderator-benefit-card">
            <span class="moderator-benefit-number">04</span>
            <div>
              <h3>POMOC TECHNICZNA IT</h3>
              <p>Możesz liczyć na pomoc techniczną z szeroko pojętego IT — od prostych usterek, przez składanie PC, aż po wsparcie przy pisaniu oprogramowania.</p>
            </div>
          </article>
        </div>

        <section class="moderator-benefits-bottom">
          <div>
            <span class="moderator-section-label">WAŻNE</span>
            <h2>LICZY SIĘ AKTYWNOŚĆ I ZAUFANIE</h2>
            <p>Korzyści traktujemy jako podziękowanie dla osób, które faktycznie angażują się w życie społeczności. Szczegóły i zasady poszczególnych benefitów możemy później doprecyzować.</p>
          </div>
          <a class="moderator-ghost-link" href="#/moderator/team">POZNAJ NASZĄ MODERACJĘ →</a>
        </section>
      </div>
    </div>
  `;
}

function infoPage(title, subtitle, text) {
  return `
    <div class="container content-wrap">
      <div class="page-panel">
        <a class="back-link" href="#/">← WRÓĆ NA START</a>
        <h1>${title}</h1>
        <p>${subtitle}</p>
        <div class="notice">${text}</div>
        <h2>INFORMACJE</h2>
        <p>Ta sekcja jest już podłączona do systemu strony. Możemy teraz uzupełnić ją Twoją właściwą treścią bez przebudowy całej witryny.</p>
      </div>
    </div>
  `;
}

function commandsPage() {
  return `
    <div class="container content-wrap commands-page">
      <div class="page-panel">
        <a class="back-link" href="#/">← WRÓĆ NA START</a>
        <div class="commands-heading">
          <div>
            <h1>DLA WIDZA / <span>KOMENDY</span></h1>
            <p>Znajdź szybko interesującą Cię komendę. Wybierz grupę uprawnień i użyj wyszukiwarki, aby znaleźć konkretną komendę.</p>
          </div>
        </div>

        <div class="command-toolbar">
          <div class="command-audience">
            <div class="toolbar-label">POKAŻ KOMENDY DLA:</div>
            <label class="audience-filter viewer-filter">
              <input type="checkbox" class="command-role-filter" value="viewer">
              <span class="filter-box">✓</span>
              <span>WIDZ</span>
            </label>
            <label class="audience-filter vip-filter">
              <input type="checkbox" class="command-role-filter" value="vip">
              <span class="filter-box">✓</span>
              <span class="audience-icon-wrap role-circle"><img src="https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/2" alt="VIP"></span>
              <span>VIP</span>
            </label>
            <label class="audience-filter mod-filter">
              <input type="checkbox" class="command-role-filter" value="moderator">
              <span class="filter-box">✓</span>
              <span class="audience-icon-wrap role-circle"><img src="https://yt3.googleusercontent.com/O2UEt_sd23xo1ASKkGSnAGHyShAR6Xb5cj4z26H05fw8ohw5ie3Dkh_pC7iqSck9uR-2iORgzA=s900-c-k-c0x00ffffff-no-rj" alt="Moderacja"></span>
              <span>MODERACJA</span>
            </label>
            <button type="button" class="command-select-all" id="command-select-all">ODZNACZ WSZYSTKIE</button>
          </div>

          <label class="command-search">
            <span>⌕</span>
            <input id="command-search-input" type="search" autocomplete="off" placeholder="Szukaj komendy, np. !discord...">
          </label>
        </div>

        <div id="commands-results"></div>
      </div>
    </div>
  `;
}

const COMMANDS_DATA = [
  // KOLEJKA DO LOBBY — wszyscy widzowie
  { command: "!jachcem", description: "Dołączenie do kolejki.", category: "Kolejka do lobby", roles: ["viewer", "vip", "moderator"] },
  { command: "!lobby", description: "Sprawdzenie kolejki oczekujących.", category: "Kolejka do lobby", roles: ["viewer", "vip", "moderator"] },
  { command: "!jaout", description: "Opuszczenie kolejki.", category: "Kolejka do lobby", roles: ["viewer", "vip", "moderator"] },

  // OGÓLNE — wszyscy widzowie
  { command: "!bingo", description: "Co to bingo? Kiedy rozdanie?", category: "Ogólne", roles: ["viewer", "vip", "moderator"] },
  { command: "!dc", description: "Link do naszego Discorda.", category: "Ogólne", roles: ["viewer", "vip", "moderator"] },
  { command: "!dixper", description: "Dołącz do wysyłania interakcyjnych utrudnień Matiemu.", category: "Ogólne", roles: ["viewer", "vip", "moderator"] },
  { command: "!ig", description: "Link do Instagrama.", category: "Ogólne", roles: ["viewer", "vip", "moderator"] },
  { command: "!klip", description: "Wykonuje automatycznego klipa.", category: "Ogólne", roles: ["viewer", "vip", "moderator"] },
  { command: "!lurk", description: "Pochwal się, że idziesz lurkować.", category: "Ogólne", roles: ["viewer", "vip", "moderator"] },
  { command: "!miasto (!city)", description: "Info skąd jest Mati.", category: "Ogólne", roles: ["viewer", "vip", "moderator"] },
  { command: "!tip (!donate)", description: "Link do wsparcia kanału (napiwki na Tipply).", category: "Ogólne", roles: ["viewer", "vip", "moderator"] },
  { command: "!social", description: "Link do strony z wszystkimi socialami Matiego.", category: "Ogólne", roles: ["viewer", "vip", "moderator"] },
  { command: "!steam (!kod)", description: "Link/kodzik do profilu Steam oraz nick na DBD.", category: "Ogólne", roles: ["viewer", "vip", "moderator"] },
  { command: "!vanish", description: "Nakłada na Ciebie losowego t/o i czyści chat z Twoich wiadomości.", category: "Ogólne", roles: ["viewer", "vip", "moderator"] },
  { command: "!wiek (!age)", description: "Bot zdradza jak stary jest Mati.", category: "Ogólne", roles: ["viewer", "vip", "moderator"] },
  { command: "!emotki (!7tv)", description: "Instrukcja jak zainstalować rozszerzenie na twitchowy chat.", category: "Ogólne", roles: ["viewer", "vip", "moderator"] },
  { command: "!watchtime", description: "Informacja ile godzin masz na naszym kanale.", category: "Ogólne", roles: ["viewer", "vip", "moderator"] },
  { command: "!followage", description: "Informacja ile masz tutaj obserwacji.", category: "Ogólne", roles: ["viewer", "vip", "moderator"] },
  { command: "!60", description: "Pokazuje jaką 60. jesteś.", category: "Ogólne", roles: ["viewer", "vip", "moderator"] },
  { command: "!essa", description: "Pokazuje procent essy.", category: "Ogólne", roles: ["viewer", "vip", "moderator"] },
  { command: "!klubowicz", description: "Sprawdź poziom klubowicza.", category: "Ogólne", roles: ["viewer", "vip", "moderator"] },

  // OGÓLNE — tylko VIP
  { command: "!time", description: "Uruchamia timer na ekranie.", category: "Ogólne", roles: ["vip"] },
  { command: "!mod?", description: "Wołasz moderację na chat.", category: "Ogólne", roles: ["vip"] },

  // BOT MUZYCZNY — wszyscy
  { command: "!sr /utwór lub link/", description: "Dodaje Twój utwór do kolejki.", category: "Bot muzyczny", roles: ["viewer", "vip", "moderator"] },
  { command: "!voteskip (!vSkip)", description: "Rozpoczyna głosowanie za pominięciem utworu (potrzeba 3 głosów).", category: "Bot muzyczny", roles: ["viewer", "vip", "moderator"] },
  { command: "!song", description: "Aktualny utwór.", category: "Bot muzyczny", roles: ["viewer", "vip", "moderator"] },
  { command: "!lastSong", description: "Wyświetla ostatni utwór.", category: "Bot muzyczny", roles: ["viewer", "vip", "moderator"] },
  { command: "!queue", description: "Wyświetla kolejkę utworów.", category: "Bot muzyczny", roles: ["viewer", "vip", "moderator"] },
  { command: "!wrongSong", description: "Ostatni Twój utwór zostaje usunięty z kolejki.", category: "Bot muzyczny", roles: ["viewer", "vip", "moderator"] },
  { command: "!mySongs", description: "Wyświetla Twoją pozycję w kolejce i przybliżony czas oczekiwania przed odtworzeniem Twojego żądania.", category: "Bot muzyczny", roles: ["viewer", "vip", "moderator"] },

  // MODERACJA — tylko moderator
  { command: "!game (!sg)", description: "Zmiana kategorii (przykładowo z DBD na FNAFA).", category: "Moderacja", roles: ["moderator"] },
  { command: "!update", description: "Aktualizuje listę aktywności.", category: "Moderacja", roles: ["moderator"] },
  { command: "!net", description: "Wł./wył. na transmisji wszystkie ścieżki audio z przeglądarki i Spotify.", category: "Moderacja", roles: ["moderator"] },
  { command: "!sdc (!sdiscord)", description: "Wł./wył. na transmisji ścieżkę dźwiękową z Discorda.", category: "Moderacja", roles: ["moderator"] },
  { command: "!mikro", description: "Wł./wył. mikrofon na transmisji.", category: "Moderacja", roles: ["moderator"] },
  { command: "!cam", description: "Wł./wył. kamerkę.", category: "Moderacja", roles: ["moderator"] },
  { command: "!chat", description: "Wł./wył. graficzny chat na ekranie.", category: "Moderacja", roles: ["moderator"] },
  { command: "!tipply", description: "Wł./wył. wiadomość, którą ktoś wysłał przez Tipply (donate).", category: "Moderacja", roles: ["moderator"] },
  { command: "!clip", description: "Wł./wył. klip na ekranie osoby raidującej.", category: "Moderacja", roles: ["moderator"] },
  { command: "!randomk", description: "Wł./wył. random perki killera na ekranie.", category: "Moderacja", roles: ["moderator"] },
  { command: "!randoms", description: "Wł./wył. random perki surva na ekranie.", category: "Moderacja", roles: ["moderator"] },
  { command: "!mafk", description: "Przełącza na scenę AFK.", category: "Moderacja", roles: ["moderator"] },
  { command: "!mgame", description: "Przełącza scenę główną (DBD).", category: "Moderacja", roles: ["moderator"] },
  { command: "!ring", description: "Wł./wył. oświetlenie Matiemu.", category: "Moderacja", roles: ["moderator"] },
  { command: "!vip", description: "Moderator nakłada VIP-a.", category: "Moderacja", roles: ["moderator"] },
  { command: "!unvip nick", description: "Zabiera VIP-a nickowi.", category: "Moderacja", roles: ["moderator"] },
  { command: "!mod nick", description: "Nadaje moderatora nickowi.", category: "Moderacja", roles: ["moderator"] },
  { command: "!unmod nick", description: "Zabiera moderatora nickowi.", category: "Moderacja", roles: ["moderator"] },

  // BOT MUZYCZNY — tylko moderator
  { command: "!vol 20 (!volume)", description: "Ustawia głośność muzyki na 20.", category: "Bot muzyczny", roles: ["moderator"], subcategory: "Bot muzyczny — moderacja" },
  { command: "!next", description: "Skipuje utwór.", category: "Bot muzyczny", roles: ["moderator"], subcategory: "Bot muzyczny — moderacja" },
  { command: "!restart", description: "Resetuje dany utwór.", category: "Bot muzyczny", roles: ["moderator"], subcategory: "Bot muzyczny — moderacja" },
  { command: "!play", description: "Startuje muzykę.", category: "Bot muzyczny", roles: ["moderator"], subcategory: "Bot muzyczny — moderacja" },
  { command: "!pause (!spotPause)", description: "Pauzuje muzykę.", category: "Bot muzyczny", roles: ["moderator"], subcategory: "Bot muzyczny — moderacja" },
  { command: "!blockSong", description: "Skipuje dany utwór i dodaje go na czarną listę.", category: "Bot muzyczny", roles: ["moderator"], subcategory: "Bot muzyczny — moderacja" },
  { command: "!previous (!prev)", description: "Przechodzi do odtwarzania poprzednio odtwarzanego utworu.", category: "Bot muzyczny", roles: ["moderator"], subcategory: "Bot muzyczny — moderacja" },
  { command: "!unblockSong", description: "Odblokowuje utwór.", category: "Bot muzyczny", roles: ["moderator"], subcategory: "Bot muzyczny — moderacja" },
  { command: "!skip", description: "Pomija utwór.", category: "Bot muzyczny", roles: ["moderator"], subcategory: "Bot muzyczny — moderacja" }
];

function roleBadge(role) {
  if (role === "vip") return `<span class="command-role-badge command-role-vip" title="Tylko VIP"><img src="https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/2" alt="VIP"></span>`;
  if (role === "moderator") return `<span class="command-role-badge command-role-mod" title="Tylko moderacja"><img src="https://yt3.googleusercontent.com/O2UEt_sd23xo1ASKkGSnAGHyShAR6Xb5cj4z26H05fw8ohw5ie3Dkh_pC7iqSck9uR-2iORgzA=s900-c-k-c0x00ffffff-no-rj" alt="Moderacja"></span>`;
  return "";
}

function commandCard(command) {
  const special = command.roles.length === 1 ? command.roles[0] : "shared";
  // Komendy dostępne dla widza są wspólne i nie dostają żadnych ikon.
  // Ikony pokazujemy tylko wtedy, gdy widz NIE ma uprawnień do komendy.
  const badges = command.roles.includes("viewer")
    ? ""
    : command.roles.map(roleBadge).join("");
  return `<article class="command command-${special}" data-command="${escapeHtml(command.command.toLowerCase())} ${escapeHtml(command.description.toLowerCase())}">
    <div class="command-top"><code>${escapeHtml(command.command)}</code><div class="command-badges">${badges}</div></div>
    <span>${escapeHtml(command.description)}</span>
  </article>`;
}

function setupCommandsPage() {
  const results = document.getElementById("commands-results");
  const search = document.getElementById("command-search-input");
  const filters = [...document.querySelectorAll(".command-role-filter")];
  const selectAll = document.getElementById("command-select-all");
  if (!results || !search || !filters.length || !selectAll) return;

  const defaults = getCommandFilterDefaults();
  filters.forEach(filter => {
    filter.checked = Boolean(defaults[filter.value === "moderator" ? "mod" : filter.value]);
  });

  const categories = ["Kolejka do lobby", "Ogólne", "Bot muzyczny", "Moderacja"];

  function renderCommands() {
    const selected = filters.filter(f => f.checked).map(f => f.value);
    const query = search.value.trim().toLowerCase();

    selectAll.textContent = selected.length === filters.length ? "ODZNACZ WSZYSTKIE" : "ZAZNACZ WSZYSTKIE";

    if (!selected.length) {
      results.innerHTML = `<div class="empty command-empty">Zaznacz przynajmniej jedną grupę: WIDZ, VIP lub MODERACJA.</div>`;
      return;
    }

    let html = "";
    let total = 0;

    categories.forEach(category => {
      const items = COMMANDS_DATA.filter(c => {
        if (c.category !== category) return false;

        // Filtr działa według rodzaju komendy:
        // - WIDZ pokazuje wyłącznie komendy dostępne dla zwykłego widza.
        // - VIP pokazuje wyłącznie komendy VIP-only.
        // - MODERACJA pokazuje wyłącznie komendy MOD-only.
        const isViewerCommand = c.roles.includes("viewer");
        const isVipOnly = c.roles.length === 1 && c.roles[0] === "vip";
        const isModeratorOnly = c.roles.length === 1 && c.roles[0] === "moderator";

        const matchesFilter =
          (selected.includes("viewer") && isViewerCommand) ||
          (selected.includes("vip") && isVipOnly) ||
          (selected.includes("moderator") && isModeratorOnly);

        return matchesFilter &&
          (`${c.command} ${c.description}`).toLowerCase().includes(query);
      });
      if (!items.length) return;

      total += items.length;
      const normalItems = items.filter(c => !c.subcategory);
      const musicModItems = items.filter(c => c.subcategory === "Bot muzyczny — moderacja");

      const renderGroup = (title, group) => {
        if (!group.length) return "";
        return `<div class="command-subcategory"><h3>${title}</h3><div class="command-grid">${group.map(commandCard).join("")}</div></div>`;
      };

      html += `<section class="command-category">
        <div class="command-category-heading"><h2>${category}</h2><span>${items.length} ${items.length === 1 ? "komenda" : "komendy"}</span></div>
        ${renderGroup("", normalItems)}
        ${category === "Bot muzyczny" ? renderGroup("BOT MUZYCZNY — TYLKO MODERACJA", musicModItems) : ""}
      </section>`;
    });

    if (!total) html = `<div class="empty command-empty">Nie znaleziono komendy pasującej do wyszukiwania.</div>`;
    results.innerHTML = html;
  }

  filters.forEach(filter => filter.addEventListener("change", renderCommands));
  search.addEventListener("input", renderCommands);
  selectAll.addEventListener("click", () => {
    const allSelected = filters.every(f => f.checked);
    filters.forEach(f => { f.checked = !allSelected; });
    renderCommands();
  });
  renderCommands();
}

function discordJoinPage() {
  return `
    <div class="container content-wrap">
      <div class="page-panel">
        <a class="back-link" href="#/">← WRÓĆ NA START</a>
        <h1>JAK DOSTAĆ SIĘ NA <span>DISCORD?</span></h1>
        <p>Wszystkie informacje dotyczące dołączenia na serwer społeczności.</p>
        <div class="notice">Link do Discorda jest ustawiany w pliku <strong>config.js</strong>, więc później zmienisz go w jednym miejscu.</div>
        <a class="header-cta" id="page-discord-link" href="#" target="_blank" rel="noopener">DOŁĄCZ NA DISCORD →</a>
        <h2>CO DAJE DISCORD?</h2>
        <p>Tutaj możemy opisać kanały, role, powiadomienia o transmisjach, eventy oraz inne funkcje serwera.</p>
      </div>
    </div>
  `;
}

function contactPage() {
  return `
    <div class="container content-wrap">
      <div class="page-panel contact-panel">
        <a class="back-link" href="#/">← WRÓĆ NA START</a>
        <h1>KONTAKT / <span>WNIOSKI</span></h1>
        <p>Masz pytanie, propozycję, chcesz zgłosić swoją kandydaturę albo skontaktować się w sprawie współpracy? Wypełnij formularz, a wiadomość trafi na adres kontaktowy MATT'S WORLD.</p>

        <form id="contact-form" class="contact-form">
          <div class="form-grid">
            <label>
              <span>NICK Z TWITCHA <b>*</b></span>
              <input type="text" name="twitch_nick" maxlength="50" required placeholder="np. MatthevC">
            </label>
            <label>
              <span>ADRES E-MAIL ZWROTNY <b>*</b></span>
              <input type="email" name="reply_email" maxlength="120" required placeholder="twoj@email.pl">
            </label>
          </div>

          <label>
            <span>TEMAT <b>*</b></span>
            <select name="topic" id="contact-topic" required>
              <option value="" selected disabled>Wybierz temat</option>
              <option>Współprace i marketing</option>
              <option>Prośba o unbana</option>
              <option>Zgłoszenie swojej kandydatury na moderatora</option>
              <option>Prośba o przydzielenie uprawnień</option>
              <option>Skargi i zażalenia</option>
              <option>Propozycje</option>
              <option>Inne</option>
            </select>
          </label>

          <label>
            <span>WIADOMOŚĆ <b>*</b></span>
            <textarea name="message" id="contact-message" maxlength="1000" required placeholder="Napisz swoją wiadomość..."></textarea>
            <small class="char-counter"><span id="message-counter">0</span>/1000</small>
          </label>

          <input type="text" name="_honey" class="honeypot" tabindex="-1" autocomplete="off">
          <input type="hidden" name="_subject" id="contact-subject" value="KONTAKT — MATT'S WORLD">
          <input type="hidden" name="_template" value="table">
          <input type="hidden" name="_captcha" value="false">

          <button type="submit" class="form-submit">WYŚLIJ WIADOMOŚĆ →</button>
          <div id="contact-status" class="form-status" role="status" aria-live="polite"></div>
        </form>

        <div class="contact-note">Wiadomość zostanie wysłana na <strong>matthevc.twitch@gmail.com</strong>. Podany adres e-mail służy wyłącznie do odpowiedzi na Twoją wiadomość.</div>
      </div>
    </div>
  `;
}

const FALLBACK_EVENTS = [
  {
    id: "crossowa-niedziela-2vs8",
    date: "2026-08-16",
    title: "CROSSOWA NIEDZIELA 2vs8",
    excerpt: "Ostatni rozegrany przez nas event — Crossowa Niedziela 2vs8, która odbyła się 16 sierpnia 2026 roku.",
    content: "CROSSOWA NIEDZIELA 2vs8 osbędzie się 16 sierpnia 2026 roku. Wymagana gra na Steam oraz miła atmosfera, bez toksyczności.",
    image: "pictures/events/crossowa-niedziela-2vs8.png",
    endDate: "2026-08-16"
  }
];

function getEventsUrl() {
  // app.js jest ładowany z /Website/app.js, więc ścieżka do eventów
  // jest liczona względem rzeczywistego położenia pliku JS.
  const script = document.querySelector('script[src*="app.js"]');
  if (script) {
    return new URL("../Website/events/events.json", new URL(script.src, document.baseURI)).href;
  }

  // Fallback dla GitHub Pages /Website/
  return new URL("events/events.json", document.baseURI).href;
}

async function loadEvents() {
  const url = getEventsUrl();
  console.log("[MATT'S WORLD] Ładowanie eventów:", url);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { "Accept": "application/json" }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} — ${url}`);
    }

    const events = await response.json();

    if (!Array.isArray(events)) {
      throw new Error("events.json nie zawiera tablicy eventów.");
    }

    console.log("[MATT'S WORLD] Pobrano eventów:", events.length);
    return events.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    // Nawet jeśli GitHub Pages / cache / ścieżka chwilowo nie pozwoli
    // pobrać JSON-a, pierwszy event nadal będzie widoczny.
    console.error("[MATT'S WORLD] Nie udało się pobrać events.json:", error);
    console.warn("[MATT'S WORLD] Używam wbudowanego eventu awaryjnego.");
    return FALLBACK_EVENTS;
  }
}

function eventCard(event) {
  const ended = isEventEnded(event);
  const cover = event.image
    ? `<div class="event-cover event-cover-image${ended ? " event-cover-ended" : ""}">
         <img src="${escapeHtml(event.image)}" alt="${escapeHtml(event.title)}" loading="lazy">
         ${ended ? '<div class="event-ended-badge">ZAKOŃCZONY</div>' : ""}
       </div>`
    : `<div class="event-cover${ended ? " event-cover-ended" : ""}">
         ${ended ? '<div class="event-ended-badge">ZAKOŃCZONY</div>' : ""}
       </div>`;

  return `
    <article class="event-card${ended ? " event-ended" : ""}">
      ${cover}
      <div class="event-body">
        <div class="event-date">${formatDate(event.date)}</div>
        <h2>${escapeHtml(event.title)}</h2>
        <p>${escapeHtml(event.excerpt)}</p>
        <a class="event-read" href="#/events/${encodeURIComponent(event.id)}">CZYTAJ CAŁOŚĆ →</a>
      </div>
    </article>
  `;
}
function formatDate(date) {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric", month: "long", year: "numeric"
  }).format(new Date(date));
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function renderEvents() {
  const events = await loadEvents();
  const list = document.getElementById("events-list");
  if (!list) return;
  list.innerHTML = events.length
    ? events.map(eventCard).join("")
    : `<div class="empty">Brak eventów. Dodaj pierwszy wpis w pliku <strong>events/events.json</strong>.</div>`;
}

async function renderEventDetail(id) {
  const events = await loadEvents();
  const event = events.find(e => e.id === id);

  if (!event) {
    app.innerHTML = `
      <div class="container content-wrap">
        <div class="page-panel">
          <h1>EVENT <span>NIE ZNALEZIONY</span></h1>
          <a class="back-link" href="#/events">← WRÓĆ DO EVENTÓW</a>
        </div>
      </div>`;
    return;
  }

  app.innerHTML = `
    <div class="container content-wrap">
      <div class="page-panel event-detail">
        <a class="back-link" href="#/events">← WRÓĆ DO EVENTÓW</a>
        ${event.image ? `<div class="event-cover event-cover-image"><img src="${escapeHtml(event.image)}" alt="${escapeHtml(event.title)}"></div>` : `<div class="event-cover"></div>`}
        <div style="padding-top:24px">
          <div class="event-date">${formatDate(event.date)}</div>
          <h1>${escapeHtml(event.title)}</h1>
          <p>${escapeHtml(event.content).replace(/\n/g, "<br><br>")}</p>
        </div>
      </div>
    </div>
  `;
}

async function render() {
  const raw = location.hash.replace(/^#\/?/, "");
  const path = raw.replace(/^\/+|\/+$/g, "") || "";
  const eventMatch = path.match(/^events\/(.+)$/);

  if (eventMatch) {
    await renderEventDetail(decodeURIComponent(eventMatch[1]));
    updateLinks();
    setupContactForm();
    return;
  }

  if (path === "events") {
    app.innerHTML = `
      <div class="container content-wrap">
        <div class="section-heading">
          <div><h2>NAJNOWSZE EVENTY</h2></div>
          <p>Najnowsze wpisy na górze</p>
        </div>
        <div id="events-list" class="event-list"></div>
      </div>
    `;
    await renderEvents();
    updateLinks();
    setupContactForm();
    return;
  }

  const page = pages[path] || pages.home;

  if (path === "") {
    app.innerHTML = page.body;
    const events = await loadEvents();
    const homeEvents = document.getElementById("home-events");
    if (homeEvents) homeEvents.innerHTML = events.slice(0, 3).map(eventCard).join("");
  } else {
    app.innerHTML = page.body;
  }

  document.title = `${SITE_CONFIG.siteName} — ${stripHtml(page.title)}`;
  updateLinks();
  setupContactForm();
  setupCommandsPage();
  closeMobileMenu();
}

function stripHtml(value) {
  return value.replace(/<[^>]*>/g, "");
}

function updateLinks() {
  const twitchLinks = [
    document.getElementById("top-twitch-link"),
    document.getElementById("header-twitch-link"),
    document.getElementById("hero-twitch-link"),
    document.getElementById("page-twitch-link"),
    document.getElementById("footer-twitch-link")
  ];
  twitchLinks.forEach(el => { if (el) el.href = SITE_CONFIG.twitchUrl; });

  const discordLinks = [
    document.getElementById("footer-discord-link"),
    document.getElementById("page-discord-link"),
    document.getElementById("hero-discord-link")
  ];
  discordLinks.forEach(el => { if (el) el.href = SITE_CONFIG.discordUrl; });

  document.title = SITE_CONFIG.pageTitle;

  document.querySelectorAll(".main-nav a").forEach(link => {
    const href = link.getAttribute("href");
    link.classList.toggle("active", href === location.hash);
  });
}

function setupContactForm() {
  const form = document.getElementById("contact-form");
  if (!form || form.dataset.ready === "1") return;
  form.dataset.ready = "1";

  const topic = document.getElementById("contact-topic");
  const message = document.getElementById("contact-message");
  const counter = document.getElementById("message-counter");
  const subject = document.getElementById("contact-subject");
  const status = document.getElementById("contact-status");

  const updateCounter = () => {
    if (counter && message) counter.textContent = message.value.length;
  };

  if (message) message.addEventListener("input", updateCounter);
  if (topic) {
    topic.addEventListener("change", () => {
      if (subject) subject.value = `MATT'S WORLD — ${topic.value}`;
    });
  }
  updateCounter();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!status) return;

    status.className = "form-status";
    status.textContent = "Wysyłanie wiadomości...";

    const submit = form.querySelector("button[type=submit]");
    if (submit) submit.disabled = true;

    try {
      const response = await fetch("https://formsubmit.co/ajax/matthevc.twitch@gmail.com", {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: new FormData(form)
      });

      const text = await response.text();
      let data = {};
      try { data = JSON.parse(text); } catch (_) {}

      if (!response.ok || data.success === false) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      form.reset();
      if (counter) counter.textContent = "0";
      if (subject) subject.value = "KONTAKT — MATT'S WORLD";
      status.className = "form-status success";
      status.textContent = "Wiadomość została wysłana. Dziękuję za kontakt!";
    } catch (error) {
      console.error("Formularz kontaktowy:", error);
      status.className = "form-status error";
      status.innerHTML = `Nie udało się wysłać wiadomości automatycznie. <a href="mailto:${SITE_CONFIG.contactEmail}" class="red-link">Kliknij tutaj, aby wysłać ją e-mailem →</a>`;
    } finally {
      if (submit) submit.disabled = false;
    }
  });
}

function closeMobileMenu() {
  const nav = document.getElementById("main-nav");
  if (nav) nav.classList.remove("open");
  document.querySelectorAll(".nav-dropdown").forEach(d => d.classList.remove("open"));
}

document.getElementById("mobile-menu-btn").addEventListener("click", () => {
  document.getElementById("main-nav").classList.toggle("open");
});

document.querySelectorAll(".nav-dropdown > button").forEach(button => {
  button.addEventListener("click", () => {
    if (window.innerWidth <= 900) {
      button.parentElement.classList.toggle("open");
    }
  });
});

window.addEventListener("hashchange", render);

// Wejście do komend z menu MODERACJA otwiera tę samą stronę komend,
// ale jednorazowo zaznacza wyłącznie filtr MODERACJA.
document.addEventListener("click", (event) => {
  const link = event.target.closest('a[data-command-preset="moderator"]');
  if (!link) return;

  sessionStorage.setItem("commandsPreset", "moderator");
  const targetHash = "#/viewer/commands";
  if (location.hash.split("?")[0] === targetHash) {
    event.preventDefault();
    render();
  }
});

// Fallback dla przeglądarek/cache: kliknięcie linku Kontakt zawsze uruchamia router.
document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href="#/contact"]');
  if (!link) return;
  event.preventDefault();
  if (location.hash !== "#/contact") {
    location.hash = "#/contact";
  } else {
    render();
  }
});

render();
