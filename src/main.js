import { createMotionController, createTicker } from './motion.js';
import { createPortfolioAudio } from './audio.js';
import { createCursorCat } from './cursor-cat.js';
import { createBlueprintScroll } from './blueprint-scroll.js';
import { conceptReference } from './concept-references.js';
import './blueprint-scroll.css';
import './concept-previews.css';

createPortfolioAudio({ button: document.querySelector('[data-sound-toggle]'), video: document.querySelector('.intro-video-player video'), opening: window.__paperOpening });

const experienceControls = document.querySelector('.experience-controls');
if (experienceControls) {
  const compactEffects = matchMedia('(max-width: 1050px)');
  const adaptEffects = () => { experienceControls.open = !compactEffects.matches; };
  adaptEffects();
  compactEffects.addEventListener('change', adaptEffects);
  experienceControls.addEventListener('keydown', event => {
    if (event.key === 'Escape' && compactEffects.matches && experienceControls.open) {
      experienceControls.open = false;
      experienceControls.querySelector('summary').focus();
    }
  });
  experienceControls.addEventListener('focusout', event => {
    if (compactEffects.matches && !experienceControls.contains(event.relatedTarget)) experienceControls.open = false;
  });
  document.addEventListener('pointerdown', event => {
    if (compactEffects.matches && !experienceControls.contains(event.target)) experienceControls.open = false;
  });
}

const email = 'caalnr13@gmail.com';

document.querySelectorAll('[data-year]').forEach(node => { node.textContent = new Date().getFullYear(); });

const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
if (menuButton && mobileNav) {
  const setMenu = open => {
    menuButton.setAttribute('aria-expanded', String(open));
    mobileNav.hidden = !open;
    menuButton.lastElementChild.textContent = open ? '−' : '＋';
  };
  menuButton.addEventListener('click', () => setMenu(mobileNav.hidden));
  mobileNav.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !mobileNav.hidden) { setMenu(false); menuButton.focus(); }
  });
  matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) setMenu(false); });
}

const filters = document.querySelectorAll('[data-filter]');
const projects = document.querySelectorAll('[data-category]');
filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
  let count = 0;
  projects.forEach(project => {
    project.hidden = button.dataset.filter !== 'all' && project.dataset.category !== button.dataset.filter;
    if (!project.hidden) count++;
  });
  document.querySelector('#filter-status').textContent = `${count} projects shown.`;
}));

document.querySelector('.copy-email')?.addEventListener('click', async () => {
  const status = document.querySelector('.copy-status');
  try {
    await navigator.clipboard.writeText(email);
    status.textContent = 'Email address copied.';
  } catch {
    status.textContent = `Select and copy the address above, or email ${email}.`;
  }
});

const contactForm = document.querySelector('#contact-form');
const referenceField = contactForm?.elements.reference;
const requestedReference = new URLSearchParams(window.location.search).get('concept');
if (referenceField && conceptReference(requestedReference)) referenceField.value = requestedReference;
const briefFallback = document.querySelector('#brief-fallback');
const briefText = document.querySelector('#brief-text');
function validateBrief(form) {
  const name = form.elements.name;
  const message = form.elements.message;
  [name, message].forEach(field => field.setCustomValidity(field.value.trim() ? '' : 'Please add a few words.'));
  return form.reportValidity();
}
function projectBrief(form) {
  const name = form.elements.name;
  const message = form.elements.message;
  const cms = form.elements.cms.checked ? '\nEditable site (CMS): Requested\n' : '';
  const reference = conceptReference(form.elements.reference?.value);
  const referenceLine = reference ? `\nReference concept: ${reference}\n` : '';
  const subject = `Website inquiry: ${form.elements.service.value}`;
  const body = `Hi Vince,\n\nI'm ${name.value.trim()}.\n\nI’m interested in: ${form.elements.service.value}\n${cms}${referenceLine}\n${message.value.trim()}\n\nThanks,\n${name.value.trim()}`;
  return { subject, body, text: `To: ${email}\nSubject: ${subject}\n\n${body}` };
}
contactForm?.addEventListener('submit', event => {
  event.preventDefault();
  if (!validateBrief(contactForm)) return;
  const { subject, body } = projectBrief(contactForm);
  window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  document.querySelector('.form-status').textContent = 'Your email draft is ready to open. Nothing has been sent. If your email app didn’t open, use “Copy project brief” and paste it into an email.';
});
document.querySelector('.copy-brief')?.addEventListener('click', async () => {
  if (!validateBrief(contactForm)) return;
  const { text } = projectBrief(contactForm);
  try {
    await navigator.clipboard.writeText(text);
    briefFallback.hidden = true;
    document.querySelector('.form-status').textContent = `Project brief copied. Paste it into an email to ${email}.`;
  } catch {
    briefFallback.hidden = false;
    briefText.value = text;
    briefText.focus();
    briefText.select();
    document.querySelector('.form-status').textContent = 'Copy the selected brief below and paste it into your email. Nothing has been sent.';
  }
});
document.querySelectorAll('#contact-form input, #contact-form textarea').forEach(field => {
  field.addEventListener('input', () => field.setCustomValidity(''));
});
contactForm?.addEventListener('input', () => {
  document.querySelector('.form-status').textContent = '';
  if (briefFallback && !briefFallback.hidden) briefText.value = projectBrief(contactForm).text;
});
// Leave native submission disabled until the local email composer is ready.
// A failed module load must not send the visitor's brief into a GET query string.
contactForm?.querySelectorAll('[data-brief-action]').forEach(button => { button.disabled = false; });
document.querySelector('[data-brief-unavailable]')?.setAttribute('hidden', '');

const container = document.querySelector('#scene');
if (container) {
  const motion = createMotionController(document.querySelectorAll('[data-motion-toggle]'), { play: 'Play portfolio motion', pause: 'Pause portfolio motion' });
  const disposeBlueprint = createBlueprintScroll(document.querySelector('.blueprint-section'), motion);
  const disposeTicker = createTicker(document.querySelector('.capability-strip'), motion);
  const loadScene = () => import('./scene.js').then(({ createScene }) => createScene(container, motion)).catch(() => {
    container.classList.remove('is-ready');
    container.querySelector('canvas')?.remove();
    container.dataset.renderMode = 'fallback';
  });
  const opening = window.__paperOpening;
  if (opening?.active) {
    if (!opening.preparing) import('./paper-opening.js').then(({ playPaperOpening }) => {
      if (opening.active) playPaperOpening(document.querySelector('.paper-opening-art'), opening);
    }).catch(() => opening.finish('fallback'));
  } else document.querySelector('.paper-opening')?.remove();
  // Release the short-lived paper renderer before allocating the ambient scene.
  (opening?.done || Promise.resolve()).then(() => {
    createCursorCat({ button: document.querySelector('[data-cat-toggle]'), motion, opening });
    if ('requestIdleCallback' in window) requestIdleCallback(loadScene, { timeout: 1500 });
    else setTimeout(loadScene, 250);
  });
  window.addEventListener('pagehide', event => { if (!event.persisted) { disposeBlueprint(); disposeTicker(); motion.dispose(); } });
}
