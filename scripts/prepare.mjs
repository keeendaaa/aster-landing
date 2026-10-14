import { mkdir, readFile, writeFile, copyFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';

await mkdir('src/components/reactbits', { recursive: true });
await mkdir('public/media', { recursive: true });
await mkdir('public/demo', { recursive: true });

for (const name of ['GooeyNav', 'AnimatedContent', 'Magnet']) {
  const response = await fetch(`https://reactbits.dev/r/${name}-TS-CSS.json`);
  if (!response.ok) throw new Error(`${name}: ${response.status}`);
  const item = await response.json();
  for (const file of item.files) {
    const basename = file.path.split('/').at(-1);
    try { await access(`src/components/reactbits/${basename}`); continue; } catch { /* First install only; preserve local accessibility adaptations. */ }
    await writeFile(`src/components/reactbits/${basename}`, file.content);
  }
}

const source = process.env.ASTER_DEMO_SOURCE || '/Users/kenda/starline-animation';
let demo = await readFile(resolve(source, 'index.html'), 'utf8');
const theme = await readFile('src/demo-theme.css', 'utf8');
demo = demo.replace('</head>', `<style>${theme}</style></head>`)
  .replace('<title>STARLINE — Ночная посадка</title>', '<title>Aster — демонстрация ночного сценария</title>')
  .replace('<body class="iso" data-theme="dark">', '<body class="iso" data-theme="light">')
  .replace('Светлая тема <span', 'Тёмная тема <span');
// The original is self-contained. Only its presentation is changed in this copy.
await writeFile('public/demo/index.html', demo);
await copyFile('/Users/kenda/Downloads/hf_20261014_210139_04e69240-5aa0-421a-b859-92f82622e3d5.mp4', 'public/media/aster-sky.mp4');
console.log('React Bits components, supplied video and independently themed demo are ready.');
