import { startClassAccess } from "./class-access.js?v=20261124-access2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { createMission1DraftSync } from './mission1-draft-sync.js?v=20261123-m1draft3';
import { mountExerciseNav, mountStudentExerciseNav, markMission1NavCompleted, addTeacherStageControls } from './mission1-navigation.js?v=20261124-members1';

const status=document.querySelector('#online-state');
const url=new URLSearchParams(location.search);
const previewRequested=url.get('preview')==='1';
function say(text){if(status)status.textContent=text}
function halt(text){say(text);const verify=document.querySelector('#verify');if(verify)verify.disabled=true}
async function initialize(){
  if(!window.supabase||!SUPABASE_URL||!SUPABASE_ANON_KEY){
    halt('Ezin izan da Supabaserekin konektatu. Itzuli hasierara.');return;
  }
  const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
  try{
    const {data:{user},error:au}=await client.auth.getUser();
    if(au||!user){location.replace('./index.html');return}
    const {data:profile,error:pe}=await client.from('profiles').select('role,team_id').eq('id',user.id).single();
    if(pe||!profile){location.replace('./index.html');return}
    const preview=profile.role==='teacher'&&previewRequested;
    if(!preview&&profile.role!=='student'){location.replace('./index.html');return}
    if(preview){
      document.querySelector('.mini-toolbar a').href='./inperioen-aztarnak.html?preview=1';
      window.m1FifthLocalMode='teacher';
      mountExerciseNav(5);
      addTeacherStageControls([
        ['Hasierako pantaila',()=>window.m1FifthPreviewSetStage?.('start')],
        ['Amaierako pantaila',()=>window.m1FifthPreviewSetStage?.('complete')]
      ]);
      window.m1FifthProgress=async()=>({completed:true,preview:true,mission_completed:false});
      say('Irakaslearen aurrebista: ez dira benetako taldearen emaitzak gordeko.');
      return;
    }
    if(!(await startClassAccess(client)))return;
    if(!profile.team_id){location.replace('./index.html');return}
    const id=profile.team_id;
    const [{data:third,error:thirdError},{data:fourth,error:fourthError},{data:prior,error:priorError}]=await Promise.all([
      client.from('mission1_exercise_completions').select('exercise').eq('team_id',id).eq('exercise',3).maybeSingle(),
      client.from('empire_dossier_team_state').select('completed_at').eq('team_id',id).maybeSingle(),
      client.from('mission1_exercise_completions').select('exercise').eq('team_id',id).eq('exercise',5).maybeSingle()
    ]);
    if(thirdError||fourthError||priorError)throw thirdError||fourthError||priorError;
    if(!third||!fourth?.completed_at){
      location.replace('./inperioen-aztarnak.html');return;
    }
    if(prior){
      window.m1FifthLocalMode='practice';
      window.m1FifthProgress=async()=>({completed:true,already_completed:true,practice:true,mission_completed:true});
      say('✓ Lehen misioa jada osatuta eta taldearen emaitza gordeta dago. Bigarren misiora joan zaitezkete.');
      // 5/5 gaindituta badago, ez behartu ikaslea berriro jokatzera.
      window.m1FifthRestoreCompletion?.();
    }else{
      let sync;
      const retry=document.createElement('button');
      retry.type='button';retry.textContent='↻ Berriro konektatu';
      retry.style.cssText='display:none;margin-left:9px;padding:3px 8px;border:1px solid #bc955a;background:#223a2f;color:#f5dda7;cursor:pointer';
      retry.addEventListener('click',()=>void sync?.load());
      status?.after(retry);
      sync=createMission1DraftSync({
        client,teamId:id,exercise:5,userId:user.id,
        onDraft:places=>window.m1FifthDraftApply?.(places),
        onStatus:(msg,kind)=>{
          say(msg);retry.style.display=kind==='error'?'inline-block':'none';
          window.m1FifthDraftStatus?.(msg,kind);
        },
        onCompleted:()=>markMission1NavCompleted(5)
      });
      window.m1FifthDraftSync=sync;
      window.m1FifthProgress=async()=>sync.submit();
      window.addEventListener('pagehide',()=>sync.stop(),{once:true});
      await sync.start();
    }
    await mountStudentExerciseNav(5,client,id);
  }catch(e){
    console.error('Bosgarren ariketaren saioa',e);
    halt('Ezin izan da taldearen egoera kargatu. Berritu orria edo itzuli hasierara.');
  }
}
window.addEventListener('load',()=>void initialize());
