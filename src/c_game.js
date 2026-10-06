/* ================= Game state & physics ================= */
const GRAV=26,JUMP=8.6,RAD=.42,STEP=1/120,EYE=1.22;
const G={byId:{},state:'lobby',ents:[],player:null,score:[0,0],time:240,clock:0,ot:false,flags:[],bolts:[],coins:[],chest:{has:false,kind:'shield',t:0},shake:0,hitFlash:0,countdown:0,over:null,matchCoins:0,paused:false,botAcc:0,endT:0};
let nextId=1;
const WSPEC={sword:{range:2.7,half:1.05},spear:{range:3.7,half:.42,sweepR:3.0},xbow:{speed:44,life:1.5}};

const cn=(n,tm)=>`<b style="color:${TEAMC[tm].css}">${n}</b>`;
function fmtFeed(key,p){
  if(key==='f_kill')return t(key,{a:cn(p.an,p.at),b:cn(p.bn,p.bt)});
  if(key==='f_fall'||key==='f_dead')return t(key,{n:cn(p.n,p.nt)});
  if(key==='f_chest')return t(key,{n:p.n,i:t(p.i)});
  if(key==='f_cap')return t(key,{n:p.n});
  return t(key,{n:p.n,c:t(p.c)});
}
function feedK(key,p){feed(fmtFeed(key,p));netEv({k:'F',key,p})}
function bigTeam(team,key,px){if(G.player&&G.player.team===team)bigToast(t(key),px);netEv({k:'B',team,pid:-1,key,px})}
function bigAll(key,px){bigToast(t(key),px);netEv({k:'B',team:-1,pid:-1,key,px})}
function bigTo(e,key,px){if(e.isPlayer)bigToast(t(key),px);else if(e.remote)netEv({k:'B',pid:e.pid,team:-1,key,px})}
function toastTo(e,key){if(e.isPlayer)toast(t(key));else if(e.remote)netEv({k:'T',pid:e.pid,key})}
function sfxAll(name){if(sfx[name])sfx[name]();netEv({k:'Q',s:name,pid:-1})}
function sfxTo(e,name){if(e.isPlayer){if(sfx[name])sfx[name]()}else if(e.remote)netEv({k:'Q',s:name,pid:e.pid})}
function slashNet(x,y,z,yaw,r,h,c){slashFx(x,y,z,yaw,r,h,c);netEv({k:'L',x:r2(x),y:r2(y),z:r2(z),yaw:r2(yaw),r,h:r2(h),c})}
function groundAt(x,z,y){let h=baseGround(x,z);const S_=MAP.solids;for(let i=0;i<S_.length;i++){const s=S_[i];if(x>s.x0-.2&&x<s.x1+.2&&z>s.z0-.2&&z<s.z1+.2&&s.top<=y+.5&&s.top>h)h=s.top}return h}
function collideSolids(e){
  const S_=MAP.solids;
  for(let i=0;i<S_.length;i++){
    const s=S_[i];if(e.y>=s.top-.25)continue;
    if(e.x<s.x0-RAD||e.x>s.x1+RAD||e.z<s.z0-RAD||e.z>s.z1+RAD)continue;
    const cx=clamp(e.x,s.x0,s.x1),cz=clamp(e.z,s.z0,s.z1),dx=e.x-cx,dz=e.z-cz,d2=dx*dx+dz*dz;
    if(d2<RAD*RAD){
      if(d2>1e-6){const d=Math.sqrt(d2),p=RAD-d;e.x+=dx/d*p;e.z+=dz/d*p}
      else{const l=e.x-s.x0,r=s.x1-e.x,t_=e.z-s.z0,b=s.z1-e.z,m=Math.min(l,r,t_,b);if(m===l)e.x=s.x0-RAD;else if(m===r)e.x=s.x1+RAD;else if(m===t_)e.z=s.z0-RAD;else e.z=s.z1+RAD}
    }
  }
}
function collideWalk(e){
  const W=MAP.walk;
  for(let i=0;i<W.length;i++){
    const r=W[i];if(r.t<=e.y+.5)continue;
    if(e.x<r.x0-RAD||e.x>r.x1+RAD||e.z<r.z0-RAD||e.z>r.z1+RAD)continue;
    const l=e.x-(r.x0-RAD),rr=(r.x1+RAD)-e.x,tt=e.z-(r.z0-RAD),bb=(r.z1+RAD)-e.z,m=Math.min(l,rr,tt,bb);
    if(m===l)e.x=r.x0-RAD;else if(m===rr)e.x=r.x1+RAD;else if(m===tt)e.z=r.z0-RAD;else e.z=r.z1+RAD;
  }
}
function tryMove(e,nx,nz){const g=groundAt(nx,nz,e.y);if(e.grounded&&g>e.y+.46)return false;e.x=nx;e.z=nz;return true}

function mkEnt(team,name,weapon,isPlayer,skill){
  const gfx=makeChar(team,name);setWeaponGfx(gfx,weapon);scene.add(gfx.root);
  const e={id:nextId++,team,name,weapon,nextWeapon:weapon,isPlayer,x:0,y:0,z:0,ppx:0,ppy:0,ppz:0,vx:0,vz:0,vy:0,kx:0,kz:0,velx:0,velz:0,yaw:team?-Math.PI/2:Math.PI/2,hp:3,alive:true,respawn:0,shield:0,prot:0,boots:0,airJ:false,jp:false,grounded:true,air:0,
    carry:null,item:null,cdA:0,cdD:0,dashT:0,dashX:0,dashZ:0,atk:null,combo:0,comboT:0,charge:0,ammo:3,reload:0,idleShot:0,stun:0,slow:0,hurt:[],regenT:0,gfx,fly:null,padCd:0,foot:0,puppet:false,remote:false,pid:-1,useC:0,rsq:0,tx:0,ty:0,tz:0,tyaw:0,tvx:0,tvz:0,snapT:0,
    stats:{caps:0,rets:0,assists:0,coins:0,loot:0,kills:0,carry:0},eq:{hat:'',pack:'',trail:''},anim:{t:0},
    in:{mx:0,mz:0,jump:false,atk:false,dash:false,use:false,aimYaw:0,aimPitch:0},ai:isPlayer?null:newAI(skill)};
  return e;
}
function placeAtSpawn(e,idx){
  const sp=MAP.spawn[e.team],p=sp[(idx===undefined?Math.floor(Math.random()*sp.length):idx)%sp.length];
  e.x=p[0]+rand(-.8,.8);e.z=p[1]+rand(-.8,.8);e.y=baseGround(e.x,e.z);e.vy=0;e.kx=e.kz=0;e.vx=e.vz=0;e.velx=e.velz=0;e.fly=null;
  e.yaw=e.team?-Math.PI/2:Math.PI/2;e.grounded=true;e.ppx=e.x;e.ppy=e.y;e.ppz=e.z;
  if(e.isPlayer){e.in.aimYaw=e.yaw;look.yaw=Math.atan2(-Math.sin(e.yaw),-Math.cos(e.yaw));look.pitch=0}
}

