/* ================= Online play (relay server, host-authoritative) =================
   - One browser is the host: it simulates the whole match (bots included) and sends snapshots (15 Hz).
   - Every other player moves locally (prediction) and sends its position/inputs (30 Hz); combat, flags,
     pickups and rewards are decided by the host. The relay (server/server.js) only forwards messages.
   - If anything fails, the game falls back to the offline match against bots. */
const NET={on:false,host:false,pid:-1,code:'',ws:null,peers:{},names:{},seq:0,snapAcc:0,inAcc:0,rs:0,useC:0,lastUseC:0,cdLeft:-1,mode:'',started:false,lastSnapN:-1,roster:null,nick:'',bolts:{},boltId:1,mapWanted:'bridges',joinTimer:0};
const netAuth=()=>!NET.on||NET.host;
const ATKC={sword:1,thrust:2,sweep:3,shove:4,shoot:5},ATKN=[null,'sword','thrust','sweep','shove','shoot'];
const ATKD={sword:.42,thrust:.55,sweep:.7,shove:.4,shoot:.35},WIDX={sword:0,spear:1,xbow:2},WNAME=['sword','spear','xbow'];
const r2=v=>Math.round(v*100)/100,r1=v=>Math.round(v*10)/10;
function netUrl(){
  try{const q=new URLSearchParams(location.search).get('server');if(q)return q}catch(e){}
  if(location.hostname==='localhost'||location.hostname==='127.0.0.1')return 'ws://localhost:8080';
  return 'wss://34-28-108-52.sslip.io';
}
function nsend(o){try{if(NET.ws&&NET.ws.readyState===1)NET.ws.send(JSON.stringify(o))}catch(e){}}
function netEv(o){if(NET.on&&NET.host&&NET.started)nsend({t:'a',d:o})}
function netNick(){
  if(cgUser&&cgUser.username)return String(cgUser.username).slice(0,16);
  if(!S.nick){S.nick='Player'+(100+Math.floor(Math.random()*900));save()}
  return S.nick;
}
function netReset(){
  NET.on=false;NET.host=false;NET.pid=-1;NET.code='';NET.peers={};NET.names={};NET.started=false;NET.roster=null;NET.mode='';NET.cdLeft=-1;NET.lastSnapN=-1;NET.rs=0;
  for(const k in NET.bolts){try{scene.remove(NET.bolts[k].g)}catch(e){}}NET.bolts={};
}
function netClose(){
  const ws=NET.ws;NET.ws=null;
  if(ws){ws.onclose=null;ws.onmessage=null;try{ws.close()}catch(e){}}
  netReset();try{CG&&CG.game.hideInviteButton&&CG.game.hideInviteButton()}catch(e){}
}
function netConnect(ms){
  return new Promise(res=>{
    let done=false;const fin=ok=>{if(!done){done=true;res(ok)}};
    try{
      const ws=new WebSocket(netUrl());
      const to=setTimeout(()=>{try{ws.close()}catch(e){}fin(false)},ms||3000);
      ws.onopen=()=>{clearTimeout(to);NET.ws=ws;ws.onmessage=ev=>{let m;try{m=JSON.parse(ev.data)}catch(e){return}netMsg(m)};ws.onclose=()=>netClosed(ws);fin(true)};
      ws.onerror=()=>{clearTimeout(to);fin(false)};
    }catch(e){fin(false)}
  });
}
function netClosed(ws){
  if(NET.ws!==ws)return;NET.ws=null;
  if(NET.on&&(G.state==='play'||G.state==='count'||G.state==='end'))abortMatch('net_lost');
  else if(G.state==='search'&&NET.mode)searchFailed();
}
function abortMatch(key){
  toastG(t(key));gp.stop();netClose();G.paused=false;$('pause').classList.add('hide');showLobby();
}
// ------------------------------------------------------------------ lobby / rooms
function netMsg(m){
  switch(m.t){
    case 'created':NET.on=true;NET.host=true;NET.pid=0;NET.code=m.code;NET.names[0]=NET.nick;roomChanged();break;
    case 'joined':NET.on=true;NET.host=false;NET.pid=m.id;NET.code=m.code;nsend({t:'h',d:{k:'hi',name:NET.nick,w:S.weapon,eq:S.eq}});roomChanged();break;
    case 'error':if(G.state==='search')searchFailed(m.msg);break;
    case 'peer':
      if(!NET.host)break;
      if(m.on){NET.peers[m.id]={name:'Player'+m.id,w:'sword',eq:{}}}
      else{
        delete NET.peers[m.id];delete NET.names[m.id];
        const e=G.ents.find(x=>x.remote&&x.pid===m.id);
        if(e){e.remote=false;e.ai=newAI(rand(.5,.85));e.ai.role={sword:'att',spear:'def',xbow:'sup'}[e.weapon];e.pid=-1} // a leaver becomes a bot
      }
      broadcastRoster();roomChanged();break;
    case 'cd':NET.cdLeft=m.s;roomChanged();break;
    case 'go':if(NET.host&&!NET.started)hostStart();break;
    case 'host':case 'hostchanged':case 'closed':
      if(G.state==='play'||G.state==='count'||G.state==='end')abortMatch('net_hostleft');
      else if(G.state==='search')searchFailed('closed');
      break;
    case 'm':{const d=m.d;if(!d)break;if(NET.host)hostRecv(m.from,d);else clientRecv(d);break}
  }
}
function broadcastRoster(){
  const l=[[0,NET.names[0]||NET.nick]];for(const pid in NET.peers)l.push([+pid,NET.peers[pid].name]);
  NET.roster=l;nsend({t:'a',d:{k:'R',l}});
}
function hostRecv(from,d){
  switch(d.k){
    case 'hi':{const p=NET.peers[from];if(p){p.name=String(d.name||('Player'+from)).slice(0,16);p.w=WIDX[d.w]!==undefined?d.w:'sword';p.eq=sanitizeEq(d.eq);NET.names[from]=p.name;broadcastRoster();roomChanged()}break}
    case 'i':{
      const e=G.ents.find(x=>x.remote&&x.pid===from);if(!e||!e.alive)break;
      if(d.rs!==e.rsq)break; // stale position from before a respawn
      const dx=d.x-e.x,dz=d.z-e.z;
      if(dx*dx+dz*dz<36){e.x=d.x;e.y=d.y;e.z=d.z}
      e.velx=d.vx||0;e.velz=d.vz||0;e.grounded=!!d.g;e.dashT=d.ds?.1:0;
      e.in.aimYaw=d.yw||0;e.in.aimPitch=d.pt||0;e.yaw=e.in.aimYaw;e.in.atk=!!d.a;e.in.mx=0;e.in.mz=0;
      if(d.u!==undefined&&d.u!==e.useC){e.useC=d.u;e.in.use=true}
      if(WIDX[d.w]!==undefined)e.nextWeapon=d.w;
      break}
  }
}
function sanitizeEq(eq){const o={hat:'',pack:'',trail:''};if(eq)for(const k in o){const id=eq[k];if(typeof id==='string'&&catById(id)&&catById(id).type===k)o[k]=id}return o}
// ------------------------------------------------------------------ match start
function buildRoster(humans,mapId){
  const roster=[],tc=[0,0],tw=[[],[]];
  for(const h of humans){
    let team=tc[0]<=tc[1]?0:1;if(tc[team]>=3)team=1-team;tc[team]++;tw[team].push(h.w);
    roster.push({id:roster.length,name:h.name,team,human:1,pid:h.pid,me:!!h.me,w:h.w,eq:h.eq});
  }
  const used=new Set(roster.map(r=>r.name)),pool=NAMES.filter(n=>!used.has(n));
  for(let i=pool.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;[pool[i],pool[j]]=[pool[j],pool[i]]}
  const pickW=(have)=>{const o=['sword','spear','xbow'].filter(w=>!have.includes(w)||(w!=='xbow'&&Math.random()<.35));return pick(o.length?o:['sword','spear'])};
  for(const team of[0,1])while(tc[team]<3){
    let w=pickW(tw[team]);if(w==='xbow'&&tw[team].includes('xbow'))w='spear';tw[team].push(w);tc[team]++;
    roster.push({id:roster.length,name:pool.pop(),team,human:0,pid:-1,w,skill:rand(.45,.92),eq:{hat:pick(['','','hat_party','hat_helm','hat_horns','hat_crown','hat_prop']),pack:pick(['','','pack_red','pack_pink','pack_gold']),trail:pick(['','','','trail_bubble'])}});
  }
  return roster;
}
function hostStart(mapId){
  if(NET.started)return;NET.started=true;
  nsend({t:'joinable',v:false});try{CG&&CG.game.hideInviteButton&&CG.game.hideInviteButton()}catch(e){}
  const humans=[{pid:0,name:NET.nick,w:S.weapon,eq:Object.assign({},S.eq),me:true}];
  for(const pid in NET.peers){const p=NET.peers[pid];humans.push({pid:+pid,name:p.name,w:p.w,eq:p.eq})}
  const map=mapId||pickMap();
  const roster=buildRoster(humans,map);NET.roster=null;
  nsend({t:'a',d:{k:'start',map,roster:roster.map(r=>Object.assign({},r,{me:false}))}});
  onNetStart(roster,map);
}
function onNetStart(roster,map){
  lastMap=map;previewMap=map;
  if(typeof searchStartedMatch==='function')searchStartedMatch(roster,map);
}
function clientRecv(d){
  switch(d.k){
    case 'R':NET.roster=d.l;for(const r of d.l)NET.names[r[0]]=r[1];roomChanged();break;
    case 'start':NET.started=true;onNetStart(d.roster,d.map);break;
    case 'S':applySnap(d);break;
    case 'F':feed(fmtFeed(d.key,d.p));break;
    case 'B':{const p=G.player;if(!p)break;if(d.pid>=0&&d.pid!==NET.pid)break;if(d.team>=0&&p.team!==d.team)break;bigToast(t(d.key),d.px||40);break}
    case 'T':if(d.pid===NET.pid)toast(t(d.key));break;
    case 'Q':if(d.pid===undefined||d.pid<0||d.pid===NET.pid)if(sfx[d.s])sfx[d.s]();break;
    case 'H':if(d.pid===NET.pid)hitMarker(!!d.kill,!!d.sh);break;
    case 'D':if(d.pid===NET.pid){G.shake=.35;G.hitFlash=.35;sfx.hurt();const a=G.byId[d.att];if(a)dmgIndicator(a)}break;
    case 'K':{const p=G.player;if(p&&d.pid===NET.pid){p.kx+=d.kx;p.kz+=d.kz;p.stun=Math.max(p.stun,d.st||.2);p.slow=Math.max(p.slow,d.sl||0)}break}
    case 'L':slashFx(d.x,d.y,d.z,d.yaw,d.r,d.h,d.c);sfx.swing();break;
    case 'X':fx.burst(d.x,d.y,d.z,d.n||8,d.c||'#ffffff',d.s||4,d.l||.35,d.g);if(d.q&&sfx[d.q])sfx[d.q]();break;
    case 'E':endMatchClient(d);break;
  }
}
// ------------------------------------------------------------------ snapshots
function hostTick(dt){
  NET.snapAcc+=dt;
  if(NET.snapAcc>=1/15){NET.snapAcc=0;nsend({t:'a',d:buildSnap()})}
}
function buildSnap(){
  const st=G.state==='count'?0:G.state==='play'?1:2;
  const e=G.ents.map(x=>[x.id,r2(x.x),r2(x.y),r2(x.z),r2(x.yaw),Math.round(x.hp*10),
    (x.alive?1:0)|(x.grounded?2:0)|(x.dashT>0?4:0)|(x.boots>0?8:0)|(x.item==='shield'?16:x.item==='boots'?32:0)|(x.prot>0?64:0)|(x.shield>0?128:0)|(x.charge>0?256:0),
    r1(x.velx),r1(x.velz),x.atk?ATKC[x.atk.kind]:0,x.atk?r2(x.atk.t):0,(x.atk&&x.atk.c)||0,x.ammo,Math.round(x.reload*10),WIDX[x.weapon],x.rsq,x.stats.coins,r1(x.respawn)]);
  const f=G.flags.map(fl=>[fl.state==='home'?0:fl.state==='carried'?1:2,r2(fl.x),r2(fl.y),r2(fl.z),fl.carrier?fl.carrier.id:-1]);
  const b=G.bolts.map(bt=>{if(!bt.id)bt.id=NET.boltId++;return[bt.id,r2(bt.x),r2(bt.y),r2(bt.z),r1(bt.vx),r1(bt.vy),r1(bt.vz)]});
  return{k:'S',n:++NET.seq,T:r1(G.time),o:G.ot?1:0,sc:G.score,st,cd:r2(G.countdown),e,f,b,ch:[G.chest.has?1:0,G.chest.kind==='shield'?0:1],co:G.coins.map(c=>c.on?1:0).join('')};
}
function applySnap(s){
  if(s.n<=NET.lastSnapN)return;NET.lastSnapN=s.n;
  if(!G.player)return;
  G.score=s.sc;G.time=s.T;G.ot=!!s.o;
  if(s.st===0){G.countdown=s.cd}
  else if(s.st===1&&G.state==='count'){G.state='play';sfx.go();gp.start();bigToast(t('b_goal'),40);onPlayStart();setTimeout(()=>$('cd').classList.add('hide'),700)}
  const now=performance.now();
  for(const r of s.e){
    const e=G.byId[r[0]];if(!e)continue;
    const alive=!!(r[6]&1);
    e.hp=r[5]/10;e.ammo=r[12];e.reload=r[13]/10;e.respawn=r[17];e.stats.coins=r[16];
    const wn=WNAME[r[14]];if(wn!==e.weapon){e.weapon=wn;setWeaponGfx(e.gfx,wn);if(e.isPlayer)setViewmodel(wn,e.team)}
    e.shield=(r[6]&128)?1:0;e.prot=(r[6]&64)?1:0;e.boots=(r[6]&8)?1:0;e.item=(r[6]&16)?'shield':(r[6]&32)?'boots':null;
    if(e.isPlayer){
      G.matchCoins=r[16];
      if(r[15]!==e.rsq){e.rsq=r[15];NET.rs=e.rsq;e.x=r[1];e.y=r[2];e.z=r[3];e.ppx=e.x;e.ppy=e.y;e.ppz=e.z;e.vx=e.vz=e.vy=0;e.kx=e.kz=0;e.fly=null;
        if(alive){e.yaw=r[4];look.yaw=Math.atan2(-Math.sin(e.yaw),-Math.cos(e.yaw));look.pitch=0}}
      if(alive!==e.alive){
        if(!alive){clientDie(e)}else{e.alive=true;e.gfx.root.visible=false;e.atk=null;e.cdA=0;e.stun=0;uiDead(false);if(e.nextWeapon!==e.weapon){e.nextWeapon=e.weapon}}
      }
    }else{
      if(alive&&!e.alive){e.x=r[1];e.y=r[2];e.z=r[3];e.tx=r[1];e.ty=r[2];e.tz=r[3];e.ppx=e.x;e.ppy=e.y;e.ppz=e.z;e.gfx.root.visible=true}
      if(!alive&&e.alive){fx.burst(e.x,e.y+.8,e.z,26,e.team?'#ff6a62':'#5aa0ff',7,.7);sfx.pop()}
      e.alive=alive;e.tx=r[1];e.ty=r[2];e.tz=r[3];e.tyaw=r[4];e.tvx=r[7];e.tvz=r[8];e.snapT=now;
      e.grounded=!!(r[6]&2);e.dashT=(r[6]&4)?.1:0;e.charge=(r[6]&256)?.6:0;
      const kn=ATKN[r[9]];
      if(kn){if(!e.atk||e.atk.kind!==kn)sfxNear(e,kn==='shoot'?'shoot':'swing');e.atk={kind:kn,t:r[10],dur:ATKD[kn],c:r[11],yaw:r[4],hit:0,done:true}}else e.atk=null;
    }
  }
  for(let i=0;i<2;i++){
    const f=s.f[i],fl=G.flags[i];fl.state=f[0]===0?'home':f[0]===1?'carried':'dropped';fl.x=f[1];fl.y=f[2];fl.z=f[3];fl.carrier=f[4]>=0?G.byId[f[4]]:null;
  }
  for(const e of G.ents)e.carry=null;
  for(const fl of G.flags)if(fl.carrier)fl.carrier.carry=fl;
  // bolts
  const seen={};
  for(const b of s.b){
    seen[b[0]]=1;let o=NET.bolts[b[0]];
    if(!o){o={g:makeBoltGfx(),x:b[1],y:b[2],z:b[3]};scene.add(o.g);NET.bolts[b[0]]=o;sfxNearPos(b[1],b[3],'shoot')}
    o.x=b[1];o.y=b[2];o.z=b[3];o.vx=b[4];o.vy=b[5];o.vz=b[6];
  }
  for(const id in NET.bolts){if(!seen[id]){const o=NET.bolts[id];scene.remove(o.g);o.g.traverse(q=>{if(q.geometry)q.geometry.dispose()});delete NET.bolts[id]}}
  G.chest.has=!!s.ch[0];G.chest.kind=s.ch[1]?'boots':'shield';
  for(let i=0;i<s.co.length&&i<G.coins.length;i++){const on=s.co[i]==='1';if(on!==G.coins[i].on){G.coins[i].on=on;MAP.coinGfx[i].visible=on;if(!on)fx.burst(G.coins[i].x,1,G.coins[i].z,5,'#ffe066',3,.35,2)}}
}
function sfxNear(e,s){const p=G.player;if(p&&dist2(e.x,e.z,p.x,p.z)<30*30&&sfx[s])sfx[s]()}
function sfxNearPos(x,z,s){const p=G.player;if(p&&dist2(x,z,p.x,p.z)<40*40&&sfx[s])sfx[s]()}
function makeBoltGfx(){
  const grp=new THREE.Group(),m=shadowed(new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.9,6),M(0xe8eef5)));m.rotation.x=Math.PI/2;grp.add(m);
  const tip=new THREE.Mesh(new THREE.ConeGeometry(.11,.3,6),M(0xffd23f));tip.rotation.x=Math.PI/2;tip.position.z=.6;grp.add(tip);
  const tr=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,2.2,5),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.35}));tr.rotation.x=Math.PI/2;tr.position.z=-1.4;grp.add(tr);
  return grp;
}
function clientDie(e){
  e.alive=false;e.atk=null;e.gfx.root.visible=false;e.carry=null;
  fx.burst(e.x,e.y+.8,e.z,28,e.team?'#ff6a62':'#5aa0ff',7,.7);sfx.pop();
  if(e.isPlayer)uiDead(true);
}
// per-frame client work: smooth puppets, move bolts, send our state to the host
function clientTick(dt){
  const now=performance.now();
  for(const e of G.ents){
    if(!e.puppet)continue;
    if(!e.alive){continue}
    const age=Math.min(.25,(now-(e.snapT||now))/1000);
    const px=e.tx+e.tvx*age,pz=e.tz+e.tvz*age,k=Math.min(1,dt*14);
    e.x+=(px-e.x)*k;e.z+=(pz-e.z)*k;e.y+=((e.ty)-e.y)*Math.min(1,dt*18);
    e.yaw+=angDiff(e.yaw,e.tyaw)*Math.min(1,dt*16);
    e.velx=e.tvx;e.velz=e.tvz;e.ppx=e.x;e.ppy=e.y;e.ppz=e.z;
    if(e.atk)e.atk.t+=0; // time comes from snapshots
  }
  for(const id in NET.bolts){const o=NET.bolts[id];o.x+=o.vx*dt;o.y+=o.vy*dt;o.z+=o.vz*dt;o.g.position.set(o.x,o.y,o.z);if(o.vx||o.vz)o.g.lookAt(o.x+o.vx,o.y+o.vy,o.z+o.vz)}
  G.time=Math.max(0,G.time-dt);
  NET.inAcc+=dt;
  if(NET.inAcc>=1/30){NET.inAcc=0;clientSendInput()}
}
function clientSendInput(){
  const p=G.player;if(!p)return;
  if(p.in.use){NET.useC++;p.in.use=false}
  nsend({t:'h',d:{k:'i',rs:NET.rs,x:r2(p.x),y:r2(p.y),z:r2(p.z),vx:r1(p.velx),vz:r1(p.velz),g:p.grounded?1:0,ds:p.dashT>0?1:0,yw:r2(p.in.aimYaw),pt:r2(p.in.aimPitch),a:p.in.atk?1:0,u:NET.useC,w:p.nextWeapon||p.weapon}});
}
function endMatchClient(d){
  if(G.state==='end'||G.state==='over')return;
  G.state='end';G.over={winner:d.w};G.endT=2.4;gp.stop();G.score=d.sc;
  for(const id in d.st){const e=G.byId[id];if(e)Object.assign(e.stats,d.st[id])}
  if(G.player)G.matchCoins=G.player.stats.coins;
}
function hostEndEvent(winner){
  const st={};for(const e of G.ents)st[e.id]=Object.assign({},e.stats);
  netEv({k:'E',w:winner,sc:G.score,st});
}
