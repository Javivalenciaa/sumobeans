/* ================= Three.js setup ================= */
const canvas=$('gl');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(1);
renderer.autoClear=false;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x8fcdfc);
scene.fog=new THREE.Fog(0xa8d8ff,70,200);
const camera=new THREE.PerspectiveCamera(78,16/9,0.08,500);
camera.rotation.order='YXZ';scene.add(camera);
const hemi=new THREE.HemisphereLight(0xe2f2ff,0x62904c,0.6);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0cf,0.85);
sun.position.set(30,50,20);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);
sun.shadow.bias=-0.0004;sun.shadow.normalBias=0.06;
{const sc=sun.shadow.camera;sc.left=-34;sc.right=34;sc.top=34;sc.bottom=-34;sc.near=1;sc.far=160}
scene.add(sun);scene.add(sun.target);
// viewmodel scene (drawn on top, never clips into walls)
const vmScene=new THREE.Scene(),vmCam=new THREE.PerspectiveCamera(58,16/9,0.02,10);
vmScene.add(new THREE.HemisphereLight(0xffffff,0x8899aa,0.55));
{const l=new THREE.DirectionalLight(0xffffff,0.55);l.position.set(1,2,1);vmScene.add(l)}
let Quality={shadows:true,level:'high'};
function setQuality(lv){
  Quality.level=lv;Quality.shadows=lv!=='low';
  renderer.shadowMap.enabled=Quality.shadows;sun.castShadow=Quality.shadows;
  scene.traverse(o=>{if(o.material&&o.material.needsUpdate!==undefined)o.material.needsUpdate=true});
}
function resize(){
  const w=Math.max(2,innerWidth),h=Math.max(2,innerHeight);renderer.setSize(w,h,false);
  camera.aspect=w/h;camera.fov=w/h<1.5?84:76;camera.updateProjectionMatrix();vmCam.aspect=w/h;vmCam.updateProjectionMatrix();
  document.documentElement.style.fontSize=(10*Math.min(w/1280,h/720)).toFixed(2)+'px';
}
addEventListener('resize',resize);resize();

/* ================= Materials & helpers ================= */
const gm=new THREE.DataTexture(new Uint8Array([120,185,235]),3,1,THREE.LuminanceFormat);
gm.minFilter=gm.magFilter=THREE.NearestFilter;gm.needsUpdate=true;
const matCache={};
function M(c,o){const k=c+(o?JSON.stringify(o):'');return matCache[k]||(matCache[k]=new THREE.MeshToonMaterial(Object.assign({color:c,gradientMap:gm},o||{})))}
const OUTM=new THREE.MeshBasicMaterial({color:0x101828,side:THREE.BackSide});
function shadowed(m,cast,recv){m.castShadow=cast!==false;m.receiveShadow=recv!==false;return m}
function bx(w,h,d,c,x,y,z,par){const m=shadowed(new THREE.Mesh(new THREE.BoxGeometry(w,h,d),M(c)));m.position.set(x,y,z);if(par)par.add(m);return m}
function cy(rt,rb,h,c,x,y,z,par,seg){const m=shadowed(new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||12),M(c)));m.position.set(x,y,z);if(par)par.add(m);return m}
function sp(r,c,x,y,z,par,o){const m=shadowed(new THREE.Mesh(new THREE.SphereGeometry(r,14,10),M(c,o)));m.position.set(x,y,z);if(par)par.add(m);return m}
function outline(m,s){const o=new THREE.Mesh(m.geometry,OUTM);o.scale.setScalar(s||1.08);m.add(o);return o}

