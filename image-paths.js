/* MATT'S WORLD - korekta historycznych adresow obrazow po zmianie repozytorium. */
(function () {
  'use strict';
  const ROOT = '/Website/';
  const SITE = 'matthevc.github.io';
  const LEGACY_SEGMENTS = ['Website-main', 'Website-main-main', 'Website-main (1)', 'Website-main (14)', 'Website-main (15)'];
  const imageExtensions = /\.(?:png|jpe?g|webp|gif|svg|avif)(?:[?#]|$)/i;

  function correct(value) {
    if (typeof value !== 'string' || !value.trim()) return value;
    const original = value.trim();
    if (/^(?:data:|blob:|javascript:|#)/i.test(original)) return value;
    let url;
    try { url = new URL(original, document.baseURI); } catch (_) { return value; }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return value;
    // Nie modyfikujemy linkow do Firebase Storage, Supabase, Twitch itd.
    const githubRaw = url.hostname.toLowerCase() === 'raw.githubusercontent.com';
    if (githubRaw) {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0]?.toLowerCase() !== 'matthevc' || !['website-main','website'].includes((parts[1]||'').toLowerCase())) return value;
      const rest = parts.slice(3).join('/');
      if (!rest.startsWith('assets/')) return value;
      return new URL(ROOT + rest + url.search + url.hash, 'https://' + SITE).href;
    }
    if (url.hostname.toLowerCase() !== SITE) return value;
    let p = url.pathname;
    let newPath = p;
    const segments = p.split('/').filter(Boolean);
    if (segments.length) {
      const first = decodeURIComponent(segments[0]).toLowerCase();
      if (LEGACY_SEGMENTS.some(s => s.toLowerCase() === first)) {
        newPath = ROOT + segments.slice(1).join('/');
      } else if (first === 'assets') {
        newPath = ROOT + segments.join('/');
      } else if (first === 'website' && segments[1] && /^website-main(?:-main)?$/i.test(decodeURIComponent(segments[1]))) {
        newPath = ROOT + segments.slice(2).join('/');
      }
    }
    if (newPath === p) return value;
    url.pathname = newPath;
    return url.href;
  }

  function fixImg(img) {
    if (!img || img.nodeType !== 1 || img.tagName !== 'IMG') return;
    const raw = img.getAttribute('src');
    if (raw) {
      const updated = correct(raw);
      if (updated !== raw) img.setAttribute('src', updated);
    }
    const srcset = img.getAttribute('srcset');
    if (srcset) {
      const updated = srcset.split(',').map(part => {
        const match = part.trim().match(/^(\S+)(\s+.+)?$/);
        return match ? correct(match[1]) + (match[2] || '') : part;
      }).join(', ');
      if (updated !== srcset) img.setAttribute('srcset', updated);
    }
  }
  function fixBackground(el) {
    if (!el || el.nodeType !== 1 || !el.hasAttribute('style')) return;
    const style = el.getAttribute('style');
    if (!/url\(/i.test(style)) return;
    const updated = style.replace(/url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/gi, (full, quote, path) => {
      const replacement = correct(path);
      return replacement === path ? full : 'url("' + replacement + '")';
    });
    if (updated !== style) el.setAttribute('style', updated);
  }
  function fixTree(node) {
    if (!node || node.nodeType !== 1) return;
    fixImg(node);
    fixBackground(node);
    if (node.querySelectorAll) node.querySelectorAll('img, [style*="url("]').forEach(el => { fixImg(el); fixBackground(el); });
  }
  function start() {
    fixTree(document.body);
    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'attributes') {
          if (record.attributeName === 'style') fixBackground(record.target);
          else fixImg(record.target);
        } else {
          record.addedNodes.forEach(fixTree);
        }
      }
    });
    observer.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['src','srcset','style']});
  }
  window.mattCorrectImageUrl = correct;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
