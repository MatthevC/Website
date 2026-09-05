const MATT_DEFAULT_AVATAR = "pictures/social/default-avatar.svg";


const MATT_PERMISSION_GROUPS = [
  { name: "EVENTY", items: [
    ["events.create","Dodawanie eventów","Tworzenie nowych eventów i wgrywanie grafik."],
    ["events.edit","Edycja eventów","Zmiana istniejących eventów i ich grafik."],
    ["events.delete","Usuwanie eventów","Usuwanie istniejących eventów."]
  ]},
  { name: "PLIKI DO POBRANIA", items: [
    ["downloads.create","Dodawanie plików","Dodawanie nowych plików z dysku."],
    ["downloads.edit","Edycja plików","Zmiana danych i podmiana plików."],
    ["downloads.delete","Usuwanie plików","Usuwanie własnych wpisów i ukrywanie plików z GitHuba."],
    ["downloads.reorder","Zmiana kolejności","Przestawianie kolejności plików."]
  ]},
  { name: "STRONA / TREŚCI", items: [
    ["page.text.edit","Edycja tekstów","Wizualna edycja tekstów na każdej podstronie."],
    ["page.callouts.manage","Komunikaty","Dodawanie, edycja i usuwanie komunikatów."],
    ["page.images.manage","Grafiki podstron","Zmiana obrazów i grafik nagłówkowych."],
    ["home.hero.manage","Grafika powitalna","Zmiana głównej grafiki strony startowej."],
    ["site.navigation.manage","Menu / kategorie","Edycja kategorii i podkategorii w menu."],
    ["site.links.manage","Linki social media","Zmiana linków Twitch, Discord, Instagram i TikTok."],
    ["github.restore","Cofanie do wersji z GitHuba","Usuwanie nadpisań CMS i przywracanie wersji bazowej."]
  ]},
  { name: "REGULAMINY / MODERACJA / STREAMERZY", items: [
    ["rules.manage","Regulaminy","Dodawanie, edycja, usuwanie i kolejność zasad."],
    ["streamers.manage","Polecani streamerzy","Pełna edycja listy polecanych streamerów."],
    ["streamers.autofill","Automatyczna konfiguracja Twitch","Pobieranie danych streamera przez Twitch API."],
    ["moderation.people.manage","Osoby w moderacji","Edycja składu moderacji i zdjęć."],
    ["moderation.benefits.manage","Korzyści moderacji","Edycja listy korzyści."],
    ["commands.manage","Komendy","Edycja komend widza, VIP i moderacji."]
  ]},
  { name: "DISCORD / KONTAKT", items: [
    ["discord.channels.manage","Opis kanałów Discord","Kategorie, kanały, opisy i kolejność."],
    ["discord.join.manage","Dołączanie / podgląd Discorda","Edycja podglądu i komunikatów Discorda."],
    ["contact.topics.manage","Wnioski / Kontakt","Edycja tematów formularza kontaktowego."]
  ]},
  { name: "BACKUPY", items: [
    ["backups.view","Dostęp do backupów","Podgląd i pobieranie kopii bezpieczeństwa."],
    ["backups.manual.create","Tworzenie ręcznych backupów","Tworzenie zapisów w kategorii Ręczne zapisy."],
    ["backups.restore","Przywracanie backupów","Przywracanie kopii zapisanych na liście."],
    ["backups.import","Import backupu JSON","Wczytywanie kopii bezpieczeństwa z dysku."],
    ["backups.delete.automatic","Usuwanie automatycznych zapisów","Ręczne usuwanie automatycznych kopii."],
    ["backups.delete.manual","Usuwanie ręcznych zapisów","Usuwanie ręcznych kopii bezpieczeństwa."]
  ]},
  { name: "KONTROLA", items: [
    ["audit.view","Logi zmian","Dostęp do historii działań z ostatnich 14 dni."]
  ]}
];

window.currentUserRole = "guest";
window.currentUserPermissions = [];
window.currentUserIsAdmin = false;
window.mattCan = function(permission) {
  if (window.currentUserIsAdmin === true) return true;
  return Array.isArray(window.currentUserPermissions) && window.currentUserPermissions.includes(permission);
};
window.mattCanAny = function(...permissions) {
  return permissions.flat().some(permission => window.mattCan(permission));
};

