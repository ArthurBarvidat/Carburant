
// Logo SVG animé intégré directement — plus besoin de charger une image externe

// ==================== ANIMATED BACKGROUND — ALL SCREENS ====================
(function initBg(){
  // Canvas IDs and their corresponding screen IDs
  const CANVASES = [
    {canvasId:'welcome-canvas', screenId:'screen-welcome'},
    {canvasId:'results-canvas', screenId:'screen-results'},
    {canvasId:'full-canvas',    screenId:'screen-full'},
    {canvasId:'legal-canvas',   screenId:'screen-legal'},
  ];

  function createBgForCanvas(canvasId, screenId){
    const canvas = document.getElementById(canvasId);
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, stars=[], nebulas=[], animId;

    function resize(){
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      initStars();
      initNebulas();
    }

    function initStars(){
      stars = [];
      const count = Math.floor((W*H)/6000);
      for(let i=0;i<count;i++){
        stars.push({
          x: Math.random()*W,
          y: Math.random()*H,
          r: Math.random()*1.4+0.2,
          a: Math.random(),
          da: (Math.random()-0.5)*0.006,
          vx: (Math.random()-0.5)*0.08,
          vy: (Math.random()-0.5)*0.08,
          color: Math.random()<0.3 ? '#c084fc' : Math.random()<0.5 ? '#34d399' : '#f1f5f9'
        });
      }
    }

    function initNebulas(){
      nebulas = [];
      for(let i=0;i<6;i++){
        nebulas.push({
          x: Math.random()*W,
          y: Math.random()*H,
          r: Math.random()*160+80,
          a: Math.random()*0.04+0.02,
          da: (Math.random()-0.5)*0.0004,
          vx: (Math.random()-0.5)*0.2,
          vy: (Math.random()-0.5)*0.2,
          hue: Math.random()<0.5 ? 265 : Math.random()<0.5 ? 160 : 200
        });
      }
    }

    let shooters = [];
    function maybeShoot(){
      if(Math.random()<0.004){
        shooters.push({
          x: Math.random()*W*0.6,
          y: Math.random()*H*0.4,
          len: Math.random()*200+80,
          speed: Math.random()*8+6,
          angle: Math.PI*0.18+Math.random()*0.2,
          alpha: 1,
          done: false
        });
      }
    }

    function draw(){
      ctx.clearRect(0,0,W,H);
      nebulas.forEach(n=>{
        n.x += n.vx; n.y += n.vy;
        n.a += n.da;
        n.a = Math.max(0.01, Math.min(0.06, n.a));
        if(n.x<-n.r) n.x=W+n.r; if(n.x>W+n.r) n.x=-n.r;
        if(n.y<-n.r) n.y=H+n.r; if(n.y>H+n.r) n.y=-n.r;
        const g = ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r);
        g.addColorStop(0,`hsla(${n.hue},80%,65%,${n.a})`);
        g.addColorStop(1,'transparent');
        ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2);
        ctx.fillStyle=g; ctx.fill();
      });
      stars.forEach(s=>{
        s.x+=s.vx; s.y+=s.vy; s.a+=s.da;
        if(s.a<0.05||s.a>1){s.da=-s.da;}
        if(s.x<0) s.x=W; if(s.x>W) s.x=0;
        if(s.y<0) s.y=H; if(s.y>H) s.y=0;
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fillStyle = s.color.replace(')',`,${s.a.toFixed(2)})`)
          .replace('rgba','rgba').replace('#f1f5f9',`rgba(241,245,249,${s.a.toFixed(2)})`)
          .replace('#c084fc',`rgba(192,132,252,${s.a.toFixed(2)})`)
          .replace('#34d399',`rgba(52,211,153,${s.a.toFixed(2)})`);
        ctx.fill();
      });
      maybeShoot();
      shooters.forEach(s=>{
        if(s.done) return;
        s.x+=Math.cos(s.angle)*s.speed; s.y+=Math.sin(s.angle)*s.speed;
        s.alpha-=0.018;
        if(s.alpha<=0){s.done=true;return;}
        const tail={x:s.x-Math.cos(s.angle)*s.len, y:s.y-Math.sin(s.angle)*s.len};
        const g=ctx.createLinearGradient(tail.x,tail.y,s.x,s.y);
        g.addColorStop(0,'transparent');
        g.addColorStop(0.7,`rgba(192,132,252,${(s.alpha*0.5).toFixed(2)})`);
        g.addColorStop(1,`rgba(255,255,255,${s.alpha.toFixed(2)})`);
        ctx.beginPath(); ctx.moveTo(tail.x,tail.y); ctx.lineTo(s.x,s.y);
        ctx.strokeStyle=g; ctx.lineWidth=1.5; ctx.stroke();
      });
      shooters = shooters.filter(s=>!s.done);
      animId = requestAnimationFrame(draw);
    }

    function start(){ resize(); window.addEventListener('resize',resize); draw(); }
    function stop(){ cancelAnimationFrame(animId); animId=null; window.removeEventListener('resize',resize); }

    const obs = new MutationObserver(()=>{
      const sc = document.getElementById(screenId);
      if(sc && sc.classList.contains('active')){
        if(!animId) start();
      } else {
        if(animId){ stop(); }
      }
    });
    obs.observe(document.body,{subtree:true,attributeFilter:['class']});

    // Start immediately if this screen is already active
    const sc = document.getElementById(screenId);
    if(sc && sc.classList.contains('active')) start();
  }

  CANVASES.forEach(c => createBgForCanvas(c.canvasId, c.screenId));
})();
// ==================== DEPARTMENTS ====================
const DEPTS=[
{c:"01",n:"Ain",city:"Bourg-en-Bresse",lat:46.2057,lon:5.2254},{c:"02",n:"Aisne",city:"Laon",lat:49.5641,lon:3.6199},{c:"03",n:"Allier",city:"Moulins",lat:46.5648,lon:3.3346},{c:"04",n:"Alpes-de-Hte-Provence",city:"Digne",lat:44.0927,lon:6.2365},{c:"05",n:"Hautes-Alpes",city:"Gap",lat:44.5594,lon:6.0786},{c:"06",n:"Alpes-Maritimes",city:"Nice",lat:43.7102,lon:7.262},{c:"07",n:"Ardèche",city:"Privas",lat:44.7355,lon:4.5986},{c:"08",n:"Ardennes",city:"Charleville-Mézières",lat:49.7719,lon:4.7164},{c:"09",n:"Ariège",city:"Foix",lat:42.9653,lon:1.6052},{c:"10",n:"Aube",city:"Troyes",lat:48.2973,lon:4.0744},{c:"11",n:"Aude",city:"Carcassonne",lat:43.2121,lon:2.3536},{c:"12",n:"Aveyron",city:"Rodez",lat:44.3503,lon:2.575},{c:"13",n:"Bouches-du-Rhône",city:"Marseille",lat:43.2965,lon:5.3698},{c:"14",n:"Calvados",city:"Caen",lat:49.1829,lon:-.3707},{c:"15",n:"Cantal",city:"Aurillac",lat:44.9261,lon:2.4441},{c:"16",n:"Charente",city:"Angoulême",lat:45.6503,lon:.1606},{c:"17",n:"Charente-Maritime",city:"La Rochelle",lat:46.1603,lon:-1.1511},{c:"18",n:"Cher",city:"Bourges",lat:47.0833,lon:2.4},{c:"19",n:"Corrèze",city:"Tulle",lat:45.2667,lon:1.7667},{c:"21",n:"Côte-d'Or",city:"Dijon",lat:47.322,lon:5.0415},{c:"22",n:"Côtes-d'Armor",city:"Saint-Brieuc",lat:48.5141,lon:-2.7603},{c:"23",n:"Creuse",city:"Guéret",lat:46.1727,lon:1.874},{c:"24",n:"Dordogne",city:"Périgueux",lat:45.1846,lon:.7214},{c:"25",n:"Doubs",city:"Besançon",lat:47.2378,lon:6.0241},{c:"26",n:"Drôme",city:"Valence",lat:44.9334,lon:4.8924},{c:"27",n:"Eure",city:"Évreux",lat:49.0241,lon:1.1508},{c:"28",n:"Eure-et-Loir",city:"Chartres",lat:48.4565,lon:1.4893},{c:"29",n:"Finistère",city:"Quimper",lat:47.9974,lon:-4.0976},{c:"2A",n:"Corse-du-Sud",city:"Ajaccio",lat:41.9192,lon:8.7386},{c:"2B",n:"Haute-Corse",city:"Bastia",lat:42.6973,lon:9.4509},{c:"30",n:"Gard",city:"Nîmes",lat:43.8367,lon:4.3601},{c:"31",n:"Haute-Garonne",city:"Toulouse",lat:43.6047,lon:1.4442},{c:"32",n:"Gers",city:"Auch",lat:43.6461,lon:.5863},{c:"33",n:"Gironde",city:"Bordeaux",lat:44.8378,lon:-.5792},{c:"34",n:"Hérault",city:"Montpellier",lat:43.6108,lon:3.8767},{c:"35",n:"Ille-et-Vilaine",city:"Rennes",lat:48.1173,lon:-1.6778},{c:"36",n:"Indre",city:"Châteauroux",lat:46.8105,lon:1.6913},{c:"37",n:"Indre-et-Loire",city:"Tours",lat:47.3941,lon:.6848},{c:"38",n:"Isère",city:"Grenoble",lat:45.1885,lon:5.7245},{c:"39",n:"Jura",city:"Lons-le-Saunier",lat:46.674,lon:5.5567},{c:"40",n:"Landes",city:"Mont-de-Marsan",lat:43.894,lon:-.4994},{c:"41",n:"Loir-et-Cher",city:"Blois",lat:47.5861,lon:1.331},{c:"42",n:"Loire",city:"Saint-Étienne",lat:45.4397,lon:4.3872},{c:"43",n:"Haute-Loire",city:"Le Puy-en-Velay",lat:45.0435,lon:3.8853},{c:"44",n:"Loire-Atlantique",city:"Nantes",lat:47.2184,lon:-1.5536},{c:"45",n:"Loiret",city:"Orléans",lat:47.9029,lon:1.9039},{c:"46",n:"Lot",city:"Cahors",lat:44.4475,lon:1.4403},{c:"47",n:"Lot-et-Garonne",city:"Agen",lat:44.2033,lon:.6166},{c:"48",n:"Lozère",city:"Mende",lat:44.5188,lon:3.5015},{c:"49",n:"Maine-et-Loire",city:"Angers",lat:47.4712,lon:-.5518},{c:"50",n:"Manche",city:"Saint-Lô",lat:49.1167,lon:-1.0833},{c:"51",n:"Marne",city:"Châlons-en-Champagne",lat:48.9575,lon:4.3634},{c:"52",n:"Haute-Marne",city:"Chaumont",lat:48.1113,lon:5.1391},{c:"53",n:"Mayenne",city:"Laval",lat:48.0735,lon:-.7696},{c:"54",n:"Meurthe-et-Moselle",city:"Nancy",lat:48.6921,lon:6.1844},{c:"55",n:"Meuse",city:"Bar-le-Duc",lat:48.7739,lon:5.1594},{c:"56",n:"Morbihan",city:"Vannes",lat:47.6583,lon:-2.7608},{c:"57",n:"Moselle",city:"Metz",lat:49.1193,lon:6.1757},{c:"58",n:"Nièvre",city:"Nevers",lat:46.9896,lon:3.159},{c:"59",n:"Nord",city:"Lille",lat:50.6292,lon:3.0573},{c:"60",n:"Oise",city:"Beauvais",lat:49.4295,lon:2.0807},{c:"61",n:"Orne",city:"Alençon",lat:48.432,lon:.0912},{c:"62",n:"Pas-de-Calais",city:"Arras",lat:50.2916,lon:2.7775},{c:"63",n:"Puy-de-Dôme",city:"Clermont-Ferrand",lat:45.7772,lon:3.087},{c:"64",n:"Pyrénées-Atlantiques",city:"Pau",lat:43.2951,lon:-.3708},{c:"65",n:"Hautes-Pyrénées",city:"Tarbes",lat:43.2327,lon:.0782},{c:"66",n:"Pyrénées-Orientales",city:"Perpignan",lat:42.6988,lon:2.8959},{c:"67",n:"Bas-Rhin",city:"Strasbourg",lat:48.5734,lon:7.7521},{c:"68",n:"Haut-Rhin",city:"Colmar",lat:48.0794,lon:7.3587},{c:"69",n:"Rhône",city:"Lyon",lat:45.7578,lon:4.832},{c:"70",n:"Haute-Saône",city:"Vesoul",lat:47.6363,lon:6.1534},{c:"71",n:"Saône-et-Loire",city:"Mâcon",lat:46.307,lon:4.8344},{c:"72",n:"Sarthe",city:"Le Mans",lat:47.9962,lon:.1932},{c:"73",n:"Savoie",city:"Chambéry",lat:45.5646,lon:5.9178},{c:"74",n:"Haute-Savoie",city:"Annecy",lat:45.8992,lon:6.1294},{c:"75",n:"Paris",city:"Paris",lat:48.8566,lon:2.3522},{c:"76",n:"Seine-Maritime",city:"Rouen",lat:49.4432,lon:1.0993},{c:"77",n:"Seine-et-Marne",city:"Melun",lat:48.5394,lon:2.6608},{c:"78",n:"Yvelines",city:"Versailles",lat:48.8014,lon:2.1301},{c:"79",n:"Deux-Sèvres",city:"Niort",lat:46.3239,lon:-.4612},{c:"80",n:"Somme",city:"Amiens",lat:49.895,lon:2.3022},{c:"81",n:"Tarn",city:"Albi",lat:43.9287,lon:2.1489},{c:"82",n:"Tarn-et-Garonne",city:"Montauban",lat:44.0176,lon:1.3547},{c:"83",n:"Var",city:"Toulon",lat:43.1242,lon:5.928},{c:"84",n:"Vaucluse",city:"Avignon",lat:43.9493,lon:4.8055},{c:"85",n:"Vendée",city:"La Roche-sur-Yon",lat:46.6706,lon:-1.4267},{c:"86",n:"Vienne",city:"Poitiers",lat:46.5802,lon:.3404},{c:"87",n:"Haute-Vienne",city:"Limoges",lat:45.8315,lon:1.2578},{c:"88",n:"Vosges",city:"Épinal",lat:48.1725,lon:6.4498},{c:"89",n:"Yonne",city:"Auxerre",lat:47.7979,lon:3.5714},{c:"90",n:"Territoire de Belfort",city:"Belfort",lat:47.6397,lon:6.8628},{c:"91",n:"Essonne",city:"Évry",lat:48.6244,lon:2.4408},{c:"92",n:"Hauts-de-Seine",city:"Nanterre",lat:48.8924,lon:2.2071},{c:"93",n:"Seine-Saint-Denis",city:"Bobigny",lat:48.9065,lon:2.4404},{c:"94",n:"Val-de-Marne",city:"Créteil",lat:48.7905,lon:2.4559},{c:"95",n:"Val-d'Oise",city:"Pontoise",lat:49.0501,lon:2.1007},{c:"971",n:"Guadeloupe",city:"Basse-Terre",lat:15.9972,lon:-61.7311},{c:"972",n:"Martinique",city:"Fort-de-France",lat:14.616,lon:-61.059},{c:"973",n:"Guyane",city:"Cayenne",lat:4.9372,lon:-52.326},{c:"974",n:"La Réunion",city:"Saint-Denis",lat:-20.8789,lon:55.4481},{c:"976",n:"Mayotte",city:"Mamoudzou",lat:-12.7809,lon:45.2281}];

