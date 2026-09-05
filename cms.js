(() => {
  const cache = new Map();
  let loadError = null;

  const managedSelectors = [
    '.recommended-grid', '.recommended-toc', '.moderator-grid', '.moderator-benefits-grid',
    '#commands-results', '.discord-channel-section', '.discord-channels-tags', '#discord-custom-bubbles', '#discord-preview',
    '#contact-topic', '.event-card', '.event-detail-modern', '#home-events',
    '.collection-toolbar', '.collection-pagination', '.rules-card-grid', '.rules-memory-tags'
  ];

  const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  function sanitizeHtml(html = '') {
    const tpl = document.createElement('template');
    tpl.innerHTML = String(html);
    tpl.content.querySelectorAll('script,style,iframe,object,embed,form,input,button,textarea,select').forEach(el => el.remove());
    tpl.content.querySelectorAll('*').forEach(el => {
      [...el.attributes].forEach(attr => {
        const name = attr.name.toLowerCase();
        const value = String(attr.value || '').trim().toLowerCase();
        if (name.startsWith('on') || name === 'style' || name === 'srcdoc' || (['href','src'].includes(name) && value.startsWith('javascript:'))) {
          el.removeAttribute(attr.name);
        }
      });
    });
    return tpl.innerHTML;
  }

  async function loadAll() {
    try {
      const { data, error } = await supabaseClient.from('cms_data').select('key,data');
      if (error) throw error;
      (data || []).forEach(row => cache.set(row.key, row.data));
    } catch (error) {
      loadError = error;
      console.info('[MATT CMS] Tabela cms_data nie jest jeszcze dostępna. Strona używa treści domyślnych.', error?.message || error);
    }
  }

  const ready = loadAll();

  function get(key, fallback = null) {
    return cache.has(key) ? cache.get(key) : fallback;
  }

  function requireLoggedIn() {
    if (!window.currentUserRole || window.currentUserRole === 'guest') throw new Error('Musisz być zalogowany.');
  }

  function requirePermission(permission) {
    requireLoggedIn();
    if (permission && !window.mattHasPermission?.(permission)) throw new Error('Brak wymaganego uprawnienia.');
  }

  async function createBackup(label = 'Backup automatyczny', options = {}) {
    requireLoggedIn();
    const type = options?.type === 'manual' ? 'manual' : 'automatic';
    const { data, error } = await supabaseClient.rpc('matt_create_backup_v2', { p_label: label, p_type: type });
    if (error) {
      const raw = String(error.message || 'Nieznany błąd');
      if (raw.includes('matt_create_backup_v2') || raw.includes('schema cache') || error.code === 'PGRST202') {
        throw new Error('Brakuje aktualizacji backupów i logów w Supabase. Uruchom plik CMS_UPDATE_AUDIT_BACKUPS.sql w SQL Editorze, a potem odśwież stronę.');
      }
      throw new Error(`Nie udało się utworzyć backupu: ${raw}`);
    }
    return data;
  }

  async function createManualBackup(label = 'Backup ręczny') {
    return createBackup(label, { type: 'manual' });
  }

  async function save(key, data, options = {}) {
    requireLoggedIn();
    if (options.backup !== false) {
      await createBackup(options.backupLabel || `AUTO: przed zmianą CMS — ${key}`);
    }
    const { error } = await supabaseClient.rpc('matt_cms_save', { p_key: key, p_data: data });
    if (error) throw error;
    cache.set(key, data);
    return data;
  }

  async function remove(key, options = {}) {
    requireLoggedIn();
    if (options.backup !== false) {
      await createBackup(options.backupLabel || `AUTO: przed przywróceniem z GitHuba — ${key}`);
    }
    const { error } = await supabaseClient.rpc('matt_cms_remove', { p_key: key });
    if (error) throw error;
    cache.delete(key);
  }

  async function listBackups(type = null) {
    requirePermission('backups.view');
    let query = supabaseClient
      .from('cms_backups')
      .select('id,label,created_at,created_by,created_by_username,created_by_user_id,backup_type')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(200);
    if (type === 'automatic' || type === 'manual') query = query.eq('backup_type', type);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async function getBackup(id) {
    requirePermission('backups.view');
    const { data, error } = await supabaseClient
      .from('cms_backups')
      .select('id,label,created_at,created_by,created_by_username,created_by_user_id,backup_type,snapshot')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async function deleteBackup(id) {
    requireLoggedIn();
    const { data, error } = await supabaseClient.rpc('matt_delete_backup', { p_backup_id: Number(id) });
    if (error) throw error;
    return data;
  }

  async function restoreBackup(id) {
    requirePermission('backups.restore');
    const { data, error } = await supabaseClient.rpc('matt_restore_backup', { p_backup_id: Number(id) });
    if (error) throw error;
    return data;
  }

  async function restoreSnapshot(snapshot, label = 'Przywrócenie z pliku') {
    requirePermission('backups.import');
    const { data, error } = await supabaseClient.rpc('matt_restore_snapshot', { p_snapshot: snapshot, p_label: label });
    if (error) throw error;
    return data;
  }

  function routeKey(path) {
    return String(path || 'home').replace(/^#\/?/, '').replace(/^\/+|\/+$/g, '') || 'home';
  }

  function safeHref(value = '#') {
    const href = String(value || '#').trim();
    if (!href) return '#';
    if (/^(https?:\/\/|mailto:|#|\/(?!\/))/i.test(href)) return href;
    return '#';
  }

  function ruleIdPart(value = '') {
    return String(value || 'zasada').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'zasada';
  }

  function extractNavigationFromDom() {
    const nav = document.getElementById('main-nav');
    if (!nav) return [];
    return [...nav.children].map(node => {
      if (node.matches('a')) {
        return { label: node.textContent.trim(), href: node.getAttribute('href') || '#', children: [] };
      }
      if (node.classList?.contains('nav-dropdown')) {
        const button = node.querySelector(':scope > button');
        const children = [...node.querySelectorAll(':scope > .dropdown-menu > a')].map(a => ({
          label: a.textContent.trim(),
          href: a.getAttribute('href') || '#'
        }));
        return { label: button?.childNodes?.[0]?.textContent?.trim() || button?.textContent?.replace('⌄','').trim() || 'KATEGORIA', href: '', children };
      }
      return null;
    }).filter(Boolean);
  }

  function renderNavigation(items) {
    const nav = document.getElementById('main-nav');
    if (!nav || !Array.isArray(items)) return;
    nav.innerHTML = items.map(item => {
      const label = escapeHtml(item?.label || 'KATEGORIA');
      const children = Array.isArray(item?.children) ? item.children : [];
      if (children.length) {
        return `<div class="nav-dropdown">
          <button type="button">${label} <span>⌄</span></button>
          <div class="dropdown-menu">${children.map(child => `<a href="${escapeHtml(safeHref(child?.href || '#'))}">${escapeHtml(child?.label || 'PODKATEGORIA')}</a>`).join('')}</div>
        </div>`;
      }
      return `<a href="${escapeHtml(safeHref(item?.href || '#'))}">${label}</a>`;
    }).join('');
  }

  function renderHeroImage(data) {
    const img = document.querySelector('.hero-main.hero-main-image > img');
    if (!img || !data || typeof data !== 'object') return;
    if (data.url) img.src = String(data.url);
    if (typeof data.alt === 'string' && data.alt.trim()) img.alt = data.alt.trim();
  }


  const pageImageExclusions = [
    '.event-card', '.event-detail-modern', '#home-events', '.recommended-grid', '.moderator-grid',
    '#discord-preview', '.discord-channel-section', '.user-area', '.site-footer', '.cms-page-banner'
  ];

  function pageImageExcluded(img) {
    return pageImageExclusions.some(selector => img.closest(selector));
  }

  function pageImageElements(root = document.getElementById('app')) {
    if (!root) return [];
    const seen = new Map();
    return [...root.querySelectorAll('img')].filter(img => {
      if (pageImageExcluded(img)) return false;
      const src = String(img.getAttribute('src') || '').trim();
      if (!src || src.startsWith('data:')) return false;
      return true;
    }).map((img, index) => {
      if (!img.dataset.cmsImageId) {
        const raw = String(img.getAttribute('src') || `grafika-${index+1}`).split('?')[0].split('/').pop() || `grafika-${index+1}`;
        const base = ruleIdPart(raw.replace(/\.[^.]+$/, '')) || `grafika-${index+1}`;
        const count = (seen.get(base) || 0) + 1;
        seen.set(base, count);
        img.dataset.cmsImageId = count > 1 ? `${base}-${count}` : base;
      }
      if (typeof img.__mattCmsBaseSrc !== 'string') img.__mattCmsBaseSrc = img.getAttribute('src') || '';
      if (typeof img.__mattCmsBaseAlt !== 'string') img.__mattCmsBaseAlt = img.getAttribute('alt') || '';
      return img;
    });
  }

  function pageImageInfo(path) {
    return pageImageElements().map((img, index) => ({
      id: img.dataset.cmsImageId || `grafika-${index+1}`,
      src: img.getAttribute('src') || '',
      alt: img.getAttribute('alt') || '',
      baseSrc: img.__mattCmsBaseSrc || img.getAttribute('src') || '',
      baseAlt: img.__mattCmsBaseAlt || img.getAttribute('alt') || '',
      label: img.getAttribute('alt') || (img.__mattCmsBaseSrc || img.getAttribute('src') || '').split('/').pop() || `Grafika ${index+1}`,
      route: routeKey(path)
    }));
  }

  function applyPageImages(path) {
    const data = get(`page_images:${routeKey(path)}`, {}) || {};
    pageImageElements().forEach(img => {
      const item = data[img.dataset.cmsImageId];
      if (!item || typeof item !== 'object') return;
      if (item.url) img.src = String(item.url);
      if (typeof item.alt === 'string') img.alt = item.alt;
      const preview = img.closest('[data-image-preview]');
      if (preview && item.url) {
        preview.dataset.imagePreview = String(item.url);
        if (typeof item.alt === 'string') preview.dataset.imageAlt = item.alt;
      }
    });
  }

  // Elementy, które w panelu administratora traktujemy jako KOMUNIKATY.
  // Oprócz małych notice/callout obejmujemy również większe bloki typu hero,
  // jeżeli pełnią rolę komunikatu / wprowadzenia do konkretnej podstrony.
  const redCalloutSelector = [
    '.notice',
    '.emotes7tv-intro-copy',
    '.emotes7tv-final-note',
    '.dixper-clean-callout',
    '.dixper-intro:not(.emotes7tv-intro)',
    '.bingo-intro',
    '.vip-card-warning',
    '.vip-note',
    '.bingo-demo-note',
    '.bingo-image-note',
    '.contact-note',
    '.pick-order-intro',
    '.recommended-note-box',
    '.reward-note',
    '.rewards-side-note',
    '.discord-showcase-note',
    '.discord-configure-section',
    '.discord-join-hero',
    '.discord-channels-hero',
    '.rules-hero',
    '.vip-hero',
    '.moderator-team-hero',
    '.moderator-benefits-hero',
    '.recommended-hero',
    '.downloads-hero',
    '.rewards-hero',
    '.rules-summary-box',
    '.event-rules-summary',
    '.downloads-summary',
    '.bingo-prize-summary',
    '.collection-summary'
  ].join(',');

  function redCalloutElements(root = document.getElementById('app')) {
    if (!root) return [];
    const counts = new Map();
    return [...root.querySelectorAll(redCalloutSelector)].map((el, index) => {
      if (!el.dataset.cmsCalloutId) {
        const preferred = String(el.id || '').trim();
        const classBase = [...el.classList].find(c => /notice|warning|intro|note|callout|hero|summary/i.test(c)) || `komunikat-${index+1}`;
        const base = ruleIdPart(preferred || classBase) || `komunikat-${index+1}`;
        const count = (counts.get(base) || 0) + 1;
        counts.set(base, count);
        el.dataset.cmsCalloutId = count > 1 ? `${base}-${count}` : base;
      }
      if (typeof el.__mattCmsBaseCalloutHtml !== 'string') el.__mattCmsBaseCalloutHtml = el.innerHTML;
      return el;
    });
  }

  function calloutInfo(path) {
    return redCalloutElements().map((el, index) => ({
      id: el.dataset.cmsCalloutId || `komunikat-${index+1}`,
      html: el.innerHTML,
      baseHtml: el.__mattCmsBaseCalloutHtml || el.innerHTML,
      text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      route: routeKey(path)
    }));
  }

  function applyPageCallouts(path) {
    const data = get(`page_callouts:${routeKey(path)}`, {}) || {};
    redCalloutElements().forEach(el => {
      const value = data[el.dataset.cmsCalloutId];
      // Starsze wersje CMS zapisywały sam string HTML. Zachowujemy pełną zgodność.
      if (typeof value === 'string') {
        el.hidden = false;
        el.innerHTML = sanitizeHtml(value);
        return;
      }
      if (value && typeof value === 'object') {
        el.hidden = value.hidden === true;
        if (typeof value.html === 'string') el.innerHTML = sanitizeHtml(value.html);
        return;
      }
      el.hidden = false;
    });
  }

  function normalizeHexColor(value, fallback) {
    const raw = String(value || '').trim();
    return /^#[0-9a-f]{6}$/i.test(raw) ? raw : fallback;
  }

  function normalizeCustomPageCallout(item = {}, index = 0) {
    const styles = new Set(['red','discord','dark','green','blue','orange','custom']);
    const style = styles.has(String(item.style || '').toLowerCase()) ? String(item.style).toLowerCase() : 'red';
    return {
      id: String(item.id || `komunikat-${Date.now()}-${index}`).replace(/[^a-zA-Z0-9_-]/g, '-') || `komunikat-${index+1}`,
      style,
      accentColor: normalizeHexColor(item.accentColor, '#ef2b2d'),
      backgroundColor: normalizeHexColor(item.backgroundColor, '#241315'),
      textColor: normalizeHexColor(item.textColor, '#c9cbd1'),
      icon: String(item.icon || 'i').slice(0, 12),
      kicker: String(item.kicker || '').trim(),
      title: String(item.title || 'NOWY KOMUNIKAT').trim(),
      text: String(item.text || '').trim(),
      buttonLabel: String(item.buttonLabel || '').trim(),
      buttonUrl: safeHref(item.buttonUrl || '')
    };
  }

  function customPageCallouts(path) {
    const items = get(`page_custom_callouts:${routeKey(path)}`, []);
    return Array.isArray(items) ? items.map(normalizeCustomPageCallout) : [];
  }

  function renderCustomPageCallouts(path, sourceItems = null) {
    document.querySelectorAll('.cms-page-custom-callouts').forEach(el => el.remove());
    const route = routeKey(path);
    const items = Array.isArray(sourceItems) ? sourceItems.map(normalizeCustomPageCallout) : customPageCallouts(route);
    if (!items.length) return;

    const root = document.getElementById('app');
    if (!root) return;
    const panel = root.querySelector('.page-panel, .error-panel') || root.querySelector('.content-wrap') || root.firstElementChild || root;
    if (!panel) return;

    const wrap = document.createElement('section');
    wrap.className = 'cms-page-custom-callouts';
    wrap.dataset.cmsCustomCallouts = route;
    wrap.innerHTML = items.map((item, index) => {
      const text = escapeHtml(item.text).replace(/\n/g, '<br>');
      const button = item.buttonLabel ? `<a class="cms-page-callout-button" href="${escapeHtml(item.buttonUrl || '#')}">${escapeHtml(item.buttonLabel)}</a>` : '';
      const customStyle = item.style === 'custom'
        ? ` style="--bubble-accent:${escapeHtml(item.accentColor)};--bubble-bg:${escapeHtml(item.backgroundColor)};--bubble-text:${escapeHtml(item.textColor)}"`
        : '';
      return `<article class="cms-page-callout cms-page-callout-${escapeHtml(item.style)}" data-cms-custom-callout-id="${escapeHtml(item.id)}"${customStyle}>
        <div class="cms-page-callout-icon" aria-hidden="true">${escapeHtml(item.icon || 'i')}</div>
        <div class="cms-page-callout-copy">
          ${item.kicker ? `<small>${escapeHtml(item.kicker)}</small>` : ''}
          <h2>${escapeHtml(item.title || 'DYMEK')}</h2>
          ${text ? `<p>${text}</p>` : ''}
          ${button}
        </div>
      </article>`;
    }).join('');

    // Własne dymki trafiają zawsze wysoko na podstronie, ale pod dodatkową grafiką nagłówkową.
    const banner = panel.querySelector(':scope > .cms-page-banner');
    const back = panel.querySelector(':scope > .back-link');
    if (banner) banner.insertAdjacentElement('afterend', wrap);
    else if (back) back.insertAdjacentElement('afterend', wrap);
    else panel.insertBefore(wrap, panel.firstChild);
  }

  function applyCustomPageCallouts(path) {
    renderCustomPageCallouts(path, customPageCallouts(path));
  }

  function renderPageBanner(path, data) {
    document.querySelectorAll('.cms-page-banner').forEach(el => el.remove());
    if (!data || !data.url || routeKey(path) === 'home') return;
    const root = document.getElementById('app');
    if (!root) return;
    const wrap = root.querySelector('.content-wrap') || root.firstElementChild || root;
    const panel = wrap.querySelector('.page-panel') || wrap;
    const anchor = panel.querySelector('.back-link');
    const banner = document.createElement('section');
    banner.className = `cms-page-banner cms-page-banner-${String(data.fit || 'cover').replace(/[^a-z]/gi,'')}`;
    banner.innerHTML = `<img src="${escapeHtml(String(data.url))}" alt="${escapeHtml(String(data.alt || 'Grafika podstrony'))}" loading="lazy">`;
    if (anchor?.nextSibling) anchor.parentNode.insertBefore(banner, anchor.nextSibling);
    else if (anchor) anchor.parentNode.appendChild(banner);
    else panel.insertBefore(banner, panel.firstChild);
  }

  function applyPageBanner(path) {
    const p = routeKey(path);
    if (p === 'home') return;
    renderPageBanner(p, get(`page_banner:${p}`, null));
  }

  function renderRules(items, path) {
    const grid = document.querySelector('.rules-card-grid');
    if (!grid || !Array.isArray(items)) return;
    const route = routeKey(path);
    const usedIds = new Set();

    const normalized = items.map((item, index) => {
      let id = String(item?.id || '').trim();
      if (!id || usedIds.has(id)) id = `${ruleIdPart(route)}-${ruleIdPart(item?.label || item?.title || `zasada-${index+1}`)}`;
      let unique = id, suffix = 2;
      while (usedIds.has(unique)) unique = `${id}-${suffix++}`;
      usedIds.add(unique);
      return { ...item, id: unique };
    });

    grid.innerHTML = normalized.map((item, index) => {
      const number = String(index + 1).padStart(2, '0');
      const description = sanitizeHtml(item?.descriptionHtml ?? escapeHtml(item?.description || ''));
      const extra = sanitizeHtml(item?.extraHtml || '');
      const wide = item?.wide ? ' event-rule-card-wide' : '';
      return `<section class="rule-card${wide}" id="${escapeHtml(item.id)}">
        <div class="rule-card-top"><div class="rule-card-number">${number}</div><div class="rule-card-icon" aria-hidden="true">${escapeHtml(item?.icon || '📌')}</div></div>
        <div class="rule-card-label">${escapeHtml(item?.label || `ZASADA ${number}`)}</div>
        <h2>${escapeHtml(item?.title || 'Nowa zasada')}</h2>
        <p>${description}</p>${extra}
      </section>`;
    }).join('');

    const tags = document.querySelector('.rules-memory-tags');
    if (tags) {
      tags.innerHTML = normalized.map(item => `<span class="rule-scroll-link" data-target="${escapeHtml(item.id)}">${escapeHtml(item?.label || item?.title || 'ZASADA')}</span>`).join('');
    }
  }

  function applyGlobal() {
    const navigation = get('navigation', null);
    if (navigation) renderNavigation(navigation);
  }

  function isManaged(el) {
    return managedSelectors.some(selector => el.closest(selector));
  }

  function editableElements(root = document.getElementById('app')) {
    if (!root) return [];
    const selectors = 'h1,h2,h3,h4,p,li,label > span,.rules-hero-badge,.moderator-kicker,.moderator-section-label,.discord-channels-kicker,.discord-join-kicker,.recommended-hero-badge,.side-card-kicker,.num,.event-date,.contact-note';
    return [...root.querySelectorAll(selectors)].filter(el => {
      if (isManaged(el)) return false;
      if (el.closest('nav,.user-area,.site-footer')) return false;
      if (el.children.length && [...el.children].some(child => ['INPUT','TEXTAREA','SELECT','BUTTON'].includes(child.tagName))) return false;
      return true;
    });
  }

  function decorateEditable(path) {
    const items = editableElements();
    items.forEach((el, index) => {
      el.dataset.cmsTextId = `t${String(index + 1).padStart(4, '0')}`;
      el.dataset.cmsRoute = routeKey(path);
      // Zachowujemy treść pochodzącą z plików GitHuba jako warstwę bazową.
      if (typeof el.__mattCmsBaseHtml !== 'string') el.__mattCmsBaseHtml = el.innerHTML;
    });
    return items;
  }

  function baseHtml(el) {
    return typeof el?.__mattCmsBaseHtml === 'string' ? el.__mattCmsBaseHtml : (el?.innerHTML || '');
  }

  function applyTextOverrides(path) {
    const key = `page:${routeKey(path)}`;
    const overrides = get(key, {}) || {};
    decorateEditable(path).forEach(el => {
      const value = overrides[el.dataset.cmsTextId];
      if (typeof value === 'string') el.innerHTML = sanitizeHtml(value);
    });
  }

  function parseTwitchUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return null;
    try {
      const normalized = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/+/, '')}`;
      return new URL(normalized);
    } catch (_) {
      return null;
    }
  }

  function twitchLoginFromUrl(value) {
    const url = parseTwitchUrl(value);
    if (!url) return '';
    const host = url.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
    if (host !== 'twitch.tv') return '';
    const parts = url.pathname.split('/').filter(Boolean);
    if (!parts.length) return '';
    let login = '';
    try { login = decodeURIComponent(parts[0]).replace(/^@/, '').trim(); } catch (_) { login = parts[0].trim(); }
    const reserved = new Set(['directory','downloads','jobs','p','settings','subscriptions','videos','clip','clips','inventory','wallet','search']);
    if (!login || reserved.has(login.toLowerCase()) || !/^[a-z0-9_]{1,25}$/i.test(login)) return '';
    return login.toLowerCase();
  }

  function twitchClipSlugFromUrl(value) {
    const url = parseTwitchUrl(value);
    if (!url) return '';
    const host = url.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
    const queryClip = String(url.searchParams.get('clip') || '').trim();
    if (queryClip && (host === 'clips.twitch.tv' || host === 'twitch.tv')) return queryClip;

    const parts = url.pathname.split('/').filter(Boolean);
    if (host === 'clips.twitch.tv') {
      if (!parts.length) return '';
      if (parts[0].toLowerCase() === 'embed') return queryClip;
      try { return decodeURIComponent(parts[0]).trim(); } catch (_) { return parts[0].trim(); }
    }
    if (host === 'twitch.tv') {
      const clipIndex = parts.findIndex(part => part.toLowerCase() === 'clip');
      if (clipIndex >= 0 && parts[clipIndex + 1]) {
        try { return decodeURIComponent(parts[clipIndex + 1]).trim(); } catch (_) { return parts[clipIndex + 1].trim(); }
      }
    }
    return '';
  }

  function normalizeStreamer(item = {}) {
    const streamer = { ...item };
    if (!streamer.channelUrl && streamer.login) streamer.channelUrl = `https://www.twitch.tv/${streamer.login}`;
    streamer.login = twitchLoginFromUrl(streamer.channelUrl) || String(streamer.login || '').trim().toLowerCase();
    if (!streamer.clipUrl && streamer.clipSlug) streamer.clipUrl = `https://clips.twitch.tv/${streamer.clipSlug}`;
    streamer.clipSlug = twitchClipSlugFromUrl(streamer.clipUrl) || String(streamer.clipSlug || '').trim();
    return streamer;
  }

  function gameBoxArt(name) {
    const map = {
      'Dead by Daylight': 'https://static-cdn.jtvnw.net/ttv-boxart/Dead%20by%20Daylight-144x192.jpg',
      'Euro Truck Simulator 2': 'https://static-cdn.jtvnw.net/ttv-boxart/Euro%20Truck%20Simulator%202-144x192.jpg',
      'League of Legends': 'https://static-cdn.jtvnw.net/ttv-boxart/League%20of%20Legends-144x192.jpg',
      'Fortnite': 'https://static-cdn.jtvnw.net/ttv-boxart/Fortnite-144x192.jpg',
      'Teamfight Tactics': 'https://static-cdn.jtvnw.net/ttv-boxart/Teamfight%20Tactics-144x192.jpg',
      'VALORANT': 'https://static-cdn.jtvnw.net/ttv-boxart/VALORANT-144x192.jpg',
      'Counter-Strike 2': 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/library_600x900_2x.jpg',
      'R.E.P.O.': 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3241660/library_600x900_2x.jpg',
      'Among Us': 'https://static-cdn.jtvnw.net/ttv-boxart/Among%20Us-144x192.jpg',
      'Mortal Kombat X': 'https://static-cdn.jtvnw.net/ttv-boxart/Mortal%20Kombat%20X-144x192.jpg',
      'Mortal Kombat 11': 'https://static-cdn.jtvnw.net/ttv-boxart/Mortal%20Kombat%2011-144x192.jpg'
    };
    return map[name] || `https://static-cdn.jtvnw.net/ttv-boxart/${encodeURIComponent(name)}-144x192.jpg`;
  }

  function renderStreamers(items) {
    const grid = document.querySelector('.recommended-grid');
    const toc = document.querySelector('.recommended-toc');
    if (!grid || !toc || !Array.isArray(items)) return;
    const clipParent = location.hostname || 'matthevc.github.io';
    const streamers = items.map(normalizeStreamer);
    grid.innerHTML = streamers.map((s, index) => `
      <article class="recommended-card" id="streamer-${escapeHtml(s.login)}" data-recommended-section data-streamer-login="${escapeHtml(s.login)}" data-streamer-name="${escapeHtml(s.displayName || s.login)}">
        <div class="recommended-head">
          <a class="recommended-avatar-link" href="${escapeHtml(s.channelUrl || '#')}" target="_blank" rel="noopener" aria-label="Otwórz kanał Twitch ${escapeHtml(s.displayName || s.login)}">
            <span class="recommended-avatar-wrap"><img class="recommended-avatar" data-streamer-avatar src="https://unavatar.io/twitch/${encodeURIComponent(s.login || '')}" alt="Avatar ${escapeHtml(s.displayName || s.login)}" loading="lazy"></span>
            <span class="recommended-avatar-hover">TWITCH ↗</span>
          </a>
          <div class="recommended-meta"><span class="recommended-index">${String(index + 1).padStart(2,'0')} / POLECANY TWÓRCA</span><h2 data-streamer-name-target>${escapeHtml(s.displayName || s.login)}</h2><p>${escapeHtml(s.tagline || '')}</p></div>
          <div class="recommended-actions"><a class="recommended-action primary" href="${escapeHtml(s.channelUrl || '#')}" target="_blank" rel="noopener">TWITCH ↗</a><a class="recommended-action" href="${escapeHtml(s.clipUrl || '#')}" target="_blank" rel="noopener">OTWÓRZ KLIP ↗</a></div>
        </div>
        <div class="recommended-body">
          <div class="recommended-clip-frame"><iframe src="https://clips.twitch.tv/embed?clip=${encodeURIComponent(s.clipSlug || '')}&parent=${encodeURIComponent(clipParent)}&autoplay=false" title="Polecany klip Twitch — ${escapeHtml(s.displayName || s.login)}" loading="lazy" allowfullscreen></iframe></div>
          <div class="recommended-side"><div class="recommended-note-box"><h3>NAJCZĘŚCIEJ OGRYWANE</h3><div class="recommended-games">${(s.games || []).map(game => `<span class="recommended-game-chip"><img src="${escapeHtml(gameBoxArt(game))}" alt="${escapeHtml(game)}" loading="lazy" referrerpolicy="no-referrer"><strong>${escapeHtml(game)}</strong></span>`).join('')}</div></div></div>
        </div>
      </article>`).join('');
    const title = toc.querySelector('.recommended-toc-title')?.outerHTML || '<div class="recommended-toc-title">TWÓRCY</div>';
    toc.innerHTML = `${title}<div class="recommended-toc-track" aria-hidden="true"><span data-recommended-progress></span></div>${streamers.map((s,index)=>`<button type="button" class="recommended-toc-link${index===0?' active':''}" data-recommended-target="streamer-${escapeHtml(s.login)}"><span>${String(index+1).padStart(2,'0')}</span><strong>${escapeHtml(s.displayName || s.login)}</strong></button>`).join('')}`;
  }

  function renderModerators(items) {
    const grid = document.querySelector('.moderator-grid');
    if (!grid || !Array.isArray(items)) return;
    grid.innerHTML = items.map((m,index)=>`
      <article class="moderator-card" data-cms-moderator="${index}">
        <div class="moderator-photo-wrap"><img class="moderator-photo" src="${escapeHtml(m.image || '')}" alt="Portret moderatora ${escapeHtml(m.name || '')}" loading="lazy"><div class="moderator-photo-index">${String(index+1).padStart(2,'0')}</div></div>
        <div class="moderator-card-body"><div class="moderator-name-row"><h2>${escapeHtml(m.name || '')}</h2><span class="moderator-role">${escapeHtml(m.role || '')}</span></div><p>${escapeHtml(m.description || '')}</p><div class="moderator-links"><a class="moderator-social moderator-twitch" href="${escapeHtml(m.twitch || '#')}" target="_blank" rel="noopener"><span>TWITCH</span><strong>${escapeHtml(m.name || '')}</strong><b>↗</b></a><div class="moderator-social moderator-discord"><span>DISCORD</span><strong>${escapeHtml(m.discord || '')}</strong></div></div></div>
      </article>`).join('');
  }

  function renderBenefits(items) {
    const grid = document.querySelector('.moderator-benefits-grid');
    if (!grid || !Array.isArray(items)) return;
    grid.innerHTML = items.map((b,index)=>`<article class="moderator-benefit-card" data-cms-benefit="${index}"><span class="moderator-benefit-number">${String(index+1).padStart(2,'0')}</span><div><h3>${escapeHtml(b.title || '')}</h3><p>${escapeHtml(b.description || '')}</p></div></article>`).join('');
  }

  function renderDiscordChannels(categories) {
    const page = document.querySelector('.discord-channels-page');
    const panel = document.querySelector('.discord-channels-panel');
    const tags = document.querySelector('.discord-channels-tags');
    if (!page || !panel || !Array.isArray(categories)) return;
    panel.querySelectorAll('.discord-channel-section').forEach(el => el.remove());
    if (tags) tags.innerHTML = categories.map(c => `<span class="rule-scroll-link discord-channel-jump" data-target="discord-cms-${escapeHtml(c.id)}">${escapeHtml(c.icon || '📁')} ${escapeHtml(c.title || '')}</span>`).join('');
    panel.insertAdjacentHTML('beforeend', categories.map((c,index)=>`
      <section class="discord-channel-section" id="discord-cms-${escapeHtml(c.id)}" data-cms-discord-category="${index}">
        <div class="discord-section-heading"><div><span class="discord-section-number">${String(index+1).padStart(2,'0')}</span><h2>${escapeHtml(c.title || '')}</h2></div><p>${escapeHtml(c.description || '')}</p></div>
        <div class="discord-channel-list">${(c.channels || []).map((ch,chIndex)=>`<article class="discord-channel-row${ch.featured?' featured':''}" data-cms-channel="${chIndex}"><div class="discord-channel-name"><span class="discord-channel-symbol">${escapeHtml(ch.icon || '#')}</span><strong>${escapeHtml(ch.name || '')}</strong></div><p>${escapeHtml(ch.description || '')}</p></article>`).join('')}</div>
      </section>`).join(''));
  }

  function renderContactTopics(topics) {
    const select = document.getElementById('contact-topic');
    if (!select || !Array.isArray(topics)) return;
    select.innerHTML = '<option value="" selected disabled>Wybierz temat</option>' + topics.map(topic => `<option>${escapeHtml(topic)}</option>`).join('');
  }


  function discordCalloutStyle(value) {
    const allowed = new Set(['red','discord','dark','green','custom']);
    const style = String(value || 'red').toLowerCase();
    return allowed.has(style) ? style : 'red';
  }

  function renderDiscordJoinBubbles(items) {
    const wrap = document.getElementById('discord-custom-bubbles');
    if (!wrap || !Array.isArray(items)) return;
    wrap.innerHTML = items.map((item,index) => {
      const style = discordCalloutStyle(item.style);
      const rawUrl = String(item.buttonUrl || '').trim();
      const useDiscord = !rawUrl || rawUrl === 'discord' || rawUrl === 'discordUrl';
      const href = useDiscord ? '#' : safeHref(rawUrl);
      const button = String(item.buttonText || '').trim();
      const customStyle = style === 'custom'
        ? ` style="--discord-callout-accent:${escapeHtml(normalizeHexColor(item.accentColor,'#ef2b2d'))};--discord-callout-bg:${escapeHtml(normalizeHexColor(item.backgroundColor,'#241315'))};--discord-callout-text:${escapeHtml(normalizeHexColor(item.textColor,'#c9cbd1'))}"`
        : '';
      return `<section class="discord-configure-section discord-callout-${style}" data-discord-callout data-cms-callout="${index}"${customStyle}>
        <div class="discord-configure-icon" aria-hidden="true">${escapeHtml(item.icon || '⚙')}</div>
        <div class="discord-configure-copy">
          <span>${escapeHtml(item.kicker || '')}</span>
          <h2>${escapeHtml(item.title || '')}${item.highlight ? ` <strong>${escapeHtml(item.highlight)}</strong>` : ''}</h2>
          <p>${escapeHtml(item.description || '')}</p>
          ${item.emphasis ? `<p class="discord-configure-highlight">${escapeHtml(item.emphasis)}</p>` : ''}
        </div>
        ${button ? `<a class="discord-configure-button" href="${escapeHtml(href)}" ${useDiscord?'data-site-link="discordUrl"':''} target="_blank" rel="noopener">${escapeHtml(button)} →</a>` : ''}
      </section>`;
    }).join('');
  }

  function roleClass(kind = '') {
    const v = String(kind || '').toLowerCase();
    if (v === 'streamer') return 'role-streamer';
    if (v === 'moderator' || v === 'mod') return 'role-mod';
    if (v === 'vip') return 'role-vip';
    return '';
  }

  function avatarClass(kind = '') {
    const v = String(kind || '').toLowerCase();
    if (v === 'vip') return 'vip avatar-purple';
    if (v === 'moderator' || v === 'mod') return 'avatar-red';
    if (v === 'streamer') return 'avatar-gold';
    return 'avatar-gray';
  }

  function renderDiscordJoinPreview(data) {
    const section = document.getElementById('discord-preview');
    if (!section || !data || typeof data !== 'object') return;
    const categories = Array.isArray(data.categories) ? data.categories : [];
    const messages = Array.isArray(data.messages) ? data.messages : [];
    const memberGroups = Array.isArray(data.memberGroups) ? data.memberGroups : [];
    const activeChannel = String(data.activeChannel || 'live-alert');
    const composerText = String(data.composerText || `Napisz na # ${activeChannel}`);
    const boostLabel = String(data.boostLabel || 'cel dot. wzmocnienia');
    const boostValue = String(data.boostValue || '2/3');

    section.innerHTML = `
      <div class="discord-section-title">
        <div><span>${escapeHtml(data.kicker || '03 / PODGLĄD SERWERA')}</span><h2>${escapeHtml(data.title || "TAK WYGLĄDA MATT'S WORLD")}</h2></div>
        <p>${escapeHtml(data.description || '')}</p>
      </div>
      <div class="discord-showcase-wrap">
        <div class="discord-showcase-note">
          <span>${escapeHtml(data.noteBadge || "PODGLĄD MATT'S WORLD")}</span>
          <strong>${escapeHtml(data.noteTitle || '')}</strong>
          <p>${escapeHtml(data.noteText || '')}</p>
        </div>
        <div class="discord-app-preview discord-app-preview-expanded" aria-label="Przykładowy podgląd serwera MATT'S WORLD">
          <aside class="discord-app-rail" aria-label="Przykładowe ikony serwerów">
            <div class="discord-app-home discord-rail-icon discord-rail-home" aria-label="Discord"><svg class="discord-rail-discord-logo" viewBox="0 0 24 24" aria-hidden="true"><path d="M19.54 4.44A16.2 16.2 0 0 0 15.6 3.2l-.48.98a14.8 14.8 0 0 0-6.24 0L8.4 3.2a16.2 16.2 0 0 0-3.94 1.24C2.2 7.72 1.5 11.1 1.84 14.42a15.7 15.7 0 0 0 4.8 2.44l1.17-1.6c-.63-.23-1.22-.5-1.77-.82l.43-.34c3.5 1.64 7.48 1.64 10.98 0l.43.34c-.55.32-1.14.59-1.77.82l1.17 1.6a15.7 15.7 0 0 0 4.8-2.44c.4-3.84-.65-7.19-2.54-9.98ZM8.6 13.6c-1.02 0-1.85-.94-1.85-2.1s.82-2.1 1.85-2.1 1.87.94 1.85 2.1c0 1.16-.82 2.1-1.85 2.1Zm6.8 0c-1.02 0-1.85-.94-1.85-2.1s.82-2.1 1.85-2.1 1.87.94 1.85 2.1c0 1.16-.82 2.1-1.85 2.1Z"/></svg></div>
            <div class="discord-app-server discord-rail-icon discord-current-server" data-discord-rail-server-icon><img src="pictures/logo/matthevc-monkey.png" alt="MATT'S WORLD"></div>
            <div class="discord-rail-icon rail-orange">🔥</div><div class="discord-rail-icon rail-red">🎮</div><div class="discord-rail-icon rail-blue">⚡</div><div class="discord-rail-icon rail-purple">💀</div><div class="discord-rail-icon rail-green">🧪</div><div class="discord-rail-icon rail-pink">✨</div><div class="discord-rail-icon rail-gold">🏆</div>
          </aside>
          <aside class="discord-app-channels">
            <div class="discord-app-server-title"><strong data-discord-widget-name>MATT'S WORLD</strong><span>⌄</span></div>
            <div class="discord-app-boost">✦ <span>${escapeHtml(boostLabel)}</span><b>${escapeHtml(boostValue)}</b></div>
            ${categories.map((cat,ci)=>`<div class="discord-app-channel-section" data-cms-preview-category="${ci}">
              <div class="discord-app-category">${escapeHtml(cat.title || 'KATEGORIA')} <b>＋</b></div>
              ${(cat.channels || []).map(ch=>{
                const name=String(ch.name || 'kanał');
                const active=Boolean(ch.active) || name.toLowerCase()===activeChannel.toLowerCase();
                const href=safeHref(ch.href || '#/discord/channels');
                return `<a class="discord-app-channel${active?' active live':''}${ch.vip?' vip':''}" href="${escapeHtml(href)}"><span>${escapeHtml(ch.icon || '＃')}</span> ${escapeHtml(name)}</a>`;
              }).join('')}
            </div>`).join('')}
          </aside>
          <main class="discord-app-chat discord-live-chat">
            <header class="discord-app-chat-head"><div><span class="channel-live-dot">●</span><strong>${escapeHtml(activeChannel)}</strong></div><div class="discord-app-chat-icons" aria-hidden="true">⌕　⚑　♟　☻</div></header>
            <div class="discord-app-messages discord-alert-feed">
              ${messages.map((m,i)=>`${m.date?`<div class="discord-app-date">${escapeHtml(m.date)}</div>`:''}<article class="discord-message discord-alert-message" data-cms-preview-message="${i}">
                <div class="discord-avatar avatar-alert">${escapeHtml(m.avatar || String(m.author || 'M').charAt(0).toUpperCase())}</div>
                <div><div class="discord-message-meta"><strong>${escapeHtml(m.author || 'Użytkownik')}</strong><span>${escapeHtml(m.time || '')}</span></div>
                <p>${escapeHtml(m.text || '')}</p>
                ${m.embedTitle || m.embedLinkText || m.embedDescription ? `<div class="discord-live-embed"><div class="discord-live-embed-accent"></div><div class="discord-live-embed-copy"><strong>${escapeHtml(m.embedTitle || '')}</strong><a href="#" data-site-link="twitchUrl" target="_blank" rel="noopener">${escapeHtml(m.embedLinkText || '')}</a><span>${escapeHtml(m.embedDescription || '')}</span>${m.viewers?`<small>${escapeHtml(m.viewers)}</small>`:''}</div><img src="${escapeHtml(m.thumbnail || 'pictures/logo/matthevc-monkey.png')}" alt="Podgląd"><div class="discord-live-preview-box">▶</div></div>`:''}
                </div></article>`).join('')}
            </div>
            <div class="discord-app-composer">＋ <span>${escapeHtml(composerText)}</span><b>🎁　😊　＋</b></div>
          </main>
          <aside class="discord-app-members discord-members-expanded">
            <div class="discord-members-search">Aktywność — <span data-discord-online-count>—</span> ◉</div>
            ${memberGroups.map((group,gi)=>`<div data-cms-preview-member-group="${gi}"><div class="discord-member-group">${escapeHtml(group.title || 'UŻYTKOWNICY')} — ${(group.members||[]).length}</div>${(group.members||[]).map((m,mi)=>`<div class="discord-member" data-cms-preview-member="${gi}:${mi}">${m.image?`<img class="member-avatar member-photo" src="${escapeHtml(m.image)}" alt="${escapeHtml(m.name||'')}">`:`<span class="member-avatar ${avatarClass(m.kind)}">${escapeHtml(m.initial || String(m.name||'?').charAt(0).toUpperCase())}</span>`}<div><strong class="${roleClass(m.kind)}">${escapeHtml(m.name || '')}</strong><small>${escapeHtml(m.status || '')}</small></div></div>`).join('')}</div>`).join('')}
          </aside>
        </div>
      </div>`;
  }

  function applyStructured(path) {
    const p = routeKey(path);
    if (p === 'home') {
      const data = get('home_hero_image'); if (data) renderHeroImage(data);
    }
    if (p.startsWith('rules/') && p !== 'rules/game-picks') {
      const data = get(`rules:${p}`); if (data) renderRules(data, p);
    }
    if (p === 'recommended') {
      const data = get('streamers'); if (data) renderStreamers(data);
    }
    if (['moderator/team','moderator/rules'].includes(p)) {
      const data = get('moderators'); if (data) renderModerators(data);
    }
    if (['moderator/benefits','moderator/how-to'].includes(p)) {
      const data = get('moderator_benefits'); if (data) renderBenefits(data);
    }
    if (p === 'discord/channels') {
      const data = get('discord_channels'); if (data) renderDiscordChannels(data);
    }
    if (p === 'discord/join') {
      const bubbles = get('discord_join_bubbles'); if (bubbles) renderDiscordJoinBubbles(bubbles);
      const preview = get('discord_join_preview'); if (preview) renderDiscordJoinPreview(preview);
    }
    if (p === 'contact') {
      const data = get('contact_topics'); if (data) renderContactTopics(data);
    }
  }

  function layoutSlug(value) {
    return String(value || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'element';
  }

  function layoutElementLabel(el) {
    if (!el) return 'Element';
    if (el.id === 'header-twitch-link') return 'Przycisk TWITCH.TV';
    const heading = el.matches('h1,h2,h3,h4,strong') ? el : el.querySelector('h1,h2,h3,h4,.reward-card-title,.rule-card-label,strong');
    const aria = el.getAttribute?.('aria-label') || el.getAttribute?.('title') || '';
    const text = String(heading?.textContent || aria || el.textContent || '').replace(/\s+/g, ' ').trim();
    if (text) return text.slice(0, 90);
    const cls = String(el.className || '').split(/\s+/).filter(Boolean)[0] || el.tagName.toLowerCase();
    return cls.replace(/[-_]+/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
  }

  function layoutSemanticClass(el) {
    const tokens = String(el?.className || '').split(/\s+/).filter(Boolean);
    return tokens.find(token => /(?:^|-)(?:card|callout|notice|bubble|tile|hero|hero-copy|side-note|feature|info-box|intro-box|download-box|cta|button|btn)$/.test(token))
      || tokens.find(token => /(?:card|callout|notice|bubble|tile|hero|feature|button|btn)/i.test(token))
      || tokens[0] || el?.tagName?.toLowerCase() || 'element';
  }

  function isLayoutCandidate(el) {
    if (!el || !(el instanceof HTMLElement)) return false;
    if (el.closest('#cms-admin-toolbar,.cms-modal-backdrop,#cms-layout-designer,.user-menu,.profile-modal,.account-management-modal')) return false;
    if (el.id === 'header-twitch-link') return true;
    if (!el.closest('#app')) return false;
    if (el.tagName === 'ARTICLE') return true;
    const tokens = String(el.className || '').split(/\s+/).filter(Boolean);
    const semantic = tokens.some(token => /(?:^|-)(?:card|callout|notice|bubble|tile|hero-copy|side-note|feature-card|info-box|intro-box|download-box|cta)$/.test(token));
    const cta = (el.matches('a,button')) && tokens.some(token => /(?:button|btn|cta)$/i.test(token));
    const special = el.matches('.discord-channel-section,.twitch-download-box,.twitch-official-mini,.rewards-side-note,.rewards-hero-copy,[data-cms-callout-id],[data-custom-callout-id]');
    if (!(semantic || cta || special)) return false;
    const rect = el.getBoundingClientRect();
    return rect.width >= 45 && rect.height >= 22;
  }

  function layoutParentKey(parent, path = 'home') {
    if (!parent) return 'root';
    if (parent.id) return `id:${parent.id}`;
    const route = routeKey(path);
    const section = parent.closest('section[id],section,.page-panel,.content-wrap') || parent;
    const heading = section.querySelector?.(':scope > h1,:scope > h2,:scope > h3,h1,h2,h3')?.textContent || '';
    const cls = String(parent.className || '').split(/\s+/).filter(Boolean).slice(0, 3).join('-') || parent.tagName.toLowerCase();
    return `${route}:${layoutSlug(cls)}:${layoutSlug(heading || parent.getAttribute?.('aria-label') || '')}`;
  }

  function layoutElements(path = 'home') {
    const root = document.getElementById('app');
    const raw = [];
    const twitch = document.getElementById('header-twitch-link');
    if (twitch) raw.push(twitch);
    if (root) raw.push(...root.querySelectorAll('article,[class],[data-cms-callout-id],[data-custom-callout-id]'));
    const candidates = raw.filter(isLayoutCandidate);
    const counts = new Map();
    candidates.forEach((el) => {
      const explicit = el.id ? `id-${layoutSlug(el.id)}` : '';
      const dataKey = el.dataset.streamerLogin || el.dataset.rewardFamily || el.dataset.cmsCalloutId || el.dataset.customCalloutId || '';
      const base = explicit || `${layoutSlug(layoutSemanticClass(el))}-${layoutSlug(dataKey || layoutElementLabel(el))}`;
      const n = (counts.get(base) || 0) + 1;
      counts.set(base, n);
      const key = `${base}${n > 1 ? `-${n}` : ''}`;
      el.dataset.cmsLayoutId = key;
      el.dataset.cmsLayoutLabel = layoutElementLabel(el);
      el.dataset.cmsLayoutParent = layoutParentKey(el.parentElement, path);
    });
    return candidates;
  }

  function applyPageLayout(path = 'home') {
    const p = routeKey(path);
    const data = get(`page_layout:${p}`, {}) || {};
    const elements = layoutElements(p);
    const byId = new Map(elements.map(el => [el.dataset.cmsLayoutId, el]));

    elements.forEach(el => {
      el.style.removeProperty('order');
      el.style.removeProperty('translate');
      el.classList.remove('cms-layout-applied');
    });

    Object.entries(data.offsets || {}).forEach(([id, pos]) => {
      const el = byId.get(id);
      if (!el) return;
      const x = Math.max(-600, Math.min(600, Number(pos?.x || 0)));
      const y = Math.max(-600, Math.min(600, Number(pos?.y || 0)));
      if (x || y) {
        el.style.translate = `${x}px ${y}px`;
        el.classList.add('cms-layout-applied');
      }
    });

    const groups = new Map();
    elements.forEach(el => {
      const key = el.dataset.cmsLayoutParent;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(el);
    });

    Object.entries(data.orders || {}).forEach(([parentKey, ids]) => {
      const group = groups.get(parentKey) || [];
      if (group.length < 2 || !Array.isArray(ids)) return;
      const parent = group[0]?.parentElement;
      const display = parent ? getComputedStyle(parent).display : '';
      if (!/(grid|flex)/.test(display)) return;
      const rank = new Map(ids.map((id, i) => [id, i]));
      group.forEach((el, index) => {
        const order = rank.has(el.dataset.cmsLayoutId) ? rank.get(el.dataset.cmsLayoutId) : ids.length + index;
        el.style.order = String(order);
      });
    });
  }

  function applyRoute(path) {
    applyGlobal();
    applyStructured(path);
    applyTextOverrides(path);
    applyPageCallouts(path);
    applyPageImages(path);
    applyPageBanner(path);
    applyCustomPageCallouts(path);
    applyPageLayout(path);
  }

  window.MattCMS = {
    ready, get, save, remove, createBackup, createManualBackup, listBackups, getBackup, deleteBackup, restoreBackup, restoreSnapshot,
    routeKey, escape: escapeHtml, sanitizeHtml, baseHtml,
    applyRoute, applyGlobal, applyStructured, applyTextOverrides, decorateEditable, editableElements,
    layoutElements, layoutParentKey, layoutElementLabel, applyPageLayout,
    pageImageElements, pageImageInfo, applyPageImages, redCalloutElements, calloutInfo, applyPageCallouts,
    customPageCallouts, renderCustomPageCallouts, applyCustomPageCallouts, normalizeCustomPageCallout, renderPageBanner, applyPageBanner,
    extractNavigationFromDom, renderNavigation, renderHeroImage, renderRules,
    renderStreamers, renderModerators, renderBenefits, renderDiscordChannels, renderContactTopics, renderDiscordJoinBubbles, renderDiscordJoinPreview,
    twitchLoginFromUrl, twitchClipSlugFromUrl, normalizeStreamer,
    get loadError() { return loadError; }
  };
})();
