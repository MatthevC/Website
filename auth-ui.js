
document.addEventListener("DOMContentLoaded", async () => {
 const open=document.getElementById("openLogin");
 const modal=document.getElementById("loginModal");
 const close=document.getElementById("closeLogin");
 const btn=document.getElementById("loginBtn");
 const nick=document.getElementById("loginNick");
 const pass=document.getElementById("loginPass");
 const msg=document.getElementById("loginMsg");
 const menu=document.getElementById("userMenu");
 const admin=document.getElementById("adminLink");
 const logout=document.getElementById("logoutBtn");

 if(!open) return;

 const closeMenu=()=>menu?.classList.remove("show");

 async function loadUser(){
   const {data:{session}}=await supabaseClient.auth.getSession();

   if(!session){
     open.textContent="LOGIN";
     open.classList.remove("logged");
     open.onclick=()=>modal?.classList.add("active");
     return;
   }

   const {data:profile}=await supabaseClient
     .from("profiles")
     .select("username,role")
     .eq("email",session.user.email)
     .maybeSingle();

   if(!profile) return;

   open.textContent=profile.username + " ▾";
   open.classList.add("logged");

   open.onclick=(e)=>{
     e.preventDefault();
     e.stopPropagation();
     menu?.classList.toggle("show");
   };

   if(profile.role==="admin" && admin){
     admin.style.display="block";
   }

   if(logout){
     logout.onclick=async()=>{
       await supabaseClient.auth.signOut();
       location.reload();
     };
   }
 }

 await loadUser();

 document.addEventListener("click",(e)=>{
   if(!e.target.closest(".user-area")) closeMenu();
 });

 if(close) close.onclick=()=>modal?.classList.remove("active");

 if(btn){
  btn.onclick=async()=>{
   msg.textContent="Logowanie...";
   const {data:p}=await supabaseClient.from("profiles")
    .select("email")
    .eq("username",nick.value.trim())
    .maybeSingle();

   if(!p){msg.textContent="Nie znaleziono użytkownika";return;}

   const {error}=await supabaseClient.auth.signInWithPassword({
     email:p.email,
     password:pass.value
   });

   if(error){
    msg.textContent="Błędne hasło";
    return;
   }

   location.reload();
  };
 }
});
