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
    const {data:prior,error:priorError}=await client.from('mission1_exercise_completions').select('exercise').eq('team_id',team).eq('exercise',3).maybeSingle();
    if(priorError)throw priorError;
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
mountExerciseNav(3);
window.addEventListener('load',()=>void initialize());
