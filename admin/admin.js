function dashEsc(value){
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char] || char));
}
function dashFmt(value){
  if (!value) return 'brak daty';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'brak daty';
  return new Intl.DateTimeFormat('pl-PL',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(date);
}
function dashRel(value){
  if (!value) return 'brak aktywności';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'brak aktywności';
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'przed chwilą';
  if (min < 60) return `${min} min temu`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} godz. temu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} dni temu`;
  return dashFmt(value);
}

async function loadAdminDashboard(){
  const set = (selector, value) => { const node = document.querySelector(selector); if (node) node.textContent = value; };
  const recentChanges = document.getElementById('recentChanges');
  const inactiveMods = document.getElementById('inactiveMods');
  set('#dashViewerRole', String(window.currentUserRole || 'użytkownik').toUpperCase());
  set('#dashViewerPermissions', window.currentUserIsAdmin ? 'Pełny dostęp' : String(Array.isArray(window.currentUserPermissions) ? window.currentUserPermissions.length : 0));
  if (recentChanges) recentChanges.innerHTML = '<div class="empty-state">Ładowanie aktywności...</div>';
  if (inactiveMods) inactiveMods.innerHTML = '<div class="empty-state">Sprawdzanie aktywności moderatorów...</div>';
  try{
    const sinceToday = new Date(); sinceToday.setHours(0,0,0,0);
    const inactiveThreshold = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const [profilesCountRes, moderatorsRes, auditRes] = await Promise.all([
      supabaseClient.from('profiles').select('id',{count:'exact',head:true}),
      supabaseClient.from('profiles').select('id, username, email, role').eq('role','moderator'),
      supabaseClient.from('audit_logs').select('actor_id, actor_email, action, target_table, entity_type, created_at').order('created_at',{ascending:false}).limit(80)
    ]);
    if (profilesCountRes.error) throw profilesCountRes.error;
    if (moderatorsRes.error) throw moderatorsRes.error;
    if (auditRes.error) throw auditRes.error;
    const moderators = moderatorsRes.data || [];
    const logs = auditRes.data || [];
    const todayLogs = logs.filter(item => item?.created_at && new Date(item.created_at) >= sinceToday);
    const actorsToday = new Set(todayLogs.map(item => item?.actor_email || item?.actor_id).filter(Boolean));

    set('#dashUsers', String(profilesCountRes.count ?? 0));
    set('#dashModerators', String(moderators.length));
    set('#dashLogsToday', String(todayLogs.length));
    set('#dashStatusText', 'OK');
    set('#dashStatusHint', logs.length ? 'Połączono z logami i profilami' : 'Połączono, brak zapisanych zmian');
    set('#dashActorsToday', String(actorsToday.size));
    set('#dashRecentTotal', String(logs.length));
    set('#dashLastUpdate', logs[0]?.created_at ? dashFmt(logs[0].created_at) : 'Brak aktywności');

    if (recentChanges) recentChanges.innerHTML = logs.length ? logs.slice(0,6).map(item => `<article class="activity-item"><div class="activity-icon">↻</div><div class="activity-main"><div class="activity-title">${dashEsc(item?.action || 'Zmiana w systemie')}</div><div class="activity-text">${dashEsc(item?.actor_email || 'Nieznany użytkownik')} wprowadził zmianę w sekcji ${dashEsc(item?.target_table || item?.entity_type || 'sekcja strony')}.</div><div class="activity-meta">${dashEsc(dashFmt(item?.created_at))}</div></div><div class="activity-time">${dashEsc(dashRel(item?.created_at))}</div></article>`).join('') : '<div class="empty-state">Brak nowych działań w logach.</div>';

    const lastLogByModerator = new Map();
    logs.forEach(item => {
      const email = String(item?.actor_email || '').toLowerCase();
      const actorId = String(item?.actor_id || '');
      if (email && !lastLogByModerator.has(`mail:${email}`)) lastLogByModerator.set(`mail:${email}`, item.created_at || null);
      if (actorId && !lastLogByModerator.has(`id:${actorId}`)) lastLogByModerator.set(`id:${actorId}`, item.created_at || null);
    });
    const inactive = moderators.filter(mod => {
      const emailKey = `mail:${String(mod.email || '').toLowerCase()}`;
      const idKey = `id:${String(mod.id || '')}`;
      const last = lastLogByModerator.get(emailKey) || lastLogByModerator.get(idKey) || null;
      return !last || last < inactiveThreshold;
    });
    set('#inactiveModsCount', inactive.length ? `${inactive.length} do sprawdzenia` : 'Wszyscy aktywni');
    if (inactiveMods) inactiveMods.innerHTML = inactive.length ? inactive.slice(0,6).map(mod => {
      const emailKey = `mail:${String(mod.email || '').toLowerCase()}`;
      const idKey = `id:${String(mod.id || '')}`;
      const last = lastLogByModerator.get(emailKey) || lastLogByModerator.get(idKey) || null;
      return `<article class="moderator-item"><div class="moderator-icon">!</div><div class="moderator-main"><div class="moderator-name">${dashEsc(mod.username || mod.email || 'Moderator')}</div><div class="moderator-meta">${dashEsc(mod.email || 'Brak adresu e-mail')}</div><div class="moderator-text">${dashEsc(last ? `Ostatnia aktywność: ${dashFmt(last)}.` : 'W ostatnich 14 dniach nie znaleziono żadnej aktywności w logach.')}</div></div><div class="moderator-time">${dashEsc(last ? dashRel(last) : 'Brak wpisów')}</div></article>`;
    }).join('') : '<div class="empty-state">Świetnie, wszyscy moderatorzy mieli aktywność w logach w ostatnich 14 dniach.</div>';
  }catch(error){
    console.error('Nie udało się pobrać danych dashboardu:', error);
    set('#dashStatusText', 'BŁĄD');
    set('#dashStatusHint', 'Nie udało się pobrać danych z Supabase');
    set('#inactiveModsCount', 'Brak danych');
    if (recentChanges) recentChanges.innerHTML = `<div class="empty-state">Nie udało się pobrać aktywności.<br><br>${dashEsc(error?.message || 'Błąd odczytu danych')}.</div>`;
    if (inactiveMods) inactiveMods.innerHTML = '<div class="empty-state">Nie udało się sprawdzić aktywności moderatorów.</div>';
  }
}

document.addEventListener('DOMContentLoaded',()=>{
  loadAdminDashboard();
  document.querySelectorAll('[data-dashboard-action="refresh"]').forEach(btn => btn.addEventListener('click', loadAdminDashboard));
});
