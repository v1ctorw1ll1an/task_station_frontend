'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import {
  FileVideo,
  Loader2,
  Paperclip,
  PlayCircle,
  UploadCloud,
  X,
  ZoomIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { getAttachmentsAction, type TaskAttachment } from '@/actions/projeto/get-attachments.action';
import { deleteAttachmentAction } from '@/actions/projeto/delete-attachment.action';

// ── Constants ──────────────────────────────────────────────────────────────────

export const IMAGE_MAX_MB = 16;
export const VIDEO_MAX_MB = 64;
export const IMAGE_MAX_COUNT = 3;
export const VIDEO_MAX_COUNT = 1;
const ACCEPTED_IMAGES = 'image/jpeg,image/png,image/gif,image/webp,image/avif';
const ACCEPTED_VIDEOS = 'video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska';

// ── Helpers ────────────────────────────────────────────────────────────────────

function isVideo(mimeType: string) {
  return mimeType.startsWith('video/');
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function thumbnailUrl(projectId: string, taskId: string, id: string) {
  return `/api/files/projetos/${projectId}/tasks/${taskId}/attachments/${id}/thumbnail`;
}

function fileUrl(projectId: string, taskId: string, id: string) {
  return `/api/files/projetos/${projectId}/tasks/${taskId}/attachments/${id}/file`;
}

// ── Attachment Thumbnail ───────────────────────────────────────────────────────

function AttachmentThumb({
  att,
  projectId,
  taskId,
  onDelete,
  onOpen,
  isAdmin,
}: {
  att: TaskAttachment;
  projectId: string;
  taskId: string;
  onDelete: (id: string) => void;
  onOpen: (att: TaskAttachment) => void;
  isAdmin: boolean;
}) {
  const [deleting, startDelete] = useTransition();
  const video = isVideo(att.mimeType);

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    startDelete(async () => {
      await deleteAttachmentAction(projectId, taskId, att.id);
      onDelete(att.id);
    });
  }

  return (
    <div
      className="group relative rounded-md overflow-hidden border bg-muted cursor-pointer flex-shrink-0"
      style={{ width: 88, height: 72 }}
      onClick={() => onOpen(att)}
      title={att.originalName}
    >
      {att.hasThumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailUrl(projectId, taskId, att.id)}
          alt={att.originalName}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          <FileVideo className="h-7 w-7 opacity-50" />
        </div>
      )}

      {/* Overlay icons */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
        {video ? (
          <PlayCircle className="h-7 w-7 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
        ) : (
          <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
        )}
      </div>

      {/* Video badge */}
      {video && (
        <span className="absolute bottom-1 left-1 text-[9px] font-semibold bg-black/60 text-white rounded px-1 leading-4">
          VID
        </span>
      )}

      {/* Delete button */}
      {isAdmin && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="absolute top-0.5 right-0.5 h-5 w-5 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
          title="Remover"
        >
          {deleting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <X className="h-3 w-3" />
          )}
        </button>
      )}
    </div>
  );
}

// ── Viewer Modal ───────────────────────────────────────────────────────────────

