// Backup bezpieczeństwa przed każdą zmianą eventów. Funkcja działa tylko dla administratora.
async function mattEventSafetyBackup(label){
  if(window.currentUserIsAdmin !== true) throw new Error('Brak uprawnień administratora.');
  if(!window.MattCMS?.createBackup) throw new Error('Moduł backupu nie jest dostępny. Uruchom CMS_UPDATE_BACKUP.sql w Supabase.');
  return window.MattCMS.createBackup(label);
}

// Czytelne nazwy grafik zamiast długich nazw/UUID.
// Nazwa w Storage jest zrozumiała, a w formularzu pokazujemy prostą etykietę.
function mattSafeSlug(value){
  return String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'')
    .slice(0,48) || 'event';
}

function mattFileExtension(file){
  const name=String(file?.name || '');
  const match=name.match(/\.([a-zA-Z0-9]{1,8})$/);
  if(match) return match[1].toLowerCase();
  const mime=String(file?.type || '').split('/')[1] || 'jpg';
  return mime.replace(/[^a-z0-9]/gi,'').toLowerCase() || 'jpg';
}

function mattEventImageStorageName(file,title,dateValue){
  const titleSlug=mattSafeSlug(title);
  const date=String(dateValue || new Date().toISOString().slice(0,10));
  const now=new Date();
  const hh=String(now.getHours()).padStart(2,'0');
  const mm=String(now.getMinutes()).padStart(2,'0');
  return `event-${titleSlug}-${date}-${hh}${mm}.${mattFileExtension(file)}`;
}

function mattFriendlyImageLabel(file,title){
  if(!file) return 'Nie wybrano pliku';
  const cleanTitle=String(title || '').trim() || 'event';
  return `Grafika: ${cleanTitle}.${mattFileExtension(file)}`;
}

