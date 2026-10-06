/* ================= Camera & input ================= */
let camYaw=-Math.PI/2,camPitch=.45,camDist=6.8,locked=false,lobbyT=0;
const keys={},touch={joy:{active:false,x:0,y:0,id:-1},cam:{id:-1,x:0,y:0},atk:false,jump:false,dash:false,use:false};
let mouseAtk=false,mouseDash=false,arrowRot=0;
function inMatch(){return G.state==='play'||G.state==='count'}
addEventListener('keydown',e=>{
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code))e.preventDefault();
  audioInit();keys[e.code]=true;
  if(e.code==='KeyE')keys._use=true;
  if(e.code==='Enter'&&G.state==='over'&&!$('end').classList.contains('hide'))$('eAgain').click();
});
addEventListener('keyup',e=>{keys[e.code]=false});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouseAtk=false});
canvas.addEventListener('mousedown',e=>{
  audioInit();
  if(!inMatch()||IS_TOUCH)return;
  if(!locked){canvas.requestPointerLock&&canvas.requestPointerLock();return}
  if(e.button===0)mouseAtk=true;else if(e.button===2)mouseDash=true;
});
addEventListener('mouseup',e=>{if(e.button===0)mouseAtk=false;if(e.button===2)mouseDash=false});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===canvas;$('lock').classList.toggle('hide',locked||!inMatch()||IS_TOUCH)});
document.addEventListener('mousemove',e=>{if(locked){camYaw-=e.movementX*.0024;camPitch=clamp(camPitch+e.movementY*.002,.1,1.25)}});
// touch: camera drag
canvas.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse')return;audioInit();
  if(e.clientX>innerWidth*.35&&touch.cam.id<0){touch.cam.id=e.pointerId;touch.cam.x=e.clientX;touch.cam.y=e.clientY;try{canvas.setPointerCapture(e.pointerId)}catch(_){}}
});
canvas.addEventListener('pointermove',e=>{
  if(e.pointerId===touch.cam.id){camYaw-=(e.clientX-touch.cam.x)*.0065;camPitch=clamp(camPitch+(e.clientY-touch.cam.y)*.004,.1,1.25);touch.cam.x=e.clientX;touch.cam.y=e.clientY}
});
const upCam=e=>{if(e.pointerId===touch.cam.id)touch.cam.id=-1};
canvas.addEventListener('pointerup',upCam);canvas.addEventListener('pointercancel',upCam);
// touch: joystick
{
  const joy=$('joy'),knob=$('knob');
  const set=e=>{const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,R=r.width/2;let dx=e.clientX-cx,dy=e.clientY-cy;const l=Math.hypot(dx,dy);if(l>R){dx=dx/l*R;dy=dy/l*R}
    touch.joy.x=dx/R;touch.joy.y=dy/R;knob.style.transform=`translate(${dx}px,${dy}px)`};
  joy.addEventListener('pointerdown',e=>{audioInit();touch.joy.id=e.pointerId;touch.joy.active=true;joy.setPointerCapture(e.pointerId);set(e)});
  joy.addEventListener('pointermove',e=>{if(e.pointerId===touch.joy.id)set(e)});
  const end=e=>{if(e.pointerId===touch.joy.id){touch.joy.active=false;touch.joy.id=-1;touch.joy.x=touch.joy.y=0;knob.style.transform=''}};
  joy.addEventListener('pointerup',end);joy.addEventListener('pointercancel',end);
  const hold=(id,k)=>{const el=$(id);el.addEventListener('pointerdown',e=>{audioInit();touch[k]=true;try{el.setPointerCapture(e.pointerId)}catch(_){}});const up=()=>{touch[k]=false};el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up)};
  hold('tAtk','atk');hold('tJump','jump');hold('tDash','dash');hold('tUse','use');
}
function readPlayerInput(dt){
  const p=G.player;if(!p)return;
  if(keys.ArrowLeft)camYaw+=dt*2.2;if(keys.ArrowRight)camYaw-=dt*2.2;
  if(keys.ArrowUp)camPitch=clamp(camPitch-dt*1.2,.1,1.25);if(keys.ArrowDown)camPitch=clamp(camPitch+dt*1.2,.1,1.25);
  let ix=0,iz=0;
  if(keys.KeyW)iz+=1;if(keys.KeyS)iz-=1;if(keys.KeyD)ix+=1;if(keys.KeyA)ix-=1;
  if(touch.joy.active){ix=touch.joy.x;iz=-touch.joy.y}
  const l=Math.hypot(ix,iz);if(l>1){ix/=l;iz/=l}
  const s=Math.sin(camYaw),c=Math.cos(camYaw);
  p.in.mx=ix*c+iz*(-s);p.in.mz=ix*(-s)+iz*(-c);
  p.in.aimYaw=Math.atan2(-s,-c);
  p.in.jump=!!(keys.Space||touch.jump);
  p.in.atk=!!(mouseAtk||keys.KeyF||touch.atk);
  p.in.dash=!!(keys.ShiftLeft||keys.ShiftRight||mouseDash||touch.dash);
  if(keys._use||touch.use){p.in.use=true;keys._use=false;touch.use=false}
  if(G.state!=='play'){p.in.atk=false;p.in.dash=false;p.in.use=false}
}
function updateCamera(dt){
  let tx,ty,tz;
  if(G.state==='lobby'||G.state==='search'){
    lobbyT+=dt*.18;const h=lobbyHero.root.position;
    tx=h.x;ty=h.y+1.0;tz=h.z;
    const a=-Math.PI/2+Math.sin(lobbyT)*.5-.15;
    camera.position.set(tx+Math.cos(a)*5.2+1.2,ty+1.1,tz-Math.sin(a)*5.2);camera.lookAt(tx+.3,ty+.15,tz);
    sun.target.position.set(tx,0,tz);sun.position.set(tx+30,50,tz+20);
    return;
  }
  const p=G.player;if(!p)return;
  tx=p.x;ty=p.y+1.3;tz=p.z;
  if(G.state==='over'||G.state==='end'){camYaw+=dt*.15}
  const cp=Math.cos(camPitch);
  let d=camDist;
  const px=tx+Math.sin(camYaw)*cp*d,py=ty+Math.sin(camPitch)*d,pz=tz+Math.cos(camYaw)*cp*d;
  const gmin=Math.max(groundAt(px,pz,ty),0)+.6;
  camera.position.x+=(px-camera.position.x)*Math.min(1,dt*18);camera.position.y+=(Math.max(py,gmin)-camera.position.y)*Math.min(1,dt*18);camera.position.z+=(pz-camera.position.z)*Math.min(1,dt*18);
  if(G.shake>0){G.shake=Math.max(0,G.shake-dt);camera.position.x+=rand(-.1,.1)*G.shake*3;camera.position.y+=rand(-.1,.1)*G.shake*3}
  camera.lookAt(tx,ty+.2,tz);
  sun.target.position.set(p.x,0,p.z);sun.position.set(p.x+30,50,p.z+20);
}

