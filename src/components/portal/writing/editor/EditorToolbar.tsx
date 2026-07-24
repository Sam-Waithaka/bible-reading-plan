import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlignLeft, ArrowRight, Bold, CheckCircle2, ChevronDown, FileText, Globe2, Headphones, Image, Italic, Link2, List, ListOrdered, ListX, Loader2, MessageSquareQuote, Minus, PlayCircle, Quote, Redo2, ScrollText, Search, Strikethrough, Subscript, Superscript, Type, Underline, Undo2, X } from 'lucide-react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import { $createRangeSelection, $createTextNode, $getRoot, $getSelection, $isRangeSelection, $setSelection, CAN_REDO_COMMAND, CAN_UNDO_COMMAND, COMMAND_PRIORITY_LOW, FORMAT_TEXT_COMMAND, REDO_COMMAND, UNDO_COMMAND } from 'lexical';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND } from '@lexical/list';
import { $createLinkNode, $toggleLink, formatUrl } from '@lexical/link';
import { $createDefaultChurchBlock } from '../../../writing/editor/nodes/ChurchBlockNode';
import { applyBlockFormat, toggleEditorialEmphasis, type BlockFormat } from './blockFormatting';
import type { LexicalSelectionBookmark } from '../../../writing/editor/selectionBookmark';
import type { AudioVisualItem } from '../../../../types/audioVisual';
import type { PublicWritingCard } from '../../../../types/writing';
import { searchPublicAudioVisual, searchPublicWritings } from '../../../../services/publicSearchApi';

type EditorToolbarProps = { darkMode: boolean; onRequestMedia?: (bookmark: LexicalSelectionBookmark | null) => void; onRequestScripture?: (bookmark: LexicalSelectionBookmark | null) => void; onRequestPastoral?: (bookmark: LexicalSelectionBookmark | null) => void; mediaDisabledLabel?: string; };
type ToolbarButtonProps = { active?: boolean; children: React.ReactNode; darkMode: boolean; disabled?: boolean; label: string; onClick: () => void; };
type LinkDialogState = { bookmark: LexicalSelectionBookmark | null; error: string; newTab: boolean; selectedDestination: LinkDestination | null; selectedText: string; text: string; url: string };
const emptyLinkDialog = (bookmark: LexicalSelectionBookmark | null, selectedText = ''): LinkDialogState => ({ bookmark, error: '', newTab: true, selectedDestination: null, selectedText, text: selectedText, url: '' });
type LinkDestination = {
  kind: 'external' | 'media' | 'writing';
  meta: string;
  subtitle: string;
  title: string;
  url: string;
};
type LinkSearchState = { media: AudioVisualItem[]; status: 'done' | 'error' | 'idle' | 'loading'; writings: PublicWritingCard[] };
const emptyLinkSearch: LinkSearchState = { media: [], status: 'idle', writings: [] };
const getWritingLinkPath = (writing: PublicWritingCard) => writing.slug ? `/resources/${encodeURIComponent(writing.slug)}` : '/resources';
const getMediaLinkPath = (item: AudioVisualItem) => item.slug ? `/media/watch/${encodeURIComponent(item.slug)}` : '/media';
const stripWww = (host: string) => host.replace(/^www\./i, '');
const getExternalPreview = (value: string): LinkDestination | null => {
  const trimmed = value.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  const mightBeUrl = /^https?:\/\//i.test(trimmed) || /^www\./i.test(trimmed) || /^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed);
  if (!mightBeUrl) return null;

  try {
    const url = formatUrl(trimmed);
    const parsed = new URL(url);
    const host = stripWww(parsed.hostname);
    return { kind: 'external', meta: 'External Website', subtitle: host, title: host, url };
  } catch {
    return { kind: 'external', meta: 'Invalid URL', subtitle: 'Check the destination and try again.', title: 'Invalid URL', url: '' };
  }
};
const writingResultToDestination = (writing: PublicWritingCard): LinkDestination => ({
  kind: 'writing',
  meta: writing.resource_type_detail?.name || 'Article',
  subtitle: writing.excerpt || writing.resource_type_detail?.name || 'Published writing',
  title: writing.title || 'Untitled writing',
  url: getWritingLinkPath(writing),
});
const mediaResultToDestination = (item: AudioVisualItem): LinkDestination => ({
  kind: 'media',
  meta: item.mediaTypeLabel || item.mediaType || 'Media',
  subtitle: item.speaker || item.scriptureReference || item.descriptionExcerpt || item.mediaTypeLabel || 'Media resource',
  title: item.title || 'Untitled media',
  url: getMediaLinkPath(item),
});

