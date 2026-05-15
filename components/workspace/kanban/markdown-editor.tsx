'use client';

import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import {
  Bold,
  Code,
  Heading2,
  Italic,
  Link,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Strikethrough,
  X,
} from 'lucide-react';
import type { TaskAttachment } from '@/actions/projeto/get-attachments.action';
import { IMAGE_MAX_COUNT, IMAGE_MAX_MB } from './task-attachments-section';

// ---------------------------------------------------------------------------
// MarkdownDisplay — read-only markdown renderer (reused in comment list)
// ---------------------------------------------------------------------------

const mdComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  h1: ({ ...p }) => <h1 className="text-lg font-bold mb-2 mt-1" {...p} />,
  h2: ({ ...p }) => <h2 className="text-base font-semibold mb-1.5 mt-1" {...p} />,
  h3: ({ ...p }) => <h3 className="text-sm font-semibold mb-1 mt-1" {...p} />,
  p: ({ ...p }) => <p className="text-sm mb-2 last:mb-0" {...p} />,
  ul: ({ ...p }) => <ul className="list-disc list-inside text-sm mb-2 space-y-0.5" {...p} />,
  ol: ({ ...p }) => <ol className="list-decimal list-inside text-sm mb-2 space-y-0.5" {...p} />,
  li: ({ ...p }) => <li className="text-sm" {...p} />,
  pre: ({ ...p }) => <pre className="bg-muted rounded-md p-2 mb-2 overflow-x-auto" {...p} />,
  code: ({ className, children, ...rest }) => {
    const isBlock = String(children ?? '').includes('\n') || !!className;
    return isBlock ? (
      <code className={`text-xs font-mono whitespace-pre-wrap ${className ?? ''}`} {...rest}>
        {children}
      </code>
    ) : (
      <code className="bg-muted rounded px-1 py-0.5 text-xs font-mono" {...rest}>
        {children}
      </code>
    );
  },
  blockquote: ({ ...p }) => (
    <blockquote
      className="border-l-2 border-muted-foreground/30 pl-3 italic text-muted-foreground text-sm mb-2"
      {...p}
    />
  ),
  a: ({ ...p }) => (
    <a className="text-primary underline" target="_blank" rel="noopener noreferrer" {...p} />
  ),
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  img: ({ ...p }) => <img className="max-w-full rounded-md my-2" {...p} />,
  hr: ({ ...p }) => <hr className="my-3 border-border" {...p} />,
  strong: ({ ...p }) => <strong className="font-semibold" {...p} />,
  em: ({ ...p }) => <em className="italic" {...p} />,
  del: ({ ...p }) => <del className="line-through" {...p} />,
};

export function MarkdownDisplay({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={mdComponents}>
      {content}
    </ReactMarkdown>
  );
}

// ---------------------------------------------------------------------------
// MarkdownEditor — toolbar + textarea + preview tabs
// ---------------------------------------------------------------------------

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Forward the raw textarea change event (for @mention detection, etc.) */
  onChangeEvent?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  /** Share the internal textarea ref with the parent (for focus/selection) */
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  placeholder?: string;
  minRows?: number;
  /** When provided, Ctrl+V images are uploaded to this task's attachments */
  projectId?: string;
  taskId?: string;
  /** Current image attachment count — used to enforce the 3-image limit on paste */
  imageCount?: number;
  /** Called after a successful paste upload so the attachment section can reflect the new file */
  onPasteAttachmentAdded?: (att: TaskAttachment) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  alwaysEdit?: boolean;
  /** Truncates the preview to ~5 lines with a gradient + "Ver mais/menos" toggle */
  collapsible?: boolean;
}

