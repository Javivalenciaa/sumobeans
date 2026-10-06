/* ================= Game state & physics ================= */
const GRAV=26,JUMP=8.6,RAD=.42;
const G={state:'lobby',ents:[],player:null,score:[0,0],time:240,clock:0,ot:false,flags:[],bolts:[],coins:[],chest:{has:true,kind:'shield',t:0},shake:0,hitFlash:0,feedQ:[],countdown:0,over:null,roster:null};
let nextId=1;
const WSPEC={sword:{cd:.4,range:2.3,half:.95},spear:{cd:.8,range:3.5,half:.3,sweepR:2.9},xbow:{cd:.7,speed:23,life:1.3}};

function groundAt(x,z,y){let h=baseGround(x,z);for(const s of SOLIDS){if(x>s.x0-.2&&x<s.x1+.2&&z>s.z0-.2&&z<s.z1+.2&&s.top<=y+.5&&s.top>h)h=s.top}return h}
function collideSolids(e){
  for(const s of SOLIDS){
    if(e.y>=s.top-.25)continue;
    const cx=clamp(e.x,s.x0,s.x1),cz=clamp(e.z,s.z0,s.z1),dx=e.x-cx,dz=e.z-cz,d2=dx*dx+dz*dz;
    if(d2<RAD*RAD){
      if(d2>1e-6){const d=Math.sqrt(d2),p=RAD-d;e.x+=dx/d*p;e.z+=dz/d*p}
      else{const l=e.x-s.x0,r=s.x1-e.x,t=e.z-s.z0,b=s.z1-e.z,m=Math.min(l,r,t,b);if(m===l)e.x=s.x0-RAD;else if(m===r)e.x=s.x1+RAD;else if(m===t)e.z=s.z0-RAD;else e.z=s.z1+RAD}
    }
  }
}
function tryMove(e,nx,nz){const g=groundAt(nx,nz,e.y);if(e.grounded&&g>e.y+.45)return false;e.x=nx;e.z=nz;return true}

function mkEnt(team,name,weapon,isPlayer,skill){
  const gfx=makeChar(team,name);setWeaponGfx(gfx,weapon);scene.add(gfx.root);
  const e={id:nextId++,team,name,weapon,nextWeapon:weapon,isPlayer,x:0,y:0,z:0,vy:0,kx:0,kz:0,velx:0,velz:0,yaw:team?-Math.PI/2:Math.PI/2,hp:3,alive:true,respawn:0,shield:0,prot:0,boots:0,airJ:false,jp:false,grounded:true,air:0,
    carry:null,item:null,cdA:0,cdD:0,dashT:0,dashX:0,dashZ:0,atk:null,combo:0,comboT:0,charge:0,ammo:3,reload:0,idleShot:0,stun:0,slow:0,hurt:[],regenT:0,gfx,spin:0,
    stats:{caps:0,rets:0,assists:0,coins:0,loot:0,kills:0,carry:0},eq:{hat:'',pack:'',trail:''},
    in:{mx:0,mz:0,jump:false,atk:false,dash:false,use:false,aimYaw:0},ai:isPlayer?null:newAI(skill)};
  return e;
}
function placeAtSpawn(e){
  const s=SPAWN[e.team];e.x=s.x+rand(-3,3)*(e.team?-1:1)*.5;e.z=rand(-9,9);e.y=baseGround(e.x,e.z);e.vy=0;e.kx=e.kz=0;e.velx=e.velz=0;
  e.yaw=e.team?-Math.PI/2:Math.PI/2;e.grounded=true;
}

/* ---------- flags ---------- */
function mkFlags(){G.flags=[0,1].map(t=>({team:t,state:'home',x:FLAGSTAND[t].x,z:FLAGSTAND[t].z,y:.5,carrier:null,timer:0}))}
function dropFlag(e){
  const f=e.carry;if(!f)return;e.carry=null;
  const g=groundAt(e.x,e.z,e.y+.5);
  if(g===-Infinity||e.y<-.5){returnFlag(f,null,true);return}
  f.state='dropped';f.carrier=null;f.x=e.x;f.z=e.z;f.y=g;f.timer=20;feed(`<b>${e.name}</b> soltó la bandera ${f.team?'roja':'azul'}`);
}
function returnFlag(f,by,silent){
  f.state='home';f.carrier=null;f.x=FLAGSTAND[f.team].x;f.z=FLAGSTAND[f.team].z;f.y=.5;
  if(by&&!silent){by.stats.rets++;feed(`<b>${by.name}</b> devolvió la bandera ${f.team?'roja':'azul'}`);sfx.ret();if(by.isPlayer)bigToast('¡Bandera devuelta!',40)}
}
function updateFlags(dt){
  for(const f of G.flags){
    if(f.state==='carried'){f.x=f.carrier.x;f.z=f.carrier.z;f.y=f.carrier.y;continue}
    for(const e of G.ents){
      if(!e.alive||e.stun>.3)continue;
      if(dist2(e.x,e.z,f.x,f.z)>1.5*1.5||Math.abs(e.y-f.y)>1.6)continue;
      if(e.team!==f.team&&!e.carry){ // pick up enemy flag
        f.state='carried';f.carrier=e;e.carry=f;f.timer=0;sfx.flag();
        feed(`<b>${e.name}</b> robó la bandera ${f.team?'roja':'azul'}`);
        if(e.isPlayer)bigToast('¡Tienes la bandera! Llévala a tu base',34);else if(e.team===0)bigToast('¡Tu equipo robó la bandera!',34);else bigToast('¡Te han robado la bandera!',34);
        break;
      }else if(e.team===f.team&&f.state==='dropped'){returnFlag(f,e);break}
    }
    if(f.state==='dropped'){f.timer-=dt;if(f.timer<=0)returnFlag(f,null,true)}
  }
  // captures
  for(const e of G.ents){
    if(!e.alive||!e.carry)continue;
    const st=FLAGSTAND[e.team],own=G.flags[e.team];
    if(dist2(e.x,e.z,st.x,st.z)<2.2*2.2&&own.state==='home'){
      const f=e.carry;e.carry=null;returnFlag(f,null,true);e.stats.caps++;G.score[e.team]++;
      sfx.cap();fx.burst(st.x,2,st.z,40,e.team?'#ff6a62':'#5aa0ff',9,1.1,6);
      feed(`<b>${e.name}</b> capturó la bandera!`);bigToast(e.team===0?'¡CAPTURA AZUL!':'¡CAPTURA ROJA!',54);
      if(G.score[e.team]>=3||G.ot)endMatch(e.team);
    }
  }
}