/* ---------- flags ---------- */
function mkFlags(){G.flags=[0,1].map(tm=>({team:tm,state:'home',x:MAP.flag[tm].x,z:MAP.flag[tm].z,y:baseGround(MAP.flag[tm].x,MAP.flag[tm].z),carrier:null,timer:0}))}
function dropFlag(e){
  const f=e.carry;if(!f)return;e.carry=null;
  const g=groundAt(e.x,e.z,e.y+.5);
  if(g===-Infinity||e.y<-.5){returnFlag(f,null,true);return}
  f.state='dropped';f.carrier=null;f.x=e.x;f.z=e.z;f.y=g;f.timer=20;feedK('f_drop',{n:e.name,c:f.team?'red':'blue'});
}
function returnFlag(f,by,silent){
  f.state='home';f.carrier=null;f.x=MAP.flag[f.team].x;f.z=MAP.flag[f.team].z;f.y=baseGround(f.x,f.z);
  if(by&&!silent){by.stats.rets++;feedK('f_ret',{n:by.name,c:f.team?'red':'blue'});sfxAll('ret');bigTo(by,'b_ret',40)}
}
function updateFlags(dt){
  for(const f of G.flags){
    if(f.state==='carried'){f.x=f.carrier.x;f.z=f.carrier.z;f.y=f.carrier.y;continue}
    for(const e of G.ents){
      if(!e.alive||e.stun>.3)continue;
      if(dist2(e.x,e.z,f.x,f.z)>1.6*1.6||Math.abs(e.y-f.y)>1.8)continue;
      if(e.team!==f.team&&!e.carry){
        f.state='carried';f.carrier=e;e.carry=f;f.timer=0;sfxAll('flag');
        feedK('f_steal',{n:e.name,c:f.team?'red':'blue'});
        bigTeam(e.team,'b_mysteal',34);bigTeam(1-e.team,'b_theysteal',34);bigTo(e,'b_have',34);
        break;
      }else if(e.team===f.team&&f.state==='dropped'){returnFlag(f,e);break}
    }
    if(f.state==='dropped'){f.timer-=dt;if(f.timer<=0)returnFlag(f,null,true)}
  }
  for(const e of G.ents){
    if(!e.alive||!e.carry)continue;
    const st=MAP.flag[e.team],own=G.flags[e.team];
    if(dist2(e.x,e.z,st.x,st.z)<2.4*2.4&&own.state==='home'){
      const f=e.carry;e.carry=null;returnFlag(f,null,true);e.stats.caps++;G.score[e.team]++;
      sfxAll('cap');fx.burst(st.x,own.y+2,st.z,40,e.team?'#ff6a62':'#5aa0ff',9,1.1,6);netEv({k:'X',x:st.x,y:own.y+2,z:st.z,n:40,c:e.team?'#ff6a62':'#5aa0ff',s:9,l:1.1,g:6});
      feedK('f_cap',{n:e.name});bigAll(e.team===0?'b_capb':'b_capr',54);
      if(G.score[e.team]>=3||G.ot)endMatch(e.team);
    }
  }
}

