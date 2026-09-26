(() => {
  const client = window.supabaseClient;
  const root = document.getElementById('rewardsAdminApp');
  if (!client || !root) return;

  const defaults = [
    {title:"Obecny",cost:"10 COINS",category:"ogolne",description:"Nagroda, która pokazuje, że jesteś aktualnie na transmisji.",icon:"🎁"},
    {title:"Wyróżnij moją wiadomość",cost:"100 COINS",category:"ogolne",description:"Podkreśla Twoją wiadomość na chacie.",icon:"💬"},
    {title:"Skip piosenki",cost:"1,5K COINS",category:"ogolne",description:"Pomija aktualnie odtwarzany utwór.",icon:"⏭️"},
    {title:"Banicja",cost:"10K COINS",category:"ogolne",description:"Nakładasz 24h t/o na wybraną osobę.",icon:"🔨"},
    {title:"BINGO — RANDOM",cost:"1K COINS",category:"dixper_bingo",description:"Losowe wydarzenie w Stream Bounty.",icon:"🎰"},
    {title:"BINGO — VOTE",cost:"8K COINS",category:"dixper_bingo",description:"Głosowanie społeczności na wydarzenie.",icon:"🎰"},
    {title:"BINGO ALL",cost:"8K COINS",category:"dixper_bingo",description:"Losowe wydarzenie dla społeczności.",icon:"🎰"},
    {title:"Dixper — Basic Crate",cost:"1,5K COINS",category:"dixper_bingo",description:"Podstawowa skrzynka Dixper.",icon:"📦"},
    {title:"Dixper — Rarity Crate",cost:"3K COINS",category:"dixper_bingo",description:"Skrzynka Rarity Dixper.",icon:"📦"},
    {title:"Dixper — Skill Crate",cost:"4K COINS",category:"dixper_bingo",description:"Skrzynka Skill Dixper.",icon:"🧰"},
    {title:"Random perk — surv",cost:"5K COINS",category:"dbd",description:"Losowy build na survivora w DBD.",icon:"🎯"},
    {title:"Random perk — killer",cost:"6K COINS",category:"dbd",description:"Losowy build na killera w DBD.",icon:"🔪"},
    {title:"Przetestuj build",cost:"10K COINS",category:"dbd",description:"Matt gra wybranym buildem.",icon:"🧪"},
    {title:"1 vs 1",cost:"15K COINS",category:"uniwersalne",description:"Nagroda uniwersalna do gier.",icon:"⚔️"},
    {title:"Wybierz w co gramy",cost:"50K COINS",category:"uniwersalne",description:"Wybór gry na transmisję.",icon:"🎮"},
    {title:"Podpis profilu Steam",cost:"15K COINS",category:"premium",description:"Personalizowany podpis Steam.",icon:"✍️"},
    {title:"SPAM like / serduszek",cost:"20K COINS",category:"premium",description:"Dostajesz spam reakcji.",icon:"❤️"},
    {title:"Ban na słowo",cost:"25K COINS",category:"premium",description:"Bon za użycie słowa.",icon:"🚫"},
    {title:"SUBIK",cost:"80K COINS",category:"premium",description:"Subskrypcja kanału.",icon:"⭐"}
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
    let data = [];
    let error = null;
    try {
      let res = await client.from('rewards').select('*').order('sort_order',{ascending:true});
      data = res.data || [];
      error = res.error;
      if (error && String(error.message||'').includes('sort_order')) {
        res = await client.from('rewards').select('*');
        data = res.data || [];
        error = res.error;
      }
    } catch(e) {
      error = e;
    }
    if(error) console.error('[REWARDS ADMIN]', error);

    const db=data||[];

    // Jednorazowe utworzenie bazy nagród.
    // Później Supabase jest źródłem prawdy: usunięta nagroda nie wróci.
    if(db.length===0){
      const inserted = await client.from('rewards').insert(
        defaults.map((x,i)=>({...x,is_default:true,active:true,sort_order:i}))
      );
      if (inserted.error) {
        console.error('[REWARDS SEED]', inserted.error);
      }
      const refreshed=await client.from('rewards').select('*').order('sort_order',{ascending:true});
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
      if(r.is_default){
        alert('To jest domyślna nagroda systemowa. Możesz ją edytować, ale nie można jej usunąć.');
        return;
      }
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
      let result;
      if(r.id) result = await client.from('rewards').update(obj).eq('id',r.id);
      else result = await client.from('rewards').insert(obj);
      if(result.error){
        console.error('[REWARDS SAVE]', result.error);
        alert('Błąd zapisu nagrody: ' + result.error.message);
        return;
      }
      load();
    };
    document.getElementById('rwCancel').onclick=render;
  }

  load();
})();