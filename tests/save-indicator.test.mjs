import test from 'node:test';
import assert from 'node:assert/strict';
import {gallerySaveState,gallerySaveText,SAVE_TEXT,paintSaveIndicator} from '../js/save-indicator.js';
test('Guardar, sincronizar, conexión pendiente y falta de confirmación son diferentes',()=>{
 assert.equal(gallerySaveState({busy:true,ready:true}),'saving');
 assert.equal(gallerySaveState({connecting:true}),'loading');
 assert.equal(gallerySaveState({ready:true}),'ready');
 assert.equal(gallerySaveState({pending:true}),'pending');
 assert.equal(gallerySaveState({}),'error');
 assert.equal(gallerySaveText('saving',0),SAVE_TEXT.saving);
 assert.doesNotMatch(gallerySaveText('pending',0),/gailuan gordeta/);
 const el={dataset:{},textContent:''};paintSaveIndicator(el,'saved');
 assert.equal(el.dataset.saveState,'saved');assert.equal(el.textContent,SAVE_TEXT.saved);
});
