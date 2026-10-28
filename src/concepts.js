const menu = document.querySelector('.concept-menu');
const nav = document.querySelector('#concept-nav');
const setMenu = open => { menu.setAttribute('aria-expanded', String(open)); menu.textContent = open ? 'Close −' : 'Menu ＋'; nav.classList.toggle('is-open', open); };
menu?.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
nav?.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') { setMenu(false); menu.focus(); } });
matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches && menu) setMenu(false); });

const filters = document.querySelectorAll('[data-concept-filter]');
filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  let count = 0;
  document.querySelectorAll('[data-concept-category]').forEach(item => {
    item.hidden = button.dataset.conceptFilter !== 'all' && item.dataset.conceptCategory !== button.dataset.conceptFilter;
    if (!item.hidden) count++;
  });
  document.querySelector('#concept-filter-status').textContent = `${count} ${document.body.classList.contains('forme') ? 'projects' : 'menu items'} shown.`;
}));

const studies = {
  courtyard: { title: 'The Courtyard House', image: 'architecture.jpg', alt: 'Modern glass-fronted residence surrounded by greenery', description: 'A residential design study built around the rhythm of everyday life. Open living spaces connect to a sheltered courtyard, with natural light and a considered relationship between indoors and out. This is an imagined project, illustrated with an architectural reference photograph.' },
  still: { title: 'Still House', image: 'interior.jpg', alt: 'Warm contemporary interior with natural materials', description: 'An interior study in warmth and restraint. A soft palette, tactile materials, and a few carefully chosen pieces leave room for the people who live here. This is an imagined project, illustrated with an interior reference photograph.' },
  retreat: { title: 'The Weekend Room', image: 'suite.jpg', alt: 'An airy room with thoughtful furnishings', description: 'A room for stepping out of the usual routine. Gentle light, comfortable proportions, and an unhurried atmosphere shape this interior concept. This is an imagined project, illustrated with a hospitality reference photograph.' },
};
const dialog = document.querySelector('.project-dialog');
document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => {
  const study = studies[button.dataset.project];
  document.querySelector('#project-dialog-title').textContent = study.title;
  document.querySelector('#project-dialog-description').textContent = study.description;
  const image = document.querySelector('#project-dialog-image');
  image.src = `/images/${study.image}`; image.alt = study.alt;
  dialog.showModal();
}));
document.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());
dialog?.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });

const rooms = {
  sea: { name: 'The Sea Room', label: 'The Sea Room', image: 'suite.jpg', specs: '2 guests · King bed · Private terrace', title: 'Wake up to a little more blue.', copy: 'An airy hideaway with a private terrace, soft linen, and space to watch the morning unfold. Made for two, and for doing very little.', alt: 'Light-filled suite illustrating the Sea Room concept' },
  garden: { name: 'The Garden Room', label: 'The Garden Room', image: 'interior.jpg', specs: '2 guests · Queen bed · Garden outlook', title: 'A quiet corner, wrapped in green.', copy: 'Warm natural textures, a tucked-away reading nook, and a garden just beyond the window. Your own small pause from the everyday.', alt: 'Warm natural interior illustrating the Garden Room concept' },
  house: { name: 'The Little House', label: 'The Little House', image: 'architecture.jpg', specs: '4 guests · Two bedrooms · Private courtyard', title: 'A little more room to settle in.', copy: 'Bring your favorite people. Two bedrooms, a shared living space, and an open courtyard make room for long conversations and slower mornings.', alt: 'A contemporary residence illustrating the Little House concept' },
};
function chooseRoom(key) {
  const room = rooms[key];
  document.querySelectorAll('[data-room]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.room === key)));
  for (const [id, text] of Object.entries({ 'room-image-label': room.label, 'room-specs': room.specs, 'room-title': room.title, 'room-copy': room.copy })) document.getElementById(id).textContent = text;
  const image = document.querySelector('#room-image'); image.src = `/images/${room.image}`; image.alt = room.alt;
  document.querySelector('#stay-room').value = key;
  document.querySelector('#stay-result').textContent = '';
}
document.querySelectorAll('[data-room]').forEach(button => button.addEventListener('click', () => chooseRoom(button.dataset.room)));
document.querySelector('#stay-room')?.addEventListener('change', event => chooseRoom(event.target.value));
const stayForm = document.querySelector('#stay-form');
if (stayForm) {
  const arrival = stayForm.elements.arrival, departure = stayForm.elements.departure;
  const dateString = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  arrival.min = dateString(new Date());
  const updateDates = () => {
    const nextDay = arrival.value ? new Date(`${arrival.value}T12:00:00`) : new Date();
    nextDay.setDate(nextDay.getDate() + 1); departure.min = dateString(nextDay);
    departure.setCustomValidity(departure.value && arrival.value && departure.value <= arrival.value ? 'Choose a departure after your arrival.' : '');
    document.querySelector('#stay-result').textContent = '';
  };
  arrival.addEventListener('change', updateDates); departure.addEventListener('change', updateDates); updateDates();
  stayForm.addEventListener('submit', event => {
    event.preventDefault(); updateDates();
    if (!stayForm.reportValidity()) return;
    const start = new Date(`${arrival.value}T12:00:00`), end = new Date(`${departure.value}T12:00:00`);
    const nights = Math.round((end - start) / 86400000);
    const format = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' });
    document.querySelector('#stay-result').textContent = `Your sample escape: ${nights} ${nights === 1 ? 'night' : 'nights'} in ${rooms[stayForm.elements.room.value].name}, ${format.format(start)} to ${format.format(end)}. This is a preview only; no booking has been made.`;
  });
}

const rituals = {
  classic: ['The House Flat White', 'Simple, balanced, and ready when you are. Some things don’t need a reinvention.'],
  sweet: ['Brown Sugar Oat Latte', 'A little caramel warmth, a smooth oat finish, and a good excuse to take five.'],
  fresh: ['Sunshine Soda', 'Bright calamansi, a little honey, and all the fizz. A small glass of good weather.'],
};
document.querySelectorAll('[data-mood]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-mood]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  const [name, description] = rituals[button.dataset.mood];
  document.querySelector('#ritual-name').textContent = name;
  document.querySelector('#ritual-description').textContent = description;
}));
