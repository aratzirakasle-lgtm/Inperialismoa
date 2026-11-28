const asset = path => new URL('../assets/' + path, import.meta.url).href;
const landscape = name => asset('m3-cinema/' + name + '.webp');

const effectLight = `<defs>
  <radialGradient id="cinema-effect-glow">
    <stop stop-color="currentColor" stop-opacity=".48"/>
    <stop offset=".56" stop-color="currentColor" stop-opacity=".13"/>
    <stop offset="1" stop-color="currentColor" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="cinema-effect-inlay" x2="0" y2="1">
    <stop stop-color="currentColor" stop-opacity=".52"/>
    <stop offset="1" stop-color="currentColor" stop-opacity=".12"/>
  </linearGradient>
</defs>
<ellipse class="glow" cx="151" cy="100" rx="147" ry="90"/>`;

const effects = {
  take: `<path class="inlay" d="M56 92 89 66 125 71 165 49 211 60 242 85 226 127 180 147 133 138 95 151 63 128Z"/>
    <path class="detail" d="m73 94 21-17 33 5 40-22 40 11 23 17-14 32-38 17-44-10-39 13-21-18Z"/>
    <path class="emblem" d="m121 99 19 19 38-42"/>`,
  direction: `<path class="track" d="M35 149C96 91 180 55 252 46m-24-12 24 12-16 23"/>
    <path class="detail" d="M49 156c36-17 70-28 104-37m-15-8 15 8-10 14"/>
    <circle class="emblem" cx="35" cy="149" r="5"/>
    <path class="detail" d="M86 68h30m-15-15v30m91 50h18m-9-9v18"/>`,
  arrive: `<path class="track" d="M37 144Q114 137 171 98"/>
    <circle class="detail" cx="199" cy="82" r="38"/><circle class="fine-ring" cx="199" cy="82" r="31"/>
    <path class="emblem" d="M199 64c9 0 16 7 16 16 0 12-16 27-16 27s-16-15-16-27c0-9 7-16 16-16Z"/>
    <circle class="detail" cx="199" cy="80" r="6"/>`,
  occupy: `<path class="track" d="M33 144c45 8 81-5 113-29 20-15 36-27 67-30m-12-10 14 10-13 11"/>
    <circle class="detail" cx="231" cy="83" r="37"/><circle class="fine-ring" cx="231" cy="83" r="31"/>
    <circle class="inlay" cx="231" cy="83" r="26"/>
    <path class="emblem" d="M231 65v35m-10-23h20m-28 9c2 10 9 14 18 14s16-4 18-14m-36 0-3 4m39-4 3 4"/>
    <circle class="emblem" cx="231" cy="65" r="4"/>
    <path class="detail" d="M45 155c21 2 40 0 56-5m-65-18 17 1 11-3"/>`,
  control: `<ellipse class="detail" cx="151" cy="95" rx="91" ry="48"/>
    <ellipse class="fine-ring" cx="151" cy="95" rx="104" ry="61"/>
    <path class="track" d="M42 71V52h21m176 0h21v19m0 48v19h-21m-176 0H42v-19"/>
    <path class="detail" d="M59 95h53m77 0h54M151 47v18m0 59v19"/>
    <path class="inlay" d="M112 95q39-43 78 0-39 43-78 0Z"/>
    <circle class="emblem" cx="151" cy="95" r="12"/><circle class="detail" cx="151" cy="95" r="5"/>`,
  annex: `<path class="detail" d="M116 129 97 160l23-4 9 17 16-28m40-16 19 31-23-4-9 17-16-28"/>
    <path class="inlay" d="m151 25 15 9 17-2 10 13 16 4 5 16 13 11-2 16 8 15-10 13-3 17-16 6-11 13-16-2-16 8-14-8-17 2-10-13-16-5-4-17-11-12 7-16-2-17 13-10 5-16 17-5 10-13 17 2Z"/>
    <circle class="detail" cx="151" cy="92" r="49"/><circle class="fine-ring" cx="151" cy="92" r="43"/>
    <path class="emblem" d="M136 116V68m2 3c13-8 26 8 40 0v26c-14 8-27-8-40 0m-11 19h30"/>`,
  protect: `<path class="detail" d="M126 137c-27-5-42-21-49-48m0 0-8-12m16 25-13-3m20 14-14 1m24 10-13 6m86 7c27-5 42-21 49-48m0 0 8-12m-16 25 13-3m-20 14 14 1m-24 10 13 6"/>
    <path class="inlay" d="M151 38q27 14 55 16v40c0 24-15 44-55 64-40-20-55-40-55-64V54q28-2 55-16Z"/>
    <path class="detail" d="M151 49q23 12 45 14v31c0 21-15 37-45 53-30-16-45-32-45-53V63q22-2 45-14Z"/>
    <path class="emblem" d="m133 94 13 13 24-27"/>
    <path class="fine-ring" d="M49 70Q151 4 253 70m0 53q-102 67-204 0"/>`,
  context: `<path class="inlay" d="M105 47h89l16 18v94H90V63Z"/>
    <path class="detail" d="M194 47v20h16M103 72v74h94m-73-58h55m-55 15h55m-55 15h33"/>
    <path class="emblem" d="M122 70h51"/>`,
};
const puff = '<i></i><i></i><i></i><i></i>';
const premiumAsset = name => landscape('premium/' + name);
const train = `<div class="cinema-vehicle cinema-train"><span class="cinema-train-contact"></span><div class="cinema-steam">${puff}</div><img class="cinema-premium-vehicle-image" src="${premiumAsset('train')}" width="1432" height="876" alt="" draggable="false"><span class="cinema-wheel-pocket"><i class="cinema-train-wheel"></i></span></div>`;
const ship = `<div class="cinema-vehicle cinema-ship"><div class="cinema-wake"></div><div class="cinema-steam">${puff}</div><div class="cinema-hull"><img class="cinema-premium-vehicle-image" src="${premiumAsset('ship')}" width="1414" height="1036" alt="" draggable="false"><img class="cinema-reflection" src="${premiumAsset('ship')}" alt="" draggable="false"></div></div>`;

