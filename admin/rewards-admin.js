(() => {
  const client = window.supabaseClient;
  const root = document.getElementById('rewardsAdminApp');
  if (!client || !root) return;

  const defaults = [
    {title:"Obecny",cost:"10 COINS",category:"ogolne",description:"Nagroda, która pokazuje, że jesteś aktualnie na transmisji.",icon:"🎁"},
    {title:"Wyróżnij moją wiadomość",cost:"100 COINS",category:"ogolne",description:"Podkreśla Twoją wiadomość na chacie.",icon:"💬"},
    {title:"Skip piosenki",cost:"1,5K COINS",category:"ogolne",description:"Pomija aktualnie odtwarzany utwór.",icon:"⏭️"},
    {title:"Banicja",cost:"10K COINS",category:"ogolne",description:"Nakładasz 24h t/o na wybraną osobę.",icon:"🔨"}
  ];

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

  let rows=[];

  async function load(){
    const {data,error}=await client.from('rewards').select('*').order('sort_order');
    rows = [...defaults.map(x=>({...x,localDefault:true})), ...(data||[])];
    render();
  }

  function render(){
    root.innerHTML = `
      <button class="reward-add-main" id="rewardAdd">＋ DODAJ NAGRODĘ</button>
      <div class="reward-admin-list">
      ${rows.map((r,i)=>`
        <article class="reward-admin-item">
          <div>
            <b>${esc(r.title)}</b>
            <span>${esc(r.cost||'')}</span>
            <small>${esc(r.category||'ogolne')}</small>
          </div>
          <div>
            <button data-edit="${i}">✏️ EDYTUJ</button>
            ${r.localDefault?'':'<button data-del="'+i+'">🗑 USUŃ</button>'}
          </div>
        </article>`).join('')}
      </div>
      <div id="rewardForm"></div>`;

    rewardAdd.onclick=()=>form({});
    root.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>form(rows[b.dataset.edit]));
    root.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{
      const r=rows[b.dataset.del];
      await client.from('rewards').delete().eq('id',r.id);
      load();
    });
  }

  function form(r){
    document.getElementById('rewardForm').innerHTML=`
      <div class="reward-form">
      <h3>${r.id?'Edytuj nagrodę':'Nowa nagroda'}</h3>
      <input id="rwTitle" placeholder="Nazwa" value="${esc(r.title)}">
      <input id="rwCost" placeholder="Koszt" value="${esc(r.cost)}">
      <select id="rwCat">
        ${['ogolne','dixper_bingo','dbd','uniwersalne','premium'].map(c=>`<option ${c===r.category?'selected':''}>${c}</option>`).join('')}
      </select>
      <input id="rwIcon" placeholder="Ikona" value="${esc(r.icon)}">
      <textarea id="rwDesc" placeholder="Opis">${esc(r.description)}</textarea>
      <button id="rwSave">ZAPISZ</button>
      </div>`;

    rwSave.onclick=async()=>{
      const obj={title:rwTitle.value,cost:rwCost.value,category:rwCat.value,icon:rwIcon.value,description:rwDesc.value,active:true};
      if(r.id) await client.from('rewards').update(obj).eq('id',r.id);
      else await client.from('rewards').insert(obj);
      load();
    };
  }

  load();
})();