function mattApplyAccess(role = "user", permissions = []) {
  const normalizedRole = String(role || "user").toLowerCase();
  const normalizedPermissions = Array.isArray(permissions) ? [...new Set(permissions.map(String))] : [];
  window.currentUserRole = normalizedRole;
  window.currentUserPermissions = normalizedPermissions;
  window.currentUserIsAdmin = normalizedRole === "admin";
  window.dispatchEvent(new CustomEvent("matt-auth-change", {
    detail: { isAdmin: window.currentUserIsAdmin, role: normalizedRole, permissions: normalizedPermissions }
  }));
}

async function mattLoadOwnAccess(profile) {
  try {
    const { data, error } = await supabaseClient.rpc("matt_get_my_access");
    if (error) throw error;
    const access = data && typeof data === "object" ? data : {};
    mattApplyAccess(access.role || profile?.role || "user", Array.isArray(access.permissions) ? access.permissions : []);
  } catch (error) {
    // Kompatybilność przed uruchomieniem migracji v2.5.1.
    const fallbackRole = String(profile?.role || "user").toLowerCase();
    mattApplyAccess(fallbackRole, []);
    if (fallbackRole === "moderator") {
      console.warn("[MATT ACCESS] Brakuje migracji ról/uprawnień v2.5.1:", error?.message || error);
    }
  }
}


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
  if (a.startsWith("account.") || a.startsWith("access.")) return "KONTA / UPRAWNIENIA";
  if (a.startsWith("profile.") || a.startsWith("auth.")) return "PROFIL / KONTO";
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
    "backup.automatic.created": "Utworzono automatyczny zapis",
    "backup.manual.created": "Utworzono ręczny zapis",
    "backup.automatic.deleted": "Usunięto automatyczny zapis",
    "backup.manual.deleted": "Usunięto ręczny zapis",
    "account.created": "Utworzono konto",
    "access.changed": "Zmieniono rolę / uprawnienia"
  };
  return labels[action] || String(action || "Zdarzenie");
}

function mattAuditFormatDate(value) {
  try {
    return new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "medium" }).format(new Date(value));
  } catch (_) {
    return String(value || "");
  }
}

async function mattOpenAuditLogs() {
  if (!window.mattCan?.("audit.view")) return;

  let modal = document.getElementById("adminAuditModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "adminAuditModal";
    modal.className = "audit-modal";
    modal.innerHTML = `
      <div class="audit-box" role="dialog" aria-modal="true" aria-labelledby="auditTitle">
        <header class="audit-head">
          <div><span>UPRAWNIENIE: LOGI ZMIAN</span><h2 id="auditTitle">LOGI ZMIAN</h2><p>Historia działań z ostatnich 14 dni. Hasła, tokeny i sekrety nigdy nie są zapisywane w logach.</p></div>
          <button type="button" class="audit-close" aria-label="Zamknij">×</button>
        </header>
        <div class="audit-toolbar">
          <input type="search" data-audit-search placeholder="Szukaj użytkownika, akcji, sekcji…">
          <select data-audit-category>
            <option value="">Wszystkie kategorie</option>
            <option value="CMS / STRONA">CMS / STRONA</option>
            <option value="EVENTY">EVENTY</option>
            <option value="PROFIL / KONTO">PROFIL / KONTO</option>
            <option value="KONTA / UPRAWNIENIA">KONTA / UPRAWNIENIA</option>
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
      return `<article class="audit-item">
        <div class="audit-item-top">
          <div><span class="audit-category">${mattAuditEscape(mattAuditCategory(row.action))}</span><strong>${mattAuditEscape(mattAuditActionLabel(row.action))}</strong></div>
          <time>${mattAuditEscape(mattAuditFormatDate(row.created_at))}</time>
        </div>
        <p class="audit-summary-text">${mattAuditEscape(row.summary || "Brak dodatkowego opisu.")}</p>
        <div class="audit-meta"><span><b>Kto:</b> ${mattAuditEscape(actor + actorExtra)}</span><span><b>Obiekt:</b> ${mattAuditEscape(row.entity_type || "—")}${row.entity_id ? ` / ${mattAuditEscape(row.entity_id)}` : ""}</span></div>
        ${details ? `<details class="audit-details"><summary>Pokaż szczegóły zmiany</summary><pre>${mattAuditEscape(details)}</pre></details>` : ""}
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
      if (list) list.innerHTML = `<div class="audit-empty">${mattAuditEscape(error.message || "Błąd odczytu logów")}.<br><br>Uruchom plik <b>CMS_UPDATE_AUDIT_BACKUPS.sql</b> w Supabase.</div>`;
    } finally {
      if (refresh) refresh.disabled = false;
    }
  };

  search.oninput = render;
  category.onchange = render;
  refresh.onclick = load;
  await load();
}