/* ================= HUD ================= */
let hudC={};
function setTxt(id,v){if(hudC[id]!==v){hudC[id]=v;$(id).textContent=v}}
function toast(m){const e=$('toast');e.textContent=m;e.style.opacity=1;clearTimeout(toast.h);toast.h=setTimeout(()=>e.style.opacity=0,1800)}
function bigToast(m,px){const e=$('toastBig');e.textContent=m;e.style.fontSize=((px||56)/10)+'rem';e.classList.remove('go');void e.offsetWidth;e.classList.add('go')}
const mini=$('mini'),mc=mini.getContext('2d');
function drawMini(){
  const W=340,sc=W/112,ox=W/2,oz=W/2;mc.clearRect(0,0,W,W);
  mc.fillStyle='#2a77b3';mc.fillRect(0,0,W,W);
  const X=x=>ox+x*sc,Z=z=>oz+z*sc;
  for(const r of WALK){mc.fillStyle=r.x1<-29?'#6f8fd8':r.x0>29?'#d88f84':r.t<.2&&(r.x1-r.x0)<14?'#a9763f':'#7cc757';mc.fillRect(X(r.x0),Z(r.z0),(r.x1-r.x0)*sc,(r.z1-r.z0)*sc)}
  mc.fillStyle='rgba(60,50,40,.6)';for(const s of SOLIDS){if(s.kind==='bld'||s.kind==='pillar')mc.fillRect(X(s.x0),Z(s.z0),(s.x1-s.x0)*sc,(s.z1-s.z0)*sc)}
  for(const f of G.flags){mc.fillStyle=f.team?'#ff3b3b':'#2f7bff';mc.strokeStyle='#fff';mc.lineWidth=3;mc.beginPath();mc.arc(X(f.x),Z(f.z),10,0,TAU);mc.fill();mc.stroke();mc.fillStyle='#fff';mc.font='bold 16px sans-serif';mc.textAlign='center';mc.fillText('⚑',X(f.x),Z(f.z)+5)}
  for(const e of G.ents){if(!e.alive)continue;mc.fillStyle=e.team?'#ff4a4a':'#4a9bff';mc.strokeStyle=e.isPlayer?'#fff':'rgba(0,0,0,.6)';mc.lineWidth=e.isPlayer?4:2;mc.beginPath();mc.arc(X(e.x),Z(e.z),e.isPlayer?9:7,0,TAU);mc.fill();mc.stroke();if(e.carry){mc.fillStyle='#ffd23f';mc.beginPath();mc.arc(X(e.x),Z(e.z),4,0,TAU);mc.fill()}}
  const p=G.player;if(p&&p.alive){mc.save();mc.translate(X(p.x),Z(p.z));mc.rotate(-Math.atan2(-Math.sin(camYaw),-Math.cos(camYaw))+Math.PI/2);mc.fillStyle='#fff';mc.beginPath();mc.moveTo(0,-16);mc.lineTo(7,-6);mc.lineTo(-7,-6);mc.fill();mc.restore()}
}
function objective(p){
  const own=G.flags[p.team],en=G.flags[1-p.team];
  if(p.carry)return own.state==='home'?'Lleva la bandera a tu base':'Tu bandera no está en base: recupérala';
  if(own.state==='carried')return '¡Recupera tu bandera!';
  if(own.state==='dropped')return 'Devuelve tu bandera tocándola';
  if(en.state==='carried')return 'Escolta a tu portador';
  if(en.state==='dropped')return 'Recoge la bandera enemiga';
  return 'Roba la bandera enemiga';
}
let miniT=0;
function updateHUD(dt){
  const p=G.player;if(!p)return;
  setTxt('sb0',G.score[0]);setTxt('sb1',G.score[1]);
  const tm=Math.max(0,Math.ceil(G.time));setTxt('stime',(G.ot?'+':'')+Math.floor(tm/60)+':'+String(tm%60).padStart(2,'0'));
  setTxt('obj',objective(p));
  let h='';for(let i=0;i<3;i++)h+=p.hp>i+.5?'❤️':(p.hp>i?'💔':'🖤');setTxt('hearts',h);
  $('cDash').firstElementChild.style.height=(p.cdD>0?Math.min(100,p.cdD/(p.weapon==='sword'?3.5:4.5)*100):0)+'%';
  const atkCd=p.weapon==='xbow'?(p.reload>0?p.reload/2.2:p.cdA/.7):(p.cdA>0?p.cdA/.8:0);
  $('cAtk').firstElementChild.style.height=Math.min(100,atkCd*100)+'%';
  $('cAtk').childNodes[0].textContent=p.weapon==='sword'?'⚔':p.weapon==='spear'?'🔱':'🏹'+(p.ammo>0?p.ammo:'');
  const it=p.item;$('cItem').childNodes[0].textContent=it?(it==='shield'?'🛡':'👟'):(p.shield>0?'🛡':p.boots>0?'👟':'•');
  $('cItem').style.borderColor=it?'#ffd23f':'rgba(255,255,255,.3)';
  setTxt('hCoinN',G.matchCoins||0);
  $('carry').classList.toggle('hide',!p.carry);
  if(!p.alive){$('dSub').textContent='Reaparece en '+Math.max(0,Math.ceil(p.respawn))+'...'}
  miniT-=dt;if(miniT<=0){miniT=.05;drawMini()}
  const f=G.hitFlash;if(f>0){G.hitFlash=Math.max(0,f-dt);$('hud').style.boxShadow='inset 0 0 '+(f*20)+'rem rgba(255,40,40,'+f+')'}else $('hud').style.boxShadow='none';
}
function uiDead(on){
  $('dead').classList.toggle('hide',!on);
  if(on){
    $('dTxt').textContent='¡Derrotado!';
    const w=$('dW');w.innerHTML='';
    for(const k of Object.keys(WEAPONS)){const b=document.createElement('button');b.className='btn sm'+(G.player.nextWeapon===k?' y':'');b.textContent=WEAPONS[k].ic+' '+WEAPONS[k].name;b.onclick=()=>{G.player.nextWeapon=k;S.weapon=k;save();uiDead(true);sfx.ui()};w.appendChild(b)}
  }
}

