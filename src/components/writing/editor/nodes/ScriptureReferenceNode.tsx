import type { ReactNode } from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { $applyNodeReplacement, DecoratorNode, type LexicalNode, type NodeKey, type SerializedLexicalNode } from 'lexical';
import type { ScriptureData } from './scriptureTypes';

export type SerializedScriptureReferenceNode = SerializedLexicalNode & { data: ScriptureData; type: 'scripture-reference'; version: 1; };

type FloatingPosition = { left: number; maxWidth: number; top: number };

const CARD_GAP = 10;
const CARD_MARGIN = 16;
const CARD_WIDTH = 320;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getEditorBounds = (anchor: HTMLElement) => {
  const editorSurface = anchor.closest('section[aria-label="Article body editor"]');
  const viewportBounds = { bottom: window.innerHeight - CARD_MARGIN, left: CARD_MARGIN, right: window.innerWidth - CARD_MARGIN, top: CARD_MARGIN };

  if (!(editorSurface instanceof HTMLElement)) return viewportBounds;

  const rect = editorSurface.getBoundingClientRect();
  return {
    bottom: clamp(rect.bottom, CARD_MARGIN, window.innerHeight - CARD_MARGIN),
    left: clamp(rect.left, CARD_MARGIN, window.innerWidth - CARD_MARGIN),
    right: clamp(rect.right, CARD_MARGIN, window.innerWidth - CARD_MARGIN),
    top: clamp(rect.top, CARD_MARGIN, window.innerHeight - CARD_MARGIN),
  };
};

const calculateFloatingPosition = (anchor: HTMLElement, card: HTMLElement): FloatingPosition => {
  const anchorRect = anchor.getBoundingClientRect();
  const bounds = getEditorBounds(anchor);
  const availableWidth = Math.max(220, bounds.right - bounds.left);
  const cardWidth = Math.min(CARD_WIDTH, availableWidth);
  const cardHeight = card.offsetHeight || 180;
  const preferredLeft = anchorRect.left;
  const left = clamp(preferredLeft, bounds.left, bounds.right - cardWidth);
  const belowTop = anchorRect.bottom + CARD_GAP;
  const aboveTop = anchorRect.top - cardHeight - CARD_GAP;
  const fitsBelow = belowTop + cardHeight <= bounds.bottom;
  const top = fitsBelow ? belowTop : clamp(aboveTop, bounds.top, bounds.bottom - cardHeight);

  return { left, maxWidth: cardWidth, top };
};

const ScriptureReferenceView = ({ data }: { data: ScriptureData }) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<FloatingPosition | null>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<number | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current === null) return;
    window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  }, [clearCloseTimer]);

  const show = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    const card = cardRef.current;
    if (!anchor || !card) return;
    setPosition(calculateFloatingPosition(anchor, card));
  }, []);

  useLayoutEffect(() => {
    if (!open) { setPosition(null); return undefined; }

    updatePosition();
    const frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, updatePosition]);

  useLayoutEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  const card = open && typeof document !== 'undefined' ? createPortal(
    <span
      className={'fixed z-50 block rounded-2xl border p-4 text-left shadow-xl transition-opacity ' + (position ? 'opacity-100' : 'pointer-events-none opacity-0') + ' border-black/10 bg-white text-zinc-950 dark:border-white/10 dark:bg-zinc-950 dark:text-stone-100'}
      onMouseEnter={show}
      onMouseLeave={scheduleClose}
      ref={cardRef}
      role="dialog"
      style={{ left: position?.left ?? 0, maxWidth: position?.maxWidth ?? CARD_WIDTH, top: position?.top ?? 0, width: 'min(20rem, calc(100vw - 2rem))' }}
    >
      <span className="block text-xs font-black uppercase tracking-[0.16em] text-red-800 dark:text-red-200">{data.reference}{data.version ? <> <span aria-hidden="true">&middot;</span> {data.version}</> : null}</span>
      <span className="mt-3 block font-serif text-base leading-7">{data.text}</span>
    </span>,
    document.body,
  ) : null;

  return <span className="inline" onMouseEnter={show} onMouseLeave={scheduleClose}>{card}<button aria-expanded={open} aria-label={`View Scripture reference ${data.reference}`} className="inline rounded-sm text-inherit text-red-800 underline-offset-2 transition hover:underline focus:outline-none focus:ring-2 focus:ring-red-800/30 dark:text-red-200" onBlur={scheduleClose} onClick={() => setOpen((current) => !current)} onFocus={show} ref={anchorRef} type="button">{data.reference}</button></span>;
};

export class ScriptureReferenceNode extends DecoratorNode<ReactNode> {
  __data: ScriptureData;
  static getType(): string { return 'scripture-reference'; }
  static clone(node: ScriptureReferenceNode): ScriptureReferenceNode { return new ScriptureReferenceNode(node.__data, node.__key); }
  static importJSON(serializedNode: SerializedScriptureReferenceNode): ScriptureReferenceNode { return $createScriptureReferenceNode(serializedNode.data); }
  constructor(data: ScriptureData, key?: NodeKey) { super(key); this.__data = data; }
  createDOM(): HTMLElement { return document.createElement('span'); }
  updateDOM(): false { return false; }
  isInline(): boolean { return true; }
  getData(): ScriptureData { return this.__data; }
  setData(data: ScriptureData): void { this.getWritable().__data = data; }
  exportJSON(): SerializedScriptureReferenceNode { return { ...super.exportJSON(), data: this.__data, type: 'scripture-reference', version: 1 }; }
  decorate(): ReactNode { return <ScriptureReferenceView data={this.__data} />; }
}

export const $createScriptureReferenceNode = (data: ScriptureData) => $applyNodeReplacement(new ScriptureReferenceNode({ ...data, display: 'inline' }));
export const $isScriptureReferenceNode = (node: LexicalNode | null | undefined): node is ScriptureReferenceNode => node instanceof ScriptureReferenceNode;
