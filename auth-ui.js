const MATT_DEFAULT_AVATAR = "pictures/social/default-avatar.svg";

window.currentUserRole = window.currentUserRole || "guest";
window.currentUserPermissions = window.currentUserPermissions || [];
window.mattHasPermission = function(permission) {
  if (window.currentUserRole === "admin" || window.currentUserIsAdmin === true) return true;
  return Array.isArray(window.currentUserPermissions) && window.currentUserPermissions.includes(permission);
};

async function mattLoadAccessState() {
  try {
    const { data, error } = await supabaseClient.rpc("matt_get_my_access");
    if (error) throw error;
    const role = String(data?.role || "user").toLowerCase();
    const permissions = Array.isArray(data?.permissions) ? data.permissions : [];
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
    "access.changed": "Zmieniono rolę / uprawnienia",
    "backup.automatic.created": "Utworzono automatyczny zapis",
    "backup.manual.created": "Utworzono ręczny zapis",
    "backup.automatic.deleted": "Usunięto automatyczny zapis",
    "backup.manual.deleted": "Usunięto ręczny zapis"
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
    const access = await mattLoadAccessState();
    window.dispatchEvent(new CustomEvent("matt-auth-change", { detail: { isAdmin: access.isAdmin, role: access.role, permissions: access.permissions } }));
    const canViewAudit = window.mattHasPermission?.("audit.view") === true;
    if (auditLogs) { auditLogs.hidden = !canViewAudit; auditLogs.onclick = canViewAudit ? (() => { menu?.classList.remove("show"); mattOpenAuditLogs(); }) : null; }
    if (manageAccounts) { manageAccounts.hidden = !access.isAdmin; manageAccounts.onclick = access.isAdmin ? (() => { menu?.classList.remove("show"); mattOpenAccountManager(); }) : null; }
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
  if (window.currentUserIsAdmin !== true) return;
  let modal = document.getElementById("accountManagerModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "accountManagerModal";
    modal.className = "account-manager-modal";
    modal.innerHTML = `<div class="account-manager-box" role="dialog" aria-modal="true">
      <header class="account-manager-head"><div><span>TYLKO ADMINISTRATOR</span><h2>ZARZĄDZAJ KONTAMI</h2><p>Twórz konta tymczasowe i przypisuj role oraz dokładne uprawnienia moderatorów.</p></div><button type="button" data-account-close>×</button></header>
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
  let selectedId = null;

  const load = async () => {
    body.innerHTML = `<div class="account-loading">Ładowanie kont…</div>`;
    const [accountsRes, catalogRes] = await Promise.all([
      supabaseClient.rpc("matt_admin_list_accounts"),
      supabaseClient.from("matt_permission_catalog").select("permission,group_name,label,description,sort_order").order("sort_order")
    ]);
    if (accountsRes.error) throw accountsRes.error;
    if (catalogRes.error) throw catalogRes.error;
    accounts = accountsRes.data || [];
    catalog = catalogRes.data || [];
    draw();
  };

  const groupCatalog = () => {
    const groups = new Map();
    catalog.forEach(item => {
      if (!groups.has(item.group_name)) groups.set(item.group_name, []);
      groups.get(item.group_name).push(item);
    });
    return groups;
  };

  const accountStatus = account => {
    const technical = /@pending\.mattsworld\.invalid$/i.test(String(account.email || ""));
    if (technical) return `<span class="account-badge pending">PIERWSZE LOGOWANIE</span>`;
    if (account.role === "admin") return `<span class="account-badge admin">ADMIN</span>`;
    if (account.role === "moderator") return `<span class="account-badge moderator">MODERATOR · ${(account.permissions || []).length} upr.</span>`;
    return `<span class="account-badge user">UŻYTKOWNIK</span>`;
  };

  const draw = () => {
    const selected = accounts.find(a => a.auth_user_id === selectedId) || null;
    body.innerHTML = `<div class="account-manager-grid">
      <section class="account-list-panel">
        <div class="account-panel-title"><div><small>KONTA</small><strong>${accounts.length} użytkowników</strong></div><button class="account-primary" type="button" data-new-account>+ NOWE KONTO</button></div>
        <div class="account-list">${accounts.map(a => `<button type="button" class="account-row ${selectedId===a.auth_user_id?'active':''}" data-account-id="${mattAccountEscape(a.auth_user_id)}"><img src="${mattAccountEscape(a.avatar_url || MATT_DEFAULT_AVATAR)}" alt=""><span><strong>${mattAccountEscape(a.username || 'Użytkownik')}</strong><small>${/@pending\.mattsworld\.invalid$/i.test(String(a.email||'')) ? 'E-mail ustawi przy pierwszym logowaniu' : mattAccountEscape(a.email || 'Brak e-maila')}</small></span>${accountStatus(a)}</button>`).join("")}</div>
      </section>
      <section class="account-edit-panel">${selected ? renderSelected(selected) : `<div class="account-empty"><strong>Wybierz konto</strong><p>Kliknij użytkownika z listy albo utwórz nowe konto tymczasowe.</p></div>`}</section>
    </div>`;

    body.querySelectorAll("[data-account-id]").forEach(btn => btn.addEventListener("click", () => { selectedId = btn.dataset.accountId; draw(); }));
    body.querySelector("[data-new-account]")?.addEventListener("click", renderCreate);
    bindSelected(selected);
  };

  const renderSelected = account => {
    const groups = groupCatalog();
    return `<div class="account-editor-head"><div><small>EDYCJA KONTA</small><h3>${mattAccountEscape(account.username || 'Użytkownik')}</h3><p>${/@pending\.mattsworld\.invalid$/i.test(String(account.email||'')) ? 'Konto oczekuje na pierwsze logowanie i ustawienie prawdziwego e-maila.' : mattAccountEscape(account.email || '')}</p></div>${accountStatus(account)}</div>
      <label class="account-field">Rola<select data-account-role><option value="user" ${account.role==='user'?'selected':''}>Użytkownik</option><option value="moderator" ${account.role==='moderator'?'selected':''}>Moderator</option><option value="admin" ${account.role==='admin'?'selected':''}>Administrator</option></select></label>
      <div class="account-role-note" data-role-note></div>
      <div class="account-permissions" data-permissions ${account.role==='moderator'?'':'hidden'}>${[...groups.entries()].map(([group, items]) => `<section><h4>${mattAccountEscape(group)}</h4>${items.map(item => `<label class="account-permission"><input type="checkbox" value="${mattAccountEscape(item.permission)}" ${(account.permissions||[]).includes(item.permission)?'checked':''}><span><strong>${mattAccountEscape(item.label)}</strong><small>${mattAccountEscape(item.description || '')}</small></span></label>`).join('')}</section>`).join('')}</div>
      <div class="account-editor-actions"><button class="account-primary" type="button" data-save-access>ZAPISZ ROLĘ I UPRAWNIENIA</button></div>
      <p class="account-message" data-account-message></p>`;
  };

  const bindSelected = account => {
    if (!account) return;
    const role = body.querySelector("[data-account-role]");
    const perms = body.querySelector("[data-permissions]");
    const note = body.querySelector("[data-role-note]");
    const sync = () => {
      const value = role?.value || "user";
      if (perms) perms.hidden = value !== "moderator";
      if (note) note.textContent = value === "admin" ? "Administrator automatycznie otrzymuje wszystkie uprawnienia." : value === "moderator" ? "Zaznacz dokładnie te czynności, które moderator może wykonywać." : "Zwykły użytkownik nie ma dostępu do narzędzi administracyjnych.";
    };
    role?.addEventListener("change", sync); sync();
    body.querySelector("[data-save-access]")?.addEventListener("click", async () => {
      const button = body.querySelector("[data-save-access]");
      const message = body.querySelector("[data-account-message]");
      const selectedRole = role?.value || "user";
      const selectedPermissions = selectedRole === "moderator" ? [...body.querySelectorAll("[data-permissions] input:checked")].map(x => x.value) : [];
      button.disabled = true; if (message) message.textContent = "Zapisywanie…";
      try {
        const { error } = await supabaseClient.rpc("matt_admin_set_account_access", { p_user_id: account.auth_user_id, p_role: selectedRole, p_permissions: selectedPermissions });
        if (error) throw error;
        if (message) message.textContent = "Uprawnienia zapisane.";
        await load();
        selectedId = account.auth_user_id;
        draw();
      } catch (error) { if (message) message.textContent = error?.message || "Nie udało się zapisać."; }
      finally { button.disabled = false; }
    });
  };

  const renderCreate = () => {
    body.innerHTML = `<div class="account-create-card"><button type="button" class="account-back" data-back-accounts>← WRÓĆ DO LISTY</button><small>NOWE KONTO TYMCZASOWE</small><h3>UTWÓRZ UŻYTKOWNIKA</h3><p>Podaj tylko nick i hasło tymczasowe. Przy pierwszym logowaniu użytkownik będzie musiał podać swój e-mail i ustawić nowe hasło.</p>
      <label class="account-field">Nick<input data-create-username maxlength="32" autocomplete="off" placeholder="np. NowyModerator"></label>
      <label class="account-field">Hasło tymczasowe<input data-create-password type="password" autocomplete="new-password" placeholder="Minimum 8 znaków"></label>
      <button class="account-primary" type="button" data-create-submit>UTWÓRZ KONTO</button><p class="account-message" data-create-message></p></div>`;
    body.querySelector("[data-back-accounts]")?.addEventListener("click", draw);
    body.querySelector("[data-create-submit]")?.addEventListener("click", async () => {
      const username = String(body.querySelector("[data-create-username]")?.value || "").trim();
      const password = String(body.querySelector("[data-create-password]")?.value || "");
      const button = body.querySelector("[data-create-submit]");
      const message = body.querySelector("[data-create-message]");
      if (username.length < 2) { message.textContent = "Nick musi mieć co najmniej 2 znaki."; return; }
      if (password.length < 8) { message.textContent = "Hasło tymczasowe musi mieć co najmniej 8 znaków."; return; }
      button.disabled = true; message.textContent = "Tworzenie konta…";
      try {
        const { data, error } = await supabaseClient.functions.invoke("admin-manage-users", { body: { action: "create", username, password } });
        if (error) throw error;
        if (!data?.ok) throw new Error(data?.error || "Nie udało się utworzyć konta.");
        message.textContent = "Konto utworzone. Użytkownik przy pierwszym logowaniu ustawi swój e-mail i nowe hasło.";
        selectedId = data.userId;
        await load();
      } catch (error) { message.textContent = error?.message || "Nie udało się utworzyć konta."; }
      finally { button.disabled = false; }
    });
  };

  try { await load(); }
  catch (error) { body.innerHTML = `<div class="account-empty"><strong>Nie udało się otworzyć zarządzania kontami.</strong><p>${mattAccountEscape(error?.message || 'Nieznany błąd')}</p></div>`; }
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
