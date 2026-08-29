
document.addEventListener("DOMContentLoaded", async () => {
 const open=document.getElementById("openLogin");
 const modal=document.getElementById("loginModal");
 const close=document.getElementById("closeLogin");
 const btn=document.getElementById("loginBtn");
 const nick=document.getElementById("loginNick");
 const pass=document.getElementById("loginPass");
 const msg=document.getElementById("loginMsg");

 async function refreshUser(){
   const {data}=await supabaseClient.auth.getSession();
   if(data.session){
     const {data:profile}=await supabaseClient.from("profiles")
       .select("username,role").eq("email",data.session.user.email).single();
     if(profile && profile.role==="admin"){
       open.textContent=profile.username;
       open.classList.add("logged");
       return;
     }
   }
   open.textContent="LOGIN";
 }
 refreshUser();

 open.onclick=()=> modal.style.display="flex";
 close.onclick=()=> modal.style.display="none";

 btn.onclick=async()=>{
   msg.textContent="Logowanie...";
   const {data:profile,error:pErr}=await supabaseClient.from("profiles")
    .select("email,role").eq("username",nick.value.trim()).single();

   if(pErr || !profile){msg.textContent="Nie znaleziono użytkownika";return;}

   const {error}=await supabaseClient.auth.signInWithPassword({
     email:profile.email,password:pass.value
   });

   if(error){msg.textContent="Błędne hasło";return;}
   if(profile.role!=="admin"){await supabaseClient.auth.signOut();msg.textContent="Brak uprawnień";return;}

   location.reload();
 };

 document.getElementById("forgotPass").onclick=()=>{
   msg.textContent="Skontaktuj się z administratorem.";
 };
});
