'use strict';
/* ================= Utils ================= */
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,TAU=Math.PI*2;
const rand=(a,b)=>a+Math.random()*(b-a),pick=a=>a[(Math.random()*a.length)|0];
const dist2=(ax,az,bx,bz)=>(ax-bx)*(ax-bx)+(az-bz)*(az-bz);
function angDiff(a,b){let d=b-a;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;return d}
function mulberry(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let x=Math.imul(a^a>>>15,1|a);x=x+Math.imul(x^x>>>7,61|x)^x;return((x^x>>>14)>>>0)/4294967296}}
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
const todayKey=()=>new Date().toISOString().slice(0,10);
const yesterdayKey=()=>new Date(Date.now()-864e5).toISOString().slice(0,10);
const IS_TOUCH=('ontouchstart' in window)||navigator.maxTouchPoints>0;

/* ================= Platform SDK (CrazyGames) with safe fallback ================= */
let CG=null,sdkOK=false,sysMute=false,adMute=false;
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s);setTimeout(()=>rej(new Error('timeout')),4000)})}
async function initSDK(){
  try{await loadScript('https://sdk.crazygames.com/crazygames-sdk-v3.js');await window.CrazyGames.SDK.init();CG=window.CrazyGames.SDK;sdkOK=CG.environment!=='disabled';if(!sdkOK)CG=null}catch(e){CG=null;sdkOK=false}
  if(sdkOK){
    try{const r=CG.data.getItem('banderazo_save');if(r){S=parseSave(r);afterLoad()}}catch(e){}
    try{CG.game.addSettingsChangeListener&&CG.game.addSettingsChangeListener(s=>{if(s&&s.muteAudio!==undefined){sysMute=!!s.muteAudio;applyVolume()}});if(CG.game.settings&&CG.game.settings.muteAudio){sysMute=true;applyVolume()}}catch(e){}
  }
}
const Store={
  get(k){try{if(sdkOK&&CG&&CG.data)return CG.data.getItem(k)}catch(e){}try{return localStorage.getItem(k)}catch(e){return null}},
  set(k,v){try{if(sdkOK&&CG&&CG.data){CG.data.setItem(k,v);return}}catch(e){}try{localStorage.setItem(k,v)}catch(e){}}
};
const gp={start(){try{sdkOK&&CG.game.gameplayStart()}catch(e){}},stop(){try{sdkOK&&CG.game.gameplayStop()}catch(e){}},happy(){try{sdkOK&&CG.game.happytime()}catch(e){}}};

/* ================= Catalog / progression ================= */
const CAT=[
 {id:'hat_party',type:'hat',name:'Gorro de fiesta',price:150,ic:'🎉'},
 {id:'hat_helm',type:'hat',name:'Casco de lata',price:400,ic:'⛑'},
 {id:'hat_horns',type:'hat',name:'Cuernos',price:900,ic:'😈'},
 {id:'hat_prop',type:'hat',name:'Helice',price:1200,ic:'🚁'},
 {id:'hat_crown',type:'hat',name:'Corona',price:2500,ic:'👑'},
 {id:'pack_red',type:'pack',name:'Mochila roja',price:200,ic:'🎒',col:0xd63a3a},
 {id:'pack_pink',type:'pack',name:'Mochila rosa',price:300,ic:'🎒',col:0xff7fb5},
 {id:'pack_gold',type:'pack',name:'Mochila dorada',price:1500,ic:'🎒',col:0xf0b020},
 {id:'trail_bubble',type:'trail',name:'Estela de burbujas',price:600,ic:'🫧',col:0x9fe8ff},
 {id:'trail_fire',type:'trail',name:'Estela de fuego',price:3000,ic:'🔥',col:0xff7a2a},
 {id:'trail_star',type:'trail',name:'Estela de estrellas',price:4500,ic:'⭐',col:0xffe45a},
 // desbloqueo por nivel (no se compran)
 {id:'pack_green',type:'pack',name:'Mochila verde',lvl:3,ic:'🎒',col:0x43c43d},
 {id:'trail_spark',type:'trail',name:'Estela de chispas',lvl:8,ic:'✨',col:0xfff2a0},
 {id:'hat_recruit',type:'hat',name:'Gorro Recluta',lvl:10,ic:'🧢'},
 {id:'hat_epic',type:'hat',name:'Casco epico',lvl:20,ic:'🤴'},
 {id:'trail_gold',type:'trail',name:'Estela dorada',lvl:30,ic:'🌟',col:0xffc400}
];
const catById=id=>CAT.find(c=>c.id===id);
const LEAGUES=['Carton','Madera','Pintura','Cromo','Cristal','Corona','Leyenda de la Caja'];
const LCOL=['#c9a26a','#a8743a','#e0508a','#9aa7c0','#7fe3ff','#ffd23f','#ff6af0'];
const xpNeed=l=>300+80*(l-1);
const MISSIONS=[
 {id:'play2',text:'Juega 2 partidas',n:2,stat:'games'},{id:'ret1',text:'Devuelve una bandera',n:1,stat:'rets'},
 {id:'coin30',text:'Recoge 30 monedas del mapa',n:30,stat:'coins'},{id:'win1',text:'Gana una partida',n:1,stat:'wins'},
 {id:'as3',text:'Da 3 asistencias',n:3,stat:'assists'},{id:'carry90',text:'Lleva la bandera 90 segundos',n:90,stat:'carryTime'},
 {id:'loot2',text:'Recoge 2 objetos raros',n:2,stat:'loot'},{id:'cap1',text:'Captura una bandera',n:1,stat:'caps'}
];
const STREAK=[100,150,200,250,300,400,800];
const WEAPONS={
 sword:{name:'Espada',ic:'⚔',desc:'Rapida y movil. Dash largo.',role:'Corredor'},
 spear:{name:'Lanza',ic:'🔱',desc:'Largo alcance. Control de pasillos.',role:'Defensor'},
 xbow:{name:'Ballesta',ic:'🏹',desc:'Dispara a distancia y frena.',role:'Apoyo'}
};

