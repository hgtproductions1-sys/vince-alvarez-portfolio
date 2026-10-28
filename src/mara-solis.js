import './concept-motion.js';

document.body.classList.add('mara-enhanced');

const menuButton = document.querySelector('.mara-menu');
const navigation = document.querySelector('#mara-nav');
const setMenu = open => {
  menuButton.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
  menuButton.lastElementChild.textContent = open ? '−' : '＋';
};
menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
navigation.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') { setMenu(false); menuButton.focus(); }
});
matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) setMenu(false); });

const homes = {
  courtyard: { title: 'The Courtyard House', type: 'House', price: 6800000, bedrooms: '3', area: '168 m²', image: 'mara-courtyard', alt: 'Illustrative contemporary home opening onto a private green courtyard', copy: 'An imagined three-bedroom home with open shared spaces, a sheltered entrance, and a courtyard that brings the garden into everyday life. The plan makes room for gathering together and finding a quiet corner.' },
  residence: { title: 'The Lightwell Residence', type: 'Condo', price: 4200000, bedrooms: '2', area: '72 m²', image: 'mara-residence', alt: 'Illustrative bright apartment interior with relaxed seating and natural light', copy: 'An imagined two-bedroom apartment with a compact, practical layout and generous daylight. A comfortable living space connects daily routines, with room for a little work, a little rest, and a slow morning.' },
  garden: { title: 'The Garden Row', type: 'House', price: 8500000, bedrooms: '4', area: '210 m²', image: 'mara-garden', alt: 'Illustrative leafy residential pathway representing the Garden Row neighborhood', copy: 'An imagined four-bedroom home in a leafy residential setting. This neighborhood study explores a green walk home, extra room for family routines, and a shared space that can change with the day. The photograph illustrates the surroundings rather than the house itself.' },
};
const currency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });
const typeButtons = [...document.querySelectorAll('[data-home-type]')];
const budgetSelect = document.querySelector('#mara-budget');
const propertyCards = [...document.querySelectorAll('[data-home]')];
let selectedType = 'all';
function filterHomes() {
  const limit = budgetSelect.value === 'all' ? Infinity : Number(budgetSelect.value);
  let count = 0;
  propertyCards.forEach(card => {
    card.hidden = (selectedType !== 'all' && card.dataset.type !== selectedType) || Number(card.dataset.price) > limit;
    if (!card.hidden) count++;
  });
  document.querySelector('#mara-filter-status').textContent = `${count} sample ${count === 1 ? 'home' : 'homes'} shown. No real listings or availability.`;
  document.querySelector('#mara-empty').hidden = count !== 0;
}
typeButtons.forEach(button => button.addEventListener('click', () => {
  selectedType = button.dataset.homeType;
  typeButtons.forEach(control => control.setAttribute('aria-pressed', String(control === button)));
  filterHomes();
}));
budgetSelect.addEventListener('change', filterHomes);

const dialog = document.querySelector('#mara-property-dialog');
const requestForm = document.querySelector('#mara-viewing-form');
const propertySelect = requestForm.elements.property;
let returnFocus = null;
let restoreFocus = true;
let currentHome = 'courtyard';
function fillProperty(id) {
  const home = homes[id];
  if (!home) return false;
  currentHome = id;
  document.querySelector('#mara-dialog-title').textContent = home.title;
  document.querySelector('#mara-dialog-kind').textContent = `${home.type} · Sample sale`;
  document.querySelector('#mara-dialog-copy').textContent = home.copy;
  document.querySelector('#mara-dialog-price').textContent = `Sample price: ${currency.format(home.price)}`;
  const image = document.querySelector('#mara-dialog-image');
  image.src = `/images/${home.image}.webp`;
  image.srcset = `/images/${home.image}-640.webp 640w, /images/${home.image}.webp 1280w`;
  image.sizes = '(max-width: 760px) 92vw, 800px';
  image.alt = home.alt;
  const facts = document.querySelectorAll('#mara-dialog-facts dd');
  facts[0].textContent = home.bedrooms;
  facts[1].textContent = home.area;
  return true;
}
const propertyButtons = [...document.querySelectorAll('[data-open-home]')];
const canDialog = typeof dialog.showModal === 'function' && typeof dialog.close === 'function';
if (canDialog) {
  propertyButtons.forEach(button => {
    button.disabled = false;
    button.addEventListener('click', () => {
      if (!fillProperty(button.dataset.openHome)) return;
      returnFocus = button; restoreFocus = true;
      dialog.showModal();
    });
  });
  dialog.addEventListener('close', () => { if (restoreFocus && returnFocus?.isConnected && !returnFocus.closest('[hidden]')) returnFocus.focus({ preventScroll: true }); });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  document.querySelector('#mara-dialog-request').addEventListener('click', () => {
    restoreFocus = false;
    propertySelect.value = currentHome;
    document.querySelector('#mara-request-result').hidden = true;
    dialog.close();
    document.querySelector('#viewing').scrollIntoView({ block: 'start', behavior: 'instant' });
    requestForm.elements.viewer.focus({ preventScroll: true });
  });
} else {
  propertyButtons.forEach(button => { button.disabled = true; button.hidden = true; });
  const supportNote = document.createElement('p');
  supportNote.className = 'mara-filter-status';
  supportNote.textContent = 'Your browser does not support the property detail window. Read the sample home summaries below, or try the local viewing-request preview.';
  document.querySelector('.mara-home-grid').before(supportNote);
}

const dateInput = requestForm.elements.day;
const today = new Date();
const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
dateInput.min = localToday;
requestForm.querySelector('button[type="submit"]').disabled = false;
requestForm.addEventListener('input', event => {
  event.target.setCustomValidity?.('');
  document.querySelector('#mara-request-result').hidden = true;
});
requestForm.addEventListener('submit', event => {
  event.preventDefault();
  const viewer = requestForm.elements.viewer;
  viewer.setCustomValidity(viewer.value.trim() ? '' : 'Please add your first name.');
  dateInput.setCustomValidity(dateInput.value && dateInput.value >= localToday ? '' : 'Choose today or a future day.');
  if (!requestForm.reportValidity()) return;
  const home = homes[propertySelect.value];
  if (!home) return;
  const [year, month, day] = dateInput.value.split('-').map(Number);
  const requestedDay = new Intl.DateTimeFormat('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(year, month - 1, day));
  const result = document.querySelector('#mara-request-result');
  result.textContent = `Sample request preview: ${viewer.value.trim()} would like a closer look at ${home.title} on ${requestedDay}, in the ${requestForm.elements.time.value.toLowerCase()}. This preview stays on your screen. Nothing was sent, saved, or booked.`;
  result.hidden = false;
});
