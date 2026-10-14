import { writeFileSync, mkdirSync } from 'node:fs';
import * as k from '../vendor/anatomy/iso-kit.mjs';
import * as G from '../vendor/anatomy/lathe.mjs';
import * as A from '../vendor/anatomy/audit.mjs';

// Conceptual geometry, in drawing units, NOT dimensions of an existing Aster.
// Module parts: mounting feet and base; four enclosure walls; board supports;
// processor, contacts and passives; sensor carrier and optical window; aperture
// lid, fasteners, lens flange, barrel, retaining rings and recessed front glass.
// The same physical assembly is reused at a smaller scale on the aircraft.
const width = 900, height = 680;
const moduleP = k.fitProjection([...k.boxCorners({x:-62,y:-48,w:124,d:96,r:5},-5,210)], width,height,{pad:65,azimuth:42,elevation:28});
const droneP = k.fitProjection([...k.boxCorners({x:-115,y:-102,w:230,d:204,r:5},0,115)],width,height,{pad:60,azimuth:42,elevation:27});

function builder(P) {
  const R = A.recorder(P);
  let count=0;
  const put = (name, at, svg, shape, part='body', lift=0) => {
    const id=`${name}.${count++}`;
    shape.name=id; shape.owner=part;
    if(name==='base'&&zGround(at) || name==='landing-foot') shape.ground=true;
    R.put({name:id,piece:part,at,svg,part,lift,move:[0,0,lift],shapes:[R.solid(shape)]});
  };
  const slab = (name,x,y,w,d,z,h,part='body',lift=0,lit=false) => {
    const plan={x,y,w,d,r:Math.min(1.5,w/5,d/5)};
    put(name,[x+w/2,y+d/2,z+h/2],k.solidSvg(k.slabOf(plan,z,h,P,5,Math.min(.45,h/3)),{tone:'hi',lit}),A.slab(plan,z,h,{},5),part,lift);
  };
  const cyl = (name,x,y,r,z,h,part='body',lift=0,lit=false) => {
    put(name,[x,y,z+h/2],k.solidSvg(k.cylinder(x,y,r,z,h,P,48,Math.min(.2,h/3)),{tone:'hi',lit}),A.cylinder(x,y,r,z,h),part,lift);
  };
  const ring = (name,x,y,ri,ro,z,h,part='optics',lift=125) => {
    const facing=(P.azimuth||45)*Math.PI/180;
    for(const half of [0,1]) {
      const start=facing-Math.PI/2+half*Math.PI;
      const outer=Array.from({length:49},(_,i)=>{const a=start+i*Math.PI/48;return[x+Math.cos(a)*ro,y+Math.sin(a)*ro];});
      const inner=Array.from({length:49},(_,i)=>{const a=start+(48-i)*Math.PI/48;return[x+Math.cos(a)*ri,y+Math.sin(a)*ri];});
      const poly=[...outer,...inner];
      const mid=start+Math.PI/2;
      put(`${name}-${half}`,[x+Math.cos(mid)*(ri+ro)/2,y+Math.sin(mid)*(ri+ro)/2,z+h/2],k.solidSvg(k.extrude(poly,z,h,P,{convex:false}),{tone:'hi',crease:'none'}),A.extruded(poly,z,h),part,lift);
    }
  };
  const beam = (name,a,b,r,part='airframe') => {
    const F=G.frameAlong(a,G.unit3(G.sub3(b,a))),len=G.len3(G.sub3(b,a));
    const poly=[[-r,-r],[r,-r],[r,r],[-r,r]];
    put(name,G.lerp3(a,b,.5),k.solidSvg(G.prismOf(F,poly,0,len,P),{tone:'mid'}),A.prism(F,poly,0,len),part,0);
  };
  const polySlab=(name,poly,z,h,part='airframe')=>{
    const at=[poly.reduce((sum,p)=>sum+p[0],0)/poly.length,poly.reduce((sum,p)=>sum+p[1],0)/poly.length,z+h/2];
    put(name,at,k.solidSvg(k.extrude(poly,z,h,P,{convex:true}),{tone:'mid'}),A.extruded(poly,z,h),part,0);
  };
  const finish = () => {
    A.settle(R,P,{states:Array.from({length:11},(_,i)=>i/10)});
    R.items.sort((a,b)=>a.key-b.key);
    return { P, count, items:R.items.map(({name,svg,part,lift,key})=>({name,svg,part,lift,key})), R };
  };
  return {slab,cyl,ring,beam,polySlab,finish};
}

function zGround(at) { return at[2]<5; }