export function MarkdownEditor({
  value,
  onChange,
  onChangeEvent,
  textareaRef: externalRef,
  placeholder = 'Escreva aqui...',
  minRows = 4,
  projectId,
  taskId,
  imageCount,
  onPasteAttachmentAdded,
  disabled,
  autoFocus,
  alwaysEdit,
  collapsible,
}: MarkdownEditorProps) {
  // Start in edit mode when autoFocus is requested or alwaysEdit is true
  const [tab, setTab] = useState<'edit' | 'preview'>(autoFocus || alwaysEdit ? 'edit' : 'preview');
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const ref = (externalRef ?? internalRef) as React.RefObject<HTMLTextAreaElement | null>;


  // -------------------------------------------------------------------------
  // Toolbar helpers
  // -------------------------------------------------------------------------

  function wrapSelection(before: string, after: string, defaultText: string) {
    const el = ref.current;
    if (!el) return;
    const s = el.selectionStart;
    const e = el.selectionEnd;
    const sel = value.slice(s, e) || defaultText;
    const next = value.slice(0, s) + before + sel + after + value.slice(e);
    onChange(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + sel.length);
    }, 0);
  }

  function prependLine(prefix: string, defaultText: string) {
    const el = ref.current;
    if (!el) return;
    const s = el.selectionStart;
    const lineStart = value.lastIndexOf('\n', s - 1) + 1;
    const lineEnd = value.indexOf('\n', s);
    const actualEnd = lineEnd === -1 ? value.length : lineEnd;
    const lineText = value.slice(lineStart, actualEnd) || defaultText;
    const hasPrefix = lineText.startsWith(prefix);
    const next = hasPrefix
      ? value.slice(0, lineStart) + lineText.slice(prefix.length) + value.slice(actualEnd)
      : value.slice(0, lineStart) + prefix + lineText + value.slice(actualEnd);
    onChange(next);
    setTimeout(() => el.focus(), 0);
  }

  function insertCodeBlock() {
    const el = ref.current;
    if (!el) return;
    const s = el.selectionStart;
    const e = el.selectionEnd;
    const sel = value.slice(s, e) || 'código';
    const next = value.slice(0, s) + '```\n' + sel + '\n```' + value.slice(e);
    onChange(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(s + 4, s + 4 + sel.length);
    }, 0);
  }

  function insertLink() {
    const el = ref.current;
    if (!el) return;
    const s = el.selectionStart;
    const e = el.selectionEnd;
    const sel = value.slice(s, e) || 'texto';
    const next = value.slice(0, s) + `[${sel}](url)` + value.slice(e);
    onChange(next);
    setTimeout(() => {
      el.focus();
      // Select "url" so the user can type the URL directly
      el.setSelectionRange(s + sel.length + 3, s + sel.length + 6);
    }, 0);
  }

  // -------------------------------------------------------------------------
  // Image paste upload
  // -------------------------------------------------------------------------

  async function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const imgItem = Array.from(e.clipboardData.items).find(
      (item) => item.kind === 'file' && item.type.startsWith('image/'),
    );
    if (!imgItem || !projectId || !taskId) return;
    e.preventDefault();
    const file = imgItem.getAsFile();
    if (!file) return;

    if ((imageCount ?? 0) >= IMAGE_MAX_COUNT) {
      setPasteError(
        `Limite de ${IMAGE_MAX_COUNT} imagens atingido. Máximo ${IMAGE_MAX_MB} MB por foto.`,
      );
      return;
    }
    if (file.size > IMAGE_MAX_MB * 1024 * 1024) {
      setPasteError(`Imagem excede o limite de ${IMAGE_MAX_MB} MB.`);
      return;
    }

    setPasteError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file, `paste-${Date.now()}.png`);
      const res = await fetch(
        `/api/files/projetos/${projectId}/tasks/${taskId}/attachments`,
        { method: 'POST', body: fd },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { message?: string };
        setPasteError(data.message ?? 'Erro ao enviar imagem.');
        return;
      }
      const att = (await res.json()) as TaskAttachment;
      onPasteAttachmentAdded?.(att);
      const url = `/api/files/projetos/${projectId}/tasks/${taskId}/attachments/${att.id}/file`;
      const el = ref.current;
      const s = el?.selectionStart ?? value.length;
      const next = value.slice(0, s) + `\n\n![Imagem](${url})\n` + value.slice(s);
      onChange(next);
    } finally {
      setUploading(false);
    }
  }

  // -------------------------------------------------------------------------
  // Toolbar definition
  // -------------------------------------------------------------------------

  type ToolbarItem =
    | { icon: React.ReactNode; title: string; action: () => void }
    | { separator: true };

  const toolbar: ToolbarItem[] = [
    { icon: <Bold className="h-3.5 w-3.5" />, title: 'Negrito', action: () => wrapSelection('**', '**', 'negrito') },
    { icon: <Italic className="h-3.5 w-3.5" />, title: 'Itálico', action: () => wrapSelection('_', '_', 'itálico') },
    { icon: <Strikethrough className="h-3.5 w-3.5" />, title: 'Riscado', action: () => wrapSelection('~~', '~~', 'riscado') },
    { separator: true },
    { icon: <Heading2 className="h-3.5 w-3.5" />, title: 'Título', action: () => prependLine('## ', 'Título') },
    { icon: <Quote className="h-3.5 w-3.5" />, title: 'Citação', action: () => prependLine('> ', 'citação') },
    { separator: true },
    { icon: <Code className="h-3.5 w-3.5" />, title: 'Código inline', action: () => wrapSelection('`', '`', 'código') },
    {
      icon: <span className="text-[10px] font-mono leading-none select-none">```</span>,
      title: 'Bloco de código',
      action: insertCodeBlock,
    },
    { separator: true },
    { icon: <List className="h-3.5 w-3.5" />, title: 'Lista', action: () => prependLine('- ', 'item') },
    { icon: <ListOrdered className="h-3.5 w-3.5" />, title: 'Lista numerada', action: () => prependLine('1. ', 'item') },
    { separator: true },
    { icon: <Link className="h-3.5 w-3.5" />, title: 'Link', action: insertLink },
  ];

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (tab === 'preview') {
    const enterEdit = () => {
      setTab('edit');
      setTimeout(() => ref.current?.focus(), 0);
    };

    if (collapsible && value) {
      return (
        <div>
          <div className="relative">
            <div
              role="button"
              tabIndex={0}
              onDoubleClick={enterEdit}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); enterEdit(); } }}
              className={`cursor-default select-text rounded-md px-3 py-2 hover:bg-muted/30 transition-colors overflow-hidden${previewExpanded ? '' : ' max-h-[7.5rem]'}`}
            >
              <MarkdownDisplay content={value} />
            </div>
            {!previewExpanded && (
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent pointer-events-none rounded-b-md" />
            )}
          </div>
          <button
            type="button"
            onClick={() => setPreviewExpanded((v) => !v)}
            className="mt-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {previewExpanded ? 'Ver menos' : 'Ver mais'}
          </button>
        </div>
      );
    }

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={value ? undefined : enterEdit}
        onDoubleClick={value ? enterEdit : undefined}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            enterEdit();
          }
        }}
        className={`min-h-[5rem] rounded-md px-3 py-2 hover:bg-muted/30 transition-colors${value ? ' cursor-default select-text' : ' cursor-text'}`}
      >
        {value ? (
          <MarkdownDisplay content={value} />
        ) : (
          <p className="text-sm italic text-muted-foreground">{placeholder}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-input bg-transparent overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center border-b bg-muted/30 px-1.5 py-1 gap-2 flex-wrap">
        <div className="flex items-center gap-0.5 flex-wrap min-w-0 flex-1">
          {toolbar.map((item, i) =>
            'separator' in item ? (
              <span key={i} className="w-px h-4 bg-border mx-0.5 shrink-0" />
            ) : (
              <button
                key={i}
                type="button"
                title={item.title}
                onMouseDown={(e) => {
                  e.preventDefault(); // Keep textarea focused
                  item.action();
                }}
                className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                {item.icon}
              </button>
            ),
          )}
          {uploading && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground ml-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Enviando imagem...
            </span>
          )}
        </div>
      </div>

      {pasteError && (
        <p className="px-3 py-1.5 text-xs text-destructive bg-destructive/10 border-b border-destructive/20 flex items-center gap-1">
          <X className="h-3 w-3 shrink-0" />
          {pasteError}
        </p>
      )}

      {/* Textarea */}
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          onChangeEvent?.(e);
          if (pasteError) setPasteError(null);
        }}
        onPaste={handlePaste}
        onBlur={alwaysEdit ? undefined : () => setTab('preview')}
        placeholder={placeholder}
        rows={minRows}
        disabled={disabled}
        autoFocus={autoFocus}
        className="flex w-full bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none resize-none overflow-y-auto"
      />
    </div>
  );
}
