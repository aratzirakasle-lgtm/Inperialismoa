/* Marcador de aula (misión 1). Solo utiliza datos mínimos confirmados por Supabase:
 * nombre del equipo y seis marcas de finalización. Nunca respuestas o intentos.
 * Función pura para permitir pruebas y actualización sin remontar las salas.
 */
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => (
  {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]
));
const flags = [1,2,3,4,5];
const mark = (done,label,mission=false) =>
  '<span class="m1-class-mark '+(done?'is-done ':'is-waiting ')+(mission?'is-mission':'')+
  '" role="img" aria-label="'+esc(label+(done?' gaindituta':' osatu gabe'))+
  '" title="'+esc(label+(done?' gaindituta':' osatu gabe'))+'">'+(done?'✓':'○')+'</span>';

export function renderMission1ClassProgress(rows,{
  ownTeamId=null,classId=null,loading=false,error=false
}={}){
  const list=(Array.isArray(rows)?rows:[]).filter(row=>
    row && (classId===null||String(row.class_id)===String(classId)));
  if(!list.length){
    const msg=error?'Ezin da taldeen aurrerapena eguneratu.':'Taldeen aurrerapena kargatzen…';
    return '<p class="m1-class-empty" role="status">'+msg+'</p>';
  }
  const head='<div class="m1-class-grid m1-class-head" aria-hidden="true">'+
    '<span>TALDEA</span>'+flags.map(n=>'<span>'+n+'</span>').join('')+
    '<span title="Misioa osatuta">M</span></div>';
  const body=list.map(row=>{
    const own=String(row.team_id)===String(ownTeamId);
    const checks=flags.map(n=>mark(row['exercise_'+n]===true,n+'. ariketa')).join('');
    const total=flags.filter(n=>row['exercise_'+n]===true).length;
    return '<div class="m1-class-grid m1-class-team'+(own?' is-own':'')+'">'+
      '<span class="m1-class-name" title="'+esc(row.team_name)+'">'+esc(row.team_name)+
        (own?'<span class="m1-class-you">ZUEN TALDEA</span>':'')+
        '<small>'+total+'/5</small></span>'+
      checks+mark(row.mission_completed===true,'1. misioa',true)+'</div>';
  }).join('');
  const info=error?'<p class="m1-class-info is-error">Konexioa eten da · azken datuak</p>':
    '<p class="m1-class-info">✓ Ariketa gaindituta · M misio osoa</p>';
  return '<div class="m1-class-progress" aria-label="1. misioa: taldeen ariketa eta misioaren aurrerapena">'+
    head+body+info+'</div>';
}
