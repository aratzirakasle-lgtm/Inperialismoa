import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../js/m3-cinema.mjs';
import {finalStory, preview, stories} from '../js/m3-cinema-animation.mjs';
import {itineraryState} from '../js/m3-itinerary.mjs';

const key = {
  t_a_sender: 'ru', t_a_siberia: 'siberia', t_a_direction: 'himalaya-india', t_a_china: 'china',
  t_b_sender: 'us', t_b_occupation: 'philippines-puerto-rico', t_b_cuba: 'control', t_b_war: 'war-1898',
  t_c_sender: 'jp', t_c_annex: 'formosa-korea', t_c_manchuria: 'manchuria', t_c_rivals: 'china-russia',
};

test('the twelve decisions require verification and unlock their films in order', () => {
  const cinema = M.createCinema();
  assert.deepEqual(M.FILMS.flatMap(({fields}) => fields.map(({id}) => id)),Object.keys(key));
  assert.equal(M.selectFilm(cinema,'b'),false);
  assert.equal(M.selectFilm(cinema,'c'),false);
  assert.equal(M.configure(cinema,'t_b_cuba','control'),false);
  for (const film of M.FILMS) {
    assert.equal(M.selectFilm(cinema,film.id),true);
    assert.equal(M.checkFilm(cinema),false);
    for (const {id,options} of film.fields) {
      for (const [wrong] of options.filter(([option]) => option !== key[id])) {
        assert.equal(M.configure(cinema,id,wrong),true);
        assert.equal(cinema.results[id],undefined);
        assert.equal(M.checkFilm(cinema),false);
        assert.equal(cinema.results[id],'wrong');
      }
      assert.equal(M.configure(cinema,id,key[id]),true);
      assert.equal(cinema.results[id],undefined);
    }
    assert.equal(M.checkFilm(cinema),true);
    assert.equal(M.checkFilm(cinema),false);
    assert.equal(M.configure(cinema,film.fields[0].id,'ru'),false);
    assert.deepEqual(M.filmProgress(cinema,film),{configured:4,right:4,checked:true,complete:true});
  }
  assert.equal(M.finished(cinema),true);
  assert.equal(M.selectFilm(cinema,'a'),true);
  assert.equal(M.finished(cinema),true);
});

test('verified historical scenes distinguish direction, occupation, control, annexation and protectorate', () => {
  assert.deepEqual(stories.a.map(({effect}) => effect),['take','direction','arrive']);
  assert.deepEqual(stories.b.filter(({effect}) => effect === 'occupy').map(({art}) => art),['philippines','puerto-rico']);
  assert.equal(stories.b.find(({art}) => art === 'cuba').effect,'control');
  assert.deepEqual(stories.c.filter(({effect}) => effect === 'annex').map(({art}) => art),['formosa','korea']);
  assert.equal(stories.c.find(({art}) => art === 'manchuria').effect,'protect');
  const cuba = M.FILMS[1].fields[2];
  assert.equal(preview(cuba,'annex','ANEXIONATU')[0].effect,'context');
  assert.equal(preview(cuba,'control','KONTROLATU')[0].effect,'control');
  const length = finalStory.reduce((sum,{duration}) => sum + duration,0);
  assert.ok(length >= 20000 && length <= 30000);
});

test('only the teacher preview can use exercise five and exercise six remains pending', () => {
  const get = (teacher, options) => itineraryState(5,false,false,teacher,options);
  assert.equal(get(false,{cinemaPreview:true}).rooms[4].available,false);
  assert.equal(get(true,{}).rooms[4].available,false);
  assert.equal(get(true,{cinemaPreview:true}).rooms[4].available,true);
  assert.equal(get(true,{cinemaPreview:true}).count,0);
  const finished = get(true,{cinemaPreview:true,cinemaDone:true});
  assert.equal(finished.count,1);
  assert.equal(finished.rooms[5].available,false);
  assert.equal(finished.rooms[5].complete,false);
});

test('preview scenery follows selected destinations and uses mapped alternatives', () => {
  const fields = new Map(M.FILMS.flatMap(film => film.fields.map(field => [field.id,field])));
  const take = (id,option) => preview(fields.get(id),option,'Aukera');
  assert.deepEqual(take('t_a_siberia','formosa').map(frame => frame.art),['formosa']);
  assert.deepEqual(take('t_a_china','cape-verde')[0].points.map(point => point.key),['cape-verde']);
  assert.deepEqual(take('t_b_occupation','philippines-puerto-rico').map(frame => frame.art),['philippines','puerto-rico']);
  assert.deepEqual(take('t_b_occupation','siberia-india')[0].points.map(point => point.key),['siberia','india']);
  assert.deepEqual(take('t_c_annex','formosa-korea').map(frame => frame.art),['formosa','korea']);
  assert.equal(take('t_c_manchuria','cuba')[0].art,'cuba');
  assert.equal(take('t_c_manchuria','siberia')[0].effect,'take');
  assert.deepEqual(take('t_c_rivals','spain-portugal')[0].points.map(point => point.key),['spain','portugal']);
});
