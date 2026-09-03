let tocScrollLock = false;

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

const RECOMMENDED_STREAMERS = [
  {
    login: "farymvp",
    displayName: "FaryMVP",
    channelUrl: "https://www.twitch.tv/farymvp",
    clipSlug: "OddSmilingSquirrelWholeWheat-A_MEU3fIXmNVdOyC",
    clipUrl: "https://www.twitch.tv/sandynpc/clip/DaintyMoldyGooseHotPokket-zcD5cPmXsjknIPJz",
    tagline: "Energia, klimat i dobra zabawa — idealny wybór, kiedy szukasz twórcy do oglądania podczas mojej nieobecności.",
    description: "Jeśli lubisz luźną atmosferę, kontakt z widzami i ekipowy vibe, to FaryMVP zdecydowanie zasługuje na uwagę.",
    games: ["Dead by Daylight", "Euro Truck Simulator 2", "Among Us"]
  },
  {
    login: "sandynpc",
    displayName: "SandyNPC",
    channelUrl: "https://www.twitch.tv/sandynpc",
    clipSlug: "DaintyMoldyGooseHotPokket-zcD5cPmXsjknIPJz",
    clipUrl: "https://www.twitch.tv/sandynpc/clip/DaintyMoldyGooseHotPokket-zcD5cPmXsjknIPJz?range=30d",
    tagline: "Świetny kontakt z czatem i bardzo przyjemny klimat transmisji.",
    description: "SandyNPC to twórczyni, do której naprawdę warto zajrzeć — szczególnie jeśli cenisz pozytywną energię i regularne interakcje z widzami.",
    games: ["Dead by Daylight", "VALORANT", "Euro Truck Simulator 2", "League of Legends"]
  },
  {
    login: "blackstaryolow",
    displayName: "Blackstaryolow",
    channelUrl: "https://www.twitch.tv/blackstaryolow",
    clipSlug: "BoredTardyJalapenoPogChamp-Zd-CjuR4sruTx3vU",
    clipUrl: "https://www.twitch.tv/blackstaryolow/clip/BoredTardyJalapenoPogChamp-Zd-CjuR4sruTx3vU?range=all",
    tagline: "Dobra atmosfera, sprawdzony twórca i treści, które dobrze wpisują się w klimat naszej społeczności.",
    description: "Blackstaryolow to jedna z osób, które śmiało mogę polecić mojej społeczności — wbijaj, oglądaj i zostaw po sobie dobre słowo na czacie.",
    games: ["Dead by Daylight", "R.E.P.O.", "Mortal Kombat X", "Mortal Kombat 11"]
  },
  {
    login: "wazzzupek",
    displayName: "Wazzzupek",
    channelUrl: "https://www.twitch.tv/wazzzupek",
    clipSlug: "BlushingEsteemedChowderSwiftRage-iutMJCzKIAuQoU6E",
    clipUrl: "https://www.twitch.tv/wazzzupek/clip/BlushingEsteemedChowderSwiftRage-iutMJCzKIAuQoU6E?range=7d",
    tagline: "Twórca, którego warto mieć na radarze — szczególnie jeśli lubisz community vibe i regularne streamy.",
    description: "Gdy mnie nie ma na live, Wazzzupek to bardzo dobry kierunek — sprawdzony twórca, fajna energia i miejsce, gdzie po prostu dobrze się siedzi.",
    games: ["Counter-Strike 2", "Euro Truck Simulator 2", "Fortnite", "Teamfight Tactics"]
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
              <a class="red-link" href="#/discord/join">JAK DOSTAĆ SIĘ NA DISCORD →</a>
            </div>
            <div class="side-card contact-home-card">
              <svg class="contact-watermark" viewBox="0 0 128 96" aria-hidden="true"><path fill="currentColor" d="M12 20h104v56H12V20Zm8 8v4l44 28 44-28v-4l-44 28L20 28Zm0 16v22h88V44L64 72 20 44Z"/></svg>
              <div class="side-card-kicker">FORMULARZ SPOŁECZNOŚCI</div>
              <h3>WNIOSKI / KONTAKT</h3>
              <p>Napisz podanie o unbana, złóż skargę, wskaż z kim nie chcesz grać, zaproponuj zmiany lub współpracę albo wyślij inną wiadomość do ekipy.</p>
              <a class="red-link" href="#/contact">PRZEJDŹ DO FORMULARZA →</a>
            </div>
          </aside>
        </div>
      </div>

      <div class="container content-wrap">
        <div class="section-heading" id="home-sections">
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
          <a class="quick-card" href="#/viewer/bingo">
            <div class="num">04 / DLA WIDZA</div>
            <h3>BINGO</h3>
            <p>Sprawdź zasady Stream Bounty, sposób dołączenia do gry i informacje o rozgrywce Bingo.</p>
          </a>
          <a class="quick-card" href="#/discord/join">
            <div class="num">05 / NASZ DISCORD</div>
            <h3>JAK DOSTAĆ SIĘ NA DISCORD</h3>
            <p>Krótka instrukcja dołączenia do MATT'S WORLD i najważniejsze informacje na start.</p>
          </a>
          <a class="quick-card" href="#/downloads">
            <div class="num">06 / PRZYDATNE PLIKI</div>
            <h3>DO POBRANIA</h3>
            <p>Presety ReShade i materiały zebrane w jednym, przejrzystym miejscu.</p>
          </a>
          <a class="quick-card" href="#/recommended">
            <div class="num">07 / SPOŁECZNOŚĆ</div>
            <h3>POLECANI STREAMERZY</h3>
            <p>Sprawdź twórców, których polecam oglądać podczas mojej nieobecności.</p>
          </a>
          <a class="quick-card" href="#/viewer/emotes7tv">
            <div class="num">08 / DLA WIDZA</div>
            <h3>EMOTKI 7TV</h3>
            <p>Dowiedz się, jak włączyć i korzystać z emotek 7TV oraz BetterTTV podczas transmisji.</p>
          </a>
        </div>

        <div class="section-heading">
          <div><h2>CO NOWEGO?</h2></div>
          <a class="red-link" href="#/events">WSZYSTKIE EVENTY →</a>
        </div>

        <div id="home-events" class="home-event-slider"></div>
      </div>
    `
  },

  "rules/general": {
    title: "REGULAMIN <span>OGÓLNY</span>",
    body: generalRulesPage()
  },
  "rules/discord": {
    title: "REGULAMIN <span>DISCORD</span>",
    body: discordRulesPage()
  },
  "rules/events": {
    title: "REGULAMIN <span>EVENTÓW</span>",
    body: eventRulesPage()
  },
  "rules/game-picks": {
    title: "ZASADY WYBORU DO <span>WSPÓLNYCH GIER</span>",
    body: gamePickRulesPage()
  },
  "rules/twitch": {
    title: "REGULAMIN <span>TWITCH</span>",
    body: twitchRulesPage()
  },

  "viewer/commands": {
    title: "DLA WIDZA / <span>KOMENDY</span>",
    body: commandsPage()
  },
  "viewer/downloads": {
    title: "DLA WIDZA / <span>DO POBRANIA</span>",
    body: downloadsPage()
  },
  "viewer/emotes7tv": {
    title: "DLA WIDZA / <span>EMOTKI 7TV</span>",
    body: emotes7tvPage()
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
    body: dixperPage()
  },
  "viewer/bingo": {
    title: "DLA WIDZA / <span>BINGO - STREAM BOUNTY</span>",
    body: bingoPage()
  },
  "viewer/rewards": {
    title: "DLA WIDZA / <span>NAGRODY</span>",
    body: rewardsPage()
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
  "discord/channels": {
    title: "NASZ DISCORD / <span>OPIS KANAŁÓW</span>",
    body: discordChannelsPage()
  },

  recommended: {
    title: "SPOŁECZNOŚĆ / <span>POLECANI STREAMERZY</span>",
    body: recommendedStreamersPage()
  },

  downloads: {
    title: "PRZYDATNE / <span>DO POBRANIA</span>",
    body: downloadsPage()
  },

  contact: {
    title: "WNIOSKI / <span>KONTAKT</span>",
    body: contactPage()
  }
};


function getCommandFilterDefaults() {
  const route = window.location.hash.split("?")[0];

  // Każda podstrona komend ustawia własny widok filtrów.
  // Dzięki temu przejście MODERACJA/KOMENDY -> DLA WIDZA/KOMENDY
  // natychmiast wraca do filtrów widza i VIP-a.
  if (route === "#/moderator/commands") {
    return { viewer: false, vip: false, mod: true };
  }

  return { viewer: true, vip: true, mod: false };
}

function isEventEnded(event) {
  if (!event || !event.endDate) return false;

  // Automatyczne zakończenie: data ORAZ godzina zakończenia muszą minąć.
  // Przykład: 29.08.2026 21:00 -> event kończy się dopiero po 21:00.
  const now = new Date();
  const end = new Date(event.endDate);

  if (Number.isNaN(end.getTime())) return false;

  return now >= end;
}

function generalRulesPage() {
  return `
    <div class="container content-wrap">
      <div class="page-panel rules-showcase">
        <a class="back-link" href="#/">← WRÓĆ NA START</a>

        <div class="rules-hero">
          <div class="rules-hero-badge">OGÓLNY</div>
          <h1>ZASADY, KTÓRE UTRZYMUJĄ <span>DOBRY KLIMAT</span></h1>
          <p>U nas stawiamy na dobrą atmosferę, szacunek i wspólną zabawę. Poniżej znajdziesz 5 najważniejszych zasad, które łatwo zapamiętać i jeszcze łatwiej stosować.</p>
        </div>

        <div class="rules-memory-strip">
          <div class="rules-memory-title">Zapamiętaj w skrócie:</div>
          <div class="rules-memory-tags">
            <span class="rule-scroll-link" data-target="general-rule-atmosphere">ATMOSFERA</span>
            <span class="rule-scroll-link" data-target="general-rule-lobby">LOBBY</span>
            <span class="rule-scroll-link" data-target="general-rule-private">PRYWATNE SPRAWY</span>
            <span class="rule-scroll-link" data-target="general-rule-calm">SPOKÓJ</span>
            <span class="rule-scroll-link" data-target="general-rule-twitch">REGULAMIN TWITCHA</span>
          </div>
        </div>

        <div class="rules-card-grid">
          <section class="rule-card" id="general-rule-atmosphere">
            <div class="rule-card-top"><div class="rule-card-number">01</div><div class="rule-card-icon" aria-hidden="true">🎮</div></div>
            <div class="rule-card-label">ATMOSFERA</div>
            <h2>Baw się dobrze i nie bądź dzbanem</h2>
            <p>Najważniejsza zasada naszej społeczności: bawimy się wspólnie i nie psujemy innym humoru. Szacunek, luz i pozytywna energia zawsze są mile widziane.</p>
          </section>

          <section class="rule-card" id="general-rule-lobby">
            <div class="rule-card-top"><div class="rule-card-number">02</div><div class="rule-card-icon" aria-hidden="true">🎙️</div></div>
            <div class="rule-card-label">LOBBY</div>
            <h2>Gramy tak, aby każdy dobrze się bawił</h2>
            <p>W lobby zachowujemy kulturę. Nie tolerujemy toxic zachowań, wyzwisk, negatywnej atmosfery ani jęczenia w stylu „nie chcę na to grać”. Gramy po to, żeby było przyjemnie wszystkim.</p>
          </section>

          <section class="rule-card" id="general-rule-private">
            <div class="rule-card-top"><div class="rule-card-number">03</div><div class="rule-card-icon" aria-hidden="true">🧩</div></div>
            <div class="rule-card-label">PRYWATNE SPRAWY</div>
            <h2>Prywatne dramy zostawcie dla siebie</h2>
            <p>Jeżeli macie między sobą konflikt, nie przenoście go na stream, Discord ani eventy. Wystarczy dać znać, że razem nie gracie, nie gadacie i nie ma tematu.</p>
          </section>

          <section class="rule-card" id="general-rule-calm">
            <div class="rule-card-top"><div class="rule-card-number">04</div><div class="rule-card-icon" aria-hidden="true">🕊️</div></div>
            <div class="rule-card-label">SPOKÓJ</div>
            <h2>Nie szukamy niepotrzebnych konfliktów</h2>
            <p>Omijamy tematy i zachowania, które najczęściej kończą się spięciami. Chcemy budować miejsce do odpoczynku i zabawy.</p>
          </section>

          <section class="rule-card" id="general-rule-twitch">
            <div class="rule-card-top"><div class="rule-card-number">05</div><div class="rule-card-icon" aria-hidden="true">📜</div></div>
            <div class="rule-card-label">REGULAMIN TWITCHA</div>
            <h2>Przestrzegamy regulaminu Twitcha</h2>
            <p>Jesteśmy częścią platformy Twitch, dlatego obowiązują nas także jej zasady. To podstawa bezpiecznego i spokojnego korzystania z transmisji.</p><a class="twitch-rules-button" href="#/rules/twitch">REGULAMIN TWITCHA <span>→</span></a>
          </section>
        </div>

        <div class="rules-summary-box">
          <h2>Krótko mówiąc</h2>
          <p>Tworzymy społeczność, w której liczy się dobra zabawa, wzajemny szacunek i brak niepotrzebnych konfliktów. Jeśli każdy trzyma się tych 5 zasad, wszystkim jest po prostu przyjemniej.</p>
        </div>
      </div>
    </div>
  `;
}

function discordRulesPage() {
  return `
    <div class="container content-wrap">
      <div class="page-panel rules-showcase discord-rules-page">
        <a class="back-link" href="#/">← WRÓĆ NA START</a>

        <div class="rules-hero">
          <div class="rules-hero-badge">DISCORD</div>
          <h1>JASNE ZASADY, <span>LEPSZA ATMOSFERA</span></h1>
          <p>Nasz Discord ma być miejscem wygodnym do rozmów, wspólnej gry i integracji społeczności. Poniżej znajdziesz zasady przedstawione w przejrzysty sposób — tak, aby dało się je szybko przeczytać i łatwo zapamiętać.</p>
        </div>

        <div class="rules-memory-strip">
          <div class="rules-memory-title">W skrócie najważniejsze:</div>
          <div class="rules-memory-tags">
            <a class="rule-scroll-link" data-target="discord-rule-twitch">ZASADY TWITCHA</a>
            <a class="rule-scroll-link" data-target="discord-rule-stream">🔴 STREAM ON</a>
            <a class="rule-scroll-link" data-target="discord-rule-mentions">NIE NADUŻYWAMY WZMIANEK RÓL</a>
            <a class="rule-scroll-link" data-target="discord-rule-spam">BEZ SPAMU I REKLAM</a>
            <a class="rule-scroll-link" data-target="discord-rule-materials">ODPOWIEDNIE KANAŁY</a>
            <a class="rule-scroll-link" data-target="discord-rule-games">🔎 SZUKAM-DO-GRY</a>
          </div>
        </div>

        <div class="rules-card-grid rules-card-grid-compact">
          <section class="rule-card" id="discord-rule-twitch">
            <div class="rule-card-top"><div class="rule-card-number">01</div><div class="rule-card-icon" aria-hidden="true">📺</div></div>
            <div class="rule-card-label">TWITCH</div>
            <h2>Przestrzegamy zasad Twitcha</h2>
            <p>Na profilach, kanałach tekstowych oraz na kanale głosowym <strong class="stream-pill-inline">🔴 STREAM ON</strong> przestrzegamy regulaminu Twitcha. Nie krytykujemy ani nie podważamy zasad platformy. Dodatkowo obowiązuje nas również regulamin główny społeczności, który określa podstawowe zasady zachowania i wzajemnego szacunku.</p><div class="twitch-rules-actions"><a class="twitch-rules-button" href="#/rules/general">REGULAMIN OGÓLNY <span>→</span></a><a class="twitch-rules-button" href="#/rules/twitch">REGULAMIN TWITCHA <span>→</span></a></div>
          </section>

          <section class="rule-card" id="discord-rule-stream">
            <div class="rule-card-top"><div class="rule-card-number">02</div><div class="rule-card-icon" aria-hidden="true">🎮</div></div>
            <div class="rule-card-label">🔴 STREAM ON</div>
            <h2>To miejsce dla Streamera i jego lobby</h2>
            <p><strong class="stream-pill-inline">🔴 STREAM ON</strong> jest przeznaczony dla aktualnej rozgrywki Streamera oraz jego lobby. Jeżeli nie bierzesz udziału w grze, wybierz inny kanał, aby nie przeszkadzać. Kanał może również służyć do transmisji osób trzecich, dlatego zachowujemy kulturę i nie zakłócamy rozgrywki.</p>
          </section>

          <section class="rule-card" id="discord-rule-mentions">
            <div class="rule-card-top"><div class="rule-card-number">03</div><div class="rule-card-icon" aria-hidden="true">📣</div></div>
            <div class="rule-card-label">WZMIANKI</div>
            <h2>Nie nadużywamy oznaczeń ról</h2>
            <p>Zakazane jest nadużywanie wzmianek ról oraz używanie <span class="mention-pill">@everyone</span> i <span class="mention-pill">@here</span>. Automod nakłada za takie działania automatyczną karę <strong>1 godziny t/o</strong>.</p>
          </section>

          <section class="rule-card" id="discord-rule-spam">
            <div class="rule-card-top"><div class="rule-card-number">04</div><div class="rule-card-icon" aria-hidden="true">🚫</div></div>
            <div class="rule-card-label">SPAM I REKLAMY</div>
            <h2>Dbamy o porządek na kanałach</h2>
            <p>Zabronione jest spamowanie wiadomościami oraz reklamowanie własnych kanałów, serwerów Discord i innych treści bez zgody administracji.</p>
          </section>

          <section class="rule-card" id="discord-rule-materials">
            <div class="rule-card-top"><div class="rule-card-number">05</div><div class="rule-card-icon" aria-hidden="true">🎬</div></div>
            <div class="rule-card-label">ODPOWIEDNIE KANAŁY</div>
            <h2>Każdy materiał trafia w odpowiednie miejsce</h2>
            <p>Materiały publikujemy zgodnie z ich przeznaczeniem. Kanał <span class="discord-channel-chip inline"><span class="channel-icon">🎥</span><span class="channel-name">wideo</span></span> służy do wrzucania waszych filmików, klipów, ciekawych nagrań i materiałów wideo. Klipy z transmisji Streamera oraz prywatne materiały powinny trafiać do odpowiednich miejsc. Spam lub niepasujące treści mogą zostać usunięte.</p>
            <a class="twitch-rules-button" href="#/discord/channels">OPIS NASZYCH KANAŁÓW <span>→</span></a>
          </section>

          <section class="rule-card" id="discord-rule-games">
            <div class="rule-card-top"><div class="rule-card-number">06</div><div class="rule-card-icon" aria-hidden="true">🤝</div></div>
            <div class="rule-card-label">WSPÓLNA GRA</div>
            <h2>Szukamy ekipy w odpowiedni sposób</h2>
            <p>Osoby chętne do wspólnej gry szukamy wyłącznie na kanale <span class="discord-channel-chip inline"><span class="channel-icon">🔎</span><span class="channel-name">szukam-do-gry</span></span>. Dzięki temu łatwiej znaleźć ekipę i utrzymać porządek na pozostałych kanałach.</p>
          </section>
        </div>

        <div class="rules-summary-box">
          <h2>Najważniejsza idea</h2>
          <p>Discord ma być miejscem wygodnym do rozmów, wspólnej gry i integracji społeczności. Szanujemy innych, dbamy o porządek i korzystamy z serwera tak, aby każdy czuł się tutaj dobrze.</p>
        </div>
        </div>
      </div>
    </div>
  `;
}


function discordChannelsPage() {
  return `
    <div class="container content-wrap discord-channels-page">
      <div class="page-panel discord-channels-panel">
        <a class="back-link" href="#/">← WRÓĆ NA START</a>

        <header class="discord-channels-hero">
          <span class="discord-channels-kicker">NASZ DISCORD / OPIS KANAŁÓW</span>
          <h1>GDZIE CO <span>ZNAJDZIESZ?</span></h1>
          <p>Krótka mapa serwera MATT'S WORLD. Sprawdź przeznaczenie kanału, zanim coś wyślesz — dzięki temu łatwiej utrzymać porządek i szybciej znaleźć to, czego szukasz.</p>
          <div class="discord-channels-tags" aria-label="Najważniejsze kategorie">
            <span class="rule-scroll-link discord-channel-jump" data-target="discord-role-twitch">⚙️ KONFIGURACJA</span>
            <span class="rule-scroll-link discord-channel-jump" data-target="discord-role-text">💬 TEKSTOWE</span>
            <span class="rule-scroll-link discord-channel-jump" data-target="discord-role-voice">🔊 GŁOSOWE</span>
            <span class="rule-scroll-link discord-channel-jump" data-target="discord-role-games">🎮 GRY</span>
          </div>
        </header>

        <section class="discord-channel-section" id="discord-role-twitch">
          <div class="discord-section-heading">
            <div>
              <span class="discord-section-number">01</span>
              <h2>TWITCH / KONFIGURACJA</h2>
            </div>
            <p>Najważniejsze informacje i ustawienia serwera.</p>
          </div>

          <div class="discord-channel-list">
            <article class="discord-channel-row">
              <div class="discord-channel-name"><span class="discord-channel-symbol">🔧</span><strong>konfiguracja-tickets</strong></div>
              <p>Dostosuj Discord do swoich potrzeb i utwórz ticket, jeśli chcesz skontaktować się z Moderacją lub Streamerem.</p>
            </article>
            <article class="discord-channel-row">
              <div class="discord-channel-name"><span class="discord-channel-symbol">📣</span><strong>ogłoszenia</strong></div>
              <p>Najważniejsze komunikaty i informacje dotyczące społeczności.</p>
            </article>
            <article class="discord-channel-row">
              <div class="discord-channel-name"><span class="discord-channel-symbol">🔴</span><strong>live-alert</strong></div>
              <p>Powiadomienia o startujących transmisjach.</p>
            </article>
            <article class="discord-channel-row">
              <div class="discord-channel-name"><span class="discord-channel-symbol">🚫</span><strong>regulamin</strong></div>
              <p>Zbiór zasad obowiązujących na naszym Discordzie.</p>
            </article>
          </div>
        </section>

        <section class="discord-channel-section" id="discord-role-text">
          <div class="discord-section-heading">
            <div>
              <span class="discord-section-number">02</span>
              <h2>TEXT CHANNELS</h2>
            </div>
            <p>Rozmowy, materiały społeczności i przydatne informacje.</p>
          </div>

          <div class="discord-channel-list">
            <article class="discord-channel-row">
              <div class="discord-channel-name"><span class="discord-channel-symbol">💬</span><strong>ogólny</strong></div>
              <p>Główne miejsce do luźnych rozmów na każdy temat.</p>
            </article>
            <article class="discord-channel-row">
              <div class="discord-channel-name"><span class="discord-channel-symbol">🔎</span><strong>szukam-do-gry</strong></div>
              <p>Szukasz ekipy do wspólnej gry? Napisz tutaj. Kanał możesz wyłączyć w konfiguracji, jeśli go nie potrzebujesz.</p>
            </article>
            <article class="discord-channel-row">
              <div class="discord-channel-name"><span class="discord-channel-symbol">📷</span><strong>zdjęcia-grafika</strong></div>
              <p>Miejsce na zdjęcia i grafiki, którymi chcesz się pochwalić na dłużej. Zwykłe lub mało wyróżniające się materiały oraz wiadomości tekstowe mogą zostać usunięte po 24 godzinach.</p>
            </article>
            <article class="discord-channel-row">
              <div class="discord-channel-name"><span class="discord-channel-symbol">🎨</span><strong>wasze-arcydzieła</strong></div>
              <p>Pochwal się własną twórczością — nie tylko grafiką. Projekty, rękodzieło, muzyka i inne kreatywne prace są mile widziane.</p>
            </article>
            <article class="discord-channel-row">
              <div class="discord-channel-name"><span class="discord-channel-symbol">🤣</span><strong>memy</strong></div>
              <p>Ciekawe i zabawne memy znalezione w Internecie.</p>
            </article>
            <article class="discord-channel-row">
              <div class="discord-channel-name"><span class="discord-channel-symbol">🎥</span><strong>wideo</strong></div>
              <p>Wasze klipy, materiały znajomych, klipy z Twitcha i inne ciekawe filmiki.</p>
            </article>
            <article class="discord-channel-row">
              <div class="discord-channel-name"><span class="discord-channel-symbol">🎬</span><strong>matt-klip</strong></div>
              <p>Kanał przeznaczony wyłącznie na klipy z transmisji MatthevC.</p>
            </article>
            <article class="discord-channel-row">
              <div class="discord-channel-name"><span class="discord-channel-symbol">💲</span><strong>promocje</strong></div>
              <p>Ciekawe promocje związane z grami, sprzętem komputerowym i szeroko pojętym IT.</p>
            </article>
          </div>
        </section>

        <section class="discord-channel-section" id="discord-role-voice">
          <div class="discord-section-heading">
            <div>
              <span class="discord-section-number">03</span>
              <h2>VOICE ROOM</h2>
            </div>
            <p>Kanały do rozmów, wspólnej gry i transmisji.</p>
          </div>

          <div class="discord-channel-list voice-list">
            <article class="discord-channel-row">
              <div class="discord-channel-name"><span class="discord-channel-symbol">⌛</span><strong>POCZEKALNIA</strong></div>
              <p>Kanał oczekujący. Wejdź tutaj, jeśli chcesz zostać przeniesiony na <strong>STREAM ON</strong>.</p>
            </article>
            <article class="discord-channel-row featured">
              <div class="discord-channel-name"><span class="discord-channel-symbol">🔴</span><strong>STREAM ON</strong></div>
              <p>Kanał używany podczas transmisji. Prowadzącym nie zawsze musi być MatthevC — dlatego przed wejściem warto sprawdzić, kto aktualnie streamuje.</p>
            </article>
            <article class="discord-channel-row">
              <div class="discord-channel-name"><span class="discord-channel-symbol">🎧</span><strong>Global Voice</strong></div>
              <p>Luźne rozmowy o wszystkim — bez konieczności grania w konkretną grę.</p>
            </article>
            <article class="discord-channel-row">
              <div class="discord-channel-name"><span class="discord-channel-symbol">➕</span><strong>Add Voice</strong></div>
              <p>Tworzy prywatny kanał głosowy. Zwykle korzystają z niego składy podczas gry, więc osoby oglądające prywatną transmisję prosimy, aby nie przeszkadzały w trakcie rozgrywki. Na luźne rozmowy najlepiej poczekać do lobby. 😉</p>
            </article>
          </div>
        </section>

        <section class="discord-channel-section" id="discord-role-games">
          <div class="discord-section-heading">
            <div>
              <span class="discord-section-number">04</span>
              <h2>DEAD BY DAYLIGHT / INNE GRY</h2>
            </div>
            <p>Aktualności, kody i materiały pomocne podczas gry.</p>
          </div>

          <div class="discord-channel-list">
            <article class="discord-channel-row">
              <div class="discord-channel-name"><span class="discord-channel-symbol">🛠️</span><strong>nowości</strong></div>
              <p>Nowe posty i aktualności z Instagrama lub X związane z Dead by Daylight.</p>
            </article>
            <article class="discord-channel-row">
              <div class="discord-channel-name"><span class="discord-channel-symbol">🔑</span><strong>kodziki</strong></div>
              <p>Aktywne kody do Dead by Daylight, którymi warto podzielić się z innymi.</p>
            </article>
            <article class="discord-channel-row">
              <div class="discord-channel-name"><span class="discord-channel-symbol">📚</span><strong>poradnik</strong></div>
              <p>Przydatne strony, konfiguracje i poradniki, które mogą ułatwić grę lub pomóc w jej lepszym zrozumieniu.</p>
            </article>
          </div>
        </section>

      </div>
    </div>
  `;
}

function vipRulesRulesPage() {
  return `
    <div class="container content-wrap">
      <div class="page-panel rules-showcase vip-rules-page">
        <a class="back-link" href="#/">← WRÓĆ NA START</a>

        <div class="rules-hero">
          <div class="rules-hero-badge">VIP</div>
          <h1>VIP TO <span>WYRÓŻNIENIE I ZAUFANIE</span></h1>
          <p>Ranga VIP to nie tylko dodatkowe możliwości, ale też zaufanie, które budujemy wobec aktywnych i pozytywnych osób w naszej społeczności. Poniżej znajdziesz najważniejsze zasady związane z tą rangą.</p>
        </div>

        <div class="rules-memory-strip">
          <div class="rules-memory-title">VIP w skrócie:</div>
          <div class="rules-memory-tags">
            <span>AKTYWNOŚĆ</span>
            <span>ZAUFANIE</span>
            <span>7TV</span>
            <span>REGULARNA OBECNOŚĆ</span>
          </div>
        </div>

        <div class="channel-legend-box narrow">
          <div class="channel-legend-title">Najważniejsze miejsca dla VIP-ów</div>
          <div class="channel-legend-grid">
            <span class="discord-channel-chip voice"><span class="channel-icon">🔊</span><span class="channel-name">POCZEKALNIA</span></span>
            <span class="discord-channel-chip voice"><span class="channel-icon">🔴</span><span class="channel-name">STREAM ON</span></span>
            <span class="mention-pill">MatthevC</span>
          </div>
        </div>

        <div class="rules-card-grid">
          <section class="rule-card" id="event-rule-account">
            <div class="rule-card-top"><div class="rule-card-number">01</div><div class="rule-card-icon" aria-hidden="true">⭐</div></div>
            <div class="rule-card-label">PRZYZNANIE RANGI</div>
            <h2>VIP otrzymują osoby aktywne i pomocne</h2>
            <p>Ranga ta jest przyznawana osobom, które często bywają na transmisjach, aktywnie uczestniczą w społeczności, są pomocne i udzielają się również na Discordzie.</p>
          </section>

          <section class="rule-card" id="event-rule-reward">
            <div class="rule-card-top"><div class="rule-card-number">02</div><div class="rule-card-icon" aria-hidden="true">🔴</div></div>
            <div class="rule-card-label">DOSTĘP DO STREAM ON</div>
            <h2>VIP może wejść bez Poczekalni — ale z głową</h2>
            <p>VIP-y mogą wejść na <span class="discord-channel-chip inline voice"><span class="channel-icon">🔴</span><span class="channel-name">STREAM ON</span></span> bez przechodzenia przez <span class="discord-channel-chip inline voice"><span class="channel-icon">🔊</span><span class="channel-name">POCZEKALNIA</span></span>. To przywilej oparty na zaufaniu — nie wchodzimy tam z błahostkami ani bez zgody Streamera. Nagminne nadużywanie może skutkować utratą VIP-a.</p>
          </section>

          <section class="rule-card" id="event-rule-fair">
            <div class="rule-card-top"><div class="rule-card-number">03</div><div class="rule-card-icon" aria-hidden="true">😄</div></div>
            <div class="rule-card-label">EMOTKI 7TV</div>
            <h2>Możesz dostać możliwość dodawania emotek</h2>
            <p>Każdy VIP może uzyskać możliwość dodawania emotek 7TV. Jeśli chcesz mieć taką opcję, napisz do <span class="mention-pill">MatthevC</span>, a uprawnienie zostanie przypisane ręcznie.</p>
          </section>

          <section class="rule-card" id="event-rule-shipping">
            <div class="rule-card-top"><div class="rule-card-number">04</div><div class="rule-card-icon" aria-hidden="true">📅</div></div>
            <div class="rule-card-label">AKTYWNOŚĆ</div>
            <h2>Brak aktywności może oznaczać utratę rangi</h2>
            <p>Ranga VIP jest odbierana przy około trzech tygodniach nieobecności. Jeśli jednak ponownie wrócisz do częstej aktywności, istnieje możliwość przywrócenia rangi.</p>
          </section>
        </div>

        <div class="rules-summary-box">
          <h2>VIP to coś więcej niż plakietka</h2>
          <p>Ta ranga jest wyróżnieniem dla osób, które realnie budują klimat naszej społeczności. Dlatego zależy nam, aby korzystać z niej odpowiedzialnie i z szacunkiem do pozostałych osób.</p>
        </div>
      </div>
    </div>
  `;
}

function eventRulesPage() {
  return `
    <div class="container content-wrap">
      <div class="page-panel rules-showcase event-rules-page">
        <a class="back-link" href="#/">← WRÓĆ NA START</a>

        <div class="rules-hero">
          <div class="rules-hero-badge">EVENTY</div>
          <h1>GRAMY FAIR I <span>DBAMY O DOBRĄ ZABAWĘ</span></h1>
          <p>Eventy i rozdania mają być przyjemne dla całej społeczności. Dlatego zasady są proste: jedno konto, uczciwy udział, rozsądny kontakt po wygranej i odrobina cierpliwości.</p>
        </div>

        <div class="rules-memory-strip">
          <div class="rules-memory-title">5 rzeczy do zapamiętania:</div>
          <div class="rules-memory-tags">
            <a class="rule-scroll-link" data-target="event-rule-account">JEDNO KONTO</a>
            <a class="rule-scroll-link" data-target="event-rule-reward">14 DNI NA DANE</a>
            <a class="rule-scroll-link" data-target="event-rule-fair">GRAMY FAIR</a>
            <a class="rule-scroll-link" data-target="event-rule-shipping">DO 3 MIESIĘCY NA WYSYŁKĘ</a>
            <a class="rule-scroll-link" data-target="event-rule-consequences">ZASADY = UDZIAŁ</a>
          </div>
        </div>

        <div class="event-rules-timeline">
          <div class="event-rule-step">
            <span class="event-rule-step-icon">🏆</span>
            <div><strong>WYGRYWASZ</strong><small>Gratulacje!</small></div>
          </div>
          <span class="event-rule-arrow">→</span>
          <div class="event-rule-step">
            <span class="event-rule-step-icon">📩</span>
            <div><strong>14 DNI</strong><small>Na przesłanie danych</small></div>
          </div>
          <span class="event-rule-arrow">→</span>
          <div class="event-rule-step">
            <span class="event-rule-step-icon">📦</span>
            <div><strong>DO 3 MIESIĘCY</strong><small>Na wysyłkę nagrody</small></div>
          </div>
        </div>

        <div class="rules-card-grid">
          <section class="rule-card" id="event-rule-account">
            <div class="rule-card-top"><div class="rule-card-number">01</div><div class="rule-card-icon" aria-hidden="true">👤</div></div>
            <div class="rule-card-label">UCZCIWY UDZIAŁ</div>
            <h2>Jedna osoba = jedno konto</h2>
            <p>Zakazane jest tworzenie nowych kont widmo oraz multikont w celu zwiększenia swoich szans. Wykrycie takiego działania przez bota może skutkować <strong>stałym wykluczeniem z przyszłych rozdań</strong>.</p>
          </section>

          <section class="rule-card" id="event-rule-reward">
            <div class="rule-card-top"><div class="rule-card-number">02</div><div class="rule-card-icon" aria-hidden="true">📦</div></div>
            <div class="rule-card-label">ODBIÓR NAGRODY</div>
            <h2>Masz 2 tygodnie na przesłanie danych</h2>
            <p>Jeżeli wygrasz fizyczną nagrodę, w ciągu <strong>14 dni</strong> prześlij w wiadomości prywatnej: numer paczkomatu, miejscowość oraz numer telefonu lub e-mail potrzebny do odbioru paczki. Brak kontaktu oznacza przekazanie nagrody na kolejne rozdanie.</p>
          </section>

          <section class="rule-card" id="event-rule-fair">
            <div class="rule-card-top"><div class="rule-card-number">03</div><div class="rule-card-icon" aria-hidden="true">🎲</div></div>
            <div class="rule-card-label">ZASADY KONKURSU</div>
            <h2>Nie wymuszamy zmian w trakcie zabawy</h2>
            <p>Jeżeli nie odpowiada Ci sposób przeprowadzenia konkretnego konkursu lub rozdania, po prostu nie bierz w nim udziału. Nie wymuszamy zmian i nie psujemy zabawy pozostałym osobom.</p>
          </section>

          <section class="rule-card" id="event-rule-shipping">
            <div class="rule-card-top"><div class="rule-card-number">04</div><div class="rule-card-icon" aria-hidden="true">🚚</div></div>
            <div class="rule-card-label">WYSYŁKA</div>
            <h2>Na wysyłkę przewidujemy do 3 miesięcy</h2>
            <p>Nagrody będą wysyłane w ciągu maksymalnie <strong>3 miesięcy</strong>. Prosimy o cierpliwość — uporczywe upominanie się i spamowanie w sprawie nagrody może skutkować <strong>rezygnacją z nagrody</strong>.</p>
          </section>

          <section class="rule-card event-rule-card-wide" id="event-rule-consequences">
            <div class="rule-card-top"><div class="rule-card-number">05</div><div class="rule-card-icon" aria-hidden="true">⚖️</div></div>
            <div class="rule-card-label">KONSEKWENCJE</div>
            <h2>Złamanie zasad = odsunięcie od najbliższego rozdania</h2>
            <p>Za złamanie regulaminu osoba zostaje odsunięta od najbliższego rozdania. Przy poważniejszych lub powtarzających się naruszeniach mogą obowiązywać także konsekwencje wskazane przy konkretnej zasadzie.</p>
          </section>
        </div>

        <div class="rules-summary-box event-rules-summary">
          <h2>Najprościej?</h2>
          <p>Nie kombinuj z kontami, pilnuj terminu po wygranej, daj organizatorom czas na wysyłkę i baw się zgodnie z zasadami. Dzięki temu eventy pozostają uczciwe i przyjemne dla wszystkich.</p>
        </div>
      </div>
    </div>
  `;
}

function gamePickRulesPage() {
  return `
    <div class="container content-wrap">
      <div class="page-panel rules-showcase game-picks-page">
        <a class="back-link" href="#/">← WRÓĆ NA START</a>

        <div class="rules-hero">
          <div class="rules-hero-badge">WYBÓR DO WSPÓLNYCH GIER</div>
          <h1>KTO MA <span>PIERWSZEŃSTWO DO GRY?</span></h1>
          <p>Żeby uniknąć nieporozumień i zachować porządek podczas wspólnych rozgrywek, obowiązuje poniższa kolejność wyboru osób do lobby. Im wyżej na liście, tym większy priorytet wejścia do wspólnej gry.</p>
        </div>

        <div class="rules-memory-strip">
          <div class="rules-memory-title">Najkrócej:</div>
          <div class="rules-memory-tags">
            <span class="rule-scroll-link" data-target="game-pick-order">JASNA KOLEJNOŚĆ</span>
            <span class="rule-scroll-link" data-target="game-pick-order">PRIORYTET ZA WSPARCIE</span>
            <span class="rule-scroll-link" data-target="game-pick-order">BEZ SPIN</span>
            <span class="rule-scroll-link" data-target="game-pick-order">CZYTELNE ZASADY</span>
          </div>
        </div>

        <div class="pick-order-board" id="game-pick-order">
          <div class="pick-order-intro">Kolejność wyboru osób do wspólnych gier</div>
          <div class="pick-order-list">
            <div class="pick-order-item priority-1"><div class="pick-order-rank">1</div><div class="pick-order-text"><strong>Osoba wykupująca wybór gry</strong><span>Najwyższy priorytet — jeśli ktoś wykupił wybór gry, jego miejsce jest rozpatrywane w pierwszej kolejności.</span></div></div>
            <div class="pick-order-item priority-2"><div class="pick-order-rank">2</div><div class="pick-order-text"><strong>Top donatorzy</strong><span>Osoby najmocniej wspierające kanał finansowo mają bardzo wysoki priorytet wejścia.</span></div></div>
            <div class="pick-order-item priority-3"><div class="pick-order-rank">3</div><div class="pick-order-text"><strong>First Subskrybenci</strong><span>Wysoka pozycja dla osób, które wspierają kanał jako subskrybenci w wyjątkowy sposób.</span></div></div>
            <div class="pick-order-item priority-4"><div class="pick-order-rank">4</div><div class="pick-order-text"><strong>Subskrybenci</strong><span>Stałe wsparcie kanału również przekłada się na wyższe pierwszeństwo przy wspólnych grach.</span></div></div>
            <div class="pick-order-item priority-5"><div class="pick-order-rank">5</div><div class="pick-order-text"><strong>VIP</strong><span>Aktywni i wyróżnieni członkowie społeczności także mają zwiększony priorytet.</span></div></div>
            <div class="pick-order-item priority-6"><div class="pick-order-rank">6</div><div class="pick-order-text"><strong>Osoby obserwujące ponad 3 miesiące</strong><span>Dłuższa obecność i lojalność wobec społeczności mają znaczenie przy doborze do gier.</span></div></div>
            <div class="pick-order-item priority-7"><div class="pick-order-rank">7</div><div class="pick-order-text"><strong>Osoby obserwujące</strong><span>Regularni widzowie nadal są mile widziani — po prostu znajdują się niżej w kolejności priorytetów.</span></div></div>
            <div class="pick-order-item priority-8"><div class="pick-order-rank">8</div><div class="pick-order-text"><strong>Koledzy kolegów</strong><span>Osoby spoza stałej społeczności również mogą dołączyć, ale są dobierane na samym końcu listy priorytetów.</span></div></div>
          </div>
        </div>

        <div class="rules-summary-box">
          <h2>Po co ta kolejność?</h2>
          <p>Ta lista pomaga uniknąć chaosu, niepotrzebnych dyskusji i poczucia niesprawiedliwości. Dzięki temu każdy wie, jak wygląda dobór do lobby i na jakiej zasadzie przyznawany jest priorytet.</p>
        </div>
      </div>
    </div>
  `;
}

function twitchRulesPage() {
  return `
    <div class="container content-wrap">
      <div class="page-panel rules-showcase twitch-rules-page twitch-rules-minimal">
        <a class="back-link" href="#/">← WRÓĆ NA START</a>

        <div class="rules-hero">
          <div class="rules-hero-badge">TWITCH</div>
          <h1>PROSTO: <span>SZANUJ INNYCH I ZASADY TWITCHA</span></h1>
          <p>Podczas transmisji obowiązują zasady naszej społeczności oraz oficjalny regulamin Twitcha. Poniżej znajdziesz najważniejsze zasady, których przestrzegamy.</p>
        </div>

        <div class="rules-card-grid twitch-minimal-grid">
          <section class="rule-card">
            <div class="rule-card-top"><div class="rule-card-number">01</div><div class="rule-card-icon" aria-hidden="true">📜</div></div>
            <div class="rule-card-label">ZASADY SPOŁECZNOŚCI</div>
            <h2>Przestrzegamy regulaminu ogólnego</h2>
            <p>Oprócz zasad Twitcha obowiązuje nas także regulamin ogólny MATT'S WORLD. Dbamy o dobrą atmosferę, wzajemny szacunek i odpowiednie zachowanie.</p>
          </section>

          <section class="rule-card">
            <div class="rule-card-top"><div class="rule-card-number">02</div><div class="rule-card-icon" aria-hidden="true">🛡️</div></div>
            <div class="rule-card-label">BEZPIECZEŃSTWO</div>
            <h2>Bez treści zakazanych i szkodliwych</h2>
            <p>Zakazane są m.in. nieodpowiednie treści 18+, spam, scam, ujawnianie cudzych danych oraz inne zachowania zabronione przez Twitch.</p>
          </section>

          <section class="rule-card">
            <div class="rule-card-top"><div class="rule-card-number">03</div><div class="rule-card-icon" aria-hidden="true">⚖️</div></div>
            <div class="rule-card-label">MODERACJA</div>
            <h2>Moderacja może reagować od razu</h2>
            <p>Łamanie zasad może skutkować usunięciem wiadomości, timeoutem lub banem — zależnie od sytuacji i skali naruszenia.</p>
          </section>
        </div>

        <section class="twitch-download-box">
          <div>
            <div class="rule-card-label">PLIK DO POBRANIA</div>
            <h2>Lista niedozwolonych słów i zwrotów</h2>
            <p>Jeśli potrzebujesz bardziej szczegółowej listy do moderacji, pobierz ją jako osobny plik. Jej treść nie jest wyświetlana na tej stronie.</p>
          </div>
          <a class="download-rules-btn" href="downloads/twitch-zakazane-slowa-i-zwroty.txt" download>POBIERZ LISTĘ ↓</a>
        </section>

        <section class="twitch-official-mini">
          <div>
            <div class="rule-card-label">OFICJALNE ZASADY</div>
            <h2>Pełne zasady znajdziesz na Twitchu</h2>
          </div>
          <div class="official-links-list compact">
            <a class="official-link-card" href="https://legal.twitch.com/en/legal/community-guidelines/" target="_blank" rel="noopener">
              <strong>Community Guidelines</strong>
              <span>Oficjalne zasady społeczności Twitcha</span>
            </a>
            <a class="official-link-card" href="https://legal.twitch.com/en/legal/terms-of-service/" target="_blank" rel="noopener">
              <strong>Terms of Service</strong>
              <span>Warunki korzystania z Twitcha</span>
            </a>
          </div>
        </section>
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
          <div class="vip-badge-media">
            <img class="vip-badge-image" src="pictures/vip/twitch-vip-badge-custom.png" alt="Ikona VIP Twitch" loading="lazy">
          </div>
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


function emotes7tvPage() {
  const steps = [
    ["01","ZAINSTALUJ ROZSZERZENIE","Zacznij od BetterTTV — to najwygodniejsza opcja.",`Wejdź na <a href="https://betterttv.com/" target="_blank" rel="noopener"><strong>BetterTTV ↗</strong></a> i dodaj rozszerzenie do swojej przeglądarki. BetterTTV obsługuje również 7TV i FrankerFaceZ — masz więc trzy systemy w jednym miejscu.`,"pictures/emotes7tv/step-0.png","Instalacja BetterTTV — dodanie rozszerzenia do przeglądarki"],
    ["02","WEJDŹ W USTAWIENIA BETTERTTV","Najpierw upewnij się, że rozszerzenie działa.",`Po instalacji sprawdź, czy w przeglądarce masz włączony plugin <strong>BetterTTV</strong>. Następnie na Twitchowym chacie otwórz <strong>Ustawienia</strong> (koło zębate) i wybierz <strong>Ustawienia BetterTTV</strong>, znajdujące się na samym dole menu.`,"pictures/emotes7tv/step-3.png","Twitch — Ustawienia BetterTTV"],
    ["03","WŁĄCZ EMOTKI 7TV I BETTERTTV","To najważniejsze ustawienie całej konfiguracji.",`Zjedź do ustawień <strong>EMOTKI</strong> i koniecznie zaznacz <strong>Emotki 7TV</strong> oraz <strong>BetterTTV</strong>. Pozostałe opcje możesz ustawić według własnych upodobań.`,"pictures/emotes7tv/step-4.png","Ustawienia emotek BetterTTV — 7TV i BetterTTV"],
    ["04","DODAJ EMOTKI DO MENU","Wygodniejszy dostęp do wszystkich emotek na chacie.",`W <strong>Menu Emotek</strong> możesz uruchomić ikonkę, która doda dostępne emotki z zainstalowanych rozszerzeń bezpośrednio do Twojego <strong>Menu Emotek</strong> na Twitchowym chacie.`,"pictures/emotes7tv/step-5.png","Menu Emotek BetterTTV"],
    ["05","WŁĄCZ PRIORYTETYZACJĘ POD TAB","Szybsze wpisywanie ulubionych emotek.",`Warto zaznaczyć opcję <strong>Priorytetyzuj Emotki pod klawiszem Tab</strong>. Dzięki temu, gdy wpiszesz np. <strong>xdd</strong> i naciśniesz <strong>TAB</strong>, w pierwszej kolejności pojawi się pasująca emotka.`,"pictures/emotes7tv/step-6.png","Priorytetyzowanie emotek pod klawiszem Tab"],
    ["06","ODBIERAJ BONUSOWE PUNKTY I DROPY","Jedno ustawienie i nie musisz już klikać ich ręcznie.",`Zejdź jeszcze na Twitchowy chat i zaznacz sobie <strong>bonusowe punkty kanału</strong> oraz <strong>dropy</strong>. Od tej pory nie będziesz musiał specjalnie klikać w pojawiające się nagrody.`,"pictures/emotes7tv/step-7.png","Bonusowe punkty kanału i dropy na Twitchu"]
  ];
  return `
    <div class="container content-wrap emotes7tv-page">
      <div class="page-panel dixper-shell emotes7tv-shell">
        <a class="back-link" href="#/">← WRÓĆ NA START</a>
        <header class="dixper-intro emotes7tv-intro">
          <div class="emotes7tv-intro-main">
            <span class="dixper-kicker">DLA WIDZA / EMOTKI 7TV</span>
            <h1>EMOTKI 7TV <span>W KILKU PROSTYCH KROKACH</span></h1>
            <p>Nie rozumiesz czasem, co dzieje się na czacie? Dzięki rozszerzeniom 7TV i BetterTTV możesz zobaczyć emotki, których używa nasza społeczność, oraz korzystać z dużo wygodniejszego Twitchowego chatu.</p>
          </div>
          <div class="emotes7tv-links">
            <a class="dixper-primary-link" href="https://betterttv.com/" target="_blank" rel="noopener">ZAINSTALUJ BETTERTTV ↗</a>
            <a class="emotes7tv-secondary-link" href="https://7tv.app/" target="_blank" rel="noopener">ZAINSTALUJ SAMO 7TV ↗</a>
          </div>
        </header>
        <div class="dixper-reading-layout emotes7tv-reading-layout">
          <aside class="dixper-toc emotes7tv-toc" aria-label="Nawigacja po stronie Emotki 7TV">
            <div class="dixper-toc-title">NA TEJ STRONIE</div>
            <div class="dixper-toc-track" aria-hidden="true"><span data-emotes7tv-progress></span></div>
            <button type="button" class="dixper-toc-link active" data-emotes7tv-target="emotes7tv-intro-section"><span>01</span> Wstęp</button>
            <button type="button" class="dixper-toc-link" data-emotes7tv-target="emotes7tv-instruction-section"><span>02</span> Instrukcja</button>
          </aside>
          <main class="dixper-reading-content emotes7tv-content">
            <section class="dixper-clean-section emotes7tv-section" id="emotes7tv-intro-section" data-emotes7tv-section>
              <div class="dixper-clean-heading"><span>01</span><div><h2>WSTĘP</h2><p>Dwa sposoby na znacznie lepszy chat.</p></div></div>
              <div class="emotes7tv-intro-copy"><p><strong>Masz taki chat i nie rozumiesz, o co chodzi innym?</strong></p><p>Bez dodatkowego rozszerzenia część emotek używanych przez społeczność może być dla Ciebie niewidoczna. Osoby, które zainstalują 7TV albo BetterTTV, widzą znacznie więcej emotek i mogą korzystać z dodatkowych funkcji chatu.</p></div>
              <div class="emotes7tv-comparison">
                <article class="emotes7tv-compare-card"><div class="emotes7tv-compare-label"><span>01</span> BEZ ROZSZERZENIA</div><button type="button" class="dixper-shot-link emotes7tv-shot" data-image-preview="pictures/emotes7tv/step-1.png" data-image-alt="Chat Twitch bez rozszerzenia 7TV / BetterTTV"><img src="pictures/emotes7tv/step-1.png" alt="Chat Twitch bez rozszerzenia 7TV / BetterTTV" loading="lazy"><span class="dixper-shot-hint">Kliknij, aby powiększyć</span></button><p>Masz zwykły chat i możesz nie widzieć emotek używanych przez innych.</p></article>
                <div class="emotes7tv-compare-arrow" aria-hidden="true">→</div>
                <article class="emotes7tv-compare-card emotes7tv-compare-card-good"><div class="emotes7tv-compare-label"><span>02</span> Z BETTERTTV / 7TV</div><button type="button" class="dixper-shot-link emotes7tv-shot" data-image-preview="pictures/emotes7tv/step-2.png" data-image-alt="Chat Twitch z emotkami 7TV i BetterTTV"><img src="pictures/emotes7tv/step-2.png" alt="Chat Twitch z emotkami 7TV i BetterTTV" loading="lazy"><span class="dixper-shot-hint">Kliknij, aby powiększyć</span></button><p>Widzisz emotki 7TV, BetterTTV i FrankerFaceZ używane przez społeczność.</p></article>
              </div>
              <div class="emotes7tv-recommendation"><strong>Co polecam?</strong><span><a href="https://betterttv.com/" target="_blank" rel="noopener">BetterTTV</a> — ma obsługę 7TV, BetterTTV i FrankerFaceZ, więc dostajesz rozwiązanie 3 w 1.</span><span>Możesz też zainstalować samo <a href="https://7tv.app/" target="_blank" rel="noopener">7TV</a>, jeśli zależy Ci wyłącznie na emotkach 7TV.</span></div>
            </section>
            <section class="dixper-clean-section emotes7tv-section" id="emotes7tv-instruction-section" data-emotes7tv-section>
              <div class="dixper-clean-heading"><span>02</span><div><h2>INSTRUKCJA</h2><p>Skonfiguruj wszystko raz i korzystaj z lepszego chatu.</p></div></div>
              <div class="dixper-tutorial-minimal emotes7tv-tutorial">
                ${steps.map(([n,title,sub,text,image,alt]) => `<article class="dixper-tutorial-step emotes7tv-tutorial-step"><div class="dixper-step-copy"><span>KROK ${n.replace(/^0/,"")}</span><h3>${title}</h3><p>${sub}</p><div class="emotes7tv-step-description">${text}</div></div>${image ? `<button type="button" class="dixper-shot-link emotes7tv-step-shot" data-image-preview="${image}" data-image-alt="${alt}"><img src="${image}" alt="${alt}" loading="lazy"><span class="dixper-shot-hint">Kliknij, aby powiększyć</span></button>` : `<div class="emotes7tv-empty-shot" aria-label="Miejsce na grafikę do uzupełnienia"><span>+ MIEJSCE NA GRAFIKĘ</span><small>Grafikę dodamy tutaj później.</small></div>`}</article>`).join("")}
              </div>
              <div class="emotes7tv-final-note"><strong>Gotowe!</strong><span>Od teraz możesz korzystać z emotek 7TV, BetterTTV i FrankerFaceZ na naszym chacie. 🎉</span></div>
            </section>
          </main>
        </div>
      </div>
    </div>`;
}

function dixperPage() {
  const clips = [
    { slug: "ExquisiteElegantCardBCouch-y_gcq6VvWUj2CeTl", channel: "MatthevC", url: "https://www.twitch.tv/matthevc/clip/ExquisiteElegantCardBCouch-y_gcq6VvWUj2CeTl?range=all" },
    { slug: "BillowingInexpensiveMacaroniBIRB-jl58lQ1w3XoEX8_R", channel: "MatthevC", url: "https://www.twitch.tv/matthevc/clip/BillowingInexpensiveMacaroniBIRB-jl58lQ1w3XoEX8_R" },
    { slug: "TenderMoralGrasshopperDoubleRainbow-EfrfQ1qfYe38ybci", channel: "FaryMVP", url: "https://www.twitch.tv/farymvp/clip/TenderMoralGrasshopperDoubleRainbow-EfrfQ1qfYe38ybci?range=7d" },
    { slug: "IronicCrispyGalagoKippa-d7GQFM52gV121HVe", channel: "SandyNPC", url: "https://www.twitch.tv/sandynpc/clip/IronicCrispyGalagoKippa-d7GQFM52gV121HVe?range=7d" }
  ];

  const clipParent = location.hostname || "matthevc.github.io";
  const clipsHtml = clips.map((clip, index) => `
    <article class="dixper-clip-card" data-dixper-clip data-clip-slug="${clip.slug}" data-clip-channel="${clip.channel}">
      <div class="dixper-clip-placeholder dixper-clip-preview" data-dixper-clip-slot>
        <iframe
          class="dixper-clip-preview-frame"
          src="https://clips.twitch.tv/embed?clip=${encodeURIComponent(clip.slug)}&parent=${encodeURIComponent(clipParent)}&autoplay=false&muted=true"
          title="Miniatura klipu Twitch — ${clip.channel}"
          loading="lazy"
          tabindex="-1"
          aria-hidden="true"
          allow="fullscreen">
        </iframe>
        <button type="button" class="dixper-clip-preview-cover" data-dixper-play aria-label="Odtwórz klip ${index + 1} od ${clip.channel}">
          <span class="dixper-preview-play">▶</span>
          <span class="dixper-preview-copy">
            <small>PRZYKŁAD ${String(index + 1).padStart(2, "0")}</small>
            <strong>Dixper w praktyce</strong>
            <em>Źródło: ${clip.channel}</em>
          </span>
        </button>
      </div>
      <div class="dixper-clip-meta">
        <span>Kliknij miniaturę, aby uruchomić tylko ten klip.</span>
        <a href="${clip.url}" target="_blank" rel="noopener">OTWÓRZ ORYGINAŁ ↗</a>
      </div>
    </article>
  `).join("");

  return `
    <div class="container content-wrap dixper-page dixper-page-minimal">
      <div class="page-panel dixper-shell dixper-shell-minimal">
        <a class="back-link" href="#/">← WRÓĆ NA START</a>

        <header class="dixper-intro" id="dixper-top">
          <div>
            <span class="dixper-kicker">DLA WIDZA / DIXPER</span>
            <h1>DIXPER <span>W 6 PROSTYCH KROKACH</span></h1>
            <p>Karty Dixpera pozwalają widzom uruchamiać interakcje podczas transmisji. Poniżej masz wszystko, czego potrzebujesz — bez powtarzania tych samych informacji.</p>
          </div>
          <a class="dixper-primary-link" href="https://dixper.gg/matthevc" target="_blank" rel="noopener">OTWÓRZ DIXPER MATTA ↗</a>
        </header>

        <div class="dixper-reading-layout">
          <aside class="dixper-toc" aria-label="Nawigacja po stronie Dixper">
            <div class="dixper-toc-title">NA TEJ STRONIE</div>
            <div class="dixper-toc-track" aria-hidden="true"><span data-dixper-progress></span></div>
            <button type="button" class="dixper-toc-link active" data-dixper-target="dixper-start"><span>01</span> Jak zacząć</button>
            <button type="button" class="dixper-toc-link" data-dixper-target="dixper-get"><span>02</span> Jak zdobyć karty</button>
            <button type="button" class="dixper-toc-link" data-dixper-target="dixper-crates"><span>03</span> Rodzaje skrzynek</button>
            <button type="button" class="dixper-toc-link" data-dixper-target="dixper-use"><span>04</span> Jak odpalić skill</button>
            <button type="button" class="dixper-toc-link" data-dixper-target="dixper-limits"><span>05</span> Cooldowny</button>
            <button type="button" class="dixper-toc-link" data-dixper-target="dixper-clips"><span>06</span> Przykłady</button>
          </aside>

          <main class="dixper-reading-content">
            <section class="dixper-clean-section" id="dixper-start" data-dixper-section>
              <div class="dixper-clean-heading"><span>01</span><div><h2>JAK ZACZĄĆ?</h2><p>Jedna rzecz jest najważniejsza.</p></div></div>
              <div class="dixper-clean-callout">
                <strong>Wejdź przez <a href="https://dixper.gg/matthevc" target="_blank" rel="noopener">dixper.gg/matthevc ↗</a> i zaloguj się przez Twitcha.</strong>
                <p>Nawet jeśli używałeś Dixpera u innego streamera, wejdź przez link Matta — dzięki temu pojawisz się w jego bazie potrzebnej m.in. do rozdawania skrzynek.</p>
              </div>
            </section>

            <section class="dixper-clean-section" id="dixper-get" data-dixper-section>
              <div class="dixper-clean-heading"><span>02</span><div><h2>JAK ZDOBYĆ KARTY?</h2><p>Karty dostajesz ze skrzynek. Skrzynkę możesz zdobyć na 5 sposobów.</p></div></div>
              <div class="dixper-compact-list">
                <div><b>1</b><p><strong>Drop na streamie</strong><span>Gdy pojawi się drop, pierwsze osoby korzystające z linku mogą zgarnąć darmową Basic Crate.</span></p></div>
                <div><b>2</b><p><strong>Coinsy / punkty kanału</strong><span>Wybierz skrzynkę w <a href="#/viewer/rewards">Nagrodach</a>. W wiadomości dopisz kolekcję, np. Straszaki albo Matt Collection.</span></p></div>
                <div><b>3</b><p><strong>Subskrypcja</strong><span>Subskrybenci otrzymują co tydzień darmowy zestaw skrzynek.</span></p></div>
                <div><b>4</b><p><strong>Zakup w Dixperze</strong><span>Skrzynki możesz kupić bezpośrednio na stronie Dixpera; ceny są ustawione możliwie nisko w ramach prowizji platformy.</span></p></div>
                <div><b>5</b><p><strong>Eventy</strong><span>Skrzynki pojawiają się też jako nagrody w specjalnych wydarzeniach, np. Bingo z nagrodami czy Mikołajkowy Matt.</span></p></div>
              </div>
            </section>

            <section class="dixper-clean-section" id="dixper-crates" data-dixper-section>
              <div class="dixper-clean-heading"><span>03</span><div><h2>RODZAJE SKRZYNEK</h2><p>Każda daje 3 karty. Różni się poziomem kontroli nad tym, co dostaniesz.</p></div></div>
              <div class="dixper-crates-minimal dixper-crates-visual">
                <article class="dixper-crate-item basic">
                  <div class="dixper-crate-image-wrap"><img class="dixper-crate-image" src="pictures/dixper/dixper-basic-crate.png" alt="Basic Crate Dixper" loading="lazy"></div>
                  <div><span class="dixper-crate-type">BASIC</span><strong>Basic Crate</strong><p>3 losowe karty.</p></div>
                </article>
                <article class="dixper-crate-item rarity">
                  <div class="dixper-crate-image-wrap"><img class="dixper-crate-image" src="pictures/dixper/dixper-rarity-crate.png" alt="Rarity Crate Dixper" loading="lazy"></div>
                  <div><span class="dixper-crate-type">RARITY</span><strong>Rarity Crate</strong><p>3 karty, w tym jedna o wybranej rzadkości.</p></div>
                </article>
                <article class="dixper-crate-item skill">
                  <div class="dixper-crate-image-wrap"><img class="dixper-crate-image" src="pictures/dixper/dixper-skill-crate.png" alt="Skill Crate Dixper" loading="lazy"></div>
                  <div><span class="dixper-crate-type">SKILL</span><strong>Skill Crate</strong><p>3 karty, w tym jedna konkretna wybrana przez Ciebie.</p></div>
                </article>
              </div>
            </section>

            <section class="dixper-clean-section" id="dixper-use" data-dixper-section>
              <div class="dixper-clean-heading"><span>04</span><div><h2>JAK ODPALIĆ SKILL?</h2><p>Tylko dwa kliknięcia.</p></div></div>
              <div class="dixper-tutorial-minimal">
                <article>
                  <div class="dixper-step-copy"><span>KROK 1</span><h3>Wybierz kartę</h3><p>Kliknij kartę, której chcesz użyć, a następnie <strong>Add Skill to Launch</strong>. Skill jest przygotowany, ale jeszcze się nie uruchamia.</p></div>
                  <button type="button" class="dixper-shot-link" data-image-preview="pictures/dixper/01-wybierz-skill.webp" data-image-alt="Dixper — Add Skill to Launch"><img src="pictures/dixper/01-wybierz-skill.webp" alt="Dixper — Add Skill to Launch" loading="lazy"><span class="dixper-shot-hint">Kliknij, aby powiększyć</span></button>
                </article>
                <article>
                  <div class="dixper-step-copy"><span>KROK 2</span><h3>Uruchom kartę</h3><p>W dodatkowym panelu kliknij <strong>Launch Skills</strong>. W tym momencie karta odpala się na transmisji.</p></div>
                  <button type="button" class="dixper-shot-link" data-image-preview="pictures/dixper/02-launch-skills.webp" data-image-alt="Dixper — Launch Skills"><img src="pictures/dixper/02-launch-skills.webp" alt="Dixper — Launch Skills" loading="lazy"><span class="dixper-shot-hint">Kliknij, aby powiększyć</span></button>
                </article>
              </div>
            </section>

            <section class="dixper-clean-section" id="dixper-limits" data-dixper-section>
              <div class="dixper-clean-heading"><span>05</span><div><h2>COOLDOWNY</h2><p>Limity ograniczają spam skillami.</p></div></div>
              <div class="dixper-limits-row">
                <div><span>GLOBAL COOLDOWN</span><strong>300 s</strong><small>5 minut globalnie</small></div>
                <div><span>USER COOLDOWN</span><strong>360 s</strong><small>6 minut na użytkownika</small></div>
              </div>
            </section>

            <section class="dixper-clean-section" id="dixper-clips" data-dixper-section>
              <div class="dixper-clean-heading"><span>06</span><div><h2>DIXPER W PRAKTYCE</h2><p>Wybierz klip. Odtwarzacz Twitcha zostanie załadowany dopiero po kliknięciu, a uruchomienie kolejnego zamknie poprzedni.</p></div></div>
              <div class="dixper-clips-minimal">${clipsHtml}</div>
            </section>
          </main>
        </div>
      </div>
    </div>
  `;
}

function setupDixperPage() {
  const root = document.querySelector(".dixper-page-minimal");
  if (!root) return;

  const tocLinks = [...root.querySelectorAll("[data-dixper-target]")];
  const sections = [...root.querySelectorAll("[data-dixper-section]")];
  const progress = root.querySelector("[data-dixper-progress]");

  tocLinks.forEach(link => {
    link.addEventListener("click", () => {
      const target = document.getElementById(link.dataset.dixperTarget);
      const activeIndex = sections.findIndex(section => section.id === link.dataset.dixperTarget);
      tocLinks.forEach(item => item.classList.toggle("active", item === link));
      if (progress && activeIndex >= 0) progress.style.height = `${((activeIndex + 1) / sections.length) * 100}%`;
      tocScrollLock = true;
      setTimeout(() => { tocScrollLock = false; }, 1000);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  if ("IntersectionObserver" in window && sections.length) {
    const observer = new IntersectionObserver(entries => {
      if (tocScrollLock) return;
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const activeId = visible.target.id;
      const activeIndex = sections.findIndex(section => section.id === activeId);
      tocLinks.forEach(link => link.classList.toggle("active", link.dataset.dixperTarget === activeId));
      if (progress && activeIndex >= 0) {
        progress.style.height = `${((activeIndex + 1) / sections.length) * 100}%`;
      }
    }, { rootMargin: "-25% 0px -55% 0px", threshold: [0, .15, .35, .6] });
    sections.forEach(section => observer.observe(section));
  }

  const cards = [...root.querySelectorAll("[data-dixper-clip]")];
  const parent = location.hostname || "matthevc.github.io";
  let activeCard = null;

  function resetCard(card) {
    const slot = card?.querySelector("[data-dixper-clip-slot]");
    if (!slot || !slot.dataset.originalMarkup) return;
    slot.innerHTML = slot.dataset.originalMarkup;
    card.classList.remove("playing");
    bindPlayButton(card);
    if (activeCard === card) activeCard = null;
  }

  function bindPlayButton(card) {
    const button = card.querySelector("[data-dixper-play]");
    if (!button || button.dataset.ready === "1") return;
    button.dataset.ready = "1";
    button.addEventListener("click", () => {
      if (activeCard && activeCard !== card) resetCard(activeCard);
      const slot = card.querySelector("[data-dixper-clip-slot]");
      if (!slot.dataset.originalMarkup) slot.dataset.originalMarkup = slot.innerHTML;
      const slug = card.dataset.clipSlug;
      const channel = card.dataset.clipChannel;
      slot.innerHTML = `
        <div class="dixper-active-player">
          <iframe src="https://clips.twitch.tv/embed?clip=${encodeURIComponent(slug)}&parent=${encodeURIComponent(parent)}&autoplay=true" title="Klip Twitch — ${channel}" allow="autoplay; fullscreen" allowfullscreen></iframe>
          <button type="button" class="dixper-player-close" data-dixper-close aria-label="Zamknij klip">×</button>
        </div>`;
      card.classList.add("playing");
      activeCard = card;
      const close = card.querySelector("[data-dixper-close]");
      if (close) close.addEventListener("click", () => resetCard(card), { once: true });
    });
  }

  cards.forEach(card => {
    const slot = card.querySelector("[data-dixper-clip-slot]");
    if (slot) slot.dataset.originalMarkup = slot.innerHTML;
    bindPlayButton(card);
  });
}

function bingoPage() {
  return `
    <div class="container content-wrap bingo-page bingo-page-minimal">
      <div class="page-panel bingo-shell">
        <a class="back-link" href="#/">← WRÓĆ NA START</a>

        <header class="bingo-intro" id="bingo-top">
          <div>
            <span class="dixper-kicker">DLA WIDZA / BINGO - STREAM BOUNTY</span>
            <h1>BINGO <span>W 5 PROSTYCH KROKACH</span></h1>
            <p>Stream Bounty zamienia wydarzenia z transmisji w planszę Bingo. Dołączasz do gry, zaznaczasz eventy, które wydarzyły się na streamie, i ścigasz się z innymi o pierwszą linię pięciu pól.</p>
          </div>
        </header>

        <div class="dixper-reading-layout bingo-reading-layout">
          <aside class="dixper-toc bingo-toc" aria-label="Nawigacja po stronie Bingo">
            <div class="dixper-toc-title">NA TEJ STRONIE</div>
            <div class="dixper-toc-track" aria-hidden="true"><span data-bingo-progress></span></div>
            <button type="button" class="dixper-toc-link active" data-bingo-target="bingo-extension"><span>01</span> Rozszerzenie</button>
            <button type="button" class="dixper-toc-link" data-bingo-target="bingo-join"><span>02</span> Join Game</button>
            <button type="button" class="dixper-toc-link" data-bingo-target="bingo-balls"><span>03</span> Kolory kulek</button>
            <button type="button" class="dixper-toc-link" data-bingo-target="bingo-win"><span>04</span> Jak wygrać</button>
            <button type="button" class="dixper-toc-link" data-bingo-target="bingo-prizes"><span>05</span> Bingo z nagrodami</button>
          </aside>

          <main class="dixper-reading-content bingo-reading-content">
            <section class="dixper-clean-section" id="bingo-extension" data-bingo-section>
              <div class="dixper-clean-heading"><span>01</span><div><h2>ZNAJDŹ ROZSZERZENIE</h2><p>Najpierw otwórz panel Stream Bounty na transmisji.</p></div></div>
              <div class="dixper-tutorial-minimal bingo-tutorial-minimal">
                <article>
                  <div class="dixper-step-copy">
                    <span>KROK 1</span>
                    <h3>Otwórz ikonkę Stream Bounty</h3>
                    <p>Na <strong>komputerze</strong> najedź myszką na ekran transmisji i znajdź ikonkę rozszerzenia po prawej stronie odtwarzacza. Na <strong>telefonie</strong> szukaj tej samej ikonki pod transmisją.</p>
                  </div>
                  <button type="button" class="dixper-shot-link bingo-shot-link" data-image-preview="pictures/bingo/step1-iconka-bingo.png" data-image-alt="Gdzie znajduje się ikonka Stream Bounty na transmisji">
                    <img src="pictures/bingo/step1-iconka-bingo.png" alt="Widok transmisji z zaznaczoną ikonką Stream Bounty">
                    <span class="bingo-image-note">Kliknij, aby powiększyć</span>
                  </button>
                </article>
              </div>
            </section>

            <section class="dixper-clean-section" id="bingo-join" data-bingo-section>
              <div class="dixper-clean-heading"><span>02</span><div><h2>DOŁĄCZ DO GRY</h2><p>Jedno kliknięcie i dostajesz własną planszę.</p></div></div>
              <div class="dixper-tutorial-minimal bingo-tutorial-minimal">
                <article>
                  <div class="dixper-step-copy">
                    <span>KROK 2</span>
                    <h3>Kliknij Join Game!</h3>
                    <p>Po otwarciu rozszerzenia kliknij <strong>Join Game!</strong>. Stream Bounty od razu doda Cię do rozgrywki i przygotuje własną kartę z eventami.</p>
                  </div>
                  <button type="button" class="dixper-shot-link bingo-shot-link" data-image-preview="pictures/bingo/step2-join-game.png" data-image-alt="Panel Stream Bounty z przyciskiem Join Game">
                    <img src="pictures/bingo/step2-join-game.png" alt="Panel Stream Bounty z dużym przyciskiem Join Game">
                    <span class="bingo-image-note">Kliknij, aby powiększyć</span>
                  </button>
                </article>
              </div>
            </section>

            <section class="dixper-clean-section" id="bingo-balls" data-bingo-section>
              <div class="dixper-clean-heading"><span>03</span><div><h2>CO OZNACZAJĄ KOLORY?</h2><p>Wystarczy zapamiętać trzy kolory.</p></div></div>
              <div class="bingo-balls-layout">
                <div class="bingo-ball-legend">
                  <article>
                    <span class="bingo-ball gray"></span>
                    <div><strong>SZARA</strong><p>Event jeszcze się nie wydarzył po ostatnim resecie.</p></div>
                  </article>
                  <article>
                    <span class="bingo-ball yellow"></span>
                    <div><strong>ŻÓŁTA</strong><p>Event już się wydarzył. Możesz kliknąć kulkę i zaznaczyć ją na swojej planszy.</p></div>
                  </article>
                  <article>
                    <span class="bingo-ball purple"></span>
                    <div><strong>FIOLETOWA</strong><p>Event został przez Ciebie poprawnie zaznaczony.</p></div>
                  </article>
                </div>
                <button type="button" class="dixper-shot-link bingo-shot-link bingo-board-shot" data-image-preview="pictures/bingo/step3-plansza-kulki.png" data-image-alt="Plansza Stream Bounty z kulkami w różnych kolorach">
                  <img src="pictures/bingo/step3-plansza-kulki.png" alt="Plansza Stream Bounty pokazująca szare, żółte i fioletowe kulki">
                  <span class="bingo-image-note">Kliknij, aby powiększyć</span>
                </button>
              </div>
            </section>

            <section class="dixper-clean-section" id="bingo-win" data-bingo-section>
              <div class="dixper-clean-heading"><span>04</span><div><h2>JAK WYGRAĆ?</h2><p>Liczy się pierwsza pełna linia pięciu zaznaczonych eventów.</p></div></div>
              <div class="bingo-win-layout">
                <div class="bingo-mini-boards" aria-label="Możliwe układy wygranej">
                  <div class="bingo-mini-board horizontal" title="Poziomo">${Array(25).fill('<i></i>').join('')}</div>
                  <div class="bingo-mini-board vertical" title="Pionowo">${Array(25).fill('<i></i>').join('')}</div>
                  <div class="bingo-mini-board diagonal" title="Na skos">${Array(25).fill('<i></i>').join('')}</div>
                </div>
                <div class="bingo-win-copy">
                  <p>Aby wygrać daną rozgrywkę, musisz <strong>przed innymi</strong> zaznaczyć 5 kulek w jednej linii:</p>
                  <div class="bingo-win-tags"><span>POZIOMO</span><span>PIONOWO</span><span>NA SKOS</span></div>
                  <div class="bingo-extra-card"><strong>Chcesz grać dalej?</strong><p>Po wygranej możesz zdobywać kolejne punkty rankingu. Wykup następną planszę za Bitsy przyciskiem <strong>+ Extra Card</strong>.</p></div>
                </div>
              </div>
            </section>

            <section class="dixper-clean-section" id="bingo-prizes" data-bingo-section>
              <div class="dixper-clean-heading"><span>05</span><div><h2>BINGO Z NAGRODAMI</h2><p>Od czasu do czasu zwykłe Bingo zmienia się w kilkumiesięczną walkę o nagrody.</p></div></div>
              <div class="bingo-prize-summary">
                <div><span>⏱</span><strong>3–4 miesiące</strong><small>typowy czas trwania eventu</small></div>
                <div><span>🏆</span><strong>TOP 3–5</strong><small>osób z rankingu przechodzi do finału</small></div>
                <div><span>🎁</span><strong>do ok. 200 zł</strong><small>typowa wartość nagród</small></div>
              </div>

              <div class="dixper-tutorial-minimal bingo-tutorial-minimal bingo-tutorial-single">
                <article>
                  <div class="dixper-step-copy">
                    <span>KROK 5</span>
                    <h3>Śledź ranking w Leaderboardzie</h3>
                    <p>W eventach <strong>BINGO Z NAGRODAMI</strong> liczy się aktywność i pozycja w rankingu przez cały okres wydarzenia. Najlepsze osoby z <strong>Leaderboardu</strong> dostają możliwość zagrania o nagrodę w finale.</p>
                  </div>
                  <button type="button" class="dixper-shot-link bingo-shot-link" data-image-preview="pictures/bingo/step4-leaderboard.png" data-image-alt="Leaderboard w Stream Bounty">
                    <img src="pictures/bingo/step4-leaderboard.png" alt="Leaderboard w Stream Bounty pokazujący ranking graczy">
                    <span class="bingo-image-note">Kliknij, aby powiększyć</span>
                  </button>
                </article>
              </div>

              <div class="bingo-prize-copy">
                <p>Finaliści grają później o nagrodę w formule przypominającej <strong>grę w ciemno</strong>. W praktyce wybierasz jedną z przygotowanych kopert i dostajesz to, co kryje się w środku.</p>
              </div>

              <div class="bingo-envelope-demo" aria-label="Przykład finału z kopertami">
                <div class="bingo-envelope"><span>A</span><small>KOPERTA</small></div>
                <div class="bingo-envelope"><span>B</span><small>KOPERTA</small></div>
                <div class="bingo-envelope"><span>C</span><small>KOPERTA</small></div>
              </div>
              <p class="bingo-demo-note">To wizualizacja sposobu finału. Konkretne nagrody i liczba kopert zależą od aktualnego eventu.</p>
            </section>
          </main>
        </div>
      </div>
    </div>
  `;
}

function setupBingoPage() {
  const root = document.querySelector(".bingo-page-minimal");
  if (!root) return;

  const links = [...root.querySelectorAll("[data-bingo-target]")];
  const sections = [...root.querySelectorAll("[data-bingo-section]")];
  const progress = root.querySelector("[data-bingo-progress]");

  links.forEach(link => {
    link.addEventListener("click", () => {
      const target = document.getElementById(link.dataset.bingoTarget);
      const activeIndex = sections.findIndex(section => section.id === link.dataset.bingoTarget);
      links.forEach(item => item.classList.toggle("active", item === link));
      if (progress && activeIndex >= 0) progress.style.height = `${((activeIndex + 1) / sections.length) * 100}%`;
      tocScrollLock = true;
      setTimeout(() => { tocScrollLock = false; }, 1000);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  if ("IntersectionObserver" in window && sections.length) {
    const observer = new IntersectionObserver(entries => {
      if (tocScrollLock) return;
      const visible = entries.filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const activeId = visible.target.id;
      const activeIndex = sections.findIndex(section => section.id === activeId);
      links.forEach(link => link.classList.toggle("active", link.dataset.bingoTarget === activeId));
      if (progress && activeIndex >= 0) progress.style.height = `${((activeIndex + 1) / sections.length) * 100}%`;
    }, { rootMargin: "-25% 0px -55% 0px", threshold: [0, .15, .35, .6] });
    sections.forEach(section => observer.observe(section));
  }
}

function rewardsPage() {
  return `
    <div class="container content-wrap rewards-page">
      <div class="page-panel rewards-shell">
        <a class="back-link" href="#/">← WRÓĆ NA START</a>

        <div class="rewards-hero">
          <div class="rewards-hero-copy">
            <span class="rewards-eyebrow">DLA WIDZA / NAGRODY</span>
            <h1>NAGRODY ZA <span>COINSY</span></h1>
            <p>Wszystkie nagrody dostępne na kanale w jednym miejscu. Nagrody są podzielone tematycznie, a w każdej kategorii ułożone od najtańszej do najdroższej.</p>
          </div>

          <div class="rewards-side-note">
            <div class="point-chip-demo">
              <span class="point-chip-icon">🪙</span>
              <span class="point-chip-text">COINS = PUNKTY KANAŁU</span>
            </div>
            <p>Koszt każdej nagrody jest widoczny na karcie. Wyszukiwarka poniżej pozwala znaleźć nagrodę po nazwie, opisie albo koszcie.</p>
          </div>
        </div>

        <div class="reward-search-panel">
          <label class="reward-search-box" for="reward-search-input">
            <span class="reward-search-icon">⌕</span>
            <input id="reward-search-input" type="search" autocomplete="off" placeholder="Szukaj nagrody, np. Bingo, Dixper, 1 vs 1...">
            <button type="button" id="reward-search-clear" class="reward-search-clear" aria-label="Wyczyść wyszukiwanie">×</button>
          </label>
          <div class="reward-search-status" id="reward-search-status">Wszystkie nagrody</div>
        </div>

        <section class="reward-group" data-reward-group>
          <div class="reward-group-head">
            <span class="moderator-section-label">OGÓLNE</span>
            <h2>OGÓLNE</h2>
            <p>Szybkie nagrody związane z czatem, muzyką i podstawową zabawą na transmisji.</p>
          </div>
          <div class="reward-grid">
            <article class="reward-card" data-reward-card>
              <div class="reward-card-top"><div class="reward-graphic orange">🎁</div><span class="reward-cost">10 COINS</span></div>
              <h3>Obecny</h3>
              <p>Nagroda, która pokazuje, że jesteś aktualnie na transmisji.</p>
            </article>

            <article class="reward-card" data-reward-card>
              <div class="reward-card-top"><div class="reward-graphic gold">💬</div><span class="reward-cost">100 COINS</span></div>
              <h3>Wyróżnij moją wiadomość</h3>
              <p>Podkreśla Twoją wiadomość na chacie, dzięki czemu jest bardziej widoczna.</p>
            </article>

            <article class="reward-card" data-reward-card>
              <div class="reward-card-top"><div class="reward-graphic purple">⏭️</div><span class="reward-cost">1,5K COINS</span></div>
              <h3>Skip piosenki</h3>
              <p>Pomija aktualnie odtwarzany utwór na Music Bocie.</p>
            </article>

            <article class="reward-card" data-reward-card>
              <div class="reward-card-top"><div class="reward-graphic dark">🔨</div><span class="reward-cost">10K COINS</span></div>
              <h3>Banicja</h3>
              <p>Nakładasz <strong>24h t/o</strong> na wybraną przez siebie osobę.</p>
            </article>
          </div>
        </section>

        <section class="reward-group" data-reward-group>
          <div class="reward-group-head">
            <span class="moderator-section-label">DIXPER ORAZ STREAM BOUNTY (BINGO)</span>
            <h2>DIXPER ORAZ STREAM BOUNTY (BINGO)</h2>
            <p>Skrzynki Dixpera oraz nagrody wpływające na eventy i planszę Stream Bounty. Teraz układ jest wyrównany w parach: <strong>Bingo po lewej</strong>, <strong>Dixper po prawej</strong>.</p>
          </div>
          <div class="reward-grid reward-grid-family" data-reward-family-grid>
            <div class="reward-family reward-family-bingo" data-reward-family="bingo">
              <div class="reward-column-head reward-column-head-bingo">BINGO / STREAM BOUNTY</div>

              <article class="reward-card" data-reward-card data-reward-family-card="bingo">
                <div class="reward-card-top"><div class="reward-graphic red">🎲</div><span class="reward-cost">1K COINS</span></div>
                <h3>BINGO — RANDOM</h3>
                <p>Rozszerzenie automatycznie odblokowuje jeden losowy event w <strong>Stream Bounty (Bingo)</strong>.</p>
              </article>

              <article class="reward-card" data-reward-card data-reward-family-card="bingo">
                <div class="reward-card-top"><div class="reward-graphic red">🗳️</div><span class="reward-cost">8K COINS</span></div>
                <h3>BINGO — VOTE</h3>
                <p>Uruchamia głosowanie, który event w Stream Bounty odblokuje community. Wygrywa opcja z największą liczbą głosów, a przy remisie losujemy między najczęściej wybieranymi eventami.</p>
              </article>

              <article class="reward-card" data-reward-card data-reward-family-card="bingo">
                <div class="reward-card-top"><div class="reward-graphic red">💥</div><span class="reward-cost">60K COINS</span></div>
                <h3>BINGO ALL</h3>
                <p>Zaznacza wszystkie eventy w <strong>Stream Bounty</strong>. Po wybraniu nagrody trzeba szybko wypełnić planszę, ponieważ po <strong>5 wygranych</strong> i zakończonej rozgrywce w danej grze event wygasa.</p>
              </article>
            </div>

            <div class="reward-family reward-family-dixper" data-reward-family="dixper">
              <div class="reward-column-head reward-column-head-dixper">DIXPER</div>

              <article class="reward-card" data-reward-card data-reward-family-card="dixper">
                <div class="reward-card-top"><div class="reward-graphic blue">📦</div><span class="reward-cost">1,5K COINS</span></div>
                <h3>Dixper — Basic Crate</h3>
                <p>Dostajesz podstawową skrzynkę do Dixpera. <a href="#/viewer/dixper" class="reward-inline-link">Więcej info tutaj →</a></p>
              </article>

              <article class="reward-card" data-reward-card data-reward-family-card="dixper">
                <div class="reward-card-top"><div class="reward-graphic blue">🎁</div><span class="reward-cost">3K COINS</span></div>
                <h3>Dixper — Rarity Crate</h3>
                <p>Dostajesz skrzyneczkę <strong>Rarity</strong> do Dixpera. <a href="#/viewer/dixper" class="reward-inline-link">Więcej info tutaj →</a></p>
              </article>

              <article class="reward-card" data-reward-card data-reward-family-card="dixper">
                <div class="reward-card-top"><div class="reward-graphic blue">🧰</div><span class="reward-cost">4K COINS</span></div>
                <h3>Dixper — Skill Crate</h3>
                <p>Dostajesz skrzyneczkę <strong>Skill</strong> do Dixpera. <a href="#/viewer/dixper" class="reward-inline-link">Więcej info tutaj →</a></p>
              </article>
            </div>
          </div>
        </section>

        <section class="reward-group" data-reward-group>
          <div class="reward-group-head">
            <span class="moderator-section-label">NAGRODY ZWIĄZANE Z DBD</span>
            <h2>NAGRODY ZWIĄZANE Z DBD</h2>
            <p>Nagrody związane z buildami, survivorami i killerami w Dead by Daylight.</p>
          </div>
          <div class="reward-grid">
            <article class="reward-card" data-reward-card>
              <div class="reward-card-top"><div class="reward-graphic green">🎯</div><span class="reward-cost">5K COINS</span></div>
              <h3>Random perk — surv</h3>
              <p>Losujemy randomowy build na survivora, który zagram w następnej gierce. <strong>Tylko DBD.</strong> Pamiętaj napisać w wiadomości, kim mam zagrać.</p>
            </article>

            <article class="reward-card" data-reward-card>
              <div class="reward-card-top"><div class="reward-graphic green">🔪</div><span class="reward-cost">6K COINS</span></div>
              <h3>Random perk — killer</h3>
              <p>Losujemy randomowy build na killera na następną gierkę. <strong>Tylko DBD.</strong> Jeśli gram z kimś survivami, osoba z lobby będzie musiała poczekać 1 meczyk. Pamiętaj napisać w wiadomości, kim mam zagrać.</p>
            </article>

            <article class="reward-card reward-card-wide" data-reward-card>
              <div class="reward-card-top"><div class="reward-graphic gold">🧪</div><span class="reward-cost">10K COINS</span></div>
              <h3>Przetestuj build</h3>
              <p>Matt gra wybranym przez Ciebie buildem na wybranej przez Ciebie postaci.</p>
            </article>
          </div>
        </section>

        <section class="reward-group" data-reward-group>
          <div class="reward-group-head">
            <span class="moderator-section-label">NAGRODY UNIWERSALNE DO GIER</span>
            <h2>NAGRODY UNIWERSALNE DO GIER</h2>
            <p>Nagrody, które można wykorzystać w wielu różnych grach, nie tylko w jednym konkretnym tytule.</p>
          </div>
          <div class="reward-grid">
            <article class="reward-card" data-reward-card>
              <div class="reward-card-top"><div class="reward-graphic purple">⚔️</div><span class="reward-cost">15K COINS</span></div>
              <h3>1 vs 1</h3>
              <p>Nagroda uniwersalna do każdej gry, którą Matt ma w bibliotece. Jeśli gra jest zainstalowana — gramy tego samego dnia. Jeśli nie — ustalamy termin na priv.</p>
              <div class="reward-note">Jeśli nagroda dotyczy gry, której Matt nie posiada, zwrot punktów nastąpi w ciągu 30 dni.</div>
            </article>

            <article class="reward-card" data-reward-card>
              <div class="reward-card-top"><div class="reward-graphic blue">🎮</div><span class="reward-cost">50K COINS</span></div>
              <h3>Wybierz w co gramy</h3>
              <p>Możesz wybrać grę na następną transmisję. Warunek: Matt musi mieć ją w bibliotece i zagra w nią minimum <strong>1 godzinę</strong>.</p>
            </article>
          </div>
        </section>

        <section class="reward-group" data-reward-group>
          <div class="reward-group-head">
            <span class="moderator-section-label">NAGRODY PREMIUM</span>
            <h2>NAGRODY PREMIUM</h2>
            <p>Najbardziej wyjątkowe nagrody — od personalizowanych bonusów po realne korzyści poza transmisją.</p>
          </div>
          <div class="reward-grid">
            <article class="reward-card steam-signature-card" data-reward-card>
              <div class="reward-card-top"><div class="reward-graphic gold">✍️</div><span class="reward-cost">15K COINS</span></div>
              <h3>Podpis profilu Steam</h3>
              <p>Wymyślam unikalny podpis pod Twój profil Steam. Podpisy nigdy nie są takie same. Najedź na wybraną osobę poniżej i zobacz przykładowy komentarz, żeby wiedzieć, na co się piszesz.</p>
              <div class="steam-signature-examples">
                <button type="button" class="steam-example-chip" data-steam-example>
                  Carmelova777
                  <span class="steam-tooltip">+rep
Pod maską skrywa swój sekret mały,
podobno kryje się tak urok wspaniały.
Choć w gierkach nieraz trolluje bez końca,
to z nią każda rozgrywka nabiera słońca.

Maska zostaje, sekret niech trwa dalej,
lecz od dawna jedno życzenie mamy.
Wpadaj do nas częściej na wspólne granie,
bo z Tobą zawsze jest więcej śmiechu i zabawy!

Pozdro od Matta.</span>
                </button>
                <button type="button" class="steam-example-chip" data-steam-example>
                  cvrdi
                  <span class="steam-tooltip">Jest taka cvrdi, co w Dead by Daylight wymiata,
Gdy widzi Pyramid Heada to serduszko już lata!
Choć inni się loopują i tylko się pocą,
Ona w jego objęcia wpada z czułą tęsknotą.

Chyba lepszego nie napiszę.</span>
                </button>
                <button type="button" class="steam-example-chip" data-steam-example>
                  oskixx
                  <span class="steam-tooltip">+REP
Oski, który jest po prostu boski,
Gdy DBD tylko odpala, przeciwnik poci się od troski.
Bo to dobry gamer i kumpel, przy nim ekipa doskonała!
Rivals, Among Us czy Dead by Daylight?
W każdej grze potrafi poprowadzić nas do chwały!
Z nim każda gra ma klimat, śmiech i najlepsze składy!

Pozdrowionka od Matta.</span>
                </button>
                <button type="button" class="steam-example-chip" data-steam-example>
                  BlackStaryolow
                  <span class="steam-tooltip">+REP
Oliwka na złomku wciąż z lagami wojowała,
grała jak mogła, choć gra czasem ją wyśmiewała.
Lecz gdy nowy sprzęt został odpalony raz,
wszyscy oniemieli i pytali - "to ona umie tak grać?".

Choć toksyczne towarzystwo wokół czasem ją dusiło,
u pewnego Matta serduszko znów się rozjaśniło.
Ze Śląska dziewczyna, więc wiadomo, że mocny ma charakter,
a śląski upór w oczach błyszczy - twardszy niż niejeden pancerz.
Niech kluski i rolady dadzą jej w końcu parę kilo,
by przez życie szła już pewnie, głośno czy tam miło.</span>
                </button>
              </div>
              <div class="reward-note">Czas oczekiwania: do 2 tygodni.</div>
            </article>

            <article class="reward-card" data-reward-card>
              <div class="reward-card-top"><div class="reward-graphic red">❤️</div><span class="reward-cost">20K COINS</span></div>
              <h3>SPAM like / serduszek</h3>
              <p>Jeżeli prowadzisz Instagrama, TikToka, fanpage lub inne social media, pod maksymalnie <strong>25 postami</strong> dostaniesz reakcje.</p>
            </article>

            <article class="reward-card" data-reward-card>
              <div class="reward-card-top"><div class="reward-graphic orange">🧠</div><span class="reward-cost">25K COINS</span></div>
              <h3>Ban na słowo</h3>
              <p>Matt nie może powiedzieć wybranego przez Ciebie słowa przez <strong>30 minut</strong>. Uruchamiamy timer na ekranie. Jeśli Matt przegra, dostajecie koło fortuny z dodatkowymi nagrodami.</p>
            </article>

            <article class="reward-card" data-reward-card>
              <div class="reward-card-top"><div class="reward-graphic gold">💜</div><span class="reward-cost">80K COINS</span></div>
              <h3>SUBIK</h3>
              <p>Dostajesz subika na kanał <strong>MatthevC</strong>.</p>
            </article>

            <article class="reward-card reward-card-wide" data-reward-card>
              <div class="reward-card-top"><div class="reward-graphic green">🍔</div><span class="reward-cost reward-cost-soft">KOSZT WG WARIANTU</span></div>
              <h3>Zamówienie z Pyszne do 50 zł / 100 zł</h3>
              <p>Są to bony do <strong>pyszne.pl</strong>, dlatego upewnij się wcześniej, że w Twojej lokalizacji są restauracje obsługujące ten portal.</p>
              <div class="reward-note">Koszt w Coins zależy od aktualnie dostępnego wariantu nagrody na kanale.</div>
            </article>
          </div>
        </section>

        <div class="reward-no-results" id="reward-no-results" hidden>
          <div class="reward-no-results-icon">⌕</div>
          <h2>Nie znaleziono takiej nagrody</h2>
          <p>Spróbuj wpisać inną nazwę, np. „Bingo”, „Dixper”, „Steam” albo „DBD”.</p>
        </div>
      </div>
    </div>
  `;
}

function setupRewardsSearch() {
  const input = document.getElementById("reward-search-input");
  const clear = document.getElementById("reward-search-clear");
  const status = document.getElementById("reward-search-status");
  const empty = document.getElementById("reward-no-results");
  const groups = [...document.querySelectorAll("[data-reward-group]")];
  const cards = [...document.querySelectorAll("[data-reward-card]")];
  if (!input || !clear || !status || !empty || !groups.length || !cards.length) return;

  const normalize = value => value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  function filterRewards() {
    const query = normalize(input.value);
    let visibleCount = 0;

    cards.forEach(card => {
      const haystack = normalize(card.textContent || "");
      const visible = !query || haystack.includes(query);
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    const families = [...document.querySelectorAll("[data-reward-family]")];
    families.forEach(family => {
      const hasVisibleCards = [...family.querySelectorAll("[data-reward-card]")].some(card => !card.hidden);
      family.hidden = !hasVisibleCards;
    });

    document.querySelectorAll("[data-reward-family-grid]").forEach(grid => {
      const visibleFamilies = [...grid.querySelectorAll("[data-reward-family]")].filter(family => !family.hidden).length;
      grid.classList.toggle("single-family", visibleFamilies === 1);
    });

    groups.forEach(group => {
      const hasVisibleCards = [...group.querySelectorAll("[data-reward-card]")].some(card => !card.hidden);
      group.hidden = !hasVisibleCards;
    });

    empty.hidden = visibleCount !== 0;
    status.textContent = query
      ? `Znaleziono: ${visibleCount} ${visibleCount === 1 ? "nagrodę" : "nagród"}`
      : `Wszystkie nagrody: ${cards.length}`;
    clear.classList.toggle("visible", Boolean(input.value));
  }

  input.addEventListener("input", filterRewards);
  clear.addEventListener("click", () => {
    input.value = "";
    input.focus();
    filterRewards();
  });

  filterRewards();
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
  { command: "!queuedbd (!dbd/!qdbd)", description: "Sprawdź kolejki na Dead by Daylght.", category: "Ogólne", roles: ["viewer", "vip", "moderator"] },
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
  const dbdClass = command.command.toLowerCase().includes("queuedbd") ? " command-dbd" : "";
  return `<article class="command command-${special}${dbdClass}" data-command="${escapeHtml(command.command.toLowerCase())} ${escapeHtml(command.description.toLowerCase())}">
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

function setupImagePreview() {
  const triggers = [...document.querySelectorAll("[data-image-preview]")];
  if (!triggers.length) return;

  let modal = document.getElementById("site-image-preview");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "site-image-preview";
    modal.className = "site-image-preview";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="site-image-preview-backdrop" data-image-preview-close></div>
      <div class="site-image-preview-dialog" role="dialog" aria-modal="true" aria-label="Podgląd obrazu">
        <button type="button" class="site-image-preview-close" data-image-preview-close aria-label="Zamknij podgląd">×</button>
        <img src="" alt="">
      </div>`;
    document.body.appendChild(modal);
  }

  const image = modal.querySelector("img");
  const closeButtons = [...modal.querySelectorAll("[data-image-preview-close]")];

  function closePreview() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("image-preview-open");
    window.setTimeout(() => { if (!modal.classList.contains("open")) image.src = ""; }, 180);
  }

  triggers.forEach(trigger => {
    if (trigger.dataset.previewReady === "1") return;
    trigger.dataset.previewReady = "1";
    trigger.addEventListener("click", () => {
      image.src = trigger.dataset.imagePreview;
      image.alt = trigger.dataset.imageAlt || trigger.querySelector("img")?.alt || "Podgląd obrazu";
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("image-preview-open");
      modal.querySelector(".site-image-preview-close")?.focus();
    });
  });

  closeButtons.forEach(button => {
    if (button.dataset.previewCloseReady === "1") return;
    button.dataset.previewCloseReady = "1";
    button.addEventListener("click", closePreview);
  });

  if (modal.dataset.escapeReady !== "1") {
    modal.dataset.escapeReady = "1";
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && modal.classList.contains("open")) closePreview();
    });
  }
}


function setupEmotes7tvPage() {
  const root = document.querySelector(".emotes7tv-page");
  if (!root) return;
  const links = [...root.querySelectorAll("[data-emotes7tv-target]")];
  const sections = [...root.querySelectorAll("[data-emotes7tv-section]")];
  const progress = root.querySelector("[data-emotes7tv-progress]");
  let lock = false;
  links.forEach(link => link.addEventListener("click", () => {
    const id = link.dataset.emotes7tvTarget;
    const index = sections.findIndex(section => section.id === id);
    links.forEach(item => item.classList.toggle("active", item === link));
    if (progress && index >= 0) progress.style.height = `${((index + 1) / sections.length) * 100}%`;
    lock = true;
    setTimeout(() => { lock = false; }, 900);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      if (lock) return;
      const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio-a.intersectionRatio)[0];
      if (!visible) return;
      links.forEach(link => link.classList.toggle("active", link.dataset.emotes7tvTarget === visible.target.id));
      const index = sections.indexOf(visible.target);
      if (progress && index >= 0) progress.style.height = `${((index + 1) / sections.length) * 100}%`;
    }, { rootMargin: "-22% 0px -62% 0px", threshold: [0,.1,.3,.6] });
    sections.forEach(section => observer.observe(section));
  }
}

function setupGlobalPageNavigation() {
  const currentPath = location.hash.replace(/^#\/?/, "").replace(/^\/+|\/+$/g, "");

  // Te podstrony celowo nie korzystają z automatycznego paska nawigacji.
  if (currentPath.startsWith("rules/") || currentPath === "moderator/team") return;

  // Dixper i Bingo mają własną, ręcznie dopracowaną nawigację.
  if (document.querySelector(".dixper-page-minimal, .bingo-page-minimal, .recommended-page, .downloads-page, .emotes7tv-page")) return;

  const panel = document.querySelector("#app .page-panel");
  if (!panel || panel.dataset.globalNavReady === "1") return;

  // Na stronie komend w nawigacji pokazujemy wyłącznie sekcje z kategoriami.
  // Dzięki temu nie pojawia się sztuczna pozycja „Początek” odnosząca się do nagłówka H1.
  const isCommandsPage = /(?:^|\/)commands$/.test(currentPath);
  const headingSelector = isCommandsPage ? ".command-category-heading h2" : "h1, h2";
  const headings = [...panel.querySelectorAll(headingSelector)]
    .filter(heading => !heading.closest(".site-page-toc") && heading.offsetParent !== null);
  if (headings.length < 2) return;

  panel.dataset.globalNavReady = "1";
  panel.classList.add("with-global-page-nav");

  headings.forEach((heading, index) => {
    if (!heading.id) heading.id = `page-section-${index + 1}`;
    heading.dataset.pageNavHeading = "1";
  });

  const backLink = [...panel.children].find(child => child.classList?.contains("back-link"));
  const movable = [...panel.children].filter(child => child !== backLink);
  const content = document.createElement("div");
  content.className = "site-page-nav-content";
  movable.forEach(child => content.appendChild(child));

  const aside = document.createElement("aside");
  aside.className = "dixper-toc site-page-toc";
  aside.setAttribute("aria-label", "Nawigacja po tej stronie");
  aside.innerHTML = `
    <div class="dixper-toc-title">NA TEJ STRONIE</div>
    <div class="dixper-toc-track" aria-hidden="true"><span data-site-page-progress></span></div>
    ${headings.map((heading, index) => {
      const raw = heading.textContent.replace(/\s+/g, " ").trim();
      const label = !isCommandsPage && index === 0 ? "Początek" : (raw.length > 34 ? `${raw.slice(0, 32)}…` : raw);
      return `<button type="button" class="dixper-toc-link site-page-toc-link${index === 0 ? " active" : ""}" data-site-page-target="${heading.id}"><span>${String(index + 1).padStart(2, "0")}</span>${label}</button>`;
    }).join("")}`;

  const layout = document.createElement("div");
  layout.className = "dixper-reading-layout site-page-nav-layout";
  layout.append(aside, content);
  if (backLink) backLink.insertAdjacentElement("afterend", layout);
  else panel.prepend(layout);

  const links = [...aside.querySelectorAll("[data-site-page-target]")];
  const progress = aside.querySelector("[data-site-page-progress]");

  const keepActiveLinkVisible = (link) => {
    if (!link) return;
    link.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const forceLastSectionAtPageEnd = () => {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8) {
      const lastHeading = headings[headings.length - 1];
      const lastLink = links[links.length - 1];
      if (lastHeading && lastLink) {
        links.forEach(item => item.classList.toggle("active", item === lastLink));
        keepActiveLinkVisible(lastLink);
        const lastIndex = headings.length - 1;
        if (progress) progress.style.height = `${((lastIndex + 1) / headings.length) * 100}%`;
      }
    }
  };

  window.addEventListener("scroll", forceLastSectionAtPageEnd, { passive: true });

  links.forEach(link => link.addEventListener("click", () => {
    const targetId = link.dataset.sitePageTarget;
    const activeIndex = headings.findIndex(heading => heading.id === targetId);
    links.forEach(item => item.classList.toggle("active", item === link));
    keepActiveLinkVisible(link);
    if (progress && activeIndex >= 0) progress.style.height = `${((activeIndex + 1) / headings.length) * 100}%`;
    tocScrollLock = true;
    setTimeout(() => { tocScrollLock = false; }, 1000);
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }));

  if ("IntersectionObserver" in window) {
    const isVipPage = currentPath === "viewer/vip" || currentPath === "vip" || currentPath === "vip/how-to" || currentPath === "vip/benefits";

    const observer = new IntersectionObserver(entries => {
      if (tocScrollLock) return;

      const visible = entries.filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (!visible.length) return;

      // VIP ma dwie karty obok siebie (JAK ZOSTAĆ VIP-EM + JAK STRACIĆ VIP-A).
      // Pokazujemy obie jako aktywne, gdy znajdują się w tym samym miejscu widoku.
      if (isVipPage) {
        const visibleIds = visible.map(entry => entry.target.id);
        links.forEach(link => {
          link.classList.toggle("active", visibleIds.includes(link.dataset.sitePageTarget));
        });

        const firstActive = links.find(link => link.classList.contains("active"));
        keepActiveLinkVisible(firstActive);

        const lastVisible = headings.indexOf(visible[0].target);
        if (progress && lastVisible >= 0) progress.style.height = `${((lastVisible + 1) / headings.length) * 100}%`;
        return;
      }

      const active = visible[0];
      const activeIndex = headings.indexOf(active.target);

      links.forEach(link => link.classList.toggle("active", link.dataset.sitePageTarget === active.target.id));
      keepActiveLinkVisible(links.find(link => link.dataset.sitePageTarget === active.target.id));

      if (progress && activeIndex >= 0) {
        progress.style.height = `${((activeIndex + 1) / headings.length) * 100}%`;
      }
    }, { rootMargin: "-18% 0px -55% 0px", threshold: [0, .1, .3, .6] });

    headings.forEach(heading => observer.observe(heading));
  }
}

function discordJoinPage() {
  return `
    <div class="container content-wrap discord-join-page">
      <div class="page-panel discord-join-panel">
        <a class="back-link" href="#/">← WRÓĆ NA START</a>

        <header class="discord-join-hero">
          <div class="discord-join-hero-copy">
            <span class="discord-join-kicker">NASZ DISCORD / DOŁĄCZ DO SPOŁECZNOŚCI</span>
            <h1>WBIJ DO <span>MATT'S WORLD</span></h1>
            <p>Discord to centrum naszej społeczności poza transmisją — rozmowy, wspólne granie, eventy, ogłoszenia i szybki kontakt z ekipą. Zajrzyj do środka i ustaw serwer tak, żeby pokazywał dokładnie to, co Cię interesuje.</p>

            <div class="discord-join-actions">
              <a class="discord-join-primary" id="page-discord-link" href="#" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.54 4.44A16.2 16.2 0 0 0 15.6 3.2l-.48.98a14.8 14.8 0 0 0-6.24 0L8.4 3.2a16.2 16.2 0 0 0-3.94 1.24C2.2 7.72 1.5 11.1 1.84 14.42a15.7 15.7 0 0 0 4.8 2.44l1.17-1.6c-.63-.23-1.22-.5-1.77-.82l.43-.34c3.5 1.64 7.48 1.64 10.98 0l.43.34c-.55.32-1.14.59-1.77.82l1.17 1.6a15.7 15.7 0 0 0 4.8-2.44c.4-3.84-.65-7.19-2.54-9.98ZM8.6 13.6c-1.02 0-1.85-.94-1.85-2.1s.82-2.1 1.85-2.1 1.87.94 1.85 2.1c0 1.16-.82 2.1-1.85 2.1Zm6.8 0c-1.02 0-1.85-.94-1.85-2.1s.82-2.1 1.85-2.1 1.87.94 1.85 2.1c0 1.16-.82 2.1-1.85 2.1Z"/></svg>
                DOŁĄCZ DO SERWERA
              </a>
              <a class="discord-join-secondary" href="#/discord/channels">ZOBACZ OPIS KANAŁÓW →</a>
            </div>
          </div>

          <div class="discord-server-summary" data-discord-server-summary>
            <div class="discord-server-icon" data-discord-server-icon>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.54 4.44A16.2 16.2 0 0 0 15.6 3.2l-.48.98a14.8 14.8 0 0 0-6.24 0L8.4 3.2a16.2 16.2 0 0 0-3.94 1.24C2.2 7.72 1.5 11.1 1.84 14.42a15.7 15.7 0 0 0 4.8 2.44l1.17-1.6c-.63-.23-1.22-.5-1.77-.82l.43-.34c3.5 1.64 7.48 1.64 10.98 0l.43.34c-.55.32-1.14.59-1.77.82l1.17 1.6a15.7 15.7 0 0 0 4.8-2.44c.4-3.84-.65-7.19-2.54-9.98ZM8.6 13.6c-1.02 0-1.85-.94-1.85-2.1s.82-2.1 1.85-2.1 1.87.94 1.85 2.1c0 1.16-.82 2.1-1.85 2.1Zm6.8 0c-1.02 0-1.85-.94-1.85-2.1s.82-2.1 1.85-2.1 1.87.94 1.85 2.1c0 1.16-.82 2.1-1.85 2.1Z"/></svg>
            </div>
            <div>
              <small>TWÓJ SERWER</small>
              <strong data-discord-server-name>MATT'S WORLD</strong>
              <div class="discord-live-stats">
                <span><i class="online-dot"></i><b data-discord-online-count>—</b> online</span>
                <span><i class="member-dot"></i><b data-discord-member-count>—</b> członków</span>
              </div>
            </div>
          </div>
        </header>

<section class="discord-join-steps" id="discord-steps">
          <div class="discord-section-title">
            <div>
              <span>01 / START</span>
              <h2>TRZY KROKI I JESTEŚ U SIEBIE</h2>
            </div>
          </div>
          <div class="discord-step-grid">
            <article><b>01</b><div><h3>DOŁĄCZ</h3><p>Kliknij przycisk zaproszenia i zaakceptuj wejście na serwer MATT'S WORLD.</p></div></article>
            <article><b>02</b><div><h3>SKONFIGURUJ</h3><p>Otwórz <strong>#konfiguracja-tickets</strong> i wybierz role, gry oraz powiadomienia, które chcesz otrzymywać.</p></div></article>
            <article><b>03</b><div><h3>WPADAJ DO EKIPY</h3><p>Napisz na ogólnym, znajdź osoby do gry albo po prostu obserwuj, co aktualnie dzieje się w społeczności.</p></div></article>
          </div>
        </section>

<section class="discord-configure-section" id="discord-configure">
          <div class="discord-configure-icon" aria-hidden="true">⚙</div>
          <div class="discord-configure-copy">
            <span>02 / TWÓJ DISCORD, TWOJE ZASADY</span>
            <h2>ZACZNIJ OD <strong>#konfiguracja-tickets</strong></h2>
            <p>Po wejściu na serwer koniecznie zajrzyj na kanał <strong>#konfiguracja-tickets</strong>. To właśnie tam możesz dopasować Discorda pod siebie — wybrać interesujące Cię gry i powiadomienia, ograniczyć kanały, których nie potrzebujesz, oraz ustawić serwer tak, żeby był dla Ciebie wygodny zamiast przeładowany.</p>
            <p class="discord-configure-highlight">Kilka kliknięć na początku i później widzisz przede wszystkim to, co naprawdę Cię interesuje.</p>
          </div>
          <a class="discord-configure-button" id="discord-configure-invite" href="#" target="_blank" rel="noopener">WEJDŹ I SKONFIGURUJ →</a>
        </section>

<section class="discord-preview-section" id="discord-preview">
  <div class="discord-section-title">
    <div>
      <span>03 / PODGLĄD SERWERA</span>
      <h2>TAK WYGLĄDA MATT'S WORLD</h2>
    </div>
    <p>Przykładowy widok zbudowany na podstawie naszego prawdziwego układu Discorda. Pokazuje kategorie, kanały, powiadomienia i listę społeczności w stylu zbliżonym do tego, co zobaczysz po dołączeniu.</p>
  </div>

  <div class="discord-showcase-wrap">
    <div class="discord-showcase-note">
      <span>PODGLĄD MATT'S WORLD</span>
      <strong>Więcej kanałów, więcej osób i układ bliższy prawdziwemu serwerowi</strong>
      <p>Podgląd jest poglądowy — aktualna zawartość kanałów i lista osób mogą się zmieniać na bieżąco.</p>
    </div>

    <div class="discord-app-preview discord-app-preview-expanded" aria-label="Przykładowy podgląd serwera MATT'S WORLD">
      <aside class="discord-app-rail" aria-label="Przykładowe ikony serwerów">
        <div class="discord-app-home discord-rail-icon discord-rail-home" aria-label="Discord">
          <svg class="discord-rail-discord-logo" viewBox="0 0 24 24" aria-hidden="true"><path d="M19.54 4.44A16.2 16.2 0 0 0 15.6 3.2l-.48.98a14.8 14.8 0 0 0-6.24 0L8.4 3.2a16.2 16.2 0 0 0-3.94 1.24C2.2 7.72 1.5 11.1 1.84 14.42a15.7 15.7 0 0 0 4.8 2.44l1.17-1.6c-.63-.23-1.22-.5-1.77-.82l.43-.34c3.5 1.64 7.48 1.64 10.98 0l.43.34c-.55.32-1.14.59-1.77.82l1.17 1.6a15.7 15.7 0 0 0 4.8-2.44c.4-3.84-.65-7.19-2.54-9.98ZM8.6 13.6c-1.02 0-1.85-.94-1.85-2.1s.82-2.1 1.85-2.1 1.87.94 1.85 2.1c0 1.16-.82 2.1-1.85 2.1Zm6.8 0c-1.02 0-1.85-.94-1.85-2.1s.82-2.1 1.85-2.1 1.87.94 1.85 2.1c0 1.16-.82 2.1-1.85 2.1Z"/></svg>
        </div>
        <div class="discord-app-server discord-rail-icon discord-current-server" data-discord-rail-server-icon>
          <img src="pictures/logo/matthevc-monkey.png" alt="MATT'S WORLD">
        </div>
        <div class="discord-rail-icon rail-orange">🔥</div>
        <div class="discord-rail-icon rail-red">🎮</div>
        <div class="discord-rail-icon rail-blue">⚡</div>
        <div class="discord-rail-icon rail-purple">💀</div>
        <div class="discord-rail-icon rail-green">🧪</div>
        <div class="discord-rail-icon rail-pink">✨</div>
        <div class="discord-rail-icon rail-gold">🏆</div>
      </aside>

      <aside class="discord-app-channels">
        <div class="discord-app-server-title">
          <strong data-discord-widget-name>MATT'S WORLD</strong>
          <span>⌄</span>
        </div>

        <div class="discord-app-boost">✦ <span>cel dot. wzmocnienia</span><b>2/3</b></div>

        <div class="discord-app-channel-section">
          <div class="discord-app-category">TICKET <b>＋</b></div>
        </div>

        <div class="discord-app-channel-section">
          <div class="discord-app-category">TWITCH/KONFIGURACJA <b>＋</b></div>
          <a class="discord-app-channel" href="#/discord/channels?jump=discord-role-twitch"><span class="channel-icon ticket">🎫</span> konfiguracja-tickets</a>
          <a class="discord-app-channel" href="#/discord/channels?jump=discord-role-twitch"><span class="channel-icon megaphone">📣</span> ogłoszenia</a>
          <a class="discord-app-channel active live" href="#/discord/channels?jump=discord-role-twitch"><span class="channel-icon live">●</span> live-alert</a>
          <a class="discord-app-channel" href="#/discord/channels?jump=discord-role-twitch"><span class="channel-icon rules">☑</span> regulamin</a>
        </div>

        <div class="discord-app-channel-section">
          <div class="discord-app-category">TEXT CHANNELS <b>＋</b></div>
          <a class="discord-app-channel" href="#/discord/channels?jump=discord-role-text"><span>＃</span> ogólny</a>
          <a class="discord-app-channel" href="#/discord/channels?jump=discord-role-text"><span>🎮</span> szukam-do-gry</a>
          <a class="discord-app-channel" href="#/discord/channels?jump=discord-role-text"><span>🖼</span> zdjęcia-grafika</a>
          <a class="discord-app-channel" href="#/discord/channels?jump=discord-role-text"><span>🎨</span> wasze-arcydzieła</a>
          <a class="discord-app-channel" href="#/discord/channels?jump=discord-role-text"><span>🤣</span> memy</a>
          <a class="discord-app-channel" href="#/discord/channels?jump=discord-role-text"><span>🎬</span> wideo</a>
          <a class="discord-app-channel" href="#/discord/channels?jump=discord-role-text"><span>✂</span> matt-klip</a>
          <a class="discord-app-channel" href="#/discord/channels?jump=discord-role-text"><span>📚</span> poradniki</a>
          <a class="discord-app-channel" href="#/discord/channels?jump=discord-role-text"><span>💸</span> promocje</a>
          <a class="discord-app-channel vip" href="#/discord/channels?jump=discord-role-roles"><span>◆</span> vip</a>
        </div>

        <div class="discord-app-channel-section">
          <div class="discord-app-category">VOICE ROOM <b>＋</b></div>
          <a class="discord-app-channel" href="#/discord/channels?jump=discord-role-voice"><span>🔊</span> POCZEKALNIA</a>
          <a class="discord-app-channel" href="#/discord/channels?jump=discord-role-voice"><span>🔴</span> STREAM ON</a>
          <a class="discord-app-channel" href="#/discord/channels?jump=discord-role-voice"><span>🌍</span> Global Voice</a>
          <a class="discord-app-channel" href="#/discord/channels?jump=discord-role-voice"><span>➕</span> Add Voice</a>
        </div>

        <div class="discord-app-channel-section compact">
          <div class="discord-app-category">DEAD BY DAYLIGHT <b>＋</b></div>
          <a class="discord-app-channel" href="#/discord/channels?jump=discord-role-games"><span>📰</span> nowości</a>
          <a class="discord-app-channel" href="#/discord/channels?jump=discord-role-games"><span>🧰</span> kodziki</a>
          <a class="discord-app-channel" href="#/discord/channels?jump=discord-role-games"><span>📖</span> poradnik</a>
        </div>
      </aside>

      <main class="discord-app-chat discord-live-chat">
        <header class="discord-app-chat-head">
          <div><span class="channel-live-dot">●</span><strong>live-alert</strong></div>
          <div class="discord-app-chat-icons" aria-hidden="true">⌕　⚑　♟　☻</div>
        </header>

        <div class="discord-app-messages discord-alert-feed">

          <div class="discord-app-date">12 CZERWCA 2026</div>

          <article class="discord-message discord-alert-message">
            <div class="discord-avatar avatar-alert">M</div>
            <div>
              <div class="discord-message-meta"><strong>Ojciec Mateusz</strong><span>16:08</span></div>
              <p>Hejka <strong>@Viewer</strong>! MatthevC właśnie odpalił streama — wpadasz?</p>
              <div class="discord-live-embed">
                <div class="discord-live-embed-accent"></div>
                <div class="discord-live-embed-copy">
                  <strong>MatthevC</strong>
                  <a href="https://www.twitch.tv/MatthevC" target="_blank" rel="noopener">Szukamy chętnych do lobby!</a>
                  <span>Ktoś chętny pobiegać? BINGO Z NAGRODAMI! DIXPER ON!</span>
                  <small>Viewers 20</small>
                </div>
                <img src="pictures/logo/matthevc-monkey.png" alt="MatthevC">
                <div class="discord-live-preview-box">▶</div>
              </div>
            </div>
          </article>

          <div class="discord-app-date">13 CZERWCA 2026</div>

          <article class="discord-message discord-alert-message">
            <div class="discord-avatar avatar-alert">M</div>
            <div>
              <div class="discord-message-meta"><strong>Ojciec Mateusz</strong><span>09:05</span></div>
              <p>MatthevC właśnie odpalił streama — czas na kolejną transmisję.</p>
              <div class="discord-live-embed">
                <div class="discord-live-embed-accent"></div>
                <div class="discord-live-embed-copy">
                  <strong>MatthevC</strong>
                  <a href="https://www.twitch.tv/MatthevC" target="_blank" rel="noopener">Gramy ze społecznością</a>
                  <span>Wpadaj na stream i dołącz do ekipy.</span>
                  <small>Viewers 29</small>
                </div>
                <img src="pictures/logo/matthevc-monkey.png" alt="MatthevC">
                <div class="discord-live-preview-box">▶</div>
              </div>
            </div>
          </article>
        </div>

        <div class="discord-app-composer">＋ <span>Napisz na # live-alert</span><b>🎁　😊　＋</b></div>
      </main>

      <aside class="discord-app-members discord-members-expanded">
        <div class="discord-members-search">Aktywność — <span data-discord-online-count>—</span> ◉</div>

        <div class="discord-member-group">STREAMER — 1</div>
        <div class="discord-member"><img class="member-avatar member-photo streamer" src="pictures/logo/matthevc-monkey.png" alt="MatthevC"><div><strong class="role-streamer">MatthevC</strong><small>● streamer</small></div></div>

        <div class="discord-member-group">MODERACJA — 4</div>
        <div class="discord-member"><img class="member-avatar member-photo mod" src="pictures/moderators/blackstaryolow.webp" alt="BlackStaryolow"><div><strong class="role-mod">BlackStaryolow</strong><small>Moderator główny</small></div></div>
        <div class="discord-member"><img class="member-avatar member-photo mod" src="pictures/moderators/xorzech112.webp" alt="xorzech112"><div><strong class="role-mod">orzech</strong><small>Koordynator eventów</small></div></div>
        <div class="discord-member"><img class="member-avatar member-photo mod" src="pictures/moderators/x_aeriel.webp" alt="x_aeriel"><div><strong class="role-mod">x_aeriel</strong><small>Opiekunka społeczności</small></div></div>
        <div class="discord-member"><img class="member-avatar member-photo mod" src="pictures/moderators/texturalorc.webp" alt="texturalorc"><div><strong class="role-mod">textural_</strong><small>Strażnik Discorda</small></div></div>

        <div class="discord-member-group">VIP — 4</div>
        <div class="discord-member"><span class="member-avatar vip avatar-purple">N</span><div><strong class="role-vip">Nightmare</strong><small>🎮 Dead by Daylight</small></div></div>
        <div class="discord-member"><span class="member-avatar vip avatar-pink">S</span><div><strong class="role-vip">SandyNPC</strong><small>● online</small></div></div>
        <div class="discord-member"><span class="member-avatar vip avatar-green">W</span><div><strong class="role-vip">wazzzupek</strong><small>● online</small></div></div>
        <div class="discord-member"><span class="member-avatar vip avatar-gold">R</span><div><strong class="role-vip">Ramksio</strong><small>🎮 ze społecznością</small></div></div>

        <div class="discord-member-group">VIEWER — 6</div>
        <div class="discord-member"><span class="member-avatar avatar-gray">P</span><div><strong>.Pan_Niemowa</strong><small>🎮 ROBLOX</small></div></div>
        <div class="discord-member"><span class="member-avatar avatar-blue">X</span><div><strong>xMMKPLx</strong><small>😎 online</small></div></div>
        <div class="discord-member"><span class="member-avatar avatar-green">A</span><div><strong>Albert Wesker</strong><small>● online</small></div></div>
        <div class="discord-member"><span class="member-avatar avatar-purple">A</span><div><strong>amel_xa</strong><small>● online</small></div></div>
        <div class="discord-member"><span class="member-avatar avatar-teal">C</span><div><strong>cardi</strong><small>🌻 online</small></div></div>
        <div class="discord-member"><span class="member-avatar avatar-red">D</span><div><strong>Deli</strong><small>● online</small></div></div>
      </aside>
    </div>

  </div>
</section>

        
      </div>
    </div>
  `;
}



function downloadsPage() {
  const downloadItems = [
    {
      id: "download-twitch-words",
      type: "TXT",
      meta: "6 KB • TWITCH",
      title: "Zakazane słowa na Twitchu",
      description: "Czytelna lista słów i zwrotów powiązana z naszym regulaminem Twitch. Przydatna dla widzów, moderatorów i osób, które chcą szybko sprawdzić zasady.",
      href: "downloads/twitch-zakazane-slowa-i-zwroty.txt",
      secondaryHref: "#/rules/twitch",
      secondaryLabel: "ZOBACZ REGULAMIN",
      icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4.5 5v6.2c0 4.7 3 8.9 7.5 10.8 4.5-1.9 7.5-6.1 7.5-10.8V5L12 2Zm0 2.2 5.4 2.1v4.9c0 3.7-2.1 7-5.4 8.6-3.3-1.6-5.4-4.9-5.4-8.6V6.3L12 4.2Zm-1 4h2v5h-2v-5Zm0 6.4h2v2h-2v-2Z"/></svg>`
    },
    {
      id: "download-matt-reshade",
      type: "INI",
      meta: "4 KB • PRESET RESHADE",
      title: "MattCreshade.ini",
      description: "Uniwersalny preset ReShade od Matta. Gotowy plik konfiguracyjny do pobrania bez szukania ustawień po Discordzie i wiadomościach.",
      href: "downloads/MattCreshade.ini",
      icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h10v2H4V5Zm0 6h16v2H4v-2Zm0 6h12v2H4v-2Zm13-13h3v4h-3V4ZM9 10h3v4H9v-4Zm9 6h3v4h-3v-4Z"/></svg>`
    },
    {
      id: "download-dbd-reshade",
      type: "ZIP",
      meta: "511 KB • DEAD BY DAYLIGHT",
      title: "Reshade Filters DBD",
      description: "Paczka filtrów ReShade od KinightLighta, polecana w społeczności Dead by Daylight. Wszystkie pliki są spakowane w jednym archiwum ZIP.",
      href: "downloads/Reshade Filters DBD.zip",
      icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h9l5 5v13H5V3Zm2 2v14h10V9h-4V5H7Zm8 .8V7h1.2L15 5.8ZM9 9h2v2H9V9Zm2 2h2v2h-2v-2Zm-2 2h2v2H9v-2Zm2 2h2v2h-2v-2Z"/></svg>`
    }
  ];

  const cards = downloadItems.map((item, index) => `
    <article
      class="downloads-card"
      id="${item.id}"
      data-collection-item
      data-search="${escapeHtml(`${item.title} ${item.type} ${item.meta} ${item.description}`.toLowerCase())}">
      <div class="downloads-card-icon">${item.icon}</div>
      <div class="downloads-card-main">
        <div class="downloads-card-topline">
          <span class="downloads-type">${item.type}</span>
          <span class="downloads-meta">${item.meta}</span>
        </div>
        <h2>${item.title}</h2>
        <p>${item.description}</p>
        <div class="downloads-actions">
          <a class="downloads-primary" href="${item.href}" download>POBIERZ PLIK ↓</a>
          ${item.secondaryHref ? `<a class="downloads-secondary" href="${item.secondaryHref}">${item.secondaryLabel} →</a>` : ""}
        </div>
      </div>
      <div class="downloads-card-number">0${index + 1}</div>
    </article>
  `).join("");

  return `
    <div class="container content-wrap downloads-page">
      <div class="page-panel downloads-panel">
        <a class="back-link" href="#/">← WRÓĆ NA START</a>

        <header class="downloads-hero">
          <div class="downloads-kicker">PLIKI DLA SPOŁECZNOŚCI</div>
          <h1>DO <span>POBRANIA</span></h1>
          <p>Wszystko, co warto mieć pod ręką, zebrałem w jednym miejscu. Bez przekopywania Discorda — wybierasz plik i pobierasz.</p>
          <div class="downloads-summary" aria-label="Podsumowanie sekcji">
            <span><strong>${downloadItems.length}</strong> plików</span>
            <span><strong>1</strong> miejsce</span>
            <span><strong>0</strong> zbędnego szukania</span>
          </div>
        </header>

        <section class="collection-toolbar downloads-toolbar" aria-label="Wyszukiwanie i widok plików">
          <label class="collection-search">
            <span>WYSZUKAJ PLIK</span>
            <div class="collection-search-box">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m20.6 19.2-4.4-4.4a7.3 7.3 0 1 0-1.4 1.4l4.4 4.4 1.4-1.4ZM5 10.5a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0Z"/></svg>
              <input id="downloads-search" type="search" placeholder="Np. ReShade, Twitch, DBD..." autocomplete="off">
            </div>
          </label>

          <label class="collection-limit">
            <span>PLIKÓW NA STRONIE</span>
            <select id="downloads-page-size" aria-label="Liczba plików na stronie">
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="40">40</option>
              <option value="50">50</option>
            </select>
          </label>

          <div class="collection-summary" id="downloads-result-summary" aria-live="polite"></div>
        </section>

        <section id="downloads-list" class="downloads-list" aria-label="Pliki do pobrania">
          ${cards}
        </section>

        <div id="downloads-empty" class="collection-empty" hidden>Nie znaleziono plików pasujących do wyszukiwania.</div>
        <nav id="downloads-pagination" class="collection-pagination" aria-label="Strony plików"></nav>

        <section class="downloads-help">
          <div>
            <span class="downloads-help-label">WAŻNE</span>
            <h2>PLIKI POBIERASZ BEZPOŚREDNIO ZE STRONY</h2>
            <p>Jeżeli przeglądarka zamiast pobrać plik otworzy jego podgląd, użyj opcji „Zapisz jako” albo przycisku pobierania w przeglądarce.</p>
          </div>
        </section>
      </div>
    </div>
  `;
}

function recommendedStreamersPage() {
  const clipParent = location.hostname || "matthevc.github.io";
  const GAME_ART_MAP = {
    "Dead by Daylight": "https://static-cdn.jtvnw.net/ttv-boxart/Dead%20by%20Daylight-144x192.jpg",
    "Euro Truck Simulator 2": "https://static-cdn.jtvnw.net/ttv-boxart/Euro%20Truck%20Simulator%202-144x192.jpg",
    "League of Legends": "https://static-cdn.jtvnw.net/ttv-boxart/League%20of%20Legends-144x192.jpg",
    "Fortnite": "https://static-cdn.jtvnw.net/ttv-boxart/Fortnite-144x192.jpg",
    "Teamfight Tactics": "https://static-cdn.jtvnw.net/ttv-boxart/Teamfight%20Tactics-144x192.jpg",
    "VALORANT": "https://static-cdn.jtvnw.net/ttv-boxart/VALORANT-144x192.jpg",
    "Counter-Strike 2": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/library_600x900_2x.jpg",
    "R.E.P.O.": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3241660/library_600x900_2x.jpg",
    "Among Us": "https://static-cdn.jtvnw.net/ttv-boxart/Among%20Us-144x192.jpg",
    "Mortal Kombat X": "https://static-cdn.jtvnw.net/ttv-boxart/Mortal%20Kombat%20X-144x192.jpg",
    "Mortal Kombat 11": "https://static-cdn.jtvnw.net/ttv-boxart/Mortal%20Kombat%2011-144x192.jpg"
  };

  const gameBoxArt = (name) => GAME_ART_MAP[name] || `https://static-cdn.jtvnw.net/ttv-boxart/${encodeURIComponent(name)}-144x192.jpg`;

  const cards = RECOMMENDED_STREAMERS.map((streamer, index) => `
    <article
      class="recommended-card"
      id="streamer-${streamer.login}"
      data-recommended-section
      data-streamer-login="${streamer.login}"
      data-streamer-name="${streamer.displayName}">
      <div class="recommended-head">
        <a
          class="recommended-avatar-link"
          href="${streamer.channelUrl}"
          target="_blank"
          rel="noopener"
          aria-label="Otwórz kanał Twitch ${streamer.displayName}">
          <span class="recommended-avatar-wrap">
            <img
              class="recommended-avatar"
              data-streamer-avatar
              src="https://unavatar.io/twitch/${streamer.login}"
              alt="Avatar ${streamer.displayName}"
              loading="lazy">
          </span>
          <span class="recommended-avatar-hover">TWITCH ↗</span>
        </a>

        <div class="recommended-meta">
          <span class="recommended-index">0${index + 1} / POLECANY TWÓRCA</span>
          <h2 data-streamer-name-target>${streamer.displayName}</h2>
          <p>${streamer.tagline}</p>
        </div>

        <div class="recommended-actions">
          <a class="recommended-action primary" href="${streamer.channelUrl}" target="_blank" rel="noopener">TWITCH ↗</a>
          <a class="recommended-action" href="${streamer.clipUrl}" target="_blank" rel="noopener">OTWÓRZ KLIP ↗</a>
        </div>
      </div>

      <div class="recommended-body">
        <div class="recommended-clip-frame">
          <iframe
            src="https://clips.twitch.tv/embed?clip=${encodeURIComponent(streamer.clipSlug)}&parent=${encodeURIComponent(clipParent)}&autoplay=false"
            title="Polecany klip Twitch — ${streamer.displayName}"
            loading="lazy"
            allowfullscreen>
          </iframe>
        </div>

        <div class="recommended-side">
          <div class="recommended-note-box">
            <h3>NAJCZĘŚCIEJ OGRYWANE</h3>
            <div class="recommended-games">
              ${streamer.games.map(game => `
                <span class="recommended-game-chip">
                  <img src="${gameBoxArt(game)}" alt="${game}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='https://static-cdn.jtvnw.net/ttv-static/404_boxart.jpg';">
                  <strong>${game}</strong>
                </span>
              `).join("")}
            </div>
          </div>
        </div>
      </div>
    </article>
  `).join("");

  const navigation = RECOMMENDED_STREAMERS.map((streamer, index) => `
    <button
      type="button"
      class="recommended-toc-link${index === 0 ? " active" : ""}"
      data-recommended-target="streamer-${streamer.login}">
      <span>${String(index + 1).padStart(2, "0")}</span>
      <strong>${streamer.displayName}</strong>
    </button>
  `).join("");

  return `
    <div class="container content-wrap recommended-page">
      <div class="page-panel recommended-panel">
        <a class="back-link" href="#/">← WRÓĆ NA START</a>

        <header class="recommended-hero">
          <div class="recommended-hero-badge">MÓJ WATCHLIST</div>
          <h1>KIEDY MNIE NIE MA, <span>WPADAJ DO TYCH TWÓRCÓW</span></h1>
          <p>Jeśli akurat nie jestem na żywo, śmiało zaglądaj do tych osób. To twórcy, których mogę z czystym sumieniem polecić mojej społeczności — za klimat, regularność i dobrą energię na streamach.</p>
        </header>

        <div class="recommended-reading-layout">
          <aside class="recommended-toc" aria-label="Polecani streamerzy">
            <div class="recommended-toc-title">TWÓRCY</div>
            <div class="recommended-toc-track" aria-hidden="true"><span data-recommended-progress></span></div>
            ${navigation}
          </aside>

          <main class="recommended-grid">${cards}</main>
        </div>
      </div>
    </div>
  `;
}

function contactPage() {
  return `
    <div class="container content-wrap">
      <div class="page-panel contact-panel">
        <a class="back-link" href="#/">← WRÓĆ NA START</a>
        <h1>WNIOSKI / <span>KONTAKT</span></h1>
        <p>To miejsce do wszystkich ważniejszych spraw dotyczących społeczności. Możesz tutaj napisać podanie o unbana, złożyć skargę lub zażalenie, poinformować z kim nie chcesz grać, zaproponować zmiany i usprawnienia, przesłać propozycję współpracy, zgłosić kandydaturę albo napisać w innej sprawie. Wypełnij formularz, a wiadomość trafi do ekipy MATT'S WORLD.</p>

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
              <option>Podanie o unbana</option>
              <option>Skarga lub zażalenie</option>
              <option>Informacja — z kim nie chcę grać</option>
              <option>Propozycja zmian lub usprawnień</option>
              <option>Propozycja współpracy / marketing</option>
              <option>Zgłoszenie swojej kandydatury na moderatora</option>
              <option>Prośba o przydzielenie uprawnień</option>
              <option>Inna sprawa</option>
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
  console.log("[MATT'S WORLD] Ładowanie eventów z Supabase...");

  try {
    const { data, error } = await supabaseClient
      .from("events")
      .select("*")
      .order("start_date", { ascending: false });

    if (error) {
      throw error;
    }

    const events = (data || []).map(event => ({
      id: event.id,
      title: event.title,
      date: event.start_date,
      endDate: event.end_date,
      image: event.image_url,
      imageFit: event.image_fit || "contain",
      mainImage: event.main_image_url || event.image_url,
      mainImageFit: event.main_image_fit || "contain",
      excerpt: (event.description || "").length > 150 ? (event.description || "").slice(0,150) + "..." : (event.description || ""),
      content: event.description || "",
      publishDate: event.publish_date
    }));

    console.log("[MATT'S WORLD] Pobrano eventów z Supabase:", events.length);

    return events.length ? events : FALLBACK_EVENTS;

  } catch (error) {
    console.error("[MATT'S WORLD] Nie udało się pobrać eventów z Supabase:", error);
    console.warn("[MATT'S WORLD] Używam wbudowanego eventu awaryjnego.");
    return FALLBACK_EVENTS;
  }
}

function eventCard(event) {
  const ended = isEventEnded(event);
  const cover = event.image
    ? `<div class="event-cover event-cover-image${ended ? " event-cover-ended" : ""}">
         <img style="object-fit:${escapeHtml(event.imageFit || "contain")};object-position:center" src="${escapeHtml(event.image)}" alt="${escapeHtml(event.title)}" loading="lazy">
         ${ended ? '<div class="event-ended-badge">ZAKOŃCZONY</div>' : ""}
       </div>`
    : `<div class="event-cover${ended ? " event-cover-ended" : ""}">
         ${ended ? '<div class="event-ended-badge">ZAKOŃCZONY</div>' : ""}
       </div>`;

  return `
    <article
      class="event-card${ended ? " event-ended" : ""}"
      data-collection-item
      data-search="${escapeHtml(`${event.title} ${event.excerpt || ""} ${event.content || ""} ${event.date || ""}`.toLowerCase())}">
      ${cover}
      <div class="event-body">
        <div class="event-date">${formatDate(event.date)}</div>
        <h2>${escapeHtml(event.title)}</h2>
        <p>${escapeHtml(event.excerpt)}</p>
        <div class="event-actions">
          <a class="event-read" href="#/events/${encodeURIComponent(event.id)}">CZYTAJ CAŁOŚĆ →</a>
          ${window.currentUserIsAdmin === true ? `<button class="edit-event-btn" data-id="${escapeHtml(event.id)}">✎ EDYTUJ POST</button>` : ""}
        </div>

      </div>
    </article>
  `;
}

function setupHomeEventSlider(root) {
  const track = root.querySelector(".home-event-track");
  if (!track) return;

  const cards = [...track.children];
  if (!cards.length) return;

  let index = 0;

  // Nawigacja pokazuje dokładnie tyle pozycji, ile eventów
  // jest aktualnie wyświetlanych na stronie głównej (maks. 3).
  const dotsWrap = document.createElement("div");
  dotsWrap.className = "home-event-dots";
  dotsWrap.setAttribute("aria-label", "Wybór eventu");

  cards.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "home-event-dot";
    dot.setAttribute("aria-label", `Event ${i + 1}`);
    dot.addEventListener("click", () => {
      index = i;
      move();
    });
    dotsWrap.appendChild(dot);
  });

  root.appendChild(dotsWrap);

  const updateDots = () => {
    dotsWrap.querySelectorAll(".home-event-dot").forEach((dot, i) => {
      const active = i === index;
      dot.classList.toggle("active", active);
      dot.setAttribute("aria-current", active ? "true" : "false");
    });
  };

  const move = () => {
    track.style.transform = `translateX(-${index * 100}%)`;
    updateDots();
  };

  root.querySelector(".right")?.addEventListener("click", () => {
    // Po przejściu z ostatniego eventu wracamy na pierwszy.
    index = index >= cards.length - 1 ? 0 : index + 1;
    move();
  });

  root.querySelector(".left")?.addEventListener("click", () => {
    // Po cofnięciu z pierwszego eventu przechodzimy na ostatni.
    index = index <= 0 ? cards.length - 1 : index - 1;
    move();
  });

  move();
}

function formatDate(date) {
  if (!date) return "Brak daty";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Brak daty";
  }

  try {
    return new Intl.DateTimeFormat("pl-PL", {
      day: "numeric", month: "long", year: "numeric"
    }).format(parsed);
  } catch (e) {
    return "Brak daty";
  }
}


function formatTime(date) {
  if (!date) return "--:--";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "--:--";
  return new Intl.DateTimeFormat("pl-PL", {hour:"2-digit", minute:"2-digit", hour12:false}).format(parsed);
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}



function collectionPageSequence(totalPages, currentPage) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const sorted = [...pages].filter(page => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  const result = [];

  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push("…");
    result.push(page);
  });

  return result;
}

function setupCollectionView({ storageKey, list, searchInput, pageSizeSelect, pagination, summary, empty, itemLabel, statusFilter }) {
  if (!list || !pageSizeSelect || !pagination) return;

  const items = [...list.querySelectorAll("[data-collection-item]")];
  if (!items.length) {
    if (pagination) pagination.innerHTML = "";
    if (summary) summary.textContent = `0 ${itemLabel}`;
    return;
  }

  const allowedSizes = [10, 20, 30, 40, 50];
  const savedSize = Number(localStorage.getItem(storageKey));
  let pageSize = allowedSizes.includes(savedSize) ? savedSize : 10;
  let currentPage = 1;
  let query = "";

  pageSizeSelect.value = String(pageSize);

  const renderCollection = () => {
    const normalizedQuery = query.trim().toLowerCase();
    const selectedStatus = statusFilter?.value || "all";
    const filtered = items.filter(item => {
      const matchesSearch = !normalizedQuery || (item.dataset.search || item.textContent).toLowerCase().includes(normalizedQuery);
      const isEnded = item.classList.contains("event-ended");
      const matchesStatus = selectedStatus === "all"
        || (selectedStatus === "active" && !isEnded)
        || (selectedStatus === "ended" && isEnded);
      return matchesSearch && matchesStatus;
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    currentPage = Math.min(currentPage, totalPages);

    items.forEach(item => { item.hidden = true; });

    const start = (currentPage - 1) * pageSize;
    const visible = filtered.slice(start, start + pageSize);
    visible.forEach(item => { item.hidden = false; });

    if (empty) empty.hidden = filtered.length !== 0;

    if (summary) {
      if (!filtered.length) {
        summary.innerHTML = `<strong>0</strong> ${itemLabel}`;
      } else {
        const from = start + 1;
        const to = Math.min(start + pageSize, filtered.length);
        summary.innerHTML = `<strong>${from}–${to}</strong> z ${filtered.length} ${itemLabel} <span>•</span> strona ${currentPage} z ${totalPages}`;
      }
    }

    const pageButtons = collectionPageSequence(totalPages, currentPage).map(page => {
      if (page === "…") return `<span class="collection-page-ellipsis">…</span>`;
      return `<button type="button" class="collection-page-button${page === currentPage ? " active" : ""}" data-page="${page}" aria-label="Przejdź do strony ${page}"${page === currentPage ? ' aria-current="page"' : ""}>${page}</button>`;
    }).join("");

    pagination.innerHTML = `
      <button type="button" class="collection-page-arrow" data-page-action="prev" ${currentPage === 1 ? "disabled" : ""} aria-label="Poprzednia strona">←</button>
      <div class="collection-page-numbers">${pageButtons}</div>
      <button type="button" class="collection-page-arrow" data-page-action="next" ${currentPage === totalPages ? "disabled" : ""} aria-label="Następna strona">→</button>
    `;

    pagination.querySelectorAll("[data-page]").forEach(button => {
      button.addEventListener("click", () => {
        currentPage = Number(button.dataset.page);
        renderCollection();
        list.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    pagination.querySelector('[data-page-action="prev"]')?.addEventListener("click", () => {
      if (currentPage <= 1) return;
      currentPage -= 1;
      renderCollection();
      list.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    pagination.querySelector('[data-page-action="next"]')?.addEventListener("click", () => {
      if (currentPage >= totalPages) return;
      currentPage += 1;
      renderCollection();
      list.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  searchInput?.addEventListener("input", () => {
    query = searchInput.value;
    currentPage = 1;
    renderCollection();
  });

  statusFilter?.addEventListener("change", () => {
    currentPage = 1;
    renderCollection();
  });

  pageSizeSelect.addEventListener("change", () => {
    const selected = Number(pageSizeSelect.value);
    pageSize = allowedSizes.includes(selected) ? selected : 10;
    localStorage.setItem(storageKey, String(pageSize));
    currentPage = 1;
    renderCollection();
  });

  renderCollection();
}

function setupDownloadsPage() {
  const list = document.getElementById("downloads-list");
  if (!list) return;

  setupCollectionView({
    storageKey: "downloadsPageSize",
    list,
    searchInput: document.getElementById("downloads-search"),
    pageSizeSelect: document.getElementById("downloads-page-size"),
    pagination: document.getElementById("downloads-pagination"),
    summary: document.getElementById("downloads-result-summary"),
    empty: document.getElementById("downloads-empty"),
    itemLabel: "plików"
  });
}

function updateEventAdminButton(isAdmin) {
  const btn = document.getElementById("addEventButton");
  if (!btn) return;
  btn.hidden = !isAdmin;
  btn.style.display = isAdmin ? "inline-flex" : "none";
  btn.style.visibility = isAdmin ? "visible" : "hidden";
}

async function renderEvents() {
  const events = await loadEvents();
  const list = document.getElementById("events-list");
  if (!list) return;

  list.innerHTML = events.length
    ? events.map(eventCard).join("")
    : `<div class="empty">Brak eventów. Dodaj pierwszy wpis w panelu administratora.</div>`;

  window.dispatchEvent(new CustomEvent("matt-events-rendered"));

  setupCollectionView({
    storageKey: "eventsPageSize",
    list,
    searchInput: document.getElementById("events-search"),
    pageSizeSelect: document.getElementById("events-page-size"),
    pagination: document.getElementById("events-pagination"),
    summary: document.getElementById("events-result-summary"),
    empty: document.getElementById("events-empty"),
    itemLabel: "eventów",
    statusFilter: document.getElementById("events-status-filter")
  });
}

async function renderEventDetail(id) {
  const events = await loadEvents();
  const event = events.find(e => String(e.id) === String(id));

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
      <article class="page-panel event-detail-modern">
        <a class="back-link" href="#/events">← WRÓĆ DO EVENTÓW</a>
        <div class="event-publish-top">
          <span>OPUBLIKOWANO</span>
          ${formatDate(event.publishDate)}<div class="event-time"><span>🕒</span> ${formatTime(event.publishDate)}</div>
        </div>
        <div class="event-title-admin-row"><h1>${escapeHtml(event.title)}</h1></div>
        
        ${event.mainImage ? `<div class="event-detail-image"><img style="object-fit:${event.mainImageFit || "contain"};object-position:center" src="${escapeHtml(event.mainImage)}" alt="${escapeHtml(event.title)}"></div>` : ""}
        <div class="event-dates-box">
          <div><small>ROZPOCZĘCIE</small><strong>${formatDate(event.date)}<div class="event-time"><span>🕒</span> ${formatTime(event.date)}</div></strong></div>
          <div><small>ZAKOŃCZENIE</small><strong>${formatDate(event.endDate)}<div class="event-time"><span>🕒</span> ${formatTime(event.endDate)}</div></strong></div>
        </div>
        <div class="event-detail-description article-text">
          ${escapeHtml(event.content || event.excerpt || "").replace(/\n/g, "<br><br>")}
        </div>
      </article>
    </div>
  `;
  window.dispatchEvent(new Event("matt-event-detail-rendered"));
}


function notFoundPage(path = "") {
  const prettyPath = path ? `#/${path}` : "#/(brak ścieżki)";
  return `
    <div class="container content-wrap error-page-wrap">
      <section class="error-panel" aria-labelledby="error-page-title">
        <div class="error-layout">
          <div class="error-copy">
            <div class="error-kicker">STRONA BŁĘDU / MATT'S WORLD</div>
            <div class="error-code">404</div>
            <h1 id="error-page-title">UPS... COŚ POSZŁO <span>NIE TAK</span></h1>
            <div class="error-divider" aria-hidden="true"></div>
            <p>Wygląda na to, że ta podstrona zniknęła, nigdy nie istniała albo jest chwilowo w remoncie. Pjoter dalej próbuje ogarnąć, co się tu wydarzyło zanim przyjdzie Janusz oraz Pan Wiesio.</p>
            <div class="error-actions">
              <a class="error-btn primary" href="#/">
                <span class="error-btn-icon" aria-hidden="true">⌂</span>
                <span>WRÓĆ NA START</span>
              </a>
              <a class="error-btn secondary" href="#/?jump=home-sections">
                <span class="error-btn-icon" aria-hidden="true">▦</span>
                <span>NAJWAŻNIEJSZE SEKCJE</span>
              </a>
            </div>
            <div class="error-path">Nie znaleziono: <code>${escapeHtml(prettyPath)}</code></div>
          </div>
          <div class="error-visual" aria-hidden="true">
            <div class="error-visual-frame">
              <img class="error-monkey-render" src="pictures/error/404-monkey-render.png" alt="">
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

function errorMonkeySceneSvg() {
  return `
    <svg class="error-monkey-svg" viewBox="0 0 640 500" role="img" aria-label="Kapucynka budowlaniec drapiąca się po głowie">
      <defs>
        <linearGradient id="vestGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ffd34d"></stop>
          <stop offset="100%" stop-color="#c98613"></stop>
        </linearGradient>
        <linearGradient id="helmetGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ffd968"></stop>
          <stop offset="100%" stop-color="#d58b16"></stop>
        </linearGradient>
        <linearGradient id="signGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#151515"></stop>
          <stop offset="100%" stop-color="#231313"></stop>
        </linearGradient>
        <radialGradient id="bgGlow" cx="50%" cy="48%" r="60%">
          <stop offset="0%" stop-color="rgba(239,43,45,.32)"></stop>
          <stop offset="100%" stop-color="rgba(239,43,45,0)"></stop>
        </radialGradient>
      </defs>
      <ellipse cx="318" cy="448" rx="215" ry="34" fill="rgba(0,0,0,.36)"></ellipse>
      <circle cx="382" cy="172" r="140" fill="url(#bgGlow)"></circle>
      <g class="warning-tape" opacity=".65">
        <rect x="95" y="340" width="440" height="18" rx="9" fill="#4b1112"></rect>
        <g fill="#ef2b2d">
          <rect x="105" y="343" width="24" height="12" transform="skewX(-28)"></rect>
          <rect x="155" y="343" width="24" height="12" transform="skewX(-28)"></rect>
          <rect x="205" y="343" width="24" height="12" transform="skewX(-28)"></rect>
          <rect x="255" y="343" width="24" height="12" transform="skewX(-28)"></rect>
          <rect x="305" y="343" width="24" height="12" transform="skewX(-28)"></rect>
          <rect x="355" y="343" width="24" height="12" transform="skewX(-28)"></rect>
          <rect x="405" y="343" width="24" height="12" transform="skewX(-28)"></rect>
          <rect x="455" y="343" width="24" height="12" transform="skewX(-28)"></rect>
        </g>
      </g>

      <g class="cone cone-left">
        <ellipse cx="118" cy="428" rx="34" ry="10" fill="rgba(0,0,0,.22)"></ellipse>
        <path d="M97 418L116 352h16l19 66Z" fill="#f46c2d"></path>
        <rect x="108" y="373" width="35" height="11" rx="4" fill="#fff"></rect>
        <rect x="104" y="399" width="43" height="12" rx="4" fill="#fff"></rect>
        <rect x="89" y="418" width="58" height="12" rx="6" fill="#d55a24"></rect>
      </g>
      <g class="cone cone-right">
        <ellipse cx="566" cy="430" rx="36" ry="10" fill="rgba(0,0,0,.22)"></ellipse>
        <path d="M544 420l20-68h16l20 68Z" fill="#f46c2d"></path>
        <rect x="555" y="374" width="37" height="11" rx="4" fill="#fff"></rect>
        <rect x="551" y="401" width="45" height="12" rx="4" fill="#fff"></rect>
        <rect x="536" y="420" width="60" height="12" rx="6" fill="#d55a24"></rect>
      </g>

      <g class="warning-sign">
        <ellipse cx="498" cy="421" rx="70" ry="16" fill="rgba(0,0,0,.25)"></ellipse>
        <polygon points="455,235 548,235 578,414 430,414" fill="#101010" stroke="#5d2324" stroke-width="3"></polygon>
        <polygon points="464,246 540,246 564,404 442,404" fill="url(#signGrad)" stroke="#ef2b2d" stroke-width="2"></polygon>
        <g opacity=".95">
          <rect x="467" y="249" width="14" height="10" fill="#ef2b2d" transform="skewX(-30)"></rect>
          <rect x="493" y="249" width="14" height="10" fill="#ef2b2d" transform="skewX(-30)"></rect>
          <rect x="519" y="249" width="14" height="10" fill="#ef2b2d" transform="skewX(-30)"></rect>
          <rect x="449" y="387" width="14" height="10" fill="#ef2b2d" transform="skewX(-30)"></rect>
          <rect x="475" y="387" width="14" height="10" fill="#ef2b2d" transform="skewX(-30)"></rect>
          <rect x="501" y="387" width="14" height="10" fill="#ef2b2d" transform="skewX(-30)"></rect>
          <rect x="527" y="387" width="14" height="10" fill="#ef2b2d" transform="skewX(-30)"></rect>
        </g>
        <path d="M500 285l28 49h-56Z" fill="none" stroke="#ef2b2d" stroke-width="6" stroke-linejoin="round"></path>
        <rect x="496" y="295" width="8" height="22" rx="4" fill="#ef2b2d"></rect>
        <circle cx="500" cy="324" r="4.5" fill="#ef2b2d"></circle>
        <text x="500" y="362" fill="#ef2b2d" text-anchor="middle" font-family="Rajdhani, sans-serif" font-size="26" font-weight="700">STRONA</text>
        <text x="500" y="389" fill="#ef2b2d" text-anchor="middle" font-family="Rajdhani, sans-serif" font-size="26" font-weight="700">W REMONCIE</text>
      </g>

      <g class="error-thought-bubble">
        <circle cx="470" cy="122" r="10" fill="rgba(239,43,45,.18)" stroke="#ef2b2d" stroke-width="2"></circle>
        <circle cx="490" cy="102" r="14" fill="rgba(239,43,45,.14)" stroke="#ef2b2d" stroke-width="2"></circle>
        <path d="M510 50c0-18 18-32 40-32h38c22 0 40 14 40 32v8c0 18-18 32-40 32h-8l-15 18-8-18h-7c-22 0-40-14-40-32z" fill="rgba(18,18,18,.95)" stroke="#ef2b2d" stroke-width="3"></path>
        <text x="569" y="67" fill="#ef2b2d" text-anchor="middle" font-family="Rajdhani, sans-serif" font-size="44" font-weight="700">...?</text>
      </g>

      <g class="monkey-tail">
        <path d="M290 398c44 16 66 47 46 68-17 17-58 2-56-28 1-18 18-28 35-27" fill="none" stroke="#4b2418" stroke-width="14" stroke-linecap="round"></path>
        <path d="M292 398c35 13 53 34 40 49-8 10-31 6-34-10" fill="none" stroke="#6a3621" stroke-width="8" stroke-linecap="round"></path>
      </g>

      <g class="monkey-legs">
        <rect x="286" y="376" width="28" height="58" rx="14" fill="#231917"></rect>
        <rect x="334" y="376" width="28" height="58" rx="14" fill="#231917"></rect>
        <ellipse cx="300" cy="437" rx="20" ry="10" fill="#8d6047"></ellipse>
        <ellipse cx="348" cy="437" rx="20" ry="10" fill="#8d6047"></ellipse>
      </g>

      <g class="monkey-body">
        <rect x="268" y="236" width="112" height="154" rx="46" fill="#181818"></rect>
        <path d="M262 242h124l-8 125c-16 14-32 21-48 21s-32-7-48-21z" fill="url(#vestGrad)"></path>
        <rect x="317" y="241" width="18" height="132" rx="9" fill="#3a3123"></rect>
        <rect x="276" y="280" width="96" height="12" rx="6" fill="#d8dcc9" opacity=".85"></rect>
        <rect x="280" y="320" width="88" height="12" rx="6" fill="#d8dcc9" opacity=".85"></rect>
        <circle cx="330" cy="230" r="74" fill="#4b2418"></circle>
        <circle cx="266" cy="227" r="24" fill="#8a5a44"></circle>
        <circle cx="394" cy="227" r="24" fill="#8a5a44"></circle>
        <circle cx="330" cy="235" r="54" fill="#d2a585"></circle>
        <ellipse cx="306" cy="222" rx="16" ry="18" fill="#fff"></ellipse>
        <ellipse cx="354" cy="222" rx="16" ry="18" fill="#fff"></ellipse>
        <circle cx="310" cy="224" r="8.5" fill="#2b1c1a"></circle>
        <circle cx="350" cy="224" r="8.5" fill="#2b1c1a"></circle>
        <circle cx="313" cy="221" r="2.5" fill="#fff"></circle>
        <circle cx="353" cy="221" r="2.5" fill="#fff"></circle>
        <ellipse cx="330" cy="256" rx="18" ry="14" fill="#c38b67"></ellipse>
        <path d="M320 252c5 4 14 4 20 0" fill="none" stroke="#8d6047" stroke-width="3" stroke-linecap="round"></path>
        <path d="M318 274c9 6 18 6 26 0" fill="none" stroke="#6f4734" stroke-width="3" stroke-linecap="round"></path>
        <g class="monkey-helmet">
          <path d="M261 183c0-34 30-61 69-61s69 27 69 61v14H261z" fill="url(#helmetGrad)"></path>
          <rect x="255" y="179" width="150" height="20" rx="10" fill="#f0a71e"></rect>
          <rect x="323" y="129" width="14" height="44" rx="7" fill="#f1bc43"></rect>
          <circle cx="330" cy="174" r="17" fill="#1a1515" stroke="#ef2b2d" stroke-width="3"></circle>
          <circle cx="330" cy="174" r="12" fill="#f2d79c"></circle>
          <circle cx="330" cy="174" r="8" fill="#6c3c21"></circle>
        </g>
      </g>

      <g class="monkey-toolbelt">
        <rect x="273" y="350" width="102" height="18" rx="9" fill="#5d4331"></rect>
        <rect x="267" y="355" width="20" height="48" rx="8" fill="#8e5c38"></rect>
        <rect x="364" y="355" width="20" height="42" rx="8" fill="#8e5c38"></rect>
      </g>

      <g class="monkey-wrench-arm">
        <path d="M369 275c26 9 40 25 42 48 1 16-3 33-7 49" fill="none" stroke="#4b2418" stroke-width="26" stroke-linecap="round"></path>
        <path d="M369 275c26 9 40 25 42 48 1 16-3 33-7 49" fill="none" stroke="#6a3621" stroke-width="16" stroke-linecap="round"></path>
        <circle cx="399" cy="374" r="14" fill="#8d6047"></circle>
        <rect x="401" y="326" width="14" height="66" rx="7" fill="#c2c8d0" transform="rotate(8 408 359)"></rect>
        <path d="M415 318c12-6 23 8 16 18-7 9-17 5-20 1l-6 6-7-7 6-6c-4-8 4-17 11-12z" fill="#c2c8d0"></path>
      </g>

      <g class="monkey-scratch-arm">
        <path d="M288 275c-21 10-34 26-36 46-1 17 4 26 11 35" fill="none" stroke="#4b2418" stroke-width="24" stroke-linecap="round"></path>
        <path d="M288 275c-21 10-34 26-36 46-1 17 4 26 11 35" fill="none" stroke="#6a3621" stroke-width="14" stroke-linecap="round"></path>
        <circle cx="269" cy="353" r="13" fill="#8d6047"></circle>
        <path d="M263 356c-2-16 2-32 11-47 9-14 20-25 34-35" fill="none" stroke="#8d6047" stroke-width="2" opacity=".45"></path>
      </g>

      <g class="debris" fill="#5a3737">
        <polygon points="166,432 176,422 183,434"></polygon>
        <polygon points="199,442 211,431 219,445"></polygon>
        <polygon points="235,426 244,418 250,430"></polygon>
        <polygon points="456,437 465,427 473,440"></polygon>
        <polygon points="518,438 529,427 537,441"></polygon>
      </g>
    </svg>
  `;
}

async function render() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [rawPath, rawQuery = ""] = raw.split("?");
  const path = rawPath.replace(/^\/+|\/+$/g, "") || "";
  const routeQuery = new URLSearchParams(rawQuery);
  const eventMatch = path.match(/^events\/(.+)$/);

  if (eventMatch) {
    await renderEventDetail(decodeURIComponent(eventMatch[1]));
    updateLinks();
    setupContactForm();
    setupImagePreview();
    setupGlobalPageNavigation();
    return;
  }

  if (path === "events") {
    app.innerHTML = `
      <div class="container content-wrap events-page">
        <div class="section-heading events-heading">
          <div><h2>NAJNOWSZE EVENTY</h2></div>
          <button class="admin-add-event" id="addEventButton" hidden>+ DODAJ EVENT</button>
          <p>Najnowsze wpisy na górze</p>
        </div>

        <section class="collection-toolbar events-toolbar" aria-label="Wyszukiwanie i filtrowanie eventów">
          <label class="collection-search">
            <span>WYSZUKAJ EVENT</span>
            <div class="collection-search-box">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m20.6 19.2-4.4-4.4a7.3 7.3 0 1 0-1.4 1.4l4.4 4.4 1.4-1.4ZM5 10.5a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0Z"/></svg>
              <input id="events-search" type="search" placeholder="Szukaj po nazwie, opisie lub dacie..." autocomplete="off">
            </div>
          </label>

          <label class="collection-limit events-status-filter">
            <span>STATUS EVENTÓW</span>
            <select id="events-status-filter" aria-label="Filtruj eventy po statusie">
              <option value="all">Wszystkie</option>
              <option value="active">Aktywne</option>
              <option value="ended">Zakończone</option>
            </select>
          </label>

          <label class="collection-limit">
            <span>EVENTÓW NA STRONIE</span>
            <select id="events-page-size" aria-label="Liczba eventów na stronie">
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="40">40</option>
              <option value="50">50</option>
            </select>
          </label>

          <div class="collection-summary" id="events-result-summary" aria-live="polite"></div>
        </section>

        <div id="events-list" class="event-list"></div>
        <div id="events-empty" class="collection-empty" hidden>Nie znaleziono eventów pasujących do wyszukiwania.</div>
        <nav id="events-pagination" class="collection-pagination" aria-label="Strony eventów"></nav>
      </div>
    `;
    await renderEvents();
    updateEventAdminButton(window.currentUserIsAdmin === true);
    updateLinks();
    setupContactForm();
    setupImagePreview();
    setupGlobalPageNavigation();
    return;
  }

  const page = path === "" ? pages.home : pages[path];

  if (path !== "" && !page) {
    app.innerHTML = notFoundPage(path);
    updateLinks();
    setupContactForm();
    setupImagePreview();
    setupGlobalPageNavigation();
    closeMobileMenu();
    return;
  }

  if (path === "") {
    app.innerHTML = page.body;
    const events = await loadEvents();
    const homeEvents = document.getElementById("home-events");
    if (homeEvents) {
      const visibleEvents = [...events]
        .sort((a, b) => {
          const aEnded = isEventEnded(a) ? 1 : 0;
          const bEnded = isEventEnded(b) ? 1 : 0;

          // Najpierw pokazujemy aktywne eventy, potem zakończone.
          if (aEnded !== bEnded) return aEnded - bEnded;

          // W obrębie tej samej grupy najnowsze wydarzenia wyżej.
          return new Date(b.date || 0) - new Date(a.date || 0);
        })
        .slice(0, 5);
      homeEvents.innerHTML = `<div class="home-event-track">${visibleEvents.map(eventCard).join("")}</div>
        <button class="home-event-arrow left" aria-label="Poprzedni event">‹</button>
        <button class="home-event-arrow right" aria-label="Następny event">›</button>`;
      setupHomeEventSlider(homeEvents);
    }
  } else {
    app.innerHTML = page.body;
  }

  document.title = `${SITE_CONFIG.siteName} — ${stripHtml(page.title)}`;
  updateLinks();
  setupContactForm();
  setupCommandsPage();
  setupRewardsSearch();
  setupDixperPage();
  setupBingoPage();
  setupRecommendedPage();
  setupDiscordJoinPage();
  setupDownloadsPage();
  setupImagePreview();
  setupEmotes7tvPage();
  setupGlobalPageNavigation();
  const jumpTarget = routeQuery.get("jump");
  if (jumpTarget) requestAnimationFrame(() => document.getElementById(jumpTarget)?.scrollIntoView({ behavior: "smooth", block: "start" }));
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
    document.getElementById("page-discord-link")
  ];
  discordLinks.forEach(el => { if (el) el.href = SITE_CONFIG.discordUrl; });

  document.title = SITE_CONFIG.pageTitle;

  document.querySelectorAll(".main-nav a").forEach(link => {
    const href = link.getAttribute("href");
    link.classList.toggle("active", href === location.hash);
  });
}




async function setupRecommendedPage() {
  const cards = [...document.querySelectorAll('[data-streamer-login]')];
  if (!cards.length) return;

  await Promise.all(cards.map(async (card) => {
    const login = card.dataset.streamerLogin;
    const fallbackName = card.dataset.streamerName || login;
    const avatar = card.querySelector('[data-streamer-avatar]');
    const nameTarget = card.querySelector('[data-streamer-name-target]');

    // Bez klucza API Twitcha korzystamy z proxy jako awaryjnego źródła,
    // a następnie próbujemy pobrać aktualny profil i bezpośredni adres CDN Twitcha.
    if (avatar) {
      avatar.src = `https://unavatar.io/twitch/${login}?v=${Date.now()}`;
      avatar.alt = `Avatar ${fallbackName}`;
    }
    if (nameTarget) nameTarget.textContent = fallbackName;

    try {
      const response = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${encodeURIComponent(login)}`, {
        cache: "no-store"
      });
      if (!response.ok) return;
      const data = await response.json();
      const user = Array.isArray(data) ? data[0] : data;
      if (!user) return;

      const freshName = user.displayName || user.login || fallbackName;
      const freshAvatar = user.logo || user.profileImageUrl || user.avatar;

      if (nameTarget) nameTarget.textContent = freshName;
      if (avatar && freshAvatar) {
        avatar.src = freshAvatar;
        avatar.alt = `Avatar ${freshName}`;
      }
    } catch (_) {
      // Fallback unavatar pozostaje aktywny, więc avatar nadal jest pobierany dynamicznie.
    }
  }));

  const sections = [...document.querySelectorAll('[data-recommended-section]')];
  const navLinks = [...document.querySelectorAll('[data-recommended-target]')];
  const progress = document.querySelector('[data-recommended-progress]');
  let manualNavigation = false;
  let manualTimer = null;

  const activateLink = (id) => {
    const activeIndex = sections.findIndex(section => section.id === id);
    navLinks.forEach(item => item.classList.toggle('active', item.dataset.recommendedTarget === id));
    if (progress && activeIndex >= 0) progress.style.height = `${((activeIndex + 1) / sections.length) * 100}%`;
  };

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const target = document.getElementById(link.dataset.recommendedTarget);
      manualNavigation = true;
      clearTimeout(manualTimer);
      activateLink(link.dataset.recommendedTarget);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      manualTimer = setTimeout(() => { manualNavigation = false; }, 900);
    });
  });

  const setActive = (section) => {
    const index = sections.indexOf(section);
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.recommendedTarget === section.id);
    });
    if (progress && index >= 0) {
      progress.style.height = `${((index + 1) / sections.length) * 100}%`;
    }
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (tocScrollLock) return;
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible && !manualNavigation) setActive(visible.target);
    }, {
      rootMargin: '-18% 0px -58% 0px',
      threshold: [0, .1, .25, .5]
    });
    sections.forEach(section => observer.observe(section));
  }
}

async function setupDiscordJoinPage() {
  const page = document.querySelector('.discord-join-page');
  if (!page || page.dataset.discordReady === '1') return;
  page.dataset.discordReady = '1';

  const inviteUrl = SITE_CONFIG.discordUrl;
  [document.getElementById('discord-widget-invite'), document.getElementById('discord-configure-invite')]
    .forEach(link => { if (link) link.href = inviteUrl; });

  const getInviteCode = (url) => {
    try {
      const parsed = new URL(url, location.href);
      const parts = parsed.pathname.split('/').filter(Boolean);
      return parts[parts.length - 1] || '';
    } catch (_) {
      return String(url).split('/').filter(Boolean).pop() || '';
    }
  };

  const inviteCode = getInviteCode(inviteUrl);
  if (!inviteCode) return;

  try {
    const response = await fetch(`https://discord.com/api/v10/invites/${encodeURIComponent(inviteCode)}?with_counts=true&with_expiration=true`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Discord invite HTTP ${response.status}`);
    const data = await response.json();
    const guild = data.guild || {};
    const serverName = guild.name || "MATT'S WORLD";
    const online = Number.isFinite(data.approximate_presence_count) ? data.approximate_presence_count : null;
    const members = Number.isFinite(data.approximate_member_count) ? data.approximate_member_count : null;

    document.querySelectorAll('[data-discord-server-name], [data-discord-widget-name]').forEach(el => { el.textContent = serverName; });
    const onlineTarget = document.querySelector('[data-discord-online-count]');
    const memberTarget = document.querySelector('[data-discord-member-count]');
    const widgetOnline = document.querySelector('[data-discord-widget-online]');
    if (onlineTarget && online !== null) onlineTarget.textContent = new Intl.NumberFormat('pl-PL').format(online);
    if (memberTarget && members !== null) memberTarget.textContent = new Intl.NumberFormat('pl-PL').format(members);
    if (widgetOnline && online !== null) widgetOnline.textContent = `online: ${new Intl.NumberFormat('pl-PL').format(online)}`;

    const iconTarget = document.querySelector('[data-discord-server-icon]');
    const railIconTarget = document.querySelector('[data-discord-rail-server-icon]');
    if (guild.id && guild.icon) {
      const format = guild.icon.startsWith('a_') ? 'gif' : 'png';
      const iconUrl = `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${format}?size=128`;
      if (iconTarget) iconTarget.innerHTML = `<img src="${iconUrl}" alt="Ikona serwera ${escapeHtml(serverName)}">`;
      if (railIconTarget) railIconTarget.innerHTML = `<img src="${iconUrl}" alt="Ikona serwera ${escapeHtml(serverName)}">`;
    }


  } catch (error) {
    console.info('[MATT\'S WORLD] Publiczne dane Discorda są chwilowo niedostępne:', error);
  }
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

window.addEventListener("matt-auth-change", (e) => {
  window.currentUserIsAdmin = e.detail?.isAdmin === true;
  updateEventAdminButton(window.currentUserIsAdmin);
});


document.addEventListener("click", function(e) {
  const link = e.target.closest(".rule-scroll-link");
  if (!link) return;
  e.preventDefault();
  const target = document.getElementById(link.dataset.target);
  if (!target) return;
  target.scrollIntoView({behavior:"smooth", block:"center"});
  target.classList.remove("rule-highlight");
  void target.offsetWidth;
  target.classList.add("rule-highlight");
  setTimeout(()=>target.classList.remove("rule-highlight"), 3000);
});


/* Global sidebar navigation edge fix.
   Keeps first/last sections reachable and keeps active item visible. */
(function setupUniversalSidebarEdgeFix(){
  const groups = [
    ["[data-dixper-target]","[data-dixper-section]","data-dixperTarget"],
    ["[data-bingo-target]","[data-bingo-section]","data-bingoTarget"],
    ["[data-emotes7tv-target]","[data-emotes7tv-section]","data-emotes7tvTarget"],
    ["[data-recommended-target]","[data-recommended-section]","data-recommendedTarget"],
    ["[data-site-page-target]","[data-site-page-section], [data-site-page-heading]","data-site-page-target"],
  ];

  function keepVisible(link){
    if (!link) return;
    link.scrollIntoView({block:"nearest", behavior:"smooth"});
  }

  function bind(){
    groups.forEach(([linkSelector, sectionSelector, key])=>{
      const links=[...document.querySelectorAll(linkSelector)];
      const sections=[...document.querySelectorAll(sectionSelector)];
      if (!links.length || !sections.length || links[0].dataset.sidebarEdgeFix) return;

      links.forEach(l=>l.dataset.sidebarEdgeFix="1");

      let locked=false;
      const update=()=>{
        if(locked) return;
        const maxScroll=window.innerHeight + window.scrollY >= document.documentElement.scrollHeight-8;
        let section=null;

        if(window.scrollY <= 8) {
          section=sections[0];
        } else if(maxScroll) {
          section=sections[sections.length-1];
        } else {
          section=sections.reduce((best,s)=>{
            const r=s.getBoundingClientRect();
            const score=Math.abs(r.top-window.innerHeight*0.35);
            return !best || score<best.score ? {el:s,score} : best;
          },null)?.el;
        }

        if(!section) return;
        const attr=Object.keys(section.dataset).find(k=>k.toLowerCase().includes("section"));
        const id=section.id;
        const link=links.find(l=>{
          const target=l.dataset[key] || l.dataset[key?.replace(/^data-/,"")];
          return target===id || l.getAttribute("href")==="#"+id;
        });
        if(link){
          links.forEach(x=>x.classList.toggle("active",x===link));
          keepVisible(link);
        }
      };

      window.addEventListener("scroll", update, {passive:true});
      window.addEventListener("resize", update);
      setTimeout(update,200);
    });
  }

  new MutationObserver(bind).observe(document.body,{childList:true,subtree:true});
  bind();
})();


window.addEventListener("hashchange", render);

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


async function setupAdminButton(){const b=document.getElementById("admin-login-btn");if(!b)return;const {data}=await supabaseClient.auth.getSession();b.textContent=data.session?"ADMIN":"ZALOGUJ";b.onclick=()=>{if(data.session)location.href="admin/index.html";else location.href="admin/login.html";};}
setupAdminButton();
