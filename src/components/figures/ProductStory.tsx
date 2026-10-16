import { useMemo, useState } from 'react';
import { ArrowUpRight, Check, Layers2, Minus, Pause, Play, Plus } from 'lucide-react';
import GooeyNav from '../reactbits/GooeyNav';
import AnimatedContent from '../reactbits/AnimatedContent';
import { AnatomyArt } from './AnatomyArt';
import { catalogue, rotatePoint, rollFromPair } from './model';

const nodes = [
  {label:'Оптика',part:'optics',title:'Сначала — свет звёзд',copy:'Оптический тракт собирает свет из доступного участка неба. Для него важны открытое поле зрения, чистота оптики и отсутствие сильной засветки.',fact:'Вход: изображение звёздного неба'},
  {label:'Матрица',part:'sensor',title:'Из света получается кадр',copy:'Светочувствительная матрица превращает оптическое изображение в данные. Звёзды в кадре становятся точками, взаимное расположение которых можно анализировать.',fact:'Далее: положения звёзд в изображении'},
  {label:'Обработка',part:'board',title:'Рисунок становится ориентиром',copy:'Наблюдаемые звёзды сопоставляются с каталогом. По соответствию вычисляется ориентация относительно звёздного неба. Для привязки к земной системе координат нужны точное время и синхронизация измерений с бортовой системой.',fact:'Выход: ориентация и время измерения'},
  {label:'Корпус',part:'body',title:'Прибор становится частью борта',copy:'Корпус и крепление задают положение датчика на платформе. Для интеграции нужно согласовать компоновку, питание, интерфейс и связь осей датчика с осями борта.',fact:'Интеграция: под конкретную платформу'},
];

export function ModuleStory() {
  const [expanded,setExpanded]=useState(true);
  const [selected,setSelected]=useState(0);
  const detail=nodes[selected];
  return <section className="module-story section-space" id="module">
    <div className="shell">
      <div className="section-heading"><AnimatedContent distance={24}><h2>Внутри Aster</h2></AnimatedContent><AnimatedContent distance={24} delay={.08}><p>Один компактный прибор связывает оптику, чувствительную матрицу и обработку изображения. Разберите его на узлы — и проследите путь от света до данных.</p></AnimatedContent></div>
      <div className="module-workbench">
        <figure className="anatomy-figure module-figure" data-ui="module-explorer">
          <div className="figure-top"><span>Модуль коррекции навигации</span><span className="live-state"><i />Концептуальная компоновка</span></div>
          <AnatomyArt kind="module" expanded={expanded} selected={expanded?detail.part:''} />
          <div className="figure-bottom"><span>{expanded?'Оптика · матрица · электроника':'Модуль в сборе'}</span><button className="figure-button" aria-pressed={expanded} onClick={()=>setExpanded(!expanded)}><Layers2 size={16}/>{expanded?'Собрать модуль':'Разобрать модуль'}</button></div>
        </figure>
        <div className="module-description">
          <GooeyNav items={nodes.map(({label})=>({label}))} frame={false} activeIndex={selected} onChange={index=>{setSelected(index);setExpanded(true);}} color="#dfff00" activeTextColor="#030625" size="sm" particleCount={7} spread={18}/>
          <div className="module-detail" key={selected}><h3>{detail.title}</h3><p>{detail.copy}</p><p className="node-fact"><Check size={16}/>{detail.fact}</p></div>
          <div className="module-annotation"><span>Не больше обещаний.<br/>Больше понимания.</span><p>Здесь показаны роли узлов, а не утверждённая конструкция. Размеры, масса и характеристики не заявлены: их нужно подтверждать разработкой и испытаниями.</p></div>
        </div>
      </div>
    </div>
  </section>;
}

const stages=[
  {label:'Наблюдение',title:'Увидеть звёзды',copy:'В поле зрения попадает участок неба. Прежде чем искать ориентацию, нужно обнаружить в изображении сами звёзды и определить их положения.'},
  {label:'Сопоставление',title:'Узнать рисунок',copy:'Взаимное расположение звёзд сравнивается с каталогом. Совпадение рисунка связывает наблюдаемое изображение с известным участком неба.'},
  {label:'Ориентация',title:'Определить поворот',copy:'По соответствию направлений получают ориентацию датчика. Для её привязки к земной системе координат нужны точное время и синхронизация. Здесь показан только поворот в плоскости: полная задача трёхмерна.'},
];

