import './concept-motion.js';

// The ordinary document contains every project. JavaScript only adds filters,
// modal views, and a local sample brief; it never sends or stores visitor data.
document.body.classList.add('is-enhanced');
const menu = document.querySelector('.foundry-menu');
const nav = document.querySelector('#foundry-nav');
const setMenu = open => {
  menu.setAttribute('aria-expanded', String(open));
  menu.textContent = open ? 'Close −' : 'Menu +';
  nav.classList.toggle('is-open', open);
};
menu.hidden = false;
menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
nav.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { setMenu(false); menu.focus(); }
});
matchMedia('(min-width:761px)').addEventListener('change', event => { if (event.matches) setMenu(false); });

const filterGroup = document.querySelector('.project-filters');
const projects = [...document.querySelectorAll('[data-foundry-category]')];
filterGroup.hidden = false;
filterGroup.addEventListener('click', event => {
  const button = event.target.closest('[data-foundry-filter]');
  if (!button) return;
  filterGroup.querySelectorAll('button').forEach(control => control.setAttribute('aria-pressed', String(control === button)));
  projects.forEach(project => { project.hidden = button.dataset.foundryFilter !== 'all' && project.dataset.foundryCategory !== button.dataset.foundryFilter; });
  const count = projects.filter(project => !project.hidden).length;
  document.querySelector('#foundry-filter-status').textContent = `${count} project ${count === 1 ? 'study' : 'studies'} shown.`;
});

const studies = {
  northline: { title: 'Northline Workshop', image: 'foundry-frame.webp', alt: 'Illustrative exposed steel structure for Northline Workshop', description: 'A fictional commercial workshop study. The structural frame leaves an open working floor, while the site layout keeps service access distinct from the everyday circulation of people. This study demonstrates how a contractor website can explain scope and construction decisions.', scope: 'Structure & envelope', focus: 'A flexible working floor', type: 'Commercial construction' },
  cedar: { title: 'Cedar House Extension', image: 'foundry-foundation.webp', alt: 'Illustrative concrete foundation for Cedar House Extension', description: 'A fictional residential extension study. The work starts with the relationship between the existing house, the site, and the additional rooms. Groundworks and a clearly defined connection between old and new make the project easier to understand.', scope: 'Groundworks & extension', focus: 'Connecting old and new spaces', type: 'Residential construction' },
  yard: { title: 'South Yard Fit-out', image: 'foundry-finish.webp', alt: 'Illustrative finished workshop exterior for the South Yard Fit-out study', description: 'A fictional commercial fit-out study. A simple industrial shell becomes a practical workplace through clear access, durable finishes, and considered daylight. The final walkthrough checks the details against the agreed scope.', scope: 'Interior fit-out', focus: 'Practical finishes & clear access', type: 'Fit-out or refurbishment' },
};
const dialog = document.querySelector('#foundry-project-dialog');
let dialogTrigger = null;
let currentStudy = null;
let dialogDestination = null;
const canDialog = typeof dialog.showModal === 'function' && typeof dialog.close === 'function';
document.querySelectorAll('[data-foundry-project]').forEach(trigger => {
  trigger.addEventListener('click', event => {
    const study = studies[trigger.dataset.foundryProject];
    if (!study || !canDialog) return;
    event.preventDefault();
    dialogTrigger = trigger;
    dialogDestination = null;
    currentStudy = study;
    document.querySelector('#foundry-dialog-title').textContent = study.title;
    document.querySelector('#foundry-dialog-description').textContent = study.description;
    const image = document.querySelector('#foundry-dialog-image');
    image.src = `/images/${study.image}`;
    image.alt = study.alt;
    const facts = document.querySelector('#foundry-dialog-facts');
    facts.replaceChildren();
    for (const [label, value] of [['Scope', study.scope], ['Design focus', study.focus]]) {
      const group = document.createElement('div');
      const term = document.createElement('dt');
      const detail = document.createElement('dd');
      term.textContent = label;
      detail.textContent = value;
      group.append(term, detail);
      facts.append(group);
    }
    dialog.showModal();
    dialog.querySelector('.dialog-close').focus();
  });
});
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
dialog.addEventListener('close', () => {
  if (dialogDestination) { dialogDestination.focus({ preventScroll: true }); dialogDestination = null; }
  else if (dialogTrigger?.isConnected && !dialogTrigger.closest('[hidden]')) dialogTrigger.focus({ preventScroll: true });
});
document.querySelector('#foundry-dialog-brief').addEventListener('click', () => {
  if (currentStudy) document.querySelector('#foundry-type').value = currentStudy.type;
  dialogDestination = document.querySelector('#foundry-name');
  dialog.close();
  document.querySelector('#brief').scrollIntoView({ behavior: document.documentElement.dataset.motionPaused === 'true' ? 'instant' : 'auto', block: 'start' });
});

const form = document.querySelector('#foundry-brief-form');
const preview = document.querySelector('#foundry-brief-preview');
const briefText = document.querySelector('#foundry-brief-text');
const status = document.querySelector('#foundry-brief-status');
const note = document.querySelector('#foundry-js-note');
document.querySelector('#foundry-preview-button').disabled = false;
note.textContent = 'Sample preview only. Nothing is sent or saved to a server.';
const prepareBrief = () => {
  const fields = form.elements;
  return `SAMPLE PROJECT BRIEF — FOUNDRY BUILD\nFictional concept. This brief has not been sent.\n\nName: ${fields.name.value.trim()}\nProject type: ${fields.type.value}\nGeneral location: ${fields.location.value.trim() || 'Not provided'}\n\nScope and timing:\n${fields.scope.value.trim()}\n\nTo discuss a website with Vince, use the portfolio inquiry link.`;
};
form.addEventListener('submit', event => {
  event.preventDefault();
  for (const field of [form.elements.name, form.elements.scope]) field.setCustomValidity(field.value.trim() ? '' : 'Please add a few words.');
  if (!form.reportValidity()) return;
  briefText.value = prepareBrief();
  preview.hidden = false;
  status.textContent = 'Your local preview is ready. Nothing has been sent.';
  briefText.focus();
});
form.addEventListener('input', event => {
  if ('setCustomValidity' in event.target) event.target.setCustomValidity('');
  if (!preview.hidden) briefText.value = prepareBrief();
  status.textContent = '';
});
document.querySelector('#foundry-copy-brief').addEventListener('click', async () => {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(briefText.value);
    status.textContent = 'Sample brief copied. Nothing has been sent.';
  } catch {
    briefText.focus();
    briefText.select();
    status.textContent = 'Select and copy the sample brief above. Nothing has been sent.';
  }
});
