import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUpRight, Menu, Pause, Play, X } from 'lucide-react';
import ContactForm from './components/ContactForm';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import GooeyNav from './components/reactbits/GooeyNav';
import AnimatedContent from './components/reactbits/AnimatedContent';
import Magnet from './components/reactbits/Magnet';
import { ModuleStory, StarPrinciple, AircraftStory } from './components/figures/ProductStory';
import NightEnvironment from './components/NightEnvironment';
import FAQs from '@/components/ui/faqs-component';
import '@fontsource-variable/manrope';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const navItems = [
  { label: 'Технология', href: '#technology' },
  { label: 'В действии', href: '#demo' },
  { label: 'Применение', href: '#applications' },
];

function Mark({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 628 439" fill="currentColor" aria-hidden="true"><use href="/aster-mark.svg#aster-mark" /></svg>;
}

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return <AnimatedContent className={className} distance={24} duration={0.85} delay={delay} threshold={0.08}>{children}</AnimatedContent>;
}

function PrimaryLink({ children, href, dark = false }: { children: ReactNode; href: string; dark?: boolean }) {
  return <Magnet padding={24} magnetStrength={5} maxOffset={5}><a className={`button ${dark ? 'button-dark' : ''}`} href={href}>{children}<ArrowUpRight size={17} aria-hidden="true" /></a></Magnet>;
}

const scenarios = [
  { label: 'Подлёт', time: 2, text: 'Промышленный БПЛА приближается к объекту ночного мониторинга.' },
  { label: 'Звёздный ориентир', time: 7, text: 'Наблюдение звёздного неба позволяет определить ориентацию аппарата.' },
  { label: 'Сближение', time: 12, text: 'Бортовая система использует результат вместе с другими навигационными данными.' },
];

type DemoWindow = Window & { starline?: { seek: (time: number) => void; play: () => void; pause: () => void; state: () => { t: number; phase: number } } };