export function StarPrinciple() {
  const [angle,setAngle]=useState(14);
  const [stage,setStage]=useState(2);
  const observed=useMemo(()=>catalogue.map(star=>({...star,point:rotatePoint(star.x,star.y,angle)})),[angle]);
  const recovered=rollFromPair(observed[0].point,observed[1].point);
  const readout=`${recovered>=0?'+':''}${recovered.toFixed(1)}°`;
  const pattern=(points:{x:number;y:number}[])=>points.map(({x,y},i)=>`${i?'L':'M'}${x} ${y}`).join('');
  return <section className="principle-story section-space" id="principle">
    <div className="shell">
      <div className="section-heading"><AnimatedContent distance={24}><h2>Из света<br/>в ориентацию</h2></AnimatedContent><AnimatedContent distance={24} delay={.08}><p>Звёзды не передают навигационный сигнал. Их положение на небе само становится внешним ориентиром. Попробуйте повернуть наблюдаемый рисунок.</p></AnimatedContent></div>
      <div className="principle-layout">
        <div className="principle-console" data-ui="star-pattern-demonstration">
          <div className="console-header"><span>Поле зрения</span><span>Звёздный каталог</span></div>
          <svg className="star-instrument" viewBox="0 0 820 460" role="img" aria-label={`Синтетический рисунок звёзд повёрнут на ${angle} градусов; вычисленный по паре направлений поворот ${readout}`}>
            <defs><clipPath id="observed-window"><rect x="35" y="45" width="350" height="310" rx="110"/></clipPath><clipPath id="reference-window"><rect x="435" y="45" width="350" height="310" rx="110"/></clipPath></defs>
            <path className="instrument-case" d="M24 21H796L812 37V383L796 402H24L8 383V37Z"/>
            <rect className="instrument-screen" x="35" y="45" width="350" height="310" rx="110"/><rect className="instrument-screen" x="435" y="45" width="350" height="310" rx="110"/>
            {[24,796].flatMap(x=>[37,383].map(y=><g key={`${x}-${y}`}><circle className="instrument-screw" cx={x} cy={y} r="3.5"/><path className="instrument-slot" d={`M${x-2} ${y}h4`}/></g>))}
            <g clipPath="url(#observed-window)"><g transform="translate(210 200)">
              {Array.from({length:40},(_,i)=>{const p=rotatePoint(-150+(i*73)%300,-130+(i*97)%260,angle);return <circle key={i} className="background-star" cx={p[0]} cy={p[1]} r={i%4?1:1.6}/>;})}
              {stage>0&&<path className="detected-pattern" d={pattern(observed.map(({point})=>({x:point[0],y:point[1]})))}/>}
              {observed.map(star=><g key={star.id}><circle className="observed-star" cx={star.point[0]} cy={star.point[1]} r={star.size}/>{stage>0&&<circle className="star-detection" cx={star.point[0]} cy={star.point[1]} r="10"/>}</g>)}
            </g></g>
            <g clipPath="url(#reference-window)"><g transform="translate(610 200)">
              {stage>0&&<path className="catalogue-pattern" d={pattern(catalogue)}/>}
              {catalogue.map(star=><circle key={star.id} className="catalogue-star" cx={star.x} cy={star.y} r={star.size}/>)}
              {stage===2&&<g transform={`rotate(${angle})`} className="matched-rotation"><path className="detected-pattern" d={pattern(catalogue)}/>{catalogue.map(star=><circle key={star.id} className="star-detection" cx={star.x} cy={star.y} r="10"/>)}</g>}
            </g></g>
            {Array.from({length:9},(_,i)=><rect key={i} className="instrument-vent" x={326+i*20} y="378" width="10" height="3" rx="1.5"/>)}
            <circle className="instrument-light" cx="57" cy="378" r="3"/>
            <g className="physical-dial" transform="translate(410 410)"><circle className="dial-body" r="38"/><circle className="dial-face" r="31"/>{Array.from({length:24},(_,i)=><path key={i} transform={`rotate(${i*15})`} className="dial-tick" d={`M0 -${i%3?27:24}V-29`}/>)}<path className="dial-needle" transform={`rotate(${stage===2?angle:0})`} d="M0 10V-23"/><circle className="dial-hub" r="3"/></g>
          </svg>
          <div className="instrument-controls"><label htmlFor="sky-roll">Поворот поля зрения <output htmlFor="sky-roll">{angle>0?'+':''}{angle}°</output></label><input id="sky-roll" type="range" min="-35" max="35" step="1" value={angle} onChange={event=>setAngle(Number(event.target.value))} /><div className="range-ends"><span>−35°</span><span>+35°</span></div></div>
        </div>
        <div className="principle-steps"><div className="principle-tabs" role="group" aria-label="Этап определения ориентации">{stages.map(({label},index)=><button key={label} aria-pressed={stage===index} onClick={()=>setStage(index)}>{label}<span>{stage===index?<Minus size={16}/>:<Plus size={16}/>}</span></button>)}</div><div className="principle-copy"><h3>{stages[stage].title}</h3><p>{stages[stage].copy}</p></div><div className="roll-result"><span>{stage===2?'Вычисленный поворот':'Следующий шаг'}</span><output>{stage===2?readout:stage===0?'Найти звёзды':'Связать направления'}</output></div></div>
      </div>
      <p className="figure-disclaimer">Для привязки звёздной ориентации к земной системе координат нужны точное время, синхронизация измерений и согласование систем координат. В этой учебной модели показаны только синтетические звёзды и поворот в одной плоскости, а не точность или результат испытаний Aster. Ориентирование по Солнцу — отдельное направление исследований.</p>
    </div>
  </section>;
}