/* ================= Lobby / menus ================= */
let lobbyHero=null,pvEq=null,matchesPlayed=0;
function initHero(){
  lobbyHero=makeChar(0,'');lobbyHero.P.tag.visible=false;scene.add(lobbyHero.root);
  lobbyHero.root.position.set(-39.5,.5,1);lobbyHero.root.rotation.y=Math.PI*.15;
  refreshHero();
}
function refreshHero(){setWeaponGfx(lobbyHero,S.weapon);applyCosmetics(lobbyHero,pvEq||S.eq)}
function animHero(dt){
  const P=lobbyHero.P,t=performance.now()/1000;
  lobbyHero.body.position.y=Math.sin(t*2)*.03;
  P.armL.rotation.x=Math.sin(t*2)*.08;P.armR.rotation.x=-.9+Math.sin(t*2+1)*.06;
  const w=Math.sin(t*.7)>.93;P.armL.rotation.z=w?-2.4+Math.sin(t*14)*.4:0;if(w)P.armL.rotation.x=0;
  if(P.spinner)P.spinner.rotation.y+=dt*20;
  lobbyHero.root.rotation.y=Math.PI*.15+Math.sin(t*.4)*.2;
}
function showLobby(){
  G.state='lobby';gp.stop();clearMatch();
  for(const m of coinGfx)m.visible=false;
  for(const f of flagsGfx){f.g.visible=true}
  mkFlags();
  $('hud').classList.add('hide');$('touch').classList.add('hide');$('lobby').classList.remove('hide');$('end').classList.add('hide');$('search').classList.add('hide');
  if(document.exitPointerLock)document.exitPointerLock();
  lobbyHero.root.visible=true;pvEq=null;refreshHero();refreshLobby();
}
function refreshLobby(){
  const ri=rankInfo();
  $('pLvl').textContent='Nivel '+S.level;$('pRank').textContent=ri.name;$('pRank').style.color=ri.col;
  $('pXp').style.width=(S.level>=50?100:S.xp/xpNeed(S.level)*100)+'%';$('pXpT').textContent=S.level>=50?'MAX':S.xp+' / '+xpNeed(S.level)+' XP';
  $('pPlace').textContent=S.rank.placed<5?'':S.rank.pts+' pts';
  $('lCoins').textContent=S.coins;
  const w=$('wsel');w.innerHTML='';
  for(const k of Object.keys(WEAPONS)){const c=document.createElement('div');c.className='wcard'+(S.weapon===k?' on':'');c.innerHTML=`<div class="ic">${WEAPONS[k].ic}</div><div class="nm">${WEAPONS[k].name}</div><div class="ds">${WEAPONS[k].desc}</div>`;c.onclick=()=>{S.weapon=k;save();sfx.ui();refreshHero();refreshLobby()};w.appendChild(c)}
  const done=S.daily.missions.some(id=>{const m=MISSIONS.find(x=>x.id===id);return (S.daily.prog[m.stat]||0)>=m.n&&!S.daily.claimed[id]});
  $('misDot').textContent=done?'❗':'';
  $('bChest').textContent=S.daily.chest?'Cofre diario recogido':'🎁 Cofre diario gratis';$('bChest').disabled=S.daily.chest;
  $('bSnd').style.opacity=S.snd?1:.5;
}
function openModal(id){$(id).classList.remove('hide');sfx.ui()}
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>{$(b.dataset.close).classList.add('hide');pvEq=null;refreshHero();refreshLobby();sfx.ui()});
function renderShop(){
  $('shCoins').textContent=S.coins;const b=$('shBody');b.innerHTML='';const g=document.createElement('div');g.className='grid';
  const list=CAT.slice().sort((a,b)=>(a.lvl||0)-(b.lvl||0)||(a.price||0)-(b.price||0));
  for(const it of list){
    const own=owns(it.id),eq=S.eq[it.type]===it.id;
    const d=document.createElement('div');d.className='item';
    d.innerHTML=`<div class="pv">${it.ic}</div><div class="nm">${it.name}</div>`;
    const bt=document.createElement('button');bt.className='btn sm';
    if(own){bt.textContent=eq?'Quitar':'Equipar';bt.classList.add(eq?'r':'g');bt.onclick=()=>{S.eq[it.type]=eq?'':it.id;save();sfx.ui();pvEq=null;refreshHero();renderShop()}}
    else if(it.lvl){bt.textContent='Nivel '+it.lvl;bt.disabled=true}
    else{bt.innerHTML=`<i class="coin" style="width:1.8rem;height:1.8rem;vertical-align:middle"></i> ${it.price}`;bt.classList.add('y');bt.disabled=S.coins<it.price;bt.onclick=()=>{if(S.coins>=it.price){S.coins-=it.price;S.own[it.id]=1;S.eq[it.type]=it.id;save();sfx.buy();pvEq=null;refreshHero();renderShop();refreshLobby()}}}
    d.appendChild(bt);
    if(!own){const pb=document.createElement('button');pb.className='btn sm';pb.style.marginTop='.5rem';pb.textContent='Probar';pb.onclick=()=>{pvEq=Object.assign({},S.eq,{[it.type]:it.id});refreshHero();sfx.ui();$('shop').classList.add('hide');toastG('Vista previa...');setTimeout(()=>{pvEq=null;refreshHero();$('shop').classList.remove('hide')},3500)};d.appendChild(pb)}
    g.appendChild(d);
  }
  b.appendChild(g);
}
function renderMissions(){
  const b=$('misBody');b.innerHTML='';
  const hd=document.createElement('div');hd.className='mrow';hd.innerHTML=`<div class="tx">Racha de inicio: día ${S.login.streak}/7 &nbsp; ${STREAK.map((v,i)=>i<S.login.streak?'✅':'⬜').join('')}</div><div>Siguiente: ${STREAK[Math.min(6,S.login.streak)]} monedas</div>`;b.appendChild(hd);
  for(const id of S.daily.missions){
    const m=MISSIONS.find(x=>x.id===id),pr=Math.min(m.n,S.daily.prog[m.stat]||0),done=pr>=m.n,cl=S.daily.claimed[id];
    const r=document.createElement('div');r.className='mrow';
    r.innerHTML=`<div class="tx">${m.text}<div class="bar"><div style="width:${pr/m.n*100}%"></div></div><small>${pr}/${m.n} · +200 monedas +250 XP</small></div>`;
    const bt=document.createElement('button');bt.className='btn sm '+(done&&!cl?'g':'');bt.textContent=cl?'Hecho':done?'Reclamar':'En curso';bt.disabled=!done||cl;
    bt.onclick=()=>{S.daily.claimed[id]=1;S.coins+=200;const ups=addXP(250);save();sfx.buy();renderMissions();refreshLobby();if(ups.length)toastG('¡Nivel '+S.level+'!')};
    r.appendChild(bt);b.appendChild(r);
  }
}
function renderProfile(){
  const s=S.st,ri=rankInfo(),wr=s.games?Math.round(s.wins/s.games*100):0;
  $('prfBody').innerHTML=`<div class="stats">
   <div><span>Nivel</span><b>${S.level}</b></div><div><span>Rango</span><b style="color:${ri.col}">${ri.name}${S.rank.placed>=5?' ('+S.rank.pts+')':''}</b></div>
   <div><span>Partidas</span><b>${s.games}</b></div><div><span>Victorias</span><b>${s.wins} (${wr}%)</b></div>
   <div><span>Banderas capturadas</span><b>${s.caps}</b></div><div><span>Banderas devueltas</span><b>${s.rets}</b></div>
   <div><span>Asistencias</span><b>${s.assists}</b></div><div><span>Objetos raros</span><b>${s.loot}</b></div>
   <div><span>Mejor racha de victorias</span><b>${s.bestStreak}</b></div><div><span>Tiempo llevando bandera</span><b>${Math.floor(s.carryTime/60)}m ${Math.floor(s.carryTime%60)}s</b></div>
   <div><span>Mejor rango</span><b>${S.rank.best>=0&&S.rank.placed>=5?LEAGUES[Math.min(6,Math.floor(S.rank.best/100))]:'-'}</b></div><div><span>Monedas</span><b>${S.coins}</b></div></div>
   <p style="font-size:1.8rem;opacity:.8">Las partidas son contra jugadores simulados (bots) hasta que haya un servidor online.</p>`;
}
$('bShop').onclick=()=>{renderShop();openModal('shop')};
$('bMis').onclick=()=>{renderMissions();openModal('mis')};
$('bProf').onclick=()=>{renderProfile();openModal('prf')};
$('bSnd').onclick=()=>{S.snd=S.snd?0:1;save();applyVolume();refreshLobby();if(S.snd){audioInit();sfx.ui()}};
$('bChest').onclick=()=>{if(S.daily.chest)return;S.daily.chest=true;S.coins+=150+S.login.streak*10;save();sfx.buy();toastG('+'+(150+S.login.streak*10)+' monedas');refreshLobby()};

