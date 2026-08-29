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

document.addEventListener("DOMContentLoaded",()=>{
 initEvents();
 checkAdmin();

 // ponowne sprawdzenie po logowaniu bez odświeżania
 window.addEventListener("matt-auth-change",checkAdmin);
});

})();