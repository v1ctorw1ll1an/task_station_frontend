'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import {
  Download,
  FileText,
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
export const PDF_MAX_MB = 32;
export const IMAGE_MAX_COUNT = 3;
export const VIDEO_MAX_COUNT = 1;
export const PDF_MAX_COUNT = 1;
const ACCEPTED_IMAGES = 'image/jpeg,image/png,image/gif,image/webp,image/avif';
const ACCEPTED_VIDEOS = 'video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska';
const ACCEPTED_PDFS = 'application/pdf';

// ── Helpers ────────────────────────────────────────────────────────────────────

function isVideo(mimeType: string) {
  return mimeType.startsWith('video/');
}

function isPdf(mimeType: string) {
  return mimeType === 'application/pdf';
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
  const pdf = isPdf(att.mimeType);

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
          {pdf ? (
            <FileText className="h-7 w-7 opacity-50" />
          ) : (
            <FileVideo className="h-7 w-7 opacity-50" />
          )}
        </div>
      )}

      {/* Overlay icons */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
        {video ? (
          <PlayCircle className="h-7 w-7 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
        ) : pdf ? (
          <FileText className="h-7 w-7 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
        ) : (
          <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
        )}
      </div>

      {/* Type badge */}
      {video && (
        <span className="absolute bottom-1 left-1 text-[9px] font-semibold bg-black/60 text-white rounded px-1 leading-4">
          VID
        </span>
      )}
      {pdf && (
        <span className="absolute bottom-1 left-1 text-[9px] font-semibold bg-red-600/80 text-white rounded px-1 leading-4">
          PDF
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
  const pdf = isPdf(att.mimeType);
  const src = fileUrl(projectId, taskId, att.id);

  return (
    <Dialog open={!!att} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-3xl p-2 gap-0">
        <DialogTitle className="sr-only">{att.originalName}</DialogTitle>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between pl-2 pr-10 pt-1 gap-2">
            <span className="text-sm font-medium truncate max-w-xs">{att.originalName}</span>
            {pdf && (
              <a
                href={src}
                download={att.originalName}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border bg-background hover:bg-muted transition-colors flex-shrink-0"
              >
                <Download className="h-3 w-3" />
                Download
              </a>
            )}
          </div>

          <div className={`rounded overflow-hidden ${pdf ? 'bg-white' : 'bg-black'} flex items-center justify-center max-h-[70vh]`}>
            {video ? (
              <video
                src={src}
                controls
                autoPlay={false}
                className="max-h-[70vh] max-w-full"
                preload="metadata"
              />
            ) : pdf ? (
              <iframe
                src={src}
                title={att.originalName}
                className="w-full bg-white"
                style={{ height: '70vh' }}
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

          <div className="flex items-center justify-between px-2 pb-1 text-xs text-muted-foreground gap-2">
            <span className="truncate">Por {att.uploadedBy.name} · {formatBytes(att.size)}</span>
            <span className="flex-shrink-0">{new Date(att.createdAt).toLocaleDateString('pt-BR', {
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
  const pdfCount = attachments.filter((a) => isPdf(a.mimeType)).length;
  const imagesFull = imageCount >= IMAGE_MAX_COUNT;
  const videosFull = videoCount >= VIDEO_MAX_COUNT;
  const pdfsFull = pdfCount >= PDF_MAX_COUNT;
  const allFull = imagesFull && videosFull && pdfsFull;

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
    !pdfsFull ? ACCEPTED_PDFS : '',
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
    const isPdfFile = isPdf(file.type);
    if (isVid && videoCount >= VIDEO_MAX_COUNT) {
      setUploadError(`Limite de ${VIDEO_MAX_COUNT} vídeo por task atingido.`);
      return;
    }
    if (isPdfFile && pdfCount >= PDF_MAX_COUNT) {
      setUploadError(`Limite de ${PDF_MAX_COUNT} PDF por task atingido.`);
      return;
    }
    if (!isVid && !isPdfFile && imageCount >= IMAGE_MAX_COUNT) {
      setUploadError(`Limite de ${IMAGE_MAX_COUNT} imagens por task atingido.`);
      return;
    }
    const maxMb = isVid ? VIDEO_MAX_MB : isPdfFile ? PDF_MAX_MB : IMAGE_MAX_MB;
    if (file.size > maxMb * 1024 * 1024) {
      setUploadError(`Arquivo excede o limite de ${maxMb} MB.`);
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
        <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide flex-wrap">
          <Paperclip className="h-3.5 w-3.5" />
          Anexos
          <span className="font-normal normal-case tracking-normal">
            {imageCount}/{IMAGE_MAX_COUNT} foto{(IMAGE_MAX_COUNT as number) !== 1 ? 's' : ''} · {videoCount}/{VIDEO_MAX_COUNT} vídeo · {pdfCount}/{PDF_MAX_COUNT} PDF
          </span>
          <span className="font-normal normal-case tracking-normal text-muted-foreground/60">
            · fotos até {IMAGE_MAX_MB} MB, vídeo até {VIDEO_MAX_MB} MB, PDF até {PDF_MAX_MB} MB
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
              title={allFull ? `Limite atingido (${IMAGE_MAX_COUNT} fotos, ${VIDEO_MAX_COUNT} vídeo e ${PDF_MAX_COUNT} PDF)` : undefined}
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
