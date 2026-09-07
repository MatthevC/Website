const MATT_DEFAULT_AVATAR = "pictures/social/default-avatar.svg";

// Dodatkowe, bardziej szczegółowe uprawnienia. Są scalane z katalogiem Supabase,
// aby były od razu dostępne w panelu Zarządzaj kontami bez dokładania plików wdrożeniowych do paczki strony.
const MATT_EXTRA_PERMISSION_CATALOG = [
  { permission:"events.schedule.manage", group_name:"EVENTY", label:"Terminy i status eventów", description:"Może zmieniać rozpoczęcie, zakończenie, publikację oraz status „w trakcie / zakończ teraz” w istniejących eventach. Do edycji istniejącego eventu potrzebuje też „Edycja eventów”.", sort_order:125 },
  { permission:"events.images.manage", group_name:"EVENTY", label:"Grafiki eventów", description:"Może zmieniać tryb jednej/dwóch grafik, pliki oraz dopasowanie grafik w istniejących eventach. Do edycji istniejącego eventu potrzebuje też „Edycja eventów”.", sort_order:126 },
  { permission:"discord.join.messages.manage", group_name:"DISCORD", label:"Wiadomości w podglądzie Discorda", description:"Może dodawać, edytować, usuwać i ustawiać kolejność wiadomości w makiecie czatu Discorda.", sort_order:325 },
  { permission:"discord.join.members.manage", group_name:"DISCORD", label:"Osoby w podglądzie Discorda", description:"Może zarządzać grupami i osobami w podglądzie, w tym nickami i linkami Twitch.", sort_order:326 },
  { permission:"discord.join.members.bulk", group_name:"DISCORD", label:"Masowe operacje na osobach Discorda", description:"Może zaznaczać wiele osób w podglądzie Discorda i przenosić je między grupami albo wysyłać do kosza. Wymaga także uprawnienia „Osoby w podglądzie Discorda”.", sort_order:326.5 },
  { permission:"discord.channels.delete", group_name:"DISCORD", label:"Usuwanie kanałów i kategorii Discorda", description:"Pozwala usuwać pozycje z sekcji opisu kanałów. Wymaga także dostępu do zarządzania kanałami.", sort_order:327 },
  { permission:"streamers.delete", group_name:"SPOŁECZNOŚĆ I TREŚCI", label:"Usuwanie streamerów", description:"Pozwala usuwać streamerów z listy polecanych. Wymaga także dostępu do zarządzania streamerami.", sort_order:425 },
  { permission:"moderation.people.delete", group_name:"SPOŁECZNOŚĆ I TREŚCI", label:"Usuwanie osób z moderacji", description:"Pozwala usuwać osoby z sekcji moderacji. Wymaga także dostępu do zarządzania tą sekcją.", sort_order:426 },
  { permission:"moderation.benefits.delete", group_name:"SPOŁECZNOŚĆ I TREŚCI", label:"Usuwanie korzyści moderacji", description:"Pozwala usuwać pozycje z listy korzyści moderacji. Wymaga także dostępu do zarządzania korzyściami.", sort_order:427 },
  { permission:"commands.delete", group_name:"SPOŁECZNOŚĆ I TREŚCI", label:"Usuwanie komend", description:"Pozwala trwale usuwać komendy z listy. Wymaga także dostępu do zarządzania komendami.", sort_order:428 },
  { permission:"rules.delete", group_name:"SPOŁECZNOŚĆ I TREŚCI", label:"Usuwanie zasad regulaminu", description:"Pozwala usuwać pojedyncze zasady regulaminu. Wymaga także dostępu do edycji regulaminu.", sort_order:429 },
  { permission:"contact.topics.delete", group_name:"SPOŁECZNOŚĆ I TREŚCI", label:"Usuwanie tematów kontaktu", description:"Pozwala usuwać tematy z formularza kontaktowego. Wymaga także dostępu do zarządzania tematami.", sort_order:430 },

  { permission:"events.publish", group_name:"EVENTY", label:"Publikowanie i ukrywanie eventów", description:"Może zmieniać event między wersją publiczną, szkicem, ukrytym i zaplanowanym do publikacji.", sort_order:127 },
  { permission:"events.preview.nonpublic", group_name:"EVENTY", label:"Podgląd niepublicznych eventów", description:"Może podejrzeć szkice, eventy ukryte i zaplanowane przed publikacją.", sort_order:128 },
  { permission:"events.preview.devices", group_name:"EVENTY", label:"Podgląd mobile / desktop eventów", description:"Może przełączać podgląd edytowanego eventu między widokiem komputerowym i telefonem.", sort_order:128.5 },
  { permission:"events.duplicate", group_name:"EVENTY", label:"Duplikowanie eventów", description:"Może tworzyć kopię istniejącego eventu jako nowy szkic.", sort_order:129 },
  { permission:"events.notes.manage", group_name:"EVENTY", label:"Notatki wewnętrzne eventów", description:"Może dodawać notatki widoczne tylko dla obsługi strony. W eventach używaj razem z „Edycja eventów”.", sort_order:130 },
  { permission:"events.history.view", group_name:"EVENTY", label:"Historia wersji eventów", description:"Może przeglądać poprzednie wersje eventów zapisane w backupach.", sort_order:131 },
  { permission:"events.history.restore", group_name:"EVENTY", label:"Przywracanie wersji eventów", description:"Może przywrócić pojedynczy event z wcześniejszego backupu.", sort_order:132 },
  { permission:"events.bulk.manage", group_name:"EVENTY", label:"Masowe operacje na eventach", description:"Może wykonywać działania na wielu eventach jednocześnie.", sort_order:133 },
  { permission:"events.autoarchive.manage", group_name:"EVENTY", label:"Automatyczne archiwizowanie", description:"Może ustawić automatyczne przeniesienie eventu do archiwum po zakończeniu. Wymaga też „Edycja eventów”.", sort_order:134 },

  { permission:"downloads.publish", group_name:"PLIKI DO POBRANIA", label:"Widoczność i publikacja plików", description:"Może ustawiać pliki jako publiczne, ukryte, szkice lub zaplanowane.", sort_order:225 },
  { permission:"downloads.preview.nonpublic", group_name:"PLIKI DO POBRANIA", label:"Podgląd niepublicznych plików", description:"Może widzieć pliki ukryte, szkice i pliki przed zaplanowaną publikacją.", sort_order:226 },
  { permission:"downloads.notes.manage", group_name:"PLIKI DO POBRANIA", label:"Notatki wewnętrzne plików", description:"Może dodawać prywatne notatki do pozycji w sekcji pobierania. Do zmiany notatki potrzebuje też „Edycja plików”.", sort_order:227 },
  { permission:"downloads.bulk.manage", group_name:"PLIKI DO POBRANIA", label:"Masowe operacje na plikach", description:"Może zaznaczać i zmieniać wiele plików jednocześnie.", sort_order:228 },

  { permission:"streamers.publish", group_name:"SPOŁECZNOŚĆ I TREŚCI", label:"Widoczność streamerów", description:"Może publikować, ukrywać i planować publikację polecanych streamerów. Używaj razem z „Zarządzanie streamerami”.", sort_order:431 },
  { permission:"streamers.preview.nonpublic", group_name:"SPOŁECZNOŚĆ I TREŚCI", label:"Podgląd niepublicznych streamerów", description:"Może widzieć ukryte i zaplanowane wpisy streamerów.", sort_order:432 },
  { permission:"streamers.notes.manage", group_name:"SPOŁECZNOŚĆ I TREŚCI", label:"Notatki wewnętrzne streamerów", description:"Może dodawać notatki dla obsługi do wpisów polecanych streamerów. Używaj razem z „Zarządzanie streamerami”.", sort_order:433 },
  { permission:"streamers.bulk.manage", group_name:"SPOŁECZNOŚĆ I TREŚCI", label:"Masowe operacje na streamerach", description:"Może wykonywać operacje na wielu wpisach streamerów jednocześnie. Używaj razem z „Zarządzanie streamerami”.", sort_order:434 },

  { permission:"cms.dashboard.view", group_name:"NARZĘDZIA MODERATORA", label:"Centrum moderatora", description:"Dostęp do panelu ostatnich zmian, szybkich podsumowań i narzędzi administracyjnych.", sort_order:610 },
  { permission:"cms.search", group_name:"NARZĘDZIA MODERATORA", label:"Globalna wyszukiwarka CMS", description:"Może przeszukiwać eventy i treści zarządzane przez CMS z jednego miejsca.", sort_order:611 },
  { permission:"cms.notifications.view", group_name:"NARZĘDZIA MODERATORA", label:"Centrum powiadomień", description:"Może przeglądać ostrzeżenia, szkice, zaplanowane publikacje i problemy wymagające uwagi.", sort_order:612 },
  { permission:"cms.history.view", group_name:"NARZĘDZIA MODERATORA", label:"Historia wersji treści", description:"Może przeglądać wersje treści zapisane w systemie backupów.", sort_order:613 },
  { permission:"cms.history.restore", group_name:"NARZĘDZIA MODERATORA", label:"Przywracanie pojedynczych sekcji", description:"Może przywracać wybraną sekcję CMS bez odtwarzania całego backupu.", sort_order:614 },
  { permission:"cms.trash.view", group_name:"NARZĘDZIA MODERATORA", label:"Podgląd kosza", description:"Może przeglądać elementy przeniesione do kosza.", sort_order:615 },
  { permission:"cms.trash.restore", group_name:"NARZĘDZIA MODERATORA", label:"Przywracanie z kosza", description:"Może przywracać eventy, pliki i elementy Discorda z kosza.", sort_order:616 },
  { permission:"cms.trash.delete", group_name:"NARZĘDZIA MODERATORA", label:"Trwałe usuwanie z kosza", description:"Może bezpowrotnie usuwać elementy znajdujące się w koszu.", sort_order:617 },
  { permission:"cms.preview.mode", group_name:"NARZĘDZIA MODERATORA", label:"Tryb podglądu strony", description:"Może ukryć narzędzia CMS i zobaczyć stronę w widoku zbliżonym do zwykłego użytkownika.", sort_order:618 },
  { permission:"cms.links.check", group_name:"NARZĘDZIA MODERATORA", label:"Testowanie linków", description:"Może uruchamiać kontrolę linków, grafik i odnośników do Twitcha/Discorda.", sort_order:619 },
  { permission:"cms.editlocks.view", group_name:"NARZĘDZIA MODERATORA", label:"Ostrzeżenia o równoczesnej edycji", description:"Otrzymuje ostrzeżenie, gdy ten sam element jest edytowany przez inną osobę.", sort_order:620 },
  { permission:"cms.forms.autosave", group_name:"NARZĘDZIA MODERATORA", label:"Autozapis formularzy CMS", description:"Automatycznie zapisuje lokalny szkic podczas edycji i pozwala przywrócić niezapisane zmiany po zamknięciu lub odświeżeniu strony.", sort_order:620.5 },
  { permission:"cms.integrity.check", group_name:"NARZĘDZIA MODERATORA", label:"Test integralności strony", description:"Może sprawdzać eventy, pliki, streamerów, Discord, nawigację i dane CMS pod kątem braków, duplikatów i niespójności.", sort_order:621 },
  { permission:"site.maintenance.manage", group_name:"STRONA I WYGLĄD", label:"Tryb konserwacji strony", description:"Może włączyć lub wyłączyć stronę dla odwiedzających i ustawić komunikat przerwy technicznej.", sort_order:525 },
  { permission:"statistics.view", group_name:"LOGI I BEZPIECZEŃSTWO", label:"Statystyki CMS", description:"Dostęp do statystyk administracyjnych: liczba treści, szkiców, backupów i działań. Bez śledzenia odwiedzających.", sort_order:825 },
  { permission:"accounts.preview_as", group_name:"KONTA I DOSTĘP", label:"Podgląd panelu jako moderator", description:"Może uruchomić bezpieczny podgląd interfejsu z uprawnieniami wybranego moderatora, bez przejmowania jego konta.", sort_order:725 },
  { permission:"accounts.sessions.view", group_name:"KONTA I DOSTĘP", label:"Podgląd aktywności i sesji kont", description:"Może sprawdzić ostatnią aktywność konta oraz informacje o bieżącej sesji własnego konta.", sort_order:726 },
  { permission:"accounts.sessions.revoke", group_name:"KONTA I DOSTĘP", label:"Wymuszenie ponownego logowania", description:"Może oznaczyć konto do wylogowania ze strony przy następnym sprawdzeniu sesji.", sort_order:727 },
  { permission:"accounts.block", group_name:"KONTA I DOSTĘP", label:"Blokowanie i odblokowanie kont", description:"Może tymczasowo zablokować dostęp użytkownika do strony bez usuwania konta.", sort_order:728 },
  { permission:"accounts.permissions.copy", group_name:"KONTA I DOSTĘP", label:"Kopiowanie uprawnień moderatora", description:"Może skopiować cały zestaw uprawnień z jednego Moderatora do formularza drugiego Moderatora. Zmiany nadal wymagają kliknięcia ZAPISZ.", sort_order:729 }
];

