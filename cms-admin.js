(() => {
  let inlineEditing = false;
  let inlineSnapshot = new Map();
  let toolbar = null;
  let modal = null;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const clone = value => JSON.parse(JSON.stringify(value));

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

  function isAdmin() { return window.currentUserIsAdmin === true; }

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
    if (!isAdmin()) return;
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
    if (route === 'home') return { label: 'GRAFIKA POWITALNA', action: openHomeHeroManager };
    if (route === 'recommended') return { label: 'STREAMERZY', action: openStreamersManager };
    if (['moderator/team','moderator/rules'].includes(route)) return { label: 'OSOBY W MODERACJI', action: openModeratorsManager };
    if (['moderator/benefits','moderator/how-to'].includes(route)) return { label: 'KORZYŚCI', action: openBenefitsManager };
    if (['viewer/commands','vip/commands','moderator/commands'].includes(route)) return { label: 'KOMENDY', action: openCommandsManager };
    if (route === 'contact') return { label: 'TEMATY FORMULARZA', action: openTopicsManager };
    if (route === 'discord/channels') return { label: 'KANAŁY I KATEGORIE', action: openDiscordManager };
    if (route === 'discord/join') return { label: 'PODGLĄD / DYMKI', action: openDiscordJoinManager };
    if (route.startsWith('rules/') && route !== 'rules/game-picks') return { label: 'ZASADY REGULAMINU', action: openRulesManager };
    return null;
  }

  function ensureToolbar() {
    if (toolbar) return toolbar;
    toolbar = document.createElement('div');
    toolbar.id = 'cms-admin-toolbar';
    toolbar.innerHTML = `
      <div class="cms-toolbar-title"><span>ADMIN</span><strong>EDYCJA STRONY</strong></div>
      <button type="button" data-cms-action="inline">✎ EDYTUJ TEKSTY</button>
      <button type="button" data-cms-action="config" hidden>⚙ KONFIGURATOR</button>
      <button type="button" data-cms-action="site">☰ MENU / LINKI</button>
      <button type="button" data-cms-action="reset-page">↶ Z GITHUBA</button>
      <button type="button" data-cms-action="backups">⛁ BACKUPY</button>
      <button type="button" class="cms-save" data-cms-action="save" hidden>✓ ZAPISZ</button>
      <button type="button" class="cms-cancel" data-cms-action="cancel" hidden>× ANULUJ</button>`;
    document.body.appendChild(toolbar);
    toolbar.addEventListener('click', e => {
      const action = e.target.closest('[data-cms-action]')?.dataset.cmsAction;
      if (action === 'inline') startInlineEdit();
      if (action === 'save') saveInlineEdit();
      if (action === 'cancel') cancelInlineEdit();
      if (action === 'config') configForRoute(currentRoute())?.action();
      if (action === 'site') openSiteSettingsManager();
      if (action === 'reset-page') resetCmsKey(`page:${currentRoute()}`, 'teksty na tej podstronie');
      if (action === 'backups') openBackupsManager();
    });
    return toolbar;
  }

  function refreshToolbar() {
    if (!isAdmin()) {
      toolbar?.remove(); toolbar = null;
      return;
    }
    ensureToolbar();
    const config = configForRoute(currentRoute());
    const configBtn = $('[data-cms-action="config"]', toolbar);
    configBtn.hidden = !config || inlineEditing;
    if (config) configBtn.textContent = `⚙ ${config.label}`;
    $('[data-cms-action="inline"]', toolbar).hidden = inlineEditing;
    $('[data-cms-action="site"]', toolbar).hidden = inlineEditing;
    $('[data-cms-action="reset-page"]', toolbar).hidden = inlineEditing;
    $('[data-cms-action="backups"]', toolbar).hidden = inlineEditing;
    $('[data-cms-action="save"]', toolbar).hidden = !inlineEditing;
    $('[data-cms-action="cancel"]', toolbar).hidden = !inlineEditing;
  }

  function startInlineEdit() {
    if (!isAdmin() || inlineEditing) return;
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
    if (!inlineEditing || !isAdmin()) return;
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
        {name:'label',label:'Krótka etykieta dymku',required:true},
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

  function openHomeHeroManager() {
    if (!isAdmin()) return;
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
    $('[data-back]', form)?.addEventListener('click', closeModal);
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
    openModal('MENU I LINKI STRONY', `<div class="cms-site-settings-grid">
      <button class="cms-site-setting-card" type="button" data-open-navigation><strong>☰ KATEGORIE I PODKATEGORIE</strong><span>Dodawanie, edycja, usuwanie i zmiana kolejności pozycji w górnym menu.</span></button>
      <button class="cms-site-setting-card" type="button" data-open-links><strong>↗ LINKI SOCIAL MEDIA</strong><span>Zmień adres Twitch, Discord, Instagram i TikTok używany przez ikony oraz przyciski strony.</span></button>
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
        <button data-site-back>← MENU / LINKI</button>
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
    openModal('LINKI SOCIAL MEDIA', `<div class="cms-manager-actions"><div class="cms-manager-action-group"><button data-reset-links>↶ PRZYWRÓĆ Z CONFIG.JS</button><button data-site-back>← MENU / LINKI</button></div><p>Zmiana jest stosowana we wszystkich oznaczonych ikonach i oficjalnych przyciskach strony korzystających z tych adresów.</p></div>
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
      openModal('DISCORD — PODGLĄD I DYMKI', `<div class="cms-manager-actions"><div class="cms-manager-action-group"><button class="cms-primary" data-open-bubbles>▰ DYMKI / KOMUNIKATY</button><button class="cms-primary" data-open-preview>◫ PODGLĄD DISCORDA</button></div><p>Edytujesz tylko zawartość strony „Jak dostać się na Discord”. Zmiany są dostępne wyłącznie dla administratora i zapisują się w CMS.</p></div>
      <div class="cms-feature-grid"><article class="cms-feature-card"><span>01</span><div><strong>DYMKI NAD PODGLĄDEM</strong><p>Dodawaj komunikaty podobne do czerwonego „ZACZNIJ OD #konfiguracja-tickets”, zmieniaj ich kolejność, kolor, ikonę, treść i przycisk.</p></div><button data-open-bubbles>EDYTUJ →</button></article><article class="cms-feature-card"><span>02</span><div><strong>PODGLĄD SERWERA</strong><p>Zmieniaj kategorie i kanały w makiecie Discorda, wiadomości na czacie, członków, nagłówki i opis podglądu.</p></div><button data-open-preview>EDYTUJ →</button></article></div>`);
      const body=$('#cms-modal-body',modal);
      $$('[data-open-bubbles]',body).forEach(b=>b.addEventListener('click',openBubbles));
      $$('[data-open-preview]',body).forEach(b=>b.addEventListener('click',openPreview));
    };

    const openBubbles = () => {
      let items = clone(window.MattCMS?.get('discord_join_bubbles', null) || extractDiscordJoinBubbles());
      const move=(from,to)=>{if(to<0||to>=items.length)return;const [x]=items.splice(from,1);items.splice(to,0,x);draw();};
      const save=async(message)=>{try{await window.MattCMS.save('discord_join_bubbles',items);window.MattCMS.renderDiscordJoinBubbles(items);notify(message);draw();}catch(e){notify(`Błąd zapisu: ${e.message}`,'error');}};
      const draw=()=>{
        openModal('DISCORD — DYMKI / KOMUNIKATY', `<div class="cms-manager-actions"><div class="cms-manager-action-group"><button data-hub>← PODGLĄD / DYMKI</button><button class="cms-primary" data-add>+ DODAJ DYMEK</button><button data-save-order>✓ ZAPISZ KOLEJNOŚĆ</button><button data-reset>↶ Z GITHUBA</button></div><p>Każdy dymek może mieć własny kolor, ikonę, tekst wyróżniony i przycisk. Pusty link przycisku oznacza główny link Discord z ustawień strony.</p></div><div class="cms-manager-list">${items.length?items.map((x,i)=>`<article class="cms-manager-item"><div><small>${String(i+1).padStart(2,'0')} / ${esc(String(x.style||'red').toUpperCase())}</small><strong>${esc(x.title||'DYMEK')} ${x.highlight?`<em>${esc(x.highlight)}</em>`:''}</strong></div><div><button data-up="${i}" ${i===0?'disabled':''}>↑</button><button data-down="${i}" ${i===items.length-1?'disabled':''}>↓</button><button data-edit="${i}">EDYTUJ</button><button class="danger" data-delete="${i}">USUŃ</button></div></article>`).join(''):'<div class="cms-empty">Brak dymków. Dodaj pierwszy.</div>'}</div>`);
        const body=$('#cms-modal-body',modal);
        $('[data-hub]',body).addEventListener('click',drawHub);$('[data-add]',body).addEventListener('click',()=>edit(-1));$('[data-save-order]',body).addEventListener('click',()=>save('Kolejność dymków zapisana.'));$('[data-reset]',body).addEventListener('click',()=>resetCmsKey('discord_join_bubbles','dymki strony Discord'));
        $$('[data-up]',body).forEach(b=>b.addEventListener('click',()=>move(Number(b.dataset.up),Number(b.dataset.up)-1)));$$('[data-down]',body).forEach(b=>b.addEventListener('click',()=>move(Number(b.dataset.down),Number(b.dataset.down)+1)));$$('[data-edit]',body).forEach(b=>b.addEventListener('click',()=>edit(Number(b.dataset.edit))));$$('[data-delete]',body).forEach(b=>b.addEventListener('click',async()=>{const i=Number(b.dataset.delete);if(!confirm(`Usunąć dymek „${items[i]?.title||''}”?`))return;items.splice(i,1);await save('Dymek usunięty.');}));
      };
      const edit=index=>{
        const cur=index>=0?items[index]:{icon:'⚙',kicker:'',title:'',highlight:'',description:'',emphasis:'',buttonText:'',buttonUrl:'',style:'red'};
        const fields=[{name:'style',label:'Wygląd dymku',type:'select',options:[{value:'red',label:'Czerwony / MATT\'S WORLD'},{value:'discord',label:'Fioletowy / Discord'},{value:'dark',label:'Ciemny / neutralny'},{value:'green',label:'Zielony / pozytywny'}]},{name:'icon',label:'Ikona / emoji'},{name:'kicker',label:'Mały nagłówek'},{name:'title',label:'Tytuł',required:true},{name:'highlight',label:'Wyróżniony fragment tytułu',help:'Np. #konfiguracja-tickets — będzie w kolorze akcentu.'},{name:'description',label:'Główny opis',type:'textarea',required:true},{name:'emphasis',label:'Dodatkowe wyróżnienie na dole',type:'textarea'},{name:'buttonText',label:'Tekst przycisku'},{name:'buttonUrl',label:'Link przycisku',help:'Zostaw puste, aby użyć głównego linku do Discorda.'}];
        openModal(index>=0?'EDYTUJ DYMEK':'DODAJ DYMEK',`<form id="cms-discord-bubble-form" class="cms-form">${fields.map(f=>fieldHtml(f,cur[f.name])).join('')}<div class="cms-form-actions"><button type="button" data-back>← WRÓĆ</button><button class="cms-primary" type="submit">ZAPISZ</button></div></form>`);
        const form=$('#cms-discord-bubble-form',modal);$('[data-back]',form).addEventListener('click',draw);form.addEventListener('submit',async e=>{e.preventDefault();const v={...cur,...parseFields(form,fields),id:cur.id||`dymek-${Date.now()}`};if(index>=0)items[index]=v;else items.push(v);await save('Dymek zapisany.');});
      };
      draw();
    };

    const openPreview = () => {
      let data = clone(window.MattCMS?.get('discord_join_preview', null) || extractDiscordJoinPreview());
      data.categories = Array.isArray(data.categories)?data.categories:[];data.messages=Array.isArray(data.messages)?data.messages:[];data.memberGroups=Array.isArray(data.memberGroups)?data.memberGroups:[];
      const save=async(message,redraw=true)=>{try{await window.MattCMS.save('discord_join_preview',data);window.MattCMS.renderDiscordJoinPreview(data);notify(message);if(redraw)draw();}catch(e){notify(`Błąd zapisu: ${e.message}`,'error');}};
      const move=(arr,from,to)=>{if(to<0||to>=arr.length)return;const [x]=arr.splice(from,1);arr.splice(to,0,x);draw();};
      const draw=()=>{
        openModal('DISCORD — EDYCJA PODGLĄDU', `<div class="cms-manager-actions"><div class="cms-manager-action-group"><button data-hub>← PODGLĄD / DYMKI</button><button data-general>✎ NAGŁÓWEK / USTAWIENIA</button><button data-import>⇄ POBIERZ KANAŁY Z „OPIS KANAŁÓW”</button><button data-reset>↶ Z GITHUBA</button></div><p>Makieta jest poglądowa. Nazwa serwera, ikona i liczniki nadal mogą być automatycznie pobierane z prawdziwego zaproszenia Discord.</p></div>
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
      </div><p>Możesz zmieniać nazwę, ikonę, opis i wyróżnienie każdego dymku kanału, dodawać nowe kanały oraz całe kategorie.</p></div>
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
        {name:'description',label:'Pełny opis kanału / treść dymku',type:'textarea',required:true},
        {name:'featured',label:'Wyróżniony kanał',type:'checkbox'}
      ];
      openModal(hi>=0?'EDYTUJ KANAŁ / DYMEK':'DODAJ KANAŁ / DYMEK',`<form id="cms-channel-form" class="cms-form"><div class="cms-form-context">Kategoria: <strong>${esc(categories[ci].title)}</strong></div>${fields.map(f=>fieldHtml(f,ch[f.name])).join('')}<div class="cms-form-actions"><button type="button" data-back>← WRÓĆ</button><button class="cms-primary" type="submit">ZAPISZ</button></div></form>`);
      const form=$('#cms-channel-form',modal);$('[data-back]',form).addEventListener('click',draw);form.addEventListener('submit',async e=>{e.preventDefault();const v=parseFields(form,fields);if(hi>=0)categories[ci].channels[hi]={...ch,...v};else categories[ci].channels.push(v);await saveAndRender('Kanał zapisany.');});
    };

    draw();
  }

  async function openBackupsManager() {
    if (!isAdmin()) return;

    const draw = async () => {
      openModal('BACKUPY I PRZYWRACANIE', `<div class="cms-backup-loading">Ładowanie kopii bezpieczeństwa…</div>`);
      try {
        const backups = await window.MattCMS.listBackups();
        const esc = window.MattCMS.escape;
        openModal('BACKUPY I PRZYWRACANIE', `
          <div class="cms-manager-actions cms-backup-actions">
            <div class="cms-manager-action-group">
              <button class="cms-primary" type="button" data-create-backup>+ UTWÓRZ BACKUP</button>
              <button type="button" data-import-backup>↑ WCZYTAJ PLIK JSON</button>
              <input type="file" data-backup-file accept="application/json,.json" hidden>
            </div>
            <p>Backup obejmuje wszystkie nadpisania CMS oraz eventy. Pliki HTML/JS/CSS pozostają w GitHubie i przywraca się je przez historię commitów.</p>
          </div>
          <div class="cms-backup-note"><strong>AUTOMATYCZNA OCHRONA:</strong> przed każdym zapisem CMS oraz przed dodaniem, edycją lub usunięciem eventu powstaje snapshot. Kopii zapisanych tutaj nie da się usunąć ani edytować z poziomu strony.</div>
          <div class="cms-manager-list">${backups.length ? backups.map(b => `<article class="cms-manager-item cms-backup-item"><div><small>#${b.id}</small><div><strong>${esc(b.label || 'Backup')}</strong><span>${esc(formatBackupDate(b.created_at))}${b.created_by ? ` · ${esc(b.created_by)}` : ''}</span></div></div><div><button type="button" data-download-backup="${b.id}">POBIERZ JSON</button><button class="danger" type="button" data-restore-backup="${b.id}">PRZYWRÓĆ</button></div></article>`).join('') : '<div class="cms-empty">Brak backupów. Utwórz pierwszy ręczny backup.</div>'}</div>`);

        const body = $('#cms-modal-body', modal);
        const fileInput = $('[data-backup-file]', body);
        $('[data-create-backup]', body)?.addEventListener('click', async () => {
          const label = prompt('Nazwa backupu:', `Ręczny backup — ${new Date().toLocaleString('pl-PL')}`);
          if (label === null) return;
          try { await window.MattCMS.createBackup(label || 'Backup ręczny'); notify('Backup został utworzony.'); await draw(); }
          catch (e) { notify(e.message, 'error'); }
        });
        $('[data-import-backup]', body)?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', async () => {
          const file = fileInput.files?.[0];
          if (!file) return;
          try {
            const parsed = JSON.parse(await file.text());
            const snapshot = parsed?.snapshot && parsed.snapshot.cms_data ? parsed.snapshot : parsed;
            if (!snapshot || !Array.isArray(snapshot.cms_data) || !Array.isArray(snapshot.events)) throw new Error('Ten plik nie ma prawidłowego formatu backupu Matt\'s World.');
            if (!confirm(`Przywrócić dane z pliku „${file.name}”? Przed restore automatycznie zapiszę jeszcze bieżący stan.`)) return;
            await window.MattCMS.restoreSnapshot(snapshot, `plik ${file.name}`);
            notify('Backup z pliku został przywrócony.');
            setTimeout(() => location.reload(), 500);
          } catch (e) { notify(`Nie udało się wczytać pliku: ${e.message}`, 'error'); }
          finally { fileInput.value = ''; }
        });
        $$('[data-download-backup]', body).forEach(btn => btn.addEventListener('click', async () => {
          try {
            const backup = await window.MattCMS.getBackup(Number(btn.dataset.downloadBackup));
            const payload = { ...backup.snapshot, backup_id: backup.id, label: backup.label, exported_at: new Date().toISOString() };
            const safeLabel = String(backup.label || 'backup').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0,50) || 'backup';
            downloadJson(`matts-world-backup-${backup.id}-${safeLabel}.json`, payload);
          } catch (e) { notify(`Nie udało się pobrać backupu: ${e.message}`, 'error'); }
        }));
        $$('[data-restore-backup]', body).forEach(btn => btn.addEventListener('click', async () => {
          const id = Number(btn.dataset.restoreBackup);
          const selected = backups.find(x => Number(x.id) === id);
          if (!confirm(`Przywrócić backup #${id} „${selected?.label || ''}”? Bieżący stan zostanie automatycznie zabezpieczony przed przywróceniem.`)) return;
          try { await window.MattCMS.restoreBackup(id); notify('Backup został przywrócony.'); setTimeout(() => location.reload(), 500); }
          catch (e) { notify(`Nie udało się przywrócić: ${e.message}`, 'error'); }
        }));
      } catch (error) {
        openModal('BACKUPY I PRZYWRACANIE', `<div class="cms-empty">Nie udało się odczytać backupów.<br><br><strong>${window.MattCMS.escape(error.message)}</strong><br><br>Jeżeli to pierwsze uruchomienie tej wersji, wykonaj plik <code>CMS_UPDATE_BACKUP.sql</code> w Supabase.</div>`);
      }
    };

    await draw();
  }

  window.addEventListener('matt-auth-change', () => { if (!isAdmin() && inlineEditing) cancelInlineEdit(); refreshToolbar(); });
  window.addEventListener('hashchange', () => { if (inlineEditing) finishInlineEdit(); setTimeout(refreshToolbar, 0); });
  document.addEventListener('DOMContentLoaded', () => setTimeout(refreshToolbar, 0));
  setTimeout(refreshToolbar, 600);
})();
