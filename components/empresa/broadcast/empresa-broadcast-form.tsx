'use client';

import { useActionState, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MarkdownEditor } from '@/components/workspace/kanban/markdown-editor';
import {
  sendEmpresaBroadcastAction,
  type SendEmpresaBroadcastState,
} from '@/actions/empresa/send-broadcast-empresa.action';
import { ImageUploadButton } from '@/components/broadcast/image-upload-button';
import { fetchWorkspacesAction, type WorkspaceItem } from '@/actions/empresa/fetch-workspaces.action';

interface Props {
  companyId: string;
}

const initialState: SendEmpresaBroadcastState = {};

export function EmpresaBroadcastForm({ companyId }: Props) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetMode, setTargetMode] = useState<'all' | 'specific'>('all');
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<Set<string>>(new Set());
  const [pasteLoading, setPasteLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Workspace list state
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [wsSearch, setWsSearch] = useState('');
  const [wsPage, setWsPage] = useState(1);
  const [wsTotal, setWsTotal] = useState(0);
  const [wsLoading, setWsLoading] = useState(false);

  useEffect(() => {
    if (targetMode !== 'specific') return;
    const timer = setTimeout(async () => {
      setWsLoading(true);
      const result = await fetchWorkspacesAction(companyId, wsPage, wsSearch || undefined);
      setWorkspaces(result.data);
      setWsTotal(result.total);
      setWsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [targetMode, wsSearch, wsPage, companyId]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setWsPage(1);
  }, [wsSearch]);

  const boundAction = sendEmpresaBroadcastAction.bind(null, companyId);

  const action = async (_prev: SendEmpresaBroadcastState, formData: FormData) => {
    formData.set('title', title);
    formData.set('body', body);
    if (targetMode === 'specific' && selectedWorkspaceIds.size > 0) {
      formData.set('workspaceIds', JSON.stringify([...selectedWorkspaceIds]));
    }
    const result = await boundAction(_prev, formData);
    if (result.success) {
      setTitle('');
      setBody('');
      setSelectedWorkspaceIds(new Set());
      setTargetMode('all');
    }
    return result;
  };

  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (!state.success) return;
    setShowSuccess(true);
    const timer = setTimeout(() => setShowSuccess(false), 5000);
    return () => clearTimeout(timer);
  }, [state.success]);

  const toggleWorkspace = (id: string) => {
    setSelectedWorkspaceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  async function handleEditorPaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const imageItem = Array.from(e.clipboardData.items).find(
      (item) => item.type.startsWith('image/'),
    );
    if (!imageItem) return;
    e.preventDefault();
    const file = imageItem.getAsFile();
    if (!file) return;
    setPasteLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/files/uploads/image', { method: 'POST', body: fd });
      if (!res.ok) throw new Error();
      const { url } = await res.json() as { url: string };
      setBody((b) => b + `\n\n![imagem colada](${url})\n`);
    } catch {
      // silently ignore
    } finally {
      setPasteLoading(false);
    }
  }

  const totalPages = Math.ceil(wsTotal / 10) || 1;

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título do comunicado"
          maxLength={200}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Conteúdo (Markdown)</Label>
        <div className="border rounded-md" onPaste={handleEditorPaste}>
          <MarkdownEditor
            value={body}
            onChange={setBody}
            placeholder="Escreva o conteúdo do comunicado. Suporta **markdown**, links e imagens externas."
            minRows={8}
          />
        </div>
        <ImageUploadButton onInsert={(md) => setBody((b) => b + md)} pasteLoading={pasteLoading} />
      </div>

      <div className="space-y-3">
        <Label>Destinatários</Label>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="targetMode"
              value="all"
              checked={targetMode === 'all'}
              onChange={() => setTargetMode('all')}
              className="accent-primary"
            />
            <span className="text-sm">Todos os membros da empresa</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="targetMode"
              value="specific"
              checked={targetMode === 'specific'}
              onChange={() => setTargetMode('specific')}
              className="accent-primary"
            />
            <span className="text-sm">Workspaces específicos</span>
          </label>
        </div>

        {targetMode === 'specific' && (
          <div className="border rounded-md p-3 space-y-2">
            <Input
              placeholder="Buscar workspace..."
              value={wsSearch}
              onChange={(e) => setWsSearch(e.target.value)}
              className="h-8 text-sm"
            />
            <div className="max-h-48 overflow-y-auto space-y-1 min-h-[60px]">
              {wsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                </div>
              ) : workspaces.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Nenhum workspace encontrado
                </p>
              ) : (
                workspaces.map((ws) => (
                  <label key={ws.id} className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-muted">
                    <input
                      type="checkbox"
                      className="accent-primary"
                      checked={selectedWorkspaceIds.has(ws.id)}
                      onChange={() => toggleWorkspace(ws.id)}
                    />
                    <span className="text-sm">{ws.name}</span>
                  </label>
                ))
              )}
            </div>
            {wsTotal > 10 && (
              <div className="flex items-center justify-between pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={wsPage <= 1}
                  onClick={() => setWsPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <span className="text-xs text-muted-foreground">
                  Página {wsPage} de {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={wsPage >= totalPages}
                  onClick={() => setWsPage((p) => p + 1)}
                >
                  Próxima
                </Button>
              </div>
            )}
            {selectedWorkspaceIds.size > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {selectedWorkspaceIds.size} workspace{selectedWorkspaceIds.size > 1 ? 's' : ''} selecionado{selectedWorkspaceIds.size > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
      </div>

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {showSuccess && (
        <p className="text-sm text-green-600 dark:text-green-400">Comunicado enviado com sucesso!</p>
      )}

      <Button
        type="submit"
        disabled={isPending || !title.trim() || !body.trim() || (targetMode === 'specific' && selectedWorkspaceIds.size === 0)}
      >
        {isPending ? 'Enviando...' : 'Enviar comunicado'}
      </Button>
    </form>
  );
}