/* ---------- combat ---------- */
function enemiesOf(e){return G.ents.filter(o=>o.alive&&o.team!==e.team)}
function aimYawMelee(e,range,cone){
  let best=null,bd=1e9;
  for(const o of G.ents){
    if(!o.alive||o.team===e.team)continue;
    const dx=o.x-e.x,dz=o.z-e.z,d=Math.hypot(dx,dz);if(d>range*1.6||d<.01||Math.abs(o.y-e.y)>2.2)continue;
    const a=Math.abs(angDiff(e.in.aimYaw,Math.atan2(dx,dz)));if(a<cone&&d<bd){bd=d;best=o}
  }
  return best?Math.atan2(best.x-e.x,best.z-e.z):e.in.aimYaw;
}
function aimBolt(e){
  const yaw=e.in.aimYaw,pit=e.in.aimPitch,cp=Math.cos(pit);
  let dx=Math.sin(yaw)*cp,dy=Math.sin(pit),dz=Math.cos(yaw)*cp;
  const ex=e.x,ey=e.y+EYE,ez=e.z;
  if(e.isPlayer){
    const maxAng=IS_TOUCH?.2:.11;let best=null,ba=1e9;
    for(const o of G.ents){
      if(!o.alive||o.team===e.team)continue;
      const vx=o.x-ex,vy=o.y+.8-ey,vz=o.z-ez,d=Math.hypot(vx,vy,vz);if(d<1||d>60)continue;
      const ang=Math.acos(clamp((vx*dx+vy*dy+vz*dz)/d,-1,1));if(ang<maxAng&&ang<ba){ba=ang;best={o,d}}
    }
    if(best){
      const o=best.o,tt=best.d/WSPEC.xbow.speed;
      let px=o.x+o.velx*tt-ex,py=o.y+.8-ey,pz=o.z+o.velz*tt-ez;const l=Math.hypot(px,py,pz);px/=l;py/=l;pz/=l;
      const k=.8;dx=dx*(1-k)+px*k;dy=dy*(1-k)+py*k;dz=dz*(1-k)+pz*k;const n=Math.hypot(dx,dy,dz);dx/=n;dy/=n;dz/=n;
    }
  }
  return{x:ex,y:ey,z:ez,dx,dy,dz};
}
function hurt(t_,amount,att,kx,kz,stun,slow){
  if(!netAuth())return false;
  if(!t_.alive||G.state!=='play')return false;
  if(t_.prot>0)return false;
  if(t_.shield>0){t_.shield=0;fx.burst(t_.x,t_.y+.9,t_.z,18,'#9fe8ff',5,.5);sfx.pop();t_.kx+=kx*.4;t_.kz+=kz*.4;if(att&&att.isPlayer)hitMarker(false,true);else if(att&&att.remote)netEv({k:'H',pid:att.pid,sh:1});netEv({k:'X',x:t_.x,y:t_.y+.9,z:t_.z,n:18,c:'#9fe8ff',s:5,l:.5,q:'pop'});return true}
  t_.hp-=amount;t_.kx+=kx;t_.kz+=kz;t_.stun=Math.max(t_.stun,stun||.2);t_.slow=Math.max(t_.slow,slow||0);t_.regenT=5;
  if(att)t_.hurt.push({id:att.id,team:att.team,t:G.clock});
  fx.burst(t_.x,t_.y+.9,t_.z,10,'#ffffff',4.5,.35);fx.burst(t_.x,t_.y+.9,t_.z,6,'#ffd23f',3,.3);sfx.hit();
  setTag(t_.gfx,t_.name,Math.max(0,t_.hp),t_.team);
  netEv({k:'X',x:t_.x,y:t_.y+.9,z:t_.z,n:10,c:'#ffffff',s:4.5,l:.35,q:'hit'});
  if(att&&att.isPlayer)hitMarker(t_.hp<=0.01,false);else if(att&&att.remote)netEv({k:'H',pid:att.pid,kill:t_.hp<=0.01?1:0});
  if(t_.isPlayer){G.shake=.35;G.hitFlash=.35;sfx.hurt();if(att)dmgIndicator(att)}
  else if(t_.remote){netEv({k:'D',pid:t_.pid,att:att?att.id:-1});netEv({k:'K',pid:t_.pid,kx,kz,st:stun||.2,sl:slow||0})}
  if(t_.hp<=0.01)die(t_,att);
  return true;
}
function die(t_,att,water){
  t_.alive=false;t_.respawn=4;t_.hp=0;dropFlag(t_);t_.atk=null;t_.gfx.root.visible=false;t_.item=null;t_.shield=0;t_.boots=0;t_.fly=null;
  fx.burst(t_.x,t_.y+.8,t_.z,28,t_.team?'#ff6a62':'#5aa0ff',7,.7);fx.burst(t_.x,t_.y+.8,t_.z,14,'#fff',5,.5);
  if(water)fx.burst(t_.x,Math.max(-.8,t_.y),t_.z,24,'#bfe8ff',6,.7);
  sfx.pop();
  if(att&&att!==t_){
    att.stats.kills++;
    for(const h of t_.hurt){if(G.clock-h.t<4&&h.id!==att.id&&h.team===att.team){const a=G.ents.find(x=>x.id===h.id);if(a){a.stats.assists++}}}
    feedK('f_kill',{an:att.name,at:att.team,bn:t_.name,bt:t_.team});
    sfxTo(att,'kill');
  }else feedK(water?'f_fall':'f_dead',{n:t_.name,nt:t_.team});
  t_.hurt.length=0;
  if(t_.isPlayer)uiDead(true);
}
function respawn(e){
  e.alive=true;e.hp=3;e.prot=1.5;placeAtSpawn(e);e.rsq++;e.gfx.root.visible=!e.isPlayer;e.ammo=3;e.reload=0;e.stun=0;e.slow=0;e.cdA=0;e.hurt.length=0;
  if(e.nextWeapon!==e.weapon){e.weapon=e.nextWeapon;setWeaponGfx(e.gfx,e.weapon);if(e.isPlayer)setViewmodel(e.weapon,e.team)}
  setTag(e.gfx,e.name,3,e.team);
  if(e.isPlayer)uiDead(false);
}
function coneHits(e,yaw,range,half,fn){
  for(const o of G.ents){
    if(!o.alive||o.team===e.team)continue;
    const dx=o.x-e.x,dz=o.z-e.z,d=Math.hypot(dx,dz);if(d-.5>range||Math.abs(o.y-e.y)>2)continue;
    if(d>.7&&Math.abs(angDiff(yaw,Math.atan2(dx,dz)))>half)continue;
    fn(o,dx/(d||1),dz/(d||1));
  }
}
function startAttack(e){
  if(e.atk||e.cdA>0||e.stun>.1||!e.alive||G.state!=='play')return;
  const W=e.weapon;
  if(W==='sword'){
    const yaw=aimYawMelee(e,WSPEC.sword.range,1.1);
    if(e.comboT<=0)e.combo=0;
    const c=e.combo;e.atk={kind:'sword',t:0,dur:c===2?.62:.42,hit:c===2?.2:.12,done:false,c,yaw};
    e.combo=(c+1)%3;e.comboT=.9;e.kx+=Math.sin(yaw)*(c===2?5:3.2);e.kz+=Math.cos(yaw)*(c===2?5:3.2);sfx.swing();
  }else if(W==='spear'){
    const sweep=e.charge>=.5,yaw=aimYawMelee(e,WSPEC.spear.range,.8);
    e.atk={kind:sweep?'sweep':'thrust',t:0,dur:sweep?.7:.55,hit:sweep?.22:.18,done:false,hitAny:false,yaw};e.charge=0;sfx.swing();
  }else{
    if(e.reload>0)return;
    const near=enemiesOf(e).find(o=>Math.hypot(o.x-e.x,o.z-e.z)<1.8&&Math.abs(angDiff(e.in.aimYaw,Math.atan2(o.x-e.x,o.z-e.z)))<1.0);
    if(near){e.atk={kind:'shove',t:0,dur:.4,hit:.1,done:false,yaw:Math.atan2(near.x-e.x,near.z-e.z)};sfx.swing();return}
    if(e.ammo<=0)return;
    e.atk={kind:'shoot',t:0,dur:.35,hit:.08,done:false,yaw:e.in.aimYaw};
  }
}
function atkEffect(e){
  const a=e.atk,y=a.yaw;a.done=true;
  if(a.kind==='sword'){
    slashNet(e.x,e.y+.9,e.z,y,WSPEC.sword.range,WSPEC.sword.half,a.c===2?0xffe45a:0xffffff);
    coneHits(e,y,WSPEC.sword.range,WSPEC.sword.half,(o,dx,dz)=>{const k=a.c===2?9:4.5;hurt(o,1,e,dx*k,dz*k,a.c===2?.5:.25)})
  }else if(a.kind==='thrust'){
    slashNet(e.x,e.y+.9,e.z,y,WSPEC.spear.range,.25,0xcfe8ff);
    coneHits(e,y,WSPEC.spear.range,WSPEC.spear.half,(o,dx,dz)=>{if(hurt(o,1,e,dx*11,dz*11,.35))a.hitAny=true})
  }else if(a.kind==='sweep'){
    slashNet(e.x,e.y+.8,e.z,y,WSPEC.spear.sweepR,Math.PI*.55,0xffd27a);
    coneHits(e,y,WSPEC.spear.sweepR,Math.PI*.55,(o,dx,dz)=>{hurt(o,1,e,dx*12,dz*12,.45)});sfx.swing();
  }else if(a.kind==='shove'){
    coneHits(e,y,1.9,1.0,(o,dx,dz)=>{hurt(o,.25,e,dx*8,dz*8,.3)});slashNet(e.x,e.y+.7,e.z,y,1.6,.8,0xffffff);
  }else if(a.kind==='shoot'){
    e.ammo--;e.idleShot=0;e.cdA=.7;if(e.ammo<=0)e.reload=2.2;
    if(!netAuth()){sfx.shoot();return}
    const A=aimBolt(e),sp_=WSPEC.xbow.speed;
    const grp=new THREE.Group(),m=shadowed(new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.9,6),M(0xe8eef5)));m.rotation.x=Math.PI/2;grp.add(m);
    const tip=new THREE.Mesh(new THREE.ConeGeometry(.11,.3,6),M(0xffd23f));tip.rotation.x=Math.PI/2;tip.position.z=.6;grp.add(tip);
    const tr=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,2.2,5),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.35}));tr.rotation.x=Math.PI/2;tr.position.z=-1.4;grp.add(tr);
    grp.position.set(A.x+A.dx*.8,A.y-.12+A.dy*.8,A.z+A.dz*.8);grp.lookAt(grp.position.x+A.dx,grp.position.y+A.dy,grp.position.z+A.dz);scene.add(grp);
    G.bolts.push({g:grp,x:grp.position.x,y:grp.position.y,z:grp.position.z,vx:A.dx*sp_,vy:A.dy*sp_,vz:A.dz*sp_,life:WSPEC.xbow.life,owner:e});
    sfx.shoot();if(e.isPlayer)G.shake=Math.max(G.shake,.08);
  }
}
function updateBolts(dt){
  for(let i=G.bolts.length-1;i>=0;i--){
    const b=G.bolts[i];b.life-=dt;let kill=b.life<=0;
    const n=Math.max(1,Math.ceil(Math.hypot(b.vx,b.vz)*dt/.45));
    for(let k=0;k<n&&!kill;k++){
      b.x+=b.vx*dt/n;b.y+=b.vy*dt/n;b.z+=b.vz*dt/n;
      for(const o of G.ents){
        if(!o.alive||o.team===b.owner.team)continue;
        if(dist2(o.x,o.z,b.x,b.z)<.62*.62&&b.y>o.y-.1&&b.y<o.y+1.6){const d=Math.hypot(b.vx,b.vz)||1;hurt(o,.75,b.owner,b.vx/d*3.2,b.vz/d*3.2,.25,1.0);kill=true;fx.burst(b.x,b.y,b.z,8,'#ffe9a0',3,.25);break}
      }
      if(kill)break;
      for(const s of MAP.solids){if(b.x>s.x0&&b.x<s.x1&&b.z>s.z0&&b.z<s.z1&&b.y<s.top+.1&&s.kind!=='rail'){kill=true;fx.burst(b.x,b.y,b.z,6,'#ffe9a0',3,.25);break}}
      if(!kill){const g=baseGround(b.x,b.z);if(g>-Infinity&&b.y<g){kill=true;fx.burst(b.x,b.y,b.z,5,'#ffe9a0',2.5,.2)}}
    }
    b.g.position.set(b.x,b.y,b.z);
    if(kill){scene.remove(b.g);b.g.traverse(o=>{if(o.geometry)o.geometry.dispose()});G.bolts.splice(i,1)}
  }
}