const MATT_PERMISSION_GROUP_ORDER = [
  ["events.", "EVENTY", 10],
  ["downloads.", "PLIKI DO POBRANIA", 20],
  ["discord.", "DISCORD", 30],
  ["streamers.", "SPOŁECZNOŚĆ I TREŚCI", 40],
  ["moderation.", "SPOŁECZNOŚĆ I TREŚCI", 40],
  ["commands.", "SPOŁECZNOŚĆ I TREŚCI", 40],
  ["rules.", "SPOŁECZNOŚĆ I TREŚCI", 40],
  ["contact.", "SPOŁECZNOŚĆ I TREŚCI", 40],
  ["home.", "STRONA I WYGLĄD", 50],
  ["page.", "STRONA I WYGLĄD", 50],
  ["site.", "STRONA I WYGLĄD", 50],
  ["backups.", "BACKUPY I PRZYWRACANIE", 60],
  ["github.", "BACKUPY I PRZYWRACANIE", 60],
  ["accounts.", "KONTA I DOSTĘP", 70],
  ["cms.", "NARZĘDZIA MODERATORA", 75],
  ["statistics.", "LOGI I BEZPIECZEŃSTWO", 80],
  ["audit.", "LOGI I BEZPIECZEŃSTWO", 80]
];

function mattPermissionGroupMeta(permission, fallback = "INNE") {
  const p = String(permission || "");
  const found = MATT_PERMISSION_GROUP_ORDER.find(([prefix]) => p.startsWith(prefix));
  return found ? { name: found[1], order: found[2] } : { name: String(fallback || "INNE").toUpperCase(), order: 90 };
}

function mattPermissionIsCritical(permission) {
  const p = String(permission || "");
  return p.includes(".delete") || [
    "accounts.role.change", "accounts.permissions.change", "accounts.password.reset",
    "backups.restore", "backups.import", "github.restore", "cms.history.restore", "cms.trash.delete",
    "accounts.sessions.revoke", "accounts.block", "site.maintenance.manage"
  ].includes(p);
}

window.currentUserRole = window.currentUserRole || "guest";
window.currentUserPermissions = window.currentUserPermissions || [];
window.mattHasPermission = function(permission) {
  if (window.currentUserRole === "admin" || window.currentUserIsAdmin === true) return true;
  return Array.isArray(window.currentUserPermissions) && window.currentUserPermissions.includes(permission);
};

const MATT_EXTRA_PERMISSIONS_KEY = "account_extra_permissions";

async function mattLoadExtraPermissionsMap() {
  try {
    const { data, error } = await supabaseClient.from("cms_data").select("data").eq("key", MATT_EXTRA_PERMISSIONS_KEY).maybeSingle();
    if (error) throw error;
    return data?.data && typeof data.data === "object" && !Array.isArray(data.data) ? data.data : {};
  } catch (_) {
    return {};
  }
}

async function mattSaveExtraPermissionsMap(map) {
  const clean = map && typeof map === "object" && !Array.isArray(map) ? map : {};
  if (window.MattCMS?.save) return window.MattCMS.save(MATT_EXTRA_PERMISSIONS_KEY, clean, { backup:false });
  const { error } = await supabaseClient.rpc("matt_cms_save", { p_key:MATT_EXTRA_PERMISSIONS_KEY, p_data:clean });
  if (error) throw error;
  return clean;
}

async function mattLoadAccessState() {
  try {
    const { data, error } = await supabaseClient.rpc("matt_get_my_access");
    if (error) throw error;
    const role = String(data?.role || "user").toLowerCase();
    let permissions = Array.isArray(data?.permissions) ? [...data.permissions] : [];
    if (role === "moderator") {
      const [{ data:sessionData }, extraMap] = await Promise.all([
        supabaseClient.auth.getSession(),
        mattLoadExtraPermissionsMap()
      ]);
      const uid = sessionData?.session?.user?.id || "";
      const extras = Array.isArray(extraMap?.[uid]) ? extraMap[uid] : [];
      permissions = [...new Set([...permissions, ...extras])];
    }
    window.currentUserRole = role;
    window.currentUserPermissions = permissions;
    window.currentUserIsAdmin = role === "admin";
    return { role, permissions, isAdmin: role === "admin" };
  } catch (error) {
    console.warn("Nie udało się pobrać uprawnień użytkownika:", error?.message || error);
    const role = String(window.currentUserProfile?.role || "user").toLowerCase();
    window.currentUserRole = role;
    window.currentUserPermissions = [];
    window.currentUserIsAdmin = role === "admin";
    return { role, permissions: [], isAdmin: role === "admin" };
  }
}


async function mattGetAccountSecurityState() {
  try {
    const { data, error } = await supabaseClient.from("cms_data").select("data").eq("key", "account_security").maybeSingle();
    if (error) throw error;
    const state = data?.data && typeof data.data === "object" ? data.data : {};
    return { blocks: state.blocks || {}, revocations: state.revocations || {} };
  } catch (_) {
    return { blocks: {}, revocations: {} };
  }
}

async function mattEnforceAccountSecurity(session, profile = null) {
  if (!session?.user?.id) return true;
  const state = await mattGetAccountSecurityState();
  const block = state.blocks?.[session.user.id];
  if (block?.blocked === true) {
    try { await supabaseClient.auth.signOut(); } catch (_) {}
    const reason = String(block.reason || "Konto zostało zablokowane przez administrację.");
    alert(`Dostęp do konta został zablokowany.\n\n${reason}`);
    location.reload();
    return false;
  }
  const revokedAt = new Date(state.revocations?.[session.user.id] || 0).getTime();
  const signedInAt = new Date(session.user.last_sign_in_at || session.created_at || 0).getTime();
  if (revokedAt > 0 && (!signedInAt || revokedAt >= signedInAt)) {
    try { await supabaseClient.auth.signOut(); } catch (_) {}
    alert("Sesja została zakończona przez administrację. Zaloguj się ponownie.");
    location.reload();
    return false;
  }
  return true;
}

window.mattGetAccountSecurityState = mattGetAccountSecurityState;
window.mattEnforceAccountSecurity = mattEnforceAccountSecurity;


function mattAuditEscape(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function mattAuditCategory(action = "") {
  const a = String(action || "").toLowerCase();
  if (a.startsWith("profile.") || a.startsWith("auth.") || a.startsWith("account.") || a.startsWith("access.")) return "PROFIL / KONTO";
  if (a.startsWith("event.")) return "EVENTY";
  if (a.startsWith("backup.")) return "BACKUPY";
  if (a.startsWith("cms.")) return "CMS / STRONA";
  return "INNE";
}

function mattAuditActionLabel(action = "") {
  const labels = {
    "cms.created": "Dodano dane CMS",
    "cms.updated": "Zmieniono dane CMS",
    "cms.deleted": "Usunięto dane CMS",
    "event.created": "Dodano event",
    "event.updated": "Edytowano event",
    "event.deleted": "Usunięto event",
    "profile.created": "Utworzono profil",
    "profile.updated": "Edytowano profil",
    "profile.deleted": "Usunięto profil",
    "auth.password_changed": "Zmieniono hasło",
    "auth.email_changed": "Zmieniono e-mail",
    "account.created": "Utworzono konto",
    "account.first_setup_completed": "Zakończono pierwszą konfigurację",
    "account.password_reset": "Zresetowano hasło",
    "account.email_changed_by_manager": "Zmieniono e-mail użytkownika",
    "account.deleted": "Usunięto konto",
    "access.changed": "Zmieniono rolę / uprawnienia",
    "backup.automatic.created": "Utworzono automatyczny zapis",
    "backup.manual.created": "Utworzono ręczny zapis",
    "backup.automatic.deleted": "Usunięto automatyczny zapis",
    "backup.manual.deleted": "Usunięto ręczny zapis"
  };
  return labels[action] || String(action || "Zdarzenie");
}



function mattAuditPrettyDetails(details = {}) {
  if (!details || typeof details !== "object") return "";
  const rows = [];
  const add = (label, value, cls="") => {
    rows.push(`<div class="audit-change-row ${cls}"><span>${mattAuditEscape(label)}</span><strong>${mattAuditEscape(value)}</strong></div>`);
  };
  Object.entries(details).forEach(([key, value]) => {
    if (key === "before" || key === "after") return;
    if (Array.isArray(value)) {
      add(key, value.length ? value.join(", ") : "brak");
    } else if (value && typeof value === "object") {
      add(key, JSON.stringify(value));
    } else {
      add(key, String(value));
    }
  });
  const before = details.before || details.old || null;
  const after = details.after || details.new || null;
  if (before || after) {
    rows.push(`<div class="audit-diff-title">PORÓWNANIE ZMIANY</div>`);
    if (before) add("PRZED", typeof before === "object" ? JSON.stringify(before) : before, "old");
    if (after) add("PO", typeof after === "object" ? JSON.stringify(after) : after, "new");
  }
  return rows.join("");
}

function mattAuditFormatDate(value) {
  try {
    return new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "medium" }).format(new Date(value));
  } catch (_) {
    return String(value || "");
  }
}

