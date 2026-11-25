import { mountClassroomProgressPanel } from './classroom-progress-overlay.js?v=20261125-inline1';
import { arriveMuseumRoom, stampMuseumExercise } from './museum-experience.js?v=2';
import {walletButton,walletContext,prepareWallet} from './museum-wallet.js?v=20261124-atlas2';
/* Recorrido de museo de la primera misión. Navegación docente libre;
 * alumnado con estado real del equipo y enlaces restringidos. Solo lectura. */
const pages=[
 [1,"Boterearen mapa","./index.html#mission1gallery","./index.html#teacherpreviewgallery"],
 [2,"Bi sistema, bi Europa","./bi-sistema.html","./bi-sistema.html?preview=1"],
 [3,"Inperioaren giltzak","./inperialismoaren-definizioa.html","./inperialismoaren-definizioa.html?preview=1"],
 [4,"Kolonien espedienteak","./inperioen-aztarnak.html","./inperioen-aztarnak.html?preview=1"],
 [5,"Azken zigilua","./esaldiak-osatu.html","./esaldiak-osatu.html?preview=1"]
];
function style(){
 if(document.getElementById("m1-navigation-style"))return;
 const el=document.createElement("style");el.id="m1-navigation-style";
 el.textContent=`
 .m1-nav{position:relative;z-index:90;box-sizing:border-box;width:100%;padding:11px 24px 13px;color:#f6dfb3;isolation:isolate;font-family:Georgia,'Times New Roman',serif;text-align:center;
   background:radial-gradient(ellipse at 50% 15%,#364a32aa,transparent 75%),linear-gradient(180deg,#261609 0%,#5a3216 4%,#140f0a 7%,#103126 16%,#10281f 89%,#3d2514 93%,#78451c 96%,#261509 100%);
   border-top:3px ridge #a16d38;border-bottom:5px ridge #9b6936;box-shadow:0 10px 22px #0008,inset 0 1px #e7bd6c88,inset 0 -2px #dc9b4d77}
 .m1-nav *{box-sizing:border-box}
 .m1-nav-title{display:inline-block;position:relative;margin:0 0 9px;padding:3px 19px;border:1px solid #ae7c48;border-radius:2px;
   color:#f6dfad;background:linear-gradient(180deg,#50301a,#241710 53%,#3c2719);box-shadow:0 2px 5px #000a,inset 0 1px #c9965b55;
   font:bold 12px/1.45 Georgia,'Times New Roman',serif;letter-spacing:.19em;text-shadow:0 1px #000}
 .m1-nav-links{position:relative;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));align-items:start;gap:6px;width:min(100%,1420px);margin:0 auto;isolation:isolate}
 .m1-nav-links::before{content:'';position:absolute;z-index:-1;top:28px;left:9%;right:9%;height:5px;
   border-top:1px solid #f7db99;background:linear-gradient(180deg,#6a3818,#b68c45 30%,#f5d78f 48%,#986327 76%,#5a3217);
   box-shadow:0 1px 4px #000b,0 0 6px #e0aa5455}
 .m1-route-stop{display:flex;min-width:0;align-items:center;flex-direction:column;gap:7px;position:relative;z-index:1;
   padding:0 3px 3px;outline-offset:3px;text-decoration:none!important;color:inherit!important;border:0;background:transparent;cursor:pointer}
 .m1-route-stop:hover .m1-nav-num,.m1-route-stop:focus-visible .m1-nav-num{box-shadow:0 0 0 3px #f3c77588,0 0 20px #ffd78d88,0 2px 8px #000b}
 .m1-route-stop:focus-visible{outline:2px solid #f7db9e;border-radius:4px}
 .m1-nav-num{position:relative;width:59px;height:59px;flex:none;display:grid;place-items:center;color:#f9deb1;
   border:4px ridge #c59d58;border-radius:50%;background:radial-gradient(circle at 32% 24%,#59705a,#224436 58%,#142b24 100%);
   box-shadow:inset 0 1px 4px #fff2b139,inset 0 -5px 8px #0009,0 2px 7px #000b;
   font:700 32px/1 Georgia,serif;text-shadow:0 2px 2px #000b;transition:box-shadow .16s}
 .m1-nav-num::before{content:'';position:absolute;inset:4px;border:1px solid #e7c9849c;border-radius:50%;pointer-events:none}
 .m1-route-seal{position:absolute;z-index:2;right:-6px;bottom:-6px;width:24px;height:24px;border:2px solid #dfc07e;border-radius:50%;display:grid;place-items:center;
   color:#f6eac5;background:linear-gradient(150deg,#437650,#24462e);font:bold 16px Georgia,serif;box-shadow:0 2px 6px #000a}
 .m1-nav-label{display:flex;align-items:center;justify-content:center;width:100%;max-width:265px;min-height:43px;padding:6px 9px;
   border:2px ridge #b49254;border-radius:3px;background:linear-gradient(130deg,#f1d9a8,#ddbc80 65%,#b9945b);color:#352315;
   box-shadow:inset 0 1px #ffedc4,0 2px 5px #0009;font:700 clamp(11px,1.09vw,16px)/1.13 Georgia,'Times New Roman',serif;text-align:center;text-wrap:balance}
 .m1-route-stop.is-current .m1-nav-num{background:radial-gradient(circle at 32% 25%,#b85846,#692822 70%,#3e1614);
   border-color:#ffe5a2;color:#fff0be;box-shadow:0 0 0 3px #d5a3458a,0 0 23px #f9c867b0,inset 0 2px 7px #ffd49f72,0 3px 9px #000a}
 .m1-route-stop.is-current .m1-nav-label{border-color:#fbe0a0;background:linear-gradient(135deg,#fff0be,#e8c688 65%,#d6a75e);box-shadow:0 0 15px #f0b95385,inset 0 1px #fff6d5}
 .m1-route-stop.is-locked{cursor:not-allowed;opacity:.52}
 .m1-route-stop.is-locked .m1-nav-num{background:radial-gradient(circle at 28% 20%,#56514a,#292927 78%);border-color:#897b64;color:#cbbca2}
 .m1-route-stop.is-locked .m1-nav-label{filter:saturate(.52)}
 .m1-route-lock{position:absolute;z-index:2;right:-8px;bottom:-7px;font:15px/1 Georgia,serif;background:#3c3028;border:1px solid #ad9775;padding:4px;border-radius:50%}
 .m1-route-return{display:inline-block;margin-top:9px;padding:5px 12px;border:1px solid #aa8651;border-radius:3px;background:#1e2b20;color:#ead2a9!important;
   text-decoration:none!important;font:bold 12px/1.4 Georgia,'Times New Roman',serif}
 .m1-route-return:hover,.m1-route-return:focus-visible{background:#3b3f26;border-color:#efc47d;outline-offset:2px}
 .m1-stage-tools{display:flex;align-items:center;justify-content:center;gap:9px;flex-wrap:wrap;padding:7px 12px;
   background:linear-gradient(180deg,#382519,#1e2118 52%,#422b18);color:#ecd7ac;font:600 12px/1.4 Georgia,'Times New Roman',serif;border-bottom:2px ridge #a77842}
 .m1-stage-tools button{cursor:pointer;background:linear-gradient(#665031,#302c20);border:1px solid #c5a06c;border-radius:4px;padding:6px 11px;color:#f5e0bb;font:inherit}
 .m1-stage-tools button:hover,.m1-stage-tools button:focus-visible{background:#6c5533;outline:2px solid #dabc82;outline-offset:1px}
 .m1-teacher-label{font-style:italic;color:#ead5ad;white-space:nowrap}
 @media(min-width:1700px){.m1-nav{padding-top:14px;padding-bottom:16px}.m1-nav-num{width:65px;height:65px;font-size:36px}.m1-nav-links::before{top:31px}}
 @media(max-width:750px){.m1-nav{padding:8px 6px 10px}.m1-nav-title{margin-bottom:9px;padding:2px 6px;font-size:9px;letter-spacing:.07em}
  .m1-nav-links{gap:3px}.m1-nav-links::before{top:17px;height:3px}.m1-nav-num{width:37px;height:37px;font-size:22px;border-width:3px}
  .m1-nav-num::before{inset:2px}.m1-route-seal{width:17px;height:17px;font-size:12px;right:-3px;bottom:-3px}
  .m1-route-lock{font-size:11px;padding:2px;right:-4px;bottom:-4px}.m1-nav-label{min-height:36px;padding:4px 2px;font-size:9px}
  .m1-route-stop{gap:5px;padding:0}.m1-route-return{font-size:11px}}
 @media(prefers-reduced-motion:reduce){.m1-nav-num{transition:none}}

 /* 2026-11-23 · Segunda capa artística: fundición ornamental y escaparate de museo.
    Sin imágenes compuestas: los números, estados y enlaces siguen siendo HTML real. */
 .m1-museum-route{
   position:relative;min-height:246px;padding:24px clamp(36px,4.7vw,92px) 18px;
   border:9px ridge #865526;overflow:hidden;isolation:isolate;
   background-image:
     url("./assets/m1-textura-madera.svg"),
     radial-gradient(ellipse 48% 125% at 51% 57%,#5e75482b 0%,#0b1b1600 83%),
     radial-gradient(ellipse 80% 72% at 50% -8%,#74502a99 0%,#24140d44 53%,transparent 82%),
     linear-gradient(180deg,
       #190d07 0%,#5e351b 2.2%,#9a6630 3.8%,#25150e 5.5%,#442511 7.4%,
       #cf9e5a 8.5%,#392313 9.6%,#0a211a 12.1%,#102920 37%,
       #112c23 62%,#082018 87%,#ad7d42 90.1%,#2b180e 92.4%,
       #75451f 96%,#160b07 100%);
   background-repeat:repeat, no-repeat,no-repeat,no-repeat;
   background-size:640px 140px,cover,cover,cover;
   background-blend-mode:soft-light,normal,normal,normal;
   box-shadow:
     inset 0 0 0 1px #edc5809f,
     inset 0 4px 0 #140a05, inset 0 9px 1px #a57a45b7,
     inset 0 13px 2px #120c08,
     inset 0 -3px 0 #100904,inset 0 -8px 0 #ad7f3c,
     inset 0 -12px 0 #25160d,
     inset 0 0 53px 18px #000a,
     0 5px 0 #241208,0 10px 19px #000b;
 }
 .m1-museum-route::before,.m1-museum-route::after{
   content:"";position:absolute;z-index:0;pointer-events:none;
   width:132px;height:168px;top:73px;
   background:url("./assets/m1-roleau-esquina.svg") left center/contain no-repeat;
   opacity:.90;filter:drop-shadow(1px 2px 3px #000b);
 }
 .m1-museum-route::before{left:16px}
 .m1-museum-route::after{right:16px;transform:scaleX(-1)}
 .m1-museum-route > *{position:relative;z-index:1}
 .m1-museum-route .m1-nav-title{
   position:relative;display:inline-block;margin:0 auto 13px;
   padding:6px 31px 7px;border:3px ridge #bd8a47;border-radius:3px;
   background:linear-gradient(180deg,#764a27 0%,#382114 18%,#25160f 59%,#5b351c 92%,#24150d 100%);
   color:#f8e1a8;box-shadow:
     0 1px 0 #f2ce8d7d,0 4px 8px #000c,
     inset 0 1px 1px #fff1af62,inset 0 -2px 3px #080402aa;
   font:700 14px/1.35 Georgia,'Times New Roman',serif;letter-spacing:.16em;
   text-shadow:0 2px 2px #000d,0 0 8px #ffd58a42;
 }
 .m1-museum-route .m1-nav-title::before,.m1-museum-route .m1-nav-title::after{
   content:"✧";position:absolute;top:50%;transform:translateY(-52%);
   color:#d2a254;text-shadow:0 1px #000,0 0 3px #f8d89f7b;font-size:17px;
 }
 .m1-museum-route .m1-nav-title::before{left:10px}
 .m1-museum-route .m1-nav-title::after{right:10px}
 .m1-museum-route .m1-nav-links{
   width:min(100%,1515px);margin:0 auto;
   grid-template-columns:repeat(5,minmax(0,1fr));
   align-items:start;gap:14px;isolation:isolate;
 }
 .m1-museum-route .m1-nav-links::before{
   content:"";position:absolute;left:8.7%;right:8.7%;top:41px;
   height:9px;border:1px solid #34200e;border-top-color:#ffe8a5;border-bottom-color:#5b3517;
   border-radius:5px;
   background:linear-gradient(180deg,
     #ffe4a0 0%,#bb8640 12%,#67401f 23%,#d7ad63 38%,
     #ffe39a 48%,#ad7137 64%,#754217 76%,#e0b874 88%,#58300e 100%);
   box-shadow:0 1px #f2d39777,0 3px 5px #000a,0 0 12px #e5bd7652;
   z-index:-1;
 }
 .m1-museum-route .m1-route-stop{
   display:flex;flex-direction:column;align-items:center;
   gap:14px;padding:0 3px 6px;isolation:isolate;
   text-decoration:none!important;border:0;background:transparent;
   outline-offset:5px;transition:filter .16s ease;
 }
 .m1-museum-route .m1-route-stop::before{
   content:"";position:absolute;z-index:-1;left:50%;top:78px;
   width:5px;height:38px;transform:translateX(-50%);
   background:linear-gradient(90deg,#3d2411,#c59b56 25%,#ffe3a0 50%,#80501f 79%,#231209);
   box-shadow:0 2px 4px #000c;pointer-events:none;
 }
 .m1-museum-route .m1-nav-num{
   position:relative;display:grid;place-items:center;
   width:90px;height:90px;border:8px solid transparent;border-radius:50%;flex:none;
   background:
     radial-gradient(ellipse at 38% 19%,#4c7751 0%,#204834 36%,#10281f 70%,#0b1916 100%) padding-box,
     conic-gradient(from 12deg,#a46b2e,#ffeda9 32deg,#b97937 72deg,#5c3214 119deg,
         #e4b867 155deg,#ffe9a5 185deg,#82501e 229deg,#dbac5a 268deg,
         #533216 318deg,#a46b2e 360deg) border-box;
   color:#ffe2a2;
   box-shadow:0 0 0 2px #37220f,0 0 0 4px #b68137,
     0 0 0 5px #35200e,0 6px 9px #000c,
     inset 0 3px 5px #fff2bd36,inset 0 -5px 10px #000b;
   font:700 48px/1 Georgia,'Times New Roman',serif;
   text-shadow:0 -1px 1px #fff6c15d,1px 2px 1px #452814,0 4px 4px #000c;
   transition:filter .16s ease,box-shadow .16s ease;
 }
 .m1-museum-route .m1-nav-num::before{
   content:"";inset:3px;position:absolute;pointer-events:none;border:2px solid #dcb56eaa;
   border-radius:50%;box-shadow:inset 0 0 0 2px #1e241993,0 0 1px #fae4a9;
 }
 .m1-museum-route .m1-nav-num::after{
   content:"";inset:0;position:absolute;pointer-events:none;
   background:url("./assets/m1-laurel-bronce.svg") center 101% / 105% 59% no-repeat;
   opacity:.9;filter:drop-shadow(0 1px 1px #241309);
 }
 .m1-museum-route .m1-nav-label{
   position:relative;display:flex;align-items:center;justify-content:center;
   width:100%;max-width:252px;min-height:66px;padding:9px 15px;
   border:5px ridge #ad7940;border-radius:7px;
   background:
      repeating-linear-gradient(1deg,transparent 0px,#87643a12 2px,transparent 5px),
      radial-gradient(ellipse at 40% 0%,#fff6d6b3,transparent 70%),
      linear-gradient(125deg,#d1ae74 0%,#eed7a9 13%,#f3e0b8 41%,#dec08a 74%,#c69d62 100%);
   color:#312012!important;
   box-shadow:inset 0 1px #fff9da9e,inset 0 -2px 3px #93642a7d,
     0 2px 0 #4b2910,0 6px 10px #000c,0 0 9px #f4ce7644;
   font:700 clamp(12px,1.27vw,18px)/1.15 Georgia,'Times New Roman',serif;
   letter-spacing:-.01em;text-shadow:0 1px #fff6da9c;
   text-align:center;text-wrap:balance;
 }
 .m1-museum-route .m1-nav-label::before{
   content:"";position:absolute;inset:4px;pointer-events:none;
   border:1px solid #ae84527d;border-radius:3px;
   box-shadow:inset 0 1px #fff5d68f;
 }
 .m1-museum-route .m1-nav-label::after{
   content:"";position:absolute;inset:0;pointer-events:none;
   background:
     radial-gradient(circle at 8px 8px,#5d3317 0 2px,#eec57e 2.5px 3.8px,transparent 4.2px),
     radial-gradient(circle at calc(100% - 8px) 8px,#5d3317 0 2px,#eec57e 2.5px 3.8px,transparent 4.2px),
     radial-gradient(circle at 8px calc(100% - 8px),#5d3317 0 2px,#eec57e 2.5px 3.8px,transparent 4.2px),
     radial-gradient(circle at calc(100% - 8px) calc(100% - 8px),#5d3317 0 2px,#eec57e 2.5px 3.8px,transparent 4.2px);
 }
 .m1-museum-route .m1-route-stop.is-current .m1-nav-num{
   background:
     radial-gradient(ellipse at 35% 18%,#b45d44 0%,#7c3027 30%,#521d1b 76%,#280c10 100%) padding-box,
     conic-gradient(from 0deg,#b87532,#f3cf7e 40deg,#956025 88deg,#e0ad58 150deg,#854819 238deg,#f2cb75 290deg,#b87532) border-box;
   color:#fff1c3;
   box-shadow:0 0 0 2px #50311c,0 0 0 5px #e1b55d,
     0 0 0 7px #dfa74e8c,0 0 17px 5px #e9aa476b,
     0 5px 12px #000b,inset 0 2px 9px #ffd3a364,inset 0 -6px 10px #250908a1;
 }
 .m1-museum-route .m1-route-stop.is-current .m1-nav-label{
   border-color:#edd18a;
   background:radial-gradient(ellipse at 50% 0%,#fff9d8,transparent 80%),
     linear-gradient(125deg,#dfb46d,#fff0c0 28%,#fbe7ba 60%,#dfbb81);
   box-shadow:inset 0 1px #fff9dc,inset 0 -2px 3px #99642e9c,
     0 3px 0 #5b3016,0 6px 12px #000c,
     0 0 12px 3px #eac37799,0 0 27px 6px #c8863873;
 }
 .m1-museum-route .m1-route-stop.is-done .m1-nav-num{
   background:radial-gradient(circle at 35% 19%,#598358,#1f4a30 63%,#10291d) padding-box,
     conic-gradient(from 0deg,#cb9750,#ffedaf,#9e652d,#edc57e,#78501f,#dfb368,#cb9750) border-box;
 }
 .m1-museum-route .m1-route-seal{
   left:50%;right:auto;bottom:-13px;transform:translateX(-50%);
   width:29px;height:29px;border:4px double #d7b46a;
   background:radial-gradient(circle at 30% 20%,#49845a,#194f34 75%);
   box-shadow:0 0 0 2px #38200f,0 3px 6px #000b,
     inset 0 1px 3px #b4e8a65d;
   font:bold 20px/1 Georgia,serif;color:#f9ebc0;
 }
 .m1-museum-route .m1-route-stop.is-locked{opacity:1;filter:saturate(.55) brightness(.75);cursor:not-allowed}
 .m1-museum-route .m1-route-stop.is-locked .m1-nav-num{
   background:radial-gradient(circle at 25% 13%,#625a4e,#39332d 57%,#25231e) padding-box,
     conic-gradient(#9c896e,#c0aa82,#554434,#98866a,#554434,#9c896e) border-box;
   border-color:transparent;color:#bfb3a0;
   box-shadow:0 0 0 2px #362a20,0 0 0 4px #806948,0 2px 7px #000a,inset 0 -4px 8px #0009;
 }
 .m1-museum-route .m1-route-stop.is-locked .m1-nav-label{
   background:linear-gradient(125deg,#aa976e,#d1b68a 23%,#b9a17d 73%,#9b835d);
   border-color:#8c7857;color:#63523e!important;
   box-shadow:inset 0 1px #e8d3a8a3,0 4px 8px #0008;
 }
 .m1-museum-route .m1-route-lock{
   width:23px;height:19px;position:absolute;bottom:-10px;right:1px;
   padding:0;border:2px solid #bda476;border-radius:3px;
   background:linear-gradient(145deg,#b9a77d,#594e3a 73%);
   box-shadow:0 0 0 2px #3c3226,0 2px 5px #0008;
   font-size:0;color:transparent;
 }
 .m1-museum-route .m1-route-lock::before{
   content:"";position:absolute;left:4px;right:4px;top:-10px;height:11px;
   border:3px solid #b8a079;border-bottom:0;border-radius:8px 8px 0 0;
   box-shadow:inset 0 1px #1f1b15;
 }
 .m1-museum-route .m1-route-lock::after{
   content:"";position:absolute;left:50%;top:6px;width:3px;height:5px;
   border-radius:50%;background:#302617;transform:translateX(-50%);
 }
 .m1-museum-route .m1-route-stop:hover:not(.is-locked) .m1-nav-num,
 .m1-museum-route .m1-route-stop:focus-visible .m1-nav-num{
   filter:brightness(1.12);
   box-shadow:0 0 0 2px #493016,0 0 0 5px #e9c27a,
     0 0 18px 4px #f8cf7a8c,inset 0 -5px 8px #0008;
 }
 .m1-museum-route .m1-route-return{
   position:absolute;right:29px;top:23px;display:inline-block;margin:0;
   padding:7px 13px 8px;border:3px ridge #a4753d;border-radius:3px;
   background:linear-gradient(180deg,#614026,#2d2319 60%,#55351e);
   box-shadow:0 3px 6px #000a,inset 0 1px #d9b7797c;
   color:#f3dcae!important;font:700 12px/1.3 Georgia,'Times New Roman',serif;
   text-decoration:none!important;white-space:nowrap;
 }
 .m1-museum-route .m1-route-return:hover,.m1-museum-route .m1-route-return:focus-visible{
   border-color:#f8d894;background:linear-gradient(#78512f,#3b2a1c);
   outline:2px solid #ffe1a4;outline-offset:2px;
 }
 /* Materiales afines para los botones docentes situados justo bajo el friso. */
 .m1-museum-route + .m1-stage-tools{
   background:linear-gradient(180deg,#3d2517,#1c1b16 45%,#49301c);
   border-top:1px solid #d0a6668c;border-bottom:3px ridge #a7773e;
   padding:9px 12px;box-shadow:inset 0 1px #130b08,0 3px 8px #0007;
 }
 .m1-museum-route + .m1-stage-tools button{
   border:2px ridge #af8248;background:linear-gradient(160deg,#7a5836,#393024 48%,#644829);
   box-shadow:inset 0 1px #f3d69b5d,0 2px 4px #0008;
 }
 @media(max-width:1200px){
   .m1-museum-route{padding:19px 45px 17px;min-height:220px}
   .m1-museum-route::before,.m1-museum-route::after{width:97px;height:127px;top:82px}
   .m1-museum-route::before{left:5px}.m1-museum-route::after{right:5px}
   .m1-museum-route .m1-nav-links{gap:7px}
   .m1-museum-route .m1-nav-num{width:76px;height:76px;font-size:41px;border-width:7px}
   .m1-museum-route .m1-nav-links::before{top:34px}
   .m1-museum-route .m1-route-stop::before{top:65px}
   .m1-museum-route .m1-nav-label{min-height:59px;padding:8px 8px;font-size:clamp(11px,1.34vw,16px)}
   .m1-museum-route .m1-route-return{right:11px;top:17px;font-size:11px;padding:5px 7px}
 }
 @media(max-width:750px){
   .m1-museum-route{min-height:0;padding:9px 5px 11px;border-width:5px}
   .m1-museum-route::before,.m1-museum-route::after{display:none}
   .m1-museum-route .m1-nav-title{padding:4px 12px;font-size:10px;letter-spacing:.035em;margin-bottom:12px}
   .m1-museum-route .m1-nav-title::before,.m1-museum-route .m1-nav-title::after{display:none}
   .m1-museum-route .m1-nav-links{gap:3px}
   .m1-museum-route .m1-nav-links::before{top:18px;height:4px}
   .m1-museum-route .m1-nav-num{width:43px;height:43px;border-width:4px;font-size:24px}
   .m1-museum-route .m1-nav-num::before{inset:1px;border-width:1px}
   .m1-museum-route .m1-route-stop{gap:7px;padding:0 0 3px}
   .m1-museum-route .m1-route-stop::before{top:38px;height:15px;width:3px}
   .m1-museum-route .m1-nav-label{min-height:39px;border-width:2px;padding:4px 2px;
     font-size:9px;line-height:1.07;border-radius:3px}
   .m1-museum-route .m1-nav-label::before{inset:2px}
   .m1-museum-route .m1-nav-label::after{display:none}
   .m1-museum-route .m1-route-seal{width:18px;height:18px;bottom:-7px;font-size:12px;border-width:2px}
   .m1-museum-route .m1-route-lock{transform:scale(.7);transform-origin:bottom right}
   .m1-museum-route .m1-route-return{position:relative;top:auto;right:auto;margin-top:9px;font-size:11px}
 }

 /* Compactación exclusiva de escritorio: menos friso, más ejercicio a la vista. */
 @media(min-width:751px){
  .m1-museum-route{
    min-height:0;padding:7px clamp(18px,3vw,46px) 9px;border-width:5px;
    box-shadow:inset 0 0 0 1px #edc5809f,inset 0 3px 0 #140a05,
      inset 0 6px 1px #a57a45b7,inset 0 -3px 0 #100904,
      inset 0 -6px 0 #ad7f3c,inset 0 0 34px 7px #0009,
      0 3px 0 #241208,0 6px 13px #0009;
  }
  .m1-museum-route::before,.m1-museum-route::after{
    width:63px;height:83px;top:46px;opacity:.76;
  }
  .m1-museum-route::before{left:4px}
  .m1-museum-route::after{right:4px}
  .m1-museum-route .m1-nav-title{
    margin:0 auto 6px;padding:2px 21px 3px;border-width:2px;
    font-size:11px;line-height:1.3;letter-spacing:.1em;
  }
  .m1-museum-route .m1-nav-title::before,.m1-museum-route .m1-nav-title::after{font-size:12px}
  .m1-museum-route .m1-nav-title::before{left:6px}
  .m1-museum-route .m1-nav-title::after{right:6px}
  .m1-museum-route .m1-nav-links{gap:10px}
  .m1-museum-route .m1-nav-links::before{top:27px;height:6px;border-radius:4px}
  .m1-museum-route .m1-route-stop{gap:8px;padding:0 2px 1px}
  .m1-museum-route .m1-route-stop::before{top:49px;height:22px;width:4px}
  .m1-museum-route .m1-nav-num{
    width:58px;height:58px;border-width:5px;font-size:31px;
    box-shadow:0 0 0 1px #37220f,0 0 0 3px #b68137,0 0 0 4px #35200e,
      0 3px 6px #000c,inset 0 2px 3px #fff2bd36,inset 0 -3px 7px #000b;
  }
  .m1-museum-route .m1-nav-num::before{inset:2px;border-width:1px}
  .m1-museum-route .m1-nav-label{
    min-height:43px;max-width:235px;padding:5px 8px;border-width:3px;
    border-radius:5px;font-size:clamp(11px,1.05vw,14px);line-height:1.12;
    box-shadow:inset 0 1px #fff9da9e,inset 0 -1px 2px #93642a7d,
      0 1px 0 #4b2910,0 3px 6px #000b;
  }
  .m1-museum-route .m1-nav-label::before{inset:3px}
  .m1-museum-route .m1-nav-label::after{
    background:
      radial-gradient(circle at 6px 6px,#5d3317 0 1.2px,#eec57e 1.7px 3px,transparent 3.2px),
      radial-gradient(circle at calc(100% - 6px) 6px,#5d3317 0 1.2px,#eec57e 1.7px 3px,transparent 3.2px),
      radial-gradient(circle at 6px calc(100% - 6px),#5d3317 0 1.2px,#eec57e 1.7px 3px,transparent 3.2px),
      radial-gradient(circle at calc(100% - 6px) calc(100% - 6px),#5d3317 0 1.2px,#eec57e 1.7px 3px,transparent 3.2px);
  }
  .m1-museum-route .m1-route-stop.is-current .m1-nav-num{
    box-shadow:0 0 0 1px #50311c,0 0 0 3px #e1b55d,
      0 0 0 4px #ffe19c8c,0 0 13px 3px #e9aa476b,
      0 3px 7px #000b,inset 0 2px 6px #ffd3a364,inset 0 -4px 8px #250908a1;
  }
  .m1-museum-route .m1-route-stop.is-current .m1-nav-label{
    box-shadow:inset 0 1px #fff9dc,inset 0 -1px 2px #99642e9c,
      0 2px 0 #5b3016,0 3px 7px #000c,0 0 8px 2px #eac37786;
  }
  .m1-museum-route .m1-route-seal{
    width:20px;height:20px;bottom:-7px;border-width:2px;
    font-size:13px;box-shadow:0 0 0 1px #38200f,0 2px 4px #000b;
  }
  .m1-museum-route .m1-route-lock{
    transform:scale(.72);transform-origin:bottom right;bottom:-7px;right:-4px;
  }
  .m1-museum-route .m1-route-return{
    right:10px;top:8px;padding:3px 7px 4px;
    border-width:2px;font-size:10px;line-height:1.15;
  }
 }

 @media(prefers-reduced-motion:reduce){.m1-museum-route *{transition:none!important}}

 `;
 document.head.append(el);
 const progressStyle=document.createElement('style');progressStyle.id='m1-inline-progress-style';
 progressStyle.textContent=`
 .museum-wallet-bar:has(.m1-class-widget-inline){display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:10px;position:relative;z-index:30;padding:4px 12px}
 .museum-wallet-bar .m1-class-widget-inline{position:relative;inset:auto;display:inline-flex;flex:none;align-items:center;max-width:100%;gap:0;z-index:auto;pointer-events:auto}
 .museum-wallet-bar .m1-class-widget-inline .m1-class-toggle{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:4px 19px 4px 8px;min-height:39px;border:1px solid #c39b55;border-radius:30px;background:linear-gradient(115deg,#392d23,#5a452a);color:#fff2d2;font:600 13px Georgia,serif;letter-spacing:.035em;box-shadow:0 3px 18px #0003;text-shadow:none}
 .museum-wallet-bar .m1-progress-emblem{flex:0 0 32px;width:32px;height:32px;filter:drop-shadow(0 0 3px #e3b45e66)}
 .museum-wallet-bar .m1-class-widget-inline .m1-class-panel{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:min(720px,calc(100vw - 24px));max-height:85dvh;z-index:10000;box-shadow:0 12px 35px #000b,0 0 0 100vmax #0008}
 .museum-wallet-bar .m1-class-widget-inline .m1-class-panel[hidden]{display:none!important}
 .museum-wallet-bar .m1-class-widget-inline .m1-class-panel-body{overflow:auto}
 @media(max-width:560px){.museum-wallet-bar{gap:6px}.museum-wallet-bar .m1-class-widget-inline .m1-class-toggle{padding:3px 10px 3px 6px;font-size:12px;min-height:36px}.museum-wallet-bar .m1-progress-emblem{width:28px;height:28px;flex-basis:28px}}
 `;
 document.head.append(progressStyle);
}
function navSteps(active,completedSteps){
 const done=new Set(Array.from(completedSteps||[]).map(Number).filter(n=>n>=1&&n<=5));
 // La sala siguiente se abre solo tras superar la anterior; los accesos
 // conservan la comprobación propia del servidor aunque se fuerce la URL.
 const unlocked=new Set([1]);
 for(let n=2;n<=5;n++)if(done.has(n-1))unlocked.add(n);
 return {done,unlocked};
}
export function exerciseNavMarkup(active,{teacher=true,completedSteps=[]}={}){
 style();
 const {done,unlocked}=navSteps(active,completedSteps);
 const items=pages.map(([id,label,studentHref,teacherHref])=>{
   const current=id===active;
   const locked=!teacher&&!unlocked.has(id);
   const complete=done.has(id);
   const state=current?' is-current':complete?' is-done':locked?' is-locked':'';
   const start=locked
     ?'<span class="m1-route-stop'+state+'" data-m1-step="'+id+'" aria-disabled="true" title="'+id+'. ariketa · Blokeatuta">'
     :'<a class="m1-route-stop'+state+'" data-m1-step="'+id+'" href="'+(teacher?teacherHref:studentHref)+'"'+(current?' aria-current="page"':'')+' title="'+id+'. ariketa · '+label+'">';
   const seal=!teacher&&complete?'<small class="m1-route-seal" aria-label="Gaindituta">✓</small>':'';
   const lock=locked?'<small class="m1-route-lock" aria-label="Blokeatuta"></small>':'';
   return start+'<span class="m1-nav-num" aria-hidden="true">'+id+seal+lock+'</span><span class="m1-nav-label">'+label+'</span>'+(locked?'</span>':'</a>');
 }).join("");
 const title=teacher?'IRAKASLEAREN AURREBISTA · 1. MISIOA':'1. MISIOA · MUSEOKO IBILBIDEA';
 const back=teacher?'./index.html?teacherpanel=1':'./index.html';
 const backLabel=teacher?'← Irakaslearen panelera':'← Misiora itzuli';
 return '<nav class="m1-nav m1-museum-route" data-m1-role="'+(teacher?'teacher':'student')+'" aria-label="Lehen misioko bost aretoen ibilbidea"><span class="m1-nav-title">'+title+'</span><div class="m1-nav-links">'+items+'</div><a class="m1-route-return" href="'+back+'">'+backLabel+'</a></nav>';
}
export function mountExerciseNav(active,options){
 const holder=document.createElement("div");holder.innerHTML=exerciseNavMarkup(active,options);
 const nav=holder.firstElementChild;
 document.querySelector('.m1-nav')?.remove();
 document.body.prepend(nav);
 document.querySelector('.museum-wallet-bar')?.remove();
 const bar=document.createElement('div');bar.className='museum-wallet-bar';bar.innerHTML=walletButton();nav.after(bar);prepareWallet();
 if(options?.teacher!==false){walletContext({preview:true,mission:1});mountClassroomProgressPanel(null,null,{target:bar,preview:true});}
 arriveMuseumRoom(document.body,'1:'+active);
 return nav;
}
// Toda lectura es select de las tablas permitidas al alumno; no se consulta
// la tabla privada mission_completions ni se alteran progresos.
export async function loadMission1Completed(client,team){
 if(!client||!team)return [];
 const queries=[
   client.from('gallery_team_state').select('completed_at').eq('team_id',team).maybeSingle(),
   client.from('bi_sistema_team_state').select('completed_at').eq('team_id',team).maybeSingle(),
   client.from('mission1_exercise_completions').select('exercise').eq('team_id',team),
   client.from('empire_dossier_team_state').select('completed_at').eq('team_id',team).maybeSingle()
 ];
 const results=await Promise.all(queries);
 for(const result of results)if(result.error)throw result.error;
 const complete=[];
 if(results[0].data?.completed_at)complete.push(1);
 if(results[1].data?.completed_at)complete.push(2);
 for(const r of results[2].data||[])if(r.exercise===3||r.exercise===5)complete.push(r.exercise);
 if(results[3].data?.completed_at)complete.push(4);
 return complete;
}
export async function mountStudentExerciseNav(active,client,team){
 walletContext({client,team,mission:1,preview:false});
 try{
   const complete=await loadMission1Completed(client,team);
   const nav=mountExerciseNav(active,{teacher:false,completedSteps:complete});
   mountClassroomProgressPanel(client,team,{target:document.querySelector('.museum-wallet-bar')});
   return nav;
 }catch(err){
   console.warn('Misioko ibilbidea ezin izan da kargatu',err);
   // Falla cerrado: solo queda disponible la sala actual; los demás enlaces
   // no se inventan a partir de una marca histórica.
   const nav=mountExerciseNav(active,{teacher:false,completedSteps:Array.from({length:active-1},(_,i)=>i+1)});
   mountClassroomProgressPanel(client,team,{target:document.querySelector('.museum-wallet-bar')});
   return nav;
 }
}
export function markMission1NavCompleted(step){
 const nav=document.querySelector('.m1-nav[data-m1-role="student"]');
 if(!nav)return;
 const done=[...nav.querySelectorAll('.m1-route-stop .m1-route-seal')].map(x=>Number(x.closest('[data-m1-step]').dataset.m1Step));
 const newlyCompleted=!done.includes(step);done.push(step);
 const holder=document.createElement('div');
 holder.innerHTML=exerciseNavMarkup(step,{teacher:false,completedSteps:done});
 nav.replaceWith(holder.firstElementChild);
 if(newlyCompleted)stampMuseumExercise(1,step);
 window.dispatchEvent(new Event('m1:progress-changed'));
}
export function addTeacherStageControls(stages){
 const nav=document.querySelector('.m1-nav[data-m1-role="teacher"]');if(!nav)return;
 nav.nextElementSibling?.classList.contains("m1-stage-tools")&&nav.nextElementSibling.remove();
 const bar=document.createElement("div");bar.className="m1-stage-tools";
 const title=document.createElement("span");title.className="m1-teacher-label";title.textContent="Pantailak ikusi (ez da gordetzen):";
 bar.append(title);
 for(const [label,callback] of stages){
   const button=document.createElement("button");button.type="button";button.textContent=label;
   button.addEventListener("click",callback);bar.append(button);
 }
 nav.after(bar);
}