function sensor(B, scale=1, z0=0, detachable=false) {
  const lift=(part)=>detachable?66/scale:({body:0,board:48,sensor:66,optics:125}[part]||0);
  const box=(name,x,y,w,d,z,h,part='body',lit=false)=>B.slab(name,x*scale,y*scale,w*scale,d*scale,z0+z*scale,h*scale,part,lift(part)*scale,lit);
  const cy=(name,x,y,r,z,h,part='body',lit=false)=>B.cyl(name,x*scale,y*scale,r*scale,z0+z*scale,h*scale,part,lift(part)*scale,lit);
  const ri=(name,rin,rout,z,h)=>B.ring(name,0,0,rin*scale,rout*scale,z0+z*scale,h*scale,'optics',lift('optics')*scale);
  for(const x of [-43,33]) for(const y of [-33,25]) {
    box('mounting-ear',x,y,10,8,-2,2);
    cy('mounting-seat',x+5,y+4,2.1,0,.45);
  }
  box('base',-44,-36,88,72,0,4);
  for(const x of [-32,32]) for(const y of [-24,24]) cy('board-standoff',x,y,2.2,4,4);
  box('circuit-board',-36,-28,72,56,8,2,'board');
  for(const x of [-32,32]) for(const y of [-24,24]) cy('board-screw',x,y,1.3,10,.7,'board');
  box('processor-package',16,-14,13,13,10,3,'board');
  for(let i=0;i<6;i++) {
    box('processor-contact',17+i*1.8,-15.2,.9,1.2,10,.35,'board');
    box('processor-contact',17+i*1.8,-1,.9,1.2,10,.35,'board');
  }
  for(let i=0;i<8;i++) box('passive-component',-28+i*7,18,3.6,2.5,10,1.5,'board');
  box('interface-socket',-29,-21,15,8,10,5,'board');
  for(let i=0;i<5;i++) box('socket-contact',-27+i*2.3,-22.6,1.2,1.6,11,1.1,'board');
  box('sensor-carrier',-11,-11,22,22,10,2,'sensor');
  box('sensor-package',-8,-8,16,16,12,2,'sensor');
  box('photosensitive-window',-6.4,-6.4,12.8,12.8,14,.45,'sensor',true);
  for(const x of [-9,9]) for(const y of [-9,9]) cy('carrier-fastener',x,y,.8,12,.5,'sensor');
  // Four separate walls keep the enclosure genuinely hollow.
  box('back-wall',-44,-36,88,3,4,32);
  box('left-wall',-44,-33,3,66,4,32);
  box('right-wall',41,-33,3,66,4,32);
  box('front-wall',-44,33,88,3,4,32);
  // Lid is four actual pieces around a clear optical aperture.
  box('lid-back',-44,-36,88,26,36,3,'optics');
  box('lid-front',-44,10,88,26,36,3,'optics');
  box('lid-left',-44,-10,34,20,36,3,'optics');
  box('lid-right',10,-10,34,20,36,3,'optics');
  for(const x of [-38,38]) for(const y of [-30,30]) cy('lid-fastener',x,y,1.6,39,.8,'optics');
  ri('optical-flange',8,19,39,3);
  ri('lens-seat',8,14,42,3);
  let barrelZ=45;
  for(let i=0;i<3;i++) {
    const ribZ=47+i*5;
    ri('optical-barrel',8,12,barrelZ,ribZ-barrelZ);
    ri('barrel-rib',8,13.3,ribZ,1.4);
    barrelZ=ribZ+1.4;
  }
  ri('optical-barrel',8,12,barrelZ,63-barrelZ);
  ri('retaining-ring',8,13.4,63,3);
  cy('recessed-lens',0,0,7.9,64,.5,'optics',true);
  ri('front-rim',8,13.4,66,1.2);
}

const moduleB=builder(moduleP); sensor(moduleB); const moduleArt=moduleB.finish();
const droneB=builder(droneP);
for(const sx of [-1,1]) for(const sy of [-1,1]) {
  const x=sx*76,y=sy*62;
  // Flat-ended carbon arms meet a flat motor shoe, not the motor's curved side.
  const arm=[[sx*27,sy*12],[sx*67,sy*59],[sx*67,sy*65],[sx*27,sy*18]];
  droneB.polySlab('carbon-arm',arm,28,6);
  droneB.slab('motor-shoe',x-9,y-9,18,18,28,6,'airframe');
  droneB.cyl('motor-body',x,y,7.4,34,12,'airframe');
  droneB.cyl('motor-bearing',x,y,4.3,46,2,'airframe');
  droneB.cyl('rotor-hub',x,y,2.4,48,2.3,'airframe');
  droneB.cyl('landing-leg',sx*20,sy*14,1.8,6,20,'airframe');
  droneB.cyl('landing-ferrule',sx*20,sy*14,2.5,4,2,'airframe');
  droneB.slab('landing-foot',sx*20-9,sy*14-3,18,6,1,3,'airframe');
}
droneB.slab('airframe-lower',-27,-21,54,42,26,8,'airframe');
droneB.slab('airframe-deck',-28,-22,56,44,34,3,'airframe');
for(const x of [-22,22]) for(const y of [-16,16]) droneB.cyl('deck-fastener',x,y,1.1,37,.6,'airframe');
droneB.slab('module-mount',-15,-13,30,26,37,4,'mount');
for(const x of [-12,12]) for(const y of [-10,10]) droneB.cyl('mount-fastener',x,y,1,41,.5,'mount');
sensor(droneB,.28,41.56,true);
const droneArt=droneB.finish();
// The renderer uses these camera vectors for true world-z translations and
// re-sorts every moving item by its actual depth throughout the explode.
function serialise(art) {
  const a=k.iso([0,0,0],art.P), b=k.iso([0,0,1],art.P);
  return { P:art.P,count:art.count,rise:[b[0]-a[0],b[1]-a[1]],depthZ:Math.sin(art.P.elevation*Math.PI/180),items:art.items };
}
mkdirSync('src/generated',{recursive:true});
mkdirSync('public/figures',{recursive:true});
writeFileSync('public/figures/module.json',JSON.stringify(serialise(moduleArt)));
writeFileSync('public/figures/drone.json',JSON.stringify(serialise(droneArt)));
writeFileSync('src/generated/anatomy.css',k.ISO_CSS);
console.log(`Generated module: ${moduleArt.count} solids; aircraft with module: ${droneArt.count} solids.`);
if(process.argv.includes('--audit')) {
  const frames=Array.from({length:61},(_,i)=>i/60);
  A.auditOrExit(moduleArt.R,moduleP,{frames,apart:true});
  A.auditOrExit(droneArt.R,droneP,{frames,apart:true});
}
