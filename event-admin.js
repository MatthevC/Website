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
   const file=document.getElementById("eventImage")?.files[0];
   let image="";

   if(file){
     const name=Date.now()+"_"+file.name;
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
      image_url:image
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

 // ponowne sprawdzenie po logowaniu bez odświeżania
 window.addEventListener("matt-auth-change",checkAdmin);
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
function admin(){ return window.currentUserIsAdmin === true; }

async function openEdit(id){
 if(!admin()) return;
 const {data}=await supabaseClient.from("events").select("*").eq("id",id).single();
 if(!data) return;
 editEventId.value=data.id;
 editEventTitle.value=data.title||"";
 editEventDesc.value=data.description||"";
 const setDT=(val,dateId,timeId)=>{
   if(!val)return;
   let d=new Date(val);
   document.getElementById(dateId).value=d.toISOString().slice(0,10);
   document.getElementById(timeId).value=d.toTimeString().slice(0,5);
 };
 setDT(data.start_date,"editEventStart","editEventStartTime");
 setDT(data.end_date,"editEventEnd","editEventEndTime");
 setDT(data.publish_date,"editEventPublish","editEventPublishTime");
 editEventModal.style.display="flex";
}
document.addEventListener("click",e=>{
 const b=e.target.closest(".edit-event-btn");
 if(b) openEdit(b.dataset.id);
});
window.addEventListener("matt-auth-change",()=>{
 document.querySelectorAll(".edit-event-btn").forEach(x=>{
  x.style.display=window.currentUserIsAdmin?"inline-flex":"none";
 });
});
document.getElementById("closeEditEvent")?.addEventListener("click",()=>editEventModal.style.display="none");
document.getElementById("saveEditEvent")?.addEventListener("click",async()=>{
 if(!admin()) return;
 let image;
 const file=editEventImage.files[0];
 if(file){
  const name=Date.now()+"_"+file.name;
  await supabaseClient.storage.from("events").upload(name,file);
  image=supabaseClient.storage.from("events").getPublicUrl(name).data.publicUrl;
 }
 const combine=(d,t)=>{let a=document.getElementById(d).value,b=document.getElementById(t).value||"00:00";return a?`${a}T${b}:00`:null};
 const upd={title:editEventTitle.value,description:editEventDesc.value,start_date:combine("editEventStart","editEventStartTime"),end_date:combine("editEventEnd","editEventEndTime"),publish_date:combine("editEventPublish","editEventPublishTime")};
 if(image) upd.image_url=image;
 const {error}=await supabaseClient.from("events").update(upd).eq("id",editEventId.value);
 editEventMsg.textContent=error?error.message:"Zapisano";
 if(!error)setTimeout(()=>location.reload(),700);
});
})();

function renderEditButtons(){
 document.querySelectorAll(".detailEditEventSlot").forEach(slot=>{
  if(window.currentUserIsAdmin){
   slot.innerHTML=`<button class="edit-event-btn login-submit" data-id="${slot.dataset.eventId}">✎ EDYTUJ EVENT</button>`;
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
   if(name) name.textContent=file.name;
   const reader=new FileReader();
   reader.onload=e=>{if(img){img.src=e.target.result;preview.style.display="block";}};
   reader.readAsDataURL(file);
  });
 }
});
