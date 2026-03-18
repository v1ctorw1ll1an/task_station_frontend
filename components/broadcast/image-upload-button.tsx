'use client';

import { useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onInsert: (markdown: string) => void;
  pasteLoading?: boolean;
}

export function ImageUploadButton({ onInsert, pasteLoading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/files/uploads/image', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? 'Erro ao enviar imagem');
      }
      const { url } = await res.json() as { url: string };
      onInsert(`\n\n![${file.name}](${url})\n`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar imagem');
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const isDisabled = loading || !!pasteLoading;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isDisabled}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus className="h-3.5 w-3.5 mr-1.5" />
        {pasteLoading ? 'Colando imagem...' : loading ? 'Enviando...' : 'Inserir manualmente'}
      </Button>
      <p className="text-xs text-muted-foreground">Tamanho máximo: 16 MB</p>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
