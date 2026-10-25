/**
 * Foto's top-right helper card, rebuilt from the app's own markup, classes and wording
 * (foto/src/helper/HelperCardView.tsx). Nothing here talks to a calendar: it is a demo, and it
 * says what the real card says when the real calendar confirms.
 */
import { icon, type IconName } from '../icons';
import { el, esc, listWords } from './dom';
import { fmt, HOUR } from './time';

export type Tone = 'ok' | 'info' | 'warn';
export interface Finding { tone: Tone; text: string; detail?: string }
export interface Target { key: string; name: string; calendar: string; color: string; selected: boolean }
export type Kind = 'calendar_event' | 'travel_segment' | 'save_place' | 'note' | 'contact' | 'expense' | 'reading_item';

export const VERB: Record<Kind, string> = {
  calendar_event: 'Add to Calendar', travel_segment: 'Save trip segment', save_place: 'Save place', note: 'Save note',
  contact: 'Save contact', expense: 'Record expense', reading_item: 'Add to reading list',
};
export const KIND_ICON: Record<Kind, IconName> = {
  calendar_event: 'calendarDays', travel_segment: 'plane', save_place: 'mapPin', note: 'stickyNote',
  contact: 'userRound', expense: 'receipt', reading_item: 'bookOpen',
};
/** Events and trips are mint; everything else is blossom, as in the app. */
export const KIND_TONE: Record<Kind, 'event' | 'task'> = {
  calendar_event: 'event', travel_segment: 'event', save_place: 'task', note: 'task', contact: 'task', expense: 'task', reading_item: 'task',
};

export interface DemoAction {
  id: string;
  kind: Kind;
  title: string;
  start?: Date;
  end?: Date;
  place?: string;
  url?: string;
  amount?: string;
  findings: Finding[];
  ticked: boolean;
  /** Unticked because it looks done already. */
  skipped?: boolean;
  targets?: Target[];
  status: 'proposed' | 'done';
  result?: { tone: 'ok' | 'err'; text: string };
  /** Destinations not chosen stay folded until asked for. */
  showAll?: boolean;
}

export interface DemoCapture {
  id: string;
  shot: string;
  title: string;
  summary: string;
  read: string;
  source: 'screenshot' | 'mail';
  at: Date;
  thumb?: HTMLElement;
  findings: Finding[];
  actions: DemoAction[];
}

const CALENDAR = new Set<Kind>(['calendar_event', 'travel_segment']);
const DONE_MS = 8_000;
const IDLE_MS = 90_000;
const RUN_MS = 750;

export function isCalendar(action: DemoAction): boolean {
  return CALENDAR.has(action.kind);
}

function chosenNames(action: DemoAction): string {
  return listWords((action.targets ?? []).filter((target) => target.selected).map((target) => target.name));
}

/** One plain sentence for what approving would do, naming exactly where it goes. */
export function plan(action: DemoAction): string {
  switch (action.kind) {
    case 'calendar_event':
    case 'travel_segment': {
      const name = `"${action.title}"`;
      const thing = action.kind === 'travel_segment' ? `the trip ${name}` : name;
      if (!action.start) return `Would add ${thing} to your calendar, but it has no date yet.`;
      const end = action.end ?? new Date(action.start.getTime() + HOUR);
      if (!(action.targets ?? []).some((target) => target.selected)) return 'Pick at least one calendar.';
      return `Adds ${thing} to ${chosenNames(action)}, ${fmt.span(action.start, end)}, with a 15-minute alert.`;
    }
    case 'save_place': return `Saves ${action.place ?? action.title} in Foto with a Maps link; nothing opens.`;
    case 'note': return `Saves a note called "${action.title}" in Notes.`;
    case 'contact': return `Creates a contact card for ${action.title} in Contacts.`;
    case 'expense': return action.amount ? `Records ${action.amount} for "${action.title}" as an expense in Foto.` : `Records "${action.title}" as an expense in Foto.`;
    case 'reading_item': return `Adds ${action.url ?? `"${action.title}"`} to your reading list in Foto.`;
  }
}

