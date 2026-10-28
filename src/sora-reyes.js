import './concept-motion.js';

document.body.classList.add('is-enhanced');

const menu = document.querySelector('.concept-menu');
const navigation = document.querySelector('#concept-nav');
const setMenu = open => {
  menu.setAttribute('aria-expanded', String(open));
  menu.textContent = open ? 'Close −' : 'Menu +';
  navigation.classList.toggle('is-open', open);
};
if (menu && navigation) {
  menu.hidden = false;
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  navigation.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { setMenu(false); menu.focus(); }
  });
  document.addEventListener('pointerdown', event => {
    if (!event.target.closest('.s-header') && menu.getAttribute('aria-expanded') === 'true') setMenu(false);
  });
  matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) setMenu(false); });
}

const grid = document.querySelector('.s-photo-grid');
const filterControls = document.querySelector('.s-filters');
const filters = [...document.querySelectorAll('[data-photo-filter]')];
const photographs = [...document.querySelectorAll('[data-photo-category]')];
const filterStatus = document.querySelector('#photo-filter-status');
if (grid && filterControls) {
  filterControls.hidden = false;
  filters.forEach(control => control.addEventListener('click', () => {
    const category = control.dataset.photoFilter;
    filters.forEach(button => button.setAttribute('aria-pressed', String(button === control)));
    let count = 0;
    photographs.forEach(photograph => {
      photograph.hidden = category !== 'all' && photograph.dataset.photoCategory !== category;
      if (!photograph.hidden) count++;
    });
    grid.classList.toggle('is-filtered', category !== 'all');
    filterStatus.textContent = `${count} photographic studies shown${category === 'all' ? '.' : ` in ${category}.`}`;
  }));
}

const studies = {
  red: { title: 'A study in red', image: 'sora-still-life', alt: 'Sculptural red glass catching light on a quiet studio surface', description: 'An illustrative still life. Translucent red glass, a quiet surface, and the shape of the light around them.' },
  shore: { title: 'Somewhere quieter', image: 'sora-coast', alt: 'Still water and sculptural rocks at a quiet shoreline', description: 'An illustrative coastal study. A pause at the water’s edge, with room for the horizon and the texture of the shore.' },
  light: { title: 'Light, found', image: 'sora-city', alt: 'Sunlight creating geometric shadows across an urban wall', description: 'An illustrative architectural study. Afternoon light makes a second composition from the edges of an everyday facade.' },
  edge: { title: 'At the edge of red', image: 'sora-still-life', crop: 's-crop-red', alt: 'A detail crop showing the luminous edges of red glass', description: 'A detail crop from A study in red. A second look at the same photograph, following the edge of the glass.' },
  water: { title: 'A pause in the water', image: 'sora-coast', crop: 's-crop-coast', alt: 'A detail crop of water beside a quiet rocky shoreline', description: 'A detail crop from Somewhere quieter. The same image, brought closer to its surface and smaller rhythms.' },
  passing: { title: 'Passing through', image: 'sora-city', crop: 's-crop-city', alt: 'A detail crop of a geometric shadow crossing an architectural edge', description: 'A detail crop from Light, found. A tighter frame makes an architectural edge and its shadow the subject.' },
};
const dialog = document.querySelector('#photo-dialog');
const dialogImage = document.querySelector('#photo-dialog-image');
let lastTrigger = null;
if (typeof dialog?.showModal === 'function' && typeof dialog.close === 'function') {
  document.querySelectorAll('[data-photo]').forEach(trigger => {
    trigger.disabled = false;
    trigger.addEventListener('click', () => {
      const study = studies[trigger.dataset.photo];
      if (!study) return;
      lastTrigger = trigger;
      document.querySelector('#photo-dialog-title').textContent = study.title;
      document.querySelector('#photo-dialog-description').textContent = study.description;
      dialogImage.src = `/images/${study.image}.webp`;
      dialogImage.srcset = `/images/${study.image}-640.webp 640w, /images/${study.image}.webp 1280w`;
      dialogImage.sizes = '(max-width: 760px) 90vw, 900px';
      dialogImage.alt = study.alt;
      dialogImage.className = study.crop || '';
      dialogImage.parentElement.classList.toggle('is-detail', Boolean(study.crop));
      dialog.showModal();
    });
  });
  dialog.addEventListener('close', () => { if (lastTrigger?.isConnected && !lastTrigger.closest('[hidden]')) lastTrigger.focus({ preventScroll: true }); });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  window.addEventListener('pagehide', () => { if (dialog.open) dialog.close(); });
} else {
  document.querySelectorAll('[data-photo]').forEach(trigger => {
    trigger.disabled = true;
    trigger.querySelector('.s-photo-open').hidden = true;
  });
  const supportNote = document.createElement('p');
  supportNote.className = 's-image-note';
  supportNote.textContent = 'Your browser does not support the enlarged photograph window. The photographs and their captions remain available below.';
  grid.before(supportNote);
}