const FC={Gazole:{l:"Gazole",c:"#ffc20e",f:"gazole_prix",m:"gazole_maj"},SP95:{l:"SP95",c:"#009d3e",f:"sp95_prix",m:"sp95_maj"},SP98:{l:"SP98",c:"#d61e3e",f:"sp98_prix",m:"sp98_maj"},E10:{l:"SP95-E10",c:"#009d3e",f:"e10_prix",m:"e10_maj"},E85:{l:"E85",c:"#e6a800",f:"e85_prix",m:"e85_maj"},GPLc:{l:"GPLc",c:"#00a3e0",f:"gplc_prix",m:"gplc_maj"}};FC["EV"]={l:"⚡ Électrique",c:"#06b6d4",isEV:true};
const FK=Object.keys(FC);
const GL="https://www.google.com/s2/favicons?sz=32&domain=";
const BR=[
  {k:["leclerc","e.leclerc"],n:"E.Leclerc",bg:"#1e3a8a",fg:"#93c5fd",i:"🛒",logo:GL+"e.leclerc"},
  {k:["carrefour market","carrefour contact","carrefour express","carrefour"],n:"Carrefour",bg:"#1e40af",fg:"#93c5fd",i:"🛒",logo:GL+"carrefour.fr"},
  {k:["intermarche","intermarch","intermarché"],n:"Intermarché",bg:"#9f1239",fg:"#fda4af",i:"🛒",logo:GL+"intermarche.com"},
  {k:["super u","systeme u","système u","hyper u","u express"],n:"Système U",bg:"#b91c1c",fg:"#fecaca",i:"🛒",logo:GL+"magasins-u.com"},
  {k:["auchan"],n:"Auchan",bg:"#166534",fg:"#86efac",i:"🛒",logo:GL+"auchan.fr"},
  {k:["geant casino","géant casino","geant"],n:"Géant Casino",bg:"#166534",fg:"#86efac",i:"🛒",logo:GL+"casino.fr"},
  {k:["casino"],n:"Casino",bg:"#166534",fg:"#86efac",i:"🛒",logo:GL+"casino.fr"},
  {k:["cora"],n:"Cora",bg:"#9a3412",fg:"#fed7aa",i:"🛒",logo:GL+"cora.fr"},
  {k:["lidl"],n:"Lidl",bg:"#1e40af",fg:"#93c5fd",i:"🛒",logo:GL+"lidl.fr"},
  {k:["netto"],n:"Netto",bg:"#854d0e",fg:"#fde68a",i:"🛒",logo:GL+"netto.fr"},
  {k:["aldi"],n:"Aldi",bg:"#1e40af",fg:"#93c5fd",i:"🛒",logo:GL+"aldi.fr"},
  {k:["totalenergies","total access","relais total","relais des"],n:"TotalEnergies",bg:"#991b1b",fg:"#fecaca",i:"🔴",logo:GL+"totalenergies.com"},
  {k:["total "],n:"Total",bg:"#991b1b",fg:"#fecaca",i:"🔴",logo:GL+"totalenergies.com"},
  {k:["esso"],n:"Esso",bg:"#1e3a8a",fg:"#93c5fd",i:"🔵",logo:GL+"esso.fr"},
  {k:["bp ","bp-"],n:"BP",bg:"#166534",fg:"#86efac",i:"🟢",logo:GL+"bp.com"},
  {k:["shell"],n:"Shell",bg:"#854d0e",fg:"#fde68a",i:"🟡",logo:GL+"shell.fr"},
  {k:["avia"],n:"Avia",bg:"#1e3a8a",fg:"#bfdbfe",i:"🔷",logo:GL+"avia.fr"},
  {k:["dyneff"],n:"Dyneff",bg:"#9a3412",fg:"#fed7aa",i:"🟠",logo:GL+"dyneff.com"},
  {k:["vito"],n:"Vito",bg:"#166534",fg:"#86efac",i:"🟢",logo:GL+"vito.fr"},
  {k:["agip","eni "],n:"Agip/Eni",bg:"#854d0e",fg:"#fde68a",i:"🟡",logo:GL+"eni.com"},
  {k:["elan"],n:"Elan",bg:"#4c1d95",fg:"#c4b5fd",i:"🟣",logo:GL+"elan.fr"}
];

// UTILS
function hav(a,b,c,d){const R=6371,x=(c-a)*Math.PI/180,y=(d-b)*Math.PI/180;const z=Math.sin(x/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(y/2)**2;return R*2*Math.atan2(Math.sqrt(z),Math.sqrt(1-z));}
// fetch avec timeout via Promise.race (pas d'AbortSignal = pas d'erreur clone)
function fetchT(url,ms){return Promise.race([fetch(url).catch(e=>{throw e;}),new Promise((_,rej)=>setTimeout(()=>rej(new Error("Timeout")),ms))]);}
function fetchTJ(url,ms){return fetchT(url,ms).then(r=>{if(!r.ok)throw new Error("HTTP "+r.status);return r.json();});}

const OVERPASS_SERVERS=[
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter"
];

async function fetchOverpass(query,ms){
  ms=ms||12000;
  const errors=[];
  // Essai en parallèle — Promise.any si dispo sinon fallback séquentiel
  try{
    if(typeof Promise.any==="function"){
      return await Promise.any(OVERPASS_SERVERS.map(srv=>fetchTJ(srv+"?data="+encodeURIComponent(query),ms)));
    }
  }catch(e){}
  // Fallback séquentiel
  for(const srv of OVERPASS_SERVERS){
    try{ return await fetchTJ(srv+"?data="+encodeURIComponent(query),ms); }
    catch(e){ errors.push(e.message); }
  }
  throw new Error("Serveurs indisponibles ("+errors.slice(0,2).join(", ")+")");
}function fp(p){return(p!=null&&!isNaN(p))?p.toFixed(3)+" €":"—";}
function fDate(d){if(!d)return"";const dt=new Date(d);return"Modifié le "+dt.getDate()+"/"+(dt.getMonth()<9?"0":"")+(dt.getMonth()+1)+" à "+dt.getHours()+"h"+(dt.getMinutes()<10?"0":"")+dt.getMinutes();}
function esc(s){const d=document.createElement("div");d.textContent=s;return d.innerHTML;}
function dBr(a,c,sv){const t=(a+" "+c+" "+sv).toLowerCase();for(const b of BR)for(const k of b.k)if(t.includes(k))return b;return null;}
function bh(b){if(!b)return'';const li=b.logo?'<img src="'+b.logo+'" width="16" height="16" style="border-radius:3px;vertical-align:middle;margin-right:4px;object-fit:contain" onerror="this.style.display=\'none\'" loading="lazy">':b.i+' ';return'<span class="brand-badge" style="background:'+b.bg+';color:'+b.fg+'">'+li+esc(b.n)+'</span>';}
function detectPay(svc){const t=(Array.isArray(svc)?svc.join(" "):(svc||"")).toLowerCase();let cb=false,cash=false;if(t.includes("carte bancaire")||t.includes("cb"))cb=true;if(t.includes("espèces")||t.includes("especes")||t.includes("liquide"))cash=true;if(!cb&&!cash)cb=true;return{cb,cash};}
function payHTML(p){let h='';if(p.cb)h+='<span class="info-tag info-tag-cb">💳 CB</span>';if(p.cash)h+='<span class="info-tag info-tag-cash">💶 Espèces</span>';return h;}
const gS='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
const wS='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>';

// STATE
let cLat=null,cLon=null,cName="",cFuel="Gazole",resStations=[],resSort="price";
let fLat=null,fLon=null,fName="",fStations=[];
let realGpsLat=null,realGpsLon=null,gpsAsked=false;

function showScreen(id){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));const sc=document.getElementById(id);if(sc)sc.classList.add("active");window.scrollTo(0,0);const fab=document.getElementById("chat-fab");const cp=document.getElementById("chat-panel");if(id==="screen-full"){if(fab)fab.classList.add("visible");resetGpsBannerFull();}else{if(fab)fab.classList.remove("visible");if(cp)cp.classList.remove("open");}}

// Bannière GPS screen-full
function resetGpsBannerFull(){
  const b=document.getElementById("gps-banner-full");
  const ok=document.getElementById("gps-ok-full");
  const warn=document.getElementById("gps-warn-full");
  if(realGpsLat){b.style.display="none";warn.style.display="none";ok.style.display="flex";}
  else if(gpsAsked){b.style.display="none";ok.style.display="none";warn.style.display="block";}
  else{b.style.display="block";ok.style.display="none";warn.style.display="none";}
}
document.getElementById("gps-precise-btn-full").onclick=function(){
  const btn=this;
  btn.disabled=true;btn.textContent="Localisation...";
  if(!navigator.geolocation){
    document.getElementById("gps-banner-full").style.display="none";
    document.getElementById("gps-warn-full").style.display="block";
    btn.textContent="Localiser";btn.disabled=false;return;
  }
  function onSuccess(pos){
    realGpsLat=pos.coords.latitude;realGpsLon=pos.coords.longitude;gpsAsked=true;
    document.getElementById("gps-banner-full").style.display="none";
    document.getElementById("gps-warn-full").style.display="none";
    document.getElementById("gps-ok-full").style.display="flex";
    // Recalculer distances et re-render
    fStations.forEach(s=>{s.dist=hav(realGpsLat,realGpsLon,s.lat,s.lon);});
    renderFull();
  }
  function onError(err){
    if(err.code===3){
      navigator.geolocation.getCurrentPosition(onSuccess,onFail,{enableHighAccuracy:false,timeout:8000,maximumAge:60000});
    }else onFail();
  }
  function onFail(){gpsAsked=true;document.getElementById("gps-banner-full").style.display="none";document.getElementById("gps-warn-full").style.display="block";btn.textContent="Réessayer";btn.disabled=false;}
  navigator.geolocation.getCurrentPosition(onSuccess,onError,{enableHighAccuracy:true,timeout:15000,maximumAge:0});
};
function checkReady(){document.getElementById("go-btn").disabled=!(cLat&&cLon&&cFuel);}
window.wolfSetLocation=function(lat,lon,name){cLat=lat;cLon=lon;cName=name;checkReady();};

// FUEL GRID
const fg=document.getElementById("fg");FK.forEach(k=>{const c=FC[k];const b=document.createElement("button");b.className="fb"+(k===cFuel?" selected":"");b.style.setProperty("--fc",c.c);b.innerHTML='<div class="fb-d" style="background:'+c.c+'"></div><div class="fb-n">'+c.l+'</div>';b.onclick=()=>{
  const prev=cFuel; cFuel=k;
  // Si on quitte le mode EV, vider les données EV pour forcer un refetch
  if(prev==="EV"&&k!=="EV"){evStations=[];evFetchToken++;}
  document.querySelectorAll(".fb").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");checkReady();
};fg.appendChild(b);});
const ffFuel=document.getElementById("ff-fuel");FK.forEach(k=>{const o=document.createElement("option");o.value=k;o.textContent=FC[k].l;ffFuel.appendChild(o);});

// DEPT LIST
const dl=document.getElementById("dl");
function rD(f=""){const fi=f.toLowerCase();dl.innerHTML=DEPTS.filter(d=>(d.c+" "+d.n+" "+d.city).toLowerCase().includes(fi)).map(d=>'<div class="di" data-c="'+d.c+'">'+esc(d.c+" — "+d.n)+' <span style="color:#64748b;font-size:11px">('+esc(d.city)+')</span></div>').join("");
dl.querySelectorAll(".di").forEach(el=>{el.onclick=()=>{const dept=DEPTS.find(d=>d.c===el.dataset.c);if(!dept)return;cLat=dept.lat;cLon=dept.lon;cName=dept.city;document.getElementById("dw").classList.remove("show");document.getElementById("ds").value="";const st=document.getElementById("dept-status");st.textContent="✅ "+dept.city+" ("+dept.n+")";st.className="loc-status show";checkReady();};});}
rD();document.getElementById("ds").addEventListener("input",e=>rD(e.target.value));

// GEO
document.getElementById("btn-geo").onclick=()=>{
  document.getElementById("btn-geo").classList.add("selected");
  document.getElementById("btn-dept").classList.remove("selected");
  document.getElementById("dw").classList.remove("show");
  document.getElementById("dept-status").classList.remove("show");
  const st=document.getElementById("geo-status");
  st.textContent="📡 Localisation en cours...";
  st.className="loc-status show";
  if(!navigator.geolocation){
    st.textContent="❌ GPS non disponible sur cet appareil";
    st.classList.add("error");
    return;
  }
  function onSuccess(pos){
    cLat=pos.coords.latitude;cLon=pos.coords.longitude;
    realGpsLat=cLat;realGpsLon=cLon;gpsAsked=true;
    st.textContent="✅ Position trouvée !";
    fetch("https://api-adresse.data.gouv.fr/reverse/?lat="+cLat+"&lon="+cLon)
      .then(r=>r.json())
      .then(d=>{
        cName=(d.features&&d.features.length)?d.features[0].properties.city||"Ma position":"Ma position";
        st.textContent="✅ "+cName;checkReady();
      }).catch(()=>{cName="Ma position";checkReady();});
  }
  function onError(err){
    if(err.code===3){
      // Timeout GPS précis → on retente en basse précision (réseau/IP), beaucoup plus rapide
      st.textContent="📡 GPS lent, tentative réseau...";
      navigator.geolocation.getCurrentPosition(onSuccess,onFinalError,
        {enableHighAccuracy:false,timeout:8000,maximumAge:60000});
    }else onFinalError(err);
  }
  function onFinalError(err){
    st.classList.add("error");
    if(err.code===1)st.textContent="❌ Permission refusée — choisissez un département";
    else if(err.code===2)st.textContent="❌ Signal GPS absent — choisissez un département";
    else st.textContent="❌ Localisation impossible — choisissez un département";
  }
  // 1er essai : GPS précis, 15s
  navigator.geolocation.getCurrentPosition(onSuccess,onError,
    {enableHighAccuracy:true,timeout:15000,maximumAge:0});
};
document.getElementById("btn-dept").onclick=()=>{document.getElementById("btn-dept").classList.add("selected");document.getElementById("btn-geo").classList.remove("selected");document.getElementById("geo-status").classList.remove("show");document.getElementById("dw").classList.add("show");};

// GO + BACK
document.getElementById("go-btn").onclick=()=>{if(!cLat||!cLon||!cFuel)return;window.location.href='/resultat?lat='+cLat+'&lon='+cLon+'&name='+encodeURIComponent(cName)+'&fuel='+encodeURIComponent(cFuel);};
document.getElementById("back-btn").onclick=()=>showScreen("screen-welcome");

// GPS PRECISION
document.getElementById("gps-precise-btn").onclick=function(){
  const btn=this;
  btn.disabled=true;btn.textContent="Localisation...";
  if(!navigator.geolocation){showGpsWarn();btn.textContent="Localiser";btn.disabled=false;return;}
  function onSuccess(pos){
    realGpsLat=pos.coords.latitude;realGpsLon=pos.coords.longitude;gpsAsked=true;
    resStations.forEach(s=>{s.dist=hav(realGpsLat,realGpsLon,s.lat,s.lon);});
    document.getElementById("gps-banner").style.display="none";
    document.getElementById("gps-warn").style.display="none";
    document.getElementById("gps-ok").style.display="flex";
    renderResults();
  }
  function onError(err){
    if(err.code===3){
      // Fallback réseau
      navigator.geolocation.getCurrentPosition(onSuccess,onFail,
        {enableHighAccuracy:false,timeout:8000,maximumAge:60000});
    }else onFail(err);
  }
  function onFail(){gpsAsked=true;showGpsWarn();btn.textContent="Réessayer";btn.disabled=false;}
  navigator.geolocation.getCurrentPosition(onSuccess,onError,
    {enableHighAccuracy:true,timeout:15000,maximumAge:0});
};
function showGpsWarn(){document.getElementById("gps-banner").style.display="none";document.getElementById("gps-ok").style.display="none";document.getElementById("gps-warn").style.display="block";}
function resetGpsBanner(){if(realGpsLat){document.getElementById("gps-banner").style.display="none";document.getElementById("gps-warn").style.display="none";document.getElementById("gps-ok").style.display="flex";}else if(gpsAsked){showGpsWarn();}else{document.getElementById("gps-banner").style.display="block";document.getElementById("gps-ok").style.display="none";document.getElementById("gps-warn").style.display="none";}}

// SORT TABS
document.querySelectorAll(".sort-tab").forEach(t=>{t.onclick=()=>{resSort=t.dataset.sort;document.querySelectorAll(".sort-tab").forEach(x=>x.classList.remove("active"));t.classList.add("active");if(cFuel==="EV"){evStations.sort((a,b)=>a.dist-b.dist);renderEVResults();}else{renderResults();}};});

// LOAD RESULTS
// ── Réinitialisation propre de l'écran résultats entre les modes ──
function resetResultsScreen(){
  document.getElementById("res-list").innerHTML="";
  document.getElementById("res-count").textContent="";
  document.getElementById("res-loading").classList.remove("show");
  document.getElementById("res-error").classList.remove("show");
  document.getElementById("res-empty").classList.remove("show");
  document.getElementById("ev-speed-filter").style.display="none";
  // Remettre le tri à "distance" (neutre pour les deux modes)
  document.querySelectorAll(".sort-tab").forEach(t=>t.classList.remove("active"));
  const distTab=document.querySelector('.sort-tab[data-sort="distance"]');
  if(distTab)distTab.classList.add("active");
  resSort="distance";
}

async function loadResults(){
  resetResultsScreen();
  if(cFuel==="EV"){loadEVResults();return;}
  document.getElementById("res-loading-msg").textContent="🐺 Le loup cherche les meilleurs prix...";
  resSort="price";
  // Remettre tri "prix" actif pour carburant
  document.querySelectorAll(".sort-tab").forEach(t=>t.classList.remove("active"));
  const priceTab=document.querySelector('.sort-tab[data-sort="price"]');
  if(priceTab)priceTab.classList.add("active");const fc=FC[cFuel];const distFrom=realGpsLat?"votre position GPS":cName;document.getElementById("rh-title").textContent=fc.l+" — "+cName;document.getElementById("rh-sub").textContent="Rayon 20 km · distances depuis "+distFrom;document.getElementById("rh-badge").textContent=fc.l;document.getElementById("rh-badge").style.cssText="background:"+fc.c+"22;color:"+fc.c;document.getElementById("res-loading").classList.add("show");document.getElementById("res-error").classList.remove("show");document.getElementById("res-empty").classList.remove("show");document.getElementById("res-list").innerHTML="";document.getElementById("res-count").textContent="";resetGpsBanner();const fields="id,nom,adresse,ville,cp,geom,horaires_automate_24_24,services_service,carburants_disponibles,"+fc.f+","+fc.m;const where="within_distance(geom, geom'POINT("+cLon+" "+cLat+")', 20km)";const url="https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?select="+encodeURIComponent(fields)+"&where="+encodeURIComponent(where)+"&limit=50";try{const res=await fetch(url);if(!res.ok)throw new Error("Erreur ("+res.status+")");const data=await res.json();const dLat=realGpsLat||cLat,dLon=realGpsLon||cLon;resStations=(data.results||[]).map(r=>{const rl=r.geom?r.geom.lat:0,rn=r.geom?r.geom.lon:0;const svc=Array.isArray(r.services_service)?r.services_service.join(" "):(r.services_service||"");const price=r[fc.f]!=null?parseFloat(r[fc.f]):null;const dispo=Array.isArray(r.carburants_disponibles)?r.carburants_disponibles:[];const fuelInDispo=dispo.some(x=>x&&(x===cFuel||x===fc.l||x.toLowerCase().includes(cFuel.toLowerCase())));const hasPenurie=fuelInDispo&&price==null;return{id:r.id,addr:r.adresse||"",city:r.ville||"",cp:r.cp||"",lat:rl,lon:rn,dist:hav(dLat,dLon,rl,rn),is24h:r.horaires_automate_24_24==="Oui",brand:dBr((r.nom||"")+" "+(r.adresse||""),r.ville||"",svc),price,updated:r[fc.m]||null,pay:detectPay(r.services_service),hasPenurie};});if(!resStations.length){document.getElementById("res-empty").classList.add("show");return;}renderResults();}catch(e){document.getElementById("res-error-msg").textContent="❌ "+e.message;document.getElementById("res-error").classList.add("show");}finally{document.getElementById("res-loading").classList.remove("show");}}

