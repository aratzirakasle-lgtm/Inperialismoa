/* Marcador de aula (misión 1). Solo utiliza datos mínimos confirmados por Supabase:
 * nombre del equipo, integrantes registrados y seis marcas de finalización. Nunca respuestas o intentos.
 * Función pura para permitir pruebas y actualización sin remontar las salas.
 */
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => (
  {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]
));

/* Icono de consulta, no de competición. SVG sin fondo y con alto contraste. */
export const progressEyeMarkup = '<svg class="m1-progress-emblem m1-progress-eye" viewBox="0 0 40 40" width="32" height="32" aria-hidden="true" focusable="false" style="vertical-align:middle;filter:drop-shadow(0 0 3px #70c7ff66);animation:none"><path d="M3 20C7.5 13 13.5 9.5 20 9.5S32.5 13 37 20C32.5 27 26.5 30.5 20 30.5S7.5 27 3 20Z" fill="#e3f5ff" stroke="#2984cf" stroke-width="2.4" stroke-linejoin="round"/><circle cx="20" cy="20" r="8.2" fill="#398ed4" stroke="#18588c" stroke-width="1.2"/><circle cx="20" cy="20" r="3.8" fill="#102f50"/><circle cx="17.5" cy="17" r="1.8" fill="#fff"/></svg>';

/* Medallones de expedición: ocho ilustraciones propias con alfa real.
 * El color y el motivo identifican al equipo, nunca su rendimiento.
 * Se asignan por clase e ID, independientemente del orden y las marcas de progreso.
 */
const emblemMotifs = ['compass','ship','telescope','globe','quill','lantern','sextant','key'];
const emblemPalettes = ['green','blue','red'];
function emblemHash(value){
 let hash=2166136261;
 for(const char of String(value)){hash=Math.imul(hash^char.codePointAt(0),16777619);}
 return hash>>>0;
}
const emblemKey = row => String(row.team_id??row.team_name??'');
function assignEmblems(rows){
 const classes=new Map(),assigned=new Map();
 for(const row of rows){
   const classKey=String(row.class_id??'');
   if(!classes.has(classKey))classes.set(classKey,new Set());
   classes.get(classKey).add(emblemKey(row));
 }
 for(const [classKey,ids] of classes){
   const used=new Set();
   const firstPalette=emblemHash(classKey)%emblemPalettes.length;
   const count=emblemMotifs.length*emblemPalettes.length;
   for(const id of [...ids].sort()){
     let index=emblemHash(id)%emblemMotifs.length;
     if(used.size<count){while(used.has(index))index=(index+1)%count;}
     used.add(index);
     const motif=emblemMotifs[index%emblemMotifs.length];
     const palette=emblemPalettes[(firstPalette+Math.floor(index/emblemMotifs.length))%emblemPalettes.length];
     assigned.set(id,{motif,palette});
   }
 }
 return assigned;
}
function teamEmblem(row,assigned){
 const {motif,palette}=assigned.get(emblemKey(row));
 return '<img class="m1-team-emblem m1-team-emblem--'+palette+'" data-emblem="'+palette+'-'+motif+'" src="./assets/team-emblem-'+motif+'.webp" width="48" height="48" alt="" aria-hidden="true" decoding="async" draggable="false">';
}

const flags = [1,2,3,4,5];
const mark = (done,label,mission=false) =>
  '<span class="m1-class-mark '+(done?'is-done ':'is-waiting ')+(mission?'is-mission':'')+
  '" role="img" aria-label="'+esc(label+(done?' gaindituta':' osatu gabe'))+
  '" title="'+esc(label+(done?' gaindituta':' osatu gabe'))+'">'+(done?'✓':'○')+'</span>';

export function renderMission1ClassProgress(rows,{
  ownTeamId=null,classId=null,loading=false,error=false,missionId=1,showEmblems=false
}={}){
  const mission=missionId===2?2:1;
  const list=(Array.isArray(rows)?rows:[]).filter(row=>
    row && (classId===null||String(row.class_id)===String(classId)));
  if(!list.length){
    const msg=error?'Ezin da taldeen aurrerapena eguneratu.':'Taldeen aurrerapena kargatzen…';
    return '<p class="m1-class-empty" role="status">'+msg+'</p>';
  }
  const head='<div class="m1-class-grid m1-class-head" aria-hidden="true">'+
    '<span>TALDEA</span>'+flags.map(n=>'<span>'+n+'</span>').join('')+
    '<span title="Misioa osatuta">M</span></div>';
  const emblems=showEmblems?assignEmblems(list):null;
  const body=list.map(row=>{
    const own=String(row.team_id)===String(ownTeamId);
    const checks=flags.map(n=>mark(row['exercise_'+n]===true,n+'. ariketa')).join('');
    const total=flags.filter(n=>row['exercise_'+n]===true).length;
    const names=Array.isArray(row.member_names)?row.member_names.filter(name=>typeof name==='string'&&name.trim()):[];
    const members=names.length?'<span class="m1-class-members">'+names.map(name=>'<span>'+esc(name.trim())+'</span>').join('')+'</span>':'';
    const name='<span class="m1-class-name" title="'+esc(row.team_name)+'">'+esc(row.team_name)+
        members+(own?'<span class="m1-class-you">ZUEN TALDEA</span>':'')+
        '<small>'+total+'/5</small></span>';
    const identity=showEmblems?'<span class="m1-class-identity">'+teamEmblem(row,emblems)+name+'</span>':name;
    return '<div class="m1-class-grid m1-class-team'+(own?' is-own':'')+'">'+identity+
      checks+mark(row.mission_completed===true,mission+'. misioa',true)+'</div>';
  }).join('');
  const info=error?'<p class="m1-class-info is-error">Konexioa eten da · azken datuak</p>':
    '<p class="m1-class-info">✓ Ariketa gaindituta · M misio osoa</p>';
  return '<div class="m1-class-progress" aria-label="'+mission+'. misioa: taldeen ariketa eta misioaren aurrerapena">'+
    head+body+info+'</div>';
}
