/* MATT STUDIO Firebase adapter: Firestore + Authentication. Some server operations require migration. */
(()=>{
'use strict';
const firebaseConfig={apiKey:'AIzaSyCx71WBeuTLo3Pw4q4brj5bBUJcEjMtEbI',authDomain:'matts-world-5ea7a.firebaseapp.com',projectId:'matts-world-5ea7a',storageBucket:'matts-world-5ea7a.firebasestorage.app',messagingSenderId:'373429846696',appId:'1:373429846696:web:b6bf89149e4cc35ca2f89d'};
let sdk,auth,db;
const ready=Promise.all([
 import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),
 import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js'),
 import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js'),
 import('https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js')
]).then(([a,u,f,st])=>{const app=a.initializeApp(firebaseConfig);auth=u.getAuth(app);db=f.getFirestore(app);sdk={u,f,st,storage:st.getStorage(app)};return new Promise(resolve=>u.onAuthStateChanged(auth,()=>resolve()));});
const fail=(message)=>({data:null,error:{message,code:'firebase-operation-unavailable'}});
const collectionMap={matt_permission_catalog:'matt_permission_catalog',profiles:'profiles',cms_data:'cms_data',events:'events',rewards:'rewards',matt_lobby_game_config:'matt_lobby_game_config',matt_contact_submissions:'matt_contact_submissions',matt_user_permissions:'legacy_user_permissions',matt_lobby_conflicts:'matt_lobby_conflicts'};
const docId=(table,row)=>String(table==='cms_data'?row.key:table==='matt_lobby_game_config'?row.game:row.id||'');
const date=(v)=>v?.toDate?.()?.toISOString?.()||v;
const normalize=(d)=>Object.fromEntries(Object.entries(d||{}).map(([k,v])=>[k,date(v)]));
class Query {
 constructor(table){this.table=table;this.filters=[];this.orderBy=null;this.max=null;this.singleMode=null;this.operation='select';this.payload=null;this.opts={};}
 select(fields='*',opts={}){this.fields=fields;this.opts=opts;return this;}
 eq(k,v){this.filters.push([k,'==',v]);return this;}
 neq(k,v){this.filters.push([k,'!=',v]);return this;}
 in(k,v){this.filters.push([k,'in',v]);return this;}
 order(k,{ascending=true}={}){this.orderBy=[k,ascending?'asc':'desc'];return this;}
 limit(n){this.max=n;return this;}
 single(){this.singleMode='single';return this;}
 maybeSingle(){this.singleMode='maybe';return this;}
 insert(v){this.operation='insert';this.payload=v;return this;}
 update(v){this.operation='update';this.payload=v;return this;}
 upsert(v){this.operation='upsert';this.payload=v;return this;}
 delete(){this.operation='delete';return this;}
 then(ok,bad){return this.run().then(ok,bad);}
 async run(){try{await ready;const f=sdk.f,table=collectionMap[this.table];if(!table)return fail(`Tabela ${this.table} nie jest jeszcze przeniesiona.`);const col=f.collection(db,table);let rows=[];
 if(this.operation==='select'){
   const constraints=this.filters.map(([k,op,v])=>f.where(k,op,v));if(this.orderBy)constraints.push(f.orderBy(...this.orderBy));if(this.max)constraints.push(f.limit(this.max));
   let snap;
   // Prefer document lookup for key-based CMS and game configuration, minimizing reads.
   const idField=this.table==='cms_data'?'key':this.table==='matt_lobby_game_config'?'game':'id';
   const key=this.filters.length===1&&this.filters[0][0]===idField&&this.filters[0][1]==='=='?this.filters[0][2]:null;
   if(key!==null){const one=await f.getDoc(f.doc(db,table,String(key)));rows=one.exists()?[{...normalize(one.data()),[idField]:String(key),id:one.id}]:[];}
   else {snap=await f.getDocs(f.query(col,...constraints));rows=snap.docs.map(x=>({...normalize(x.data()),[idField]:x.data()?.[idField]??x.id,id:x.data()?.id??x.id}));}
   if(this.opts.head)return {data:null,count:rows.length,error:null};
   if(this.fields&&this.fields!=='*'){const keys=this.fields.split(',').map(x=>x.trim());rows=rows.map(r=>Object.fromEntries(keys.filter(k=>k in r).map(k=>[k,r[k]])));}
   return {data:this.singleMode?rows[0]||null:rows,error:this.singleMode==='single'&&!rows.length?{message:'Nie znaleziono dokumentu'}:null,count:rows.length};
 }
 // Writes restricted to signed-in owner by current Firestore rules.
 if(!auth.currentUser)return fail('Zaloguj się, aby zapisywać dane.');
 if(this.operation==='insert'||this.operation==='upsert'){
  const arr=Array.isArray(this.payload)?this.payload:[this.payload];const saved=[];
  for(const r of arr){const id=docId(this.table,r)||crypto.randomUUID();await f.setDoc(f.doc(db,table,id),r,{merge:this.operation==='upsert'});saved.push({...r,id:r.id??id});}
  return {data:this.fields?this.singleMode?saved[0]:saved:null,error:null};
 }
 if(!this.filters.length)return fail('Odmowa zapisu bez filtra identyfikatora.');
 const [field,op,id]=this.filters[0];const idField=this.table==='cms_data'?'key':this.table==='matt_lobby_game_config'?'game':'id';
 if(field!==idField||op!=='==')return fail('Edycja wymaga jednoznacznego identyfikatora.');
 const ref=f.doc(db,table,String(id));
 if(this.operation==='update')await f.updateDoc(ref,this.payload);
 if(this.operation==='delete')await f.deleteDoc(ref);
 return {data:null,error:null};
 }catch(e){return fail(e.message||String(e));}}
}
const authApi={
 async getSession(){await ready;const user=auth.currentUser;return {data:{session:user?{user:{id:user.uid,email:user.email,app_metadata:{},user_metadata:{}},access_token:await user.getIdToken(),expires_at:Math.floor(Date.now()/1000)+3600}:null},error:null};},
 async getUser(){await ready;const user=auth.currentUser;return {data:{user:user?{id:user.uid,email:user.email}:null},error:null};},
 async signInWithPassword({email,password}){try{await ready;const r=await sdk.u.signInWithEmailAndPassword(auth,email,password);return {data:{user:{id:r.user.uid,email:r.user.email},session:{user:{id:r.user.uid,email:r.user.email}}},error:null};}catch(e){return fail(e.message);}},
 async resetPasswordForEmail(email){try{await ready;await sdk.u.sendPasswordResetEmail(auth,email);return {data:{},error:null};}catch(e){return fail(e.message);}},
 async updateUser(changes){try{await ready;const user=auth.currentUser;if(!user)return fail('Brak zalogowanego użytkownika.');if(changes.password)await sdk.u.updatePassword(user,changes.password);if(changes.email)await sdk.u.updateEmail(user,changes.email);return {data:{user:{id:user.uid,email:user.email}},error:null};}catch(e){return fail(e.message);}},
 async signOut(){try{await ready;await sdk.u.signOut(auth);return {error:null};}catch(e){return fail(e.message);}},
 onAuthStateChange(cb){let unsub=()=>{};ready.then(()=>{unsub=sdk.u.onAuthStateChanged(auth,user=>cb(user?'SIGNED_IN':'SIGNED_OUT',user?{user:{id:user.uid,email:user.email}}:null));});return {data:{subscription:{unsubscribe:()=>unsub()}}};}
};
const rpc=async(name,args={})=>{await ready;
 if(name==='matt_get_my_access'){
  if(!auth.currentUser)return {data:null,error:null};
  try{const p=await sdk.f.getDoc(sdk.f.doc(db,'profiles',auth.currentUser.uid));const profile=p.data();return {data:profile?{role:profile.role,permissions:Array.isArray(profile.permissions)?profile.permissions:[],user_id:auth.currentUser.uid,username:profile.username}:null,error:null};}catch(e){return fail(e.message);}
 }
 if(name==='matt_admin_list_accounts'){
  if(auth.currentUser?.uid!=='6UYgp0Lj7NMDRbIK3UBr40oNRLq2')return fail('Brak uprawnień administratora.');
  try{const snap=await sdk.f.getDocs(sdk.f.collection(db,'profiles'));
    return {data:snap.docs.map(d=>{const p=normalize(d.data());return {...p,auth_user_id:p.firebase_uid||p.auth_user_id||d.id,username:p.username||'',role:p.role||'user',permissions:Array.isArray(p.permissions)?p.permissions:[]};}),error:null};
  }catch(e){return fail(e.message||String(e));}
 }
 if(name==='matt_admin_set_account_access'){
  if(auth.currentUser?.uid!=='6UYgp0Lj7NMDRbIK3UBr40oNRLq2')return fail('Brak uprawnień administratora.');
  const uid=String(args.p_user_id||'');const role=String(args.p_role||'user');
  if(!/^[A-Za-z0-9_-]{10,128}$/.test(uid)||!['admin','moderator','user'].includes(role))return fail('Nieprawidłowy użytkownik lub rola.');
  if(uid==='6UYgp0Lj7NMDRbIK3UBr40oNRLq2'&&role!=='admin')return fail('Nie można odebrać roli głównemu administratorowi.');
  try{await sdk.f.updateDoc(sdk.f.doc(db,'profiles',uid),{role,permissions:Array.isArray(args.p_permissions)?args.p_permissions.filter(x=>typeof x==='string').slice(0,200):[]});return {data:true,error:null};}catch(e){return fail(e.message||String(e));}
 }
 if(name==='matt_cms_save'){const q=new Query('cms_data');return q.upsert({key:args.p_key,data:args.p_data,updated_at:new Date().toISOString()}).run();}
 if(name==='matt_cms_remove'){return new Query('cms_data').delete().eq('key',args.p_key).run();}
 return fail(`Funkcja ${name} wymaga migracji na Firebase i jest wyłączona w wersji testowej.`);
};
// Firebase Storage upload is asynchronous; cache the download URL for the legacy synchronous getPublicUrl API.
const uploadedUrls=new Map();
const storageApi={from:(bucket)=>({
 async upload(path,file){try{await ready;if(!auth.currentUser)return fail('Zaloguj się, aby wysłać plik.');const key=`${bucket}/${path}`;const ref=sdk.st.ref(sdk.storage,key);await sdk.st.uploadBytes(ref,file,{contentType:file.type||'application/octet-stream'});const url=await sdk.st.getDownloadURL(ref);uploadedUrls.set(key,url);return {data:{path,publicUrl:url},error:null};}catch(e){return fail(e.message||String(e));}},
 async remove(paths){try{await ready;if(!auth.currentUser)return fail('Zaloguj się, aby usunąć plik.');for(const path of paths){await sdk.st.deleteObject(sdk.st.ref(sdk.storage,`${bucket}/${path}`));uploadedUrls.delete(`${bucket}/${path}`);}return {data:paths,error:null};}catch(e){return fail(e.message||String(e));}},
 getPublicUrl(path){const url=uploadedUrls.get(`${bucket}/${path}`)||'';return {data:{publicUrl:url},error:url?null:{message:'Nieznany adres pliku. Wczytaj adres z Firestore lub prześlij plik ponownie.'}};}
})};
const unsupported=(what)=>({data:null,error:{message:`${what} wymaga osobnej migracji; operacja zablokowana.`}});
// Verify CMS writes against the Firestore server, never the local snapshot cache.
async function readCmsFromServer(key) {
  try {
    await ready;
    const snap = await sdk.f.getDocFromServer(sdk.f.doc(db, 'cms_data', String(key)));
    return {data: snap.exists() ? normalize(snap.data()) : null, error: null};
  } catch (e) {
    return fail(e.message || String(e));
  }
}
const facade={auth:authApi,from:(name)=>new Query(name),readCmsFromServer,rpc,functions:{invoke:async()=>unsupported('Funkcje serwerowe')},storage:storageApi};
window.firebaseClient=facade;window.__mattFirebaseReady=ready;window.__mattFirebaseMigrationIncomplete=true;
})();
