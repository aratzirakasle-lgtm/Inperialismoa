const powers = [
  ['jp', 'Japonia'], ['ru', 'Errusia'], ['us', 'Estatu Batuak'],
];
const field = (id, title, device, action, options) => ({ id, title, device, action, options });

export const FILMS = [
  {
    id: 'a', name: 'Errusia', poster: 'siberia', mode: 'train',
    summary: 'Errusiak Siberia hartu, Himalaiara eta Indiara zabaldu eta Txinako lurraldeetara heldu zen.',
    fields: [
      field('t_a_sender', 'Potentziaren plaka', 'dial', 'MUNTATU', powers),
      field('t_a_siberia', 'Trenbideko helmuga', 'lever', 'HARTU', [['formosa', 'Formosa'], ['puerto-rico', 'Puerto Rico'], ['siberia', 'Siberia']]),
      field('t_a_direction', 'Hedapenaren norabidea', 'switch', 'ZABALDU', [['himalaya-india', 'Himalaiara eta Indiara'], ['cuba-puerto-rico', 'Kubara eta Puerto Ricora'], ['libya-eritrea', 'Libiara eta Eritreara']]),
      field('t_a_china', 'Azken helmuga', 'lever', 'HELDU', [['cape-verde', 'Cabo Verdera'], ['china', 'Txinako lurraldeetara'], ['sahara', 'Saharara']]),
    ],
  },
  {
    id: 'b', name: 'Estatu Batuak', poster: 'philippines', mode: 'ship',
    summary: 'Estatu Batuek Filipinak eta Puerto Rico okupatu eta Kuba kontrolatu zuten. Testuingurua: 1898an Espainiaren aurkako gerra.',
    fields: [
      field('t_b_sender', 'Potentziaren plaka', 'dial', 'MUNTATU', powers),
      field('t_b_occupation', 'Itsas ibilbidea', 'wheel', 'OKUPATU', [['siberia-india', 'Siberia eta India'], ['philippines-puerto-rico', 'Filipinak eta Puerto Rico'], ['formosa-korea', 'Formosa eta Korea']]),
      field('t_b_cuba', 'Kubako mekanismoa', 'buttons', '', [['annex', 'ANEXIONATU'], ['transfer', 'ERRUSIARI EMAN'], ['control', 'KONTROLATU']]),
      field('t_b_war', 'Testuinguruko fotograma', 'film', 'MUNTATU', [['war-1898', '1898an Espainiaren aurkako gerra'], ['berlin-1884', '1884an Berlingo Konferentzia'], ['fachoda-1898', '1898an Fachodako gatazka']]),
    ],
  },
  {
    id: 'c', name: 'Japonia', poster: 'japan', mode: 'ship',
    summary: 'Japoniak Txina eta Errusia izan zituen aurkari. Formosa eta Korea anexionatu zituen eta Mantxurian protektoratua sortu zuen.',
    fields: [
      field('t_c_sender', 'Potentziaren plaka', 'dial', 'MUNTATU', powers),
      field('t_c_annex', 'Anexioaren lurraldeak', 'lever', 'ANEXIONATU', [['angola-mozambique', 'Angola eta Mozambike'], ['formosa-korea', 'Formosa eta Korea'], ['philippines-puerto-rico', 'Filipinak eta Puerto Rico']]),
      field('t_c_manchuria', 'Protektoratuaren mekanismoa', 'shield', 'AKTIBATU', [['cuba', 'Kuban protektoratua sortu'], ['siberia', 'Siberia hartu'], ['manchuria', 'Mantxurian protektoratua sortu']]),
      field('t_c_rivals', 'Aurkako bi potentziak', 'beams', 'ARGIZTATU', [['china-russia', 'Txina eta Errusia'], ['spain-portugal', 'Espainia eta Portugal'], ['belgium-italy', 'Belgika eta Italia']]),
    ],
  },
];

// Teacher preview only. A student release must obtain results from an authorized server.
const previewKey = {
  t_a_sender: 'ru', t_a_siberia: 'siberia', t_a_direction: 'himalaya-india', t_a_china: 'china',
  t_b_sender: 'us', t_b_occupation: 'philippines-puerto-rico', t_b_cuba: 'control', t_b_war: 'war-1898',
  t_c_sender: 'jp', t_c_annex: 'formosa-korea', t_c_manchuria: 'manchuria', t_c_rivals: 'china-russia',
};

export function createCinema() {
  return { active: 'a', answers: {}, results: {}, completed: [] };
}

export function available(state, filmId) {
  const index = FILMS.findIndex(film => film.id === filmId);
  return index >= 0 && FILMS.slice(0, index).every(film => state.completed.includes(film.id));
}

export function selectFilm(state, filmId) {
  if (!available(state, filmId)) return false;
  state.active = filmId;
  return true;
}

export function configure(state, fieldId, optionId) {
  const film = FILMS.find(item => item.id === state.active);
  const field = film?.fields.find(item => item.id === fieldId);
  if (state.completed.includes(state.active) || !field?.options.some(([id]) => id === optionId) ||
      state.answers[fieldId] === optionId) return false;
  state.answers[fieldId] = optionId;
  delete state.results[fieldId];
  return true;
}

export function checkFilm(state) {
  const film = FILMS.find(item => item.id === state.active);
  if (state.completed.includes(film.id)) return false;
  for (const { id } of film.fields) {
    state.results[id] = !state.answers[id] ? 'pending' : state.answers[id] === previewKey[id] ? 'right' : 'wrong';
  }
  const complete = film.fields.every(({ id }) => state.results[id] === 'right');
  if (complete) state.completed.push(film.id);
  return complete;
}

export function filmProgress(state, film) {
  const fields = film.fields.map(({ id }) => id);
  return {
    configured: fields.filter(id => state.answers[id]).length,
    right: fields.filter(id => state.results[id] === 'right').length,
    checked: fields.some(id => state.results[id]),
    complete: state.completed.includes(film.id),
  };
}

export const finished = state => state.completed.length === FILMS.length;
