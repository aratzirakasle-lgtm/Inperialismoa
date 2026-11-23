import { MUSEUM_SCENES_A } from './galeria-miniaturas-pintadas-a.js?v=1';
import { MUSEUM_SCENES_B } from './galeria-miniaturas-pintadas-b.js?v=1';
/* Ilustraciones SVG originales (20 conceptos de la galería).
 * Sin fondo, sin dependencias externas y sin elementos interactivos propios.
 * La única funcionalidad de cada tarjeta permanece en su botón contenedor. */
const ART = Object.freeze({
  eu_auth_head: `
    <path d="M6 30V15h6V9h6v6h6V9h6v21Z" fill="#b97555"/>
    <path d="M5 15h8v4H5zm13 0h8v4h-8zm7 0h6v4h-6z" fill="#e8c68a"/>
    <path d="M14 30v-8a4 4 0 0 1 8 0v8" fill="#465d5a"/>
    <path d="M18 9V4m0 0 7 2-7 3" fill="#bb5149"/>
    <path d="M8 24h3m14 0h3" stroke="#f1d5a2" stroke-width="2"/>
  `,
  eu_army: `
    <path d="M8 6 28 28M28 6 8 28" stroke="#e6c9a1" stroke-width="5"/>
    <path d="m7 5 20 20m2-20L9 25" stroke="#6e8490" stroke-width="3.5"/>
    <path d="m4 24 8 8M24 32l8-8" stroke="#b17a3c" stroke-width="4"/>
    <path d="M6 26 4 30m26 0-2-4" stroke="#c9a061" stroke-width="3"/>
    <circle cx="8" cy="28" r="2" fill="#a54e45"/><circle cx="28" cy="28" r="2" fill="#a54e45"/>
  `,
  eu_monarch: `
    <path d="m5 13 5 6 8-12 8 12 5-6-3 16H8Z" fill="#d4a04e"/>
    <path d="M7 26h22v5H7z" fill="#b8544b"/>
    <circle cx="5" cy="12" r="2.5" fill="#e8cb83"/><circle cx="18" cy="6" r="2.5" fill="#f4da97"/><circle cx="31" cy="12" r="2.5" fill="#e8cb83"/>
    <path d="M12 21h4v4h-4z" fill="#527d73"/><path d="M20 21h4v4h-4z" fill="#8d4650"/>
    <path d="M9 29h18" stroke="#f2d594" stroke-width="1.5"/>
  `,
  eu_parliament: `
    <path d="m4 13 14-8 14 8v3H4z" fill="#d2ac68"/>
    <path d="M7 17h5v13H7zm8 0h6v13h-6zm9 0h5v13h-5z" fill="#e9d6ab"/>
    <path d="M5 30h26v3H5z" fill="#9c7752"/>
    <path d="M3 13h30M6 18h24" stroke="#a27450"/>
    <path d="M10 20v8m8-8v8m8-8v8" stroke="#bc9966"/>
  `,
  eu_liberal_head: `
    <path d="M18 6v24M10 31h16M14 8h8M7 13h22" stroke="#b98d50" stroke-width="2.5"/>
    <path d="M9 13 6 24h8zM27 13l-5 11h10z" fill="#c4d8ce" stroke="#648878"/>
    <path d="M5 24q4 8 10 0M21 24q6 8 11 0" fill="#658e80"/>
    <circle cx="18" cy="6" r="2.5" fill="#d8b35e"/>
  `,
  eu_separation: `
    <path d="M4 11 18 5l14 6v3H4z" fill="#d0aa6b"/>
    <path d="M5 29h26v3H5z" fill="#ac7a58"/>
    <rect x="7" y="15" width="6" height="14" rx="1" fill="#a9bdc4"/>
    <rect x="15" y="15" width="6" height="14" rx="1" fill="#d8bb7c"/>
    <rect x="23" y="15" width="6" height="14" rx="1" fill="#8fae98"/>
    <path d="M6 14h24M6 29h24" stroke="#75583e"/>
  `,
  eu_rights: `
    <path d="M10 8h17v20H10q-5 0-5-5V12q0-4 5-4Z" fill="#f0d5a3"/>
    <path d="M27 8q5 0 5 5t-5 5" fill="#d7b67c"/>
    <path d="M10 8q-4 0-4 5v12q0 4 4 4" fill="#e5c28d"/>
    <path d="M13 14h10M13 18h9M13 22h7" stroke="#a8865c" stroke-width="1.6"/>
    <circle cx="24" cy="25" r="4.5" fill="#b84f48"/>
    <path d="m22 25 1.5 1.5 3-3" stroke="#fbe4ae" stroke-width="1.5"/>
  `,
  eu_vote: `
    <rect x="6" y="15" width="24" height="16" rx="2" fill="#81a49c"/>
    <path d="M4 15h28v4H4z" fill="#c7ad76"/>
    <path d="M13 7h11l-2 11H11z" fill="#f1dcb7"/>
    <path d="m15 11 2 2 4-4" stroke="#6e9977" stroke-width="2.2"/>
    <path d="M13 21h10" stroke="#446c65" stroke-width="2"/>
  `,
  eu_social: `
    <path d="M17 30q-1-10 5-21" stroke="#55775b" stroke-width="2.6"/>
    <path d="M17 26q-10-8-13-4 5 9 13 7M20 22q8-7 12-5-3 9-12 8" fill="#719b6e"/>
    <path d="M14 10q-7-2-6 5 3 6 8 7 6 0 10-6 4-5-1-8-5-3-8 1-1-3-3 1Z" fill="#b94b50"/>
    <path d="M13 13q5-5 10 0-3 4-8 3" fill="#e18572"/>
    <path d="M10 9q1-6 7-4" stroke="#cf6d61" stroke-width="2.5"/>
  `,
  ru_autocracy: `
    <path d="m11 29 14-20" stroke="#b67f45" stroke-width="5"/>
    <path d="m10 30 13-20" stroke="#e2be75" stroke-width="2"/>
    <circle cx="26" cy="8" r="5.5" fill="#d9b66e"/>
    <path d="M26 2v12M20 8h12" stroke="#a87043" stroke-width="1.2"/>
    <circle cx="26" cy="8" r="2" fill="#bb514e"/>
    <path d="M6 27 10 23m-4 8 4-4" stroke="#c0504c" stroke-width="3"/>
  `,
  ru_tsar: `
    <path d="M9 30q-3-12 4-20l5 6 6-6q7 8 4 20Z" fill="#a44e55"/>
    <path d="m8 13 4 4 6-10 6 10 4-4-2 8H10z" fill="#ddb366"/>
    <path d="M9 21h18v4H9z" fill="#e9cf94"/>
    <path d="M15 30V19m6 11V19" stroke="#f3d3a1" stroke-width="2"/>
    <circle cx="18" cy="8" r="2" fill="#e4c781"/>
    <path d="M12 29h12" stroke="#d79b61" stroke-width="2"/>
  `,
  ru_serfs: `
    <g transform="rotate(-28 18 18)">
      <rect x="2" y="14" width="13" height="9" rx="4.5" fill="#8aa3ae" stroke-width="3"/>
      <rect x="22" y="14" width="12" height="9" rx="4.5" fill="#8aa3ae" stroke-width="3"/>
      <path d="M14 14 18 11m-4 12 5 3M22 14l-4-3m4 12-4 3" stroke="#cf985a" stroke-width="2.5"/>
    </g>
    <path d="M18 3v4m-5 1-2-3m12 3 3-3" stroke="#d6aa63" stroke-width="2"/>
  `,
  ru_ethnic: `
    <circle cx="10" cy="11" r="5" fill="#d4ad88"/><circle cx="26" cy="11" r="5" fill="#a88167"/><circle cx="18" cy="8" r="5" fill="#e3c098"/>
    <path d="M3 29q0-12 8-12t9 12" fill="#668795"/>
    <path d="M16 29q0-12 9-12t8 12" fill="#bc8058"/>
    <path d="M9 30q0-14 9-14t9 14" fill="#648579"/>
    <path d="M9 21h18" stroke="#e2c899" stroke-width="1.5"/>
  `,
  us_power: `
    <path d="M17 24Q5 20 3 9q8 1 13 8M19 24Q31 20 33 9q-8 1-13 8" fill="#7696a1"/>
    <path d="m18 7 3 7 8 .5-6 5 2 8-7-4-7 4 2-8-6-5 8-.5z" fill="#dfb65f"/>
    <path d="M15 32h6M18 24v8" stroke="#925f3a" stroke-width="2.5"/>
    <path d="M5 12 12 18m19-6-7 6" stroke="#b4ccd1" stroke-width="1.5"/>
  `,
  us_west: `
    <path d="M6 24V15q7-12 19 0v9" fill="#e5d1a8"/>
    <path d="M4 24h26M7 16h18" stroke="#af8156" stroke-width="2"/>
    <path d="M7 16q8-9 17 0" stroke="#c7ae7b" stroke-width="2"/>
    <circle cx="11" cy="27" r="4.5" fill="#a97652"/><circle cx="26" cy="27" r="4.5" fill="#a97652"/>
    <circle cx="11" cy="27" r="1.6" fill="#dfc58d"/><circle cx="26" cy="27" r="1.6" fill="#dfc58d"/>
    <path d="M29 17h4v9h-4" stroke="#9f6e4c" stroke-width="2"/>
  `,
  us_north: `
    <path d="M18 5v23M10 28h16M7 13h22" stroke="#b98d50" stroke-width="2.5"/>
    <path d="m9 13-5 11h10zM27 13l-5 11h10z" fill="#91b9a3"/>
    <path d="M4 24q5 7 10 0M22 24q5 7 10 0" fill="#638e74"/>
    <path d="m13 5 5-2 5 2" stroke="#d5ad61" stroke-width="2"/>
    <path d="M14 30q4 4 8 0" stroke="#b17d4c" stroke-width="2"/>
  `,
  us_south: `
    <path d="M4 14h28v4H4z" fill="#dec59a" stroke="none"/>
    <path d="M5 7v23M12 7v23M24 7v23M31 7v23" stroke="#9a7456" stroke-width="3"/>
    <path d="M3 14h30M3 24h30" stroke="#cdac7b" stroke-width="3"/>
    <path d="M7 8h22M6 30h24" stroke="#826047" stroke-width="1.8"/>
    <path d="M5 29 31 5" stroke="#b65150" stroke-width="4"/>
    <path d="M24 5h7v7" stroke="#b65150" stroke-width="2"/>
  `,
  jp_meiji: `
    <circle cx="25" cy="9" r="6" fill="#d9b35f"/>
    <path d="M4 13q14-5 28 0l-2 5H6z" fill="#b84d49"/>
    <path d="M9 18v13m18-13v13" stroke="#af4b43" stroke-width="4"/>
    <path d="M6 21h24M7 30h6m10 0h6" stroke="#524438" stroke-width="2.5"/>
    <path d="M12 21q6 6 12 0" stroke="#d99a67" stroke-width="1.5"/>
  `,
  jp_industry: `
    <path d="M5 31V16l10 5v-5l10 5v10Z" fill="#bc7655"/>
    <path d="M25 31V9h6v22" fill="#8092a0"/>
    <path d="M27 8q-5-4-1-7" stroke="#b5b6ac" stroke-width="3" opacity=".9"/>
    <path d="M7 25h4m5 0h4m5 0h4" stroke="#f6dba4" stroke-width="3"/>
    <path d="M5 31h28" stroke="#73593f" stroke-width="2"/>
  `,
  jp_trade: `
    <path d="M4 24q14 3 28-1l-5 8H9Z" fill="#698b9a"/>
    <path d="M17 24V8m0 2-9 13h9m3-15 9 13h-9" fill="#f0d8ab" stroke="#ac8d63"/>
    <rect x="12" y="21" width="5" height="3" rx=".5" fill="#bf704b"/>
    <path d="M7 34q4-3 8 0t8 0 8 0" stroke="#6d9daa" stroke-width="2"/>
    <path d="M19 7h8l-8 3" fill="#ba5150"/>
  `
});
/* Miniilustraciones independientes (elementos IMG, no glifos de fuente).
 * Los SVG originales se tratan como imágenes, sin fondo y con volumen
 * de tinta/luz sobre los objetos. No hay llamadas a servidores externos. */
