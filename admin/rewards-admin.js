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

  const categories = {
    ogolne:"OGÓLNE",
    dixper_bingo:"DIXPER ORAZ STREAM BOUNTY (BINGO)",
    dbd:"NAGRODY ZWIĄZANE Z DBD",
    uniwersalne:"NAGRODY UNIWERSALNE DO GIER",
    premium:"NAGRODY PREMIUM"
  };

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

  let rows=[];

  async function load(){
    const {data,error}=await client.from('rewards').select('*').order('sort_order',{ascending:true});
    if(error) console.error(error);

    const db=data||[];
    const existing=new Set(db.map(x=>x.title));
    const missing=defaults.filter(x=>!existing.has(x.title));

    if(missing.length){
      await client.from('rewards').insert(missing.map((x,i)=>({...x,active:true,sort_order:i})));
      const refreshed=await client.from('rewards').select('*').order('sort_order');
      rows=refreshed.data||[];
    } else {
      rows=db;
    }
    render();
  }

  function render(){
    root.innerHTML=`
      <div class="reward-admin-header">
        <button class="reward-add-main" id="rewardAdd">＋ DODAJ NAGRODĘ</button>
      </div>

      <div class="reward-admin-list">
      ${rows.map((r,i)=>`
        <article class="reward-admin-item">
          <div class="reward-admin-info">
            <b>${esc(r.icon||'🎁')} ${esc(r.title)}</b>
            <span>${esc(r.cost||'')}</span>
            <small>${esc(categories[r.category]||r.category||'OGÓLNE')}</small>
          </div>
          <div class="reward-actions">
            <button data-edit="${i}">✏️ EDYTUJ</button>
            <button data-del="${i}">🗑 USUŃ</button>
          </div>
        </article>`).join('')}
      </div>
      <div id="rewardForm"></div>`;

    document.getElementById('rewardAdd').onclick=()=>form({});
    root.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>form(rows[b.dataset.edit]));
    root.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{
      const r=rows[b.dataset.del];
      if(confirm('Usunąć nagrodę?')){
        await client.from('rewards').delete().eq('id',r.id);
        load();
      }
    });
  }

  function form(r){
    document.getElementById('rewardForm').innerHTML=`
    <div class="reward-form">
      <h3>${r.id?'EDYCJA NAGRODY':'NOWA NAGRODA'}</h3>
      <input id="rwTitle" placeholder="Nazwa" value="${esc(r.title)}">
      <input id="rwCost" placeholder="Koszt" value="${esc(r.cost)}">
      <select id="rwCat">
        ${Object.entries(categories).map(([k,v])=>`<option value="${k}" ${k===r.category?'selected':''}>${v}</option>`).join('')}
      </select>
      <input id="rwIcon" placeholder="Ikona" value="${esc(r.icon)}">
      <textarea id="rwDesc" placeholder="Opis">${esc(r.description)}</textarea>
      <button id="rwSave">ZAPISZ</button>
      <button id="rwCancel">ANULUJ</button>
    </div>`;

    document.getElementById('rwSave').onclick=async()=>{
      const obj={
        title:rwTitle.value,
        cost:rwCost.value,
        category:rwCat.value,
        icon:rwIcon.value,
        description:rwDesc.value,
        active:true
      };
      if(r.id) await client.from('rewards').update(obj).eq('id',r.id);
      else await client.from('rewards').insert(obj);
      load();
    };
    document.getElementById('rwCancel').onclick=render;
  }

  load();
})();