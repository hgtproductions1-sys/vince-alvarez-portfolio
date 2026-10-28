// The existing accessible mood buttons update the copy; the matching local photograph
// makes the suggestion tangible without adding another animation loop or audio source.
const photograph = document.querySelector('[data-ritual-photo]');
const suggestions = {
  classic: ['/images/flat-white.webp', 'A flat white in a speckled ceramic cup on a wooden table'],
  sweet: ['/images/oat-latte.webp', 'Brown sugar oat latte in a warm ceramic mug'],
  fresh: ['/images/citrus-soda.webp', 'Calamansi and honey soda with fresh citrus and ice'],
};

document.querySelectorAll('[data-mood]').forEach(button => {
  button.addEventListener('click', () => {
    const suggestion = suggestions[button.dataset.mood];
    if (!photograph || !suggestion) return;
    photograph.src = suggestion[0];
    photograph.alt = suggestion[1];
  });
});