(() => {

let isAdmin = false;

async function checkAdmin(){
  try{
    const {data:{session}} = await supabaseClient.auth.getSession();

    if(!session){
      isAdmin=false;
      hideAddButton();
      return;
    }

    const {data:profile}=await supabaseClient
      .from("profiles")
      .select("role")
      .eq("email",session.user.email)
      .maybeSingle();

    isAdmin = profile?.role === "admin";
    window.currentUserIsAdmin = isAdmin;
    window.dispatchEvent(new CustomEvent("matt-auth-change",{detail:{isAdmin}}));

    if(isAdmin) showAddButton();
    else hideAddButton();

  }catch(e){
    console.error("Admin check error",e);
    hideAddButton();
  }
}

function getAddButton(){
  return document.getElementById("addEventButton");
}

function hideAddButton(){
  const btn=getAddButton();
  if(btn){
    btn.style.display="none";
    btn.hidden=true;
  }
}

function showAddButton(){
  const btn=getAddButton();
  if(btn){
    btn.style.display="inline-flex";
    btn.hidden=false;
  }
}

function initEvents(){

 const modal=document.getElementById("eventModal");
 const close=document.getElementById("closeEvent");
 const save=document.getElementById("saveEvent");

 // delegacja - działa nawet gdy przycisk pojawi się później
 document.addEventListener("click",(e)=>{
   const btn=e.target.closest("#addEventButton");

   if(btn){
      e.preventDefault();

      if(!isAdmin){
        return;
      }

      if(modal){
        modal.style.display="flex";
      }
   }
 });

 if(close){
   close.onclick=()=>modal.style.display="none";
 }

 if(save){
 save.onclick=async()=>{

   if(!isAdmin){
     alert("Brak uprawnień");
     return;
   }

   const msg=document.getElementById("eventMsg");
   try{
     await mattEventSafetyBackup('AUTO: przed dodaniem eventu');
   }catch(error){
     if(msg) msg.textContent='Nie utworzono kopii bezpieczeństwa. Dodawanie anulowane: '+error.message;
     return;
   }
   const file=document.getElementById("eventImage")?.files[0];
   let image="";

   if(file){
     const name=mattEventImageStorageName(
       file,
       document.getElementById("eventTitle")?.value,
       document.getElementById("eventStart")?.value
     );
     const upload=await supabaseClient.storage.from("events").upload(name,file);

     if(upload.error){
       msg.textContent=upload.error.message;
       return;
     }

     image=supabaseClient.storage
       .from("events")
       .getPublicUrl(name).data.publicUrl;
   }

   const combine=(date,time)=>{
      const d=document.getElementById(date)?.value;
      const t=document.getElementById(time)?.value || "00:00";
      return d ? `${d}T${t}:00` : null;
   };

   const start=combine("eventStart","eventStartTime");
   const end=combine("eventEnd","eventEndTime");
   const manualEnded=document.getElementById("eventEndedManual")?.checked;

   // Przy ręcznym oznaczeniu zakończenia ustawiamy datę zakończenia na dziś
   const finalEnd = manualEnded ? new Date().toISOString() : end;
   const publish=combine("eventPublish","eventPublishTime");

   const {error}=await supabaseClient.from("events").insert({
      title:document.getElementById("eventTitle").value,
      description:document.getElementById("eventDesc").value,
      start_date:start,
      end_date:finalEnd,
      publish_date:publish,
      image_url:image,
      image_fit:"contain"
   });

   msg.textContent=error ? error.message : "Dodano event";

   if(!error){
     setTimeout(()=>location.reload(),800);
   }
 };
 }

}

function setDefaultPublishDate(){
 const input=document.getElementById("eventPublish");
 const time=document.getElementById("eventPublishTime");
 const now=new Date();
 if(input && !input.value){
   input.value=now.toISOString().slice(0,10);
 }
 if(time && time.value==="00:00"){
   time.value=now.toTimeString().slice(0,5);
 }
}


function initPickerIcons(){
 document.querySelectorAll(".picker-icon").forEach(icon=>{
   icon.addEventListener("click",()=>{
     const wrapper=icon.closest(".input-icon");
     const input=wrapper?.querySelector("input");
     if(!input) return;
     if(typeof input.showPicker === "function"){
       input.showPicker();
     }else{
       input.focus();
     }
   });
 });
}

document.addEventListener("DOMContentLoaded",()=>{
 setDefaultPublishDate();
 initPickerIcons();
 initEvents();
 checkAdmin();

 // Aktualizacja stanu po zmianie logowania bez ponownego odpytywania Supabase.
 // Nie wywołujemy tutaj checkAdmin(), bo checkAdmin sam emituje matt-auth-change.
 window.addEventListener("matt-auth-change",(event)=>{
   isAdmin = event.detail?.isAdmin === true;
   if(isAdmin) showAddButton(); else hideAddButton();
 });
});

})();

// Custom calendar/time buttons
document.addEventListener("click", function(e){
 const btn=e.target.closest(".date-trigger, .time-trigger");
 if(!btn) return;
 const wrapper=btn.closest(".input-icon");
 const input=wrapper?.querySelector("input");
 if(!input) return;
 if(typeof input.showPicker==="function"){
   input.showPicker();
 }else{
   input.focus();
   input.click();
 }
});

