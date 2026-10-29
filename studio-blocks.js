/* MATT STUDIO 2.0 — optional page sections; content stored through existing MattCMS. */
(function(){
 'use strict';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const route=()=>location.hash.replace(/^#\/?/,'').split('?')[0].replace(/^\/+|\/+$/g,'')||'home';
 const key=r=>'studio_blocks:'+r;
 const types={text:'Tekst',image:'Zdjęcie',steps:'Instrukcja krok po kroku',columns:'Dwie kolumny',button:'Przycisk',callout:'Wyróżniona informacja'};
 const url=s=>{s=String(s||'').trim();return /^(https:\/\/[^\s<>"']+|#\/[a-z0-9/_-]+)$/i.test(s)?s:'';};
 const imgUrl=s=>{s=String(s||'').trim();return /^https:\/\/[^\s<>"']+$/i.test(s)?s:'';};
 const clean=b=>({id:String(b.id||''),type:types[b.type]?b.type:'text',title:String(b.title||'').slice(0,180),body:String(b.body||'').slice(0,6000),image:imgUrl(b.image),link:url(b.link),label:String(b.label||'').slice(0,90),left:String(b.left||'').slice(0,3000),right:String(b.right||'').slice(0,3000),steps:(Array.isArray(b.steps)?b.steps:[]).slice(0,15).map(s=>({title:String(s.title||'').slice(0,150),body:String(s.body||'').slice(0,1500),image:imgUrl(s.image)}))});
 const read=r=>{const v=window.MattCMS?.get(key(r),[]);return Array.isArray(v)?v.map(clean).slice(0,80):[];};
 const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!=null)el.textContent=text;return el;};
 function render(r=route()){
  const root=document.getElementById('app');if(!root)return;
  root.querySelectorAll('[data-studio-blocks-root]').forEach(e=>e.remove());
  const blocks=read(r);if(!blocks.length)return;
  const host=node('section','matt-blocks');host.dataset.studioBlocksRoot=r;
  blocks.forEach(b=>{
   const card=node('article','matt-block matt-block-'+b.type);
   if(b.title)card.appendChild(node('h2','matt-block-title',b.title));
   const paragraph=(where,value)=>{if(value)where.appendChild(node('p','matt-block-body',value));};
   const photo=(where,src)=>{if(!src)return;const im=node('img','matt-block-image');im.src=src;im.loading='lazy';im.alt=b.title||'Ilustracja';where.appendChild(im);};
   if(b.type==='image'){photo(card,b.image);paragraph(card,b.body);}
   else if(b.type==='steps'){const wrap=node('div','matt-block-steps');b.steps.forEach((s,i)=>{const step=node('div','matt-block-step');step.appendChild(node('strong','',`KROK ${i+1} — ${s.title}`));paragraph(step,s.body);photo(step,s.image);wrap.appendChild(step);});card.appendChild(wrap);}
   else if(b.type==='columns'){const cols=node('div','matt-block-cols');[b.left,b.right].forEach(v=>{const col=node('div','matt-block-col');paragraph(col,v);cols.appendChild(col);});card.appendChild(cols);}
   else if(b.type==='button'){paragraph(card,b.body);if(b.link){const a=node('a','matt-block-button',b.label||'Przejdź');a.href=b.link;if(b.link.startsWith('https://')){a.target='_blank';a.rel='noopener noreferrer';}card.appendChild(a);}}
   else paragraph(card,b.body);
   host.appendChild(card);
  });
  const page=root.querySelector('.page-shell, .page-container, .content-wrap, .page-content')||root.firstElementChild||root;
  page.appendChild(host);
 }
 const uid=()=>String(Date.now())+Math.random().toString(36).slice(2,8);
 function open(r=route()){
  if(!window.mattHasPermission?.('page.text.edit')){alert('Brak uprawnienia do edycji treści.');return;}
  let blocks=read(r),selected=-1,dirty=false;
  const overlay=node('div','matt-studio2-overlay');overlay.innerHTML=`<div class="matt-studio2-dialog" role="dialog" aria-modal="true" aria-label="MATT STUDIO 2.0"><header><div><small>PANEL ADMINISTRATORA · KREATOR PODSTRON</small><h2>MATT STUDIO 2.0 <span>${esc(r)}</span></h2></div><button data-s2="close" aria-label="Zamknij">✕</button></header><div class="matt-studio2-body"><aside><h3>BLOKI PODSTRONY</h3><div data-s2-list></div><label for="s2-add">Dodaj element</label><select id="s2-add"><option value="">Wybierz rodzaj bloku…</option>${Object.entries(types).map(([v,t])=>`<option value="${v}">${esc(t)}</option>`).join('')}</select><button data-s2="add">+ DODAJ BLOK</button></aside><div class="matt-studio2-main"><div data-s2-fields></div><h3>PODGLĄD NOWEJ SEKCJI</h3><div data-s2-preview></div></div></div><footer><span data-s2-status>Zmiany nie są zapisane</span><button data-s2="cancel">ZAMKNIJ</button><button data-s2="save" class="primary">ZAPISZ I OPUBLIKUJ</button></footer></div>`;
  document.body.appendChild(overlay);
  const $=s=>overlay.querySelector(s);
  const close=()=>{if(dirty&&!confirm('Odrzucić niezapisane zmiany?'))return;overlay.remove();};
  const field=(label,name,value,multiline=false)=>`<label>${esc(label)}${multiline?`<textarea data-field="${name}" rows="4">${esc(value)}</textarea>`:`<input data-field="${name}" value="${esc(value)}">`}</label>`;
  function draw(){
   $('[data-s2-list]').innerHTML=blocks.map((b,i)=>`<div class="s2-item ${i===selected?'active':''}"><button data-pick="${i}">${i+1}. ${esc(types[b.type])}<small>${esc(b.title||b.label||'Bez tytułu')}</small></button><div><button data-up="${i}" title="W górę">↑</button><button data-down="${i}" title="W dół">↓</button><button data-delete="${i}" title="Usuń">×</button></div></div>`).join('')||'<p>Brak dodatkowych bloków. Dodaj pierwszy.</p>';
   $('[data-s2-fields]').innerHTML=selected<0?'<div class="s2-empty">Wybierz blok z lewej strony lub dodaj nowy. Istniejące elementy strony pozostaną bez zmian.</div>':form(blocks[selected]);
   $('[data-s2-preview]').innerHTML='';
   if(selected>=0){const temp=node('div','matt-blocks');const b=blocks[selected];const h=node('h3','',b.title||types[b.type]);temp.appendChild(h);if(b.type==='steps')b.steps.forEach((s,i)=>{temp.appendChild(node('strong','',`Krok ${i+1}: ${s.title}`));temp.appendChild(node('p','',s.body));if(s.image){const im=node('img','matt-block-image');im.src=s.image;temp.appendChild(im);}});else if(b.type==='columns'){temp.appendChild(node('p','',b.left));temp.appendChild(node('p','',b.right));}else{temp.appendChild(node('p','',b.body));if(b.image){const im=node('img','matt-block-image');im.src=b.image;temp.appendChild(im);}if(b.type==='button')temp.appendChild(node('strong','',b.label));} $('[data-s2-preview]').appendChild(temp);}
   overlay.querySelectorAll('[data-pick]').forEach(x=>x.onclick=()=>{selected=+x.dataset.pick;draw();});
   overlay.querySelectorAll('[data-up],[data-down],[data-delete]').forEach(x=>x.onclick=()=>{const i=+(x.dataset.up??x.dataset.down??x.dataset.delete);if(x.dataset.delete!=null){if(!confirm('Usunąć ten blok?'))return;blocks.splice(i,1);selected=-1;}else{const j=i+(x.dataset.up!=null?-1:1);if(j<0||j>=blocks.length)return;[blocks[i],blocks[j]]=[blocks[j],blocks[i]];selected=j;}dirty=true;draw();});
   overlay.querySelectorAll('[data-field]').forEach(x=>x.oninput=()=>{const b=blocks[selected];const path=x.dataset.field;if(path.startsWith('step:')){const [,i,k]=path.split(':');b.steps[+i][k]=x.value;}else b[path]=x.value;dirty=true;const current=selected;draw();selected=current;});
   // Keep input focus and caret during typing; refresh preview on blur instead.
   overlay.querySelectorAll('[data-field]').forEach(x=>{x.oninput=()=>{const b=blocks[selected],path=x.dataset.field;if(path.startsWith('step:')){const [,i,k]=path.split(':');b.steps[+i][k]=x.value;}else b[path]=x.value;dirty=true;$('[data-s2-status]').textContent='Niezapisane zmiany';};x.onblur=()=>draw();});
   overlay.querySelectorAll('[data-add-step]').forEach(x=>x.onclick=()=>{blocks[selected].steps.push({title:'Nowy krok',body:'',image:''});dirty=true;draw();});
   overlay.querySelectorAll('[data-del-step]').forEach(x=>x.onclick=()=>{blocks[selected].steps.splice(+x.dataset.delStep,1);dirty=true;draw();});
  }
  function form(b){let html=`<h3>EDYTUJ: ${esc(types[b.type])}</h3>`+field('Tytuł sekcji','title',b.title);
   if(b.type==='steps'){html+=b.steps.map((s,i)=>`<div class="s2-step"><strong>KROK ${i+1}</strong>${field('Tytuł',`step:${i}:title`,s.title)}${field('Opis',`step:${i}:body`,s.body,true)}${field('URL zdjęcia HTTPS',`step:${i}:image`,s.image)}<button data-del-step="${i}">Usuń krok</button></div>`).join('')+`<button data-add-step="1">+ DODAJ KROK</button>`;}
   else if(b.type==='columns')html+=field('Lewa kolumna','left',b.left,true)+field('Prawa kolumna','right',b.right,true);
   else{html+=field('Treść','body',b.body,true);if(b.type==='image')html+=field('URL zdjęcia HTTPS','image',b.image);if(b.type==='button')html+=field('Napis na przycisku','label',b.label)+field('Link HTTPS lub #/…','link',b.link);}
   return html;
  }
  $('[data-s2="close"]').onclick=close;$('[data-s2="cancel"]').onclick=close;
  $('[data-s2="add"]').onclick=()=>{const t=$('#s2-add').value;if(!types[t])return;blocks.push(clean({id:uid(),type:t,title:'Nowa sekcja',steps:t==='steps'?[{title:'Krok 1',body:'',image:''}]:[]}));selected=blocks.length-1;dirty=true;draw();};
  $('[data-s2="save"]').onclick=async()=>{const btn=$('[data-s2="save"]');btn.disabled=true;$('[data-s2-status]').textContent='Zapisywanie w Supabase…';try{const data=blocks.map(clean);await window.MattCMS.save(key(r),data);dirty=false;render(r);$('[data-s2-status]').textContent='Opublikowano pomyślnie';setTimeout(()=>{if(overlay.isConnected)overlay.remove();},600);}catch(e){$('[data-s2-status]').textContent='Błąd: '+(e.message||e);alert('Nie udało się zapisać. '+(e.message||e));}finally{btn.disabled=false;}};
  draw();
 }
 window.MattStudioBlocks={open,render};
 window.addEventListener('hashchange',()=>setTimeout(()=>render(),150));
 window.MattCMS?.ready?.then(()=>setTimeout(()=>render(),300));
})();
