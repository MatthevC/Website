(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const clone = value => JSON.parse(JSON.stringify(value ?? null));
  const esc = value => window.MattCMS?.escape ? window.MattCMS.escape(value) : String(value ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const uid = () => (crypto?.randomUUID?.() || `matt-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const has = permission => window.mattHasPermission?.(permission) === true;
  const any = (...permissions) => permissions.some(has);
  const isStaff = () => window.currentUserRole === 'admin' || window.currentUserRole === 'moderator';
  const userName = () => window.currentUserProfile?.username || window.currentUserProfile?.email || 'Użytkownik';
  const userId = async () => (await window.supabaseClient?.auth?.getSession?.())?.data?.session?.user?.id || '';
  const fmt = value => {
    try { return new Intl.DateTimeFormat('pl-PL',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)); }
    catch (_) { return String(value || '—'); }
  };
  const localDateTime = value => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value).slice(0,16);
    const pad = n => String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const KEYS = {
    trash: 'cms_trash',
    locks: 'cms_edit_locks',
    workflow: 'event_workflow',
    security: 'account_security',
    maintenance: 'site_maintenance'
  };

  // Dane techniczne kont nie powinny pojawiać się w ogólnej wyszukiwarce ani
  // w przywracaniu pojedynczych sekcji. Zarządza się nimi wyłącznie z panelu kont.
  const TOOL_HIDDEN_KEYS = new Set(['account_extra_permissions', KEYS.security, KEYS.locks]);
  const viewerIsAdmin = () => window.currentUserRole === 'admin' || window.currentUserIsAdmin === true;

  function canInspectCmsKey(key) {
    if (TOOL_HIDDEN_KEYS.has(String(key || ''))) return false;
    if (String(key) === KEYS.trash && !has('cms.trash.view')) return false;
    return true;
  }

  function sanitizeCmsToolValue(key, value) {
    const data = clone(value);
    if (viewerIsAdmin()) return data;
    if (key === KEYS.workflow && data && typeof data === 'object' && !Array.isArray(data) && !has('events.notes.manage')) {
      Object.values(data).forEach(meta => { if (meta && typeof meta === 'object') delete meta.moderatorNote; });
    }
    if (key === 'downloads_config' && data && typeof data === 'object' && !has('downloads.notes.manage')) {
      delete data.notes;
    }
    if (key === 'streamers' && Array.isArray(data) && !has('streamers.notes.manage')) {
      data.forEach(item => { if (item && typeof item === 'object') delete item._moderatorNote; });
    }
    return data;
  }

  function canShowHistoryKey(key) {
    key = String(key || '');
    if (!canInspectCmsKey(key)) return false;
    if (viewerIsAdmin()) return true;
    if (key === KEYS.workflow) return any('events.edit','events.publish','events.history.view','events.notes.manage','events.autoarchive.manage');
    if (key === 'downloads_config') return any('downloads.create','downloads.edit','downloads.delete','downloads.reorder','downloads.publish','downloads.notes.manage','downloads.bulk.manage');
    if (key === 'streamers') return any('streamers.manage','streamers.publish','streamers.notes.manage','streamers.bulk.manage','streamers.delete');
    if (key === KEYS.maintenance) return has('site.maintenance.manage');
    if (key === 'discord_channels') return any('discord.channels.manage','discord.channels.delete');
    if (key === 'discord_join_preview' || key === 'discord_join_bubbles') return any('discord.join.manage','discord.join.messages.manage','discord.join.members.manage');
    return true;
  }

  function canRestoreCmsKey(key) {
    if (!has('cms.history.restore') || !canShowHistoryKey(key)) return false;
    if (viewerIsAdmin()) return true;
    key = String(key || '');
    if (key === KEYS.workflow) return any('events.edit','events.publish','events.history.restore');
    if (key === 'downloads_config') return any('downloads.edit','downloads.publish','downloads.reorder','downloads.create','downloads.delete');
    if (key === 'streamers') return any('streamers.manage','streamers.publish','streamers.delete');
    if (key === KEYS.maintenance) return has('site.maintenance.manage');
    if (key === 'discord_channels') return has('discord.channels.manage');
    if (key === 'discord_join_preview' || key === 'discord_join_bubbles') return any('discord.join.manage','discord.join.messages.manage','discord.join.members.manage');
    return true;
  }

  let centerModal = null;
  let centerTab = 'dashboard';
  let lastEventEditId = null;
  let linkResults = [];
  let alertCache = [];
  let observerQueued = false;

  function toast(message, type='ok') {
    let el = document.getElementById('matt-suite-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'matt-suite-toast';
      document.body.appendChild(el);
    }
    el.className = `matt-suite-toast ${type}`;
    el.textContent = message;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 3200);
  }

  async function freshKey(key, fallback) {
    if (window.MattCMS?.refreshKey) {
      const value = await window.MattCMS.refreshKey(key);
      return value == null ? clone(fallback) : clone(value);
    }
    try {
      const { data, error } = await window.supabaseClient.from('cms_data').select('data').eq('key',key).maybeSingle();
      if (error) throw error;
      return data?.data == null ? clone(fallback) : clone(data.data);
    } catch (_) {
      return clone(window.MattCMS?.get(key, fallback) ?? fallback);
    }
  }

  async function saveKey(key, value, options={}) {
    return window.MattCMS.save(key, value, { backup: options.backup === true, backupLabel: options.backupLabel });
  }

  async function addTrash(record) {
    const nowMs = Date.now();
    const trash = (await freshKey(KEYS.trash, []) || []).filter(item => !item?.expiresAt || new Date(item.expiresAt).getTime() > nowMs);
    const actor = await userId();
    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    trash.unshift({
      id: uid(),
      deletedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      deletedBy: { userId: actor, username: userName() },
      ...clone(record)
    });
    await saveKey(KEYS.trash, trash, { backup:false });
    return trash[0];
  }

  async function trashCmsArrayItem(key, item, index, label='Element') {
    return addTrash({ kind:'cms-array', sourceKey:key, label:String(label || 'Element'), payload:clone(item), meta:{ index:Number(index) } });
  }

  async function trashDownloadItem(item, context={}) {
    return addTrash({
      kind:'download', sourceKey:'downloads_config', label:String(item?.title || 'Plik'), payload:clone(item),
      meta:{ base:Boolean(context.base), id:String(item?.id || ''), visibility: clone(context.config?.visibility?.[String(item?.id)] || {}), note: String(context.config?.notes?.[String(item?.id)] || '') }
    });
  }

  const EVENT_ONGOING_DB_END = '9999-12-31T23:59:59.000Z';

  function isDbOngoingEnd(value) {
    return String(value || '').startsWith('9999-12-31');
  }

  function eventEndForDb(value, ongoing=false) {
    return ongoing || !value ? EVENT_ONGOING_DB_END : value;
  }

  async function getEventWorkflow(refresh=false) {
    const data = refresh ? await freshKey(KEYS.workflow,{}) : clone(window.MattCMS?.get(KEYS.workflow,{}) || {});
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  }

  async function setEventWorkflow(id, meta, options={}) {
    const map = await getEventWorkflow(true);
    map[String(id)] = { ...(map[String(id)] || {}), ...clone(meta), updatedAt:new Date().toISOString(), updatedBy:userName() };
    await saveKey(KEYS.workflow, map, { backup:options.backup === true });
    return map[String(id)];
  }

  async function removeEventWorkflow(id) {
    const map = await getEventWorkflow(true);
    delete map[String(id)];
    await saveKey(KEYS.workflow, map, { backup:false });
  }

  async function fetchEvents() {
    const { data, error } = await window.supabaseClient.from('events').select('*').order('start_date',{ascending:false});
    if (error) throw error;
    return data || [];
  }

  async function trashEvent(row) {
    if (!row?.id) return;
    const workflow = await getEventWorkflow(true);
    await window.MattCMS.createBackup(`AUTO: przed przeniesieniem eventu do kosza — ${row.title || 'event'}`);
    await addTrash({ kind:'event', sourceKey:'events', label:String(row.title || 'Event'), payload:clone(row), meta:{ workflow:clone(workflow[String(row.id)] || {}) } });
    const { error } = await window.supabaseClient.from('events').delete().eq('id',row.id);
    if (error) throw error;
    await removeEventWorkflow(row.id);
    toast('Event został przeniesiony do kosza.');
    if (typeof window.render === 'function') await window.render();
  }

  function workflowLabel(meta={}, row=null) {
    const vis = String(meta.visibility || 'public').toLowerCase();
    if (vis === 'draft') return ['SZKIC','draft'];
    if (vis === 'hidden') return ['UKRYTY','hidden'];
    if (vis === 'scheduled') {
      const when = new Date(meta.publishAt || row?.publish_date || 0).getTime();
      if (when > Date.now()) return ['ZAPLANOWANY','scheduled'];
      return ['OPUBLIKOWANY','public'];
    }
    if (vis === 'archived') return ['ARCHIWUM','archived'];
    if (meta.autoArchive && meta.ongoing !== true && !isDbOngoingEnd(row?.end_date) && row?.end_date && new Date(row.end_date).getTime() <= Date.now()) return ['ARCHIWUM','archived'];
    return ['PUBLICZNY','public'];
  }

  async function duplicateEvent(id) {
    if (!has('events.duplicate')) return;
    const { data:row, error } = await window.supabaseClient.from('events').select('*').eq('id',id).single();
    if (error) throw error;
    await window.MattCMS.createBackup(`AUTO: przed duplikowaniem eventu — ${row.title || 'event'}`);
    const workflow = await getEventWorkflow(true);
    const sourceMeta = workflow[String(id)] || {};
    const payload = {
      title: `${row.title || 'Event'} — KOPIA`,
      description:row.description,
      start_date:row.start_date,
      end_date:eventEndForDb(row.end_date, sourceMeta.ongoing === true || isDbOngoingEnd(row.end_date)),
      publish_date:new Date().toISOString(),
      image_url:row.image_url
    };
    const { data:newRow, error:insertError } = await window.supabaseClient.from('events').insert(payload).select().single();
    if (insertError) throw insertError;
    await setEventWorkflow(newRow.id,{
      ...sourceMeta,
      visibility:'draft',
      publishAt:null,
      moderatorNote:String(sourceMeta.moderatorNote || ''),
      imageFit:sourceMeta.imageFit || row.image_fit || 'contain',
      mainImageUrl:sourceMeta.mainImageUrl || row.main_image_url || row.image_url || '',
      mainImageFit:sourceMeta.mainImageFit || row.main_image_fit || 'contain',
      imageMode:sourceMeta.imageMode || ((sourceMeta.mainImageUrl || row.main_image_url) && String(sourceMeta.mainImageUrl || row.main_image_url)!==String(row.image_url||'') ? 'separate' : 'shared')
    }, {backup:false});
    toast('Utworzono kopię eventu jako szkic.');
    return newRow;
  }

  async function saveEventWorkflowFromForm(form, savedRow, editing, oldRow) {
    if (!savedRow?.id || !form) return;
    const existing = (await getEventWorkflow(true))[String(savedRow.id)] || {};
    const canPublish = has('events.publish');
    const canNotes = has('events.notes.manage');
    const canAuto = has('events.autoarchive.manage');
    const isNew = !editing;
    const canSchedule = isNew || has('events.schedule.manage');
    let visibility = canPublish ? String(form.elements.workflowVisibility?.value || 'public') : (isNew ? 'draft' : String(existing.visibility || 'public'));
    if (!['public','draft','hidden','scheduled'].includes(visibility)) visibility = 'public';
    const publishAt = visibility === 'scheduled' ? (savedRow.publish_date || null) : null;
    if (visibility === 'scheduled' && !publishAt) throw new Error('Dla zaplanowanego eventu ustaw datę publikacji.');
    const meta = {
      visibility,
      publishAt,
      autoArchive: canAuto ? Boolean(form.elements.workflowAutoArchive?.checked) : Boolean(existing.autoArchive),
      moderatorNote: canNotes ? String(form.elements.workflowNote?.value || '').trim() : String(existing.moderatorNote || ''),
      imageFit: String(savedRow.image_fit || existing.imageFit || 'contain'),
      mainImageUrl: String(savedRow.main_image_url || existing.mainImageUrl || savedRow.image_url || ''),
      mainImageFit: String(savedRow.main_image_fit || existing.mainImageFit || 'contain'),
      imageMode: String(savedRow.image_mode || existing.imageMode || ((savedRow.main_image_url && String(savedRow.main_image_url)!==String(savedRow.image_url||'')) ? 'separate' : 'shared')),
      ongoing: canSchedule
        ? Boolean(savedRow.ongoing === true || form.elements.ongoing?.checked) && !Boolean(form.elements.endedNow?.checked)
        : Boolean(existing.ongoing)
    };
    await setEventWorkflow(savedRow.id, meta, {backup:false});
  }

  function eventWorkflowSection(meta={}, isNew=false) {
    const canPublish = has('events.publish');
    const canNotes = has('events.notes.manage');
    const canAuto = has('events.autoarchive.manage');
    const visibility = isNew && !canPublish ? 'draft' : String(meta.visibility || 'public');
    return `<section class="cms-event-editor-section matt-workflow-section" data-suite-event-workflow>
      <header class="cms-event-section-head"><div><small>05 / PUBLIKACJA</small><strong>STATUS I PRACA MODERATORÓW</strong></div><span>Szkice, zaplanowana publikacja, archiwum i notatki wewnętrzne.</span></header>
      <div class="cms-event-section-body">
        <div class="cms-form-grid two">
          <label class="cms-field"><span>Widoczność eventu</span><select name="workflowVisibility" ${canPublish?'':'disabled'}>
            ${[['public','Publiczny'],['draft','Szkic'],['hidden','Ukryty'],['scheduled','Zaplanowana publikacja']].map(([v,l])=>`<option value="${v}" ${visibility===v?'selected':''}>${l}</option>`).join('')}
          </select><small class="cms-field-help">Przy „Zaplanowana publikacja” używana jest data z pola PUBLIKACJA powyżej.</small></label>
          <label class="cms-field cms-check matt-autoarchive"><input type="checkbox" name="workflowAutoArchive" ${meta.autoArchive?'checked':''} ${canAuto?'':'disabled'}><span>Automatycznie przenieś do archiwum po zakończeniu</span></label>
        </div>
        <label class="cms-field"><span>Notatka wewnętrzna</span><textarea name="workflowNote" rows="4" ${canNotes?'':'disabled'} placeholder="Np. grafika do podmiany, czekamy na potwierdzenie…">${esc(meta.moderatorNote || '')}</textarea><small class="cms-field-help">Ta notatka nigdy nie jest wyświetlana publicznie.</small></label>
        ${!canPublish?'<div class="matt-workflow-lock">Nie masz uprawnienia do publikowania. Nowy event zostanie zapisany jako <strong>SZKIC</strong>.</div>':''}
      </div>
    </section>`;
  }

  function openPreviewOverlay(html, title='PODGLĄD PRZED ZAPISEM') {
    let overlay = document.getElementById('matt-suite-preview-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'matt-suite-preview-overlay';
      overlay.className = 'matt-suite-preview-overlay';
      overlay.innerHTML = `<div class="matt-suite-preview-box"><header><div><small>PODGLĄD</small><strong data-preview-title></strong></div><button type="button" data-preview-close>×</button></header><div data-preview-content></div></div>`;
      document.body.appendChild(overlay);
      $('[data-preview-close]',overlay).onclick = () => overlay.classList.remove('active');
      overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.classList.remove('active');});
    }
    $('[data-preview-title]',overlay).textContent = title;
    $('[data-preview-content]',overlay).innerHTML = html;
    overlay.classList.add('active');
  }

  async function acquireEditLock(resource, label='Element') {
    if (!isStaff()) return true;
    const locks = await freshKey(KEYS.locks,{});
    const now = Date.now();
    Object.keys(locks).forEach(key => { if (new Date(locks[key]?.expiresAt || 0).getTime() < now) delete locks[key]; });
    const actor = await userId();
    const existing = locks[resource];
    if (existing && existing.userId !== actor && new Date(existing.expiresAt || 0).getTime() > now) {
      if (has('cms.editlocks.view')) {
        const ok = confirm(`UWAGA: „${label}” jest obecnie edytowany przez ${existing.username || 'inną osobę'}.\n\nBlokada wygasa: ${fmt(existing.expiresAt)}.\n\nCzy mimo to otworzyć edycję?`);
        if (!ok) return false;
      }
    }
    locks[resource] = { userId:actor, username:userName(), label, openedAt:new Date().toISOString(), expiresAt:new Date(now + 5*60*1000).toISOString() };
    await saveKey(KEYS.locks,locks,{backup:false});
    return true;
  }

  async function releaseEditLock(resource) {
    if (!resource) return;
    const locks = await freshKey(KEYS.locks,{});
    const actor = await userId();
    if (locks[resource]?.userId === actor) {
      delete locks[resource];
      await saveKey(KEYS.locks,locks,{backup:false});
    }
  }

  function ensureCenter() {
    if (centerModal) return centerModal;
    centerModal = document.createElement('div');
    centerModal.className = 'matt-center-backdrop';
    centerModal.id = 'mattCenterModal';
    centerModal.innerHTML = `<div class="matt-center-box" role="dialog" aria-modal="true">
      <header class="matt-center-head"><div><small>CENTRUM MODERATORA</small><h2>NARZĘDZIA I KONTROLA STRONY</h2><p>Ostatnie zmiany, wyszukiwarka, historia, kosz, alerty, bezpieczeństwo i utrzymanie.</p></div><button type="button" data-center-close>×</button></header>
      <nav class="matt-center-tabs" data-center-tabs></nav>
      <div class="matt-center-body" data-center-body></div>
    </div>`;
    document.body.appendChild(centerModal);
    $('[data-center-close]',centerModal).onclick = () => centerModal.classList.remove('active');
    centerModal.addEventListener('click',e=>{if(e.target===centerModal)centerModal.classList.remove('active');});
    return centerModal;
  }

  const centerTabs = () => [
    ['dashboard','PULPIT','cms.dashboard.view'],
    ['search','SZUKAJ','cms.search'],
    ['history','HISTORIA','cms.history.view'],
    ['trash','KOSZ','cms.trash.view'],
    ['alerts','ALERTY','cms.notifications.view'],
    ['links','LINKI','cms.links.check'],
    ['stats','STATYSTYKI','statistics.view'],
    ['maintenance','KONSERWACJA','site.maintenance.manage']
  ].filter(([, ,p]) => has(p));

  async function openCenter(tab='dashboard') {
    const tabs = centerTabs();
    if (!tabs.length) return;
    if (!tabs.some(x=>x[0]===tab)) tab=tabs[0][0];
    centerTab=tab;
    const modal=ensureCenter();
    modal.classList.add('active');
    const nav=$('[data-center-tabs]',modal);
    nav.innerHTML=tabs.map(([id,label])=>`<button type="button" class="${id===tab?'active':''}" data-center-tab="${id}">${label}${id==='alerts'&&alertCache.length?` <span>${alertCache.length}</span>`:''}</button>`).join('');
    $$('[data-center-tab]',nav).forEach(btn=>btn.onclick=()=>openCenter(btn.dataset.centerTab));
    const body=$('[data-center-body]',modal);
    body.innerHTML='<div class="matt-center-loading">Ładowanie…</div>';
    try {
      if(tab==='dashboard') await renderDashboard(body);
      if(tab==='search') await renderSearch(body);
      if(tab==='history') await renderHistory(body);
      if(tab==='trash') await renderTrash(body);
      if(tab==='alerts') await renderAlerts(body);
      if(tab==='links') await renderLinks(body);
      if(tab==='stats') await renderStats(body);
      if(tab==='maintenance') await renderMaintenance(body);
    } catch (error) {
      body.innerHTML=`<div class="matt-center-empty"><strong>Nie udało się wczytać narzędzia.</strong><p>${esc(error?.message || 'Nieznany błąd')}</p></div>`;
    }
  }

  async function recentAudit(limit=30) {
    try {
      const {data,error}=await window.supabaseClient.from('matt_audit_logs').select('id,created_at,actor_user_id,actor_username,actor_email,action,entity_type,entity_id,summary,details').order('created_at',{ascending:false}).limit(limit);
      if(error) throw error;
      return data||[];
    } catch(_) { return []; }
  }

  async function listBackupsRaw(limit=80) {
    const {data,error}=await window.supabaseClient.from('cms_backups').select('id,label,created_at,created_by,created_by_username,created_by_user_id,backup_type').order('created_at',{ascending:false}).limit(limit);
    if(error) throw error;
    return data||[];
  }

  async function getBackupRaw(id) {
    const {data,error}=await window.supabaseClient.from('cms_backups').select('id,label,created_at,created_by,created_by_username,created_by_user_id,backup_type,snapshot').eq('id',Number(id)).single();
    if(error) throw error;
    return data;
  }

  async function buildAlerts() {
    const alerts=[];
    const [events,workflow,trash,locks] = await Promise.all([fetchEvents().catch(()=>[]), getEventWorkflow(true), freshKey(KEYS.trash,[]), freshKey(KEYS.locks,{})]);
    const now=Date.now();
    events.forEach(row=>{
      const meta=workflow[String(row.id)]||{};
      const vis=String(meta.visibility||'public');
      if(!row.image_url) alerts.push({level:'high',kind:'EVENT',title:`${row.title||'Event'} nie ma grafiki`,detail:'Karta eventu może wyglądać niekompletnie.'});
      if(!row.start_date) alerts.push({level:'high',kind:'EVENT',title:`${row.title||'Event'} nie ma daty rozpoczęcia`,detail:'Uzupełnij termin w edytorze.'});
      if(vis==='draft') alerts.push({level:'info',kind:'SZKIC',title:`Szkic: ${row.title||'Event'}`,detail:'Event nie jest widoczny publicznie.'});
      if(vis==='scheduled') {
        const t=new Date(meta.publishAt||row.publish_date||0).getTime();
        if(t>now) alerts.push({level:'info',kind:'PUBLIKACJA',title:`Zaplanowano: ${row.title||'Event'}`,detail:`Publikacja ${fmt(t)}.`});
        else if(t && t<=now) alerts.push({level:'warn',kind:'PUBLIKACJA',title:`Termin publikacji minął: ${row.title||'Event'}`,detail:'Strona pokaże event publicznie, ale warto zmienić status na PUBLICZNY.'});
      }
    });
    const streamers=clone(window.MattCMS?.get('streamers',[])||[]);
    streamers.forEach(s=>{
      if(s?._visibility==='draft') alerts.push({level:'info',kind:'STREAMER',title:`Szkic streamera: ${s.displayName||s.login||'bez nazwy'}`,detail:'Wpis czeka na publikację.'});
      if(s?.channelUrl && !/^https:\/\/(?:www\.)?twitch\.tv\/[a-z0-9_]+/i.test(s.channelUrl)) alerts.push({level:'warn',kind:'TWITCH',title:`Sprawdź link Twitch: ${s.displayName||s.login||''}`,detail:s.channelUrl});
    });
    (trash||[]).forEach(item=>{
      const days=Math.ceil((new Date(item.expiresAt||0).getTime()-now)/(24*60*60*1000));
      if(days<=5) alerts.push({level:'warn',kind:'KOSZ',title:`${item.label||'Element'} jest w koszu od prawie 30 dni`,detail:`Pozostało około ${Math.max(0,days)} dni do planowego uporządkowania.`});
    });
    Object.values(locks||{}).forEach(lock=>{
      if(new Date(lock?.expiresAt||0).getTime()>now) alerts.push({level:'info',kind:'EDYCJA',title:`Edytowane: ${lock.label||'element'}`,detail:`${lock.username||'Użytkownik'} · do ${fmt(lock.expiresAt)}`});
    });
    const maintenance=window.MattCMS?.get(KEYS.maintenance,null);
    if(maintenance?.enabled) alerts.unshift({level:'high',kind:'STRONA',title:'Tryb konserwacji całej strony jest WŁĄCZONY',detail:String(maintenance.message||'Publiczna strona jest wyłączona.')});
    else if(Array.isArray(maintenance?.sections) && maintenance.sections.length) alerts.unshift({level:'warn',kind:'STRONA',title:`Wyłączone sekcje: ${maintenance.sections.length}`,detail:`Dla odwiedzających niedostępne: ${maintenance.sections.join(', ')}.`});
    linkResults.filter(x=>x.ok===false).forEach(x=>alerts.push({level:'warn',kind:'LINK',title:'Niedostępny link',detail:x.url}));
    alertCache=alerts;
    return alerts;
  }

  function auditLabel(action='') {
    const map={
      'cms.created':'Dodano dane CMS','cms.updated':'Zmieniono dane CMS','cms.deleted':'Usunięto dane CMS','event.created':'Dodano event','event.updated':'Edytowano event','event.deleted':'Usunięto event',
      'account.created':'Utworzono konto','account.deleted':'Usunięto konto','access.changed':'Zmieniono uprawnienia','backup.automatic.created':'Automatyczny backup','backup.manual.created':'Ręczny backup'
    };
    return map[action]||String(action||'Zmiana');
  }

  async function renderDashboard(body) {
    const canAlerts = has('cms.notifications.view');
    const canTrash = has('cms.trash.view');
    const [events,auditRaw,alerts,trash] = await Promise.all([
      fetchEvents().catch(()=>[]),
      recentAudit(20),
      canAlerts ? buildAlerts() : Promise.resolve([]),
      canTrash ? freshKey(KEYS.trash,[]) : Promise.resolve([])
    ]);
    const audit = has('audit.view')
      ? auditRaw
      : auditRaw.filter(row => !/^(account|access|profile|auth)\./i.test(String(row.action || '')));
    const workflow=await getEventWorkflow(false);
    const drafts=events.filter(e=>String(workflow[String(e.id)]?.visibility||'public')==='draft').length;
    const scheduled=events.filter(e=>String(workflow[String(e.id)]?.visibility||'public')==='scheduled' && new Date(workflow[String(e.id)]?.publishAt||e.publish_date||0).getTime()>Date.now()).length;
    body.innerHTML=`<div class="matt-center-kpis">
      <div><small>EVENTY</small><strong>${events.length}</strong></div><div><small>SZKICE</small><strong>${drafts}</strong></div><div><small>ZAPLANOWANE</small><strong>${scheduled}</strong></div><div><small>ALERTY</small><strong>${canAlerts?alerts.length:'—'}</strong></div><div><small>KOSZ</small><strong>${canTrash?trash.length:'—'}</strong></div>
    </div>
    <div class="matt-center-columns">
      <section class="matt-center-card"><header><div><small>OSTATNIE ZMIANY</small><strong>Aktywność zespołu</strong></div>${has('audit.view')?'<button type="button" data-open-full-audit>PEŁNE LOGI</button>':''}</header>
        <div class="matt-activity-list">${audit.length?audit.slice(0,10).map(row=>`<article><span>${esc((row.actor_username||row.actor_email||'SYSTEM').slice(0,2).toUpperCase())}</span><div><strong>${esc(auditLabel(row.action))}</strong><p>${esc(row.summary||row.entity_type||'')}</p></div><time>${esc(fmt(row.created_at))}</time></article>`).join(''):'<div class="matt-center-empty">Brak dostępnych zmian do wyświetlenia.</div>'}</div>
      </section>
      <section class="matt-center-card"><header><div><small>DO UWAGI</small><strong>Najważniejsze alerty</strong></div>${canAlerts?'<button type="button" data-open-alerts>WSZYSTKIE</button>':''}</header>
        <div class="matt-alert-mini">${canAlerts?(alerts.length?alerts.slice(0,8).map(a=>`<article class="${esc(a.level)}"><span>${esc(a.kind)}</span><div><strong>${esc(a.title)}</strong><p>${esc(a.detail)}</p></div></article>`).join(''):'<div class="matt-center-empty">Brak problemów wymagających uwagi.</div>'):'<div class="matt-center-empty">Centrum powiadomień wymaga osobnego uprawnienia.</div>'}</div>
      </section>
    </div>
    <div class="matt-quick-actions">
      ${has('cms.search')?'<button data-quick="search">⌕ GLOBALNE SZUKANIE</button>':''}
      ${canTrash?'<button data-quick="trash">♲ KOSZ</button>':''}
      ${has('cms.links.check')?'<button data-quick="links">↗ TEST LINKÓW</button>':''}
      ${has('cms.preview.mode')?'<button data-preview-mode>◉ PODGLĄD STRONY</button>':''}
    </div>`;
    $('[data-open-alerts]',body)?.addEventListener('click',()=>openCenter('alerts'));
    $('[data-open-full-audit]',body)?.addEventListener('click',()=>window.mattOpenAuditLogs?.());
    $$('[data-quick]',body).forEach(btn=>btn.onclick=()=>openCenter(btn.dataset.quick));
    $('[data-preview-mode]',body)?.addEventListener('click',()=>{centerModal.classList.remove('active');enableVisitorPreview();});
  }

  function flattenSearch(value, path='', out=[], depth=0) {
    if(depth>5||out.length>2500)return out;
    if(value==null)return out;
    if(typeof value==='string'||typeof value==='number'||typeof value==='boolean') { out.push({path,text:String(value)}); return out; }
    if(Array.isArray(value)) value.forEach((v,i)=>flattenSearch(v,`${path}[${i}]`,out,depth+1));
    else if(typeof value==='object') Object.entries(value).forEach(([k,v])=>flattenSearch(v,path?`${path}.${k}`:k,out,depth+1));
    return out;
  }

  async function renderSearch(body) {
    body.innerHTML=`<div class="matt-search-box"><input type="search" data-global-search placeholder="Wpisz np. Bingo, Discord, Twitch, regulamin…" autofocus><button type="button" data-global-search-btn>SZUKAJ</button></div><div class="matt-search-results" data-global-results><div class="matt-center-empty">Wpisz minimum 2 znaki.</div></div>`;
    const input=$('[data-global-search]',body), result=$('[data-global-results]',body);
    const doSearch=async()=>{
      const q=String(input.value||'').trim().toLowerCase(); if(q.length<2){result.innerHTML='<div class="matt-center-empty">Wpisz minimum 2 znaki.</div>';return;}
      result.innerHTML='<div class="matt-center-loading">Przeszukiwanie CMS…</div>';
      const [{data:cmsRows},events]=await Promise.all([
        window.supabaseClient.from('cms_data').select('key,data').then(r=>r.error?{data:[]} : r),
        fetchEvents().catch(()=>[])
      ]);
      const hits=[];
      (cmsRows||[]).filter(row=>canInspectCmsKey(row.key)).forEach(row=>{
        const safeData=sanitizeCmsToolValue(row.key,row.data);
        const flat=flattenSearch(safeData);
        const matches=flat.filter(x=>x.text.toLowerCase().includes(q)).slice(0,5);
        if(matches.length) hits.push({type:'CMS',title:row.key,detail:matches.map(x=>`${x.path}: ${x.text}`).join(' · ').slice(0,500),key:row.key});
      });
      events.filter(e=>[e.title,e.description,e.start_date,e.end_date].filter(Boolean).join(' ').toLowerCase().includes(q)).forEach(e=>hits.push({type:'EVENT',title:e.title,detail:String(e.description||'').slice(0,220),href:`#/events/${encodeURIComponent(e.id)}`}));
      result.innerHTML=hits.length?hits.slice(0,80).map((h,i)=>`<article class="matt-search-hit"><span>${esc(h.type)}</span><div><strong>${esc(h.title)}</strong><p>${esc(h.detail)}</p></div>${h.href?`<button data-search-go="${esc(h.href)}">OTWÓRZ</button>`:`<button data-search-key="${esc(h.key)}">SZCZEGÓŁY</button>`}</article>`).join(''):'<div class="matt-center-empty">Brak wyników.</div>';
      $$('[data-search-go]',result).forEach(btn=>btn.onclick=()=>{centerModal.classList.remove('active');location.hash=btn.dataset.searchGo;});
      $$('[data-search-key]',result).forEach(btn=>btn.onclick=()=>openKeyInspector(btn.dataset.searchKey));
    };
    $('[data-global-search-btn]',body).onclick=doSearch;
    input.addEventListener('keydown',e=>{if(e.key==='Enter')doSearch();});
  }

  async function openKeyInspector(key) {
    if(!canInspectCmsKey(key)) return toast('Ta sekcja techniczna nie jest dostępna w globalnej wyszukiwarce.','error');
    const value=sanitizeCmsToolValue(key,await freshKey(key,null));
    openPreviewOverlay(`<div class="matt-json-inspector"><small>KLUCZ CMS</small><h3>${esc(key)}</h3><pre>${esc(JSON.stringify(value,null,2))}</pre></div>`,`CMS — ${key}`);
  }

  async function renderHistory(body) {
    if(!has('cms.history.view')) return;
    const backups=await listBackupsRaw(80);
    body.innerHTML=`<div class="matt-center-note"><strong>HISTORIA WERSJI</strong><p>Możesz otworzyć backup i przywrócić tylko wybraną sekcję CMS. Nie trzeba odtwarzać całej strony.</p></div><div class="matt-history-list">${backups.slice(0,30).map(b=>`<article><div><small>#${b.id} · ${b.backup_type==='manual'?'RĘCZNY':'AUTO'}</small><strong>${esc(b.label||'Backup')}</strong><span>${esc(fmt(b.created_at))} · ${esc(b.created_by_username||b.created_by||'system')}</span></div><button data-history-open="${b.id}">OTWÓRZ</button></article>`).join('')}</div>`;
    $$('[data-history-open]',body).forEach(btn=>btn.onclick=()=>openBackupSections(Number(btn.dataset.historyOpen)));
  }

  async function openBackupSections(id) {
    const backup=await getBackupRaw(id);
    const snap=backup.snapshot||{};
    const cmsRows=(Array.isArray(snap.cms_data)?snap.cms_data:[]).filter(row=>canShowHistoryKey(row?.key));
    const eventCount=Array.isArray(snap.events)?snap.events.length:0;
    openPreviewOverlay(`<div class="matt-history-detail"><div class="matt-center-note"><strong>${esc(backup.label||`Backup #${id}`)}</strong><p>${esc(fmt(backup.created_at))} · ${cmsRows.length} sekcji CMS · ${eventCount} eventów.</p></div><div class="matt-history-key-list">${cmsRows.map(row=>`<article><div><strong>${esc(row.key)}</strong><small>${esc(summaryValue(row.data))}</small></div>${canRestoreCmsKey(row.key)?`<button data-restore-key="${esc(row.key)}">PRZYWRÓĆ TYLKO TĘ SEKCJĘ</button>`:''}</article>`).join('')}</div></div>`,`HISTORIA — BACKUP #${id}`);
    const overlay=document.getElementById('matt-suite-preview-overlay');
    $$('[data-restore-key]',overlay).forEach(btn=>btn.onclick=async()=>{
      const key=btn.dataset.restoreKey; const row=cmsRows.find(x=>x.key===key); if(!row||!canRestoreCmsKey(key))return;
      if(!confirm(`Przywrócić tylko sekcję „${key}” z backupu #${id}? Obecna wersja zostanie zabezpieczona backupem.`))return;
      await window.MattCMS.save(key,row.data,{backup:true,backupLabel:`AUTO: przed przywróceniem sekcji ${key} z backupu #${id}`});
      toast(`Przywrócono sekcję ${key}.`); overlay.classList.remove('active'); if(typeof window.render==='function')await window.render();
    });
  }

  function summaryValue(value) {
    if(Array.isArray(value))return `${value.length} elementów`;
    if(value&&typeof value==='object')return `${Object.keys(value).length} pól`;
    return String(value??'').slice(0,100);
  }

  async function showEventHistory(eventId,label='Event') {
    if(!has('events.history.view'))return;
    const backups=(await listBackupsRaw(20)).slice(0,20);
    const versions=[];
    for(const b of backups){
      try{
        const full=await getBackupRaw(b.id); const row=(full.snapshot?.events||[]).find(e=>String(e.id)===String(eventId));
        if(row)versions.push({backup:full,row});
      }catch(_){ }
      if(versions.length>=10)break;
    }
    openPreviewOverlay(`<div class="matt-history-detail"><div class="matt-center-note"><strong>${esc(label)}</strong><p>Znaleziono ${versions.length} poprzednich wersji w dostępnych backupach.</p></div><div class="matt-history-key-list">${versions.length?versions.map(v=>`<article><div><strong>${esc(v.row.title||label)}</strong><small>#${v.backup.id} · ${esc(fmt(v.backup.created_at))} · ${esc(v.backup.label||'')}</small></div>${has('events.history.restore')?`<button data-event-version="${v.backup.id}">PRZYWRÓĆ WERSJĘ</button>`:''}</article>`).join(''):'<div class="matt-center-empty">Brak wersji tego eventu w zachowanych backupach.</div>'}</div></div>`,`HISTORIA EVENTU`);
    const overlay=document.getElementById('matt-suite-preview-overlay');
    $$('[data-event-version]',overlay).forEach(btn=>btn.onclick=async()=>{
      const version=versions.find(v=>String(v.backup.id)===String(btn.dataset.eventVersion)); if(!version)return;
      if(!confirm(`Przywrócić event „${label}” z backupu #${version.backup.id}?`))return;
      await window.MattCMS.createBackup(`AUTO: przed przywróceniem eventu — ${label}`);
      const r=version.row;
      const payload={title:r.title,description:r.description,start_date:r.start_date,end_date:eventEndForDb(r.end_date),publish_date:r.publish_date,image_url:r.image_url};
      const {error}=await window.supabaseClient.from('events').update(payload).eq('id',eventId); if(error)throw error;
      const wfRow=(version.backup.snapshot?.cms_data||[]).find(x=>x.key===KEYS.workflow);
      const backupMeta=wfRow?.data?.[String(eventId)] || {};
      await setEventWorkflow(eventId,{
        ...backupMeta,
        imageFit:backupMeta.imageFit || r.image_fit || 'contain',
        mainImageUrl:backupMeta.mainImageUrl || r.main_image_url || r.image_url || '',
        mainImageFit:backupMeta.mainImageFit || r.main_image_fit || 'contain',
        imageMode:backupMeta.imageMode || ((backupMeta.mainImageUrl || r.main_image_url) && String(backupMeta.mainImageUrl || r.main_image_url)!==String(r.image_url||'') ? 'separate' : 'shared')
      },{backup:false});
      toast('Przywrócono poprzednią wersję eventu.'); overlay.classList.remove('active'); if(typeof window.render==='function')await window.render();
    });
  }

  async function renderTrash(body) {
    let trash=await freshKey(KEYS.trash,[]);
    trash=Array.isArray(trash)?trash:[];
    const now=Date.now();
    const activeTrash=trash.filter(item=>!item?.expiresAt || new Date(item.expiresAt).getTime()>now);
    if(activeTrash.length!==trash.length){trash=activeTrash;await saveKey(KEYS.trash,trash,{backup:false});}
    body.innerHTML=`<div class="matt-center-note"><strong>KOSZ — 30 DNI</strong><p>Usuwanie eventów, plików i elementów Discorda przenosi je tutaj. Możesz je przywrócić albo usunąć bezpowrotnie.</p></div><div class="matt-trash-list">${trash.length?trash.map(item=>{const days=Math.max(0,Math.ceil((new Date(item.expiresAt||0).getTime()-now)/(86400000)));return `<article><div><small>${esc(String(item.kind||'ELEMENT').toUpperCase())} · ${esc(fmt(item.deletedAt))}</small><strong>${esc(item.label||'Element')}</strong><span>usunął: ${esc(item.deletedBy?.username||'system')} · pozostało ok. ${days} dni</span></div><div>${has('cms.trash.restore')?`<button data-trash-restore="${esc(item.id)}">PRZYWRÓĆ</button>`:''}${has('cms.trash.delete')?`<button class="danger" data-trash-delete="${esc(item.id)}">USUŃ NA STAŁE</button>`:''}</div></article>`}).join(''):'<div class="matt-center-empty">Kosz jest pusty.</div>'}</div>`;
    $$('[data-trash-restore]',body).forEach(btn=>btn.onclick=()=>restoreTrashItem(btn.dataset.trashRestore));
    $$('[data-trash-delete]',body).forEach(btn=>btn.onclick=async()=>{
      if(!confirm('Usunąć ten element z kosza bez możliwości przywrócenia?'))return;
      const list=await freshKey(KEYS.trash,[]); const next=(list||[]).filter(x=>String(x.id)!==String(btn.dataset.trashDelete)); await saveKey(KEYS.trash,next,{backup:false}); toast('Element usunięty z kosza.'); openCenter('trash');
    });
  }

  async function restoreTrashItem(id) {
    const trash=await freshKey(KEYS.trash,[]); const item=(trash||[]).find(x=>String(x.id)===String(id)); if(!item)return;
    if(!confirm(`Przywrócić „${item.label||'element'}”?`))return;
    if(item.kind==='event') {
      const r=item.payload||{}; const payload={};
      ['id','title','description','start_date','end_date','publish_date','image_url'].forEach(k=>{if(r[k]!==undefined)payload[k]=r[k];});
      payload.end_date = eventEndForDb(payload.end_date, item.meta?.workflow?.ongoing === true);
      let result=await window.supabaseClient.from('events').insert(payload).select().single();
      if(result.error && payload.id){ delete payload.id; result=await window.supabaseClient.from('events').insert(payload).select().single(); }
      if(result.error)throw result.error;
      const restoredId=result.data?.id||r.id;
      if(restoredId){
        const wf=item.meta?.workflow || {};
        await setEventWorkflow(restoredId,{
          ...wf,
          imageFit:wf.imageFit || r.image_fit || 'contain',
          mainImageUrl:wf.mainImageUrl || r.main_image_url || r.image_url || '',
          mainImageFit:wf.mainImageFit || r.main_image_fit || 'contain',
          imageMode:wf.imageMode || ((wf.mainImageUrl || r.main_image_url) && String(wf.mainImageUrl || r.main_image_url)!==String(r.image_url||'') ? 'separate' : 'shared')
        },{backup:false});
      }
    } else if(item.kind==='cms-array') {
      const arr=await freshKey(item.sourceKey,[]); const next=Array.isArray(arr)?arr:[]; const index=Math.max(0,Math.min(next.length,Number(item.meta?.index??next.length))); next.splice(index,0,item.payload); await window.MattCMS.save(item.sourceKey,next);
    } else if(item.kind==='download') {
      const config=clone(window.MattDownloads?.getConfig?.()||{order:[],overrides:{},hidden:[],custom:[],visibility:{},notes:{}}); config.visibility=config.visibility||{};config.notes=config.notes||{};config.hidden=(config.hidden||[]).filter(x=>String(x)!==String(item.meta?.id));
      const data=clone(item.payload||{}); const did=String(item.meta?.id||data.id||uid());
      if(item.meta?.base){ const copy={...data};delete copy.id;delete copy.source;config.overrides[did]=copy; }
      else { data.id=did; config.custom=(config.custom||[]).filter(x=>String(x.id)!==did); config.custom.push(data); }
      if(!(config.order||[]).includes(did))config.order=[...(config.order||[]),did]; if(item.meta?.visibility)config.visibility[did]=item.meta.visibility;if(item.meta?.note)config.notes[did]=item.meta.note; await window.MattCMS.save('downloads_config',config);
    } else if(item.kind==='discord-category') {
      const cats=await freshKey('discord_channels',[]); const idx=Math.max(0,Math.min(cats.length,Number(item.meta?.index??cats.length))); cats.splice(idx,0,item.payload); await window.MattCMS.save('discord_channels',cats);
    } else if(item.kind==='discord-channel') {
      const cats=await freshKey('discord_channels',[]); let parent=cats.find(c=>String(c.id||c.title)===String(item.meta?.parentId)); if(!parent)parent=cats[Number(item.meta?.parentIndex)]; if(!parent)throw new Error('Nie znaleziono kategorii docelowej.'); parent.channels=Array.isArray(parent.channels)?parent.channels:[]; parent.channels.splice(Math.max(0,Math.min(parent.channels.length,Number(item.meta?.index??parent.channels.length))),0,item.payload); await window.MattCMS.save('discord_channels',cats);
    } else if(item.kind?.startsWith('discord-preview-')) {
      const data=await freshKey('discord_join_preview',{}); restoreDiscordPreviewItem(data,item); await window.MattCMS.save('discord_join_preview',data);
    } else if(item.kind==='discord-bubble') {
      const arr=await freshKey('discord_join_bubbles',[]); arr.splice(Math.max(0,Math.min(arr.length,Number(item.meta?.index??arr.length))),0,item.payload); await window.MattCMS.save('discord_join_bubbles',arr);
    } else throw new Error('Ten typ elementu nie ma jeszcze procedury przywracania.');
    const next=(trash||[]).filter(x=>String(x.id)!==String(id)); await saveKey(KEYS.trash,next,{backup:false}); toast('Element został przywrócony.'); if(typeof window.render==='function')await window.render(); openCenter('trash');
  }

  function restoreDiscordPreviewItem(data,item){
    data.categories=Array.isArray(data.categories)?data.categories:[];data.messages=Array.isArray(data.messages)?data.messages:[];data.memberGroups=Array.isArray(data.memberGroups)?data.memberGroups:[];
    const idx=Number(item.meta?.index??9999);
    if(item.kind==='discord-preview-category')data.categories.splice(Math.min(data.categories.length,idx),0,item.payload);
    if(item.kind==='discord-preview-message')data.messages.splice(Math.min(data.messages.length,idx),0,item.payload);
    if(item.kind==='discord-preview-group')data.memberGroups.splice(Math.min(data.memberGroups.length,idx),0,item.payload);
    if(item.kind==='discord-preview-channel'){const p=data.categories[Number(item.meta?.parentIndex)];if(!p)throw new Error('Brak kategorii docelowej.');p.channels=Array.isArray(p.channels)?p.channels:[];p.channels.splice(Math.min(p.channels.length,idx),0,item.payload);}
    if(item.kind==='discord-preview-member'){const p=data.memberGroups[Number(item.meta?.parentIndex)];if(!p)throw new Error('Brak grupy docelowej.');p.members=Array.isArray(p.members)?p.members:[];p.members.splice(Math.min(p.members.length,idx),0,item.payload);}
  }

  async function renderAlerts(body) {
    const alerts=await buildAlerts();
    body.innerHTML=`<div class="matt-center-note"><strong>CENTRUM POWIADOMIEŃ</strong><p>Alerty są wyliczane na podstawie bieżących danych strony. Nie wymagają dodatkowej tabeli w Supabase.</p></div><div class="matt-alert-list">${alerts.length?alerts.map(a=>`<article class="${esc(a.level)}"><span>${esc(a.kind)}</span><div><strong>${esc(a.title)}</strong><p>${esc(a.detail)}</p></div></article>`).join(''):'<div class="matt-center-empty"><strong>Wszystko wygląda dobrze.</strong><p>Brak aktywnych ostrzeżeń.</p></div>'}</div>`;
    updateToolbarAlertBadge();
  }

  async function collectLinks() {
    const set=new Set();
    $$('a[href],img[src]').forEach(el=>{const v=el.getAttribute('href')||el.getAttribute('src');if(v&&!v.startsWith('#')&&!v.startsWith('mailto:')&&!v.startsWith('data:')){try{set.add(new URL(v,location.href).href);}catch(_){}}});
    const {data}=await window.supabaseClient.from('cms_data').select('data');
    const walk=v=>{if(typeof v==='string'&&/^https?:\/\//i.test(v))set.add(v);else if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')Object.values(v).forEach(walk);};
    (data||[]).forEach(row=>walk(row.data));
    const events=await fetchEvents().catch(()=>[]);events.forEach(e=>[e.image_url,e.main_image_url].filter(Boolean).forEach(x=>set.add(x)));
    return [...set].slice(0,120);
  }

  async function testUrl(url) {
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),7000);
    const started=performance.now();
    try{
      const same=new URL(url,location.href).origin===location.origin;
      const response=await fetch(url,{method:'GET',mode:same?'same-origin':'no-cors',cache:'no-store',signal:controller.signal});
      return {url,ok:same?response.ok:true,status:same?response.status:'OK',ms:Math.round(performance.now()-started)};
    }catch(error){return {url,ok:false,status:error?.name==='AbortError'?'TIMEOUT':'BŁĄD',ms:Math.round(performance.now()-started)};}
    finally{clearTimeout(timer);}
  }

  async function renderLinks(body) {
    body.innerHTML=`<div class="matt-center-note"><strong>TEST LINKÓW</strong><p>Sprawdza linki i grafiki wykryte na stronie oraz w CMS. Zewnętrzne serwisy są testowane bez odczytywania ich treści.</p></div><div class="matt-link-actions"><button class="matt-primary" data-run-link-test>URUCHOM TEST</button><span data-link-status>${linkResults.length?`Ostatni test: ${linkResults.length} adresów`:'Test nie był jeszcze uruchamiany.'}</span></div><div class="matt-link-results" data-link-results>${renderLinkResultsHtml()}</div>`;
    $('[data-run-link-test]',body).onclick=async e=>{
      const btn=e.currentTarget,status=$('[data-link-status]',body),out=$('[data-link-results]',body);btn.disabled=true;btn.textContent='TESTOWANIE…';const links=await collectLinks();linkResults=[];
      let index=0;const worker=async()=>{while(index<links.length){const i=index++;linkResults[i]=await testUrl(links[i]);status.textContent=`Sprawdzono ${linkResults.filter(Boolean).length}/${links.length}`;out.innerHTML=renderLinkResultsHtml();}};
      await Promise.all(Array.from({length:Math.min(6,links.length||1)},worker));btn.disabled=false;btn.textContent='URUCHOM TEST PONOWNIE';status.textContent=`Gotowe: ${linkResults.filter(x=>x.ok).length} OK, ${linkResults.filter(x=>!x.ok).length} problemów.`;out.innerHTML=renderLinkResultsHtml();await buildAlerts();updateToolbarAlertBadge();
    };
  }

  function renderLinkResultsHtml(){return linkResults.length?linkResults.filter(Boolean).map(r=>`<article class="${r.ok?'ok':'bad'}"><span>${r.ok?'✓':'!'}</span><div><strong>${esc(r.status)}</strong><p>${esc(r.url)}</p></div><time>${r.ms} ms</time></article>`).join(''):'<div class="matt-center-empty">Brak wyników.</div>';}

  async function renderStats(body) {
    if(!has('statistics.view'))return;
    const [events,audit,backups,trash]=await Promise.all([fetchEvents().catch(()=>[]),recentAudit(100),listBackupsRaw(200).catch(()=>[]),freshKey(KEYS.trash,[])]);
    const workflow=await getEventWorkflow(false); const streamers=clone(window.MattCMS?.get('streamers',[])||[]); const config=clone(window.MattDownloads?.getConfig?.()||{}); const downloads=(window.MattDownloads?.baseItems?.length||0)+(config.custom?.length||0)-(config.hidden?.length||0);
    const changes7=audit.filter(x=>new Date(x.created_at).getTime()>Date.now()-7*86400000).length;
    const draftEvents=events.filter(e=>workflow[String(e.id)]?.visibility==='draft').length;
    body.innerHTML=`<div class="matt-center-note"><strong>STATYSTYKI CMS</strong><p>To statystyki administracyjne strony. Nie śledzą odwiedzających ani ich zachowania.</p></div><div class="matt-stats-grid">
      <article><small>EVENTY</small><strong>${events.length}</strong><span>${draftEvents} szkiców</span></article>
      <article><small>PLIKI</small><strong>${Math.max(0,downloads)}</strong><span>pozycje w sekcji pobierania</span></article>
      <article><small>STREAMERZY</small><strong>${streamers.length}</strong><span>polecani twórcy w CMS</span></article>
      <article><small>ZMIANY / 7 DNI</small><strong>${changes7}</strong><span>zdarzenia w logach</span></article>
      <article><small>BACKUPY</small><strong>${backups.length}</strong><span>automatyczne + ręczne</span></article>
      <article><small>KOSZ</small><strong>${(trash||[]).length}</strong><span>elementy możliwe do przywrócenia</span></article>
    </div>`;
  }

  async function renderMaintenance(body) {
    const data=await freshKey(KEYS.maintenance,{enabled:false,sections:[],message:'Trwają prace techniczne. Wróć za chwilę.'});
    const selected=new Set(Array.isArray(data.sections)?data.sections:[]);
    const sections=[
      ['home','Strona główna'],['events','Eventy'],['discord','Discord'],['downloads','Do pobrania'],
      ['recommended','Polecani streamerzy'],['viewer','Sekcje dla widza'],['vip','VIP'],['rules','Regulaminy'],
      ['moderator','Moderacja'],['contact','Kontakt']
    ];
    body.innerHTML=`<div class="matt-center-note warning"><strong>TRYB KONSERWACJI</strong><p>Możesz wyłączyć całą publiczną stronę albo tylko wybrane sekcje. Administratorzy i moderatorzy nadal mają dostęp.</p></div><form class="matt-maintenance-form" data-maintenance-form>
      <label class="matt-switch-row"><input type="checkbox" name="enabled" ${data.enabled?'checked':''}><span><strong>WYŁĄCZ CAŁĄ STRONĘ DLA ODWIEDZAJĄCYCH</strong><small>Ma pierwszeństwo przed ustawieniami pojedynczych sekcji.</small></span></label>
      <div class="matt-maintenance-sections"><strong>WYŁĄCZ TYLKO WYBRANE SEKCJE</strong><div>${sections.map(([value,label])=>`<label><input type="checkbox" name="sections" value="${value}" ${selected.has(value)?'checked':''}><span>${label}</span></label>`).join('')}</div></div>
      <label><span>Komunikat dla odwiedzających</span><textarea name="message" rows="5">${esc(data.message||'')}</textarea></label>
      <button class="matt-primary" type="submit">ZAPISZ USTAWIENIA</button>
    </form>`;
    $('[data-maintenance-form]',body).onsubmit=async e=>{e.preventDefault();const f=e.currentTarget;const next={enabled:Boolean(f.elements.enabled.checked),sections:[...f.querySelectorAll('input[name="sections"]:checked')].map(x=>x.value),message:String(f.elements.message.value||'').trim()};await window.MattCMS.save(KEYS.maintenance,next);toast(next.enabled?'Tryb konserwacji całej strony został włączony.':next.sections.length?`Wyłączono ${next.sections.length} sekcji dla odwiedzających.`:'Tryb konserwacji został wyłączony.');if(typeof window.render==='function')await window.render();openCenter('maintenance');};
  }

  function enableVisitorPreview() {
    if(!has('cms.preview.mode'))return;
    document.body.classList.add('matt-visitor-preview');
    let bar=document.getElementById('mattVisitorPreviewBar');
    if(!bar){bar=document.createElement('div');bar.id='mattVisitorPreviewBar';bar.className='matt-visitor-preview-bar';bar.innerHTML='<strong>TRYB PODGLĄDU</strong><span>Narzędzia moderatora są chwilowo ukryte.</span><button type="button">ZAKOŃCZ PODGLĄD</button>';document.body.appendChild(bar);bar.querySelector('button').onclick=()=>{document.body.classList.remove('matt-visitor-preview');bar.remove();};}
  }

  async function setAccountSecurity(mutator) {
    const state=await freshKey(KEYS.security,{blocks:{},revocations:{}});state.blocks=state.blocks||{};state.revocations=state.revocations||{};mutator(state);await saveKey(KEYS.security,state,{backup:false});return state;
  }

  async function accountActivityModal(targetId,targetName,isSelf) {
    const rows=await recentAudit(250);const activity=rows.filter(x=>String(x.actor_user_id||'')===String(targetId)).slice(0,25);const security=await freshKey(KEYS.security,{blocks:{},revocations:{}});
    let sessionHtml='';
    if(isSelf){const {data:{session}}=await window.supabaseClient.auth.getSession();sessionHtml=session?`<div class="matt-session-current"><small>BIEŻĄCA SESJA</small><strong>Zalogowano: ${esc(fmt(session.user?.last_sign_in_at||session.created_at))}</strong><span>Wygasa: ${esc(fmt(session.expires_at?session.expires_at*1000:''))}</span><span>Przeglądarka: ${esc(navigator.userAgent)}</span></div>`:'';}
    openPreviewOverlay(`<div class="matt-account-activity"><div class="matt-center-note"><strong>${esc(targetName)}</strong><p>Supabase nie udostępnia z przeglądarki pełnej listy tokenów innych urządzeń. Panel pokazuje aktywność strony i pozwala wymusić ponowne logowanie.</p></div>${sessionHtml}<div class="matt-session-state"><span>Ostatnie wymuszenie logowania: <strong>${security.revocations?.[targetId]?esc(fmt(security.revocations[targetId])):'brak'}</strong></span><span>Blokada: <strong>${security.blocks?.[targetId]?.blocked?'AKTYWNA':'brak'}</strong></span></div><div class="matt-activity-list">${activity.length?activity.map(row=>`<article><span>${esc((row.action||'LOG').slice(0,2).toUpperCase())}</span><div><strong>${esc(auditLabel(row.action))}</strong><p>${esc(row.summary||'')}</p></div><time>${esc(fmt(row.created_at))}</time></article>`).join(''):'<div class="matt-center-empty">Brak zapisanej aktywności tego konta.</div>'}</div></div>`,`SESJE I AKTYWNOŚĆ`);
  }

  function applyModeratorPreviewFromStorage() {
    try{
      const raw=sessionStorage.getItem('matt_preview_as_moderator');if(!raw)return false;const data=JSON.parse(raw);if(!data||!Array.isArray(data.permissions))return false;
      window.currentUserRole='moderator';window.currentUserIsAdmin=false;window.currentUserPermissions=data.permissions;
      let original=window.mattHasPermission;
      window.mattHasPermission=p=>data.permissions.includes(p);
      let bar=document.getElementById('mattPreviewAsBar');if(!bar){bar=document.createElement('div');bar.id='mattPreviewAsBar';bar.className='matt-preview-as-bar';bar.innerHTML=`<div><strong>PODGLĄD JAKO MODERATOR: ${esc(data.username||'Moderator')}</strong><span>To tylko podgląd interfejsu — nie przejmujesz konta użytkownika.</span></div><button type="button">WRÓĆ DO ADMINISTRATORA</button>`;document.body.appendChild(bar);bar.querySelector('button').onclick=()=>{sessionStorage.removeItem('matt_preview_as_moderator');location.reload();};}
      window.dispatchEvent(new CustomEvent('matt-auth-change',{detail:{isAdmin:false,role:'moderator',permissions:data.permissions,preview:true}}));
      return true;
    }catch(_){return false;}
  }

  function enhanceAccountManager() {
    const modal=document.getElementById('accountManagerModal');if(!modal?.classList.contains('active'))return;
    const panel=$('.account-edit-panel',modal);if(!panel)return;
    const selected=$('.account-row.active',modal);if(!selected)return;
    const targetId=selected.dataset.accountId||'';const targetName=$('.account-editor-head h3',panel)?.textContent?.trim()||'Użytkownik';const isSelf=selected.querySelector('em')?.textContent?.includes('TY')||Boolean($('.account-badge.self',panel));
    const targetIsAdmin=Boolean($('.account-badge.admin',panel));const viewerIsAdmin=window.currentUserRole==='admin'||window.currentUserIsAdmin===true;if(targetIsAdmin&&!viewerIsAdmin)return;
    const actions=$('.account-security-actions',panel);if(!actions||actions.dataset.suite==='1')return;actions.dataset.suite='1';
    if(has('accounts.sessions.view')){const b=document.createElement('button');b.type='button';b.textContent='◉ SESJE / AKTYWNOŚĆ';b.onclick=()=>accountActivityModal(targetId,targetName,isSelf);actions.prepend(b);}
    if(!isSelf&&has('accounts.sessions.revoke')){const b=document.createElement('button');b.type='button';b.textContent='↻ WYMUS LOGOWANIE';b.onclick=async()=>{if(!confirm(`Wymusić ponowne logowanie użytkownika ${targetName}?`))return;await setAccountSecurity(s=>{s.revocations[targetId]=new Date().toISOString();});toast('Konto zostanie wylogowane przy następnym sprawdzeniu sesji.');};actions.appendChild(b);}
    if(!isSelf&&has('accounts.block')){const b=document.createElement('button');b.type='button';b.className='danger matt-account-block-btn';const refresh=async()=>{const st=await freshKey(KEYS.security,{blocks:{},revocations:{}});b.textContent=st.blocks?.[targetId]?.blocked?'ODBLOKUJ KONTO':'⊘ ZABLOKUJ KONTO';};refresh();b.onclick=async()=>{const st=await freshKey(KEYS.security,{blocks:{},revocations:{}});const blocked=Boolean(st.blocks?.[targetId]?.blocked);if(blocked){await setAccountSecurity(s=>{delete s.blocks[targetId];});toast('Konto odblokowane.');}else{const reason=prompt(`Powód blokady konta ${targetName}:`,'Dostęp tymczasowo zablokowany przez administrację.')||'';if(!reason)return;await setAccountSecurity(s=>{s.blocks[targetId]={blocked:true,blockedAt:new Date().toISOString(),blockedBy:userName(),reason};s.revocations[targetId]=new Date().toISOString();});toast('Konto zostało zablokowane.');}refresh();};actions.appendChild(b);}
    const role=panel.querySelector('select[name="account-role-choice"]')?.value||'';
    if(!isSelf&&role==='moderator'&&has('accounts.preview_as')){const b=document.createElement('button');b.type='button';b.textContent='👁 ZOBACZ PANEL JAKO TEN MODERATOR';b.className='matt-preview-user-btn';b.onclick=()=>{const perms=[...panel.querySelectorAll('[data-permissions] input[type=checkbox]:checked')].map(x=>x.value);sessionStorage.setItem('matt_preview_as_moderator',JSON.stringify({username:targetName,permissions:perms}));location.reload();};const editorActions=$('.account-editor-actions',panel);editorActions?.prepend(b);}
  }

  async function updateToolbarAlertBadge() {
    const btn=document.querySelector('[data-matt-suite-center]');if(!btn)return;
    let badge=btn.querySelector('.matt-suite-count');
    if(!has('cms.notifications.view')) { if(badge) badge.hidden=true; return; }
    try{const alerts=await buildAlerts();if(!badge){badge=document.createElement('span');badge.className='matt-suite-count';btn.appendChild(badge);}badge.textContent=String(alerts.length);badge.hidden=!alerts.length;}catch(_){ }
  }

  function injectToolbar() {
    const toolbar=document.getElementById('cms-admin-toolbar');if(!toolbar||toolbar.querySelector('[data-matt-suite-center]'))return;
    if(!any('cms.dashboard.view','cms.search','cms.history.view','cms.trash.view','cms.notifications.view','cms.links.check','statistics.view','site.maintenance.manage'))return;
    const btn=document.createElement('button');btn.type='button';btn.dataset.mattSuiteCenter='1';btn.innerHTML='◎ CENTRUM';btn.addEventListener('click',()=>openCenter('dashboard'));
    const backups=toolbar.querySelector('[data-cms-action="backups"]');toolbar.insertBefore(btn,backups||toolbar.querySelector('[data-cms-action="save"]'));
    updateToolbarAlertBadge();
  }

  async function enhanceEventManager() {
    const modal=document.querySelector('.cms-modal-backdrop.active');if(!modal)return;const title=$('#cms-modal-title',modal)?.textContent?.trim();if(title!=='EVENTY')return;const body=$('#cms-modal-body',modal);if(!body||body.dataset.suiteEvents==='1')return;body.dataset.suiteEvents='1';
    const workflow=await getEventWorkflow(true);const rows=await fetchEvents().catch(()=>[]);
    $$('.cms-event-manager-item',body).forEach(item=>{
      const edit=item.querySelector('[data-event-edit]');const view=item.querySelector('[data-event-view]');const id=edit?.dataset.eventEdit||view?.dataset.eventView;if(!id)return;const row=rows.find(r=>String(r.id)===String(id));const [label,cls]=workflowLabel(workflow[String(id)]||{},row);
      const summary=item.querySelector('.cms-event-manager-summary > div');if(summary&&!summary.querySelector('.matt-status-pill'))summary.insertAdjacentHTML('beforeend',`<em class="matt-status-pill ${cls}">${label}</em>`);
      const actions=item.lastElementChild;
      if(actions&&has('events.history.view')&&!actions.querySelector('[data-suite-event-history]')){const b=document.createElement('button');b.type='button';b.dataset.suiteEventHistory=id;b.textContent='HISTORIA';b.onclick=()=>showEventHistory(id,row?.title||'Event');actions.insertBefore(b,actions.firstChild);}
      if(actions&&has('events.duplicate')&&!actions.querySelector('[data-suite-event-duplicate]')){const b=document.createElement('button');b.type='button';b.dataset.suiteEventDuplicate=id;b.textContent='DUPLIKUJ';b.onclick=async()=>{b.disabled=true;try{await duplicateEvent(id);const close=modal.querySelector('.cms-modal-close');close?.click();setTimeout(()=>location.hash=location.hash,0);}catch(e){toast(e.message,'error');}finally{b.disabled=false;}};actions.insertBefore(b,actions.firstChild);}
      if(has('events.bulk.manage')&&!item.querySelector('[data-suite-event-select]')){const cb=document.createElement('input');cb.type='checkbox';cb.dataset.suiteEventSelect=id;cb.className='matt-bulk-check';item.prepend(cb);}
      const del=item.querySelector('[data-event-delete]');if(del)del.textContent='DO KOSZA';
    });
    if(has('events.bulk.manage'))injectEventBulkBar(body,rows);
  }

  function injectEventBulkBar(body,rows){if(body.querySelector('[data-suite-event-bulkbar]'))return;const bar=document.createElement('div');bar.className='matt-bulk-bar';bar.dataset.suiteEventBulkbar='1';bar.innerHTML='<strong>MASOWE OPERACJE</strong><button data-bulk-event="public">PUBLICZNE</button><button data-bulk-event="draft">SZKIC</button><button data-bulk-event="hidden">UKRYJ</button><button class="danger" data-bulk-event="trash">DO KOSZA</button>';body.querySelector('.cms-manager-actions')?.insertAdjacentElement('afterend',bar);$$('[data-bulk-event]',bar).forEach(btn=>btn.onclick=async()=>{const ids=$$('[data-suite-event-select]:checked',body).map(x=>x.dataset.suiteEventSelect);if(!ids.length)return toast('Zaznacz co najmniej jeden event.','error');const action=btn.dataset.bulkEvent;if(action==='trash'){if(!has('events.delete'))return toast('Brak uprawnienia do usuwania eventów.','error');if(!confirm(`Przenieść ${ids.length} eventów do kosza?`))return;for(const id of ids){const row=rows.find(r=>String(r.id)===String(id));if(row)await trashEvent(row);}document.querySelector('.cms-modal-close')?.click();return;}if(!has('events.publish'))return toast('Brak uprawnienia do publikowania eventów.','error');const map=await getEventWorkflow(true);ids.forEach(id=>{map[String(id)]={...(map[String(id)]||{}),visibility:action,publishAt:null,updatedAt:new Date().toISOString(),updatedBy:userName()};});await saveKey(KEYS.workflow,map,{backup:true});toast(`Zmieniono status ${ids.length} eventów.`);document.querySelector('.cms-modal-close')?.click();if(typeof window.render==='function')await window.render();});}

  async function enhanceEventForm() {
    const form=document.getElementById('cms-event-form');if(!form||form.dataset.suite==='1')return;form.dataset.suite='1';const id=lastEventEditId;const workflow=await getEventWorkflow(true);const meta=id?workflow[String(id)]||{}:{};const main=form.querySelector('.cms-event-form-pane');if(main)main.insertAdjacentHTML('beforeend',eventWorkflowSection(meta,!id));
    const actions=form.querySelector('.cms-event-form-actions-right');if(actions&&!actions.querySelector('[data-suite-preview-form]')){const b=document.createElement('button');b.type='button';b.dataset.suitePreviewForm='1';b.textContent='◉ PODGLĄD PRZED ZAPISEM';b.onclick=()=>{const preview=form.querySelector('[data-event-live-preview]')?.innerHTML||'';openPreviewOverlay(preview,'EVENT — PODGLĄD PRZED ZAPISEM');};actions.insertBefore(b,actions.firstChild);}
    const del=form.querySelector('[data-delete-current]');if(del)del.textContent='DO KOSZA';
    if(id)acquireEditLock(`event:${id}`,form.elements.title?.value||'Event').then(ok=>{if(!ok)document.querySelector('.cms-modal-close')?.click();});
  }

  async function enhanceDownloadsManager() {
    const modal=document.querySelector('.cms-modal-backdrop.active');if(!modal)return;const title=$('#cms-modal-title',modal)?.textContent?.trim();if(title!=='DO POBRANIA — PLIKI')return;const body=$('#cms-modal-body',modal);if(!body||body.dataset.suiteDownloads==='1')return;body.dataset.suiteDownloads='1';
    if(!has('downloads.bulk.manage'))return;const config=clone(window.MattDownloads?.getConfig?.()||{});
    $$('.cms-download-manager-item',body).forEach(item=>{const edit=item.querySelector('[data-edit-download]');const del=item.querySelector('[data-delete-download]');const id=edit?.dataset.editDownload||del?.dataset.deleteDownload;if(!id)return;const cb=document.createElement('input');cb.type='checkbox';cb.className='matt-bulk-check';cb.dataset.suiteDownloadSelect=id;item.prepend(cb);});
    const bar=document.createElement('div');bar.className='matt-bulk-bar';bar.innerHTML='<strong>MASOWE OPERACJE</strong><button data-bulk-download="public">PUBLICZNE</button><button data-bulk-download="draft">SZKIC</button><button data-bulk-download="hidden">UKRYJ</button><button class="danger" data-bulk-download="trash">DO KOSZA</button>';body.querySelector('.cms-manager-actions')?.insertAdjacentElement('afterend',bar);
    $$('[data-bulk-download]',bar).forEach(btn=>btn.onclick=async()=>{const ids=$$('[data-suite-download-select]:checked',body).map(x=>x.dataset.suiteDownloadSelect);if(!ids.length)return toast('Zaznacz pliki.','error');const action=btn.dataset.bulkDownload;if(action!=='trash'){if(!has('downloads.publish'))return toast('Brak uprawnienia do publikowania plików.','error');config.visibility=config.visibility||{};ids.forEach(id=>config.visibility[id]={...(config.visibility[id]||{}),visibility:action,publishAt:null});await window.MattCMS.save('downloads_config',config);toast('Zmieniono widoczność plików.');document.querySelector('.cms-modal-close')?.click();if(typeof window.render==='function')await window.render();return;}if(!has('downloads.delete'))return;for(const id of ids){const item=(window.MattDownloads?.resolvedItems?.()||[]).find(x=>String(x.id)===String(id));if(item)await trashDownloadItem(item,{base:item.source==='github',config});if((window.MattDownloads?.baseItems||[]).some(x=>String(x.id)===String(id))){config.hidden=config.hidden||[];if(!config.hidden.includes(id))config.hidden.push(id);}else config.custom=(config.custom||[]).filter(x=>String(x.id)!==String(id));config.order=(config.order||[]).filter(x=>String(x)!==String(id));}await window.MattCMS.save('downloads_config',config);toast('Pliki przeniesiono do kosza.');document.querySelector('.cms-modal-close')?.click();if(typeof window.render==='function')await window.render();});
  }

  async function enhanceStreamersManager() {
    const modal=document.querySelector('.cms-modal-backdrop.active');if(!modal)return;const title=$('#cms-modal-title',modal)?.textContent?.trim();if(title!=='POLECANI STREAMERZY')return;const body=$('#cms-modal-body',modal);if(!body||body.dataset.suiteStreamers==='1')return;body.dataset.suiteStreamers='1';const items=clone(window.MattCMS?.get('streamers',[])||[]);
    $$('.cms-manager-item',body).forEach((item,index)=>{const data=items[index];if(!data)return;const [label,cls]=[String(data._visibility||'public').toUpperCase(),String(data._visibility||'public')];item.querySelector('strong')?.insertAdjacentHTML('afterend',`<em class="matt-status-pill ${cls}">${esc(label)}</em>`);if(has('streamers.bulk.manage')){const cb=document.createElement('input');cb.type='checkbox';cb.className='matt-bulk-check';cb.dataset.suiteStreamerSelect=String(index);item.prepend(cb);}});
    if(has('streamers.bulk.manage')){const bar=document.createElement('div');bar.className='matt-bulk-bar';bar.innerHTML='<strong>MASOWE OPERACJE</strong><button data-bulk-streamer="public">PUBLICZNI</button><button data-bulk-streamer="draft">SZKIC</button><button data-bulk-streamer="hidden">UKRYJ</button><button class="danger" data-bulk-streamer="trash">DO KOSZA</button>';body.querySelector('.cms-manager-actions')?.insertAdjacentElement('afterend',bar);$$('[data-bulk-streamer]',bar).forEach(btn=>btn.onclick=async()=>{const indices=$$('[data-suite-streamer-select]:checked',body).map(x=>Number(x.dataset.suiteStreamerSelect)).sort((a,b)=>b-a);if(!indices.length)return toast('Zaznacz streamerów.','error');const action=btn.dataset.bulkStreamer;if(action==='trash'){if(!has('streamers.delete'))return;for(const i of indices){await trashCmsArrayItem('streamers',items[i],i,items[i]?.displayName||items[i]?.login);items.splice(i,1);}}else{if(!has('streamers.publish'))return toast('Brak uprawnienia do widoczności streamerów.','error');indices.forEach(i=>{if(items[i])items[i]._visibility=action;});}await window.MattCMS.save('streamers',items);toast('Zapisano masowe zmiany.');document.querySelector('.cms-modal-close')?.click();if(typeof window.render==='function')await window.render();});}
  }

  async function interceptDeletes(event) {
    const btn=event.target.closest('button');if(!btn||!isStaff())return;const modal=btn.closest('.cms-modal-backdrop.active');const title=modal?$('#cms-modal-title',modal)?.textContent?.trim():'';
    if(btn.matches('[data-event-delete]')){event.preventDefault();event.stopImmediatePropagation();const id=btn.dataset.eventDelete;const rows=await fetchEvents();const row=rows.find(x=>String(x.id)===String(id));if(!row)return;if(!confirm(`Przenieść event „${row.title||'Bez nazwy'}” do kosza na 30 dni?`))return;try{await trashEvent(row);modal.querySelector('.cms-modal-close')?.click();}catch(e){toast(e.message,'error');}return;}
    if(btn.matches('[data-delete-current]')&&lastEventEditId){event.preventDefault();event.stopImmediatePropagation();const rows=await fetchEvents();const row=rows.find(x=>String(x.id)===String(lastEventEditId));if(!row)return;if(!confirm(`Przenieść event „${row.title||'Bez nazwy'}” do kosza na 30 dni?`))return;try{await trashEvent(row);modal.querySelector('.cms-modal-close')?.click();}catch(e){toast(e.message,'error');}return;}
    if(title==='DISCORD — KANAŁY I KATEGORIE'&&(btn.matches('[data-delete-cat]')||btn.matches('[data-delete-channel]'))){event.preventDefault();event.stopImmediatePropagation();const cats=await freshKey('discord_channels',clone(window.MattCMS?.get('discord_channels',[])||[]));if(btn.matches('[data-delete-cat]')){const i=Number(btn.dataset.deleteCat),item=cats[i];if(!item||!confirm(`Przenieść kategorię „${item.title}” do kosza?`))return;await addTrash({kind:'discord-category',sourceKey:'discord_channels',label:item.title||'Kategoria Discord',payload:clone(item),meta:{index:i}});cats.splice(i,1);}else{const [ci,hi]=btn.dataset.deleteChannel.split(':').map(Number),item=cats[ci]?.channels?.[hi];if(!item||!confirm(`Przenieść kanał „${item.name}” do kosza?`))return;await addTrash({kind:'discord-channel',sourceKey:'discord_channels',label:item.name||'Kanał Discord',payload:clone(item),meta:{parentIndex:ci,parentId:String(cats[ci]?.id||cats[ci]?.title||ci),index:hi}});cats[ci].channels.splice(hi,1);}await window.MattCMS.save('discord_channels',cats);toast('Element Discorda przeniesiono do kosza.');modal.querySelector('.cms-modal-close')?.click();if(typeof window.render==='function')await window.render();return;}
    if(title==='DISCORD — KOMUNIKATY'&&btn.matches('[data-delete]')){event.preventDefault();event.stopImmediatePropagation();const arr=await freshKey('discord_join_bubbles',clone(window.MattCMS?.get('discord_join_bubbles',[])||[]));const i=Number(btn.dataset.delete),item=arr[i];if(!item||!confirm(`Przenieść komunikat „${item.title||'Komunikat'}” do kosza?`))return;await addTrash({kind:'discord-bubble',sourceKey:'discord_join_bubbles',label:item.title||'Komunikat Discord',payload:clone(item),meta:{index:i}});arr.splice(i,1);await window.MattCMS.save('discord_join_bubbles',arr);toast('Komunikat przeniesiono do kosza.');modal.querySelector('.cms-modal-close')?.click();if(typeof window.render==='function')await window.render();return;}
    if(title==='DISCORD — PODGLĄD SERWERA'&&(btn.matches('[data-del-cat],[data-del-ch],[data-del-msg],[data-del-group],[data-del-member]'))){event.preventDefault();event.stopImmediatePropagation();const data=await freshKey('discord_join_preview',clone(window.MattCMS?.get('discord_join_preview',{})||{}));data.categories=Array.isArray(data.categories)?data.categories:[];data.messages=Array.isArray(data.messages)?data.messages:[];data.memberGroups=Array.isArray(data.memberGroups)?data.memberGroups:[];let rec=null;
      if(btn.matches('[data-del-cat]')){const i=Number(btn.dataset.delCat),x=data.categories[i];if(x)rec={kind:'discord-preview-category',label:x.title||'Kategoria',payload:clone(x),meta:{index:i},remove:()=>data.categories.splice(i,1)};}
      if(btn.matches('[data-del-ch]')){const [ci,hi]=btn.dataset.delCh.split(':').map(Number),x=data.categories[ci]?.channels?.[hi];if(x)rec={kind:'discord-preview-channel',label:x.name||'Kanał',payload:clone(x),meta:{parentIndex:ci,index:hi},remove:()=>data.categories[ci].channels.splice(hi,1)};}
      if(btn.matches('[data-del-msg]')){const i=Number(btn.dataset.delMsg),x=data.messages[i];if(x)rec={kind:'discord-preview-message',label:`Wiadomość ${x.author||''}`,payload:clone(x),meta:{index:i},remove:()=>data.messages.splice(i,1)};}
      if(btn.matches('[data-del-group]')){const i=Number(btn.dataset.delGroup),x=data.memberGroups[i];if(x)rec={kind:'discord-preview-group',label:x.title||'Grupa',payload:clone(x),meta:{index:i},remove:()=>data.memberGroups.splice(i,1)};}
      if(btn.matches('[data-del-member]')){const [gi,mi]=btn.dataset.delMember.split(':').map(Number),x=data.memberGroups[gi]?.members?.[mi];if(x)rec={kind:'discord-preview-member',label:x.name||'Osoba',payload:clone(x),meta:{parentIndex:gi,index:mi},remove:()=>data.memberGroups[gi].members.splice(mi,1)};}
      if(!rec||!confirm(`Przenieść „${rec.label}” do kosza?`))return;await addTrash({kind:rec.kind,sourceKey:'discord_join_preview',label:rec.label,payload:rec.payload,meta:rec.meta});rec.remove();await window.MattCMS.save('discord_join_preview',data);toast('Element podglądu Discorda przeniesiono do kosza.');modal.querySelector('.cms-modal-close')?.click();if(typeof window.render==='function')await window.render();return;
    }
  }

  function trackEventOpenClicks(event){const edit=event.target.closest('[data-event-edit]');if(edit)lastEventEditId=edit.dataset.eventEdit;const add=event.target.closest('[data-event-add]');if(add)lastEventEditId=null;}

  function enhanceDom() {
    if(observerQueued)return;observerQueued=true;requestAnimationFrame(async()=>{observerQueued=false;injectToolbar();enhanceAccountManager();await enhanceEventManager();await enhanceEventForm();await enhanceDownloadsManager();await enhanceStreamersManager();});
  }

  function install() {
    document.addEventListener('click',trackEventOpenClicks,true);
    document.addEventListener('click',interceptDeletes,true);
    new MutationObserver(enhanceDom).observe(document.body,{childList:true,subtree:true});
    window.addEventListener('matt-auth-change',(event)=>setTimeout(()=>{
      if(event?.detail?.preview===true){enhanceDom();return;}
      if(!applyModeratorPreviewFromStorage())enhanceDom();
    },50));
    window.addEventListener('hashchange',()=>setTimeout(enhanceDom,50));
    document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{applyModeratorPreviewFromStorage();enhanceDom();},100));
    if(document.readyState!=='loading')setTimeout(()=>{applyModeratorPreviewFromStorage();enhanceDom();},100);
  }

  window.MattSuite = {
    addTrash, trashCmsArrayItem, trashDownloadItem, trashEvent, restoreTrashItem,
    getEventWorkflow, setEventWorkflow, saveEventWorkflowFromForm, duplicateEvent, showEventHistory,
    acquireEditLock, releaseEditLock, openCenter, openPreviewOverlay, enableVisitorPreview,
    buildAlerts, setAccountSecurity
  };

  install();
})();