/* ---------- instanced prop batches (few draw calls) ---------- */
const UG={box:new THREE.BoxGeometry(1,1,1),cyl:new THREE.CylinderGeometry(1,1,1,14),cyl6:new THREE.CylinderGeometry(1,1,1,6),cone:new THREE.ConeGeometry(1,1,9),cone4:new THREE.ConeGeometry(1,1,4),sph:new THREE.SphereGeometry(1,12,9),ico:new THREE.IcosahedronGeometry(1,0),dod:new THREE.DodecahedronGeometry(1,0),oct:new THREE.OctahedronGeometry(1,0)};
class Batch{
  constructor(){this.g=new Map()}
  add(kind,col,x,y,z,sx,sy,sz,ry,o){const k=kind+'|'+col+'|'+(o?JSON.stringify(o):'');let a=this.g.get(k);if(!a){a={kind,col,o,l:[]};this.g.set(k,a)}a.l.push([x,y,z,sx,sy,sz,ry||0])}
  box(cx,cy_,cz,w,h,d,col,ry,o){this.add('box',col,cx,cy_,cz,w,h,d,ry,o)}
  slab(cx,cz,w,d,y0,y1,col,o){this.add('box',col,cx,(y0+y1)/2,cz,w,y1-y0,d,0,o)}
  cyl(x,y0,z,r,h,col,o){this.add('cyl',col,x,y0+h/2,z,r,h,r,0,o)}
  cone(x,y0,z,r,h,col,o){this.add('cone',col,x,y0+h/2,z,r,h,r,0,o)}
  flush(parent){
    const mt=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),p=new THREE.Vector3(),s=new THREE.Vector3();
    for(const a of this.g.values()){
      const im=new THREE.InstancedMesh(UG[a.kind],M(a.col,a.o),a.l.length);
      a.l.forEach((l,i)=>{p.set(l[0],l[1],l[2]);s.set(l[3],l[4],l[5]);q.setFromEuler(e.set(0,l[6],0));mt.compose(p,q,s);im.setMatrixAt(i,mt)});
      im.castShadow=!(a.o&&a.o.transparent);im.receiveShadow=true;im.frustumCulled=false;parent.add(im);
    }
    this.g.clear();
  }
}

/* ---------- sky dome ---------- */
const skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
  uniforms:{top:{value:new THREE.Color(0x4aa8ff)},mid:{value:new THREE.Color(0xbfe8ff)},bot:{value:new THREE.Color(0xffffff)}},
  vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform vec3 top;uniform vec3 mid;uniform vec3 bot;varying vec3 vP;void main(){float h=normalize(vP).y;vec3 c=h>0.0?mix(mid,top,pow(h,0.55)):mix(mid,bot,pow(-h,0.6));gl_FragColor=vec4(c,1.0);}'});
const skyDome=new THREE.Mesh(new THREE.SphereGeometry(300,24,14),skyMat);skyDome.renderOrder=-10;skyDome.frustumCulled=false;scene.add(skyDome);