function renderResults(){const fc=FC[cFuel];let withPrice=resStations.filter(s=>s.price!=null&&!s.hasPenurie);let penuries=resStations.filter(s=>s.hasPenurie);if(resSort==="price")withPrice.sort((a,b)=>a.price-b.price);else withPrice.sort((a,b)=>a.dist-b.dist);penuries.sort((a,b)=>a.dist-b.dist);const best=withPrice.length?withPrice.reduce((a,b)=>a.price<b.price?a:b):null;document.getElementById("res-count").textContent=withPrice.length+" station"+(withPrice.length>1?"s":"")+" disponible"+(withPrice.length>1?"s":"")+(penuries.length?" · "+penuries.length+" en pénurie":"");let html=withPrice.map((s,i)=>{const isBest=best&&s.price===best.price;const gU="https://www.google.com/maps/dir/?api=1&destination="+s.lat+","+s.lon;const wU="https://waze.com/ul?ll="+s.lat+"%2C"+s.lon+"&navigate=yes";return'<div class="card'+(isBest?' best':'')+'" style="animation-delay:'+(i*30)+'ms"><div class="card-top"><div class="card-left"><div class="rank-col"><div class="rank">'+(i+1)+'</div>'+(s.is24h?'<span class="tag-24">24h</span>':'')+'</div><div style="min-width:0"><div class="brand-row">'+bh(s.brand)+(isBest?'<span class="tag-best">🏆</span>':'')+'</div><div class="station-name">'+esc(s.city||"Station")+'</div><div class="station-addr">'+esc(s.addr+(s.addr?", ":"")+s.cp+" "+s.city)+'</div></div></div><div class="dist-badge">'+s.dist.toFixed(1)+' km</div></div><div class="price-highlight" style="color:'+fc.c+'">'+fp(s.price)+'</div><div class="price-date">'+fDate(s.updated)+'</div><div class="info-tags">'+payHTML(s.pay)+'</div><div class="nav-btns"><a class="nav-btn nav-btn-gmaps" href="'+gU+'" target="_blank" rel="noopener noreferrer">'+gS+' Google Maps</a><a class="nav-btn nav-btn-waze" href="'+wU+'" target="_blank" rel="noopener noreferrer">'+wS+' Waze</a></div></div>';}).join("");if(penuries.length){html+='<div style="margin:16px 0 8px;font-size:13px;font-weight:800;color:#f87171;text-transform:uppercase;letter-spacing:.06em">⚠️ Stations en pénurie de '+fc.l+'</div>';html+=penuries.map((s,i)=>'<div class="card penurie" style="animation-delay:'+(i*30)+'ms"><div class="card-top"><div class="card-left"><div class="rank-col"><div class="rank" style="background:rgba(239,68,68,.15);color:#f87171">⚠️</div></div><div style="min-width:0"><div class="brand-row">'+bh(s.brand)+'<span class="tag-penurie">PÉNURIE</span></div><div class="station-name">'+esc(s.city||"Station")+'</div><div class="station-addr">'+esc(s.addr+(s.addr?", ":"")+s.cp+" "+s.city)+'</div></div></div><div class="dist-badge">'+s.dist.toFixed(1)+' km</div></div><div class="info-tags"><span class="info-tag info-tag-penurie">⚠️ '+fc.l+' indisponible</span>'+payHTML(s.pay)+'</div></div>').join("");}document.getElementById("res-list").innerHTML=html;}

// ==================== ⚡ BORNES ÉLECTRIQUES — ODRE (Enedis/RTE) ====================
// Source : odre.opendatasoft.com — dataset bornes-irve — IRVE officiel France
// Même moteur ODS que data.economie.gouv.fr → CORS ouvert, jamais de timeout
let evSpeedFilter="all";
document.querySelectorAll(".ev-sf").forEach(b=>{
  b.onclick=()=>{
    evSpeedFilter=b.dataset.speed;
    document.querySelectorAll(".ev-sf").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    renderEVResults();
  };
});
// Token anti-doublon : seul le dernier appel EV peut afficher ses résultats
let evFetchToken=0;
let evStations=[];

function getEVColor(label){
  if(!label)return"#64748b";
  const l=label.toLowerCase();
  if(l.includes("ccs")||l.includes("combo"))return"#8b5cf6";
  if(l.includes("chademo"))return"#f59e0b";
  if(l.includes("tesla"))return"#ef4444";
  if(l.includes("type 2")||l.includes("type2"))return"#06b6d4";
  if(l.includes("type 1")||l.includes("type1"))return"#22d3ee";
  return"#64748b";
}

function parseEVSockets(r){
  // L'API ODS remplace les ":" par "_" dans les noms de champs
  const MAP={
    "socket_type2":"Type 2","socket_type2_combo":"CCS Combo 2",
    "socket_chademo":"CHAdeMO","socket_type1":"Type 1 (J1772)",
    "socket_type1_combo":"CCS Combo 1","socket_tesla_supercharger":"Tesla Supercharger",
    "socket_tesla_destination":"Tesla Destination","socket_schuko":"Schuko"
  };
  const prises=[];
  for(const[field,label]of Object.entries(MAP)){
    const val=r[field];
    if(val&&val!=="0"&&val!==false&&val!=="false"&&val!=="no"){
      const count=parseInt(val)||1;
      // Cherche la puissance dans socket_type2_output etc.
      const outField=field+"_output";
      let kw=null;
      if(r[outField]){const m=String(r[outField]).match(/([\d.]+)\s*kW/i);if(m)kw=parseFloat(m[1]);}
      prises.push({label,count:count>10?1:count,kw});
    }
  }
  // Fallback : lire maxpower direct
  if(!prises.length&&(r.maxpower||r.charging_maxpower)){
    const pw=r.maxpower||r.charging_maxpower;
    const m=String(pw).match(/([\d.]+)/);
    if(m)prises.push({label:"Borne",count:1,kw:parseFloat(m[1])});
  }
  return prises;
}

// Fetch IRVE officiel (API REST française — beaucoup plus rapide qu'Overpass)
async function fetchIRVE(lat,lon){
  const url="https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/bornes-irve/records?select=id_pdc_itinerance,nom_operateur,ad_station,commune,coordonneesxy,puissance_nominale,prise_type_ef,prise_type_2,prise_type_combo_ccs,prise_type_chademo,prise_type_autre,nbre_pdc,gratuit,acces_recharge&where=within_distance(coordonneesxy,geom'POINT("+lon+" "+lat+")',20km)&limit=150&order_by=distance(coordonneesxy,geom'POINT("+lon+" "+lat+")')";
  const d=await fetchTJ(url,7000);
  const rows=d.results||[];
  if(!rows.length)throw new Error("Aucun résultat IRVE");
  return rows.map(r=>{
    const sLat=r.coordonneesxy?.lat||0,sLon=r.coordonneesxy?.lon||0;
    const prises=[];
    if(r.prise_type_2&&r.prise_type_2!=="false")prises.push({label:"Type 2",color:"#06b6d4"});
    if(r.prise_type_combo_ccs&&r.prise_type_combo_ccs!=="false")prises.push({label:"CCS Combo",color:"#8b5cf6"});
    if(r.prise_type_chademo&&r.prise_type_chademo!=="false")prises.push({label:"CHAdeMO",color:"#f59e0b"});
    if(r.prise_type_ef&&r.prise_type_ef!=="false")prises.push({label:"Type EF",color:"#22d3ee"});
    if(!prises.length)prises.push({label:"Borne",color:"#64748b"});
    const puissance=parseFloat(r.puissance_nominale)||null;
    let speedCat="inconnu";
    if(puissance>=50)speedCat="rapide";
    else if(puissance>=22)speedCat="semi";
    else if(puissance)speedCat="lente";
    return{nom:r.nom_operateur||"Borne IRVE",addr:r.ad_station||"",city:r.commune||"",lat:sLat,lon:sLon,dist:hav(lat,lon,sLat,sLon),prises,nbrePDC:parseInt(r.nbre_pdc)||1,puissance,puissanceEstimee:false,speedCat,gratuit:r.gratuit===true||r.gratuit==="true",is24h:false,operateur:r.nom_operateur||null};
  }).filter(s=>s.dist<=20&&s.lat!==0);
}

async function loadEVResults(){
  const myToken=++evFetchToken;
  const lat=realGpsLat||cLat, lon=realGpsLon||cLon;
  const distFrom=realGpsLat?"votre position GPS":cName;
  resetResultsScreen();
  document.getElementById("rh-title").textContent="⚡ Bornes électriques — "+cName;
  document.getElementById("rh-sub").textContent="Rayon 20 km · "+distFrom;
  document.getElementById("rh-badge").textContent="⚡ Électrique";
  document.getElementById("rh-badge").style.cssText="background:#06b6d422;color:#06b6d4";
  document.getElementById("ev-speed-filter").style.display="block";
  document.getElementById("res-loading-msg").textContent="⚡ Le loup cherche les bornes de recharge...";
  evSpeedFilter="all";
  document.querySelectorAll(".ev-sf").forEach(x=>x.classList.remove("active"));
  document.querySelector('.ev-sf[data-speed="all"]').classList.add("active");
  document.getElementById("res-loading").classList.add("show");
  resetGpsBanner();

  // Calcul bounding box pour Overpass
  const R2=6371, rad2=20;
  const dlat2=rad2/R2*(180/Math.PI);
  const dlon2=rad2/(R2*Math.cos(lat*Math.PI/180))*(180/Math.PI);
  const bbox2=(lat-dlat2).toFixed(5)+","+(lon-dlon2).toFixed(5)+","+(lat+dlat2).toFixed(5)+","+(lon+dlon2).toFixed(5);
  const query2='[out:json][timeout:6];node["amenity"="charging_station"]('+bbox2+');out qt 100;';

  // Course parallèle : IRVE (rapide) vs Overpass (complet) — le premier gagne
  let evData; let sourceIRVE=false;
  try{
    const winner=await Promise.any([
      fetchIRVE(lat,lon).then(r=>({src:"irve",data:r})),
      fetchOverpass(query2,8000).then(r=>({src:"overpass",data:r}))
    ]);
    if(winner.src==="irve"){sourceIRVE=true;evStations=winner.data;evStations.sort((a,b)=>a.dist-b.dist);if(myToken!==evFetchToken)return;if(!evStations.length){document.getElementById("res-empty").classList.add("show");document.getElementById("res-loading").classList.remove("show");return;}renderEVResults();document.getElementById("res-loading").classList.remove("show");return;}
    evData=winner.data;
  }catch(e){showEVFallback(lat,lon,e.message||"Serveurs indisponibles");document.getElementById("res-loading").classList.remove("show");return;}

  {
      const rows=evData.elements||[];
      if(!rows.length){document.getElementById("res-empty").classList.add("show");document.getElementById("res-loading").classList.remove("show");return;}

      evStations=rows.map(r=>{
        // Overpass: node a lat/lon direct, way a center.lat/center.lon
        const sLat=parseFloat(r.lat||r.center?.lat||0);
        const sLon=parseFloat(r.lon||r.center?.lon||0);
        const t=r.tags||{};
        const dist=hav(lat,lon,sLat,sLon);
        // Prises
        const prises=[];
        if(t["socket:type2"]||t["socket:type2_cable"])prises.push({label:"Type 2",color:"#06b6d4"});
        if(t["socket:ccs"]||t["socket:type2_combo"])prises.push({label:"CCS Combo",color:"#8b5cf6"});
        if(t["socket:chademo"])prises.push({label:"CHAdeMO",color:"#f59e0b"});
        if(t["socket:type1"])prises.push({label:"Type 1",color:"#22d3ee"});
        if(t["socket:tesla_supercharger"]||t["socket:tesla_destination"])prises.push({label:"Tesla",color:"#ef4444"});
        if(!prises.length)prises.push({label:"Borne",color:"#64748b"});
        // Puissance — lecture de tous les champs OSM possibles
        let puissance=null;
        const pwFields=["maxpower","socket:type2:output","socket:ccs:output","socket:chademo:output",
          "socket:tesla_supercharger:output","socket:tesla_destination:output","socket:type1:output",
          "charging_station:output","capacity:electrical","power_supply:output"];
        for(const f of pwFields){if(t[f]){const m=String(t[f]).match(/([\d.]+)/);if(m){puissance=parseFloat(m[1]);break;}}}
        // Inférence depuis l'opérateur si toujours inconnu
        let puissanceEstimee=false;
        if(!puissance){
          const op=(t.operator||t.brand||"").toLowerCase();
          if(op.includes("ionity")){puissance=350;puissanceEstimee=true;}
          else if(op.includes("tesla")&&(op.includes("supercharger")||t["socket:tesla_supercharger"])){puissance=250;puissanceEstimee=true;}
          else if(op.includes("fastned")){puissance=300;puissanceEstimee=true;}
          else if(op.includes("totalenergies")||op.includes("total energies")){puissance=50;puissanceEstimee=true;}
          else if(op.includes("izivia")){puissance=22;puissanceEstimee=true;}
          else if(op.includes("freshmile")){puissance=22;puissanceEstimee=true;}
        }
        // Inférence depuis le type de prise si toujours inconnu
        if(!puissance){
          if(t["socket:tesla_supercharger"]){puissance=150;puissanceEstimee=true;}
          else if(t["socket:ccs"]){puissance=50;puissanceEstimee=true;}
          else if(t["socket:chademo"]){puissance=50;puissanceEstimee=true;}
          else if(t["socket:type2"]){puissance=22;puissanceEstimee=true;}
          else if(t["socket:type1"]){puissance=7;puissanceEstimee=true;}
        }
        let speedCat="inconnu";
        if(puissance>=50)speedCat="rapide";
        else if(puissance>=22)speedCat="semi";
        else if(puissance)speedCat="lente";
        // Nb points de charge
        const nbSockets=Object.keys(t).filter(k=>k.startsWith("socket:")&&!k.includes(":")).length;
        const nbrePDC=parseInt(t.capacity)||nbSockets||1;
        const gratuit=t.fee==="no"||t.access==="customers"?false:(t.fee==="no");
        const is24h=t.opening_hours==="24/7";
        const operateur=t.operator||t.brand||null;
        const nom=t.name||t["network"]||operateur||"Borne de recharge";
        // Adresse : plusieurs sources Overpass possibles
        const streetNum=(t["addr:housenumber"]?t["addr:housenumber"]+" ":"")+( t["addr:street"]||t["addr:place"]||"");
        const addr=t["addr:full"]||streetNum||t["loc_name"]||"";
        const city=t["addr:city"]||t["addr:municipality"]||t["addr:town"]||t["addr:village"]||"";
        return{nom,addr,city,lat:sLat,lon:sLon,dist,prises,nbrePDC,puissance,puissanceEstimee,speedCat,gratuit,is24h,operateur};
      }).filter(s=>s.dist<=20&&s.lat!==0);

      evStations.sort((a,b)=>a.dist-b.dist);
      if(myToken!==evFetchToken)return; // résultat obsolète
      if(!evStations.length){document.getElementById("res-empty").classList.add("show");document.getElementById("res-loading").classList.remove("show");return;}
      await enrichEVAddresses(evStations);
      if(myToken!==evFetchToken)return;
      renderEVResults();
  }
  document.getElementById("res-loading").classList.remove("show");
}

function showEVFallback(lat,lon,err){
  document.getElementById("res-loading").classList.remove("show");
  document.getElementById("res-list").innerHTML=
    '<div style="padding:20px;text-align:center;color:#94a3b8">'+
    '<div style="font-size:40px;margin-bottom:12px">⚡</div>'+
    '<div style="font-weight:700;color:#e2e8f0;margin-bottom:8px">Données temporairement indisponibles</div>'+
    '<div style="font-size:13px;margin-bottom:20px;color:#64748b">'+err+'</div>'+
    '<div style="font-weight:600;color:#a78bfa;margin-bottom:12px">Trouvez des bornes via :</div>'+
    '<div style="display:flex;flex-direction:column;gap:10px;max-width:300px;margin:0 auto">'+
      '<a href="https://www.google.com/maps/search/borne+recharge+electrique/@'+lat+','+lon+',13z" target="_blank" rel="noopener" '+
        'style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:#1e3a8a22;border:1px solid #1e3a8a55;border-radius:12px;color:#93c5fd;text-decoration:none;font-weight:600">'+
        '🗺️ Google Maps — Bornes proches</a>'+
      '<a href="https://www.chargemap.com/" target="_blank" rel="noopener" '+
        'style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:#06b6d422;border:1px solid #06b6d444;border-radius:12px;color:#67e8f9;text-decoration:none;font-weight:600">'+
        '⚡ ChargeMap — Carte des bornes</a>'+
      '<a href="https://www.plugshare.com/" target="_blank" rel="noopener" '+
        'style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:#16533422;border:1px solid #16533444;border-radius:12px;color:#86efac;text-decoration:none;font-weight:600">'+
        '🔌 PlugShare — Réseau mondial</a>'+
    '</div>'+
    '<button onclick="loadEVResults()" style="margin-top:20px;padding:10px 20px;background:rgba(168,85,247,.15);border:1px solid rgba(168,85,247,.4);border-radius:10px;color:#c4b5fd;font-weight:600;cursor:pointer">🔄 Réessayer</button>'+
    '</div>';
}

