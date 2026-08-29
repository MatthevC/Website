async function checkAdmin(){
 const {data}=await supabaseClient.auth.getSession();
 if(!data.session) location.href='login.html';
}
checkAdmin();
async function logout(){await supabaseClient.auth.signOut();location.href='login.html';}
