import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

export default function NightEnvironment() {
  const video = useRef<HTMLVideoElement>(null);
  const visible = useRef(false);
  const manuallyPaused = useRef(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const element = video.current!;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      if (visible.current && !document.hidden && !reduced.matches && !manuallyPaused.current) {
        void element.play().catch(() => setPlaying(false));
      } else element.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
      update();
    }, { threshold: 0.15 });
    observer.observe(element);
    document.addEventListener('visibilitychange', update);
    reduced.addEventListener('change', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
      reduced.removeEventListener('change', update);
      element.pause();
    };
  }, []);

  const toggle = () => {
    const element = video.current;
    if (!element) return;
    manuallyPaused.current = !element.paused;
    if (element.paused) void element.play().catch(() => setPlaying(false));
    else element.pause();
  };

  return <figure className="night-environment">
    <div className="night-film">
      <video ref={video} muted loop playsInline preload="none" poster="/media/industrial-night-poster.webp" aria-label="Сгенерированная визуализация ночного мониторинга промышленной инфраструктуры" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}>
        <source src="/media/industrial-night.mp4" type="video/mp4" />
      </video>
      <button className="night-film-control" type="button" onClick={toggle} aria-label={playing ? 'Приостановить ночную сцену' : 'Воспроизвести ночную сцену'}>{playing ? <Pause size={17} /> : <Play size={17} />}</button>
    </div>
    <figcaption>Один из сценариев: ночной мониторинг инфраструктуры. Сцена сгенерирована, не является записью испытаний Aster.</figcaption>
  </figure>;
}
