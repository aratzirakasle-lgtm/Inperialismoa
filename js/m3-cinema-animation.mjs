const asset = name => new URL('../assets/m3-cinema/' + name + '.webp', import.meta.url).href;

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
const train = `<div class="cinema-vehicle cinema-train"><div class="cinema-steam">${puff}</div>
  <svg viewBox="0 0 420 134" focusable="false"><defs>
    <linearGradient id="cinema-iron" x2="0%" y2="100%" gradientUnits="objectBoundingBox"><stop stop-color="#6f766f"/><stop offset=".32" stop-color="#343c3c"/><stop offset=".67" stop-color="#171d1e"/><stop offset="1" stop-color="#080a0a"/></linearGradient>
  </defs><path d="M3 58h92v52H3z" fill="#222927" stroke="#514c3c" stroke-width="2"/><path d="m6 59 9-12 58 1 20 11m-79 23h72" fill="#25221e" stroke="#61513b" stroke-width="3"/>
  <path d="M98 25h73v84H98z" fill="#3c3228" stroke="#b29052" stroke-width="2"/><path d="m91 27 11-9h67l13 9" fill="#1a211f" stroke="#746049" stroke-width="4"/><path d="M110 35h24v25h-24zm34 0h16v25h-16z" fill="#b4ab78" stroke="#211e16" stroke-width="4"/>
  <path d="M166 51h162q15 0 15 19t-15 21H166z" fill="url(#cinema-iron)" stroke="#242323" stroke-width="3"/><path d="M191 51v-6q0-14 18-14t18 14v7m34 0v-7q0-12 12-12t12 12v8m25-2V25h-5v-7h31v7h-5v25" fill="#2a2e2a" stroke="#887046" stroke-width="2"/>
  <path d="M194 55v33m37-33v32m61-32v32m29-32v33" stroke="#a78b57" opacity=".7"/><path d="M86 91h261v17H86z" fill="#3c3026" stroke="#82503d" stroke-width="2"/><path d="M346 93l26 24h-39z" fill="#623f30" stroke="#ad7852" stroke-width="2"/><circle cx="344" cy="59" r="6" fill="#fff2ab"/>
  ${[[27,111,12],[71,111,12],[139,105,23],[201,105,23],[263,105,23],[318,112,12]].map(([x,y,r]) => `<g transform="translate(${x} ${y})"><g class="cinema-train-wheel"><circle r="${r}" fill="#262626" stroke="#352719" stroke-width="3"/><circle r="${r-3}" fill="none" stroke="#ad6d4c" stroke-width="2"/><path d="M-${r-4} 0h${2*r-8}M0 -${r-4}v${2*r-8}" stroke="#ad6d4c" stroke-width="2"/><circle r="3" fill="#c8b27c"/></g></g>`).join('')}
  <path d="M139 108h126" stroke="#c89361" stroke-width="3" opacity=".8"/></svg></div>`;

const vesselSvg = `<svg viewBox="0 0 420 150" focusable="false"><defs>
  <linearGradient id="cinema-hull" x2="0%" y2="100%" gradientUnits="objectBoundingBox"><stop stop-color="#4d534c"/><stop offset=".4" stop-color="#28292a"/><stop offset=".73" stop-color="#0e1416"/><stop offset="1" stop-color="#652e21"/></linearGradient>
  </defs><g id="cinema-vessel"><path d="M29 112h254l82-7 38-10-16 22-38 17H67q-23-4-38-22Z" fill="url(#cinema-hull)" stroke="#29231b" stroke-width="2"/>
  <path d="M47 119h299l37-11M66 132h278" stroke="#b66d45" stroke-width="2"/><path d="M62 107V91h215l27 15zm42-18V73h158l12 17z" fill="#c7b594" stroke="#655342" stroke-width="2"/>
  <path d="M125 72v-11h95v11M129 96h136m-159-16h155" stroke="#413830" stroke-width="3" stroke-dasharray="4 5"/>
  <path d="M159 74l-3-41h18l3 41m22 0-2-37h16l3 37" fill="#68503d" stroke="#211d1c" stroke-width="3"/><path d="M155 38h20m20 4h20" stroke="#d7a14f" stroke-width="3"/>
  <path d="M98 92V19m202 85V14M85 35h25m176-3h28m-217-9-34 68m35-68 46 57m154-59-45 63m45-63 43 77" stroke="#332a21" stroke-width="2"/><path d="M32 113h368" stroke="#d2b285" stroke-width="2"/></g></svg>`;
const ship = `<div class="cinema-vehicle cinema-ship"><div class="cinema-wake"></div><div class="cinema-steam">${puff}</div><div class="cinema-hull">${vesselSvg}<svg class="cinema-reflection" viewBox="0 0 420 150"><use href="#cinema-vessel"/></svg></div></div>`;

export function screenMarkup() {
  return `<div class="cinema-frame"><div class="cinema-screen" data-cinema-screen>
    <div class="cinema-landscape"></div><div class="cinema-sky"></div><div class="cinema-water"></div>
    <div class="cinema-rails"></div><div class="cinema-objects" aria-hidden="true">${train}${ship}</div>
    <div class="cinema-symbol" aria-hidden="true"></div><div class="cinema-vignette"></div><div class="cinema-transition"></div>
    <b class="cinema-draft">ZIRRIBORROA · Egiaztatu gabe</b>
    <div class="cinema-caption"><small></small><strong></strong><span></span></div>
    <div class="cinema-end" role="status" hidden><i aria-hidden="true">✓</i><strong>HIRU FILMAK BERRESKURATUTA</strong><span>Inperialismoaren hedapena berreraiki duzue.</span></div>
  </div></div>`;
}

const shot = (art, mode, title, effect = '', note = '', duration = 2500) => ({art, mode, title, effect, note, duration});
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
    shot('japan','land','Txina eta Errusia','rivals','AURKARIAK · Nazioarteko lehia',2000),
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

const takes = {
  t_a_siberia: ['siberia','train','take'], t_a_direction: ['himalaya','land','direction'],
  t_a_china: ['china','land','arrive'], t_b_occupation: ['ocean','ship','occupy'],
  t_b_war: ['ocean','land','context'], t_c_annex: ['japan','ship','annex'],
  t_c_manchuria: ['manchuria','land','protect'], t_c_rivals: ['japan','land','rivals'],
};

export function preview(film, field, value, label) {
  const cuba = {control:'control', annex:'annex', transfer:'transfer'};
  const [art, mode, effect] = field.id === 't_b_cuba' ? ['cuba','ship',cuba[value]] :
    takes[field.id] || [film.poster, film.mode, 'context'];
  return [shot(art,mode,label,effect,field.action || 'KUBAKO MEKANISMOA',2400)];
}

export function stage(root, onPlayback) {
  const screen = root.querySelector('[data-cinema-screen]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const caption = screen.querySelector('.cinema-caption');
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
    screen.style.setProperty('--shot', `url("${asset(frame.art)}")`);
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
      screen.dataset.draft = 'false';
    },
    stop,
  };
}