export function AircraftStory() {
  const [detached,setDetached]=useState(false);
  const [animated,setAnimated]=useState(true);
  return <section className="aircraft-story section-space" id="integration"><div className="shell">
    <div className="section-heading"><AnimatedContent distance={24}><h2>Свой ориентир<br/>на вашем борту</h2></AnimatedContent><AnimatedContent distance={24} delay={.08}><p>Aster не отдельный автопилот. Это модуль коррекции в составе бортовой навигации. Здесь показан один пример установки на гражданском БАС, а не ограничение круга платформ.</p></AnimatedContent></div>
    <div className="aircraft-layout"><div className="integration-copy"><div className="integration-point"><h3>Взгляд вверх</h3><p>Корпус, полезная нагрузка и винты не должны перекрывать поле зрения. При облачности возможен маршрут над облаками, если платформа и правила полёта это допускают. Поляризационные методы для частичной облачности пока исследуем.</p></div><div className="integration-point"><h3>Координаты и точное время</h3><p>Нужно знать положение датчика относительно осей платформы, обеспечить точное время для привязки к земной системе координат и синхронизировать измерения с бортовой системой.</p></div><div className="integration-point"><h3>Один из источников</h3><p>Aster дополняет GPS/ГЛОНАСС и инерциальную систему. Если небесные ориентиры недоступны, навигация опирается на другие источники. Дневной сценарий по Солнцу — предмет исследований.</p></div><a className="text-link" href="#contact">Обсудить вашу компоновку <ArrowUpRight size={18}/></a></div>
      <figure className="anatomy-figure aircraft-figure" data-ui="aircraft-integration"><div className="figure-top"><span>Пример: БАС + модуль Aster</span><button className="aircraft-pause" aria-label={animated?'Приостановить анимацию коптера':'Воспроизвести анимацию коптера'} onClick={()=>setAnimated(!animated)}>{animated?<Pause size={15}/>:<Play size={15}/>}</button></div><div className="aircraft-sky" aria-hidden="true">{Array.from({length:30},(_,i)=><i key={i} style={{left:`${8+(i*37)%84}%`,top:`${10+(i*13)%65}%`}}/>)}</div><AnatomyArt kind="drone" detached={detached} flying={animated}/><div className="figure-bottom"><span className="aircraft-state"><i/>{detached?'Крепление и модуль разнесены':'Пример установки на платформе'}</span><button className="figure-button" aria-pressed={detached} onClick={()=>setDetached(!detached)}>{detached?'Установить модуль':'Показать крепление'}<ArrowUpRight size={16}/></button></div></figure>
    </div><p className="figure-disclaimer">Условный макет установки на одной из возможных платформ. Геометрия коптера и движение винтов иллюстративны; это не схема монтажа и не модель лётных характеристик.</p>
  </div></section>;
}
