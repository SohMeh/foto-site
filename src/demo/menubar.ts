/**
 * The site header is a Mac menu bar. Foto's own menu sits in it, with the items the real app's
 * menu has: what is waiting, Open Foto, Send to Memory and the Auto Sense switch.
 */
import { fmt } from './time';

export interface MenuBar {
  setWaiting: (count: number) => void;
}

export function initMenuBar(hooks: { onOpen: () => void; onMemory: () => void; onAutoSense: (on: boolean) => void }): MenuBar {
  const clock = document.getElementById('clock');
  const button = document.getElementById('tray-button');
  const menu = document.getElementById('tray-menu');
  const waiting = document.getElementById('tray-waiting');

  const tick = () => {
    if (!clock) return;
    const now = new Date();
    clock.textContent = fmt.clock(now);
    clock.setAttribute('datetime', now.toISOString());
  };
  tick();
  setInterval(tick, 15_000);

  const items = () => [...(menu?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? [])];
  const isOpen = () => !!menu && !menu.hidden;

  function open() {
    if (!menu || !button) return;
    menu.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    items()[0]?.focus();
  }
  function close(returnFocus = false) {
    if (!menu || !button || menu.hidden) return;
    menu.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    if (returnFocus) button.focus();
  }

  button?.addEventListener('click', () => (isOpen() ? close() : open()));
  document.addEventListener('pointerdown', (event) => {
    if (isOpen() && !menu?.contains(event.target as Node) && !button?.contains(event.target as Node)) close();
  });
  menu?.addEventListener('keydown', (event) => {
    const list = items();
    const index = list.indexOf(document.activeElement as HTMLElement);
    if (event.key === 'Escape') { event.preventDefault(); close(true); }
    if (event.key === 'ArrowDown') { event.preventDefault(); list[(index + 1) % list.length]?.focus(); }
    if (event.key === 'ArrowUp') { event.preventDefault(); list[(index - 1 + list.length) % list.length]?.focus(); }
    if (event.key === 'Tab') close();
  });
  menu?.addEventListener('click', (event) => {
    const item = (event.target as HTMLElement).closest<HTMLElement>('[data-tray], a');
    if (!item) return;
    switch (item.dataset.tray) {
      case 'open': hooks.onOpen(); break;
      case 'memory': hooks.onMemory(); break;
      case 'sense': {
        const on = item.getAttribute('aria-checked') !== 'true';
        item.setAttribute('aria-checked', String(on));
        button?.classList.toggle('paused', !on);
        hooks.onAutoSense(on);
        break;
      }
    }
    close();
  });

  return {
    setWaiting(count: number) {
      if (waiting) waiting.textContent = count ? `${count} waiting for you` : 'Nothing waiting';
      button?.classList.toggle('waiting', count > 0);
    },
  };
}
