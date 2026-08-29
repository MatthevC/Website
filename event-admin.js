document.addEventListener("DOMContentLoaded", async ()=>{

 const modal=document.getElementById("eventModal");
 const close=document.getElementById("closeEvent");
 const save=document.getElementById("saveEvent");
 const addButton=document.getElementById("addEventButton");

 if(addButton){
   addButton.style.display="none";
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
          addButton.style.display="inline-flex";
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

   const {error}=await supabaseClient.from("events").insert({
     title:document.getElementById("eventTitle").value,
     description:document.getElementById("eventDesc").value,
     start_date:document.getElementById("eventStart").value,
     end_date:document.getElementById("eventEnd").value,
     publish_date:document.getElementById("eventPublish").value,
     image_url:image
   });

   msg.textContent=error ? error.message : "Dodano event";

   if(!error){
     setTimeout(()=>location.reload(),800);
   }
 };
 }

});
