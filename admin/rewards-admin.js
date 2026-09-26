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
    <div class="reward-form modern">
      <div class="reward-form-title">
        <h3>${r.id?'EDYCJA NAGRODY':'NOWA NAGRODA'}</h3>
        <span>Dodaj grafikę, ustaw kategorię i opisz nagrodę</span>
      </div>

      <div class="reward-grid">
        <label>Nazwa nagrody
          <input id="rwTitle" placeholder="np. Wybierz grę" value="${esc(r.title)}">
        </label>

        <label>Koszt
          <input id="rwCost" placeholder="np. 5000 COINS" value="${esc(r.cost)}">
        </label>

        <label>Kategoria
          <select id="rwCat">
            ${Object.entries(categories).map(([k,v])=>`<option value="${k}" ${k===r.category?'selected':''}>${v}</option>`).join('')}
          </select>
        </label>

        <label>Ikona awaryjna
          <input id="rwIcon" placeholder="🎁" value="${esc(r.icon)}">
        </label>
      </div>

      <label class="full">Opis nagrody
        <textarea id="rwDesc" placeholder="Opis dla widza">${esc(r.description)}</textarea>
      </label>

      <div class="reward-upload-box">
        <strong>Grafika nagrody</strong>
        <p>PNG, JPG lub WEBP</p>
        <input type="file" id="rwImage" accept="image/png,image/jpeg,image/webp">
        <div id="rwPreview" class="reward-image-preview">
          ${r.image?`<img src="${esc(r.image)}">`:esc(r.icon||"🎁")}
        </div>
      </div>

      <div class="reward-form-actions">
        <button id="rwSave">💾 ZAPISZ</button>
        <button id="rwCancel">ANULUJ</button>
      </div>
    </div>`;

    if(!document.getElementById('rewardModernStyle')){
      const style=document.createElement('style');
      style.id='rewardModernStyle';
      style.textContent=`
      .reward-form.modern{margin-top:25px;padding:25px;border:1px solid #333;border-radius:18px;background:#15151b}
      .reward-form-title h3{margin:0 0 8px;font-size:22px}
      .reward-form-title span{color:#aaa}
      .reward-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:20px}
      .reward-form label{display:flex;flex-direction:column;gap:8px;color:#ddd;font-size:14px}
      .reward-form input,.reward-form select,.reward-form textarea{background:#0e0e12;border:1px solid #444;color:#fff;padding:12px;border-radius:10px}
      .reward-form textarea{min-height:120px;resize:vertical;margin-top:16px}
      .reward-upload-box{margin-top:20px;padding:18px;border:1px dashed #555;border-radius:14px}
      .reward-upload-box p{color:#999}
      .reward-image-preview{margin-top:15px;width:90px;height:90px;border-radius:18px;background:#222;display:flex;align-items:center;justify-content:center;font-size:42px;overflow:hidden}
      .reward-image-preview img{width:100%;height:100%;object-fit:cover}
      .reward-form-actions{display:flex;gap:12px;margin-top:20px}
      .reward-form-actions button{padding:12px 20px;border-radius:10px;border:0;background:#ef2938;color:#fff;cursor:pointer}
      @media(max-width:700px){.reward-grid{grid-template-columns:1fr}}
      `;
      document.head.appendChild(style);
    }

    const imgInput=document.getElementById('rwImage');
    imgInput?.addEventListener('change',()=>{
      const file=imgInput.files[0];
      if(file) document.getElementById('rwPreview').innerHTML=`<img src="${URL.createObjectURL(file)}">`;
    });

    document.getElementById('rwSave').onclick=async()=>{
      let image=r.image||"";
      const file=imgInput?.files?.[0];

      if(file){
        const name=`reward-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g,"")}`;
        const upload=await client.storage.from("rewards").upload(name,file,{upsert:true});
        if(upload.error){
          alert("Błąd grafiki: "+upload.error.message);
          return;
        }
        image=client.storage.from("rewards").getPublicUrl(name).data.publicUrl;
      }

      const obj={
        title:rwTitle.value,
        cost:rwCost.value,
        category:rwCat.value,
        icon:rwIcon.value,
        image:image,
        description:rwDesc.value,
        active:true
      };

      let result=r.id
        ? await client.from('rewards').update(obj).eq('id',r.id)
        : await client.from('rewards').insert(obj);

      if(result.error){
        alert('Błąd zapisu nagrody: '+result.error.message);
        return;
      }
      load();
    };

    document.getElementById('rwCancel').onclick=render;
  }

  load();
})();