// Edycja eventów dla administratora
(() => {
function admin(){ 
 return window.currentUserIsAdmin === true; 
}

async function openEdit(id){
 if(!admin()) return;
 const editEventModal = document.getElementById("editEventModal");
 const editEventId = document.getElementById("editEventId");
 const editEventTitle = document.getElementById("editEventTitle");
 const editEventDesc = document.getElementById("editEventDesc");
 const {data}=await supabaseClient.from("events").select("*").eq("id",id).single();
 if(!data) return;
 editEventId.value=data.id;
 editEventTitle.value=data.title||"";
 editEventDesc.value=data.description||"";
 const preview=document.getElementById("editEventPreviewImg");
 const previewBox=document.getElementById("editEventPreviewImg")?.parentElement;
 if(preview && data.image_url){
   preview.src=data.image_url;
   previewBox.style.display="block";
 }
 const name=document.getElementById("editEventImageName");
 if(name) name.textContent="Aktualna grafika eventu";
 if(document.getElementById("editEventImageFit")) {
  document.getElementById("editEventImageFit").value=data.image_fit||"contain";
  applyEditPreviewFit();
 }
 const mainPreview=document.getElementById("editMainPreviewImg");
 const mainBox=document.getElementById("editMainPreviewImg")?.parentElement;
 if(mainPreview && data.image_url){
   mainPreview.src=data.image_url;
   if(mainBox) mainBox.style.display="block";
 }
 if(document.getElementById("editEventMainImageFit")){
   document.getElementById("editEventMainImageFit").value=data.main_image_fit||"contain";
 }
 const setDT=(val,dateId,timeId)=>{
   const dateEl=document.getElementById(dateId);
   const timeEl=document.getElementById(timeId);
   if(!dateEl || !timeEl) return;

   if(!val){
     dateEl.value="";
     timeEl.value="";
     return;
   }

   const d=new Date(val);
   if(Number.isNaN(d.getTime())){
     console.warn("Niepoprawna data eventu:", val);
     dateEl.value="";
     timeEl.value="";
     return;
   }

   // lokalny czas zamiast UTC (unikamy przesunięć godzin)
   const pad=n=>String(n).padStart(2,"0");
   dateEl.value=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
   timeEl.value=`${pad(d.getHours())}:${pad(d.getMinutes())}`;
 };
 setDT(data.start_date,"editEventStart","editEventStartTime");
 setDT(data.end_date,"editEventEnd","editEventEndTime");
 setDT(data.publish_date,"editEventPublish","editEventPublishTime");
 if(editEventModal) editEventModal.style.display="flex";
}
document.addEventListener("click",async e=>{
 const b=e.target.closest(".edit-event-btn");
 if(b){ e.preventDefault(); e.stopPropagation(); openEdit(b.dataset.id); return; }
 const del=e.target.closest(".delete-event-btn");
 if(del){
  e.preventDefault(); e.stopPropagation();
  if(!admin()) return;
  const title=del.dataset.title || "ten event";
  if(!confirm(`Czy na pewno usunąć event „${title}”? Operację można później cofnąć z backupu.`)) return;
  del.disabled=true;
  try{
    await mattEventSafetyBackup(`AUTO: przed usunięciem eventu — ${title}`);
  }catch(error){
    alert('Usuwanie anulowane, ponieważ nie udało się utworzyć backupu: '+error.message);
    del.disabled=false;
    return;
  }
  const {error}=await supabaseClient.from("events").delete().eq("id",del.dataset.id);
  if(error){ alert("Nie udało się usunąć eventu: "+error.message); del.disabled=false; return; }
  if(location.hash.startsWith("#/events/")) location.hash="#/events";
  else if(typeof window.render==="function") window.render();
  else location.reload();
 }
});
function updateEditButtons(){
 const allowed = window.currentUserIsAdmin === true;
 document.querySelectorAll(".edit-event-btn, .delete-event-btn").forEach(x=>{
  if(allowed){
    x.style.display="inline-flex";
    x.hidden=false;
  }else{
    x.style.display="none";
    x.hidden=true;
  }
 });
}
window.updateEditButtons=updateEditButtons;
window.addEventListener("matt-auth-change",updateEditButtons);
window.addEventListener("matt-events-rendered",updateEditButtons);
document.addEventListener("DOMContentLoaded",updateEditButtons);
document.getElementById("closeEditEvent")?.addEventListener("click",()=>{
 const modal=document.getElementById("editEventModal");
 if(modal) modal.style.display="none";
});
document.getElementById("saveEditEvent")?.addEventListener("click",async()=>{
 if(!admin()) return;
 const msg=document.getElementById("editEventMsg");
 try{
  await mattEventSafetyBackup(`AUTO: przed edycją eventu — ${document.getElementById('editEventTitle')?.value || 'event'}`);
 }catch(error){
  if(msg) msg.textContent='Edycja anulowana, ponieważ nie udało się utworzyć backupu: '+error.message;
  return;
 }
 let image;
 const file=editEventImage.files[0];
 if(file){
  const name=mattEventImageStorageName(
    file,
    document.getElementById("editEventTitle")?.value,
    document.getElementById("editEventStart")?.value
  );
  await supabaseClient.storage.from("events").upload(name,file);
  image=supabaseClient.storage.from("events").getPublicUrl(name).data.publicUrl;
 }
 const combine=(d,t)=>{let a=document.getElementById(d).value,b=document.getElementById(t).value||"00:00";return a?`${a}T${b}:00`:null};
 const upd={title:editEventTitle.value,description:editEventDesc.value,start_date:combine("editEventStart","editEventStartTime"),end_date:combine("editEventEnd","editEventEndTime"),publish_date:combine("editEventPublish","editEventPublishTime"), image_fit:document.getElementById("editEventImageFit")?.value || "contain", main_image_fit:document.getElementById("editEventMainImageFit")?.value || "contain"};
 if(image) upd.image_url=image;
 const {error}=await supabaseClient.from("events").update(upd).eq("id",editEventId.value);
 if(msg) msg.textContent=error?error.message:"Zapisano";
 if(!error)setTimeout(()=>location.reload(),700);
});
})();


