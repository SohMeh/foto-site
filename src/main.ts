import './styles/tokens.css';
import './styles/app.css';
import './styles/site.css';
import { SITE } from './config';
import { icon, ICONS, type IconName } from './icons';
import { initChecks } from './demo/checks';
import { initDesk, type Desk } from './demo/desk';
import { initGallery } from './demo/gallery';
import { initMenuBar } from './demo/menubar';
import { initReads } from './demo/reads';

/** `<span class="i-download">` and `data-icon="scanText"` become inline icons. */
function placeIcons() {
  for (const node of document.querySelectorAll<HTMLElement>('[class^="i-"], [class*=" i-"]')) {
    const name = [...node.classList].find((item) => item.startsWith('i-'))?.slice(2).replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase());
    if (name && name in ICONS) node.outerHTML = icon(name as IconName, { size: 17 });
  }
  for (const node of document.querySelectorAll<HTMLElement>('[data-icon]')) {
    const name = node.dataset.icon as IconName;
    if (name in ICONS) node.innerHTML = icon(name, { size: 20, stroke: 1.8 });
  }
}

function placeWaitlist() {
  const button = document.getElementById('waitlist-button') as HTMLAnchorElement | null;
  const text = document.getElementById('waitlist-text');
  if (!button) return;
  if (SITE.waitlistUrl) {
    button.href = SITE.waitlistUrl;
    button.target = '_blank';
    button.rel = 'noopener';
    return;
  }
  // No form yet: say so plainly rather than offer a button that goes nowhere.
  button.href = SITE.releasesUrl;
  button.textContent = 'Follow new versions on GitHub';
  button.target = '_blank';
  button.rel = 'noopener';
  if (text) text.textContent = 'The waitlist opens here soon, for Foto plans, signing in with your Claude account, and new versions. Until then, each new version is posted on GitHub.';
}

function placeDownload() {
  const meta = document.getElementById('dl-meta');
  const button = document.getElementById('dl-button') as HTMLAnchorElement | null;
  const { version, href, sizeMb } = SITE.download;
  if (button) button.href = href;
  if (meta) meta.textContent = `Version ${version}, a ${sizeMb ? `${sizeMb} MB ` : ''}disk image for Macs with Apple silicon.`;
}

placeIcons();
placeWaitlist();
placeDownload();

const gallery = initGallery();
const openApp = () => {
  document.getElementById('app')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  gallery.select(0);
};
let desk: Desk | null = null;
const menubar = initMenuBar({
  onOpen: openApp,
  onMemory: () => {
    document.getElementById('top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    desk?.nudge();
  },
  onAutoSense: (on) => desk?.setAutoSense(on),
});
desk = initDesk({ onWaiting: (count) => menubar.setWaiting(count), onOpenApp: openApp });
initChecks(openApp);
initReads();
