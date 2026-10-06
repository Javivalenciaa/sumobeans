/* ================= Camera, input ================= */
const look={yaw:-Math.PI/2,pitch:0};
let locked=false,lobbyT=0,lookDX=0,lookDY=0;
const keys={},touch={joy:{active:false,x:0,y:0,id:-1},cam:{id:-1,x:0,y:0},atk:false,jump:false,dash:false,use:false};
let mouseAtk=false,mouseDash=false;
function inMatch(){return G.state==='play'||G.state==='count'}
function inSim(){return G.state==='play'||G.state==='count'||G.state==='end'}
const sens=()=>.0022*(S.set.sens||1);
addEventListener('keydown',e=>{
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code))e.preventDefault();
  audioInit();if(e.repeat)return;keys[e.code]=true;
  if(e.code==='KeyE')keys._use=true;
  if(e.code==='Tab'||e.code==='KeyP'){if(inMatch()&&!IS_TOUCH)requestPause()}
  if(e.code==='KeyH')$('tut').classList.add('hide');
  if(e.code==='Enter'&&G.state==='over'&&!$('end').classList.contains('hide'))$('eAgain').click();
});
addEventListener('keyup',e=>{keys[e.code]=false});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouseAtk=false;mouseDash=false});
canvas.addEventListener('mousedown',e=>{
  audioInit();if(IS_TOUCH)return;
  if(inMatch()&&!locked&&!G.paused){tryLock();return}
  if(!locked)return;
  if(e.button===0)mouseAtk=true;else if(e.button===2)mouseDash=true;
});
addEventListener('mouseup',e=>{if(e.button===0)mouseAtk=false;if(e.button===2)mouseDash=false});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
function tryLock(){try{const p=canvas.requestPointerLock&&canvas.requestPointerLock();if(p&&p.catch)p.catch(()=>{})}catch(e){}}
document.addEventListener('pointerlockchange',()=>{
  locked=document.pointerLockElement===canvas;
  if(IS_TOUCH)return;
  if(locked){G.paused=false;$('pause').classList.add('hide');$('lockp').classList.add('hide');if(G.state==='play')gp.start()}
  else if(inMatch()&&!adBusy)requestPause();
});
document.addEventListener('mousemove',e=>{if(locked){lookDX+=e.movementX;lookDY+=e.movementY}});
function applyLook(){
  if(!lookDX&&!lookDY)return;
  look.yaw-=lookDX*sens();look.pitch=clamp(look.pitch-lookDY*sens()*(S.set.inv?-1:1),-1.45,1.45);lookDX=lookDY=0;
}
function requestPause(){
  if(!inMatch()||G.paused)return;
  if(!NET.on){G.paused=true;gp.stop()}
  mouseAtk=false;mouseDash=false;
  if(document.exitPointerLock&&locked)document.exitPointerLock();
  $('pause').classList.remove('hide');
}
function resumeGame(){
  $('pause').classList.add('hide');
  if(!IS_TOUCH){tryLock();setTimeout(()=>{if(!locked){G.paused=false;if(G.state==='play'&&!NET.on)gp.start()}},250)}
  else{G.paused=false;if(G.state==='play')gp.start()}
}
// touch camera drag
canvas.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse')return;audioInit();
  if(e.clientX>innerWidth*.3&&touch.cam.id<0){touch.cam.id=e.pointerId;touch.cam.x=e.clientX;touch.cam.y=e.clientY;try{canvas.setPointerCapture(e.pointerId)}catch(_){}}
});
canvas.addEventListener('pointermove',e=>{
  if(e.pointerId===touch.cam.id){lookDX+=(e.clientX-touch.cam.x)*2.6;lookDY+=(e.clientY-touch.cam.y)*2.6;touch.cam.x=e.clientX;touch.cam.y=e.clientY}
});
const upCam=e=>{if(e.pointerId===touch.cam.id)touch.cam.id=-1};
canvas.addEventListener('pointerup',upCam);canvas.addEventListener('pointercancel',upCam);
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
  $('tPause').addEventListener('pointerdown',e=>{e.preventDefault();if(inMatch())requestPause()});
}
function readPlayerInput(dt){
  const p=G.player;if(!p)return;
  applyLook();
  let ix=0,iz=0;
  if(keys.KeyW||keys.ArrowUp)iz+=1;if(keys.KeyS||keys.ArrowDown)iz-=1;if(keys.KeyD||keys.ArrowRight)ix+=1;if(keys.KeyA||keys.ArrowLeft)ix-=1;
  if(touch.joy.active){ix=touch.joy.x;iz=-touch.joy.y}
  const l=Math.hypot(ix,iz);if(l>1){ix/=l;iz/=l}
  const s=Math.sin(look.yaw),c=Math.cos(look.yaw);
  p.in.mx=ix*c+iz*(-s);p.in.mz=ix*(-s)+iz*(-c);
  p.in.aimYaw=Math.atan2(-s,-c);p.in.aimPitch=look.pitch;
  p.in.jump=!!(keys.Space||touch.jump);
  p.in.atk=!!(mouseAtk||keys.KeyF||touch.atk);
  p.in.dash=!!(keys.ShiftLeft||keys.ShiftRight||mouseDash||touch.dash);
  if(keys._use||touch.use){p.in.use=true;keys._use=false;touch.use=false}
  if(G.state!=='play'||!p.alive){p.in.atk=false;p.in.dash=false;p.in.use=false}
}
let prevLookYaw=0,prevLookPitch=0,bobT=0;
const _sd=new THREE.Vector3(),_sr=new THREE.Vector3(),_su=new THREE.Vector3(),_up=new THREE.Vector3(0,1,0);
// shadow camera snapped to the shadow-map texel grid so shadows and floor never shimmer while moving
function placeSun(tx,tz){
  const sc=sun.shadow.camera,texel=(sc.right-sc.left)/sun.shadow.mapSize.x;
  _sd.set(MAP.sunDir[0],MAP.sunDir[1],MAP.sunDir[2]).normalize();_sr.crossVectors(_up,_sd).normalize();_su.crossVectors(_sd,_sr).normalize();
  const px=tx*_sr.x+tz*_sr.z,py=tx*_su.x+tz*_su.z,pz=tx*_sd.x+tz*_sd.z;
  const qx=Math.round(px/texel)*texel,qy=Math.round(py/texel)*texel;
  const x=_sr.x*qx+_su.x*qy+_sd.x*pz,y=_sr.y*qx+_su.y*qy+_sd.y*pz,z=_sr.z*qx+_su.z*qy+_sd.z*pz;
  sun.target.position.set(x,y,z);sun.position.set(x+MAP.sunDir[0]*1.6,y+MAP.sunDir[1]*1.6,z+MAP.sunDir[2]*1.6);
}
function updateCamera(dt,alpha){
  if(G.state==='lobby'||G.state==='search'){
    lobbyT+=dt*.18;const h=lobbyHero.root.position;
    const tx=h.x,ty=h.y+1.0,tz=h.z,a=-Math.PI/2+Math.sin(lobbyT)*.5-.15;
    camera.position.set(tx+Math.cos(a)*5.2+1.2,ty+1.1,tz-Math.sin(a)*5.2);camera.lookAt(tx+.3,ty+.15,tz);
    placeSun(tx,tz);
    skyDome.position.copy(camera.position);return;
  }
  const p=G.player;if(!p)return;
  const x=lerp(p.ppx,p.x,alpha),y=lerp(p.ppy,p.y,alpha),z=lerp(p.ppz,p.z,alpha);
  if(p.alive){
    const sp_=Math.hypot(p.velx,p.velz);bobT+=dt*sp_*1.5*(p.grounded?1:0);
    const bob=p.grounded?Math.sin(bobT*1.7)*.035*Math.min(1,sp_/5):0;
    camera.position.set(x,y+EYE+bob,z);
    camera.rotation.set(look.pitch,look.yaw,clamp(-(p.in.mx*Math.cos(look.yaw)-p.in.mz*Math.sin(look.yaw))*.012,-.03,.03)*Math.min(1,sp_/5),'YXZ');
    const fovT=(innerWidth/innerHeight<1.5?84:76)+(p.dashT>0?10:0)+Math.min(sp_,10)*.3;
    camera.fov+=(fovT-camera.fov)*Math.min(1,dt*10);camera.updateProjectionMatrix();
  }else{ // death cam: rise above the spot looking down
    const tt=Math.min(1,(4-p.respawn)/1.2);
    camera.position.set(x+Math.sin(look.yaw)*3*tt,y+EYE+tt*4.5,z+Math.cos(look.yaw)*3*tt);camera.lookAt(x,y+.6,z);
  }
  if(G.shake>0){G.shake=Math.max(0,G.shake-dt);camera.position.x+=rand(-.05,.05)*G.shake*3;camera.position.y+=rand(-.05,.05)*G.shake*3}
  placeSun(x,z);skyDome.position.copy(camera.position);
}

