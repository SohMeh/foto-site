/** Small helpers for building the demos without a framework. */

export function el<T extends HTMLElement = HTMLElement>(html: string): T {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild as T;
}

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export function esc(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ENTITIES[char] ?? char);
}

/** "A", "A and B", "A, B and C", exactly as Foto writes destinations. */
export function listWords(words: string[]): string {
  if (words.length === 0) return '';
  if (words.length === 1) return words[0];
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

export function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, reducedMotion() ? Math.min(ms, 60) : ms));
}

export function narrow(): boolean {
  return window.matchMedia('(max-width: 720px)').matches;
}

/**
 * A scaled copy of an element, covering a box of `width` by `height`: the thumbnail of a
 * screenshot is the thing itself, made small.
 */
export function miniCopy(source: HTMLElement, width: number, height: number, size?: { width: number; height: number }): HTMLElement {
  const box = size ?? source.getBoundingClientRect();
  const sourceWidth = box.width || source.offsetWidth || 400;
  const sourceHeight = box.height || source.offsetHeight || 300;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const copy = source.cloneNode(true) as HTMLElement;
  copy.removeAttribute('id');
  copy.removeAttribute('tabindex');
  copy.removeAttribute('role');
  copy.removeAttribute('aria-label');
  copy.setAttribute('aria-hidden', 'true');
  copy.classList.add('clone');
  Object.assign(copy.style, {
    position: 'absolute', left: `${(width - sourceWidth * scale) / 2}px`, top: '0px', right: 'auto', bottom: 'auto',
    width: `${sourceWidth}px`, height: `${sourceHeight}px`, transform: `scale(${scale})`, margin: '0', zIndex: '0',
  });
  const frame = document.createElement('span');
  Object.assign(frame.style, { position: 'relative', display: 'block', width: `${width}px`, height: `${height}px`, overflow: 'hidden' });
  frame.append(copy);
  return frame;
}