const IMAGES = Object.freeze(Object.fromEntries(Object.entries(ART).map(([id,drawing])=>{
  const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="72" height="72" fill="none" stroke="#674a33" stroke-width="1.05" stroke-linejoin="round" stroke-linecap="round">'+
    '<defs><filter id="painted" x="-25%" y="-25%" width="150%" height="160%">'+
    '<feDropShadow dx=".45" dy="1.05" stdDeviation=".65" flood-color="#392b20" flood-opacity=".3"/>'+
    '</filter></defs><g filter="url(#painted)">'+drawing+'</g></svg>';
  return [id,'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg).replace(/'/g,'%27')];
})));
/* Colección museográfica: 20 escenas ilustradas, distintas y con fondo transparente.
 * Se conservan los SVG anteriores como respaldo. No cambia el juego. */
const MUSEUM_SCENES=Object.freeze({...MUSEUM_SCENES_A,...MUSEUM_SCENES_B});
const MUSEUM_DEFS="<defs>\n <linearGradient id=\"gilt\" x1=\"0%\" y1=\"0%\" x2=\"85%\" y2=\"95%\"><stop stop-color=\"#fff3bd\"/><stop offset=\".28\" stop-color=\"#e6bd6d\"/><stop offset=\".53\" stop-color=\"#a36e35\"/><stop offset=\".75\" stop-color=\"#e5ba69\"/><stop offset=\"1\" stop-color=\"#f7e3a2\"/></linearGradient>\n <linearGradient id=\"stone\" x1=\"4%\" y1=\"5%\" x2=\"95%\" y2=\"100%\"><stop stop-color=\"#fff1d3\"/><stop offset=\".43\" stop-color=\"#cbb494\"/><stop offset=\"1\" stop-color=\"#9b7e68\"/></linearGradient>\n <linearGradient id=\"velvet\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop stop-color=\"#d26e65\"/><stop offset=\".52\" stop-color=\"#983e4d\"/><stop offset=\"1\" stop-color=\"#522b3f\"/></linearGradient>\n <radialGradient id=\"ruby\" cx=\"35%\" cy=\"25%\" r=\"85%\"><stop stop-color=\"#f8a89a\"/><stop offset=\".35\" stop-color=\"#cc4859\"/><stop offset=\"1\" stop-color=\"#702e49\"/></radialGradient>\n <linearGradient id=\"navy\" x1=\"10%\" y1=\"3%\" x2=\"100%\" y2=\"100%\"><stop stop-color=\"#617f83\"/><stop offset=\".38\" stop-color=\"#384f62\"/><stop offset=\"1\" stop-color=\"#1e2f42\"/></linearGradient>\n <linearGradient id=\"skin\" x1=\"10%\" y1=\"5%\" x2=\"95%\" y2=\"100%\"><stop stop-color=\"#fff0d2\"/><stop offset=\".45\" stop-color=\"#d4a17a\"/><stop offset=\"1\" stop-color=\"#a26757\"/></linearGradient>\n <linearGradient id=\"sea\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop stop-color=\"#bfd9cd\"/><stop offset=\".48\" stop-color=\"#75a5a6\"/><stop offset=\"1\" stop-color=\"#446d84\"/></linearGradient>\n <linearGradient id=\"paper\" x1=\"0\" y1=\"0\" x2=\"80%\" y2=\"100%\"><stop stop-color=\"#ffefc6\"/><stop offset=\".54\" stop-color=\"#efd5a7\"/><stop offset=\"1\" stop-color=\"#c79e6c\"/></linearGradient>\n <filter id=\"paint\" x=\"-25%\" y=\"-25%\" width=\"160%\" height=\"180%\"><feDropShadow dx=\"1.3\" dy=\"2.2\" stdDeviation=\"1.7\" flood-color=\"#241711\" flood-opacity=\".31\"/></filter>\n</defs>";
const MUSEUM_IMAGES=Object.freeze(Object.fromEntries(Object.entries(MUSEUM_SCENES).map(([id,drawing])=>{
  // Escena detallada 96 x 96 en lienzo SVG transparente; el encuadre de 36
  // mantiene compatibilidad con las 20 cartelas y sus pruebas históricas.
  const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="96" height="96" fill="none" stroke-linecap="round" stroke-linejoin="round">'+
    MUSEUM_DEFS+'<g transform="scale(.375)">'+drawing+'</g></svg>';
  return [id,'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg).replace(/'/g,'%27')];
})));
export function galleryIllustration(id){
  const src=MUSEUM_IMAGES[id]||IMAGES[id];
  if(!src)return '';
  return '<img class="gal-tile-artwork" src="'+src+'" alt="" width="24" height="24" draggable="false" decoding="async" aria-hidden="true">';
}