export function screenMarkup() {
  return `<div class="cinema-frame"><div class="cinema-screen" data-cinema-screen>
    <div class="cinema-landscape"></div><div class="cinema-sky"></div><div class="cinema-water"></div>
    <div class="cinema-map" hidden><div class="cinema-map-paper">
      <img src="${asset('atlas-museum-world.svg')}" alt=""><div class="cinema-map-points"></div>
    </div></div>
    <div class="cinema-rails"></div><div class="cinema-objects" aria-hidden="true">${train}${ship}</div>
    <div class="cinema-symbol" aria-hidden="true"></div><div class="cinema-vignette"></div><div class="cinema-transition"></div>
    <small class="cinema-image-label"></small><b class="cinema-draft">ZIRRIBORROA · Egiaztatu gabe</b>
    <div class="cinema-caption"><small></small><strong></strong><span></span></div>
    <div class="cinema-end" role="status" hidden><i aria-hidden="true">✓</i><strong>HIRU FILMAK BERRESKURATUTA</strong><span>Inperialismoaren hedapena berreraiki duzue.</span></div>
  </div></div>`;
}

const shot = (art, mode, title, effect = '', note = '', duration = 2500) => ({art, mode, title, effect, note, duration});
const locations = {
  'cape-verde': [15.1,-23.6], sahara: [24.5,12], cuba: [23.1,-82.4], 'puerto-rico': [18.5,-66.1],
  libya: [27,18], eritrea: [15.3,39], siberia: [56,105], india: [23,78],
  angola: [-12,18], mozambique: [-18,35], china: [39.9,116.4], ru: [55.8,37.6],
  jp: [35.7,139.7], us: [38.9,-77], spain: [40.4,-3.7], portugal: [38.7,-9.1],
  belgium: [50.8,4.4], italy: [41.9,12.5], berlin: [52.5,13.4], fachoda: [9.9,32.1],
  philippines: [14.6,121],
};
const mapShot = (keys, title, note = '', duration = 2400, connect = false) => ({
  ...shot(null,'map',title,'',note,duration),
  points: keys.map(key => {
    const [lat,lon] = locations[key];
    return { key, x: (lon + 180) * 2, y: (90 - lat) * 2 };
  }),
  connect,
});
export const stories = {
  a: [
    shot('siberia','train','Siberia','take','HARTU · Lurraldea bereganatu',3000),
    shot('himalaya','land','Himalaiara eta Indiara','direction','ZABALDU · Hedapenaren norabidea',3000),
    shot('china','land','Txinako lurraldeetara','arrive','HELDU · Helmugara iritsi',2800),
  ],
  b: [
    shot('ocean','ship','Itsasorantz','','',1900),
    shot('philippines','ship','Filipinak','occupy','OKUPATU · Portuko presentzia',2100),
    shot('puerto-rico','ship','Puerto Rico','occupy','OKUPATU · Beste itsas eszenatoki bat',2100),
    shot('cuba','ship','Kuba','control','KONTROLATU · Eragin-eremua',2300),
    shot('ocean','land','1898an Espainiaren aurkako gerra','context','Testuingurua',1900),
  ],
  c: [
    shot('japan','ship','Japonia','','',1700),
    mapShot(['china','ru','jp'],'Txina eta Errusia','AURKARIAK · Nazioarteko lehia',2000,true),
    shot('formosa','ship','Formosa','annex','ANEXIONATU · Lurraldearen estatusa aldatu',2100),
    shot('korea','ship','Korea','annex','ANEXIONATU · Beste lurralde bat',2100),
    shot('manchuria','land','Mantxuria','protect','PROTEKTORATUA · Babes-eremuaren irudikapena',2400),
  ],
};
for (const [id, title] of [['a','Errusia'],['b','Estatu Batuak'],['c','Japonia']]) {
  for (const frame of stories[id]) frame.action = title;
}
export const finalStory = Object.values(stories).flat().map(frame => ({
  ...frame, duration: Math.round(frame.duration * 0.84),
}));