/* ================= Save ================= */
const defSave=()=>({v:1,coins:300,xp:0,level:1,own:{},eq:{hat:'',pack:'',trail:''},weapon:'sword',
  st:{games:0,wins:0,caps:0,rets:0,assists:0,loot:0,coins:0,carryTime:0,kills:0,streak:0,bestStreak:0},
  rank:{pts:0,placed:0,pw:0,best:0},daily:{date:'',missions:[],prog:{},claimed:{},firstWin:false,chest:false},login:{last:'',streak:0},snd:1});
function parseSave(r){try{const o=JSON.parse(r),d=defSave();const s=Object.assign(d,o);s.st=Object.assign(defSave().st,o.st||{});s.rank=Object.assign(defSave().rank,o.rank||{});s.eq=Object.assign(defSave().eq,o.eq||{});s.daily=Object.assign(defSave().daily,o.daily||{});s.login=Object.assign(defSave().login,o.login||{});if(!Number.isFinite(s.coins))s.coins=0;if(!Number.isFinite(s.xp))s.xp=0;return s}catch(e){return defSave()}}
let S=parseSave(Store.get('banderazo_save'));
function save(){if(!Number.isFinite(S.coins))S.coins=0;Store.set('banderazo_save',JSON.stringify(S))}
function owns(id){const c=catById(id);return !!c&&(S.own[id]||(c.lvl&&S.level>=c.lvl))}
function checkDaily(){
  const k=todayKey();let newDay=false;
  if(S.daily.date!==k){
    const r=mulberry(hashStr('banderazo'+k)),pool=MISSIONS.slice(),ms=[];
    for(let i=0;i<3;i++){ms.push(pool.splice((r()*pool.length)|0,1)[0].id)}
    S.daily={date:k,missions:ms,prog:{},claimed:{},firstWin:false,chest:false};newDay=true;
    if(S.login.last===yesterdayKey())S.login.streak=Math.min(7,S.login.streak+1);else S.login.streak=1;
    S.login.last=k;
  }
  return newDay;
}
checkDaily();
function addXP(n){
  S.xp+=n;const ups=[];
  while(S.level<50&&S.xp>=xpNeed(S.level)){S.xp-=xpNeed(S.level);S.level++;const c=100+20*S.level;S.coins+=c;ups.push({lvl:S.level,coins:c,unlock:CAT.filter(x=>x.lvl===S.level)})}
  if(S.level>=50)S.xp=Math.min(S.xp,xpNeed(49));
  return ups;
}
function rankInfo(){
  const r=S.rank;if(r.placed<5)return{name:'Colocacion '+r.placed+'/5',col:'#fff',idx:-1};
  const i=Math.min(6,Math.floor(r.pts/100));return{name:LEAGUES[i],col:LCOL[i],idx:i};
}