// Reverse geocoding batch pour les bornes sans adresse
async function enrichEVAddresses(stations){
  const toResolve=stations.filter(s=>!s.addr&&!s.city);
  if(!toResolve.length)return;
  // API adresse.gouv.fr — reverse geocoding, gratuit, sans clé
  await Promise.allSettled(toResolve.map(async s=>{
    try{
      const r=await fetchT("https://api-adresse.data.gouv.fr/reverse/?lon="+s.lon+"&lat="+s.lat,4000);
      if(!r.ok)return;
      const d=await r.json();
      const feat=d.features&&d.features[0];
      if(!feat)return;
      const p=feat.properties;
      s.addr=(p.housenumber?p.housenumber+" ":"")+( p.street||p.name||"");
      s.city=p.city||p.municipality||"";
      s.cp=p.postcode||"";
    }catch{}
  }));
}

function getEVBrand(operateur){
  if(!operateur)return null;
  const t=operateur.toLowerCase();
  const EV_BRANDS=[
    {k:["tesla"],n:"Tesla",bg:"#991b1b",fg:"#fecaca",i:"🔴"},
    {k:["totalenergies","total energies","total\b"],n:"TotalEnergies",bg:"#991b1b",fg:"#fecaca",i:"⚡"},
    {k:["izivia","sodetrel"],n:"Izivia",bg:"#1e3a8a",fg:"#93c5fd",i:"⚡"},
    {k:["engie"],n:"Engie",bg:"#1e40af",fg:"#93c5fd",i:"⚡"},
    {k:["leclerc","e.leclerc"],n:"E.Leclerc",bg:"#1e3a8a",fg:"#93c5fd",i:"🛒"},
    {k:["lidl"],n:"Lidl",bg:"#1e40af",fg:"#93c5fd",i:"🛒"},
    {k:["carrefour"],n:"Carrefour",bg:"#1e40af",fg:"#93c5fd",i:"🛒"},
    {k:["ionity"],n:"Ionity",bg:"#4c1d95",fg:"#c4b5fd",i:"⚡"},
    {k:["ev box","evbox"],n:"EVBox",bg:"#065f46",fg:"#6ee7b7",i:"⚡"},
    {k:["charge point","chargepoint"],n:"ChargePoint",bg:"#1e3a8a",fg:"#93c5fd",i:"⚡"},
    {k:["freshmile"],n:"Freshmile",bg:"#166534",fg:"#86efac",i:"⚡"},
    {k:["road"],n:"Road",bg:"#854d0e",fg:"#fde68a",i:"⚡"},
    {k:["belib"],n:"Bélib'",bg:"#1e40af",fg:"#93c5fd",i:"🅿️"},
    {k:["recharge","irve","bornes"],n:"Borne publique",bg:"#0e7490",fg:"#cffafe",i:"⚡"},
  ];
  for(const b of EV_BRANDS)for(const k of b.k)if(t.includes(k))return b;
  return{n:operateur.substring(0,20),bg:"#0e7490",fg:"#cffafe",i:"⚡"};
}

function getChargeSpeed(puissance,estimee){
  if(!puissance)return null;
  const pre=estimee?"~":"";
  if(puissance>=150)return{label:"Ultra-rapide",sublabel:pre+puissance+"kW",color:"#dc2626",bg:"#dc262615",icon:"⚡⚡⚡"};
  if(puissance>=50)return{label:"Rapide",sublabel:pre+puissance+"kW",color:"#f59e0b",bg:"#f59e0b15",icon:"⚡⚡"};
  if(puissance>=22)return{label:"Semi-rapide",sublabel:pre+puissance+"kW",color:"#06b6d4",bg:"#06b6d415",icon:"⚡"};
  if(puissance>=7)return{label:"Normale",sublabel:pre+puissance+"kW",color:"#22d3ee",bg:"#22d3ee15",icon:"🔌"};
  return{label:"Lente",sublabel:pre+puissance+"kW",color:"#94a3b8",bg:"#94a3b815",icon:"🐢"};
}

// Compatibilité voitures par type de prise
const EV_COMPAT={
  "Type 2":["Renault","Peugeot","Citroën","Volkswagen","Audi","BMW","Mercedes","Opel","Hyundai","Kia","Fiat","DS","Volvo","Ford","Nissan","Seat","Skoda","Toyota","Honda"],
  "CCS Combo":["Volkswagen","Audi","BMW","Mercedes","Hyundai","Kia","Ford","Renault","Peugeot","Opel","Volvo","Rivian","Lucid"],
  "CHAdeMO":["Nissan","Mitsubishi","Toyota","Honda","Kia (ancien)"],
  "Type 1":["Nissan (ancien)","Mitsubishi","Chevrolet","Jeep"],
  "Tesla":["Tesla (tous modèles)"],
  "Borne":["Compatible plupart des VE"],
};

function evCompatHTML(prises){
  const all=new Set();
  prises.forEach(p=>{
    const cars=EV_COMPAT[p.label]||[];
    cars.forEach(c=>all.add(c));
  });
  if(!all.size)return"";
  const list=[...all].slice(0,8);
  const more=all.size>8?'<span style="color:#64748b;font-size:11px">+'+( all.size-8)+" autres</span>":"";
  return'<div style="margin-top:8px;padding:8px 10px;background:rgba(6,182,212,0.06);border:1px solid rgba(6,182,212,0.15);border-radius:10px">'+
    '<div style="font-size:10px;font-weight:700;color:#67e8f9;margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px">🚗 Véhicules compatibles</div>'+
    '<div style="display:flex;flex-wrap:wrap;gap:4px">'+
    list.map(c=>'<span style="font-size:10px;padding:2px 7px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#cbd5e1">'+c+'</span>').join("")+
    more+'</div></div>';
}

function renderEVResults(){
  const filtered=evSpeedFilter==="all"?evStations:evStations.filter(s=>s.speedCat===evSpeedFilter);
  const totalPDC=filtered.reduce((a,s)=>a+s.nbrePDC,0);
  document.getElementById("res-count").textContent=
    filtered.length+" borne"+(filtered.length>1?"s":"")+" · "+
    totalPDC+" point"+(totalPDC>1?"s":"")+" de charge";

  if(!filtered.length){
    document.getElementById("res-list").innerHTML='<div class="empty-state"><p style="font-size:30px">⚡</p><p>Aucune borne pour ce filtre.</p></div>';
    return;
  }

  document.getElementById("res-list").innerHTML=filtered.map((s,i)=>{
    const gU="https://www.google.com/maps/dir/?api=1&destination="+s.lat+","+s.lon;
    const wU="https://waze.com/ul?ll="+s.lat+"%2C"+s.lon+"&navigate=yes";
    const brand=getEVBrand(s.operateur);
    const brandHTML=brand?'<span class="brand-badge" style="background:'+brand.bg+';color:'+brand.fg+'">'+brand.i+' '+esc(brand.n)+'</span>':'';
    const speed=getChargeSpeed(s.puissance,s.puissanceEstimee);

    // Badges prises
    const prisesHTML=s.prises.map(p=>
      '<span class="info-tag" style="background:'+p.color+'1a;color:'+p.color+';border:1px solid '+p.color+'44">'+p.label+'</span>'
    ).join("");

    // Vitesse de charge badge (comme prix chez carburant)
    const speedHTML=speed?
      '<div style="display:inline-flex;align-items:center;gap:5px;padding:6px 12px;background:'+speed.bg+';border:1px solid '+speed.color+'33;border-radius:10px;margin-bottom:6px">'+
        '<span style="font-size:14px">'+speed.icon+'</span>'+
        '<div><div style="font-weight:800;color:'+speed.color+';font-size:13px">'+speed.label+'</div>'+
        '<div style="font-size:11px;color:'+speed.color+'99">'+speed.sublabel+'</div></div>'+
      '</div>':
      '<div style="display:inline-flex;align-items:center;gap:5px;padding:6px 12px;background:rgba(100,116,139,0.1);border:1px solid rgba(100,116,139,0.2);border-radius:10px;margin-bottom:6px">'+
        '<span>🔌</span><div style="font-weight:700;color:#94a3b8;font-size:13px">Puissance inconnue</div></div>';

    const tags=[];
    if(s.gratuit)tags.push('<span class="info-tag info-tag-cb">🆓 Gratuit</span>');
    if(s.nbrePDC>1)tags.push('<span class="info-tag" style="background:#06b6d410;color:#67e8f9;border:1px solid #06b6d430">🔌 '+s.nbrePDC+' pts de charge</span>');
    if(s.is24h)tags.push('<span class="tag-24">24h/7j</span>');

    const addrLine=[s.addr,(s.cp?s.cp+" ":"")+s.city].filter(Boolean).join(", ")||("📍 "+s.lat.toFixed(4)+", "+s.lon.toFixed(4));
    const compatHTML=evCompatHTML(s.prises);

    return'<div class="card" style="animation-delay:'+(i*25)+'ms">'+
      '<div class="card-top">'+
        '<div class="card-left">'+
          '<div class="rank">'+(i+1)+'</div>'+
          '<div style="min-width:0">'+
            '<div class="brand-row">'+brandHTML+'</div>'+
            '<div class="station-name">'+esc(s.nom)+'</div>'+
            (addrLine?'<div class="station-addr">'+esc(addrLine)+'</div>':'')+
          '</div>'+
        '</div>'+
        '<div class="dist-badge">'+s.dist.toFixed(1)+' km</div>'+
      '</div>'+
      '<div style="margin:10px 0 4px">'+speedHTML+'</div>'+
      '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px">'+prisesHTML+'</div>'+
      compatHTML+
      '<div class="info-tags" style="margin-top:8px">'+tags.join("")+'</div>'+
      '<div class="nav-btns">'+
        '<a class="nav-btn nav-btn-gmaps" href="'+gU+'" target="_blank" rel="noopener noreferrer">'+gS+' Google Maps</a>'+
        '<a class="nav-btn nav-btn-waze" href="'+wU+'" target="_blank" rel="noopener noreferrer">'+wS+' Waze</a>'+
      '</div>'+
    '</div>';
  }).join("");
}

// OTHER SEARCH
document.getElementById("other-btn").onclick=()=>{
  fLat=cLat;fLon=cLon;fName=cName;
  const distInfo=realGpsLat?"distances GPS précises":"distances depuis "+cName;
  document.getElementById("f-sub").textContent=cName+" · "+distInfo;
  document.getElementById("f-input").value=cName;
  document.getElementById("ff-fuel").value=cFuel;
  showScreen("screen-full");
  // Si déjà en mode EV et données dispo → réutiliser directement
  if(cFuel==="EV"&&evStations.length){
    renderFullEV(evStations);
  } else {
    fetchFull();
  }
};
document.getElementById("back-res-btn").onclick=()=>showScreen("screen-results");

// FULL SCREEN SEARCH
let fdb=null;const fInp=document.getElementById("f-input"),fSug=document.getElementById("f-sugg");
fInp.addEventListener("input",()=>{clearTimeout(fdb);fdb=setTimeout(()=>fGeo(fInp.value),300);});
document.addEventListener("click",e=>{if(!e.target.closest(".ss-box"))fSug.classList.remove("show");});
async function fGeo(q){if(!q||q.length<2){fSug.classList.remove("show");return;}try{const r=await fetch("https://api-adresse.data.gouv.fr/search/?q="+encodeURIComponent(q)+"&limit=6&type=municipality");const d=await r.json();const res=(d.features||[]).map(f=>({name:f.properties.label,ctx:(f.properties.context||"").split(",").slice(0,2).join(" ·").trim(),lat:f.geometry.coordinates[1],lon:f.geometry.coordinates[0]}));if(!res.length){fSug.classList.remove("show");return;}fSug.innerHTML=res.map((r,i)=>'<div class="ss-item" data-i="'+i+'"><div>📍 '+esc(r.name)+'</div>'+(r.ctx?'<div style="font-size:11px;color:#64748b;margin-top:2px">'+esc(r.ctx)+'</div>':'')+' </div>').join("");fSug.classList.add("show");fSug.querySelectorAll(".ss-item").forEach((el,i)=>{el.onclick=()=>{fLat=res[i].lat;fLon=res[i].lon;fName=res[i].name;fInp.value=res[i].name;fSug.classList.remove("show");const distInfo=realGpsLat?"distances GPS précises":"distances depuis "+cName;document.getElementById("f-sub").textContent=res[i].name+" · "+distInfo;fetchFull();};});}catch{fSug.classList.remove("show");}}

async function fetchFull(){
  if(!fLat)return;
  const ff=document.getElementById("ff-fuel").value;
  if(ff==="EV"){fetchFullEV();return;}
  const rad=document.getElementById("ff-rad").value;document.getElementById("f-loading").classList.add("show");document.getElementById("f-error").classList.remove("show");document.getElementById("f-empty").classList.remove("show");document.getElementById("full-list").innerHTML="";const fields="id,nom,adresse,ville,cp,geom,horaires_automate_24_24,services_service,gazole_prix,gazole_maj,sp95_prix,sp95_maj,sp98_prix,sp98_maj,e10_prix,e10_maj,e85_prix,e85_maj,gplc_prix,gplc_maj";const where="within_distance(geom, geom'POINT("+fLon+" "+fLat+")', "+rad+"km)";const url="https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?select="+encodeURIComponent(fields)+"&where="+encodeURIComponent(where)+"&limit=80";try{const res=await fetch(url);if(!res.ok)throw new Error("Erreur ("+res.status+")");const data=await res.json();fStations=(data.results||[]).map(r=>{const rl=r.geom?r.geom.lat:0,rn=r.geom?r.geom.lon:0;const prices=[];for(const[k,c]of Object.entries(FC)){const v=r[c.f];if(v!=null&&v!==""&&!isNaN(parseFloat(v)))prices.push({fuel:k,price:parseFloat(v),updated:r[c.m]||null});}const svc=Array.isArray(r.services_service)?r.services_service.join(" "):(r.services_service||"");return{id:r.id||(rl+"_"+rn),addr:r.adresse||"",city:r.ville||"",cp:r.cp||"",lat:rl,lon:rn,dist:hav(realGpsLat||cLat,realGpsLon||cLon,rl,rn),is24h:r.horaires_automate_24_24==="Oui",brand:dBr((r.nom||"")+" "+(r.adresse||""),r.ville||"",svc),prices,pay:detectPay(r.services_service)};});renderFull();}catch(e){document.getElementById("f-error-msg").textContent="❌ "+e.message;document.getElementById("f-error").classList.add("show");}finally{document.getElementById("f-loading").classList.remove("show");}}

