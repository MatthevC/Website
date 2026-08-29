document.querySelector('#eventForm').addEventListener('submit',async e=>{
 e.preventDefault();
 const f=new FormData(e.target);
 const {error}=await supabaseClient.from('events').insert([{
  id:crypto.randomUUID(),
  title:f.get('title'),
  date:f.get('date'),
  endDate:f.get('endDate'),
  content:f.get('content'),
  excerpt:String(f.get('content')).substring(0,160),
  image:f.get('image')
 }]);
 document.querySelector('#msg').innerText=error?error.message:'Dodano event';
 if(!error)e.target.reset();
});