function mattRoleLabel(role = "user") {
  const value = String(role || "user").toLowerCase();
  if (value === "admin") return "ADMINISTRATOR";
  if (value === "moderator") return "MODERATOR";
  return "UŻYTKOWNIK";
}

function mattAllPermissionKeys() {
  return MATT_PERMISSION_GROUPS.flatMap(group => group.items.map(item => item[0]));
}

async function mattOpenAccountManager() {
  if (window.currentUserIsAdmin !== true) return;

  let modal = document.getElementById("accountManagerModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "accountManagerModal";
    modal.className = "accounts-modal";
    modal.innerHTML = `
      <div class="accounts-box" role="dialog" aria-modal="true" aria-labelledby="accountsTitle">
        <header class="accounts-head">
          <div><span>TYLKO ADMINISTRATOR</span><h2 id="accountsTitle">ZARZĄDZAJ KONTAMI</h2><p>Twórz konta i nadawaj role. Moderator otrzymuje wyłącznie zaznaczone uprawnienia.</p></div>
          <button type="button" class="accounts-close" aria-label="Zamknij">×</button>
        </header>
        <div class="accounts-toolbar">
          <input type="search" data-account-search placeholder="Szukaj po nicku lub e-mailu…">
          <button type="button" class="accounts-primary" data-account-new>+ NOWE KONTO</button>
          <button type="button" data-account-refresh>ODŚWIEŻ</button>
        </div>
        <div class="accounts-layout">
          <aside class="accounts-list" data-account-list><div class="accounts-empty">Ładowanie kont…</div></aside>
          <main class="accounts-main" data-account-main><div class="accounts-empty">Wybierz konto z listy albo utwórz nowe.</div></main>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector(".accounts-close")?.addEventListener("click", () => modal.classList.remove("active"));
    modal.addEventListener("click", event => { if (event.target === modal) modal.classList.remove("active"); });
  }

  modal.classList.add("active");
  const listEl = modal.querySelector("[data-account-list]");
  const mainEl = modal.querySelector("[data-account-main]");
  const searchEl = modal.querySelector("[data-account-search]");
  const newBtn = modal.querySelector("[data-account-new]");
  const refreshBtn = modal.querySelector("[data-account-refresh]");
  let accounts = [];
  let selectedUserId = null;

  const renderList = () => {
    if (!listEl) return;
    const needle = String(searchEl?.value || "").trim().toLowerCase();
    const filtered = accounts.filter(account => !needle || [account.username, account.email, account.role].filter(Boolean).join(" ").toLowerCase().includes(needle));
    listEl.innerHTML = filtered.length ? filtered.map(account => {
      const own = account.auth_user_id === window.currentUserProfile?.auth_user_id;
      const permissionCount = account.role === "admin" ? mattAllPermissionKeys().length : (Array.isArray(account.permissions) ? account.permissions.length : 0);
      return `<button type="button" class="account-row ${selectedUserId === account.auth_user_id ? "active" : ""}" data-account-id="${mattAuditEscape(account.auth_user_id)}">
        <img src="${mattAuditEscape(account.avatar_url || MATT_DEFAULT_AVATAR)}" alt="">
        <span><strong>${mattAuditEscape(account.username || "Użytkownik")}${own ? ' <em>TO TY</em>' : ""}</strong><small>${mattAuditEscape(account.email || "")}</small></span>
        <b class="account-role account-role-${mattAuditEscape(account.role || "user")}">${mattAuditEscape(mattRoleLabel(account.role))}</b>
        <i>${permissionCount} upr.</i>
      </button>`;
    }).join("") : '<div class="accounts-empty">Brak kont pasujących do wyszukiwania.</div>';
    listEl.querySelectorAll("[data-account-id]").forEach(button => button.addEventListener("click", () => openAccessEditor(button.dataset.accountId)));
  };

  const loadAccounts = async ({ keepSelection = true } = {}) => {
    if (refreshBtn) refreshBtn.disabled = true;
    if (listEl) listEl.innerHTML = '<div class="accounts-empty">Ładowanie kont…</div>';
    try {
      const { data, error } = await supabaseClient.rpc("matt_admin_list_accounts");
      if (error) throw error;
      accounts = (data || []).map(account => ({ ...account, role: String(account.role || "user").toLowerCase(), permissions: Array.isArray(account.permissions) ? account.permissions : [] }));
      if (!keepSelection) selectedUserId = null;
      renderList();
      if (selectedUserId && accounts.some(account => account.auth_user_id === selectedUserId)) openAccessEditor(selectedUserId, false);
    } catch (error) {
      console.error("Nie udało się wczytać kont:", error);
      if (listEl) listEl.innerHTML = `<div class="accounts-empty">${mattAuditEscape(error.message || "Błąd odczytu kont")}<br><br>Uruchom <b>CMS_UPDATE_ROLES_PERMISSIONS.sql</b> w Supabase.</div>`;
    } finally {
      if (refreshBtn) refreshBtn.disabled = false;
    }
  };

  const permissionHtml = (selected = [], disabled = false) => {
    const checked = new Set(selected);
    return MATT_PERMISSION_GROUPS.map(group => `<fieldset class="account-permission-group"><legend>${mattAuditEscape(group.name)}</legend>${group.items.map(([key,label,description]) => `<label class="account-permission-item"><input type="checkbox" value="${mattAuditEscape(key)}" data-account-permission ${checked.has(key) ? "checked" : ""} ${disabled ? "disabled" : ""}><span><strong>${mattAuditEscape(label)}</strong><small>${mattAuditEscape(description)}</small></span></label>`).join("")}</fieldset>`).join("");
  };

  const syncPermissionEditor = (container, role) => {
    const roleValue = String(role || "user");
    const permissionsWrap = container.querySelector("[data-account-permissions-wrap]");
    const info = container.querySelector("[data-role-info]");
    const checkboxes = [...container.querySelectorAll("[data-account-permission]")];
    const bulk = container.querySelector("[data-permission-bulk]");
    if (roleValue === "admin") {
      permissionsWrap.hidden = false;
      checkboxes.forEach(box => { box.checked = true; box.disabled = true; });
      if (bulk) bulk.hidden = true;
      if (info) info.innerHTML = "<strong>Administrator</strong> automatycznie ma wszystkie uprawnienia. Nie trzeba ich zaznaczać osobno.";
    } else if (roleValue === "moderator") {
      permissionsWrap.hidden = false;
      checkboxes.forEach(box => { box.disabled = false; });
      if (bulk) bulk.hidden = false;
      if (info) info.innerHTML = "<strong>Moderator</strong> może wykonywać wyłącznie operacje zaznaczone poniżej. Kontrola działa również po stronie Supabase.";
    } else {
      permissionsWrap.hidden = true;
      checkboxes.forEach(box => { box.checked = false; box.disabled = false; });
      if (bulk) bulk.hidden = true;
      if (info) info.innerHTML = "<strong>Użytkownik</strong> nie ma narzędzi administracyjnych ani moderatorskich.";
    }
  };

  const openAccessEditor = (userId, rerenderList = true) => {
    const account = accounts.find(item => item.auth_user_id === userId);
    if (!account || !mainEl) return;
    selectedUserId = userId;
    if (rerenderList) renderList();
    const own = account.auth_user_id === window.currentUserProfile?.auth_user_id;
    const selectedPermissions = account.role === "admin" ? mattAllPermissionKeys() : account.permissions;
    mainEl.innerHTML = `<section class="account-editor">
      <div class="account-editor-title"><div><span>UPRAWNIENIA KONTA</span><h3>${mattAuditEscape(account.username || "Użytkownik")}</h3><p>${mattAuditEscape(account.email || "")}</p></div><b class="account-role account-role-${mattAuditEscape(account.role)}">${mattAuditEscape(mattRoleLabel(account.role))}</b></div>
      <label class="account-role-select">Rola
        <select data-account-role ${own && account.role === "admin" ? "disabled" : ""}>
          <option value="user" ${account.role === "user" ? "selected" : ""}>Użytkownik — brak uprawnień</option>
          <option value="moderator" ${account.role === "moderator" ? "selected" : ""}>Moderator — wybierz uprawnienia</option>
          <option value="admin" ${account.role === "admin" ? "selected" : ""}>Administrator — pełne uprawnienia</option>
        </select>
      </label>
      ${own && account.role === "admin" ? '<div class="account-warning">Dla bezpieczeństwa nie możesz odebrać sobie roli administratora z poziomu strony.</div>' : ""}
      <div class="account-role-info" data-role-info></div>
      <div class="account-permission-bulk" data-permission-bulk><button type="button" data-check-all>ZAZNACZ WSZYSTKO</button><button type="button" data-clear-all>WYCZYŚĆ</button></div>
      <div class="account-permissions" data-account-permissions-wrap>${permissionHtml(selectedPermissions, account.role === "admin")}</div>
      <div class="account-editor-actions"><button type="button" class="accounts-primary" data-save-access>ZAPISZ ROLĘ I UPRAWNIENIA</button></div>
    </section>`;
    const roleSelect = mainEl.querySelector("[data-account-role]");
    syncPermissionEditor(mainEl, roleSelect?.value || account.role);
    roleSelect?.addEventListener("change", () => syncPermissionEditor(mainEl, roleSelect.value));
    mainEl.querySelector("[data-check-all]")?.addEventListener("click", () => mainEl.querySelectorAll("[data-account-permission]").forEach(box => box.checked = true));
    mainEl.querySelector("[data-clear-all]")?.addEventListener("click", () => mainEl.querySelectorAll("[data-account-permission]").forEach(box => box.checked = false));
    mainEl.querySelector("[data-save-access]")?.addEventListener("click", async event => {
      const button = event.currentTarget;
      button.disabled = true;
      button.textContent = "ZAPISYWANIE…";
      try {
        const role = roleSelect?.value || "user";
        const permissions = role === "moderator" ? [...mainEl.querySelectorAll("[data-account-permission]:checked")].map(box => box.value) : [];
        const { error } = await supabaseClient.rpc("matt_admin_set_account_access", { p_user_id: account.auth_user_id, p_role: role, p_permissions: permissions });
        if (error) throw error;
        await loadAccounts({ keepSelection: true });
      } catch (error) {
        alert(error.message || "Nie udało się zapisać uprawnień.");
      } finally {
        button.disabled = false;
        button.textContent = "ZAPISZ ROLĘ I UPRAWNIENIA";
      }
    });
  };

  const openCreateForm = () => {
    selectedUserId = null;
    renderList();
    if (!mainEl) return;
    mainEl.innerHTML = `<section class="account-create">
      <div class="account-editor-title"><div><span>NOWE KONTO</span><h3>UTWÓRZ UŻYTKOWNIKA</h3><p>Nowe konto zawsze powstaje jako zwykły użytkownik bez uprawnień. Rolę nadajesz później z listy.</p></div></div>
      <form data-create-account-form>
        <label>Nick / nazwa użytkownika<input name="username" minlength="2" maxlength="32" required autocomplete="off"></label>
        <label>E-mail<input name="email" type="email" required autocomplete="off"></label>
        <label>Hasło tymczasowe<div class="account-password-row"><input name="password" type="text" minlength="8" required autocomplete="off"><button type="button" data-generate-password>GENERUJ</button></div><small>Przekaż hasło użytkownikowi bezpiecznym kanałem. Użytkownik może je później sam zmienić w „Edytuj profil”.</small></label>
        <div class="account-warning">Po utworzeniu konto nie ma żadnych uprawnień. Dopiero z listy wybierasz Moderator lub Administrator.</div>
        <button class="accounts-primary" type="submit">UTWÓRZ KONTO</button>
        <p data-create-account-msg></p>
      </form>
    </section>`;
    const form = mainEl.querySelector("[data-create-account-form]");
    const msg = mainEl.querySelector("[data-create-account-msg]");
    mainEl.querySelector("[data-generate-password]")?.addEventListener("click", () => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
      const values = crypto.getRandomValues(new Uint32Array(16));
      form.elements.password.value = [...values].map(value => chars[value % chars.length]).join("");
    });
    form?.addEventListener("submit", async event => {
      event.preventDefault();
      const submit = form.querySelector('button[type="submit"]');
      submit.disabled = true;
      submit.textContent = "TWORZENIE…";
      msg.textContent = "";
      try {
        const payload = { action: "create", username: form.elements.username.value.trim(), email: form.elements.email.value.trim(), password: form.elements.password.value };
        const { data, error } = await supabaseClient.functions.invoke("admin-manage-users", { body: payload });
        if (error) {
          let message = error.message || "Nie udało się utworzyć konta.";
          try { if (error.context?.json) { const body = await error.context.json(); if (body?.error) message = body.error; } } catch (_) {}
          throw new Error(message);
        }
        if (!data?.ok) throw new Error(data?.error || "Nie udało się utworzyć konta.");
        msg.textContent = `Konto ${data.username || payload.username} zostało utworzone jako Użytkownik.`;
        await loadAccounts({ keepSelection: false });
        if (data.userId) openAccessEditor(data.userId);
      } catch (error) {
        msg.textContent = `${error.message || "Błąd tworzenia konta"} Jeśli funkcja nie jest wdrożona, utwórz Edge Function „admin-manage-users”.`;
      } finally {
        submit.disabled = false;
        submit.textContent = "UTWÓRZ KONTO";
      }
    });
  };

  searchEl.oninput = renderList;
  newBtn.onclick = openCreateForm;
  refreshBtn.onclick = () => loadAccounts({ keepSelection: true });
  await loadAccounts({ keepSelection: false });
}

window.mattOpenAccountManager = mattOpenAccountManager;


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
    .select("username,email,role,avatar_url,avatar_path,auth_user_id")
    .eq("auth_user_id", session.user.id)
    .maybeSingle();

  if (result.error && /auth_user_id|avatar_/i.test(result.error.message || "")) {
    // Czytelny komunikat pojawi się w edycji profilu; tutaj zachowujemy działanie starego logowania.
    result = await supabaseClient
      .from("profiles")
      .select("username,email,role")
      .eq("email", session.user.email)
      .maybeSingle();
  } else if (!result.data) {
    result = await supabaseClient
      .from("profiles")
      .select("username,email,role,avatar_url,avatar_path,auth_user_id")
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
  if (!open) return;

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.currentUserProfile = null;
    mattApplyAccess("guest", []);
    mattSetHeaderUser(null);
    if (auditLogs) auditLogs.hidden = true;
    if (manageAccounts) manageAccounts.hidden = true;
    open.onclick = () => modal?.classList.add("active");
    return;
  }

  try {
    const profile = await mattGetOwnProfile(session);
    if (!profile) {
      mattSetHeaderUser({ username: session.user.email?.split("@")[0] || "UŻYTKOWNIK", avatar_url: null });
      if (auditLogs) auditLogs.hidden = true;
      if (manageAccounts) manageAccounts.hidden = true;
      mattApplyAccess("user", []);
      return;
    }

    window.currentUserProfile = profile;
    await mattLoadOwnAccess(profile);
    const canAudit = window.mattCan("audit.view");
    if (auditLogs) {
      auditLogs.hidden = !canAudit;
      auditLogs.onclick = canAudit ? (() => { menu?.classList.remove("show"); mattOpenAuditLogs(); }) : null;
    }
    if (manageAccounts) {
      manageAccounts.hidden = !window.currentUserIsAdmin;
      manageAccounts.onclick = window.currentUserIsAdmin ? (() => { menu?.classList.remove("show"); mattOpenAccountManager(); }) : null;
    }
    mattSetHeaderUser(profile);

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
        .eq("username", nick.value.trim())
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
        msg.innerHTML = "Aby korzystać z nowego profilu i avatarów, uruchom najpierw plik <b>CMS_UPDATE_USER_PROFILE.sql</b> w Supabase.";
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