/* Misma fundición del recorrido de la primera misión, con navegación local. */
export function mission2RouteMarkup(activities,active,{teacher=false,completedSteps=[],canOpen=()=>false,ending=false}={}){
 style();
 const done=new Set(completedSteps);
 const items=activities.map(({id,title})=>{
  const current=!ending&&id===active,complete=done.has(id),locked=!canOpen(id);
  const state=(current?' is-current':'')+(complete?' is-done':'')+(locked?' is-locked':'');
  return '<button type="button" class="m1-route-stop'+state+'" data-open="'+id+'" '+(locked?'disabled':'')+(current?' aria-current="step"':'')+' title="'+id+'. ariketa · '+title+'"><span class="m1-nav-num">'+id+(!teacher&&complete?'<small class="m1-route-seal" aria-label="Gaindituta">✓</small>':'')+(locked?'<small class="m1-route-lock" aria-label="Blokeatuta"></small>':'')+'</span><span class="m1-nav-label">'+title+'</span></button>';
 }).join('');
 return '<nav class="m1-nav m1-museum-route m2-shared-route" data-m2-role="'+(teacher?'teacher':'student')+'" aria-label="Bigarren misioko bost aretoen ibilbidea"><span class="m1-nav-title">'+(teacher?'IRAKASLEAREN AURREBISTA · 2. MISIOA':'2. MISIOA · MUSEOKO IBILBIDEA')+'</span><div class="m1-nav-links">'+items+'</div><a class="m1-route-return" href="./index.html'+(teacher?'?teacherpanel=1':'')+'">'+(teacher?'← Irakaslearen panelera':'← Museora itzuli')+'</a></nav>';
}
