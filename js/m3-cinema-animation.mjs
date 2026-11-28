const asset = path => new URL('../assets/' + path, import.meta.url).href;
const landscape = name => asset('m3-cinema/' + name + '.webp');

const direction = 'M37 142 Q127 77 252 48 M225 37l28 10-18 22';
const region = 'M71 85 102 57 147 63 187 49 232 80 218 128 168 153 123 139 84 150 52 121Z';
const effects = {
  take: '<path class="outline fill" d="'+region+'"/><path d="M123 107l15 15 34-36"/>',
  direction: '<path class="outline" d="'+direction+'"/><path class="outline" d="M57 158q62-16 113-35m-22-9 23 8-13 18"/>',
  arrive: '<circle class="outline" cx="198" cy="83" r="27"/><circle cx="198" cy="83" r="9"/><path class="outline" d="M53 144Q104 140 172 97"/>',
  occupy: '<path class="outline" d="M33 143Q112 153 169 92h75m-17-15 17 15-17 15"/><path d="M244 61v72m-14 0h29"/>',
  control: '<path class="outline dashed" d="'+region+'"/><path d="M127 106q23-28 49 0-26 28-49 0Z"/><circle cx="152" cy="106" r="6"/>',
  annex: '<path class="outline annex-fill" d="'+region+'"/><path d="M145 123V75m2 2h41l-9 12 9 12h-41"/>',
  protect: '<path class="outline dashed" d="'+region+'"/><path class="shield" d="M151 74q12 10 27 11v22q-4 17-27 29-23-12-27-29V85q15-1 27-11Z"/><path d="m140 102 8 8 14-15"/>',
  rivals: '<path class="tension" d="m25 36 107 59-25 9zM277 36 170 95l25 9z"/><circle class="outline" cx="151" cy="111" r="19"/>',
  transfer: '<path class="outline" d="M59 74h61v52H59z M184 74h61v52h-61zM129 100h43m-11-11 11 11-11 11"/>',
  context: '<path class="outline" d="M99 58h108v93H99z M119 80h68m-68 23h68m-68 23h41"/>',
};
const puff = '<i></i><i></i><i></i><i></i>';
const premiumAsset = name => landscape('premium/' + name);
const train = `<div class="cinema-vehicle cinema-train"><div class="cinema-steam">${puff}</div><img class="cinema-premium-vehicle-image" src="${premiumAsset('train')}" width="1432" height="876" alt="" draggable="false"><span class="cinema-wheel-pocket"><i class="cinema-train-wheel"></i></span></div>`;
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
    const lines = frame.connect ? `<svg viewBox="0 0 720 360" aria-hidden="true">${points.slice(0,-1).map(({x,y}) =>
      `<line x1="${x}" y1="${y}" x2="${origin.x}" y2="${origin.y}"/>`).join('')}</svg>` : '';
    pins.innerHTML = lines + points.map(({key,x,y}) =>
      `<i data-place="${key}" style="left:${x / 7.2}%;top:${y / 3.6}%"></i>`).join('');
    imageLabel.hidden = false;
    imageLabel.textContent = frame.mode === 'map' ? 'Mapa eskematikoa' : 'Paisaia birsortua';
    screen.dataset.mode = frame.mode;
    screen.dataset.draft = String(draft);
    screen.dataset.motion = 'false';
    screen.querySelector('.cinema-symbol').innerHTML = frame.effect ?
      `<svg viewBox="0 0 300 190" class="cinema-effect cinema-effect--${frame.effect}">${effects[frame.effect]}</svg>` : '';
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
