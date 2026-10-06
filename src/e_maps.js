/* ================= Maps ================= */
const MAP={id:'',walk:[],solids:[],zones:[],pads:[],flag:[{x:-43,z:0},{x:43,z:0}],spawn:[[],[]],coins:[],chest:{x:0,z:0},grp:null,anims:[],killY:-4,bounds:{x0:-52,x1:52,z0:-26,z1:26},nav:null,sunDir:[30,50,20],snow:null,chestGfx:null,coinGfx:[],flagsGfx:[],waterTex:null,clouds:null};
function baseGround(x,z){let h=-Infinity;const W=MAP.walk;for(let i=0;i<W.length;i++){const r=W[i];if(x>=r.x0&&x<=r.x1&&z>=r.z0&&z<=r.z1&&r.t>h)h=r.t}return h}
function addWalk(x0,x1,z0,z1,t){MAP.walk.push({x0,x1,z0,z1,t})}
function addSolid(cx,cz,w,d,top,kind){const s={x0:cx-w/2,x1:cx+w/2,z0:cz-d/2,z1:cz+d/2,top,kind};MAP.solids.push(s);return s}
const DECAL={polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2};
// walkable slab: top plate + body (never coplanar with each other)
function slab(B,x0,x1,z0,z1,t,top,side,depth){
  addWalk(x0,x1,z0,z1,t);const cx=(x0+x1)/2,cz=(z0+z1)/2,w=x1-x0,d=z1-z0;
  B.slab(cx,cz,w,d,t-.32,t,top);B.slab(cx,cz,w-.06,d-.06,t-(depth||4),t-.33,side);
}
function stairs(B,cx,cz,dx,dz,half,T,sh,sd,width,col){
  const n=Math.round(T/sh)-1;
  for(let i=1;i<=n;i++){
    const t=T-i*sh,a=half+(i-1)*sd,b=half+i*sd;
    let x0,x1,z0,z1;
    if(dx){x0=cx+Math.min(dx*a,dx*b);x1=cx+Math.max(dx*a,dx*b);z0=cz-width/2;z1=cz+width/2}
    else{z0=cz+Math.min(dz*a,dz*b);z1=cz+Math.max(dz*a,dz*b);x0=cx-width/2;x1=cx+width/2}
    addWalk(x0,x1,z0,z1,t);B.slab((x0+x1)/2,(z0+z1)/2,x1-x0,z1-z0,-.1,t,col);
  }
}
// team-mirrored builder: fn(sg) with sg=-1 (blue / left) and +1 (red / right)
function both(fn){fn(-1);fn(1)}
const tc2=(sg,b,r)=>sg<0?b:r;
function crate(B,x,z,s,h,col,trim){const g=baseGround(x,z);B.box(x,g+h/2,z,s,h,s,col);B.box(x,g+.07,z,s+.07,.14,s+.07,trim||0x6b4423);B.box(x,g+h-.07,z,s+.07,.14,s+.07,trim||0x6b4423);addSolid(x,z,s,s,g+h,'crate')}
function flagStandDecal(B,t){
  const f=MAP.flag[t],g=baseGround(f.x,f.z);
  B.add('cyl',t?0xe04a42:0x3d7bff,f.x,g+.02,f.z,4.4,.04,4.4,0,DECAL);
  B.add('cyl',t?0xffb0a8:0xa8c8ff,f.x,g+.05,f.z,3.3,.04,3.3,0,DECAL);
  B.add('cyl',t?0xe04a42:0x3d7bff,f.x,g+.08,f.z,1.0,.04,1.0,0,DECAL);
}
function setTheme(o){
  scene.fog.color.setHex(o.fog);scene.fog.near=o.fn;scene.fog.far=o.ff;scene.background.setHex(o.fog);
  skyMat.uniforms.top.value.setHex(o.top);skyMat.uniforms.mid.value.setHex(o.mid);skyMat.uniforms.bot.value.setHex(o.bot);
  hemi.color.setHex(o.hs);hemi.groundColor.setHex(o.hg);hemi.intensity=o.hi;sun.color.setHex(o.sc);sun.intensity=o.si;MAP.sunDir=o.sd;
}
function pad(B,G,x,z,tx,tz,ty,r){
  r=r||1.5;MAP.pads.push({x,z,r,tx,tz,ty,T:1.15});
  const g=baseGround(x,z);
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.12,24),new THREE.MeshBasicMaterial({color:0x2fe0ff}));disc.position.set(x,g+.07,z);G.add(disc);
  const ring=new THREE.Mesh(new THREE.RingGeometry(r*.55,r*.75,24),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.set(x,g+.16,z);G.add(ring);
  const arr=new THREE.Mesh(new THREE.ConeGeometry(r*.35,r*.7,3),new THREE.MeshBasicMaterial({color:0xffffff}));arr.rotation.x=-Math.PI/2;arr.rotation.z=0;arr.position.set(x,g+.2,z);
  const ang=Math.atan2(tx-x,tz-z);arr.rotation.set(-Math.PI/2,0,0);const hold=new THREE.Group();hold.position.set(x,g+.2,z);hold.rotation.y=ang+Math.PI;hold.add(arr);arr.position.set(0,0,0);G.add(hold);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(r*.5,r*.7,6,16,1,true),new THREE.MeshBasicMaterial({color:0x7fefff,transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false}));beam.position.set(x,g+3,z);G.add(beam);
  MAP.anims.push((dt,tm)=>{const k=(tm*1.6)%1;ring.scale.setScalar(1+k*.5);ring.material.opacity=.9*(1-k);beam.material.opacity=.16+.08*Math.sin(tm*4)});
}
function makeChestGfx(G,x,y,z){
  const c=new THREE.Group();c.position.set(x,y,z);
  bx(1.3,.7,.9,0x8a4a1c,0,.35,0,c);bx(1.34,.12,.94,0xffc400,0,.7,0,c);bx(.2,.3,.1,0xffc400,0,.55,.48,c);
  const lid=shadowed(new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,1.3,12,1,false,0,Math.PI),M(0x9a5a28)));lid.rotation.z=Math.PI/2;lid.rotation.y=Math.PI/2;lid.position.y=.72;lid.scale.set(1,1,.9);c.add(lid);
  const glow=new THREE.PointLight(0xffd870,1.0,12);glow.position.set(0,2.4,0);c.add(glow);c.userData.glow=glow;
  const itm=new THREE.Mesh(new THREE.OctahedronGeometry(.4),new THREE.MeshBasicMaterial({color:0xffe45a}));itm.position.y=1.9;c.add(itm);c.userData.item=itm;
  G.add(c);return c;
}
function makeFlagGfx(G){
  const out=[];
  for(let t=0;t<2;t++){
    const g=new THREE.Group();
    cy(.1,.12,3.6,0xe8e8e8,0,1.8,0,g,8);sp(.2,0xffd23f,0,3.7,0,g);
    const geo=new THREE.PlaneGeometry(1.7,1.05,10,4);geo.translate(.85,0,0);
    const cloth=new THREE.Mesh(geo,new THREE.MeshToonMaterial({color:t?0xe03a3a:0x2f7bff,gradientMap:gm,side:THREE.DoubleSide}));cloth.position.set(.05,3.0,0);cloth.castShadow=true;g.add(cloth);
    const orig=geo.attributes.position.array.slice();
    G.add(g);out.push({g,cloth,orig});
  }
  return out;
}
function makeWaterPlane(G,y,base,kind){
  const cvw=document.createElement('canvas');cvw.width=cvw.height=128;const wc=cvw.getContext('2d');
  wc.fillStyle=base;wc.fillRect(0,0,128,128);
  for(let i=0;i<40;i++){wc.fillStyle=`rgba(255,255,255,${.06+Math.random()*(kind==='cloud'?.3:.12)})`;const x=Math.random()*128,yy=Math.random()*128;wc.beginPath();wc.ellipse(x,yy,(kind==='cloud'?10:6)+Math.random()*10,2+Math.random()*(kind==='cloud'?6:2),0,0,TAU);wc.fill()}
  const tx=new THREE.CanvasTexture(cvw);tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.repeat.set(kind==='cloud'?24:60,kind==='cloud'?24:60);
  const w=new THREE.Mesh(new THREE.PlaneGeometry(600,600),new THREE.MeshBasicMaterial({map:tx}));w.rotation.x=-Math.PI/2;w.position.y=y;G.add(w);MAP.waterTex=tx;return w;
}
function cloudPuffs(G,n,y0,y1,rad){
  const cl=new THREE.Group(),cm=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.92,fog:false});
  for(let i=0;i<n;i++){const c=new THREE.Group();for(let j=0;j<4;j++){const s=new THREE.Mesh(UG.sph,cm);const r=4+Math.random()*3;s.scale.set(r,r*.6,r);s.position.set(j*5-8,Math.random()*2,Math.random()*3);c.add(s)}
    const a=Math.random()*TAU,d=rand(rad*.3,rad);c.position.set(Math.cos(a)*d,rand(y0,y1),Math.sin(a)*d);cl.add(c)}
  G.add(cl);MAP.clouds=cl;
}