function App() {
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const iframe = useRef<HTMLIFrameElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(true);
  const [activeScenario, setActiveScenario] = useState(1);

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const context = gsap.context(() => {
        gsap.from('.hero-enter', { y: 22, opacity: 0, stagger: 0.11, duration: 1, ease: 'power3.out', clearProps: 'all' });
        gsap.to('.hero-media', { y: 65, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });
        gsap.from('.footer-wordmark', { yPercent: 28, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: 1 } });
      }, root);
      return () => context.revert();
    });
    return () => media.revert();
  }, { scope: root });

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyMotionPreference = () => {
      if (reduced.matches) { video.current?.pause(); setVideoPlaying(false); }
    };
    applyMotionPreference();
    reduced.addEventListener('change', applyMotionPreference);
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) video.current?.pause();
      else if (!reduced.matches && videoPlaying) void video.current?.play().catch(() => setVideoPlaying(false));
    });
    if (video.current) observer.observe(video.current);
    return () => { observer.disconnect(); reduced.removeEventListener('change', applyMotionPreference); };
  }, [videoPlaying]);

  const selectScenario = (index: number) => {
    setActiveScenario(index);
    (iframe.current?.contentWindow as DemoWindow | null)?.starline?.seek(scenarios[index].time);
  };


  return <div ref={root}>
    <a className="skip-link" href="#technology">К содержимому</a>
    <section className="hero" id="top" aria-label="Aster — звёздное ориентирование">
      <div className="hero-media"><video ref={video} autoPlay muted loop playsInline preload="auto" poster="/media/sky-poster.webp" aria-hidden="true"><source src="/media/aster-sky.mp4" type="video/mp4" /></video></div>
      <header className="header shell">
        <a className="wordmark" href="#top" aria-label="Aster — на главную"><Mark />aster</a>
        <div className="desktop-nav"><GooeyNav items={navItems} frame={false} color="#dfff00" activeTextColor="#080d26" particleCount={9} spread={22} animationTime={450} size="sm" /></div>
        <a className="header-contact" href="#contact">Связаться <ArrowUpRight size={15} aria-hidden="true" /></a>
        <button className="menu-button" aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      </header>
      {menuOpen && <nav id="mobile-menu" className="mobile-nav">{[...navItems, { label: 'Связаться', href: '#contact' }].map(item => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}<ArrowUpRight size={18} /></a>)}</nav>}
      <div className="hero-copy">
        <h1 className="hero-enter">Звёзды задают<br />ориентацию</h1>
        <p className="hero-enter">Компактный модуль звёздного ориентирования<br className="desktop-break" /> для промышленных БПЛА. Когда спутникового сигнала нет.</p>
        <div className="hero-enter hero-action"><PrimaryLink href="#contact">Обсудить интеграцию</PrimaryLink></div>
      </div>
      <div className="hero-bottom shell"><a href="#technology" className="explore-link"><ArrowDown size={17} /> Прокрутите вниз</a><button className="video-toggle" onClick={() => { if (!video.current) return; if (video.current.paused) { void video.current.play().then(() => setVideoPlaying(true)).catch(() => setVideoPlaying(false)); } else { video.current.pause(); setVideoPlaying(false); } }} aria-label={videoPlaying ? 'Приостановить фоновое видео' : 'Воспроизвести фоновое видео'}>{videoPlaying ? <Pause size={14} /> : <Play size={14} />}<span>{videoPlaying ? 'Пауза' : 'Воспроизвести'}</span></button></div>
    </section>

    <main>
      <section id="technology" className="site-overview shell section-space">
        <div className="section-heading"><Reveal><h2>Ориентир вне<br />спутниковой сети</h2></Reveal><Reveal delay={0.08}><p>Когда GPS/ГЛОНАСС недоступны, у навигационной системы остаётся задача: понимать ориентацию аппарата. Aster добавляет внешний оптический ориентир — видимое звёздное небо.</p></Reveal></div>
        <div className="overview-facts"><Reveal><h3>Что определяет</h3><p>Ориентацию датчика относительно звёздного неба, а не абсолютные координаты аппарата.</p></Reveal><Reveal delay={.08}><h3>Как используется</h3><p>Как дополнительный источник данных для бортовой навигационной системы промышленного БПЛА.</p></Reveal><Reveal delay={.16}><h3>В каких условиях</h3><p>Ночью, при видимых звёздах и открытом поле зрения. Не всепогодная замена спутниковой навигации.</p></Reveal></div>
      </section>

      <ModuleStory />
      <StarPrinciple />
      <AircraftStory />

      <section id="demo" className="demo-section mission-section section-space">
        <div className="shell"><div className="section-heading"><Reveal><h2>Одна ночь.<br />Несколько систем.</h2></Reveal><Reveal delay={0.08}><p>Теперь соберём всё в один сценарий. В макете звёздное ориентирование появляется при подлёте к объекту, а локальное оптическое наведение решает отдельную задачу сближения.</p></Reveal></div>
          <div className="demo-layout">
            <div className="scenario-index" role="group" aria-label="Выберите момент демонстрации">{scenarios.map((scenario, index) => <button key={scenario.label} className={activeScenario === index ? 'scenario active' : 'scenario'} aria-pressed={activeScenario === index} onClick={() => selectScenario(index)}><span className="scenario-title">{scenario.label}<ArrowUpRight size={20} /></span><span className="scenario-copy">{scenario.text}</span></button>)}<a href="/demo/index.html" target="_blank" rel="noreferrer" className="standalone-link">Открыть отдельно <ArrowUpRight size={16} /></a></div>
            <div className="demo-frame" data-ui="concept-demo"><iframe ref={iframe} src="/demo/index.html" title="Aster: интерактивный концептуальный макет ночного полёта" loading="lazy" onLoad={() => { const frame=iframe.current?.contentWindow as DemoWindow|null; if(frame?.document.body) frame.document.body.dataset.theme='dark'; frame?.starline?.seek(7); }} /></div>
          </div>
          <p className="demo-caption">Концептуальная визуализация, не запись испытаний. Финальное сближение и посадка подразумевают локальное оптическое наведение. Звёзды и масштаб условные.</p>
          <div className="mission-note"><Reveal><h3>Звёзды — для ориентации</h3><p>Датчик связывает направление своего взгляда со звёздным небом. Его результат используется в составе общей навигационной системы.</p></Reveal><Reveal delay={.08}><h3>Локальное наведение — для сближения</h3><p>Определение расстояния до объекта, обход препятствий и посадка не следуют из одного звёздного измерения. Для них нужны отдельные средства.</p></Reveal></div>
          <div className="mission-gallery"><figure><img src="/media/night-scene.webp" width="1200" height="1000" loading="lazy" alt="Концептуальный макет полёта между опорами промышленной инфраструктуры"/><figcaption>Объект наблюдения: условный линейный участок</figcaption></figure><figure><img src="/media/match.webp" width="1100" height="760" loading="lazy" alt="Звёздный рисунок и направление датчика на интерактивном макете"/><figcaption>Внешний ориентир: звёздный рисунок</figcaption></figure><figure><img src="/media/orientation.webp" width="800" height="760" loading="lazy" alt="Фрагмент коптера в концептуальном сценарии сближения"/><figcaption>Локальная задача: положение у объекта</figcaption></figure></div>
        </div>
      </section>

      <section id="applications" className="applications shell section-space">
        <Reveal><h2>Для ночных задач</h2></Reveal>
        <Reveal><NightEnvironment /></Reveal>
        <div className="application-layout"><Reveal className="application-image"><img src="/figures/module-detail.webp" alt="Концептуальная компоновка Aster: отдельные оптический и электронный узлы" width="1100" height="900" loading="lazy" /><span>Компоновка под вашу платформу</span></Reveal><div className="application-content"><Reveal><p className="large-statement">Для промышленных БПЛА, которым нужен дополнительный источник ориентации при ночном мониторинге.</p></Reveal><div className="use-case-list"><Reveal delay={.08}><h3>Линейные объекты</h3><p>Возможный контекст: протяжённые участки промышленной инфраструктуры под открытым небом.</p></Reveal><Reveal delay={.16}><h3>Промышленные площадки</h3><p>При выборе сценария важно заранее оценить обзор неба, местную засветку и условия полёта.</p></Reveal><Reveal delay={.2}><h3>Проверка интеграции</h3><p>Начать стоит с требований к ориентации, компоновки аппарата и способов обмена с бортовой системой. Затем — проверять решение в заданных условиях.</p></Reveal></div><Reveal delay={.24}><a className="text-link" href="#contact">Рассмотреть вашу платформу <ArrowUpRight size={18} /></a></Reveal></div></div>
      </section>

      <FAQs />

      <section id="contact" className="contact-section shell section-space"><div className="contact-panel"><div className="contact-copy"><Reveal><Mark className="contact-mark" /><h2>Ваш борт.<br />Наш ориентир.</h2><p>Расскажите о платформе и задаче. Заявка поступит команде Aster для обсуждения интеграции.</p></Reveal></div><ContactForm /></div></section>
    </main>

    <footer className="footer"><div className="shell"><div className="footer-top"><p>Точка опоры —<br />звёздное небо.</p><div><a href="#technology">Технология</a><a href="#demo">Демонстрация</a><a href="#contact">Интеграция</a></div><a href="#top" className="back-top" aria-label="В начало страницы"><ArrowUpRight size={24} /></a></div><div className="footer-logo-wrap"><div className="footer-wordmark"><Mark />aster</div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Aster</span><span>Звёздное ориентирование для БПЛА</span><span>Концепция продукта</span></div></div></footer>
  </div>;
}

export default App;
