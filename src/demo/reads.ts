/**
 * "It shows you what it read": six sample screenshots and what Foto makes of each. Confidence,
 * urgency and importance stay three separate answers, as they do in the app.
 */
import { icon } from '../icons';
import { KIND_ICON, KIND_TONE, VERB, type Kind } from './card';
import { el, esc, miniCopy } from './dom';
import { articleHTML, bizcardHTML, flightHTML, memeHTML, noteHTML, receiptHTML } from './shots';
import { WORLD, addDays, fmt, soonWords } from './time';

type Sure = 'clear' | 'likely' | 'unclear';

interface Offer { kind: Kind; title: string; plan: string; asks: boolean }
interface Sample {
  key: string;
  label: string;
  bar: string;
  render: () => string;
  /** What Foto read, with the parts it used marked. Already escaped. */
  read: string;
  sure: Sure | null;
  soon: [string, string];
  matters: [string, string];
  offers: Offer[];
  keep: string;
}

const mark = (kind: string, text: string) => `<mark class="m-${kind}">${esc(text)}</mark>`;

function samples(): Sample[] {
  const flightDay = fmt.shortWeekday(WORLD.flight);
  return [
    {
      key: 'flight', label: 'A flight', bar: 'Mail', render: flightHTML,
      read: `Your trip to Austin is confirmed. Flight NW 1432. ${mark('when', flightDay)}. Departs SFO ${mark('when', '8:05 AM')}, arrives AUS ${mark('when', '1:40 PM')}. Confirmation K7Q2PX. Seat 14C.`,
      sure: 'clear', soon: [soonWords(WORLD.flight), 'From the date in the email'], matters: ['Needs attention', 'A booked flight'],
      offers: [{ kind: 'travel_segment', title: 'NW 1432, San Francisco to Austin', plan: `Adds the trip "NW 1432, San Francisco to Austin" to Personal (Google), ${flightDay}, 8:05 AM – 1:40 PM, with a 15-minute alert.`, asks: true }],
      keep: `Kept until the day after the event: ${fmt.short(addDays(WORLD.flight, 1))}.`,
    },
    {
      key: 'receipt', label: 'A receipt', bar: 'Photos', render: receiptHTML,
      read: `Cafe Lumen. ${mark('when', fmt.short(WORLD.receipt))}, 9:12 AM. Oat latte 5.25. Almond croissant 4.75. Tip 2.00. Total ${mark('amount', '$12.00')}.`,
      sure: 'clear', soon: ['No date to meet', 'Nothing is due'], matters: ['Worth a look', 'Money spent'],
      offers: [{ kind: 'expense', title: 'Cafe Lumen', plan: 'Records $12.00 for "Cafe Lumen" as an expense in Foto.', asks: false }],
      keep: `Receipts are kept for 90 days for returns: until ${fmt.short(addDays(WORLD.today, 90))}.`,
    },
    {
      key: 'card', label: 'A business card', bar: 'Photos', render: bizcardHTML,
      read: `${mark('who', 'Priya Raman')}. Product Designer, Northwind Studio. ${mark('who', 'priya@northwind.example')}. ${mark('who', '(415) 555-0142')}.`,
      sure: 'clear', soon: ['No date to meet', 'Nothing is due'], matters: ['Worth a look', 'Someone you met'],
      offers: [{ kind: 'contact', title: 'Priya Raman', plan: 'Creates a contact card for Priya Raman in Contacts.', asks: true }],
      keep: 'Kept as a reference.',
    },
    {
      key: 'article', label: 'An article', bar: 'dailyloaf.example', render: articleHTML,
      read: `The Daily Loaf. ${mark('where', 'How to keep a sourdough starter alive while you travel')}. Feed it, chill it, and a starter keeps for two weeks without you.`,
      sure: 'likely', soon: ['No date to meet', 'Read it whenever'], matters: ['Reference', 'Something to read later'],
      offers: [{ kind: 'reading_item', title: 'How to keep a sourdough starter alive while you travel', plan: 'Adds dailyloaf.example/starter-travel to your reading list in Foto.', asks: false }],
      keep: 'Kept as a reference.',
    },
    {
      key: 'note', label: 'A Wi-Fi note', bar: 'Photos', render: noteHTML,
      read: `Wi-Fi: ${mark('who', 'Sunroom-5G')}. password: ${mark('who', 'lemontree42')}`,
      sure: 'clear', soon: ['No date to meet', 'Nothing is due'], matters: ['Worth a look', 'Details you will need again'],
      offers: [{ kind: 'note', title: 'Wi-Fi for the Sunroom', plan: 'Saves a note called "Wi-Fi for the Sunroom" in Notes.', asks: false }],
      keep: 'Kept as a reference.',
    },
    {
      key: 'meme', label: 'A meme', bar: 'IMG_2291.jpeg', render: memeHTML,
      read: 'IF I FITS. I SITS.',
      sure: null, soon: ['No date to meet', 'Nothing is due'], matters: ['Reference', 'Just for fun'],
      offers: [],
      keep: `Looks disposable; reviewed after a week: ${fmt.short(addDays(WORLD.today, 7))}.`,
    },
  ];
}