/* ================= HUD ================= */
let hudC={};
function setTxt(id,v){if(hudC[id]!==v){hudC[id]=v;$(id).textContent=v}}
function toast(m){const e=$('toast');e.textContent=m;e.style.opacity=1;clearTimeout(toast.h);toast.h=setTimeout(()=>e.style.opacity=0,1800)}
function bigToast(m,px){const e=$('toastBig');e.textContent=m;e.style.fontSize=((px||56)/10)+'rem';e.classList.remove('go');void e.offsetWidth;e.classList.add('go')}
function feed(html){const d=document.createElement('div');d.innerHTML=html;const f=$('feed');f.appendChild(d);while(f.children.length>5)f.removeChild(f.firstChild);setTimeout(()=>d.remove(),6000)}
function hitMarker(kill,shield){const h=$('hm');h.className=kill?'kill':shield?'shield':'';void h.offsetWidth;h.classList.add('on');if(!shield)sfx.tick();clearTimeout(hitMarker.h);hitMarker.h=setTimeout(()=>h.classList.remove('on'),kill?420:220)}
function dmgIndicator(att){
  const p=G.player;if(!p)return;const bearing=Math.atan2(att.x-p.x,att.z-p.z);
  const rel=angDiff(p.in.aimYaw,bearing);const d=$('dmg');d.style.transform=`rotate(${(-rel*180/Math.PI)}deg)`;d.classList.remove('on');void d.offsetWidth;d.classList.add('on');
}
const mini=$('mini'),mc=mini.getContext('2d');
function drawMini(){
  const W=340,sc=W/62;mc.setTransform(1,0,0,1,0,0);mc.clearRect(0,0,W,W);
  const p=G.player;if(!p)return;
  mc.fillStyle=MAP.id==='sky'?'#6a4a8a':MAP.id==='ice'?'#2a6ea0':MAP.id==='factory'?'#6a5a40':'#2a77b3';mc.fillRect(0,0,W,W);
  const alpha=Math.atan2(-Math.cos(look.yaw),-Math.sin(look.yaw)),phi=-Math.PI/2-alpha;
  mc.save();mc.translate(W/2,W/2);mc.rotate(phi);mc.translate(-p.x*sc,-p.z*sc);
  const wc=MAP.def&&MAP.def.mc||'#7cc757';
  for(const r of MAP.walk){mc.fillStyle=r.x1<-29&&r.t>.3?'#6f8fd8':r.x0>29&&r.t>.3?'#d88f84':r.t>1.6?'#fff3c0':wc;mc.fillRect(r.x0*sc,r.z0*sc,(r.x1-r.x0)*sc,(r.z1-r.z0)*sc)}
  mc.fillStyle='rgba(50,40,30,.65)';for(const s of MAP.solids){if(s.kind==='bld'||s.kind==='pillar'||s.kind==='brick'||s.kind==='igloo'||s.kind==='ice')mc.fillRect(s.x0*sc,s.z0*sc,(s.x1-s.x0)*sc,(s.z1-s.z0)*sc)}
  for(const pd of MAP.pads){mc.fillStyle='#2fe0ff';mc.beginPath();mc.arc(pd.x*sc,pd.z*sc,1.4*sc,0,TAU);mc.fill()}
  for(const f of G.flags){mc.fillStyle=f.team?'#ff3b3b':'#2f7bff';mc.strokeStyle='#fff';mc.lineWidth=3;mc.beginPath();mc.arc(f.x*sc,f.z*sc,10,0,TAU);mc.fill();mc.stroke()}
  for(const e of G.ents){if(!e.alive)continue;mc.fillStyle=e.team?'#ff4a4a':'#4a9bff';mc.strokeStyle=e.isPlayer?'#fff':'rgba(0,0,0,.6)';mc.lineWidth=e.isPlayer?4:2;mc.beginPath();mc.arc(e.x*sc,e.z*sc,e.isPlayer?9:7,0,TAU);mc.fill();mc.stroke();if(e.carry){mc.fillStyle='#ffd23f';mc.beginPath();mc.arc(e.x*sc,e.z*sc,4,0,TAU);mc.fill()}}
  mc.restore();
  mc.fillStyle='#fff';mc.beginPath();mc.moveTo(W/2,W/2-16);mc.lineTo(W/2+8,W/2+8);mc.lineTo(W/2-8,W/2+8);mc.fill();
}
function objective(p){
  const own=G.flags[p.team],en=G.flags[1-p.team];
  if(p.carry)return t(own.state==='home'?'o_carry':'o_carry2');
  if(own.state==='carried')return t('o_recover');
  if(own.state==='dropped')return t('o_return');
  if(en.state==='carried')return t('o_escort');
  if(en.state==='dropped')return t('o_pick');
  return t('o_steal');
}
const _v=new THREE.Vector3();
function placeMarker(el,x,y,z,txt,col){
  _v.set(x,y,z).project(camera);
  let sx=_v.x,sy=_v.y;const behind=_v.z>1;if(behind){sx=-sx;sy=-sy}
  const off=Math.abs(sx)>.88||Math.abs(sy)>.8||behind;
  if(off){const m=Math.max(Math.abs(sx),Math.abs(sy)/.9)||1;sx=sx/m*.88;sy=sy/m*.8}
  el.style.left=((sx+1)/2*100)+'%';el.style.top=((1-sy)/2*100)+'%';el.style.color=col;el.textContent=txt;el.classList.remove('hide');
}
function updateMarkers(p){
  const m1=$('mk1'),m2=$('mk2');m1.classList.add('hide');m2.classList.add('hide');
  if(!p.alive||G.state==='over')return;
  const own=G.flags[p.team],en=G.flags[1-p.team],d=(x,z)=>Math.round(Math.hypot(x-p.x,z-p.z));
  let a=null;
  if(p.carry)a={x:MAP.flag[p.team].x,y:own.y+3.2,z:MAP.flag[p.team].z,txt:'⚑ '+t('mk_base'),col:'#7dff8a',dd:1};
  else if(en.state==='carried'&&en.carrier.team===p.team&&en.carrier!==p)a={x:en.carrier.x,y:en.carrier.y+2.6,z:en.carrier.z,txt:'★ '+t('mk_carrier'),col:'#ffe066'};
  else a={x:en.x,y:en.y+4,z:en.z,txt:'⚑ '+t('mk_flag'),col:'#ff9a92'};
  if(a)placeMarker(m1,a.x,a.y,a.z,a.txt+' '+d(a.x,a.z)+'m',a.col);
  if(own.state!=='home'&&!p.carry||own.state!=='home'&&p.carry){
    const tgt=own.state==='carried'?own.carrier:own;
    placeMarker(m2,tgt.x,(tgt.y||0)+2.8,tgt.z,'⚠ '+t(own.state==='carried'?'mk_thief':'mk_dropped')+' '+d(tgt.x,tgt.z)+'m','#ff5a5a');
  }
}
let miniT=0,xhEnemy=false;
function updateHUD(dt){
  const p=G.player;if(!p)return;
  setTxt('sb0',G.score[0]);setTxt('sb1',G.score[1]);
  const tm=Math.max(0,Math.ceil(G.time));setTxt('stime',(G.ot?'+':'')+Math.floor(tm/60)+':'+String(tm%60).padStart(2,'0'));
  setTxt('obj',objective(p));
  let h='';for(let i=0;i<3;i++)h+=p.hp>i+.5?'❤️':(p.hp>i?'💔':'🖤');setTxt('hearts',h);
  $('cDash').firstElementChild.style.height=(p.cdD>0?Math.min(100,p.cdD/(p.weapon==='sword'?3.5:4.5)*100):0)+'%';
  const atkCd=p.weapon==='xbow'?(p.reload>0?p.reload/2.2:p.cdA/.7):(p.cdA>0?p.cdA/.8:0);
  $('cAtk').firstElementChild.style.height=Math.min(100,atkCd*100)+'%';
  $('cAtk').childNodes[0].textContent=(p.weapon==='sword'?'⚔':p.weapon==='spear'?'🔱':'🏹')+(p.weapon==='xbow'?p.ammo:'');
  const it=p.item;$('cItem').childNodes[0].textContent=it?(it==='shield'?'🛡':'👟'):(p.shield>0?'🛡':p.boots>0?'👟':'•');
  $('cItem').style.borderColor=it?'#ffd23f':'rgba(255,255,255,.3)';
  setTxt('hCoinN',G.matchCoins||0);
  $('carry').classList.toggle('hide',!p.carry);
  if(!p.alive)$('dSub').textContent=t('respawn_in',{n:Math.max(0,Math.ceil(p.respawn))});
  miniT-=dt;if(miniT<=0){miniT=.06;drawMini()}
  // crosshair turns red over an enemy
  if(p.alive){
    const dx=Math.sin(p.in.aimYaw)*Math.cos(look.pitch),dy=Math.sin(look.pitch),dz=Math.cos(p.in.aimYaw)*Math.cos(look.pitch);let over=false;
    for(const o of G.ents){if(!o.alive||o.team===p.team)continue;const vx=o.x-p.x,vy=o.y+.8-(p.y+EYE),vz=o.z-p.z,d=Math.hypot(vx,vy,vz);if(d<1||d>(p.weapon==='xbow'?60:4.5))continue;
      if(Math.acos(clamp((vx*dx+vy*dy+vz*dz)/d,-1,1))<Math.atan(.7/d)+.04){over=true;break}}
    if(over!==xhEnemy){xhEnemy=over;$('xh').classList.toggle('enemy',over)}
  }
  const f=G.hitFlash;if(f>0){G.hitFlash=Math.max(0,f-dt);$('hud').style.boxShadow='inset 0 0 '+(f*20)+'rem rgba(255,40,40,'+f+')'}else $('hud').style.boxShadow='none';
  updateMarkers(p);
}
function uiDead(on){
  $('dead').classList.toggle('hide',!on);
  if(on){
    $('dTxt').textContent=t('defeated');
    const w=$('dW');w.innerHTML='';
    for(const k of Object.keys(WEAPONS)){const b=document.createElement('button');b.className='btn sm'+(G.player.nextWeapon===k?' y':'');b.textContent=WEAPONS[k].ic+' '+t('w_'+k);b.onclick=()=>{G.player.nextWeapon=k;S.weapon=k;save();uiDead(true);sfx.ui()};w.appendChild(b)}
  }
}
function onPlayStart(){
  $('lockp').classList.toggle('hide',locked||IS_TOUCH);
  if(S.set.tut<3){$('tut').classList.remove('hide');S.set.tut++;save();setTimeout(()=>$('tut').classList.add('hide'),13000)}
}

