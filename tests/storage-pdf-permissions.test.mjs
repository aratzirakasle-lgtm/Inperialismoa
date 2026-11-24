import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('El permiso de descarga usa el nombre del objeto y el equipo del profesor',()=>{
 const migration=read('supabase/migrations/20261124_storage_teacher_pdf_read_by_object_path.sql');
 const historical=read('supabase/teacher_private_dashboard.sql');
 assert.match(migration,/ALTER POLICY "Equipo y profesor propietario consultan PDF"/);
 assert.match(migration,/storage\.foldername\(objects\.name\)/);
 assert.match(migration,/teacher_owns_team\(t\.id\)/);
 assert.match(historical,/storage\.foldername\(objects\.name\)/);
 assert.doesNotMatch(historical,/t\.id::text=\(storage\.foldername\(name\)\)/);
});

test('El envío y la descarga conservan su bucket privado y la carpeta de equipo',()=>{
 const app=read('js/app.js');
 assert.match(app,/const path=viewTeamId\(\)\+"\/"\+crypto\.randomUUID\(\)\+"\.pdf"/);
 assert.match(app,/db\.storage\.from\("entregas"\)\.upload/);
 assert.match(app,/db\.storage\.from\("entregas"\)\.createSignedUrl/);
});
