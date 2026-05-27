'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Tag, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createLabelAction } from '@/actions/projeto/create-label.action';
import { updateLabelAction } from '@/actions/projeto/update-label.action';
import { deleteLabelAction } from '@/actions/projeto/delete-label.action';
import type { ProjectLabel } from '@/actions/projeto/get-labels.action';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#3b82f6',
  '#64748b', '#78716c',
];

// ── Color Picker ─────────────────────────────────────────────────────────────

function isValidHex(val: string) {
  return /^#[0-9a-fA-F]{6}$/.test(val);
}

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(value);
  const nativeRef = useRef<HTMLInputElement>(null);

  function handleHexChange(raw: string) {
    setHexInput(raw);
    const normalized = raw.startsWith('#') ? raw : `#${raw}`;
    if (isValidHex(normalized)) onChange(normalized);
  }

  function handleNativeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const c = e.target.value;
    onChange(c);
    setHexInput(c);
  }

  // Keep hex input in sync when value changes externally (preset click)
  function handlePresetClick(c: string) {
    onChange(c);
    setHexInput(c);
  }

  return (
    <div className="space-y-2">
      {/* Swatches */}
      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => handlePresetClick(c)}
            className="h-5 w-5 rounded-full transition-transform hover:scale-110 flex-shrink-0"
            style={{
              backgroundColor: c,
              outline: value === c ? `2px solid ${c}` : 'none',
              outlineOffset: '2px',
            }}
          />
        ))}
      </div>

      {/* Native picker + hex input */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => nativeRef.current?.click()}
          className="h-8 w-8 rounded-md border flex-shrink-0 cursor-pointer"
          style={{ backgroundColor: value }}
          title="Abrir seletor de cor"
        />
        <input
          ref={nativeRef}
          type="color"
          value={value}
          onChange={handleNativeChange}
          className="sr-only"
        />
        <Input
          value={hexInput}
          onChange={(e) => handleHexChange(e.target.value)}
          placeholder="#6366f1"
          className="h-8 font-mono text-xs w-28"
          maxLength={7}
        />
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: isValidHex(value) ? value + '22' : undefined,
            color: isValidHex(value) ? value : undefined,
            border: isValidHex(value) ? `1px solid ${value}55` : undefined,
          }}
        >
          prévia
        </span>
      </div>
    </div>
  );
}

// ── LabelsManager ─────────────────────────────────────────────────────────────

interface LabelsManagerProps {
  projectId: string;
  workspaceId: string;
  labels: ProjectLabel[];
}

interface EditState {
  id: string;
  name: string;
  color: string;
  error?: string;
}

export function LabelsManager({ projectId, workspaceId, labels }: LabelsManagerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [createName, setCreateName] = useState('');
  const [createColor, setCreateColor] = useState(PRESET_COLORS[0]);
  const [createError, setCreateError] = useState('');

  const [savePending, startSave] = useTransition();
  const [createPending, startCreate] = useTransition();
  const [deletePending, startDelete] = useTransition();

  function handleSaveEdit() {
    if (!editing) return;
    const fd = new FormData();
    fd.set('projectId', projectId);
    fd.set('workspaceId', workspaceId);
    fd.set('labelId', editing.id);
    fd.set('name', editing.name);
    fd.set('color', editing.color);

    startSave(async () => {
      const result = await updateLabelAction({}, fd);
      if (result.error) {
        setEditing((prev) => prev && { ...prev, error: result.error });
      } else {
        setEditing(null);
        router.refresh();
      }
    });
  }

  function handleCreate() {
    if (!createName.trim()) { setCreateError('Nome obrigatório'); return; }
    const fd = new FormData();
    fd.set('projectId', projectId);
    fd.set('workspaceId', workspaceId);
    fd.set('name', createName.trim());
    fd.set('color', createColor);

    startCreate(async () => {
      const result = await createLabelAction({}, fd);
      if (result.error) {
        setCreateError(result.error);
      } else {
        setCreateName('');
        setCreateError('');
        router.refresh();
      }
    });
  }

  function handleDelete(labelId: string) {
    startDelete(async () => {
      await deleteLabelAction(projectId, labelId, workspaceId);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Tag className="h-3.5 w-3.5" />
          Labels
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar Labels</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lista de labels */}
          {labels.length > 0 && (
            <div className="space-y-1">
              {labels.map((label) =>
                editing?.id === label.id ? (
                  <div key={label.id} className="rounded-md border p-3 space-y-3">
                    <Input
                      value={editing.name}
                      onChange={(e) => setEditing((prev) => prev && { ...prev, name: e.target.value })}
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); handleSaveEdit(); }
                        if (e.key === 'Escape') setEditing(null);
                      }}
                    />
                    <ColorPicker
                      value={editing.color}
                      onChange={(c) => setEditing((prev) => prev && { ...prev, color: c })}
                    />
                    {editing.error && (
                      <p className="text-xs text-destructive">{editing.error}</p>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditing(null)}
                        disabled={savePending}
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={savePending}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        {savePending ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    key={label.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 group"
                  >
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium flex-1"
                      style={{
                        backgroundColor: label.color + '22',
                        color: label.color,
                        border: `1px solid ${label.color}55`,
                      }}
                    >
                      {label.name}
                    </span>

                    <button
                      type="button"
                      onClick={() => setEditing({ id: label.id, name: label.name, color: label.color })}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-opacity"
                    >
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          type="button"
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-opacity"
                          disabled={deletePending}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir label?</AlertDialogTitle>
                          <AlertDialogDescription>
                            A label <strong>{label.name}</strong> será removida de todas as tasks.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(label.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ),
              )}
            </div>
          )}

          {labels.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Nenhuma label criada ainda.
            </p>
          )}

          {/* Formulário de criação */}
          <div className="space-y-3 border-t pt-3">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Nova label
            </Label>

            <div className="flex gap-2">
              <Input
                value={createName}
                onChange={(e) => { setCreateName(e.target.value); setCreateError(''); }}
                placeholder="Nome da label"
                maxLength={50}
                className="flex-1"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreate(); } }}
              />
              <Button type="button" size="icon" onClick={handleCreate} disabled={createPending}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <ColorPicker value={createColor} onChange={setCreateColor} />

            {createError && <p className="text-xs text-destructive">{createError}</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
