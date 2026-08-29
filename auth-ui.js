
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
     window.currentUserIsAdmin = false;
     window.dispatchEvent(new CustomEvent("matt-auth-change", {detail:{isAdmin:false}}));
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

   window.currentUserIsAdmin = profile.role === "admin";
   window.dispatchEvent(new CustomEvent("matt-auth-change", {detail:{isAdmin: window.currentUserIsAdmin}}));

   open.textContent=profile.username;
   open.classList.add("logged");

   open.onclick=(e)=>{
     e.preventDefault();
     e.stopPropagation();
     menu?.classList.toggle("show");
   };

   // Panel administratora usunięty z menu użytkownika.
   // Dostęp administracyjny pozostaje przez osobny mechanizm.
   if(admin){
     admin.style.display="none";
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

 const forgot=document.getElementById("forgotPass");
 const resetBox=document.getElementById("resetBox");
 const resetSend=document.getElementById("resetSend");
 const resetEmail=document.getElementById("resetEmail");
 const resetAnswer=document.getElementById("resetAnswer");
 const resetQuestion=document.getElementById("resetQuestion");
 const resetQuestions=[["Ile jest 2 + 2?", "4"], ["Ile dni ma tydzień?", "7"], ["Ile miesięcy ma rok?", "12"], ["Jak ma na imię kapitan Sparrow?", "Jack"], ["Ile nóg ma pies?", "4"], ["Ile nóg ma kot?", "4"], ["Jakiego koloru jest śnieg?", "biały"], ["Jakiego koloru jest trawa?", "zielony"], ["Ile to 5 + 5?", "10"], ["Ile to 10 - 3?", "7"], ["Ile to 3 x 3?", "9"], ["Jaka planeta jest najbliżej Słońca?", "Merkury"], ["Jak nazywa się nasza planeta?", "Ziemia"], ["Ile godzin ma doba?", "24"], ["Ile minut ma godzina?", "60"], ["Ile sekund ma minuta?", "60"], ["Jakie zwierzę mówi miau?", "kot"], ["Jakie zwierzę szczeka?", "pies"], ["Jaki owoc jest żółty i długi?", "banan"], ["Ile palców ma człowiek u jednej dłoni?", "5"], ["Jaki dzień jest po poniedziałku?", "wtorek"], ["Jaki dzień jest przed niedzielą?", "sobota"], ["Stolica Polski?", "Warszawa"], ["W jakim kraju leży Polska?", "Polska"], ["Ile boków ma kwadrat?", "4"], ["Ile boków ma trójkąt?", "3"], ["Ile nóg ma pająk?", "8"], ["Jak nazywa się młode psa?", "szczeniak"], ["Jak nazywa się młode kota?", "kocię"], ["Czym piszemy na papierze?", "długopis"], ["Czym mierzymy czas?", "zegarek"], ["Jak nazywa się gwiazda naszej planety?", "Słońce"], ["Ile to 1+1?", "2"], ["Ile to 20/2?", "10"], ["Jaki kolor ma ogień?", "czerwony"], ["Co daje pszczoła?", "miód"], ["Gdzie mieszka ryba?", "woda"], ["Jak nazywa się statek na morzu?", "statek"], ["Ile kół ma samochód?", "4"], ["Co świeci w nocy na niebie?", "Księżyc"], ["Jak nazywa się pora roku po lecie?", "jesień"], ["Jak nazywa się pora roku po zimie?", "wiosna"], ["Ile uszu ma człowiek?", "2"], ["Ile oczu ma człowiek?", "2"], ["Co robi zegar?", "odmierza czas"], ["Jaki napój robi się z ziaren?", "kawa"], ["Jaki instrument ma klawisze?", "pianino"], ["Jak nazywa się największy ocean?", "spokojny"], ["Co rośnie na drzewie?", "liście"], ["Jaki kształt ma piłka?", "okrągły"]];
 let currentResetAnswer="";

 if(forgot){
   forgot.onclick=()=>{
     resetBox.style.display="block";
     const q=resetQuestions[Math.floor(Math.random()*resetQuestions.length)];
     resetQuestion.textContent=q[0];
     currentResetAnswer=q[1].toLowerCase();
   };
 }

 if(resetSend){
   resetSend.onclick=async()=>{
     const email=resetEmail.value.trim();
     const answer=resetAnswer.value.trim().toLowerCase();

     if(answer!==currentResetAnswer){
       msg.textContent="Niepoprawna odpowiedź zabezpieczająca";
       return;
     }

     const {error}=await supabaseClient.auth.resetPasswordForEmail(email,{
       redirectTo: window.location.origin + "/reset-password.html"
     });

     msg.textContent=error ? "Nie udało się wysłać wiadomości" : "Wysłano wiadomość resetującą";
   };
 }

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


document.addEventListener("DOMContentLoaded",()=>{
 const edit=document.getElementById("editProfileBtn");
 const modal=document.getElementById("profileModal");
 const close=document.getElementById("closeProfile");
 const save=document.getElementById("saveProfile");
 if(edit) edit.onclick=()=>modal.classList.add("active");
 if(close) close.onclick=()=>modal.classList.remove("active");

 if(save) save.onclick=async()=>{
   const oldEmail=document.getElementById("profileOldEmail").value.trim();
   const oldPassword=document.getElementById("profileOldPassword").value;
   const newNick=document.getElementById("profileNewNick").value.trim();
   const newEmail=document.getElementById("profileNewEmail").value.trim();
   const newPassword=document.getElementById("profileNewPassword").value;
   const msg=document.getElementById("profileMsg");

   const {error:verifyError}=await supabaseClient.auth.signInWithPassword({
     email:oldEmail,
     password:oldPassword
   });

   if(verifyError){
     msg.textContent="Niepoprawny obecny e-mail lub hasło.";
     return;
   }

   const {data:{user}}=await supabaseClient.auth.getUser();
   if(!user) return;

   // Zmiana nicku wymaga potwierdzenia - zapisujemy prośbę zamiast zmieniać od razu
   if(newNick){
     await supabaseClient.from("profiles").update({
       pending_username: newNick,
       profile_change_requested_at: new Date().toISOString()
     }).eq("email",oldEmail);
   }

   if(newEmail || newPassword){
     const updates={};
     if(newEmail) updates.email=newEmail;
     if(newPassword) updates.password=newPassword;

     const {error}=await supabaseClient.auth.updateUser(updates);
     if(error){
       msg.textContent="Błąd zmiany danych: "+error.message;
       return;
     }
     msg.textContent="Wysłano potwierdzenie zmiany na e-mail.";
     return;
   }

   msg.textContent="Zapisano prośbę o zmianę. Potwierdź zmianę przez wiadomość e-mail, aby została aktywowana.";
 };
});
