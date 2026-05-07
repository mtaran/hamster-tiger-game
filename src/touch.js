// Wires on-screen buttons to the same key codes the input system
// already listens for (window keydown/keyup with e.code). Each button
// dispatches synthetic KeyboardEvents on press/release so the rest of
// the game doesn't need to know about touch input.

export function setupTouchControls() {
  for (const el of document.querySelectorAll('#touch button[data-key]')) {
    bind(el, el.dataset.key);
  }
}

function bind(el, code) {
  let active = false;
  const press = (e) => {
    e.preventDefault();
    if (active) return;
    active = true;
    window.dispatchEvent(new KeyboardEvent('keydown', { code }));
  };
  const release = (e) => {
    e.preventDefault();
    if (!active) return;
    active = false;
    window.dispatchEvent(new KeyboardEvent('keyup', { code }));
  };
  // Use Pointer Events for unified mouse/touch/pen handling.
  el.addEventListener('pointerdown', press);
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);
  el.addEventListener('pointerleave', release);
  // Suppress long-press menus and accidental selection.
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}
