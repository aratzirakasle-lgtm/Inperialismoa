import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { mountExerciseNav } from './mission1-navigation.js';

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
      next.href='./inperioen-aztarnak.html?preview=1';
      window.m1ThirdProgress=async()=>({completed:true,preview:true});
      status('Irakaslearen aurrebista: emaitzak ez dira taldean gordeko.');
      return;
    }
    if(!profile.team_id){location.replace('./index.html');return}
    const team=profile.team_id;
    const [{data:second,error:secondError},{data:prior,error:priorError},{data:legacy,error:legacyError}]=await Promise.all([
      client.from('bi_sistema_team_state').select('completed_at').eq('team_id',team).maybeSingle(),
      client.from('mission1_exercise_completions').select('exercise').eq('team_id',team).eq('exercise',3).maybeSingle(),
      client.from('mission_badges').select('mission_id').eq('team_id',team).eq('mission_id',1).limit(1)
    ]);
    if(secondError||priorError||legacyError)throw secondError||priorError||legacyError;
    if(!second?.completed_at&&!legacy?.length){location.replace('./bi-sistema.html');return;}
    window.m1ThirdProgress=async answers=>{
      const {data,error}=await client.rpc('submit_mission1_exercise',{p_exercise:3,p_answers:answers});
      if(error)throw error;
      return data;
    };
    if(prior)status('Hirugarren ariketa jada gaindituta dago. Berriz egin edo laugarren ariketara joan zaitezke.');
    else if(message)message.hidden=true;
  }catch(e){
    console.error('Hirugarren ariketaren saioa',e);
    fail('Ezin izan da taldearen egoera egiaztatu. Berritu orria edo itzuli hasierara.');
  }
}
window.addEventListener('load',()=>void initialize());