/* ---------------- map 1: Dawn Bridges ---------------- */
function mapBridges(B,G){
  setTheme({fog:0xa8d8ff,fn:80,ff:220,top:0x3f9bff,mid:0xbfe8ff,bot:0xe8f6ff,hs:0xe2f2ff,hg:0x62904c,hi:.6,sc:0xfff0cf,si:.85,sd:[30,50,20]});
  MAP.bounds={x0:-52,x1:52,z0:-22,z1:22};MAP.killY=-4;
  both(sg=>{const x0=sg<0?-50:30,x1=sg<0?-30:50;slab(B,x0,x1,-15,15,.5,tc2(sg,0x7f9fe0,0xe09a8f),tc2(sg,0x3a4f86,0x86403a))});
  slab(B,-18,18,-20,20,0,0x6cc04a,0x7a5a38,4);B.slab(0,0,36.6,40.6,-.9,-.34,0x5aa83c); // rim under plate
  // base checker decals
  both(sg=>{for(let i=0;i<10;i++)for(let j=0;j<15;j++)if((i+j)%2===0)B.add('box',tc2(sg,0x8aa8e8,0xeaa89d),(sg<0?-49:31)+i*2,.5+.015,-14+j*2,2,.02,2,0,DECAL)});
  flagStandDecal(B,0);flagStandDecal(B,1);
  // bridges
  const bridge=(x0,x1,z0,z1)=>{
    addWalk(x0,x1,z0,z1,.15);const w=x1-x0,n=Math.round(w/.9),cx=(x0+x1)/2,cz=(z0+z1)/2;
    for(let i=0;i<n;i++)B.slab(x0+(i+.5)*w/n,cz,w/n-.05,z1-z0,.0,.15,i%2?0x9a6a3a:0xa9763f);
    B.slab(cx,cz,w,.5,-1.4,-.02,0x6b4423);
    for(const zz of[z0+.12,z1-.12]){B.slab(cx,zz,w,.14,.95,1.05,0x6b4423);const k=Math.floor(w/3);for(let i=0;i<=k;i++)B.slab(x0+.2+i*(w-.4)/k,zz,.22,.22,.15,1.0,0x7a5230);addSolid(cx,zz,w,.3,1.05,'rail')}
  };
  both(sg=>{const a=sg<0?-30:18,b=sg<0?-18:30;bridge(a,b,-3,3);bridge(a,b,-17,-13);bridge(a,b,13,17)});
  // chest ruins
  addWalk(-2.4,2.4,-2.4,2.4,.45);B.slab(0,0,4.8,4.8,-.1,.45,0xcfc7ad);B.slab(0,0,3.4,3.4,.44,.5,0xe8dfc4);
  for(const sx of[-1,1])for(const sz of[-1,1]){const x=sx*4.2,z=sz*4.2;B.cyl(x,.0,z,.8,5.4,0xcfc7ad);B.cyl(x,0,z,1.05,.4,0xb8ae92);B.cyl(x,5.4,z,1.0,.35,0xb8ae92);B.add('sph',0x6fae4a,x+.6,5.9,z,.5,.5,.5);addSolid(x,z,1.5,1.5,5.75,'pillar')}
  B.slab(0,4.2,10.4,1.4,5.5,6.2,0xcfc7ad);B.slab(0,-4.2,10.4,1.4,5.5,6.2,0xcfc7ad);
  // buildings
  both(sg=>{for(const zz of[-10.5,10.5]){
    const x=sg*47,col=tc2(sg,0x3d7bff,0xe04a42),rc=tc2(sg,0x1f4fb0,0x9c2424);
    B.slab(x,zz,7,5,.5,4.7,0xc9a56a);B.slab(x,zz,7.8,5.8,4.7,5.2,rc);B.add('cone4',col,x,6.4,zz,5.4,2.4,5.4,Math.PI/4);
    B.slab(x-sg*0,zz+2.6,1.3,.1,.5,2.5,0x5a3a24);B.slab(x+2*sg*-1,zz+2.6,1.6,.1,1.8,2.9,0xffe9a0);
    addSolid(x,zz,7,5,4.7,'bld')}});
  // crates
  for(const c of [[-9,-9,1.8,1.2],[9,9,1.8,1.2],[-9,9,1.8,1.2],[9,-9,1.8,1.2],[-12,3,1.4,.9],[12,-3,1.4,.9],[-36,-6.5,1.6,1.1],[-36,6.5,1.6,1.1],[36,-6.5,1.6,1.1],[36,6.5,1.6,1.1],[-6,13,1.6,1.1],[6,-13,1.6,1.1]]){
    crate(B,c[0],c[1],c[2],c[3],c[0]<-30?0x4b8bff:c[0]>30?0xff6a60:0xc88a3e);
  }
  // trees (solid trunks), rocks, bushes
  const trees=[[-47,-14],[-47,14],[-33,-14],[-33,14],[-20,-19],[-20,19],[-8,-19],[-8,19],[-15,-14],[-15,14]];
  for(const p of trees)for(const sg of[1,-1]){const x=p[0]*sg,z=p[1],g=baseGround(x,z),s=.9+Math.random()*.4;
    B.cyl(x,g,z,.3*s,1.6*s,0x7a5230);B.cone(x,g+1.4*s,z,1.5*s,2.6*s,0x3f9a3a);B.cone(x,g+3.0*s,z,1.1*s,2.2*s,0x4fb04a);addSolid(x,z,.9,.9,g+6,'tree')}
  for(const r of[[-6,12.5,1.6],[6,-12.5,1.6],[-16,-18,1.2],[16,18,1.2],[-34,13,1.3],[34,-13,1.3],[-22,-11,1],[22,11,1]]){const g=baseGround(r[0],r[1]);B.add('dod',0x9aa0a8,r[0],g+r[2]*.45,r[1],r[2],r[2]*.7,r[2],Math.random()*3);addSolid(r[0],r[1],r[2]*1.6,r[2]*1.6,g+r[2]*.9,'rock')}
  for(let i=0;i<46;i++){const r=MAP.walk[(Math.random()*3)|0],x=rand(r.x0+1,r.x1-1),z=rand(r.z0+1,r.z1-1);if(Math.abs(x)<8&&Math.abs(z)<8)continue;if(Math.abs(Math.abs(x)-43)<5&&Math.abs(z)<5)continue;if(Math.abs(Math.abs(x)-39)<2&&Math.abs(z)<5)continue;const s=rand(.5,1),g=baseGround(x,z);B.add('ico',0x58b84c,x,g+s*.5,z,s,s*.7,s)}
  // mountains
  for(let i=0;i<18;i++){const a=i/18*TAU,r=105+Math.random()*30,h=18+Math.random()*26,w=16+Math.random()*12;B.add('cone',0x7f9fc8,Math.cos(a)*r,h/2-6,Math.sin(a)*r,w,h,w,0)}
  makeWaterPlane(G,-.9,'#2f9be0','water');cloudPuffs(G,14,38,60,160);
  MAP.spawn=[[[-40,-2.6],[-40,0],[-40,2.6]],[[40,-2.6],[40,0],[40,2.6]]];
  MAP.flag=[{x:-43,z:0},{x:43,z:0}];MAP.chest={x:0,z:0};
  MAP.coins=[[-10,-12],[10,12],[-10,12],[10,-12],[-14,0],[14,0],[0,-12],[0,12],[-7,-7],[7,7],[-7,7],[7,-7],[-24,0],[24,0],[-24,-15],[24,-15],[-24,15],[24,15],[-36,-9],[-36,9],[36,-9],[36,9],[-40,-12],[40,12]];
}