/* ================= Language ================= */
const FLAG_EN="data:image/svg+xml;utf8,"+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 40' preserveAspectRatio='none'><rect width='60' height='40' fill='#012169'/><path d='M0,0 L60,40 M60,0 L0,40' stroke='#fff' stroke-width='8'/><path d='M0,0 L60,40 M60,0 L0,40' stroke='#C8102E' stroke-width='3'/><path d='M30,0 V40 M0,20 H60' stroke='#fff' stroke-width='13'/><path d='M30,0 V40 M0,20 H60' stroke='#C8102E' stroke-width='7'/></svg>");
const FLAG_ES="data:image/svg+xml;utf8,"+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 40' preserveAspectRatio='none'><rect width='60' height='40' fill='#AA151B'/><rect y='10' width='60' height='20' fill='#F1BF00'/></svg>");
function setFlag(){const b=$('btnLang');b.firstElementChild.style.backgroundImage='url("'+(L==='es'?FLAG_ES:FLAG_EN)+'")';b.lastElementChild.textContent=L==='es'?'ES':'EN';b.title=L==='es'?'Idioma: Español (clic para English)':'Language: English (click for Español)'}
function applyLang(){
  document.documentElement.lang=L;
  document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=t(el.dataset.i18n)});
  $('tutText').innerHTML=IS_TOUCH?t('tut_touch'):t('tut_pc');
  setFlag();
  refreshLobby();if(!$('shop').classList.contains('hide'))renderShop();
}