/* ---------- per-entity update ---------- */
function useItem(e){
  if(!e.item||!e.alive)return;
  if(e.item==='shield'){e.shield=9;sfx.item();toastTo(e,'t_shield')}
  else{e.boots=9;e.airJ=false;sfx.item();toastTo(e,'t_boots')}
  e.item=null;
}
function stepEnt(e,dt){
  if(e.puppet)return;
  e.ppx=e.x;e.ppy=e.y;e.ppz=e.z;
  if(!e.alive){e.respawn-=dt;if(e.respawn<=0&&G.state==='play'&&netAuth())respawn(e);return}
  const I=e.in;
  e.cdA=Math.max(0,e.cdA-dt);e.cdD=Math.max(0,e.cdD-dt);e.stun=Math.max(0,e.stun-dt);e.slow=Math.max(0,e.slow-dt);e.prot=Math.max(0,e.prot-dt);e.padCd=Math.max(0,e.padCd-dt);
  e.shield=e.shield>0?Math.max(0,e.shield-dt):0;e.boots=Math.max(0,e.boots-dt);e.comboT=Math.max(0,e.comboT-dt);e.regenT=Math.max(0,e.regenT-dt);
  const own=MAP.flag[e.team];
  if(dist2(e.x,e.z,own.x,own.z)<7*7){if(e.hp<3&&netAuth()){e.hp=Math.min(3,e.hp+dt*1.2);const q=Math.floor(e.hp*2);if(q!==e.tq){e.tq=q;setTag(e.gfx,e.name,e.hp,e.team)}}}
  else if(e.regenT<=0&&e.hp<3&&netAuth()){e.hp=Math.min(3,e.hp+dt*.25)}
  if(e.carry)e.stats.carry+=dt;
  if(e.weapon==='xbow'){
    if(e.reload>0){e.reload-=dt;if(e.reload<=0)e.ammo=3}
    else if(e.ammo<3){e.idleShot+=dt;if(e.idleShot>1.4){e.reload=1.2}}
  }
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
  if(e.remote){if(I.use&&e.item){useItem(e);I.use=false}if(e.y<MAP.killY)die(e,null,true);return}
  if(I.dash&&e.cdD<=0&&e.stun<=0&&e.dashT<=0){
    let dx=I.mx,dz=I.mz;if(Math.hypot(dx,dz)<.1){dx=Math.sin(I.aimYaw);dz=Math.cos(I.aimYaw)}
    const l=Math.hypot(dx,dz);dx/=l;dz/=l;const sp_=e.weapon==='sword'?21:16;e.dashT=.18;e.dashX=dx*sp_;e.dashZ=dz*sp_;e.cdD=e.weapon==='sword'?3.5:4.5;
    sfx.dash();fx.burst(e.x,e.y+.4,e.z,8,'#ffffff',3,.3,0);if(!e.isPlayer)e.yaw=Math.atan2(dx,dz);
  }
  if(e.dashT>0)e.dashT-=dt;
  if(I.use&&e.item){useItem(e);I.use=false}
  // zones
  let ice=false,cvx=0,cvz=0;
  for(const z of MAP.zones){
    if(e.x<z.x0||e.x>z.x1||e.z<z.z0||e.z>z.z1)continue;
    if(z.type==='ice'&&e.grounded)ice=true;else if(z.type==='conv'&&e.grounded){cvx+=z.dx;cvz+=z.dz}
  }
  let spd=6.6;if(e.carry)spd*=.88;if(e.slow>0)spd*=.55;if(e.stun>0)spd*=.35;
  if(e.atk)spd*=(e.atk.kind==='sword'?.6:e.atk.kind==='shoot'?.75:.45);
  if(e.weapon==='spear'&&e.charge>0)spd*=.6;
  let tvx=I.mx*spd,tvz=I.mz*spd,rate=e.grounded?(ice?1.8:20):4.5;
  if(e.dashT>0){tvx=e.dashX;tvz=e.dashZ;rate=80}
  const k=Math.min(1,rate*dt);e.vx+=(tvx-e.vx)*k;e.vz+=(tvz-e.vz)*k;
  // jump pads
  if(e.padCd<=0&&!e.fly&&e.y<baseGround(e.x,e.z)+.7){
    for(const p of MAP.pads){if(dist2(e.x,e.z,p.x,p.z)<p.r*p.r){
      const ty=baseGround(p.tx,p.tz),T=p.T;e.fly={vx:(p.tx-e.x)/T,vz:(p.tz-e.z)/T,t:T,T};e.vy=(ty-e.y)/T+.5*GRAV*T;e.grounded=false;e.padCd=1;e.air=1;
      sfx.pad();fx.burst(e.x,e.y+.2,e.z,18,'#7fefff',6,.6,0);break}}
  }
  if(e.fly){e.vx=e.fly.vx;e.vz=e.fly.vz;e.fly.t-=dt;if(e.fly.t<=0||(e.grounded&&e.fly.t<e.fly.T-.25))e.fly=null}
  const mvx=e.vx+e.kx+cvx,mvz=e.vz+e.kz+cvz;const kd=Math.pow(.015,dt);e.kx*=kd;e.kz*=kd;
  const ox=e.x,oz=e.z;
  tryMove(e,e.x+mvx*dt,e.z);tryMove(e,e.x,e.z+mvz*dt);collideSolids(e);collideWalk(e);
  const ax=(e.x-ox)/dt-cvx,az=(e.z-oz)/dt-cvz;
  if(Math.abs(ax)<Math.abs(e.vx)*.5)e.vx*=.6;if(Math.abs(az)<Math.abs(e.vz)*.5)e.vz*=.6;
  for(const o of G.ents){if(o===e||!o.alive)continue;const dx=e.x-o.x,dz=e.z-o.z,d=Math.hypot(dx,dz);if(d<.8&&d>.001){const p=(.8-d)*.5;e.x+=dx/d*p;e.z+=dz/d*p}}
  // vertical
  const g2=groundAt(e.x,e.z,e.y);
  const jumpEdge=I.jump&&!e.jp;e.jp=I.jump;
  if(e.grounded)e.air=0;else e.air+=dt;
  if(jumpEdge&&e.stun<=0&&!e.fly){
    if(e.grounded||e.air<.1){e.vy=JUMP;e.grounded=false;e.air=1;sfx.jump()}
    else if(e.boots>0&&!e.airJ){e.vy=JUMP*.9;e.airJ=true;sfx.jump();fx.burst(e.x,e.y+.1,e.z,10,'#9fe8ff',3,.35,0)}
  }
  if(e.grounded&&g2>-Infinity&&g2>e.y&&g2<=e.y+.5){e.y=g2}
  const py=e.y;e.vy-=GRAV*dt;e.y+=e.vy*dt;
  if(g2>-Infinity&&e.vy<=0&&py>=g2-.3&&e.y<=g2){
    if(!e.grounded&&e.vy<-7){fx.burst(e.x,g2+.05,e.z,6,'#d8c9a0',2.5,.3,6);if(e.isPlayer)sfx.land()}
    e.y=g2;e.vy=0;e.grounded=true;e.airJ=false;
  }else e.grounded=false;
  if(e.y<-1.2&&!e.splash&&(MAP.id==='bridges'||MAP.id==='ice')){e.splash=true;fx.burst(e.x,-.8,e.z,18,'#bfe8ff',5,.6);sfx.pop()}
  if(e.y>-1)e.splash=false;
  if(e.y<MAP.killY&&netAuth())die(e,null,true);
  e.velx=(e.x-ox)/dt;e.velz=(e.z-oz)/dt;
  if(e.isPlayer)e.yaw=I.aimYaw;
  else if(!e.atk){
    if(Math.hypot(I.mx,I.mz)>.1||e.dashT>0){const ty=e.dashT>0?Math.atan2(e.dashX,e.dashZ):Math.atan2(I.mx,I.mz);e.yaw+=angDiff(e.yaw,ty)*Math.min(1,dt*14)}
  }else e.yaw=e.atk.yaw;
  if(e.isPlayer&&e.grounded){e.foot+=Math.hypot(e.velx,e.velz)*dt;if(e.foot>2.3){e.foot=0;sfx.step()}}
  const tr=e.eq.trail?catById(e.eq.trail):null;
  if(tr&&e.grounded&&Math.hypot(e.velx,e.velz)>2&&Math.random()<.5)fx.p(e.x+rand(-.15,.15),e.y+.1,e.z+rand(-.15,.15),rand(-.3,.3),rand(.3,1),rand(-.3,.3),.6,tr.col,-1);
  if(e.boots>0&&Math.random()<.2)fx.p(e.x,e.y+.1,e.z,rand(-.5,.5),1,rand(-.5,.5),.4,'#9fe8ff',0);
}
// render-side animation with interpolation (alpha 0..1 between fixed steps)
function animEnt(e,dt,alpha){
  const g=e.gfx,P=g.P;
  if(e.isPlayer){g.root.visible=false;return}
  g.root.visible=e.alive;if(!e.alive)return;
  const x=lerp(e.ppx,e.x,alpha),y=lerp(e.ppy,e.y,alpha),z=lerp(e.ppz,e.z,alpha);
  g.root.position.set(x,y,z);
  let ry=g.root.rotation.y;ry+=angDiff(ry,e.yaw)*Math.min(1,dt*16);g.root.rotation.y=ry;
  const sp_=Math.hypot(e.velx,e.velz),A=e.anim;
  A.t+=dt*(2+sp_*1.25);const sw=Math.sin(A.t)*Math.min(1,sp_/4);
  P.legL.rotation.x=sw*.9;P.legR.rotation.x=-sw*.9;P.armL.rotation.x=-sw*.7;
  g.body.position.y=e.grounded?Math.abs(Math.sin(A.t))*.07*Math.min(1,sp_/4):0;
  g.body.rotation.x=e.dashT>0?.5:(e.stun>.05?-.25:0);
  P.armR.rotation.x=-.9+(sw*.25);P.armR.rotation.z=0;P.holder.rotation.x=Math.PI/2;P.wk.position.set(0,0,0);P.wk.rotation.set(0,0,0);
  if(P.spinner)P.spinner.rotation.y+=dt*20;
  g.body.rotation.y=0;
  const a=e.atk;
  if(a){
    const u=a.t/a.dur;
    if(a.kind==='sword'){const k=Math.min(1,a.t/Math.max(.001,a.hit+.05));P.armR.rotation.x=lerp(-2.4,-.1,k);if(a.c===1)P.armR.rotation.z=lerp(.8,-.8,k);if(a.c===2)g.body.rotation.y=u*TAU}
    else if(a.kind==='thrust'){P.armR.rotation.x=-1.45;P.wk.position.y=u<.35?lerp(0,1.3,u/.35):lerp(1.3,0,(u-.35)/.65)}
    else if(a.kind==='sweep'){P.armR.rotation.x=-1.45;g.body.rotation.y=Math.min(1,u*1.4)*TAU}
    else if(a.kind==='shoot'||a.kind==='shove'){P.armR.rotation.x=-1.5+(a.t<.1?.2:0);P.armL.rotation.x=-1.3}
  }else if(e.weapon==='spear'&&e.charge>0){P.armR.rotation.x=-1.2;P.wk.position.y=-.5}
  if(P.wk.userData.bolt)P.wk.userData.bolt.visible=e.ammo>0&&e.reload<=0;
  P.bubble.visible=e.shield>0||e.prot>0;if(P.bubble.visible)P.bubble.scale.setScalar(1+Math.sin(performance.now()*.01)*.04);
  P.bubble.material.color.setHex(e.shield>0?0x7fd8ff:0xffffff);
  const dx=x-camera.position.x,dz=z-camera.position.z;P.tag.visible=dx*dx+dz*dz<45*45;
}