const ToolbarButton = ({ active = false, children, darkMode, disabled = false, label, onClick }: ToolbarButtonProps) => {
  const stateClass = active ? darkMode ? 'border-red-900/50 bg-red-950/40 text-red-200' : 'border-red-200 bg-red-50 text-red-800' : darkMode ? 'border-transparent text-stone-200 hover:bg-white/10' : 'border-transparent text-zinc-700 hover:bg-black/5';
  return <button aria-label={label} className={'grid size-10 place-items-center rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-red-800/30 disabled:cursor-not-allowed disabled:opacity-40 ' + stateClass} disabled={disabled} onClick={onClick} title={label} type="button">{children}</button>;
};
const ToolbarGroup = ({ children, darkMode, separated = true }: { children: React.ReactNode; darkMode: boolean; separated?: boolean }) => <div className={'flex shrink-0 items-center gap-1 ' + (separated ? 'border-l pl-2 ' + (darkMode ? 'border-white/10' : 'border-[#eaded0]') : '')}>{children}</div>;
const blockOptions: Array<{ label: string; value: BlockFormat }> = [{ label: 'Paragraph', value: 'paragraph' }, { label: 'Heading 2', value: 'h2' }, { label: 'Heading 3', value: 'h3' }, { label: 'Heading 4', value: 'h4' }, { label: 'Heading 5', value: 'h5' }, { label: 'Heading 6', value: 'h6' }];