/* ================= Lobby / menus ================= */
let lobbyHero=null,pvEq=null,matchesPlayed=0,lastMap='',previewMap='bridges';
function initHero(){
  lobbyHero=makeChar(0,'');lobbyHero.P.tag.visible=false;lobbyHero.P.ring.visible=false;scene.add(lobbyHero.root);
  refreshHero();
}
function placeHero(){
  const sp=MAP.spawn[0][1];const x=sp[0]+3.2,z=sp[1]+2.8,g=baseGround(x,z);
  lobbyHero.root.position.set(x,g>-Infinity?g:0,z);lobbyHero.root.rotation.y=Math.PI*.15;
}
function refreshHero(){setWeaponGfx(lobbyHero,S.weapon);applyCosmetics(lobbyHero,pvEq||S.eq)}
function animHero(dt){
  const P=lobbyHero.P,tt=performance.now()/1000;
  lobbyHero.body.position.y=Math.sin(tt*2)*.03;
  P.armL.rotation.x=Math.sin(tt*2)*.08;P.armR.rotation.x=-.9+Math.sin(tt*2+1)*.06;
  const w=Math.sin(tt*.7)>.93;P.armL.rotation.z=w?-2.4+Math.sin(tt*14)*.4:0;if(w)P.armL.rotation.x=0;
  if(P.spinner)P.spinner.rotation.y+=dt*20;
  lobbyHero.root.rotation.y=Math.PI*.15+Math.sin(tt*.4)*.2;
}
function showLobby(){
  searchTimers.forEach(clearTimeout);searchTimers=[];netClose();
  G.state='lobby';gp.stop();clearMatch();G.paused=false;
  loadPreview(S.map==='auto'?previewMap:S.map);
  $('hud').classList.add('hide');$('touch').classList.add('hide');$('lobby').classList.remove('hide');$('end').classList.add('hide');$('search').classList.add('hide');$('fr').classList.add('hide');$('pause').classList.add('hide');$('lockp').classList.add('hide');$('tut').classList.add('hide');
  if(document.exitPointerLock&&locked)document.exitPointerLock();
  lobbyHero.root.visible=true;pvEq=null;refreshHero();refreshLobby();
}
function loadPreview(id){
  if(MAP.id!==id){loadMap(id)}
  mkFlags();placeHero();
  for(const m of MAP.coinGfx)m.visible=false;
  MAP.chestGfx.userData.item.visible=false;
}
function refreshLobby(){
  if(!lobbyHero)return;
  const ri=rankInfo();
  $('pLvl').textContent=t('level',{n:S.level});$('pRank').textContent=ri.name;$('pRank').style.color=ri.col;
  $('pXp').style.width=(S.level>=50?100:S.xp/xpNeed(S.level)*100)+'%';$('pXpT').textContent=S.level>=50?'MAX':S.xp+' / '+xpNeed(S.level)+' XP';
  $('pPlace').textContent=S.rank.placed<5?'':S.rank.pts+' '+t('pts');
  $('lCoins').textContent=S.coins;
  const w=$('wsel');w.innerHTML='';
  for(const k of Object.keys(WEAPONS)){const c=document.createElement('div');c.className='wcard'+(S.weapon===k?' on':'');c.innerHTML=`<div class="ic">${WEAPONS[k].ic}</div><div class="nm">${t('w_'+k)}</div><div class="ds">${t('w_'+k+'_d')}</div>`;c.onclick=()=>{S.weapon=k;save();sfx.ui();refreshHero();refreshLobby()};w.appendChild(c)}
  const ms=$('mapsel');ms.innerHTML='';
  const mk=(id,ic,name)=>{const b=document.createElement('button');b.className='mbtn'+(S.map===id?' on':'');b.innerHTML=`<span>${ic}</span><b>${name}</b>`;b.onclick=()=>{S.map=id;save();sfx.ui();if(id!=='auto')loadPreview(id);else loadPreview(previewMap);refreshLobby()};ms.appendChild(b)};
  mk('auto','🎲',t('map_auto'));for(const m of MAPDEFS)mk(m.id,m.ic,t(m.n));
  const cur=S.map==='auto'?null:MAPDEFS.find(m=>m.id===S.map);$('mapDesc').textContent=cur?t(cur.d):t('map_auto_d');
  const done=S.daily.missions.some(id=>{const m=MISSIONS.find(x=>x.id===id);return (S.daily.prog[m.stat]||0)>=m.n&&!S.daily.claimed[id]});
  $('misDot').textContent=done?'❗':'';
  $('bChest').textContent=S.daily.chest?t('chest_done'):t('chest_free');$('bChest').disabled=S.daily.chest;
  $('bSnd').style.opacity=S.set.snd?1:.5;
  $('cgUser').textContent=cgUser&&cgUser.username?cgUser.username:'';
}
function openModal(id){$(id).classList.remove('hide');sfx.ui()}
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>{$(b.dataset.close).classList.add('hide');pvEq=null;refreshHero();refreshLobby();sfx.ui()});
function renderShop(){
  $('shCoins').textContent=S.coins;const b=$('shBody');b.innerHTML='';const g=document.createElement('div');g.className='grid';
  const list=CAT.slice().sort((a,b)=>(a.lvl||0)-(b.lvl||0)||(a.price||0)-(b.price||0));
  for(const it of list){
    const own=owns(it.id),eq=S.eq[it.type]===it.id;
    const d=document.createElement('div');d.className='item';
    d.innerHTML=`<div class="pv">${it.ic}</div><div class="nm">${t(it.n)}</div>`;
    const bt=document.createElement('button');bt.className='btn sm';
    if(own){bt.textContent=eq?t('unequip'):t('equip');bt.classList.add(eq?'r':'g');bt.onclick=()=>{S.eq[it.type]=eq?'':it.id;save();sfx.ui();pvEq=null;refreshHero();renderShop()}}
    else if(it.lvl){bt.textContent=t('level',{n:it.lvl});bt.disabled=true}
    else{bt.innerHTML=`<i class="coin" style="width:1.8rem;height:1.8rem;vertical-align:middle"></i> ${it.price}`;bt.classList.add('y');bt.disabled=S.coins<it.price;bt.onclick=()=>{if(S.coins>=it.price){S.coins-=it.price;S.own[it.id]=1;S.eq[it.type]=it.id;save();sfx.buy();pvEq=null;refreshHero();renderShop();refreshLobby()}}}
    d.appendChild(bt);
    if(!own){const pb=document.createElement('button');pb.className='btn sm';pb.style.marginTop='.5rem';pb.textContent=t('try');pb.onclick=()=>{pvEq=Object.assign({},S.eq,{[it.type]:it.id});refreshHero();sfx.ui();$('shop').classList.add('hide');toastG(t('preview'));setTimeout(()=>{pvEq=null;refreshHero();$('shop').classList.remove('hide')},3500)};d.appendChild(pb)}
    g.appendChild(d);
  }
  b.appendChild(g);
}
function renderMissions(){
  const b=$('misBody');b.innerHTML='';
  const hd=document.createElement('div');hd.className='mrow';hd.innerHTML=`<div class="tx">${t('login_streak',{n:S.login.streak})} &nbsp; ${STREAK.map((v,i)=>i<S.login.streak?'✅':'⬜').join('')}</div><div>${t('next')}: ${STREAK[Math.min(6,S.login.streak)]}</div>`;b.appendChild(hd);
  for(const id of S.daily.missions){
    const m=MISSIONS.find(x=>x.id===id),pr=Math.min(m.n,S.daily.prog[m.stat]||0),done=pr>=m.n,cl=S.daily.claimed[id];
    const r=document.createElement('div');r.className='mrow';
    r.innerHTML=`<div class="tx">${t(m.k)}<div class="bar"><div style="width:${pr/m.n*100}%"></div></div><small>${pr}/${m.n} · +200 ${t('coins')} +250 XP</small></div>`;
    const bt=document.createElement('button');bt.className='btn sm '+(done&&!cl?'g':'');bt.textContent=cl?t('done'):done?t('claim'):t('inprog');bt.disabled=!done||cl;
    bt.onclick=()=>{S.daily.claimed[id]=1;S.coins+=200;const ups=addXP(250);save();sfx.buy();renderMissions();refreshLobby();if(ups.length)toastG(t('lvlup',{n:S.level}))};
    r.appendChild(bt);b.appendChild(r);
  }
}
function renderProfile(){
  const s=S.st,ri=rankInfo(),wr=s.games?Math.round(s.wins/s.games*100):0;
  const bi=S.rank.placed>=5?t('lg'+Math.min(6,Math.floor(S.rank.best/100))):'-';
  $('prfBody').innerHTML=`<div class="stats">
   <div><span>${t('p_level')}</span><b>${S.level}</b></div><div><span>${t('p_rank')}</span><b style="color:${ri.col}">${ri.name}${S.rank.placed>=5?' ('+S.rank.pts+')':''}</b></div>
   <div><span>${t('p_games')}</span><b>${s.games}</b></div><div><span>${t('p_wins')}</span><b>${s.wins} (${wr}%)</b></div>
   <div><span>${t('p_caps')}</span><b>${s.caps}</b></div><div><span>${t('p_rets')}</span><b>${s.rets}</b></div>
   <div><span>${t('p_assists')}</span><b>${s.assists}</b></div><div><span>${t('p_loot')}</span><b>${s.loot}</b></div>
   <div><span>${t('p_streak')}</span><b>${s.bestStreak}</b></div><div><span>${t('p_carry')}</span><b>${Math.floor(s.carryTime/60)}m ${Math.floor(s.carryTime%60)}s</b></div>
   <div><span>${t('p_best')}</span><b>${bi}</b></div><div><span>${t('coins')}</span><b>${S.coins}</b></div></div>
   <p style="font-size:1.8rem;opacity:.8">${t('p_note')}</p>`;
}
function renderSettings(){
  $('setBody').innerHTML=`
   <div class="mrow"><div class="tx">${t('s_lang')}</div><button class="btn sm ${L==='en'?'g':''}" data-l="en">English</button><button class="btn sm ${L==='es'?'g':''}" data-l="es">Español</button></div>
   <div class="mrow"><div class="tx">${t('s_sound')}</div><button class="btn sm ${S.set.snd?'g':'r'}" id="sSnd">${S.set.snd?t('on'):t('off')}</button></div>
   <div class="mrow"><div class="tx">${t('s_music')}</div><button class="btn sm ${S.set.mus?'g':'r'}" id="sMus">${S.set.mus?t('on'):t('off')}</button></div>
   <div class="mrow"><div class="tx">${t('s_sens')}</div><input type="range" id="sSens" min="0.3" max="2.5" step="0.1" value="${S.set.sens}" style="width:22rem"></div>
   <div class="mrow"><div class="tx">${t('s_inv')}</div><button class="btn sm ${S.set.inv?'g':''}" id="sInv">${S.set.inv?t('on'):t('off')}</button></div>
   <div class="mrow"><div class="tx">${t('s_q')}</div>${['auto','high','low'].map(q=>`<button class="btn sm ${S.set.q===q?'g':''}" data-q="${q}">${t('q_'+q)}</button>`).join('')}</div>`;
  $('setBody').querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{L=b.dataset.l;S.lang=L;save();applyLang();renderSettings();sfx.ui()});
  $('sSnd').onclick=()=>{S.set.snd=S.set.snd?0:1;save();applyVolume();renderSettings();if(S.set.snd){audioInit();sfx.ui()}};
  $('sMus').onclick=()=>{S.set.mus=S.set.mus?0:1;save();applyVolume();renderSettings()};
  $('sSens').oninput=e=>{S.set.sens=+e.target.value;save()};
  $('sInv').onclick=()=>{S.set.inv=S.set.inv?0:1;save();renderSettings()};
  $('setBody').querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{S.set.q=b.dataset.q;save();applyQuality();renderSettings()});
}
function applyQuality(){const q=S.set.q;setQuality(q==='low'?'low':'high')}
$('bShop').onclick=()=>{renderShop();openModal('shop')};
$('bMis').onclick=()=>{renderMissions();openModal('mis')};
$('bProf').onclick=()=>{renderProfile();openModal('prf')};
$('bSet').onclick=()=>{renderSettings();openModal('set')};
$('pSet').onclick=()=>{renderSettings();openModal('set')};
$('bSnd').onclick=()=>{S.set.snd=S.set.snd?0:1;save();applyVolume();refreshLobby();if(S.set.snd){audioInit();sfx.ui()}};
$('btnLang').onclick=()=>{L=L==='es'?'en':'es';S.lang=L==='es'?'es':'';save();applyLang();sfx.ui()};
$('bChest').onclick=()=>{if(S.daily.chest)return;S.daily.chest=true;const n=150+S.login.streak*10;S.coins+=n;save();sfx.buy();toastG('+'+n+' '+t('coins'));refreshLobby()};
$('bVideo').onclick=()=>{
  if(!adsAvailable()){toastG(t('ad_blocked'));return}
  showAd('rewarded',ok=>{if(ok){const n=100+S.level*5;S.coins+=n;save();sfx.buy();refreshLobby();toastG(t('reward_got',{n}))}else toastG(t('ad_fail'))});
};
$('pResume').onclick=resumeGame;
$('pQuit').onclick=()=>{$('pause').classList.add('hide');G.paused=false;showLobby()};
$('lockp').onclick=()=>{tryLock();$('lockp').classList.add('hide')};

