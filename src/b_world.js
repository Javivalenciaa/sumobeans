/* ================= Three.js setup ================= */
const canvas=$('gl');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(1);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x8fcdfc);
scene.fog=new THREE.Fog(0x9fd4fb,70,190);
const camera=new THREE.PerspectiveCamera(62,1,0.1,400);
scene.add(new THREE.HemisphereLight(0xe2f2ff,0x62904c,0.55));
const sun=new THREE.DirectionalLight(0xfff0cf,0.8);
sun.position.set(30,50,20);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
{const sc=sun.shadow.camera;sc.left=-30;sc.right=30;sc.top=30;sc.bottom=-30;sc.near=1;sc.far=150;sun.shadow.bias=-0.0006}
scene.add(sun);scene.add(sun.target);
function resize(){
  const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
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

/* ================= World definition ================= */
const WALK=[
 {x0:-50,x1:-30,z0:-15,z1:15,t:0.5},{x0:30,x1:50,z0:-15,z1:15,t:0.5},
 {x0:-18,x1:18,z0:-20,z1:20,t:0},
 {x0:-30,x1:-18,z0:-3,z1:3,t:0.15},{x0:18,x1:30,z0:-3,z1:3,t:0.15},
 {x0:-30,x1:-18,z0:-17,z1:-13,t:0.15},{x0:18,x1:30,z0:-17,z1:-13,t:0.15},
 {x0:-30,x1:-18,z0:13,z1:17,t:0.15},{x0:18,x1:30,z0:13,z1:17,t:0.15},
 {x0:-2.4,x1:2.4,z0:-2.4,z1:2.4,t:0.45}
];
const SOLIDS=[];
function solid(cx,cz,w,d,top,kind){const s={x0:cx-w/2,x1:cx+w/2,z0:cz-d/2,z1:cz+d/2,top,kind};SOLIDS.push(s);return s}
const FLAGSTAND=[{x:-43,z:0},{x:43,z:0}];
const SPAWN=[{x:-39,z:0},{x:39,z:0}];
const COINSPOTS=[[-10,-12],[10,12],[-10,12],[10,-12],[-14,0],[14,0],[0,-12],[0,12],[-7,-7],[7,7],[-7,7],[7,-7],
 [-24,0],[24,0],[-24,-15],[24,-15],[-24,15],[24,15],[-36,-9],[-36,9],[36,-9],[36,9],[-40,-12],[40,12]];
const CHEST={x:0,z:0};
function baseGround(x,z){let h=-Infinity;for(const r of WALK){if(x>=r.x0&&x<=r.x1&&z>=r.z0&&z<=r.z1&&r.t>h)h=r.t}return h}

const world=new THREE.Group();scene.add(world);
const flagsGfx=[];let chestGfx=null,waterTex=null,cloudsG=null;
const coinGfx=[];

function buildWorld(){
  // islands
  for(const r of WALK){
    const w=r.x1-r.x0,d=r.z1-r.z0,isBridge=(w<14&&d<8&&r.t<0.2),isChest=(w<6);
    if(isBridge){
      const n=Math.round(w/0.9);
      for(let i=0;i<n;i++)bx(w/n-0.05,0.14,d,i%2?0x9a6a3a:0xa9763f,r.x0+(i+.5)*w/n,r.t-.07,(r.z0+r.z1)/2,world);
      for(const zz of[r.z0+.1,r.z1-.1]){
        bx(w,0.08,0.14,0x6b4423,(r.x0+r.x1)/2,r.t+.85,zz,world);
        for(let i=0;i<=Math.floor(w/3);i++)bx(.22,.95,.22,0x7a5230,r.x0+.2+i*(w-.4)/Math.floor(w/3),r.t+.42,zz,world);
        solid((r.x0+r.x1)/2,zz,w,.28,r.t+.95,'rail');
      }
      bx(w,1.2,.5,0x6b4423,(r.x0+r.x1)/2,r.t-.8,(r.z0+r.z1)/2,world);
      continue;
    }
    const cx=(r.x0+r.x1)/2,cz=(r.z0+r.z1)/2;
    if(isChest){ // stone steps around chest
      bx(w,.45,d,0xcfc7ad,cx,r.t-.225,cz,world);bx(w*.7,.5,d*.7,0xe8dfc4,cx,r.t-.2,cz,world);continue;
    }
    const base=r.t>0.3,left=cx<0;
    bx(w,4,d,base?(left?0x3a4f86:0x86403a):0x7a5a38,cx,r.t-2,cz,world);
    const top=bx(w,0.3,d,base?(left?0x7f9fe0:0xe09a8f):0x6cc04a,cx,r.t-.15,cz,world);top.receiveShadow=true;
    if(!base){bx(w+.6,.5,d+.6,0x5aa83c,cx,r.t-.55,cz,world)}
    // checker tiles on bases
    if(base){for(let i=0;i<w/2;i++)for(let j=0;j<d/2;j++){if((i+j)%2===0)bx(2,.04,2,left?0x8aa8e8:0xeaa89d,r.x0+1+i*2,r.t+.01,r.z0+1+j*2,world).castShadow=false}}
  }
  // base circles
  for(let t=0;t<2;t++){const f=FLAGSTAND[t],col=t?0xe04a42:0x3d7bff;
    const d1=cy(4.4,4.4,.06,col,f.x,.54,f.z,world,40);d1.castShadow=false;
    const d2=cy(3.4,3.4,.08,t?0xffb0a8:0xa8c8ff,f.x,.55,f.z,world,40);d2.castShadow=false;
  }
  // buildings (solid)
  const bld=[[-47,-10.5,7,5,4.2,0x3d7bff],[-47,10.5,7,5,4.2,0x3d7bff]];
  for(const b of bld){for(const sgn of[1,-1]){
    const x=b[0]*sgn,z=b[1],col=sgn<0?b[5]:0xe04a42,rc=sgn<0?0x1f4fb0:0x9c2424;
    const g=new THREE.Group();g.position.set(x,.5,z);
    bx(b[2],b[4],b[3],0xc9a56a,0,b[4]/2,0,g);
    bx(b[2]+.8,.5,b[3]+.8,rc,0,b[4]+.25,0,g);
    const rf=shadowed(new THREE.Mesh(new THREE.ConeGeometry(b[2]*.78,2.2,4),M(col)));rf.position.y=b[4]+1.5;rf.rotation.y=Math.PI/4;g.add(rf);
    bx(1.3,2,.2,0x5a3a24,0,1,sgn<0?b[3]/2+.05:b[3]/2+.05,g);
    bx(1.6,1.1,.2,0xffe9a0,sgn<0?-2:2,2.5,b[3]/2+.05,g);
    world.add(g);solid(x,z,b[2],b[3],.5+b[4],'bld');
  }}
  // crates (climbable)
  const crates=[[-9,-9,1.8,1.2],[9,9,1.8,1.2],[-9,9,1.8,1.2],[9,-9,1.8,1.2],[-12,3,1.4,.9],[12,-3,1.4,.9],[-36,-6.5,1.6,1.1],[-36,6.5,1.6,1.1],[36,-6.5,1.6,1.1],[36,6.5,1.6,1.1],[-6,13,1.6,1.1],[6,-13,1.6,1.1]];
  for(const c of crates){const gh=baseGround(c[0],c[1]);const left=c[0]<-30,right=c[0]>30;
    const col=left?0x4b8bff:right?0xff6a60:0xc88a3e;
    const m=bx(c[2],c[3],c[2],col,c[0],gh+c[3]/2,c[1],world);
    bx(c[2]+.06,.14,c[2]+.06,0x6b4423,c[0],gh+c[3]-.07,c[1],world);
    bx(c[2]+.06,.14,c[2]+.06,0x6b4423,c[0],gh+.07,c[1],world);
    solid(c[0],c[1],c[2],c[2],gh+c[3],'crate');
  }
  // ruins pillars around chest
  for(const sx of[-1,1])for(const sz of[-1,1]){
    const x=sx*4.2,z=sz*4.2,g=new THREE.Group();g.position.set(x,0,z);
    cy(.75,.85,5.4,0xcfc7ad,0,2.7,0,g,10);cy(1.05,1.05,.4,0xb8ae92,0,.2,0,g,10);cy(1.0,1.0,.35,0xb8ae92,0,5.55,0,g,10);
    sp(.5,0x6fae4a,.6,5.8,0,g);world.add(g);solid(x,z,1.5,1.5,5.7,'pillar');
  }
  bx(10.4,.7,1.4,0xcfc7ad,0,5.9,4.2,world);bx(10.4,.7,1.4,0xcfc7ad,0,5.9,-4.2,world);
  // chest
  chestGfx=new THREE.Group();chestGfx.position.set(0,.45,0);
  bx(1.3,.7,.9,0x8a4a1c,0,.35,0,chestGfx);bx(1.34,.12,.94,0xffc400,0,.7,0,chestGfx);bx(.2,.3,.1,0xffc400,0,.55,.48,chestGfx);
  const lid=shadowed(new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,1.3,12,1,false,0,Math.PI),M(0x9a5a28)));lid.rotation.z=Math.PI/2;lid.rotation.y=Math.PI/2;lid.position.y=.72;lid.scale.set(1,1,.9);chestGfx.add(lid);
  const glow=new THREE.PointLight(0xffd870,1.2,12);glow.position.set(0,2.4,0);chestGfx.add(glow);chestGfx.userData.glow=glow;
  const itm=shadowed(new THREE.Mesh(new THREE.OctahedronGeometry(.4),new THREE.MeshBasicMaterial({color:0xffe45a})));itm.position.y=1.9;chestGfx.add(itm);chestGfx.userData.item=itm;
  world.add(chestGfx);
  // flags
  for(let t=0;t<2;t++){
    const f=FLAGSTAND[t],g=new THREE.Group();
    cy(.1,.12,3.6,0xe8e8e8,0,1.8,0,g,8);sp(.2,0xffd23f,0,3.7,0,g);
    const geo=new THREE.PlaneGeometry(1.7,1.05,10,4);geo.translate(.85,0,0);
    const cloth=shadowed(new THREE.Mesh(geo,new THREE.MeshToonMaterial({color:t?0xe03a3a:0x2f7bff,gradientMap:gm,side:THREE.DoubleSide})));cloth.position.set(.05,3.0,0);cloth.castShadow=true;g.add(cloth);
    const orig=geo.attributes.position.array.slice();
    g.position.set(f.x,.5,f.z);scene.add(g);
    flagsGfx.push({g,cloth,orig});
  }
  // coins
  const cg=new THREE.CylinderGeometry(.34,.34,.07,16);cg.rotateX(Math.PI/2);
  for(const c of COINSPOTS){const m=new THREE.Mesh(cg,new THREE.MeshBasicMaterial({color:0xffd23f}));m.position.set(c[0],baseGround(c[0],c[1])+.9,c[1]);scene.add(m);coinGfx.push(m)}
  // water
  const cvw=document.createElement('canvas');cvw.width=cvw.height=128;const wc=cvw.getContext('2d');
  wc.fillStyle='#2f9be0';wc.fillRect(0,0,128,128);
  for(let i=0;i<40;i++){wc.fillStyle=`rgba(255,255,255,${.08+Math.random()*.12})`;const x=Math.random()*128,y=Math.random()*128;wc.beginPath();wc.ellipse(x,y,6+Math.random()*10,2+Math.random()*2,0,0,TAU);wc.fill()}
  waterTex=new THREE.CanvasTexture(cvw);waterTex.wrapS=waterTex.wrapT=THREE.RepeatWrapping;waterTex.repeat.set(60,60);
  const water=new THREE.Mesh(new THREE.PlaneGeometry(500,500),new THREE.MeshBasicMaterial({map:waterTex}));water.rotation.x=-Math.PI/2;water.position.y=-.9;scene.add(water);
  // instanced trees / rocks / bushes
  const treesAt=[];
  const sidesT=[[-47,-14],[-47,14],[-33,-14],[-33,14],[-20,-19],[-20,19],[-8,-19],[-8,19],[-15,-14],[-15,14]];
  for(const p of sidesT){treesAt.push({x:p[0],z:p[1],s:.9+Math.random()*.4});treesAt.push({x:-p[0],z:p[1],s:.9+Math.random()*.4})}
  const mk=(geo,col,n)=>{const m=new THREE.InstancedMesh(geo,M(col),n);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m};
  const iT=mk(new THREE.CylinderGeometry(.25,.35,1.6,6),0x7a5230,treesAt.length);
  const iC1=mk(new THREE.ConeGeometry(1.5,2.6,7),0x3f9a3a,treesAt.length);
  const iC2=mk(new THREE.ConeGeometry(1.1,2.2,7),0x4fb04a,treesAt.length);
  const mt=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(),ps=new THREE.Vector3();
  treesAt.forEach((t,i)=>{const gh=baseGround(t.x,t.z);if(gh===-Infinity)return;
    const put=(im,y,s)=>{ps.set(t.x,gh+y*t.s,t.z);sc.set(t.s*s,t.s*s,t.s*s);mt.compose(ps,q,sc);im.setMatrixAt(i,mt)};
    put(iT,.8,1);put(iC1,2.5,1);put(iC2,4.0,1);solid(t.x,t.z,.9,.9,gh+6,'tree');
  });
  // rocks & bushes
  const rocksAt=[[-6,12.5,1.6],[6,-12.5,1.6],[-16,-18,1.2],[16,18,1.2],[-34,13,1.3],[34,-13,1.3],[-22,-11,1],[22,11,1]];
  const iR=mk(new THREE.DodecahedronGeometry(1,0),0x9aa0a8,rocksAt.length);
  rocksAt.forEach((r,i)=>{const gh=baseGround(r[0],r[1]);ps.set(r[0],gh+r[2]*.45,r[1]);sc.set(r[2],r[2]*.7,r[2]);q.setFromEuler(new THREE.Euler(0,Math.random()*3,0));mt.compose(ps,q,sc);iR.setMatrixAt(i,mt);solid(r[0],r[1],r[2]*1.6,r[2]*1.6,gh+r[2]*.9,'rock')});
  q.identity();
  const bushAt=[];for(let i=0;i<46;i++){const r=WALK[(Math.random()*3)|0],x=rand(r.x0+1,r.x1-1),z=rand(r.z0+1,r.z1-1);if(Math.hypot(x,z)<7&&Math.abs(x)<8)continue;if(Math.abs(Math.abs(x)-43)<5&&Math.abs(z)<5)continue;bushAt.push([x,z,rand(.5,1)])}
  const iB=mk(new THREE.IcosahedronGeometry(1,0),0x58b84c,bushAt.length);
  bushAt.forEach((b,i)=>{const gh=baseGround(b[0],b[1]);ps.set(b[0],gh+b[2]*.5,b[1]);sc.set(b[2],b[2]*.7,b[2]);mt.compose(ps,q,sc);iB.setMatrixAt(i,mt)});
  // distant mountains
  const mm=mk(new THREE.ConeGeometry(1,1,6),0x7f9fc8,18);mm.castShadow=false;mm.receiveShadow=false;
  for(let i=0;i<18;i++){const a=i/18*TAU,r=105+Math.random()*30,h=18+Math.random()*26,w=16+Math.random()*12;ps.set(Math.cos(a)*r,h/2-6,Math.sin(a)*r);sc.set(w,h,w);mt.compose(ps,q,sc);mm.setMatrixAt(i,mt)}
  // clouds
  cloudsG=new THREE.Group();
  for(let i=0;i<16;i++){const c=new THREE.Group(),cm=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.92});
    for(let j=0;j<4;j++){const s=new THREE.Mesh(new THREE.SphereGeometry(4+Math.random()*3,10,8),cm);s.position.set(j*5-8,Math.random()*2,Math.random()*3);s.scale.y=.6;c.add(s)}
    c.position.set(rand(-160,160),rand(38,60),rand(-160,160));cloudsG.add(c)}
  scene.add(cloudsG);
}

