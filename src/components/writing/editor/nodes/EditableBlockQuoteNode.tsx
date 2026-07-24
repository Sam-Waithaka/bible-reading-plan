import type { ReactNode } from 'react';
import { GripVertical, Pencil, Quote, Trash2 } from 'lucide-react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $applyNodeReplacement, $getNodeByKey, DecoratorNode, type LexicalNode, type NodeKey, type SerializedLexicalNode } from 'lexical';
import { useSpecialBlockEditor } from './SpecialBlockEditorContext';

export type BlockQuoteData = {
  attribution?: string;
  content: string;
  context?: string;
};
export type SerializedEditableBlockQuoteNode = SerializedLexicalNode & { data: BlockQuoteData; type: 'editorial-blockquote'; version: 1; };

const EditableBlockQuoteView = ({ data, nodeKey }: { data: BlockQuoteData; nodeKey: NodeKey }) => {
  const [editor] = useLexicalComposerContext();
  const { onEditQuotation } = useSpecialBlockEditor();
  const editable = editor.isEditable();
  const remove = () => editor.update(() => $getNodeByKey(nodeKey)?.remove());
  const drag = (event: React.DragEvent<HTMLButtonElement>) => { event.dataTransfer.setData('application/x-aic-writing-block', nodeKey); event.dataTransfer.effectAllowed = 'move'; };

  return <blockquote className="group relative my-8 rounded-2xl border border-black/10 border-l-2 border-l-red-800/70 bg-[#fffaf0] px-6 py-6 font-serif text-xl leading-9 shadow-lg shadow-zinc-900/5 dark:border-white/10 dark:border-l-red-300/60 dark:bg-zinc-950 dark:shadow-black/25 sm:px-8" contentEditable={false}>
    {editable ? <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-xl border border-black/10 bg-white/95 p-1 font-sans shadow-sm dark:border-white/10 dark:bg-[#171717]/95">
      <button aria-label="Drag blockquote" className="grid size-8 cursor-grab place-items-center rounded-lg text-zinc-700 hover:bg-black/5 active:cursor-grabbing dark:text-stone-200 dark:hover:bg-white/10" draggable onDragStart={drag} title="Drag blockquote" type="button"><GripVertical size={15} /></button>
      <button aria-label="Edit blockquote" className="grid size-8 place-items-center rounded-lg text-zinc-700 hover:bg-black/5 dark:text-stone-200 dark:hover:bg-white/10" onClick={() => onEditQuotation?.({ data, nodeKey })} title="Edit blockquote" type="button"><Pencil size={15} /></button>
      <button aria-label="Remove blockquote" className="grid size-8 place-items-center rounded-lg text-red-800 hover:bg-red-50 dark:text-red-200 dark:hover:bg-red-950/40" onClick={remove} title="Remove blockquote" type="button"><Trash2 size={15} /></button>
    </div> : null}
    <p className="flex items-center gap-2 font-sans text-xs font-black uppercase tracking-[0.18em] text-red-800 dark:text-red-200"><Quote size={15} /> Quotation</p>
    <p className="mt-5 whitespace-pre-line">{data.content}</p>
    {data.context ? <p className="mt-4 font-sans text-sm text-zinc-600 dark:text-stone-300">{data.context}</p> : null}
    {data.attribution ? <p className="mt-3 font-sans text-sm font-bold text-zinc-700 dark:text-stone-200"><span aria-hidden="true">&mdash;</span> {data.attribution}</p> : null}
  </blockquote>;
};

export class EditableBlockQuoteNode extends DecoratorNode<ReactNode> {
  __data: BlockQuoteData;
  static getType(): string { return 'editorial-blockquote'; }
  static clone(node: EditableBlockQuoteNode): EditableBlockQuoteNode { return new EditableBlockQuoteNode(node.__data, node.__key); }
  static importJSON(serialized: SerializedEditableBlockQuoteNode): EditableBlockQuoteNode { return $createEditableBlockQuoteNode(serialized.data); }
  constructor(data: BlockQuoteData, key?: NodeKey) { super(key); this.__data = data; }
  createDOM(): HTMLElement { return document.createElement('div'); }
  updateDOM(): false { return false; }
  getData(): BlockQuoteData { return this.__data; }
  setData(data: BlockQuoteData): void { this.getWritable().__data = data; }
  exportJSON(): SerializedEditableBlockQuoteNode { return { ...super.exportJSON(), data: this.__data, type: 'editorial-blockquote', version: 1 }; }
  decorate(): ReactNode { return <EditableBlockQuoteView data={this.__data} nodeKey={this.getKey()} />; }
}
export const $createEditableBlockQuoteNode = (data: BlockQuoteData) => $applyNodeReplacement(new EditableBlockQuoteNode(data));
export const $isEditableBlockQuoteNode = (node: LexicalNode | null | undefined): node is EditableBlockQuoteNode => node instanceof EditableBlockQuoteNode;