const coastalShots = {
  'philippines-puerto-rico': [['philippines','Filipinak'],['puerto-rico','Puerto Rico']],
  'formosa-korea': [['formosa','Formosa'],['korea','Korea']],
};

export function preview(field, value, label) {
  const action = field.action || 'KUBAKO MEKANISMOA';
  const scene = (art, mode, effect) => [shot(art,mode,label,effect,action,2400)];
  const map = (...keys) => [mapShot(keys,label,action)];
  switch (field.id) {
    case 't_a_siberia':
      if (value === 'siberia') return scene('siberia','train','take');
      return scene(value,'land','context');
    case 't_a_direction':
      if (value === 'himalaya-india') return scene('himalaya','land','direction');
      return value === 'cuba-puerto-rico' ? map('cuba','puerto-rico') : map('libya','eritrea');
    case 't_a_china':
      return value === 'china' ? scene('china','land','arrive') : map(value);
    case 't_b_occupation':
    case 't_c_annex': {
      const pair = coastalShots[value];
      if (!pair) return value === 'siberia-india' ? map('siberia','india') : map('angola','mozambique');
      const effect = field.id === 't_b_occupation' ? 'occupy' : 'annex';
      return pair.map(([art, place]) => shot(art,'ship',place,effect,action,2400));
    }
    case 't_b_cuba':
      return scene('cuba','ship',value === 'control' ? 'control' : 'context');
    case 't_b_war':
      if (value === 'war-1898') return map('cuba','puerto-rico','philippines');
      return map(value === 'berlin-1884' ? 'berlin' : 'fachoda');
    case 't_c_manchuria':
      if (value === 'manchuria') return scene('manchuria','land','protect');
      return value === 'cuba' ? scene('cuba','land','protect') : scene('siberia','train','take');
    case 't_c_rivals': {
      const pairs = {'china-russia':['china','ru'], 'spain-portugal':['spain','portugal'], 'belgium-italy':['belgium','italy']};
      return [mapShot(pairs[value],label,action,2400,true)];
    }
    default:
      return map(value);
  }
}