/* ================= Matchmaking (online relay with offline fallback) ================= */
let searchTimers=[];
function pickMap(){
  if(S.map!=='auto')return S.map;
  const o=MAPDEFS.filter(m=>m.id!==lastMap);return pick(o).id;
}
function openSearchUI(mode){
  $('lobby').classList.add('hide');$('fr').classList.add('hide');$('search').classList.remove('hide');G.state='search';
  $('sCode').classList.add('hide');$('sStart').classList.add('hide');
  $('sTitle').textContent=t('s_search');$('sSub').textContent='';$('sBots').classList.add('hide');
  paintSlots([]);
}
function paintSlots(names,roster){
  let html='';
  if(roster){html=roster.map(r=>`<div class="slot ${r.team?'r':'b'}">${r.name}</div>`).join('')}
  else{for(let i=0;i<6;i++){const n=names[i];html+=`<div class="slot ${n?'h':'empty'}">${n||t('s_wait')}</div>`}}
  $('slots').innerHTML=html;
}
function currentNames(){
  if(NET.host){const a=[NET.nick];for(const pid in NET.peers)a.push(NET.peers[pid].name);return a}
  if(NET.roster)return NET.roster.map(r=>r[1]);
  return [NET.nick];
}
function roomChanged(){
  if(G.state!=='search')return;
  const names=currentNames();paintSlots(names);
  const n=names.length;
  if(NET.mode==='private'||NET.mode==='join'){
    $('sTitle').textContent=t(NET.host?'rm_waiting':'rm_host_wait');$('sSub').textContent=n+'/6';
    $('sCode').classList.remove('hide');
    let link=location.href.split('?')[0]+'?room='+NET.code;
    try{if(sdkOK&&CG&&CG.game.inviteLink)link=CG.game.inviteLink({room:NET.code})||link}catch(e){}
    NET.link=link;
    $('sCode').innerHTML=`<div style="font-size:2rem;opacity:.8">${t('rm_code')}</div><div style="font-size:6rem;letter-spacing:.8rem">${NET.code}</div><button class="btn sm" id="sCopy">${t('rm_invite')}</button>`;
    $('sCopy').onclick=()=>{try{navigator.clipboard.writeText(NET.link);toastG(t('rm_copied'))}catch(e){toastG(NET.link)}};
    $('sStart').classList.toggle('hide',!NET.host);$('sBots').classList.toggle('hide',!NET.host);
    $('sBots').textContent=t('rm_bots_n',{v:t(NET.fill?'on':'off')});$('sBots').className='btn sm '+(NET.fill?'g':'r')+(NET.host?'':' hide');
    $('sStart').disabled=NET.host&&!NET.fill&&n<2;
    if(NET.host){try{sdkOK&&CG&&CG.game.showInviteButton&&CG.game.showInviteButton({room:NET.code})}catch(e){}}
  }else{
    $('sTitle').textContent=t('s_search');
    $('sSub').textContent=n+'/6'+(NET.cdLeft>=0?' \u00b7 '+t('s_start_in',{n:NET.cdLeft}):'');
  }
}
function searchStartedMatch(roster,map,title){
  const md=MAPDEFS.find(m=>m.id===map)||MAPDEFS[0];
  $('sTitle').textContent=title||t('s_found');$('sSub').textContent=roster.length+'/6 \u00b7 '+md.ic+' '+t(md.n);$('sCode').classList.add('hide');$('sStart').classList.add('hide');$('sBots').classList.add('hide');
  paintSlots([],roster);
  setTimeout(()=>{
    if(G.state!=='search')return;
    $('search').classList.add('hide');lobbyHero.root.visible=false;
    startMatch(roster,map);
    $('touch').classList.toggle('hide',!IS_TOUCH);
    bigToast(t(md.n),44);
  },800);
}
function offlineSearch(){
  NET.mode='';toastG(t('net_offline'));
  const names=[],pool=NAMES.slice();while(names.length<5)names.push(pool.splice((Math.random()*pool.length)|0,1)[0]);
  const mapId=pickMap();
  const shown=[t('you')];paintSlots(shown);
  const times=[rand(.4,.9),rand(.7,1.4),rand(1.0,1.8),rand(1.3,2.2),rand(1.6,2.6)].sort((a,b)=>a-b);
  searchTimers.forEach(clearTimeout);searchTimers=[];
  $('sTitle').textContent=t('s_search');
  for(let i=0;i<5;i++)searchTimers.push(setTimeout(()=>{shown.push(names[i]);sfx.ui();paintSlots(shown);$('sSub').textContent=shown.length+'/6'},times[i]*1000));
  searchTimers.push(setTimeout(()=>{
    const roster=buildRoster([{pid:-1,name:t('you'),w:S.weapon,eq:Object.assign({},S.eq),me:true}],mapId);
    lastMap=mapId;previewMap=mapId;searchStartedMatch(roster,mapId);
  },(times[4]+.4)*1000));
}
function searchFailed(msg){
  const mode=NET.mode;searchTimers.forEach(clearTimeout);searchTimers=[];
  netClose();
  if(mode==='quick'||!mode){offlineSearch();return}
  toastG(t(msg==='noroom'?'rm_notfound':msg==='full'?'rm_full':msg==='busy'?'rm_busy':'rm_noserver'));showLobby();
}
async function startSearch(){
  audioInit();sfx.ui();
  if(!IS_TOUCH)tryLock(); // user gesture: lock the mouse now so the match starts with a single click
  searchTimers.forEach(clearTimeout);searchTimers=[];netClose();
  NET.nick=netNick();NET.fill=true;openSearchUI('quick');
  const ok=await netConnect(2500);
  if(G.state!=='search')return;
  if(!ok){offlineSearch();return}
  NET.mode='quick';nsend({t:'quick',g:'banderazo'});
  clearTimeout(NET.joinTimer);NET.joinTimer=setTimeout(()=>{if(!NET.on&&G.state==='search'&&NET.mode==='quick')searchFailed('timeout')},3500);
}
async function hostPrivate(){
  audioInit();sfx.ui();searchTimers.forEach(clearTimeout);netClose();NET.nick=netNick();openSearchUI('private');
  const ok=await netConnect(3000);if(G.state!=='search')return;
  if(!ok){NET.mode='private';searchFailed('noserver');return}
  NET.mode='private';NET.fill=!!S.set.fill;nsend({t:'create',g:'banderazo'});
}
async function joinPrivate(code){
  code=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4);
  if(code.length<4){toastG(t('rm_badcode'));return}
  audioInit();sfx.ui();searchTimers.forEach(clearTimeout);netClose();NET.nick=netNick();openSearchUI('join');
  const ok=await netConnect(3000);if(G.state!=='search')return;
  if(!ok){NET.mode='join';searchFailed('noserver');return}
  NET.mode='join';nsend({t:'join',g:'banderazo',code});
}
function startLocal(){
  audioInit();sfx.ui();if(!IS_TOUCH)tryLock();
  searchTimers.forEach(clearTimeout);searchTimers=[];netClose();NET.mode='';openSearchUI('local');
  const map=pickMap();lastMap=map;previewMap=map;
  const roster=buildRoster([{pid:-1,name:t('you'),w:S.weapon,eq:Object.assign({},S.eq),me:true}],map,true);
  searchStartedMatch(roster,map,t('s_local'));
}
function setFrBots(){const b=$('frBots');b.textContent=t(S.set.fill?'on':'off');b.className='btn sm '+(S.set.fill?'g':'r')}
$('bLocal').onclick=startLocal;
$('bPublic').onclick=startSearch;
$('bPrivate').onclick=()=>{sfx.ui();$('frCode').value='';setFrBots();openModal('fr')};
$('frBots').onclick=()=>{S.set.fill=S.set.fill?0:1;save();sfx.ui();setFrBots()};
$('sBots').onclick=()=>{if(!NET.host||NET.started)return;NET.fill=!NET.fill;S.set.fill=NET.fill?1:0;save();sfx.ui();roomChanged()};
$('frCreate').onclick=hostPrivate;
$('frJoin').onclick=()=>joinPrivate($('frCode').value);
$('sStart').onclick=()=>{if(NET.host&&!NET.started)hostStart(pickMap())};
$('sCancel').onclick=()=>{searchTimers.forEach(clearTimeout);searchTimers=[];if(document.exitPointerLock&&locked)document.exitPointerLock();showLobby()};

