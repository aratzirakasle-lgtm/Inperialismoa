import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const assets=[
 {css:'assets/inperioen-arte-aljeria-v5.css',file:'assets/inperioen-art-aljeria-v5.webp',sha:'3292ac7f5b6206d3d9273d46c411ccafbb4dd6da',case:'aljeria'},
 {css:'assets/inperioen-arte-angola-v5.css',file:'assets/inperioen-art-angola-v5.webp',sha:'d56d7d680485ebab5523993cfd80fdc2e3885599',case:'angola'},
 {css:'assets/inperioen-arte-india-v5.css',file:'assets/inperioen-art-india-v5.webp',sha:'a5bbe125d86587dd5ed190695fd7a4d4036658f4',case:'india'},
 {css:'assets/inperioen-arte-indonesia-v5.css',file:'assets/inperioen-art-indonesia-v5.webp',sha:'1681cd23c0943b5f09e6f1f096628cd904b859fa',case:'indonesia'}
];
const root=new URL('../',import.meta.url);
function gitBlobSha(bytes){
 return createHash('sha1').update('blob '+bytes.length).update(Uint8Array.of(0)).update(bytes).digest('hex');
}
test('Las cuatro escenas de los expedientes se conservan byte por byte como WebP externos',()=>{
 for(const {css,file,sha,case:label} of assets){
  const sheet=readFileSync(new URL(css,root),'utf8');
  const bytes=readFileSync(new URL(file,root));
  assert.equal(bytes.subarray(0,4).toString('ascii'),'RIFF',label);
  assert.equal(bytes.subarray(8,12).toString('ascii'),'WEBP',label);
  assert.equal(gitBlobSha(bytes),sha,'Integridad de imagen '+label);
  assert.ok(sheet.includes('./'+file.split('/').at(-1)),'CSS sin enlace a imagen '+label);
  assert.ok(!sheet.includes('data:image/webp;base64,'),'CSS todavía embebe foto '+label);
  assert.ok(sheet.includes('--new-museum-art:url('),'La vitrina mantiene su obra de arte '+label);
 }
});
