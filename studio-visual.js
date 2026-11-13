(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plain=s=>{let d=document.createElement('div');d.innerHTML=s;return(d.textContent||'').trim()};
let root=null, activeTab='tiles', route='', groups=[], selected=0, drafts={}, pending=false, viewport='100%', frame=null, filter='', compact=false;
const cms=()=>window.MattCMS;
const has=p=>Boolean(window.mattHasPermission?.(p));
const studioRoutes=[['','START'],['events','EVENTY'],['viewer/downloads','DO POBRANIA']];
const historyKey=()=>`studio45_history:${route}`;
const localDraftKey=()=>`matt_studio5_draft:${location.pathname}:${route}`;
function stashDraft(){try{if(pending&&Object.keys(drafts).length)localStorage.setItem(localDraftKey(),JSON.stringify({at:new Date().toISOString(),drafts}));else localStorage.removeItem(localDraftKey());}catch(e){console.warn('Nie można zapisać lokalnego szkicu',e)}}
function recoverDraft(){try{const raw=localStorage.getItem(localDraftKey());if(!raw)return;const saved=JSON.parse(raw);if(!saved?.drafts||!Object.keys(saved.drafts).length)return;const valid=new Set(groups.flatMap(g=>g.items).map(e=>e.dataset.cmsTextId));const restored=Object.fromEntries(Object.entries(saved.drafts).filter(([id])=>valid.has(id)));if(!Object.keys(restored).length)return;if(confirm('Znaleziono lokalny szkic z '+new Date(saved.at).toLocaleString('pl-PL')+'. Przywrócić niezapisane teksty?')){drafts=restored;pending=true}else localStorage.removeItem(localDraftKey());}catch(e){console.warn('Nie można przywrócić szkicu',e)}}
function openDraftCenter(){if(!has('page.text.edit'))return alert('Brak uprawnień do edycji');const modal=document.createElement('div');modal.className='mv4-overlay';modal.innerHTML=`<section class="mv4-dialog" role="dialog" aria-modal="true"><div class="mv4-dialog-head"><div><small>MATT STUDIO 5.0</small><h2>Szkice i publikowanie</h2><p>Szkic jest przechowywany wyłącznie w tej przeglądarce. Nie jest widoczny publicznie ani zapisywany do Firebase do czasu wybrania „Opublikuj teksty”.</p></div><button data-close>✕</button></div><div class="mv4-metrics"><div><strong>${pending?'TAK':'NIE'}</strong><span>Niezapisane zmiany</span></div><div><strong>${Object.keys(drafts).length}</strong><span>Zmodyfikowane pola</span></div></div><div class="mv4-actions"><button data-draft>💾 Zachowaj szkic</button><button data-publish class="mv-red">✓ Opublikuj teksty</button><button data-clear>🗑 Usuń lokalny szkic</button></div><p class="mv4-note">Uwaga: kreator dodatkowych sekcji, eventy i pliki mają osobne mechanizmy zapisu i publikacji.</p></section>`;root.append(modal);modal.querySelector('[data-close]').onclick=()=>modal.remove();modal.querySelector('[data-draft]').onclick=()=>{stashDraft();modal.remove();notify('✓ Szkic zachowany lokalnie. Nie został opublikowany.')};modal.querySelector('[data-publish]').onclick=async()=>{modal.remove();await save()};modal.querySelector('[data-clear]').onclick=()=>{if(!confirm('Usunąć lokalny szkic i odrzucić niezapisane zmiany?'))return;drafts={};pending=false;stashDraft();modal.remove();render();markPending();notify('Usunięto lokalny szkic')}}

async function recordHistory(kind,key,previous){const old=cms().get(historyKey(),[]);const list=Array.isArray(old)?old:[];await cms().save(historyKey(),[{id:Date.now()+'-'+Math.random().toString(36).slice(2,7),at:new Date().toISOString(),kind,key,previous:JSON.parse(JSON.stringify(previous??null))},...list].slice(0,25));}
function openHistory(){if(!has('page.text.edit'))return alert('Brak uprawnień');const rows=cms().get(historyKey(),[]);const modal=document.createElement('div');modal.className='mv4-overlay';modal.innerHTML=`<section class="mv4-dialog" role="dialog" aria-modal="true"><div class="mv4-dialog-head"><div><small>MATT STUDIO 5.0</small><h2>Historia zmian</h2><p>Ostatnie 25 kopii zapisanych w tej wersji edytora. Przywrócenie publikuje poprzednią treść.</p></div><button data-close>✕</button></div><div class="mv45-history">${(Array.isArray(rows)?rows:[]).map((x,i)=>`<div class="mv45-history-row"><span>${esc(new Date(x.at).toLocaleString('pl-PL'))} · ${esc(x.kind)} · ${esc(x.key)}</span><button data-restore="${i}">Przywróć</button></div>`).join('')||'<p>Brak zapisanych wersji. Historia rozpoczyna się od kolejnego zapisu.</p>'}</div></section>`;root.append(modal);modal.querySelector('[data-close]').onclick=()=>modal.remove();modal.querySelectorAll('[data-restore]').forEach(b=>b.onclick=async()=>{const x=rows[+b.dataset.restore];if(!x||!confirm('Przywrócić tę wersję? Bieżąca treść zostanie zastąpiona.'))return;try{await recordHistory('Przed przywróceniem',x.key,cms().get(x.key,null));if(x.previous===null)await cms().remove(x.key);else await cms().save(x.key,x.previous);modal.remove();notify('✓ Przywrócono wersję. Odśwież stronę, aby zobaczyć zmiany.');}catch(e){alert('Błąd przywracania: '+(e.message||e))}})}
function openDragDrop(){
 if(!has('page.layout.manage'))return alert('Brak uprawnienia do projektowania układu (page.layout.manage).');
 if(pending)return alert('Najpierw opublikuj teksty lub zachowaj szkic i odrzuć niezapisane zmiany.');
 if(!window.MattStudioLayout?.open)return alert('Projektant układu jest niedostępny. Sprawdź, czy załadowano cms-admin.js.');
 // Layout designer operates on the real DOM, not the non-executing preview iframe.
 // Close Studio before opening so it can capture pointer and drag events reliably.
 root?.remove();root=null;frame=null;document.body.style.overflow='';
 window.MattStudioLayout.open();
}
function openPublication(){const modal=document.createElement('div');modal.className='mv4-overlay';const blocks=cms().get('studio_blocks:'+route,[]);modal.innerHTML=`<section class="mv4-dialog" role="dialog" aria-modal="true"><div class="mv4-dialog-head"><div><small>MATT STUDIO 5.0</small><h2>Centrum publikacji</h2><p>Wpisy strony i skróty do istniejących menedżerów Firebase.</p></div><button data-close>✕</button></div><div class="mv4-metrics"><div><strong>${esc(route||'START')}</strong><span>Podstrona</span></div><div><strong>${Array.isArray(blocks)?blocks.length:0}</strong><span>Dodatkowe bloki na stronie</span></div><div><strong>${hiddenIds().length}</strong><span>Ukryte kafelki</span></div></div><div class="mv4-actions"><button data-go="events">Eventy — publikacja i harmonogram</button><button data-go="viewer/downloads">Pliki — widoczność i publikacja</button></div><p class="mv4-note">Dodatkowe bloki publikują się przy zapisie. Nie ma jeszcze wspólnego harmonogramu dla wszystkich rodzajów treści.</p></section>`;root.append(modal);modal.querySelector('[data-close]').onclick=()=>modal.remove();modal.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{const r=b.dataset.go;modal.remove();if(pending)return alert('Zapisz zmiany przed przejściem');close();open(r)})}
function openAccessAudit(){const modal=document.createElement('div');modal.className='mv4-overlay';const checks=['page.text.edit','page.images.manage','page.callouts.manage','events.create','events.edit','events.publish','downloads.create','downloads.edit','downloads.publish','accounts.view','cms.dashboard.view','audit.view','lobby.view','lobby.edit'];modal.innerHTML=`<section class="mv4-dialog" role="dialog" aria-modal="true"><div class="mv4-dialog-head"><div><small>MATT STUDIO 5.0</small><h2>Diagnostyka uprawnień</h2><p>Sprawdzenie uprawnień aktualnie zalogowanego konta — nie symulacja innego moderatora.</p></div><button data-close>✕</button></div><div class="mv45-permissions">${checks.map(k=>`<div><code>${esc(k)}</code><strong>${has(k)?'✓ TAK':'— NIE'}</strong></div>`).join('')}</div><p class="mv4-note">To kontrola po stronie interfejsu. Rzeczywiste bezpieczeństwo zależy od polityk RLS i funkcji Firebase. Tego testu nie należy traktować jako audytu RLS.</p></section>`;root.append(modal);modal.querySelector('[data-close]').onclick=()=>modal.remove()}

