'use client';

import { useEffect, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import { Camera, Check, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { uploadAvatarAction } from '@/actions/perfil/upload-avatar.action';
import { getCroppedBlob } from '@/lib/crop';

interface AvatarUploadProps {
  currentSrc: string | null;
  fallbackInitial: string;
  onUploadSuccess: (photoUrl: string) => void;
}

export function AvatarUpload({ currentSrc, fallbackInitial, onUploadSuccess }: AvatarUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [rawFile, setRawFile] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [currentSrc]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) {
      setError('Arquivo muito grande. O tamanho máximo é 16 MB.');
      return;
    }
    setError(null);
    setRawFile(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropOpen(true);
    e.target.value = '';
  }

  async function handleConfirmCrop() {
    if (!rawFile || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const blob = await getCroppedBlob(rawFile, croppedAreaPixels);
      const fd = new FormData();
      fd.append('foto', blob, 'avatar.webp');
      const res = await uploadAvatarAction(fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      setCropOpen(false);
      URL.revokeObjectURL(rawFile);
      setRawFile(null);
      onUploadSuccess(res.photoUrl!);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 pb-2">
      {/* Hidden file inputs */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFileChange} />

      {/* Clickable avatar with camera overlay */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="relative group h-24 w-24 rounded-full overflow-hidden bg-muted
                       ring-4 ring-background shadow-sm focus:outline-none cursor-pointer
                       flex items-center justify-center"
          >
            {currentSrc && !imgFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentSrc}
                alt="Foto de perfil"
                className="h-full w-full object-cover"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-3xl font-semibold uppercase text-muted-foreground select-none">
                {fallbackInitial}
              </span>
            )}
            <div
              className="absolute inset-0 bg-black/40 flex items-center justify-center
                         opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera className="h-6 w-6 text-white" />
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuItem onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" /> Carregar do dispositivo
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => cameraRef.current?.click()}>
            <Camera className="h-4 w-4 mr-2" /> Tirar foto
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Crop Dialog */}
      <Dialog open={cropOpen} onOpenChange={setCropOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajustar foto</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-72 bg-muted rounded-md overflow-hidden">
            {rawFile && (
              <Cropper
                image={rawFile}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
              />
            )}
          </div>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCropOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmCrop} disabled={uploading} className="gap-1.5">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Salvar foto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