async function mattOpenAuditLogs() {
  if (!window.mattHasPermission?.("audit.view")) return;

  let modal = document.getElementById("adminAuditModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "adminAuditModal";
    modal.className = "audit-modal";
    modal.innerHTML = `
      <div class="audit-box" role="dialog" aria-modal="true" aria-labelledby="auditTitle">
        <header class="audit-head">
          <div><span>DOSTĘP UPRAWNIONY</span><h2 id="auditTitle">LOGI ZMIAN</h2><p>Historia działań z ostatnich 14 dni. Hasła, tokeny i sekrety nigdy nie są zapisywane w logach.</p></div>
          <button type="button" class="audit-close" aria-label="Zamknij">×</button>
        </header>
        <div class="audit-toolbar">
          <input type="search" data-audit-search placeholder="Szukaj użytkownika, akcji, sekcji…">
          <select data-audit-category>
            <option value="">Wszystkie kategorie</option>
            <option value="CMS / STRONA">CMS / STRONA</option>
            <option value="EVENTY">EVENTY</option>
            <option value="PROFIL / KONTO">PROFIL / KONTO</option>
            <option value="BACKUPY">BACKUPY</option>
            <option value="INNE">INNE</option>
          </select>
          <button type="button" data-audit-refresh>ODŚWIEŻ</button>
        </div>
        <div class="audit-summary" data-audit-summary>Ładowanie…</div>
        <div class="audit-list" data-audit-list><div class="audit-empty">Ładowanie logów…</div></div>
      </div>`;
    document.body.appendChild(modal);

    modal.querySelector(".audit-close")?.addEventListener("click", () => modal.classList.remove("active"));
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("active"); });
  }

  modal.classList.add("active");
  const list = modal.querySelector("[data-audit-list]");
  const summary = modal.querySelector("[data-audit-summary]");
  const search = modal.querySelector("[data-audit-search]");
  const category = modal.querySelector("[data-audit-category]");
  const refresh = modal.querySelector("[data-audit-refresh]");
  let rows = [];

  const render = () => {
    const needle = String(search?.value || "").trim().toLowerCase();
    const selectedCategory = String(category?.value || "");
    const filtered = rows.filter(row => {
      const cat = mattAuditCategory(row.action);
      if (selectedCategory && cat !== selectedCategory) return false;
      if (!needle) return true;
      const hay = [row.actor_username, row.actor_email, row.action, row.entity_type, row.entity_id, row.summary, cat]
        .filter(Boolean).join(" ").toLowerCase();
      return hay.includes(needle);
    });

    if (summary) summary.textContent = `Wyświetlono ${filtered.length} z ${rows.length} zdarzeń z ostatnich 14 dni.`;
    if (!list) return;
    list.innerHTML = filtered.length ? filtered.map(row => {
      const actor = row.actor_username || row.actor_email || (row.actor_user_id ? `Użytkownik ${String(row.actor_user_id).slice(0,8)}…` : "System");
      const actorExtra = row.actor_username && row.actor_email ? ` · ${row.actor_email}` : "";
      const details = row.details && typeof row.details === "object" ? JSON.stringify(row.details, null, 2) : "";
      const prettyDetails = row.details && typeof row.details === "object" ? mattAuditPrettyDetails(row.details) : "";
      return `<article class="audit-item">
        <div class="audit-item-top">
          <div><span class="audit-category">${mattAuditEscape(mattAuditCategory(row.action))}</span><strong>${mattAuditEscape(mattAuditActionLabel(row.action))}</strong></div>
          <time>${mattAuditEscape(mattAuditFormatDate(row.created_at))}</time>
        </div>
        <div class="audit-change-card">
          <p class="audit-summary-text">${mattAuditEscape(row.summary || "Brak dodatkowego opisu.")}</p>
          <div class="audit-meta"><span><b>Wykonał:</b> ${mattAuditEscape(actor + actorExtra)}</span><span><b>Dotyczy:</b> ${mattAuditEscape(row.entity_type || "—")}${row.entity_id ? ` / ${mattAuditEscape(row.entity_id)}` : ""}</span></div>
        </div>
        ${details ? `<details class="audit-details"><summary>Pokaż co zmieniono (przed → po)</summary><div class="audit-details-box">${prettyDetails}</div></details>` : ""}
      </article>`;
    }).join("") : '<div class="audit-empty">Brak logów pasujących do filtrów.</div>';
  };

  const load = async () => {
    if (list) list.innerHTML = '<div class="audit-empty">Ładowanie logów…</div>';
    if (refresh) refresh.disabled = true;
    try {
      const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabaseClient
        .from("matt_audit_logs")
        .select("id,created_at,actor_user_id,actor_email,actor_username,action,entity_type,entity_id,summary,details")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      rows = data || [];
      render();
    } catch (error) {
      console.error("Nie udało się wczytać logów:", error);
      if (summary) summary.textContent = "Nie udało się pobrać logów.";
      if (list) list.innerHTML = `<div class="audit-empty">${mattAuditEscape(error.message || "Błąd odczytu logów")}.<br><br>Sprawdź, czy w Supabase są aktywne funkcje i tabele odpowiedzialne za logi zmian.</div>`;
    } finally {
      if (refresh) refresh.disabled = false;
    }
  };

  search.oninput = render;
  category.onchange = render;
  refresh.onclick = load;
  await load();
}


window.mattOpenAuditLogs = mattOpenAuditLogs;

function mattSetHeaderUser(profile) {
  const open = document.getElementById("openLogin");
  const name = document.getElementById("headerUserName");
  const avatar = document.getElementById("headerUserAvatar");
  if (!open || !name || !avatar) return;

  if (!profile) {
    name.textContent = "LOGIN";
    avatar.src = MATT_DEFAULT_AVATAR;
    avatar.hidden = true;
    open.classList.remove("logged");
    return;
  }

  name.textContent = profile.username || "UŻYTKOWNIK";
  avatar.src = profile.avatar_url || MATT_DEFAULT_AVATAR;
  avatar.hidden = false;
  avatar.onerror = () => {
    avatar.onerror = null;
    avatar.src = MATT_DEFAULT_AVATAR;
  };
  open.classList.add("logged");
}

async function mattGetOwnProfile(session) {
  if (!session?.user) return null;

  // Najpierw po auth_user_id (nowa wersja profilu), potem kompatybilność ze starszymi rekordami po e-mailu.
  let result = await supabaseClient
    .from("profiles")
    .select("username,email,role,avatar_url,avatar_path,auth_user_id,must_complete_account")
    .eq("auth_user_id", session.user.id)
    .maybeSingle();

  if (result.error && /auth_user_id|avatar_/i.test(result.error.message || "")) {
    // Czytelny komunikat pojawi się w edycji profilu; tutaj zachowujemy działanie starego logowania.
    result = await supabaseClient
      .from("profiles")
      .select("username,email,role,must_complete_account")
      .eq("email", session.user.email)
      .maybeSingle();
  } else if (!result.data) {
    result = await supabaseClient
      .from("profiles")
      .select("username,email,role,avatar_url,avatar_path,auth_user_id,must_complete_account")
      .eq("email", session.user.email)
      .maybeSingle();
  }

  if (result.error) throw result.error;
  return result.data;
}

async function mattLoadUserHeader() {
  const open = document.getElementById("openLogin");
  const modal = document.getElementById("loginModal");
  const menu = document.getElementById("userMenu");
  const admin = document.getElementById("adminLink");
  const logout = document.getElementById("logoutBtn");
  const auditLogs = document.getElementById("adminAuditLogsBtn");
  const manageAccounts = document.getElementById("manageAccountsBtn");
  const dashboard = document.getElementById("adminDashboardBtn");
  if (!open) return;

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.currentUserIsAdmin = false;
    window.currentUserRole = "guest";
    window.currentUserPermissions = [];
    window.currentUserProfile = null;
    window.dispatchEvent(new CustomEvent("matt-auth-change", { detail: { isAdmin: false, role: "guest", permissions: [] } }));
    mattSetHeaderUser(null);
    if (auditLogs) auditLogs.hidden = true;
    if (manageAccounts) manageAccounts.hidden = true;
    if (dashboard) dashboard.hidden = true;
    open.onclick = () => modal?.classList.add("active");
    return;
  }

  try {
    const profile = await mattGetOwnProfile(session);
    if (!profile) {
      mattSetHeaderUser({ username: session.user.email?.split("@")[0] || "UŻYTKOWNIK", avatar_url: null });
      if (auditLogs) auditLogs.hidden = true;
      if (manageAccounts) manageAccounts.hidden = true;
      return;
    }

    window.currentUserProfile = profile;
    if (!(await mattEnforceAccountSecurity(session, profile))) return;
    const access = await mattLoadAccessState();
    window.dispatchEvent(new CustomEvent("matt-auth-change", { detail: { isAdmin: access.isAdmin, role: access.role, permissions: access.permissions } }));
    const canViewAudit = window.mattHasPermission?.("audit.view") === true;
    if (auditLogs) { auditLogs.hidden = !canViewAudit; auditLogs.onclick = canViewAudit ? (() => { menu?.classList.remove("show"); mattOpenAuditLogs(); }) : null; }
    const canManageAccounts = access.isAdmin || window.mattHasPermission?.("accounts.view") === true;
    if (manageAccounts) { manageAccounts.hidden = !canManageAccounts; manageAccounts.onclick = canManageAccounts ? (() => { menu?.classList.remove("show"); mattOpenAccountManager(); }) : null; }
    const canDashboard = access.isAdmin || window.mattHasPermission?.("cms.dashboard.view") === true;
    if (dashboard) { dashboard.hidden = !canDashboard; dashboard.onclick = canDashboard ? (() => { menu?.classList.remove("show"); window.location.href = "admin/"; }) : null; }
    mattSetHeaderUser(profile);

    if (profile.must_complete_account === true) {
      setTimeout(() => mattForceFirstLoginSetup(session, profile), 0);
    }

    open.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      menu?.classList.toggle("show");
    };

    // Panel administratora pozostaje obsługiwany osobnym mechanizmem CMS.
    if (admin) admin.style.display = "none";

    if (logout) {
      logout.onclick = async () => {
        await supabaseClient.auth.signOut();
        location.reload();
      };
    }
  } catch (error) {
    console.error("Nie udało się wczytać profilu:", error);
  }
}

window.mattLoadUserHeader = mattLoadUserHeader;

