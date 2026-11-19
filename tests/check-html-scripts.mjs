import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const pages=['index.html','bi-sistema.html','inperialismoaren-definizioa.html','inperioen-aztarnak.html','esaldiak-osatu.html'];
const temp=mkdtempSync(join(tmpdir(),'inperialismoa-html-'));
let checked=0;
try{
 for(const file of pages){
  const html=readFileSync(file,'utf8');
  const scripts=/<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while((match=scripts.exec(html))){
   const attrs=match[1]||'',source=match[2]||'';
   if(!source.trim())continue;
   const ext=/\btype\s*=\s*["']module["']/i.test(attrs)?'.mjs':'.cjs';
   const pathname=join(temp,'script-'+checked+ext);
   writeFileSync(pathname,source);
   const result=spawnSync(process.execPath,['--check',pathname],{encoding:'utf8'});
   if(result.status!==0)throw Error(file+' inline script: '+(result.stderr||result.stdout));
   checked++;
  }
 }
 console.log('Sintaxis correcta de '+checked+' scripts integrados en HTML.');
}finally{rmSync(temp,{recursive:true,force:true})}