/* ================= Characters ================= */
const TEAMC=[{hood:0x2f6fe0,tunic:0x4b8bff,css:'#5aa0ff',ring:0x3d8bff},{hood:0xd63a3a,tunic:0xff5a52,css:'#ff6a62',ring:0xff4a42}];
function buildWeapon(kind){
  const g=new THREE.Group();
  if(kind==='sword'){
    bx(.1,.95,.04,0xe8eef5,0,.62,0,g);bx(.05,.95,.05,0xbfc9d6,0,.62,0,g);
    bx(.4,.08,.1,0xffc400,0,.14,0,g);cy(.05,.05,.3,0x6b4423,0,0,0,g,6);sp(.07,0xffc400,0,-.17,0,g);
    const tip=shadowed(new THREE.Mesh(new THREE.ConeGeometry(.07,.2,4),M(0xe8eef5)));tip.position.y=1.18;g.add(tip);
  }else if(kind==='spear'){
    cy(.045,.045,2.4,0x8a5a2b,0,.5,0,g,6);
    const t=shadowed(new THREE.Mesh(new THREE.ConeGeometry(.12,.5,6),M(0xdfe6ee)));t.position.y=1.95;g.add(t);
    cy(.08,.08,.1,0xffc400,0,1.68,0,g,8);
  }else{
    bx(.1,.8,.14,0x8a5a2b,0,.3,0,g);bx(.14,.14,.2,0x6b4423,0,-.1,0,g);
    const arc=shadowed(new THREE.Mesh(new THREE.TorusGeometry(.38,.045,6,16,Math.PI),M(0x3a2a1a)));arc.position.set(0,.45,0);g.add(arc);
    bx(.76,.02,.02,0xeeeeee,0,.45,0,g);
    const bolt=shadowed(new THREE.Mesh(new THREE.ConeGeometry(.04,.3,5),M(0xcfd6dd)));bolt.position.set(0,.58,0);g.add(bolt);g.userData.bolt=bolt;
  }
  return g;
}
function makeHat(id){
  const g=new THREE.Group();
  if(id==='hat_party'){const c=shadowed(new THREE.Mesh(new THREE.ConeGeometry(.22,.55,10),M(0xff5fa8)));c.position.y=.25;g.add(c);sp(.07,0xffe45a,0,.55,0,g)}
  else if(id==='hat_helm'||id==='hat_epic'){const gold=id==='hat_epic';const h=shadowed(new THREE.Mesh(new THREE.SphereGeometry(.4,14,10,0,TAU,0,Math.PI*.55),M(gold?0xffc400:0x9aa7b5)));h.position.y=-.1;g.add(h);if(gold){const f=shadowed(new THREE.Mesh(new THREE.ConeGeometry(.1,.45,6),M(0xff4040)));f.position.y=.4;g.add(f)}else bx(.08,.2,.5,0x6e7a88,0,.28,0,g)}
  else if(id==='hat_horns'){for(const s of[-1,1]){const c=shadowed(new THREE.Mesh(new THREE.ConeGeometry(.1,.45,6),M(0xf5f0e0)));c.position.set(s*.28,.15,0);c.rotation.z=-s*.5;g.add(c)}}
  else if(id==='hat_prop'){cy(.03,.03,.2,0x555555,0,.1,0,g,6);const b=new THREE.Group();b.position.y=.22;bx(.7,.03,.12,0xff5a52,0,0,0,b);bx(.12,.03,.7,0x4b8bff,0,0,0,b);g.add(b);g.userData.spin=b}
  else if(id==='hat_crown'){cy(.28,.3,.2,0xffc400,0,.05,0,g,10);for(let i=0;i<5;i++){const a=i/5*TAU,c=shadowed(new THREE.Mesh(new THREE.ConeGeometry(.07,.2,4),M(0xffc400)));c.position.set(Math.cos(a)*.26,.25,Math.sin(a)*.26);g.add(c)}sp(.06,0xff3b6b,0,.08,.3,g)}
  else if(id==='hat_recruit'){const h=shadowed(new THREE.Mesh(new THREE.SphereGeometry(.4,12,8,0,TAU,0,Math.PI*.45),M(0x4a7a3a)));h.position.y=-.08;g.add(h);bx(.4,.05,.3,0x35582a,0,-.02,.3,g)}
  return g;
}
function tagTexture(name,hp,team){
  const c=document.createElement('canvas');c.width=256;c.height=72;const x=c.getContext('2d');
  x.font='bold 30px Trebuchet MS,Arial';x.textAlign='center';x.lineWidth=6;x.strokeStyle='rgba(0,0,0,.7)';x.strokeText(name,128,28);x.fillStyle=team===0?'#9fd0ff':'#ff9a92';x.fillText(name,128,28);
  for(let i=0;i<3;i++){x.fillStyle=hp>i+.5?'#ff4d6d':(hp>i?'#ff9db0':'rgba(255,255,255,.25)');x.beginPath();x.arc(98+i*30,55,10,0,TAU);x.fill()}
  return c;
}
function makeChar(team,name){
  const tc=TEAMC[team],root=new THREE.Group(),body=new THREE.Group();root.add(body);
  const P={};
  for(const s of[-1,1]){const l=new THREE.Group();l.position.set(s*.16,.4,0);cy(.11,.12,.4,0x5a3a24,0,-.2,0,l,8);bx(.2,.1,.3,0x3a2a1a,0,-.4,.05,l);body.add(l);P[s<0?'legL':'legR']=l}
  const torso=cy(.27,.32,.52,tc.tunic,0,.66,0,body,12);outline(torso,1.06);
  cy(.325,.325,.07,0x5a3a24,0,.5,0,body,12);bx(.1,.09,.04,0xffc400,0,.5,.325,body);
  const head=sp(.3,0xffd2a8,0,1.06,0,body);outline(head,1.07);P.head=head;
  const hood=shadowed(new THREE.Mesh(new THREE.SphereGeometry(.37,16,12,0,TAU,0,Math.PI*.64),M(tc.hood)));hood.position.set(0,1.06,-.05);hood.rotation.x=-.3;body.add(hood);outline(hood,1.06);
  const tip=shadowed(new THREE.Mesh(new THREE.ConeGeometry(.12,.4,8),M(tc.hood)));tip.position.set(0,1.38,-.32);tip.rotation.x=-1.0;body.add(tip);
  for(const s of[-1,1]){sp(.045,0x101828,s*.11,1.08,.27,body);sp(.012,0xffffff,s*.1,1.1,.31,body)}
  sp(.05,0xf0a888,0,1.0,.3,body);
  const pack=new THREE.Group();pack.position.set(0,.72,-.3);bx(.46,.5,.24,0xc8913f,0,0,0,pack);bx(.3,.18,.1,0xa8712a,0,.1,-.14,pack);body.add(pack);P.pack=pack;P.packMesh=pack.children[0];
  for(const s of[-1,1]){const a=new THREE.Group();a.position.set(s*.36,.88,0);cy(.085,.085,.42,tc.tunic,0,-.2,0,a,8);sp(.1,0xffd2a8,0,-.44,0,a);body.add(a);P[s<0?'armL':'armR']=a}
  P.armR.rotation.x=-.9;
  const holder=new THREE.Group();holder.position.set(0,-.44,.02);holder.rotation.x=Math.PI/2;P.armR.add(holder);P.holder=holder;
  P.hatA=new THREE.Group();P.hatA.position.set(0,1.42,0);body.add(P.hatA);
  const bub=new THREE.Mesh(new THREE.SphereGeometry(.95,16,12),new THREE.MeshBasicMaterial({color:0x7fd8ff,transparent:true,opacity:.28,depthWrite:false}));bub.position.y=.7;bub.visible=false;root.add(bub);P.bubble=bub;
  const ring=new THREE.Mesh(new THREE.RingGeometry(.55,.68,24),new THREE.MeshBasicMaterial({color:tc.ring,transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.06;ring.renderOrder=2;root.add(ring);P.ring=ring;
  const tag=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(tagTexture(name,3,team)),transparent:true,depthTest:false}));tag.scale.set(2.5,.7,1);tag.position.y=2.2;tag.renderOrder=10;root.add(tag);P.tag=tag;
  root.traverse(o=>{if(o.isMesh&&o.material!==OUTM&&o.material.map===undefined&&!o.material.transparent){o.castShadow=true}});
  return{root,body,P};
}
function setWeaponGfx(gfx,kind){
  if(gfx.P.wk)gfx.P.holder.remove(gfx.P.wk);
  const w=buildWeapon(kind);gfx.P.holder.add(w);gfx.P.wk=w;gfx.P.wKind=kind;
}
function applyCosmetics(gfx,eq){
  const P=gfx.P;while(P.hatA.children.length)P.hatA.remove(P.hatA.children[0]);P.spinner=null;
  if(eq.hat){const h=makeHat(eq.hat);P.hatA.add(h);P.spinner=h.userData.spin||null}
  const pc=eq.pack?catById(eq.pack):null;P.packMesh.material=M(pc&&pc.col?pc.col:0xc8913f);
}
function setTag(gfx,name,hp,team){const tx=gfx.P.tag.material.map;tx.image=tagTexture(name,hp,team);tx.needsUpdate=true}

