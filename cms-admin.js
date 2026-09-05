(() => {
  let inlineEditing = false;
  let inlineSnapshot = new Map();
  let toolbar = null;
  let modal = null;
  let layoutEditing = false;
  let layoutDraft = null;
  let layoutGlobalDraft = null;
  let layoutSelectedId = null;
  let layoutController = null;
  let layoutDraggedId = null;
  let layoutFreeDrag = null;
  const TOOLBAR_COLLAPSE_KEY = 'matt_cms_toolbar_collapsed';
  const TOOLBAR_ORIENTATION_KEY = 'matt_cms_toolbar_orientation_v1';
  const TOOLBAR_POSITION_KEY = 'matt_cms_toolbar_position_v3';
  const TOOLBAR_POSITION_OLD_KEY = 'matt_cms_toolbar_position_v2';
  const TOOLBAR_DOCK_SNAP = 34;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const clone = value => JSON.parse(JSON.stringify(value));

  function isToolbarCollapsed() {
    try { return localStorage.getItem(TOOLBAR_COLLAPSE_KEY) === '1'; }
    catch (_) { return false; }
  }

  function getToolbarOrientation() {
    try { return localStorage.getItem(TOOLBAR_ORIENTATION_KEY) === 'vertical' ? 'vertical' : 'horizontal'; }
    catch (_) { return 'horizontal'; }
  }

  function setToolbarOrientation(value) {
    const orientation = value === 'vertical' ? 'vertical' : 'horizontal';
    try { localStorage.setItem(TOOLBAR_ORIENTATION_KEY, orientation); }
    catch (_) {}
    // Pionowy pasek ma zawsze być przyklejony do lewej lub prawej krawędzi.
    if (orientation === 'vertical') ensureToolbarDocked();
    applyToolbarState();
  }

  function setToolbarCollapsed(value) {
    try { localStorage.setItem(TOOLBAR_COLLAPSE_KEY, value ? '1' : '0'); }
    catch (_) {}
    // Po zwinięciu uchwyt ma zawsze zostać przy lewej lub prawej krawędzi.
    if (value) ensureToolbarDocked();
    applyToolbarState();
  }

  function normalizeToolbarPosition(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const top = Number(raw.top);
    if (!Number.isFinite(top)) return null;
    if (raw.mode === 'dock-left' || raw.mode === 'dock-right') return { mode:raw.mode, top };
    const left = Number(raw.left);
    if (Number.isFinite(left)) return { mode:'free', left, top };
    return null;
  }

  function getToolbarPosition() {
    try {
      let raw = normalizeToolbarPosition(JSON.parse(localStorage.getItem(TOOLBAR_POSITION_KEY) || 'null'));
      if (raw) return raw;
      const old = normalizeToolbarPosition(JSON.parse(localStorage.getItem(TOOLBAR_POSITION_OLD_KEY) || 'null'));
      if (old) return old;
    } catch (_) {}
    return null;
  }

  function saveToolbarPosition(left, top) {
    try { localStorage.setItem(TOOLBAR_POSITION_KEY, JSON.stringify({ mode:'free', left:Math.round(left), top:Math.round(top) })); }
    catch (_) {}
  }

  function saveToolbarDock(side, top) {
    const mode = side === 'right' ? 'dock-right' : 'dock-left';
    try { localStorage.setItem(TOOLBAR_POSITION_KEY, JSON.stringify({ mode, top:Math.round(top) })); }
    catch (_) {}
  }

  function ensureToolbarDocked(preferredSide = null) {
    if (!toolbar) return;
    const current = getToolbarPosition();
    if (!preferredSide && (current?.mode === 'dock-left' || current?.mode === 'dock-right')) return;

    const rect = toolbar.getBoundingClientRect();
    const side = preferredSide === 'left' || preferredSide === 'right'
      ? preferredSide
      : ((rect.left + rect.width / 2) <= window.innerWidth / 2 ? 'left' : 'right');
    const maxTop = Math.max(8, window.innerHeight - Math.max(48, rect.height || toolbar.offsetHeight || 48) - 8);
    const top = Math.max(8, Math.min(maxTop, Number.isFinite(rect.top) ? rect.top : 18));
    saveToolbarDock(side, top);
  }

  function resetToolbarPosition() {
    try {
      localStorage.removeItem(TOOLBAR_POSITION_KEY);
      localStorage.removeItem(TOOLBAR_POSITION_OLD_KEY);
    } catch (_) {}
    applyToolbarState();
  }

  function applyToolbarPosition() {
    if (!toolbar) return;
    const pos = getToolbarPosition();
    toolbar.classList.remove('cms-docked-left','cms-docked-right');
    toolbar.style.removeProperty('left');
    toolbar.style.removeProperty('top');
    toolbar.style.removeProperty('right');
    toolbar.style.removeProperty('bottom');
    if (!pos) return;

    const maxTop = Math.max(8, window.innerHeight - Math.max(48, toolbar.offsetHeight) - 8);
    const top = Math.max(8, Math.min(maxTop, pos.top));

    if (pos.mode === 'dock-left') {
      toolbar.classList.add('cms-docked-left');
      toolbar.style.left = '0px';
      toolbar.style.right = 'auto';
      toolbar.style.top = `${top}px`;
      toolbar.style.bottom = 'auto';
      return;
    }
    if (pos.mode === 'dock-right') {
      toolbar.classList.add('cms-docked-right');
      toolbar.style.right = '0px';
      toolbar.style.left = 'auto';
      toolbar.style.top = `${top}px`;
      toolbar.style.bottom = 'auto';
      return;
    }

    const maxLeft = Math.max(8, window.innerWidth - Math.max(48, toolbar.offsetWidth) - 8);
    const left = Math.max(8, Math.min(maxLeft, Number(pos.left) || 8));
    toolbar.style.left = `${left}px`;
    toolbar.style.top = `${top}px`;
    toolbar.style.right = 'auto';
    toolbar.style.bottom = 'auto';
  }

  function bindToolbarDrag() {
    const handle = $('.cms-toolbar-drag-handle', toolbar);
    if (!handle || handle.dataset.bound === '1') return;
    handle.dataset.bound = '1';
    handle.addEventListener('dblclick', e => {
      e.preventDefault();
      resetToolbarPosition();
      notify('Przywrócono domyślne położenie paska administratora.');
    });
    handle.addEventListener('pointerdown', e => {
      if (e.button !== 0 || isToolbarCollapsed()) return;
      e.preventDefault();
      const rect = toolbar.getBoundingClientRect();
      const dx = e.clientX - rect.left;
      const dy = e.clientY - rect.top;
      let dockCandidate = null;
      toolbar.classList.add('cms-toolbar-dragging');
      toolbar.classList.remove('cms-docked-left','cms-docked-right');

      const move = ev => {
        const width = toolbar.offsetWidth;
        const height = toolbar.offsetHeight;
        const maxLeft = Math.max(0, window.innerWidth - width);
        const maxTop = Math.max(8, window.innerHeight - height - 8);
        const desiredLeft = ev.clientX - dx;
        const top = Math.max(8, Math.min(maxTop, ev.clientY - dy));
        const vertical = getToolbarOrientation() === 'vertical';

        if (vertical) {
          // W orientacji pionowej pasek zawsze jest dokowany. Przeciągnięcie przez
          // środek ekranu przełącza go pomiędzy lewą i prawą krawędzią.
          dockCandidate = ev.clientX <= window.innerWidth / 2 ? 'left' : 'right';
          toolbar.style.left = dockCandidate === 'left' ? '0px' : `${maxLeft}px`;
        } else if (desiredLeft <= TOOLBAR_DOCK_SNAP) {
          dockCandidate = 'left';
          toolbar.style.left = '0px';
        } else if (desiredLeft >= maxLeft - TOOLBAR_DOCK_SNAP) {
          dockCandidate = 'right';
          toolbar.style.left = `${maxLeft}px`;
        } else {
          dockCandidate = null;
          toolbar.style.left = `${Math.max(8, Math.min(Math.max(8,maxLeft-8), desiredLeft))}px`;
        }
        toolbar.style.top = `${top}px`;
        toolbar.style.right = 'auto';
        toolbar.style.bottom = 'auto';
        toolbar.classList.toggle('cms-dock-preview-left', dockCandidate === 'left');
        toolbar.classList.toggle('cms-dock-preview-right', dockCandidate === 'right');
      };

      const up = () => {
        document.removeEventListener('pointermove', move);
        toolbar.classList.remove('cms-toolbar-dragging','cms-dock-preview-left','cms-dock-preview-right');
        const end = toolbar.getBoundingClientRect();
        if (dockCandidate || getToolbarOrientation() === 'vertical') {
          const side = dockCandidate || (end.left + end.width/2 <= window.innerWidth/2 ? 'left' : 'right');
          saveToolbarDock(side, end.top);
          applyToolbarPosition();
          notify(`Pasek przypięty do ${side === 'right' ? 'prawej' : 'lewej'} krawędzi.`);
        } else {
          saveToolbarPosition(end.left, end.top);
        }
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up, { once:true });
    });
  }

  function applyToolbarState() {
    if (!toolbar) return;
    const collapsed = isToolbarCollapsed();
    const orientation = getToolbarOrientation();
    if (collapsed || orientation === 'vertical') ensureToolbarDocked();
    toolbar.classList.toggle('cms-collapsed', collapsed);
    toolbar.classList.toggle('cms-toolbar-vertical', orientation === 'vertical');
    toolbar.classList.toggle('cms-toolbar-horizontal', orientation !== 'vertical');
    const toggleBtn = $('[data-cms-action="toggle-toolbar"]', toolbar);
    if (toggleBtn) {
      toggleBtn.innerHTML = collapsed ? '☰' : '−';
      toggleBtn.title = collapsed ? 'Pokaż pasek administratora' : 'Ukryj pasek administratora';
      toggleBtn.setAttribute('aria-label', toggleBtn.title);
    }
    const orientationBtn = $('[data-cms-action="toolbar-orientation"]', toolbar);
    if (orientationBtn) {
      orientationBtn.innerHTML = orientation === 'vertical' ? '↔' : '↕';
      orientationBtn.title = orientation === 'vertical' ? 'Zmień pasek na poziomy' : 'Zmień pasek na pionowy';
      orientationBtn.setAttribute('aria-label', orientationBtn.title);
    }
    applyToolbarPosition();
  }

  function currentRoute() {
    const raw = location.hash.replace(/^#\/?/, '').split('?')[0].replace(/^\/+|\/+$/g, '');
    return raw || 'home';
  }

  function slugify(value) {
    return String(value || 'kategoria').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `kategoria-${Date.now()}`;
  }


  function cmsImageExtension(file) {
    const name = String(file?.name || '');
    const fromName = name.includes('.') ? name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    if (fromName && fromName.length <= 5) return fromName === 'jpeg' ? 'jpg' : fromName;
    const mime = String(file?.type || '').toLowerCase();
    if (mime === 'image/png') return 'png';
    if (mime === 'image/webp') return 'webp';
    if (mime === 'image/gif') return 'gif';
    return 'jpg';
  }

  function cmsImageLabel(value) {
    if (!value) return 'Nie wybrano pliku';
    try {
      const clean = decodeURIComponent(String(value).split('?')[0]);
      return clean.split('/').filter(Boolean).pop() || 'Aktualne zdjęcie';
    } catch (_) { return 'Aktualne zdjęcie'; }
  }

  function cmsCompactStamp() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  function validateCmsImage(file) {
    if (!file) return;
    if (!String(file.type || '').startsWith('image/')) throw new Error('Wybierz plik graficzny (JPG, PNG, WEBP lub GIF).');
    if (file.size > 10 * 1024 * 1024) throw new Error('Zdjęcie jest za duże. Maksymalny rozmiar pliku to 10 MB.');
  }

  async function uploadCmsImage(file, itemLabel, folder = 'moderators') {
    validateCmsImage(file);
    if (!window.supabaseClient) throw new Error('Brak połączenia z Supabase.');
    const safeFolder = slugify(folder || 'obrazy');
    const safeName = slugify(itemLabel || 'zdjecie').slice(0, 48) || 'zdjecie';
    const path = `${safeFolder}/${safeName}-${cmsCompactStamp()}.${cmsImageExtension(file)}`;
    const { error } = await window.supabaseClient.storage.from('cms-images').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined
    });
    if (error) throw new Error(`Nie udało się wysłać zdjęcia: ${error.message}`);
    return window.supabaseClient.storage.from('cms-images').getPublicUrl(path).data.publicUrl;
  }


  function cmsDownloadExtension(file) {
    const name = String(file?.name || '');
    const raw = name.includes('.') ? name.split('.').pop() : '';
    return String(raw || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) || 'bin';
  }

  function cmsPrettyBytes(bytes) {
    const n = Number(bytes || 0);
    if (!Number.isFinite(n) || n <= 0) return '';
    if (n < 1024) return `${Math.round(n)} B`;
    if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
    return `${(n / (1024 * 1024)).toFixed(n >= 10 * 1024 * 1024 ? 0 : 1).replace('.', ',')} MB`;
  }

  function validateCmsDownload(file) {
    if (!file) throw new Error('Wybierz plik z dysku.');
    if (file.size <= 0) throw new Error('Wybrany plik jest pusty.');
    if (file.size > 50 * 1024 * 1024) throw new Error('Plik jest za duży. Maksymalny rozmiar w konfiguratorze to 50 MB.');
  }

  async function uploadCmsDownload(file, itemLabel) {
    validateCmsDownload(file);
    if (!window.supabaseClient) throw new Error('Brak połączenia z Supabase.');
    const safeName = slugify(itemLabel || file.name || 'plik').slice(0, 55) || 'plik';
    const ext = cmsDownloadExtension(file);
    const path = `files/${safeName}-${cmsCompactStamp()}.${ext}`;
    const { error } = await window.supabaseClient.storage.from('cms-downloads').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'application/octet-stream'
    });
    if (error) {
      const raw = String(error.message || 'Nieznany błąd');
      if (/bucket|not found/i.test(raw)) throw new Error('Brakuje bucketu cms-downloads w Supabase. Uruchom przygotowany plik CMS_UPDATE_DOWNLOADS.sql.');
      throw new Error(`Nie udało się wysłać pliku: ${raw}`);
    }
    const publicUrl = window.supabaseClient.storage.from('cms-downloads').getPublicUrl(path).data.publicUrl;
    return {
      href: publicUrl,
      storagePath: path,
      fileName: file.name,
      type: ext.toUpperCase(),
      sizeLabel: cmsPrettyBytes(file.size)
    };
  }

  function isAdmin() { return window.currentUserRole === 'admin' || window.currentUserIsAdmin === true || (window.currentUserRole === 'moderator' && Array.isArray(window.currentUserPermissions) && window.currentUserPermissions.length > 0); }
  function has(permission) { return window.mattHasPermission?.(permission) === true; }
  function any(...permissions) { return permissions.some(has); }

  function formatBackupDate(value) {
    try { return new Intl.DateTimeFormat('pl-PL', { dateStyle:'medium', timeStyle:'short' }).format(new Date(value)); }
    catch (_) { return String(value || ''); }
  }

  function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function resetCmsKey(key, label = 'tę sekcję') {
    if (!has('github.restore')) { notify('Brak uprawnienia do przywracania wersji z GitHuba.', 'error'); return; }
    if (window.MattCMS?.get(key, null) == null) {
      notify('Ta sekcja już korzysta z treści bazowej z GitHuba.');
      return;
    }
    if (!confirm(`Przywrócić ${label} do wersji zapisanej w plikach na GitHubie? Obecna wersja CMS zostanie zachowana w automatycznym backupie.`)) return;
    try {
      await window.MattCMS.remove(key);
      notify('Przywrócono wersję bazową z GitHuba.');
      await rerender();
    } catch (error) { notify(`Nie udało się przywrócić: ${error.message}`, 'error'); }
  }

  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'cms-modal-backdrop';
    modal.innerHTML = `<div class="cms-modal" role="dialog" aria-modal="true">
      <div class="cms-modal-head"><div><small>PANEL ADMINISTRATORA</small><h2 id="cms-modal-title">EDYCJA</h2></div><button type="button" class="cms-modal-close" aria-label="Zamknij">×</button></div>
      <div class="cms-modal-body" id="cms-modal-body"></div>
    </div>`;
    document.body.appendChild(modal);
    $('.cms-modal-close', modal).addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    return modal;
  }

  function openModal(title, html) {
    ensureModal();
    const kicker = $('.cms-modal-head small', modal);
    if (kicker) kicker.textContent = window.currentUserRole === 'admin' ? 'PANEL ADMINISTRATORA' : 'PANEL MODERATORA';
    $('#cms-modal-title', modal).textContent = title;
    $('#cms-modal-body', modal).innerHTML = html;
    modal.classList.add('active');
  }

  function closeModal() { modal?.classList.remove('active'); }

  function notify(message, type = 'ok') {
    let el = document.getElementById('cms-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'cms-toast';
      document.body.appendChild(el);
    }
    el.className = `cms-toast ${type}`;
    el.textContent = message;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 2800);
  }

  async function rerender() {
    closeModal();
    if (typeof window.render === 'function') await window.render();
    else location.reload();
    refreshToolbar();
  }

  function configForRoute(route) {
    if (route === 'recommended') return { label: 'STREAMERZY', action: openStreamersManager, permission:'streamers.manage' };
    if (['moderator/team','moderator/rules'].includes(route)) return { label: 'OSOBY W MODERACJI', action: openModeratorsManager, permission:'moderation.people.manage' };
    if (['moderator/benefits','moderator/how-to'].includes(route)) return { label: 'KORZYŚCI', action: openBenefitsManager, permission:'moderation.benefits.manage' };
    if (['viewer/commands','vip/commands','moderator/commands'].includes(route)) return { label: 'KOMENDY', action: openCommandsManager, permission:'commands.manage' };
    if (['viewer/downloads','downloads'].includes(route)) return { label: 'PLIKI DO POBRANIA', action: openDownloadsManager, permission:'downloads.any' };
    if (route === 'contact') return { label: 'TEMATY FORMULARZA', action: openTopicsManager, permission:'contact.topics.manage' };
    if (route === 'discord/channels') return { label: 'KANAŁY I KATEGORIE', action: openDiscordManager, permission:'discord.channels.manage' };
    if (route === 'discord/join') return { label: 'PODGLĄD / KOMUNIKATY', action: openDiscordJoinManager, permission:'discord.join.manage' };
    if (route.startsWith('rules/') && route !== 'rules/game-picks') return { label: 'ZASADY REGULAMINU', action: openRulesManager, permission:'rules.manage' };
    return null;
  }

  function canConfig(config) {
    if (!config) return false;
    if (config.permission === 'downloads.any') return any('downloads.create','downloads.edit','downloads.delete','downloads.reorder');
    return has(config.permission);
  }

  function normalizeLayoutDraft(value) {
    const data = clone(value || {});
    return {
      version: 2,
      offsets: data.offsets && typeof data.offsets === 'object' ? data.offsets : {},
      sizes: data.sizes && typeof data.sizes === 'object' ? data.sizes : {},
      orders: data.orders && typeof data.orders === 'object' ? data.orders : {}
    };
  }

  function layoutCandidates() {
    return window.MattCMS?.layoutElements?.(currentRoute()) || [];
  }

  function layoutCandidateById(id) {
    return layoutCandidates().find(el => el.dataset.cmsLayoutId === id) || null;
  }

  function layoutSectionForElement(el) {
    if (!el) return null;
    const primary = 'section,.site-header,.site-footer,[class*="-section"],[class*="-hero"],[class*="-panel"]';
    let node = el.parentElement;
    while (node && node !== document.body) {
      if (node.matches?.(primary) && node.dataset?.cmsLayoutId) return node;
      node = node.parentElement;
    }
    const fallback = 'article,aside,[class*="-card"],[class*="-grid"],[class*="-wrap"],[class*="-content"]';
    node = el.parentElement;
    while (node && node !== document.body) {
      if (node.matches?.(fallback) && node.dataset?.cmsLayoutId) return node;
      node = node.parentElement;
    }
    return null;
  }

  function selectLayoutWholeSection() {
    const selected = layoutCandidateById(layoutSelectedId);
    const section = layoutSectionForElement(selected);
    if (!section) {
      notify('Dla tego elementu nie znaleziono większej sekcji do zaznaczenia.', 'error');
      return;
    }
    layoutSelectedId = section.dataset.cmsLayoutId;
    updateLayoutDesignerSelection();
    section.scrollIntoView?.({ block:'nearest', inline:'nearest', behavior:'smooth' });
  }

  function layoutDraftForElement(el) {
    return el?.dataset?.cmsLayoutZone === 'global' ? layoutGlobalDraft : layoutDraft;
  }

  function layoutGroupElements(parentKey) {
    return layoutCandidates().filter(el => el.dataset.cmsLayoutParent === parentKey);
  }

  function layoutCurrentOrder(parentKey) {
    const group = layoutGroupElements(parentKey);
    const draft = layoutDraftForElement(group[0]);
    const saved = Array.isArray(draft?.orders?.[parentKey]) ? draft.orders[parentKey] : [];
    const ids = group.map(el => el.dataset.cmsLayoutId);
    return [...saved.filter(id => ids.includes(id)), ...ids.filter(id => !saved.includes(id))];
  }

  function applyDraftDataToElements(draft, elements) {
    const byId = new Map(elements.map(el => [el.dataset.cmsLayoutId, el]));
    Object.entries(draft?.offsets || {}).forEach(([id,pos]) => {
      const el = byId.get(id); if (!el) return;
      const x = Number(pos?.x || 0), y = Number(pos?.y || 0);
      if (x || y) { el.style.translate = `${x}px ${y}px`; el.classList.add('cms-layout-applied'); }
    });
    Object.entries(draft?.sizes || {}).forEach(([id,size]) => {
      const el = byId.get(id); if (!el) return;
      const w = Number(size?.width || 0), h = Number(size?.height || 0);
      if (w > 0) el.style.width = `${w}px`;
      if (h > 0) el.style.height = `${h}px`;
      if (w > 0 || h > 0) el.classList.add('cms-layout-sized');
    });
    Object.entries(draft?.orders || {}).forEach(([parentKey, ids]) => {
      if (!Array.isArray(ids)) return;
      const group = elements.filter(el => el.dataset.cmsLayoutParent === parentKey);
      const parent = group[0]?.parentElement;
      if (!parent || !/(grid|flex)/.test(getComputedStyle(parent).display)) return;
      const rank = new Map(ids.map((id,i)=>[id,i]));
      group.forEach((el,i)=>el.style.order=String(rank.has(el.dataset.cmsLayoutId)?rank.get(el.dataset.cmsLayoutId):ids.length+i));
    });
  }

  function applyLayoutDraftToDom() {
    const elements = layoutCandidates();
    elements.forEach(el => {
      el.style.removeProperty('translate');
      el.style.removeProperty('order');
      el.style.removeProperty('width');
      el.style.removeProperty('height');
      el.classList.remove('cms-layout-applied','cms-layout-sized');
    });
    applyDraftDataToElements(layoutGlobalDraft, elements.filter(el => el.dataset.cmsLayoutZone === 'global'));
    applyDraftDataToElements(layoutDraft, elements.filter(el => el.dataset.cmsLayoutZone !== 'global'));
  }

  function updateLayoutDesignerSelection() {
    const panel = document.getElementById('cms-layout-designer');
    if (!panel) return;
    const selected = layoutCandidateById(layoutSelectedId);
    const draft = layoutDraftForElement(selected);
    const label = $('[data-layout-selected]', panel);
    const pos = $('[data-layout-position]', panel);
    const zone = $('[data-layout-zone]', panel);
    if (label) label.textContent = selected ? (selected.dataset.cmsLayoutLabel || 'Wybrany element') : 'Kliknij dowolny element na stronie';
    const offset = selected ? (draft?.offsets?.[selected.dataset.cmsLayoutId] || {x:0,y:0}) : {x:0,y:0};
    const size = selected ? (draft?.sizes?.[selected.dataset.cmsLayoutId] || {}) : {};
    const rect = selected?.getBoundingClientRect?.();
    if (pos) pos.textContent = selected ? `X ${Number(offset.x||0)} px · Y ${Number(offset.y||0)} px · ${Math.round(Number(size.width || rect?.width || 0))}×${Math.round(Number(size.height || rect?.height || 0))} px` : 'Brak zaznaczenia';
    if (zone) zone.textContent = selected ? (selected.dataset.cmsLayoutZone === 'global' ? 'GLOBALNY · NAGŁÓWEK / STOPKA' : `PODSTRONA · ${currentRoute().toUpperCase()}`) : '—';
    panel.querySelectorAll('[data-layout-nudge],[data-layout-size],[data-layout-order],[data-layout-reset-element]').forEach(btn => btn.disabled = !selected);
    const sectionBtn = $('[data-layout-select-section]', panel);
    const section = layoutSectionForElement(selected);
    if (sectionBtn) {
      sectionBtn.disabled = !section;
      sectionBtn.textContent = section ? `ZAZNACZ CAŁĄ SEKCJĘ · ${String(section.dataset.cmsLayoutLabel || 'SEKCJA').slice(0,42)}` : 'ZAZNACZ CAŁĄ SEKCJĘ';
    }
    layoutCandidates().forEach(el => el.classList.toggle('cms-layout-selected', !!selected && el === selected));
  }

  function updateLayoutOrder(parentKey, ids) {
    const group = layoutGroupElements(parentKey);
    const draft = layoutDraftForElement(group[0]);
    if (!draft.orders) draft.orders = {};
    draft.orders[parentKey] = [...ids];
    applyLayoutDraftToDom();
  }

  function moveLayoutSelectedOrder(delta) {
    const el = layoutCandidateById(layoutSelectedId);
    if (!el) return;
    const parentKey = el.dataset.cmsLayoutParent;
    const group = layoutGroupElements(parentKey);
    if (group.length < 2 || !/(grid|flex)/.test(getComputedStyle(el.parentElement).display)) {
      notify('Tego elementu nie można przestawić kolejnością. Użyj strzałek położenia.', 'error');
      return;
    }
    const order = layoutCurrentOrder(parentKey);
    const index = order.indexOf(layoutSelectedId);
    const target = Math.max(0, Math.min(order.length - 1, index + delta));
    if (index < 0 || target === index) return;
    order.splice(index, 1); order.splice(target, 0, layoutSelectedId);
    updateLayoutOrder(parentKey, order);
  }

  function nudgeLayoutSelected(dx, dy) {
    const el = layoutCandidateById(layoutSelectedId); if (!el) return;
    const draft = layoutDraftForElement(el);
    if (!draft.offsets) draft.offsets = {};
    const old = draft.offsets[layoutSelectedId] || {x:0,y:0};
    draft.offsets[layoutSelectedId] = {
      x: Math.max(-1200, Math.min(1200, Number(old.x || 0) + dx)),
      y: Math.max(-1200, Math.min(1200, Number(old.y || 0) + dy))
    };
    applyLayoutDraftToDom(); updateLayoutDesignerSelection();
  }

  function resizeLayoutSelected(dw, dh) {
    const el = layoutCandidateById(layoutSelectedId); if (!el) return;
    const draft = layoutDraftForElement(el);
    if (!draft.sizes) draft.sizes = {};
    const old = draft.sizes[layoutSelectedId] || {};
    const rect = el.getBoundingClientRect();
    const currentW = Number(old.width || rect.width || 100);
    const currentH = Number(old.height || rect.height || 40);
    draft.sizes[layoutSelectedId] = {
      width: Math.max(24, Math.min(1800, currentW + dw)),
      height: Math.max(16, Math.min(1200, currentH + dh))
    };
    applyLayoutDraftToDom(); updateLayoutDesignerSelection();
  }

  function resetLayoutSelected() {
    const el = layoutCandidateById(layoutSelectedId); if (!el) return;
    const draft = layoutDraftForElement(el);
    delete draft.offsets?.[layoutSelectedId];
    delete draft.sizes?.[layoutSelectedId];
    Object.keys(draft.orders || {}).forEach(key => {
      draft.orders[key] = (draft.orders[key] || []).filter(id => id !== layoutSelectedId);
      if (!draft.orders[key].length) delete draft.orders[key];
    });
    applyLayoutDraftToDom(); updateLayoutDesignerSelection();
  }

  function resetLayoutDraftZone(zone) {
    if (zone === 'global') layoutGlobalDraft = normalizeLayoutDraft({});
    else layoutDraft = normalizeLayoutDraft({});
    applyLayoutDraftToDom(); updateLayoutDesignerSelection();
    notify(zone === 'global' ? 'Nagłówek i stopka wróciły do układu bazowego w projekcie. Kliknij ZAPISZ UKŁAD.' : 'Podstrona wróciła do układu bazowego w projekcie. Kliknij ZAPISZ UKŁAD.');
  }

  function cleanupLayoutDesigner() {
    layoutController?.abort(); layoutController = null;
    layoutEditing = false; layoutDraggedId = null; layoutFreeDrag = null;
    document.body.classList.remove('cms-layout-mode');
    document.getElementById('cms-layout-designer')?.remove();
    layoutCandidates().forEach(el => {
      el.removeAttribute('draggable');
      el.classList.remove('cms-layout-editable','cms-layout-selected','cms-layout-dragging','cms-layout-free-drag');
    });
    refreshToolbar();
  }

  async function cancelLayoutDesigner() {
    cleanupLayoutDesigner();
    if (typeof window.render === 'function') await window.render();
  }

  async function saveLayoutDesigner() {
    if (!has('page.layout.manage')) return;
    try {
      await window.MattCMS.createBackup(`AUTO: przed zmianą pełnego układu — ${currentRoute()}`);
      await window.MattCMS.save(`page_layout:${currentRoute()}`, layoutDraft, { backup:false });
      await window.MattCMS.save('page_layout:__global', layoutGlobalDraft, { backup:false });
      cleanupLayoutDesigner();
      notify('Pełny układ strony został zapisany.');
      if (typeof window.render === 'function') await window.render();
    } catch (error) { notify(`Nie udało się zapisać układu: ${error.message}`, 'error'); }
  }

  function startLayoutDesigner() {
    if (!has('page.layout.manage') || layoutEditing) return;
    layoutEditing = true; layoutSelectedId = null;
    layoutDraft = normalizeLayoutDraft(window.MattCMS?.get(`page_layout:${currentRoute()}`, {}) || {});
    layoutGlobalDraft = normalizeLayoutDraft(window.MattCMS?.get('page_layout:__global', {}) || {});
    layoutController = new AbortController();
    const signal = layoutController.signal;
    document.body.classList.add('cms-layout-mode');

    const panel = document.createElement('aside');
    panel.id = 'cms-layout-designer';
    panel.innerHTML = `
      <div class="cms-layout-panel-head"><div><small>PEŁNY TRYB GRAFICZNY</small><strong>PROJEKTOWANIE CAŁEJ STRONY</strong></div><button type="button" data-layout-close>×</button></div>
      <p class="cms-layout-help">Kliknięcie wybiera teraz pojedynczy element — np. samo logo, napis, obraz, przycisk lub tekst. Przeciągając przesuwasz tylko ten element. Jeśli chcesz przesunąć cały większy blok, najpierw wybierz jeden z jego elementów i użyj przycisku „ZAZNACZ CAŁĄ SEKCJĘ”. Kolejność w siatce lub menu zmieniaj przyciskami WCZEŚNIEJ / PÓŹNIEJ.</p>
      <div class="cms-layout-selected-box"><small>WYBRANY ELEMENT</small><strong data-layout-selected>Kliknij pojedynczy element na stronie</strong><span data-layout-zone>—</span><span data-layout-position>Brak zaznaczenia</span></div>
      <button type="button" class="cms-layout-select-section" data-layout-select-section disabled>ZAZNACZ CAŁĄ SEKCJĘ</button>
      <div class="cms-layout-control-title">POŁOŻENIE · 8 PX</div>
      <div class="cms-layout-nudge-grid">
        <button type="button" data-layout-nudge="0,-8">↑</button><button type="button" data-layout-nudge="-8,0">←</button><button type="button" data-layout-nudge="8,0">→</button><button type="button" data-layout-nudge="0,8">↓</button>
      </div>
      <div class="cms-layout-control-title">ROZMIAR · 16 PX</div>
      <div class="cms-layout-size-actions"><button type="button" data-layout-size="-16,0">− SZER.</button><button type="button" data-layout-size="16,0">+ SZER.</button><button type="button" data-layout-size="0,-16">− WYS.</button><button type="button" data-layout-size="0,16">+ WYS.</button></div>
      <div class="cms-layout-control-title">KOLEJNOŚĆ W SIATCE / MENU</div>
      <div class="cms-layout-order-actions"><button type="button" data-layout-order="-1">← WCZEŚNIEJ</button><button type="button" data-layout-order="1">PÓŹNIEJ →</button></div>
      <button type="button" class="cms-layout-reset-element" data-layout-reset-element>RESETUJ WYBRANY ELEMENT</button>
      <div class="cms-layout-reset-zones"><button type="button" data-layout-reset-page>RESETUJ PODSTRONĘ</button><button type="button" data-layout-reset-global>RESETUJ NAGŁÓWEK / STOPKĘ</button></div>
      <div class="cms-layout-panel-actions"><button type="button" data-layout-cancel>ANULUJ</button><button type="button" class="cms-primary" data-layout-save>ZAPISZ UKŁAD</button></div>`;
    document.body.appendChild(panel);

    const candidates = layoutCandidates();
    candidates.forEach(el => {
      el.classList.add('cms-layout-editable','cms-layout-free-drag');
      el.setAttribute('draggable','false');
      el.addEventListener('pointerdown', e => {
        if (e.button !== 0 || e.target.closest('#cms-layout-designer,#cms-admin-toolbar')) return;
        // Kluczowe: reaguje wyłącznie najgłębszy element pod kursorem.
        // Rodzic (np. cały nagłówek/sekcja) nie może przejąć przeciągania dziecka.
        const nearest = e.target.closest('[data-cms-layout-id]');
        if (nearest !== el) return;
        const draft = layoutDraftForElement(el);
        const old = draft?.offsets?.[el.dataset.cmsLayoutId] || {x:0,y:0};
        layoutSelectedId = el.dataset.cmsLayoutId;
        layoutFreeDrag = { id:el.dataset.cmsLayoutId, pointerId:e.pointerId, startX:e.clientX, startY:e.clientY, baseX:Number(old.x||0), baseY:Number(old.y||0) };
        try { el.setPointerCapture(e.pointerId); } catch (_) {}
        el.classList.add('cms-layout-dragging');
        updateLayoutDesignerSelection();
        e.preventDefault();
        e.stopPropagation();
      }, {signal});
      el.addEventListener('pointermove', e => {
        if (!layoutFreeDrag || layoutFreeDrag.id !== el.dataset.cmsLayoutId || layoutFreeDrag.pointerId !== e.pointerId) return;
        const draft = layoutDraftForElement(el);
        if (!draft.offsets) draft.offsets = {};
        draft.offsets[el.dataset.cmsLayoutId] = {
          x: Math.max(-1200, Math.min(1200, layoutFreeDrag.baseX + (e.clientX - layoutFreeDrag.startX))),
          y: Math.max(-1200, Math.min(1200, layoutFreeDrag.baseY + (e.clientY - layoutFreeDrag.startY)))
        };
        applyLayoutDraftToDom();
        updateLayoutDesignerSelection();
        e.preventDefault();
      }, {signal});
      const finishFreeDrag = e => {
        if (!layoutFreeDrag || layoutFreeDrag.id !== el.dataset.cmsLayoutId) return;
        try { el.releasePointerCapture(layoutFreeDrag.pointerId); } catch (_) {}
        layoutFreeDrag = null;
        el.classList.remove('cms-layout-dragging');
      };
      el.addEventListener('pointerup', finishFreeDrag, {signal});
      el.addEventListener('pointercancel', finishFreeDrag, {signal});
    });

    document.addEventListener('click', e => {
      if (e.target.closest('#cms-layout-designer,#cms-admin-toolbar')) return;
      const el = e.target.closest('[data-cms-layout-id]');
      if (!el) return;
      e.preventDefault(); e.stopPropagation();
      layoutSelectedId = el.dataset.cmsLayoutId;
      updateLayoutDesignerSelection();
    }, { capture:true, signal });

    panel.querySelector('[data-layout-close]').addEventListener('click', cancelLayoutDesigner, {signal});
    panel.querySelector('[data-layout-cancel]').addEventListener('click', cancelLayoutDesigner, {signal});
    panel.querySelector('[data-layout-save]').addEventListener('click', saveLayoutDesigner, {signal});
    panel.querySelector('[data-layout-reset-page]').addEventListener('click', ()=>resetLayoutDraftZone('page'), {signal});
    panel.querySelector('[data-layout-reset-global]').addEventListener('click', ()=>resetLayoutDraftZone('global'), {signal});
    panel.querySelector('[data-layout-select-section]').addEventListener('click', selectLayoutWholeSection, {signal});
    panel.querySelector('[data-layout-reset-element]').addEventListener('click', resetLayoutSelected, {signal});
    panel.querySelectorAll('[data-layout-nudge]').forEach(btn=>btn.addEventListener('click',()=>{const [dx,dy]=btn.dataset.layoutNudge.split(',').map(Number);nudgeLayoutSelected(dx,dy);},{signal}));
    panel.querySelectorAll('[data-layout-size]').forEach(btn=>btn.addEventListener('click',()=>{const [dw,dh]=btn.dataset.layoutSize.split(',').map(Number);resizeLayoutSelected(dw,dh);},{signal}));
    panel.querySelectorAll('[data-layout-order]').forEach(btn=>btn.addEventListener('click',()=>moveLayoutSelectedOrder(Number(btn.dataset.layoutOrder)),{signal}));

    applyLayoutDraftToDom(); updateLayoutDesignerSelection(); refreshToolbar();
    const globalCount=candidates.filter(el=>el.dataset.cmsLayoutZone==='global').length;
    notify(`Pełny projektant: ${candidates.length} elementów (${globalCount} globalnych + ${candidates.length-globalCount} na podstronie).`);
  }

  function ensureToolbar() {
    if (toolbar) return toolbar;
    toolbar = document.createElement('div');
    toolbar.id = 'cms-admin-toolbar';
    toolbar.innerHTML = `
      <button type="button" class="cms-toolbar-drag-handle" aria-label="Przeciągnij pasek" title="Przeciągnij pasek. Dosuń do lewej lub prawej krawędzi, aby go przypiąć. Dwuklik przywraca położenie domyślne.">⠿</button>
      <button type="button" class="cms-toolbar-toggle" data-cms-action="toggle-toolbar" aria-label="Ukryj pasek administratora" title="Ukryj pasek administratora">−</button>
      <button type="button" class="cms-toolbar-orientation" data-cms-action="toolbar-orientation" aria-label="Zmień pasek na pionowy" title="Zmień pasek na pionowy">↕</button>
      <div class="cms-toolbar-title"><span>ADMIN</span><strong>EDYCJA STRONY</strong></div>
      <button type="button" data-cms-action="layout">✣ UKŁAD</button>
      <button type="button" data-cms-action="content">✎ TREŚĆ</button>
      <button type="button" data-cms-action="config" hidden>⚙ KONFIGURATOR</button>
      <button type="button" data-cms-action="images">▧ GRAFIKI</button>
      <button type="button" data-cms-action="site">⚙ USTAWIENIA STRONY</button>
      <button type="button" data-cms-action="backups">⛁ BACKUPY</button>
      <button type="button" class="cms-save" data-cms-action="save" hidden>✓ ZAPISZ</button>
      <button type="button" class="cms-cancel" data-cms-action="cancel" hidden>× ANULUJ</button>`;
    document.body.appendChild(toolbar);
    bindToolbarDrag();
    applyToolbarState();
    toolbar.addEventListener('click', e => {
      const action = e.target.closest('[data-cms-action]')?.dataset.cmsAction;
      if (action === 'toggle-toolbar') { setToolbarCollapsed(!isToolbarCollapsed()); return; }
      if (action === 'toolbar-orientation') {
        setToolbarOrientation(getToolbarOrientation() === 'vertical' ? 'horizontal' : 'vertical');
        return;
      }
      if (action === 'layout' && has('page.layout.manage')) startLayoutDesigner();
      if (action === 'content' && any('page.text.edit','page.callouts.manage')) openContentManager();
      if (action === 'save') saveInlineEdit();
      if (action === 'cancel') cancelInlineEdit();
      if (action === 'config') { const c=configForRoute(currentRoute()); if (canConfig(c)) c?.action(); }
      if (action === 'images' && has('page.images.manage')) openPageImagesManager();
      if (action === 'site' && any('site.navigation.manage','site.links.manage')) openSiteSettingsManager();
      if (action === 'backups' && any('backups.view','github.restore')) openBackupsManager();
    });
    return toolbar;
  }

  function refreshToolbar() {
    if (!isAdmin()) {
      toolbar?.remove(); toolbar = null;
      return;
    }
    ensureToolbar();
    const roleBadge = $('.cms-toolbar-title span', toolbar);
    const roleTitle = $('.cms-toolbar-title strong', toolbar);
    if (roleBadge) roleBadge.textContent = window.currentUserRole === 'admin' ? 'ADMIN' : 'MOD';
    if (roleTitle) roleTitle.textContent = window.currentUserRole === 'admin' ? 'EDYCJA STRONY' : 'NARZĘDZIA MODERATORA';
    const config = configForRoute(currentRoute());
    const configBtn = $('[data-cms-action="config"]', toolbar);
    configBtn.hidden = !config || !canConfig(config) || inlineEditing || layoutEditing;
    if (config) configBtn.textContent = `⚙ ${config.label}`;
    const baseCalloutCount = window.MattCMS?.calloutInfo?.(currentRoute())?.length || 0;
    const customCalloutCount = window.MattCMS?.customPageCallouts?.(currentRoute())?.length || 0;
    const calloutCount = baseCalloutCount + customCalloutCount;
    const contentBtn = $('[data-cms-action="content"]', toolbar);
    if (contentBtn) {
      contentBtn.hidden = inlineEditing || layoutEditing || !any('page.text.edit','page.callouts.manage');
      contentBtn.textContent = `✎ TREŚĆ${has('page.callouts.manage') && calloutCount ? ` (${calloutCount})` : ''}`;
    }
    const layoutBtn = $('[data-cms-action="layout"]', toolbar);
    if (layoutBtn) layoutBtn.hidden = inlineEditing || layoutEditing || !has('page.layout.manage');
    const imagesBtn = $('[data-cms-action="images"]', toolbar);
    if (imagesBtn) {
      const canGraphics = has('page.images.manage') || (currentRoute() === 'home' && has('home.hero.manage'));
      imagesBtn.hidden = inlineEditing || layoutEditing || !canGraphics;
    }
    $('[data-cms-action="site"]', toolbar).hidden = inlineEditing || layoutEditing || !any('site.navigation.manage','site.links.manage');
    $('[data-cms-action="backups"]', toolbar).hidden = inlineEditing || layoutEditing || !any('backups.view','github.restore');
    $('[data-cms-action="save"]', toolbar).hidden = !inlineEditing;
    $('[data-cms-action="cancel"]', toolbar).hidden = !inlineEditing;
    applyToolbarState();
  }

  function openContentManager() {
    if (!isAdmin() || !any('page.text.edit','page.callouts.manage')) return;
    const baseCalloutCount = window.MattCMS?.calloutInfo?.(currentRoute())?.length || 0;
    const customCalloutCount = window.MattCMS?.customPageCallouts?.(currentRoute())?.length || 0;
    const calloutCount = baseCalloutCount + customCalloutCount;
    openModal('TREŚĆ', `<div class="cms-site-settings-grid">
      ${has('page.text.edit')?'<button class="cms-site-setting-card" type="button" data-content-text><strong>✎ EDYTUJ TEKSTY</strong><span>Włącz bezpośrednią edycję napisów, nagłówków i opisów widocznych na bieżącej podstronie.</span></button>':''}
      ${has('page.callouts.manage')?`<button class="cms-site-setting-card" type="button" data-content-callouts><strong>▰ KOMUNIKATY${calloutCount ? ` (${calloutCount})` : ''}</strong><span>Dodawaj, edytuj, usuwaj i konfiguruj komunikaty oraz dymki na bieżącej podstronie.</span></button>`:''}
    </div>`);
    const body = $('#cms-modal-body', modal);
    $('[data-content-text]', body)?.addEventListener('click', () => {
      closeModal();
      setTimeout(startInlineEdit, 0);
    });
    $('[data-content-callouts]', body)?.addEventListener('click', openPageCalloutsManager);
  }

  function startInlineEdit() {
    if (!has('page.text.edit') || inlineEditing) return;
    const items = window.MattCMS?.decorateEditable(currentRoute()) || [];
    inlineSnapshot = new Map(items.map(el => [el, el.innerHTML]));
    items.forEach(el => {
      el.contentEditable = 'true';
      el.spellcheck = true;
      el.classList.add('cms-inline-editable');
    });
    inlineEditing = true;
    document.body.classList.add('cms-inline-mode');
    refreshToolbar();
    notify(`Tryb edycji: ${items.length} pól tekstowych. Kliknij tekst i wpisz nową treść.`);
  }

  async function saveInlineEdit() {
    if (!inlineEditing || !has('page.text.edit')) return;
    try {
      const key = `page:${currentRoute()}`;
      const data = {};
      (window.MattCMS?.editableElements() || []).forEach(el => {
        if (!el.dataset.cmsTextId) return;
        const value = window.MattCMS.sanitizeHtml(el.innerHTML);
        const base = window.MattCMS.sanitizeHtml(window.MattCMS.baseHtml(el));
        // Do Supabase trafiają wyłącznie realne nadpisania. Reszta nadal pochodzi z GitHuba.
        if (value !== base) data[el.dataset.cmsTextId] = value;
      });
      if (Object.keys(data).length) await window.MattCMS.save(key, data);
      else if (window.MattCMS.get(key, null) != null) await window.MattCMS.remove(key);
      finishInlineEdit();
      notify('Zmiany zapisane. Nieedytowane teksty nadal są pobierane z plików GitHuba.');
    } catch (error) {
      notify(`Nie udało się zapisać: ${error.message}`, 'error');
    }
  }

  function cancelInlineEdit() {
    inlineSnapshot.forEach((html, el) => { if (el.isConnected) el.innerHTML = html; });
    finishInlineEdit();
  }

  function finishInlineEdit() {
    inlineSnapshot.forEach((_, el) => {
      if (!el.isConnected) return;
      el.contentEditable = 'false';
      el.classList.remove('cms-inline-editable');
    });
    inlineSnapshot.clear();
    inlineEditing = false;
    document.body.classList.remove('cms-inline-mode');
    refreshToolbar();
  }

  function extractStreamers() {
    return $$('.recommended-card').map(card => {
      const iframe = $('iframe', card);
      let clipSlug = '';
      try { clipSlug = new URL(iframe?.src || '', location.href).searchParams.get('clip') || ''; } catch (_) {}
      return {
        login: card.dataset.streamerLogin || '',
        displayName: card.dataset.streamerName || $('[data-streamer-name-target]', card)?.textContent.trim() || '',
        channelUrl: $('.recommended-avatar-link', card)?.href || '',
        clipSlug,
        clipUrl: $$('.recommended-actions a', card)[1]?.href || '',
        tagline: $('.recommended-meta p', card)?.textContent.trim() || '',
        description: '',
        games: $$('.recommended-game-chip strong', card).map(el => el.textContent.trim())
      };
    });
  }

  function extractModerators() {
    return $$('.moderator-card').map(card => ({
      name: $('.moderator-name-row h2', card)?.textContent.trim() || '',
      role: $('.moderator-role', card)?.textContent.trim() || '',
      description: $('.moderator-card-body > p', card)?.textContent.trim() || '',
      twitch: $('.moderator-twitch', card)?.href || '',
      discord: $('.moderator-discord strong', card)?.textContent.trim() || '',
      image: $('.moderator-photo', card)?.getAttribute('src') || ''
    }));
  }

  function extractBenefits() {
    return $$('.moderator-benefit-card').map(card => ({
      title: $('h3', card)?.textContent.trim() || '',
      description: $('p', card)?.textContent.trim() || ''
    }));
  }

  function extractTopics() {
    return $$('#contact-topic option').filter(o => o.value).map(o => o.textContent.trim());
  }

  function extractDiscordCategories() {
    return $$('.discord-channel-section').map((section,index) => ({
      id: section.id?.replace(/^discord-(?:role|cms)-/, '') || `category-${index+1}`,
      icon: $$('.discord-channels-tags .discord-channel-jump')[index]?.textContent.trim().split(/\s+/)[0] || '📁',
      title: $('.discord-section-heading h2', section)?.textContent.trim() || `KATEGORIA ${index+1}`,
      description: $('.discord-section-heading > p', section)?.textContent.trim() || '',
      channels: $$('.discord-channel-row', section).map(row => ({
        icon: $('.discord-channel-symbol', row)?.textContent.trim() || '#',
        name: $('.discord-channel-name strong', row)?.textContent.trim() || '',
        description: $('p', row)?.textContent.trim() || '',
        featured: row.classList.contains('featured')
      }))
    }));
  }


  function extractDiscordJoinBubbles() {
    return $$('#discord-custom-bubbles .discord-configure-section').map((card,index) => {
      const h2 = $('.discord-configure-copy h2', card);
      const strong = h2?.querySelector('strong');
      let title = h2?.textContent.trim() || '';
      if (h2 && strong) {
        const copy = h2.cloneNode(true);
        copy.querySelector('strong')?.remove();
        title = copy.textContent.trim();
      }
      let style = 'red';
      ['discord','dark','green'].forEach(v => { if (card.classList.contains(`discord-callout-${v}`)) style = v; });
      const button = $('.discord-configure-button', card);
      return {
        id: card.id || `dymek-${index+1}`,
        icon: $('.discord-configure-icon', card)?.textContent.trim() || '⚙',
        kicker: $('.discord-configure-copy > span', card)?.textContent.trim() || '',
        title,
        highlight: strong?.textContent.trim() || '',
        description: $('.discord-configure-copy > p:not(.discord-configure-highlight)', card)?.textContent.trim() || '',
        emphasis: $('.discord-configure-highlight', card)?.textContent.trim() || '',
        buttonText: button?.textContent.replace(/→\s*$/, '').trim() || '',
        buttonUrl: button?.dataset.siteLink === 'discordUrl' ? '' : (button?.getAttribute('href') || ''),
        style
      };
    });
  }

  function extractDiscordJoinPreview() {
    const section = $('#discord-preview');
    if (!section) return {};
    const titleBox = $('.discord-section-title', section);
    const note = $('.discord-showcase-note', section);
    const categories = $$('.discord-app-channels .discord-app-channel-section', section).map(cat => ({
      title: $('.discord-app-category', cat)?.childNodes?.[0]?.textContent?.trim() || $('.discord-app-category', cat)?.textContent.replace('＋','').trim() || 'KATEGORIA',
      channels: $$('.discord-app-channel', cat).map(ch => ({
        icon: $('span', ch)?.textContent.trim() || '＃',
        name: ch.textContent.replace($('span',ch)?.textContent || '', '').trim(),
        href: ch.getAttribute('href') || '#/discord/channels',
        active: ch.classList.contains('active'),
        vip: ch.classList.contains('vip')
      }))
    }));
    const messages = [];
    let currentDate = '';
    $$('.discord-alert-feed > *', section).forEach(node => {
      if (node.classList.contains('discord-app-date')) { currentDate = node.textContent.trim(); return; }
      if (!node.classList.contains('discord-message')) return;
      messages.push({
        date: currentDate,
        avatar: $('.discord-avatar', node)?.textContent.trim() || 'M',
        author: $('.discord-message-meta strong', node)?.textContent.trim() || '',
        time: $('.discord-message-meta span', node)?.textContent.trim() || '',
        text: $(':scope > div > p', node)?.textContent.trim() || '',
        embedTitle: $('.discord-live-embed-copy > strong', node)?.textContent.trim() || '',
        embedLinkText: $('.discord-live-embed-copy > a', node)?.textContent.trim() || '',
        embedDescription: $('.discord-live-embed-copy > span', node)?.textContent.trim() || '',
        viewers: $('.discord-live-embed-copy > small', node)?.textContent.trim() || '',
        thumbnail: $('.discord-live-embed > img', node)?.getAttribute('src') || ''
      });
      currentDate = '';
    });
    const memberGroups = [];
    let currentGroup = null;
    $$('.discord-app-members > *', section).forEach(node => {
      if (node.classList.contains('discord-member-group')) {
        currentGroup = { title: node.textContent.replace(/—\s*\d+\s*$/, '').trim(), members: [] };
        memberGroups.push(currentGroup);
        return;
      }
      if (!node.classList.contains('discord-member') || !currentGroup) return;
      const strong = $('strong', node);
      const role = strong?.classList.contains('role-streamer') ? 'streamer' : strong?.classList.contains('role-mod') ? 'moderator' : strong?.classList.contains('role-vip') ? 'vip' : 'viewer';
      currentGroup.members.push({
        name: strong?.textContent.trim() || '',
        status: $('small', node)?.textContent.trim() || '',
        kind: role,
        image: $('img.member-avatar', node)?.getAttribute('src') || '',
        initial: $('span.member-avatar', node)?.textContent.trim() || ''
      });
    });
    return {
      kicker: $('.discord-section-title span', section)?.textContent.trim() || '03 / PODGLĄD SERWERA',
      title: $('.discord-section-title h2', section)?.textContent.trim() || "TAK WYGLĄDA MATT'S WORLD",
      description: titleBox?.querySelector(':scope > p')?.textContent.trim() || '',
      noteBadge: $(':scope > span', note)?.textContent.trim() || "PODGLĄD MATT'S WORLD",
      noteTitle: $(':scope > strong', note)?.textContent.trim() || '',
      noteText: $(':scope > p', note)?.textContent.trim() || '',
      boostLabel: $('.discord-app-boost span', section)?.textContent.trim() || 'cel dot. wzmocnienia',
      boostValue: $('.discord-app-boost b', section)?.textContent.trim() || '2/3',
      activeChannel: $('.discord-app-chat-head strong', section)?.textContent.trim() || 'live-alert',
      composerText: $('.discord-app-composer span', section)?.textContent.trim() || 'Napisz na # live-alert',
      categories, messages, memberGroups
    };
  }

  function fieldHtml(field, value) {
    const esc = window.MattCMS?.escape || (v => String(v || ''));
    const val = value ?? '';
    if (field.type === 'image-file') return `<div class="cms-field cms-image-field" data-cms-image-field="${esc(field.name)}">
      <span>${esc(field.label)}</span>
      <input type="hidden" name="${esc(field.name)}" value="${esc(val)}" data-image-current>
      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" data-image-file hidden>
      <div class="cms-image-upload-row"><button type="button" data-image-pick>📁 WYBIERZ ZDJĘCIE Z DYSKU</button><span data-image-name>${esc(cmsImageLabel(val))}</span></div>
      <div class="cms-image-preview${val ? '' : ' is-empty'}" data-image-preview><img ${val ? `src="${esc(val)}"` : ''} alt="Podgląd zdjęcia"></div>
      <div class="cms-image-tools"><small>JPG, PNG, WEBP lub GIF • maks. 10 MB. Adres pliku zapisze się automatycznie.</small><button type="button" data-image-remove ${val ? '' : 'hidden'}>USUŃ ZDJĘCIE</button></div>
    </div>`;
    if (field.type === 'textarea') return `<label class="cms-field"><span>${esc(field.label)}</span><textarea name="${esc(field.name)}" ${field.placeholder?`placeholder="${esc(field.placeholder)}"`:''} ${field.required?'required':''}>${esc(val)}</textarea>${field.help?`<small class="cms-field-help">${esc(field.help)}</small>`:''}</label>`;
    if (field.type === 'select') return `<label class="cms-field"><span>${esc(field.label)}</span><select name="${esc(field.name)}">${(field.options||[]).map(opt=>{const o=typeof opt==='string'?{value:opt,label:opt}:opt;return `<option value="${esc(o.value)}" ${String(o.value)===String(val)?'selected':''}>${esc(o.label)}</option>`;}).join('')}</select>${field.help?`<small class="cms-field-help">${esc(field.help)}</small>`:''}</label>`;
    if (field.type === 'csv') return `<label class="cms-field"><span>${esc(field.label)}</span><input name="${esc(field.name)}" value="${esc(Array.isArray(val)?val.join(', '):val)}" placeholder="oddziel przecinkami"></label>`;
    if (field.type === 'roles') {
      const roles = Array.isArray(val) ? val : [];
      return `<fieldset class="cms-field cms-roles"><legend>${esc(field.label)}</legend>${[['viewer','WIDZ'],['vip','VIP'],['moderator','MODERACJA']].map(([v,l])=>`<label><input type="checkbox" name="roles" value="${v}" ${roles.includes(v)?'checked':''}> ${l}</label>`).join('')}</fieldset>`;
    }
    if (field.type === 'checkbox') return `<label class="cms-field cms-check"><input type="checkbox" name="${esc(field.name)}" ${val?'checked':''}> <span>${esc(field.label)}</span></label>`;
    return `<label class="cms-field"><span>${esc(field.label)}</span><input type="${field.type || 'text'}" name="${esc(field.name)}" value="${esc(val)}" ${field.placeholder?`placeholder="${esc(field.placeholder)}"`:''} ${field.required?'required':''}>${field.help?`<small class="cms-field-help">${esc(field.help)}</small>`:''}</label>`;
  }

  function bindImageFileFields(form, fields) {
    fields.filter(field => field.type === 'image-file').forEach(field => {
      const wrap = form.querySelector(`[data-cms-image-field="${field.name}"]`);
      if (!wrap) return;
      const input = $('[data-image-file]', wrap);
      const pick = $('[data-image-pick]', wrap);
      const remove = $('[data-image-remove]', wrap);
      const hidden = $('[data-image-current]', wrap);
      const name = $('[data-image-name]', wrap);
      const preview = $('[data-image-preview]', wrap);
      const img = $('img', preview);
      let objectUrl = '';

      pick?.addEventListener('click', () => input?.click());
      input?.addEventListener('change', () => {
        const file = input.files?.[0];
        if (!file) return;
        try { validateCmsImage(file); }
        catch (error) { input.value = ''; notify(error.message, 'error'); return; }
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = URL.createObjectURL(file);
        img.src = objectUrl;
        preview.classList.remove('is-empty');
        name.textContent = file.name;
        if (remove) remove.hidden = false;
      });
      remove?.addEventListener('click', () => {
        input.value = '';
        hidden.value = '';
        if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = ''; }
        img.removeAttribute('src');
        preview.classList.add('is-empty');
        name.textContent = 'Nie wybrano pliku';
        remove.hidden = true;
      });
    });
  }

  function parseFields(form, fields) {
    const obj = {};
    fields.forEach(field => {
      if (field.type === 'roles') obj[field.name] = $$('input[name="roles"]:checked', form).map(i => i.value);
      else if (field.type === 'checkbox') obj[field.name] = Boolean(form.elements[field.name]?.checked);
      else if (field.type === 'csv') obj[field.name] = String(form.elements[field.name]?.value || '').split(',').map(v => v.trim()).filter(Boolean);
      else obj[field.name] = String(form.elements[field.name]?.value || '').trim();
    });
    return obj;
  }

  function openArrayManager({ key, title, singular, fields, fallback, label, normalizeItem, beforeSave, onFormReady }) {
    let items = clone(window.MattCMS?.get(key, null) || fallback() || []);
    if (typeof normalizeItem === 'function') items = items.map(item => normalizeItem(clone(item)));
    const esc = window.MattCMS.escape;

    const moveItem = (from, to) => {
      if (to < 0 || to >= items.length || from === to) return;
      const [moved] = items.splice(from, 1);
      items.splice(to, 0, moved);
      drawList();
    };

    const saveOrder = async () => {
      try {
        await window.MattCMS.save(key, items);
        notify('Kolejność została zapisana.');
        await rerender();
      } catch (e) { notify(`Nie udało się zapisać kolejności: ${e.message}`, 'error'); }
    };

    const drawList = () => {
      openModal(title, `<div class="cms-manager-actions"><div class="cms-manager-action-group"><button class="cms-primary" type="button" data-add>+ DODAJ ${esc(singular.toUpperCase())}</button><button type="button" data-save-order>✓ ZAPISZ KOLEJNOŚĆ</button><button type="button" data-reset>↶ PRZYWRÓĆ Z GITHUBA</button></div><p>Strzałkami możesz ustawić kolejność wyświetlania. Supabase przechowuje tylko nadpisanie tej sekcji.</p></div>
        <div class="cms-manager-list">${items.length ? items.map((item,index)=>`<article class="cms-manager-item"><div><small>${String(index+1).padStart(2,'0')}</small><strong>${esc(label(item) || `${singular} ${index+1}`)}</strong></div><div><button type="button" data-up="${index}" ${index===0?'disabled':''} title="Przesuń wyżej">↑</button><button type="button" data-down="${index}" ${index===items.length-1?'disabled':''} title="Przesuń niżej">↓</button><button type="button" data-edit="${index}">EDYTUJ</button><button class="danger" type="button" data-delete="${index}">USUŃ</button></div></article>`).join('') : '<div class="cms-empty">Brak elementów. Dodaj pierwszy.</div>'}</div>`);
      const body = $('#cms-modal-body', modal);
      $('[data-add]', body)?.addEventListener('click', () => drawForm(-1));
      $('[data-save-order]', body)?.addEventListener('click', saveOrder);
      $('[data-reset]', body)?.addEventListener('click', () => resetCmsKey(key, title.toLowerCase()));
      $$('[data-up]', body).forEach(btn => btn.addEventListener('click', () => moveItem(Number(btn.dataset.up), Number(btn.dataset.up)-1)));
      $$('[data-down]', body).forEach(btn => btn.addEventListener('click', () => moveItem(Number(btn.dataset.down), Number(btn.dataset.down)+1)));
      $$('[data-edit]', body).forEach(btn => btn.addEventListener('click', () => drawForm(Number(btn.dataset.edit))));
      $$('[data-delete]', body).forEach(btn => btn.addEventListener('click', async () => {
        const index = Number(btn.dataset.delete);
        if (!confirm(`Usunąć: ${label(items[index])}?`)) return;
        items.splice(index, 1);
        try { await window.MattCMS.save(key, items); notify('Element usunięty.'); await rerender(); }
        catch (e) { notify(e.message, 'error'); }
      }));
    };

    const drawForm = index => {
      const current = index >= 0 ? items[index] : {};
      openModal(index >= 0 ? `EDYTUJ — ${title}` : `DODAJ — ${title}`, `<form id="cms-item-form" class="cms-form">${fields.map(f=>fieldHtml(f,current[f.name])).join('')}<div class="cms-form-actions"><button type="button" data-back>← WRÓĆ</button><button class="cms-primary" type="submit">ZAPISZ</button></div></form>`);
      const form = $('#cms-item-form', modal);
      bindImageFileFields(form, fields);
      if (typeof onFormReady === 'function') {
        try { onFormReady(form, { current: clone(current), index, items: clone(items), drawList }); }
        catch (error) { console.error('[MATT CMS] Błąd inicjalizacji formularza:', error); }
      }
      $('[data-back]', form).addEventListener('click', drawList);
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const submit = $('button[type="submit"]', form);
        if (submit) { submit.disabled = true; submit.textContent = 'ZAPISYWANIE…'; }
        try {
          let value = { ...clone(current), ...parseFields(form, fields) };
          if (typeof beforeSave === 'function') value = (await beforeSave(value, { current: clone(current), index, items: clone(items) })) || value;
          const imageFields = fields.filter(field => field.type === 'image-file');
          const pendingUploads = imageFields.map(field => ({
            field,
            file: form.querySelector(`[data-cms-image-field="${field.name}"] [data-image-file]`)?.files?.[0] || null
          })).filter(entry => entry.file);

          let backupAlreadyMade = false;
          if (pendingUploads.length) {
            await window.MattCMS.createBackup(`AUTO: przed zmianą CMS — ${key}`);
            backupAlreadyMade = true;
            for (const entry of pendingUploads) {
              value[entry.field.name] = await uploadCmsImage(
                entry.file,
                value.name || value.displayName || value.title || singular,
                entry.field.folder || key
              );
            }
          }

          const nextItems = clone(items);
          if (index >= 0) nextItems[index] = value; else nextItems.push(value);
          await window.MattCMS.save(key, nextItems, backupAlreadyMade ? { backup:false } : {});
          items = nextItems;
          notify('Zapisano zmiany.');
          await rerender();
        } catch (error) {
          notify(`Błąd zapisu: ${error.message}`, 'error');
          if (submit) { submit.disabled = false; submit.textContent = 'ZAPISZ'; }
        }
      });
    };

    drawList();
  }


  function extractRules() {
    return $$('.rules-card-grid .rule-card').map((card, index) => {
      const copy = card.cloneNode(true);
      copy.querySelector('.rule-card-top')?.remove();
      copy.querySelector('.rule-card-label')?.remove();
      copy.querySelector('h2')?.remove();
      copy.querySelector('p')?.remove();
      return {
        id: card.id || `rule-${index + 1}`,
        icon: $('.rule-card-icon', card)?.textContent.trim() || '📌',
        label: $('.rule-card-label', card)?.textContent.trim() || `ZASADA ${index + 1}`,
        title: $('h2', card)?.textContent.trim() || 'Nowa zasada',
        description: $('p', card)?.textContent.trim() || '',
        descriptionHtml: $('p', card)?.innerHTML || '',
        extraHtml: copy.innerHTML.trim(),
        wide: card.classList.contains('event-rule-card-wide')
      };
    });
  }

  function openRulesManager() {
    if (!isAdmin()) return;
    const route = currentRoute();
    const key = `rules:${route}`;
    let items = clone(window.MattCMS?.get(key, null) || extractRules());
    const esc = window.MattCMS.escape;

    const applyBehind = () => window.MattCMS?.renderRules?.(items, route);

    const saveRules = async (message, { close = false } = {}) => {
      try {
        await window.MattCMS.save(key, items);
        applyBehind();
        notify(message);
        if (close) await rerender(); else drawList();
      } catch (e) { notify(`Błąd zapisu: ${e.message}`, 'error'); }
    };

    const move = (from, to) => {
      if (to < 0 || to >= items.length) return;
      const [moved] = items.splice(from, 1);
      items.splice(to, 0, moved);
      drawList();
    };

    const drawList = () => {
      openModal('REGULAMIN — ZASADY', `<div class="cms-manager-actions"><div class="cms-manager-action-group">
        <button class="cms-primary" data-add-rule>+ DODAJ ZASADĘ</button>
        <button data-save-rule-order>✓ ZAPISZ KOLEJNOŚĆ</button>
        <button data-reset-rules>↶ PRZYWRÓĆ Z GITHUBA</button>
      </div><p>Każda zasada to osobny dymek. Numeracja jest automatyczna — pierwszy element zawsze otrzymuje numer 01.</p></div>
      <div class="cms-manager-list">${items.length ? items.map((item,index)=>`<article class="cms-manager-item"><div><small>${String(index+1).padStart(2,'0')}</small><strong>${esc(item.label || item.title || `ZASADA ${index+1}`)}</strong></div><div>
        <button data-rule-up="${index}" ${index===0?'disabled':''} title="Przesuń wyżej">↑</button>
        <button data-rule-down="${index}" ${index===items.length-1?'disabled':''} title="Przesuń niżej">↓</button>
        <button data-edit-rule="${index}">EDYTUJ</button>
        <button class="danger" data-delete-rule="${index}">USUŃ</button>
      </div></article>`).join('') : '<div class="cms-empty">Regulamin nie ma jeszcze żadnych zasad.</div>'}</div>`);
      const body = $('#cms-modal-body', modal);
      $('[data-add-rule]', body)?.addEventListener('click', () => editRule(-1));
      $('[data-save-rule-order]', body)?.addEventListener('click', () => saveRules('Kolejność zasad została zapisana.', { close:true }));
      $('[data-reset-rules]', body)?.addEventListener('click', () => resetCmsKey(key, 'zasady tego regulaminu'));
      $$('[data-rule-up]', body).forEach(b => b.addEventListener('click', () => move(Number(b.dataset.ruleUp), Number(b.dataset.ruleUp)-1)));
      $$('[data-rule-down]', body).forEach(b => b.addEventListener('click', () => move(Number(b.dataset.ruleDown), Number(b.dataset.ruleDown)+1)));
      $$('[data-edit-rule]', body).forEach(b => b.addEventListener('click', () => editRule(Number(b.dataset.editRule))));
      $$('[data-delete-rule]', body).forEach(b => b.addEventListener('click', async () => {
        const i = Number(b.dataset.deleteRule);
        if (!confirm(`Usunąć zasadę „${items[i]?.label || items[i]?.title}”? Pozostałe punkty zostaną automatycznie przenumerowane.`)) return;
        items.splice(i, 1);
        await saveRules('Zasada została usunięta. Numeracja została przeliczona.');
      }));
    };

    const editRule = index => {
      const current = index >= 0 ? items[index] : { icon:'📌', label:'', title:'', description:'', extraHtml:'', wide:false };
      const fields = [
        {name:'icon',label:'Ikona / emoji'},
        {name:'label',label:'Krótka etykieta komunikatu',required:true},
        {name:'title',label:'Tytuł zasady',required:true},
        {name:'description',label:'Treść zasady',type:'textarea',required:true},
        {name:'wide',label:'Wyświetl dymek na pełną szerokość',type:'checkbox'}
      ];
      openModal(index >= 0 ? 'EDYTUJ ZASADĘ' : 'DODAJ ZASADĘ', `<form id="cms-rule-form" class="cms-form">${fields.map(f=>fieldHtml(f,current[f.name])).join('')}
        <div class="cms-form-actions"><button type="button" data-back>← WRÓĆ</button><button class="cms-primary" type="submit">ZAPISZ</button></div></form>`);
      const form = $('#cms-rule-form', modal);
      $('[data-back]', form)?.addEventListener('click', drawList);
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const value = { ...current, ...parseFields(form, fields) };
        // Po świadomej edycji treści używamy tekstu z formularza; przy samym przesuwaniu
        // zachowujemy oryginalne formatowanie HTML pochodzące z GitHuba.
        delete value.descriptionHtml;
        if (index >= 0) items[index] = value; else items.push(value);
        await saveRules(index >= 0 ? 'Zasada została zmieniona.' : 'Nowa zasada została dodana.');
      });
    };

    drawList();
  }

  function openHomeHeroManager(backAction = null) {
    if (!has('home.hero.manage')) return;
    const baseImg = document.querySelector('.hero-main.hero-main-image > img');
    const override = clone(window.MattCMS?.get('home_hero_image', null) || {});
    const displayUrl = override.url || baseImg?.getAttribute('src') || '';
    const displayAlt = override.alt || baseImg?.getAttribute('alt') || "Witaj w Matt's World";

    const fields = [
      {name:'url',label:'Grafika „WITAJ W MATT\'S WORLD”',type:'image-file',folder:'home'},
      {name:'alt',label:'Opis grafiki (ALT)'}
    ];
    openModal('STRONA GŁÓWNA — GRAFIKA POWITALNA', `<div class="cms-manager-actions"><div class="cms-manager-action-group"><button type="button" data-reset-hero>↶ PRZYWRÓĆ GRAFIKĘ Z GITHUBA</button></div><p>Wybierz nową grafikę bezpośrednio z dysku. Plik zostanie zapisany w Supabase Storage tylko przez konto administratora.</p></div>
      <form id="cms-hero-form" class="cms-form">${fieldHtml(fields[0], displayUrl)}${fieldHtml(fields[1], displayAlt)}
      <div class="cms-form-actions"><button type="button" data-back>← ANULUJ</button><button class="cms-primary" type="submit">ZAPISZ GRAFIKĘ</button></div></form>`);
    const body = $('#cms-modal-body', modal);
    const form = $('#cms-hero-form', modal);
    bindImageFileFields(form, fields);
    $('[data-reset-hero]', body)?.addEventListener('click', () => resetCmsKey('home_hero_image', 'grafikę powitalną'));
    $('[data-back]', form)?.addEventListener('click', () => typeof backAction === 'function' ? backAction() : closeModal());
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const submit = $('button[type="submit"]', form);
      if (submit) { submit.disabled = true; submit.textContent = 'ZAPISYWANIE…'; }
      try {
        const file = form.querySelector('[data-cms-image-field="url"] [data-image-file]')?.files?.[0] || null;
        const hiddenUrl = form.elements.url?.value || '';
        const alt = String(form.elements.alt?.value || '').trim();
        let next = {};
        let backupMade = false;

        if (file) {
          await window.MattCMS.createBackup('AUTO: przed zmianą grafiki powitalnej');
          backupMade = true;
          next.url = await uploadCmsImage(file, 'witaj-w-matts-world', 'home');
        } else if (override.url && hiddenUrl) {
          next.url = hiddenUrl;
        }
        if (alt && alt !== (baseImg?.getAttribute('alt') || '')) next.alt = alt;

        if (Object.keys(next).length) await window.MattCMS.save('home_hero_image', next, backupMade ? {backup:false} : {});
        else if (window.MattCMS.get('home_hero_image', null) != null) await window.MattCMS.remove('home_hero_image');

        notify('Grafika powitalna została zapisana.');
        await rerender();
      } catch (error) {
        notify(`Nie udało się zapisać grafiki: ${error.message}`, 'error');
        if (submit) { submit.disabled = false; submit.textContent = 'ZAPISZ GRAFIKĘ'; }
      }
    });
  }

  function openSiteSettingsManager() {
    if (!isAdmin()) return;
    openModal('USTAWIENIA STRONY', `<div class="cms-site-settings-grid">
      ${has('site.navigation.manage')?'<button class="cms-site-setting-card" type="button" data-open-navigation><strong>☰ KATEGORIE I PODKATEGORIE</strong><span>Dodawanie, edycja, usuwanie i zmiana kolejności pozycji w górnym menu.</span></button>':''}
      ${has('site.links.manage')?'<button class="cms-site-setting-card" type="button" data-open-links><strong>↗ LINKI SOCIAL MEDIA</strong><span>Zmień adres Twitch, Discord, Instagram i TikTok używany przez ikony oraz przyciski strony.</span></button>':''}
    </div>`);
    const body = $('#cms-modal-body', modal);
    $('[data-open-navigation]', body)?.addEventListener('click', openNavigationManager);
    $('[data-open-links]', body)?.addEventListener('click', openSiteLinksManager);
  }

  function openNavigationManager() {
    if (!isAdmin()) return;
    let items = clone(window.MattCMS?.get('navigation', null) || window.MattCMS?.extractNavigationFromDom?.() || []);
    const esc = window.MattCMS.escape;

    const apply = () => {
      window.MattCMS?.renderNavigation?.(items);
      if (typeof window.updateLinks === 'function') window.updateLinks();
    };

    const save = async (message, redraw = true) => {
      try {
        await window.MattCMS.save('navigation', items);
        apply();
        notify(message);
        if (redraw) draw();
      } catch (e) { notify(`Błąd zapisu menu: ${e.message}`, 'error'); }
    };

    const move = (arr, from, to) => {
      if (to < 0 || to >= arr.length) return;
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      draw();
    };

    const draw = () => {
      openModal('MENU — KATEGORIE I PODKATEGORIE', `<div class="cms-manager-actions"><div class="cms-manager-action-group">
        <button class="cms-primary" data-add-nav>+ DODAJ KATEGORIĘ</button>
        <button data-save-nav-order>✓ ZAPISZ KOLEJNOŚĆ</button>
        <button data-reset-nav>↶ PRZYWRÓĆ Z GITHUBA</button>
        <button data-site-back>← USTAWIENIA STRONY</button>
      </div><p>Kategoria bez podkategorii działa jak zwykły link. Po dodaniu podkategorii automatycznie staje się rozwijanym menu.</p></div>
      <div class="cms-discord-list">${items.map((cat,ci)=>`<section class="cms-discord-category"><header><div><small>KATEGORIA ${String(ci+1).padStart(2,'0')}</small><strong>${esc(cat.label || 'BEZ NAZWY')}</strong><p>${cat.children?.length ? `${cat.children.length} podkategorii` : esc(cat.href || 'Brak linku')}</p></div><div>
        <button data-nav-up="${ci}" ${ci===0?'disabled':''}>↑</button><button data-nav-down="${ci}" ${ci===items.length-1?'disabled':''}>↓</button>
        <button data-edit-nav="${ci}">EDYTUJ</button><button class="danger" data-delete-nav="${ci}">USUŃ</button>
      </div></header>
      <div class="cms-channel-admin-list">${(cat.children||[]).map((child,hi)=>`<article><div><span>↳</span><strong>${esc(child.label || 'PODKATEGORIA')}</strong><small>${esc(child.href || '#')}</small></div><div>
        <button data-sub-up="${ci}:${hi}" ${hi===0?'disabled':''}>↑</button><button data-sub-down="${ci}:${hi}" ${hi===(cat.children||[]).length-1?'disabled':''}>↓</button>
        <button data-edit-sub="${ci}:${hi}">EDYTUJ</button><button class="danger" data-delete-sub="${ci}:${hi}">USUŃ</button>
      </div></article>`).join('')}<button class="cms-add-subitem" data-add-sub="${ci}">+ DODAJ PODKATEGORIĘ</button></div></section>`).join('')}</div>`);
      const body = $('#cms-modal-body', modal);
      $('[data-add-nav]', body)?.addEventListener('click', () => editCategory(-1));
      $('[data-save-nav-order]', body)?.addEventListener('click', () => save('Kolejność menu została zapisana.'));
      $('[data-reset-nav]', body)?.addEventListener('click', () => resetCmsKey('navigation', 'menu główne'));
      $('[data-site-back]', body)?.addEventListener('click', openSiteSettingsManager);
      $$('[data-nav-up]', body).forEach(b => b.addEventListener('click', () => move(items, Number(b.dataset.navUp), Number(b.dataset.navUp)-1)));
      $$('[data-nav-down]', body).forEach(b => b.addEventListener('click', () => move(items, Number(b.dataset.navDown), Number(b.dataset.navDown)+1)));
      $$('[data-edit-nav]', body).forEach(b => b.addEventListener('click', () => editCategory(Number(b.dataset.editNav))));
      $$('[data-delete-nav]', body).forEach(b => b.addEventListener('click', async () => {
        const i = Number(b.dataset.deleteNav);
        if (!confirm(`Usunąć kategorię „${items[i]?.label}” razem z jej podkategoriami?`)) return;
        items.splice(i,1); await save('Kategoria została usunięta.');
      }));
      $$('[data-add-sub]', body).forEach(b => b.addEventListener('click', () => editSub(Number(b.dataset.addSub), -1)));
      $$('[data-edit-sub]', body).forEach(b => b.addEventListener('click', () => { const [ci,hi]=b.dataset.editSub.split(':').map(Number); editSub(ci,hi); }));
      $$('[data-delete-sub]', body).forEach(b => b.addEventListener('click', async () => {
        const [ci,hi]=b.dataset.deleteSub.split(':').map(Number);
        if (!confirm(`Usunąć podkategorię „${items[ci]?.children?.[hi]?.label}”?`)) return;
        items[ci].children.splice(hi,1); await save('Podkategoria została usunięta.');
      }));
      $$('[data-sub-up]', body).forEach(b => b.addEventListener('click', () => { const [ci,hi]=b.dataset.subUp.split(':').map(Number); move(items[ci].children, hi, hi-1); }));
      $$('[data-sub-down]', body).forEach(b => b.addEventListener('click', () => { const [ci,hi]=b.dataset.subDown.split(':').map(Number); move(items[ci].children, hi, hi+1); }));
    };

    const editCategory = index => {
      const current = index >= 0 ? items[index] : {label:'',href:'#/',children:[]};
      const fields = [{name:'label',label:'Nazwa kategorii',required:true},{name:'href',label:'Link kategorii (używany, gdy nie ma podkategorii)',required:false}];
      openModal(index>=0?'EDYTUJ KATEGORIĘ MENU':'DODAJ KATEGORIĘ MENU', `<form id="cms-nav-form" class="cms-form">${fields.map(f=>fieldHtml(f,current[f.name])).join('')}
        <div class="cms-form-context">Dla podstrony strony wpisz np. <strong>#/events</strong>. Możesz też użyć pełnego adresu https://…</div>
        <div class="cms-form-actions"><button type="button" data-back>← WRÓĆ</button><button class="cms-primary" type="submit">ZAPISZ</button></div></form>`);
      const form = $('#cms-nav-form', modal);
      $('[data-back]', form)?.addEventListener('click', draw);
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const value = { ...current, ...parseFields(form, fields), children: current.children || [] };
        if (index>=0) items[index]=value; else items.push(value);
        await save('Kategoria menu została zapisana.');
      });
    };

    const editSub = (ci,hi) => {
      const current = hi>=0 ? items[ci].children[hi] : {label:'',href:'#/'};
      const fields = [{name:'label',label:'Nazwa podkategorii',required:true},{name:'href',label:'Link / ścieżka',required:true}];
      openModal(hi>=0?'EDYTUJ PODKATEGORIĘ':'DODAJ PODKATEGORIĘ', `<form id="cms-sub-form" class="cms-form"><div class="cms-form-context">Kategoria: <strong>${esc(items[ci].label)}</strong></div>${fields.map(f=>fieldHtml(f,current[f.name])).join('')}
        <div class="cms-form-actions"><button type="button" data-back>← WRÓĆ</button><button class="cms-primary" type="submit">ZAPISZ</button></div></form>`);
      const form = $('#cms-sub-form', modal);
      $('[data-back]', form)?.addEventListener('click', draw);
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const value = parseFields(form, fields);
        items[ci].children ||= [];
        if (hi>=0) items[ci].children[hi]=value; else items[ci].children.push(value);
        await save('Podkategoria została zapisana.');
      });
    };

    draw();
  }

  function openSiteLinksManager() {
    if (!isAdmin()) return;
    const current = { ...SITE_CONFIG, ...(window.MattCMS?.get('site_links', {}) || {}) };
    const fields = [
      {name:'twitchUrl',label:'Twitch — link przy ikonie / TWITCH.TV',type:'url',required:true},
      {name:'discordUrl',label:'Discord — link do serwera',type:'url',required:true},
      {name:'instagramUrl',label:'Instagram',type:'url',required:true},
      {name:'tiktokUrl',label:'TikTok',type:'url',required:true}
    ];
    openModal('LINKI SOCIAL MEDIA', `<div class="cms-manager-actions"><div class="cms-manager-action-group"><button data-reset-links>↶ PRZYWRÓĆ Z CONFIG.JS</button><button data-site-back>← USTAWIENIA STRONY</button></div><p>Zmiana jest stosowana we wszystkich oznaczonych ikonach i oficjalnych przyciskach strony korzystających z tych adresów.</p></div>
      <form id="cms-links-form" class="cms-form">${fields.map(f=>fieldHtml(f,current[f.name])).join('')}<div class="cms-form-actions"><button class="cms-primary" type="submit">ZAPISZ LINKI</button></div></form>`);
    const body=$('#cms-modal-body',modal), form=$('#cms-links-form',modal);
    $('[data-site-back]',body)?.addEventListener('click',openSiteSettingsManager);
    $('[data-reset-links]',body)?.addEventListener('click',()=>resetCmsKey('site_links','linki social media'));
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      try {
        await window.MattCMS.save('site_links',parseFields(form,fields));
        if (typeof window.updateLinks === 'function') window.updateLinks();
        notify('Linki zostały zapisane.');
        openSiteSettingsManager();
      } catch(err){notify(`Nie udało się zapisać linków: ${err.message}`,'error');}
    });
  }

  function openStreamersManager() {
    const normalizeStreamer = item => window.MattCMS?.normalizeStreamer ? window.MattCMS.normalizeStreamer(item) : item;

    const setFormValue = (form, name, value) => {
      const input = form.elements?.[name];
      if (!input || value == null) return;
      input.value = Array.isArray(value) ? value.join(', ') : String(value);
      input.dispatchEvent(new Event('input', { bubbles:true }));
      input.dispatchEvent(new Event('change', { bubbles:true }));
    };

    const bindTwitchAutofill = form => {
      const channelField = form.elements?.channelUrl?.closest('.cms-field');
      if (!channelField || channelField.querySelector('[data-twitch-autofill]')) return;

      const box = document.createElement('div');
      box.className = 'cms-twitch-autofill';
      box.innerHTML = `<button type="button" class="cms-twitch-autofill-btn" data-twitch-autofill>⚡ AUTOMATYCZNA KONFIGURACJA</button>
        <small data-twitch-autofill-status>Wklej link do kanału Twitch i kliknij przycisk. Dane zostaną pobrane z Twitcha.</small>`;
      channelField.insertAdjacentElement('afterend', box);

      const button = $('[data-twitch-autofill]', box);
      const status = $('[data-twitch-autofill-status]', box);

      button.addEventListener('click', async () => {
        const channelUrl = String(form.elements?.channelUrl?.value || '').trim();
        const login = window.MattCMS?.twitchLoginFromUrl?.(channelUrl) || '';
        if (!login) {
          notify('Najpierw wklej poprawny link do kanału Twitch, np. https://www.twitch.tv/wazzzupek', 'error');
          form.elements?.channelUrl?.focus();
          return;
        }
        if (!window.supabaseClient?.functions) {
          notify('Brak połączenia z funkcjami Supabase.', 'error');
          return;
        }

        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = '⚡ POBIERANIE DANYCH…';
        status.textContent = 'Łączenie z Twitch API…';
        status.classList.remove('is-error','is-ok');

        try {
          const { data, error } = await window.supabaseClient.functions.invoke('twitch-streamer-autofill', {
            body: { channelUrl }
          });
          if (error) {
            let message = error.message || 'Nie udało się pobrać danych z Twitcha.';
            try {
              const context = error.context;
              if (context && typeof context.json === 'function') {
                const payload = await context.json();
                if (payload?.error) message = payload.error;
              }
            } catch (_) {}
            throw new Error(message);
          }
          if (!data || data.ok === false) throw new Error(data?.error || 'Twitch nie zwrócił danych kanału.');

          if (data.displayName) setFormValue(form, 'displayName', data.displayName);
          if (data.channelUrl) setFormValue(form, 'channelUrl', data.channelUrl);
          if (data.tagline) setFormValue(form, 'tagline', data.tagline);
          if (Array.isArray(data.games) && data.games.length) setFormValue(form, 'games', data.games);
          if (data.clipUrl) setFormValue(form, 'clipUrl', data.clipUrl);

          const filled = [];
          if (data.displayName) filled.push('nazwa');
          if (data.tagline) filled.push('opis');
          if (data.games?.length) filled.push(`${data.games.length} ${data.games.length === 1 ? 'gra' : 'gry'}`);
          if (data.clipUrl) filled.push('najlepszy klip');
          status.textContent = filled.length
            ? `Gotowe: ${filled.join(', ')}.${data.warning ? ` ${data.warning}` : ''}`
            : (data.warning || 'Kanał został znaleziony, ale Twitch nie zwrócił dodatkowych danych.');
          status.classList.add('is-ok');
          notify('Automatyczna konfiguracja Twitch została uzupełniona. Sprawdź dane i kliknij ZAPISZ.');
        } catch (error) {
          status.textContent = `Nie udało się pobrać danych: ${error.message}`;
          status.classList.add('is-error');
          notify(`Automatyczna konfiguracja: ${error.message}`, 'error');
        } finally {
          button.disabled = false;
          button.textContent = originalText;
        }
      });
    };

    openArrayManager({
      key:'streamers', title:'POLECANI STREAMERZY', singular:'streamera', fallback:extractStreamers,
      label:item=>item.displayName || item.login,
      normalizeItem:normalizeStreamer,
      onFormReady:bindTwitchAutofill,
      beforeSave:value=>{
        const login = window.MattCMS?.twitchLoginFromUrl?.(value.channelUrl) || '';
        if (!login) {
          throw new Error('Nie udało się rozpoznać loginu Twitch z linku do kanału. Wklej pełny link, np. https://www.twitch.tv/matthevc');
        }
        const clipSlug = window.MattCMS?.twitchClipSlugFromUrl?.(value.clipUrl) || '';
        if (!clipSlug) {
          throw new Error('Nie udało się rozpoznać klipu Twitch. Wklej link z clips.twitch.tv albo link typu twitch.tv/nick/clip/...');
        }
        return { ...value, login, clipSlug };
      },
      fields:[
        {name:'displayName',label:'Wyświetlana nazwa',required:true,placeholder:'np. Wazzzupek'},
        {name:'channelUrl',label:'Link do kanału Twitch',type:'url',required:true,placeholder:'https://www.twitch.tv/wazzzupek',help:'Login Twitch zostanie automatycznie odczytany z tego linku.'},
        {name:'clipUrl',label:'Link do klipu Twitch',type:'url',required:true,placeholder:'https://clips.twitch.tv/...',help:'Możesz wkleić go ręcznie albo użyć Automatycznej konfiguracji.'},
        {name:'tagline',label:'Krótki opis',type:'textarea',help:'Automatyczna konfiguracja pobiera publiczny opis kanału Twitch.'},
        {name:'games',label:'Ostatnio / najczęściej ogrywane gry',type:'csv',help:'Automatyczna konfiguracja ustala je na podstawie aktualnej kategorii kanału i ostatnich klipów.'}
      ]
    });
  }

  function openModeratorsManager() {
    openArrayManager({
      key:'moderators', title:'NASZA MODERACJA', singular:'osobę', fallback:extractModerators, label:item=>item.name,
      fields:[
        {name:'name',label:'Nick / nazwa',required:true},{name:'role',label:'Rola / stanowisko',required:true},
        {name:'description',label:'Opis osoby',type:'textarea',required:true},{name:'twitch',label:'Link Twitch',type:'url'},
        {name:'discord',label:'Nick Discord'},{name:'image',label:'Zdjęcie moderatora',type:'image-file',folder:'moderators'}
      ]
    });
  }

  function openBenefitsManager() {
    openArrayManager({
      key:'moderator_benefits', title:'MODERACJA / KORZYŚCI', singular:'korzyść', fallback:extractBenefits, label:item=>item.title,
      fields:[{name:'title',label:'Nazwa korzyści',required:true},{name:'description',label:'Opis korzyści',type:'textarea',required:true}]
    });
  }

  function openCommandsManager() {
    openArrayManager({
      key:'commands', title:'KOMENDY', singular:'komendę', fallback:()=>window.MATT_COMMANDS_DEFAULT || [], label:item=>item.command,
      fields:[
        {name:'command',label:'Komenda',required:true},{name:'description',label:'Opis',type:'textarea',required:true},
        {name:'category',label:'Kategoria',required:true},{name:'subcategory',label:'Podkategoria (opcjonalnie)'},
        {name:'roles',label:'Dostęp dla',type:'roles'}
      ]
    });
  }


  function openDownloadsManager() {
    if (!isAdmin()) return;
    const esc = window.MattCMS?.escape || (v => String(v || ''));
    const baseItems = clone(window.MattDownloads?.baseItems || []);
    let config = clone(window.MattDownloads?.getConfig?.() || { order: [], overrides: {}, hidden: [], custom: [] });
    config.order = Array.isArray(config.order) ? config.order.map(String) : [];
    config.overrides = config.overrides && typeof config.overrides === 'object' ? config.overrides : {};
    config.hidden = Array.isArray(config.hidden) ? config.hidden.map(String) : [];
    config.custom = Array.isArray(config.custom) ? config.custom : [];

    const baseMap = new Map(baseItems.map(item => [String(item.id), item]));
    const customMap = () => new Map(config.custom.map(item => [String(item.id), item]));
    const hiddenSet = () => new Set(config.hidden.map(String));

    const visibleItems = () => {
      const hidden = hiddenSet();
      const list = [];
      baseItems.forEach(base => {
        if (hidden.has(String(base.id))) return;
        list.push({ ...base, ...(config.overrides[String(base.id)] || {}), id:String(base.id), source:'github' });
      });
      config.custom.forEach(item => {
        if (!item || hidden.has(String(item.id))) return;
        list.push({ ...item, id:String(item.id), source:'cms' });
      });
      const order = new Map(config.order.map((id,index)=>[String(id),index]));
      list.sort((a,b)=>(order.has(a.id)?order.get(a.id):100000)-(order.has(b.id)?order.get(b.id):100000));
      return list;
    };

    const normalizeOrder = () => {
      const ids = visibleItems().map(item => String(item.id));
      config.order = [...ids, ...config.order.filter(id => !ids.includes(String(id)))];
    };

    const save = async (message, redraw = true) => {
      try {
        normalizeOrder();
        await window.MattCMS.save('downloads_config', config);
        notify(message);
        if (redraw) draw(); else await rerender();
      } catch (error) { notify(`Błąd zapisu: ${error.message}`, 'error'); }
    };


    const draw = () => {
      const visible = visibleItems();
      const hiddenBase = baseItems.filter(item => hiddenSet().has(String(item.id)));
      openModal('DO POBRANIA — PLIKI', `<div class="cms-manager-actions"><div class="cms-manager-action-group">
        <button class="cms-primary" type="button" data-add-download>+ DODAJ PLIK</button>
        <button type="button" data-save-order>✓ ZAPISZ KOLEJNOŚĆ</button>
        <button type="button" data-reset-downloads>↶ WSZYSTKO Z GITHUBA</button>
      </div><p>Nowe pliki wybierasz z dysku. Możesz też zmienić opis, kategorię, podmienić istniejący plik lub zmienić kolejność wyświetlania.</p></div>
      <div class="cms-manager-list">${visible.length ? visible.map((item,index)=>`<article class="cms-manager-item cms-download-manager-item"><div><small>${String(index+1).padStart(2,'0')} / ${esc(String(item.type || window.MattDownloads?.typeFromHref?.(item.href) || 'PLIK').toUpperCase())} / ${item.source==='github'?'GITHUB':'CMS'}</small><div><strong>${esc(item.title || 'Plik')}</strong><span>${esc([item.sizeLabel,item.category].filter(Boolean).join(' • '))}</span></div></div><div><button type="button" data-download-up="${esc(item.id)}" ${index===0?'disabled':''}>↑</button><button type="button" data-download-down="${esc(item.id)}" ${index===visible.length-1?'disabled':''}>↓</button><button type="button" data-edit-download="${esc(item.id)}">EDYTUJ</button>${item.source==='github'?`<button type="button" data-reset-download="${esc(item.id)}" ${config.overrides[item.id]?'':'disabled'}>↶ GITHUB</button>`:''}<button class="danger" type="button" data-delete-download="${esc(item.id)}">USUŃ</button></div></article>`).join('') : '<div class="cms-empty">Brak plików do pobrania. Dodaj pierwszy.</div>'}</div>
      ${hiddenBase.length?`<section class="cms-download-hidden"><header><strong>UKRYTE PLIKI Z GITHUBA</strong></header><div class="cms-manager-list">${hiddenBase.map(item=>`<article class="cms-manager-item"><div><small>UKRYTY</small><strong>${esc(item.title)}</strong></div><div><button type="button" data-restore-download="${esc(item.id)}">PRZYWRÓĆ</button></div></article>`).join('')}</div></section>`:''}`);

      $('[data-add-download]', modal)?.addEventListener('click', () => edit(null));
      $('[data-save-order]', modal)?.addEventListener('click', () => save('Kolejność plików została zapisana.', false));
      $('[data-reset-downloads]', modal)?.addEventListener('click', async () => {
        if (!confirm('Przywrócić całą sekcję plików do wersji z GitHuba? Własne pliki CMS znikną z listy, ale backup zachowa konfigurację.')) return;
        try { await window.MattCMS.remove('downloads_config'); notify('Przywrócono pliki z GitHuba.'); await rerender(); }
        catch(error){ notify(error.message,'error'); }
      });

      $$('[data-download-up]', modal).forEach(btn => btn.addEventListener('click', () => move(btn.dataset.downloadUp, -1)));
      $$('[data-download-down]', modal).forEach(btn => btn.addEventListener('click', () => move(btn.dataset.downloadDown, 1)));
      $$('[data-edit-download]', modal).forEach(btn => btn.addEventListener('click', () => edit(btn.dataset.editDownload)));
      $$('[data-reset-download]', modal).forEach(btn => btn.addEventListener('click', async () => {
        const id=String(btn.dataset.resetDownload); delete config.overrides[id]; config.hidden=config.hidden.filter(x=>String(x)!==id); await save('Przywrócono dane pliku z GitHuba.');
      }));
      $$('[data-delete-download]', modal).forEach(btn => btn.addEventListener('click', async () => {
        const id=String(btn.dataset.deleteDownload); const base=baseMap.has(id);
        const item=visibleItems().find(x=>String(x.id)===id);
        if (!confirm(`Usunąć z listy „${item?.title || 'ten plik'}”?`)) return;
        if (base) {
          if (!config.hidden.includes(id)) config.hidden.push(id);
        } else {
          config.custom=config.custom.filter(x=>String(x.id)!==id);
        }
        config.order=config.order.filter(x=>String(x)!==id);
        await save('Plik został usunięty z listy.');
      }));
      $$('[data-restore-download]', modal).forEach(btn => btn.addEventListener('click', async () => {
        const id=String(btn.dataset.restoreDownload); config.hidden=config.hidden.filter(x=>String(x)!==id); if(!config.order.includes(id))config.order.push(id); await save('Plik został przywrócony.');
      }));
    };

    const move = (id, direction) => {
      const list=visibleItems(); const index=list.findIndex(x=>String(x.id)===String(id)); const target=index+direction;
      if(index<0||target<0||target>=list.length)return;
      [list[index],list[target]]=[list[target],list[index]];
      config.order=list.map(x=>String(x.id));
      draw();
    };

    const edit = (id) => {
      id = id ? String(id) : '';
      const base = id ? baseMap.get(id) : null;
      const custom = id ? customMap().get(id) : null;
      const current = clone(base ? { ...base, ...(config.overrides[id] || {}) } : (custom || {
        id:'', title:'', description:'', category:'', type:'', sizeLabel:'', href:'', storagePath:'', fileName:'', secondaryHref:'', secondaryLabel:''
      }));
      const isNew=!id;
      openModal(isNew?'DODAJ PLIK DO POBRANIA':'EDYTUJ PLIK DO POBRANIA', `<form id="cms-download-form" class="cms-form">
        <label class="cms-field"><span>Nazwa wyświetlana</span><input name="title" required maxlength="120" value="${esc(current.title||'')}"></label>
        <label class="cms-field"><span>Opis</span><textarea name="description" rows="5" maxlength="700" required>${esc(current.description||'')}</textarea></label>
        <div class="cms-form-grid two">
          <label class="cms-field"><span>Kategoria</span><input name="category" maxlength="80" placeholder="Np. TWITCH, DBD, RESHADE" value="${esc(current.category||'')}"></label>
          <label class="cms-field"><span>Typ pliku</span><input name="type" maxlength="10" placeholder="Uzupełni się z pliku" value="${esc(current.type||'')}"></label>
        </div>
        <label class="cms-field"><span>${isNew?'Plik z dysku':'Podmień plik (opcjonalnie)'}</span><div class="cms-download-file-row"><label class="cms-download-file-button">📁 WYBIERZ PLIK<input type="file" name="file" ${isNew?'required':''} hidden></label><span data-download-file-name>${esc(current.fileName || (current.href ? decodeURIComponent(String(current.href).split('?')[0].split('/').pop()||'Aktualny plik') : 'Nie wybrano pliku'))}</span></div><small>Maksymalnie 50 MB. Przy edycji możesz zostawić obecny plik bez zmian.</small></label>
        <div class="cms-form-grid two">
          <label class="cms-field"><span>Dodatkowy przycisk — tekst (opcjonalnie)</span><input name="secondaryLabel" maxlength="40" placeholder="Np. ZOBACZ REGULAMIN" value="${esc(current.secondaryLabel||'')}"></label>
          <label class="cms-field"><span>Dodatkowy przycisk — link (opcjonalnie)</span><input name="secondaryHref" placeholder="#/rules/twitch lub https://..." value="${esc(current.secondaryHref||'')}"></label>
        </div>
        ${current.href?`<div class="cms-download-current"><small>AKTUALNY PLIK</small><a href="${esc(current.href)}" target="_blank" rel="noopener">${esc(current.fileName || current.href)}</a></div>`:''}
        <div class="cms-form-actions"><button type="button" data-back>← WRÓĆ</button><button class="cms-primary" type="submit">${isNew?'DODAJ PLIK':'ZAPISZ ZMIANY'}</button></div>
      </form>`);
      const form=$('#cms-download-form',modal); const input=form.elements.file; const label=$('[data-download-file-name]',form);
      input?.addEventListener('change',()=>{const file=input.files?.[0];if(file)label.textContent=`${file.name} • ${cmsPrettyBytes(file.size)}`;});
      $('[data-back]',form)?.addEventListener('click',draw);
      form.addEventListener('submit',async e=>{
        e.preventDefault(); const submit=$('button[type="submit"]',form); submit.disabled=true; submit.textContent='ZAPISYWANIE…';
        try {
          const file=input.files?.[0]||null;
          let next={...current,
            title:String(form.elements.title.value||'').trim(),
            description:String(form.elements.description.value||'').trim(),
            category:String(form.elements.category.value||'').trim()||'PLIK',
            type:String(form.elements.type.value||'').trim().toUpperCase(),
            secondaryLabel:String(form.elements.secondaryLabel.value||'').trim(),
            secondaryHref:String(form.elements.secondaryHref.value||'').trim()
          };
          if(isNew && !file)throw new Error('Wybierz plik z dysku.');
          if(file){
            submit.textContent='WYSYŁANIE PLIKU…';
            const uploaded=await uploadCmsDownload(file,next.title||file.name);
            next={...next,...uploaded};
            if(!String(form.elements.type.value||'').trim())next.type=uploaded.type;
          }
          if(!next.href)throw new Error('Brakuje pliku do pobrania.');
          if(!next.type)next.type=window.MattDownloads?.typeFromHref?.(next.href)||'PLIK';
          if(base){
            const override={};
            ['title','description','category','type','sizeLabel','href','storagePath','fileName','secondaryHref','secondaryLabel'].forEach(key=>{
              const bv=base[key]??''; const nv=next[key]??''; if(String(bv)!==String(nv))override[key]=nv;
            });
            if(Object.keys(override).length)config.overrides[id]=override; else delete config.overrides[id];
            config.hidden=config.hidden.filter(x=>String(x)!==id);
          }else{
            const itemId=id||`download-${slugify(next.title||next.fileName||'plik')}-${Date.now()}`;
            next.id=itemId; const idx=config.custom.findIndex(x=>String(x.id)===itemId);
            if(idx>=0)config.custom[idx]=next;else config.custom.push(next);
            if(!config.order.includes(itemId))config.order.push(itemId);
          }
          await save(isNew?'Plik został dodany.':'Plik został zaktualizowany.',false);
        }catch(error){notify(error.message,'error');submit.disabled=false;submit.textContent=isNew?'DODAJ PLIK':'ZAPISZ ZMIANY';}
      });
    };

    draw();
  }

  function openTopicsManager() {
    let topics = clone(window.MattCMS?.get('contact_topics', null) || extractTopics());
    const draw = () => {
      openModal('WNIOSKI / KONTAKT — TEMATY', `<div class="cms-manager-actions"><div class="cms-manager-action-group"><button class="cms-primary" data-add-topic>+ DODAJ TEMAT</button><button data-reset-topics>↶ PRZYWRÓĆ Z GITHUBA</button></div><p>Tematy pojawiają się w polu wyboru formularza kontaktowego.</p></div><div class="cms-manager-list">${topics.map((topic,index)=>`<article class="cms-manager-item"><div><small>${String(index+1).padStart(2,'0')}</small><strong>${window.MattCMS.escape(topic)}</strong></div><div><button data-edit-topic="${index}">EDYTUJ</button><button class="danger" data-delete-topic="${index}">USUŃ</button></div></article>`).join('')}</div>`);
      const body = $('#cms-modal-body', modal);
      $('[data-add-topic]', body).addEventListener('click', () => editTopic(-1));
      $('[data-reset-topics]', body).addEventListener('click', () => resetCmsKey('contact_topics', 'tematy formularza'));
      $$('[data-edit-topic]', body).forEach(b=>b.addEventListener('click',()=>editTopic(Number(b.dataset.editTopic))));
      $$('[data-delete-topic]', body).forEach(b=>b.addEventListener('click',async()=>{
        const i=Number(b.dataset.deleteTopic); if(!confirm(`Usunąć temat: ${topics[i]}?`)) return; topics.splice(i,1);
        try{await window.MattCMS.save('contact_topics',topics); notify('Temat usunięty.'); await rerender();}catch(e){notify(e.message,'error');}
      }));
    };
    const editTopic = index => {
      const value=index>=0?topics[index]:'';
      openModal(index>=0?'EDYTUJ TEMAT':'DODAJ TEMAT', `<form id="cms-topic-form" class="cms-form"><label class="cms-field"><span>Nazwa tematu</span><input name="topic" required value="${window.MattCMS.escape(value)}"></label><div class="cms-form-actions"><button type="button" data-back>← WRÓĆ</button><button class="cms-primary" type="submit">ZAPISZ</button></div></form>`);
      const form=$('#cms-topic-form',modal); $('[data-back]',form).addEventListener('click',draw); form.addEventListener('submit',async e=>{e.preventDefault();const v=form.elements.topic.value.trim();if(index>=0)topics[index]=v;else topics.push(v);try{await window.MattCMS.save('contact_topics',topics);notify('Tematy zapisane.');await rerender();}catch(err){notify(err.message,'error');}});
    };
    draw();
  }


  function openDiscordJoinManager() {
    const esc = window.MattCMS.escape;
    const drawHub = () => {
      openModal('DISCORD — PODGLĄD I KOMUNIKATY', `<div class="cms-manager-actions"><div class="cms-manager-action-group"><button class="cms-primary" data-open-bubbles>▰ KOMUNIKATY</button><button class="cms-primary" data-open-preview>◫ PODGLĄD DISCORDA</button></div><p>Edytujesz tylko zawartość strony „Jak dostać się na Discord”. Zmiany są dostępne wyłącznie dla administratora i zapisują się w CMS.</p></div>
      <div class="cms-feature-grid"><article class="cms-feature-card"><span>01</span><div><strong>KOMUNIKATY NAD PODGLĄDEM</strong><p>Dodawaj komunikaty podobne do czerwonego „ZACZNIJ OD #konfiguracja-tickets”, zmieniaj ich kolejność, kolor, ikonę, treść i przycisk.</p></div><button data-open-bubbles>EDYTUJ →</button></article><article class="cms-feature-card"><span>02</span><div><strong>PODGLĄD SERWERA</strong><p>Zmieniaj kategorie i kanały w makiecie Discorda, wiadomości na czacie, członków, nagłówki i opis podglądu.</p></div><button data-open-preview>EDYTUJ →</button></article></div>`);
      const body=$('#cms-modal-body',modal);
      $$('[data-open-bubbles]',body).forEach(b=>b.addEventListener('click',openBubbles));
      $$('[data-open-preview]',body).forEach(b=>b.addEventListener('click',openPreview));
    };

    const openBubbles = () => {
      let items = clone(window.MattCMS?.get('discord_join_bubbles', null) || extractDiscordJoinBubbles());
      const move=(from,to)=>{if(to<0||to>=items.length)return;const [x]=items.splice(from,1);items.splice(to,0,x);draw();};
      const save=async(message)=>{try{await window.MattCMS.save('discord_join_bubbles',items);window.MattCMS.renderDiscordJoinBubbles(items);notify(message);draw();}catch(e){notify(`Błąd zapisu: ${e.message}`,'error');}};
      const draw=()=>{
        openModal('DISCORD — KOMUNIKATY', `<div class="cms-manager-actions"><div class="cms-manager-action-group"><button data-hub>← PODGLĄD / KOMUNIKATY</button><button class="cms-primary" data-add>+ DODAJ KOMUNIKAT</button><button data-save-order>✓ ZAPISZ KOLEJNOŚĆ</button><button data-reset>↶ Z GITHUBA</button></div><p>Każdy komunikat może mieć własny kolor, ikonę, tekst wyróżniony i przycisk. Pusty link przycisku oznacza główny link Discord z ustawień strony.</p></div><div class="cms-manager-list">${items.length?items.map((x,i)=>`<article class="cms-manager-item"><div><small>${String(i+1).padStart(2,'0')} / ${esc(String(x.style||'red').toUpperCase())}</small><strong>${esc(x.title||'KOMUNIKAT')} ${x.highlight?`<em>${esc(x.highlight)}</em>`:''}</strong></div><div><button data-up="${i}" ${i===0?'disabled':''}>↑</button><button data-down="${i}" ${i===items.length-1?'disabled':''}>↓</button><button data-edit="${i}">EDYTUJ</button><button class="danger" data-delete="${i}">USUŃ</button></div></article>`).join(''):'<div class="cms-empty">Brak komunikatów. Dodaj pierwszy.</div>'}</div>`);
        const body=$('#cms-modal-body',modal);
        $('[data-hub]',body).addEventListener('click',drawHub);$('[data-add]',body).addEventListener('click',()=>edit(-1));$('[data-save-order]',body).addEventListener('click',()=>save('Kolejność komunikatów zapisana.'));$('[data-reset]',body).addEventListener('click',()=>resetCmsKey('discord_join_bubbles','komunikaty strony Discord'));
        $$('[data-up]',body).forEach(b=>b.addEventListener('click',()=>move(Number(b.dataset.up),Number(b.dataset.up)-1)));$$('[data-down]',body).forEach(b=>b.addEventListener('click',()=>move(Number(b.dataset.down),Number(b.dataset.down)+1)));$$('[data-edit]',body).forEach(b=>b.addEventListener('click',()=>edit(Number(b.dataset.edit))));$$('[data-delete]',body).forEach(b=>b.addEventListener('click',async()=>{const i=Number(b.dataset.delete);if(!confirm(`Usunąć komunikat „${items[i]?.title||''}”?`))return;items.splice(i,1);await save('Komunikat usunięty.');}));
      };
      const edit=index=>{
        const cur=index>=0?{accentColor:'#ef2b2d',backgroundColor:'#241315',textColor:'#c9cbd1',...items[index]}:{icon:'⚙',kicker:'',title:'',highlight:'',description:'',emphasis:'',buttonText:'',buttonUrl:'',style:'red',accentColor:'#ef2b2d',backgroundColor:'#241315',textColor:'#c9cbd1'};
        const fields=[
          {name:'style',label:'Wygląd komunikatu',type:'select',options:[
            {value:'red',label:'Czerwony / MATT\'S WORLD'},
            {value:'discord',label:'Fioletowy / Discord'},
            {value:'dark',label:'Ciemny / neutralny'},
            {value:'green',label:'Zielony / pozytywny'},
            {value:'custom',label:'WŁASNE KOLORY'}
          ]},
          {name:'accentColor',label:'Własny kolor akcentu',type:'color',help:'Używany po wybraniu „WŁASNE KOLORY”.'},
          {name:'backgroundColor',label:'Własny kolor tła',type:'color',help:'Używany po wybraniu „WŁASNE KOLORY”.'},
          {name:'textColor',label:'Własny kolor tekstu',type:'color',help:'Używany po wybraniu „WŁASNE KOLORY”.'},
          {name:'icon',label:'Ikona / emoji'},
          {name:'kicker',label:'Mały nagłówek'},
          {name:'title',label:'Tytuł',required:true},
          {name:'highlight',label:'Wyróżniony fragment tytułu',help:'Np. #konfiguracja-tickets — będzie w kolorze akcentu.'},
          {name:'description',label:'Główny opis',type:'textarea',required:true},
          {name:'emphasis',label:'Dodatkowe wyróżnienie na dole',type:'textarea'},
          {name:'buttonText',label:'Tekst przycisku'},
          {name:'buttonUrl',label:'Link przycisku',help:'Zostaw puste, aby użyć głównego linku do Discorda.'}
        ];
        openModal(index>=0?'EDYTUJ KOMUNIKAT':'DODAJ KOMUNIKAT',`<form id="cms-discord-bubble-form" class="cms-form">${fields.map(f=>fieldHtml(f,cur[f.name])).join('')}<div class="cms-form-actions"><button type="button" data-back>← WRÓĆ</button><button class="cms-primary" type="submit">ZAPISZ</button></div></form>`);
        const form=$('#cms-discord-bubble-form',modal);
        const colorNames=['accentColor','backgroundColor','textColor'];
        const syncColors=()=>{
          const custom=form.elements.style?.value==='custom';
          colorNames.forEach(name=>{
            const input=form.elements[name], field=input?.closest('.cms-field');
            if(field) field.classList.toggle('cms-color-disabled',!custom);
            if(input) input.disabled=!custom;
          });
        };
        syncColors();
        form.addEventListener('change',syncColors);
        $('[data-back]',form).addEventListener('click',draw);
        form.addEventListener('submit',async e=>{
          e.preventDefault();
          colorNames.forEach(name=>{if(form.elements[name]) form.elements[name].disabled=false;});
          const v={...cur,...parseFields(form,fields),id:cur.id||`komunikat-${Date.now()}`};
          if(index>=0)items[index]=v;else items.push(v);
          await save('Komunikat zapisany.');
        });
      };
      draw();
    };

    const openPreview = () => {
      let data = clone(window.MattCMS?.get('discord_join_preview', null) || extractDiscordJoinPreview());
      data.categories = Array.isArray(data.categories)?data.categories:[];data.messages=Array.isArray(data.messages)?data.messages:[];data.memberGroups=Array.isArray(data.memberGroups)?data.memberGroups:[];
      const save=async(message,redraw=true)=>{try{await window.MattCMS.save('discord_join_preview',data);window.MattCMS.renderDiscordJoinPreview(data);notify(message);if(redraw)draw();}catch(e){notify(`Błąd zapisu: ${e.message}`,'error');}};
      const move=(arr,from,to)=>{if(to<0||to>=arr.length)return;const [x]=arr.splice(from,1);arr.splice(to,0,x);draw();};
      const draw=()=>{
        openModal('DISCORD — EDYCJA PODGLĄDU', `<div class="cms-manager-actions"><div class="cms-manager-action-group"><button data-hub>← PODGLĄD / KOMUNIKATY</button><button data-general>✎ NAGŁÓWEK / USTAWIENIA</button><button data-import>⇄ POBIERZ KANAŁY Z „OPIS KANAŁÓW”</button><button data-reset>↶ Z GITHUBA</button></div><p>Makieta jest poglądowa. Nazwa serwera, ikona i liczniki nadal mogą być automatycznie pobierane z prawdziwego zaproszenia Discord.</p></div>
        <div class="cms-preview-admin-grid"><section><header><strong>KATEGORIE I KANAŁY</strong><button class="cms-primary" data-add-cat>+ KATEGORIA</button></header>${data.categories.map((c,ci)=>`<article class="cms-preview-admin-card"><div class="cms-preview-admin-head"><div><small>${String(ci+1).padStart(2,'0')}</small><strong>${esc(c.title||'KATEGORIA')}</strong><span>${(c.channels||[]).length} kanałów</span></div><div><button data-cat-up="${ci}" ${ci===0?'disabled':''}>↑</button><button data-cat-down="${ci}" ${ci===data.categories.length-1?'disabled':''}>↓</button><button data-edit-cat="${ci}">EDYTUJ</button><button class="danger" data-del-cat="${ci}">USUŃ</button></div></div><div class="cms-channel-admin-list">${(c.channels||[]).map((ch,hi)=>`<article><div><span>${esc(ch.icon||'#')}</span><strong>${esc(ch.name||'kanał')}</strong><small>${ch.active?'AKTYWNY • ':''}${esc(ch.href||'')}</small></div><div><button data-ch-up="${ci}:${hi}" ${hi===0?'disabled':''}>↑</button><button data-ch-down="${ci}:${hi}" ${hi===(c.channels||[]).length-1?'disabled':''}>↓</button><button data-edit-ch="${ci}:${hi}">EDYTUJ</button><button class="danger" data-del-ch="${ci}:${hi}">USUŃ</button></div></article>`).join('')}<button class="cms-add-subitem" data-add-ch="${ci}">+ DODAJ KANAŁ</button></div></article>`).join('')}</section>
        <section><header><strong>WIADOMOŚCI W PODGLĄDZIE</strong><button class="cms-primary" data-add-msg>+ WIADOMOŚĆ</button></header><div class="cms-manager-list">${data.messages.map((m,i)=>`<article class="cms-manager-item"><div><small>${esc(m.date||'BEZ DATY')} • ${esc(m.time||'')}</small><strong>${esc(m.author||'Użytkownik')}</strong></div><div><button data-msg-up="${i}" ${i===0?'disabled':''}>↑</button><button data-msg-down="${i}" ${i===data.messages.length-1?'disabled':''}>↓</button><button data-edit-msg="${i}">EDYTUJ</button><button class="danger" data-del-msg="${i}">USUŃ</button></div></article>`).join('')}</div></section>
        <section><header><strong>LISTA OSÓB</strong><button class="cms-primary" data-add-group>+ GRUPA</button></header>${data.memberGroups.map((g,gi)=>`<article class="cms-preview-admin-card"><div class="cms-preview-admin-head"><div><small>GRUPA ${String(gi+1).padStart(2,'0')}</small><strong>${esc(g.title||'UŻYTKOWNICY')}</strong><span>${(g.members||[]).length} osób</span></div><div><button data-group-up="${gi}" ${gi===0?'disabled':''}>↑</button><button data-group-down="${gi}" ${gi===data.memberGroups.length-1?'disabled':''}>↓</button><button data-edit-group="${gi}">EDYTUJ</button><button class="danger" data-del-group="${gi}">USUŃ</button></div></div><div class="cms-channel-admin-list">${(g.members||[]).map((m,mi)=>`<article><div><span>${esc(m.initial||String(m.name||'?').charAt(0))}</span><strong>${esc(m.name||'osoba')}</strong><small>${esc(m.status||'')}</small></div><div><button data-member-up="${gi}:${mi}" ${mi===0?'disabled':''}>↑</button><button data-member-down="${gi}:${mi}" ${mi===(g.members||[]).length-1?'disabled':''}>↓</button><button data-edit-member="${gi}:${mi}">EDYTUJ</button><button class="danger" data-del-member="${gi}:${mi}">USUŃ</button></div></article>`).join('')}<button class="cms-add-subitem" data-add-member="${gi}">+ DODAJ OSOBĘ</button></div></article>`).join('')}</section></div>`);
        const body=$('#cms-modal-body',modal);$('[data-hub]',body).addEventListener('click',drawHub);$('[data-general]',body).addEventListener('click',editGeneral);$('[data-reset]',body).addEventListener('click',()=>resetCmsKey('discord_join_preview','podgląd Discorda'));
        $('[data-import]',body).addEventListener('click',async()=>{const cmsSource=window.MattCMS?.get('discord_channels',null);const source=clone(cmsSource||extractDiscordCategories());if(!source.length)return notify('Brak kanałów do zaimportowania.','error');if(!confirm('Zastąpić kategorie i kanały w podglądzie danymi z „OPIS KANAŁÓW”? Wiadomości i lista osób pozostaną bez zmian.'))return;data.categories=source.map(c=>({title:c.title,channels:(c.channels||[]).map(ch=>({icon:ch.icon,name:ch.name,href:`#/discord/channels?jump=${cmsSource?'discord-cms-':'discord-role-'}${c.id||slugify(c.title)}`,active:false,vip:/vip/i.test(ch.name)}))}));await save('Kanały podglądu zsynchronizowane.');});
        $('[data-add-cat]',body).addEventListener('click',()=>editCat(-1));$$('[data-cat-up]',body).forEach(b=>b.addEventListener('click',()=>move(data.categories,Number(b.dataset.catUp),Number(b.dataset.catUp)-1)));$$('[data-cat-down]',body).forEach(b=>b.addEventListener('click',()=>move(data.categories,Number(b.dataset.catDown),Number(b.dataset.catDown)+1)));$$('[data-edit-cat]',body).forEach(b=>b.addEventListener('click',()=>editCat(Number(b.dataset.editCat))));$$('[data-del-cat]',body).forEach(b=>b.addEventListener('click',async()=>{const i=Number(b.dataset.delCat);if(!confirm(`Usunąć kategorię ${data.categories[i]?.title}?`))return;data.categories.splice(i,1);await save('Kategoria usunięta.');}));
        $$('[data-add-ch]',body).forEach(b=>b.addEventListener('click',()=>editCh(Number(b.dataset.addCh),-1)));$$('[data-edit-ch]',body).forEach(b=>b.addEventListener('click',()=>{const [ci,hi]=b.dataset.editCh.split(':').map(Number);editCh(ci,hi);}));$$('[data-del-ch]',body).forEach(b=>b.addEventListener('click',async()=>{const [ci,hi]=b.dataset.delCh.split(':').map(Number);data.categories[ci].channels.splice(hi,1);await save('Kanał usunięty.');}));$$('[data-ch-up]',body).forEach(b=>b.addEventListener('click',()=>{const [ci,hi]=b.dataset.chUp.split(':').map(Number);move(data.categories[ci].channels,hi,hi-1);}));$$('[data-ch-down]',body).forEach(b=>b.addEventListener('click',()=>{const [ci,hi]=b.dataset.chDown.split(':').map(Number);move(data.categories[ci].channels,hi,hi+1);}));
        $('[data-add-msg]',body).addEventListener('click',()=>editMsg(-1));$$('[data-msg-up]',body).forEach(b=>b.addEventListener('click',()=>move(data.messages,Number(b.dataset.msgUp),Number(b.dataset.msgUp)-1)));$$('[data-msg-down]',body).forEach(b=>b.addEventListener('click',()=>move(data.messages,Number(b.dataset.msgDown),Number(b.dataset.msgDown)+1)));$$('[data-edit-msg]',body).forEach(b=>b.addEventListener('click',()=>editMsg(Number(b.dataset.editMsg))));$$('[data-del-msg]',body).forEach(b=>b.addEventListener('click',async()=>{data.messages.splice(Number(b.dataset.delMsg),1);await save('Wiadomość usunięta.');}));
        $('[data-add-group]',body).addEventListener('click',()=>editGroup(-1));$$('[data-group-up]',body).forEach(b=>b.addEventListener('click',()=>move(data.memberGroups,Number(b.dataset.groupUp),Number(b.dataset.groupUp)-1)));$$('[data-group-down]',body).forEach(b=>b.addEventListener('click',()=>move(data.memberGroups,Number(b.dataset.groupDown),Number(b.dataset.groupDown)+1)));$$('[data-edit-group]',body).forEach(b=>b.addEventListener('click',()=>editGroup(Number(b.dataset.editGroup))));$$('[data-del-group]',body).forEach(b=>b.addEventListener('click',async()=>{data.memberGroups.splice(Number(b.dataset.delGroup),1);await save('Grupa usunięta.');}));
        $$('[data-add-member]',body).forEach(b=>b.addEventListener('click',()=>editMember(Number(b.dataset.addMember),-1)));$$('[data-edit-member]',body).forEach(b=>b.addEventListener('click',()=>{const [gi,mi]=b.dataset.editMember.split(':').map(Number);editMember(gi,mi);}));$$('[data-del-member]',body).forEach(b=>b.addEventListener('click',async()=>{const [gi,mi]=b.dataset.delMember.split(':').map(Number);data.memberGroups[gi].members.splice(mi,1);await save('Osoba usunięta.');}));$$('[data-member-up]',body).forEach(b=>b.addEventListener('click',()=>{const [gi,mi]=b.dataset.memberUp.split(':').map(Number);move(data.memberGroups[gi].members,mi,mi-1);}));$$('[data-member-down]',body).forEach(b=>b.addEventListener('click',()=>{const [gi,mi]=b.dataset.memberDown.split(':').map(Number);move(data.memberGroups[gi].members,mi,mi+1);}));
      };
      const formEdit=(title,current,fields,onSave)=>{openModal(title,`<form id="cms-preview-form" class="cms-form">${fields.map(f=>fieldHtml(f,current[f.name])).join('')}<div class="cms-form-actions"><button type="button" data-back>← WRÓĆ</button><button class="cms-primary" type="submit">ZAPISZ</button></div></form>`);const form=$('#cms-preview-form',modal);$('[data-back]',form).addEventListener('click',draw);form.addEventListener('submit',async e=>{e.preventDefault();await onSave({...current,...parseFields(form,fields)});});};
      const editGeneral=()=>{const fields=[{name:'kicker',label:'Mały nagłówek sekcji'},{name:'title',label:'Tytuł sekcji'},{name:'description',label:'Opis sekcji',type:'textarea'},{name:'noteBadge',label:'Etykieta nad podglądem'},{name:'noteTitle',label:'Tytuł informacji nad podglądem'},{name:'noteText',label:'Opis informacji nad podglądem',type:'textarea'},{name:'boostLabel',label:'Tekst celu boostów'},{name:'boostValue',label:'Wartość celu boostów'},{name:'activeChannel',label:'Aktywny kanał w czacie'},{name:'composerText',label:'Tekst w polu wpisywania'}];formEdit('PODGLĄD — USTAWIENIA',data,fields,async v=>{Object.assign(data,v);await save('Ustawienia podglądu zapisane.');});};
      const editCat=i=>{const cur=i>=0?data.categories[i]:{title:'NOWA KATEGORIA',channels:[]};const fields=[{name:'title',label:'Nazwa kategorii',required:true}];formEdit(i>=0?'EDYTUJ KATEGORIĘ':'DODAJ KATEGORIĘ',cur,fields,async v=>{v.channels=cur.channels||[];if(i>=0)data.categories[i]=v;else data.categories.push(v);await save('Kategoria zapisana.');});};
      const editCh=(ci,hi)=>{const cur=hi>=0?data.categories[ci].channels[hi]:{icon:'＃',name:'',href:'#/discord/channels',active:false,vip:false};const fields=[{name:'icon',label:'Ikona / emoji'},{name:'name',label:'Nazwa kanału',required:true},{name:'href',label:'Link po kliknięciu'},{name:'active',label:'Oznacz jako aktywny',type:'checkbox'},{name:'vip',label:'Styl VIP',type:'checkbox'}];formEdit(hi>=0?'EDYTUJ KANAŁ PODGLĄDU':'DODAJ KANAŁ PODGLĄDU',cur,fields,async v=>{if(v.active){data.categories.forEach(c=>(c.channels||[]).forEach(ch=>ch.active=false));data.activeChannel=v.name;}if(hi>=0)data.categories[ci].channels[hi]=v;else data.categories[ci].channels.push(v);await save('Kanał zapisany.');});};
      const editMsg=i=>{const cur=i>=0?data.messages[i]:{date:'',avatar:'M',author:'',time:'',text:'',embedTitle:'',embedLinkText:'',embedDescription:'',viewers:'',thumbnail:'pictures/logo/matthevc-monkey.png'};const fields=[{name:'date',label:'Data / separator'},{name:'avatar',label:'Litera / znak avatara'},{name:'author',label:'Autor',required:true},{name:'time',label:'Godzina'},{name:'text',label:'Treść wiadomości',type:'textarea',required:true},{name:'embedTitle',label:'Nazwa w embedzie Twitch'},{name:'embedLinkText',label:'Tytuł transmisji / link'},{name:'embedDescription',label:'Opis embedu',type:'textarea'},{name:'viewers',label:'Tekst widzów, np. Viewers 20'}];formEdit(i>=0?'EDYTUJ WIADOMOŚĆ':'DODAJ WIADOMOŚĆ',cur,fields,async v=>{if(i>=0)data.messages[i]=v;else data.messages.push(v);await save('Wiadomość zapisana.');});};
      const editGroup=i=>{const cur=i>=0?data.memberGroups[i]:{title:'NOWA GRUPA',members:[]};const fields=[{name:'title',label:'Nazwa grupy',required:true}];formEdit(i>=0?'EDYTUJ GRUPĘ':'DODAJ GRUPĘ',cur,fields,async v=>{v.members=cur.members||[];if(i>=0)data.memberGroups[i]=v;else data.memberGroups.push(v);await save('Grupa zapisana.');});};
      const editMember=(gi,mi)=>{const cur=mi>=0?data.memberGroups[gi].members[mi]:{name:'',status:'● online',kind:'viewer',initial:'',image:''};const fields=[{name:'name',label:'Nick / nazwa',required:true},{name:'status',label:'Status / opis'},{name:'kind',label:'Typ użytkownika',type:'select',options:[{value:'viewer',label:'Widz'},{value:'vip',label:'VIP'},{value:'moderator',label:'Moderator'},{value:'streamer',label:'Streamer'}]},{name:'initial',label:'Litera avatara',help:'Używana, gdy dana osoba nie ma obrazu w wersji bazowej.'}];formEdit(mi>=0?'EDYTUJ OSOBĘ':'DODAJ OSOBĘ',cur,fields,async v=>{if(mi>=0)data.memberGroups[gi].members[mi]=v;else data.memberGroups[gi].members.push(v);await save('Osoba zapisana.');});};
      draw();
    };

    drawHub();
  }

  function openDiscordManager() {
    let categories = clone(window.MattCMS?.get('discord_channels', null) || extractDiscordCategories());
    const esc = window.MattCMS.escape;

    const applyBehind = () => window.MattCMS?.renderDiscordChannels?.(categories);

    const saveAndRender = async (message, redraw = false) => {
      try {
        await window.MattCMS.save('discord_channels', categories);
        applyBehind();
        notify(message);
        if (redraw) draw(); else await rerender();
      } catch (e) { notify(`Błąd zapisu: ${e.message}`, 'error'); }
    };

    const move = (arr, from, to) => {
      if (to < 0 || to >= arr.length) return;
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      draw();
    };

    const draw = () => {
      openModal('DISCORD — KANAŁY I KATEGORIE', `<div class="cms-manager-actions"><div class="cms-manager-action-group">
        <button class="cms-primary" data-add-category>+ DODAJ KATEGORIĘ</button>
        <button data-save-discord-order>✓ ZAPISZ KOLEJNOŚĆ</button>
        <button data-reset-discord>↶ PRZYWRÓĆ Z GITHUBA</button>
      </div><p>Możesz zmieniać nazwę, ikonę, opis i wyróżnienie każdego komunikatu kanału, dodawać nowe kanały oraz całe kategorie.</p></div>
        <div class="cms-discord-list">${categories.map((cat,ci)=>`<section class="cms-discord-category"><header><div><small>${esc(cat.icon || '📁')} KATEGORIA ${String(ci+1).padStart(2,'0')}</small><strong>${esc(cat.title)}</strong><p>${esc(cat.description || '')}</p></div><div>
          <button data-cat-up="${ci}" ${ci===0?'disabled':''}>↑</button><button data-cat-down="${ci}" ${ci===categories.length-1?'disabled':''}>↓</button>
          <button data-edit-cat="${ci}">EDYTUJ</button><button class="danger" data-delete-cat="${ci}">USUŃ</button>
        </div></header><div class="cms-channel-admin-list">${(cat.channels||[]).map((ch,hi)=>`<article><div><span>${esc(ch.icon || '#')}</span><strong>${esc(ch.name)}</strong><small>${esc(ch.description || '')}</small></div><div>
          <button data-channel-up="${ci}:${hi}" ${hi===0?'disabled':''}>↑</button><button data-channel-down="${ci}:${hi}" ${hi===(cat.channels||[]).length-1?'disabled':''}>↓</button>
          <button data-edit-channel="${ci}:${hi}">EDYTUJ</button><button class="danger" data-delete-channel="${ci}:${hi}">USUŃ</button>
        </div></article>`).join('')}<button class="cms-add-subitem" data-add-channel="${ci}">+ DODAJ KANAŁ / OPIS</button></div></section>`).join('')}</div>`);
      const body=$('#cms-modal-body',modal);
      $('[data-add-category]',body).addEventListener('click',()=>editCategory(-1));
      $('[data-save-discord-order]',body).addEventListener('click',()=>saveAndRender('Kolejność kategorii i kanałów została zapisana.'));
      $('[data-reset-discord]',body).addEventListener('click',()=>resetCmsKey('discord_channels', 'kanały i kategorie Discorda'));
      $$('[data-cat-up]',body).forEach(b=>b.addEventListener('click',()=>move(categories,Number(b.dataset.catUp),Number(b.dataset.catUp)-1)));
      $$('[data-cat-down]',body).forEach(b=>b.addEventListener('click',()=>move(categories,Number(b.dataset.catDown),Number(b.dataset.catDown)+1)));
      $$('[data-edit-cat]',body).forEach(b=>b.addEventListener('click',()=>editCategory(Number(b.dataset.editCat))));
      $$('[data-delete-cat]',body).forEach(b=>b.addEventListener('click',async()=>{const i=Number(b.dataset.deleteCat);if(!confirm(`Usunąć kategorię ${categories[i].title} razem z kanałami?`))return;categories.splice(i,1);await saveAndRender('Kategoria usunięta.');}));
      $$('[data-add-channel]',body).forEach(b=>b.addEventListener('click',()=>editChannel(Number(b.dataset.addChannel),-1)));
      $$('[data-edit-channel]',body).forEach(b=>b.addEventListener('click',()=>{const [ci,hi]=b.dataset.editChannel.split(':').map(Number);editChannel(ci,hi);}));
      $$('[data-delete-channel]',body).forEach(b=>b.addEventListener('click',async()=>{const [ci,hi]=b.dataset.deleteChannel.split(':').map(Number);if(!confirm(`Usunąć kanał ${categories[ci].channels[hi].name}?`))return;categories[ci].channels.splice(hi,1);await saveAndRender('Kanał usunięty.');}));
      $$('[data-channel-up]',body).forEach(b=>b.addEventListener('click',()=>{const [ci,hi]=b.dataset.channelUp.split(':').map(Number);move(categories[ci].channels,hi,hi-1);}));
      $$('[data-channel-down]',body).forEach(b=>b.addEventListener('click',()=>{const [ci,hi]=b.dataset.channelDown.split(':').map(Number);move(categories[ci].channels,hi,hi+1);}));
    };

    const editCategory = index => {
      const c=index>=0?categories[index]:{icon:'📁',title:'',description:'',channels:[]};
      const fields=[{name:'icon',label:'Ikona / emoji'},{name:'title',label:'Nazwa kategorii',required:true},{name:'description',label:'Opis kategorii',type:'textarea'}];
      openModal(index>=0?'EDYTUJ KATEGORIĘ':'DODAJ KATEGORIĘ',`<form id="cms-cat-form" class="cms-form">${fields.map(f=>fieldHtml(f,c[f.name])).join('')}<div class="cms-form-actions"><button type="button" data-back>← WRÓĆ</button><button class="cms-primary" type="submit">ZAPISZ</button></div></form>`);
      const form=$('#cms-cat-form',modal);$('[data-back]',form).addEventListener('click',draw);form.addEventListener('submit',async e=>{e.preventDefault();const v=parseFields(form,fields);const next={...c,...v,id:c.id||slugify(v.title),channels:c.channels||[]};if(index>=0)categories[index]=next;else categories.push(next);await saveAndRender('Kategoria zapisana.');});
    };

    const editChannel = (ci,hi) => {
      const ch=hi>=0?categories[ci].channels[hi]:{icon:'#',name:'',description:'',featured:false};
      const fields=[
        {name:'icon',label:'Ikona / emoji'},
        {name:'name',label:'Nazwa kanału',required:true},
        {name:'description',label:'Pełny opis kanału / treść komunikatu',type:'textarea',required:true},
        {name:'featured',label:'Wyróżniony kanał',type:'checkbox'}
      ];
      openModal(hi>=0?'EDYTUJ KANAŁ / KOMUNIKAT':'DODAJ KANAŁ / KOMUNIKAT',`<form id="cms-channel-form" class="cms-form"><div class="cms-form-context">Kategoria: <strong>${esc(categories[ci].title)}</strong></div>${fields.map(f=>fieldHtml(f,ch[f.name])).join('')}<div class="cms-form-actions"><button type="button" data-back>← WRÓĆ</button><button class="cms-primary" type="submit">ZAPISZ</button></div></form>`);
      const form=$('#cms-channel-form',modal);$('[data-back]',form).addEventListener('click',draw);form.addEventListener('submit',async e=>{e.preventDefault();const v=parseFields(form,fields);if(hi>=0)categories[ci].channels[hi]={...ch,...v};else categories[ci].channels.push(v);await saveAndRender('Kanał zapisany.');});
    };

    draw();
  }


  async function saveOverrideMap(key, data, message) {
    const clean = data && typeof data === 'object' ? data : {};
    try {
      if (Object.keys(clean).length) await window.MattCMS.save(key, clean);
      else if (window.MattCMS.get(key, null) != null) await window.MattCMS.remove(key);
      notify(message || 'Zmiany zostały zapisane.');
      await rerender();
    } catch (error) { notify(`Nie udało się zapisać: ${error.message}`, 'error'); }
  }

  function openPageCalloutsManager() {
    if (!isAdmin()) return;
    const route = currentRoute();
    const baseKey = `page_callouts:${route}`;
    const customKey = `page_custom_callouts:${route}`;
    let overrides = clone(window.MattCMS?.get(baseKey, {}) || {});
    let customItems = clone(window.MattCMS?.get(customKey, []) || []);
    const esc = window.MattCMS.escape;

    const getBaseItems = () => window.MattCMS?.calloutInfo?.(route) || [];
    const normalizedCustom = () => customItems.map((item,index)=>window.MattCMS?.normalizeCustomPageCallout?.(item,index) || item);

    const saveBase = async (message) => {
      await saveOverrideMap(baseKey, overrides, message);
    };

    const saveCustom = async (message) => {
      try {
        if (customItems.length) await window.MattCMS.save(customKey, customItems);
        else if (window.MattCMS.get(customKey, null) != null) await window.MattCMS.remove(customKey);
        notify(message || 'Komunikaty zostały zapisane.');
        await rerender();
      } catch (error) { notify(`Nie udało się zapisać: ${error.message}`, 'error'); }
    };

    const styleLabel = style => ({red:'CZERWONY',discord:'DISCORD',dark:'CIEMNY',green:'ZIELONY',blue:'NIEBIESKI',orange:'POMARAŃCZOWY',custom:'WŁASNY KOLOR'}[style] || String(style || 'CZERWONY').toUpperCase());

    const draw = () => {
      const baseItems = getBaseItems();
      const custom = normalizedCustom();
      openModal(`KOMUNIKATY — ${route.toUpperCase()}`, `
        <div class="cms-manager-actions cms-bubbles-main-actions">
          <div class="cms-manager-action-group">
            <button type="button" data-content-back>← TREŚĆ</button>
            <button class="cms-primary" type="button" data-add-custom>+ DODAJ NOWY KOMUNIKAT</button>
            <button type="button" data-reset-base>↶ KOMUNIKATY Z GITHUBA</button>
            <button type="button" data-remove-custom ${custom.length?'':'disabled'}>USUŃ WŁASNE KOMUNIKATY</button>
          </div>
          <p>Kreator działa na każdej podstronie. Możesz edytować komunikaty istniejące w plikach GitHuba albo tworzyć własne bez zmiany kodu.</p>
        </div>

        <section class="cms-bubble-manager-section">
          <header><div><small>01 / KOMUNIKATY Z PLIKÓW GITHUB</small><strong>ISTNIEJĄCE ELEMENTY NA TEJ PODSTRONIE</strong></div><span>${baseItems.length}</span></header>
          <div class="cms-manager-list">${baseItems.length ? baseItems.map((item,index)=>{
            const raw = overrides[item.id];
            const state = raw && typeof raw === 'object' && raw.hidden === true ? 'USUNIĘTY ZE STRONY' : (raw != null ? 'ZMODYFIKOWANY' : 'Z GITHUBA');
            return `<article class="cms-manager-item cms-callout-manager-item"><div><small>${String(index+1).padStart(2,'0')} / ${state}</small><strong>${esc((item.text || 'Komunikat').slice(0,100))}${(item.text||'').length>100?'…':''}</strong></div><div><button type="button" data-edit-base="${esc(item.id)}">EDYTUJ</button><button class="danger" type="button" data-hide-base="${esc(item.id)}">${state==='USUNIĘTY ZE STRONY'?'PRZYWRÓĆ':'USUŃ ZE STRONY'}</button><button type="button" data-reset-one="${esc(item.id)}" ${raw!=null?'':'disabled'}>↶ GITHUB</button></div></article>`;
          }).join('') : '<div class="cms-empty">W plikach GitHuba nie ma wykrytego komunikatu na tej podstronie. Nadal możesz utworzyć własny poniżej.</div>'}</div>
        </section>

        <section class="cms-bubble-manager-section">
          <header><div><small>02 / KREATOR</small><strong>WŁASNE KOMUNIKATY NA TEJ PODSTRONIE</strong></div><span>${custom.length}</span></header>
          <div class="cms-manager-list">${custom.length ? custom.map((item,index)=>`<article class="cms-manager-item cms-callout-manager-item"><div><small>${String(index+1).padStart(2,'0')} / ${styleLabel(item.style)}</small><strong>${esc(item.title || 'KOMUNIKAT')}</strong></div><div><button type="button" data-custom-up="${index}" ${index===0?'disabled':''}>↑</button><button type="button" data-custom-down="${index}" ${index===custom.length-1?'disabled':''}>↓</button><button type="button" data-edit-custom="${index}">EDYTUJ</button><button class="danger" type="button" data-delete-custom="${index}">USUŃ</button></div></article>`).join('') : '<div class="cms-empty">Nie utworzono jeszcze własnych komunikatów. Kliknij „+ DODAJ NOWY KOMUNIKAT”.</div>'}</div>
        </section>`);

      const body = $('#cms-modal-body', modal);
      $('[data-content-back]',body)?.addEventListener('click',openContentManager);
      $('[data-add-custom]',body)?.addEventListener('click',()=>editCustom(-1));
      $('[data-reset-base]',body)?.addEventListener('click',()=>resetCmsKey(baseKey,'wszystkie komunikaty pochodzące z GitHuba na tej podstronie'));
      $('[data-remove-custom]',body)?.addEventListener('click',async()=>{
        if(!customItems.length) return;
        if(!confirm('Usunąć wszystkie własne komunikaty z tej podstrony? Przed zmianą zostanie wykonany backup.')) return;
        customItems=[]; await saveCustom('Własne komunikaty zostały usunięte.');
      });
      $$('[data-edit-base]',body).forEach(btn=>btn.addEventListener('click',()=>editBase(btn.dataset.editBase)));
      $$('[data-hide-base]',body).forEach(btn=>btn.addEventListener('click',async()=>{
        const id=btn.dataset.hideBase;
        const item=getBaseItems().find(x=>x.id===id); if(!item) return;
        const current=overrides[id];
        const isHidden=current && typeof current==='object' && current.hidden===true;
        if(isHidden){ delete overrides[id]; await saveBase('Komunikat został przywrócony na stronę.'); return; }
        if(!confirm('Usunąć ten komunikat z widoku strony? Będzie można go później przywrócić z GitHuba.')) return;
        const html=typeof current==='string'?current:(current?.html || item.baseHtml);
        overrides[id]={html,hidden:true}; await saveBase('Komunikat został ukryty na stronie.');
      }));
      $$('[data-reset-one]',body).forEach(btn=>btn.addEventListener('click',async()=>{
        const id=btn.dataset.resetOne; if(overrides[id]==null) return;
        if(!confirm('Przywrócić ten komunikat dokładnie do wersji z GitHuba?')) return;
        delete overrides[id]; await saveBase('Komunikat przywrócony z GitHuba.');
      }));
      $$('[data-custom-up]',body).forEach(btn=>btn.addEventListener('click',()=>moveCustom(Number(btn.dataset.customUp),-1)));
      $$('[data-custom-down]',body).forEach(btn=>btn.addEventListener('click',()=>moveCustom(Number(btn.dataset.customDown),1)));
      $$('[data-edit-custom]',body).forEach(btn=>btn.addEventListener('click',()=>editCustom(Number(btn.dataset.editCustom))));
      $$('[data-delete-custom]',body).forEach(btn=>btn.addEventListener('click',async()=>{
        const index=Number(btn.dataset.deleteCustom); if(!customItems[index]) return;
        if(!confirm(`Usunąć komunikat „${customItems[index].title || 'bez nazwy'}”?`)) return;
        customItems.splice(index,1); await saveCustom('Komunikat został usunięty.');
      }));
    };

    const moveCustom = async (index, direction) => {
      const target=index+direction;
      if(index<0 || target<0 || index>=customItems.length || target>=customItems.length) return;
      [customItems[index],customItems[target]]=[customItems[target],customItems[index]];
      await saveCustom('Kolejność komunikatów została zmieniona.');
    };

    const editBase = id => {
      const item=getBaseItems().find(x=>x.id===id); if(!item) return draw();
      const raw=overrides[id];
      const current=typeof raw==='string'?raw:(raw?.html || item.html);
      openModal('EDYTUJ KOMUNIKAT Z GITHUBA', `<div class="cms-manager-actions"><p>Kliknij w treść poniżej i edytuj ją wizualnie. Ten element nadal zachowa swój obecny wygląd i położenie na podstronie.</p></div>
        <div class="cms-rich-callout-editor" contenteditable="true" spellcheck="true" data-rich-editor>${current}</div>
        <div class="cms-form-actions"><button type="button" data-back>← WRÓĆ</button><button type="button" data-base>↶ TREŚĆ Z GITHUBA</button><button class="cms-primary" type="button" data-save>ZAPISZ</button></div>`);
      const body=$('#cms-modal-body',modal), editor=$('[data-rich-editor]',body);
      $('[data-back]',body)?.addEventListener('click',draw);
      $('[data-base]',body)?.addEventListener('click',()=>{editor.innerHTML=item.baseHtml;});
      $('[data-save]',body)?.addEventListener('click',async()=>{
        const value=window.MattCMS.sanitizeHtml(editor.innerHTML);
        const base=window.MattCMS.sanitizeHtml(item.baseHtml);
        if(value===base) delete overrides[id];
        else overrides[id]={html:value,hidden:false};
        await saveBase('Komunikat został zapisany.');
      });
    };

    const editCustom = index => {
      const isEdit=index>=0;
      const cur=isEdit ? clone(window.MattCMS?.normalizeCustomPageCallout?.(customItems[index],index) || customItems[index]) : {
        style:'red',
        accentColor:'#ef2b2d',
        backgroundColor:'#241315',
        textColor:'#c9cbd1',
        icon:'i',
        kicker:'WAŻNE',
        title:'NOWY KOMUNIKAT',
        text:'Wpisz treść komunikatu.',
        buttonLabel:'',
        buttonUrl:''
      };
      const fields=[
        {name:'style',label:'Kolor / styl komunikatu',type:'select',options:[
          {value:'red',label:'Czerwony — MATT’S WORLD'},
          {value:'discord',label:'Fioletowy — Discord'},
          {value:'dark',label:'Ciemny'},
          {value:'green',label:'Zielony'},
          {value:'blue',label:'Niebieski'},
          {value:'orange',label:'Pomarańczowy'},
          {value:'custom',label:'WŁASNE KOLORY'}
        ]},
        {name:'accentColor',label:'Własny kolor akcentu',type:'color',help:'Używany po wybraniu „WŁASNE KOLORY”.'},
        {name:'backgroundColor',label:'Własny kolor tła',type:'color',help:'Używany po wybraniu „WŁASNE KOLORY”.'},
        {name:'textColor',label:'Własny kolor tekstu',type:'color',help:'Używany po wybraniu „WŁASNE KOLORY”.'},
        {name:'icon',label:'Ikona / emoji',placeholder:'np. !, i, ⚠️, 🎮'},
        {name:'kicker',label:'Mały nagłówek',placeholder:'np. WAŻNE / WSKAZÓWKA'},
        {name:'title',label:'Tytuł komunikatu',required:true},
        {name:'text',label:'Treść komunikatu',type:'textarea',required:true},
        {name:'buttonLabel',label:'Tekst przycisku (opcjonalnie)',placeholder:'np. PRZEJDŹ DALEJ'},
        {name:'buttonUrl',label:'Link przycisku (opcjonalnie)',placeholder:'https://... lub #/discord/join'}
      ];
      openModal(isEdit?'EDYTUJ WŁASNY KOMUNIKAT':'DODAJ NOWY KOMUNIKAT', `<form id="cms-custom-page-callout-form" class="cms-form">${fields.map(f=>fieldHtml(f,cur[f.name])).join('')}<div class="cms-callout-live-preview"><small>PODGLĄD</small><div data-bubble-preview></div></div><div class="cms-form-actions"><button type="button" data-back>← WRÓĆ</button><button class="cms-primary" type="submit">ZAPISZ KOMUNIKAT</button></div></form>`);
      const form=$('#cms-custom-page-callout-form',modal);
      const preview=$('[data-bubble-preview]',form);
      const colorNames=['accentColor','backgroundColor','textColor'];
      const updateColorFields=()=>{
        const custom=form.elements.style?.value==='custom';
        colorNames.forEach(name=>{
          const input=form.elements[name];
          const field=input?.closest('.cms-field');
          if(field) field.classList.toggle('cms-color-disabled',!custom);
          if(input) input.disabled=!custom;
        });
      };
      const valuesForPreview=()=>{
        const values={};
        fields.forEach(field=>{
          if(field.type==='checkbox') values[field.name]=Boolean(form.elements[field.name]?.checked);
          else values[field.name]=String(form.elements[field.name]?.value || '').trim();
        });
        return values;
      };
      const renderPreview=()=>{
        const v=valuesForPreview();
        const style=esc(v.style||'red');
        const customCss=v.style==='custom'
          ? ` style="--bubble-accent:${esc(v.accentColor||'#ef2b2d')};--bubble-bg:${esc(v.backgroundColor||'#241315')};--bubble-text:${esc(v.textColor||'#c9cbd1')}"`
          : '';
        preview.innerHTML=`<article class="cms-page-callout cms-page-callout-${style}"${customCss}><div class="cms-page-callout-icon">${esc(v.icon||'i')}</div><div class="cms-page-callout-copy">${v.kicker?`<small>${esc(v.kicker)}</small>`:''}<h2>${esc(v.title||'NOWY KOMUNIKAT')}</h2>${v.text?`<p>${esc(v.text).replace(/\\n/g,'<br>')}</p>`:''}${v.buttonLabel?`<span class="cms-page-callout-button">${esc(v.buttonLabel)}</span>`:''}</div></article>`;
      };
      form.addEventListener('input',()=>{updateColorFields();renderPreview();});
      form.addEventListener('change',()=>{updateColorFields();renderPreview();});
      updateColorFields(); renderPreview();
      $('[data-back]',form)?.addEventListener('click',draw);
      form.addEventListener('submit',async e=>{
        e.preventDefault();
        colorNames.forEach(name=>{ if(form.elements[name]) form.elements[name].disabled=false; });
        const v=parseFields(form,fields);
        const item={...cur,...v,id:cur.id || `komunikat-${Date.now()}`};
        if(isEdit) customItems[index]=item; else customItems.push(item);
        await saveCustom(isEdit?'Komunikat został zaktualizowany.':'Nowy komunikat został dodany.');
      });
    };
    draw();
  }

  function openPageImagesManager() {
    const route = currentRoute();
    if (!has('page.images.manage') && !(route === 'home' && has('home.hero.manage'))) return;
    const key = `page_images:${route}`;
    const decorKey = `page_decor_graphics:${route}`;
    const bannerKey = `page_banner:${route}`;
    let overrides = clone(window.MattCMS?.get(key, {}) || {});
    let decorOverrides = clone(window.MattCMS?.get(decorKey, {}) || {});
    const esc = window.MattCMS.escape;

    const currentImages = () => window.MattCMS?.pageImageInfo?.(route) || [];
    const currentDecorItems = () => window.MattCMS?.pageDecorGraphicInfo?.(route) || [];

    const draw = () => {
      const images = currentImages();
      const decorItems = currentDecorItems();
      const banner = clone(window.MattCMS?.get(bannerKey, null) || null);
      const heroOverride = clone(window.MattCMS?.get('home_hero_image', null) || {});
      const heroImg = document.querySelector('.hero-main.hero-main-image > img');
      const heroUrl = heroOverride.url || heroImg?.getAttribute('src') || '';
      const heroAlt = heroOverride.alt || heroImg?.getAttribute('alt') || "Witaj w Matt's World";
      const heroBlock = route === 'home' && has('home.hero.manage') ? `<section class="cms-graphics-banner-card"><div><small>GRAFIKA POWITALNA</small><strong>WITAJ W MATT'S WORLD</strong><p>Grafika główna strony została połączona z pozostałymi ustawieniami grafik.</p></div>${heroUrl?`<img src="${esc(heroUrl)}" alt="${esc(heroAlt)}">`:''}<div><button class="cms-primary" data-home-hero-edit>ZMIEŃ GRAFIKĘ POWITALNĄ</button></div></section>` : '';
      const bannerBlock = route === 'home' || !has('page.images.manage') ? '' : `<section class="cms-graphics-banner-card"><div><small>GRAFIKA NAGŁÓWKOWA PODSTRONY</small><strong>${banner?.url ? 'Własna grafika jest aktywna' : 'Brak dodatkowej grafiki nagłówkowej'}</strong><p>Możesz dodać grafikę nawet na podstronie, która w wersji GitHub nie ma żadnego obrazu.</p></div>${banner?.url?`<img src="${esc(banner.url)}" alt="${esc(banner.alt||'Grafika podstrony')}">`:''}<div><button class="cms-primary" data-banner-edit>${banner?.url?'ZMIEŃ':'DODAJ'} GRAFIKĘ</button>${banner?.url?'<button class="danger" data-banner-remove>USUŃ</button>':''}</div></section>`;
      const imageSection = has('page.images.manage') ? `<div class="cms-manager-actions"><div class="cms-manager-action-group"><button type="button" data-reset-images>↶ WSZYSTKIE OBRAZY Z GITHUBA</button></div><p>Poniżej są istniejące grafiki tej podstrony. Każdą możesz podmienić plikiem z dysku. Dynamiczne avatary, eventy i dane streamerów pozostają w swoich konfiguratorach.</p></div>
        <div class="cms-image-manager-grid">${images.length?images.map((item,index)=>`<article class="cms-image-manager-card"><div class="cms-image-manager-thumb"><img src="${esc(item.src)}" alt="${esc(item.alt||'Podgląd')}"></div><div class="cms-image-manager-copy"><small>${String(index+1).padStart(2,'0')} / GRAFIKA</small><strong>${esc(item.label||`Grafika ${index+1}`)}</strong><span>${esc(cmsImageLabel(item.src))}</span></div><div class="cms-image-manager-actions"><button class="cms-primary" data-image-edit="${esc(item.id)}">ZMIEŃ</button><button data-image-reset="${esc(item.id)}" ${Object.prototype.hasOwnProperty.call(overrides,item.id)?'':'disabled'}>↶ Z GITHUBA</button></div></article>`).join(''):'<div class="cms-empty">Ta podstrona nie ma dodatkowych statycznych obrazów.</div>'}</div>` : '';
      const decorSection = has('page.images.manage') ? `<div class="cms-manager-actions"><div class="cms-manager-action-group"><button type="button" data-reset-decor>↶ WSZYSTKIE GRAFIKI KAFELKÓW</button></div><p>Te ustawienia dotyczą grafik dekoracyjnych w kafelkach i dymkach. Możesz wgrać własny obraz, przełączyć tryb „dostosuj kolor do strony”, przesuwać grafikę, obracać ją i powiększać.</p></div>
        <div class="cms-image-manager-grid">${decorItems.length?decorItems.map((item,index)=>{const saved=window.MattCMS?.normalizeDecorGraphicItem?.(decorOverrides[item.id]||{}, item.defaultMode)||decorOverrides[item.id]||{}; return `<article class="cms-image-manager-card"><div class="cms-image-manager-thumb${saved.url?'':' is-empty'}">${saved.url?`<img src="${esc(saved.url)}" alt="${esc(saved.alt||item.label)}">`:'<div class="cms-empty">BRAK</div>'}</div><div class="cms-image-manager-copy"><small>${String(index+1).padStart(2,'0')} / KAFELEK</small><strong>${esc(item.label||`Kafelek ${index+1}`)}</strong><span>${saved.url?`Tryb: ${saved.mode==='normal'?'normalne kolory':'dostosuj kolor do strony'} • obrót ${Number(saved.rotation||0)}° • przesunięcie ${Number(saved.offsetX||0)} / ${Number(saved.offsetY||0)} px`:'Brak własnej grafiki dekoracyjnej'}</span></div><div class="cms-image-manager-actions"><button class="cms-primary" data-decor-edit="${esc(item.id)}">USTAW GRAFIKĘ</button><button data-decor-reset="${esc(item.id)}" ${Object.prototype.hasOwnProperty.call(decorOverrides,item.id)?'':'disabled'}>USUŃ / RESET</button></div></article>`;}).join(''):'<div class="cms-empty">Na tej podstronie nie wykryto kafelków z obsługą dekoracyjnej grafiki.</div>'}</div>` : '';
      openModal(`GRAFIKI — ${route.toUpperCase()}`, `${heroBlock}${bannerBlock}${imageSection}${decorSection}`);
      const body=$('#cms-modal-body',modal);
      $('[data-home-hero-edit]',body)?.addEventListener('click',()=>openHomeHeroManager(draw));
      $('[data-reset-images]',body)?.addEventListener('click',()=>resetCmsKey(key,'wszystkie grafiki tej podstrony'));
      $('[data-reset-decor]',body)?.addEventListener('click',()=>resetCmsKey(decorKey,'wszystkie grafiki dekoracyjne tej podstrony'));
      $$('[data-image-edit]',body).forEach(btn=>btn.addEventListener('click',()=>editImage(btn.dataset.imageEdit)));
      $$('[data-image-reset]',body).forEach(btn=>btn.addEventListener('click',async()=>{
        const id=btn.dataset.imageReset;
        if(!Object.prototype.hasOwnProperty.call(overrides,id)) return;
        if(!confirm('Przywrócić tę grafikę do wersji z GitHuba?')) return;
        delete overrides[id];
        await saveOverrideMap(key,overrides,'Grafika została przywrócona z GitHuba.');
      }));
      $$('[data-decor-edit]',body).forEach(btn=>btn.addEventListener('click',()=>editDecor(btn.dataset.decorEdit)));
      $$('[data-decor-reset]',body).forEach(btn=>btn.addEventListener('click',async()=>{
        const id=btn.dataset.decorReset;
        if(!Object.prototype.hasOwnProperty.call(decorOverrides,id)) return;
        if(!confirm('Usunąć własną grafikę dekoracyjną dla tego kafelka?')) return;
        delete decorOverrides[id];
        await saveOverrideMap(decorKey,decorOverrides,'Grafika dekoracyjna została usunięta.');
      }));
      $('[data-banner-edit]',body)?.addEventListener('click',editBanner);
      $('[data-banner-remove]',body)?.addEventListener('click',async()=>{
        if(!confirm('Usunąć dodatkową grafikę nagłówkową tej podstrony?')) return;
        try { await window.MattCMS.remove(bannerKey); notify('Grafika nagłówkowa została usunięta.'); await rerender(); }
        catch(e){notify(e.message,'error');}
      });
    };

    const editImage = id => {
      const item=currentImages().find(x=>x.id===id);
      if(!item) return draw();
      const current=overrides[id]||{url:item.src,alt:item.alt};
      const fields=[{name:'image',label:'Grafika',type:'image-file'},{name:'alt',label:'Opis grafiki (ALT)',help:'Krótki opis obrazu dla dostępności i wyszukiwarek.'}];
      openModal('ZMIEŃ GRAFIKĘ',`<form id="cms-page-image-form" class="cms-form">${fieldHtml(fields[0],current.url||item.src)}${fieldHtml(fields[1],current.alt??item.alt)}<div class="cms-form-actions"><button type="button" data-back>← WRÓĆ</button><button type="button" data-base>↶ Z GITHUBA</button><button class="cms-primary" type="submit">ZAPISZ</button></div></form>`);
      const form=$('#cms-page-image-form',modal);bindImageFileFields(form,fields);$('[data-back]',form)?.addEventListener('click',draw);$('[data-base]',form)?.addEventListener('click',async()=>{delete overrides[id];await saveOverrideMap(key,overrides,'Grafika została przywrócona z GitHuba.');});
      form.addEventListener('submit',async e=>{e.preventDefault();const submit=$('button[type="submit"]',form);if(submit){submit.disabled=true;submit.textContent='WYSYŁANIE…';}try{let url=String(form.elements.image?.value||current.url||item.src);const file=form.querySelector('[data-cms-image-field="image"] [data-image-file]')?.files?.[0];if(file)url=await uploadCmsImage(file,item.label||id,`pages/${route}`);const alt=String(form.elements.alt?.value||'').trim();const baseUrl=item.baseSrc;const baseAlt=item.baseAlt||'';if(url===baseUrl&&alt===baseAlt)delete overrides[id];else overrides[id]={url,alt};await saveOverrideMap(key,overrides,'Grafika została zapisana.');}catch(error){notify(error.message,'error');if(submit){submit.disabled=false;submit.textContent='ZAPISZ';}}});
    };

    const editDecor = id => {
      const item=currentDecorItems().find(x=>x.id===id);
      if(!item) return draw();
      const current=window.MattCMS?.normalizeDecorGraphicItem?.(decorOverrides[id]||{}, item.defaultMode) || decorOverrides[id] || { url:'', alt:'', mode:item.defaultMode||'theme', offsetX:0, offsetY:0, scale:100, rotation:0, opacity:item.defaultMode==='normal'?32:18 };
      const fields=[
        {name:'image',label:'Grafika dekoracyjna',type:'image-file'},
        {name:'alt',label:'Opis grafiki (ALT)',help:'Opcjonalny opis — jeśli grafika ma być czysto dekoracyjna, możesz zostawić puste.'},
        {name:'mode',label:'Tryb kolorów',type:'select',options:[{value:'theme',label:'DOSTOSUJ KOLOR DO STRONY (czerwony)'},{value:'normal',label:'NORMALNE KOLORY'}],help:'Tryb czerwony automatycznie dopasowuje obraz do stylistyki strony.'},
        {name:'offsetX',label:'Przesunięcie poziome X (px)',type:'number',help:'Możesz wpisać również wartość poza zakresem suwaka.'},
        {name:'offsetY',label:'Przesunięcie pionowe Y (px)',type:'number',help:'Możesz wpisać również wartość poza zakresem suwaka.'},
        {name:'scale',label:'Powiększenie (%)',type:'number',help:'Powiększając i przesuwając obraz możesz pokazać tylko jego wybrany fragment.'},
        {name:'rotation',label:'Obrót (stopnie)',type:'number',help:'Pole liczbowe pozwala wpisać dowolny kąt, np. -725°, 45° albo 1080°.'},
        {name:'opacity',label:'Widoczność (%)',type:'number',help:'Im niższa wartość, tym subtelniej grafika będzie widoczna pod treścią.'}
      ];
      const slider = (name,label,min,max,step,value,suffix='') => `<label class="cms-decor-slider"><span>${label}<b data-live-value="${name}">${esc(value)}${suffix}</b></span><input type="range" data-live-slider="${name}" min="${min}" max="${max}" step="${step}" value="${esc(value)}"></label>`;
      const livePreview = `<section class="cms-decor-live-editor">
        <div class="cms-decor-live-head"><div><small>PODGLĄD NA ŻYWO</small><strong>${esc(item.label||id)}</strong></div><span>Zmiany poniżej nie są zapisywane, dopóki nie klikniesz ZAPISZ.</span></div>
        <div class="cms-decor-live-stage" data-decor-live-stage><div class="cms-decor-live-fake-copy"><strong>${esc(item.label||'KAFELEK')}</strong><span>Podgląd położenia grafiki</span></div><img data-decor-live-img ${current.url?`src="${esc(current.url)}"`:''} alt=""></div>
        <div class="cms-decor-live-sliders">
          ${slider('offsetX','POZYCJA X',-500,500,1,Number(current.offsetX||0),' px')}
          ${slider('offsetY','POZYCJA Y',-500,500,1,Number(current.offsetY||0),' px')}
          ${slider('rotation','OBRÓT',-360,360,1,Number(current.rotation||0),'°')}
          ${slider('scale','POWIĘKSZENIE',20,300,1,Number(current.scale||100),'%')}
          ${slider('opacity','WIDOCZNOŚĆ',1,100,1,Number(current.opacity||18),'%')}
        </div>
      </section>`;
      openModal('GRAFIKA KAFELKA / DYMKA',`<form id="cms-page-decor-form" class="cms-form"><div class="cms-form-context">Edytujesz: <strong>${esc(item.label||id)}</strong></div>${livePreview}${fields.map(f=>fieldHtml(f,f.name==='image'?(current.url||''):current[f.name])).join('')}<div class="cms-form-actions"><button type="button" data-back>← WRÓĆ</button><button type="button" data-remove ${Object.prototype.hasOwnProperty.call(decorOverrides,id)?'':'disabled'}>USUŃ GRAFIKĘ</button><button class="cms-primary" type="submit">ZAPISZ</button></div></form>`);
      const form=$('#cms-page-decor-form',modal);
      bindImageFileFields(form,fields);

      const liveImg=$('[data-decor-live-img]',form);
      const liveStage=$('[data-decor-live-stage]',form);
      const valueFor=name=>Number(form.elements[name]?.value || (name==='scale'?100:name==='opacity'?18:0));
      const updateLive=()=>{
        if(!liveImg||!liveStage) return;
        const mode=String(form.elements.mode?.value||item.defaultMode||'theme');
        const x=valueFor('offsetX'), y=valueFor('offsetY'), rot=valueFor('rotation'), scale=valueFor('scale'), opacity=valueFor('opacity');
        liveImg.classList.toggle('cms-decor-preview-theme',mode!=='normal');
        liveImg.classList.toggle('cms-decor-preview-normal',mode==='normal');
        liveImg.style.transform=`translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${rot}deg) scale(${Math.max(.05,scale/100)})`;
        liveImg.style.opacity=String(Math.max(.01,Math.min(1,opacity/100)));
        ['offsetX','offsetY','rotation','scale','opacity'].forEach(name=>{
          const out=form.querySelector(`[data-live-value="${name}"]`);
          if(out){const suffix=name==='rotation'?'°':(name==='scale'||name==='opacity'?'%':' px');out.textContent=`${valueFor(name)}${suffix}`;}
          const range=form.querySelector(`[data-live-slider="${name}"]`);
          if(range){const n=valueFor(name), min=Number(range.min), max=Number(range.max);range.value=String(Math.max(min,Math.min(max,n)));}
        });
      };
      $$('[data-live-slider]',form).forEach(range=>range.addEventListener('input',()=>{
        const name=range.dataset.liveSlider;
        if(form.elements[name]) form.elements[name].value=range.value;
        updateLive();
      }));
      ['offsetX','offsetY','rotation','scale','opacity'].forEach(name=>form.elements[name]?.addEventListener('input',updateLive));
      form.elements.mode?.addEventListener('change',updateLive);
      const fileInput=form.querySelector('[data-cms-image-field="image"] [data-image-file]');
      fileInput?.addEventListener('change',()=>setTimeout(()=>{
        const previewSrc=form.querySelector('[data-cms-image-field="image"] [data-image-preview] img')?.src || '';
        if(liveImg&&previewSrc) liveImg.src=previewSrc;
        updateLive();
      },0));
      form.querySelector('[data-cms-image-field="image"] [data-image-remove]')?.addEventListener('click',()=>{
        if(liveImg) liveImg.removeAttribute('src');
      });
      updateLive();

      $('[data-back]',form)?.addEventListener('click',draw);
      $('[data-remove]',form)?.addEventListener('click',async()=>{
        if(!Object.prototype.hasOwnProperty.call(decorOverrides,id)) return;
        if(!confirm('Usunąć własną grafikę dekoracyjną dla tego kafelka?')) return;
        delete decorOverrides[id];
        await saveOverrideMap(decorKey,decorOverrides,'Grafika dekoracyjna została usunięta.');
      });
      form.addEventListener('submit',async e=>{
        e.preventDefault();
        const submit=$('button[type="submit"]',form);
        if(submit){submit.disabled=true;submit.textContent='WYSYŁANIE…';}
        try {
          let url=String(form.elements.image?.value||current.url||'').trim();
          const file=form.querySelector('[data-cms-image-field="image"] [data-image-file]')?.files?.[0];
          if(file) url=await uploadCmsImage(file,item.label||id,`decor/${route}`);
          if(!url) throw new Error('Wybierz grafikę z dysku albo pozostaw wcześniej zapisaną.');
          const normalized=window.MattCMS?.normalizeDecorGraphicItem?.({
            url,
            alt:String(form.elements.alt?.value||'').trim(),
            mode:String(form.elements.mode?.value||item.defaultMode||'theme').trim(),
            offsetX:form.elements.offsetX?.value,
            offsetY:form.elements.offsetY?.value,
            scale:form.elements.scale?.value,
            rotation:form.elements.rotation?.value,
            opacity:form.elements.opacity?.value
          }, item.defaultMode) || { url };
          decorOverrides[id]=normalized;
          await saveOverrideMap(decorKey,decorOverrides,'Grafika dekoracyjna została zapisana.');
        } catch(error){
          notify(error.message,'error');
          if(submit){submit.disabled=false;submit.textContent='ZAPISZ';}
        }
      });
    };

    const editBanner = () => {
      const current=clone(window.MattCMS?.get(bannerKey,null)||{url:'',alt:'Grafika podstrony',fit:'cover'});
      const fields=[{name:'image',label:'Grafika nagłówkowa',type:'image-file'},{name:'alt',label:'Opis grafiki (ALT)'},{name:'fit',label:'Dopasowanie',type:'select',options:[{value:'cover',label:'Wypełnij szerokość (cover)'},{value:'contain',label:'Pokaż całą grafikę (contain)'}]}];
      openModal('GRAFIKA NAGŁÓWKOWA PODSTRONY',`<form id="cms-page-banner-form" class="cms-form">${fields.map(f=>fieldHtml(f,f.name==='image'?current.url:current[f.name])).join('')}<div class="cms-form-actions"><button type="button" data-back>← WRÓĆ</button><button class="cms-primary" type="submit">ZAPISZ</button></div></form>`);
      const form=$('#cms-page-banner-form',modal);bindImageFileFields(form,fields);$('[data-back]',form)?.addEventListener('click',draw);form.addEventListener('submit',async e=>{e.preventDefault();const submit=$('button[type="submit"]',form);if(submit){submit.disabled=true;submit.textContent='WYSYŁANIE…';}try{let url=String(form.elements.image?.value||current.url||'');const file=form.querySelector('[data-cms-image-field="image"] [data-image-file]')?.files?.[0];if(file)url=await uploadCmsImage(file,`naglowek-${route}`,`pages/${route}`);if(!url)throw new Error('Wybierz grafikę z dysku.');await window.MattCMS.save(bannerKey,{url,alt:String(form.elements.alt?.value||'Grafika podstrony').trim(),fit:String(form.elements.fit?.value||'cover')});notify('Grafika nagłówkowa została zapisana.');await rerender();}catch(error){notify(error.message,'error');if(submit){submit.disabled=false;submit.textContent='ZAPISZ';}}});
    };

    draw();
  }

  async function openBackupsManager() {
    if (!any('backups.view','github.restore')) return;
    let activeType = has('backups.view') ? 'automatic' : 'github';

    const renderBackupItem = (b) => {
      const esc = window.MattCMS.escape;
      const creator = b.created_by_username || b.created_by || 'administrator';
      const typeLabel = b.backup_type === 'manual' ? 'RĘCZNY' : 'AUTO';
      return `<article class="cms-manager-item cms-backup-item" data-backup-id="${Number(b.id)}">
        <div>
          <small>#${Number(b.id)} · ${typeLabel}</small>
          <div>
            <strong>${esc(b.label || 'Backup')}</strong>
            <span>${esc(formatBackupDate(b.created_at))} · utworzył: ${esc(creator)}</span>
          </div>
        </div>
        <div>
          <button type="button" data-download-backup="${Number(b.id)}">POBIERZ JSON</button>
          ${has('backups.restore') ? `<button type="button" data-restore-backup="${Number(b.id)}">PRZYWRÓĆ</button>` : ''}
          ${(b.backup_type === 'manual' ? has('backups.delete.manual') : has('backups.delete.automatic')) ? `<button class="danger" type="button" data-delete-backup="${Number(b.id)}">USUŃ</button>` : ''}
        </div>
      </article>`;
    };

    const draw = async () => {
      if (activeType === 'github') {
        openModal('BACKUPY I PRZYWRACANIE', `
          <div class="cms-backup-tabs" role="tablist" aria-label="Rodzaj przywracania">
            ${has('backups.view')?'<button type="button" data-backup-tab="automatic">Automatyczne zapisy</button><button type="button" data-backup-tab="manual">Ręczne zapisy</button>':''}
            ${has('github.restore')?'<button type="button" class="active" data-backup-tab="github">Z GitHuba</button>':''}
          </div>
          <div class="cms-backup-note"><strong>WERSJA Z GITHUBA:</strong> przywraca bazową treść bieżącej podstrony z plików znajdujących się w repozytorium. Przed przywróceniem aktualny stan zostanie zabezpieczony przez system backupów.</div>
          <div class="cms-manager-actions cms-backup-actions">
            <div class="cms-manager-action-group">
              <button class="cms-primary" type="button" data-github-restore-page>↶ PRZYWRÓĆ TĘ PODSTRONĘ Z GITHUBA</button>
            </div>
            <p>Podstrona: <strong>${window.MattCMS.escape(currentRoute().toUpperCase())}</strong></p>
          </div>
        `);
        const body = $('#cms-modal-body', modal);
        $$('[data-backup-tab]', body).forEach(btn => btn.addEventListener('click', async () => { activeType = btn.dataset.backupTab; await draw(); }));
        $('[data-github-restore-page]', body)?.addEventListener('click', () => resetCmsKey(`page:${currentRoute()}`, 'teksty na tej podstronie'));
        return;
      }
      openModal('BACKUPY I PRZYWRACANIE', `<div class="cms-backup-loading">Ładowanie kopii bezpieczeństwa…</div>`);
      try {
        const backups = await window.MattCMS.listBackups();
        const automatic = backups.filter(b => b.backup_type !== 'manual');
        const manual = backups.filter(b => b.backup_type === 'manual');
        const current = activeType === 'manual' ? manual : automatic;

        openModal('BACKUPY I PRZYWRACANIE', `
          <div class="cms-backup-tabs" role="tablist" aria-label="Rodzaj zapisów">
            <button type="button" class="${activeType === 'automatic' ? 'active' : ''}" data-backup-tab="automatic">Automatyczne zapisy <span>${automatic.length}</span></button>
            <button type="button" class="${activeType === 'manual' ? 'active' : ''}" data-backup-tab="manual">Ręczne zapisy <span>${manual.length}</span></button>
            ${has('github.restore')?`<button type="button" data-backup-tab="github">Z GitHuba</button>`:''}
          </div>

          ${activeType === 'automatic' ? `
            <div class="cms-backup-note"><strong>AUTOMATYCZNE ZAPISY:</strong> powstają przed zmianami CMS, eventów i przywracaniem danych. Przechowywanych jest maksymalnie <strong>10</strong> najnowszych. Starsze są automatycznie usuwane. Każdy zapis możesz także usunąć ręcznie.</div>
          ` : `
            <div class="cms-manager-actions cms-backup-actions">
              <div class="cms-manager-action-group">
                ${has('backups.manual.create')?'<button class="cms-primary" type="button" data-create-backup>+ UTWÓRZ RĘCZNY ZAPIS</button>':''}
                ${has('backups.import')?'<button type="button" data-import-backup>↑ WCZYTAJ PLIK JSON</button>':''}
                <input type="file" data-backup-file accept="application/json,.json" hidden>
              </div>
              <p>Ręczne zapisy nie są objęte limitem 10 kopii i nie są usuwane automatycznie. Widać przy nich autora oraz datę utworzenia.</p>
            </div>
            <div class="cms-backup-note"><strong>RĘCZNE ZAPISY:</strong> zostają do czasu, aż uprawniony administrator usunie je z listy.</div>
          `}

          <div class="cms-manager-list">${current.length ? current.map(renderBackupItem).join('') : `<div class="cms-empty">${activeType === 'manual' ? 'Brak ręcznych zapisów.' : 'Brak automatycznych zapisów.'}</div>`}</div>
        `);

        const body = $('#cms-modal-body', modal);
        $$('[data-backup-tab]', body).forEach(btn => btn.addEventListener('click', async () => {
          activeType = ['automatic','manual','github'].includes(btn.dataset.backupTab) ? btn.dataset.backupTab : 'automatic';
          await draw();
        }));

        const fileInput = $('[data-backup-file]', body);
        $('[data-create-backup]', body)?.addEventListener('click', async () => {
          const label = prompt('Nazwa ręcznego zapisu:', `Ręczny zapis — ${new Date().toLocaleString('pl-PL')}`);
          if (label === null) return;
          try {
            await window.MattCMS.createManualBackup(label || 'Ręczny zapis');
            notify('Ręczny zapis został utworzony.');
            await draw();
          } catch (e) { notify(e.message, 'error'); }
        });

        $('[data-import-backup]', body)?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', async () => {
          const file = fileInput.files?.[0];
          if (!file) return;
          try {
            const parsed = JSON.parse(await file.text());
            const snapshot = parsed?.snapshot && parsed.snapshot.cms_data ? parsed.snapshot : parsed;
            if (!snapshot || !Array.isArray(snapshot.cms_data) || !Array.isArray(snapshot.events)) throw new Error('Ten plik nie ma prawidłowego formatu backupu Matt\'s World.');
            if (!confirm(`Przywrócić dane z pliku „${file.name}”? Przed przywróceniem powstanie automatyczny zapis bieżącego stanu.`)) return;
            await window.MattCMS.restoreSnapshot(snapshot, `plik ${file.name}`);
            notify('Backup z pliku został przywrócony.');
            setTimeout(() => location.reload(), 500);
          } catch (e) { notify(`Nie udało się wczytać pliku: ${e.message}`, 'error'); }
          finally { fileInput.value = ''; }
        });

        $$('[data-download-backup]', body).forEach(btn => btn.addEventListener('click', async () => {
          try {
            const backup = await window.MattCMS.getBackup(Number(btn.dataset.downloadBackup));
            const payload = { ...backup.snapshot, backup_id: backup.id, label: backup.label, backup_type: backup.backup_type, created_by: backup.created_by, created_by_username: backup.created_by_username, exported_at: new Date().toISOString() };
            const safeLabel = String(backup.label || 'backup').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0,50) || 'backup';
            downloadJson(`matts-world-backup-${backup.id}-${safeLabel}.json`, payload);
          } catch (e) { notify(`Nie udało się pobrać backupu: ${e.message}`, 'error'); }
        }));

        $$('[data-restore-backup]', body).forEach(btn => btn.addEventListener('click', async () => {
          const id = Number(btn.dataset.restoreBackup);
          const selected = backups.find(x => Number(x.id) === id);
          if (!confirm(`Przywrócić zapis #${id} „${selected?.label || ''}”? Bieżący stan zostanie automatycznie zabezpieczony przed przywróceniem.`)) return;
          try { await window.MattCMS.restoreBackup(id); notify('Zapis został przywrócony.'); setTimeout(() => location.reload(), 500); }
          catch (e) { notify(`Nie udało się przywrócić: ${e.message}`, 'error'); }
        }));

        $$('[data-delete-backup]', body).forEach(btn => btn.addEventListener('click', async () => {
          const id = Number(btn.dataset.deleteBackup);
          const selected = backups.find(x => Number(x.id) === id);
          if (!confirm(`Usunąć ${selected?.backup_type === 'manual' ? 'ręczny' : 'automatyczny'} zapis #${id} „${selected?.label || ''}”? Tej operacji nie da się cofnąć.`)) return;
          try { await window.MattCMS.deleteBackup(id); notify('Zapis został usunięty.'); await draw(); }
          catch (e) { notify(`Nie udało się usunąć: ${e.message}`, 'error'); }
        }));
      } catch (error) {
        openModal('BACKUPY I PRZYWRACANIE', `<div class="cms-empty">Nie udało się odczytać nowych backupów.<br><br><strong>${window.MattCMS.escape(error.message)}</strong><br><br>Uruchom plik <code>CMS_UPDATE_AUDIT_BACKUPS.sql</code> w Supabase.</div>`);
      }
    };

    await draw();
  }

  window.addEventListener('matt-auth-change', () => { if (!has('page.text.edit') && inlineEditing) cancelInlineEdit(); refreshToolbar(); });
  window.addEventListener('hashchange', () => { if (inlineEditing) finishInlineEdit(); setTimeout(refreshToolbar, 0); });
  document.addEventListener('DOMContentLoaded', () => setTimeout(refreshToolbar, 0));
  setTimeout(refreshToolbar, 600);
  window.addEventListener('resize', () => { if (toolbar) applyToolbarPosition(); });

})();