function AttachmentViewerModal({
  att,
  projectId,
  taskId,
  onClose,
}: {
  att: TaskAttachment | null;
  projectId: string;
  taskId: string;
  onClose: () => void;
}) {
  if (!att) return null;

  const video = isVideo(att.mimeType);
  const src = fileUrl(projectId, taskId, att.id);

  return (
    <Dialog open={!!att} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-3xl p-2 gap-0">
        <DialogTitle className="sr-only">{att.originalName}</DialogTitle>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-2 pt-1">
            <span className="text-sm font-medium truncate max-w-xs">{att.originalName}</span>
            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
              {formatBytes(att.size)}
            </span>
          </div>

          <div className="rounded overflow-hidden bg-black flex items-center justify-center max-h-[70vh]">
            {video ? (
              <video
                src={src}
                controls
                autoPlay={false}
                className="max-h-[70vh] max-w-full"
                preload="metadata"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={att.originalName}
                className="max-h-[70vh] max-w-full object-contain"
                loading="eager"
              />
            )}
          </div>

          <div className="flex items-center justify-between px-2 pb-1 text-xs text-muted-foreground">
            <span>Por {att.uploadedBy.name}</span>
            <span>{new Date(att.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit', month: '2-digit', year: '2-digit',
              hour: '2-digit', minute: '2-digit',
            })}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Section ───────────────────────────────────────────────────────────────

interface TaskAttachmentsSectionProps {
  projectId: string;
  taskId: string;
  isAdmin: boolean;
  onImageCountChange?: (count: number) => void;
  pendingAttachment?: TaskAttachment | null;
  onPendingAttachmentConsumed?: () => void;
}

export function TaskAttachmentsSection({ projectId, taskId, isAdmin, onImageCountChange, pendingAttachment, onPendingAttachmentConsumed }: TaskAttachmentsSectionProps) {
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [viewer, setViewer] = useState<TaskAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageCount = attachments.filter((a) => a.mimeType.startsWith('image/')).length;
  const videoCount = attachments.filter((a) => a.mimeType.startsWith('video/')).length;
  const imagesFull = imageCount >= IMAGE_MAX_COUNT;
  const videosFull = videoCount >= VIDEO_MAX_COUNT;
  const allFull = imagesFull && videosFull;

  // Notify parent when image count changes (for paste limit check in MarkdownEditor)
  useEffect(() => {
    onImageCountChange?.(imageCount);
  }, [imageCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Consume attachment added via paste in MarkdownEditor
  useEffect(() => {
    if (!pendingAttachment) return;
    setAttachments((prev) => {
      if (prev.some((a) => a.id === pendingAttachment.id)) return prev;
      return [...prev, pendingAttachment];
    });
    onPendingAttachmentConsumed?.();
  }, [pendingAttachment]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build accepted types based on remaining slots
  const acceptedTypes = [
    !imagesFull ? ACCEPTED_IMAGES : '',
    !videosFull ? ACCEPTED_VIDEOS : '',
  ].filter(Boolean).join(',');

  useEffect(() => {
    let cancelled = false;
    getAttachmentsAction(projectId, taskId).then((res) => {
      if (!cancelled) {
        setAttachments(res.data ?? []);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [projectId, taskId]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!e.target.files) return;
    e.target.value = '';
    if (!file) return;

    // Client-side validation
    const isVid = file.type.startsWith('video/');
    if (isVid && videoCount >= VIDEO_MAX_COUNT) {
      setUploadError(`Limite de ${VIDEO_MAX_COUNT} vídeo por task atingido.`);
      return;
    }
    if (!isVid && imageCount >= IMAGE_MAX_COUNT) {
      setUploadError(`Limite de ${IMAGE_MAX_COUNT} imagens por task atingido.`);
      return;
    }
    const maxBytes = isVid ? VIDEO_MAX_MB * 1024 * 1024 : IMAGE_MAX_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      setUploadError(`Arquivo excede o limite de ${isVid ? VIDEO_MAX_MB : IMAGE_MAX_MB} MB.`);
      return;
    }

    setUploadError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(
        `/api/files/projetos/${projectId}/tasks/${taskId}/attachments`,
        { method: 'POST', body: formData },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setUploadError(data.message ?? 'Erro ao enviar arquivo.');
      } else {
        const att: TaskAttachment = await res.json();
        setAttachments((prev) => [...prev, att]);
      }
    } catch {
      setUploadError('Erro ao conectar com o servidor.');
    } finally {
      setUploading(false);
    }
  }

  function handleDelete(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground py-1">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Carregando anexos...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
          <Paperclip className="h-3.5 w-3.5" />
          Anexos
          <span className="font-normal normal-case tracking-normal">
            {imageCount}/{IMAGE_MAX_COUNT} foto{(IMAGE_MAX_COUNT as number) !== 1 ? 's' : ''} · {videoCount}/{VIDEO_MAX_COUNT} vídeo
          </span>
          <span className="font-normal normal-case tracking-normal text-muted-foreground/60">
            · fotos até {IMAGE_MAX_MB} MB, vídeo até {VIDEO_MAX_MB} MB
          </span>
        </h4>
        {isAdmin && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs gap-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || allFull}
              title={allFull ? `Limite atingido (${IMAGE_MAX_COUNT} fotos e ${VIDEO_MAX_COUNT} vídeo)` : undefined}
            >
              {uploading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <UploadCloud className="h-3 w-3" />
              )}
              {uploading ? 'Enviando...' : 'Anexar'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedTypes}
              className="hidden"
              onChange={handleFileChange}
            />
          </>
        )}
      </div>

      {uploadError && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <X className="h-3 w-3" />
          {uploadError}
        </p>
      )}

      {attachments.length === 0 && !uploading ? (
        <p className="text-xs text-muted-foreground italic">
          Nenhum anexo ainda.{isAdmin ? ' Clique em "Anexar" para adicionar.' : ''}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att) => (
            <AttachmentThumb
              key={att.id}
              att={att}
              projectId={projectId}
              taskId={taskId}
              onDelete={handleDelete}
              onOpen={setViewer}
              isAdmin={isAdmin}
            />
          ))}
          {uploading && (
            <div
              className="rounded-md border border-dashed bg-muted flex items-center justify-center flex-shrink-0"
              style={{ width: 88, height: 72 }}
            >
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}

      <AttachmentViewerModal
        att={viewer}
        projectId={projectId}
        taskId={taskId}
        onClose={() => setViewer(null)}
      />
    </div>
  );
}
