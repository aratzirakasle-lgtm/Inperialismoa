import * as M from './m3-cinema.mjs';
import { finalStory, preview, screenMarkup, stage, stories } from './m3-cinema-animation.mjs?v=premium1';

const sourceFiles = new WeakMap();
const mounted = new WeakMap();
const icons = {
  film: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M7 5v14m10-14v14M3 10h4m-4 4h4m10-4h4m-4 4h4"/>',
  notes: '<path d="M12 5Q7 1 3 4v15q5-3 9 0 4-3 9 0V4q-4-3-9 1Zm0 0v14"/>',
  play: '<path d="m8 4 12 8-12 8z"/>',
  pause: '<path d="M9 5v14m6-14v14"/>',
  skip: '<path d="m5 5 10 7-10 7zm13 0v14"/>',
  reset: '<path d="M4 5v6h6m-6 0a8 8 0 1 1 2 7"/>',
  shield: '<path d="M12 3q4 3 8 3v5q0 6-8 10-8-4-8-10V6q4 0 8-3Z"/>',
  beam: '<path d="m2 4 9 6-3 3zm20 0-9 6 3 3zM12 14v8M8 17h8"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">${icons[name]}</svg>`;
const projectorMarkup = `<div class="cinema-projector" aria-hidden="true">
  <div class="cinema-beam"></div><div class="cinema-dust"><i></i><i></i><i></i><i></i><i></i><i></i></div>
  <div class="cinema-reel reel-top"><i></i></div><div class="cinema-reel reel-back"><i></i></div><div class="cinema-strip"></div>
  <div class="cinema-projector-body"></div>
</div>`;

const filmLabel = film => film.id.toUpperCase() + ' FILMA';
function filmCard(film) {
  return `<button data-cinema-film="${film.id}" class="cinema-film" type="button">
    <span class="cinema-film-art shot-${film.poster}" aria-hidden="true"></span>
    <span class="cinema-film-label">${filmLabel(film)}</span>
    <span class="cinema-film-status"></span><span class="cinema-seal" aria-hidden="true" hidden>✓</span>
  </button>`;
}

function controlsMarkup(film) {
  return film.fields.map((field, index) => {
    const mechanical = field.device === 'lever' || field.device === 'switch';
    const title = `<h3>${field.title}</h3>`;
    const options = field.options.map(([id, label], i) => `<button type="button" data-cinema-option="${id}"
      title="${label}" aria-label="${label}" aria-pressed="false">${field.device === 'buttons' ? label : i + 1}</button>`).join('');
    const deviceIcon = field.device === 'shield' ? icon('shield') : field.device === 'beams' ? icon('beam') : '';
    const mechanism = field.device === 'buttons' ? `<div class="cinema-direct">${options}</div>` :
      `<div class="cinema-device">
        <button class="cinema-dial" data-cinema-dial type="button" aria-label="${field.title} · Hurrengo aukera"><span>${deviceIcon}</span></button>
        <div class="cinema-device-right"><output class="cinema-choice">Hautatu…</output>
          <div class="cinema-options" role="group" aria-label="${field.title} · Aukerak">${options}</div>
        </div>
      </div><button type="button" class="cinema-actuator ${mechanical ? 'cinema-lever' : ''}" data-cinema-act>
        <i aria-hidden="true"></i><b>${field.action}</b>
      </button>`;
    return `<section class="cinema-control" data-cinema-field="${field.id}" data-device="${field.device}">
      <div class="cinema-control-title"><span aria-hidden="true">${String(index + 1).padStart(2,'0')}</span>${title}</div>
      ${mechanism}
    </section>`;
  }).join('');
}

function markup() {
  return `<section class="m3-cinema" aria-labelledby="cinema-title">
    <header class="cinema-heading">
      <div><h2 id="cinema-title">5. Inperialismoa mugimenduan</h2><p>Berreraiki historiaren hiru filmak</p></div>
      <button type="button" class="cinema-brass" data-cinema-notes>${icon('notes')} 22. diapositiba ikusi</button>
    </header>
    <p class="cinema-instruction">Aztertu 22. diapositiba eta berreraiki Errusiaren, Estatu Batuen eta Japoniaren hedapen inperialistari buruzko filmak.</p>
    <div class="cinema-room">
      <aside class="cinema-shelf" aria-label="Filmategia">
        <h3>${icon('film')} <span>Filmategia</span></h3>
        <div class="cinema-films">${M.FILMS.map(filmCard).join('')}</div>
        <section class="cinema-progress" aria-label="Filmen egoera">
          <h3>Filmen egoera</h3><p data-cinema-decisions></p><progress max="12" value="0" aria-label="Erabakiak"></progress><p data-cinema-count></p>
        </section>
        ${projectorMarkup}
      </aside>
      <div class="cinema-work">
        ${screenMarkup()}
        <div class="cinema-desk">
          <div class="cinema-editbar"><h3 data-cinema-edit-title></h3><span data-cinema-feedback role="status"></span>
            <div class="cinema-transport" aria-label="Proiekzioaren kontrolak">
              <button type="button" data-cinema-replay aria-label="Errepikatu" title="Errepikatu">${icon('play')}</button>
              <button type="button" data-cinema-pause aria-label="Pausatu" title="Pausatu">${icon('pause')}</button>
              <button type="button" data-cinema-skip aria-label="Saltatu" title="Saltatu">${icon('skip')}</button>
            </div>
          </div>
          <div class="cinema-montage" aria-label="Muntaketa-lerroa"></div>
          <div class="cinema-controls"></div>
          <div class="cinema-actions">
            <button type="button" class="cinema-secondary" data-cinema-reset>${icon('reset')} Berriz hasi</button>
            <div>
              <button type="button" class="cinema-brass" data-cinema-check>Egiaztatu filma</button>
              <button type="button" class="cinema-brass" data-cinema-next hidden>Hurrengo filma →</button>
              <button type="button" class="cinema-brass" data-cinema-final disabled>Azken proiekzioa</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <dialog class="cinema-notes-dialog" aria-labelledby="cinema-notes-title">
      <header><h3 id="cinema-notes-title">22. diapositiba · Jatorrizko apunteak</h3><button type="button" aria-label="Itxi" data-notes-close>×</button></header>
      <div class="cinema-notes-tools" hidden><button type="button" data-notes-zoom aria-pressed="false">Handitu</button></div>
      <div class="cinema-source" hidden><img alt="22. diapositiba · Errusia, Estatu Batuak eta Japonia"></div>
      <div class="cinema-source-fallback" hidden><p>Hautatu ikasgelako jatorrizko PDFa 22. diapositiba irekitzeko.</p>
        <label>Apunteen PDFa <input type="file" accept="application/pdf,.pdf" data-notes-file></label>
        <a data-notes-link target="_blank" rel="noopener" hidden>Ireki 22. diapositiba ↗</a>
      </div>
    </dialog>
    <dialog class="cinema-reset-dialog" aria-labelledby="cinema-reset-title"><form method="dialog">
      <h3 id="cinema-reset-title">Muntaketa berriz hasi?</h3><p>Hiru filmetako erabakiak eta zigiluak ezabatuko dira.</p>
      <div><button value="cancel" autofocus>Utzi</button><button value="confirm">Berriz hasi</button></div>
    </form></dialog>
  </section>`;
}

const statuses = {
  neutral: ['–','Hautatu gabe'], selected:['●','Egiaztatu gabe'],
  pending: ['–','Erabakia falta da'], right: ['✓','Zuzen'], wrong: ['×','Oker'],
};
export function attachCinema(container, state, onChange) {
  detachCinema(container);
  container.innerHTML = markup();
  const root = container.querySelector('.m3-cinema');
  const $ = query => root.querySelector(query);
  const all = query => [...root.querySelectorAll(query)];
  const controls = $('.cinema-controls');
  const montage = $('.cinema-montage');
  const notes = $('.cinema-notes-dialog');
  const reset = $('.cinema-reset-dialog');
  const replay = $('[data-cinema-replay]');
  const pause = $('[data-cinema-pause]');
  const skip = $('[data-cinema-skip]');
  const abort = new AbortController();
  const reelElements = all('.cinema-reel i');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let film, lastPreview, playbackKind, savedSourceUrl, drag, dragHandledAt = -Infinity;
  let reels = [];

  function projector(playing, paused) {
    if (reducedMotion.matches) return;
    if (playing && !reels.some(({spinning}) => spinning)) {
      reels = reelElements.map((reel, i) => {
        const current = getComputedStyle(reel).transform;
        const start = current === 'none' ? 'rotate(0deg)' : current;
        reels[i]?.animation.cancel();
        return {spinning:true, animation:reel.animate(
          [{transform:start + ' rotate(0deg)'},{transform:start + ' rotate(360deg)'}],
          {duration: i === 0 ? 1000 : 720, iterations:Infinity},
        )};
      });
    }
    if (playing) {
      for (const {animation} of reels) {
        if (paused) animation.pause();
        else animation.play();
      }
    } else if (reels.some(({spinning}) => spinning)) {
      reels = reelElements.map((reel,i) => {
        const start = getComputedStyle(reel).transform;
        reels[i].animation.cancel();
        return {spinning:false, animation:reel.animate(
          [{transform:start + ' rotate(0deg)'},{transform:start + ' rotate(110deg)'}],
          {duration:540,easing:'cubic-bezier(.1,.6,.37,1)',fill:'forwards'},
        )};
      });
    }
  }

  const view = stage(root, ({playing, paused, kind}) => {
    playbackKind = kind;
    replay.disabled = playing || (!lastPreview && !state.completed.includes(state.active));
    pause.disabled = skip.disabled = !playing;
    pause.setAttribute('aria-label',paused ? 'Jarraitu' : 'Pausatu');
    pause.title = paused ? 'Jarraitu' : 'Pausatu';
    pause.innerHTML = icon(paused ? 'play' : 'pause');
    projector(playing, paused);
  });

  function paint() {
    const progress = M.filmProgress(state,film);
    const total = M.FILMS.reduce((sum, item) => sum + M.filmProgress(state,item).configured, 0);
    for (const item of M.FILMS) {
      const card = $(`[data-cinema-film="${item.id}"]`);
      const stats = M.filmProgress(state,item);
      const identified = state.results[item.fields[0].id] === 'right';
      card.disabled = !M.available(state,item.id);
      card.setAttribute('aria-pressed',String(item.id === state.active));
      card.querySelector('.cinema-film-label').textContent = identified ? item.name : filmLabel(item);
      card.querySelector('.cinema-film-status').textContent = card.disabled ? 'Blokeatuta' :
        stats.complete ? 'Berreskuratuta' : stats.checked ? stats.right + ' / 4 zuzen' : stats.configured + ' / 4 erabaki';
      card.querySelector('.cinema-seal').hidden = !stats.complete;
    }
    for (const [i, field] of film.fields.entries()) {
      const node = controls.children[i];
      const selected = state.answers[field.id];
      const index = field.options.findIndex(([id]) => id === selected);
      const result = state.results[field.id] || (selected ? 'selected' : 'neutral');
      const [mark, description] = statuses[result];
      const frame = montage.children[i];
      frame.dataset.result = result;
      frame.querySelector('i').textContent = mark;
      frame.querySelector('span').textContent = description;
      node.dataset.result = result;
      node.style.setProperty('--turn', (index < 0 ? -45 : index * 68 - 68) + 'deg');
      const display = node.querySelector('output');
      if (display) display.textContent = field.options[index]?.[1] || 'Hautatu…';
      for (const option of node.querySelectorAll('[data-cinema-option]')) {
        option.setAttribute('aria-pressed', String(option.dataset.cinemaOption === selected));
        option.disabled = progress.complete;
      }
      const dial = node.querySelector('[data-cinema-dial]');
      if (dial) dial.disabled = progress.complete;
      const lever = node.querySelector('[data-cinema-act]');
      if (lever) lever.disabled = !selected || progress.complete;
    }
    $('[data-cinema-decisions]').textContent = total + ' / 12 erabaki osatuta';
    $('.cinema-progress progress').value = total;
    $('[data-cinema-count]').textContent = state.completed.length + ' / 3 film berreskuratuta';
    $('[data-cinema-feedback]').textContent = progress.checked ? progress.right + ' / 4 zuzen' : '';
    $('[data-cinema-check]').hidden = progress.complete;
    $('[data-cinema-next]').hidden = !progress.complete || state.active === 'c';
    $('[data-cinema-final]').disabled = !M.finished(state);
    $('.cinema-desk').dataset.complete = progress.complete;
  }

  function rest() {
    const identified = state.results[film.fields[0].id] === 'right';
    view.idle(film,state.completed.includes(film.id),identified ? film.name : filmLabel(film));
  }

  function openFilm(focus = false) {
    film = M.FILMS.find(item => item.id === state.active);
    lastPreview = null;
    root.dataset.finale = 'false';
    controls.innerHTML = controlsMarkup(film);
    montage.innerHTML = film.fields.map(({title}) => `<div class="cinema-montage-frame"><i aria-hidden="true"></i><b>${title}</b><span></span></div>`).join('');
    $('[data-cinema-edit-title]').textContent = filmLabel(film) + ' · MUNTAKETA';
    paint();
    rest();
    if (focus) $(`[data-cinema-film="${film.id}"]`).focus();
  }

  function seeDraft(field) {
    const id = state.answers[field.id];
    const selected = field.options.find(([option]) => option === id);
    if (!selected || state.completed.includes(state.active)) return;
    lastPreview = preview(field,...selected);
    const mechanism = $(`[data-cinema-field="${field.id}"]`);
    const knob = mechanism.querySelector('[data-cinema-act] i');
    if (knob && !reducedMotion.matches) {
      knob.getAnimations().forEach(animation => animation.cancel());
      knob.animate(
        [{transform:'rotate(-28deg)'},{transform:'rotate(48deg)'},{transform:'rotate(-28deg)'}],
        {duration:380,easing:'ease-in-out'},
      );
    }
    view.play(lastPreview, 'draft', rest);
  }

  function setOption(field, value) {
    if (!M.configure(state,field.id,value)) return;
    lastPreview = null;
    paint();
    rest();
  }

  function showNotes() {
    view.pause();
    notes.showModal();
    const image = $('.cinema-source img');
    const fallback = $('.cinema-source-fallback');
    const officialSource = container.closest('[data-cinema-source]')?.dataset.cinemaSource;
    if (!officialSource) {
      fallback.hidden = false;
      return;
    }
    if (image.hasAttribute('src')) return;
    image.addEventListener('load', () => {
      $('.cinema-source').hidden = $('.cinema-notes-tools').hidden = false;
      fallback.hidden = true;
    }, {signal:abort.signal, once:true});
    image.addEventListener('error', () => { fallback.hidden = false; }, {signal:abort.signal, once:true});
    image.src = officialSource;
  }

  function setSource(file) {
    if (savedSourceUrl) URL.revokeObjectURL(savedSourceUrl);
    savedSourceUrl = URL.createObjectURL(file);
    const link = $('[data-notes-link]');
    link.href = savedSourceUrl + '#page=22';
    link.hidden = false;
  }

  function closeFinal() {
    root.dataset.finale = 'false';
    view.endCard();
  }

  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const {dataset} = button;
    const control = button.closest('[data-cinema-field]');
    const field = film.fields.find(item => item.id === control?.dataset.cinemaField);
    if (dataset.cinemaFilm) {
      if (M.selectFilm(state,dataset.cinemaFilm)) openFilm();
    } else if (dataset.cinemaOption) {
      setOption(field,dataset.cinemaOption);
      if (field.device === 'buttons') seeDraft(field);
    } else if ('cinemaDial' in dataset) {
      const previous = field.options.findIndex(([id]) => state.answers[field.id] === id);
      setOption(field,field.options[(previous + 1) % field.options.length][0]);
    } else if ('cinemaAct' in dataset) {
      if (event.detail === 0 || performance.now() - dragHandledAt > 450) seeDraft(field);
    } else if ('cinemaCheck' in dataset) {
      const complete = M.checkFilm(state);
      paint();
      rest();
      if (complete) {
        onChange();
        (state.active === 'c' ? $('[data-cinema-final]') : $('[data-cinema-next]')).focus({preventScroll:true});
        view.play(stories[film.id],'film',rest);
      }
    } else if ('cinemaNext' in dataset) {
      const next = M.FILMS[M.FILMS.indexOf(film) + 1];
      if (next && M.selectFilm(state,next.id)) openFilm(true);
    } else if ('cinemaFinal' in dataset && M.finished(state)) {
      root.dataset.finale = 'true';
      view.play(finalStory,'final',closeFinal);
    } else if ('cinemaReplay' in dataset) {
      root.dataset.finale = 'false';
      if (state.completed.includes(state.active)) view.play(stories[film.id],'film',rest);
      else if (lastPreview) view.play(lastPreview,'draft',rest);
    } else if ('cinemaPause' in dataset) {
      if (root.dataset.paused === 'true') view.resume();
      else view.pause();
    } else if ('cinemaSkip' in dataset) {
      if (playbackKind === 'final') closeFinal();
      else { root.dataset.finale = 'false'; rest(); }
    } else if ('cinemaNotes' in dataset) {
      showNotes();
    } else if ('notesClose' in dataset) {
      notes.close();
    } else if ('notesZoom' in dataset) {
      const zoomed = $('.cinema-source').classList.toggle('is-zoomed');
      button.setAttribute('aria-pressed',String(zoomed));
      button.textContent = zoomed ? 'Txikitu' : 'Handitu';
    } else if ('cinemaReset' in dataset) {
      view.pause();
      reset.returnValue = '';
      reset.showModal();
    }
  }, {signal:abort.signal});

  controls.addEventListener('keydown', event => {
    const dial = event.target.closest('[data-cinema-dial]');
    if (!dial || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const field = film.fields.find(item => item.id === dial.closest('[data-cinema-field]').dataset.cinemaField);
    const index = field.options.findIndex(([id]) => id === state.answers[field.id]);
    const step = ['ArrowRight','ArrowUp'].includes(event.key) ? 1 : -1;
    const next = index < 0 ? (step > 0 ? 0 : field.options.length - 1) :
      (index + step + field.options.length) % field.options.length;
    setOption(field,field.options[next][0]);
  }, {signal:abort.signal});

  controls.addEventListener('pointerdown', event => {
    const lever = event.target.closest('.cinema-lever:not(:disabled)');
    if (!lever || event.button !== 0) return;
    lever.setPointerCapture(event.pointerId);
    drag = {lever, id:event.pointerId, x:event.clientX, y:event.clientY};
  }, {signal:abort.signal});
  controls.addEventListener('pointerup', event => {
    if (drag?.id !== event.pointerId) return;
    const {lever,x,y} = drag;
    drag = null;
    if (Math.hypot(x - event.clientX,y - event.clientY) < 12) return;
    dragHandledAt = performance.now();
    const field = film.fields.find(item => item.id === lever.closest('[data-cinema-field]').dataset.cinemaField);
    seeDraft(field);
  }, {signal:abort.signal});
  controls.addEventListener('lostpointercapture', () => { drag = null; }, {signal:abort.signal});

  $('[data-notes-file]').addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) return;
    sourceFiles.set(state,file);
    setSource(file);
  }, {signal:abort.signal});
  if (sourceFiles.has(state)) setSource(sourceFiles.get(state));

  reset.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    const choice = event.submitter?.value;
    reset.close(choice);
    if (choice !== 'confirm') return;
    Object.assign(state,M.createCinema());
    openFilm(true);
    onChange();
  }, {signal:abort.signal});

  mounted.set(container, () => {
    abort.abort();
    view.stop();
    for (const {animation} of reels) animation.cancel();
    if (savedSourceUrl) URL.revokeObjectURL(savedSourceUrl);
    root.remove();
  });
  openFilm();
}

export function detachCinema(container) {
  mounted.get(container)?.();
  mounted.delete(container);
}
