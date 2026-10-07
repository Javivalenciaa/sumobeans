(async()=>{
await new Promise(r=>setTimeout(r,3500));
window.requestAnimationFrame=()=>0; // stop the game's own loop: the trailer drives everything by hand
const P=window.__poster,T=P.THREE,G=P.G;
document.getElementById('ui').style.display='none';document.getElementById('loading').style.display='none';P.lobbyHero.root.visible=false;
window.__origRender=P.renderer.render.bind(P.renderer);P.renderer.render=()=>{};
const V=(x,y,z)=>new T.Vector3(x,y,z);
const gh=(x,z)=>P.MAP.walk.reduce((h,r)=>(x>=r.x0&&x<=r.x1&&z>=r.z0&&z<=r.z1&&r.t>h)?r.t:h,0);
const W=1920,H=1080;
const c2=document.createElement('canvas');c2.width=W;c2.height=H;const x2=c2.getContext('2d');
const CAM={p:V(0,5,0),l:V(0,1,0)};
function setCam(pos,look,fov,k,dt){if(k){const a=1-Math.exp(-dt*k);CAM.p.lerp(pos,a);CAM.l.lerp(look,a)}else{CAM.p.copy(pos);CAM.l.copy(look)}
  P.camera.position.copy(CAM.p);P.camera.lookAt(CAM.l);P.camera.fov=fov;P.camera.aspect=W/H;P.camera.updateProjectionMatrix()}
const ease=t=>t*t*(3-2*t);
let posers=[];
function mkPose(team,x,z,yaw,weapon,pose,sc){const g=P.makeChar(team,'');P.setWeaponGfx(g,weapon);g.P.tag.visible=false;g.P.ring.visible=false;g.root.position.set(x,gh(x,z),z);g.root.rotation.y=yaw;if(sc)g.root.scale.setScalar(sc);P.scene.add(g.root);pose(g.P);posers.push(g)}
function clearPosers(){for(const g of posers)P.scene.remove(g.root);posers=[]}
function posterSetup(){P.loadMap('sky');for(const m of P.MAP.coinGfx)m.visible=false;P.MAP.chestGfx.visible=false;const H2=Math.PI/2;
  mkPose(0,-41.2,0,H2,'sword',p=>{p.armR.rotation.x=-2.7;p.armR.rotation.z=.15;p.armL.rotation.x=-.4;p.armL.rotation.z=-.5;p.legL.rotation.x=.8;p.legR.rotation.x=-.6},1.25);
  mkPose(0,-42.8,-3.6,H2-.3,'spear',p=>{p.armR.rotation.x=-1.5;p.wk.position.y=.8;p.legL.rotation.x=.6;p.legR.rotation.x=-.5},1.1);
  mkPose(0,-42.8,3.6,H2+.3,'xbow',p=>{p.armR.rotation.x=-1.5;p.armL.rotation.x=-1.35;p.legL.rotation.x=.3;p.legR.rotation.x=-.3},1.1);
  mkPose(1,-37.4,-3.0,-H2+.25,'spear',p=>{p.armR.rotation.x=-1.4;p.wk.position.y=.7;p.legL.rotation.x=.8;p.legR.rotation.x=-.7},1.1);
  mkPose(1,-37.0,3.2,-H2-.25,'sword',p=>{p.armR.rotation.x=-2.4;p.armL.rotation.x=-.4;p.legL.rotation.x=.7;p.legR.rotation.x=-.7},1.1);
  G.state='poster'}
let me=null,fp=false;
function newMatch(map,o){o=o||{};const roster=P.buildRoster([{pid:-1,name:'You',w:o.w||'sword',eq:{hat:'hat_crown',pack:'pack_gold',trail:'trail_star'},me:true}],map,true);
  P.startMatch(roster,map);G.state='play';G.countdown=0;me=G.player;me.ai=P.newAI(.97);me.ai.role=o.role||'att';me.ai.react=.15;
  fp=!!o.fp;if(!fp){me.isPlayer=false;G.player=null}
  for(const m of P.MAP.coinGfx)m.visible=true;P.look.pitch=0;
  const put=(e,x,z)=>{e.x=x;e.z=z;e.y=gh(x,z);e.ppx=e.x;e.ppy=e.y;e.ppz=e.z};
  if(o.pos)put(me,o.pos[0],o.pos[1]);
  const al=G.ents.filter(e=>e.team===0&&e!==me),en=G.ents.filter(e=>e.team===1);
  if(o.al)al.forEach((e,i)=>put(e,o.al[i][0],o.al[i][1]));
  if(o.en)en.forEach((e,i)=>{put(e,o.en[i][0],o.en[i][1]);if(o.enRole)e.ai.role=o.enRole[i];e.ai.aggr=1});
  if(o.yaw!==undefined){me.yaw=o.yaw;me.in.aimYaw=o.yaw;P.look.yaw=Math.atan2(-Math.sin(o.yaw),-Math.cos(o.yaw))}
  if(o.carry){const f=G.flags[1];f.state='carried';f.carrier=me;me.carry=f}
  for(const e of G.ents){e.ppx=e.x;e.ppy=e.y;e.ppz=e.z}}
function flagsGfx(){const fl=P.MAP.flagsGfx;if(!fl||!fl[0])return;for(let t=0;t<2;t++){const F=fl[t],f=G.flags[t];if(!f)continue;if(f.state==='carried'&&f.carrier){const c=f.carrier;F.g.position.set(c.x-Math.sin(c.yaw)*.55,c.y+.2,c.z-Math.cos(c.yaw)*.55);F.g.scale.setScalar(.7)}else{F.g.position.set(f.x,f.y,f.z);F.g.scale.setScalar(1)}
  const pa=F.cloth.geometry.attributes.position,o=F.orig,tt=performance.now()*.004;for(let i=0;i<pa.count;i++){pa.array[i*3+2]=Math.sin(tt*2+o[i*3]*2.2)*.16*o[i*3]}pa.needsUpdate=true}}
function sim(dt){const n=Math.max(1,Math.round(dt/P.STEP));for(let i=0;i<n;i++)P.updateGame(P.STEP);
  if(fp&&me){P.look.yaw+=((Math.atan2(-Math.sin(me.in.aimYaw),-Math.cos(me.in.aimYaw))-P.look.yaw+Math.PI*3)%(Math.PI*2)-Math.PI)*.35;const tp=Math.max(-.12,Math.min(.1,(me.in.aimPitch||0)*.5));P.look.pitch+=(tp-P.look.pitch)*.15}
  for(const e of G.ents){P.animEnt(e,dt,1);e.gfx.P.tag.visible=false}
  P.fx.update(dt);P.updateSlashes&&0;for(const f of P.MAP.anims)f(dt,G.clock);flagsGfx();
  if(fp&&G.player){P.updateCamera(dt,1);P.updateViewmodel(dt,me,Math.min(1,Math.hypot(me.velx,me.velz)/6.6),0,0)}}
// ---------------- compositing
function drawText(x,txt,cx,cy,size,opt){opt=opt||{};x.save();x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';x.font='900 '+size+'px "Trebuchet MS","Arial Black",Arial,sans-serif';
  x.translate(cx,cy);const s=opt.scale||1;x.scale(s,s);x.globalAlpha=opt.alpha===undefined?1:opt.alpha;
  const g=x.createLinearGradient(0,-size/2,0,size/2);g.addColorStop(0,opt.c0||'#fff7a8');g.addColorStop(.5,opt.c1||'#ffc83a');g.addColorStop(1,opt.c2||'#ff6a1a');
  x.lineWidth=size*.18;x.strokeStyle='#14224f';x.shadowColor='rgba(0,0,0,.6)';x.shadowBlur=size*.15;x.shadowOffsetY=size*.08;x.strokeText(txt,0,0);x.shadowColor='transparent';x.fillStyle=opt.plain||g;x.fillText(txt,0,0);x.restore()}
async function out(idx,sh,f,n){
  x2.save();x2.filter='contrast(1.07) saturate(1.15)';x2.drawImage(P.renderer.domElement,0,0,W,H);x2.restore();
  const vg=x2.createRadialGradient(W/2,H/2,H*.45,W/2,H/2,H*.95);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,10,30,.45)');x2.fillStyle=vg;x2.fillRect(0,0,W,H);
  const pop=Math.min(1,f/7),fade=Math.min(1,(n-f)/7);
  if(sh.cap){const a=Math.min(pop,fade);const sc=1+(1-ease(pop))*.35;
    const y0=sh.top?H*.14:H*.80;drawText(x2,sh.cap,W/2,y0,sh.big||104,{scale:sc,alpha:a});
    if(sh.sub)drawText(x2,sh.sub,W/2,y0+(sh.big||104)*.78,46,{scale:1,alpha:a*Math.min(1,f/12),plain:'#ffffff'})}
  if(sh.titleCard){const a=Math.min(pop,fade);drawText(x2,'FLAG FURY',W/2,H*.2,sh.titleSize||250,{scale:1+(1-ease(pop))*.5,alpha:a})}
  if(f<3){x2.fillStyle='rgba(255,255,255,'+[.75,.45,.18][f]+')';x2.fillRect(0,0,W,H)}
  const blob=await new Promise(r=>c2.toBlob(r,'image/jpeg',.92));await fetch('/save?name='+encodeURIComponent('trailer/'+String(idx).padStart(5,'0')+'.jpg'),{method:'POST',body:blob});}
function renderScene(){const R=P.renderer;R.setSize(W,H,false);P.placeSun(CAM.l.x,CAM.l.z);P.skyDome.position.copy(P.camera.position);R.clear();window.__origRender(P.scene,P.camera);
  if(fp&&G.player){P.vmCam.aspect=W/H;P.vmCam.updateProjectionMatrix();R.clearDepth();window.__origRender(P.vmScene,P.vmCam)}}
// ---------------- shots (24 fps)
const FPS=24,DT=1/FPS;
const shots=[
 {n:48,titleCard:true,setup:()=>{posterSetup();fp=false;me=null},cam:(f,n,dt)=>{const t=f/n;setCam(V(-31.5-2.2*t,1.0+.15*t,0),V(-44,3.0,0),54-4*t,0,dt)},nosim:true,cleanup:clearPosers},
 {n:60,cap:'3v3 CAPTURE THE FLAG',sub:'Two teams. One flag. Total chaos.',setup:()=>{newMatch('sky',{third:true,pos:[-30,-9],al:[[-27,-6],[-27,-12]],en:[[-8,2],[-6,-5],[-4,6]]})},
   cam:(f,n,dt)=>{const t=ease(f/n);setCam(V(lerpn(-62,-14,t),lerpn(30,13,t),lerpn(48,16,t)),V(lerpn(-20,-4,t),2,lerpn(0,0,t)),lerpn(62,52,t),0,dt)}},
 {n:84,cap:'STEAL THE ENEMY FLAG',sub:'Sneak in, grab it and run.',setup:()=>{newMatch('bridges',{fp:true,pos:[26,-1],al:[[24,5],[24,-6]],en:[[39,-4],[40,3],[36,8]],enRole:['def','def','sup'],yaw:-Math.PI/2*-1})},cam:()=>{}},
 {n:96,cap:'FIGHT WITH SWORDS, SPEARS & CROSSBOWS',sub:'Knock them back. Break their guard.',big:78,setup:()=>{newMatch('bridges',{third:true,pos:[33,-1],al:[[31,5],[31,-6]],en:[[39,-4],[41,0],[39,4]],enRole:['def','att','sup']})},
   cam:(f,n,dt)=>{let b=null,bd=1e9;for(const e of G.ents){if(e.team===1&&e.alive){const d=(e.x-me.x)**2+(e.z-me.z)**2;if(d<bd){bd=d;b=e}}}if(!b)b=me;const cx=(me.x+b.x)/2,cz=(me.z+b.z)/2,cy=me.y;const a=-1.1+f/n*2.6;setCam(V(cx+Math.cos(a)*6.5,cy+2.9,cz+Math.sin(a)*6.5),V(cx,cy+1.2,cz),52,6,dt)}},
 {n:96,cap:'RIDE THE JUMP PADS',sub:'Fly across the Sky Canyon.',setup:()=>{newMatch('sky',{third:true,pos:[-38,-7],al:[[-40,-3],[-40,2]],en:[[20,-13],[22,10],[38,4]],enRole:['def','def','def']})},
   cam:(f,n,dt)=>{const f2=V(Math.sin(me.yaw),0,Math.cos(me.yaw));const air=!me.grounded?1:0;setCam(V(me.x-f2.x*(7+air*3),me.y+3.4+air*2.2,me.z-f2.z*(7+air*3)),V(me.x+f2.x*3,me.y+1.4+air*.8,me.z+f2.z*3),60+air*8,4,dt)}},
 {n:108,cap:'CARRY IT HOME!',sub:'Dash. Dodge. Never drop it.',setup:()=>{newMatch('bridges',{third:true,carry:true,pos:[27,0],al:[[24,6],[24,-6]],en:[[36,-3],[38,3],[33,6]],enRole:['att','att','att']})},
   cam:(f,n,dt)=>{const f2=V(Math.sin(me.yaw),0,Math.cos(me.yaw));setCam(V(me.x-f2.x*6.2+f2.z*1.6,me.y+2.6,me.z-f2.z*6.2-f2.x*1.6),V(me.x+f2.x*2,me.y+1.3,me.z+f2.z*2),64,5,dt)}},
 {n:72,cap:'CAPTURE!',sub:'First to 3 wins.',big:150,slow:.6,setup:()=>{newMatch('bridges',{third:true,carry:true,pos:[-30,0],al:[[-33,5],[-33,-5]],en:[[-20,-2],[-18,3],[-15,0]],enRole:['att','att','att']})},
   cam:(f,n,dt)=>{const a=.4+f/n*1.6;setCam(V(me.x+Math.cos(a)*9,me.y+3.2,me.z+Math.sin(a)*9),V(me.x-2,me.y+1.6,me.z),56,5,dt)}},
 {n:72,cap:'4 WILD MAPS',sub:'',top:false,setup:()=>{},cam:()=>{},montage:true},
 {n:84,titleCard:true,cap:'PLAY FREE ON CRAZYGAMES',sub:'Solo vs bots - Public online - Private rooms',big:84,setup:()=>{posterSetup();fp=false;me=null},cam:(f,n,dt)=>{const t=f/n;setCam(V(-34.4+2.2*(1-t),.95,-.6+1.2*t),V(-44,2.9,0),56-3*t,0,dt)},nosim:true,cleanup:clearPosers,titleSize:230}
];
function lerpn(a,b,t){return a+(b-a)*t}
const mapNames=[['bridges','DAWN BRIDGES'],['factory','TOY FACTORY'],['sky','SKY CANYON'],['ice','FROZEN LAKE']];
window.__T={shots,out,renderScene,sim,newMatch,setCam,DT,state:{idx:1,shot:0,f:0,done:false,err:null}};
window.__runShots=async(from,to,onlyMid)=>{const st=window.__T.state;
 for(let s=from;s<=to;s++){const sh=shots[s];st.shot=s;
  if(sh.montage){for(let q=0;q<4;q++){newMatch(mapNames[q][0],{third:true});me=null;const pos=mapNames[q][0];const nf=18;
     for(let f=0;f<nf;f++){const t=f/nf;const cx=0,cz=0;const a=-.9+q*1.2+t*.9;sim(DT);
       const R=mapNames[q][0]==='factory'?34:mapNames[q][0]==='ice'?40:mapNames[q][0]==='sky'?44:40;
       setCam(V(Math.cos(a)*R*.75,mapNames[q][0]==='sky'?22:17,Math.sin(a)*R*.75),V(0,1.5,0),60,0,DT);renderScene();
       const label=mapNames[q][1];sh.cap=label;sh.sub='';await out(st.idx++,Object.assign({},sh,{cap:label,sub:(q+1)+' / 4'}),f+(q?7:0),nf+(q<3?7:0))}}
   continue}
  sh.setup();CAM.p.set(0,5,0);CAM.l.set(0,1,0);
  const n=onlyMid?1:sh.n;
  for(let f=0;f<n;f++){const ff=onlyMid?Math.floor(sh.n*.6):f;
    if(!sh.nosim){const steps=onlyMid?Math.floor(sh.n*.6):1;for(let k=0;k<steps;k++){sim(DT*(sh.slow||1));if(onlyMid&&sh.cam&&!fp)sh.cam(k,sh.n,DT)}}
    if(sh.cam&&!fp)sh.cam(ff,sh.n,DT);
    renderScene();await out(st.idx++,sh,ff,sh.n)}
  if(sh.cleanup)sh.cleanup()}
};
window.__T.ready=true;
})();
