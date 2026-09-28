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
      ${Object.entries(categories).map(([cat,title])=>{
        const items=rows.map((r,i)=>({r,i})).filter(x=>x.r.category===cat);
        if(!items.length) return '';
        return `
        <section class="reward-admin-category">
          <h3>${title}</h3>
          ${items.map(({r,i})=>`
          <article class="reward-admin-item">
            <div class="reward-admin-info">
              <b>${esc(r.icon||'🎁')} ${esc(r.title)}</b>
              <span>${esc(r.cost||'')}</span>
            </div>
            <div class="reward-actions">
              <button data-edit="${i}">✏️ EDYTUJ</button>
              <button data-del="${i}">🗑 USUŃ</button>
            </div>
          </article>`).join('')}
        </section>`;
      }).join('')}
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
    const modal=document.querySelector('.cms-modal');
    const modalTitle=document.getElementById('cms-modal-title');
    if(modal){
      modal.classList.add('reward-full-editor');
    }
    if(modalTitle) modalTitle.textContent = r.id ? 'EDYTUJ NAGRODĘ' : 'DODAJ NAGRODĘ';
    document.getElementById('rewardForm').innerHTML=`
    <div class="reward-editor-page">
      <div class="reward-preview-box">
        <small>PODGLĄD NA ŻYWO</small>
        <h3>TAK NAGRODA BĘDZIE WYGLĄDAŁA NA STRONIE</h3>
        <article class="reward-card-preview">
          <div id="rwLiveImage">${r.image?`<img src="${esc(r.image)}">`:esc(r.icon||"🎁")}</div>
          <strong id="rwLiveTitle">${esc(r.title||"Nowa nagroda")}</strong>
          <span id="rwLiveCost">${esc(r.cost||"0 COINS")}</span>
          <p id="rwLiveDesc">${esc(r.description||"Opis nagrody")}</p>
        </article>
      </div>

      <div class="reward-grid modern">
        <label>Nazwa nagrody<input id="rwTitle" value="${esc(r.title)}"></label>
        <label>Koszt<input id="rwCost" value="${esc(r.cost)}"></label>
        <label>Kategoria>
          <select id="rwCat">${Object.entries(categories).map(([k,v])=>`<option value="${k}" ${k===r.category?'selected':''}>${v}</option>`).join('')}</select>
        </label>
        <label>Ikona / emoji<input id="rwIcon" value="${esc(r.icon||"🎁")}"></label>
      </div>

      <label>Opis nagrody<textarea id="rwDesc">${esc(r.description)}</textarea></label>

      <div class="reward-image-editor">
        <h3>Grafika nagrody</h3>
        <input type="file" id="rwImage" accept="image/png,image/jpeg,image/webp,image/gif">
        <div class="zoom-controls">
          <label>Przybliżenie (%) <input type="range" id="rwZoom" min="50" max="250" value="100"><input type="number" value="100" id="rwZoomNumber"></label>
          <label>Przesunięcie X (px) <input type="number" id="rwX" value="0"></label>
          <label>Przesunięcie Y (px) <input type="number" id="rwY" value="0"></label>
        </div>
        <button id="rwRemoveImage" type="button">USUŃ GRAFIKĘ</button>
      </div>

      <div class="reward-actions">
        <button id="rwBack" type="button">← WRÓĆ</button>
        <button id="rwSave" type="button">ZAPISZ NAGRODĘ</button>
      </div>
    </div>`;

    if(!document.getElementById('rewardEditorStyle')){
      const st=document.createElement('style');
      st.id='rewardEditorStyle';
      st.textContent=`
      .cms-modal.reward-full-editor{
        width:min(1200px,96vw)!important;
        max-height:95vh!important;
      }
      .cms-modal.reward-full-editor .cms-modal-body{
        overflow-y:auto;
      }
      .reward-editor-page{
        display:flex;flex-direction:column;gap:24px;padding:4px 0}
      .reward-editor-page h3{font-size:22px}
      .reward-editor-page .reward-preview-box{
        min-height:220px
      }
      .reward-preview-box,.reward-image-editor{background:#15151b;border:1px solid #34343c;border-radius:18px;padding:24px}
      .reward-editor-page .reward-grid{background:#101015;border:1px solid #2f3038;border-radius:18px;padding:22px}
      .reward-editor-page .reward-grid label{font-size:13px;font-weight:700}
      .reward-editor-page .reward-image-editor{display:flex;flex-direction:column;gap:16px}
      .reward-editor-page .reward-actions{border-top:1px solid #303038;padding-top:20px;position:sticky;bottom:0;background:#101015}
      .reward-editor-page input,.reward-editor-page select,.reward-editor-page textarea{font-size:15px}
      .reward-editor-page .reward-preview-box img{transition:.2s}

      .reward-preview-box small{color:#ff3344}.reward-preview-box h3{margin:8px 0 20px}
      .reward-card-preview{position:relative;padding:20px;background:#18181d;border:1px solid #52242b;border-radius:14px;min-height:120px}
      #rwLiveImage img{width:70px;height:70px;object-fit:cover;border-radius:15px}
      #rwLiveImage{font-size:50px}.reward-card-preview strong{display:block;margin-top:10px}
      .reward-grid.modern{display:grid;grid-template-columns:1fr 1fr;gap:16px}
      .reward-editor-page label{display:flex;flex-direction:column;gap:8px;color:#bbb}
      .reward-editor-page input,.reward-editor-page select,.reward-editor-page textarea{background:#08090c;color:#fff;border:1px solid #333;border-radius:10px;padding:13px}
      .reward-editor-page textarea{min-height:130px}
      .zoom-controls{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:15px 0}
      .zoom-controls input[type=range]{accent-color:#ff3344;height:8px}
      .reward-card-preview{overflow:hidden}

      .reward-admin-category{background:#101015;border:1px solid #2f3038;border-radius:16px;padding:18px;margin-bottom:16px}.reward-admin-category h3{margin:0 0 14px;color:#fff;font-size:18px}.reward-admin-category .reward-admin-item{margin-bottom:10px}\n      .reward-actions{display:flex;justify-content:flex-end;gap:12px}
      .reward-actions button,.reward-image-editor button{padding:12px 20px;border-radius:10px;border:1px solid #555;background:#17171d;color:#fff}
      #rwSave{background:#f22;color:white;border:0}
      @media(max-width:700px){.reward-grid.modern,.zoom-controls{grid-template-columns:1fr}}
      `;
      document.head.appendChild(st);
    }

    let image=r.image||"";
    let removed=false;
    const updatePreview=()=>{ 
      rwLiveTitle.textContent=rwTitle.value||"Nowa nagroda";
      rwLiveCost.textContent=rwCost.value||"0 COINS";
      rwLiveDesc.textContent=rwDesc.value||"Opis nagrody";
      const img=document.querySelector("#rwLiveImage img");
      if(img){img.style.transform=`translate(${rwX.value}px,${rwY.value}px) scale(${rwZoom.value/100})`;}
    };
    document.querySelectorAll('#rwTitle,#rwCost,#rwDesc,#rwZoom,#rwX,#rwY').forEach(e=>e.oninput=updatePreview);
    rwZoom.oninput=()=>{rwZoomNumber.value=rwZoom.value;updatePreview()};
    rwZoomNumber.oninput=()=>{rwZoom.value=rwZoomNumber.value;updatePreview()};
    rwImage.onchange=()=>{const f=rwImage.files[0];if(f){image=URL.createObjectURL(f);rwLiveImage.innerHTML=`<img src="${image}">`;removed=false;updatePreview();}};
    rwRemoveImage.onclick=()=>{image="";removed=true;rwLiveImage.innerHTML=rwIcon.value||"🎁";};

    rwSave.onclick=async()=>{
      const file=rwImage.files[0];
      if(file){
        const name=`reward-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g,"")}`;
        const up=await client.storage.from("rewards").upload(name,file,{upsert:true});
        if(up.error)return alert(up.error.message);
        image=client.storage.from("rewards").getPublicUrl(name).data.publicUrl;
      }
      const obj={title:rwTitle.value,cost:rwCost.value,category:rwCat.value,icon:rwIcon.value,image:removed?"":image,description:rwDesc.value,active:true};
      const res=r.id?await client.from("rewards").update(obj).eq("id",r.id):await client.from("rewards").insert(obj);
      if(res.error)return alert(res.error.message);
      load();
    };
    rwBack.onclick=()=>{
      const modal=document.querySelector('.cms-modal');
      const modalTitle=document.getElementById('cms-modal-title');
      if(modal) modal.classList.remove('reward-full-editor');
      if(modalTitle) modalTitle.textContent='NAGRODY';
      render();
    };
  }

  load();
})();