function applyEditPreviewFit(){
 const img=document.getElementById("editEventPreviewImg");
 const select=document.getElementById("editEventImageFit");
 if(!img || !select) return;
 img.style.objectFit=select.value;
 img.style.objectPosition="center";
}

document.addEventListener("DOMContentLoaded",()=>{
 const input=document.getElementById("editEventImage");
 const select=document.getElementById("editEventImageFit");
 if(select) select.addEventListener("change",applyEditPreviewFit);
 const mainSelect=document.getElementById("editEventMainImageFit");
 if(mainSelect) mainSelect.addEventListener("change",()=>{const img=document.getElementById("editMainPreviewImg"); if(img) img.style.objectFit=mainSelect.value;});
 if(input){
  input.addEventListener("change",()=>{
   const file=input.files[0];
   const name=document.getElementById("editEventImageName");
   const img=document.getElementById("editEventPreviewImg");
   const box=document.getElementById("editEventImagePreview");
   if(!file) return;
   if(name) name.textContent=mattFriendlyImageLabel(file, document.getElementById("editEventTitle")?.value);
   const reader=new FileReader();
   reader.onload=e=>{
    if(img){img.src=e.target.result; box.style.display="block"; applyEditPreviewFit();}
   };
   reader.readAsDataURL(file);
  });
 }
});

function renderEditButtons(){
 document.querySelectorAll(".detailEditEventSlot").forEach(slot=>{
  if(window.currentUserIsAdmin){
   const title=(slot.dataset.eventTitle||"").replace(/"/g,"&quot;");
   slot.innerHTML=`<button class="edit-event-btn login-submit" data-id="${slot.dataset.eventId}">✎ EDYTUJ EVENT</button><button class="delete-event-btn cms-event-delete" data-id="${slot.dataset.eventId}" data-title="${title}">🗑 USUŃ EVENT</button>`;
  } else slot.innerHTML="";
 });
}
window.addEventListener("matt-auth-change",renderEditButtons);
window.addEventListener("matt-event-detail-rendered",renderEditButtons);
document.addEventListener("DOMContentLoaded",renderEditButtons);

document.addEventListener("DOMContentLoaded",()=>{
 const eventImageInput=document.getElementById("eventImage");
 if(eventImageInput){
  eventImageInput.addEventListener("change",()=>{
   const file=eventImageInput.files[0];
   const name=document.getElementById("eventImageName");
   const preview=document.getElementById("eventImagePreview");
   const img=preview?.querySelector("img");
   if(!file){ if(name) name.textContent="Nie wybrano pliku"; if(preview) preview.style.display="none"; return; }
   if(name) name.textContent=mattFriendlyImageLabel(file, document.getElementById("eventTitle")?.value);
   const reader=new FileReader();
   reader.onload=e=>{if(img){img.src=e.target.result;preview.style.display="block";}};
   reader.readAsDataURL(file);
  });
 }
});