function mattAccountEscape(value = "") {
  return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

async function mattForceFirstLoginSetup(session, profile) {
  const modal = document.getElementById("firstLoginSetupModal");
  if (!modal || !session?.user || profile?.must_complete_account !== true) return;
  const username = document.getElementById("firstLoginUsername");
  const avatar = document.getElementById("firstLoginAvatar");
  const email = document.getElementById("firstLoginEmail");
  const password = document.getElementById("firstLoginPassword");
  const repeat = document.getElementById("firstLoginPasswordRepeat");
  const save = document.getElementById("firstLoginSave");
  const msg = document.getElementById("firstLoginMsg");

  document.body.classList.add("account-setup-required");
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  if (username) username.textContent = profile.username || "UŻYTKOWNIK";
  if (avatar) avatar.src = profile.avatar_url || MATT_DEFAULT_AVATAR;
  if (email) email.value = "";
  if (password) password.value = "";
  if (repeat) repeat.value = "";
  if (msg) msg.textContent = "";

  const preventClose = (event) => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); }
  };
  document.addEventListener("keydown", preventClose, true);

  if (save) save.onclick = async () => {
    const realEmail = String(email?.value || "").trim().toLowerCase();
    const newPassword = String(password?.value || "");
    const repeated = String(repeat?.value || "");
    if (!/^\S+@\S+\.\S+$/.test(realEmail)) { if (msg) msg.textContent = "Podaj poprawny adres e-mail."; return; }
    if (newPassword.length < 8) { if (msg) msg.textContent = "Nowe hasło musi mieć co najmniej 8 znaków."; return; }
    if (newPassword !== repeated) { if (msg) msg.textContent = "Nowe hasła nie są takie same."; return; }

    save.disabled = true;
    if (msg) msg.textContent = "Zapisywanie danych konta…";
    try {
      const { data, error } = await supabaseClient.functions.invoke("admin-manage-users", {
        body: { action: "complete_first_login", email: realEmail, password: newPassword }
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Nie udało się dokończyć konfiguracji konta.");
      if (msg) msg.textContent = "Konto zostało skonfigurowane. Za chwilę zalogujesz się ponownie swoim nickiem i nowym hasłem.";
      await supabaseClient.auth.signOut();
      document.removeEventListener("keydown", preventClose, true);
      setTimeout(() => location.reload(), 1200);
    } catch (error) {
      console.error("Pierwsza konfiguracja konta:", error);
      if (msg) msg.textContent = error?.message || "Nie udało się zapisać danych konta.";
      save.disabled = false;
    }
  };
}

async function mattOpenAccountManager() {
  const canAccount = permission => window.currentUserIsAdmin === true || window.mattHasPermission?.(permission) === true;
  if (!canAccount("accounts.view")) return;

  const sessionRes = await supabaseClient.auth.getSession();
  const viewerUserId = sessionRes?.data?.session?.user?.id || "";
  const viewerIsAdmin = window.currentUserIsAdmin === true || String(window.currentUserRole || "").toLowerCase() === "admin";

  let modal = document.getElementById("accountManagerModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "accountManagerModal";
    modal.className = "account-manager-modal";
    modal.innerHTML = `<div class="account-manager-box" role="dialog" aria-modal="true">
      <header class="account-manager-head">
        <div>
          <span>ZARZĄDZANIE KONTAMI</span>
          <h2>ZARZĄDZAJ KONTAMI</h2>
          <p>Podglądaj użytkowników, nadawaj role i uprawnienia oraz wykonuj awaryjne operacje na kontach zgodnie z przydzielonym zakresem dostępu.</p>
        </div>
        <button type="button" data-account-close aria-label="Zamknij">×</button>
      </header>
      <div class="account-manager-body" data-account-body></div>
    </div>`;
    document.body.appendChild(modal);
    modal.querySelector("[data-account-close]")?.addEventListener("click", () => modal.classList.remove("active"));
    modal.addEventListener("click", e => { if (e.target === modal) modal.classList.remove("active"); });
  }

  modal.classList.add("active");
  const body = modal.querySelector("[data-account-body]");
  if (!body) return;

  let accounts = [];
  let catalog = [];
  let dbCatalogPermissions = new Set();
  let selectedId = null;
  let accountPermissionMode = 'simple';

  const load = async () => {
    body.innerHTML = `<div class="account-loading">Ładowanie kont i katalogu uprawnień…</div>`;
    const [accountsRes, catalogRes, extraPermissions] = await Promise.all([
      supabaseClient.rpc("matt_admin_list_accounts"),
      supabaseClient.from("matt_permission_catalog").select("permission,group_name,label,description,sort_order").order("sort_order"),
      mattLoadExtraPermissionsMap()
    ]);
    if (accountsRes.error) throw accountsRes.error;
    if (catalogRes.error) throw catalogRes.error;
    dbCatalogPermissions = new Set((catalogRes.data || []).map(item => item.permission));
    accounts = (accountsRes.data || []).map(account => {
      const base = Array.isArray(account.permissions) ? account.permissions : [];
      const extras = String(account.role || '').toLowerCase() === 'moderator' && Array.isArray(extraPermissions?.[account.auth_user_id]) ? extraPermissions[account.auth_user_id] : [];
      return { ...account, permissions:[...new Set([...base, ...extras])] };
    });
    const mergedCatalog = new Map((catalogRes.data || []).map(item => [item.permission, { ...item }]));
    MATT_EXTRA_PERMISSION_CATALOG.forEach(item => {
      const existing = mergedCatalog.get(item.permission);
      mergedCatalog.set(item.permission, existing ? { ...item, ...existing } : { ...item });
    });
    catalog = [...mergedCatalog.values()].sort((a,b) => Number(a.sort_order || 9999) - Number(b.sort_order || 9999));
    if (!selectedId && accounts.length) {
      selectedId = accounts.find(a => a.auth_user_id === viewerUserId)?.auth_user_id || accounts[0].auth_user_id;
    }
    draw();
  };

  const groupCatalog = () => {
    const groups = new Map();
    catalog.forEach(item => {
      const meta = mattPermissionGroupMeta(item.permission, item.group_name);
      if (!groups.has(meta.name)) groups.set(meta.name, { order: meta.order, items: [] });
      groups.get(meta.name).items.push(item);
    });
    return new Map([...groups.entries()]
      .sort((a,b) => a[1].order - b[1].order || a[0].localeCompare(b[0], 'pl'))
      .map(([name, value]) => [name, value.items.sort((a,b) => Number(a.sort_order || 9999) - Number(b.sort_order || 9999))]));
  };

  const roleMeta = role => {
    const value = String(role || "user").toLowerCase();
    if (value === "admin") return { label: "Administrator", icon: "★", desc: "Pełny dostęp do wszystkich narzędzi i uprawnień.", cls: "admin" };
    if (value === "moderator") return { label: "Moderator", icon: "◆", desc: "Dostęp wyłącznie do zaznaczonych niżej czynności.", cls: "moderator" };
    return { label: "Użytkownik", icon: "●", desc: "Brak dostępu do narzędzi administracyjnych.", cls: "user" };
  };

  const effectivePermissions = account => {
    if (String(account?.role || "").toLowerCase() === "admin") return catalog.map(item => item.permission);
    if (String(account?.role || "").toLowerCase() === "moderator") return Array.isArray(account.permissions) ? account.permissions : [];
    return [];
  };

  const accountStatus = account => {
    const technical = account?.must_complete_account === true;
    if (technical) return `<span class="account-badge pending">WYMAGA KONFIGURACJI</span>`;
    if (account.role === "admin") return `<span class="account-badge admin">ADMIN · ${catalog.length} upr.</span>`;
    if (account.role === "moderator") return `<span class="account-badge moderator">MODERATOR · ${(account.permissions || []).length} upr.</span>`;
    return `<span class="account-badge user">UŻYTKOWNIK · 0 upr.</span>`;
  };

  const roleSummary = () => {
    const admins = accounts.filter(a => a.role === "admin").length;
    const moderators = accounts.filter(a => a.role === "moderator").length;
    const users = accounts.filter(a => !["admin","moderator"].includes(a.role)).length;
    return `<div class="account-overview">
      <div><small>ADMINISTRATORZY</small><strong>${admins}</strong></div>
      <div><small>MODERATORZY</small><strong>${moderators}</strong></div>
      <div><small>UŻYTKOWNICY</small><strong>${users}</strong></div>
      <div><small>UPRAWNIENIA W SYSTEMIE</small><strong>${catalog.length}</strong></div>
    </div>`;
  };

  const draw = () => {
    const selected = accounts.find(a => a.auth_user_id === selectedId) || null;
    body.innerHTML = `${roleSummary()}<div class="account-manager-grid">
      <section class="account-list-panel">
        <div class="account-panel-title">
          <div><small>KONTA</small><strong>${accounts.length} użytkowników</strong></div>
          ${canAccount("accounts.create") ? '<button class="account-primary" type="button" data-new-account>+ NOWE KONTO</button>' : ''}
        </div>
        <div class="account-list">${accounts.map(a => {
          const isSelf = a.auth_user_id === viewerUserId;
          return `<button type="button" class="account-row ${selectedId===a.auth_user_id?'active':''}" data-account-id="${mattAccountEscape(a.auth_user_id)}">
            <img src="${mattAccountEscape(a.avatar_url || MATT_DEFAULT_AVATAR)}" alt="">
            <span>
              <strong>${mattAccountEscape(a.username || 'Użytkownik')}${isSelf ? ' <em>TY</em>' : ''}</strong>
              <small>${a.must_complete_account === true ? 'Konto wymaga ustawienia/zmiany danych logowania' : mattAccountEscape(a.email || 'Brak e-maila')}</small>
            </span>
            ${accountStatus(a)}
          </button>`;
        }).join("")}</div>
      </section>
      <section class="account-edit-panel">${selected ? renderAccountEditor(selected) : `<div class="account-empty"><strong>Wybierz konto</strong><p>Kliknij użytkownika z listy albo utwórz nowe konto tymczasowe.</p></div>`}</section>
    </div>`;

    body.querySelectorAll("[data-account-id]").forEach(btn => btn.addEventListener("click", () => {
      selectedId = btn.dataset.accountId;
      draw();
    }));
    body.querySelector("[data-new-account]")?.addEventListener("click", renderCreate);
    bindSelected(selected);
  };


  const renderAccountEditor = account => {
    const tabs = `<div class="account-mode-tabs">
      <button type="button" class="${accountPermissionMode==='simple'?'active':''}" data-account-mode="simple">TRYB UPROSZCZONY</button>
      <button type="button" class="${accountPermissionMode==='advanced'?'active':''}" data-account-mode="advanced">TRYB ZAAWANSOWANY</button>
    </div>`;
    return tabs + (accountPermissionMode === 'simple' ? renderSimpleAccess(account) : renderSelected(account));
  };

  const simplePermissionSets = [
    {name:"Twitch", permissions:["streamers.delete","commands.delete"], desc:"Moderacja kanału, komendy i obsługa Twitch"},
    {name:"Discord", permissions:["discord.join.messages.manage","discord.join.members.manage","discord.channels.delete"], desc:"Moderacja serwera Discord"},
    {name:"Eventy", permissions:["events.create","events.edit","events.delete","events.schedule.manage","events.images.manage","events.publish"], desc:"Tworzenie i zarządzanie wydarzeniami"},
    {name:"Treści strony", permissions:["rules.delete","contact.topics.delete"], desc:"Zarządzanie materiałami i treścią"},
    {name:"Społeczność", permissions:["moderation.people.delete","moderation.benefits.delete"], desc:"Obsługa użytkowników i zgłoszeń"},
    {name:"Pełna administracja", permissions:null, desc:"Pełny dostęp do wszystkich funkcji"}
  ];

  const simpleRoles = {
    user:{label:"Użytkownik", desc:"Zwykłe konto społeczności", permissions:[]},
    moderator:{label:"Moderator", desc:"Pilnuje społeczności i pomaga użytkownikom", permissions:["discord.join.messages.manage","discord.join.members.manage","moderation.people.delete"]},
    admin:{label:"Administrator", desc:"Pełny dostęp administracyjny", permissions:null}
  };

  const renderSimpleAccess = account => {
    const selected = new Set(effectivePermissions(account));
    const currentRole=String(account.role||"user").toLowerCase();
    return `<div class="account-simple-access">
      <h3>Szybkie nadawanie dostępu</h3>
      <p>Najpierw wybierz rolę, następnie dodatkowe moduły. Tryb zaawansowany pozwala później odebrać pojedyncze uprawnienia.</p>
      <div class="account-simple-roles">
        ${Object.entries(simpleRoles).map(([key,r])=>`<label class="account-simple-role ${currentRole===key?'active':''}">
          <input type="radio" name="simple-role" data-simple-role="${key}" ${currentRole===key?'checked':''}>
          <div class="account-simple-role-content">
            <strong>${r.label}</strong>
            <small>${r.desc}</small>
          </div>
        </label>`).join('')}
      </div>
      <h4>Dodatkowe możliwości</h4>
      <div class="account-simple-options">
      ${simplePermissionSets.map((set,i)=>{
        const perms=set.permissions||catalog.map(x=>x.permission);
        const checked=perms.every(p=>selected.has(p));
        return `<label class="account-simple-option"><input type="checkbox" data-simple-group="${i}" ${checked?'checked':''}><span><strong>${set.name}</strong><small>${set.desc}<br>${perms.length} szczegółowych uprawnień</small></span></label>`;
      }).join('')}
      </div>
      <div class="account-simple-preview" data-simple-preview>
        <strong>Podgląd dostępu</strong>
        <p>Wybierz rolę lub moduły aby zobaczyć możliwości użytkownika.</p>
      </div>
      <button class="account-primary" type="button" data-simple-save ${!canAccount("accounts.permissions.change")?'disabled':''}>ZAPISZ UPROSZCZONE UPRAWNIENIA</button>
      <p class="account-message" data-account-message></p>
    </div>`;
  };

  const renderSelected = account => {
    const groups = groupCatalog();
    const isSelf = account.auth_user_id === viewerUserId;
    const currentRole = String(account.role || "user").toLowerCase();
    const selectedPermissions = new Set(effectivePermissions(account));
    const meta = roleMeta(currentRole);
    const targetIsAdmin = currentRole === "admin";
    const canChangeRole = !isSelf && canAccount("accounts.role.change") && (viewerIsAdmin || !targetIsAdmin);
    const canChangePermissions = !isSelf && canAccount("accounts.permissions.change") && (viewerIsAdmin || !targetIsAdmin);
    const canResetPassword = !isSelf && canAccount("accounts.password.reset") && (viewerIsAdmin || !targetIsAdmin);
    const canChangeEmail = !isSelf && canAccount("accounts.email.change") && (viewerIsAdmin || !targetIsAdmin);
    const canDeleteAccount = !isSelf && canAccount("accounts.delete") && (viewerIsAdmin || !targetIsAdmin);

    const roleOptions = ["user","moderator","admin"].map(role => {
      const m = roleMeta(role);
      const active = currentRole === role;
      const disabled = role === "admin" && !viewerIsAdmin && !active;
      return `<option value="${role}" ${active ? 'selected' : ''} ${disabled ? 'disabled' : ''}>${m.label}${disabled ? ' — tylko administrator' : ''}</option>`;
    }).join("");

    const permissionSections = [...groups.entries()].map(([group, items]) => {
      const activeCount = currentRole === "admin"
        ? items.length
        : currentRole === "moderator"
          ? items.filter(item => selectedPermissions.has(item.permission)).length
          : 0;

      return `<section class="account-permission-group" data-permission-group="${mattAccountEscape(group)}">
        <header><h4>${mattAccountEscape(group)}</h4><div class="account-permission-group-tools"><span data-group-count>${activeCount}/${items.length}</span><button type="button" data-collapse-group title="Zwiń lub rozwiń">▼</button><button type="button" data-group-select title="Zaznacz całą sekcję">+ WSZYSTKO</button><button type="button" data-group-clear title="Wyczyść całą sekcję">WYCZYŚĆ</button></div></header>
        ${items.map(item => {
          const checked = currentRole === "admin" || (currentRole === "moderator" && selectedPermissions.has(item.permission));
          const disabled = isSelf || currentRole !== "moderator" || !canChangePermissions;
          const critical = mattPermissionIsCritical(item.permission);
          const searchText = [group,item.label,item.description,item.permission].filter(Boolean).join(' ').toLowerCase();
          return `<label class="account-permission ${disabled ? 'readonly' : ''}${critical ? ' is-critical' : ''}" data-permission-search="${mattAccountEscape(searchText)}">
            <input type="checkbox" value="${mattAccountEscape(item.permission)}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}>
            <span>
              <strong>${mattAccountEscape(item.label)}${critical ? '<em class="account-permission-critical">KRYTYCZNE</em>' : ''}</strong>
              <small>${mattAccountEscape(item.description || '')}</small>
            </span>
          </label>`;
        }).join("")}
      </section>`;
    }).join("");

    const permissionCount = currentRole === "admin" ? catalog.length : currentRole === "moderator" ? selectedPermissions.size : 0;
    const copyPermissionSources = accounts
      .filter(source => source.auth_user_id !== account.auth_user_id && String(source.role || '').toLowerCase() === 'moderator')
      .map(source => `<option value="${mattAccountEscape(source.auth_user_id)}">${mattAccountEscape(source.username || source.email || 'Moderator')} · ${(source.permissions || []).length} upr.</option>`).join('');
    const canCopyPermissions = !isSelf && canChangePermissions && canAccount("accounts.permissions.copy") && Boolean(copyPermissionSources);

    return `<div class="account-editor-head">
        <div>
          <small>${isSelf ? 'TWOJE KONTO · PODGLĄD' : 'EDYCJA KONTA'}</small>
          <h3>${mattAccountEscape(account.username || 'Użytkownik')}</h3>
          <p>${account.must_complete_account === true ? 'Konto wymaga dokończenia konfiguracji danych logowania.' : mattAccountEscape(account.email || '')}</p>
        </div>
        <div class="account-editor-badges">${isSelf ? '<span class="account-badge self">TWOJE KONTO</span>' : ''}${accountStatus(account)}</div>
      </div>

      ${isSelf ? `<div class="account-protection-note"><strong>🔒 OCHRONA WŁASNEGO KONTA</strong><span>Nie możesz z tego panelu odebrać sobie roli administratora ani zmienić własnych uprawnień.</span></div>` : ''}

      <div class="account-section-heading">
        <div><small>ROLA UŻYTKOWNIKA</small><h4>${meta.label}</h4></div>
        <span>${isSelf ? 'TYLKO PODGLĄD' : 'WYBIERZ ROLĘ Z LISTY'}</span>
      </div>
      <div class="account-role-select-wrap">
        <label class="account-form-label" for="account-role-select">Wybór roli</label>
        <select id="account-role-select" name="account-role-choice" class="account-role-select" ${!canChangeRole ? 'disabled' : ''}>
          ${roleOptions}
        </select>
        <div class="account-role-help">${isSelf ? 'To jest Twoje konto — zmiana własnej roli jest zablokowana.' : canChangeRole ? 'Wybierz jedną rolę z listy. Dla Moderatora możesz niżej zaznaczyć dokładne uprawnienia.' : 'Nie masz uprawnienia do zmiany roli tego konta.'}</div>
      </div>
      <div class="account-role-note" data-role-note></div>

      <div class="account-section-heading permissions-heading">
        <div><small>UPRAWNIENIA</small><h4>Zakres dostępu</h4></div>
        <div class="account-permission-tools">
          <input class="account-permission-search" type="search" data-permission-search-input placeholder="Szukaj uprawnienia…" aria-label="Szukaj uprawnienia">
          <span class="account-permission-total" data-permission-total>${permissionCount}/${catalog.length} aktywnych</span>
          <button type="button" data-select-all ${currentRole !== 'moderator' || !canChangePermissions ? 'disabled' : ''}>ZAZNACZ WSZYSTKO</button>
          <button type="button" data-clear-all ${currentRole !== 'moderator' || !canChangePermissions ? 'disabled' : ''}>WYCZYŚĆ</button>
        </div>
      </div>
      ${canCopyPermissions ? `<div class="account-copy-permissions" data-copy-permissions-wrap>
        <div><small>SZYBKIE USTAWIENIE</small><strong>Skopiuj zestaw uprawnień z innego Moderatora</strong><span>Checkboxy zostaną podmienione w formularzu. Nic nie zapisze się bez kliknięcia „ZAPISZ ROLĘ I UPRAWNIENIA”.</span></div>
        <div><select data-copy-permissions-source aria-label="Moderator źródłowy"><option value="">Wybierz moderatora…</option>${copyPermissionSources}</select><button type="button" data-copy-permissions>SKOPIUJ UPRAWNIENIA</button></div>
      </div>` : ''}
      <div class="account-advanced-guide">
        <strong>SZYBKA EDYCJA UPRAWNIEŃ</strong>
        <span>Każda sekcja odpowiada za inny obszar systemu. Zaznacz całą kategorię albo wybierz pojedyncze akcje.</span>
        <div class="account-area-cards">
          ${[...groups.keys()].map(g=>`<button type="button" data-jump-group="${mattAccountEscape(g)}">${mattAccountEscape(g)}</button>`).join('')}
        </div>
      </div>
      <div class="account-permissions" data-permissions>${permissionSections}</div>

      <div class="account-section-heading account-security-heading">
        <div><small>KONTO / BEZPIECZEŃSTWO</small><h4>Operacje awaryjne</h4></div>
        <span>${isSelf ? 'WŁASNE KONTO CHRONIONE' : 'DOSTĘP WG UPRAWNIEŃ'}</span>
      </div>
      <div class="account-security-card">
        <div class="account-email-tool">
          <label class="account-form-label" for="account-admin-email">Adres e-mail użytkownika</label>
          <div class="account-email-row">
            <input id="account-admin-email" type="email" data-admin-email value="${mattAccountEscape(account.email || '')}" ${!canChangeEmail ? 'disabled' : ''}>
            <button type="button" data-change-email ${!canChangeEmail ? 'disabled' : ''}>ZMIEŃ E-MAIL</button>
          </div>
        </div>
        <div class="account-security-actions">
          <button type="button" data-reset-password ${!canResetPassword ? 'disabled' : ''}>↻ RESETUJ HASŁO</button>
          <button type="button" class="danger" data-delete-account ${!canDeleteAccount ? 'disabled' : ''}>USUŃ UŻYTKOWNIKA</button>
        </div>
        <div class="account-temp-password" data-temp-password hidden></div>
      </div>

      <div class="account-editor-actions">
        ${isSelf
          ? `<button class="account-primary protected" type="button" disabled>🔒 WŁASNE KONTO CHRONIONE</button>`
          : (canChangeRole || canChangePermissions) ? `<button class="account-primary" type="button" data-save-access>ZAPISZ ROLĘ I UPRAWNIENIA</button>` : `<button class="account-primary protected" type="button" disabled>BRAK UPRAWNIEŃ DO ZMIANY ROLI / UPRAWNIEŃ</button>`}
      </div>
      <p class="account-message" data-account-message></p>`;
  };

  const bindSelected = account => {
    if (!account) return;

    body.querySelectorAll('[data-account-mode]').forEach(btn => btn.addEventListener('click', () => {
      accountPermissionMode = btn.dataset.accountMode;
      draw();
    }));

    body.querySelectorAll('[data-collapse-group]').forEach(btn => btn.addEventListener('click', () => {
      const section = btn.closest('.account-permission-group');
      section?.classList.toggle('collapsed');
      btn.textContent = section?.classList.contains('collapsed') ? '▶' : '▼';
    }));

    body.querySelectorAll('[data-jump-group]').forEach(btn => btn.addEventListener('click', () => {
      const target = body.querySelector(`[data-permission-group="${btn.dataset.jumpGroup}"]`);
      target?.scrollIntoView({behavior:'smooth',block:'start'});
    }));

    if (accountPermissionMode === 'simple') {
      const saveSimple = body.querySelector('[data-simple-save]');
      const updateSimplePreview=()=>{
        const role=body.querySelector('[data-simple-role]:checked')?.dataset.simpleRole || 'user';
        const selected=[...body.querySelectorAll('[data-simple-group]:checked')].map(cb=>simplePermissionSets[Number(cb.dataset.simpleGroup)].name);
        const box=body.querySelector('[data-simple-preview]');
        if(box) box.innerHTML=`<strong>Podgląd dostępu</strong><p>Rola: ${simpleRoles[role].label}</p><p>${simpleRoles[role].desc}</p><p>Moduły: ${selected.length?selected.join(', '):'brak dodatkowych modułów'}</p>`;
      };
      body.querySelectorAll('[data-simple-role],[data-simple-group]').forEach(x=>x.addEventListener('change',updateSimplePreview));
      updateSimplePreview();
      saveSimple?.addEventListener('click', async () => {
        const role = body.querySelector('[data-simple-role]:checked')?.dataset.simpleRole || 'user';
        const selected = new Set();
        const rolePermissions=simpleRoles[role].permissions;
        if(rolePermissions) rolePermissions.forEach(p=>selected.add(p));
        else if(rolePermissions===null) catalog.forEach(x=>selected.add(x.permission));
        body.querySelectorAll('[data-simple-group]').forEach(cb => {
          if (cb.checked) {
            const set = simplePermissionSets[Number(cb.dataset.simpleGroup)];
            (set.permissions || catalog.map(x=>x.permission)).forEach(p=>selected.add(p));
          }
        });
        try {
          saveSimple.disabled = true;
          const dbPermissions=[...selected].filter(p=>dbCatalogPermissions.has(p));
          const extraPermissions=[...selected].filter(p=>!dbCatalogPermissions.has(p));
          const {error}=await supabaseClient.rpc("matt_admin_set_account_access",{p_user_id:account.auth_user_id,p_role:role,p_permissions:dbPermissions});
          if(error) throw error;
          const extraMap=await mattLoadExtraPermissionsMap();
          if(extraPermissions.length) extraMap[account.auth_user_id]=extraPermissions; else delete extraMap[account.auth_user_id];
          await mattSaveExtraPermissionsMap(extraMap);
          await load();
        } catch(error) {
          body.querySelector('[data-account-message]').textContent=error.message||'Błąd zapisu';
        } finally { saveSimple.disabled=false; }
      });
      return;
    }

    const isSelf = account.auth_user_id === viewerUserId;
    const targetIsAdmin = String(account.role || "user").toLowerCase() === "admin";
    const canChangeRole = !isSelf && canAccount("accounts.role.change") && (viewerIsAdmin || !targetIsAdmin);
    const canChangePermissions = !isSelf && canAccount("accounts.permissions.change") && (viewerIsAdmin || !targetIsAdmin);
    const canResetPassword = !isSelf && canAccount("accounts.password.reset") && (viewerIsAdmin || !targetIsAdmin);
    const canChangeEmail = !isSelf && canAccount("accounts.email.change") && (viewerIsAdmin || !targetIsAdmin);
    const canDeleteAccount = !isSelf && canAccount("accounts.delete") && (viewerIsAdmin || !targetIsAdmin);
    const roleSelect = body.querySelector('select[name="account-role-choice"]');
    const permsWrap = body.querySelector("[data-permissions]");
    const note = body.querySelector("[data-role-note]");
    const total = body.querySelector("[data-permission-total]");
    const selectAll = body.querySelector("[data-select-all]");
    const clearAll = body.querySelector("[data-clear-all]");
    const permissionSearch = body.querySelector("[data-permission-search-input]");

    const selectedRole = () => roleSelect?.value || String(account.role || "user");

    const applyPermissionFilter = () => {
      const needle = String(permissionSearch?.value || "").trim().toLowerCase();
      body.querySelectorAll(".account-permission-group").forEach(group => {
        let visible = 0;
        group.querySelectorAll(".account-permission").forEach(item => {
          const match = !needle || String(item.dataset.permissionSearch || "").includes(needle);
          item.hidden = !match;
          if (match) visible += 1;
        });
        group.hidden = visible === 0;
      });
    };

    const syncPermissionUi = () => {
      const role = selectedRole();
      const checkboxes = [...body.querySelectorAll("[data-permissions] input[type=checkbox]")];
      const metaNow = roleMeta(role);
      const roleHeading = body.querySelector(".account-section-heading h4");
      if (roleHeading) roleHeading.textContent = metaNow.label;

      checkboxes.forEach(cb => {
        if (role === "admin") {
          cb.checked = true;
          cb.disabled = true;
        } else if (role === "user") {
          cb.checked = false;
          cb.disabled = true;
        } else {
          cb.disabled = !canChangePermissions;
        }
      });

      const active = role === "admin" ? catalog.length : role === "moderator" ? checkboxes.filter(cb => cb.checked).length : 0;
      if (total) total.textContent = `${active}/${catalog.length} aktywnych`;

      body.querySelectorAll(".account-permission-group").forEach(group => {
        const groupBoxes = [...group.querySelectorAll('input[type="checkbox"]')];
        const counter = group.querySelector("[data-group-count]");
        if (counter) counter.textContent = `${groupBoxes.filter(cb => cb.checked).length}/${groupBoxes.length}`;
        group.querySelectorAll('[data-group-select],[data-group-clear]').forEach(btn => {
          btn.disabled = role !== "moderator" || !canChangePermissions;
        });
      });

      if (selectAll) selectAll.disabled = role !== "moderator" || !canChangePermissions;
      if (clearAll) clearAll.disabled = role !== "moderator" || !canChangePermissions;
      const copyButton = body.querySelector('[data-copy-permissions]');
      const copySelect = body.querySelector('[data-copy-permissions-source]');
      if (copyButton) copyButton.disabled = role !== "moderator" || !canChangePermissions;
      if (copySelect) copySelect.disabled = role !== "moderator" || !canChangePermissions;
      applyPermissionFilter();

      if (note) {
        note.innerHTML = role === "admin"
          ? `<strong>Administrator</strong> ma automatycznie wszystkie ${catalog.length} uprawnień. Poniższa lista jest pełnym podglądem zakresu dostępu.`
          : role === "moderator"
            ? `<strong>Moderator</strong> otrzymuje wyłącznie zaznaczone czynności. Każde niezaznaczone działanie jest ukrywane i blokowane w panelu strony zgodnie z przydzielonym zakresem.`
            : `<strong>Użytkownik</strong> nie ma dostępu do narzędzi administracyjnych. Lista poniżej pokazuje, jakie możliwości można później nadać po zmianie roli na Moderatora.`;
      }
    };

    roleSelect?.addEventListener("change", syncPermissionUi);
    body.querySelectorAll("[data-permissions] input[type=checkbox]").forEach(input => input.addEventListener("change", syncPermissionUi));

    selectAll?.addEventListener("click", () => {
      if (selectedRole() !== "moderator" || !canChangePermissions) return;
      body.querySelectorAll("[data-permissions] input[type=checkbox]").forEach(cb => { cb.checked = true; });
      syncPermissionUi();
    });

    clearAll?.addEventListener("click", () => {
      if (selectedRole() !== "moderator" || !canChangePermissions) return;
      body.querySelectorAll("[data-permissions] input[type=checkbox]").forEach(cb => { cb.checked = false; });
      syncPermissionUi();
    });

    body.querySelectorAll(".account-permission-group").forEach(group => {
      group.querySelector("[data-group-select]")?.addEventListener("click", () => {
        if (selectedRole() !== "moderator" || !canChangePermissions) return;
        group.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = true; });
        syncPermissionUi();
      });
      group.querySelector("[data-group-clear]")?.addEventListener("click", () => {
        if (selectedRole() !== "moderator" || !canChangePermissions) return;
        group.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = false; });
        syncPermissionUi();
      });
    });

    permissionSearch?.addEventListener("input", applyPermissionFilter);

    body.querySelector("[data-copy-permissions]")?.addEventListener("click", () => {
      if (!canChangePermissions || !canAccount("accounts.permissions.copy") || selectedRole() !== "moderator") return;
      const sourceId = String(body.querySelector("[data-copy-permissions-source]")?.value || '');
      const source = accounts.find(item => String(item.auth_user_id) === sourceId && String(item.role || '').toLowerCase() === 'moderator');
      const message = body.querySelector("[data-account-message]");
      if (!source) { if (message) message.textContent = "Wybierz Moderatora, z którego chcesz skopiować uprawnienia."; return; }
      const sourcePermissions = new Set(Array.isArray(source.permissions) ? source.permissions : []);
      body.querySelectorAll("[data-permissions] input[type=checkbox]").forEach(cb => { cb.checked = sourcePermissions.has(cb.value); });
      syncPermissionUi();
      if (message) message.textContent = `Skopiowano ${(source.permissions || []).length} uprawnień z konta ${source.username || source.email || 'Moderator'}. Kliknij ZAPISZ, aby zatwierdzić.`;
    });

    syncPermissionUi();

    const invokeAccountAction = async payload => {
      const { data, error } = await supabaseClient.functions.invoke("admin-manage-users", { body: payload });
      if (error) {
        let detail = data?.error || "";
        if (!detail && error?.context?.json) {
          try { detail = (await error.context.json())?.error || ""; } catch (_) {}
        }
        throw new Error(detail || error?.message || "Operacja na koncie nie powiodła się.");
      }
      if (!data?.ok) throw new Error(data?.error || "Operacja na koncie nie powiodła się.");
      return data;
    };

    body.querySelector("[data-reset-password]")?.addEventListener("click", async () => {
      if (!canResetPassword) return;
      if (!confirm(`Zresetować hasło użytkownika ${account.username || 'Użytkownik'}? Zostanie wygenerowane nowe hasło tymczasowe.`)) return;
      const button = body.querySelector("[data-reset-password]");
      const result = body.querySelector("[data-temp-password]");
      const message = body.querySelector("[data-account-message]");
      button.disabled = true;
      if (message) message.textContent = "Resetowanie hasła…";
      try {
        const data = await invokeAccountAction({ action:"reset_password", userId:account.auth_user_id });
        if (result) {
          result.hidden = false;
          result.innerHTML = `<span>NOWE HASŁO TYMCZASOWE</span><code>${mattAccountEscape(data.temporaryPassword || '')}</code><button type="button" data-copy-temp>KOPIUJ</button><small>Hasło jest pokazane tylko teraz. Użytkownik przy logowaniu zostanie poproszony o ustawienie własnego hasła.</small>`;
          result.querySelector("[data-copy-temp]")?.addEventListener("click", async e => {
            try { await navigator.clipboard.writeText(data.temporaryPassword || ''); e.currentTarget.textContent = "SKOPIOWANO"; } catch (_) {}
          });
        }
        if (message) message.textContent = "Hasło zostało zresetowane.";
      } catch (error) {
        if (message) message.textContent = error?.message || "Nie udało się zresetować hasła.";
      } finally { button.disabled = false; }
    });

    body.querySelector("[data-change-email]")?.addEventListener("click", async () => {
      if (!canChangeEmail) return;
      const input = body.querySelector("[data-admin-email]");
      const email = String(input?.value || "").trim().toLowerCase();
      const button = body.querySelector("[data-change-email]");
      const message = body.querySelector("[data-account-message]");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { if (message) message.textContent = "Podaj poprawny adres e-mail."; return; }
      if (!confirm(`Zmienić e-mail użytkownika ${account.username || 'Użytkownik'} na ${email}?`)) return;
      button.disabled = true;
      if (message) message.textContent = "Zmiana e-maila…";
      try {
        await invokeAccountAction({ action:"change_email", userId:account.auth_user_id, email });
        selectedId = account.auth_user_id;
        await load();
      } catch (error) {
        if (message) message.textContent = error?.message || "Nie udało się zmienić e-maila.";
      } finally { button.disabled = false; }
    });

    body.querySelector("[data-delete-account]")?.addEventListener("click", async () => {
      if (!canDeleteAccount) return;
      const typed = prompt(`Usunięcie konta jest nieodwracalne. Aby usunąć użytkownika ${account.username || 'Użytkownik'}, wpisz jego nick dokładnie:`);
      if (typed !== String(account.username || '')) return;
      const button = body.querySelector("[data-delete-account]");
      const message = body.querySelector("[data-account-message]");
      button.disabled = true;
      if (message) message.textContent = "Usuwanie użytkownika…";
      try {
        await invokeAccountAction({ action:"delete_user", userId:account.auth_user_id });
        // Posprzątaj pomocnicze dane tego konta. Błąd czyszczenia nie cofnie poprawnie wykonanego usunięcia konta.
        try {
          const extraMap = await mattLoadExtraPermissionsMap();
          if (extraMap && Object.prototype.hasOwnProperty.call(extraMap, account.auth_user_id)) {
            delete extraMap[account.auth_user_id];
            await mattSaveExtraPermissionsMap(extraMap);
          }
          const security = await mattGetAccountSecurityState();
          let changed = false;
          if (security.blocks?.[account.auth_user_id]) { delete security.blocks[account.auth_user_id]; changed = true; }
          if (security.revocations?.[account.auth_user_id]) { delete security.revocations[account.auth_user_id]; changed = true; }
          if (changed && window.MattCMS?.save) await window.MattCMS.save("account_security", security, { backup:false });
        } catch (cleanupError) {
          console.warn("Konto usunięto, ale nie udało się posprzątać danych pomocniczych:", cleanupError?.message || cleanupError);
        }
        selectedId = viewerUserId;
        await load();
      } catch (error) {
        if (message) message.textContent = error?.message || "Nie udało się usunąć użytkownika.";
        button.disabled = false;
      }
    });

    body.querySelector("[data-save-access]")?.addEventListener("click", async () => {
      if (isSelf || (!canChangeRole && !canChangePermissions)) return;
      const button = body.querySelector("[data-save-access]");
      const message = body.querySelector("[data-account-message]");
      const role = canChangeRole ? selectedRole() : String(account.role || "user").toLowerCase();
      const selectedPermissions = role === "moderator"
        ? (canChangePermissions ? [...body.querySelectorAll("[data-permissions] input:checked")].map(x => x.value) : (Array.isArray(account.permissions) ? account.permissions : []))
        : [];

      button.disabled = true;
      if (message) message.textContent = "Zapisywanie…";
      try {
        const dbPermissions = selectedPermissions.filter(permission => dbCatalogPermissions.has(permission));
        const extraPermissions = selectedPermissions.filter(permission => !dbCatalogPermissions.has(permission));
        const { error } = await supabaseClient.rpc("matt_admin_set_account_access", {
          p_user_id: account.auth_user_id,
          p_role: role,
          p_permissions: dbPermissions
        });
        if (error) throw error;
        const extraMap = await mattLoadExtraPermissionsMap();
        if (role === "moderator" && extraPermissions.length) extraMap[account.auth_user_id] = extraPermissions;
        else delete extraMap[account.auth_user_id];
        await mattSaveExtraPermissionsMap(extraMap);
        if (message) message.textContent = "Rola i uprawnienia zostały zapisane.";
        selectedId = account.auth_user_id;
        await load();
      } catch (error) {
        if (message) message.textContent = error?.message || "Nie udało się zapisać.";
      } finally {
        button.disabled = false;
      }
    });
  };

  const renderCreate = () => {
    if (!canAccount("accounts.create")) { draw(); return; }
    body.innerHTML = `<div class="account-create-card">
      <button type="button" class="account-back" data-back-accounts>← WRÓĆ DO LISTY</button>
      <small>NOWE KONTO TYMCZASOWE</small>
      <h3>UTWÓRZ UŻYTKOWNIKA</h3>
      <p>Podaj tylko nick i hasło tymczasowe. Przy pierwszym logowaniu użytkownik będzie musiał podać swój e-mail i ustawić nowe hasło.</p>
      <label class="account-field">Nick<input data-create-username maxlength="32" autocomplete="off" placeholder="np. NowyModerator"></label>
      <label class="account-field">Hasło tymczasowe<input data-create-password type="password" autocomplete="new-password" placeholder="Minimum 8 znaków"></label>
      <button class="account-primary" type="button" data-create-submit>UTWÓRZ KONTO</button>
      <p class="account-message" data-create-message></p>
    </div>`;

    body.querySelector("[data-back-accounts]")?.addEventListener("click", draw);
    body.querySelector("[data-create-submit]")?.addEventListener("click", async () => {
      const username = String(body.querySelector("[data-create-username]")?.value || "").trim();
      const password = String(body.querySelector("[data-create-password]")?.value || "");
      const button = body.querySelector("[data-create-submit]");
      const message = body.querySelector("[data-create-message]");

      if (username.length < 2) { message.textContent = "Nick musi mieć co najmniej 2 znaki."; return; }
      if (password.length < 8) { message.textContent = "Hasło tymczasowe musi mieć co najmniej 8 znaków."; return; }

      button.disabled = true;
      message.textContent = "Tworzenie konta…";
      try {
        const { data, error } = await supabaseClient.functions.invoke("admin-manage-users", {
          body: { action: "create", username, password }
        });
        if (error) {
          let detail = data?.error || "";
          if (!detail && error?.context?.json) { try { detail = (await error.context.json())?.error || ""; } catch (_) {} }
          throw new Error(detail || error?.message || "Nie udało się utworzyć konta.");
        }
        if (!data?.ok) throw new Error(data?.error || "Nie udało się utworzyć konta.");
        message.textContent = "Konto utworzone. Użytkownik przy pierwszym logowaniu ustawi swój e-mail i nowe hasło.";
        selectedId = data.userId;
        await load();
      } catch (error) {
        message.textContent = error?.message || "Nie udało się utworzyć konta.";
      } finally {
        button.disabled = false;
      }
    });
  };

  try {
    await load();
  } catch (error) {
    body.innerHTML = `<div class="account-empty"><strong>Nie udało się otworzyć zarządzania kontami.</strong><p>${mattAccountEscape(error?.message || 'Nieznany błąd')}</p></div>`;
  }
}
window.mattOpenAccountManager = mattOpenAccountManager;
window.mattForceFirstLoginSetup = mattForceFirstLoginSetup;