/* ================= Matchmaking (simulated) ================= */
let searchTimers=[];
function startSearch(){
  audioInit();sfx.ui();
  const go=()=>{
    $('lobby').classList.add('hide');$('search').classList.remove('hide');G.state='search';lobbyHero.root.visible=true;
    const names=[];const pool=NAMES.slice();while(names.length<5)names.push(pool.splice((Math.random()*pool.length)|0,1)[0]);
    const slots=[{team:0,name:'Tú',ready:true},{team:0,name:names[0],ready:false},{team:0,name:names[1],ready:false},{team:1,name:names[2],ready:false},{team:1,name:names[3],ready:false},{team:1,name:names[4],ready:false}];
    const paint=()=>{const n=slots.filter(s=>s.ready).length;$('sTitle').textContent=n<6?'Buscando jugadores...':'¡Partida encontrada!';$('sSub').textContent=n+'/6 jugadores';
      $('slots').innerHTML=slots.map(s=>`<div class="slot ${s.team?'r':'b'}${s.ready?'':' empty'}">${s.ready?s.name:'Buscando...'}</div>`).join('')};
    paint();
    const times=[rand(.9,2.2),rand(1.6,3.4),rand(2.4,4.6),rand(3.2,5.6),rand(4.2,6.6)].sort((a,b)=>a-b);
    searchTimers.forEach(clearTimeout);searchTimers=[];
    for(let i=0;i<5;i++)searchTimers.push(setTimeout(()=>{slots[i+1].ready=true;sfx.ui();paint()},times[i]*1000));
    searchTimers.push(setTimeout(()=>{
      $('search').classList.add('hide');lobbyHero.root.visible=false;
      startMatch(slots.slice(1).map(s=>({team:s.team,name:s.name})));
      $('touch').classList.toggle('hide',!IS_TOUCH);$('ptr').classList.toggle('hide',IS_TOUCH?false:false);
      if(!IS_TOUCH)$('lock').classList.remove('hide');
    },(times[4]+1.2)*1000));
  };
  if(matchesPlayed>0)showAd('midgame',go);else go();
}
$('bPlay').onclick=startSearch;
$('bCancel').onclick=()=>{searchTimers.forEach(clearTimeout);searchTimers=[];showLobby()};