/* ================= Characters ================= */
const TEAMC=[{hood:0x2f6fe0,tunic:0x4b8bff,css:'#5aa0ff'},{hood:0xd63a3a,tunic:0xff5a52,css:'#ff6a62'}];
function buildWeapon(kind){
  const g=new THREE.Group();
  if(kind==='sword'){
    const bl=bx(.1,.95,.04,0xe8eef5,0,.62,0,g);bx(.05,.95,.05,0xbfc9d6,0,.62,0,g);
    bx(.4,.08,.1,0xffc400,0,.14,0,g);cy(.05,.05,.3,0x6b4423,0,0,0,g,6);sp(.07,0xffc400,0,-.17,0,g);
    const tip=shadowed(new THREE.Mesh(new THREE.ConeGeometry(.07,.2,4),M(0xe8eef5)));tip.position.y=1.18;g.add(tip);
  }else if(kind==='spear'){
    cy(.045,.045,2.4,0x8a5a2b,0,.5,0,g,6);
    const t=shadowed(new THREE.Mesh(new THREE.ConeGeometry(.12,.5,6),M(0xdfe6ee)));t.position.y=1.95;g.add(t);
    cy(.08,.08,.1,0xffc400,0,1.68,0,g,8);
  }else{ // xbow
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
  else if(id==='hat_prop'){cy(.03,.03,.2,0x555,0,.1,0,g,6);const b=new THREE.Group();b.position.y=.22;bx(.7,.03,.12,0xff5a52,0,0,0,b);bx(.12,.03,.7,0x4b8bff,0,0,0,b);g.add(b);g.userData.spin=b}
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
  const tag=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(tagTexture(name,3,team)),transparent:true,depthTest:false}));tag.scale.set(2.5,.7,1);tag.position.y=2.2;tag.renderOrder=10;root.add(tag);P.tag=tag;
  root.traverse(o=>{if(o.isMesh&&o.material!==OUTM&&o.material.map===undefined){o.castShadow=true}});
  return{root,body,P,wk:null};
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
function setTag(gfx,name,hp,team){const t=gfx.P.tag.material.map;t.image=tagTexture(name,hp,team);t.needsUpdate=true}

