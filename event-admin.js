
document.addEventListener("DOMContentLoaded",()=>{
 const modal=document.getElementById("eventModal");
 const close=document.getElementById("closeEvent");
 const save=document.getElementById("saveEvent");
 const adminLink=document.getElementById("adminLink");

 const addButton=document.createElement("button");
 addButton.textContent="+ DODAJ EVENT";
 addButton.className="admin-add-event";
 addButton.style.display="none";
 addButton.onclick=()=>{modal.style.display="flex";};
 document.querySelector(".site-header")?.after(addButton);

 supabaseClient.auth.getSession().then(async({data})=>{
  if(!data.session)return;
  const {data:p}=await supabaseClient.from("profiles").select("role").eq("email",data.session.user.email).maybeSingle();
  if(p?.role==="admin") addButton.style.display="inline-flex";
 });

 close.onclick=()=>modal.style.display="none";

 save.onclick=async()=>{
  const msg=document.getElementById("eventMsg");
  const file=document.getElementById("eventImage").files[0];
  let image="";
  if(file){
    const name=Date.now()+"_"+file.name;
    const upload=await supabaseClient.storage.from("events").upload(name,file);
    if(upload.error){msg.textContent=upload.error.message;return;}
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
  msg.textContent=error?error.message:"Dodano event";
 };
});
