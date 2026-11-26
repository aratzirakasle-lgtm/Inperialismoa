export const ROOMS=[
{title:'Berlingo areto sekretua',objective:'Berlingo Konferentziaren akta, mapa eta karikatura aztertzea.'},
{title:'Fachodako bidegurutzea',objective:'Britainia Handiaren eta Frantziaren hedapen-proiektuak ulertzea eta Fachodako gatazka azaltzea.'},
{title:'Inperioen atlas ezkutua',objective:''},
{title:'Lau inperioen enigma',objective:''},
{title:'Munduko telegrama galduak',objective:''},
{title:'Historiaren epaimahaia',objective:''}];
export function itineraryState(current,berlinDone,fachodaDone,teacherSecond=false){
const completed=[!!berlinDone,!!fachodaDone,false,false,false,false];
return {count:completed.filter(Boolean).length,rooms:ROOMS.map((room,i)=>({...room,id:i+1,current:current===i+1,complete:completed[i],available:i===0||(i===1&&(berlinDone||teacherSecond||current===2))}))};
}
export function itineraryMarkup(current,berlinDone,fachodaDone,teacherSecond=false){
const {count,rooms}=itineraryState(current,berlinDone,fachodaDone,teacherSecond);
return '<div class="m3-itinerary-top"><div class="m3-itinerary-title"><span>❧ &nbsp; 3. MISIOA &nbsp; ❧</span><strong>Inperioen banaketa</strong></div><div class="m3-itinerary-progress" aria-live="polite"><span>Misioko aurrerapena</span><span class="m3-itinerary-dots" aria-hidden="true">'+rooms.map(r=>'<i class="'+(r.complete?'done ': '')+(r.current?'active':'')+'"></i>').join('')+'</span><b>'+count+' / 6</b></div></div><nav class="m3-itinerary-path" aria-label="3. misioaren ariketen ibilbidea">'+rooms.map(r=>'<button type="button" class="m3-itinerary-step'+(r.current?' is-current':'')+(r.complete?' is-complete':'')+(!r.available?' is-locked':'')+'" data-m3-room="'+r.id+'" '+(r.current?'aria-current="step" ':'')+(!r.available?'disabled ':'')+'aria-label="'+r.id+'. '+r.title+' · '+(r.complete?'Osatuta':r.current?'Oraingo ariketa':r.available?'Eskuragarri':'Blokeatuta')+'"><span class="m3-itinerary-medal" style="--medal-pos:'+((r.id-1)*20)+'%"><span class="m3-itinerary-num">'+r.id+'</span>'+(r.complete?'<span class="m3-itinerary-check" aria-hidden="true">✓</span>':!r.available?'<span class="m3-itinerary-lock" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></span>':'')+'</span><span class="m3-itinerary-label">'+r.title+'</span></button>').join('')+'</nav><div class="m3-itinerary-objective"><b>Oraingo ariketa: '+rooms[current-1].title+'</b><span><b>Helburua:</b> '+rooms[current-1].objective+'</span></div>';
}