export function stage(root, onPlayback) {
  const screen = root.querySelector('[data-cinema-screen]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const caption = screen.querySelector('.cinema-caption');
  const map = screen.querySelector('.cinema-map');
  const pins = map.querySelector('.cinema-map-points');
  const imageLabel = screen.querySelector('.cinema-image-label');
  const setText = (part, value) => { caption.querySelector(part).textContent = value; };
  let timer, started, remaining, index, playback, paused = false;

  function signal() {
    root.dataset.running = String(!!playback && !paused);
    root.dataset.paused = String(paused);
    onPlayback({ playing: !!playback, paused, kind: playback?.kind });
  }
  function stop() {
    clearTimeout(timer);
    playback = null;
    paused = false;
    screen.dataset.motion = 'false';
    signal();
  }
  function render(frame, draft, running = false) {
    screen.querySelector('.cinema-end').hidden = true;
    caption.hidden = false;
    const source = frame.art ? landscape(frame.art) : asset('atlas-museum-world.svg');
    screen.style.setProperty('--shot', `url("${source}")`);
    map.hidden = frame.mode !== 'map';
    const points = frame.points || [];
    const origin = points.at(-1);
    map.classList.toggle('cinema-map--rivals',Boolean(frame.connect));
    const lines = frame.connect ? `<svg viewBox="0 0 720 360" aria-hidden="true">${points.slice(0,-1).map(({x,y}) => {
      const length = Math.hypot(origin.x - x,origin.y - y);
      const lift = Math.min(38,length * .23);
      const curve = `M${x} ${y}Q${(x + origin.x) / 2} ${(y + origin.y) / 2 - lift} ${origin.x} ${origin.y}`;
      return `<path class="cinema-rival-halo" d="${curve}"/><path class="cinema-rival-thread" d="${curve}"/>`;
    }).join('')}</svg>` : '';
    pins.innerHTML = lines + points.map(({key,x,y}) =>
      `<i data-place="${key}" style="left:${x / 7.2}%;top:${y / 3.6}%"></i>`).join('');
    imageLabel.hidden = false;
    imageLabel.textContent = frame.mode === 'map' ? 'Mapa eskematikoa' : 'Paisaia birsortua';
    screen.dataset.mode = frame.mode;
    screen.dataset.draft = String(draft);
    screen.dataset.motion = 'false';
    screen.querySelector('.cinema-symbol').innerHTML = frame.effect ?
      `<svg viewBox="0 0 300 190" class="cinema-effect cinema-effect--${frame.effect}">${effectLight}${effects[frame.effect]}</svg>` : '';
    setText('small', frame.action || '');
    setText('strong', frame.title || '');
    setText('span', frame.note || '');
    if (running && !motion.matches) {
      // Rebuild CSS motion once per shot, independent of the projector's spin.
      void screen.offsetWidth;
      screen.dataset.motion = 'true';
    }
  }
  function schedule() {
    started = performance.now();
    timer = setTimeout(advance, remaining);
  }
  function advance() {
    if (!playback) return;
    const next = playback.frames[index++];
    if (!next) {
      const ended = playback;
      stop();
      ended.onEnd?.();
      return;
    }
    render(next, playback.kind === 'draft', true);
    remaining = next.duration;
    schedule();
  }
  return {
    idle(film, complete, name) {
      stop();
      render(shot(film.poster,film.mode,complete ? film.name : name,'',complete ? film.summary : ''),!complete);
    },
    play(frames, kind, onEnd) {
      clearTimeout(timer);
      playback = { frames, kind, onEnd };
      paused = false;
      index = 0;
      signal();
      advance();
    },
    pause() {
      if (!playback || paused) return;
      clearTimeout(timer);
      remaining = Math.max(0, remaining - (performance.now() - started));
      paused = true;
      signal();
    },
    resume() {
      if (!paused) return;
      paused = false;
      signal();
      schedule();
    },
    endCard() {
      stop();
      screen.querySelector('.cinema-end').hidden = false;
      caption.hidden = true;
      imageLabel.hidden = true;
      screen.dataset.draft = 'false';
    },
    stop,
  };
}