/* ---------- coins & chest ---------- */
function updatePickups(dt){
  const cg=MAP.coinGfx;
  for(let i=0;i<cg.length;i++){
    const m=cg[i],c=G.coins[i];m.rotation.y+=dt*3;
    if(!c.on){if(netAuth()){c.t-=dt;if(c.t<=0){c.on=true;m.visible=true}}continue}
    const by=baseGround(c.x,c.z)+.9;m.position.y=by+Math.sin(G.clock*3+i)*.1;
    if(netAuth())for(const e of G.ents){
      if(!e.alive||dist2(e.x,e.z,c.x,c.z)>1.5*1.5||Math.abs(e.y+.9-by)>2)continue;
      c.on=false;c.t=25;m.visible=false;e.stats.coins++;if(e.isPlayer){sfx.coin();G.matchCoins++}else if(e.remote)netEv({k:'Q',s:'coin',pid:e.pid});
      fx.burst(c.x,by,c.z,6,'#ffe066',3,.4,2);break;
    }
  }
  const ch=G.chest,it=MAP.chestGfx.userData.item,cy0=baseGround(MAP.chest.x,MAP.chest.z);
  it.visible=ch.has;MAP.chestGfx.userData.glow.intensity=ch.has?1.2:.2;
  if(ch.has){it.rotation.y+=dt*3;it.position.y=1.9+Math.sin(G.clock*3)*.15;it.material.color.setHex(ch.kind==='shield'?0x7fd8ff:0xff9a3d);
    if(netAuth())for(const e of G.ents){if(!e.alive||e.item||dist2(e.x,e.z,MAP.chest.x,MAP.chest.z)>2.4*2.4||Math.abs(e.y-cy0)>1.5)continue;e.item=ch.kind;ch.has=false;ch.t=25;e.stats.loot++;sfxAll('item');
      feedK('f_chest',{n:e.name,i:ch.kind==='shield'?'i_shield':'i_boots'});toastTo(e,'t_useitem');break}
  }else if(netAuth()){ch.t-=dt;if(ch.t<=0){ch.has=true;ch.kind=Math.random()<.5?'shield':'boots'}}
}

