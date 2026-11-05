(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plain=s=>{let d=document.createElement('div');d.innerHTML=s;return(d.textContent||'').trim()};
let root=null, activeTab='tiles', route='', groups=[], selected=0, drafts={}, pending=false, viewport='100%', frame=null, filter='', compact=false;
const cms=()=>window.MattCMS;
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
function render(){if(!root)return;const list=$('#mv-list',root),edit=$('#mv-edit',root);
 list.innerHTML=groups.map((g,i)=>`<div class="mv-item-row"><button class="mv-item ${i===selected?'active':''}" data-mv-select="${i}"><span style="color:#ff4564">${String(i+1).padStart(2,'0')}</span><strong>${esc(g.title)}</strong><span>✎</span></button><button class="mv-copy" data-mv-copy="${i}" title="Duplikuj kafelek jako dodatkową sekcję" aria-label="Duplikuj ${esc(g.title)}">⧉</button></div>`).join('')||'<p class="mv-empty">Na tej podstronie nie wykryto standardowych kafelków tekstowych.</p>';
 if(!frame)createSnapshot();else refreshSnapshot();
 const g=groups[selected];if(!window.mattHasPermission?.('page.text.edit')){edit.innerHTML='<p class="mv-empty">Nie masz uprawnienia do edycji tekstów. Użyj dostępnych narzędzi na górnym pasku.</p>';return}if(!g){edit.innerHTML='<p class="mv-empty">Wybierz kafelek z lewej strony.</p>';return}
 edit.innerHTML=`<div class="mv-small">EDYCJA CAŁEGO KAFELKA</div><button class="mv-red mv-duplicate-selected" id="mv-duplicate-selected">⧉ Duplikuj cały kafelek</button><h3 style="margin:0 0 12px">${esc(g.title)}</h3><p class="mv-empty" style="font-size:12px">Edytujesz treść oryginalnej strony. Podgląd pokazuje rzeczywisty układ, zdjęcia i style.</p>`+g.items.map((el,i)=>`<label>${/^H[1-6]$/.test(el.tagName)?'Nagłówek':el.tagName==='LI'?'Punkt listy':`Treść ${i+1}`}</label><div class="mv-tools"><button data-mv-command="bold" data-mv-i="${i}"><b>B</b></button><button data-mv-command="italic" data-mv-i="${i}"><i>I</i></button><button data-mv-command="underline" data-mv-i="${i}"><u>U</u></button><button data-mv-command="createLink" data-mv-i="${i}">🔗</button></div><div class="mv-editor" contenteditable="true" spellcheck="true" data-mv-field="${i}">${cms().sanitizeHtml(currentHtml(el))}</div>`).join('');
 $$('[data-mv-copy]',root).forEach(b=>b.onclick=()=>duplicateGroup(+b.dataset.mvCopy));$('#mv-duplicate-selected',edit).onclick=()=>duplicateGroup(selected);
 $$('[data-mv-select]',root).forEach(b=>{b.hidden=!!filter&&!groups[+b.dataset.mvSelect].title.toLowerCase().includes(filter.toLowerCase());b.onclick=()=>choose(+b.dataset.mvSelect)});
 $$('[data-mv-field]',edit).forEach(e=>e.addEventListener('input',()=>{drafts[g.items[+e.dataset.mvField].dataset.cmsTextId]=cms().sanitizeHtml(e.innerHTML);pending=true;$('#mv-state',root).textContent='● Niezapisane zmiany';refreshSnapshot()}));
 $$('[data-mv-command]',edit).forEach(b=>{b.onmousedown=e=>e.preventDefault();b.onclick=()=>{const field=$(`[data-mv-field="${b.dataset.mvI}"]`,edit);field.focus();if(b.dataset.mvCommand==='createLink'){const url=prompt('Adres HTTPS lub wewnętrzny #/...');if(!url)return;if(!/^https:\/\//i.test(url)&&!/^#\/[a-z0-9/_-]+$/i.test(url)){alert('Nieprawidłowy adres');return}document.execCommand('createLink',false,url)}else document.execCommand(b.dataset.mvCommand,false,null);field.dispatchEvent(new Event('input'))}});
}
function choose(i){selected=i;render();const doc=frame?.contentDocument;const g=groups[i];const el=g?.items?.[0];const target=el&&[...(doc?.querySelectorAll('[data-cms-text-id]')||[])].find(n=>n.dataset.cmsTextId===el.dataset.cmsTextId);target?.scrollIntoView({behavior:'smooth',block:'center'});}
async function save(){if(!pending)return;const key=`page:${route}`,data={...(cms().get(key,{})||{})};for(const [id,html] of Object.entries(drafts)){const el=groups.flatMap(g=>g.items).find(x=>x.dataset.cmsTextId===id);if(!el)continue;if(html===cms().sanitizeHtml(cms().baseHtml(el)))delete data[id];else data[id]=html}const btn=$('#mv-save',root);btn.disabled=true;btn.textContent='Zapisywanie…';try{if(Object.keys(data).length)await cms().save(key,data);else if(cms().get(key,null)!=null)await cms().remove(key);for(const el of groups.flatMap(g=>g.items)){if(Object.hasOwn(drafts,el.dataset.cmsTextId))el.innerHTML=drafts[el.dataset.cmsTextId]}drafts={};pending=false;$('#mv-state',root).textContent='✓ Zapisano w Supabase';makeGroups();render()}catch(e){alert('Nie udało się zapisać: '+e.message)}finally{btn.disabled=false;btn.textContent='💾 Zapisz zmiany'}}
function close(){if(pending&&!confirm('Odrzucić niezapisane zmiany?'))return;root?.remove();root=null;frame=null;document.body.style.overflow=''}
function open(r,legacy={}){if(!cms())return alert('CMS nie jest gotowy');if(!window.mattHasPermission?.('page.text.edit')&&!window.mattHasPermission?.('page.images.manage')&&!window.mattHasPermission?.('page.callouts.manage')&&!window.mattHasPermission?.('home.hero.manage')&&!window.mattHasPermission?.('contact.topics.manage'))return alert('Brak uprawnień do MATT STUDIO');route=r;drafts={};pending=false;selected=0;filter='';compact=false;activeTab='tiles';makeGroups();root?.remove();frame=null;root=document.createElement('div');root.id='mv-root';root.innerHTML=`<header class="mv-top"><div class="mv-brand">◈ MATT STUDIO <span>3.5</span><div style="font-size:11px;letter-spacing:3px;color:#aaa">VISUAL BUILDER</div></div><div class="mv-top-actions"><button id="mv-focus" title="Powiększ podgląd">⛶ Podgląd</button><button id="mv-images">▧ Multimedia</button><button id="mv-callouts" hidden>▰ Komunikaty</button><button id="mv-special" hidden>⚙ Narzędzia strony</button><button id="mv-blocks">＋ Kreator sekcji</button><button id="mv-close">✕ Zamknij</button></div></header><div class="mv-body"><aside class="mv-pane"><div class="mv-pane-head">☷ SEKCJE NA PODSTRONIE</div><div class="mv-scroll"><div class="mv-small">${esc(route.toUpperCase())}</div><input id="mv-search" type="search" placeholder="Szukaj kafelka…" aria-label="Szukaj kafelka"><div id="mv-list"></div><button class="mv-red" style="width:100%;margin-top:14px" id="mv-add">＋ Dodaj / usuń / sortuj sekcje</button><p class="mv-empty" style="font-size:12px">Kolejność i nowe sekcje: kreator sekcji. Edycja istniejących kafelków: wybierz powyżej.</p></div></aside><main class="mv-pane"><div class="mv-pane-head" style="display:flex;justify-content:space-between;align-items:center;gap:8px">PODGLĄD NA ŻYWO <div><button id="mv-desktop">▣</button> <button id="mv-mobile">▯</button></div></div><div class="mv-stage"><div class="mv-preview" id="mv-preview"></div></div><div class="mv-status" id="mv-state">Podgląd roboczy · bez publikacji</div></main><aside class="mv-pane"><div class="mv-pane-head">✎ EDYCJA ELEMENTU</div><div class="mv-scroll" id="mv-edit"></div><div class="mv-bottom"><button id="mv-discard">↶ Odrzuć</button><button class="mv-red" id="mv-save">💾 Zapisz zmiany</button></div></aside></div>`;document.body.appendChild(root);document.body.style.overflow='hidden';$('#mv-close',root).onclick=close;$('#mv-search',root).value=filter;$('#mv-search',root).oninput=e=>{filter=e.target.value;$$('[data-mv-select]',root).forEach(b=>b.hidden=!!filter&&!groups[+b.dataset.mvSelect].title.toLowerCase().includes(filter.toLowerCase()))};$('#mv-focus',root).onclick=()=>{compact=!compact;root.classList.toggle('mv-focus-mode',compact);$('#mv-focus',root).textContent=compact?'▤ Pokaż panele':'⛶ Podgląd'};$('#mv-save',root).onclick=save;$('#mv-discard',root).onclick=()=>{if(pending&&!confirm('Odrzucić zmiany?'))return;drafts={};pending=false;render();$('#mv-state',root).textContent='Odrzucono szkic'};$('#mv-desktop',root).onclick=()=>{viewport='100%';$('#mv-preview',root).style.width=viewport};$('#mv-mobile',root).onclick=()=>{viewport='390px';$('#mv-preview',root).style.width=viewport};const launch=fn=>{if(pending){alert('Najpierw zapisz lub odrzuć zmiany.');return}root.remove();root=null;frame=null;document.body.style.overflow='';fn?.()};
 const openBlocks=()=>{if(pending){alert('Najpierw zapisz lub odrzuć zmiany.');return}if(!window.mattHasPermission?.('page.text.edit'))return alert('Brak uprawnienia do kreatora sekcji.');window.MattStudioBlocks?.open(route,{embedded:true,container:root,onClose:()=>{window.MattStudioBlocks?.render?.(route);makeGroups();frame=null;render();}})};
 $('#mv-add',root).onclick=$('#mv-blocks',root).onclick=openBlocks;
 $('#mv-images',root).hidden=!window.mattHasPermission?.('page.images.manage')&&!window.mattHasPermission?.('home.hero.manage');
 $('#mv-images',root).onclick=()=>launch(()=>legacy.images?.());
 $('#mv-callouts',root).hidden=!window.mattHasPermission?.('page.callouts.manage');
 $('#mv-callouts',root).onclick=()=>launch(()=>legacy.callouts?.());
 $('#mv-special',root).hidden=!legacy.special;
 $('#mv-special',root).onclick=()=>launch(()=>legacy.special?.());
 render();if(legacy.initialTab==='blocks')openBlocks()}
window.MattVisualStudio={open};
})();