function confHTML(level: Sure | null): string {
  if (!level) return '<dd>Nothing to be sure about<small>No action to propose</small></dd>';
  const detail = level === 'clear' ? 'The words say it plainly' : level === 'likely' ? 'Worked out from the page' : 'Foto is guessing';
  return `<dd><span class="conf" data-level="${level}"><i></i><i></i><i></i>${level}</span><small>${detail}</small></dd>`;
}

function panelHTML(sample: Sample): string {
  const offers = sample.offers.length
    ? `<div class="offers">${sample.offers.map((offer) => `
        <div class="helper-row">
          <span class="ic ${KIND_TONE[offer.kind]}" aria-hidden="true">${icon(KIND_ICON[offer.kind], { size: 14, stroke: 1.8 })}</span>
          <div class="body">
            <span class="verb">${VERB[offer.kind]}</span>
            <b>${esc(offer.title)}</b>
            <p class="helper-plan">${esc(offer.plan)}</p>
            <div class="tagline"><span class="chip ${offer.asks ? 'neutral' : 'event'} sm">${offer.asks ? 'always asks first' : 'can be automated'}</span></div>
          </div>
        </div>`).join('')}</div>`
    : `<p class="quiet-line">${icon('check', { size: 16 })}Nothing to do here. Kept it for reference.</p>`;
  return `
    <div class="reads-shot">
      <header class="win-bar"><span class="lights" aria-hidden="true"><i></i><i></i><i></i></span><span class="ttl">${esc(sample.bar)}</span></header>
      <div class="win-body">${sample.render()}</div>
    </div>
    <div class="reading">
      <p class="helper-read" data-label="READ FROM THE IMAGE"><span>${sample.read}</span></p>
      <dl class="meters">
        <div class="meter"><dt>How sure Foto is</dt>${confHTML(sample.sure)}</div>
        <div class="meter"><dt>How soon</dt><dd>${esc(sample.soon[0])}<small>${esc(sample.soon[1])}</small></dd></div>
        <div class="meter"><dt>How much it matters</dt><dd>${esc(sample.matters[0])}<small>${esc(sample.matters[1])}</small></dd></div>
      </dl>
      ${offers}
      <p class="keep">${icon('hourglass', { size: 16 })}<span>${esc(sample.keep)}</span></p>
    </div>`;
}

export function initReads(): void {
  const tabs = document.getElementById('reads-tabs');
  const panel = document.getElementById('reads-panel');
  if (!tabs || !panel) return;
  const list = samples();

  // A small copy of each screenshot is its own tab.
  const stage = el<HTMLDivElement>('<div aria-hidden="true" style="position:absolute;left:-9999px;top:0;width:400px;height:300px"></div>');
  document.body.append(stage);
  const buttons = list.map((sample, index) => {
    const button = el<HTMLButtonElement>(`<button type="button" class="reads-tab" role="tab" id="reads-tab-${sample.key}" aria-controls="reads-panel" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}"><span class="tt"></span><span>${esc(sample.label)}</span></button>`);
    const shot = el<HTMLDivElement>(`<div style="position:relative;width:400px;height:300px">${sample.render()}</div>`);
    stage.append(shot);
    button.querySelector('.tt')?.append(miniCopy(shot, 44, 44, { width: 400, height: 300 }));
    tabs.append(button);
    return button;
  });
  stage.remove();

  function show(index: number, focus = false) {
    buttons.forEach((button, i) => {
      button.setAttribute('aria-selected', String(i === index));
      button.tabIndex = i === index ? 0 : -1;
    });
    panel!.innerHTML = panelHTML(list[index]);
    panel!.setAttribute('aria-labelledby', buttons[index].id);
    if (focus) buttons[index].focus();
  }

  buttons.forEach((button, index) => {
    button.addEventListener('click', () => show(index));
    button.addEventListener('keydown', (event) => {
      const vertical = !window.matchMedia('(max-width: 1100px)').matches;
      const next = vertical ? 'ArrowDown' : 'ArrowRight';
      const prev = vertical ? 'ArrowUp' : 'ArrowLeft';
      if (event.key === next) { event.preventDefault(); show((index + 1) % buttons.length, true); }
      if (event.key === prev) { event.preventDefault(); show((index - 1 + buttons.length) % buttons.length, true); }
    });
  });
  show(0);
}