function studioOverview(){
 if(!root)return;
 const current=route||'start';
 const total=groups.length;
 const extra=cms()?.get('studio_blocks:'+route,[]);
 const count=Array.isArray(extra)?extra.length:0;
 const modal=document.createElement('div');modal.className='mv4-overlay';
 modal.innerHTML=`<section class="mv4-dialog" role="dialog" aria-modal="true" aria-label="Pulpit MATT STUDIO"><div class="mv4-dialog-head"><div><small>MATT STUDIO 4.0</small><h2>Centrum zarządzania</h2><p>Przegląd edytowanej strony i dostępnych narzędzi</p></div><button data-mv4-close aria-label="Zamknij">✕</button></div><div class="mv4-metrics"><div><strong>${esc(current.toUpperCase())}</strong><span>Aktualna podstrona</span></div><div><strong>${total}</strong><span>Edytowalne kafelki</span></div><div><strong>${count}</strong><span>Dodatkowe sekcje</span></div><div><strong>${pending?'NIE':'TAK'}</strong><span>Zmiany tekstowe zapisane</span></div></div><h3>Narzędzia</h3><div class="mv4-actions"><button data-mv4-action="sections">▦ Kreator sekcji</button><button data-mv4-action="preview">▣ Podgląd strony</button><button data-mv4-action="refresh">↻ Odśwież podgląd</button></div><p class="mv4-note">Eventy i pliki mają własne konfiguratory, połączone z dotychczasowymi danymi. Zmiany w sekcjach mogą publikować się od razu — przed ich usunięciem sprawdź podgląd.</p></section>`;
 root.append(modal);
 const dismiss=()=>modal.remove();modal.querySelector('[data-mv4-close]').onclick=dismiss;
 modal.addEventListener('click',e=>{if(e.target===modal)dismiss()});
 modal.querySelector('[data-mv4-action="sections"]').onclick=()=>{dismiss();$('#mv-add',root)?.click()};
 modal.querySelector('[data-mv4-action="preview"]').onclick=()=>{dismiss();$('#mv-focus',root)?.click()};
 modal.querySelector('[data-mv4-action="refresh"]').onclick=()=>{dismiss();frame=null;render();notify('✓ Podgląd został odświeżony')};
}
function markPending(){const b=$('#mv-save',root);if(b)b.textContent=pending?'● Opublikuj teksty':'✓ Opublikowano';const status=$('#mv-state',root);if(status&&pending)status.textContent='● Niezapisane zmiany — widoczne tylko w podglądzie';}

