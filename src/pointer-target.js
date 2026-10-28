export const controlSelector = 'a[href],button,summary,[role="button"],[role="link"],input,select,textarea';
export function pointerControl(node) {
  const control = node?.closest?.(controlSelector);
  if (!control || control.matches(':disabled') || control.closest('[inert],[hidden],[aria-disabled="true"]')) return null;
  return control;
}
