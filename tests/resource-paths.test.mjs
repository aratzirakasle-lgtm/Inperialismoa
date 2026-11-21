import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {resolve,dirname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
function verifyRelativeUrl(owner,value){
 const raw=(value||'').trim();
 if(!raw || /^(?:data:|https?:|\/\/|\/|#|blob:|mailto:|tel:)/i.test(raw))return null;
 if(raw.includes('$'+'{')||raw.includes("'+"))return null;
 const local=raw.split(/[?#]/)[0];
 if(!local)return null;
 const target=resolve(root,dirname(owner),local);
 if(!target.startsWith(root+sep))return null;
 return existsSync(target)?null:owner+' → '+raw;
}
test('Las referencias url() locales de todas las hojas CSS apuntan a recursos reales',()=>{
 const missing=[];
 for(const folder of ['assets','css']){
  for(const file of readdirSync(resolve(root,folder)).filter(name=>name.endsWith('.css'))){
   const owner=folder+'/'+file,source=readFileSync(resolve(root,owner),'utf8');
   for(const match of source.matchAll(/url\(\s*(?:(['"])(.*?)\1|([^)]*?))\s*\)/g)){
    const url=(match[2]??match[3]??'').trim().replace(/^['"]|['"]$/g,'');
    const error=verifyRelativeUrl(owner,url);
    if(error)missing.push(error);
   }
  }
 }
 assert.deepEqual(missing,[],'Recursos CSS que no existen');
});
test('Los HTML publicables mantienen sus enlaces CSS, JS, imágenes y navegación estática',()=>{
 const missing=[];
 const pages=['index.html','inperialismoaren-faktoreak.html','bi-sistema.html',
  'inperialismoaren-definizioa.html','inperioen-aztarnak.html',
  'esaldiak-osatu.html','preview-bi-sistema.html'];
 for(const owner of pages){
  const source=readFileSync(resolve(root,owner),'utf8');
  for(const match of source.matchAll(/<(?:script|link|img|source|a)\b[^>]*?\b(?:src|href)=["']([^"'<>]+)["'][^>]*>/gi)){
   const err=verifyRelativeUrl(owner,match[1]);
   if(err)missing.push(err);
  }
 }
 assert.deepEqual(missing,[],'Referencias HTML inválidas');
});