const hiddenKey=()=>`studio_hidden_tiles:${route}`;
const hiddenIds=()=>{const value=cms()?.get(hiddenKey(),[]);return Array.isArray(value)?value.filter(v=>typeof v==='string'):[]};
const groupId=g=>g?.items?.[0]?.dataset?.cmsTextId||'';
function isHidden(g){return hiddenIds().includes(groupId(g));}
async function toggleGroup(i){
 const g=groups[i];if(!g)return;
 if(!window.mattHasPermission?.('page.text.edit'))return alert('Brak uprawnień do usuwania sekcji.');
 if(pending)return alert('Najpierw zapisz lub odrzuć niezapisane zmiany.');
 const id=groupId(g);if(!id)return alert('Nie można zidentyfikować tej sekcji.');
 const wasHidden=isHidden(g);const previousHidden=hiddenIds();
 if(!wasHidden&&!confirm(`Ukryć kafelek „${g.title}” na stronie?\n\nMożesz go później przywrócić ikoną ↶. Zmiana zostanie zapisana w Firebase.`))return;
 const next=hiddenIds().filter(v=>v!==id);if(!wasHidden)next.push(id);
 try{
  if(next.length)await cms().save(hiddenKey(),next);else await cms().remove(hiddenKey());
  try{await recordHistory('Widoczność kafelka',hiddenKey(),previousHidden)}catch(e){console.warn(e)}window.MattCMS.applyHiddenTiles?.(route);
  frame=null;render();
  notify(wasHidden?'✓ Kafelek przywrócony i zapisany':'✓ Kafelek ukryty i zapisany w Firebase');
 }catch(e){alert('Nie udało się zapisać zmiany: '+(e.message||e));}
}
function candidates(){return cms()?.decorateEditable(route)||[]}
function makeGroups(){
 const els=candidates(), map=new Map();
 for(const el of els){
  let card=el.closest('article,.info-card,.vip-card,.benefit-card,.content-card,.feature-card,.rule-card,.glass-card,.card,.callout,.alert,.section-card');
  if(!card){let p=el.parentElement;while(p&&p!==document.body){if(p.querySelectorAll('[data-cms-text-id]').length>=2 && p.querySelectorAll('[data-cms-text-id]').length<=20 && ['SECTION','ARTICLE','DIV','ASIDE'].includes(p.tagName)){card=p;break}p=p.parentElement}}
  card=card||el;
  if(!map.has(card))map.set(card,[]);map.get(card).push(el);
 }
 groups=[...map].map(([node,items],i)=>({node,items,title:plain(items.find(x=>/^H[1-6]$/.test(x.tagName))?.innerHTML||items[0]?.innerHTML||`Kafelek ${i+1}`).slice(0,65)}));
}
function currentHtml(el){const key=el.dataset.cmsTextId;return Object.prototype.hasOwnProperty.call(drafts,key)?drafts[key]:el.innerHTML}
function createSnapshot(){
 const app=document.querySelector('#app');if(!app)return;
 const header=document.querySelector('.site-header');
 const clone=app.cloneNode(true);
 // Snapshot uses the actual rendered website markup and its existing stylesheet.
 // Scripts are never run inside the preview; buttons and links cannot perform actions.
 clone.querySelectorAll('script,iframe,[data-matt-suite-center],.admin-float-panel,.cms-admin-panel').forEach(n=>n.remove());
 const base=location.href.split('#')[0];
 const stylesheet=[...document.querySelectorAll('link[rel="stylesheet"]')].filter(x=>!x.href.includes('studio-visual.css')).map(x=>`<link rel="stylesheet" href="${esc(x.href)}">`).join('');
 const h=header?header.cloneNode(true):null;
 if(h){h.querySelectorAll('.user-area,.mobile-menu-btn').forEach(x=>x.remove());}
 // The preview is intentionally script-free. Remove inline handlers and javascript: URLs
 // from cloned markup to avoid sandbox execution errors without enabling scripts.
 for (const subtree of [clone, h].filter(Boolean)) {
   for (const el of [subtree, ...subtree.querySelectorAll('*')]) {
     for (const attr of [...el.attributes]) {
       const name = attr.name.toLowerCase();
       if (name.startsWith('on') || ((name === 'href' || name === 'src') && /^\s*javascript:/i.test(attr.value))) {
         el.removeAttribute(attr.name);
       }
     }
     if (el.tagName === 'SCRIPT') el.remove();
   }
 }
 const html=`<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="${esc(base)}">${stylesheet}<style>html{scroll-behavior:auto!important}body{margin:0!important}a,button{cursor:default!important}[data-mv-picked]{outline:3px solid #ff3154!important;outline-offset:3px!important;box-shadow:0 0 0 5px #ff31542b!important} [data-cms-text-id]{cursor:pointer!important} .mv-hover{outline:2px dashed #ff8aa0!important;outline-offset:3px!important}</style></head><body>${h?h.outerHTML:''}${clone.outerHTML}</body></html>`;
 const host=$('#mv-preview',root);host.innerHTML='';frame=document.createElement('iframe');frame.className='mv-site-frame';frame.title='Podgląd prawdziwej strony';frame.setAttribute('sandbox','allow-same-origin');host.append(frame);
 frame.addEventListener('load',()=>{
  const doc=frame.contentDocument;if(!doc)return;
  doc.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const target=e.target.closest('[data-cms-text-id]');if(!target)return;const i=groups.findIndex(g=>g.items.some(el=>el.dataset.cmsTextId===target.dataset.cmsTextId));if(i>=0)choose(i)} ,true);
  doc.addEventListener('submit',e=>e.preventDefault(),true);
  doc.addEventListener('mouseover',e=>{doc.querySelectorAll('.mv-hover').forEach(n=>n.classList.remove('mv-hover'));const t=e.target.closest('[data-cms-text-id]');if(t)t.classList.add('mv-hover')});
  refreshSnapshot();
 });
 frame.srcdoc=html;
}
function refreshSnapshot(){
 const doc=frame?.contentDocument;if(!doc||!doc.body)return;
 doc.querySelectorAll('[data-mv-picked]').forEach(n=>n.removeAttribute('data-mv-picked'));
 for(const g of groups){for(const el of g.items){const id=el.dataset.cmsTextId;if(!id)continue;const target=[...doc.querySelectorAll('[data-cms-text-id]')].find(n=>n.dataset.cmsTextId===id);if(target)target.innerHTML=cms().sanitizeHtml(currentHtml(el));}}
 for(const group of groups){const id=groupId(group);const target=[...doc.querySelectorAll('[data-cms-text-id]')].find(n=>n.dataset.cmsTextId===id);if(target){const card=target.closest('article,.info-card,.vip-card,.benefit-card,.content-card,.feature-card,.rule-card,.glass-card,.card,.callout,.alert,.section-card')||target;card.style.display=isHidden(group)?'none':'';}}
 const g=groups[selected];if(!g)return;
 let first=null;
 for(const el of g.items){const t=[...doc.querySelectorAll('[data-cms-text-id]')].find(n=>n.dataset.cmsTextId===el.dataset.cmsTextId);if(t){first=t;break}}
 if(first){const card=first.closest('article,.info-card,.vip-card,.benefit-card,.content-card,.feature-card,.rule-card,.glass-card,.card,.callout,.alert,.section-card')||first;card.setAttribute('data-mv-picked','');}
}
async function duplicateGroup(i){
 const g=groups[i];if(!g)return;
 if(!window.mattHasPermission?.('page.text.edit'))return alert('Brak uprawnienia do duplikowania sekcji.');
 if(pending){alert('Najpierw zapisz albo odrzuć niezapisane zmiany.');return;}
 const key='studio_blocks:'+route;
 const existing=cms().get(key,[]);
 const blocks=Array.isArray(existing)?existing.slice():[];
 if(blocks.length>=80){alert('Osiągnięto limit 80 dodatkowych sekcji.');return;}
 const title=g.title+' — kopia';
 const content=g.items.filter(el=>!/^H[1-6]$/.test(el.tagName)).map(el=>plain(currentHtml(el))).filter(Boolean);
 const block={id:'mv-'+Date.now()+'-'+Math.random().toString(36).slice(2,9),type:'text',title,body:content.join('\n\n').slice(0,6000),image:'',link:'',label:'',left:'',right:'',steps:[]};
 if(!confirm('Utworzyć niezależną kopię treści „'+g.title+'” jako nową sekcję na końcu podstrony? Wygląd oryginalnego kafelka nie zostanie skopiowany.'))return;
 const btn=$('#mv-save',root);btn.disabled=true;
 try{await cms().save(key,[...blocks,block]);window.MattStudioBlocks?.render?.(route);makeGroups();frame=null;render();$('#mv-state',root).textContent='✓ Kopia zapisana jako nowa sekcja. Jej układ możesz zmienić w „Nowe sekcje”.';alert('Utworzono kopię. Znajdziesz ją na końcu podstrony oraz w „Nowe sekcje”.');}
 catch(e){alert('Nie udało się utworzyć kopii: '+(e.message||e));}
 finally{btn.disabled=false;}
}
async function deleteExtraBlock(index){
 if(!window.mattHasPermission?.('page.text.edit'))return alert('Brak uprawnień.');
 if(pending)return alert('Najpierw zapisz lub odrzuć zmiany tekstowe.');
 const key='studio_blocks:'+route, existing=cms().get(key,[]);
 if(!Array.isArray(existing)||!existing[index])return alert('Nie znaleziono sekcji. Odśwież stronę.');
 const title=existing[index].title||'Bez tytułu';
 if(!confirm('Usunąć opublikowaną sekcję „'+title+'”?\n\nZmiana zostanie natychmiast zapisana w Firebase.'))return;
 const next=existing.filter((_,i)=>i!==index);
 try{
  await cms().save(key,next);
  window.MattStudioBlocks?.render?.(route);
  makeGroups();frame=null;render();
  notify('✓ Usunięto sekcję „'+title+'” i zapisano w Firebase.');
 }catch(e){notify('✕ Błąd usuwania: '+(e.message||e),true);}
}
function notify(message,error=false){
 if(!root)return;
 const status=$('#mv-state',root);if(status)status.textContent=message;
 let toast=$('#mv-toast',root);
 if(!toast){toast=document.createElement('div');toast.id='mv-toast';toast.setAttribute('role','status');toast.style.cssText='position:fixed;bottom:22px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#16191f;border:1px solid #ff3154;color:white;border-radius:10px;padding:14px 20px;box-shadow:0 12px 36px #000a;max-width:85vw;font-size:14px';root.appendChild(toast)}
 toast.textContent=message;toast.style.borderColor=error?'#ff3154':'#43c990';toast.hidden=false;
 clearTimeout(notify.timer);notify.timer=setTimeout(()=>{if(toast.isConnected)toast.hidden=true},5000);
}
function render(){if(!root)return;const list=$('#mv-list',root),edit=$('#mv-edit',root);
 list.innerHTML=groups.map((g,i)=>`<div class="mv-item-row"><button class="mv-item ${isHidden(g)?'mv-hidden':''} ${i===selected?'active':''}" data-mv-select="${i}"><span style="color:#ff4564">${String(i+1).padStart(2,'0')}</span><strong>${esc(g.title)}</strong><span>✎</span></button><button class="mv-copy" data-mv-copy="${i}" title="Duplikuj kafelek jako dodatkową sekcję" aria-label="Duplikuj ${esc(g.title)}">⧉</button><button class="mv-trash ${isHidden(g)?'mv-restore':''}" data-mv-trash="${i}" title="${isHidden(g)?'Przywróć kafelek':'Ukryj kafelek na stronie'}" aria-label="${isHidden(g)?'Przywróć':'Usuń'} ${esc(g.title)}">${isHidden(g)?'↶':'🗑'}</button></div>`).join('')||'<p class="mv-empty">Na tej podstronie nie wykryto standardowych kafelków tekstowych.</p>';
 const extra=cms().get('studio_blocks:'+route,[]);
 if(Array.isArray(extra)&&extra.length){
  const heading=document.createElement('p');heading.className='mv-small';heading.textContent='DODATKOWE SEKCJE (OPUBLIKOWANE)';list.appendChild(heading);
  extra.forEach((block,index)=>{
   const row=document.createElement('div');row.className='mv-item-row';
   const name=document.createElement('button');name.className='mv-item';name.textContent=(index+1)+'. '+(block.title||'Bez tytułu');name.title='Edytuj w Kreatorze sekcji';name.onclick=()=>$('#mv-add',root).click();
   const trash=document.createElement('button');trash.className='mv-trash';trash.textContent='🗑';trash.title='Usuń dodatkową sekcję z Firebase';trash.setAttribute('aria-label','Usuń '+(block.title||'sekcję'));trash.onclick=()=>deleteExtraBlock(index);
   row.append(name,trash);list.appendChild(row);
  });
 }
 if(!frame)createSnapshot();else refreshSnapshot();
 const g=groups[selected];if(!window.mattHasPermission?.('page.text.edit')){edit.innerHTML='<p class="mv-empty">Nie masz uprawnienia do edycji tekstów. Użyj dostępnych narzędzi na górnym pasku.</p>';return}if(!g){edit.innerHTML='<p class="mv-empty">Wybierz kafelek z lewej strony.</p>';return}
 edit.innerHTML=`<div class="mv-small">EDYCJA CAŁEGO KAFELKA</div><button class="mv-red mv-duplicate-selected" id="mv-duplicate-selected">⧉ Duplikuj cały kafelek</button><h3 style="margin:0 0 12px">${esc(g.title)}</h3><p class="mv-empty" style="font-size:12px">Edytujesz treść oryginalnej strony. Podgląd pokazuje rzeczywisty układ, zdjęcia i style.</p>`+g.items.map((el,i)=>`<label>${/^H[1-6]$/.test(el.tagName)?'Nagłówek':el.tagName==='LI'?'Punkt listy':`Treść ${i+1}`}</label><div class="mv-tools"><button data-mv-command="bold" data-mv-i="${i}"><b>B</b></button><button data-mv-command="italic" data-mv-i="${i}"><i>I</i></button><button data-mv-command="underline" data-mv-i="${i}"><u>U</u></button><button data-mv-command="createLink" data-mv-i="${i}">🔗</button></div><div class="mv-editor" contenteditable="true" spellcheck="true" data-mv-field="${i}">${cms().sanitizeHtml(currentHtml(el))}</div>`).join('');
 $$('[data-mv-copy]',root).forEach(b=>b.onclick=()=>duplicateGroup(+b.dataset.mvCopy));$$('[data-mv-trash]',root).forEach(b=>b.onclick=()=>toggleGroup(+b.dataset.mvTrash));$('#mv-duplicate-selected',edit).onclick=()=>duplicateGroup(selected);
 $$('[data-mv-select]',root).forEach(b=>{b.hidden=!!filter&&!groups[+b.dataset.mvSelect].title.toLowerCase().includes(filter.toLowerCase());b.onclick=()=>choose(+b.dataset.mvSelect)});
 $$('[data-mv-field]',edit).forEach(e=>e.addEventListener('input',()=>{drafts[g.items[+e.dataset.mvField].dataset.cmsTextId]=cms().sanitizeHtml(e.innerHTML);pending=true;stashDraft();markPending();refreshSnapshot()}));
 $$('[data-mv-command]',edit).forEach(b=>{b.onmousedown=e=>e.preventDefault();b.onclick=()=>{const field=$(`[data-mv-field="${b.dataset.mvI}"]`,edit);field.focus();if(b.dataset.mvCommand==='createLink'){const url=prompt('Adres HTTPS lub wewnętrzny #/...');if(!url)return;if(!/^https:\/\//i.test(url)&&!/^#\/[a-z0-9/_-]+$/i.test(url)){alert('Nieprawidłowy adres');return}document.execCommand('createLink',false,url)}else document.execCommand(b.dataset.mvCommand,false,null);field.dispatchEvent(new Event('input'))}});
}
function choose(i){selected=i;render();const doc=frame?.contentDocument;const g=groups[i];const el=g?.items?.[0];const target=el&&[...(doc?.querySelectorAll('[data-cms-text-id]')||[])].find(n=>n.dataset.cmsTextId===el.dataset.cmsTextId);target?.scrollIntoView({behavior:'smooth',block:'center'});}
async function save(){if(!pending){notify('Nie ma niezapisanych zmian tekstowych. Dodatkowe sekcje zapisują się osobno w Kreatorze sekcji, a ich usuwanie działa od razu.');return;}const key=`page:${route}`,data={...(cms().get(key,{})||{})};for(const [id,html] of Object.entries(drafts)){const el=groups.flatMap(g=>g.items).find(x=>x.dataset.cmsTextId===id);if(!el)continue;if(html===cms().sanitizeHtml(cms().baseHtml(el)))delete data[id];else data[id]=html}const previous=cms().get(key,null);const btn=$('#mv-save',root);btn.disabled=true;btn.textContent='Zapisywanie…';try{if(Object.keys(data).length)await cms().save(key,data);else if(cms().get(key,null)!=null)await cms().remove(key);for(const el of groups.flatMap(g=>g.items)){if(Object.hasOwn(drafts,el.dataset.cmsTextId))el.innerHTML=drafts[el.dataset.cmsTextId]}drafts={};pending=false;stashDraft();try{await recordHistory('Edycja tekstów',key,previous)}catch(e){console.warn('Historia niedostępna:',e)}makeGroups();render();markPending();notify('✓ Zapis zakończony. Zmiany tekstowe zostały wysłane do Firebase.')}catch(e){notify('✕ Nie udało się zapisać: '+(e.message||e),true)}finally{btn.disabled=false;btn.textContent='✓ Opublikuj teksty'}}
function close(){if(pending&&!confirm('Zamknąć edytor? Szkic pozostanie zapisany lokalnie w tej przeglądarce.'))return;stashDraft();root?.remove();root=null;frame=null;document.body.style.overflow=''}
function openEventsStudio(r){
 if(!window.mattHasPermission?.('events.create')&&!window.mattHasPermission?.('events.edit')&&!window.mattHasPermission?.('events.publish')&&!window.mattHasPermission?.('events.images.manage'))return alert('Brak uprawnień do zarządzania eventami.');
 route=r;drafts={};pending=false;groups=[];selected=0;frame=null;root?.remove();
 root=document.createElement('div');root.id='mv-root';root.classList.add('mv-events-studio');
 root.innerHTML=`<header class="mv-top"><div class="mv-brand">◈ MATT STUDIO <span>5.1</span><div style="font-size:11px;letter-spacing:3px;color:#aaa">EVENT CREATOR · FIREBASE</div></div><div class="mv-top-actions"><button id="mv-event-new">＋ Nowy event</button><button id="mv-event-refresh">↻ Odśwież</button><button id="mv-event-close">✕ Zamknij</button></div></header><div class="mv-body"><aside class="mv-pane"><div class="mv-pane-head">☷ EVENTY W BAZIE</div><div class="mv-scroll"><input id="mv-event-search" type="search" placeholder="Szukaj wydarzenia…"><div id="mv-event-list"><p class="mv-empty">Pobieranie eventów z Firebase…</p></div></div></aside><main class="mv-pane"><div class="mv-pane-head">PODGLĄD STRONY NA ŻYWO <div><button id="mv-event-desktop">▣</button> <button id="mv-event-mobile">▯</button></div></div><div class="mv-stage"><div class="mv-preview" id="mv-preview"></div></div><div class="mv-status" id="mv-state">Podgląd bieżącej strony · edycja otwiera konfigurator z podglądem na żywo</div></main><aside class="mv-pane"><div class="mv-pane-head">✎ KONFIGURATOR EVENTÓW</div><div class="mv-scroll" id="mv-event-info"><h3>Twórz i edytuj wydarzenia</h3><p>Wybierz event z listy albo dodaj nowy. Konfigurator pozwala zmieniać tytuł, opis, grafikę karty i strony wydarzenia, sposób dopasowania zdjęć, daty rozpoczęcia i zakończenia oraz publikację.</p><p>Podczas edycji przełączaj podgląd między kartą na liście a pełną stroną eventu. Dane zapisywane są w istniejącej tabeli events oraz ustawieniach event_workflow.</p><button class="mv-red" id="mv-event-config">＋ Dodaj event</button></div></aside></div>`;
 document.body.appendChild(root);document.body.style.overflow='hidden';
 const exit=()=>{root?.remove();root=null;frame=null;document.body.style.overflow=''};
 const edit=id=>{exit();if(!window.MattAdminTools?.openEvents)return alert('Konfigurator eventów nie został załadowany. Odśwież stronę.');window.MattAdminTools.openEvents(id)};
 $('#mv-event-close',root).onclick=exit;
 $('#mv-event-new',root).onclick=$('#mv-event-config',root).onclick=()=>edit('new');
 $('#mv-event-desktop',root).onclick=()=>{$('#mv-preview',root).style.width='100%'};
 $('#mv-event-mobile',root).onclick=()=>{$('#mv-preview',root).style.width='390px'};
 createSnapshot();
 async function load(){
  const list=$('#mv-event-list',root);if(!list)return;
  try{const {data,error}=await window.firebaseClient.from('events').select('id,title,start_date,image_url').order('start_date',{ascending:false});if(error)throw error;
   const rows=Array.isArray(data)?data:[];
   function paint(){const q=($('#mv-event-search',root)?.value||'').toLocaleLowerCase();list.innerHTML=rows.filter(x=>String(x.title||'').toLocaleLowerCase().includes(q)).map(x=>`<button class="mv-item mv-event-entry" data-event-id="${esc(x.id)}"><strong>${esc(x.title||'Bez nazwy')}</strong><small>${esc(String(x.start_date||'').slice(0,16).replace('T',' '))}</small><span>EDYTUJ ✎</span></button>`).join('')||'<p class="mv-empty">Brak eventów. Kliknij „Nowy event”.</p>';$$('[data-event-id]',list).forEach(b=>b.onclick=()=>edit(b.dataset.eventId));}
   $('#mv-event-search',root).oninput=paint;paint();
  }catch(e){list.innerHTML='<p class="mv-empty">Nie udało się pobrać eventów: '+esc(e.message||e)+'</p>'}
 }
 $('#mv-event-refresh',root).onclick=load;load();
}
function openDownloadsStudio(r){
 if(!['downloads.create','downloads.edit','downloads.reorder','downloads.publish','downloads.delete'].some(p=>window.mattHasPermission?.(p)))return alert('Brak uprawnień do plików do pobrania.');
 route=r;drafts={};pending=false;groups=[];frame=null;root?.remove();
 root=document.createElement('div');root.id='mv-root';root.classList.add('mv-events-studio');
 root.innerHTML=`<header class="mv-top"><div class="mv-brand">◈ MATT STUDIO <span>5.1</span><div style="font-size:11px;letter-spacing:3px;color:#aaa">DOWNLOAD CREATOR · FIREBASE</div></div><div class="mv-top-actions"><button id="mv-download-new">＋ Zarządzaj plikami</button><button id="mv-download-refresh">↻ Odśwież</button><button id="mv-download-close">✕ Zamknij</button></div></header><div class="mv-body"><aside class="mv-pane"><div class="mv-pane-head">☷ PLIKI DO POBRANIA</div><div class="mv-scroll"><input id="mv-download-search" type="search" placeholder="Szukaj pliku…"><div id="mv-download-list"></div></div></aside><main class="mv-pane"><div class="mv-pane-head">PODGLĄD NA ŻYWO <div><button id="mv-download-desktop">▣</button> <button id="mv-download-mobile">▯</button></div></div><div class="mv-stage"><div class="mv-preview" id="mv-preview"></div></div><div class="mv-status" id="mv-state">Podgląd strony · pliki i konfiguracja pochodzą z istniejącego CMS</div></main><aside class="mv-pane"><div class="mv-pane-head">✎ KONFIGURATOR PLIKÓW</div><div class="mv-scroll" id="mv-download-info"><h3>Dodawanie i edycja plików</h3><p>Możesz dodawać pliki z dysku, podmieniać istniejące, zmieniać tytuły, opisy, kategorie, typy, dodatkowe linki, widoczność i daty publikacji.</p><p>Istniejące pliki GitHub i konfiguracja Firebase pozostają zachowane. Edytor zawiera również podgląd karty przed zapisem.</p><button class="mv-red" id="mv-download-config">＋ Otwórz konfigurator</button></div></aside></div>`;
 document.body.appendChild(root);document.body.style.overflow='hidden';
 const exit=()=>{root?.remove();root=null;frame=null;document.body.style.overflow=''};
 const manage=()=>{exit();if(!window.MattAdminTools?.openDownloads)return alert('Menedżer plików nie został załadowany. Odśwież stronę.');window.MattAdminTools.openDownloads()};
 $('#mv-download-close',root).onclick=exit;
 $('#mv-download-new',root).onclick=$('#mv-download-config',root).onclick=manage;
 $('#mv-download-desktop',root).onclick=()=>{$('#mv-preview',root).style.width='100%'};
 $('#mv-download-mobile',root).onclick=()=>{$('#mv-preview',root).style.width='390px'};
 createSnapshot();
 const list=$('#mv-download-list',root);
 function paint(){const items=window.MattDownloads?.resolvedItems?.()||[];const q=($('#mv-download-search',root)?.value||'').toLocaleLowerCase();list.innerHTML=items.filter(x=>String(x.title||'').toLocaleLowerCase().includes(q)).map(x=>`<button class="mv-item mv-event-entry" data-download-entry="${esc(String(x.id))}"><strong>${esc(x.title||'Bez nazwy')}</strong><small>${esc(x.category||x.type||'PLIK')}</small><span>EDYTUJ ✎</span></button>`).join('')||'<p class="mv-empty">Brak plików. Kliknij „Zarządzaj plikami”.</p>';$$('[data-download-entry]',list).forEach(b=>b.onclick=manage)}
 $('#mv-download-search',root).oninput=paint;$('#mv-download-refresh',root).onclick=()=>{createSnapshot();paint()};paint();
}
function open(r,legacy={}){if(!cms())return alert('CMS nie jest gotowy');if(r==='events'||r.startsWith('events/'))return openEventsStudio(r);if(r==='viewer/downloads'||r==='downloads')return openDownloadsStudio(r);if(!window.mattHasPermission?.('page.text.edit')&&!window.mattHasPermission?.('page.images.manage')&&!window.mattHasPermission?.('page.callouts.manage')&&!window.mattHasPermission?.('home.hero.manage')&&!window.mattHasPermission?.('contact.topics.manage'))return alert('Brak uprawnień do MATT STUDIO');route=r;drafts={};pending=false;selected=0;filter='';compact=false;activeTab='tiles';makeGroups();root?.remove();frame=null;root=document.createElement('div');root.id='mv-root';root.innerHTML=`<header class="mv-top"><div class="mv-brand">◈ MATT STUDIO <span>5.1</span><div style="font-size:11px;letter-spacing:3px;color:#aaa">VISUAL BUILDER · CMS</div></div><div class="mv-top-actions"><button id="mv-dashboard">▦ Pulpit</button><button id="mv-dragdrop" title="Przeciągaj elementy na prawdziwej stronie, zmieniaj rozmiary i kolejność">✥ Drag & Drop</button><button id="mv-history">↶ Historia</button><button id="mv-drafts">✎ Szkice</button><button id="mv-publications">◷ Publikacje</button><button id="mv-audit">♙ Dostęp</button><select id="mv-route" aria-label="Wybierz podstronę"><option value="">START</option><option value="events">EVENTY</option><option value="viewer/downloads">DO POBRANIA</option></select><button id="mv-focus" title="Powiększ podgląd">⛶ Podgląd</button><button id="mv-images">▧ Multimedia</button><button id="mv-callouts" hidden>▰ Komunikaty</button><button id="mv-special" hidden>⚙ Narzędzia strony</button><button id="mv-blocks">＋ Kreator sekcji</button><button id="mv-close">✕ Zamknij</button></div></header><div class="mv-body"><aside class="mv-pane"><div class="mv-pane-head">☷ SEKCJE NA PODSTRONIE</div><div class="mv-scroll"><div class="mv-small">${esc(route.toUpperCase())}</div><input id="mv-search" type="search" placeholder="Szukaj kafelka…" aria-label="Szukaj kafelka"><div id="mv-list"></div><button class="mv-red" style="width:100%;margin-top:14px" id="mv-add">＋ Dodaj / usuń / sortuj sekcje</button><p class="mv-empty" style="font-size:12px">Przycisk Drag & Drop u góry pozwala przesuwać i zmieniać rozmiar elementów na prawdziwej stronie. Kreator sekcji służy do dodawania bloków.</p></div></aside><main class="mv-pane"><div class="mv-pane-head" style="display:flex;justify-content:space-between;align-items:center;gap:8px">PODGLĄD NA ŻYWO <div><button id="mv-desktop">▣</button> <button id="mv-mobile">▯</button></div></div><div class="mv-stage"><div class="mv-preview" id="mv-preview"></div></div><div class="mv-status" id="mv-state">Podgląd roboczy · bez publikacji</div></main><aside class="mv-pane"><div class="mv-pane-head">✎ EDYCJA ELEMENTU</div><div class="mv-scroll" id="mv-edit"></div><div class="mv-bottom"><button id="mv-discard">↶ Odrzuć</button><button class="mv-red" id="mv-save">✓ Opublikuj teksty</button></div></aside></div>`;document.body.appendChild(root);document.body.style.overflow='hidden';$('#mv-close',root).onclick=close;$('#mv-dashboard',root).onclick=studioOverview;$('#mv-dragdrop',root).hidden=!has('page.layout.manage');$('#mv-dragdrop',root).onclick=openDragDrop;$('#mv-history',root).onclick=openHistory;$('#mv-drafts',root).onclick=openDraftCenter;$('#mv-publications',root).onclick=openPublication;$('#mv-audit',root).onclick=openAccessAudit;$('#mv-route',root).value=route;$('#mv-route',root).onchange=e=>{const r=e.target.value;if(pending&&!confirm('Przejść do innej podstrony? Bieżący szkic pozostanie zapisany lokalnie.')){e.target.value=route;return;}stashDraft();root?.remove();root=null;frame=null;document.body.style.overflow='';open(r)};$('#mv-search',root).value=filter;$('#mv-search',root).oninput=e=>{filter=e.target.value;$$('[data-mv-select]',root).forEach(b=>b.hidden=!!filter&&!groups[+b.dataset.mvSelect].title.toLowerCase().includes(filter.toLowerCase()))};$('#mv-focus',root).onclick=()=>{compact=!compact;root.classList.toggle('mv-focus-mode',compact);$('#mv-focus',root).textContent=compact?'▤ Pokaż panele':'⛶ Podgląd'};$('#mv-save',root).onclick=save;$('#mv-discard',root).onclick=()=>{if(pending&&!confirm('Odrzucić zmiany?'))return;drafts={};pending=false;stashDraft();render();markPending();$('#mv-state',root).textContent='Odrzucono szkic'};$('#mv-desktop',root).onclick=()=>{viewport='100%';$('#mv-preview',root).style.width=viewport};$('#mv-mobile',root).onclick=()=>{viewport='390px';$('#mv-preview',root).style.width=viewport};const launch=fn=>{if(pending){alert('Najpierw zapisz lub odrzuć zmiany.');return}root.remove();root=null;frame=null;document.body.style.overflow='';fn?.()};
 const openBlocks=()=>{if(pending){alert('Najpierw zapisz lub odrzuć zmiany.');return}if(!window.mattHasPermission?.('page.text.edit'))return alert('Brak uprawnienia do kreatora sekcji.');window.MattStudioBlocks?.open(route,{embedded:true,container:root,onClose:()=>{window.MattStudioBlocks?.render?.(route);makeGroups();frame=null;render();}})};
 $('#mv-add',root).onclick=$('#mv-blocks',root).onclick=openBlocks;
 $('#mv-images',root).hidden=!window.mattHasPermission?.('page.images.manage')&&!window.mattHasPermission?.('home.hero.manage');
 $('#mv-images',root).onclick=()=>launch(()=>legacy.images?.());
 $('#mv-callouts',root).hidden=!window.mattHasPermission?.('page.callouts.manage');
 $('#mv-callouts',root).onclick=()=>launch(()=>legacy.callouts?.());
 $('#mv-special',root).hidden=!legacy.special;
 $('#mv-special',root).onclick=()=>launch(()=>legacy.special?.());
 recoverDraft();render();markPending();if(pending)notify('Przywrócono lokalny szkic — zmiany nie są jeszcze opublikowane.');if(legacy.initialTab==='blocks')openBlocks()}
window.MattVisualStudio={open};
})();
