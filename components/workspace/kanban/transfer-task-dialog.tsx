'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { Copy, Scissors, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getTransferTargetsAction,
  type TransferTargetWorkspace,
} from '@/actions/projeto/get-transfer-targets.action';
import {
  transferTaskAction,
  type TransferTaskPayload,
} from '@/actions/projeto/transfer-task.action';
import type { KanbanTask } from './kanban-card';

interface TransferTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: KanbanTask;
  projectId: string;
  defaultMode?: 'copy' | 'cut';
}

export function TransferTaskDialog({
  open,
  onOpenChange,
  task,
  projectId,
  defaultMode = 'copy',
}: TransferTaskDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [mode, setMode] = useState<'copy' | 'cut'>(defaultMode);
  const [targetProjectId, setTargetProjectId] = useState('');
  const [targetColumnId, setTargetColumnId] = useState('');
  const [includeAssignees, setIncludeAssignees] = useState(false);
  const [includeLabels, setIncludeLabels] = useState<'skip' | 'match' | 'create'>('skip');
  const [includeComments, setIncludeComments] = useState(false);
  const [includeAttachments, setIncludeAttachments] = useState(false);
  const [includeHistory, setIncludeHistory] = useState(false);
  const [includeDates, setIncludeDates] = useState(true);

  const [workspaces, setWorkspaces] = useState<TransferTargetWorkspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [skippedAssignees, setSkippedAssignees] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const loadTargets = useCallback(async () => {
    setLoading(true);
    setError('');
    const result = await getTransferTargetsAction(projectId);
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setWorkspaces(result.data);
      if (result.data.length === 0) {
        setError('Nenhum projeto disponível para transferência');
      }
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep(1);
      setMode(defaultMode);
      setTargetProjectId('');
      setTargetColumnId('');
      setIncludeAssignees(false);
      setIncludeLabels('skip');
      setIncludeComments(false);
      setIncludeAttachments(false);
      setIncludeHistory(false);
      setIncludeDates(true);
      setError('');
      setSuccessMessage('');
      setSkippedAssignees([]);
      loadTargets();
    }
  }, [open, defaultMode, loadTargets]);

  const selectedProject = workspaces
    .flatMap((ws) => ws.projects)
    .find((p) => p.id === targetProjectId);

  const columns = selectedProject?.columns ?? [];

  const handleProjectChange = (value: string) => {
    setTargetProjectId(value);
    setTargetColumnId('');
  };

  const canProceedStep1 = targetProjectId && targetColumnId;

  const handleTransfer = () => {
    startTransition(async () => {
      setError('');
      const payload: TransferTaskPayload = {
        mode,
        targetProjectId,
        targetColumnId,
        includeAssignees,
        includeLabels,
        includeComments,
        includeAttachments,
        includeHistory,
        includeDates,
      };

      const result = await transferTaskAction(projectId, task.id, payload);
      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data?.skippedAssignees?.length) {
        setSkippedAssignees(result.data.skippedAssignees);
      }

      const label = mode === 'copy' ? 'copiada' : 'movida';
      setSuccessMessage(`Task "${task.title}" ${label} com sucesso!`);
      setTimeout(() => onOpenChange(false), 1500);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'copy' ? (
              <Copy className="h-5 w-5" />
            ) : (
              <Scissors className="h-5 w-5" />
            )}
            {mode === 'copy' ? 'Copiar' : 'Mover'} task para outro projeto
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Escolha o modo, projeto e coluna de destino'
              : 'Selecione quais dados transferir'}
          </DialogDescription>
        </DialogHeader>

        {successMessage ? (
          <div className="py-6 text-center">
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              {successMessage}
            </p>
            {skippedAssignees.length > 0 && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                Responsáveis ignorados (sem acesso ao destino):{' '}
                {skippedAssignees.join(', ')}
              </p>
            )}
          </div>
        ) : step === 1 ? (
          <Step1
            mode={mode}
            onModeChange={setMode}
            workspaces={workspaces}
            targetProjectId={targetProjectId}
            onProjectChange={handleProjectChange}
            targetColumnId={targetColumnId}
            onColumnChange={setTargetColumnId}
            columns={columns}
            loading={loading}
            error={error}
          />
        ) : (
          <Step2
            mode={mode}
            task={task}
            includeAssignees={includeAssignees}
            onIncludeAssigneesChange={setIncludeAssignees}
            includeLabels={includeLabels}
            onIncludeLabelsChange={setIncludeLabels}
            includeComments={includeComments}
            onIncludeCommentsChange={setIncludeComments}
            includeAttachments={includeAttachments}
            onIncludeAttachmentsChange={setIncludeAttachments}
            includeHistory={includeHistory}
            onIncludeHistoryChange={setIncludeHistory}
            includeDates={includeDates}
            onIncludeDatesChange={setIncludeDates}
            error={error}
          />
        )}

        {!successMessage && (
          <div className="flex justify-between pt-2">
            {step === 2 ? (
              <Button variant="outline" onClick={() => setStep(1)} disabled={isPending}>
                Voltar
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Cancelar
              </Button>
              {step === 1 ? (
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                >
                  Próximo
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleTransfer} disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : mode === 'copy' ? (
                    <Copy className="mr-1 h-4 w-4" />
                  ) : (
                    <Scissors className="mr-1 h-4 w-4" />
                  )}
                  {mode === 'copy' ? 'Copiar' : 'Mover'}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Step 1: Destination ───────────────────────────────────────────────────────

function Step1({
  mode,
  onModeChange,
  workspaces,
  targetProjectId,
  onProjectChange,
  targetColumnId,
  onColumnChange,
  columns,
  loading,
  error,
}: {
  mode: 'copy' | 'cut';
  onModeChange: (mode: 'copy' | 'cut') => void;
  workspaces: TransferTargetWorkspace[];
  targetProjectId: string;
  onProjectChange: (value: string) => void;
  targetColumnId: string;
  onColumnChange: (value: string) => void;
  columns: { id: string; name: string }[];
  loading: boolean;
  error: string;
}) {
  return (
    <div className="space-y-4">
      {/* Mode selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Modo</Label>
        <RadioGroup value={mode} onValueChange={(v) => onModeChange(v as 'copy' | 'cut')}>
          <div className="flex items-center gap-3 rounded-md border p-3">
            <RadioGroupItem value="copy" id="mode-copy" />
            <Label htmlFor="mode-copy" className="flex cursor-pointer items-center gap-2">
              <Copy className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Copiar</p>
                <p className="text-xs text-muted-foreground">
                  Cria uma cópia da task no projeto destino
                </p>
              </div>
            </Label>
          </div>
          <div className="flex items-center gap-3 rounded-md border p-3">
            <RadioGroupItem value="cut" id="mode-cut" />
            <Label htmlFor="mode-cut" className="flex cursor-pointer items-center gap-2">
              <Scissors className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Mover</p>
                <p className="text-xs text-muted-foreground">
                  Move a task para o projeto destino (remove do projeto atual)
                </p>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Project selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Projeto de destino</Label>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando projetos...
          </div>
        ) : (
          <Select value={targetProjectId} onValueChange={onProjectChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione um projeto" />
            </SelectTrigger>
            <SelectContent>
              {workspaces.map((ws) => (
                <SelectGroup key={ws.workspaceId}>
                  <SelectLabel>{ws.workspaceName}</SelectLabel>
                  {ws.projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Column selection */}
      {targetProjectId && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Coluna de destino</Label>
          <Select value={targetColumnId} onValueChange={onColumnChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma coluna" />
            </SelectTrigger>
            <SelectContent>
              {columns.map((col) => (
                <SelectItem key={col.id} value={col.id}>
                  {col.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

// ── Step 2: Data options ──────────────────────────────────────────────────────

function Step2({
  mode,
  task,
  includeAssignees,
  onIncludeAssigneesChange,
  includeLabels,
  onIncludeLabelsChange,
  includeComments,
  onIncludeCommentsChange,
  includeAttachments,
  onIncludeAttachmentsChange,
  includeHistory,
  onIncludeHistoryChange,
  includeDates,
  onIncludeDatesChange,
  error,
}: {
  mode: 'copy' | 'cut';
  task: KanbanTask;
  includeAssignees: boolean;
  onIncludeAssigneesChange: (v: boolean) => void;
  includeLabels: 'skip' | 'match' | 'create';
  onIncludeLabelsChange: (v: 'skip' | 'match' | 'create') => void;
  includeComments: boolean;
  onIncludeCommentsChange: (v: boolean) => void;
  includeAttachments: boolean;
  onIncludeAttachmentsChange: (v: boolean) => void;
  includeHistory: boolean;
  onIncludeHistoryChange: (v: boolean) => void;
  includeDates: boolean;
  onIncludeDatesChange: (v: boolean) => void;
  error: string;
}) {
  const hasAssignees = task.taskAssignees.length > 0;
  const hasLabels = task.taskLabels.length > 0;
  const hasComments = task._count.taskComments > 0;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Selecione quais informações da task serão transferidas para o projeto destino.
      </p>

      {/* Assignees */}
      <div className="flex items-start gap-3">
        <Checkbox
          id="include-assignees"
          checked={includeAssignees}
          onCheckedChange={(v) => onIncludeAssigneesChange(v === true)}
          disabled={!hasAssignees}
        />
        <div>
          <Label htmlFor="include-assignees" className="cursor-pointer text-sm">
            Responsáveis
            {hasAssignees && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({task.taskAssignees.map((a) => a.user.name).join(', ')})
              </span>
            )}
          </Label>
          {hasAssignees && (
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
              <AlertTriangle className="h-3 w-3" />
              Responsáveis sem acesso ao projeto destino serão ignorados
            </p>
          )}
          {!hasAssignees && (
            <p className="text-xs text-muted-foreground">Nenhum responsável atribuído</p>
          )}
        </div>
      </div>

      {/* Labels */}
      {hasLabels ? (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Labels ({task.taskLabels.map((l) => l.label.name).join(', ')})
          </Label>
          <RadioGroup
            value={includeLabels}
            onValueChange={(v) => onIncludeLabelsChange(v as 'skip' | 'match' | 'create')}
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="skip" id="labels-skip" />
              <Label htmlFor="labels-skip" className="cursor-pointer text-sm">
                Não incluir labels
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="match" id="labels-match" />
              <Label htmlFor="labels-match" className="cursor-pointer text-sm">
                Vincular labels existentes no destino (por nome)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="create" id="labels-create" />
              <Label htmlFor="labels-create" className="cursor-pointer text-sm">
                Criar labels no destino se não existirem
              </Label>
            </div>
          </RadioGroup>
        </div>
      ) : (
        <div className="flex items-start gap-3 opacity-50">
          <Checkbox id="labels-none" disabled checked={false} />
          <Label className="text-sm">Labels (nenhuma)</Label>
        </div>
      )}

      {/* Comments */}
      <div className="flex items-start gap-3">
        <Checkbox
          id="include-comments"
          checked={includeComments}
          onCheckedChange={(v) => onIncludeCommentsChange(v === true)}
          disabled={!hasComments}
        />
        <Label htmlFor="include-comments" className="cursor-pointer text-sm">
          Comentários
          <span className="ml-1 text-xs text-muted-foreground">
            ({task._count.taskComments})
          </span>
        </Label>
      </div>

      {/* Attachments */}
      <div className="flex items-start gap-3">
        <Checkbox
          id="include-attachments"
          checked={includeAttachments}
          onCheckedChange={(v) => onIncludeAttachmentsChange(v === true)}
        />
        <Label htmlFor="include-attachments" className="cursor-pointer text-sm">
          Anexos (imagens e vídeos)
        </Label>
      </div>

      {/* Dates */}
      <div className="flex items-start gap-3">
        <Checkbox
          id="include-dates"
          checked={includeDates}
          onCheckedChange={(v) => onIncludeDatesChange(v === true)}
        />
        <Label htmlFor="include-dates" className="cursor-pointer text-sm">
          Datas (início e prazo)
          {task.startDate || task.dueDate ? (
            <span className="ml-1 text-xs text-muted-foreground">
              {[
                task.startDate && `início: ${new Date(task.startDate).toLocaleDateString('pt-BR')}`,
                task.dueDate && `prazo: ${new Date(task.dueDate).toLocaleDateString('pt-BR')}`,
              ]
                .filter(Boolean)
                .join(' | ')}
            </span>
          ) : null}
        </Label>
      </div>

      {/* History (only for cut mode) */}
      {mode === 'cut' && (
        <div className="flex items-start gap-3">
          <Checkbox
            id="include-history"
            checked={includeHistory}
            onCheckedChange={(v) => onIncludeHistoryChange(v === true)}
          />
          <Label htmlFor="include-history" className="cursor-pointer text-sm">
            Histórico de alterações
          </Label>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