function doneText(action: DemoAction): string {
  switch (action.kind) {
    case 'calendar_event':
    case 'travel_segment': return `Added "${action.title}" to ${chosenNames(action)} on ${fmt.dayTime(action.start!)}.`;
    case 'save_place': return `Saved ${action.place ?? action.title}. Open in Maps when you need it.`;
    case 'note': return `Saved "${action.title}" to Notes.`;
    case 'contact': return `Saved ${action.title} to Contacts.`;
    case 'expense': return `Recorded "${action.title}" in Foto.`;
    case 'reading_item': return 'Added to your reading list.';
  }
}

const TONE_ICON: Record<Tone, IconName> = { warn: 'triangleAlert', ok: 'circleCheck', info: 'info' };
const TONE_WORD: Record<Tone, string> = { warn: 'Check', info: 'Note', ok: 'Good' };

export function findingsHTML(findings: Finding[]): string {
  if (!findings.length) return '';
  return `<ul class="helper-findings" aria-label="What Foto checked">${findings.map((finding) => `
    <li class="helper-finding ${finding.tone}">${icon(TONE_ICON[finding.tone], { size: 14 })}<span><span class="sr-only">${TONE_WORD[finding.tone]}: </span>${esc(finding.text)}${finding.detail ? `<small>${esc(finding.detail)}</small>` : ''}</span></li>`).join('')}</ul>`;
}

function targetsHTML(action: DemoAction, busy: boolean): string {
  const targets = action.targets ?? [];
  const shown = action.showAll ? targets : targets.filter((target) => target.selected);
  const others = targets.filter((target) => !target.selected).length;
  const chips = shown.map((target) => `
    <button type="button" class="helper-target${target.selected ? ' on' : ''}" aria-pressed="${target.selected}" ${busy ? 'disabled' : ''}
      data-act="target" data-id="${action.id}" data-key="${target.key}" title="${esc(target.name)}">
      <i class="dot" style="--c:${target.color}" aria-hidden="true"></i><span>${esc(target.name)}</span>
    </button>`).join('');
  const more = others > 0 || action.showAll
    ? `<button type="button" class="helper-target" ${busy ? 'disabled' : ''} data-act="more" data-id="${action.id}"><span>${action.showAll ? 'Fewer' : `Other calendars (${others})`}</span></button>`
    : '';
  return `<div class="helper-targets" role="group" aria-label="Calendars">${chips}${more}</div>`;
}

export function rowHTML(action: DemoAction, busy: boolean): string {
  const runnable = action.status === 'proposed';
  const done = action.status === 'done';
  const calendar = isCalendar(action);
  const undoable = done && calendar && action.result?.tone === 'ok';
  const head = runnable
    ? `<button type="button" role="checkbox" aria-checked="${action.ticked}" aria-label="${esc(`${VERB[action.kind]}: ${action.title}`)}" class="check${action.ticked ? ' on' : ''}" ${busy ? 'disabled' : ''} data-act="tick" data-id="${action.id}">${icon('check', { size: 13, stroke: 3 })}</button>`
    : `<span class="ic ${KIND_TONE[action.kind]}" aria-hidden="true">${icon(KIND_ICON[action.kind], { size: 14, stroke: 1.8 })}</span>`;
  return `<div class="helper-row${done ? ' done' : ''}">
    ${head}
    <div class="body">
      <span class="verb">${VERB[action.kind]}</span>
      <b>${esc(action.title)}</b>
      ${action.start ? `<span class="when">${icon('clock3', { size: 13 })}${fmt.dayTime(action.start)}</span>` : ''}
      ${runnable && calendar ? targetsHTML(action, busy) : ''}
      ${runnable ? `<p class="helper-plan">${esc(plan(action))}</p>` : ''}
      ${runnable && action.skipped ? '<p class="helper-plan">Unticked, because it looks done already.</p>' : ''}
      ${runnable ? findingsHTML(action.findings) : ''}
      ${action.result ? `<p class="helper-result${action.result.tone === 'err' ? ' err' : ''}" role="status">${icon(action.result.tone === 'err' ? 'triangleAlert' : 'check', { size: 14 })}<span>${esc(action.result.text)}</span></p>` : ''}
    </div>
    <div class="col" style="gap:4px;align-items:flex-end">
      ${undoable ? `<button type="button" class="btn ghost sm" ${busy ? 'disabled' : ''} data-act="undo" data-id="${action.id}">${icon('rotateCcw', { size: 14 })}Undo</button>` : ''}
    </div>
  </div>`;
}

