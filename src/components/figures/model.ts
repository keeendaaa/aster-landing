export type Vec3 = [number, number, number];
export type Projection = { origin:number[]; scale:number; azimuth?:number; elevation?:number };

export function project([x,y,z]:Vec3, p:Projection):[number,number] {
  const a=(p.azimuth??45)*Math.PI/180, e=(p.elevation??30)*Math.PI/180, u=p.scale*Math.sqrt(1.6);
  return [p.origin[0]+(x*Math.sin(a)-y*Math.cos(a))*u,p.origin[1]+((x*Math.cos(a)+y*Math.sin(a))*Math.sin(e)-z*Math.cos(e))*u];
}

// A deliberately small, truthful 2D teaching model. It demonstrates the roll of
// a synthetic star pattern, not a star catalogue solver or Aster performance.
export const catalogue = [
  {id:'a',x:-91,y:-43,size:3.2}, {id:'b',x:-29,y:64,size:2.6},
  {id:'c',x:54,y:-69,size:3.7}, {id:'d',x:108,y:21,size:2.8},
  {id:'e',x:19,y:28,size:2.4},
];
export function rotatePoint(x:number,y:number,degrees:number):[number,number] {
  const a=degrees*Math.PI/180;
  return [x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a)];
}
export function rollFromPair(observedA:[number,number],observedB:[number,number]) {
  const [a,b]=catalogue;
  const reference=Math.atan2(b.y-a.y,b.x-a.x);
  const measured=Math.atan2(observedB[1]-observedA[1],observedB[0]-observedA[0]);
  return Math.atan2(Math.sin(measured-reference),Math.cos(measured-reference))*180/Math.PI;
}
