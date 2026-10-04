// pacing simulation: greedy buyer, 3 taps/s while "active"
const G=[[15,.1],[100,1],[1100,8],[12000,47],[130000,260],[1.4e6,1400],[20e6,7800],[330e6,44000],[5.1e9,260000],[75e9,1.6e6]];
G.forEach(g=>g[1]*=4);const M=[10,25,50,100,150,200,250,300,400,500];
const U=[];for(let i=0;i<6;i++)U.push({l:'k',c:200*20**i});for(let i=0;i<5;i++)U.push({l:'p',c:5000*100**i});for(let i=0;i<8;i++)U.push({l:'a',c:1e4*100**i});
G.forEach((g,i)=>{U.push({l:'o'+i,c:g[0]*100,need:[i,5]});U.push({l:'o'+i,c:g[0]*1e4,need:[i,25]});});
function run(cr,minutes){let g=0,run=0,c=G.map(()=>0),u=new Set(),t=0,out=[];
 const cnt=l=>U.filter((x,j)=>x.l===l&&u.has(j)).length;
 const mm=n=>M.reduce((m,x)=>n>=x?m*2:m,1);
 const ps=()=>{let s=0;G.forEach((x,i)=>s+=x[1]*c[i]*mm(c[i])*2**cnt('o'+i));return s*(1+.1*cr)*2**cnt('a')};
 while(t<minutes*60){const P=ps();const ck=(2**cnt('k')+P*cnt('p')*.01);g+=P+3*ck;run+=P+3*ck;t++;
  for(let k=0;k<20;k++){let best=null;
   G.forEach((x,i)=>{const cost=x[0]*1.15**c[i];if(cost<=g&&(!best||cost/x[1]<best.r))best={r:cost/x[1],f:()=>{g-=cost;c[i]++}}});
   U.forEach((x,j)=>{if(u.has(j))return;const first=!U.some((y,jj)=>jj<j&&y.l===x.l&&!u.has(jj));if(!first)return;if(x.need&&c[x.need[0]]<x.need[1])return;if(x.c<=g)best={r:0,f:()=>{g-=x.c;u.add(j)}}});
   if(!best)break;best.f();}
  if(t%300===0)out.push((t/60)+'m ps='+P.toExponential(2)+' run='+run.toExponential(2)+' gain='+Math.floor(Math.sqrt(run/1e7)));}
 return out;}
console.log(run(0,60).join('\n'));console.log('--- with 20 crystals');console.log(run(20,30).join('\n'));