export interface CardOptions {
  /** A card that lives in the page rather than the pretend screen: it never tucks itself away. */
  fixed?: boolean;
  /** Only the action rows and the footer, for the checks demo. */
  rowsOnly?: boolean;
  onLeave?: () => void;
  onOpen?: () => void;
  /** Called after every change, so a demo can follow along (a day view, the menu bar count). */
  onChange?: (capture: DemoCapture) => void;
}

export interface CardHandle {
  el: HTMLElement;
  capture: DemoCapture;
  rerender: () => void;
  leave: () => void;
}

function runnable(action: DemoAction): boolean {
  return action.status === 'proposed';
}

function hasTarget(action: DemoAction): boolean {
  return !isCalendar(action) || (action.targets ?? []).some((target) => target.selected);
}

export function settled(capture: DemoCapture): boolean {
  return capture.actions.length > 0 && capture.actions.every((action) => !runnable(action) || !action.ticked);
}

export function decisionCard(capture: DemoCapture, options: CardOptions = {}): CardHandle {
  const card = el<HTMLElement>(`<section class="helper-card${options.fixed ? ' static-card' : ''}" aria-label="${esc(`Foto: ${capture.title}`)}"></section>`);
  let busy = false;
  let hovered = false;
  let leaving = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const selected = () => capture.actions.filter((action) => runnable(action) && action.ticked && hasTarget(action));
  const finished = () => settled(capture) && capture.actions.some((action) => action.result);

  function leave() {
    if (leaving || options.fixed) return;
    leaving = true;
    if (timer) clearTimeout(timer);
    card.classList.add('leaving');
    setTimeout(() => { card.remove(); options.onLeave?.(); }, 200);
  }

  function schedule() {
    if (options.fixed) return;
    if (timer) clearTimeout(timer);
    if (hovered || busy) return;
    timer = setTimeout(leave, finished() ? DONE_MS : IDLE_MS);
  }

  function headHTML(): string {
    if (options.rowsOnly) return '';
    const fromMail = capture.source === 'mail';
    return `<div class="helper-head">
      <span class="helper-thumb">${capture.thumb ? '' : icon(fromMail ? 'mail' : 'fileText', { size: 20, stroke: 1.6 })}</span>
      <div class="body">
        <div class="helper-meta"><span>${fromMail ? 'From Mail' : 'foto'}</span><span>· ${fmt.time(capture.at)}</span></div>
        <h3 class="helper-title">${esc(capture.title)}</h3>
        <p class="helper-sum">${esc(capture.summary)}</p>
      </div>
      ${options.fixed ? '' : `<button type="button" class="btn btn-icon ghost sm" aria-label="Not now" data-act="leave">${icon('x', { size: 14 })}</button>`}
    </div>
    ${capture.read ? `<p class="helper-read" data-label="${fromMail ? 'READ FROM THE EMAIL' : 'READ FROM THE IMAGE'}"><span>${esc(capture.read)}</span></p>` : ''}
    ${capture.findings.length ? `<div class="helper-note">${findingsHTML(capture.findings)}</div>` : ''}`;
  }

  function footHTML(): string {
    const picked = selected();
    const main = finished()
      ? '<span class="t-cap" style="flex:1">All set.</span>'
      : `<button type="button" class="btn solid sm${busy ? ' is-loading' : ''}" ${busy || !picked.length ? 'disabled' : ''} data-act="run">${icon('check', { size: 14 })}${picked.length > 1 ? `Do all ${picked.length}` : 'Do it'}</button>
         ${options.fixed ? '' : `<button type="button" class="btn ghost sm" ${busy ? 'disabled' : ''} data-act="leave">Not now</button>`}`;
    const open = options.onOpen ? `<button type="button" class="btn ghost sm" data-act="open">Open in Foto${icon('arrowUpRight', { size: 14 })}</button>` : '';
    return `<div class="helper-foot">${main}<span class="spacer"></span>${open}</div>`;
  }

  function render() {
    const focused = (document.activeElement as HTMLElement | null)?.dataset;
    const focusKey = focused && card.contains(document.activeElement) ? `${focused.act ?? ''}:${focused.id ?? ''}:${focused.key ?? ''}` : null;
    card.innerHTML = `${headHTML()}
      <div class="helper-rows">${capture.actions.map((action) => rowHTML(action, busy)).join('')}</div>
      ${footHTML()}`;
    if (capture.thumb && !options.rowsOnly) card.querySelector('.helper-thumb')?.append(capture.thumb);
    // Keep the keyboard where it was across a redraw.
    if (focusKey) {
      const [act, id, key] = focusKey.split(':');
      const again = [...card.querySelectorAll<HTMLElement>('[data-act]')].find((node) => node.dataset.act === act && (node.dataset.id ?? '') === id && (node.dataset.key ?? '') === key);
      (again ?? card.querySelector<HTMLElement>('[data-act="run"], [data-act="undo"]'))?.focus();
    }
    options.onChange?.(capture);
    schedule();
  }

  async function run() {
    const picked = selected();
    if (!picked.length) return;
    busy = true;
    render();
    await new Promise((resolve) => setTimeout(resolve, RUN_MS));
    for (const action of picked) {
      action.status = 'done';
      action.ticked = false;
      action.result = { tone: 'ok', text: doneText(action) };
    }
    busy = false;
    render();
  }

  function undo(action: DemoAction) {
    const where = chosenNames(action);
    action.status = 'proposed';
    action.ticked = false;
    action.result = { tone: 'ok', text: `Removed "${action.title}" from ${where}.` };
    render();
  }

  card.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>('[data-act]');
    if (!button || !card.contains(button)) return;
    const action = capture.actions.find((item) => item.id === button.dataset.id);
    switch (button.dataset.act) {
      case 'tick':
        if (action) { action.ticked = !action.ticked; action.result = undefined; render(); }
        break;
      case 'target': {
        const target = action?.targets?.find((item) => item.key === button.dataset.key);
        if (target) { target.selected = !target.selected; render(); }
        break;
      }
      case 'more':
        if (action) { action.showAll = !action.showAll; render(); }
        break;
      case 'run': void run(); break;
      case 'undo': if (action) undo(action); break;
      case 'leave': leave(); break;
      case 'open': options.onOpen?.(); break;
    }
  });
  card.addEventListener('mouseenter', () => { hovered = true; if (timer) clearTimeout(timer); });
  card.addEventListener('mouseleave', () => { hovered = false; schedule(); });
  card.addEventListener('keydown', (event) => { if (event.key === 'Escape') leave(); });

  render();
  return { el: card, capture, rerender: render, leave };
}

/** The pill Foto shows while it reads, and the quiet line when there is nothing to do. */
export function readingPill(): HTMLElement {
  return el(`<section class="helper-card helper-pill" role="status" aria-live="polite">
    <span class="mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
    <span style="flex:1">Reading your screenshot</span>
    <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
  </section>`);
}

export function quietPill(text = 'Nothing to do here. Kept it for reference.'): HTMLElement {
  return el(`<section class="helper-card helper-pill" role="status" aria-live="polite">${icon('check', { size: 15 })}<span>${esc(text)}</span></section>`);
}
