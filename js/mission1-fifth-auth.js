import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { mountExerciseNav, addTeacherStageControls } from './mission1-navigation.js?v=20261119-teacher-2';

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
      mountExerciseNav(5);
      addTeacherStageControls([
        ['Hasierako pantaila',()=>window.m1FifthPreviewSetStage?.('start')],
        ['Amaierako pantaila',()=>window.m1FifthPreviewSetStage?.('complete')]
      ]);
      window.m1FifthProgress=async()=>({completed:true,preview:true,mission_completed:false});
      say('Irakaslearen aurrebista: ez dira benetako taldearen emaitzak gordeko.');
      return;
    }
    if(!profile.team_id){location.replace('./index.html');return}
    const id=profile.team_id;
    const [{data:third,error:thirdError},{data:fourth,error:fourthError},{data:legacy,error:legacyError},{data:prior,error:priorError}]=await Promise.all([
      client.from('mission1_exercise_completions').select('exercise').eq('team_id',id).eq('exercise',3).maybeSingle(),
      client.from('empire_dossier_team_state').select('completed_at').eq('team_id',id).maybeSingle(),
      client.from('mission_badges').select('mission_id').eq('team_id',id).eq('mission_id',1).limit(1),
      client.from('mission1_exercise_completions').select('exercise').eq('team_id',id).eq('exercise',5).maybeSingle()
    ]);
    if(thirdError||fourthError||legacyError||priorError)throw thirdError||fourthError||legacyError||priorError;
    if((!third||!fourth?.completed_at)&&!legacy?.length){
      location.replace('./inperioen-aztarnak.html');return;
    }
    window.m1FifthProgress=async answers=>{
      const {data,error}=await client.rpc('submit_mission1_exercise',{p_exercise:5,p_answers:answers});
      if(error)throw error;
      return data;
    };
    say(prior?'Taldeak lehen misioa jada osatuta dauka. Berriz jolastu edo bigarren misiora joan zaitezkete.':'Bost esaldiak osatu eta egiaztatu. Erantzun zuzenak taldearentzat gordeko dira.');
  }catch(e){
    console.error('Bosgarren ariketaren saioa',e);
    halt('Ezin izan da taldearen egoera kargatu. Berritu orria edo itzuli hasierara.');
  }
}
window.addEventListener('load',()=>void initialize());
