/** The app as it really looks, one window at a time, and a card that came from Mail. */
import { decisionCard, type DemoCapture } from './card';
import { targets } from './desk';
import { WORLD, at, fmt } from './time';

export function initGallery(): { select: (index: number) => void } {
  const tabs = [...document.querySelectorAll<HTMLButtonElement>('#gallery-tabs [role="tab"]')];
  const image = document.querySelector<HTMLImageElement>('#gallery-shot img');

  function select(index: number, focus = false) {
    const tab = tabs[index];
    if (!tab || !image) return;
    tabs.forEach((other) => {
      other.setAttribute('aria-selected', String(other === tab));
      other.tabIndex = other === tab ? 0 : -1;
    });
    image.src = tab.dataset.shotSrc ?? image.src;
    image.alt = tab.dataset.shotAlt ?? '';
    if (focus) tab.focus();
  }

  tabs.forEach((tab, index) => {
    tab.id = `gallery-tab-${index}`;
    tab.tabIndex = index === 0 ? 0 : -1;
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') { event.preventDefault(); select((index + 1) % tabs.length, true); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); select((index - 1 + tabs.length) % tabs.length, true); }
    });
  });

  const host = document.getElementById('mail-card');
  if (host) {
    const start = at(WORLD.thursday, 19);
    const mail: DemoCapture = {
      id: 'mail', shot: 'mail', source: 'mail', at: at(WORLD.today, 8, 12),
      title: "Your table at Rosa's is confirmed",
      summary: "A reservation for two at Rosa's on Thursday at 7.",
      read: `Rosa's. Your table is confirmed. ${fmt.shortWeekday(WORLD.thursday)}, 7:00 PM. Party of 2. 88 Orchard St.`,
      findings: [],
      actions: [{
        id: 'mail-event', kind: 'calendar_event', title: "Dinner at Rosa's", start, end: at(WORLD.thursday, 20, 30), place: '88 Orchard St',
        ticked: true, status: 'proposed', targets: targets(),
        findings: [
          { tone: 'ok', text: 'The date and time match the email', detail: `"${fmt.shortWeekday(WORLD.thursday)}, 7:00 PM"` },
          { tone: 'info', text: 'Also waiting in Foto at that time: "Dinner with Maya"', detail: "From \"Dinner with Maya at Rosa's\"" },
        ],
      }],
    };
    const card = decisionCard(mail, { fixed: true });
    card.el.id = 'mail-card';
    host.replaceWith(card.el);
  }

  return { select };
}
