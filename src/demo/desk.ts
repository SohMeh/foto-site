/**
 * The hero: a pretend Mac desktop. Drag across something, the way ⌘⇧4 works, and Foto answers at
 * the top right exactly as the app does: a reading pill, then a card, or a quiet line.
 */
import { decisionCard, isCalendar, quietPill, readingPill, settled, type CardHandle, type DemoCapture, type Finding, type Target } from './card';
import { miniCopy, narrow, reducedMotion, wait } from './dom';
import { chatHTML, flyerHTML, memeHTML } from './shots';
import { WORLD, at, fmt } from './time';

type Shot = 'flyer' | 'chat' | 'meme';

export function targets(): Target[] {
  return [
    { key: 'personal', name: 'Personal (Google)', calendar: 'Personal', color: '#3F8E5A', selected: true },
    { key: 'work', name: 'Work (Google)', calendar: 'Work', color: '#8E63CE', selected: false },
    { key: 'home', name: 'Home', calendar: 'Home', color: '#1BADF8', selected: false },
  ];
}

const MAX_CARDS = 3;
let sequence = 0;

/** What Foto would make of each thing on the desktop. */
function understand(shot: Shot, earlier: DemoCapture[], now: Date): DemoCapture | null {
  if (shot === 'meme') return null;
  sequence += 1;
  const id = `${shot}-${sequence}`;
  if (shot === 'flyer') {
    const start = at(WORLD.friday, 19);
    const end = at(WORLD.friday, 21);
    const capture: DemoCapture = {
      id, shot, source: 'screenshot', at: now,
      title: 'Ceramics Night at The Clay Room',
      summary: "A beginners' wheel-throwing evening on Friday. $35, clay and glaze included.",
      read: `The Clay Room presents Ceramics Night. Wheel throwing for total beginners. ${fmt.long(WORLD.friday)}, 7–9 PM. 214 Mercer St, Studio B. $35, clay and glaze included.`,
      findings: [],
      actions: [
        {
          id: `${id}-event`, kind: 'calendar_event', title: 'Ceramics Night', start, end, place: '214 Mercer St, Studio B',
          ticked: true, status: 'proposed', targets: targets(),
          findings: [
            { tone: 'ok', text: 'The date and time match the screenshot', detail: `"${fmt.long(WORLD.friday)}, 7–9 PM"` },
            { tone: 'info', text: 'Right after "Climbing with Jules"', detail: `Ends ${fmt.time(at(WORLD.friday, 18, 30))} · Personal` },
          ],
        },
        { id: `${id}-place`, kind: 'save_place', title: 'The Clay Room', place: '214 Mercer St, Studio B', ticked: true, status: 'proposed', findings: [] },
      ],
    };
    return remember(capture, earlier);
  }
  const start = at(WORLD.thursday, 19);
  const end = at(WORLD.thursday, 20, 30);
  const capture: DemoCapture = {
    id, shot, source: 'screenshot', at: now,
    title: "Dinner with Maya at Rosa's",
    summary: "Maya booked a table at Rosa's for Thursday at 7.",
    read: "are we still on for dinner thursday? rosa's at 7, I booked a table. yes!! see you there",
    findings: [],
    actions: [{
      id: `${id}-event`, kind: 'calendar_event', title: 'Dinner with Maya', start, end, place: "Rosa's",
      ticked: true, status: 'proposed', targets: targets(),
      findings: [
        { tone: 'ok', text: 'The date and time match the screenshot', detail: '"dinner thursday" "rosa\'s at 7"' },
        { tone: 'warn', text: 'Overlaps "Book club"', detail: `${fmt.range(at(WORLD.thursday, 18, 30), at(WORLD.thursday, 19, 30))} · Home` },
      ],
    }],
  };
  return remember(capture, earlier);
}

/**
 * Foto's memory: the same thing screenshotted again is noticed. Added already, the new one starts
 * unticked; still waiting, the card says so.
 */
function remember(capture: DemoCapture, earlier: DemoCapture[]): DemoCapture {
  const event = capture.actions.find(isCalendar);
  if (!event || !earlier.length) return capture;
  const added = earlier.flatMap((item) => item.actions).find((action) => isCalendar(action) && action.status === 'done');
  if (added) {
    const where = (added.targets ?? []).find((target) => target.selected);
    event.ticked = false;
    event.skipped = true;
    event.findings = [
      { tone: 'warn', text: 'Looks like this is already on your calendar', detail: `"${added.title}" · ${fmt.dayTime(added.start!)} · ${where?.calendar ?? 'Personal'}` },
      ...event.findings.filter((finding) => finding.tone === 'ok'),
    ];
    for (const action of capture.actions) if (action !== event) action.ticked = false;
    return capture;
  }
  const first = earlier[0];
  event.findings = [...event.findings, { tone: 'info', text: `Also waiting in Foto since ${fmt.time(first.at)}`, detail: `From "${first.title}"` } as Finding];
  return capture;
}

