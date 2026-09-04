(() => {
  const cache = new Map();
  let loadError = null;

  const managedSelectors = [
    '.recommended-grid', '.recommended-toc', '.moderator-grid', '.moderator-benefits-grid',
    '#commands-results', '.discord-channel-section', '.discord-channels-tags',
    '#contact-topic', '.event-card', '.event-detail-modern', '#home-events',
    '.collection-toolbar', '.collection-pagination'
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

  function requireAdmin() {
    if (window.currentUserIsAdmin !== true) throw new Error('Brak uprawnień administratora.');
  }

  async function createBackup(label = 'Backup ręczny') {
    requireAdmin();
    const { data, error } = await supabaseClient.rpc('matt_create_backup', { p_label: label });
    if (error) throw new Error(`Nie udało się utworzyć backupu: ${error.message}`);
    return data;
  }

  async function save(key, data, options = {}) {
    requireAdmin();
    if (options.backup !== false) {
      await createBackup(options.backupLabel || `AUTO: przed zmianą CMS — ${key}`);
    }
    const payload = { key, data, updated_at: new Date().toISOString() };
    const { error } = await supabaseClient.from('cms_data').upsert(payload, { onConflict: 'key' });
    if (error) throw error;
    cache.set(key, data);
    return data;
  }

  async function remove(key, options = {}) {
    requireAdmin();
    if (options.backup !== false) {
      await createBackup(options.backupLabel || `AUTO: przed przywróceniem z GitHuba — ${key}`);
    }
    const { error } = await supabaseClient.from('cms_data').delete().eq('key', key);
    if (error) throw error;
    cache.delete(key);
  }

  async function listBackups() {
    requireAdmin();
    const { data, error } = await supabaseClient
      .from('cms_backups')
      .select('id,label,created_at,created_by')
      .order('id', { ascending: false })
      .limit(100);
    if (error) throw error;
    return data || [];
  }

  async function getBackup(id) {
    requireAdmin();
    const { data, error } = await supabaseClient
      .from('cms_backups')
      .select('id,label,created_at,created_by,snapshot')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async function restoreBackup(id) {
    requireAdmin();
    const { data, error } = await supabaseClient.rpc('matt_restore_backup', { p_backup_id: Number(id) });
    if (error) throw error;
    return data;
  }

  async function restoreSnapshot(snapshot, label = 'Przywrócenie z pliku') {
    requireAdmin();
    const { data, error } = await supabaseClient.rpc('matt_restore_snapshot', { p_snapshot: snapshot, p_label: label });
    if (error) throw error;
    return data;
  }

  function routeKey(path) {
    return String(path || 'home').replace(/^#\/?/, '').replace(/^\/+|\/+$/g, '') || 'home';
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
    grid.innerHTML = items.map((s, index) => `
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
    toc.innerHTML = `${title}<div class="recommended-toc-track" aria-hidden="true"><span data-recommended-progress></span></div>${items.map((s,index)=>`<button type="button" class="recommended-toc-link${index===0?' active':''}" data-recommended-target="streamer-${escapeHtml(s.login)}"><span>${String(index+1).padStart(2,'0')}</span><strong>${escapeHtml(s.displayName || s.login)}</strong></button>`).join('')}`;
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

  function applyStructured(path) {
    const p = routeKey(path);
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
    if (p === 'contact') {
      const data = get('contact_topics'); if (data) renderContactTopics(data);
    }
  }

  function applyRoute(path) {
    applyStructured(path);
    applyTextOverrides(path);
  }

  window.MattCMS = {
    ready, get, save, remove, createBackup, listBackups, getBackup, restoreBackup, restoreSnapshot,
    routeKey, escape: escapeHtml, sanitizeHtml, baseHtml,
    applyRoute, applyStructured, applyTextOverrides, decorateEditable, editableElements,
    renderStreamers, renderModerators, renderBenefits, renderDiscordChannels, renderContactTopics,
    get loadError() { return loadError; }
  };
})();