/* ================= Bots ================= */
const NAMES=['Lucia','Dani_77','Marcos','Pipo','Nerea','Kai','Sara_G','Hugo','Iker','Alba','Tomi','Chus','Vero','Rafa','Mimi','Jorge','Noa','Leo_x','Bruno','Carla','Pau','Izan','Mar','Teo','Ainhoa','Gael','Yago','Lola','Biel','Zoe','Nico','Ada','xXLoboXx','Peke','Kiwi','Sofi','Mateo','Dario','Irene','Cris','Alex_09','Paula','Javi','Ruben','Marta','Tito','Maya','Finn','Luna','Oli','Max_X','Ivy','Theo','Nora','Kira','Rex'];
function newAI(skill){
  return{skill:skill||rand(.45,.9),react:rand(.28,.6),aimErr:rand(.04,.2),aggr:rand(.5,1),role:'att',seen:0,path:null,pi:0,goalC:-1,pathAge:0,strafe:1,strafeT:0,stuckT:0,sx:0,sz:0,wait:0,pause:0,atkHold:0,dashChance:rand(.2,.7),useT:0,gx:0,gz:0,unstick:0,ux:0,uz:0};
}
function okGround(x,z){const m=.35;return baseGround(x,z)>-Infinity&&baseGround(x+m,z)>-Infinity&&baseGround(x-m,z)>-Infinity&&baseGround(x,z+m)>-Infinity&&baseGround(x,z-m)>-Infinity}
function walkPoint(side){
  for(let i=0;i<30;i++){
    const c=(Math.random()*NAV.ok.length)|0;if(!NAV.ok[c])continue;const p=navCenter(c);
    if(Math.abs(p[0])>4&&Math.sign(p[0])!==side)continue;
    return[p[0],p[1]];
  }
  const f=MAP.flag[side<0?0:1];return[f.x,f.z];
}
function botMove(e,tx,tz,dt,stopDist){
  const ai=e.ai,I=e.in;let dx=tx-e.x,dz=tz-e.z,d=Math.hypot(dx,dz);
  if(d<(stopDist||.8)){I.mx=I.mz=0;return d}
  let gx=tx,gz=tz;
  if(d>2.5&&!navLOS(e.x,e.z,tx,tz)||d>16){
    ai.pathAge+=dt;const gc=navCell(tx,tz);
    if(!ai.path||(gc!==ai.goalC&&ai.pathAge>.4)||ai.pathAge>2.2){ai.path=navPath(e.x,e.z,tx,tz)||[];ai.pi=0;ai.goalC=gc;ai.pathAge=0}
    while(ai.pi<ai.path.length&&dist2(e.x,e.z,ai.path[ai.pi].x,ai.path[ai.pi].z)<1.1*1.1)ai.pi++;
    if(ai.pi<ai.path.length){gx=ai.path[ai.pi].x;gz=ai.path[ai.pi].z}
  }
  dx=gx-e.x;dz=gz-e.z;d=Math.hypot(dx,dz)||1;let mx=dx/d,mz=dz/d;
  ai.stuckT+=dt;
  if(ai.stuckT>.8){const moved=Math.hypot(e.x-ai.sx,e.z-ai.sz);ai.sx=e.x;ai.sz=e.z;ai.stuckT=0;if(moved<.5&&Math.hypot(I.mx,I.mz)>.1){ai.path=null;ai.unstick=.6;ai.ux=-mz*(Math.random()<.5?1:-1);ai.uz=mx;I.jump=true}}
  if(ai.unstick>0){ai.unstick-=dt;mx=mx*.3+ai.ux;mz=mz*.3+ai.uz;if(ai.unstick<.3)I.jump=false}
  const l=Math.hypot(mx,mz)||1;I.mx=mx/l;I.mz=mz/l;return d;
}
function nearestFoe(e,r){let b=null,bd=r*r;for(const o of G.ents){if(!o.alive||o.team===e.team)continue;const d=dist2(e.x,e.z,o.x,o.z);if(d<bd&&Math.abs(o.y-e.y)<2.8){bd=d;b=o}}return b}
function thinkBot0(e,dt){
  const ai=e.ai,I=e.in;I.atk=false;I.dash=false;I.use=false;if(!(ai.unstick>0))I.jump=false;
  if(!e.alive)return;
  if(ai.pause>0){ai.pause-=dt;I.mx=I.mz=0;return}
  const ownF=G.flags[e.team],enF=G.flags[1-e.team],home=MAP.flag[e.team];
  if(e.item){ai.useT+=dt;const f0=nearestFoe(e,8);if(e.item==='shield'&&(f0||ai.useT>8)||e.item==='boots'&&ai.useT>2){I.use=true;ai.useT=0}}
  let foe=nearestFoe(e,e.weapon==='xbow'?18:11);
  if(foe){const fd0=Math.hypot(foe.x-e.x,foe.z-e.z);
    if(ai.role==='att'&&!(ownF.state==='carried'&&ownF.carrier===foe)&&fd0>4.2&&Math.random()<.97)foe=null;
    else if(ai.role==='def'&&dist2(e.x,e.z,home.x,home.z)>18*18&&fd0>4)foe=null;
    else if(ai.role==='sup'&&fd0>15)foe=null;}
  let tx=0,tz=0,stop=.8,fight=false;
  const carrier=!!e.carry;
  if(carrier){
    if(ownF.state==='home'){tx=home.x;tz=home.z;stop=.5}
    else{tx=ownF.x;tz=ownF.z;stop=2}
  }else if(ownF.state==='dropped'&&dist2(e.x,e.z,ownF.x,ownF.z)<dist2(e.x,e.z,enF.x,enF.z)*1.6){tx=ownF.x;tz=ownF.z;stop=.3}
  else if(ownF.state==='carried'&&(ai.role!=='sup'||dist2(e.x,e.z,ownF.carrier.x,ownF.carrier.z)<14*14)){tx=ownF.carrier.x;tz=ownF.carrier.z;stop=e.weapon==='xbow'?8:1.5}
  else if(enF.state==='carried'&&enF.carrier.team===e.team&&enF.carrier!==e){
    const c=enF.carrier,dir=Math.sign(home.x-c.x)||1;tx=c.x+(e.weapon==='spear'?-dir*4:dir*3);tz=c.z+(e.id%2?3:-3);stop=1.5;
  }else if(ai.role==='att'||(ai.role==='sup'&&enF.state==='dropped')){tx=enF.x;tz=enF.z;stop=.3}
  else if(ai.role==='def'){
    ai.wait-=dt;if(ai.wait<=0||!ai.gx){ai.wait=rand(3,7);const w=walkPoint(e.team?1:-1);ai.gx=(home.x+w[0])/2;ai.gz=(home.z+w[1])/2}tx=ai.gx;tz=ai.gz;stop=1.2;
    if(enF.state==='home'&&G.ents.filter(o=>o.team===e.team&&o.alive&&o.ai&&o.ai.role==='att').length===0)ai.role='att';
  }else{
    ai.wait-=dt;if(ai.wait<=0||!ai.gx){ai.wait=rand(3,6);const w=walkPoint(e.team?1:-1);ai.gx=w[0];ai.gz=w[1]}tx=ai.gx;tz=ai.gz;stop=1.5;
  }
  if(!carrier&&!foe&&ai.role!=='def'){let bd=64,bc=null;for(const c of G.coins){if(!c.on)continue;const d=dist2(e.x,e.z,c.x,c.z);if(d<bd){bd=d;bc=c}}if(bc&&dist2(e.x,e.z,tx,tz)>25){tx=bc.x;tz=bc.z;stop=.3}}
  if(foe){
    const fd=Math.hypot(foe.x-e.x,foe.z-e.z),W=e.weapon;
    const rng=W==='sword'?2.4:W==='spear'?3.5:16;
    const block=carrier&&fd>3.2;
    if(!block&&(fd<rng+(W==='xbow'?0:2.5)||ai.aggr>.8&&fd<9)){
      fight=true;ai.seen+=dt;
      if(ai.seen>ai.react){
        const lead=W==='xbow'?fd/WSPEC.xbow.speed:0;
        const fxp=foe.x+foe.velx*lead,fzp=foe.z+foe.velz*lead;
        const err=rand(-ai.aimErr,ai.aimErr)*(1.2-ai.skill);
        I.aimYaw=Math.atan2(fxp-e.x,fzp-e.z)+err;I.aimPitch=Math.atan2((foe.y+.8)-(e.y+EYE),Math.hypot(fxp-e.x,fzp-e.z))+rand(-.04,.04);
        if(!carrier){ai.strafeT-=dt;if(ai.strafeT<=0){ai.strafeT=rand(.8,2);ai.strafe=Math.random()<.5?1:-1}}
        const want=W==='sword'?1.8:W==='spear'?2.7:9;
        const fx_=(foe.x-e.x)/(fd||1),fz_=(foe.z-e.z)/(fd||1);
        if(!carrier){
          let mv=fd>want+.5?1:(fd<want-1.2?-1:0);if(W==='xbow'&&fd<5)mv=-1.3;
          I.mx=fx_*mv+(-fz_)*ai.strafe*.6;I.mz=fz_*mv+fx_*ai.strafe*.6;const l=Math.hypot(I.mx,I.mz);if(l>1){I.mx/=l;I.mz/=l}
        }
        const aligned=Math.abs(angDiff(e.yaw,Math.atan2(foe.x-e.x,foe.z-e.z)))<(W==='xbow'?.5:.8);
        if(W==='sword'&&fd<2.7&&aligned&&Math.random()<dt*7)I.atk=true;
        else if(W==='spear'){
          if(ai.atkHold>0){ai.atkHold-=dt;I.atk=true}
          else if(fd<3.6&&aligned&&e.cdA<=0&&Math.random()<dt*3.5){ai.atkHold=Math.random()<.3?.6:.08;I.atk=true}
        }else if(W==='xbow'&&fd<17&&aligned&&e.cdA<=0&&Math.random()<dt*4)I.atk=true;
        if(e.cdD<=0&&Math.random()<dt*ai.dashChance*(fd>4&&fd<9?1:.3)&&!(W==='xbow'&&fd>6)){I.dash=true;if(fd>4){I.mx=fx_;I.mz=fz_}else if(e.hp<1.5){I.mx=-fx_;I.mz=-fz_}}
        if(!carrier)return;
      }else{I.mx*=.3;I.mz*=.3}
    }
  }else ai.seen=Math.max(0,ai.seen-dt*2);
  if(!fight||carrier){
    botMove(e,tx,tz,dt,stop);
    if(Math.random()<dt*.07&&!carrier&&!fight){ai.pause=rand(.25,.8)}
    if(carrier&&e.cdD<=0){const ch=nearestFoe(e,5);if(ch&&Math.random()<dt*2)I.dash=true}
    if(Math.random()<dt*.15&&e.grounded)I.jump=true;
    I.aimYaw=Math.atan2(I.mx,I.mz);I.aimPitch=0;
  }
}
function thinkBot(e,dt){
  thinkBot0(e,dt);if(!e.alive)return;const I=e.in;
  const l=Math.hypot(I.mx,I.mz);
  if(l>.05&&e.grounded&&!e.fly){
    const ux=I.mx/l,uz=I.mz/l,la=1.5;
    if(!okGround(e.x+ux*la,e.z+uz*la)){
      let done=false;
      for(const a of[.6,-.6,1.2,-1.2,1.8,-1.8]){const c=Math.cos(a),s2=Math.sin(a),vx=ux*c-uz*s2,vz=ux*s2+uz*c;if(okGround(e.x+vx*la,e.z+vz*la)){I.mx=vx*l;I.mz=vz*l;done=true;break}}
      if(!done){I.mx=I.mz=0}
    }
  }
  if(I.dash){const dx=l>.05?I.mx/l:Math.sin(I.aimYaw),dz=l>.05?I.mz/l:Math.cos(I.aimYaw);if(!okGround(e.x+dx*4.2,e.z+dz*4.2)||!okGround(e.x+dx*2,e.z+dz*2))I.dash=false}
}