/* ================= First-person viewmodel ================= */
const VM={hand:new THREE.Group(),hand2:new THREE.Group(),wk:null,kind:'',t:0,sx:0,sy:0};
(function(){
  const skin=0xffd2a8,mat=new THREE.MeshToonMaterial({color:0x4b8bff,gradientMap:gm});VM.mat=mat;
  for(const h of[VM.hand,VM.hand2]){
    const sl=new THREE.Mesh(new THREE.CylinderGeometry(.045,.055,1.0,10),mat);sl.position.y=-.5;h.add(sl);
    const hd=new THREE.Mesh(new THREE.SphereGeometry(.055,12,9),M(skin));h.add(hd);vmScene.add(h);
  }
  VM.hand2.visible=false;
})();
function setViewmodel(kind,team){
  if(VM.wk)VM.hand.remove(VM.wk);
  VM.kind=kind;VM.mat.color.setHex(TEAMC[team||0].tunic);
  const w=buildWeapon(kind);w.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false}});VM.hand.add(w);VM.wk=w;
  if(kind==='sword'){w.position.set(0,.02,0);w.rotation.set(.5,0,0);w.scale.setScalar(.3)}
  else if(kind==='spear'){w.position.set(0,-.06,0);w.rotation.set(-.3,0,0);w.scale.setScalar(.26)}
  else{w.position.set(0,-.04,0);w.rotation.set(-.5,0,0);w.scale.setScalar(.32)}
  VM.hand2.visible=kind==='xbow';
}
const _seg=(u,a,b)=>clamp((u-a)/(b-a),0,1),_ease=x=>x*x*(3-2*x);
// e = player entity; mv = movement 0..1; dyaw/dpitch = look deltas this frame
function updateViewmodel(dt,e,mv,dyaw,dpitch){
  VM.t+=dt*(3+mv*7);
  const bobx=Math.sin(VM.t)*.012*mv,boby=Math.abs(Math.cos(VM.t))*.012*mv;
  VM.sx+=(clamp(-dyaw*1.2,-.12,.12)-VM.sx)*Math.min(1,dt*9);VM.sy+=(clamp(dpitch*1.2,-.12,.12)-VM.sy)*Math.min(1,dt*9);
  let px=.34,py=-.31,pz=-.55,rx=0,ry=.12,rz=.15;
  const a=e.atk;
  if(VM.kind==='sword'){
    rx=.15;
    if(a){
      const u=a.t/a.dur,w=_ease(_seg(u,0,.3)),s=_ease(_seg(u,.3,.58)),r=1-_ease(_seg(u,.62,1)),c=a.c|0;
      if(c===0){rz+=(w*.9-s*2.4)*r;px+=(-s*.62+w*.08)*r;rx+=(w*.35-s*.55)*r;pz+=-s*.2*r}
      else if(c===1){rz+=(-w*.5+s*2.2)*r;px+=(s*.1-w*.1)*r;rx+=(w*.35-s*.55)*r;pz+=-s*.2*r;py+=-s*.05*r}
      else{rx+=(w*1.25-s*2.2)*r;py+=(w*.16-s*.22)*r;pz+=-s*.32*r;px+=-s*.15*r}
    }
  }else if(VM.kind==='spear'){
    px=.3;py=-.3;pz=-.45;rx=.05;ry=.05;rz=.05;
    if(e.charge>0&&!a){const c=Math.min(1,e.charge/.5);pz+=.2*c;px+=.08*c;rx+=.1*c;px+=Math.sin(performance.now()*.05)*.005*c}
    if(a){const u=a.t/a.dur;if(a.kind==='thrust'){const k=u<.3?u/.3:1-(u-.3)/.7;pz-=.75*k;py+=.03*k}else{const k=Math.sin(Math.min(1,u*1.3)*Math.PI);ry+=-2.2*k;px-=.45*k;pz-=.2*k}}
  }else{
    px=.2;py=-.3;pz=-.5;rx=.0;ry=.0;rz=0;
    VM.hand2.position.set(-.05,-.36,-.78);VM.hand2.rotation.set(-1.15,0,-.1);
    if(a){const u=a.t/a.dur;const k=u<.25?u/.25:1-(u-.25)/.75;pz+=.12*k;rx+=.2*k;py+=.03*k;VM.hand2.position.z+=.1*k}
    else if(e.reload>0){py-=.1;rx-=.35;VM.hand2.position.y+=Math.sin(performance.now()*.012)*.03}
  }
  if(e.dashT>0){py-=.07;pz-=.05}
  VM.hand.position.set(px+bobx+VM.sx,py+boby+VM.sy,pz);
  VM.hand.rotation.set(rx-1.0,ry,rz);
  if(VM.hand2.visible){VM.hand2.position.x+=bobx;VM.hand2.position.y+=boby}
}

