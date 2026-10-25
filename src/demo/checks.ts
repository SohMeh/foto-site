/**
 * "It checks before it asks": a Thursday across three calendars and the dinner from the chat.
 * Move the dinner and the checks are worked out again, with the rules Foto itself uses
 * (foto/src/lib/context.ts): overlaps first, then anything within an hour, otherwise free.
 */
import { decisionCard, type DemoAction, type DemoCapture, type Finding } from './card';
import { targets } from './desk';
import { esc } from './dom';
import { WORLD, at, fmt, HOUR, MINUTE } from './time';

interface DayEvent { title: string; calendar: string; color: string; start: Date; end: Date }

const FIRST_HOUR = 16;
const HOURS = 7;
const NEAR = HOUR;
const STEP = 15;

export function initChecks(onOpen: () => void): void {
  const grid = document.getElementById('day-grid');
  const cardHost = document.getElementById('checks-card');
  const legend = document.getElementById('day-cals');
  const label = document.getElementById('move-time');
  const dayName = document.getElementById('day-name');
  if (!grid || !cardHost || !legend || !label) return;

  const day = WORLD.thursday;
  if (dayName) dayName.textContent = fmt.long(day);
  const events: DayEvent[] = [
    { title: 'Team retro', calendar: 'Work', color: '#8E63CE', start: at(day, 16), end: at(day, 16, 45) },
    { title: 'Gym', calendar: 'Personal', color: '#3F8E5A', start: at(day, 17), end: at(day, 18) },
    { title: 'Book club', calendar: 'Home', color: '#1BADF8', start: at(day, 18, 30), end: at(day, 19, 30) },
    { title: 'Movie with Ari', calendar: 'Personal', color: '#3F8E5A', start: at(day, 21, 30), end: at(day, 23) },
  ];
  // The legend is a key, not a control: Foto reads every calendar on the Mac.
  legend.innerHTML = [
    ['Personal (Google)', '#3F8E5A'], ['Work (Google)', '#8E63CE'], ['Home (iCloud)', '#1BADF8'],
  ].map(([name, color]) => `<span class="chip neutral sm"><i style="width:7px;height:7px;border-radius:50%;background:${color};display:inline-block"></i>${name}</span>`).join('');

  const hour = () => parseFloat(getComputedStyle(grid).getPropertyValue('--hour')) || 58;
  const minutesFrom = (date: Date) => (date.getHours() - FIRST_HOUR) * 60 + date.getMinutes();

  const action: DemoAction = {
    id: 'checks-dinner', kind: 'calendar_event', title: 'Dinner with Maya', place: "Rosa's",
    start: at(day, 19), end: at(day, 20, 30), ticked: true, status: 'proposed', targets: targets(), findings: [],
  };
  const capture: DemoCapture = { id: 'checks', shot: 'chat', title: "Dinner with Maya at Rosa's", summary: '', read: '', source: 'screenshot', at: new Date(), findings: [], actions: [action] };

  function check(): Finding[] {
    const start = action.start!.getTime();
    const end = action.end!.getTime();
    const findings: Finding[] = [];
    if (action.start!.getHours() === 19 && action.start!.getMinutes() === 0) {
      findings.push({ tone: 'ok', text: 'The date and time match the screenshot', detail: '"dinner thursday" "rosa\'s at 7"' });
    }
    const clashes = events.filter((event) => event.start.getTime() < end && event.end.getTime() > start).sort((a, b) => a.start.getTime() - b.start.getTime());
    for (const event of clashes.slice(0, 3)) findings.push({ tone: 'warn', text: `Overlaps "${event.title}"`, detail: `${fmt.range(event.start, event.end)} · ${event.calendar}` });
    const near = events
      .map((event) => {
        if (event.end.getTime() <= start && start - event.end.getTime() <= NEAR) return { event, gap: start - event.end.getTime(), before: true };
        if (event.start.getTime() >= end && event.start.getTime() - end <= NEAR) return { event, gap: event.start.getTime() - end, before: false };
        return null;
      })
      .filter((item): item is { event: DayEvent; gap: number; before: boolean } => item !== null)
      .sort((a, b) => a.gap - b.gap)
      .slice(0, 2);
    for (const { event, before } of near) {
      findings.push(before
        ? { tone: 'info', text: `Right after "${event.title}"`, detail: `Ends ${fmt.time(event.end)} · ${event.calendar}` }
        : { tone: 'info', text: `Right before "${event.title}"`, detail: `Starts ${fmt.time(event.start)} · ${event.calendar}` });
    }
    if (!clashes.length && !near.length) findings.push({ tone: 'ok', text: 'Nothing else on your calendars then' });
    return findings;
  }

  // The day view.
  grid.innerHTML = Array.from({ length: HOURS + 1 }, (_, index) => {
    const mark = at(day, FIRST_HOUR + index);
    return `<span class="hr" style="top:${(index / HOURS) * 100}%">${index === HOURS ? '' : fmt.time(mark).replace(':00', '')}</span>`;
  }).join('') + events.map((event) => `
    <div class="ev" style="--c:${event.color};top:calc(var(--hour) * ${minutesFrom(event.start) / 60});height:calc(var(--hour) * ${(event.end.getTime() - event.start.getTime()) / HOUR} - 3px)">
      <b>${esc(event.title)}</b><span>${fmt.range(event.start, event.end)}</span>
    </div>`).join('');
  const block = document.createElement('div');
  block.className = 'ev prop';
  block.tabIndex = 0;
  block.setAttribute('role', 'slider');
  block.setAttribute('aria-label', 'Dinner with Maya. Use the arrow keys to move it.');
  grid.append(block);

  const done = () => action.status === 'done';
  const handle = decisionCard(capture, { fixed: true, rowsOnly: true, onOpen, onChange: () => paint() });
  cardHost.replaceWith(handle.el);
  handle.el.id = 'checks-card';

  function paint() {
    const start = action.start!;
    const end = action.end!;
    block.style.top = `calc(var(--hour) * ${minutesFrom(start) / 60})`;
    block.style.height = `calc(var(--hour) * ${(end.getTime() - start.getTime()) / HOUR} - 3px)`;
    const added = done() ? (action.targets ?? []).find((target) => target.selected) : null;
    block.classList.toggle('prop', !added);
    block.style.setProperty('--c', added?.color ?? 'var(--blos-500)');
    block.innerHTML = `<b>${esc(action.title)}</b><span>${fmt.range(start, end)}${added ? '' : ' · proposed'}</span>`;
    block.setAttribute('aria-valuetext', `${fmt.range(start, end)}`);
    label!.textContent = `Dinner, ${fmt.range(start, end)}`;
    for (const button of document.querySelectorAll<HTMLButtonElement>('[data-move]')) button.disabled = done();
  }

  function moveTo(minutes: number) {
    if (done()) return;
    const length = action.end!.getTime() - action.start!.getTime();
    const latest = HOURS * 60 - length / MINUTE;
    const clamped = Math.max(0, Math.min(latest, Math.round(minutes / STEP) * STEP));
    const start = at(day, FIRST_HOUR, clamped);
    if (start.getTime() === action.start!.getTime()) return;
    action.start = start;
    action.end = new Date(start.getTime() + length);
    action.result = undefined;
    action.findings = check();
    handle.rerender();
  }

  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-move]')) {
    button.addEventListener('click', () => moveTo(minutesFrom(action.start!) + Number(button.dataset.move)));
  }
  block.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      moveTo(minutesFrom(action.start!) + (event.key === 'ArrowUp' ? -STEP : STEP));
    }
  });

  let drag: { y: number; minutes: number; id: number } | null = null;
  block.addEventListener('pointerdown', (event) => {
    if (done()) return;
    drag = { y: event.clientY, minutes: minutesFrom(action.start!), id: event.pointerId };
    block.setPointerCapture(event.pointerId);
    block.classList.add('dragging');
    event.preventDefault();
  });
  block.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    moveTo(drag.minutes + ((event.clientY - drag.y) / hour()) * 60);
  });
  const stop = () => { drag = null; block.classList.remove('dragging'); };
  block.addEventListener('pointerup', stop);
  block.addEventListener('pointercancel', stop);

  action.findings = check();
  handle.rerender();
}
