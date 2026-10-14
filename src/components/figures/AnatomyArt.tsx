import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { project, type Projection } from './model';
import '../../generated/anatomy.css';

type Props = { kind:'module'|'drone'; expanded?:boolean; selected?:string; detached?:boolean; flying?:boolean };
type FigureArt = {P:Projection;rise:number[];depthZ:number;count:number;items:{name:string;svg:string;part:string;lift:number;key:number}[]};

export function AnatomyArt({kind,expanded=false,selected='',detached=false,flying=false}:Props) {
  const ref=useRef<SVGSVGElement>(null);
  const [art,setArt]=useState<FigureArt|null>(null);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{
    const abort=new AbortController();
    const observer=new IntersectionObserver(([entry])=>{
      if(!entry.isIntersecting)return;
      observer.disconnect();
      fetch(`/figures/${kind}.json`,{signal:abort.signal}).then(response=>{
        if(!response.ok)throw new Error('Figure unavailable');
        return response.json();
      }).then(data=>setArt(data as FigureArt)).catch(error=>{if(error.name!=='AbortError')setFailed(true);});
    },{rootMargin:'500px'});
    observer.observe(ref.current!);
    return()=>{abort.abort();observer.disconnect();};
  },[kind]);
  useGSAP(()=>{
    if(!art)return;
    const media=gsap.matchMedia();
    media.add({reduced:'(prefers-reduced-motion: reduce)',normal:'(prefers-reduced-motion: no-preference)'},context=>{
      const groups=Array.from(ref.current!.querySelectorAll<SVGGElement>('[data-piece]'));
      const pose={value:Number(ref.current!.dataset.pose||0)};
      const target=kind==='module'?Number(expanded):Number(detached);
      const draw=()=>{
        ref.current!.dataset.pose=String(pose.value);
        for(const element of groups) {
          const lift=kind==='module'?Number(element.dataset.lift):(element.dataset.piece==='airframe'||element.dataset.piece==='mount'?0:66);
          element.setAttribute('transform',`translate(${art.rise[0]*lift*pose.value} ${art.rise[1]*lift*pose.value})`);
          element.dataset.depth=String(Number(element.dataset.key)+lift*pose.value*art.depthZ);
        }
        groups.sort((a,b)=>Number(a.dataset.depth)-Number(b.dataset.depth));
        const layer=ref.current!.querySelector('[data-assembly]')!;
        for(const group of groups) layer.appendChild(group);
      };
      gsap.to(pose,{value:target,duration:context.conditions?.reduced?0:1.2,ease:'power2.inOut',onUpdate:draw});
      const lowlight=selected && kind==='module';
      for(const group of groups) {
        const dimmed=lowlight&&group.dataset.piece!==selected&&group.dataset.piece!=='body';
        gsap.to(group,{opacity:dimmed?0.38:1,duration:context.conditions?.reduced?0:.35});
      }
    });
    return ()=>media.revert();
  },{scope:ref,dependencies:[art,expanded,selected,detached],revertOnUpdate:true});

  useGSAP(()=>{
    if(kind!=='drone'||!art) return;
    const svg=ref.current!;
    const blades=Array.from(svg.querySelectorAll<SVGPathElement>('[data-blade]'));
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const centers=[[-76,-62],[76,-62],[-76,62],[76,62]];
    let phase=0, visible=false;
    const draw=()=>{
      blades.forEach((blade,index)=>{
        const [x,y]=centers[Math.floor(index/2)];
        const a=phase*(Math.floor(index/2)%2?1:-1)+(index%2)*Math.PI;
        const points=[[1.5,-2],[29,-1.7],[33,.6],[7,3],[1.5,2]].map(([u,v])=>project([x+u*Math.cos(a)-v*Math.sin(a),y+u*Math.sin(a)+v*Math.cos(a),48],art.P));
        blade.setAttribute('d',points.map(([px,py],i)=>`${i?'L':'M'}${px.toFixed(2)} ${py.toFixed(2)}`).join('')+'Z');
      });
    };
    const tick=(_:number,dt:number)=>{if(visible&&!document.hidden&&flying&&!reduced.matches){phase+=Math.min(dt,50)*.0018;draw();}};
    const observe=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible&&flying&&!reduced.matches)gsap.ticker.add(tick);else gsap.ticker.remove(tick);});
    observe.observe(svg); draw();
    const onPreference=()=>{if(reduced.matches)gsap.ticker.remove(tick);else if(visible&&flying)gsap.ticker.add(tick);};
    reduced.addEventListener('change',onPreference);
    return ()=>{observe.disconnect();gsap.ticker.remove(tick);reduced.removeEventListener('change',onPreference);};
  },{scope:ref,dependencies:[art,kind,flying],revertOnUpdate:true});

  return <svg ref={ref} className={`iso-svg anatomy-art anatomy-${kind}`} viewBox="0 0 900 680" role="img" aria-label={kind==='module'?'Концептуальная компоновка звёздного датчика: корпус, электроника, матрица и оптика':'Концептуальный промышленный квадрокоптер с модулем Aster на верхней площадке'}>
    <ellipse className="anatomy-ground" cx="450" cy="571" rx={kind==='module'?225:300} ry="42" />
    {!art&&<text x="450" y="340" textAnchor="middle" fill="currentColor" fontSize="18">{failed?'Схема временно недоступна':'Загрузка схемы'}</text>}
    <g data-assembly>{art?.items.map(item=><g key={item.name} data-piece={item.part} data-lift={item.lift} data-key={item.key} dangerouslySetInnerHTML={{__html:item.svg}} />)}</g>
    {kind==='drone'&&<g className="rotor-blades">{Array.from({length:8},(_,i)=><path key={i} data-blade={i} />)}</g>}
  </svg>;
}