/* ---------- combat ---------- */
function feed(html){const d=document.createElement('div');d.innerHTML=html;const f=$('feed');f.appendChild(d);while(f.children.length>5)f.removeChild(f.firstChild);setTimeout(()=>d.remove(),6000)}
function enemiesOf(e){return G.ents.filter(o=>o.alive&&o.team!==e.team)}
function aimYaw(e,range){
  let best=null,bd=1e9;
  for(const o of G.ents){
    if(!o.alive||o.team===e.team)continue;
    const dx=o.x-e.x,dz=o.z-e.z,d=Math.hypot(dx,dz);if(d>range*1.5||d<.01)continue;
    const a=Math.abs(angDiff(e.in.aimYaw,Math.atan2(dx,dz)));if(a<.85&&d<bd){bd=d;best=o}
  }
  return best?Math.atan2(best.x-e.x,best.z-e.z):e.in.aimYaw;
}
function hurt(t,amount,att,kx,kz,stun,slow){
  if(!t.alive||G.state!=='play')return false;
  if(t.prot>0)return false;
  if(t.shield>0){t.shield=0;fx.burst(t.x,t.y+.9,t.z,18,'#9fe8ff',5,.5);sfx.pop();t.kx+=kx*.4;t.kz+=kz*.4;return true}
  t.hp-=amount;t.kx+=kx;t.kz+=kz;t.stun=Math.max(t.stun,stun||.2);t.slow=Math.max(t.slow,slow||0);t.regenT=5;
  if(att)t.hurt.push({id:att.id,team:att.team,t:G.clock});
  fx.burst(t.x,t.y+.9,t.z,10,'#ffffff',4.5,.35);fx.burst(t.x,t.y+.9,t.z,6,'#ffd23f',3,.3);sfx.hit();
  setTag(t.gfx,t.name,Math.max(0,t.hp),t.team);
  if(t.isPlayer){G.shake=.35;G.hitFlash=.35}
  if(t.hp<=0.01)die(t,att);
  return true;
}
function die(t,att,water){
  t.alive=false;t.respawn=4;t.hp=0;dropFlag(t);t.atk=null;t.gfx.root.visible=false;t.item=null;t.shield=0;t.boots=0;
  fx.burst(t.x,t.y+.8,t.z,28,t.team?'#ff6a62':'#5aa0ff',7,.7);fx.burst(t.x,t.y+.8,t.z,14,'#fff',5,.5);
  if(water)fx.burst(t.x,0,t.z,24,'#bfe8ff',6,.7);
  sfx.pop();
  if(att&&att!==t){
    att.stats.kills++;
    for(const h of t.hurt){if(G.clock-h.t<4&&h.id!==att.id&&h.team===att.team){const a=G.ents.find(x=>x.id===h.id);if(a){a.stats.assists++}}}
    feed(`<b style="color:${TEAMC[att.team].css}">${att.name}</b> derrotó a <b style="color:${TEAMC[t.team].css}">${t.name}</b>`);
  }else feed(`<b style="color:${TEAMC[t.team].css}">${t.name}</b> ${water?'cayó al agua':'fue derrotado'}`);
  t.hurt.length=0;
  if(t.isPlayer)uiDead(true);
}
function respawn(e){
  e.alive=true;e.hp=3;e.prot=1.5;placeAtSpawn(e);e.gfx.root.visible=true;e.ammo=3;e.reload=0;e.stun=0;e.slow=0;e.cdA=0;e.hurt.length=0;
  if(e.nextWeapon!==e.weapon){e.weapon=e.nextWeapon;setWeaponGfx(e.gfx,e.weapon)}
  setTag(e.gfx,e.name,3,e.team);
  if(e.isPlayer)uiDead(false);
}
function coneHits(e,range,half,fn){
  for(const o of G.ents){
    if(!o.alive||o.team===e.team)continue;
    const dx=o.x-e.x,dz=o.z-e.z,d=Math.hypot(dx,dz);if(d-.4>range||Math.abs(o.y-e.y)>1.7)continue;
    if(d>.6&&Math.abs(angDiff(e.yaw,Math.atan2(dx,dz)))>half)continue;
    fn(o,dx/(d||1),dz/(d||1));
  }
}
function startAttack(e){
  if(e.atk||e.cdA>0||e.stun>.1||!e.alive||G.state!=='play')return;
  const W=e.weapon;e.yaw=aimYaw(e,WSPEC[W].range||10);e.in.aimYaw=e.yaw;
  if(W==='sword'){
    if(e.comboT<=0)e.combo=0;
    const c=e.combo;e.atk={kind:'sword',t:0,dur:c===2?.62:.42,hit:c===2?.2:.12,done:false,c};
    e.combo=(c+1)%3;e.comboT=.9;e.kx+=Math.sin(e.yaw)*(c===2?5:3.2);e.kz+=Math.cos(e.yaw)*(c===2?5:3.2);sfx.swing();
  }else if(W==='spear'){
    const sweep=e.charge>=.5;e.atk={kind:sweep?'sweep':'thrust',t:0,dur:sweep?.7:.55,hit:sweep?.22:.18,done:false,hitAny:false};e.charge=0;sfx.swing();
  }else{
    if(e.reload>0)return;
    const near=enemiesOf(e).find(o=>Math.hypot(o.x-e.x,o.z-e.z)<1.6&&Math.abs(angDiff(e.yaw,Math.atan2(o.x-e.x,o.z-e.z)))<.9);
    if(near){e.atk={kind:'shove',t:0,dur:.4,hit:.1,done:false};sfx.swing();return}
    if(e.ammo<=0)return;
    e.atk={kind:'shoot',t:0,dur:.35,hit:.1,done:false};
  }
}
function atkEffect(e){
  const a=e.atk,y=e.yaw;a.done=true;const fx_=Math.sin(y),fz_=Math.cos(y);
  if(a.kind==='sword'){
    slashFx(e.x,e.y+.7,e.z,y,WSPEC.sword.range,WSPEC.sword.half,a.c===2?0xffe45a:0xffffff);
    coneHits(e,WSPEC.sword.range,WSPEC.sword.half,(o,dx,dz)=>{const k=a.c===2?9:4.5;hurt(o,1,e,dx*k,dz*k,a.c===2?.5:.25)})
  }else if(a.kind==='thrust'){
    slashFx(e.x,e.y+.7,e.z,y,WSPEC.spear.range,.25,0xcfe8ff);
    coneHits(e,WSPEC.spear.range,WSPEC.spear.half,(o,dx,dz)=>{if(hurt(o,1,e,dx*11,dz*11,.35))a.hitAny=true})
  }else if(a.kind==='sweep'){
    slashFx(e.x,e.y+.6,e.z,y,WSPEC.spear.sweepR,Math.PI*.55,0xffd27a);
    coneHits(e,WSPEC.spear.sweepR,Math.PI*.55,(o,dx,dz)=>{hurt(o,1,e,dx*12,dz*12,.45);});sfx.swing();
  }else if(a.kind==='shove'){
    coneHits(e,1.8,.9,(o,dx,dz)=>{hurt(o,.25,e,dx*8,dz*8,.3)});slashFx(e.x,e.y+.5,e.z,y,1.6,.8,0xffffff);
  }else if(a.kind==='shoot'){
    e.ammo--;e.idleShot=0;e.cdA=WSPEC.xbow.cd;if(e.ammo<=0)e.reload=2.2;
    const m=shadowed(new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.7,6),M(0xe8eef5)));m.rotation.x=Math.PI/2;
    const g=new THREE.Group();g.add(m);const tip=new THREE.Mesh(new THREE.ConeGeometry(.09,.25,6),M(0xffd23f));tip.rotation.x=Math.PI/2;tip.position.z=.45;g.add(tip);
    g.position.set(e.x+fx_*.8,e.y+.95,e.z+fz_*.8);g.rotation.y=y;scene.add(g);
    G.bolts.push({g,x:g.position.x,y:g.position.y,z:g.position.z,vx:fx_*WSPEC.xbow.speed,vz:fz_*WSPEC.xbow.speed,life:WSPEC.xbow.life,owner:e});
    sfx.shoot();fx.burst(g.position.x,g.position.y,g.position.z,4,'#fff',2,.2,0);
  }
}
function updateBolts(dt){
  for(let i=G.bolts.length-1;i>=0;i--){
    const b=G.bolts[i];b.life-=dt;b.x+=b.vx*dt;b.z+=b.vz*dt;b.g.position.set(b.x,b.y,b.z);
    let kill=b.life<=0;
    if(!kill)for(const o of G.ents){
      if(!o.alive||o.team===b.owner.team)continue;
      if(dist2(o.x,o.z,b.x,b.z)<.55*.55&&b.y>o.y&&b.y<o.y+1.5){
        const d=Math.hypot(b.vx,b.vz);hurt(o,.75,b.owner,b.vx/d*3,b.vz/d*3,.25,1.0);kill=true;break;
      }
    }
    if(!kill)for(const s of SOLIDS){if(b.x>s.x0&&b.x<s.x1&&b.z>s.z0&&b.z<s.z1&&b.y<s.top+.2&&s.kind!=='rail'){kill=true;fx.burst(b.x,b.y,b.z,6,'#ffe9a0',3,.25);break}}
    if(kill){scene.remove(b.g);b.g.traverse(o=>{if(o.geometry)o.geometry.dispose()});G.bolts.splice(i,1)}
  }
}