export interface DeskHooks {
  /** How many screenshots still need the person, for the menu bar. */
  onWaiting: (count: number) => void;
  onOpenApp: () => void;
}

export interface Desk {
  setAutoSense: (on: boolean) => void;
  nudge: () => void;
}

export function initDesk(hooks: DeskHooks): Desk | null {
  const desk = document.getElementById('desk');
  const stack = document.getElementById('helper');
  const thumb = document.getElementById('shot-thumb');
  const sel = document.getElementById('sel');
  const hint = document.getElementById('desk-hint');
  const hintText = document.getElementById('desk-hint-text');
  if (!desk || !stack || !thumb || !sel || !hint || !hintText) return null;

  const render: Record<Shot, () => string> = { flyer: flyerHTML, chat: chatHTML, meme: memeHTML };
  for (const body of desk.querySelectorAll<HTMLElement>('[data-render]')) body.innerHTML = render[body.dataset.render as Shot]?.() ?? '';
  const windows = [...desk.querySelectorAll<HTMLElement>('.win')];

  let autoSense = true;
  let thumbTimer: ReturnType<typeof setTimeout> | null = null;
  const history: Record<string, DemoCapture[]> = {};
  const cards: CardHandle[] = [];
  const seen = new Set<Shot>();

  const setHint = (text: string, off = false) => { hintText.textContent = text; hint.classList.toggle('off', off); };
  const touchFirst = () => window.matchMedia('(hover: none)').matches || narrow();
  setHint(touchFirst()
    ? 'Try it: tap the flyer, the chat or the meme to screenshot it.'
    : 'Try it: drag across the flyer, the chat or the meme, the way you would with ⌘⇧4.');

  function waiting(): number {
    return Object.values(history).flat().filter((capture) => capture.actions.some((action) => action.status === 'proposed' && !settled(capture))).length;
  }
  const report = () => hooks.onWaiting(waiting());

  function flash(box: { left: number; top: number; width: number; height: number }) {
    if (reducedMotion()) return;
    const layer = document.createElement('div');
    layer.className = 'flash';
    Object.assign(layer.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
    desk!.append(layer);
    setTimeout(() => layer.remove(), 460);
  }

  function showThumb(source: HTMLElement | null) {
    if (!source || narrow()) return;
    thumb!.replaceChildren(miniCopy(source, 158, 118));
    thumb!.classList.add('on');
    if (thumbTimer) clearTimeout(thumbTimer);
    thumbTimer = setTimeout(() => thumb!.classList.remove('on'), 3200);
  }

  function push(node: HTMLElement) {
    stack!.append(node);
    while (stack!.children.length > MAX_CARDS) stack!.firstElementChild?.remove();
    if (narrow()) node.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
  }

  function guide(shot: Shot) {
    seen.add(shot);
    if (shot === 'meme') { setHint('Foto knows when to stay quiet. Now add the flyer, then screenshot it again.'); return; }
    if (!seen.has('chat')) { setHint(`Foto answers ${narrow() ? 'below' : 'at the top right'}. Try the chat next: it clashes with something.`); return; }
    if (!seen.has('meme')) { setHint('Now the meme. Not every screenshot needs anything.'); return; }
    setHint('Add one, then screenshot it again: Foto remembers what it already did.');
  }

  async function capture(shot: Shot | null, box: { left: number; top: number; width: number; height: number }, source: HTMLElement | null) {
    flash(box);
    showThumb(source);
    if (!autoSense) {
      setHint("Auto Sense is off, so Foto isn't watching. Turn it back on from the Foto menu up top.", true);
      return;
    }
    const pill = readingPill();
    push(pill);
    await wait(1100);
    const now = new Date();
    const understood = shot ? understand(shot, history[shot] ?? [], now) : null;
    if (!understood) {
      const quiet = quietPill();
      pill.replaceWith(quiet);
      setTimeout(() => { quiet.classList.add('leaving'); setTimeout(() => quiet.remove(), 200); }, 1600);
      if (shot) guide(shot);
      return;
    }
    if (source) understood.thumb = miniCopy(source, 52, 52);
    (history[understood.shot] ??= []).push(understood);
    const handle = decisionCard(understood, {
      onLeave: () => { const index = cards.indexOf(handle); if (index >= 0) cards.splice(index, 1); report(); },
      onOpen: hooks.onOpenApp,
      onChange: report,
    });
    cards.push(handle);
    pill.replaceWith(handle.el);
    guide(understood.shot as Shot);
    report();
  }

  // ---- pointer: drag to select, the way the screenshot tool does ----
  let start: { x: number; y: number } | null = null;
  let pointer = -1;
  const size = sel.querySelector<HTMLElement>('.sel-size');

  const local = (event: PointerEvent) => {
    const box = desk.getBoundingClientRect();
    return { x: Math.max(0, Math.min(box.width, event.clientX - box.left)), y: Math.max(0, Math.min(box.height, event.clientY - box.top)) };
  };
  const rectOf = (a: { x: number; y: number }, b: { x: number; y: number }) => ({ left: Math.min(a.x, b.x), top: Math.min(a.y, b.y), width: Math.abs(a.x - b.x), height: Math.abs(a.y - b.y) });

  function windowBox(win: HTMLElement) {
    const outer = desk!.getBoundingClientRect();
    const box = win.getBoundingClientRect();
    return { left: box.left - outer.left, top: box.top - outer.top, width: box.width, height: box.height };
  }

  /** The window the selection covers most; on-top windows win the overlaps. */
  function covered(box: { left: number; top: number; width: number; height: number }): HTMLElement | null {
    let best: HTMLElement | null = null;
    let bestArea = 0;
    for (const win of [...windows].reverse()) {
      const w = windowBox(win);
      const width = Math.min(box.left + box.width, w.left + w.width) - Math.max(box.left, w.left);
      const height = Math.min(box.top + box.height, w.top + w.height) - Math.max(box.top, w.top);
      const area = width > 0 && height > 0 ? width * height : 0;
      if (area > bestArea * 1.15) { best = win; bestArea = area; }
    }
    return bestArea > 400 ? best : null;
  }

  desk.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.pointerType === 'touch' || narrow()) return;
    if ((event.target as HTMLElement).closest('.helper-stack, a, button, input')) return;
    start = local(event);
    pointer = event.pointerId;
    desk.setPointerCapture(pointer);
    event.preventDefault();
  });
  desk.addEventListener('pointermove', (event) => {
    if (!start || event.pointerId !== pointer) return;
    const box = rectOf(start, local(event));
    if (box.width < 4 && box.height < 4) return;
    sel.classList.add('on');
    Object.assign(sel.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
    if (size) size.textContent = `${Math.round(box.width * devicePixelRatio)} × ${Math.round(box.height * devicePixelRatio)}`;
  });
  const finish = (event: PointerEvent) => {
    if (!start || event.pointerId !== pointer) return;
    const end = local(event);
    const box = rectOf(start, end);
    start = null;
    sel.classList.remove('on');
    if (desk.hasPointerCapture(pointer)) desk.releasePointerCapture(pointer);
    if (box.width < 8 && box.height < 8) {
      // A click: the window under the pointer, whole, as Space then click does on a Mac.
      const hit = (document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null)?.closest<HTMLElement>('.win');
      if (hit) void capture(hit.dataset.shot as Shot, windowBox(hit), hit);
      return;
    }
    const win = covered(box);
    void capture(win ? (win.dataset.shot as Shot) : null, box, win);
  };
  desk.addEventListener('pointerup', finish);
  desk.addEventListener('pointercancel', () => { start = null; sel.classList.remove('on'); });

  for (const win of windows) {
    // Touch and small screens: a tap takes the whole window.
    win.addEventListener('click', () => { if (narrow() || touchFirst()) void capture(win.dataset.shot as Shot, windowBox(win), win); });
    win.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      void capture(win.dataset.shot as Shot, windowBox(win), win);
    });
  }

  report();
  return {
    setAutoSense(on: boolean) {
      autoSense = on;
      setHint(on ? 'Auto Sense is on. Foto is watching for new screenshots.' : "Auto Sense is off, so Foto isn't watching. Turn it back on from the Foto menu up top.", !on);
    },
    nudge() {
      setHint(touchFirst() ? 'Tap something on the desktop to send it to Foto.' : 'Drag across something on the desktop to send it to Foto.');
      hint.animate?.([{ transform: 'rotate(-1.2deg) scale(1)' }, { transform: 'rotate(-1.2deg) scale(1.06)' }, { transform: 'rotate(-1.2deg) scale(1)' }], { duration: reducedMotion() ? 1 : 420, easing: 'cubic-bezier(.34,1.46,.44,1)' });
      windows[0]?.focus({ preventScroll: true });
    },
  };
}
