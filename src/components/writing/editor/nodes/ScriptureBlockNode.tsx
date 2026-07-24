import type { ReactNode } from 'react';
import { BookOpenText, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $applyNodeReplacement, $getNodeByKey, DecoratorNode, type NodeKey, type SerializedLexicalNode } from 'lexical';
import { useSpecialBlockEditor } from './SpecialBlockEditorContext';
import type { ScriptureData } from './scriptureTypes';

export type SerializedScriptureBlockNode = SerializedLexicalNode & { data: ScriptureData; type: 'scripture-block'; version: 1; };

const ScriptureBlockView = ({ data, nodeKey }: { data: ScriptureData; nodeKey: NodeKey }) => {
  const [editor] = useLexicalComposerContext();
  const { onEditScripture, onRemoveScripture } = useSpecialBlockEditor();
  const isPassage = data.display === 'passage';
  const lines = data.verses?.length ? data.verses : data.text.split(/\n+/).filter(Boolean).map((text, index) => ({ number: index + 1, text }));
  const showVerseNumbers = isPassage || (data.verses?.length || 0) > 1;
  const editable = editor.isEditable();
  const remove = () => { void Promise.resolve(onRemoveScripture?.(data)).then(() => editor.update(() => $getNodeByKey(nodeKey)?.remove())); };
  const drag = (event: React.DragEvent<HTMLButtonElement>) => { event.dataTransfer.setData('application/x-aic-writing-block', nodeKey); event.dataTransfer.effectAllowed = 'move'; };
  return <section aria-label={`${isPassage ? 'Scripture reading' : 'Scripture'} ${data.reference}`} className="group relative my-8 rounded-2xl border border-red-900/15 bg-white px-6 py-6 shadow-lg shadow-zinc-900/5 dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/25 sm:px-8" contentEditable={false}>{editable ? <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-xl border border-black/10 bg-white/95 p-1 shadow-sm dark:border-white/10 dark:bg-[#171717]/95"><button aria-label="Drag Scripture block" className="grid size-8 cursor-grab place-items-center rounded-lg text-zinc-700 hover:bg-black/5 active:cursor-grabbing dark:text-stone-200 dark:hover:bg-white/10" draggable onDragStart={drag} title="Drag Scripture block" type="button"><GripVertical size={15} /></button><button aria-label="Edit Scripture block" className="grid size-8 place-items-center rounded-lg text-zinc-700 hover:bg-black/5 dark:text-stone-200 dark:hover:bg-white/10" onClick={() => onEditScripture?.({ data, nodeKey })} title="Edit Scripture block" type="button"><Pencil size={15} /></button><button aria-label="Remove Scripture block" className="grid size-8 place-items-center rounded-lg text-red-800 hover:bg-red-50 dark:text-red-200 dark:hover:bg-red-950/40" onClick={remove} title="Remove Scripture block" type="button"><Trash2 size={15} /></button></div> : null}<p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-red-800 dark:text-red-200"><BookOpenText size={15} /> {isPassage ? 'Reading' : 'Scripture'}</p>{showVerseNumbers ? <div className="mt-5 grid gap-3 font-serif text-lg leading-8 sm:text-xl">{lines.map((verse) => <p key={`${verse.number}-${verse.text}`}><sup className="mr-2 font-sans text-xs font-bold text-zinc-500 dark:text-stone-400">{verse.number}</sup>{verse.text}</p>)}</div> : <p className="mt-5 font-serif text-2xl leading-10 sm:text-3xl">{data.text}</p>}<p className="mt-5 border-t border-red-900/10 pt-4 text-sm text-zinc-600 dark:border-white/10 dark:text-stone-300">{data.reference}{data.version ? <> <span aria-hidden="true">&middot;</span> {data.version}</> : null}</p></section>;
};

export class ScriptureBlockNode extends DecoratorNode<ReactNode> {
  __data: ScriptureData;
  static getType(): string { return 'scripture-block'; }
  static clone(node: ScriptureBlockNode): ScriptureBlockNode { return new ScriptureBlockNode(node.__data, node.__key); }
  static importJSON(serializedNode: SerializedScriptureBlockNode): ScriptureBlockNode { return $createScriptureBlockNode(serializedNode.data); }
  constructor(data: ScriptureData, key?: NodeKey) { super(key); this.__data = data; }
  createDOM(): HTMLElement { return document.createElement('div'); }
  updateDOM(): false { return false; }
  getData(): ScriptureData { return this.__data; }
  setData(data: ScriptureData): void { this.getWritable().__data = data; }
  exportJSON(): SerializedScriptureBlockNode { return { ...super.exportJSON(), data: this.__data, type: 'scripture-block', version: 1 }; }
  decorate(): ReactNode { return <ScriptureBlockView data={this.__data} nodeKey={this.getKey()} />; }
}
export const $createScriptureBlockNode = (data: ScriptureData) => $applyNodeReplacement(new ScriptureBlockNode({ ...data, display: data.display === 'passage' ? 'passage' : 'block' }));