/* ================= FX: particles, slashes ================= */
const NP=700;
const pGeo=new THREE.BufferGeometry(),pPos=new Float32Array(NP*3),pCol=new Float32Array(NP*3);
pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));pGeo.setAttribute('color',new THREE.BufferAttribute(pCol,3));
const dotC=document.createElement('canvas');dotC.width=dotC.height=32;{const x=dotC.getContext('2d'),g=x.createRadialGradient(16,16,2,16,16,15);g.addColorStop(0,'#fff');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,32,32)}
const pPts=new THREE.Points(pGeo,new THREE.PointsMaterial({size:.5,vertexColors:true,map:new THREE.CanvasTexture(dotC),transparent:true,depthWrite:false,sizeAttenuation:true}));
pPts.frustumCulled=false;scene.add(pPts);
const pv=new Float32Array(NP*3),pl=new Float32Array(NP),pg=new Float32Array(NP);let pHead=0;
const _c=new THREE.Color();
const fx={
  p(x,y,z,vx,vy,vz,life,col,g){const i=pHead;pHead=(pHead+1)%NP;pPos[i*3]=x;pPos[i*3+1]=y;pPos[i*3+2]=z;pv[i*3]=vx;pv[i*3+1]=vy;pv[i*3+2]=vz;pl[i]=life;pg[i]=g||0;_c.set(col);pCol[i*3]=_c.r;pCol[i*3+1]=_c.g;pCol[i*3+2]=_c.b},
  burst(x,y,z,n,col,spd,life,g){for(let i=0;i<n;i++){const a=Math.random()*TAU,u=Math.random()*2-1,s=spd*(.4+Math.random()*.6),r=Math.sqrt(1-u*u);fx.p(x,y,z,Math.cos(a)*r*s,u*s*.8+spd*.3,Math.sin(a)*r*s,life*(.6+Math.random()*.6),col,g===undefined?14:g)}},
  update(dt){for(let i=0;i<NP;i++){if(pl[i]<=0)continue;pl[i]-=dt;pv[i*3+1]-=pg[i]*dt;pPos[i*3]+=pv[i*3]*dt;pPos[i*3+1]+=pv[i*3+1]*dt;pPos[i*3+2]+=pv[i*3+2]*dt;if(pl[i]<=0)pPos[i*3+1]=-999}pGeo.attributes.position.needsUpdate=true;pGeo.attributes.color.needsUpdate=true}
};
for(let i=0;i<NP;i++)pPos[i*3+1]=-999;
const slashes=[];
function slashFx(x,y,z,yaw,range,half,col){
  const geo=new THREE.RingGeometry(range*.45,range,20,1,-half,half*2);
  const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.7,side:THREE.DoubleSide,depthWrite:false}));
  m.rotation.x=-Math.PI/2;const g=new THREE.Group();g.add(m);g.position.set(x,y,z);g.rotation.y=yaw-Math.PI/2;scene.add(g);slashes.push({g,m,t:.18});
}
function updateSlashes(dt){for(let i=slashes.length-1;i>=0;i--){const s=slashes[i];s.t-=dt;s.m.material.opacity=Math.max(0,s.t/.18)*.7;if(s.t<=0){scene.remove(s.g);s.m.geometry.dispose();s.m.material.dispose();slashes.splice(i,1)}}}