/* ================= End of match ================= */
function showEnd(){
  const p=G.player,win=G.over.winner===p.team,draw=G.over.winner===-1,st=p.stats;
  if(document.exitPointerLock&&locked)document.exitPointerLock();
  $('dead').classList.add('hide');$('lockp').classList.add('hide');$('tut').classList.add('hide');$('mk1').classList.add('hide');$('mk2').classList.add('hide');
  const firstWin=win&&!S.daily.firstWin;
  const xp=[[t('x_finish'),100]];
  if(win)xp.push([t('x_win'),75]);
  if(st.caps)xp.push([t('x_caps',{n:st.caps}),150*st.caps]);
  if(st.rets)xp.push([t('x_rets',{n:st.rets}),80*st.rets]);
  if(st.assists)xp.push([t('x_assists',{n:st.assists}),40*st.assists]);
  if(st.loot)xp.push([t('x_loot',{n:st.loot}),100*st.loot]);
  if(st.rets||st.assists)xp.push([t('x_team'),25]);
  if(firstWin)xp.push([t('x_first'),200]);
  const xpT=xp.reduce((a,b)=>a+b[1],0);
  const coins=40+(win?60:draw?20:0)+st.caps*50+st.rets*25+st.assists*10+G.matchCoins*5+st.loot*10;
  const s=S.st;s.games++;if(win){s.wins++;s.streak++;s.bestStreak=Math.max(s.bestStreak,s.streak)}else if(!draw)s.streak=0;
  s.caps+=st.caps;s.rets+=st.rets;s.assists+=st.assists;s.loot+=st.loot;s.coins+=G.matchCoins;s.carryTime+=Math.floor(st.carry);s.kills+=st.kills;
  const pr=S.daily.prog;pr.games=(pr.games||0)+1;if(win)pr.wins=(pr.wins||0)+1;pr.caps=(pr.caps||0)+st.caps;pr.rets=(pr.rets||0)+st.rets;pr.assists=(pr.assists||0)+st.assists;pr.loot=(pr.loot||0)+st.loot;pr.coins=(pr.coins||0)+G.matchCoins;pr.carryTime=(pr.carryTime||0)+Math.floor(st.carry);
  if(firstWin)S.daily.firstWin=true;
  const r=S.rank;let rtxt='';
  if(r.placed<5){r.placed++;if(win)r.pw++;if(r.placed===5){r.pts=r.pw*90;r.best=Math.max(r.best,r.pts);rtxt=t('r_placed',{l:rankInfo().name})}else rtxt=t('r_place',{n:r.placed})}
  else{const dp=win?30+Math.min(10,st.caps*5):draw?0:-17,oi=rankInfo().idx;r.pts=Math.max(0,r.pts+dp);r.best=Math.max(r.best,r.pts);const ni=rankInfo().idx;rtxt=(dp>=0?'+':'')+dp+' '+t('pts')+' · '+rankInfo().name+(ni>oi?' ⬆':ni<oi?' ⬇':'')}
  const ups=addXP(xpT);S.coins+=coins;save();
  G.lastReward={coins,xpT};
  $('eTitle').textContent=win?t('victory'):draw?t('draw'):t('defeat');$('eTitle').style.color=win?'#ffe066':draw?'#fff':'#ff8a8a';
  $('eScore').textContent=G.score[0]+' - '+G.score[1];
  let rows=xp.map(x=>`<div class="erow"><span>${x[0]}</span><span>+${x[1]} XP</span></div>`).join('');
  rows+=`<div class="erow t"><span>+${xpT} XP</span><span><i class="coin" style="width:2.2rem;height:2.2rem;vertical-align:middle"></i> +${coins}</span></div>`;
  rows+=`<div class="erow" style="color:#9ff0ff"><span>${t('p_rank')}</span><span>${rtxt}</span></div>`;
  if(ups.length)rows+=ups.map(u=>`<div class="erow" style="color:#7dff8a"><span>${t('lvlup',{n:u.lvl})}</span><span>+${u.coins} ${t('coins')}${u.unlock.length?' · '+u.unlock.map(x=>t(x.n)).join(', '):''}</span></div>`).join('');
  $('eRows').innerHTML=rows;
  const need=xpNeed(S.level)-S.xp;
  const goal=CAT.filter(c=>c.price&&!owns(c.id)).sort((a,b)=>a.price-b.price)[0];
  $('eNext').innerHTML=t('n_xp',{n:need,l:S.level+1})+(goal?(S.coins>=goal.price?'<br>'+t('n_can',{i:t(goal.n)}):'<br>'+t('n_coins',{n:goal.price-S.coins,i:t(goal.n)})):'');
  const vb=$('eDbl');vb.disabled=!adsAvailable();vb.innerHTML='▶ '+t('dbl');
  $('end').classList.remove('hide');$('hud').classList.add('hide');$('touch').classList.add('hide');
  if(win){sfx.cap()}else sfx.lose();
  matchesPlayed++;
}
$('eDbl').onclick=()=>{if($('eDbl').disabled)return;$('eDbl').disabled=true;showAd('rewarded',ok=>{if(ok){S.coins+=G.lastReward.coins;save();sfx.buy();$('eDbl').textContent=t('doubled',{n:G.lastReward.coins})}else{$('eDbl').disabled=!adsAvailable();toastG(t('ad_fail'))}})};
$('eLobby').onclick=()=>{$('end').classList.add('hide');showLobby()};
$('eAgain').onclick=()=>{
  $('end').classList.add('hide');netClose();
  // midgame ad at a natural break (between matches), never on menu/shop buttons
  if(matchesPlayed>0&&adsAvailable())showAd('midgame',()=>startSearch());else startSearch();
};