/* ---------- per-entity update ---------- */
function useItem(e){
  if(!e.item||!e.alive)return;
  if(e.item==='shield'){e.shield=9;sfx.item();toastIf(e,'Escudo activado')}
  else{e.boots=9;e.airJ=false;sfx.item();toastIf(e,'Doble salto 9s')}
  e.item=null;
}
function toastIf(e,m){if(e.isPlayer)toast(m)}
function stepEnt(e,dt){
  if(!e.alive){e.respawn-=dt;if(e.respawn<=0&&G.state==='play')respawn(e);return}
  const I=e.in;
  e.cdA=Math.max(0,e.cdA-dt);e.cdD=Math.max(0,e.cdD-dt);e.stun=Math.max(0,e.stun-dt);e.slow=Math.max(0,e.slow-dt);e.prot=Math.max(0,e.prot-dt);
  e.shield=e.shield>0?Math.max(0,e.shield-dt):0;e.boots=Math.max(0,e.boots-dt);e.comboT=Math.max(0,e.comboT-dt);e.regenT=Math.max(0,e.regenT-dt);
  // regen / base heal
  const own=FLAGSTAND[e.team];
  if(dist2(e.x,e.z,own.x,own.z)<7*7){if(e.hp<3){e.hp=Math.min(3,e.hp+dt*1.2);const q=Math.floor(e.hp*2);if(q!==e.tq){e.tq=q;setTag(e.gfx,e.name,e.hp,e.team)}}}
  else if(e.regenT<=0&&e.hp<3){e.hp=Math.min(3,e.hp+dt*.25)}
  if(e.carry)e.stats.carry+=dt;
  // crossbow reload
  if(e.weapon==='xbow'){
    if(e.reload>0){e.reload-=dt;if(e.reload<=0)e.ammo=3}
    else if(e.ammo<3){e.idleShot+=dt;if(e.idleShot>1.4){e.reload=1.2}}
  }
  // attack input
  if(e.weapon==='spear'){
    if(I.atk&&!e.atk&&e.cdA<=0&&e.stun<=0)e.charge+=dt;
    if(!I.atk&&e.charge>0){if(!e.atk&&e.cdA<=0)startAttack(e);else e.charge=0}
    if(e.atk)e.charge=0;
  }else if(I.atk)startAttack(e);
  if(e.atk){
    const a=e.atk;a.t+=dt;
    if(!a.done&&a.t>=a.hit)atkEffect(e);
    if(a.t>=a.dur){
      if(a.kind==='thrust'&&!a.hitAny)e.cdA=.55;else if(a.kind==='thrust'||a.kind==='sweep')e.cdA=.25;else if(a.kind==='sword')e.cdA=a.c===2?.45:.1;else if(a.kind==='shove')e.cdA=.3;
      e.atk=null;
    }
  }
  // dash
  if(I.dash&&e.cdD<=0&&e.stun<=0&&e.dashT<=0){
    let dx=I.mx,dz=I.mz;if(Math.hypot(dx,dz)<.1){dx=Math.sin(e.yaw);dz=Math.cos(e.yaw)}
    const l=Math.hypot(dx,dz);dx/=l;dz/=l;const sp=e.weapon==='sword'?21:16;e.dashT=.18;e.dashX=dx*sp;e.dashZ=dz*sp;e.cdD=e.weapon==='sword'?3.5:4.5;
    sfx.dash();fx.burst(e.x,e.y+.4,e.z,8,'#ffffff',3,.3,0);e.yaw=Math.atan2(dx,dz);
  }
  if(e.dashT>0)e.dashT-=dt;
  if(I.use&&e.item){useItem(e);I.use=false}
  // movement
  let spd=6.4;if(e.carry)spd*=.88;if(e.slow>0)spd*=.55;if(e.stun>0)spd*=.35;
  if(e.atk)spd*=(e.atk.kind==='sword'?.55:e.atk.kind==='shoot'?.7:.4);
  if(e.weapon==='spear'&&e.charge>0)spd*=.6;
  let vx=I.mx*spd,vz=I.mz*spd;if(e.dashT>0){vx=e.dashX;vz=e.dashZ}
  vx+=e.kx;vz+=e.kz;const kd=Math.pow(.015,dt);e.kx*=kd;e.kz*=kd;
  const ox=e.x,oz=e.z;
  tryMove(e,e.x+vx*dt,e.z);tryMove(e,e.x,e.z+vz*dt);collideSolids(e);
  // separation from other characters
  for(const o of G.ents){if(o===e||!o.alive)continue;const dx=e.x-o.x,dz=e.z-o.z,d=Math.hypot(dx,dz);if(d<.8&&d>.001){const p=(.8-d)*.5;e.x+=dx/d*p;e.z+=dz/d*p}}
  // vertical
  const g2=groundAt(e.x,e.z,e.y);
  const jumpEdge=I.jump&&!e.jp;e.jp=I.jump;
  if(e.grounded)e.air=0;else e.air+=dt;
  if(jumpEdge&&e.stun<=0){
    if(e.grounded||e.air<.1){e.vy=JUMP;e.grounded=false;e.air=1;sfx.jump();fx.burst(e.x,e.y+.1,e.z,5,'#fff',2,.25,0)}
    else if(e.boots>0&&!e.airJ){e.vy=JUMP*.9;e.airJ=true;sfx.jump();fx.burst(e.x,e.y+.1,e.z,10,'#9fe8ff',3,.35,0)}
  }
  if(e.grounded&&g2>-Infinity&&g2>e.y&&g2<=e.y+.5){e.y=g2}
  const py=e.y;e.vy-=GRAV*dt;e.y+=e.vy*dt;
  if(g2>-Infinity&&e.vy<=0&&py>=g2-.3&&e.y<=g2){if(!e.grounded&&e.vy<-6)fx.burst(e.x,g2+.05,e.z,6,'#d8c9a0',2.5,.3,6);e.y=g2;e.vy=0;e.grounded=true;e.airJ=false}else e.grounded=false;
  if(e.y<-1.2&&!e.splash){e.splash=true;fx.burst(e.x,-.8,e.z,18,'#bfe8ff',5,.6);sfx.pop()}
  if(e.y>-1)e.splash=false;
  if(e.y<-4)die(e,e.lastAtt||null,true);
  e.velx=(e.x-ox)/dt;e.velz=(e.z-oz)/dt;
  // facing
  if(e.atk){/* yaw fixed */}
  else if(Math.hypot(I.mx,I.mz)>.1||e.dashT>0){const ty=e.dashT>0?Math.atan2(e.dashX,e.dashZ):Math.atan2(I.mx,I.mz);e.yaw+=angDiff(e.yaw,ty)*Math.min(1,dt*14)}
  else if(e.isPlayer&&false){}
  // trail
  const tr=e.eq.trail?catById(e.eq.trail):null;
  if(tr&&e.grounded&&Math.hypot(e.velx,e.velz)>2&&Math.random()<.5)fx.p(e.x+rand(-.15,.15),e.y+.1,e.z+rand(-.15,.15),rand(-.3,.3),rand(.3,1),rand(-.3,.3),.6,tr.col,-1);
  if(e.boots>0&&Math.random()<.2)fx.p(e.x,e.y+.1,e.z,rand(-.5,.5),1,rand(-.5,.5),.4,'#9fe8ff',0);
}
function animEnt(e,dt){
  const g=e.gfx,P=g.P;g.root.visible=e.alive;if(!e.alive)return;
  g.root.position.set(e.x,e.y,e.z);
  let ry=g.root.rotation.y;ry+=angDiff(ry,e.yaw)*Math.min(1,dt*16);g.root.rotation.y=ry;
  const sp=Math.hypot(e.velx,e.velz),A=e.anim||(e.anim={t:0});
  A.t+=dt*(2+sp*1.25);const sw=Math.sin(A.t)*Math.min(1,sp/4);
  P.legL.rotation.x=sw*.9;P.legR.rotation.x=-sw*.9;
  P.armL.rotation.x=-sw*.7;
  g.body.position.y=e.grounded?Math.abs(Math.sin(A.t))*.07*Math.min(1,sp/4):0;
  g.body.rotation.x=e.dashT>0?.5:(e.stun>.05?-.25:0);
  P.armR.rotation.x=-.9+(sw*.25);P.holder.rotation.x=Math.PI/2;P.wk.position.set(0,0,0);P.wk.rotation.set(0,0,0);
  if(P.spinner)P.spinner.rotation.y+=dt*20;
  g.body.rotation.y=0;
  const a=e.atk;
  if(a){
    const u=a.t/a.dur;
    if(a.kind==='sword'){const k=Math.min(1,a.t/Math.max(.001,a.hit+.05));P.armR.rotation.x=lerp(-2.4,-.1,k);if(a.c===1)P.armR.rotation.z=lerp(.8,-.8,k);else P.armR.rotation.z=0;if(a.c===2)g.body.rotation.y=u*TAU}
    else if(a.kind==='thrust'){P.armR.rotation.x=-1.45;P.wk.position.y=u<.35?lerp(0,1.3,u/.35):lerp(1.3,0,(u-.35)/.65)}
    else if(a.kind==='sweep'){P.armR.rotation.x=-1.45;g.body.rotation.y=Math.min(1,u*1.4)*TAU}
    else if(a.kind==='shoot'||a.kind==='shove'){P.armR.rotation.x=-1.5+(a.t<.1?.2:0);P.armL.rotation.x=-1.3}
  }else{P.armR.rotation.z=0;if(e.weapon==='spear'&&e.charge>0){P.armR.rotation.x=-1.2;P.wk.position.y=-.5}}
  if(P.wk.userData.bolt)P.wk.userData.bolt.visible=e.ammo>0&&e.reload<=0;
  P.bubble.visible=e.shield>0||e.prot>0;if(P.bubble.visible)P.bubble.scale.setScalar(1+Math.sin(performance.now()*.01)*.04);
  P.bubble.material.color.setHex(e.shield>0?0x7fd8ff:0xffffff);
  g.root.scale.setScalar(1);
}