async function fetchFullEV(){
  const myToken=++evFetchToken;
  const lat=fLat,lon=fLon;
  const rad=parseInt(document.getElementById("ff-rad").value)||10;
  document.getElementById("f-loading").classList.add("show");
  document.getElementById("f-error").classList.remove("show");
  document.getElementById("f-empty").classList.remove("show");
  document.getElementById("full-list").innerHTML="";
  document.getElementById("ff-cnt").textContent="Chargement...";
  // Afficher liens de secours pendant le chargement
  document.getElementById("full-list").innerHTML=
    '<div style="padding:16px;display:flex;flex-direction:column;gap:8px;max-width:300px;margin:0 auto;opacity:.5">'+
    '<div style="font-size:11px;color:#4b5563;letter-spacing:2px;text-align:center;margin-bottom:4px">EN ATTENDANT…</div>'+
    '<a href="https://www.google.com/maps/search/borne+recharge+electrique/@'+fLat+','+fLon+',13z" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#1e3a8a22;border:1px solid #1e3a8a55;border-radius:10px;color:#93c5fd;text-decoration:none;font-weight:600;font-size:13px">🗺️ Google Maps — Bornes proches</a>'+
    '<a href="https://www.chargemap.com/" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#06b6d422;border:1px solid #06b6d444;border-radius:10px;color:#67e8f9;text-decoration:none;font-weight:600;font-size:13px">⚡ ChargeMap</a>'+
    '<a href="https://www.plugshare.com/" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#16533422;border:1px solid #16533444;border-radius:10px;color:#86efac;text-decoration:none;font-weight:600;font-size:13px">🔌 PlugShare</a>'+
    '</div>';

  // Calcul bounding box (10x plus rapide que around:)
  const R=6371;
  const dlat=rad/R*(180/Math.PI);
  const dlon=rad/(R*Math.cos(lat*Math.PI/180))*(180/Math.PI);
  const bbox=(lat-dlat).toFixed(5)+","+(lon-dlon).toFixed(5)+","+(lat+dlat).toFixed(5)+","+(lon+dlon).toFixed(5);

  const query='[out:json][timeout:6];node["amenity"="charging_station"]('+bbox+');out qt 100;';

  let data;
  try{ data=await fetchOverpass(query,8000); }
  catch(e){
    document.getElementById("full-list").innerHTML=
      '<div style="padding:24px;text-align:center;color:#94a3b8">'+
        '<div style="font-size:40px;margin-bottom:12px">⚡</div>'+
        '<div style="font-weight:700;color:#e2e8f0;margin-bottom:6px">Données temporairement indisponibles</div>'+
        '<div style="font-size:12px;color:#64748b;margin-bottom:20px">'+e.message+'</div>'+
        '<div style="font-weight:600;color:#a78bfa;margin-bottom:12px">Trouvez des bornes via :</div>'+
        '<div style="display:flex;flex-direction:column;gap:8px;max-width:280px;margin:0 auto">'+
          '<a href="https://www.google.com/maps/search/borne+recharge+electrique/@'+lat+','+lon+',13z" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:10px;padding:11px 14px;background:#1e3a8a22;border:1px solid #1e3a8a55;border-radius:10px;color:#93c5fd;text-decoration:none;font-weight:600">🗺️ Google Maps — Bornes proches</a>'+
          '<a href="https://www.chargemap.com/" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:10px;padding:11px 14px;background:#06b6d422;border:1px solid #06b6d444;border-radius:10px;color:#67e8f9;text-decoration:none;font-weight:600">⚡ ChargeMap — Carte des bornes</a>'+
          '<a href="https://www.plugshare.com/" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:10px;padding:11px 14px;background:#16533422;border:1px solid #16533444;border-radius:10px;color:#86efac;text-decoration:none;font-weight:600">🔌 PlugShare — Réseau mondial</a>'+
        '</div>'+
        '<button onclick="fetchFullEV()" style="margin-top:18px;padding:10px 20px;background:rgba(168,85,247,.15);border:1px solid rgba(168,85,247,.4);border-radius:10px;color:#c4b5fd;font-weight:600;cursor:pointer">🔄 Réessayer</button>'+
      '</div>';
    document.getElementById("ff-cnt").textContent="Erreur";
    document.getElementById("f-loading").classList.remove("show");
    return;
  }
  const rows=data.elements||[];
  let list=rows.map(r=>{
      const sLat=parseFloat(r.lat||r.center?.lat||0);
      const sLon=parseFloat(r.lon||r.center?.lon||0);
      const t=r.tags||{};
      const dist=hav(lat,lon,sLat,sLon);
      const prises=[];
      if(t["socket:type2"]||t["socket:type2_cable"])prises.push({label:"Type 2",color:"#06b6d4"});
      if(t["socket:ccs"]||t["socket:type2_combo"])prises.push({label:"CCS Combo",color:"#8b5cf6"});
      if(t["socket:chademo"])prises.push({label:"CHAdeMO",color:"#f59e0b"});
      if(t["socket:type1"])prises.push({label:"Type 1",color:"#22d3ee"});
      if(t["socket:tesla_supercharger"]||t["socket:tesla_destination"])prises.push({label:"Tesla",color:"#ef4444"});
      if(!prises.length)prises.push({label:"Borne",color:"#64748b"});
      let puissance=null;
      const pwFields=["maxpower","socket:type2:output","socket:ccs:output","socket:chademo:output",
        "socket:tesla_supercharger:output","socket:tesla_destination:output","socket:type1:output",
        "charging_station:output","capacity:electrical","power_supply:output"];
      for(const f of pwFields){if(t[f]){const m=String(t[f]).match(/([\d.]+)/);if(m){puissance=parseFloat(m[1]);break;}}}
      if(!puissance){
        const op=(t.operator||t.brand||"").toLowerCase();
        if(op.includes("ionity"))puissance=350;
        else if(op.includes("tesla")&&(op.includes("supercharger")||t["socket:tesla_supercharger"]))puissance=250;
        else if(op.includes("fastned"))puissance=300;
        else if(op.includes("totalenergies")||op.includes("total energies"))puissance=50;
        else if(op.includes("izivia"))puissance=22;
        else if(op.includes("freshmile"))puissance=22;
      }
      if(!puissance){
        if(t["socket:tesla_supercharger"])puissance=150;
        else if(t["socket:ccs"])puissance=50;
        else if(t["socket:chademo"])puissance=50;
        else if(t["socket:type2"])puissance=22;
        else if(t["socket:type1"])puissance=7;
      }
      // Catégorie vitesse pour filtre
      let speedCat="inconnu";
      if(puissance>=50)speedCat="rapide";
      else if(puissance>=22)speedCat="semi";
      else if(puissance)speedCat="lente";
      const nbSockets=Object.keys(t).filter(k=>k.startsWith("socket:")&&!k.includes(":")).length;
      const nbrePDC=parseInt(t.capacity)||nbSockets||1;
      const gratuit=t.fee==="no";
      const is24h=t.opening_hours==="24/7";
      const operateur=t.operator||t.brand||null;
      const nom=t.name||t["network"]||operateur||"Borne de recharge";
      const streetNum=(t["addr:housenumber"]?t["addr:housenumber"]+" ":"")+(t["addr:street"]||t["addr:place"]||"");
      const addr=t["addr:full"]||streetNum||"";
      const city=t["addr:city"]||t["addr:municipality"]||t["addr:town"]||"";
      return{nom,addr,city,lat:sLat,lon:sLon,dist,prises,nbrePDC,puissance,puissanceEstimee:!t["socket:type2:output"]&&!t.maxpower&&puissance!=null,speedCat,gratuit,is24h,operateur};
    }).filter(s=>s.lat!==0).sort((a,b)=>a.dist-b.dist);

    document.getElementById("ff-cnt").textContent=list.length+" borne"+(list.length>1?"s":"");
    if(!list.length){document.getElementById("f-empty").classList.add("show");document.getElementById("f-loading").classList.remove("show");return;}
    if(myToken!==evFetchToken){document.getElementById("f-loading").classList.remove("show");return;}
    await enrichEVAddresses(list);
    if(myToken!==evFetchToken){document.getElementById("f-loading").classList.remove("show");return;}
    renderFullEV(list);
    document.getElementById("f-loading").classList.remove("show");
}

function renderFullEV(list){
  document.getElementById("ff-cnt").textContent=list.length+" borne"+(list.length>1?"s":"");
  document.getElementById("f-loading").classList.remove("show");
  document.getElementById("f-empty").classList.remove("show");
  document.getElementById("full-list").innerHTML=list.map((s,i)=>{
    const gU="https://www.google.com/maps/dir/?api=1&destination="+s.lat+","+s.lon;
    const wU="https://waze.com/ul?ll="+s.lat+"%2C"+s.lon+"&navigate=yes";
    const brand=getEVBrand(s.operateur);
    const brandHTML=brand?'<span class="brand-badge" style="background:'+brand.bg+';color:'+brand.fg+'">'+brand.i+' '+esc(brand.n)+'</span>':'';
    const speed=getChargeSpeed(s.puissance,s.puissanceEstimee);
    const speedHTML=speed?'<div style="display:inline-flex;align-items:center;gap:5px;padding:5px 10px;background:'+speed.bg+';border:1px solid '+speed.color+'33;border-radius:8px;margin-bottom:5px"><span>'+speed.icon+'</span><span style="font-weight:700;color:'+speed.color+';font-size:12px">'+speed.label+' · '+speed.sublabel+'</span></div>':'';
    const prisesHTML=s.prises.map(p=>'<span class="info-tag" style="background:'+p.color+'1a;color:'+p.color+';border:1px solid '+p.color+'44">'+p.label+'</span>').join("");
    const addrLine=[s.addr,(s.cp?s.cp+" ":"")+s.city].filter(Boolean).join(", ")||("📍 "+s.lat.toFixed(4)+", "+s.lon.toFixed(4));
    const tags=[];
    if(s.gratuit)tags.push('<span class="info-tag info-tag-cb">🆓 Gratuit</span>');
    if(s.nbrePDC>1)tags.push('<span class="info-tag" style="background:#06b6d410;color:#67e8f9;border:1px solid #06b6d430">🔌 '+s.nbrePDC+' pts</span>');
    if(s.is24h)tags.push('<span class="tag-24">24h/7j</span>');
    return'<div class="card" style="animation-delay:'+(i*25)+'ms">'+
      '<div class="card-top"><div class="card-left"><div class="rank">'+(i+1)+'</div>'+
      '<div style="min-width:0"><div class="brand-row">'+brandHTML+'</div>'+
      '<div class="station-name">'+esc(s.nom)+'</div>'+
      '<div class="station-addr">'+esc(addrLine)+'</div></div></div>'+
      '<div class="dist-badge">'+s.dist.toFixed(1)+' km</div></div>'+
      '<div style="margin:8px 0 4px">'+speedHTML+'</div>'+
      '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px">'+prisesHTML+'</div>'+
      evCompatHTML(s.prises)+
      '<div class="info-tags" style="margin-top:6px">'+tags.join("")+'</div>'+
      '<div class="nav-btns"><a class="nav-btn nav-btn-gmaps" href="'+gU+'" target="_blank" rel="noopener noreferrer">'+gS+' Google Maps</a>'+
      '<a class="nav-btn nav-btn-waze" href="'+wU+'" target="_blank" rel="noopener noreferrer">'+wS+' Waze</a></div></div>';
  }).join("");
}

function renderFull(){const ff=document.getElementById("ff-fuel").value,fs=document.getElementById("ff-sort").value;let list=fStations.filter(s=>{if(ff==="all")return true;return s.prices.some(p=>p.fuel===ff);});list.sort((a,b)=>{if(fs==="distance")return a.dist-b.dist;const gm=s=>{let ps=s.prices;if(ff!=="all")ps=ps.filter(p=>p.fuel===ff);if(!ps.length)return 99999;return Math.min(...ps.map(p=>p.price));};return gm(a)-gm(b);});const ch={};fStations.forEach(s=>s.prices.forEach(p=>{if(!ch[p.fuel]||p.price<ch[p.fuel].p)ch[p.fuel]={p:p.price,id:s.id};}));document.getElementById("ff-cnt").textContent=list.length+" station"+(list.length>1?"s":"");const ee=document.getElementById("f-empty");if(!list.length)ee.classList.add("show");else ee.classList.remove("show");document.getElementById("full-list").innerHTML=list.map((s,idx)=>{const isBest=Object.values(ch).some(c=>c.id===s.id);const pH=s.prices.length===0?'<span style="font-size:11px;color:#475569;font-style:italic">Pas de prix</span>':s.prices.map(p=>{const c=FC[p.fuel]||{l:p.fuel,c:"#888"};const best=ch[p.fuel]&&ch[p.fuel].p===p.price;return'<div class="price-chip" style="border-color:'+c.c+';background:'+(best?c.c+'18':'rgba(168,85,247,0.03)')+'"><span class="price-fuel" style="color:'+c.c+'">'+c.l+'</span><span class="price-val'+(best?' is-best':'')+'">'+fp(p.price)+'</span><span class="updated-at">'+fDate(p.updated)+'</span></div>';}).join("");const gU="https://www.google.com/maps/dir/?api=1&destination="+s.lat+","+s.lon;const wU="https://waze.com/ul?ll="+s.lat+"%2C"+s.lon+"&navigate=yes";return'<div class="card'+(isBest?' best':'')+'" style="animation-delay:'+(idx*25)+'ms"><div class="card-top"><div class="card-left"><div class="rank-col"><div class="rank">'+(idx+1)+'</div>'+(s.is24h?'<span class="tag-24">24h</span>':'')+'</div><div style="min-width:0"><div class="brand-row">'+bh(s.brand)+(isBest?'<span class="tag-best">🏆</span>':'')+'</div><div class="station-name">'+esc(s.city||"Station")+'</div><div class="station-addr">'+esc(s.addr+(s.addr?", ":"")+s.cp+" "+s.city)+'</div></div></div><div class="dist-badge">'+s.dist.toFixed(1)+' km</div></div><div class="prices-row">'+pH+'</div><div class="info-tags">'+payHTML(s.pay)+'</div><div class="nav-btns"><a class="nav-btn nav-btn-gmaps" href="'+gU+'" target="_blank" rel="noopener noreferrer">'+gS+' Google Maps</a><a class="nav-btn nav-btn-waze" href="'+wU+'" target="_blank" rel="noopener noreferrer">'+wS+' Waze</a></div></div>';}).join("");}
document.getElementById("ff-fuel").addEventListener("change",()=>{
  const ff=document.getElementById("ff-fuel").value;
  // Nettoyer l'écran avant de charger
  document.getElementById("full-list").innerHTML="";
  document.getElementById("f-empty").classList.remove("show");
  document.getElementById("f-error").classList.remove("show");
  document.getElementById("ff-cnt").textContent="";
  if(ff==="EV"){fetchFullEV();}else{fStations=[];renderFull();fetchFull();}
});
document.getElementById("ff-sort").addEventListener("change",()=>{const ff=document.getElementById("ff-fuel").value;if(ff!=="EV")renderFull();});
document.getElementById("ff-rad").addEventListener("change",fetchFull);

// ===== PWA INSTALL =====
let pwaPrompt=null;
const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
const isAndroid=/android/i.test(navigator.userAgent);
const isStandalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone;

if(!isStandalone){
  if(isIOS){
    const _pw=document.getElementById('pwa-install-wrap');if(_pw)_pw.style.display='block';
  }
  window.addEventListener('beforeinstallprompt',e=>{
    e.preventDefault();
    pwaPrompt=e;
    const _pw=document.getElementById('pwa-install-wrap');if(_pw)_pw.style.display='block';
  });
}

function pwaInstall(){
  if(pwaPrompt){
    pwaPrompt.prompt();
    pwaPrompt.userChoice.then(r=>{
      if(r.outcome==='accepted')document.getElementById('pwa-install-wrap').style.display='none';
      pwaPrompt=null;
    });
  }else if(isIOS){
    document.getElementById('ios-modal').style.display='flex';
  }
}
// Fermer modal iOS en cliquant le fond
document.addEventListener('DOMContentLoaded',function(){
  var m=document.getElementById('ios-modal');
  if(m)m.addEventListener('click',function(e){if(e.target===this)this.style.display='none';});
});
let chatOpen=false;
function toggleChat(){chatOpen=!chatOpen;document.getElementById("chat-panel").classList.toggle("open",chatOpen);}
function addMsg(role,text,containerId){const msgs=document.getElementById(containerId||"chat-messages");const div=document.createElement("div");div.className="chat-msg "+role;if(role==="bot")div.innerHTML='<div class="chat-avatar">🐺</div><div class="chat-bubble">'+text+'</div>';else div.innerHTML='<div class="chat-avatar">👤</div><div class="chat-bubble">'+esc(text)+'</div>';msgs.appendChild(div);msgs.scrollTop=msgs.scrollHeight;}
function addTyping(containerId){const msgs=document.getElementById(containerId||"chat-messages");const div=document.createElement("div");div.className="chat-msg bot";div.id=(containerId||"chat-messages")+"-typing";div.innerHTML='<div class="chat-avatar">🐺</div><div class="chat-bubble"><div class="chat-typing"><span></span><span></span><span></span></div></div>';msgs.appendChild(div);msgs.scrollTop=msgs.scrollHeight;}
function removeTyping(containerId){const t=document.getElementById((containerId||"chat-messages")+"-typing");if(t)t.remove();}
function addQuickBtns(containerId){
  const msgs=document.getElementById(containerId||"chat-messages");
  const div=document.createElement("div");
  div.className="chat-quick";
  const suffix=containerId==="chat-messages-results"?"R":"";
  const isEV=cFuel==="EV";
  const hasResults = isEV ? evStations.length>0 : resStations.length>0;
  if(isEV){
    div.innerHTML=
      (hasResults?'<button class="chat-quick-btn" onclick="askQuick'+suffix+'(\'ev_analyse\')">🔍 Analyser les bornes</button>':'')+
      '<button class="chat-quick-btn" onclick="askQuick'+suffix+'(\'ev_prises\')">🔌 Types de prises</button>'+
      '<button class="chat-quick-btn" onclick="askQuick'+suffix+'(\'ev_vitesse\')">⚡ Rapide vs lente</button>'+
      '<button class="chat-quick-btn" onclick="askQuick'+suffix+'(\'ev_cout\')">💶 Coût recharge</button>'+
      '<button class="chat-quick-btn" onclick="askQuick'+suffix+'(\'ev_astuces\')">💡 Astuces VE</button>';
  } else {
    div.innerHTML=
      (hasResults?'<button class="chat-quick-btn" onclick="askQuick'+suffix+'(\'meilleure\')">🏆 Meilleure station ?</button>':'')+
      (hasResults?'<button class="chat-quick-btn" onclick="askQuick'+suffix+'(\'tendance\')">📈 Analyser les prix</button>':'')+
      '<button class="chat-quick-btn" onclick="askQuick'+suffix+'(\'meilleur_jour\')">📅 Meilleur jour ?</button>'+
      '<button class="chat-quick-btn" onclick="askQuick'+suffix+'(\'comparer\')">⚖️ vs Moyenne France</button>'+
      '<button class="chat-quick-btn" onclick="askQuick'+suffix+'(\'astuces\')">💡 Astuces économies</button>';
  }
  msgs.appendChild(div);
  msgs.scrollTop=msgs.scrollHeight;
}

