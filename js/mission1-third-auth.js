import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { createMission1DraftSync } from './mission1-draft-sync.js?v=20261123-m1draft3';
import { mountExerciseNav, mountStudentExerciseNav, markMission1NavCompleted, addTeacherStageControls } from './mission1-navigation.js?v=20261123-aula3';

const message=document.querySelector('#message');
const next=document.querySelector('#next-fourth');
const qs=new URLSearchParams(location.search);
const previewRequested=qs.get('preview')==='1';
function status(text){if(message){message.hidden=false;message.textContent=text}}
function fail(text){status(text);document.querySelector('#check').disabled=true}
async function initialize(){
  if(!window.supabase||!SUPABASE_URL||!SUPABASE_ANON_KEY){
    fail('Konexioa ez dago erabilgarri. Itzuli hasierara.');
    return;
  }
  const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
  try{
    const {data:{user},error:authError}=await client.auth.getUser();
    if(authError||!user){location.replace('./index.html');return}
    const {data:profile,error:profileError}=await client.from('profiles').select('role,team_id').eq('id',user.id).single();
    if(profileError||!profile){location.replace('./index.html');return}
    const preview=profile.role==='teacher'&&previewRequested;
    if(!preview&&profile.role!=='student'){location.replace('./index.html');return}
    if(preview){
      window.m1ThirdLocalMode='teacher';
      mountExerciseNav(3);
      addTeacherStageControls([
        ['Hasierako pantaila',()=>window.m1ThirdPreviewSetStage?.('start')],
        ['Amaierako pantaila',()=>window.m1ThirdPreviewSetStage?.('complete')]
      ]);
      document.querySelector('.back').href='./bi-sistema.html?preview=1';
      document.querySelector('.screen-help a').href='./bi-sistema.html?preview=1';
      next.href='./inperioen-aztarnak.html?preview=1';
      window.m1ThirdProgress=async()=>({completed:true,preview:true});
      status('Irakaslearen aurrebista: emaitzak ez dira taldean gordeko.');
      return;
    }
    if(!profile.team_id){location.replace('./index.html');return}
    const team=profile.team_id;
    const [{data:second,error:secondError},{data:prior,error:priorError}]=await Promise.all([
      client.from('bi_sistema_team_state').select('completed_at').eq('team_id',team).maybeSingle(),
      client.from('mission1_exercise_completions').select('exercise').eq('team_id',team).eq('exercise',3).maybeSingle()
    ]);
    if(secondError||priorError)throw secondError||priorError;
    // Baimena bigarren ariketaren benetako amaierak soilik ematen du.
    if(!second?.completed_at){location.replace('./bi-sistema.html');return;}
    if(prior){
      // Revisión opcional, local y sin alterar el historial del equipo.
      window.m1ThirdLocalMode='practice';
      window.m1ThirdProgress=async()=>({completed:true,already_completed:true,practice:true});
      status('Hirugarren ariketa jada gaindituta dago. Berriz egin edo laugarren ariketara joan zaitezke.');
      // Emaitza berriro egitea ez da derrigorrezkoa: lotura ikusgai utzi,
      // aurreko erantzunik edo zuzenketaren xehetasunik erakutsi gabe.
      if(!document.querySelector('#m1-third-resume')){
        const bar=document.createElement('div');
        bar.id='m1-third-resume';
        bar.className='accessibility-note';
        bar.setAttribute('role','status');
        const label=document.createElement('strong');
        label.textContent='✓ 3. ariketa gaindituta · taldearen aurrerapena gordeta';
        const link=document.createElement('a');
        link.href='./inperioen-aztarnak.html';
        link.textContent='4. ariketa · Inperioen aztarnak →';
        link.style.color='#f6d49c';
        link.style.fontWeight='700';
        link.style.textUnderlineOffset='3px';
        bar.append(label,link);
        document.querySelector('.accessibility-note')?.after(bar);
      }
    }else{
      if(message)message.hidden=true;
      let sync;
      const signal=document.createElement('span');
      signal.className='m1-draft-state';
      signal.setAttribute('role','status');
      signal.setAttribute('aria-live','polite');
      signal.style.cssText='margin-left:10px;color:#f3da9c;font-size:12px';
      document.querySelector('.accessibility-note > div')?.append(signal);
      const retry=document.createElement('button');
      retry.type='button';retry.textContent='↻ Berriro konektatu';
      retry.style.cssText='margin-left:8px;display:none';
      retry.addEventListener('click',()=>void sync?.load());
      document.querySelector('.accessibility-note')?.append(retry);
      sync=createMission1DraftSync({
        client,teamId:team,exercise:3,userId:user.id,
        onDraft:places=>window.m1ThirdDraftApply?.(places),
        onStatus:(msg,kind)=>{
          signal.textContent=' · '+msg;
          retry.style.display=kind==='error'?'inline-block':'none';
          window.m1ThirdDraftStatus?.(msg,kind);
        },
        onCompleted:()=>markMission1NavCompleted(3)
      });
      window.m1ThirdDraftSync=sync;
      window.m1ThirdProgress=async()=>sync.submit();
      window.addEventListener('pagehide',()=>sync.stop(),{once:true});
      await sync.start();
    }
    await mountStudentExerciseNav(3,client,team);
  }catch(e){
    console.error('Hirugarren ariketaren saioa',e);
    fail('Ezin izan da taldearen egoera egiaztatu. Berritu orria edo itzuli hasierara.');
  }
}
window.addEventListener('load',()=>void initialize());
