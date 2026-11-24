/* Profesorado: actividad y superación son independientes; no inferir presencia. */
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const same=(a,b)=>String(a)===String(b);
const exercises=[1,2,3,4,5];
const names=[['Galería','Sistemas políticos','Definición','Imperios','Frases'],['Factores','Cronología','Atlas','Archivo','Consecuencias']];
export function indexTeacherActivity(sources){
 const index=new Map();
 for(const source of sources||[]){
  if(!Array.isArray(source.rows))continue;
  for(const row of source.rows){
   const n=source.exercise||Number(row.exercise);
   const stamp=row.updated_at||row.created_at;
   if(!row.team_id||!exercises.includes(n)||!stamp||!Number.isFinite(Date.parse(stamp)))continue;
   const key=[row.team_id,source.mission,n].join(':');
   const before=index.get(key);
   if(!before||Date.parse(stamp)>Date.parse(before))index.set(key,stamp);
  }
 }
 return index;
}
export function renderTeacherLiveProgress({teams=[],m1=[],m2=[],activity=new Map(),classId=null,errors=[],lastSync=null,demo=false}={}){
 if(demo)return '<section class="card"><h3>Seguimiento de los diez ejercicios</h3><p>Disponible con una sesión docente real.</p></section>';
 const visible=teams.filter(t=>!classId||same(t.class_id,classId));
 const date=x=>{if(!x)return '—';const d=new Date(x);return Number.isFinite(+d)?d.toLocaleString('es-ES',{timeZone:'Europe/Madrid',dateStyle:'short',timeStyle:'short'}):'—'};
 const rows=[m1,m2];
 const summary=rows.map(list=>{
  const known=visible.filter(t=>list.some(r=>same(r.team_id,t.id)&&typeof r.mission_completed==='boolean'));
  const done=known.filter(t=>list.some(r=>same(r.team_id,t.id)&&r.mission_completed===true)).length;
  return (known.length?done+'/'+known.length:'—')+(known.length<visible.length?' · '+(visible.length-known.length)+' sin datos':'');
 });
 const body=visible.map(t=>{
  let last=null;
  const marks=rows.map((list,i)=>{
   const row=list.find(r=>same(r.team_id,t.id));
   return exercises.map(n=>{
    const stamp=activity.get([t.id,i+1,n].join(':'));
    if(stamp&&(!last||Date.parse(stamp)>Date.parse(last)))last=stamp;
    const known=typeof row?.['exercise_'+n]==='boolean',done=row?.['exercise_'+n]===true;
    const kind=done?'done':!known?'unknown':stamp?'draft':'pending';
    const label=done?'Superado':!known?'Sin datos confirmados':stamp?'Actividad registrada; no superado':'No superado; actividad no confirmada';
    const detail='Misión '+(i+1)+' · '+n+'. '+names[i][n-1]+' · '+label+(stamp?' · '+date(stamp):'');
    return '<td><span class="teacher-live-mark is-'+kind+'" role="img" aria-label="'+esc(detail)+'" title="'+esc(detail)+'">'+({done:'✓',unknown:'?',draft:'◐',pending:'○'}[kind])+'</span></td>';
   }).join('');
  }).join('');
  const roster=rows.map(list=>list.find(r=>same(r.team_id,t.id))?.member_names).find(v=>Array.isArray(v)&&v.length)||t.members||[];
  return '<tr><th scope="row">'+esc(t.name)+'<span class="teacher-live-members">'+esc(roster.join(', '))+'</span></th>'+marks+'<td>'+esc(date(last))+'</td></tr>';
 }).join('');
 const header=names.map((list,i)=>list.map((name,j)=>'<th scope="col" title="'+esc(name)+'" aria-label="'+esc('Misión '+(i+1)+': '+name)+'">'+(j+1)+'</th>').join('')).join('');
 return '<section class="card"><h3>Seguimiento de los diez ejercicios</h3><p class="card-sub">Por clase y equipo · actualización cada 15 segundos con el panel visible.</p><div class="teacher-live-stats"><span>Equipos: '+visible.length+'</span><span>Misión 1: '+(errors.includes('m1')?'últimos datos · ':'')+esc(summary[0])+'</span><span>Misión 2: '+(errors.includes('m2')?'últimos datos · ':'')+esc(summary[1])+'</span></div>'+
 (errors.length?'<p class="notice amber" role="status">No se han podido actualizar todos los datos. Se muestran los últimos confirmados; los desconocidos llevan ?.</p>':'')+
 '<div class="table-scroll"><table class="teacher-live-grid"><thead><tr><th rowspan="2" scope="col">Equipo e integrantes</th><th colspan="5" scope="colgroup">Misión 1</th><th colspan="5" scope="colgroup">Misión 2</th><th rowspan="2" scope="col">Última actividad registrada</th></tr><tr>'+header+'</tr></thead><tbody>'+body+'</tbody></table></div>'+
 (!visible.length?'<p>No hay equipos en esta selección.</p>':'')+
 '<p class="teacher-live-note">✓ Superado · ◐ Actividad registrada sin superación · ○ No superado, sin actividad confirmada · ? Sin datos. La actividad refleja escrituras o intentos guardados, no presencia en línea ni corrección de borradores.</p><p class="teacher-live-note">Última consulta completa: '+esc(date(lastSync))+'</p></section>';
}
