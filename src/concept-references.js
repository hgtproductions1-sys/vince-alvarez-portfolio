export const conceptReferences = Object.freeze({
  forme: 'FORME — Architecture & interiors',
  'slow-tide': 'Slow Tide — Coastal stays',
  'common-ground': 'Common Ground — Coffeehouse',
  'sora-reyes': 'Sora Reyes — Photography portfolio',
  'mara-solis': 'Mara Solis — Property agent',
  'foundry-build': 'Foundry Build — Construction',
});

export function conceptReference(value) {
  return Object.hasOwn(conceptReferences, value) ? conceptReferences[value] : '';
}
