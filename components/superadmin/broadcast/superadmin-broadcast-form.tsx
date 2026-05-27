'use client';

import { useActionState, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FREE } from '@/lib/limits';
import { CharCounter, MarkdownEditor } from '@/components/workspace/kanban/markdown-editor';
import {
  sendSuperadminBroadcastAction,
  type SendBroadcastState,
} from '@/actions/superadmin/send-broadcast.action';
import { ImageUploadButton } from '@/components/broadcast/image-upload-button';
import { fetchCompaniesAction, type CompanyItem } from '@/actions/superadmin/fetch-companies.action';

const initialState: SendBroadcastState = {};

export function SuperadminBroadcastForm() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetMode, setTargetMode] = useState<'all' | 'specific'>('all');
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set());
  const [pasteLoading, setPasteLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Company list state
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [compSearch, setCompSearch] = useState('');
  const [compPage, setCompPage] = useState(1);
  const [compTotal, setCompTotal] = useState(0);
  const [compLoading, setCompLoading] = useState(false);

  useEffect(() => {
    if (targetMode !== 'specific') return;
    const timer = setTimeout(async () => {
      setCompLoading(true);
      const result = await fetchCompaniesAction(compPage, compSearch || undefined);
      setCompanies(result.data);
      setCompTotal(result.total);
      setCompLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [targetMode, compSearch, compPage]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCompPage(1);
  }, [compSearch]);

  const action = async (_prev: SendBroadcastState, formData: FormData) => {
    formData.set('title', title);
    formData.set('body', body);
    if (targetMode === 'specific' && selectedCompanyIds.size > 0) {
      formData.set('companyIds', JSON.stringify([...selectedCompanyIds]));
    }
    const result = await sendSuperadminBroadcastAction(_prev, formData);
    if (result.success) {
      setTitle('');
      setBody('');
      setSelectedCompanyIds(new Set());
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

  const toggleCompany = (id: string) => {
    setSelectedCompanyIds((prev) => {
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

  const totalPages = Math.ceil(compTotal / 10) || 1;

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
          maxLength={FREE.broadcastTitle}
          required
        />
        <CharCounter value={title.length} max={FREE.broadcastTitle} />
      </div>

      <div className="space-y-2">
        <Label>Conteúdo (Markdown)</Label>
        <div className="border rounded-md" onPaste={handleEditorPaste}>
          <MarkdownEditor
            value={body}
            onChange={setBody}
            placeholder="Escreva o conteúdo do comunicado. Suporta **markdown**, links e imagens externas."
            minRows={8}
            maxLength={FREE.broadcastBody}
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
            <span className="text-sm">Todos os usuários da plataforma</span>
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
            <span className="text-sm">Empresas específicas</span>
          </label>
        </div>

        {targetMode === 'specific' && (
          <div className="border rounded-md p-3 space-y-2">
            <Input
              placeholder="Buscar empresa..."
              value={compSearch}
              onChange={(e) => setCompSearch(e.target.value)}
              className="h-8 text-sm"
            />
            <div className="max-h-48 overflow-y-auto space-y-1 min-h-[60px]">
              {compLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                </div>
              ) : companies.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">Nenhuma empresa encontrada</p>
              ) : (
                companies.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-muted">
                    <input
                      type="checkbox"
                      className="accent-primary"
                      checked={selectedCompanyIds.has(c.id)}
                      onChange={() => toggleCompany(c.id)}
                    />
                    <span className="text-sm">{c.legalName}</span>
                  </label>
                ))
              )}
            </div>
            {compTotal > 10 && (
              <div className="flex items-center justify-between pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={compPage <= 1}
                  onClick={() => setCompPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <span className="text-xs text-muted-foreground">
                  Página {compPage} de {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={compPage >= totalPages}
                  onClick={() => setCompPage((p) => p + 1)}
                >
                  Próxima
                </Button>
              </div>
            )}
            {selectedCompanyIds.size > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedCompanyIds.size} empresa{selectedCompanyIds.size > 1 ? 's' : ''} selecionada{selectedCompanyIds.size > 1 ? 's' : ''}
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
        disabled={isPending || !title.trim() || !body.trim() || (targetMode === 'specific' && selectedCompanyIds.size === 0)}
      >
        {isPending ? 'Enviando...' : 'Enviar comunicado'}
      </Button>
    </form>
  );
}