/* ================= Match flow ================= */
function clearMatch(){
  for(const e of G.ents)scene.remove(e.gfx.root);G.ents=[];G.player=null;
  for(const b of G.bolts)scene.remove(b.g);G.bolts=[];
}
function startMatch(roster,mapId){
  clearMatch();loadMap(mapId);mkFlags();G.score=[0,0];G.time=240;G.ot=false;G.clock=0;G.over=null;G.matchCoins=0;G.paused=false;G.botAcc=0;G.byId={};
  G.chest={has:false,kind:'shield',t:12};G.coins=MAP.coins.map(c=>({x:c[0],z:c[1],on:true,t:0}));
  const roles={sword:'att',spear:'def',xbow:'sup'};
  for(const r of roster){
    const isMe=!!(r.me||(NET.on&&r.human&&r.pid===NET.pid));
    const e=mkEnt(r.team,r.name,r.w||'sword',isMe,r.skill||rand(.45,.92));
    e.id=r.id;e.eq=isMe?Object.assign({},S.eq):(r.eq||{hat:'',pack:'',trail:''});applyCosmetics(e.gfx,e.eq);
    if(isMe){G.player=e;e.name=NET.on?r.name:t('you')}
    else if(NET.on&&NET.host&&r.human){e.remote=true;e.pid=r.pid;e.ai=null}
    else if(NET.on&&!NET.host){e.puppet=true;e.ai=null}
    else if(e.ai)e.ai.role=roles[e.weapon];
    G.ents.push(e);G.byId[e.id]=e;
  }
  const idx=[0,0];
  for(const e of G.ents){placeAtSpawn(e,idx[e.team]++);setTag(e.gfx,e.name,3,e.team);e.prot=0;e.gfx.root.visible=!e.isPlayer;if(e.puppet){e.tx=e.x;e.ty=e.y;e.tz=e.z;e.tyaw=e.yaw}}
  NET.rs=0;NET.snapAcc=0;NET.inAcc=0;NET.lastSnapN=-1;
  setViewmodel(G.player.weapon,G.player.team);
  G.state='count';G.countdown=3.99;
  $('hud').classList.remove('hide');
}
function endMatch(winner){
  if(!netAuth())return;
  if(G.state==='end'||G.state==='over')return;G.state='end';G.over={winner};gp.stop();G.endT=2.4;hostEndEvent(winner);
  if(winner===0)gp.happy();
}
function updateGameClient(dt){
  G.clock+=dt;const me=G.player;if(!me)return;
  if(G.state==='count'){
    G.countdown-=dt;$('cd').classList.toggle('hide',G.countdown<=-.5);$('cd').textContent=G.countdown>0?Math.ceil(G.countdown):t('go');
    me.in.mx=me.in.mz=0;me.in.atk=false;me.in.dash=false;me.ppx=me.x;me.ppy=me.y;me.ppz=me.z;me.velx=me.velz=0;
  }else if(G.state==='end'){
    me.in.mx=me.in.mz=0;me.in.atk=false;me.in.dash=false;stepEnt(me,dt);G.endT-=dt;if(G.endT<=0){G.state='over';showEnd()}
  }else if(G.state==='play')stepEnt(me,dt);
  clientTick(dt);updatePickups(dt);
}
function updateGame(dt){
  if(G.paused)return;
  if(NET.on&&!NET.host){updateGameClient(dt);return}
  G.clock+=dt;
  if(G.state==='count'){
    const prev=Math.ceil(G.countdown);G.countdown-=dt;const cur=Math.ceil(G.countdown);
    if(cur!==prev&&cur>0)sfx.beep();
    $('cd').classList.toggle('hide',G.countdown<=-.5);$('cd').textContent=G.countdown>0?Math.ceil(G.countdown):t('go');
    for(const e of G.ents){e.in.mx=e.in.mz=0;e.in.atk=false;e.ppx=e.x;e.ppy=e.y;e.ppz=e.z;e.velx=e.velz=0}
    if(G.countdown<=0){G.state='play';sfx.go();gp.start();bigToast(t('b_goal'),40);onPlayStart();setTimeout(()=>$('cd').classList.add('hide'),700)}
    if(NET.on&&NET.host)hostTick(dt);
    return;
  }
  if(G.state==='end'){
    G.endT-=dt;for(const e of G.ents){e.in.mx=e.in.mz=0;e.in.atk=false;e.in.dash=false}for(const e of G.ents)stepEnt(e,dt);
    updateBolts(dt);if(NET.on&&NET.host)hostTick(dt);
    if(G.endT<=0){G.state='over';showEnd()}return;
  }
  if(G.state!=='play')return;
  G.time-=dt;
  if(G.time<=0){
    if(G.ot){G.time=0;endMatch(-1)}
    else if(G.score[0]!==G.score[1])endMatch(G.score[0]>G.score[1]?0:1);
    else{G.ot=true;G.time=60;bigToast(t('b_ot'),40)}
  }
  G.botAcc+=dt;
  if(G.botAcc>=1/30){const bd=G.botAcc;G.botAcc=0;for(const e of G.ents){if(e.ai)thinkBot(e,bd)}}
  for(const e of G.ents)stepEnt(e,dt);
  updateFlags(dt);updateBolts(dt);updatePickups(dt);
  if(NET.on&&NET.host)hostTick(dt);
}