function getRegionInfo(){const dept=DEPTS.find(d=>d.city===cName);return{name:dept?dept.n:cName||"France",city:dept?dept.city:cName||"",lat:cLat,lon:cLon};}
async function fetchRegionStats(lat,lon,radius){const fields="gazole_prix,sp95_prix,sp98_prix,e10_prix,e85_prix,gplc_prix";const where="within_distance(geom, geom'POINT("+lon+" "+lat+")', "+radius+"km)";const url="https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?select="+encodeURIComponent(fields)+"&where="+encodeURIComponent(where)+"&limit=60";try{const res=await fetch(url);if(!res.ok)return null;const data=await res.json();const stations=data.results||[];if(!stations.length)return null;const stats={};const ff={Gazole:"gazole_prix",SP95:"sp95_prix",SP98:"sp98_prix",E10:"e10_prix",E85:"e85_prix",GPLc:"gplc_prix"};for(const[n,f]of Object.entries(ff)){const vals=stations.map(s=>s[f]).filter(v=>v!=null&&!isNaN(v));if(vals.length){vals.sort((a,b)=>a-b);stats[n]={min:vals[0],max:vals[vals.length-1],avg:+(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(3),count:vals.length};}}return{stats,total:stations.length};}catch{return null;}}

async function askQuick(type,containerId){
  containerId=containerId||"chat-messages";
  // Remove all existing quick buttons in this container
  document.querySelectorAll("#"+containerId+" .chat-quick").forEach(el=>el.remove());
  const labels={"meilleur_jour":"📅 Quel jour acheter ?","tendance":"📈 Tendance des prix","region":"🗺️ Conseil pour ma région","astuces":"💡 Astuces économies","ev_prises":"🔌 Types de prises","ev_vitesse":"⚡ Charge rapide vs lente","ev_cout":"💶 Coût de recharge","ev_astuces":"💡 Astuces VE"};
  addMsg("user",labels[type],containerId);
  addTyping(containerId);
  const reg=getRegionInfo();
  const data=await fetchRegionStats(reg.lat||48.85,reg.lon||2.35,30);
  removeTyping(containerId);
  let reply="";const rl="<b>"+esc(reg.name)+"</b> ("+esc(reg.city)+")";
  if(type==="meilleur_jour"){reply="📅 <b>Meilleur jour pour faire le plein</b><br><br>D'après les études en France :<br><br>🟢 <b>Lundi et mardi</b> = les jours les <b>moins chers</b>. Les stations ajustent les prix en début de semaine.<br><br>🔴 <b>Vendredi et samedi</b> = les plus chers (demande avant le week-end).<br><br>🕐 <b>Le matin tôt</b> (avant 10h) les prix affichés sont parfois ceux de la veille.";if(data&&data.stats){const gz=data.stats.Gazole,e10=data.stats.E10;if(gz)reply+="<br><br>📊 En ce moment autour de "+rl+" : Gazole entre <b>"+gz.min.toFixed(3)+" €</b> et <b>"+gz.max.toFixed(3)+" €</b>.";if(e10)reply+="<br>E10 entre <b>"+e10.min.toFixed(3)+" €</b> et <b>"+e10.max.toFixed(3)+" €</b>.";if(gz)reply+="<br><br>💡 Écart de <b>"+(gz.max-gz.min).toFixed(3)+" €/L</b> — ça vaut le coup de comparer !";}}
  else if(type==="tendance"){reply="📈 <b>Tendance — "+rl+"</b><br><br>";if(data&&data.stats){reply+="📊 <b>"+data.total+" stations</b> analysées :<br><br>";for(const[n,s]of Object.entries(data.stats))reply+="⛽ <b>"+n+"</b> : "+s.min.toFixed(3)+" → "+s.max.toFixed(3)+" € (moy. "+s.avg.toFixed(3)+")<br>";reply+="<br>";const gz=data.stats.Gazole;if(gz){if(gz.avg<1.7)reply+="🟢 Prix <b>bas</b> — bon moment pour le plein !";else if(gz.avg<1.9)reply+="🟡 Prix <b>moyens</b> — surveillez les évolutions.";else if(gz.avg<2.1)reply+="🟠 Prix <b>élevés</b> — privilégiez les grandes surfaces.";else reply+="🔴 Prix <b>très élevés</b> — faites le plein en début de semaine en grande surface.";}}else reply+="Impossible de charger les données. Consultez la liste des stations sur cette page !";}
  else if(type==="region"){reply="🗺️ <b>Conseils pour "+rl+"</b><br><br>";if(data&&data.stats){const gz=data.stats.Gazole,e10=data.stats.E10;reply+="📊 <b>"+data.total+" stations</b> dans un rayon de 30 km :<br><br>";if(gz){reply+="🏷️ Gazole : <b>"+gz.min.toFixed(3)+" €</b> → <b>"+gz.max.toFixed(3)+" €</b><br>";reply+="💰 Économie par plein 50L : <b>"+((gz.max-gz.min)*50).toFixed(2)+" €</b><br><br>";}if(e10){reply+="🏷️ E10 : <b>"+e10.min.toFixed(3)+" €</b> → <b>"+e10.max.toFixed(3)+" €</b><br><br>";}}reply+="🛒 <b>Enseignes à privilégier :</b><br>• <b>E.Leclerc</b> — souvent le moins cher<br>• <b>Costco</b> — très compétitif (carte membre)<br>• <b>Carrefour / Système U</b> — bons prix<br><br>⚠️ Évitez les autoroutes (+15-20 cts/L) !";}
  else if(type==="astuces"){reply="💡 <b>Astuces économies</b><br><br><b>🗓️ Quand :</b><br>• Plein le <b>lundi/mardi</b><br>• Évitez vendredi/samedi<br><br><b>📍 Où :</b><br>• <b>Grandes surfaces</b> (Leclerc, Costco)<br>• Comparez sur WolfFuel<br>• Évitez les autoroutes<br><br><b>🚗 Conduite :</b><br>• <b>110 au lieu de 130</b> = -20% conso<br>• Vérifiez les <b>pneus</b> tous les mois<br>• Coupez la <b>clim</b> quand possible<br>• Retirez les barres de toit inutiles";if(data&&data.stats&&data.stats.E85)reply+="<br><br>🌿 <b>Bonus :</b> E85 à <b>"+data.stats.E85.avg.toFixed(3)+" €</b> dans votre zone — 2x moins cher si votre voiture est compatible !";}
  else if(type==="ev_prises"){reply="🔌 <b>Types de prises en France</b><br><br>"+
    "<b>Type 2 (Mennekes)</b> — La plus répandue en Europe. Charge AC jusqu'à 22 kW. Compatible : Renault, Peugeot, VW, BMW, Mercedes, Audi, Hyundai, Kia...<br><br>"+
    "<b>CCS Combo 2</b> — Charge rapide DC jusqu'à 350 kW. Compatible : VW, Audi, BMW, Ford, Hyundai, Renault (ZOE récente)...<br><br>"+
    "<b>CHAdeMO</b> — Standard japonais, charge rapide DC. Compatible : Nissan Leaf, Mitsubishi Outlander, Toyota...<br><br>"+
    "<b>Tesla (Supercharger)</b> — Réseau propriétaire Tesla, désormais ouvert avec adaptateur CCS.<br><br>"+
    "💡 <b>Astuce :</b> La majorité des VE récents ont au moins un <b>port Type 2</b> — c'est la base universelle !";}
  else if(type==="ev_vitesse"){reply="⚡ <b>Charge rapide vs lente</b><br><br>"+
    "🐢 <b>Lente (&lt;7 kW)</b> — Prise domestique ou borne lente. Compte <b>8-12h</b> pour un plein. Idéal la nuit.<br><br>"+
    "🔌 <b>Normale (7-22 kW)</b> — Borne AC standard. <b>3-8h</b> selon la batterie. Parking, bureau, centre commercial.<br><br>"+
    "⚡ <b>Semi-rapide (22-49 kW)</b> — Borne AC rapide ou DC entrée de gamme. <b>1-3h</b>.<br><br>"+
    "⚡⚡ <b>Rapide (50-149 kW)</b> — DC rapide. <b>20-60 min</b> pour 80%. Autoroutes, grandes surfaces.<br><br>"+
    "⚡⚡⚡ <b>Ultra-rapide (≥150 kW)</b> — Ionity, Tesla SC, Fastned. <b>15-30 min</b> pour 80%. Le top !<br><br>"+
    "💡 <b>Conseil :</b> Évitez de charger au-delà de <b>80%</b> sur charge rapide — ça protège la batterie !";}
  else if(type==="ev_cout"){reply="💶 <b>Coût de recharge en France</b><br><br>"+
    "<b>À domicile (nuit)</b> — Tarif heures creuses ~<b>0,10-0,15 €/kWh</b>. Plein complet d'une Zoé (52 kWh) : <b>5-8 €</b>.<br><br>"+
    "<b>Borne publique normale</b> — Environ <b>0,25-0,45 €/kWh</b>.<br><br>"+
    "<b>Charge rapide (50 kW)</b> — <b>0,35-0,55 €/kWh</b>.<br><br>"+
    "<b>Ultra-rapide Ionity</b> — Jusqu'à <b>0,79 €/kWh</b> sans abonnement.<br><br>"+
    "<b>Tesla Supercharger</b> — ~<b>0,35-0,50 €/kWh</b> selon la puissance.<br><br>"+
    "🆓 <b>Bornes gratuites</b> — Certains parkings, Lidl, McDonald's proposent la recharge gratuite !<br><br>"+
    "💡 <b>vs essence :</b> 100 km en VE coûte <b>2-4 €</b> contre <b>8-12 €</b> en thermique. Économie réelle !";}
  else if(type==="ev_astuces"){reply="💡 <b>Astuces pour les conducteurs VE</b><br><br>"+
    "<b>🔋 Batterie :</b><br>• Chargez idéalement entre <b>20% et 80%</b> au quotidien<br>• Réservez les 100% pour les longs trajets<br>• Évitez de rester longtemps à 0% ou 100%<br><br>"+
    "<b>⚡ Charge :</b><br>• Préférez la <b>charge lente la nuit</b> à domicile<br>• Utilisez les <b>heures creuses</b> EDF pour diviser la facture par 2<br>• Préchauffez/refroidissez le véhicule <b>branché</b> pour préserver la batterie<br><br>"+
    "<b>🗺️ Trajet :</b><br>• Planifiez avec <b>ABRP</b> (A Better Route Planner) ou <b>PlugShare</b><br>• Chargez à <b>80%</b> sur autoroute, pas 100% — plus rapide<br>• <b>Régénérez</b> en descente — ça recharge un peu la batterie !<br><br>"+
    "<b>💶 Économies :</b><br>• Abonnements <b>Ionity Passport</b>, <b>Freshmile</b> = -40% sur la charge rapide<br>• <b>ChargeMap Pass</b> regroupe plusieurs réseaux en une carte";}
  addMsg("bot",reply,containerId);
  // Add buttons again after reply
  setTimeout(()=>addQuickBtns(containerId),300);
}

// ===== TUTORIEL INTERACTIF COMPLET =====
(function(){

const STEPS = [
  {
    screen: 'screen-welcome',
    targetId: '#btn-dept',
    title: '📍 Étape 1 — Choisir un département',
    text: 'Pour la démo, nous allons utiliser <b>Choisir un département</b>. Je clique dessus, je tape <b>Paris</b> lettre par lettre, puis je sélectionne le bon département dans la liste !',
    nextLabel: 'Voir la démo →',
    action: function(done){
      var deptBtn = document.getElementById('btn-dept');
      if(!deptBtn){ done(); return; }

      var isMobile = window.innerWidth < 600;

      simulateCursorClick('#btn-dept', function(){
        deptBtn.click();

        // Masquer overlay + ring pour voir tout le formulaire
        if(bgEl) bgEl.classList.remove('active');
        if(ringEl) ringEl.style.display = 'none';
        if(holeEl) holeEl.style.cssText = 'width:0;height:0;';

        // Bulle en bas de l'écran, adaptée mobile
        if(bubbleEl){
          var vw = window.innerWidth;
          var vh = window.innerHeight;
          var bw = isMobile ? Math.min(vw - 20, 310) : 330;
          bubbleEl.style.width = bw + 'px';
          bubbleEl.style.left = Math.max(10, (vw - bw) / 2) + 'px';
          bubbleEl.style.top  = (vh - (isMobile ? 200 : 230)) + 'px';
        }

        // Attendre que le dropdown s'affiche
        setTimeout(function(){
          var ds = document.getElementById('ds');
          if(!ds){ if(bgEl) bgEl.classList.add('active'); done(); return; }

          // Taille curseur selon device
          var csz = isMobile ? '38px' : '26px';
          cursorEl.style.width  = csz;
          cursorEl.style.height = csz;

          // Curseur vers le champ de recherche
          var dsRect = ds.getBoundingClientRect();
          var cx = dsRect.left + dsRect.width / 2;
          var cy = dsRect.top + dsRect.height / 2;
          cursorEl.style.display = 'block';
          cursorEl.classList.remove('clicking');
          cursorEl.style.transition = 'none';
          cursorEl.style.left = (cx + 100) + 'px';
          cursorEl.style.top  = (cy + 70) + 'px';

          setTimeout(function(){
            // Glissement lent vers le champ
            cursorEl.style.transition = 'left 1s cubic-bezier(.4,0,.2,1), top 1s cubic-bezier(.4,0,.2,1)';
            cursorEl.style.left = cx + 'px';
            cursorEl.style.top  = cy + 'px';

            setTimeout(function(){
              cursorEl.classList.add('clicking');
              setTimeout(function(){
                cursorEl.style.display = 'none';
                cursorEl.classList.remove('clicking');
                ds.focus();

                // Frappe lettre par lettre — 280ms entre chaque
                var word = 'Paris';
                var idx = 0;
                function typeNext(){
                  if(idx <= word.length){
                    ds.value = word.substring(0, idx);
                    ds.dispatchEvent(new Event('input'));
                    idx++;
                    setTimeout(typeNext, 280);
                  } else {
                    // Pause après la dernière lettre, puis chercher Paris
                    setTimeout(function(){
                      var items = document.querySelectorAll('#dl .di');
                      var parisItem = null;
                      items.forEach(function(item){
                        if(item.dataset.c === '75') parisItem = item;
                      });
                      if(!parisItem) parisItem = document.querySelector('#dl .di');

                      if(parisItem){
                        var pr = parisItem.getBoundingClientRect();
                        var px = pr.left + pr.width / 2;
                        var py = pr.top + pr.height / 2;

                        // Curseur vers l'item Paris
                        cursorEl.style.width  = csz;
                        cursorEl.style.height = csz;
                        cursorEl.style.display = 'block';
                        cursorEl.classList.remove('clicking');
                        cursorEl.style.transition = 'none';
                        cursorEl.style.left = (px - 100) + 'px';
                        cursorEl.style.top  = (py - 60) + 'px';

                        setTimeout(function(){
                          cursorEl.style.transition = 'left 1.1s cubic-bezier(.4,0,.2,1), top 1.1s cubic-bezier(.4,0,.2,1)';
                          cursorEl.style.left = px + 'px';
                          cursorEl.style.top  = py + 'px';

                          // Surligner l'item
                          parisItem.style.transition = 'background .3s';
                          parisItem.style.background = 'rgba(168,85,247,.3)';

                          setTimeout(function(){
                            cursorEl.classList.add('clicking');
                            setTimeout(function(){
                              parisItem.click();
                              cursorEl.style.display = 'none';
                              cursorEl.classList.remove('clicking');
                              parisItem.style.background = '';
                              // Remettre l'overlay
                              if(bgEl) bgEl.classList.add('active');
                              done();
                            }, 450);
                          }, 700);
                        }, 80);
                      } else {
                        if(bgEl) bgEl.classList.add('active');
                        done();
                      }
                    }, 700);
                  }
                }
                setTimeout(typeNext, 300);
              }, 450);
            }, 1050);
          }, 80);
        }, 600);
      });
    },
    actionDelay: 700
  },
  {
    screen: 'screen-welcome',
    targetId: '#fg',
    title: '⛽ Étape 2 — Choisir le carburant',
    text: 'Sélectionnez votre type de carburant. Je clique sur "Gazole" pour la démonstration.',
    nextLabel: 'Voir la démo →',
    action: function(done){
      var gazBtn = document.querySelector('#fg .fb');
      if(gazBtn){
        simulateCursorClick('#fg .fb', function(){
          gazBtn.click();
          done();
        });
      } else { done(); }
    },
    actionDelay: 700
  },
  {
    screen: 'screen-welcome',
    targetId: '.go-btn',
    title: '🔍 Étape 3 — Lancer la recherche',
    text: 'Ce bouton lance la recherche des meilleures stations autour de vous. Je le clique !',
    nextLabel: 'Voir la démo →',
    action: function(done){
      simulateCursorClick('.go-btn', function(){
        var go = document.getElementById('go-btn');
        if(go && !go.disabled){
          go.click();
          setTimeout(done, 1400);
        } else {
          switchScreen('screen-results');
          setTimeout(done, 600);
        }
      });
    },
    actionDelay: 1200
  },
  {
    screen: 'screen-results',
    targetId: '.sort-tabs',
    title: '🏷️ Étape 4 — Trier les résultats',
    text: 'Ces onglets trient les stations par prix (du moins cher) ou par distance (la plus proche). Un clic suffit !',
    nextLabel: 'Suivant →',
    action: null
  },
  {
    screen: 'screen-results',
    targetId: '.rh',
    title: '🔄 Étape 5 — Barre de recherche',
    text: 'Cette barre en haut permet de modifier votre localisation ou votre carburant sans repartir de zéro.',
    nextLabel: 'Suivant →',
    action: null
  },
  {
    screen: 'screen-results',
    targetId: '.other-btn',
    title: '🌍 Étape 6 — Recherche avancée',
    text: 'Ce bouton ouvre la page complète : toutes les villes, rayon personnalisable, et le chatbot conseiller 🐺 !',
    nextLabel: 'Voir la page →',
    action: function(done){
      simulateCursorClick('.other-btn', function(){
        var ob = document.getElementById('other-btn');
        if(ob) ob.click();
        done();
      });
    },
    actionDelay: 900
  },
  {
    screen: 'screen-full',
    targetId: '.ss',
    title: '🔎 Étape 7 — Recherche par ville',
    text: 'Tapez n\'importe quelle ville de France. Les suggestions apparaissent automatiquement. Très pratique en voyage !',
    nextLabel: 'Suivant →',
    action: null
  },
  {
    screen: 'screen-full',
    targetId: '.ff',
    title: '⚙️ Étape 8 — Filtres avancés',
    text: 'Choisissez le carburant, l\'ordre de tri et le rayon de recherche (de 5 à 50 km). Tout est personnalisable !',
    nextLabel: 'Suivant →',
    action: null
  },
  {
    screen: 'screen-full',
    targetId: '#chat-fab',
    title: '🐺 Étape 9 — Le conseiller loup',
    text: 'Ce bouton 🐺 ouvre le chatbot. Il analyse les prix de votre zone et vous conseille sur le meilleur moment pour faire le plein !',
    nextLabel: 'Terminer 🎉',
    action: null
  }
];

var curStep = 0;
var itutActive = false;
var ringEl, holeEl, bgEl, bubbleEl, cursorEl, skipBtn, nextBtn;

// ===== MOTEUR VOIX =====
var voiceEnabled = false; // désactivé par défaut
var voiceBtn = null;
var frVoice = null;

function initVoice(){
  if(!window.speechSynthesis) return;
  function pickVoice(){
    var voices = window.speechSynthesis.getVoices();
    // Priorité : voix fr-FR, sinon fr, sinon première dispo
    frVoice = voices.find(function(v){ return v.lang === 'fr-FR'; })
           || voices.find(function(v){ return v.lang.startsWith('fr'); })
           || null;
  }
  pickVoice();
  if(window.speechSynthesis.onvoiceschanged !== undefined){
    window.speechSynthesis.onvoiceschanged = pickVoice;
  }
}

function speakText(text){
  if(!window.speechSynthesis || !voiceEnabled) return;
  // Nettoyer les balises HTML pour ne lire que le texte brut
  var clean = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  window.speechSynthesis.cancel();
  var utt = new SpeechSynthesisUtterance(clean);
  utt.lang  = 'fr-FR';
  utt.rate  = 0.92;
  utt.pitch = 1.05;
  utt.volume = 1;
  if(frVoice) utt.voice = frVoice;
  utt.onstart = function(){
    if(voiceBtn){ voiceBtn.classList.add('speaking'); voiceBtn.textContent = '🔊'; }
  };
  utt.onend = utt.onerror = function(){
    if(voiceBtn) voiceBtn.classList.remove('speaking');
  };
  window.speechSynthesis.speak(utt);
}

function stopVoice(){
  if(window.speechSynthesis) window.speechSynthesis.cancel();
  if(voiceBtn) voiceBtn.classList.remove('speaking');
}

function toggleVoice(){
  voiceEnabled = !voiceEnabled;
  if(!voiceEnabled){
    stopVoice();
    if(voiceBtn){ voiceBtn.textContent = '🔇'; voiceBtn.classList.add('muted'); voiceBtn.classList.remove('speaking'); }
  } else {
    if(voiceBtn){ voiceBtn.textContent = '🔊'; voiceBtn.classList.remove('muted'); }
    // Relire l'étape courante
    var step = STEPS[curStep];
    if(step) speakText(step.title + '. ' + step.text);
  }
}

function initDom(){
  ringEl   = document.getElementById('itut-ring');
  holeEl   = document.getElementById('itut-hole');
  bgEl     = document.getElementById('itut-bg');
  bubbleEl = document.getElementById('itut-bubble');
  cursorEl = document.getElementById('itut-cursor');
  skipBtn  = document.getElementById('itut-skip');
  nextBtn  = document.getElementById('itut-next');
  voiceBtn = document.getElementById('itut-voice-btn');
  if(skipBtn) skipBtn.onclick = endTutorial;
  if(nextBtn) nextBtn.onclick = handleNext;
  if(voiceBtn){
    voiceBtn.onclick = toggleVoice;
    // Refléter l'état initial désactivé
    voiceBtn.textContent = '🔇';
    voiceBtn.classList.add('muted');
  }
  initVoice();
}

window.startTutorial = function(){
  initDom();
  if(!ringEl) return;
  itutActive = true;
  curStep = 0;
  document.body.classList.add('itut-active');
  bgEl.classList.add('active');
  bubbleEl.style.display = 'block';
  bubbleEl.classList.add('active');
  var tov = document.getElementById('tuto-overlay');
  if(tov) tov.classList.remove('open');
  showStep(0);
};

function endTutorial(){
  itutActive = false;
  stopVoice();
  document.body.classList.remove('itut-active');
  if(bgEl) bgEl.classList.remove('active');
  if(bubbleEl){ bubbleEl.classList.remove('active'); bubbleEl.style.display='none'; }
  if(ringEl) ringEl.style.display='none';
  if(holeEl){ holeEl.style.width='0'; holeEl.style.height='0'; }
  if(cursorEl) cursorEl.style.display='none';
  if(nextBtn){ nextBtn.style.display=''; nextBtn.disabled=false; }
  document.querySelectorAll('.itut-ring-extra,.itut-hole-extra').forEach(function(r){ r.remove(); });
}
window.endTutorial = endTutorial;

function switchScreen(id){
  document.querySelectorAll('.screen').forEach(function(s){ s.classList.remove('active'); });
  var sc = document.getElementById(id);
  if(sc) sc.classList.add('active');
  window.scrollTo(0,0);
  var fab  = document.getElementById('chat-fab');
  var fabR = document.getElementById('chat-fab-results');
  if(id === 'screen-full'){
    if(fab) fab.classList.add('visible');
    if(fabR) fabR.style.display='none';
  } else if(id === 'screen-results'){
    if(fab) fab.classList.remove('visible');
    if(fabR) fabR.style.display='flex';
  } else {
    if(fab) fab.classList.remove('visible');
    if(fabR) fabR.style.display='none';
  }
}

function showStep(i){
  if(i >= STEPS.length){ endTutorial(); return; }
  var step = STEPS[i];

  // Changer d'écran si besoin
  var cur = document.querySelector('.screen.active');
  var target = document.getElementById(step.screen);
  if(target && cur !== target) switchScreen(step.screen);

  setTimeout(function(){
    var el = step.targetId ? document.querySelector(step.targetId.split(',')[0].trim()) : null;
    positionRing(el, step);
    positionBubble(el, step, i);
    updateProgress(i);

    // waitForUser : on cache le bouton Suivant, on attend que l'user clique sur un vrai élément
    if(step.waitForUser){
      nextBtn.style.display = 'none';
      // Écouter les clics sur les éléments cibles
      var targets = step.targetMulti || (step.targetId ? [step.targetId] : []);
      function onUserClick(){
        targets.forEach(function(sel){
          var e = document.querySelector(sel);
          if(e) e.removeEventListener('click', onUserClick);
        });
        // Laisser l'action réelle se faire (le clic natif), puis avancer
        setTimeout(function(){
          nextBtn.style.display = '';
          curStep = i + 1;
          showStep(curStep);
        }, 700);
      }
      targets.forEach(function(sel){
        var e = document.querySelector(sel);
        if(e) e.addEventListener('click', onUserClick);
      });
      return;
    }

    nextBtn.style.display = '';
    nextBtn.textContent = step.nextLabel || 'Suivant →';
    nextBtn.disabled = false;
    if(step.action){
      nextBtn.onclick = function(){
        nextBtn.disabled = true;
        nextBtn.textContent = '⏳ En cours…';
        step.action(function(){
          setTimeout(function(){
            curStep = i + 1;
            showStep(curStep);
          }, step.actionDelay || 400);
        });
      };
    } else {
      nextBtn.onclick = handleNext;
    }
  }, 380);
}

function handleNext(){
  curStep++;
  showStep(curStep);
}

function positionRing(el, step){
  var PAD = 9;
  // Nettoyage
  document.querySelectorAll('.itut-ring-extra,.itut-hole-extra').forEach(function(r){ r.remove(); });

  // Multi-targets (ex: deux boutons)
  if(step && step.targetMulti){
    var els = step.targetMulti.map(function(s){ return document.querySelector(s); }).filter(Boolean);
    if(!els.length){ ringEl.style.display='none'; return; }
    els[0].scrollIntoView({behavior:'smooth', block:'nearest'});
    setTimeout(function(){
      els.forEach(function(e, idx){
        var r = e.getBoundingClientRect();
        var l=r.left-PAD, t=r.top-PAD, w=r.width+PAD*2, h=r.height+PAD*2;
        var ringStyle='position:fixed;left:'+l+'px;top:'+t+'px;width:'+w+'px;height:'+h+'px;display:block;z-index:3002;border-radius:14px;pointer-events:none;border:3px solid #a855f7;box-shadow:0 0 0 4px rgba(168,85,247,.25),0 0 25px rgba(168,85,247,.7);animation:itutPulse 1.1s ease-in-out infinite;';
        var holeStyle='position:fixed;left:'+l+'px;top:'+t+'px;width:'+w+'px;height:'+h+'px;z-index:3001;pointer-events:auto;background:transparent;border-radius:12px;cursor:pointer;';
        if(idx === 0){
          ringEl.style.cssText = ringStyle;
          holeEl.style.cssText = holeStyle;
          holeEl.onclick = (function(target){ return function(ev){ ev.stopPropagation(); target.click(); }; })(e);
        } else {
          var er = document.createElement('div');
          er.className = 'itut-ring-extra';
          er.style.cssText = ringStyle;
          document.body.appendChild(er);
          var eh = document.createElement('div');
          eh.className = 'itut-hole-extra';
          eh.style.cssText = holeStyle;
          var capturedEl = e;
          eh.onclick = (function(target){ return function(ev){ ev.stopPropagation(); target.click(); }; })(capturedEl);
          document.body.appendChild(eh);
        }
      });
    }, 240);
    return;
  }

  if(!el){ ringEl.style.display='none'; holeEl.style.cssText='width:0;height:0;'; return; }
  el.scrollIntoView({behavior:'smooth', block:'nearest'});
  setTimeout(function(){
    var r = el.getBoundingClientRect();
    var l=r.left-PAD, t=r.top-PAD, w=r.width+PAD*2, h=r.height+PAD*2;
    ringEl.style.cssText='position:fixed;left:'+l+'px;top:'+t+'px;width:'+w+'px;height:'+h+'px;display:block;border-radius:14px;z-index:3002;pointer-events:none;border:3px solid #a855f7;box-shadow:0 0 0 4px rgba(168,85,247,.25),0 0 25px rgba(168,85,247,.7);animation:itutPulse 1.1s ease-in-out infinite;';
    holeEl.style.cssText='position:fixed;left:'+l+'px;top:'+t+'px;width:'+w+'px;height:'+h+'px;z-index:3001;pointer-events:auto;background:transparent;border-radius:12px;cursor:pointer;';
    // Forward clicks from hole to the real element
    holeEl.onclick = function(e){ e.stopPropagation(); el.click(); };
  }, 220);
}

function positionBubble(el, step, i){
  bubbleEl.style.display='block';
  document.getElementById('itut-title').textContent = step.title;
  document.getElementById('itut-text').innerHTML   = step.text;

  // Lire le texte à voix haute
  speakText(step.title + '. ' + step.text);

  var vw=window.innerWidth, vh=window.innerHeight;
  var isMobile = vw < 600;
  var BW = isMobile ? Math.min(vw - 20, 300) : 330;
  var BH = isMobile ? 190 : 240;
  bubbleEl.style.width = BW + 'px';
  var left, top;
  if(!el){
    left = vw/2 - BW/2; top = vh/2 - BH/2;
  } else {
    var r = el.getBoundingClientRect();
    var PAD = isMobile ? 10 : 18;
    // Try below first
    if(r.bottom + BH + PAD < vh){
      top = r.bottom + PAD;
      left = Math.max(10, Math.min(r.left, vw-BW-10));
    }
    // Try above
    else if(r.top - BH - PAD > 0){
      top = r.top - BH - PAD;
      left = Math.max(10, Math.min(r.left, vw-BW-10));
    }
    // Try right side (desktop only)
    else if(!isMobile && r.right + BW + PAD < vw){
      left = r.right + PAD;
      top = Math.max(10, Math.min(r.top + r.height/2 - BH/2, vh-BH-10));
    }
    // Fallback: bottom of screen, centered
    else {
      left = vw/2 - BW/2;
      top = vh - BH - 10;
    }
  }
  bubbleEl.style.left = Math.max(10, Math.min(left, vw-BW-10)) + 'px';
  bubbleEl.style.top  = Math.max(10, Math.min(top,  vh-BH-10)) + 'px';
}

function updateProgress(i){
  var prog = document.getElementById('itut-progress');
  var html = '';
  for(var j=0; j<STEPS.length; j++){
    var cls = 'itut-dot';
    if(j < i) cls += ' done';
    else if(j === i) cls += ' active';
    html += '<div class="'+cls+'"></div>';
  }
  prog.innerHTML = html;
}

function simulateCursorClick(selector, callback){
  var el = selector ? document.querySelector(selector) : null;
  if(!el){ callback(); return; }
  var r = el.getBoundingClientRect();
  var cx = r.left + r.width/2, cy = r.top + r.height/2;
  var isMobile = window.innerWidth < 600;
  cursorEl.style.width  = isMobile ? '36px' : '26px';
  cursorEl.style.height = isMobile ? '36px' : '26px';
  cursorEl.style.display = 'block';
  cursorEl.classList.remove('clicking');
  cursorEl.style.transition = 'none';
  cursorEl.style.left = (cx + 120) + 'px';
  cursorEl.style.top  = (cy + 80) + 'px';
  setTimeout(function(){
    cursorEl.style.transition = 'left .9s cubic-bezier(.4,0,.2,1), top .9s cubic-bezier(.4,0,.2,1)';
    cursorEl.style.left = cx + 'px';
    cursorEl.style.top  = cy + 'px';
    setTimeout(function(){
      cursorEl.classList.add('clicking');
      setTimeout(function(){
        cursorEl.style.display = 'none';
        cursorEl.classList.remove('clicking');
        callback();
      }, 450);
    }, 950);
  }, 60);
}

window.openTuto = function(){};
localStorage.setItem('wf_itut_done','1');

})();

// compat stubs
function closeTuto(){ if(window.endTutorial) window.endTutorial(); }
function nextTuto(){}
function skipTutorial(){ if(window.endTutorial) window.endTutorial(); showScreen('screen-welcome'); }
function showTutorialStep(){}
var isTutorialActive=false, tutorialStep=0, tutorialGpsChosen=false;

document.addEventListener("DOMContentLoaded",function(){
  var startBtn=document.getElementById("start-tutorial-btn");
  var skipBtn2=document.getElementById("skip-tutorial-btn");
  var backLegalBtn=document.getElementById("back-legal-btn");
  if(startBtn)startBtn.onclick=window.startTutorial;
  if(skipBtn2)skipBtn2.onclick=skipTutorial;
  if(backLegalBtn)backLegalBtn.onclick=function(){showScreen("screen-welcome");};
  var allButtons=document.querySelectorAll(".fb");
  allButtons.forEach(function(btn){
    // Tous les boutons sont actifs
  });
});

function showScreen(id){
  document.querySelectorAll(".screen").forEach(function(s){s.classList.remove("active");});
  var sc=document.getElementById(id);
  if(sc) sc.classList.add("active");
  window.scrollTo(0,0);
  var fab=document.getElementById("chat-fab");
  var fabR=document.getElementById("chat-fab-results");
  var cp=document.getElementById("chat-panel");
  if(id==="screen-full"){
    if(fab) fab.classList.add("visible");
    if(fabR) fabR.style.display="none";
    resetGpsBannerFull();
  }else if(id==="screen-results"){
    if(fab) fab.classList.remove("visible");
    if(cp) cp.classList.remove("open");
    if(fabR) fabR.style.display="flex";
  }else{
    if(fab) fab.classList.remove("visible");
    if(cp) cp.classList.remove("open");
    if(fabR) fabR.style.display="none";
    var cpr=document.getElementById("chat-panel-results");
    if(cpr) cpr.classList.remove("open");
  }
}

var chatOpenResults=false;
function toggleChatResults(){
  chatOpenResults=!chatOpenResults;
  var panel=document.getElementById("chat-panel-results");
  panel.classList.toggle("open",chatOpenResults);
  if(chatOpenResults){
    var msgs=document.getElementById("chat-messages-results");
    if(msgs&&!msgs.dataset.init){
      msgs.dataset.init="1";
      var div=document.createElement("div");
      div.className="chat-msg bot";
      div.innerHTML='<div class="chat-avatar">🐺</div><div class="chat-bubble">🐺 Bonjour ! Posez-moi vos questions sur les prix ou demandez des conseils pour économiser !</div>';
      msgs.appendChild(div);
      var qd=document.createElement("div");
      qd.className="chat-quick";
      qd.innerHTML='<button class="chat-quick-btn" onclick="askQuickR(\'meilleur_jour\')">📅 Quel jour acheter ?</button><button class="chat-quick-btn" onclick="askQuickR(\'tendance\')">📈 Tendance</button><button class="chat-quick-btn" onclick="askQuickR(\'region\')">🗺️ Ma région</button><button class="chat-quick-btn" onclick="askQuickR(\'astuces\')">💡 Astuces</button>';
      msgs.appendChild(qd);
      msgs.scrollTop=msgs.scrollHeight;
    }
  }
}
function askQuickR(type){askQuick(type,"chat-messages-results");}

// ==================== CHATBOT (réponses intelligentes sans API) ====================
let chatHistory = {};

function buildChatContext(){
  const reg = getRegionInfo();
  const isEV = cFuel === "EV";
  const fuel = FC[cFuel];
  let ctx = { region: reg, isEV, fuel, stats: null, evData: null };

  if(isEV && evStations.length > 0){
    const speeds = {rapide:0, semi:0, lente:0, inconnu:0};
    evStations.forEach(s => speeds[s.speedCat||"inconnu"]++);
    const totalPDC = evStations.reduce((a,s)=>a+s.nbrePDC,0);
    ctx.evData = { nb: evStations.length, totalPDC, speeds,
      closest: evStations.slice(0,3),
      gratuit: evStations.filter(s=>s.gratuit).length,
      h24: evStations.filter(s=>s.is24h).length
    };
  }

  if(!isEV && resStations.length > 0){
    const prices = resStations.filter(s=>s.price).map(s=>s.price).sort((a,b)=>a-b);
    if(prices.length){
      const avg = prices.reduce((a,b)=>a+b,0)/prices.length;
      const best = resStations.find(s=>s.price===prices[0]);
      const worst = resStations.find(s=>s.price===prices[prices.length-1]);
      ctx.stats = { min: prices[0], max: prices[prices.length-1], avg, nb: resStations.length, best, worst };
    }
  }
  return ctx;
}

function smartReply(type, ctx){
  const {region, isEV, fuel, stats, evData} = ctx;
  const rl = `<b>${esc(region.name)}</b>`;
  const day = new Date().getDay(); // 0=dim, 1=lun...
  const dayName = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'][day];

  if(type === "meilleur_jour"){
    let r = `📅 <b>Meilleur moment pour faire le plein</b><br><br>`;
    r += `Aujourd'hui c'est <b>${dayName}</b>. `;
    if(day===1||day===2) r += `🟢 Vous avez de la chance — <b>lundi et mardi</b> sont les jours les moins chers de la semaine !`;
    else if(day===5||day===6) r += `🔴 Mauvais timing — <b>vendredi et samedi</b> sont les plus chers. Si possible, attendez lundi.`;
    else if(day===0) r += `🟡 Dimanche est moyen. Les prix du lundi arrivent demain — bon moment pour attendre.`;
    else r += `🟡 Milieu de semaine — prix corrects. Les meilleurs jours restent lundi et mardi.`;
    r += `<br><br>📊 <b>Règle générale :</b><br>• 🟢 Lun-Mar = moins cher (-2 à 5 cts/L)<br>• 🟡 Mer-Jeu = prix moyens<br>• 🔴 Ven-Sam = le plus cher<br>• 🕐 Le matin avant 10h = prix de la veille parfois affiché`;
    if(stats) r += `<br><br>💡 En ce moment autour de ${rl} : <b>${stats.min.toFixed(3)}€</b> → <b>${stats.max.toFixed(3)}€</b>. Écart de <b>${((stats.max-stats.min)*50).toFixed(2)}€</b> sur un plein 50L !`;
    return r;
  }

  if(type === "tendance"){
    if(!stats) return `📈 <b>Tendance des prix</b><br><br>Lance d'abord une recherche pour que j'analyse les prix de ta zone !`;
    const level = stats.avg < 1.65 ? "🟢 bas" : stats.avg < 1.85 ? "🟡 dans la moyenne" : stats.avg < 2.0 ? "🟠 élevés" : "🔴 très élevés";
    let r = `📈 <b>Analyse des prix — ${rl}</b><br><br>`;
    r += `📊 <b>${stats.nb} stations</b> analysées :<br>`;
    r += `• 💚 Moins cher : <b>${stats.min.toFixed(3)} €</b> (${stats.best?.brand?.n||stats.best?.city||'station'})<br>`;
    r += `• 💛 Moyenne : <b>${stats.avg.toFixed(3)} €</b><br>`;
    r += `• 🔴 Plus cher : <b>${stats.max.toFixed(3)} €</b><br><br>`;
    r += `Les prix sont <b>${level}</b>. `;
    if(stats.avg < 1.65) r += `Bon moment pour faire le plein ! 🎉`;
    else if(stats.avg < 1.85) r += `Rien d'alarmant, mais comparez les stations.`;
    else r += `Privilégiez les <b>grandes surfaces</b> (Leclerc, Carrefour) qui sont généralement 5-10 cts moins chers.`;
    r += `<br><br>💰 Économie possible entre la moins chère et la plus chère : <b>${((stats.max-stats.min)*50).toFixed(2)} €</b> sur un plein 50L`;
    return r;
  }

  if(type === "meilleure"){
    if(!stats) return `🏆 Lance d'abord une recherche pour que j'identifie la meilleure station !`;
    const best = stats.best;
    let r = `🏆 <b>Meilleure station recommandée</b><br><br>`;
    r += `<b>${best?.brand?.n||best?.city||'Station'}</b> à <b>${best?.dist?.toFixed(1)||'?'} km</b><br>`;
    r += `Prix : <b style="color:#4ade80">${stats.min.toFixed(3)} €/L</b><br><br>`;
    r += `C'est <b>${((stats.avg-stats.min)*50).toFixed(2)} €</b> de moins qu'une station moyenne sur un plein 50L.<br><br>`;
    if(best?.dist > 10) r += `⚠️ Elle est à ${best.dist.toFixed(1)} km — vérifiez que le détour en vaut la peine selon votre consommation.`;
    else r += `✅ Distance raisonnable — le trajet ne mange pas l'économie réalisée.`;
    return r;
  }

  if(type === "comparer"){
    if(!stats) return `⚖️ Lance d'abord une recherche pour comparer les prix !`;
    // Prix moyens nationaux approximatifs
    const natAvg = {Gazole:1.72, SP95:1.82, SP98:1.92, E10:1.78, E85:0.82, GPLc:0.98};
    const ref = natAvg[cFuel] || 1.75;
    const diff = stats.avg - ref;
    let r = `⚖️ <b>Comparaison — ${rl} vs France</b><br><br>`;
    r += `📍 Prix moyen ici : <b>${stats.avg.toFixed(3)} €</b><br>`;
    r += `🇫🇷 Moyenne nationale : <b>~${ref.toFixed(3)} €</b><br>`;
    if(diff < -0.03) r += `<br>🟢 <b>Moins cher</b> que la moyenne nationale ! (${Math.abs(diff*100).toFixed(1)} cts de moins)`;
    else if(diff < 0.03) r += `<br>🟡 <b>Dans la moyenne</b> nationale.`;
    else r += `<br>🔴 <b>Plus cher</b> que la moyenne nationale (+${(diff*100).toFixed(1)} cts)`;
    r += `<br><br>💡 Meilleur prix trouvé : <b>${stats.min.toFixed(3)} €</b> — ${stats.min < ref ? 'en dessous' : 'au-dessus'} de la moyenne nationale.`;
    return r;
  }

  if(type === "region"){
    let r = `🗺️ <b>Conseils pour ${rl}</b><br><br>`;
    if(stats){
      r += `Sur <b>${stats.nb} stations</b> dans votre zone :<br>`;
      r += `• Écart de prix : <b>${((stats.max-stats.min)*100).toFixed(1)} cts/L</b><br>`;
      r += `• Économie max sur 50L : <b>${((stats.max-stats.min)*50).toFixed(2)} €</b><br><br>`;
    }
    r += `🛒 <b>Enseignes les moins chères :</b><br>• <b>E.Leclerc</b> — leader du moins cher en France<br>• <b>Costco</b> — imbattable (carte membre)<br>• <b>Carrefour / Système U</b> — bons prix réguliers<br><br>`;
    r += `⚠️ <b>À éviter :</b><br>• Autoroutes : +15 à 25 cts/L<br>• Petites stations indépendantes en ville<br><br>`;
    r += `💡 Activez le <b>GPS précis</b> (bouton en haut) pour des distances exactes !`;
    return r;
  }

  if(type === "astuces"){
    let r = `💡 <b>Astuces pour économiser sur le carburant</b><br><br>`;
    r += `<b>🗓️ Timing :</b><br>• Plein le <b>lundi ou mardi matin</b><br>• Évitez vendredi soir et samedi<br><br>`;
    r += `<b>📍 Lieu :</b><br>• Grandes surfaces = -5 à 10 cts/L<br>• Jamais en autoroute sauf urgence<br><br>`;
    r += `<b>🚗 Conduite :</b><br>• <b>110 km/h</b> au lieu de 130 = -20% conso<br>• Pneus gonflés = -3% conso<br>• Pas de clim en ville<br>• Anticipez les freinages<br>`;
    if(stats) r += `<br>💰 Rien qu'en choisissant la moins chère ici vous économisez <b>${((stats.max-stats.min)*50).toFixed(2)} €</b> par plein !`;
    if(!isEV && fuel?.l === "E10") r += `<br><br>🌿 <b>Astuce :</b> L'<b>E85</b> coûte ~0,80€/L si votre voiture est compatible (boîtier Flex-Fuel ~300€).`;
    return r;
  }

  // Réponses EV
  if(type === "ev_analyse"){
    if(!evData) return `🔍 Lance d'abord une recherche de bornes pour que j'analyse !`;
    let r = `🔍 <b>Analyse des bornes trouvées</b><br><br>`;
    r += `⚡ <b>${evData.nb} bornes</b> dans un rayon de 20km — <b>${evData.totalPDC} points de charge</b> au total.<br><br>`;
    r += `📊 <b>Répartition par vitesse :</b><br>`;
    r += `• ⚡⚡⚡ Rapides (≥50kW) : <b>${evData.speeds.rapide}</b><br>`;
    r += `• ⚡ Semi-rapides (22-49kW) : <b>${evData.speeds.semi}</b><br>`;
    r += `• 🔌 Lentes (<22kW) : <b>${evData.speeds.lente}</b><br><br>`;
    if(evData.gratuit > 0) r += `🆓 <b>${evData.gratuit} borne(s) gratuite(s)</b> dans votre zone !<br>`;
    if(evData.h24 > 0) r += `🌙 <b>${evData.h24} borne(s) ouvertes 24h/24</b><br>`;
    if(evData.closest.length){
      r += `<br>📍 <b>La plus proche :</b> ${evData.closest[0].nom||'Borne'} à <b>${evData.closest[0].dist.toFixed(1)} km</b>`;
      if(evData.closest[0].puissance) r += ` (${evData.closest[0].puissance}kW)`;
    }
    return r;
  }

  if(type === "ev_prises") return `🔌 <b>Types de prises en France</b><br><br><b>Type 2 (Mennekes)</b> — La standard européenne. AC jusqu'à 22kW. Compatible avec <b>99% des VE récents</b>.<br><br><b>CCS Combo 2</b> — Charge rapide DC jusqu'à 350kW. VW, Audi, BMW, Mercedes, Hyundai, Ford, Renault...<br><br><b>CHAdeMO</b> — Standard japonais. Nissan Leaf, Mitsubishi, Toyota.<br><br><b>Tesla</b> — Réseau propriétaire, désormais ouvert avec adaptateur.<br><br>💡 <b>Conseil :</b> Vérifiez votre Type 2 pour le quotidien, et le CCS pour les longs trajets !`;

  if(type === "ev_vitesse") return `⚡ <b>Vitesses de charge</b><br><br>🐢 <b>Lente (<7kW)</b> — Prise 220V. 8-12h pour un plein. Idéal la nuit à domicile.<br><br>🔌 <b>Normale (7-22kW)</b> — Borne publique standard. 3-8h. Bureau, parking.<br><br>⚡ <b>Semi-rapide (22-49kW)</b> — 1-3h. Centre commercial, supermarché.<br><br>⚡⚡ <b>Rapide (50-150kW)</b> — 20-60 min pour 80%. Autoroutes.<br><br>⚡⚡⚡ <b>Ultra-rapide (≥150kW)</b> — Ionity, Tesla SC. 15-25 min ! Top pour les longs trajets.<br><br>💡 Ne chargez pas au-delà de <b>80%</b> sur charge rapide — ça ralentit fortement après.`;

  if(type === "ev_cout") return `💶 <b>Coût de la recharge en France</b><br><br>🏠 <b>À domicile (HC)</b> — ~0,12 €/kWh. Zoé 52kWh = <b>6 €</b> le plein.<br><br>🔌 <b>Borne publique normale</b> — 0,25-0,45 €/kWh.<br><br>⚡ <b>Charge rapide</b> — 0,35-0,60 €/kWh.<br><br>⚡⚡⚡ <b>Ionity sans abonnement</b> — jusqu'à 0,79 €/kWh !<br><br>🆓 <b>Bornes gratuites</b> — Lidl, McDonald's, certains parkings.<br><br>🆚 <b>VE vs essence :</b> 100 km en VE = <b>2-4 €</b> · 100 km en thermique = <b>8-12 €</b><br>➡️ Économie : <b>60-75%</b> sur le carburant !`;

  if(type === "ev_astuces") return `💡 <b>Astuces conducteur VE</b><br><br><b>🔋 Batterie :</b><br>• Chargez entre <b>20% et 80%</b> au quotidien<br>• 100% seulement pour les longs trajets<br>• Préchauffez/refroidissez branché<br><br><b>⚡ Charge :</b><br>• Heures creuses EDF = facture /2<br>• Abonnement <b>Ionity Passport</b> ou <b>Freshmile</b> = -40%<br>• <b>ChargeMap Pass</b> = un badge pour tous les réseaux<br><br><b>🗺️ Trajet :</b><br>• App <b>ABRP</b> pour planifier avec bornes<br>• Chargez à 80% sur route — plus rapide que 80→100%<br>• La régénération en descente = quelques km gratuits !`;

  return `🐺 Je ne sais pas répondre à ça précisément, mais voici les sujets sur lesquels je peux t'aider :${isEV ? '<br>• Types de prises<br>• Vitesses de charge<br>• Coût de recharge<br>• Astuces VE' : '<br>• Meilleur jour pour faire le plein<br>• Tendance des prix<br>• Comparer avec la moyenne nationale<br>• Astuces économies'}`;
}

// Envoi message libre avec matching intelligent
async function sendChatFreeText(containerId, text){
  containerId = containerId||"chat-messages";
  document.querySelectorAll("#"+containerId+" .chat-quick").forEach(el=>el.remove());
  addMsg("user", text, containerId);
  addTyping(containerId);
  await new Promise(r=>setTimeout(r, 600+Math.random()*400));
  removeTyping(containerId);

  const ctx = buildChatContext();
  const lc = text.toLowerCase();
  let type = null;

  // Matching par mots-clés
  if(/jour|lundi|mardi|vendredi|samedi|semaine|quand faire/.test(lc)) type="meilleur_jour";
  else if(/tendance|évolution|hausse|baisse|historique/.test(lc)) type="tendance";
  else if(/meilleure? station|quelle station|laquelle|recommand/.test(lc)) type="meilleure";
  else if(/compar|moyenne|national|france/.test(lc)) type="comparer";
  else if(/région|region|conseil|autour|près|zone/.test(lc)) type="region";
  else if(/astuce|économie|économiser|reduire|moins cher/.test(lc)) type="astuces";
  else if(/prise|connecteur|type 2|ccs|chademo|compatible/.test(lc)) type="ev_prises";
  else if(/rapide|lente|kw|vitesse|durée|minutes|temps/.test(lc)) type="ev_vitesse";
  else if(/coût|cout|tarif|cher|combien|prix recharge/.test(lc)) type="ev_cout";
  else if(/batterie|astuce|conseil ve|conseil ev/.test(lc)) type="ev_astuces";
  else if(/analyse|résultat|bornes|stations/.test(lc)) type = ctx.isEV ? "ev_analyse" : "tendance";
  else type = ctx.isEV ? "ev_analyse" : "tendance";

  const reply = smartReply(type, ctx);
  addMsg("bot", reply, containerId);
  setTimeout(()=>addQuickBtns(containerId), 300);
}

function askQuick(type, containerId){
  containerId = containerId||"chat-messages";
  document.querySelectorAll("#"+containerId+" .chat-quick").forEach(el=>el.remove());
  const labels={
    "meilleur_jour":"📅 Quel jour faire le plein ?","tendance":"📈 Tendance des prix ici",
    "meilleure":"🏆 Quelle station choisir ?","comparer":"⚖️ Comparer avec la France",
    "region":"🗺️ Conseils pour ma région","astuces":"💡 Astuces économies",
    "ev_prises":"🔌 Types de prises","ev_vitesse":"⚡ Rapide vs lente",
    "ev_cout":"💶 Coût de la recharge","ev_astuces":"💡 Astuces VE","ev_analyse":"🔍 Analyser les bornes"
  };
  addMsg("user", labels[type]||type, containerId);
  addTyping(containerId);
  setTimeout(async()=>{
    removeTyping(containerId);
    const ctx = buildChatContext();
    const reply = smartReply(type, ctx);
    addMsg("bot", reply, containerId);
    setTimeout(()=>addQuickBtns(containerId), 300);
  }, 500+Math.random()*400);
}

function askQuickR(type){ askQuick(type, "chat-messages-results"); }

async function sendChatResults(){
  const inp=document.getElementById("chat-input-results");
  const text=(inp.value||"").trim();
  if(!text)return;
  inp.value="";
  sendChatFreeText("chat-messages-results", text);
}

const _csr=document.getElementById("chat-send-results");if(_csr)_csr.addEventListener("click",sendChatResults);
const _cir=document.getElementById("chat-input-results");if(_cir)_cir.addEventListener("keydown",function(e){if(e.key==="Enter")sendChatResults();});

function showLegal(){
  if(window.endTutorial) window.endTutorial();
  showScreen("screen-legal");
}