/* ================= FX: particles, slashes ================= */
const NP=700;
const pGeo=new THREE.BufferGeometry(),pPos=new Float32Array(NP*3),pCol=new Float32Array(NP*3);
pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));pGeo.setAttribute('color',new THREE.BufferAttribute(pCol,3));
const dotC=document.createElement('canvas');dotC.width=dotC.height=32;{const x=dotC.getContext('2d'),g=x.createRadialGradient(16,16,2,16,16,15);g.addColorStop(0,'#fff');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,32,32)}
const pPts=new THREE.Points(pGeo,new THREE.PointsMaterial({size:.5,vertexColors:true,map:new THREE.CanvasTexture(dotC),transparent:true,depthWrite:false,sizeAttenuation:true}));
pPts.frustumCulled=false;scene.add(pPts);
const pv=new Float32Array(NP*3),pl=new Float32Array(NP),pm=new Float32Array(NP),pg=new Float32Array(NP);let pHead=0;
const _c=new THREE.Color();
const fx={
  p(x,y,z,vx,vy,vz,life,col,g){const i=pHead;pHead=(pHead+1)%NP;pPos[i*3]=x;pPos[i*3+1]=y;pPos[i*3+2]=z;pv[i*3]=vx;pv[i*3+1]=vy;pv[i*3+2]=vz;pl[i]=life;pm[i]=life;pg[i]=g||0;_c.set(col);pCol[i*3]=_c.r;pCol[i*3+1]=_c.g;pCol[i*3+2]=_c.b},
  burst(x,y,z,n,col,spd,life,g){for(let i=0;i<n;i++){const a=Math.random()*TAU,u=Math.random()*2-1,s=spd*(.4+Math.random()*.6),r=Math.sqrt(1-u*u);fx.p(x,y,z,Math.cos(a)*r*s,u*s*.8+spd*.3,Math.sin(a)*r*s,life*(.6+Math.random()*.6),col,g===undefined?14:g)}},
  update(dt){for(let i=0;i<NP;i++){if(pl[i]<=0){pPos[i*3+1]=-999;continue}pl[i]-=dt;pv[i*3+1]-=pg[i]*dt;pPos[i*3]+=pv[i*3]*dt;pPos[i*3+1]+=pv[i*3+1]*dt;pPos[i*3+2]+=pv[i*3+2]*dt;if(pl[i]<=0)pPos[i*3+1]=-999}pGeo.attributes.position.needsUpdate=true;pGeo.attributes.color.needsUpdate=true}
};
for(let i=0;i<NP;i++)pPos[i*3+1]=-999;
const slashes=[];
function slashFx(x,y,z,yaw,range,half,col){
  const geo=new THREE.RingGeometry(range*.45,range,20,1,-half,half*2);
  const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.75,side:THREE.DoubleSide,depthWrite:false}));
  m.rotation.x=-Math.PI/2;const g=new THREE.Group();g.add(m);g.position.set(x,y,z);g.rotation.y=yaw-Math.PI/2;scene.add(g);slashes.push({g,m,t:.18});
}
function updateSlashes(dt){for(let i=slashes.length-1;i>=0;i--){const s=slashes[i];s.t-=dt;s.m.material.opacity=Math.max(0,s.t/.18)*.75;if(s.t<=0){scene.remove(s.g);s.m.geometry.dispose();s.m.material.dispose();slashes.splice(i,1)}}}