/* ================= End of match ================= */
function showEnd(){
  const p=G.player,win=G.over.winner===0,draw=G.over.winner===-1,st=p.stats;
  if(document.exitPointerLock)document.exitPointerLock();
  const firstWin=win&&!S.daily.firstWin;
  const xp=[['Partida terminada',100]];
  if(win)xp.push(['Victoria',75]);
  if(st.caps)xp.push(['Capturas x'+st.caps,150*st.caps]);
  if(st.rets)xp.push(['Devoluciones x'+st.rets,80*st.rets]);
  if(st.assists)xp.push(['Asistencias x'+st.assists,40*st.assists]);
  if(st.loot)xp.push(['Objetos raros x'+st.loot,100*st.loot]);
  if(st.rets||st.assists)xp.push(['Juego en equipo',25]);
  if(firstWin)xp.push(['Primera victoria del día',200]);
  const xpT=xp.reduce((a,b)=>a+b[1],0);
  const coins=40+(win?60:draw?20:0)+st.caps*50+st.rets*25+st.assists*10+G.matchCoins*5+st.loot*10;
  // stats
  const s=S.st;s.games++;if(win){s.wins++;s.streak++;s.bestStreak=Math.max(s.bestStreak,s.streak)}else if(!draw)s.streak=0;
  s.caps+=st.caps;s.rets+=st.rets;s.assists+=st.assists;s.loot+=st.loot;s.coins+=G.matchCoins;s.carryTime+=Math.floor(st.carry);s.kills+=st.kills;
  const pr=S.daily.prog;pr.games=(pr.games||0)+1;if(win)pr.wins=(pr.wins||0)+1;pr.caps=(pr.caps||0)+st.caps;pr.rets=(pr.rets||0)+st.rets;pr.assists=(pr.assists||0)+st.assists;pr.loot=(pr.loot||0)+st.loot;pr.coins=(pr.coins||0)+G.matchCoins;pr.carryTime=(pr.carryTime||0)+Math.floor(st.carry);
  if(firstWin)S.daily.firstWin=true;
  // rank
  const r=S.rank;let dpts=0,rtxt='';
  if(r.placed<5){r.placed++;if(win)r.pw++;if(r.placed===5){r.pts=r.pw*90;r.best=Math.max(r.best,r.pts);rtxt='¡Colocación completa! Liga: '+rankInfo().name}else rtxt='Partida de colocación '+r.placed+'/5'}
  else{dpts=win?30+Math.min(10,st.caps*5):draw?0:-17;const old=r.pts,oi=rankInfo().idx;r.pts=Math.max(0,r.pts+dpts);r.best=Math.max(r.best,r.pts);const ni=rankInfo().idx;rtxt=(dpts>=0?'+':'')+dpts+' pts · '+rankInfo().name+(ni>oi?' ⬆':ni<oi?' ⬇':'')}
  const lvl0=S.level;const ups=addXP(xpT);S.coins+=coins;save();
  G.lastReward={coins,xpT};
  $('eTitle').textContent=win?'¡VICTORIA!':draw?'EMPATE':'DERROTA';$('eTitle').style.color=win?'#ffe066':draw?'#fff':'#ff8a8a';
  $('eScore').textContent=G.score[0]+' - '+G.score[1];
  let rows=xp.map(x=>`<div class="erow"><span>${x[0]}</span><span>+${x[1]} XP</span></div>`).join('');
  rows+=`<div class="erow t"><span>+${xpT} XP</span><span><i class="coin" style="width:2.2rem;height:2.2rem;vertical-align:middle"></i> +${coins}</span></div>`;
  rows+=`<div class="erow" style="color:#9ff0ff"><span>Rango</span><span>${rtxt}</span></div>`;
  if(ups.length)rows+=ups.map(u=>`<div class="erow" style="color:#7dff8a"><span>¡Nivel ${u.lvl}!</span><span>+${u.coins} monedas${u.unlock.length?' · '+u.unlock.map(x=>x.name).join(', '):''}</span></div>`).join('');
  $('eRows').innerHTML=rows;
  const need=xpNeed(S.level)-S.xp;
  const goal=CAT.filter(c=>c.price&&!owns(c.id)).sort((a,b)=>a.price-b.price)[0];
  $('eNext').innerHTML=`Estás a ${need} XP del nivel ${S.level+1}`+(goal?(S.coins>=goal.price?`<br>¡Ya puedes comprar "${goal.name}"!`:`<br>Estás a ${goal.price-S.coins} monedas de "${goal.name}"`):'');
  $('eDbl').textContent='Duplicar monedas ▶';$('eDbl').disabled=false;
  $('end').classList.remove('hide');$('hud').classList.add('hide');$('touch').classList.add('hide');
  if(win){sfx.cap();gp.happy()}else sfx.lose();
  matchesPlayed++;
}
$('eDbl').onclick=()=>{if($('eDbl').disabled)return;showAd('rewarded',ok=>{if(ok){S.coins+=G.lastReward.coins;save();sfx.buy();$('eDbl').textContent='¡Duplicado!';$('eDbl').disabled=true}else toastG('No hay anuncio disponible ahora')})};
$('eLobby').onclick=()=>{$('end').classList.add('hide');showLobby()};
$('eAgain').onclick=()=>{$('end').classList.add('hide');startSearch()};