/* ---------------- map 2: Toy Factory ---------------- */
function brickWall(B,x,z,w,d,h,col){
  const g=Math.max(0,baseGround(x,z));B.slab(x,z,w,d,g,g+h,col);
  const nx=Math.max(1,Math.round(w/1.6)),nz=Math.max(1,Math.round(d/1.6));
  for(let i=0;i<nx;i++)for(let j=0;j<nz;j++)B.add('cyl',col,x-w/2+(i+.5)*w/nx,g+h+.1,z-d/2+(j+.5)*d/nz,.42,.2,.42,0);
  addSolid(x,z,w,d,g+h,'brick');
}
function gearMesh(G,x,y,z,r,col,speed,axisZ){
  const g=new THREE.Group();
  const cyl=new THREE.CylinderGeometry(r,r,.6,20);cyl.rotateX(Math.PI/2);
  const m=new THREE.Mesh(cyl,M(col));g.add(m);
  for(let i=0;i<10;i++){const a=i/10*TAU,t=new THREE.Mesh(UG.box,M(col));t.scale.set(r*.38,r*.38,.6);t.position.set(Math.cos(a)*r*1.02,Math.sin(a)*r*1.02,0);t.rotation.z=a;g.add(t)}
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(r*.25,r*.25,.9,12).rotateX(Math.PI/2),M(0x333b4a));g.add(hub);
  g.position.set(x,y,z);G.add(g);MAP.anims.push((dt)=>{g.rotation.z+=dt*speed});
}
function conveyor(B,G,x0,x1,z0,z1,sign,speed){
  const g=baseGround((x0+x1)/2,(z0+z1)/2);
  MAP.zones.push({type:'conv',x0,x1,z0,z1,dx:sign*speed,dz:0});
  const cv=document.createElement('canvas');cv.width=64;cv.height=64;const c=cv.getContext('2d');
  c.fillStyle='#3a4256';c.fillRect(0,0,64,64);c.fillStyle='#4a5470';c.fillRect(0,0,64,6);c.fillRect(0,58,64,6);
  c.fillStyle='#ffd23f';c.beginPath();
  if(sign>0){c.moveTo(14,14);c.lineTo(40,14);c.lineTo(54,32);c.lineTo(40,50);c.lineTo(14,50);c.lineTo(28,32)}
  else{c.moveTo(50,14);c.lineTo(24,14);c.lineTo(10,32);c.lineTo(24,50);c.lineTo(50,50);c.lineTo(36,32)}
  c.fill();
  const tx=new THREE.CanvasTexture(cv);tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.repeat.set((x1-x0)/4,(z1-z0)/4);
  const m=new THREE.Mesh(new THREE.BoxGeometry(x1-x0,.12,z1-z0),new THREE.MeshBasicMaterial({map:tx,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
  m.position.set((x0+x1)/2,g+.07,(z0+z1)/2);G.add(m);
  B.slab((x0+x1)/2,z0-.15,x1-x0+.3,.3,g,g+.3,0xffd23f);B.slab((x0+x1)/2,z1+.15,x1-x0+.3,.3,g,g+.3,0xffd23f);
  MAP.anims.push((dt)=>{tx.offset.x-=sign*dt*speed/4});
}
function mapFactory(B,G){
  setTheme({fog:0xffe9c4,fn:60,ff:170,top:0xffd9a0,mid:0xfff0d0,bot:0xfff6e6,hs:0xfff4e0,hg:0xb89a70,hi:.75,sc:0xfff2d8,si:.8,sd:[20,60,30]});
  MAP.bounds={x0:-53,x1:53,z0:-27,z1:27};MAP.killY=-6;
  slab(B,-52,52,-26,26,0,0xece4d0,0x8a7a60,3);
  for(let i=0;i<26;i++)for(let j=0;j<13;j++)if((i+j)%2===0)B.add('box',0xdcd2b8,-50+i*4,.015,-24+j*4,4,.02,4,0,DECAL);
  both(sg=>{B.add('box',tc2(sg,0x9fc4ff,0xffb0a8),sg*41,.03,0,22,.02,28,0,DECAL)});
  flagStandDecal(B,0);flagStandDecal(B,1);
  // outer walls
  const wallc=0x4a5a78;
  brickWall(B,0,-26.8,108,1.6,6,wallc);brickWall(B,0,26.8,108,1.6,6,wallc);brickWall(B,-52.8,0,1.6,54,6,wallc);brickWall(B,52.8,0,1.6,54,6,wallc);
  // team walls (colored) behind flags
  both(sg=>{brickWall(B,sg*50.6,0,1.6,12,3,tc2(sg,0x2f6fe0,0xd63a3a))});
  // central platform with 4 stairs
  const T=1.8;addWalk(-6,6,-6,6,T);B.slab(0,0,12,12,-.1,T,0xf2c14e);B.slab(0,0,12.6,12.6,-.1,.35,0xc99a2e);B.slab(0,0,9,9,T-.01,T+.02,0xfce08a,DECAL);
  stairs(B,0,0,1,0,6,T,.45,1.2,5,0xf2c14e);stairs(B,0,0,-1,0,6,T,.45,1.2,5,0xf2c14e);stairs(B,0,0,0,1,6,T,.45,1.2,5,0xf2c14e);stairs(B,0,0,0,-1,6,T,.45,1.2,5,0xf2c14e);
  // corner posts on platform
  for(const sx of[-1,1])for(const sz of[-1,1]){B.cyl(sx*5.4,T,sz*5.4,.45,1.4,0xe04a42);B.add('sph',0xffd23f,sx*5.4,T+1.55,sz*5.4,.55,.55,.55);addSolid(sx*5.4,sz*5.4,.9,.9,T+1.4,'post')}
  // conveyors
  conveyor(B,G,-20,20,-16,-10,1,4.6);conveyor(B,G,-20,20,10,16,-1,4.6);
  // blocks
  const P=[0xe04a42,0x3d7bff,0xffd23f,0x43c43d,0xff8a3d,0xb06af0];
  both(sg=>{
    brickWall(B,sg*16,-1,3,9,3,tc2(sg,P[1],P[0]));
    brickWall(B,sg*27,8.5,4,4,2.4,P[2]);brickWall(B,sg*27,-8.5,4,4,2.4,P[3]);
    brickWall(B,sg*36,15,2,7,2.4,tc2(sg,P[1],P[0]));brickWall(B,sg*36,-15,2,7,2.4,tc2(sg,P[1],P[0]));
    brickWall(B,sg*10,20,8,2,2.4,P[4]);brickWall(B,sg*10,-20,8,2,2.4,P[4]);
    crate(B,sg*22,0,1.8,1.2,P[5],0x4a2a7a);crate(B,sg*33,0,1.6,1.1,P[2],0x7a5a00);
    crate(B,sg*8,-9,1.5,1.0,P[0],0x7a1a1a);crate(B,sg*8,9,1.5,1.0,P[1],0x1a2a7a);
    crate(B,sg*44,-9,1.8,1.2,tc2(sg,P[1],P[0]));crate(B,sg*44,9,1.8,1.2,tc2(sg,P[1],P[0]));
  });
  brickWall(B,0,-21,4,2,2.4,P[5]);brickWall(B,0,21,4,2,2.4,P[5]);
  // decor: gears on walls, banners, lamps
  gearMesh(G,-28,4.2,-25.9,3,0xe04a42,.6);gearMesh(G,-20,3.4,-25.9,1.8,0xffd23f,-1.0);gearMesh(G,26,4.2,-25.9,3,0x3d7bff,-.6);gearMesh(G,19,3.4,-25.9,1.8,0x43c43d,1.0);
  gearMesh(G,-26,4.2,25.9,3,0x43c43d,.6);gearMesh(G,-18,3.4,25.9,1.8,0x3d7bff,-1.0);gearMesh(G,25,4.2,25.9,3,0xffd23f,-.6);gearMesh(G,17,3.4,25.9,1.8,0xe04a42,1.0);
  for(let i=-4;i<=4;i++){B.cyl(i*11,6.2,-26,.12,1.8,0x333b4a);B.add('sph',0xfff2b0,i*11,6.1,-26,.55,.4,.55);B.cyl(i*11,6.2,26,.12,1.8,0x333b4a);B.add('sph',0xfff2b0,i*11,6.1,26,.55,.4,.55)}
  // big toys outside
  for(let i=0;i<14;i++){const a=i/14*TAU,r=110+Math.random()*20;B.add('box',P[i%6],Math.cos(a)*r,10,Math.sin(a)*r,18+Math.random()*10,20+Math.random()*10,18,a)}
  MAP.spawn=[[[-40,-2.6],[-40,0],[-40,2.6]],[[40,-2.6],[40,0],[40,2.6]]];
  MAP.flag=[{x:-44,z:0},{x:44,z:0}];MAP.chest={x:0,z:0};
  MAP.coins=[[-18,-3],[18,3],[-18,3],[18,-3],[0,-14],[0,14],[-12,-14],[12,14],[-12,14],[12,-14],[-5,-9],[5,9],[-28,0],[28,0],[-32,-20],[32,20],[-32,20],[32,-20],[-22,13],[22,-13],[-22,-13],[22,13],[-40,-14],[40,14]];
}

/* ---------------- map 3: Sky Canyon ---------------- */
function skyIsland(B,x0,x1,z0,z1,t,top,rock){
  slab(B,x0,x1,z0,z1,t,top,rock,2.4);
  const cx=(x0+x1)/2,cz=(z0+z1)/2,w=x1-x0,d=z1-z0;
  B.slab(cx,cz,w*.72,d*.72,t-5.4,t-2.45,rock);B.slab(cx,cz,w*.44,d*.44,t-8.4,t-5.45,rock);B.add('cone4',rock,cx,t-10.5,cz,w*.4,4,d*.4,Math.PI/4);
}
function crystal(B,x,z,s,col){const g=baseGround(x,z);B.add('oct',col,x,g+s*1.1,z,s*.6,s*1.2,s*.6,Math.random()*3,{transparent:true,opacity:.85})}
function mapSky(B,G){
  setTheme({fog:0xffc9a0,fn:90,ff:260,top:0x4b5fd0,mid:0xff9f7a,bot:0xffd6a8,hs:0xffd8c0,hg:0x8a6aa0,hi:.5,sc:0xffc890,si:.8,sd:[-40,30,25]});
  MAP.bounds={x0:-53,x1:53,z0:-24,z1:24};MAP.killY=-9;
  const grass=0x7ad65a,rock=0x8a6a58;
  both(sg=>{const x0=sg<0?-52:32,x1=sg<0?-32:52;skyIsland(B,x0,x1,-14,14,.5,tc2(sg,0x9fbfff,0xffb0a0),tc2(sg,0x4a5a8a,0x8a4a4a))});
  both(sg=>{for(let i=0;i<10;i++)for(let j=0;j<14;j++)if((i+j)%2===0)B.add('box',tc2(sg,0x7fa4f5,0xf59a8a),(sg<0?-51:33)+i*2,.5+.015,-13+j*2,2,.02,2,0,DECAL)});
  both(sg=>{const x0=sg<0?-26:14,x1=sg<0?-14:26;skyIsland(B,x0,x1,-20,-6,1,grass,rock);skyIsland(B,x0,x1,6,20,1,grass,rock)});
  skyIsland(B,-9,9,-10,10,1,grass,rock);
  // walkways (wooden) with low rails
  const walkway=(x0,x1,z0,z1)=>{addWalk(x0,x1,z0,z1,1);const cx=(x0+x1)/2,cz=(z0+z1)/2;B.slab(cx,cz,x1-x0,z1-z0,.6,1,0xa9763f);B.slab(cx,cz,x1-x0-.2,z1-z0-.2,-.4,.59,0x6b4423);
    for(const zz of[z0+.1,z1-.1]){B.slab(cx,zz,x1-x0,.14,1,1.9,0x7a5230);addSolid(cx,zz,x1-x0,.3,1.9,'rail')}};
  both(sg=>{const a=sg<0?-14:9,b=sg<0?-9:14;walkway(a,b,-9.6,-6.4);walkway(a,b,6.4,9.6)});
  // chest platform
  addWalk(-3,3,-3,3,1.4);B.slab(0,0,6,6,.9,1.4,0xcfc7ad);B.slab(0,0,4.2,4.2,1.39,1.45,0xe8dfc4);
  // jump pads
  const padTo=(x,z,tx,tz)=>pad(B,G,x,z,tx,tz,0,1.5);
  both(sg=>{
    padTo(sg*33.4,-7,sg*20,-13);padTo(sg*33.4,7,sg*20,13);
    padTo(sg*25,-13,sg*39,-8);padTo(sg*25,13,sg*39,8);
  });
  // cover & decor
  both(sg=>{
    for(const z of[-10,-3,3,10]){crate(B,sg*46,z,1.8,1.2,tc2(sg,0x4b8bff,0xff6a60))}
    brickWall(B,sg*44,-8,1.4,5,1.6,tc2(sg,0x6a8fe0,0xe08a80));brickWall(B,sg*44,8,1.4,5,1.6,tc2(sg,0x6a8fe0,0xe08a80));
    crate(B,sg*21,-18,1.6,1.1,0xc88a3e);crate(B,sg*21,18,1.6,1.1,0xc88a3e);crate(B,sg*17,-9,1.4,.9,0xc88a3e);crate(B,sg*17,9,1.4,.9,0xc88a3e);
    crystal(B,sg*22,-17,2.2,0x7fe8ff);crystal(B,sg*22,17,2.2,0xff8ae0);crystal(B,sg*47,-12,1.8,0x7fe8ff);crystal(B,sg*47,12,1.8,0xff8ae0);
  });
  for(const sx of[-1,1])for(const sz of[-1,1]){const x=sx*6,z=sz*6.5;B.cyl(x,1,z,.7,3.2,0xe8dfc4);B.add('oct',0xffd23f,x,4.6,z,.7,.9,.7,0,{transparent:true,opacity:.9});addSolid(x,z,1.2,1.2,4.2,'pillar')}
  crystal(B,0,-7,2.6,0x7fe8ff);crystal(B,0,7,2.6,0xff8ae0);
  flagStandDecal(B,0);flagStandDecal(B,1);
  // floating rocks & trees
  for(let i=0;i<22;i++){const a=Math.random()*TAU,r=rand(55,95);B.add('dod',rock,Math.cos(a)*r,rand(-12,12),Math.sin(a)*r*.7,rand(2,6),rand(1.5,4),rand(2,6),Math.random()*3)}
  for(const p of[[-48,-12],[-48,12],[-20,-17],[-20,17],[20,-17],[20,17],[48,-12],[48,12]]){const g=baseGround(p[0],p[1]);B.cyl(p[0],g,p[1],.25,1.6,0x7a5230);B.add('ico',0xff9ec0,p[0],g+2.4,p[1],1.5,1.3,1.5,0);addSolid(p[0],p[1],.8,.8,g+3.5,'tree')}
  makeWaterPlane(G,-16,'#ffe4d0','cloud');cloudPuffs(G,40,-14,-4,120);
  MAP.spawn=[[[-40,-3],[-40,0],[-40,3]],[[40,-3],[40,0],[40,3]]];
  MAP.flag=[{x:-46,z:0},{x:46,z:0}];MAP.chest={x:0,z:0};
  MAP.coins=[[-20,-13],[20,13],[-20,13],[20,-13],[-6,0],[6,0],[0,-6],[0,6],[-12,-8],[12,8],[-12,8],[12,-8],[-40,-9],[40,9],[-40,9],[40,-9],[-44,0],[44,0],[-23,-9],[23,9],[-23,9],[23,-9],[0,0],[-34,0]];
}

/* ---------------- map 4: Frozen Lake ---------------- */
function mapIce(B,G){
  setTheme({fog:0xd8eeff,fn:70,ff:200,top:0x7fb6f0,mid:0xd8eeff,bot:0xf2f8ff,hs:0xd8e8f8,hg:0x7a98b8,hi:.5,sc:0xf4f0e8,si:.6,sd:[25,55,-20]});
  MAP.bounds={x0:-53,x1:53,z0:-27,z1:27};MAP.killY=-4;
  slab(B,-46,46,-26,26,0,0x9cc8e8,0x4a86b8,4);
  for(let i=0;i<23;i++)for(let j=0;j<13;j++)if((i*7+j*3)%5===0)B.add('box',0xc4e2f8,-45+i*4,.015,-24+j*4,3.4,.02,3.4,0,DECAL);
  both(sg=>{slab(B,sg<0?-52:30,sg<0?-30:52,-14,14,.4,0xdce8f5,tc2(sg,0x3a5f9a,0x9a4a4a),3)});
  MAP.zones.push({type:'ice',x0:-30,x1:30,z0:-26,z1:26});
  flagStandDecal(B,0);flagStandDecal(B,1);
  // center waterfall platform
  const T=1.35;addWalk(-5,5,-5,5,T);B.slab(0,0,10,10,-.1,T,0x9fd4f5);B.slab(0,0,10.6,10.6,-.1,.3,0x6fb0e0);
  stairs(B,0,0,1,0,5,T,.45,1.3,5,0x9fd4f5);stairs(B,0,0,-1,0,5,T,.45,1.3,5,0x9fd4f5);stairs(B,0,0,0,1,5,T,.45,1.3,5,0x9fd4f5);stairs(B,0,0,0,-1,5,T,.45,1.3,5,0x9fd4f5);
  for(const sx of[-1,1])for(const sz of[-1,1])B.add('oct',0x9fe0ff,sx*4.3,T+1.2,sz*4.3,.8,1.4,.8,0,{transparent:true,opacity:.8});
  // ice blocks (translucent solids)
  const ib=(x,z,w,d,h)=>{const g=baseGround(x,z);B.slab(x,z,w,d,g,g+h,0x9fd8ff,{transparent:true,opacity:.72});addSolid(x,z,w,d,g+h,'ice')};
  both(sg=>{
    ib(sg*14,-9,3.4,3.4,2.4);ib(sg*14,9,3.4,3.4,2.4);ib(sg*21,0,2,9,2.2);ib(sg*10,-19,6,2,2.2);ib(sg*10,19,6,2,2.2);
    ib(sg*27,-14,2.5,2.5,1.6);ib(sg*27,14,2.5,2.5,1.6);ib(sg*6,-12,1.6,1.6,1.2);ib(sg*6,12,1.6,1.6,1.2);
    // igloos
    for(const z of[-9,9]){const x=sg*46,g=baseGround(x,z);B.add('sph',0xf4faff,x,g,z,3.2,2.6,3.2,0);B.slab(x-sg*0,z+(z>0?-3:3),1.6,.6,g,g+1.6,0x2a3a5a);addSolid(x,z,5.2,5.2,g+2.3,'igloo')}
    // snow ridges at lake edges (gap in the middle = slippery edge)
    if(sg<0)for(const s2 of[-1,1]){for(const [a,b] of [[-44,-10],[10,44]]){const w=b-a,cx=(a+b)/2;B.slab(cx,s2*25.2,w,1.2,0,.9,0xf4faff);addSolid(cx,s2*25.2,w,1.2,.9,'ridge')}}
  });
  // snowmen
  for(const p of[[-36,-11],[36,11],[-36,11],[36,-11]]){const g=baseGround(p[0],p[1]);B.add('sph',0xffffff,p[0],g+.5,p[1],.7,.7,.7);B.add('sph',0xffffff,p[0],g+1.3,p[1],.5,.5,.5);B.add('sph',0xffffff,p[0],g+1.9,p[1],.35,.35,.35);B.add('cone',0xff8a3d,p[0]+.3,g+1.9,p[1],.07,.4,.07,0);addSolid(p[0],p[1],1.2,1.2,g+2.3,'snowman')}
  crate(B,-34,0,1.6,1.1,0x6a8fe0);crate(B,34,0,1.6,1.1,0xe08a80);
  // pines around
  for(let i=0;i<60;i++){const a=i/60*TAU+Math.random()*.1,r=rand(62,100),x=Math.cos(a)*r,z=Math.sin(a)*r*.7,s=rand(1.4,2.6);B.cyl(x,-1,z,.35*s,1.6*s,0x6a4a32);B.cone(x,-1+1.2*s,z,1.6*s,2.6*s,0xdff0ff);B.cone(x,-1+2.8*s,z,1.2*s,2.2*s,0xf4faff)}
  for(let i=0;i<14;i++){const a=i/14*TAU,r=120+Math.random()*30;B.add('cone',0xbcd8f5,Math.cos(a)*r,16,Math.sin(a)*r,26+Math.random()*10,34+Math.random()*16,26,0)}
  makeWaterPlane(G,-1,'#1d5f98','water');
  // snow particles
  const N=320,sg=new THREE.BufferGeometry(),sp_=new Float32Array(N*3);for(let i=0;i<N;i++){sp_[i*3]=rand(-40,40);sp_[i*3+1]=rand(0,30);sp_[i*3+2]=rand(-40,40)}
  sg.setAttribute('position',new THREE.BufferAttribute(sp_,3));
  const snow=new THREE.Points(sg,new THREE.PointsMaterial({size:.22,color:0xffffff,map:new THREE.CanvasTexture(dotC),transparent:true,depthWrite:false}));snow.frustumCulled=false;G.add(snow);MAP.snow=snow;
  MAP.anims.push((dt)=>{const p=sg.attributes.position.array,c=camera.position;for(let i=0;i<N;i++){p[i*3+1]-=dt*(1.6+(i%5)*.3);p[i*3]+=Math.sin(i+performance.now()*.001)*dt*.3;if(p[i*3+1]<c.y-8||Math.abs(p[i*3]-c.x)>40||Math.abs(p[i*3+2]-c.z)>40){p[i*3]=c.x+rand(-38,38);p[i*3+1]=c.y+rand(8,26);p[i*3+2]=c.z+rand(-38,38)}}sg.attributes.position.needsUpdate=true});
  MAP.spawn=[[[-40,-3],[-40,0],[-40,3]],[[40,-3],[40,0],[40,3]]];
  MAP.flag=[{x:-44,z:0},{x:44,z:0}];MAP.chest={x:0,z:0};
  MAP.coins=[[-16,-14],[16,14],[-16,14],[16,-14],[-8,0],[8,0],[0,-10],[0,10],[-22,-6],[22,6],[-22,6],[22,-6],[-28,0],[28,0],[-12,-22],[12,22],[-12,22],[12,-22],[-38,-10],[38,10],[-38,10],[38,-10],[0,-21],[0,21]];
}

const MAPDEFS=[
 {id:'bridges',n:'map_bridges',d:'map_bridges_d',build:mapBridges,mc:'#7cc757',col:'#4aa8ff',ic:'🌉'},
 {id:'factory',n:'map_factory',d:'map_factory_d',build:mapFactory,mc:'#e8dcc0',col:'#ffb83a',ic:'🧩'},
 {id:'sky',n:'map_sky',d:'map_sky_d',build:mapSky,mc:'#7ad65a',col:'#ff8a6a',ic:'☁'},
 {id:'ice',n:'map_ice',d:'map_ice_d',build:mapIce,mc:'#d6efff',col:'#8fd0ff',ic:'❄'}
];
function disposeGroup(g){g.traverse(o=>{if(o.geometry&&!Object.values(UG).includes(o.geometry))o.geometry.dispose&&o.geometry.dispose()})}
function loadMap(id){
  if(MAP.grp){scene.remove(MAP.grp);disposeGroup(MAP.grp)}
  MAP.walk=[];MAP.solids=[];MAP.zones=[];MAP.pads=[];MAP.anims=[];MAP.snow=null;MAP.clouds=null;
  const def=MAPDEFS.find(m=>m.id===id)||MAPDEFS[0];MAP.id=def.id;MAP.def=def;
  const G=new THREE.Group();scene.add(G);MAP.grp=G;const B=new Batch();
  def.build(B,G);B.flush(G);
  MAP.chestGfx=makeChestGfx(G,MAP.chest.x,baseGround(MAP.chest.x,MAP.chest.z),MAP.chest.z);
  MAP.flagsGfx=makeFlagGfx(G);
  const cg=new THREE.CylinderGeometry(.34,.34,.07,16);cg.rotateX(Math.PI/2);MAP.coinGfx=[];
  for(const c of MAP.coins){const m=new THREE.Mesh(cg,new THREE.MeshBasicMaterial({color:0xffd23f}));m.position.set(c[0],baseGround(c[0],c[1])+.9,c[1]);G.add(m);MAP.coinGfx.push(m)}
  buildNav();
  return def;
}

/* ================= Navigation grid (auto-generated for every map) ================= */
const NAV={cs:1,w:0,h:0,x0:0,z0:0,ok:null,hg:null,links:new Map()};
function solidBlocks(x,z,g){
  for(const s of MAP.solids){const m=s.kind==='rail'?.28:.5;if(x>s.x0-m&&x<s.x1+m&&z>s.z0-m&&z<s.z1+m&&s.top>g+.55)return true}
  return false;
}
function buildNav(){
  const b=MAP.bounds,cs=NAV.cs;NAV.x0=b.x0;NAV.z0=b.z0;NAV.w=Math.ceil((b.x1-b.x0)/cs);NAV.h=Math.ceil((b.z1-b.z0)/cs);
  NAV.ok=new Uint8Array(NAV.w*NAV.h);NAV.hg=new Float32Array(NAV.w*NAV.h);NAV.links=new Map();
  for(let j=0;j<NAV.h;j++)for(let i=0;i<NAV.w;i++){
    const x=NAV.x0+(i+.5)*cs,z=NAV.z0+(j+.5)*cs,g=baseGround(x,z),m=.5;
    let ok=g>-Infinity&&baseGround(x+m,z)>-Infinity&&baseGround(x-m,z)>-Infinity&&baseGround(x,z+m)>-Infinity&&baseGround(x,z-m)>-Infinity;
    if(ok&&solidBlocks(x,z,g))ok=false;
    NAV.ok[j*NAV.w+i]=ok?1:0;NAV.hg[j*NAV.w+i]=ok?g:0;
  }
  for(const p of MAP.pads){const a=navCell(p.x,p.z),b2=navCell(p.tx,p.tz);if(a>=0&&b2>=0)NAV.links.set(a,b2)}
}
function navCell(x,z){const i=Math.floor((x-NAV.x0)/NAV.cs),j=Math.floor((z-NAV.z0)/NAV.cs);if(i<0||j<0||i>=NAV.w||j>=NAV.h)return-1;return j*NAV.w+i}
function navCenter(c){return[NAV.x0+((c%NAV.w)+.5)*NAV.cs,NAV.z0+(Math.floor(c/NAV.w)+.5)*NAV.cs]}
function nearestOkCell(x,z){
  let c=navCell(x,z);if(c>=0&&NAV.ok[c])return c;
  const ci=Math.floor((x-NAV.x0)/NAV.cs),cj=Math.floor((z-NAV.z0)/NAV.cs);
  for(let r=1;r<8;r++)for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){if(Math.max(Math.abs(di),Math.abs(dj))!==r)continue;const i=ci+di,j=cj+dj;if(i<0||j<0||i>=NAV.w||j>=NAV.h)continue;if(NAV.ok[j*NAV.w+i])return j*NAV.w+i}
  return -1;
}
function navLOS(x0,z0,x1,z1){
  const d=Math.hypot(x1-x0,z1-z0),n=Math.ceil(d/.7);let lh=null;
  for(let i=1;i<=n;i++){const t=i/n,x=x0+(x1-x0)*t,z=z0+(z1-z0)*t,c=navCell(x,z);if(c<0||!NAV.ok[c])return false;const h=NAV.hg[c];if(lh!==null&&Math.abs(h-lh)>.5)return false;lh=h}
  return true;
}
// A* with binary heap
function navPath(sx,sz,tx,tz){
  const s=nearestOkCell(sx,sz),g=nearestOkCell(tx,tz);if(s<0||g<0)return null;
  const W=NAV.w,N=W*NAV.h,gs=new Float32Array(N).fill(1e9),from=new Int32Array(N).fill(-1),closed=new Uint8Array(N);
  const heap=[],push=(c,f)=>{heap.push([f,c]);let i=heap.length-1;while(i>0){const p=(i-1)>>1;if(heap[p][0]<=heap[i][0])break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p}};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let i=0;for(;;){let l=i*2+1,r=l+1,m=i;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===i)break;[heap[m],heap[i]]=[heap[i],heap[m]];i=m}}return top};
  const gx=g%W,gz=(g/W)|0,hf=c=>Math.hypot((c%W)-gx,((c/W)|0)-gz);
  gs[s]=0;push(s,hf(s));let it=0;
  while(heap.length&&it++<6000){
    const [,c]=pop();if(closed[c])continue;closed[c]=1;if(c===g)break;
    const ci=c%W,cj=(c/W)|0,ch=NAV.hg[c];
    for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){
      if(!di&&!dj)continue;const i=ci+di,j=cj+dj;if(i<0||j<0||i>=W||j>=NAV.h)continue;const n=j*W+i;
      if(!NAV.ok[n]||closed[n]||Math.abs(NAV.hg[n]-ch)>.5)continue;
      if(di&&dj&&(!NAV.ok[cj*W+i]||!NAV.ok[j*W+ci]))continue;
      const ng=gs[c]+(di&&dj?1.414:1);if(ng<gs[n]){gs[n]=ng;from[n]=c;push(n,ng+hf(n))}
    }
    const lk=NAV.links.get(c);if(lk!==undefined&&!closed[lk]){const ng=gs[c]+3;if(ng<gs[lk]){gs[lk]=ng;from[lk]=c;push(lk,ng+hf(lk))}}
  }
  if(from[g]<0&&s!==g)return null;
  const cells=[];for(let c=g;c>=0;c=from[c]){cells.unshift(c);if(c===s)break}
  // smooth with line of sight (never skip a pad link)
  const pts=[];let i=0;
  while(i<cells.length-1){
    let far=i+1;
    for(let k=Math.min(cells.length-1,i+14);k>i+1;k--){
      let linkBetween=false;for(let q=i;q<k;q++){if(NAV.links.get(cells[q])===cells[q+1]){linkBetween=true;break}}
      if(linkBetween)continue;
      const a=navCenter(cells[i]),b=navCenter(cells[k]);if(navLOS(a[0],a[1],b[0],b[1])){far=k;break}
    }
    const p=navCenter(cells[far]);pts.push({x:p[0],z:p[1],link:NAV.links.get(cells[far-1])===cells[far]});i=far;
  }
  return pts;
}
