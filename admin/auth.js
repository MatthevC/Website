async function checkAdmin(){
 try{
  const {data:{session}}=await firebaseClient.auth.getSession();
  if(!session){location.href='login.html';return;}
  const {data:profile,error}=await firebaseClient.from('profiles').select('role').eq('id',session.user.id).maybeSingle();
  if(error||profile?.role!=='admin'){location.href='../index.html';return;}
  window.currentUserIsAdmin=true;
 }catch(e){console.error('Weryfikacja administratora:',e);location.href='../index.html';}
}
checkAdmin();
async function logout(){await firebaseClient.auth.signOut();location.href='login.html';}