/* ================= Main loop ================= */
let last=performance.now(),acc=0,waterT=0,fpsAvg=16,lowT=0,gtimeA=0;
function frame(now){
  requestAnimationFrame(frame);
  let dt=Math.min(.1,(now-last)/1000);last=now;if(document.hidden)return;
  // adaptive quality (Chromebook-friendly)
  fpsAvg=fpsAvg*.95+dt*1000*.05;
  if(S.set.q==='auto'&&Quality.level==='high'&&fpsAvg>26&&inMatch()){lowT+=dt;if(lowT>4){setQuality('low')}}else lowT=Math.max(0,lowT-dt);
  if(inSim()&&!G.paused){
    acc+=dt;let n=0;
    while(acc>=STEP&&n<14){readPlayerInput(STEP);updateGame(STEP);acc-=STEP;n++}
    if(n>=14)acc=0;
  }else acc=0;
  const alpha=Math.min(1,acc/STEP);
  if(!inSim())applyLook();
  for(const e of G.ents)animEnt(e,dt,alpha);
  if(G.state==='lobby'||G.state==='search')animHero(dt);
  fx.update(dt);updateSlashes(dt);
  waterT+=dt;if(MAP.waterTex)MAP.waterTex.offset.set(waterT*.01,waterT*.006);
  if(MAP.clouds)MAP.clouds.children.forEach((c,i)=>{c.position.x+=dt*(1+i%3*.5);if(c.position.x>180)c.position.x=-180});
  for(const f of MAP.anims)f(dt,waterT);
  // flags
  for(let tm=0;tm<2;tm++){
    const F=MAP.flagsGfx[tm],f=G.flags[tm];if(!F||!f)continue;
    if(f.state==='carried'&&f.carrier){const c=f.carrier;F.g.position.set(c.x-Math.sin(c.yaw)*.55,c.y+.2,c.z-Math.cos(c.yaw)*.55);F.g.scale.setScalar(.7)}
    else{F.g.position.set(f.x,f.y,f.z);F.g.scale.setScalar(1)}
    const pa=F.cloth.geometry.attributes.position,o=F.orig,tt=now*.004;
    for(let i=0;i<pa.count;i++){const x=o[i*3];pa.array[i*3+2]=Math.sin(tt*2+x*2.2)*.16*x}
    pa.needsUpdate=true;
  }
  if(G.player&&inSim()&&G.state!=='over'){updateHUD(dt)}
  const pyaw=look.yaw,ppit=look.pitch;
  updateCamera(dt,alpha);
  // viewmodel
  const showVM=G.player&&G.player.alive&&inSim()&&G.state!=='over'&&!G.paused;
  if(showVM){updateViewmodel(dt,G.player,Math.min(1,Math.hypot(G.player.velx,G.player.velz)/6.6)*(G.player.grounded?1:.2),pyaw-prevLookYaw,ppit-prevLookPitch)}
  prevLookYaw=pyaw;prevLookPitch=ppit;
  renderer.clear();
  renderer.render(scene,camera);
  if(showVM){renderer.clearDepth();VM.hand.visible=true;vmCam.position.set(0,0,0);renderer.render(vmScene,vmCam)}
}
window.resumeAfterAd=()=>{};