const EditorToolbar = ({ darkMode, mediaDisabledLabel, onRequestMedia, onRequestPastoral, onRequestScripture }: EditorToolbarProps) => {
  const [editor] = useLexicalComposerContext();
  const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false, strikethrough: false, subscript: false, superscript: false, underline: false });
  const [canRedo, setCanRedo] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [activeBlock, setActiveBlock] = useState<BlockFormat>('paragraph');
  const [blockMenuOpen, setBlockMenuOpen] = useState(false);
  const [linkDialog, setLinkDialog] = useState<LinkDialogState | null>(null);
  const [linkSearch, setLinkSearch] = useState<LinkSearchState>(emptyLinkSearch);
  const [blockMenuPosition, setBlockMenuPosition] = useState({ left: 0, top: 0 });
  const blockTriggerRef = useRef<HTMLButtonElement>(null);
  const blockMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => mergeRegister(editor.registerCommand(CAN_UNDO_COMMAND, (payload) => { setCanUndo(payload); return false; }, COMMAND_PRIORITY_LOW), editor.registerCommand(CAN_REDO_COMMAND, (payload) => { setCanRedo(payload); return false; }, COMMAND_PRIORITY_LOW), editor.registerUpdateListener(({ editorState }) => editorState.read(() => { const selection = $getSelection(); if (!$isRangeSelection(selection)) return setActiveFormats({ bold: false, italic: false, strikethrough: false, subscript: false, superscript: false, underline: false }); setActiveFormats({ bold: selection.hasFormat('bold'), italic: selection.hasFormat('italic'), strikethrough: selection.hasFormat('strikethrough'), subscript: selection.hasFormat('subscript'), superscript: selection.hasFormat('superscript'), underline: selection.hasFormat('underline') }); }))), [editor]);
  const captureBookmark = () => { let bookmark: LexicalSelectionBookmark | null = null; editor.getEditorState().read(() => { const selection = $getSelection(); if ($isRangeSelection(selection)) bookmark = { anchor: { key: selection.anchor.key, offset: selection.anchor.offset, type: selection.anchor.type }, focus: { key: selection.focus.key, offset: selection.focus.offset, type: selection.focus.type } }; }); return bookmark; };
  const restoreBookmark = (bookmark: LexicalSelectionBookmark | null) => { if (!bookmark) return; const selection = $createRangeSelection(); selection.anchor.set(bookmark.anchor.key, bookmark.anchor.offset, bookmark.anchor.type); selection.focus.set(bookmark.focus.key, bookmark.focus.offset, bookmark.focus.type); $setSelection(selection); };
  const selectedTextForLink = () => { let text = ''; editor.getEditorState().read(() => { const selection = $getSelection(); if ($isRangeSelection(selection)) text = selection.getTextContent(); }); return text; };
  const formatBlock = (block: BlockFormat) => editor.update(() => { applyBlockFormat(block); });
  const updateBlockMenuPosition = () => {
    const bounds = blockTriggerRef.current?.getBoundingClientRect();
    if (bounds) setBlockMenuPosition({ left: bounds.left, top: bounds.bottom + 8 });
  };
  const toggleBlockMenu = () => {
    if (blockMenuOpen) { setBlockMenuOpen(false); return; }
    updateBlockMenuPosition();
    setBlockMenuOpen(true);
  };
  useEffect(() => {
    if (!blockMenuOpen) return;
    const closeIfOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!blockMenuRef.current?.contains(target) && !blockTriggerRef.current?.contains(target)) setBlockMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setBlockMenuOpen(false); };
    window.addEventListener('scroll', updateBlockMenuPosition, true);
    window.addEventListener('resize', updateBlockMenuPosition);
    document.addEventListener('pointerdown', closeIfOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('scroll', updateBlockMenuPosition, true);
      window.removeEventListener('resize', updateBlockMenuPosition);
      document.removeEventListener('pointerdown', closeIfOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [blockMenuOpen]);
  useEffect(() => {
    if (!linkDialog) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setLinkDialog(null); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [linkDialog]);
  useEffect(() => {
    if (!linkDialog) { setLinkSearch(emptyLinkSearch); return; }
    const query = linkDialog.url.trim();
    if (linkDialog.selectedDestination || query.length < 2 || getExternalPreview(query)) { setLinkSearch(emptyLinkSearch); return; }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLinkSearch({ ...emptyLinkSearch, status: 'loading' });
      Promise.all([
        searchPublicWritings({ page: 1, page_size: 4, q: query }, controller.signal),
        searchPublicAudioVisual({ page: 1, page_size: 4, q: query }, controller.signal),
      ]).then(([writingsPage, mediaPage]) => {
        setLinkSearch({ media: mediaPage.results, status: 'done', writings: writingsPage.results });
      }).catch((error) => {
        if (controller.signal.aborted) return;
        console.error('Unable to search link destinations.', error);
        setLinkSearch({ ...emptyLinkSearch, status: 'error' });
      });
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [linkDialog?.selectedDestination, linkDialog?.url]);
  const insertChurchBlock = (kind: 'divider') => editor.update(() => { const selection = $getSelection(); if ($isRangeSelection(selection)) selection.insertNodes([$createDefaultChurchBlock(kind)]); });
  const openLinkDialog = () => { setLinkSearch(emptyLinkSearch); setLinkDialog(emptyLinkDialog(captureBookmark(), selectedTextForLink())); };
  const chooseLinkDestination = (destination: LinkDestination) => setLinkDialog((current) => current ? { ...current, error: '', selectedDestination: destination, url: destination.title } : current);
  const applyLink = () => {
    if (!linkDialog) return;
    const rawDestination = linkDialog.url.trim();
    const externalPreview = getExternalPreview(rawDestination);
    const destination = linkDialog.selectedDestination || (externalPreview?.url ? externalPreview : null);
    const textLabel = linkDialog.text.trim();
    if (!destination?.url) { setLinkDialog({ ...linkDialog, error: externalPreview?.meta === 'Invalid URL' ? 'That URL does not look valid yet.' : 'Choose an internal resource or paste a valid URL.' }); return; }
    if (!linkDialog.selectedText && !textLabel) { setLinkDialog({ ...linkDialog, error: 'Add text to display for this link.' }); return; }
    const url = destination.url;
    const attributes = { rel: linkDialog.newTab ? 'noopener noreferrer' : null, target: linkDialog.newTab ? '_blank' : null, url };
    editor.update(() => {
      restoreBookmark(linkDialog.bookmark);
      const selection = $getSelection();
      if ($isRangeSelection(selection) && !selection.isCollapsed()) {
        $toggleLink(attributes);
        return;
      }
      const linkNode = $createLinkNode(url, { rel: attributes.rel, target: attributes.target });
      linkNode.append($createTextNode(textLabel || url));
      if ($isRangeSelection(selection)) selection.insertNodes([linkNode]);
      else $getRoot().append(linkNode);
    });
    setLinkDialog(null);
  };
  const externalPreview = linkDialog ? getExternalPreview(linkDialog.url) : null;
  const selectedLinkDestination = linkDialog?.selectedDestination || null;
  const hasLinkSearchResults = linkSearch.writings.length > 0 || linkSearch.media.length > 0;
  const linkDialogModal = linkDialog && typeof document !== 'undefined' ? createPortal(
    <div aria-label="Insert link" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center p-3 sm:p-6" role="dialog">
      <button aria-label="Close link dialog" className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setLinkDialog(null)} type="button" />
      <form className={'relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border shadow-2xl ' + (darkMode ? 'border-white/10 bg-[#151515] text-stone-100 shadow-black/50' : 'border-[#eaded0] bg-[#fffdf9] text-zinc-950 shadow-zinc-950/20')} onSubmit={(event) => { event.preventDefault(); applyLink(); }}>
        <header className="flex items-start justify-between gap-4 border-b border-[#eaded0] px-6 py-5 dark:border-white/10 sm:px-7">
          <div className="flex items-start gap-4">
            <span className={darkMode ? 'grid size-10 shrink-0 place-items-center rounded-full bg-red-950/50 text-red-200' : 'grid size-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-800'}><Link2 size={17} /></span>
            <div>
              <h2 className="font-serif text-2xl leading-tight sm:text-[1.7rem]">Link to a webpage, article or resource</h2>
              <p className={darkMode ? 'mt-1 text-sm leading-6 text-stone-400' : 'mt-1 text-sm leading-6 text-[#786f66]'}>Connect your readers to another resource without interrupting the flow.</p>
            </div>
          </div>
          <button aria-label="Close" className={darkMode ? 'grid size-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-stone-200 transition hover:bg-white/10' : 'grid size-10 shrink-0 place-items-center rounded-full border border-[#eaded0] bg-white text-zinc-700 transition hover:bg-red-50 hover:text-red-800'} onClick={() => setLinkDialog(null)} type="button"><X size={18} /></button>
        </header>
        <div className="min-h-0 overflow-y-auto px-6 py-5 sm:px-7">
          <div className="grid gap-5">
            <section className="grid gap-2">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-red-800 dark:text-red-200">Destination</p>
              <label className="relative block">
                <Search className={darkMode ? 'pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-stone-500' : 'pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#786f66]'} />
                <input autoFocus className={darkMode ? 'w-full rounded-2xl border border-red-900/50 bg-[#0d0d0d] py-3 pl-11 pr-4 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-red-700 focus:ring-4 focus:ring-red-900/20' : 'w-full rounded-2xl border border-red-200 bg-white py-3 pl-11 pr-4 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-red-700 focus:ring-4 focus:ring-red-100'} onChange={(event) => setLinkDialog({ ...linkDialog, error: '', selectedDestination: null, url: event.target.value })} placeholder="Search resources or paste a URL..." value={linkDialog.url} />
              </label>
              {selectedLinkDestination ? <div className={darkMode ? 'flex items-center gap-3 rounded-2xl border border-red-900/40 bg-red-950/20 px-4 py-3' : 'flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50/70 px-4 py-3'}><CheckCircle2 className="size-5 shrink-0 text-red-800 dark:text-red-200" /><span><span className="block text-sm font-black">{selectedLinkDestination.title}</span><span className={darkMode ? 'block text-xs text-stone-400' : 'block text-xs text-[#786f66]'}>{selectedLinkDestination.meta} <span aria-hidden="true">&middot;</span> {selectedLinkDestination.url}</span></span></div> : externalPreview ? <div className={darkMode ? 'flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3' : 'flex items-center gap-3 rounded-2xl border border-[#eaded0] bg-white px-4 py-3'}>{externalPreview.url ? <CheckCircle2 className="size-5 shrink-0 text-green-700 dark:text-green-300" /> : <Globe2 className="size-5 shrink-0 text-red-800 dark:text-red-200" />}<span><span className="block text-sm font-black">{externalPreview.url ? 'Valid website' : 'Invalid URL'}</span><span className={darkMode ? 'block text-xs text-stone-400' : 'block text-xs text-[#786f66]'}>{externalPreview.subtitle}</span></span></div> : null}
              {!externalPreview && !selectedLinkDestination && linkDialog.url.trim().length >= 2 ? <div className={darkMode ? 'overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]' : 'overflow-hidden rounded-2xl border border-[#eaded0] bg-white shadow-sm shadow-zinc-950/5'}>
                {linkSearch.status === 'loading' ? <div className="flex items-center gap-3 px-4 py-5 text-sm font-bold"><Loader2 className="size-4 animate-spin text-red-800 dark:text-red-200" /> Searching church resources...</div> : null}
                {linkSearch.status === 'error' ? <div className="px-4 py-5 text-sm font-bold text-red-800 dark:text-red-200">Search is unavailable right now. Paste a URL instead.</div> : null}
                {linkSearch.status === 'done' && !hasLinkSearchResults ? <div className="px-4 py-5 text-sm font-bold text-[#786f66] dark:text-stone-400">No internal matches. Paste an external URL to link outside the site.</div> : null}
                {linkSearch.writings.length > 0 ? <div className="flex items-center justify-between gap-3 border-b border-[#eaded0] px-4 py-3 dark:border-white/10"><span className="inline-flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.2em] text-red-800 dark:text-red-200"><FileText size={13} /> Resources</span><a className="inline-flex items-center gap-1 text-xs font-bold text-red-800 transition hover:text-red-700 dark:text-red-200" href="/resources" target="_blank" rel="noreferrer">View all resources <ArrowRight size={13} /></a></div> : null}
                {linkSearch.writings.map((writing, index) => { const destination = writingResultToDestination(writing); return <button className={(index === 0 ? darkMode ? 'flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/10' : 'flex w-full items-center justify-between gap-3 bg-red-50/70 px-4 py-3 text-left transition hover:bg-red-50' : 'flex w-full items-center justify-between gap-3 border-t border-black/5 px-4 py-3 text-left transition hover:bg-black/[0.03] dark:border-white/5 dark:hover:bg-white/10')} key={`writing-${writing.id}`} onClick={() => chooseLinkDestination(destination)} type="button"><span className="flex min-w-0 items-center gap-3"><span className={darkMode ? 'grid size-9 shrink-0 place-items-center rounded-xl bg-white/5 text-stone-300' : 'grid size-9 shrink-0 place-items-center rounded-xl bg-[#f8f4ec] text-red-800'}><FileText size={16} /></span><span className="min-w-0"><span className="block truncate text-sm font-black">{destination.title}</span><span className={darkMode ? 'block truncate text-xs text-stone-400' : 'block truncate text-xs text-[#786f66]'}>{destination.meta}</span></span></span><ChevronDown className="-rotate-90 shrink-0" size={15} /></button>; })}
                {linkSearch.media.length > 0 ? <div className="border-t border-[#eaded0] px-4 py-3 dark:border-white/10"><span className="inline-flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.2em] text-red-800 dark:text-red-200"><PlayCircle size={13} /> Media</span></div> : null}
                {linkSearch.media.map((item) => { const destination = mediaResultToDestination(item); const isAudio = /audio|podcast|music/i.test(item.mediaType || item.mediaTypeLabel || ''); return <button className="flex w-full items-center justify-between gap-3 border-t border-black/5 px-4 py-3 text-left transition hover:bg-black/[0.03] dark:border-white/5 dark:hover:bg-white/10" key={`media-${item.id || item.slug}`} onClick={() => chooseLinkDestination(destination)} type="button"><span className="flex min-w-0 items-center gap-3"><span className={darkMode ? 'grid size-9 shrink-0 place-items-center rounded-xl bg-white/5 text-stone-300' : 'grid size-9 shrink-0 place-items-center rounded-xl bg-[#f8f4ec] text-[#786f66]'}>{isAudio ? <Headphones size={16} /> : <PlayCircle size={16} />}</span><span className="min-w-0"><span className="block truncate text-sm font-black">{destination.title}</span><span className={darkMode ? 'block truncate text-xs text-stone-400' : 'block truncate text-xs text-[#786f66]'}>{destination.meta}{destination.subtitle ? <> <span aria-hidden="true">&middot;</span> {destination.subtitle}</> : null}</span></span></span><ChevronDown className="-rotate-90 shrink-0" size={15} /></button>; })}
              </div> : null}
            </section>
            <section className="grid gap-2">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-red-800 dark:text-red-200">Selected text</p>
              {linkDialog.selectedText ? <div className={darkMode ? 'flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4' : 'flex items-start gap-4 rounded-2xl border border-[#eaded0] bg-[#fffaf0] px-4 py-4'}><span className={darkMode ? 'grid size-10 shrink-0 place-items-center rounded-full bg-white/5 text-stone-300' : 'grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#786f66]'}><Quote size={18} /></span><p><span className="block text-sm font-black">{linkDialog.selectedText}</span><span className={darkMode ? 'mt-1 block text-xs text-stone-400' : 'mt-1 block text-xs text-[#786f66]'}>This is the text that will be linked.</span></p></div> : <label className="grid gap-2"><input className={darkMode ? 'w-full rounded-2xl border border-white/10 bg-[#0d0d0d] px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-red-700 focus:ring-4 focus:ring-red-900/20' : 'w-full rounded-2xl border border-[#eaded0] bg-[#fffaf0] px-4 py-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-red-700 focus:ring-4 focus:ring-red-100'} onChange={(event) => setLinkDialog({ ...linkDialog, error: '', text: event.target.value })} placeholder="Text to display" value={linkDialog.text} /></label>}
            </section>
            <section className="flex items-center justify-between gap-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-red-800 dark:text-red-200">Open in new tab</p>
                <p className={darkMode ? 'mt-1 text-xs text-stone-400' : 'mt-1 text-xs text-[#786f66]'}>Readers will not lose their place while exploring another resource.</p>
              </div>
              <button aria-checked={linkDialog.newTab} className={'relative h-8 w-14 shrink-0 rounded-full border transition ' + (linkDialog.newTab ? 'border-red-800 bg-red-800' : darkMode ? 'border-white/10 bg-white/10' : 'border-[#eaded0] bg-[#fffaf0]')} onClick={() => setLinkDialog({ ...linkDialog, newTab: !linkDialog.newTab })} role="switch" type="button"><span className={'absolute top-1 size-6 rounded-full bg-white shadow transition ' + (linkDialog.newTab ? 'left-7' : 'left-1')} /></button>
            </section>
            {linkDialog.error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-800 dark:bg-red-950/30 dark:text-red-200">{linkDialog.error}</p> : null}
          </div>
        </div>
        <footer className="flex items-center justify-between gap-4 border-t border-[#eaded0] px-6 py-5 dark:border-white/10 sm:px-7">
          <button className={darkMode ? 'rounded-full border border-white/10 px-6 py-3 text-sm font-bold text-stone-200 transition hover:bg-white/10' : 'rounded-full border border-[#eaded0] bg-white px-6 py-3 text-sm font-bold text-zinc-700 transition hover:bg-[#fffaf0]'} onClick={() => setLinkDialog(null)} type="button">Cancel</button>
          <button className="inline-flex items-center gap-2 rounded-full bg-red-800 px-7 py-3 text-sm font-black text-white shadow-lg shadow-red-950/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60" type="submit"><Link2 size={16} /> Insert Link <ArrowRight size={16} /></button>
        </footer>
      </form>
    </div>,
    document.body,
  ) : null;
  const surfaceClass = darkMode ? 'border-white/10 bg-[#171717] text-stone-100' : 'border-[#eaded0] bg-[#fcfaf6] text-zinc-950';
  const menuClass = darkMode ? 'border-white/10 bg-[#171717] text-stone-100 shadow-black/40' : 'border-[#eaded0] bg-white text-zinc-950 shadow-zinc-900/15';
  const blockMenu = blockMenuOpen && typeof document !== 'undefined' ? createPortal(
    <div className={'fixed z-50 w-44 rounded-2xl border p-1.5 shadow-xl ' + menuClass} ref={blockMenuRef} role="listbox" style={{ left: blockMenuPosition.left, top: blockMenuPosition.top }}>
      {blockOptions.map((option) => <button aria-selected={activeBlock === option.value} className={'flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ' + (activeBlock === option.value ? 'bg-red-800 text-white' : darkMode ? 'text-stone-200 hover:bg-white/10' : 'text-zinc-700 hover:bg-red-950/5')} key={option.value} onClick={() => { formatBlock(option.value); setActiveBlock(option.value); setBlockMenuOpen(false); }} role="option" type="button">{option.label}</button>)}
    </div>,
    document.body,
  ) : null;
  return <>{blockMenu}{linkDialogModal}<div className="sticky top-[4.75rem] z-20 overflow-x-auto border-b border-[#eaded0] shadow-sm dark:border-white/10"><div aria-label="Writing tools" className={'flex min-w-max items-center gap-2 px-3 py-2 ' + surfaceClass} role="toolbar"><div className="relative shrink-0"><button aria-expanded={blockMenuOpen} aria-haspopup="listbox" aria-label="Text style" ref={blockTriggerRef} className={darkMode ? 'inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-zinc-950 px-3 text-xs font-bold text-stone-100 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-red-800/30' : 'inline-flex h-10 items-center gap-2 rounded-xl border border-[#eaded0] bg-[#fffaf0] px-3 text-xs font-bold text-zinc-950 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-red-800/30'} onClick={toggleBlockMenu} type="button"><AlignLeft aria-hidden="true" className="size-4 text-red-800" /><span>{blockOptions.find((option) => option.value === activeBlock)?.label}</span><ChevronDown aria-hidden="true" className={'size-4 transition ' + (blockMenuOpen ? 'rotate-180' : '')} /></button></div><ToolbarGroup darkMode={darkMode} separated={false}><ToolbarButton active={activeFormats.bold} darkMode={darkMode} label="Bold" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}><Bold size={16} /></ToolbarButton><ToolbarButton active={activeFormats.italic} darkMode={darkMode} label="Italic" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}><Italic size={16} /></ToolbarButton><ToolbarButton active={activeFormats.underline} darkMode={darkMode} label="Underline" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}><Underline size={16} /></ToolbarButton><ToolbarButton active={activeFormats.strikethrough} darkMode={darkMode} label="Strikethrough" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}><Strikethrough size={16} /></ToolbarButton><ToolbarButton active={activeFormats.superscript} darkMode={darkMode} label="Superscript" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript')}><Superscript size={16} /></ToolbarButton><ToolbarButton active={activeFormats.subscript} darkMode={darkMode} label="Subscript" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript')}><Subscript size={16} /></ToolbarButton><ToolbarButton darkMode={darkMode} label="Editorial emphasis" onClick={() => editor.update(toggleEditorialEmphasis)}><Type size={16} /></ToolbarButton><ToolbarButton darkMode={darkMode} label="Add link" onClick={openLinkDialog}><Link2 size={16} /></ToolbarButton></ToolbarGroup><ToolbarGroup darkMode={darkMode}><ToolbarButton darkMode={darkMode} label="Bulleted list" onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}><List size={16} /></ToolbarButton><ToolbarButton darkMode={darkMode} label="Numbered list" onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}><ListOrdered size={16} /></ToolbarButton><ToolbarButton darkMode={darkMode} label="Clear list formatting" onClick={() => editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)}><ListX size={16} /></ToolbarButton></ToolbarGroup><ToolbarGroup darkMode={darkMode}>{onRequestScripture ? <ToolbarButton darkMode={darkMode} label="Insert Scripture" onClick={() => onRequestScripture(captureBookmark())}><ScrollText size={16} /></ToolbarButton> : null}<ToolbarButton darkMode={darkMode} label="Insert reflection, prayer, application, or quotation" onClick={() => onRequestPastoral?.(captureBookmark())}><MessageSquareQuote size={16} /></ToolbarButton></ToolbarGroup><ToolbarGroup darkMode={darkMode}><ToolbarButton darkMode={darkMode} label="Insert divider" onClick={() => insertChurchBlock('divider')}><Minus size={16} /></ToolbarButton>{onRequestMedia ? <ToolbarButton darkMode={darkMode} label="Insert image" onClick={() => onRequestMedia(captureBookmark())}><Image size={16} /></ToolbarButton> : mediaDisabledLabel ? <ToolbarButton darkMode={darkMode} disabled label={mediaDisabledLabel} onClick={() => undefined}><Image size={16} /></ToolbarButton> : null}</ToolbarGroup><ToolbarGroup darkMode={darkMode}><ToolbarButton darkMode={darkMode} disabled={!canUndo} label="Undo" onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}><Undo2 size={16} /></ToolbarButton><ToolbarButton darkMode={darkMode} disabled={!canRedo} label="Redo" onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}><Redo2 size={16} /></ToolbarButton></ToolbarGroup></div></div></>;
};
export default EditorToolbar;