async function mattUploadProfileAvatar(file, userId, username) {
  if (!file) return null;
  if (!file.type?.startsWith("image/")) throw new Error("Wybrany plik nie jest obrazem.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Avatar może mieć maksymalnie 8 MB.");

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const slug = (username || "user")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30) || "user";
  const path = `${userId}/${slug}-${Date.now()}.${ext}`;

  const { error } = await supabaseClient.storage.from("profile-avatars").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type
  });
  if (error) throw error;

  const publicUrl = supabaseClient.storage.from("profile-avatars").getPublicUrl(path).data.publicUrl;
  return { path, publicUrl };
}

async function mattDeleteProfileAvatar(path, userId) {
  if (!path || !userId || !path.startsWith(`${userId}/`)) return;
  const { error } = await supabaseClient.storage.from("profile-avatars").remove([path]);
  if (error) console.warn("Nie udało się usunąć starego avatara:", error.message);
}

document.addEventListener("DOMContentLoaded", async () => {
  const open = document.getElementById("openLogin");
  const modal = document.getElementById("loginModal");
  const close = document.getElementById("closeLogin");
  const btn = document.getElementById("loginBtn");
  const nick = document.getElementById("loginNick");
  const pass = document.getElementById("loginPass");
  const msg = document.getElementById("loginMsg");
  const menu = document.getElementById("userMenu");

  if (!open) return;
  await mattLoadUserHeader();

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".user-area")) menu?.classList.remove("show");
  });

  if (close) close.onclick = () => modal?.classList.remove("active");

  const forgot = document.getElementById("forgotPass");
  const resetBox = document.getElementById("resetBox");
  const resetSend = document.getElementById("resetSend");
  const resetEmail = document.getElementById("resetEmail");
  const resetAnswer = document.getElementById("resetAnswer");
  const resetQuestion = document.getElementById("resetQuestion");
  const resetQuestions = [["Ile jest 2 + 2?", "4"], ["Ile dni ma tydzień?", "7"], ["Ile miesięcy ma rok?", "12"], ["Jak ma na imię kapitan Sparrow?", "Jack"], ["Ile nóg ma pies?", "4"], ["Ile nóg ma kot?", "4"], ["Jakiego koloru jest śnieg?", "biały"], ["Jakiego koloru jest trawa?", "zielony"], ["Ile to 5 + 5?", "10"], ["Ile to 10 - 3?", "7"], ["Ile to 3 x 3?", "9"], ["Jaka planeta jest najbliżej Słońca?", "Merkury"], ["Jak nazywa się nasza planeta?", "Ziemia"], ["Ile godzin ma doba?", "24"], ["Ile minut ma godzina?", "60"], ["Ile sekund ma minuta?", "60"], ["Jakie zwierzę mówi miau?", "kot"], ["Jakie zwierzę szczeka?", "pies"], ["Jaki owoc jest żółty i długi?", "banan"], ["Ile palców ma człowiek u jednej dłoni?", "5"], ["Jaki dzień jest po poniedziałku?", "wtorek"], ["Jaki dzień jest przed niedzielą?", "sobota"], ["Stolica Polski?", "Warszawa"], ["W jakim kraju leży Polska?", "Polska"], ["Ile boków ma kwadrat?", "4"], ["Ile boków ma trójkąt?", "3"], ["Ile nóg ma pająk?", "8"], ["Jak nazywa się młode psa?", "szczeniak"], ["Jak nazywa się młode kota?", "kocię"], ["Czym piszemy na papierze?", "długopis"], ["Czym mierzymy czas?", "zegarek"], ["Jak nazywa się gwiazda naszej planety?", "Słońce"], ["Ile to 1+1?", "2"], ["Ile to 20/2?", "10"], ["Jaki kolor ma ogień?", "czerwony"], ["Co daje pszczoła?", "miód"], ["Gdzie mieszka ryba?", "woda"], ["Jak nazywa się statek na morzu?", "statek"], ["Ile kół ma samochód?", "4"], ["Co świeci w nocy na niebie?", "Księżyc"], ["Jak nazywa się pora roku po lecie?", "jesień"], ["Jak nazywa się pora roku po zimie?", "wiosna"], ["Ile uszu ma człowiek?", "2"], ["Ile oczu ma człowiek?", "2"], ["Co robi zegar?", "odmierza czas"], ["Jaki napój robi się z ziaren?", "kawa"], ["Jaki instrument ma klawisze?", "pianino"], ["Jak nazywa się największy ocean?", "spokojny"], ["Co rośnie na drzewie?", "liście"], ["Jaki kształt ma piłka?", "okrągły"]];
  let currentResetAnswer = "";

  if (forgot) {
    forgot.onclick = () => {
      resetBox.style.display = "block";
      const q = resetQuestions[Math.floor(Math.random() * resetQuestions.length)];
      resetQuestion.textContent = q[0];
      currentResetAnswer = q[1].toLowerCase();
    };
  }

  if (resetSend) {
    resetSend.onclick = async () => {
      const email = resetEmail.value.trim();
      const answer = resetAnswer.value.trim().toLowerCase();
      if (answer !== currentResetAnswer) {
        msg.textContent = "Niepoprawna odpowiedź zabezpieczająca";
        return;
      }
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-password.html"
      });
      msg.textContent = error ? "Nie udało się wysłać wiadomości" : "Wysłano wiadomość resetującą";
    };
  }

  if (btn) {
    btn.onclick = async () => {
      msg.textContent = "Logowanie...";
      const { data: p, error: lookupError } = await supabaseClient
        .from("profiles")
        .select("email")
        .ilike("username", nick.value.trim())
        .maybeSingle();

      if (lookupError || !p) {
        msg.textContent = "Nie znaleziono użytkownika";
        return;
      }

      const { error } = await supabaseClient.auth.signInWithPassword({
        email: p.email,
        password: pass.value
      });
      if (error) {
        msg.textContent = "Błędne hasło";
        return;
      }
      location.reload();
    };

    // Enter w polu nicku lub hasła działa tak samo jak kliknięcie ZALOGUJ.
    [nick, pass].forEach(field => {
      field?.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" || event.isComposing) return;
        event.preventDefault();
        btn.click();
      });
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const edit = document.getElementById("editProfileBtn");
  const modal = document.getElementById("profileModal");
  const close = document.getElementById("closeProfile");
  const save = document.getElementById("saveProfile");
  const avatarInput = document.getElementById("profileAvatarFile");
  const avatarPick = document.getElementById("profileAvatarPick");
  const avatarRemove = document.getElementById("profileAvatarRemove");
  const avatarPreview = document.getElementById("profileAvatarPreview");
  const avatarName = document.getElementById("profileAvatarName");
  const newNick = document.getElementById("profileNewNick");
  const newEmail = document.getElementById("profileNewEmail");
  const currentPassword = document.getElementById("profileCurrentPassword");
  const newPassword = document.getElementById("profileNewPassword");
  const newPasswordRepeat = document.getElementById("profileNewPasswordRepeat");
  const msg = document.getElementById("profileMsg");

  if (!edit || !modal) return;

  let selectedAvatarFile = null;
  let avatarRemovalRequested = false;
  let originalAvatarUrl = null;
  let originalAvatarPath = null;
  let session = null;

  const setPreview = (url) => {
    avatarPreview.src = url || MATT_DEFAULT_AVATAR;
    avatarPreview.onerror = () => {
      avatarPreview.onerror = null;
      avatarPreview.src = MATT_DEFAULT_AVATAR;
    };
  };

  const resetSensitiveFields = () => {
    currentPassword.value = "";
    newPassword.value = "";
    newPasswordRepeat.value = "";
  };

  edit.onclick = async () => {
    msg.textContent = "Wczytywanie profilu...";
    modal.classList.add("active");
    selectedAvatarFile = null;
    avatarRemovalRequested = false;
    avatarName.textContent = "Nie wybrano nowego zdjęcia";
    resetSensitiveFields();

    const sessionResult = await supabaseClient.auth.getSession();
    session = sessionResult.data.session;
    if (!session) {
      msg.textContent = "Sesja wygasła. Zaloguj się ponownie.";
      return;
    }

    try {
      const profile = await mattGetOwnProfile(session);
      if (!profile || !("avatar_url" in profile)) {
        msg.textContent = "Funkcja profilu i avatarów wymaga poprawnej konfiguracji profilu użytkownika w Supabase.";
        return;
      }
      newNick.value = profile.username || "";
      newEmail.value = session.user.email || profile.email || "";
      originalAvatarUrl = profile.avatar_url || null;
      originalAvatarPath = profile.avatar_path || null;
      setPreview(originalAvatarUrl);
      msg.textContent = "";
    } catch (error) {
      console.error(error);
      msg.textContent = "Nie udało się wczytać profilu: " + (error.message || "nieznany błąd");
    }
  };

  if (close) close.onclick = () => modal.classList.remove("active");

  avatarPick.onclick = () => avatarInput.click();
  avatarInput.onchange = () => {
    const file = avatarInput.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      msg.textContent = "Wybierz plik graficzny JPG, PNG, WEBP lub GIF.";
      avatarInput.value = "";
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      msg.textContent = "Avatar może mieć maksymalnie 8 MB.";
      avatarInput.value = "";
      return;
    }
    selectedAvatarFile = file;
    avatarRemovalRequested = false;
    avatarName.textContent = file.name;
    setPreview(URL.createObjectURL(file));
    msg.textContent = "";
  };

  avatarRemove.onclick = () => {
    selectedAvatarFile = null;
    avatarInput.value = "";
    avatarRemovalRequested = true;
    avatarName.textContent = "Użyty zostanie avatar domyślny";
    setPreview(null);
    msg.textContent = "Po zapisaniu zostanie ustawiony domyślny avatar.";
  };

  save.onclick = async () => {
    msg.textContent = "Zapisywanie...";
    save.disabled = true;

    let uploaded = null;
    try {
      const sessionResult = await supabaseClient.auth.getSession();
      session = sessionResult.data.session;
      if (!session) throw new Error("Sesja wygasła. Zaloguj się ponownie.");

      const username = newNick.value.trim();
      const email = newEmail.value.trim();
      const password = newPassword.value;
      const passwordRepeat = newPasswordRepeat.value;
      const oldPassword = currentPassword.value;

      if (username.length < 2 || username.length > 32) throw new Error("Nazwa użytkownika musi mieć od 2 do 32 znaków.");
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Podaj poprawny adres e-mail.");
      if (password && password.length < 8) throw new Error("Nowe hasło musi mieć co najmniej 8 znaków.");
      if (password !== passwordRepeat) throw new Error("Nowe hasła nie są takie same.");

      const emailChanged = email.toLowerCase() !== (session.user.email || "").toLowerCase();
      const passwordChanged = Boolean(password);

      if ((emailChanged || passwordChanged) && !oldPassword) {
        throw new Error("Aby zmienić e-mail lub hasło, wpisz obecne hasło.");
      }

      if (emailChanged || passwordChanged) {
        const verify = await supabaseClient.auth.signInWithPassword({
          email: session.user.email,
          password: oldPassword
        });
        if (verify.error) throw new Error("Obecne hasło jest nieprawidłowe.");
      }

      let avatarUrl = originalAvatarUrl;
      let avatarPath = originalAvatarPath;
      let setAvatar = false;

      if (selectedAvatarFile) {
        uploaded = await mattUploadProfileAvatar(selectedAvatarFile, session.user.id, username);
        avatarUrl = uploaded.publicUrl;
        avatarPath = uploaded.path;
        setAvatar = true;
      } else if (avatarRemovalRequested) {
        avatarUrl = null;
        avatarPath = null;
        setAvatar = true;
      }

      const profileUpdate = await supabaseClient.rpc("matt_update_own_profile", {
        p_username: username,
        p_avatar_url: avatarUrl,
        p_avatar_path: avatarPath,
        p_set_avatar: setAvatar
      });
      if (profileUpdate.error) {
        if (uploaded?.path) await mattDeleteProfileAvatar(uploaded.path, session.user.id);
        uploaded = null;
        throw profileUpdate.error;
      }

      let authNote = "";
      if (emailChanged || passwordChanged) {
        const authChanges = {};
        if (emailChanged) authChanges.email = email;
        if (passwordChanged) authChanges.password = password;
        const authUpdate = await supabaseClient.auth.updateUser(authChanges);
        if (authUpdate.error) {
          authNote = " Profil i avatar zapisano, ale nie udało się zmienić danych logowania: " + authUpdate.error.message;
        } else if (emailChanged) {
          authNote = " Zmiana e-mail została zapisana. Jeśli w Supabase jest włączone potwierdzanie zmian adresu, potwierdź ją z wiadomości e-mail.";
        } else if (passwordChanged) {
          authNote = " Hasło zostało zmienione.";
        }
      }

      if (setAvatar && originalAvatarPath && originalAvatarPath !== avatarPath) {
        await mattDeleteProfileAvatar(originalAvatarPath, session.user.id);
      }

      originalAvatarUrl = avatarUrl;
      originalAvatarPath = avatarPath;
      selectedAvatarFile = null;
      avatarRemovalRequested = false;
      avatarInput.value = "";
      avatarName.textContent = "Nie wybrano nowego zdjęcia";
      resetSensitiveFields();
      setPreview(avatarUrl);

      await mattLoadUserHeader();
      msg.textContent = "Profil został zapisany." + authNote;
    } catch (error) {
      console.error(error);
      msg.textContent = error.message || "Nie udało się zapisać profilu.";
    } finally {
      save.disabled = false;
    }
  };
});


// Okresowe sprawdzanie blokady / wymuszonego ponownego logowania.
setInterval(async () => {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) await mattEnforceAccountSecurity(session, window.currentUserProfile);
  } catch (_) {}
}, 60000);
window.addEventListener('focus', async () => {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) await mattEnforceAccountSecurity(session, window.currentUserProfile);
  } catch (_) {}
});