/* ---------- coins & chest ---------- */
function updatePickups(dt){
  for(let i=0;i<coinGfx.length;i++){
    const m=coinGfx[i];m.rotation.y+=dt*3;
    const c=G.coins[i];
    if(!c.on){c.t-=dt;if(c.t<=0){c.on=true;m.visible=true}continue}
    m.position.y=baseGround(c.x,c.z)+.9+Math.sin(G.clock*3+i)*.1;
    for(const e of G.ents){
      if(!e.alive||dist2(e.x,e.z,c.x,c.z)>1.4*1.4||Math.abs(e.y-m.position.y+.9)>1.8)continue;
      c.on=false;c.t=25;m.visible=false;e.stats.coins++;if(e.isPlayer){sfx.coin();G.matchCoins++}
      fx.burst(c.x,m.position.y,c.z,6,'#ffe066',3,.4,2);break;
    }
  }
  // chest
  const ch=G.chest,it=chestGfx.userData.item;
  it.visible=ch.has;chestGfx.userData.glow.intensity=ch.has?1.4:.2;
  if(ch.has){it.rotation.y+=dt*3;it.position.y=1.9+Math.sin(G.clock*3)*.15;it.material.color.setHex(ch.kind==='shield'?0x7fd8ff:0xff9a3d);
    for(const e of G.ents){if(!e.alive||e.item||dist2(e.x,e.z,CHEST.x,CHEST.z)>2.2*2.2)continue;e.item=ch.kind;ch.has=false;ch.t=25;e.stats.loot++;sfx.item();
      feed(`<b>${e.name}</b> abrió el cofre: ${ch.kind==='shield'?'Escudo':'Botas de resorte'}`);if(e.isPlayer)toast('Pulsa E para usar el objeto');break}
  }else{ch.t-=dt;if(ch.t<=0){ch.has=true;ch.kind=Math.random()<.5?'shield':'boots'}}
}

