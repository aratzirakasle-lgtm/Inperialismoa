// Inperialismoa · Alta y recuperación de credenciales para alumnado.
// El listado de alumnos está en Supabase (RLS docente), NO en GitHub.
// Contraseñas: solo memoria de esta respuesta; jamás registrar o almacenar.
import {createClient} from "npm:@supabase/supabase-js@2.95.0";

const allowedOrigin="https://aratzirakasle-lgtm.github.io";
const headers={
 "Access-Control-Allow-Origin":allowedOrigin,
 "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
 "Access-Control-Allow-Methods":"POST, OPTIONS",
 "Cache-Control":"no-store, max-age=0",
 "Content-Type":"application/json; charset=utf-8",
};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
const randomPassword=()=>{
 const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
 const buf=crypto.getRandomValues(new Uint8Array(18));
 return [...buf].map(v=>alphabet[v%alphabet.length]).join("");
};
const shortId=()=>crypto.randomUUID().replaceAll("-","").slice(0,14);

Deno.serve(async (req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return reply({error:"Metodo no permitido."},405);
 if(req.headers.get("origin")!==allowedOrigin)return reply({error:"Origen no autorizado."},403);
 const url=Deno.env.get("SUPABASE_URL");
 const secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!secret)return reply({error:"Configuracion del servidor incompleta."},500);
 const authorization=req.headers.get("authorization")||"";
 const token=authorization.startsWith("Bearer ")?authorization.slice(7):"";
 if(!token)return reply({error:"Inicia sesion como profesor."},401);
 const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const {data:authResult,error:authError}=await admin.auth.getUser(token);
 if(authError||!authResult.user)return reply({error:"Sesion no valida."},401);
 const teacherId=authResult.user.id;
 const {data:profile,error:roleError}=await admin.from("profiles").select("role").eq("id",teacherId).single();
 if(roleError||profile?.role!=="teacher")return reply({error:"Acceso exclusivo del profesor."},403);

 let input:{action?:string;class_id?:string;roster_id?:string};
 try{input=await req.json()}catch{return reply({error:"Solicitud no valida."},400)}
 const {action,class_id,roster_id}=input;
 if(!["create","reset"].includes(action||"")||typeof class_id!=="string"
    ||!/^[a-f0-9-]{36}$/i.test(class_id))
   return reply({error:"Parametros incorrectos."},400);
 const {data:classRow,error:classError}=await admin.from("classes")
   .select("id,name,school_year").eq("id",class_id).eq("teacher_id",teacherId).maybeSingle();
 if(classError||!classRow)return reply({error:"Clase no autorizada."},403);
 const {data:teams,error:teamsError}=await admin.from("teams")
   .select("id,name").eq("class_id",class_id);
 if(teamsError||!teams)return reply({error:"No se pueden consultar equipos."},500);
 const names=new Map(teams.map(t=>[t.id,t.name]));
 const ids=teams.map(t=>t.id);
 if(!ids.length)return reply({error:"La clase no tiene equipos."},400);
 const {data:roster,error:rosterError}=await admin.from("class_student_roster")
   .select("id,team_id,slot,display_name,auth_user_id").in("team_id",ids)
   .order("created_at",{ascending:true});
 if(rosterError||!roster)return reply({error:"No se ha podido consultar el listado docente."},500);
 if(roster.length>70)return reply({error:"Numero de alumnos no admitido."},400);

 if(action==="reset"){
   const row=roster.find(r=>r.id===roster_id);
   if(!row?.auth_user_id)return reply({error:"La cuenta no existe o no pertenece a esta clase."},404);
   const newPassword=randomPassword();
   const {data:updated,error:resetError}=await admin.auth.admin.updateUserById(row.auth_user_id,
     {password:newPassword});
   if(resetError||!updated.user?.email)return reply({error:"No se pudo restablecer la contrasena."},500);
   return reply({created:[{name:row.display_name,email:updated.user.email,
     password:newPassword,team:names.get(row.team_id)}],remaining:0});
 }

 const created:{name:string;email:string;password:string;team:string}[]=[];
 let problem:string|null=null;
 for(const row of roster){
   if(row.auth_user_id)continue;
   const team=names.get(row.team_id);
   if(!team){problem="Equipo desconocido.";break}
   const email="ikasle-"+classRow.name.toLowerCase().replace(/[^a-z0-9]/g,"")+"-"+
      row.slot+"-"+shortId()+"@example.com";
   const password=randomPassword();
   const {data:newUser,error:createError}=await admin.auth.admin.createUser({
     email,password,email_confirm:true,
   });
   if(createError||!newUser.user){
      problem="No se pudo crear una cuenta. Puedes reintentar el proceso.";break;
   }
   const newId=newUser.user.id;
   const {error:profileErr}=await admin.from("profiles").insert({
     id:newId,display_name:row.display_name,role:"student",team_id:row.team_id
   });
   if(profileErr){
     await admin.auth.admin.deleteUser(newId);
     problem="No se pudo vincular una cuenta al equipo.";break;
   }
   const {data:updated,error:rosterErr}=await admin.from("class_student_roster")
     .update({auth_user_id:newId}).eq("id",row.id).is("auth_user_id",null).select("id");
   if(rosterErr||updated?.length!==1){
     await admin.from("profiles").delete().eq("id",newId);
     await admin.auth.admin.deleteUser(newId);
     problem="No se pudo confirmar una asignacion.";break;
   }
   created.push({name:row.display_name,email,password,team});
 }
 return reply({class_name:classRow.name,created,
   already:roster.length-created.length-(problem?1:0),
   problem,remaining:roster.length-created.length-
     roster.filter(r=>r.auth_user_id).length},problem&&!created.length?500:200);
});
