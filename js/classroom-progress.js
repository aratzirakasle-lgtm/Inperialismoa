/* Marcador de aula (misión 1). Solo utiliza datos mínimos confirmados por Supabase:
 * nombre del equipo, integrantes registrados y seis marcas de finalización. Nunca respuestas o intentos.
 * Función pura para permitir pruebas y actualización sin remontar las salas.
 */
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => (
  {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]
));

/* Icono de consulta, no de competición. SVG sin fondo y con alto contraste. */
export const progressEyeMarkup = '<svg class="m1-progress-emblem m1-progress-eye" viewBox="0 0 40 40" width="32" height="32" aria-hidden="true" focusable="false" style="vertical-align:middle;filter:drop-shadow(0 0 3px #70c7ff66);animation:none"><path d="M3 20C7.5 13 13.5 9.5 20 9.5S32.5 13 37 20C32.5 27 26.5 30.5 20 30.5S7.5 27 3 20Z" fill="#e3f5ff" stroke="#2984cf" stroke-width="2.4" stroke-linejoin="round"/><circle cx="20" cy="20" r="8.2" fill="#398ed4" stroke="#18588c" stroke-width="1.2"/><circle cx="20" cy="20" r="3.8" fill="#102f50"/><circle cx="17.5" cy="17" r="1.8" fill="#fff"/></svg>';

/* Identidad visual de expedición: no utiliza nombres de integrantes ni datos privados.
 * La pareja motivo/color se deriva del identificador del equipo y no de su progreso.
 */
const emblemColors = ['#245f70','#805444','#456c4c','#72517b','#9a672e','#38518a','#8a4556','#386c69','#62612f','#515c72','#8a582d','#3d797b'];
const emblemMotifs = [
 '<circle cx="24" cy="24" r="10"/><path d="M24 12v24M12 24h24M29 19l-3 7-7 3 3-7z" fill="#f9df9b"/>',
 '<path d="M11 31l9-14 5 8 5-10 8 16z"/><path d="M17 22l3-5 3 5M27 21l3-6 3 6"/>',
 '<path d="M12 30h24l-5 6H17zM24 13v17M25 14l9 12H25zM22 17l-8 9h8z"/>',
 '<circle cx="24" cy="24" r="11"/><ellipse cx="24" cy="24" rx="5" ry="11"/><path d="M13 24h22M16 18h16M16 30h16"/>',
 '<path d="M18 17h12l3 6-3 11H18l-3-11zM21 17v-3a3 3 0 0 1 6 0v3M18 34h12M24 22v8"/><path d="M24 22l-2 5h4z" fill="#f9df9b"/>',
 '<path d="M12 28l17-12 5 7-17 12zM29 16l4-3 5 7-4 3M22 31v6M17 37h10"/>',
 '<path d="M24 18c-4-3-8-4-13-3v16c5-1 9 0 13 3 4-3 8-4 13-3V15c-5-1-9 0-13 3zM24 18v16M15 21h5M28 21h5M15 25h5M28 25h5"/>',
 '<path d="M15 35l17-20M19 30c-1-7 5-15 15-17 2 8-4 15-15 17zM24 25l7-1M27 21l-1-5"/>',
 '<circle cx="24" cy="15" r="3"/><path d="M24 18v17M17 22h14M12 26c0 6 5 9 12 9s12-3 12-9M12 26l-3 4M36 26l3 4"/>',
 '<path d="M24 12l3.5 8 8.5 1-6.5 6 2 8-7.5-4-7.5 4 2-8-6.5-6 8.5-1z" fill="#f9df9b"/>',
 '<circle cx="19" cy="20" r="6"/><path d="M23 24l12 12M29 30l4-4M32 33l4-4"/>',
 '<path d="M16 13h16M16 35h16M18 14v4c0 3 3 5 6 6-3 1-6 4-6 7v3M30 14v4c0 3-3 5-6 6 3 1 6 4 6 7v3M21 31h6"/>'
];
function emblemHash(value){
 let hash=2166136261;
 for(const char of String(value)){hash=Math.imul(hash^char.codePointAt(0),16777619);}
 return hash>>>0;
}
const emblemKey = row => String(row.team_id??row.team_name??'');
function assignEmblems(rows){
 const used=new Set(),assigned=new Map();
 const count=emblemColors.length*emblemMotifs.length;
 for(const id of [...new Set(rows.map(emblemKey))].sort()){
   let index=emblemHash(id)%count;
   // Resolver coincidencias de motivo/color sin depender del orden de llegada.
   if(used.size<count){while(used.has(index))index=(index+1)%count;}
   used.add(index);assigned.set(id,index);
 }
 return assigned;
}
function teamEmblem(row,assigned){
 const index=assigned.get(emblemKey(row));
 const color=emblemColors[index%emblemColors.length];
 const motif=emblemMotifs[Math.floor(index/emblemColors.length)];
 return '<svg class="m1-team-emblem" width="40" height="40" viewBox="0 0 48 48" aria-hidden="true" focusable="false">'+
 '<path d="M24 3L42 9v16c0 9-7 15-18 20C13 40 6 34 6 25V9Z" fill="'+color+'" stroke="#694a28" stroke-width="1.5"/>'+
 '<path d="M24 6L39 11v14c0 7-6 13-15 17C15 38 9 32 9 25V11Z" fill="none" stroke="#e8c888" stroke-width="1.25"/>'+
 '<g stroke="#fff0c9" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round">'+motif+'</g></svg>';
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