/* ================= Bots ================= */
const NAMES=['Lucia','Dani_77','Marcos','Pipo','Nerea','Kai','Sara_G','Hugo','Iker','Alba','Tomi','Chus','Vero','Rafa','Mimi','Jorge','Noa','Leo_x','Bruno','Carla','Pau','Izan','Mar','Teo','Ainhoa','Gael','Yago','Lola','Biel','Zoe','Nico','Ada','xXLoboXx','Peke','Kiwi','Sofi','Mateo','Dario','Irene','Cris','Alex_09','Paula','Javi','Ruben','Marta','Tito'];
const NODES=[],EDGES=[];
(()=>{
  const L=[[-41,0],[-32,0],[-32,-14],[-32,14],[-24,0],[-24,-15],[-24,15],[-14,0],[-14,-14],[-14,14],[0,0],[0,-14],[0,14]];
  L.forEach(p=>NODES.push(p));
  const m=i=>i<10?13+i:i;
  for(let i=0;i<10;i++)NODES.push([-L[i][0],L[i][1]]);
  const ed=[[0,1],[0,2],[0,3],[1,4],[2,5],[3,6],[4,7],[5,8],[6,9],[7,8],[7,9],[7,10],[8,11],[9,12],[10,11],[10,12]];
  for(const e of ed){EDGES.push([e[0],e[1]]);const a=m(e[0]),b=m(e[1]);if(a!==e[0]||b!==e[1])EDGES.push([a,b])}
  EDGES.push([10,20]);EDGES.push([11,21]); // placeholders overwritten below
  EDGES.length-=2;
  // center to mirrored west/east nodes: CC-CE(20), CN-CNE(21), CS-CSE(22)
  EDGES.push([10,20],[11,21],[12,22]);
})();
const ADJ=NODES.map(()=>[]);for(const [a,b] of EDGES){ADJ[a].push(b);ADJ[b].push(a)}
function nearestNode(x,z){let b=0,bd=1e9;for(let i=0;i<NODES.length;i++){const d=dist2(x,z,NODES[i][0],NODES[i][1]);if(d<bd){bd=d;b=i}}return b}
function findPath(a,b){
  if(a===b)return[a];
  const dist=new Array(NODES.length).fill(1e9),prev=new Array(NODES.length).fill(-1),done=new Array(NODES.length).fill(false);dist[a]=0;
  for(;;){let u=-1,ud=1e9;for(let i=0;i<NODES.length;i++)if(!done[i]&&dist[i]<ud){ud=dist[i];u=i}if(u<0||u===b)break;done[u]=true;
    for(const v of ADJ[u]){const w=Math.hypot(NODES[u][0]-NODES[v][0],NODES[u][1]-NODES[v][1]);if(dist[u]+w<dist[v]){dist[v]=dist[u]+w;prev[v]=u}}}
  const p=[];for(let c=b;c>=0;c=prev[c])p.unshift(c);return p[0]===a?p:[a,b];
}
function lineClear(x0,z0,x1,z1,y){
  const d=Math.hypot(x1-x0,z1-z0),n=Math.ceil(d/1.2);
  for(let i=1;i<=n;i++){const t=i/n,g=baseGround(x0+(x1-x0)*t,z0+(z1-z0)*t);if(g===-Infinity||g>y+.6)return false}return true;
}
function newAI(skill){
  return{skill:skill||rand(.45,.9),react:rand(.28,.6),aimErr:rand(.04,.2),aggr:rand(.5,1),role:'att',seen:0,path:null,pathT:0,goalX:0,goalZ:0,strafe:1,strafeT:0,stuckT:0,sx:0,sz:0,wait:0,pause:0,atkHold:0,thinkT:rand(0,.3),dashChance:rand(.2,.7),useT:0,wp:0};
}
function botMove(e,tx,tz,dt,stopDist){
  const ai=e.ai,I=e.in;let dx=tx-e.x,dz=tz-e.z,d=Math.hypot(dx,dz);
  if(d<(stopDist||.8)){I.mx=I.mz=0;return d}
  let gx=tx,gz=tz;
  if(!lineClear(e.x,e.z,tx,tz,e.y)||d>12){
    const goalNode=nearestNode(tx,tz);
    if(!ai.path||ai.goalNode!==goalNode){
      ai.path=findPath(nearestNode(e.x,e.z),goalNode);ai.goalNode=goalNode;ai.wp=0;
      while(ai.wp<ai.path.length-1){const A=NODES[ai.path[ai.wp]],B=NODES[ai.path[ai.wp+1]];if(Math.hypot(e.x-B[0],e.z-B[1])<Math.hypot(A[0]-B[0],A[1]-B[1]))ai.wp++;else break}
    }
    while(ai.wp<ai.path.length-1&&dist2(e.x,e.z,NODES[ai.path[ai.wp]][0],NODES[ai.path[ai.wp]][1])<2.2*2.2)ai.wp++;
    const nd=NODES[ai.path[ai.wp]];
    if(dist2(e.x,e.z,nd[0],nd[1])>1.2*1.2||ai.wp<ai.path.length-1){gx=nd[0];gz=nd[1]}
  }
  dx=gx-e.x;dz=gz-e.z;d=Math.hypot(dx,dz)||1;
  let mx=dx/d,mz=dz/d;
  // stuck handling
  ai.stuckT+=dt;if(ai.stuckT>.7){const moved=Math.hypot(e.x-ai.sx,e.z-ai.sz);ai.sx=e.x;ai.sz=e.z;ai.stuckT=0;if(moved<.5&&Math.hypot(I.mx,I.mz)>.1){ai.path=null;ai.unstick=.6;ai.ux=-mz*(Math.random()<.5?1:-1);ai.uz=mx;I.jump=true}}
  if(ai.unstick>0){ai.unstick-=dt;mx=mx*.3+ai.ux;mz=mz*.3+ai.uz;if(ai.unstick<.3)I.jump=false}
  // avoid walking off edges
  const nx=e.x+mx*1.3,nz=e.z+mz*1.3;const ng=baseGround(nx,nz);
  if(ng===-Infinity&&e.grounded){const px=-mz,pz=mx;mx=px*.9;mz=pz*.9}
  const l=Math.hypot(mx,mz)||1;I.mx=mx/l;I.mz=mz/l;return d;
}
function thinkBot0(e,dt){
  const ai=e.ai,I=e.in;I.atk=false;I.dash=false;I.use=false;if(!ai.unstick||ai.unstick<=0)I.jump=false;
  if(!e.alive)return;
  if(ai.pause>0){ai.pause-=dt;I.mx=I.mz=0;return}
  const ownF=G.flags[e.team],enF=G.flags[1-e.team],home=FLAGSTAND[e.team],enemyBase=FLAGSTAND[1-e.team];
  // items
  if(e.item){ai.useT+=dt;const foe=nearestFoe(e,8);if(e.item==='shield'&&(foe||ai.useT>8)||e.item==='boots'&&ai.useT>2){I.use=true;ai.useT=0}}
  // foe awareness
  let foe=nearestFoe(e,e.weapon==='xbow'?16:11);
  if(foe){const fd0=Math.hypot(foe.x-e.x,foe.z-e.z);
    if(ai.role==='att'&&!(ownF.state==='carried'&&ownF.carrier===foe)&&fd0>4.2&&Math.random()<.97)foe=null;
    else if(ai.role==='def'&&dist2(e.x,e.z,home.x,home.z)>18*18&&fd0>4)foe=null;
    else if(ai.role==='sup'&&fd0>13)foe=null;}
  let tx=0,tz=0,stop=.8,fight=false;
  const carrier=!!e.carry;
  // goal selection
  if(carrier){
    if(ownF.state==='home'){tx=home.x;tz=home.z;stop=.5}
    else{ // wait near own base for flag return (or hunt)
      if(ownF.state==='dropped'||ownF.state==='carried'){tx=ownF.x;tz=ownF.z;stop=2}
    }
  }else if(ownF.state==='dropped'&&dist2(e.x,e.z,ownF.x,ownF.z)<dist2(e.x,e.z,enF.x,enF.z)*1.6){tx=ownF.x;tz=ownF.z;stop=.3}
  else if(ownF.state==='carried'&&(ai.role!=='sup'||dist2(e.x,e.z,ownF.carrier.x,ownF.carrier.z)<14*14)){tx=ownF.carrier.x;tz=ownF.carrier.z;stop=e.weapon==='xbow'?8:1.5;}
  else if(enF.state==='carried'&&enF.carrier.team===e.team&&enF.carrier!==e){ // escort
    const c=enF.carrier;const dir=Math.sign(home.x-c.x)||1;tx=c.x+(e.weapon==='spear'?-dir*0:dir*0)+(e.weapon==='spear'?dir*-4:dir*3);tz=c.z+(e.id%2?3:-3);stop=1.5;
  }else if(ai.role==='att'||(ai.role==='sup'&&enF.state==='dropped')){tx=enF.x;tz=enF.z;stop=.3}
  else if(ai.role==='def'){ // patrol near own flag
    ai.wait-=dt;if(ai.wait<=0||!ai.gx){ai.wait=rand(3,7);ai.gx=home.x+(e.team?-1:1)*rand(2,9);ai.gz=rand(-10,10)}tx=ai.gx;tz=ai.gz;stop=1.2;
    if(enF.state==='home'&&G.ents.filter(o=>o.team===e.team&&o.alive&&o.ai&&o.ai.role==='att').length===0)ai.role='att';
  }else{ // support: between own base and center, covering
    ai.wait-=dt;if(ai.wait<=0||!ai.gx){ai.wait=rand(3,6);const wp=walkPoint(e.team?1:-1);ai.gx=wp[0];ai.gz=wp[1]}tx=ai.gx;tz=ai.gz;stop=1.5;
  }
  // coins opportunism
  if(!carrier&&!foe&&ai.role!=='def'){let bd=64,bc=null;for(const c of G.coins){if(!c.on)continue;const d=dist2(e.x,e.z,c.x,c.z);if(d<bd){bd=d;bc=c}}if(bc&&dist2(e.x,e.z,tx,tz)>25){tx=bc.x;tz=bc.z;stop=.3}}
  // combat
  if(foe){
    const fd=Math.hypot(foe.x-e.x,foe.z-e.z),W=e.weapon;
    const rng=W==='sword'?2.2:W==='spear'?3.3:14;
    const block=carrier&&fd>3.2;
    if(!block&&(fd<rng+(W==='xbow'?0:2.5)||ai.aggr>.8&&fd<9)){
      fight=true;ai.seen+=dt;
      if(ai.seen>ai.react){
        const lead=W==='xbow'?fd/WSPEC.xbow.speed:0;
        const ty=Math.atan2(foe.x+foe.velx*lead-e.x,foe.z+foe.velz*lead-e.z)+rand(-ai.aimErr,ai.aimErr)*(1.2-ai.skill);
        I.aimYaw=ty;
        if(!carrier){ai.strafeT-=dt;if(ai.strafeT<=0){ai.strafeT=rand(.8,2);ai.strafe=Math.random()<.5?1:-1}}
        let want=W==='sword'?1.7:W==='spear'?2.6:8.5;
        const fx_=(foe.x-e.x)/(fd||1),fz_=(foe.z-e.z)/(fd||1);
        if(!carrier){
          let mv=fd>want+.5?1:(fd<want-1.2?-1:0);if(W==='xbow'&&fd<5)mv=-1.3;
          I.mx=fx_*mv+(-fz_)*ai.strafe*.6;I.mz=fz_*mv+fx_*ai.strafe*.6;const l=Math.hypot(I.mx,I.mz);if(l>1){I.mx/=l;I.mz/=l}
        }
        const aligned=Math.abs(angDiff(e.yaw,Math.atan2(foe.x-e.x,foe.z-e.z)))<(W==='xbow'?.5:.7);
        if(W==='sword'&&fd<2.5&&aligned&&Math.random()<dt*7)I.atk=true;
        else if(W==='spear'){
          if(ai.atkHold>0){ai.atkHold-=dt;I.atk=true}
          else if(fd<3.4&&aligned&&e.cdA<=0&&Math.random()<dt*3.5){ai.atkHold=Math.random()<.3?.6:.08;I.atk=true}
        }else if(W==='xbow'&&fd<15&&aligned&&e.cdA<=0&&Math.random()<dt*4)I.atk=true;
        // dash
        if(e.cdD<=0&&Math.random()<dt*ai.dashChance*(fd>4&&fd<9?1:.3)&&!(W==='xbow'&&fd>6)){I.dash=true;if(fd>4){I.mx=fx_;I.mz=fz_}else if(e.hp<1.5){I.mx=-fx_;I.mz=-fz_}}
        if(!carrier)return;
      }else{I.mx*=.3;I.mz*=.3}
    }
  }else ai.seen=Math.max(0,ai.seen-dt*2);
  if(!fight||carrier){
    botMove(e,tx,tz,dt,stop);
    // human-ish hesitation
    if(Math.random()<dt*.07&&!carrier&&!fight){ai.pause=rand(.25,.8)}
    if(carrier&&e.cdD<=0){const chaser=nearestFoe(e,5);if(chaser&&Math.random()<dt*2)I.dash=true}
    if(Math.random()<dt*.15&&e.grounded)I.jump=true;
    // face move dir when idle; aim yaw
    I.aimYaw=Math.atan2(I.mx,I.mz);
  }
}
function walkPoint(side){
  for(let i=0;i<14;i++){
    const n=NODES[(Math.random()*NODES.length)|0];if(Math.abs(n[0])>3&&Math.sign(n[0])!==side)continue;
    const x=n[0]+rand(-2,2),z=n[1]+rand(-2,2),m=1.2;
    if(baseGround(x,z)>-Infinity&&baseGround(x+m,z)>-Infinity&&baseGround(x-m,z)>-Infinity&&baseGround(x,z+m)>-Infinity&&baseGround(x,z-m)>-Infinity)return[x,z];
  }
  return[NODES[0][0]*-side*-1,0];
}
function okGround(x,z){const m=.35;return baseGround(x,z)>-Infinity&&baseGround(x+m,z)>-Infinity&&baseGround(x-m,z)>-Infinity&&baseGround(x,z+m)>-Infinity&&baseGround(x,z-m)>-Infinity}
function thinkBot(e,dt){
  thinkBot0(e,dt);if(!e.alive)return;const I=e.in;
  const l=Math.hypot(I.mx,I.mz);
  if(l>.05&&e.grounded){
    const ux=I.mx/l,uz=I.mz/l,look=1.5;
    if(!okGround(e.x+ux*look,e.z+uz*look)){
      let done=false;
      for(const a of[.6,-.6,1.2,-1.2,1.8,-1.8]){const c=Math.cos(a),s2=Math.sin(a),vx=ux*c-uz*s2,vz=ux*s2+uz*c;if(okGround(e.x+vx*look,e.z+vz*look)){I.mx=vx*l;I.mz=vz*l;done=true;break}}
      if(!done){I.mx=I.mz=0}
    }
  }
  if(I.dash){const dx=l>.05?I.mx/l:Math.sin(e.yaw),dz=l>.05?I.mz/l:Math.cos(e.yaw);if(!okGround(e.x+dx*4.2,e.z+dz*4.2)||!okGround(e.x+dx*2,e.z+dz*2))I.dash=false}
}
function nearestFoe(e,r){let b=null,bd=r*r;for(const o of G.ents){if(!o.alive||o.team===e.team)continue;const d=dist2(e.x,e.z,o.x,o.z);if(d<bd&&Math.abs(o.y-e.y)<2.5){bd=d;b=o}}return b}

