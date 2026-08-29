document.addEventListener("DOMContentLoaded", async ()=>{

 const modal=document.getElementById("eventModal");
 const close=document.getElementById("closeEvent");
 const save=document.getElementById("saveEvent");
 const addButton=document.getElementById("addEventButton");

 if(addButton){
   // Ukryty domyślnie - pojawia się wyłącznie po potwierdzeniu admina
   addButton.style.setProperty("display","none","important");
   addButton.style.setProperty("visibility","hidden","important");
   addButton.hidden = true;
   addButton.disabled = true;
 }

 let isAdmin=false;

 try{
   const {data:{session}} = await supabaseClient.auth.getSession();

   if(session){
     const {data:profile}=await supabaseClient
       .from("profiles")
       .select("role")
       .eq("email",session.user.email)
       .maybeSingle();

     if(profile?.role==="admin"){
       isAdmin=true;
       if(addButton){
          addButton.hidden = false;
          addButton.disabled = false;
          addButton.style.setProperty("display","inline-flex","important");
          addButton.style.setProperty("visibility","visible","important");
          addButton.onclick=()=>{
             if(modal) modal.style.display="flex";
          };
       }
     }
   }
 }catch(e){
   console.error("Admin check error",e);
 }

 if(close){
   close.onclick=()=>{
      if(modal) modal.style.display="none";
   };
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
     image=supabaseClient.storage.from("events").getPublicUrl(name).data.publicUrl;
   }

   const combineDateTime=(dateId,timeId)=>{
     const date=document.getElementById(dateId)?.value;
     const time=document.getElementById(timeId)?.value || "00:00";
     return date ? `${date}T${time}:00` : null;
   };

   const startDate=combineDateTime("eventStart","eventStartTime");
   const endDate=combineDateTime("eventEnd","eventEndTime");
   const publishDate=combineDateTime("eventPublish","eventPublishTime");

   if(startDate && endDate && new Date(endDate) < new Date(startDate)){
     msg.textContent="Data zakończenia nie może być wcześniejsza niż rozpoczęcia";
     return;
   }

   const {error}=await supabaseClient.from("events").insert({
     title:document.getElementById("eventTitle").value,
     description:document.getElementById("eventDesc").value,
     start_date:startDate,
     end_date:endDate,
     publish_date:publishDate,
     image_url:image
   });

   msg.textContent=error ? error.message : "Dodano event";

   if(!error){
     setTimeout(()=>location.reload(),800);
   }
 };
 }

});
