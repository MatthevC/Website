(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const defaults={game:'dbd',slots:4,queue_open:true,fair_rotation:true,conflicts_enabled:true,cooldown:1,reset_mode:'manual',new_days:7,regular_days:30,limits:{new:2,regular:3,veteran:4,sub:5,vip:6,vip_sub:8,mod:8,mod_sub:10}};
const games=[['dbd','Dead by Daylight',4],['among','Among Us',10],['lol','League of Legends',5],['other','Inna gra',5]];
const ranks=[['new','Nowy widz'],['regular','Stały widz'],['veteran','Weteran'],['sub','Subskrybent'],['vip','VIP'],['vip_sub','VIP + Subskrybent'],['mod','Moderator'],['mod_sub','Moderator + Subskrybent']];
const rankDescriptions={new:'Widz obserwujący kanał do 7 dni włącznie',regular:'Widz obserwujący kanał powyżej 7 do 30 dni',veteran:'Widz obserwujący kanał powyżej 30 dni'};
let root,access,profiles={},selected='dbd',dirty=false,loaded=false;
const can=p=>access?.role==='admin'||(access?.role==='moderator'&&access.permissions.includes(p));
function allowed(){return can('lobby.config.view')||can('lobby.config.edit');}
function editable(){return can('lobby.config.edit');}
function state(){if(!profiles[selected])profiles[selected]={...defaults,game:selected,limits:{...defaults.limits},slots:games.find(x=>x[0]===selected)?.[2]||5};profiles[selected].new_days=7;profiles[selected].regular_days=30;return profiles[selected];}
// Porownuj wartosci konfiguracji niezaleznie od kolejnosci pol i dodatkowych pol dokumentu.
// Weryfikacja nadal wymaga zgodnosci kazdej zapisanej wartosci.
function configMatches(saved,expected){
 if(expected===null||typeof expected!== 'object')return Object.is(saved,expected);
 if(Array.isArray(expected))return Array.isArray(saved)&&saved.length===expected.length&&expected.every((v,i)=>configMatches(saved[i],v));
 if(!saved||typeof saved!=='object'||Array.isArray(saved))return false;
 return Object.keys(expected).every(k=>Object.prototype.hasOwnProperty.call(saved,k)&&configMatches(saved[k],expected[k]));
}
function msg(t,err=false){const e=root.querySelector('[data-config-msg]');if(e){e.textContent=t;e.className=err?'mlc-message error':'mlc-message';}}
async function load(){try{const {data,error}=await firebaseClient.from('matt_lobby_game_config').select('game,settings');if(error)throw error;profiles={};for(const row of data||[]){const v=row.settings||{};profiles[row.game]={...defaults,...v,new_days:7,regular_days:30,game:row.game,limits:{...defaults.limits,...(v.limits||{})}};}loaded=true;render();}catch(e){loaded=false;render();msg('Nie udało się odczytać konfiguracji z Firebase: '+e.message,true);}}
function field(label,key,min,max,description){const v=state()[key];return `<label class="mlc-field"><span><strong>${label}</strong>${description?`<small>${description}</small>`:''}</span><input data-num="${key}" type="number" min="${min}" max="${max}" step="1" value="${esc(v)}" ${editable()?'':'disabled'}></label>`;}
function toggle(label,key,desc){return `<label class="mlc-toggle"><span><strong>${label}</strong><small>${desc}</small></span><input type="checkbox" data-bool="${key}" ${state()[key]?'checked':''} ${editable()?'':'disabled'}></label>`;}
function render(){if(!root)return;const s=state();root.innerHTML=`<div class="mlc-header"><div><span class="mlc-kicker">MATT LOBBY / USTAWIENIA</span><h2>KONFIGURACJA ROZGRYWEK</h2><p>Profile gier, limity widzów i zasady losowania. Konflikty pozostają bez zmian.</p></div><span class="mlc-icon">🎮</span></div><div class="mlc-body"><div class="mlc-profile"><label>AKTYWNY PROFIL DO EDYCJI<select data-game>${games.map(([id,name])=>`<option value="${id}" ${selected===id?'selected':''}>${name}</option>`).join('')}</select></label><span class="mlc-chip">${loaded?'Dane Firebase':'Wymagana konfiguracja bazy'}</span></div><details class="mlc-section" open><summary><span>🎮</span><strong>Profile gier</strong><small>Liczba graczy i ustawienia gry</small></summary><div class="mlc-fields">${field('Liczba losowanych widzów','slots',1,30,'Nie licząc streamera')}</div></details><details class="mlc-section" open><summary><span>👥</span><strong>Rangi i limity meczów</strong><small>Staż obserwowania oraz VIP + SUB i MOD + SUB</small></summary><div class="mlc-ranks">${ranks.map(([key,name])=>`<label class="mlc-rank"><span><strong>${name}</strong>${rankDescriptions[key]?`<small style="display:block;margin-top:4px;color:#9298a7;font-size:12px;font-weight:400">${rankDescriptions[key]}</small>`:''}</span><span><input type="number" min="0" max="999" step="1" data-limit="${key}" value="${esc(s.limits[key])}" ${editable()?'':'disabled'}> <small>meczów</small></span></label>`).join('')}</div><p class="mlc-hint">Przy kilku rangach stosowany powinien być najwyższy pasujący limit, nie suma limitów. Ta reguła wymaga także aktualizacji Streamer.bot.</p></details><details class="mlc-section"><summary><span>🔀</span><strong>Kolejka i losowanie</strong><small>Otwarcie kolejki, rotacja i przerwy</small></summary><div class="mlc-fields">${toggle('Kolejka otwarta','queue_open','Pozwala widzom dołączać do kolejki')}${toggle('Sprawiedliwa rotacja','fair_rotation','Uwzględnia poprzednie mecze')}${toggle('Uwzględniaj konflikty','conflicts_enabled','Nie łącz skonfliktowanych osób')}${field('Przerwa między meczami','cooldown',0,20,'Liczba losowań do odczekania')}</div></details><details class="mlc-section"><summary><span>⚙</span><strong>Ustawienia zaawansowane</strong><small>Resetowanie limitów i przyszłe rozszerzenia</small></summary><div class="mlc-fields"><label class="mlc-field"><span><strong>Reset limitów</strong><small>Wybierz preferowany tryb</small></span><select data-reset ${editable()?'':'disabled'}><option value="manual" ${s.reset_mode==='manual'?'selected':''}>Ręczny</option><option value="stream" ${s.reset_mode==='stream'?'selected':''}>Po transmisji</option><option value="daily" ${s.reset_mode==='daily'?'selected':''}>Codziennie</option></select></label></div><p class="mlc-hint">Historia losowań, wyjątki dla graczy i tryb wydarzenia wymagają osobnych tabel i zmian w Streamer.bot — nie są jeszcze aktywne.</p></details><div class="mlc-footer"><span data-config-msg role="status" aria-live="polite"></span>${editable()?'<button type="button" class="mlc-save" data-save>ZAPISZ KONFIGURACJĘ</button><button type="button" class="mlc-save" data-sync style="margin-left:8px;background:transparent;border:1px solid currentColor">SYNCHRONIZUJ Z BOTEM</button>':'<span class="mlc-chip">Tylko podgląd</span>'}</div></div>`;
root.querySelector('[data-game]').onchange=e=>{selected=e.target.value;dirty=false;render();};
root.querySelectorAll('[data-num]').forEach(e=>e.onchange=()=>{state()[e.dataset.num]=Number(e.value);profiles[selected]=state();dirty=true;});
root.querySelectorAll('[data-limit]').forEach(e=>e.onchange=()=>{const s=state();s.limits[e.dataset.limit]=Number(e.value);profiles[selected]=s;dirty=true;});
root.querySelectorAll('[data-bool]').forEach(e=>e.onchange=()=>{state()[e.dataset.bool]=e.checked;profiles[selected]=state();dirty=true;});
root.querySelector('[data-reset]').onchange=e=>{state().reset_mode=e.target.value;profiles[selected]=state();dirty=true;};
root.querySelector('[data-save]')?.addEventListener('click',save);
root.querySelector('[data-sync]')?.addEventListener('click',syncBot);
}
async function save(){if(!editable())return;const s=state();if(!Number.isInteger(s.new_days)||!Number.isInteger(s.regular_days)||s.new_days>=s.regular_days||s.new_days<0||s.regular_days>3650||!Number.isInteger(s.slots)||s.slots<1||s.slots>30||!Number.isInteger(s.cooldown)||s.cooldown<0||s.cooldown>20||Object.values(s.limits).some(x=>!Number.isInteger(x)||x<0||x>999)){msg('Sprawdź wartości: progi followage muszą rosnąć, a limity muszą być liczbami całkowitymi.',true);return;}const btn=root.querySelector('[data-save]');btn.disabled=true;try{const {error}=await firebaseClient.from('matt_lobby_game_config').upsert({game:selected,settings:s},{onConflict:'game'});if(error)throw error;const check=await firebaseClient.readLobbyConfigFromServer(selected);if(check.error)throw Error('Zapis wysłany, ale nie można potwierdzić go na serwerze: '+check.error.message);if(!check.data||!configMatches(check.data.settings,s))throw Error('Konfiguracja odczytana z serwera różni się od zapisanej.');dirty=false;loaded=true;msg('Zapisano i potwierdzono konfigurację w Firebase. Możesz teraz kliknąć SYNCHRONIZUJ Z BOTEM.');}catch(e){msg('Błąd zapisu: '+e.message,true);}finally{btn.disabled=false;}}

async function syncBot(){
 if(dirty){msg('Najpierw zapisz zmiany konfiguracji.',true);return;}
 const btn=root.querySelector('[data-sync]');if(!btn)return;
 btn.disabled=true;msg('Wysyłanie żądania synchronizacji…');
 try{
  const result=await firebaseClient.lobbySyncRequest();if(result.error)throw Error(result.error.message);
  const revision=result.data.revision;msg('Oczekiwanie na potwierdzenie lokalnego bota…');
  for(let n=0;n<18;n++){
   await new Promise(resolve=>setTimeout(resolve,5000));
   const check=await firebaseClient.lobbySyncStatus();if(check.error)throw Error(check.error.message);
   const state=check.data||{};
   if(state.revision!==revision){msg('Pojawiło się nowsze żądanie synchronizacji.',true);return;}
   if(state.status==='synced'){msg('Bot potwierdził pobranie danych (losowanie wymaga osobnego testu): '+(state.ackAt||''));return;}
   if(state.status==='error')throw Error(state.error||'Bot zgłosił błąd');
  }
  msg('Bot jeszcze nie potwierdził synchronizacji. Sprawdź, czy akcja 13 w Streamer.bot jest uruchamiana.',true);
 }catch(e){msg('Synchronizacja: '+e.message,true);}finally{if(btn.isConnected)btn.disabled=false;}
}

function decorate(panel,a){access=a;if(!allowed())return;const dashboard=panel.querySelector('.matt-lobby-dashboard');if(!dashboard)return;const tabs=document.createElement('nav');tabs.className='mlc-tabs';tabs.innerHTML='<button type="button" data-mlc-tab="conflicts" class="active">♧ KONFLIKTY</button><button type="button" data-mlc-tab="config">⚙ KONFIGURACJA</button>';const container=document.createElement('section');container.className='mlc-container';container.hidden=true;panel.insertBefore(tabs,dashboard);panel.insertBefore(container,dashboard);root=container;tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{const config=b.dataset.mlcTab==='config';tabs.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));dashboard.hidden=config;container.hidden=!config;if(config){render();if(!loaded)load();}});}
window.MattLobbyConfig={decorate};
})();