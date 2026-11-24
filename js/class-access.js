// Access is granted only after the server confirms the classroom is open.
let stopCurrent=null;
export function stopClassAccess(){stopCurrent?.();stopCurrent=null}
export function startClassAccess(client){
 stopClassAccess();
 let stopped=false,checking=false,dialog,resolveInitial,initialized=false,wasClosed=false;
 const ready=new Promise(resolve=>{resolveInitial=resolve});
 const style=document.createElement('style');
 style.textContent=`
 #class-access-dialog{box-sizing:border-box;position:fixed;inset:0;width:min(540px,calc(100% - 36px));max-width:none;max-height:calc(100% - 36px);margin:auto;padding:36px 25px;text-align:center;background:radial-gradient(ellipse at top,#f8e8c5,#d8bc88);color:#402d1c;border:5px double #916b36;border-radius:12px;box-shadow:0 20px 90px #0009;font:16px/1.55 Georgia,serif;z-index:2147483647}
 #class-access-dialog::backdrop{background:#181910}
 #class-access-dialog h1{font:700 clamp(25px,5vw,36px)/1.15 Georgia,serif;color:#4a321d;margin:14px 0}
 #class-access-dialog p{margin:12px 0}
 #class-access-dialog .class-access-seal{display:grid;place-items:center;margin:auto;width:70px;height:70px;border:3px double #9d743b;border-radius:50%;font-size:34px;background:#e9d4a6}
 #class-access-dialog button{cursor:pointer;padding:9px 18px;border:1px solid #8e713b;border-radius:7px;background:#41311f;color:#fff2d2;font:600 14px Georgia,serif;margin-top:12px}
 #class-access-dialog button:focus-visible{outline:3px solid #bc8433;outline-offset:3px}
 `;
 document.head.append(style);
 function show(title,message){
  if(!dialog){
   dialog=document.createElement('dialog');dialog.id='class-access-dialog';dialog.setAttribute('aria-labelledby','class-access-heading');
   dialog.innerHTML='<div class="class-access-seal" aria-hidden="true">🔒</div><p>INPERIALISMOA · MUSEO HISTORIKOA</p><h1 id="class-access-heading"></h1><p id="class-access-message" role="status"></p><p>Gordetako aurrerapena ez da galduko.</p><button type="button">Saioa itxi</button>';
   dialog.addEventListener('cancel',e=>e.preventDefault());
   dialog.querySelector('button').addEventListener('click',async()=>{try{await client.auth.signOut()}finally{location.replace('./index.html')}});
   document.body.append(dialog);
  }
  dialog.querySelector('h1').textContent=title;
  dialog.querySelector('#class-access-message').textContent=message;
  if(!dialog.open)dialog.showModal();
 }
 function hide(){if(dialog?.open)dialog.close();dialog?.remove();dialog=null}
 async function check(){
  if(stopped||checking)return;
  checking=true;
  try{
   const {data,error}=await client.rpc('class_access_status',{});
   if(stopped)return;
   if(error||typeof data!=='boolean')throw error||Error('Invalid access status');
   if(data===true){
    if(initialized&&wasClosed){location.reload();return}
    hide();
    if(!initialized){initialized=true;resolveInitial(true)}
   }else{if(initialized)wasClosed=true;show('Museoa itxita dago','Irakasleak gela berriro ireki arte ezin da ariketetan lan egin.')}
  }catch(e){if(!stopped)show('Sarrera egiaztatzen','Ezin da gelako baimena egiaztatu. Konexioa berreskuratzean automatikoki saiatuko gara.')}
  finally{checking=false}
 }
 show('Sarrera egiaztatzen','Gelako sarbidea egiaztatzen ari gara.');
 const timer=setInterval(()=>{if(!document.hidden)void check()},5000);
 const visible=()=>{if(!document.hidden)void check()};
 window.addEventListener('focus',visible);window.addEventListener('online',visible);document.addEventListener('visibilitychange',visible);
 const cleanup=()=>{if(stopped)return;stopped=true;clearInterval(timer);window.removeEventListener('focus',visible);window.removeEventListener('online',visible);document.removeEventListener('visibilitychange',visible);window.removeEventListener('pagehide',cleanup);hide();style.remove();if(!initialized)resolveInitial(false)};
 stopCurrent=cleanup;window.addEventListener('pagehide',cleanup,{once:true});
 void check();return ready;
}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderClassAccessControls(classes){
 const rows=classes.map(c=>{
  const open=c.access_open===true;
  const known=typeof c.access_open==='boolean';
  return '<tr><td><strong>'+esc(c.name)+'</strong> · '+esc(c.school_year)+'</td><td><strong style="color:'+(known?(open?'#27684a':'#923e2a'):'#665c48')+'">'+(known?(open?'IREKITA · Abierta':'ITXITA · Cerrada'):'Egoera ezezaguna')+'</strong></td><td><button type="button" class="btn '+(open?'outline':'primary')+'" data-class-access="'+esc(c.id)+'" data-access-open="'+String(!open)+'" '+(known?'':'disabled')+'>'+(open?'🔒 Itxi sarbidea':'🔓 Ireki sarbidea')+'</button></td></tr>';
 }).join('');
 return '<section class="card" style="margin-bottom:16px;border:2px solid #b89956"><h3>🔑 Gelako sarbidea · Control de acceso</h3><p class="card-sub">Ireki saioa klasea hastean eta itxi amaitzean. Gordetako lana mantentzen da. Irakaslearen sarbidea ez da blokeatzen.</p><div class="table-scroll"><table><thead><tr><th>Gela</th><th>Egoera</th><th>Kudeatu</th></tr></thead><tbody>'+rows+'</tbody></table></div><p id="class-access-result" role="status" class="card-sub"></p></section>';
}