/* ================= Boot ================= */
async function boot(){
  if(!siteOK()){$('loading').classList.add('hide');$('sitelock').classList.remove('hide');return}
  document.body.classList.toggle('touchmode',IS_TOUCH);
  loadMap('bridges');initHero();mkFlags();
  L=detectLang();applyQuality();
  requestAnimationFrame(t0=>{last=t0;frame(t0)});
  await initSDK();
  if(sdkDevice==='mobile'||sdkDevice==='tablet')IS_TOUCH=true;
  document.body.classList.toggle('touchmode',IS_TOUCH);
  L=detectLang();checkDaily();applyVolume();
  applyLang();showLobby();
  if(!S.daily.loginDone){S.daily.loginDone=true;const rw=STREAK[Math.min(6,S.login.streak-1)];S.coins+=rw;save();refreshLobby();setTimeout(()=>toastG(t('login_reward',{d:S.login.streak,n:rw})),600)}
  window.onUserChanged=refreshLobby;
  $('loading').classList.add('hide');
  gp.loaded();
  let inv=null;try{inv=(sdkOK&&CG&&CG.game.getInviteParam&&CG.game.getInviteParam('room'))||new URLSearchParams(location.search).get('room')}catch(e){}
  if(inv)setTimeout(()=>joinPrivate(inv),400);
  else{let inst=false;try{inst=!!(sdkOK&&CG&&CG.game.isInstantMultiplayer)}catch(e){}if(inst)setTimeout(startSearch,400)}
}
boot();
window.__dbg={startLocal,NET,hostStart,joinPrivate,hostPrivate,netConnect,buildRoster,applySnap,buildSnap,tick:(n)=>{for(let i=0;i<n;i++){readPlayerInput(STEP);updateGame(STEP);for(const e of G.ents)animEnt(e,STEP,1);fx.update(STEP);updateCamera(STEP,1)}},G,S,MAP,NAV,startMatch,showLobby,startSearch,look,keys,camera,navPath,loadMap};