/* ================= Match flow ================= */
function clearMatch(){
  for(const e of G.ents)scene.remove(e.gfx.root);G.ents=[];G.player=null;
  for(const b of G.bolts)scene.remove(b.g);G.bolts=[];
}
function startMatch(roster){
  clearMatch();mkFlags();G.score=[0,0];G.time=240;G.ot=false;G.clock=0;G.over=null;G.matchCoins=0;G.chest={has:false,kind:'shield',t:12};
  G.coins=COINSPOTS.map(c=>({x:c[0],z:c[1],on:true,t:0}));coinGfx.forEach(m=>m.visible=true);
  const pl=mkEnt(0,'Tú',S.weapon,true);pl.eq=Object.assign({},S.eq);applyCosmetics(pl.gfx,pl.eq);G.player=pl;G.ents.push(pl);
  // weapon plan for bots: 3v3 max 1 crossbow per team
  const plan=t=>{const need=['sword','spear','xbow'];return need};
  const tw=[[S.weapon],[]];
  const pickW=(have)=>{const o=['sword','spear','xbow'].filter(w=>!have.includes(w)||(w!=='xbow'&&Math.random()<.35));return pick(o.length?o:['sword','spear'])};
  const roles={sword:'att',spear:'def',xbow:'sup'};
  for(const r of roster){
    const t=r.team;let w;
    if(t===0)w=pickW(tw[0].concat(tw[0].filter(x=>x==='xbow')));else w=pickW(tw[1]);
    if(w==='xbow'&&tw[t].includes('xbow'))w='spear';
    tw[t].push(w);
    const b=mkEnt(t,r.name,w,false,rand(.45,.92));b.ai.role=roles[w];b.eq={hat:pick(['','','hat_party','hat_helm','hat_horns','hat_crown','hat_prop']),pack:pick(['','','pack_red','pack_pink','pack_gold']),trail:pick(['','','','trail_bubble'])};applyCosmetics(b.gfx,b.eq);
    G.ents.push(b);
  }
  for(const e of G.ents){placeAtSpawn(e);setTag(e.gfx,e.name,3,e.team);e.prot=0;e.in.aimYaw=e.yaw}
  // spread spawn z
  ['0','1'].forEach(t=>{const team=G.ents.filter(e=>e.team==t);team.forEach((e,i)=>{e.z=(i-1)*2.6;e.x=SPAWN[t].x});});
  G.state='count';G.countdown=3.99;$('hud').classList.remove('hide');
  camYaw=G.player.team?Math.PI/2:-Math.PI/2;camYaw=-Math.PI/2*0+(-Math.PI/2);camYaw=-Math.PI/2;
  camPitch=.45;
}
function endMatch(winner){
  if(G.state==='end')return;G.state='end';G.over={winner};gp.stop();
  G.endT=2.2;
}
function updateGame(dt){
  G.clock+=dt;
  if(G.state==='count'){
    const prev=Math.ceil(G.countdown);G.countdown-=dt;const cur=Math.ceil(G.countdown);
    if(cur!==prev&&cur>0)sfx.beep();
    $('cd').classList.toggle('hide',G.countdown<=-.4);$('cd').textContent=G.countdown>0?Math.ceil(G.countdown):'¡YA!';
    for(const e of G.ents){e.in.mx=e.in.mz=0;e.in.atk=false;stepEntFrozen(e,dt)}
    if(G.countdown<=0){G.state='play';sfx.go();gp.start();bigToast('¡Captura la bandera enemiga!',40);setTimeout(()=>$('cd').classList.add('hide'),700)}
    return;
  }
  if(G.state==='end'){G.endT-=dt;for(const e of G.ents){e.in.mx=e.in.mz=0;e.in.atk=false}for(const e of G.ents)stepEnt(e,dt);if(G.endT<=0&&G.state==='end'){G.state='over';showEnd()}return}
  if(G.state!=='play')return;
  G.time-=dt;
  if(G.time<=0){
    if(G.ot){G.time=0;endMatch(-1)}
    else if(G.score[0]!==G.score[1])endMatch(G.score[0]>G.score[1]?0:1);
    else{G.ot=true;G.time=60;bigToast('¡PRÓRROGA! Gana la próxima captura',40)}
  }
  for(const e of G.ents){if(!e.isPlayer)thinkBot(e,dt)}
  for(const e of G.ents)stepEnt(e,dt);
  updateFlags(dt);updateBolts(dt);updatePickups(dt);
}
function stepEntFrozen(e,dt){e.vy=0;e.y=groundAt(e.x,e.z,e.y+.5);e.velx=e.velz=0;e.dashT=0}
