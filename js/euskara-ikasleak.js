/* Inperialismoa · ikasleentzako testuen euskarazko aurkezpena.
 * Identifikatzaileak, aukera-ordena eta zuzenketa-gakoak EZ dira aldatzen.
 * DBko jatorrizko datuak eta irakaslearen erregistro historikoak bere horretan.
 */
const missions={
  1:{title:"Aurrekarriak eta oinarriak",subtitle:"Inperialismoaren aurrekariak",intro:"Europako hedapen inperialaren aurrekari ekonomikoak, politikoak eta ideologikoak aztertu."},
  2:{title:"Inperialismoaren faktoreak",subtitle:"Zergatik hedatu zen inperialismoa?",intro:"Kapitalaren inbertsioak, lehengaien bilaketa, prestigioa eta justifikazio ideologikoak ikertu."},
  3:{title:"Inperioen banaketa",subtitle:"Inperioen arteko lehia eta lurralde-banaketa",intro:"Berlinen egindako konferentzia eta inperio kolonialen hedapena aztertzeko aretoa prestatzen ari gara."},
  4:{title:"Inperioen itzalak",subtitle:"Kolonialismoaren ondorioak eta erresistentziak",intro:"Kolonizazioaren ondorioak eta herrien erresistentzia historikoak aztertzeko aretoa prestatzen ari gara."},
  5:{title:"Erresistentziak eta ondorioak",subtitle:"Gatazkak eta ondarea",intro:"Herrien erresistentziak eta inperialismoaren ondorioak aztertu."},
  6:{title:"Amaierako erronka",subtitle:"Mapak eta aurkezpen historikoa",intro:"Banaketa koloniala kritikoki aztertzeko azken jarduera."}
};
const questions={
 a1:["Zer lortu nahi zuten potentzia industrialek kolonietan?",["Lehengaiak eta merkatu berriak","Beren lantegiak ixtea","Kanpo-merkataritza amaitzea"],"Industrializazioak lehengaien eta merkatu berrien bilaketa areagotu zuen."],
 a2:["Zein arrazoi politikok bultzatu zuen hedapen koloniala?",["Nazionalismoaren desagerpenak","Potentzien arteko prestigioak eta lehiak","Europako estatuen desagerpenak"],"Lurraldeak eskuratzeko lehia nazioarteko boterearen adierazpen bihurtu zen."],
 a3:["Zein ideia erabili zen menderakuntza ideologikoki justifikatzeko?",["Herri guztien benetako berdintasuna","Arrazen ustezko nagusitasuna eta zibilizazio-misioa","Kolonien autodeterminazioa"],"Ideologia arrazistek konkista justifikatzeko balio izan zuten."],
 b1:["Zein urtetan egin zen Berlingo Konferentzia?",["1789–1791","1884–1885","1919–1920"],"Konferentzia 1884ko azarotik 1885eko otsailera bitarte egin zen."],
 b2:["Afrikako gizarteetako ordezkariek erabaki horietan parte hartu zuten?",["Bai, Europako ordezkarien botere berarekin","Ez, negoziazioetatik kanpo utzi zituzten","Bai, parte-hartzaile bakarrak izan ziren"],"Europako potentziek Afrikako lurraldeez negoziatu zuten Afrikako ordezkaririk gabe."],
 b3:["Zein printzipiok lagundu zuen kostaldeko jabetza kolonial berriak aitortzen?",["Okupazio eraginkorra","Sufragio unibertsala","Betiko neutraltasuna"],"Okupazio eraginkorraren printzipioak lurraldearen kontrola egiaztatzea bilatzen zuen."],
 c1:["Zein herrialdek gobernatzen zuen India XIX. mendetik XX. menderako trantsizioan?",["Frantziak","Erresuma Batuak","Portugalek"],"India Britainiar Rajaren lurralde nagusia zen."],
 c2:["Zein herrialderen erregeak izan zuen Kongoko Estatu Askea bere jabetza pertsonal gisa 1908ra arte?",["Belgikako Leopoldo II.ak","Alemaniako Bismarckek","Espainiako Alfontso XIII.ak"],"Leopoldo II.a Kongoko Estatu Askearen subiranoa izan zen, 1908an Belgikak bereganatu zuen arte."],
 c3:["Zein lurralde egon zen Frantziaren mende kolonialean?",["Aljeria","Kanada","Australia"],"Frantziak 1830ean hasi zuen Aljeriaren konkista eta han zabaldu zuen bere kontrola."],
 d1:["Zein izan zen kolonialismoaren ohiko ondorioetako bat?",["Desberdintasun guztiak desagertzea","Baliabideen eta lanaren ustiapena","Berehalako independentzia"],"Sistema kolonial askok behartutako lana eta baliabideen erauzketa erabili zituzten."],
 d2:["Iturri kolonial bat aztertzean, zer galdetu behar dugu?",["Nork, norentzat eta zertarako sortu zuen","Antzinakoa den soilik","Irudi asko dituen"],"Egilea, testuingurua eta asmoa funtsezkoak dira iturriak interpretatzeko."],
 d3:["Zergatik sor zitzakeen gatazkak muga kolonial batek?",["Tokiko komunitateak beti errespetatzen zituelako","Aurretiko herriak, harremanak eta errealitateak kontuan hartu gabe marraz zitekeelako","Lehia guztiak ezabatzen zituelako"],"Muga asko aurretiko gizarte-errealitateak kontuan hartu gabe ezarri ziren."],
 e1:["Nola erantzun zuten kolonizatutako herriek?",["Ez zen aurkakotasunik egon","Erresistentzia eta negoziazio modu askorekin","Denek Europako kontrola onartu zuten"],"Erresistentzia armatua, politikoa eta kulturala egon zen, baita negoziazioak ere."],
 e2:["Zein matxinada izan zen Txinan 1900 inguruan atzerriko eraginaren aurka?",["Boxerren matxinada","Krabelinen Iraultza","Parisko Komuna"],"Boxerren matxinada atzerriko potentziekin izandako tentsio handiko testuinguruan gertatu zen."],
 e3:["Nola azter daiteke inperialismoaren ondarea modu zorrotzean?",["Kolonizatzaileei bakarrik entzunez","Iturriak alderatuz eta epe luzeko ondorioak aztertuz","Indarkeriazko gertaerak baztertuz"],"Historiak ikuspegiak, frogak eta ondorioak alderatzea eskatzen du."]
};
export const IKASLEEN_MISIOAK=Object.freeze(missions);
export function euskaratuGaldera(q){
 const eu=questions[q.id];
 if(!eu || !(String(q.text||"").includes("¿")||String(q.text||"").includes("Qué")||String(q.text||"").includes("Cuál")))return q;
 return {...q,text:eu[0],options:[...eu[1]],...(q.explanation!==undefined?{explanation:eu[2]}:{})};
}
export function euskaratuMisioa(m){
 const eu=missions[m.id];
 return {...m,...(eu||{}),questions:(m.questions||[]).map(euskaratuGaldera)};
}
