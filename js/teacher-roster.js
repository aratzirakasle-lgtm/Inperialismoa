/* Inperialismoa · Registro docente de alumnos pendientes de alta.
 * No incluir alumnos reales en el repositorio. Solo datos de Supabase.
 */
const escapeHtml = s => String(s??"").replace(/[&<>"']/g,c=>(
 {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export function renderTeacherRoster(classes,teams,roster,activeClass){
 const visible=classes.filter(c=>!activeClass||String(c.id)===String(activeClass));
 const cards=visible.map(c=>{
  const teamIds=new Set(teams.filter(t=>String(t.class_id)===String(c.id)).map(t=>String(t.id)));
  const rows=(roster||[]).filter(r=>teamIds.has(String(r.team_id)));
  if(!rows.length)return "";
  const remaining=rows.filter(r=>!r.auth_user_id).length;
  const byTeam=[...teamIds];
  const names=new Map(teams.map(t=>[String(t.id),t.name]));
  const ordered=[...rows].sort((a,b)=>
     (names.get(String(a.team_id))||"").localeCompare(names.get(String(b.team_id))||"", "eu")||
     Number(a.slot)-Number(b.slot));
  return '<section class="card" style="margin-top:18px;border:1px solid #c8b18e">'+
   '<h3>'+escapeHtml(c.name)+' · Ikasleen kontuak</h3>'+
   '<p class="card-sub">Irakaslearen erregistro pribatua · '+
     rows.length+' ikasle · '+(rows.length-remaining)+' kontu sortuta</p>'+
   '<div class="table-scroll"><table><thead><tr><th>Taldea</th><th>Ikaslea</th>'+
   '<th>Kontua</th><th>Kudeatu</th></tr></thead><tbody>'+
   ordered.map(r=>'<tr><td>'+escapeHtml(names.get(String(r.team_id))||"")+'</td>'+
   '<td>'+escapeHtml(r.display_name)+'</td>'+
   '<td>'+(r.auth_user_id?'✓ Prest':'Sortzeko')+'</td>'+
   '<td>'+(r.auth_user_id?'<button type="button" class="btn tiny outline" '+
     'data-roster-reset="'+escapeHtml(r.id)+'" data-roster-class="'+escapeHtml(c.id)+
     '">Pasahitza berritu</button>':'—')+'</td></tr>').join('')+'</tbody></table></div>'+
   (remaining?'<p><button type="button" class="btn primary" '+
      'data-roster-create="'+escapeHtml(c.id)+'">'+remaining+
      ' ikasleren kontuak sortu eta kredentzialak ikusi</button></p>':
      '<p class="card-sub">Kontu guztiak sortuta. Pasahitzak berritu daitezke behar izanez gero.</p>')+
   '<p class="card-sub">Kredentzialak irakaslearen pantailan bakarrik erakusten dira, behin. '+
   'Gorde zerrenda leku pribatu batean eta eman ikasle bakoitzari bere sarbidea.</p></section>';
 }).filter(Boolean).join('');
 return cards||'<div class="card"><p class="card-sub">Ez dago ikasleen alta-erregistrorik hautatutako gelan.</p></div>';
}
