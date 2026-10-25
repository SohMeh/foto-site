/**
 * The things a visitor can screenshot. All invented: the businesses, people and addresses are
 * made up, and the email domains use the reserved .example name.
 */
import { WORLD, fmt } from './time';

export function flyerHTML(): string {
  return `<div class="shot-flyer">
    <span class="blob"></span><span class="blob two"></span>
    <p class="fl-kick">The Clay Room presents</p>
    <p class="fl-big">Ceramics<br>Night</p>
    <p class="fl-sub">Wheel throwing for total beginners</p>
    <p class="fl-when"><b>${fmt.long(WORLD.friday)}</b><br>7–9 PM</p>
    <p class="fl-where">214 Mercer St, Studio B</p>
    <p class="fl-price">$35, clay and glaze included</p>
  </div>`;
}

export function chatHTML(): string {
  return `<div class="shot-chat">
    <div class="head"><span class="av">M</span><b>Maya</b></div>
    <span class="stamp">Today 9:38 PM</span>
    <p class="b them">are we still on for dinner thursday?</p>
    <p class="b them">rosa's at 7, I booked a table</p>
    <p class="b me">yes!! see you there</p>
  </div>`;
}

/** A cat in a box. Foto should find nothing to do here, and say so quietly. */
export function memeHTML(): string {
  return `<div class="shot-meme"><svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="400" height="300" fill="#3A332D"/>
    <path d="M92 176h216l26-26H66z" fill="#B98443"/>
    <path d="M150 180c0-62 100-62 100 0z" fill="#F4EDE2"/>
    <path d="M156 142l6-44 30 28z M244 142l-6-44-30 28z" fill="#F4EDE2"/>
    <path d="M163 133l3-22 17 16z M237 133l-3-22-17 16z" fill="#F2A5C9"/>
    <ellipse cx="182" cy="153" rx="9" ry="11" fill="#2A2623"/><ellipse cx="218" cy="153" rx="9" ry="11" fill="#2A2623"/>
    <circle cx="185" cy="149" r="3" fill="#fff"/><circle cx="221" cy="149" r="3" fill="#fff"/>
    <path d="M195 166h10l-5 6z" fill="#DB5594"/>
    <path d="M171 168l-30-6M171 173l-30 2M229 168l30-6M229 173l30 2" stroke="#9A9184" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M84 176h232l-14 106H98z" fill="#DFA75A"/>
    <path d="M84 176h232l7 15H77z" fill="#EAB971"/>
    <g font-family="Impact,'Plus Jakarta Sans',sans-serif" font-weight="800" font-size="40" text-anchor="middle" fill="#fff" stroke="#000" stroke-width="5" paint-order="stroke" letter-spacing="1">
      <text x="200" y="52">IF I FITS</text><text x="200" y="278">I SITS</text>
    </g>
  </svg></div>`;
}

export function flightHTML(): string {
  const day = fmt.shortWeekday(WORLD.flight);
  return `<div class="shot-mail">
    <div class="from"><span class="av">NW</span><span><b>Northwind Air</b><br><span style="color:var(--muted)">trips@northwind.example</span></span></div>
    <h4>Your trip to Austin is confirmed</h4>
    <div class="row"><span>Flight</span><span>NW 1432</span></div>
    <div class="row"><span>Date</span><span>${day}</span></div>
    <div class="row"><span>Departs</span><span>SFO 8:05 AM</span></div>
    <div class="row"><span>Arrives</span><span>AUS 1:40 PM</span></div>
    <div class="row"><span>Confirmation</span><span>K7Q2PX</span></div>
    <div class="row"><span>Seat</span><span>14C</span></div>
  </div>`;
}

export function receiptHTML(): string {
  return `<div class="shot-receipt"><div class="paper">
    <b>CAFE LUMEN</b>
    <div class="line"><span>${fmt.short(WORLD.receipt)}</span><span>9:12 AM</span></div>
    <div class="line"><span>Oat latte</span><span>5.25</span></div>
    <div class="line"><span>Almond croissant</span><span>4.75</span></div>
    <div class="line"><span>Tip</span><span>2.00</span></div>
    <div class="line total"><span>Total</span><span>$12.00</span></div>
  </div></div>`;
}

export function bizcardHTML(): string {
  return `<div class="shot-bizcard"><div class="cardx">
    <div><div class="nm">Priya Raman</div><div>Product Designer, Northwind Studio</div></div>
    <div>priya@northwind.example<br>(415) 555-0142</div>
  </div></div>`;
}

export function articleHTML(): string {
  return `<div class="shot-article">
    <div class="site">The Daily Loaf</div>
    <h4>How to keep a sourdough starter alive while you travel</h4>
    <p>Feed it, chill it, and a starter keeps for two weeks without you. Here is the routine that works, and how to wake it up again when you get home.</p>
  </div>`;
}

export function noteHTML(): string {
  return `<div class="shot-note"><div class="stick">Wi-Fi: Sunroom-5G<br>password:<br>lemontree42</div></div>`;
}

export function reservationHTML(): string {
  return `<div class="shot-mail">
    <div class="from"><span class="av">R</span><span><b>Rosa's</b><br><span style="color:var(--muted)">book@rosas.example</span></span></div>
    <h4>Your table is confirmed</h4>
    <div class="row"><span>When</span><span>${fmt.shortWeekday(WORLD.thursday)}, 7:00 PM</span></div>
    <div class="row"><span>Party</span><span>2</span></div>
    <div class="row"><span>Where</span><span>88 Orchard St</span></div>
  </div>`;
}
