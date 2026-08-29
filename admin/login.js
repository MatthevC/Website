document
.getElementById("loginBtn")
.addEventListener("click", async()=>{

const nick =
document.getElementById("nick").value;

const password =
document.getElementById("pass").value;

const msg =
document.getElementById("msg");


msg.innerHTML="Logowanie...";


const {data:profile,error} =
await supabaseClient
.from("profiles")
.select("*")
.eq("username",nick)
.single();


if(error || !profile){

msg.innerHTML="Nie znaleziono użytkownika";
return;

}



const {data,error:loginError} =
await supabaseClient.auth.signInWithPassword({

email:profile.email,

password:password

});


if(loginError){

msg.innerHTML="Błędne hasło";

return;

}



if(profile.role!=="admin"){

msg.innerHTML="Brak uprawnień";

return;

}



window.location.href="../index.html";


});
