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

function dashActivityStatus(value){
  if (!value) return { icon:'🔴', label:'Brak historii aktywności', level:3 };
  const diff = Date.now() - new Date(value).getTime();
  const days = diff / 86400000;
  if (days <= 7) return { icon:'🟢', label:'Aktywny ostatnie 7 dni', level:0 };
  if (days <= 14) return { icon:'🟡', label:'Brak aktywności ponad tydzień', level:1 };
  if (days <= 30) return { icon:'🟠', label:'Brak aktywności ponad 2 tygodnie', level:2 };
  return { icon:'🔴', label:'Brak aktywności ponad miesiąc', level:3 };
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
      supabaseClient.from('matt_audit_logs').select('id,created_at,actor_user_id,actor_email,actor_username,action,entity_type,entity_id,summary,details').order('created_at',{ascending:false}).limit(80)
    ]);
    if (profilesCountRes.error) throw profilesCountRes.error;
    if (moderatorsRes.error) throw moderatorsRes.error;
    if (auditRes.error) throw auditRes.error;
    const moderators = moderatorsRes.data || [];
    const logs = auditRes.data || [];
    const todayLogs = logs.filter(item => item?.created_at && new Date(item.created_at) >= sinceToday);
    const actorsToday = new Set(todayLogs.map(item => item?.actor_email || item?.actor_user_id).filter(Boolean));

    set('#dashUsers', String(profilesCountRes.count ?? 0));
    set('#dashModerators', String(moderators.length));
    set('#dashLogsToday', String(todayLogs.length));
    set('#dashLogs7', String(logs.filter(x => x.created_at && new Date(x.created_at) >= new Date(Date.now()-7*86400000)).length));
    set('#dashLogs30', String(logs.filter(x => x.created_at && new Date(x.created_at) >= new Date(Date.now()-30*86400000)).length));
    set('#dashStatusText', 'OK');
    set('#dashStatusHint', logs.length ? 'Połączono z logami i profilami' : 'Połączono, brak zapisanych zmian');
    set('#dashActorsToday', String(actorsToday.size));
    set('#dashRecentTotal', String(logs.length));
    set('#dashLastUpdate', logs[0]?.created_at ? dashFmt(logs[0].created_at) : 'Brak aktywności');

    const alertBox = document.querySelector('#dashAlerts') || root?.querySelector?.('#dashAlerts');
    if (alertBox) {
      const alerts=[];
      if (moderators.length===0) alerts.push(['yellow','Brak moderatorów w systemie']);
      if (inactive.length>0) alerts.push(['red', `${inactive.length} moderatorów wymaga uwagi`]);
      if (!alerts.length) alerts.push(['green','System działa poprawnie']);
      alertBox.innerHTML=alerts.map(a=>`<div class="alert-card ${a[0]}">${a[1]}</div>`).join('');
    }

    if (recentChanges) recentChanges.innerHTML = logs.length ? logs.slice(0,6).map(item => `<article class="activity-item"><div class="activity-icon">↻</div><div class="activity-main"><div class="activity-title">${dashEsc(item?.summary || item?.summary || item?.action || 'Zmiana w systemie')}</div><div class="activity-text">${dashEsc(item?.actor_username || item?.actor_username || item?.actor_email || 'Nieznany użytkownik')} wprowadził zmianę w sekcji ${dashEsc(item?.entity_type || 'sekcja strony')}.</div><div class="activity-meta">${dashEsc(dashFmt(item?.created_at))}</div></div><div class="activity-time">${dashEsc(dashRel(item?.created_at))}</div></article>`).join('') : '<div class="empty-state">Brak nowych działań w logach.</div>';

    const lastLogByModerator = new Map();
    logs.forEach(item => {
      const email = String(item?.actor_email || '').toLowerCase();
      const actorId = String(item?.actor_user_id || '');
      if (email && !lastLogByModerator.has(`mail:${email}`)) lastLogByModerator.set(`mail:${email}`, item.created_at || null);
      if (actorId && !lastLogByModerator.has(`id:${actorId}`)) lastLogByModerator.set(`id:${actorId}`, item.created_at || null);
    });
    const moderatorActivity = moderators.map(mod => {
      const emailKey = `mail:${String(mod.email || '').toLowerCase()}`;
      const idKey = `id:${String(mod.id || '')}`;
      const last = lastLogByModerator.get(emailKey) || lastLogByModerator.get(idKey) || null;
      return { mod, last, status: dashActivityStatus(last) };
    }).sort((a,b) => a.status.level - b.status.level || (!a.last ? -1 : 1));

    const yellow = moderatorActivity.filter(x=>x.status.level===1).length;
    const orange = moderatorActivity.filter(x=>x.status.level===2).length;
    const red = moderatorActivity.filter(x=>x.status.level===3).length;
    set('#inactiveModsCount', `🔴 ${red}  🟠 ${orange}  🟡 ${yellow}`);

    if (inactiveMods) inactiveMods.innerHTML = moderatorActivity.length ? moderatorActivity.slice(0,6).map(({mod,last,status}) => {
      return `<article class="moderator-item"><div class="moderator-icon">${status.icon}</div><div class="moderator-main"><div class="moderator-name">${dashEsc(mod.username || mod.email || 'Moderator')}</div><div class="moderator-meta">${dashEsc(status.label)}</div><div class="moderator-text">${dashEsc(last ? `Ostatnia aktywność: ${dashFmt(last)}.` : 'Moderator nie wykonał jeszcze żadnej zapisanej czynności.')}</div></div><div class="moderator-time">${dashEsc(last ? dashRel(last) : 'Brak wpisów')}</div></article>`;
    }).join('') : '<div class="empty-state">Brak moderatorów.</div>';
  }catch(error){
    console.error('Nie udało się pobrać danych dashboardu:', error);
    set('#dashStatusText', 'BŁĄD');
    set('#dashStatusHint', 'Nie udało się pobrać danych z Supabase');
    set('#inactiveModsCount', 'Brak danych');
    if (recentChanges) recentChanges.innerHTML = `<div class="empty-state">Nie udało się pobrać aktywności.<br><br>${dashEsc(error?.message || 'Błąd odczytu danych')}.</div>`;
    if (inactiveMods) inactiveMods.innerHTML = '<div class="empty-state">Nie udało się sprawdzić aktywności moderatorów.</div>';
  }
}