/* ================= Main loop ================= */
let last=performance.now(),acc=0,waterT=0;
function frame(now){
  requestAnimationFrame(frame);
  let dt=Math.min(.1,(now-last)/1000);last=now;if(document.hidden)return;
  acc+=dt;let n=0;
  while(acc>=1/60&&n<6){
    const h=1/60;
    if(inMatch()||G.state==='end'||G.state==='over'){readPlayerInput(h);updateGame(h)}
    acc-=h;n++;
  }
  if(n>=6)acc=0;
  for(const e of G.ents)animEnt(e,dt);
  if(G.state==='lobby'||G.state==='search')animHero(dt);
  fx.update(dt);updateSlashes(dt);
  waterT+=dt;waterTex.offset.set(waterT*.01,waterT*.006);cloudsG.children.forEach((c,i)=>{c.position.x+=dt*(1+i%3*.5);if(c.position.x>180)c.position.x=-180});
  // flag visuals
  for(let t=0;t<2;t++){
    const F=flagsGfx[t],f=G.flags[t];if(!f)continue;
    if(f.state==='carried'&&f.carrier){F.g.position.set(f.carrier.x-Math.sin(f.carrier.yaw)*.55,f.carrier.y+.2,f.carrier.z-Math.cos(f.carrier.yaw)*.55);F.g.scale.setScalar(.7)}
    else{F.g.position.set(f.x,f.y,f.z);F.g.scale.setScalar(1)}
    const pa=F.cloth.geometry.attributes.position,o=F.orig,tt=now*.004;
    for(let i=0;i<pa.count;i++){const x=o[i*3];pa.array[i*3+2]=Math.sin(tt*2+x*2.2)*.16*x}
    pa.needsUpdate=true;
  }
  if(G.state==='lobby'){for(let t=0;t<2;t++){flagsGfx[t].g.position.set(FLAGSTAND[t].x,.5,FLAGSTAND[t].z);flagsGfx[t].g.scale.setScalar(1)}}
  if(G.player&&inMatch())updateHUD(dt);
  updateCamera(dt);
  renderer.render(scene,camera);
}

/* ================= Boot ================= */
function afterLoad(){checkDaily();if(lobbyHero){refreshHero();refreshLobby()}applyVolume()}
document.body.classList.toggle('touchmode',IS_TOUCH);
buildWorld();initHero();
for(const f of flagsGfx)f.g.visible=true;
mkFlags();G.coins=COINSPOTS.map(c=>({x:c[0],z:c[1],on:true,t:0}));
coinGfx.forEach(m=>m.visible=false);
showLobby();
if(!S.daily.loginDone){S.daily.loginDone=true;const r=STREAK[Math.min(6,S.login.streak-1)];S.coins+=r;save();refreshLobby();setTimeout(()=>toastG('Racha de inicio día '+S.login.streak+': +'+r+' monedas'),600)}
requestAnimationFrame(t=>{last=t;frame(t)});
initSDK().then(()=>{refreshLobby()});
window.__dbg={tick:(n)=>{for(let i=0;i<n;i++){readPlayerInput(1/60);updateGame(1/60);for(const e of G.ents)animEnt(e,1/60);fx.update(1/60);updateCamera(1/60)}},G,S,startMatch,showLobby,startSearch,updateGame,thinkBot,stepEnt,hurt,camera,keys};
