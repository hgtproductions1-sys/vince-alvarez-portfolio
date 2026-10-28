import { createMotionController } from './motion.js';
import { mountConceptStory } from './concept-story.js';
import { mountConceptEntrances } from './concept-entrance.js';
import './concept-motion.css';

const container = document.querySelector('[data-concept-scene]');
if (container) {
  const button = document.querySelector('[data-concept-motion]');
  const motion = createMotionController(button, { play: 'Play background and scroll motion', pause: 'Pause background and scroll motion' });
  const stories = [...document.querySelectorAll('[data-concept-story]')].map(section => mountConceptStory(section, motion));
  const entrances = mountConceptEntrances(document.querySelector('main'), motion);
  let disposed = false;
  const load = () => import('./scene.js').then(({ createScene }) => { if (!disposed) createScene(container, motion); }).catch(() => {
    container.classList.remove('is-ready');
    container.querySelector('canvas')?.remove();
    container.dataset.renderMode = 'fallback';
  });
  if ('requestIdleCallback' in window) requestIdleCallback(load, { timeout: 1500 });
  else setTimeout(load, 250);
  window.addEventListener('pagehide', event => {
    if (!event.persisted) { disposed = true; stories.forEach(cleanup => cleanup()); entrances(); motion.dispose(); }
  });
}