function renderAdminExtraTools(){
  const n=document.getElementById('globalNotifications');
  const s=document.getElementById('sessionRegistry');
  const t=document.getElementById('permissionTester');
  const r=document.getElementById('roleBackup');
  if(n){
    const items=[];
    const mods=document.querySelector('#inactiveModsCount')?.textContent || '';
    if(mods.includes('🔴')) items.push('<div class="notification-card red">🔴 Moderatorzy wymagają uwagi</div>');
    if(!items.length) items.push('<div class="notification-card green">🟢 Brak krytycznych powiadomień</div>');
    n.innerHTML=items.join('');
  }
  if(s){
    const now=new Date();
    localStorage.setItem('matt_last_dashboard_session', now.toISOString());
    s.innerHTML='<div class="notification-card green">🟢 Twoja sesja aktywna<br><small>'+now.toLocaleString('pl-PL')+'</small></div>';
  }
  if(t){
    const count=window.currentUserIsAdmin?'Pełny dostęp administratora':((window.currentUserPermissions||[]).length+' aktywnych uprawnień');
    t.innerHTML='<div class="notification-card">Sprawdzone konto:<br><b>'+dashEsc(count)+'</b></div>';
  }
  if(r){
    r.innerHTML='<div class="notification-card">💾 Kopia konfiguracji ról<br><small>Gotowe miejsce pod eksport i przywracanie ról.</small></div>';
  }
}

document.addEventListener('DOMContentLoaded',()=>{
  loadAdminDashboard();
  setTimeout(renderAdminExtraTools, 800);
  document.querySelectorAll('[data-dashboard-action="refresh"]').forEach(btn => btn.addEventListener('click', loadAdminDashboard));
});