/* ================= Audio ================= */
let AC=null,master=null,musicTimer=null,noteI=0,noiseBuf=null;
function applyVolume(){if(master)master.gain.value=(S.snd&&!sysMute&&!adMute)?0.7:0}
function audioInit(){if(AC){if(AC.state==='suspended')AC.resume();return}try{AC=new(window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.connect(AC.destination);applyVolume();startMusic()}catch(e){AC=null}}
function tone(f,d,type,v,slide,delay){
  if(!AC||!S.snd||sysMute||adMute)return;
  const tt=AC.currentTime+(delay||0),o=AC.createOscillator(),g=AC.createGain();
  o.type=type||'sine';o.frequency.setValueAtTime(f,tt);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),tt+d);
  g.gain.setValueAtTime(0.0001,tt);g.gain.exponentialRampToValueAtTime(v||.2,tt+.012);g.gain.exponentialRampToValueAtTime(0.0001,tt+d);
  o.connect(g);g.connect(master);o.start(tt);o.stop(tt+d+.05);
}
function noise(d,v,f,delay){
  if(!AC||!S.snd||sysMute||adMute)return;
  if(!noiseBuf){noiseBuf=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const a=noiseBuf.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1}
  const tt=AC.currentTime+(delay||0),s=AC.createBufferSource(),b=AC.createBiquadFilter(),g=AC.createGain();
  s.buffer=noiseBuf;b.type='bandpass';b.frequency.value=f||1200;g.gain.setValueAtTime(v||.15,tt);g.gain.exponentialRampToValueAtTime(0.0001,tt+d);
  s.connect(b);b.connect(g);g.connect(master);s.start(tt);s.stop(tt+d+.02);
}
let lastSfx={};
const sfx=(()=>{
  const g=(k,fn,gap)=>(...a)=>{const n=performance.now();if(lastSfx[k]&&n-lastSfx[k]<(gap||40))return;lastSfx[k]=n;fn(...a)};
  return{
    swing:g('sw',()=>{noise(.14,.14,1800);tone(300,.12,'triangle',.07,300)}),
    hit:g('hit',()=>{noise(.1,.25,900);tone(160,.12,'square',.12,-80)}),
    shoot:g('sh',()=>{tone(700,.12,'sawtooth',.08,-400);noise(.08,.1,3000)}),
    dash:g('da',()=>{noise(.2,.16,1400);tone(250,.15,'sine',.1,500)}),
    jump:g('ju',()=>tone(300,.14,'sine',.12,350)),
    coin:g('co',()=>{tone(988,.08,'triangle',.12);tone(1319,.12,'triangle',.12,0,.06)},20),
    flag:()=>{[523,659,784].forEach((f,i)=>tone(f,.15,'triangle',.16,0,i*.08))},
    cap:()=>{[523,659,784,1047,1319].forEach((f,i)=>tone(f,.2,'triangle',.18,0,i*.09))},
    ret:()=>{[784,659,784].forEach((f,i)=>tone(f,.12,'triangle',.15,0,i*.07))},
    lose:()=>{[392,330,262].forEach((f,i)=>tone(f,.3,'triangle',.16,0,i*.18))},
    pop:g('po',()=>{noise(.2,.2,700);tone(220,.2,'sine',.15,-100)}),
    item:()=>{tone(600,.1,'triangle',.14);tone(900,.18,'triangle',.14,0,.08)},
    ui:()=>tone(600,.07,'triangle',.1),
    buy:()=>{[523,659,784,1047].forEach((f,i)=>tone(f,.14,'triangle',.15,0,i*.07))},
    err:()=>tone(160,.2,'square',.1),
    beep:()=>tone(880,.12,'square',.1),
    go:()=>tone(1320,.35,'square',.1)
  };
})();
function startMusic(){
  if(musicTimer)return;
  const sc=[0,2,4,7,9,12],root=196,seq=[0,2,4,5,4,2,1,3,0,2,4,2,3,1,2,0];
  musicTimer=setInterval(()=>{
    if(!AC||!S.snd||sysMute||adMute)return;
    const i=noteI++,n=seq[i%seq.length];
    tone(root*Math.pow(2,sc[n]/12),.35,'triangle',.035,0);
    if(i%4===0)tone(root/2*Math.pow(2,[0,-3,-5,-2][(i>>2)%4]/12),.9,'sine',.05,0);
  },240);
}

/* ================= Ads ================= */
let adBusy=false;
function showAd(type,done){
  if(adBusy){done(false);return}
  adBusy=true;gp.stop();
  const fin=ok=>{adBusy=false;adMute=false;applyVolume();$('ad').classList.add('hide');done(ok)};
  if(sdkOK&&CG){try{CG.ad.requestAd(type,{adStarted:()=>{adMute=true;applyVolume()},adFinished:()=>fin(true),adError:()=>fin(false)})}catch(e){fin(false)}}
  else{
    adMute=true;applyVolume();$('ad').classList.remove('hide');
    const bar=$('adbar').firstElementChild;bar.style.width='0';const t0=performance.now(),D=type==='rewarded'?2200:1200;
    const iv=setInterval(()=>{const p=(performance.now()-t0)/D;bar.style.width=Math.min(100,p*100)+'%';if(p>=1){clearInterval(iv);fin(true)}},50);
  }
}
let toastT=0;
function toastG(m){const e=$('toastG');e.textContent=m;e.style.opacity=1;clearTimeout(toastT);toastT=setTimeout(()=>e.style.opacity=0,2000)}
